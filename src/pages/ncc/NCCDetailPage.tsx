import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { format, differenceInDays, parseISO } from "date-fns";
import {
  ArrowLeft,
  Calendar,
  Building2,
  User,
  CheckCircle,
  AlertTriangle,
  Trash2,
  Pencil,
  Paperclip,
  ExternalLink,
  RotateCcw,
  Lock,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/common/StatusBadge";
import { PriorityBadge } from "@/components/common/PriorityBadge";
import { ErrorState } from "@/components/common/ErrorState";
import { DetailSkeleton } from "@/components/common/Skeletons";
import { KPICard } from "@/components/common/KPICard";
import { NCCForm, type NCCFormValues } from "@/components/ncc/NCCForm";
import { FileUploadComponent } from "@/components/cap/FileUploadComponent";
import { useNCCDetail } from "@/hooks/queries/useNCCQueries";
import { useFilesByIds } from "@/hooks/queries/useFileQueries";
import { useAdminUsers } from "@/hooks/queries/useAdminQueries";
import { useUpdateNCC, useDeleteNCC } from "@/hooks/mutations/useNCCMutations";
import { useAuthStore } from "@/stores";
import { hasPermission } from "@/constants/rbac";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { UpdateNCCInput } from "@/types";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "files", label: "Files" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function NCCDetailPage() {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { role, user } = useAuthStore();
  const canEdit = hasPermission(role, "ncc:update");
  const canDelete = hasPermission(role, "ncc:delete");

  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [editOpen, setEditOpen] = useState(false);
  const [closeOpen, setCloseOpen] = useState(false);
  const [resolution, setResolution] = useState("");

  const detail = useNCCDetail(id);
  const update = useUpdateNCC(id);
  const remove = useDeleteNCC();
  const usersQuery = useAdminUsers(1, 200, { status: "Active" });

  const item = detail.data;

  // Files linked to this NCC. Fetched by ID list (robust to files uploaded
  // before the NCC existed, which carry no `nccId`).
  const filesQuery = useFilesByIds(item?.fileIds ?? []);

  const daysToDue = item
    ? differenceInDays(parseISO(item.dueDate), new Date())
    : 0;

  const handleDelete = () => {
    if (!item) return;
    if (
      !window.confirm(
        "Are you sure you want to delete this non-compliance case?",
      )
    )
      return;
    remove.mutate(item.id, {
      onSuccess: () => {
        toast.success("Non-compliance case deleted");
        navigate("/ncc/list");
      },
    });
  };

  const handleEditSubmit = (values: NCCFormValues) => {
    if (!item) return;
    const owner = usersQuery.data?.items.find((u) => u.id === values.ownerId);
    const payload: UpdateNCCInput = {
      title: values.title,
      description: values.description,
      severity: values.severity as UpdateNCCInput["severity"],
      ownerId: values.ownerId,
      ownerName: owner?.name ?? item.ownerName,
      dueDate: new Date(values.dueDate).toISOString(),
      linkedDocs: values.linkedDocs || undefined,
      tags:
        values.tags
          ?.split(",")
          .map((t) => t.trim())
          .filter(Boolean) ?? [],
    };
    update.mutate(payload, {
      onSuccess: () => {
        toast.success("Case updated");
        setEditOpen(false);
      },
    });
  };

  const handleClose = () => {
    if (!resolution.trim()) {
      toast.error("Resolution notes are required to close the case");
      return;
    }
    update.mutate(
      { status: "Closed", resolution: resolution.trim() },
      {
        onSuccess: () => {
          toast.success("Case closed");
          setCloseOpen(false);
          setResolution("");
        },
      },
    );
  };

  const handleReopen = () => {
    if (!window.confirm("Reopen this non-compliance case?")) return;
    update.mutate(
      { status: "Open" },
      { onSuccess: () => toast.success("Case reopened") },
    );
  };

  if (detail.isPending) {
    return <DetailSkeleton />;
  }

  if (detail.isError || !item) {
    return <ErrorState onRetry={() => detail.refetch()} />;
  }

  const editDefaults: Partial<NCCFormValues> = {
    title: item.title,
    description: item.description,
    severity: item.severity,
    ownerUnitId: item.ownerUnitId,
    ownerId: item.ownerId,
    dueDate: item.dueDate.slice(0, 10),
    linkedDocs: item.linkedDocs ?? "",
    tags: item.tags.join(", "),
  };

  const severityLabel =
    item.severity.charAt(0).toUpperCase() + item.severity.slice(1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <Card className="relative overflow-hidden border-0 text-white shadow-lg">
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, #0c3767 0%, #185b95 58%, #147769 100%)",
          }}
        />
        <div className="relative p-6 lg:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/ncc/list")}
                className="-ml-2 text-blue-100 hover:bg-white/10 hover:text-white"
              >
                <ArrowLeft className="size-4" aria-hidden="true" />
                Back to Cases
              </Button>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-tight lg:text-3xl">
                  {item.title}
                </h1>
                <StatusBadge status={item.status} kind="ncc" size="md" />
                <PriorityBadge priority={item.severity} size="md" />
              </div>
              <p className="text-sm text-blue-100">{item.nccId}</p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-blue-50">
                <span className="inline-flex items-center gap-1.5">
                  <User className="size-4" aria-hidden="true" />
                  {item.ownerName}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="size-4" aria-hidden="true" />
                  {format(parseISO(item.dueDate), "PPP")}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {canEdit && item.status === "Open" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCloseOpen(true)}
                  className="border-white/30 text-white hover:bg-white/10 hover:text-white"
                >
                  <Lock className="size-4" aria-hidden="true" />
                  Close
                </Button>
              )}
              {canEdit && item.status === "Closed" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReopen}
                  className="border-white/30 text-white hover:bg-white/10 hover:text-white"
                >
                  <RotateCcw className="size-4" aria-hidden="true" />
                  Reopen
                </Button>
              )}
              {canEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditOpen(true)}
                  className="border-white/30 text-white hover:bg-white/10 hover:text-white"
                >
                  <Pencil className="size-4" aria-hidden="true" />
                  Edit
                </Button>
              )}
              {canDelete && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDelete}
                  className="border-white/30 text-white hover:bg-red-500/20 hover:text-white"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                  Delete
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>

      <Tabs
        defaultValue={activeTab}
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as TabId)}
      >
        <TabsList className="mb-2">
          {TABS.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <TabsContent value="overview" className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {item.description}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      <Fact
                        icon={Building2}
                        label="Owner Unit"
                        value={
                          item.ownerUnitType === "branch" &&
                          item.ownerUnitRegion
                            ? `${item.ownerUnitName} (${item.ownerUnitRegion})`
                            : item.ownerUnitName
                        }
                      />
                      <Fact icon={User} label="Owner" value={item.ownerName} />
                      <Fact
                        icon={Calendar}
                        label="Due Date"
                        value={format(parseISO(item.dueDate), "PPP")}
                      />
                      <Fact
                        icon={AlertTriangle}
                        label="Severity"
                        value={severityLabel}
                      />
                      <Fact
                        icon={CheckCircle}
                        label="Status"
                        value={item.status}
                      />
                      <Fact
                        icon={Calendar}
                        label="Created"
                        value={format(parseISO(item.createdAt), "PPP")}
                      />
                      {item.closedAt && (
                        <Fact
                          icon={CheckCircle}
                          label="Closed"
                          value={format(parseISO(item.closedAt), "PPP")}
                        />
                      )}
                      {item.linkedDocs && (
                        <Fact
                          icon={ExternalLink}
                          label="Linked Docs"
                          value={item.linkedDocs}
                          className="sm:col-span-2 lg:col-span-3"
                        />
                      )}
                      {item.status === "Closed" && item.resolution && (
                        <Fact
                          icon={CheckCircle}
                          label="Resolution"
                          value={item.resolution}
                          className="sm:col-span-2 lg:col-span-3"
                        />
                      )}
                      {item.tags.length > 0 && (
                        <div className="space-y-1 rounded-lg border border-border bg-card p-3 sm:col-span-2 lg:col-span-3">
                          <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Tag className="size-3.5" aria-hidden="true" />
                            Tags
                          </dt>
                          <dd>
                            <div className="flex flex-wrap gap-1.5">
                              {item.tags.map((tag) => (
                                <Badge
                                  key={tag}
                                  variant="secondary"
                                  className="text-xs"
                                >
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </dd>
                        </div>
                      )}
                    </dl>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            <TabsContent value="files" className="space-y-4">
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Paperclip className="size-4" aria-hidden="true" />
                      Attachments
                      {item.fileIds.length > 0 && (
                        <Badge variant="secondary">{item.fileIds.length}</Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FileUploadComponent
                      files={filesQuery.data?.items ?? []}
                      nccId={item.id}
                      uploadedBy={user?.name}
                      uploadedById={user?.id}
                      disabled={item.status === "Closed"}
                      listOnly={item.status === "Closed"}
                    />
                    {item.status === "Closed" && (
                      <p className="mt-3 text-xs text-muted-foreground">
                        This case is closed — file attachments are read-only.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>
          </div>

          <div className="space-y-4">
            <KPICard
              label="Days to due"
              value={daysToDue}
              subtitle={
                daysToDue < 0
                  ? `${Math.abs(daysToDue)} days overdue`
                  : daysToDue === 0
                    ? "Due today"
                    : "days remaining"
              }
              icon={Calendar}
              trend={{
                direction: daysToDue < 0 ? "down" : "flat",
                percent: Math.abs(daysToDue),
                positive: daysToDue >= 0,
              }}
            />
            <KPICard label="Status" value={item.status} icon={CheckCircle} />
            <KPICard
              label="Severity"
              value={severityLabel}
              icon={AlertTriangle}
            />
          </div>
        </div>
      </Tabs>

      <Sheet open={editOpen} onOpenChange={setEditOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Edit Non-Compliance Case</SheetTitle>
            <SheetDescription>
              Update the details for {item.nccId}.
            </SheetDescription>
          </SheetHeader>
          <div className="py-4">
            <NCCForm
              defaultValues={editDefaults}
              lockOwnerUnit={true}
              onSubmit={handleEditSubmit}
              onCancel={() => setEditOpen(false)}
              isSubmitting={update.isPending}
              submitLabel="Save Changes"
            />
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={closeOpen} onOpenChange={setCloseOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Close Non-Compliance Case</SheetTitle>
            <SheetDescription>
              Add resolution notes to close {item.nccId}.
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="resolution">
                Resolution Notes <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="resolution"
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                placeholder="Describe how the non-compliance was resolved..."
                className="min-h-[8rem]"
              />
              <p className="text-xs text-muted-foreground">
                Resolution notes are required to close the case.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setCloseOpen(false);
                  setResolution("");
                }}
                disabled={update.isPending}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleClose}
                disabled={update.isPending || !resolution.trim()}
              >
                {update.isPending ? "Closing..." : "Close Case"}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </motion.div>
  );
}

function Fact({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon: typeof User;
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "space-y-1 rounded-lg border border-border bg-card p-3",
        className,
      )}
    >
      <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="size-3.5" aria-hidden="true" />
        {label}
      </dt>
      <dd className="text-sm font-medium text-foreground capitalize">
        {value}
      </dd>
    </div>
  );
}
