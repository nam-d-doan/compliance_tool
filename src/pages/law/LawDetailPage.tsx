/**
 * PSEUDO CODE (ngắn gọn)
 * 1. 2 tab — Tổng quan / Lịch sử. Tab "Ý kiến tư vấn" và cảnh báo đỏ để
 *    GĐ3 theo đúng kế hoạch (docs/law/00-decisions.md).
 * 2. GĐ2 — đổi trạng thái: nút "Start Processing" (new→in_progress) và
 *    "Mark Completed" (in_progress→completed) qua useUpdateLawRequest co
 *    sẵn (không cần mutation riêng, giống cách LM đổi stage).
 * 3. Phân công (GĐ2): sheet riêng, đọc useLawWorkload() (server đã sort
 *    tăng dần theo tải), chọn xong PUT request.ownerId qua
 *    useUpdateLawRequest. Đôn đốc: 1 nút gọi useRemindLawRequest.
 * 4. GĐ3 — cảnh báo đỏ: severity do server tính sẵn (DEMO_TODAY, xem
 *    lib/deadline-alerts.ts). Nút "Acknowledge"/"Resolve" gọi
 *    PUT /api/law/requests/:id/alert qua useUpdateLawAlert.
 */
import { useState } from "react";
import { useParams } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { motion } from "motion/react";
import { Pencil, Send, Users, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  PageHero,
  DueDateCell,
  EmptyState,
  ErrorState,
  DetailSkeleton,
} from "@/components/common";
import { LawForm, type LawFormValues } from "@/components/law/LawForm";
import {
  useLawRequestDetail,
  useLawRequestEvents,
  useLawWorkload,
} from "@/hooks/queries";
import {
  useUpdateLawRequest,
  useRemindLawRequest,
  useUpdateLawAlert,
} from "@/hooks/mutations";
import { useAuthStore } from "@/stores";
import { hasPermission } from "@/constants/rbac";
import { LAW_PRIORITY_STYLES, LAW_STATUS_LABELS } from "@/constants/law";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { UpdateAdviceRequestInput } from "@/types";

function fmt(date?: string): string {
  return date ? format(parseISO(date), "MMM d, yyyy") : "—";
}

const ALERT_STATUS_LABEL: Record<string, string> = {
  pending: "Not flagged",
  flagged: "Flagged",
  acknowledged: "Acknowledged",
  resolved: "Resolved",
};

const SEVERITY_DOT: Record<string, string> = {
  red: "bg-destructive",
  amber: "bg-warning",
  none: "bg-muted-foreground/30",
};

export default function LawDetailPage() {
  const { id = "" } = useParams<{ id: string }>();
  const { role, user } = useAuthStore();
  const canUpdate = hasPermission(role, "law:update");
  const canApprove = hasPermission(role, "law:approve");

  const [editOpen, setEditOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);

  const detail = useLawRequestDetail(id);
  const events = useLawRequestEvents(id);
  const update = useUpdateLawRequest(id);
  const remind = useRemindLawRequest(id);
  const updateAlert = useUpdateLawAlert(id);

  const item = detail.data;

  if (detail.isPending) return <DetailSkeleton />;
  if (detail.isError || !item) {
    return <ErrorState onRetry={() => detail.refetch()} />;
  }

  const handleEditSubmit = (values: LawFormValues) => {
    const payload: UpdateAdviceRequestInput = {
      title: values.title,
      description: values.description || undefined,
      priorityTier: values.priorityTier as UpdateAdviceRequestInput["priorityTier"],
      requestingUnitId: values.requestingUnitId,
      ownerId: values.ownerId,
      managerId: values.managerId,
      tags:
        values.tags
          ?.split(",")
          .map((t) => t.trim())
          .filter(Boolean) ?? [],
    };
    update.mutate(payload, {
      onSuccess: () => {
        toast.success("Request updated");
        setEditOpen(false);
      },
      onError: (err) => toast.error(err.message || "Update failed"),
    });
  };

  const handleStatusChange = (
    status: UpdateAdviceRequestInput["status"],
  ) => {
    update.mutate(
      { status },
      {
        onSuccess: () => toast.success(LAW_STATUS_LABELS[status!] + " — status updated"),
        onError: (err) => toast.error(err.message || "Status update failed"),
      },
    );
  };

  const handleRemind = () => {
    remind.mutate(
      { fromUserId: user?.id, fromUserName: user?.name },
      {
        onSuccess: () => toast.success("Reminder sent"),
        onError: (err) => toast.error(err.message || "Failed to send reminder"),
      },
    );
  };

  const handleAlertAction = (action: "acknowledge" | "resolve") => {
    updateAlert.mutate(
      { action, actorId: user?.id, actorName: user?.name },
      {
        onSuccess: () =>
          toast.success(
            action === "acknowledge" ? "Alert acknowledged" : "Alert resolved",
          ),
        onError: (err) => toast.error(err.message || "Action failed"),
      },
    );
  };

  const handleAssign = (ownerId: string, ownerName: string) => {
    update.mutate(
      { ownerId },
      {
        onSuccess: () => {
          toast.success(`Assigned to ${ownerName}`);
          setAssignOpen(false);
        },
        onError: (err) => toast.error(err.message || "Assignment failed"),
      },
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <PageHero title={item.code} subtitle={item.title}>
        <div className="flex flex-wrap items-center gap-2">
          {canApprove && (
            <Button
              variant="outline"
              onClick={handleRemind}
              disabled={remind.isPending}
            >
              <Send className="size-4" aria-hidden="true" />
              Remind
            </Button>
          )}
          {canApprove && (
            <Button variant="outline" onClick={() => setAssignOpen(true)}>
              <Users className="size-4" aria-hidden="true" />
              Assign
            </Button>
          )}
          {canUpdate && item.status === "new" && (
            <Button
              variant="outline"
              disabled={update.isPending}
              onClick={() => handleStatusChange("in_progress")}
            >
              Start Processing
            </Button>
          )}
          {canUpdate && item.status === "in_progress" && (
            <Button
              disabled={update.isPending}
              onClick={() => handleStatusChange("completed")}
            >
              <Check className="size-4" aria-hidden="true" />
              Mark Completed
            </Button>
          )}
          {canUpdate && (
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              <Pencil className="size-4" aria-hidden="true" />
              Edit Request
            </Button>
          )}
        </div>
      </PageHero>

      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
          {LAW_STATUS_LABELS[item.status]}
        </span>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
          {LAW_PRIORITY_STYLES[item.priorityTier].label}
        </span>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Request Information</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Field label="Description" value={item.description || "—"} />
              <Field label="Requesting Unit" value={item.requestingUnitName} />
              <Field label="Assigned Specialist" value={item.ownerName} />
              <Field label="Manager" value={item.managerName || "—"} />
              <Field label="Submitted" value={fmt(item.submittedAt)} />
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  SLA Due Date
                </p>
                <DueDateCell
                  dueDate={item.dueDate}
                  completed={item.status === "completed"}
                />
              </div>
              <Field label="Completed" value={fmt(item.completedAt)} />
              <Field label="Last Updated" value={fmt(item.updatedAt)} />
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle>SLA Alert</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-sm">
                <span
                  className={cn(
                    "size-2 shrink-0 rounded-full",
                    SEVERITY_DOT[item.severity ?? "none"],
                  )}
                  aria-hidden="true"
                />
                {ALERT_STATUS_LABEL[item.alertStatus] ?? item.alertStatus}
              </span>
              {canUpdate && (
                <div className="flex gap-2">
                  {item.alertStatus === "flagged" && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={updateAlert.isPending}
                      onClick={() => handleAlertAction("acknowledge")}
                    >
                      Acknowledge
                    </Button>
                  )}
                  {(item.alertStatus === "flagged" ||
                    item.alertStatus === "acknowledged") && (
                    <Button
                      size="sm"
                      disabled={updateAlert.isPending}
                      onClick={() => handleAlertAction("resolve")}
                    >
                      Resolve
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Activity History</CardTitle>
            </CardHeader>
            <CardContent>
              {events.isPending ? (
                <DetailSkeleton />
              ) : (events.data ?? []).length === 0 ? (
                <EmptyState title="No history yet" />
              ) : (
                <ul className="space-y-3">
                  {(events.data ?? []).map((e) => (
                    <li key={e.id} className="border-l-2 border-border pl-3">
                      <p className="text-sm">{e.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {e.userName} · {fmt(e.createdAt)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Sheet open={editOpen} onOpenChange={setEditOpen}>
        <SheetContent className="overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Edit Request {item.code}</SheetTitle>
          </SheetHeader>
          <div className="px-4 pb-4">
            <LawForm
              defaultValues={{
                title: item.title,
                description: item.description,
                priorityTier: item.priorityTier,
                requestingUnitId: item.requestingUnitId,
                ownerId: item.ownerId,
                managerId: item.managerId,
                tags: item.tags.join(", "),
              }}
              onSubmit={handleEditSubmit}
              onCancel={() => setEditOpen(false)}
              isSubmitting={update.isPending}
              submitLabel="Save Changes"
            />
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={assignOpen} onOpenChange={setAssignOpen}>
        <SheetContent className="overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Reassign {item.code}</SheetTitle>
          </SheetHeader>
          <div className="px-4 pb-4">
            <AssignList
              currentOwnerId={item.ownerId}
              isSaving={update.isPending}
              onPick={handleAssign}
            />
          </div>
        </SheetContent>
      </Sheet>
    </motion.div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-sm">{value}</p>
    </div>
  );
}

/** Danh sách chuyên viên theo tải công việc — người đầu tiên (tải thấp nhất) là gợi ý. */
function AssignList({
  currentOwnerId,
  isSaving,
  onPick,
}: {
  currentOwnerId: string;
  isSaving: boolean;
  onPick: (ownerId: string, ownerName: string) => void;
}) {
  const workload = useLawWorkload();

  if (workload.isPending) return <DetailSkeleton />;
  if (workload.isError || !workload.data) {
    return <ErrorState onRetry={() => workload.refetch()} />;
  }

  return (
    <ul className="space-y-2">
      {workload.data.map((w, i) => {
        const isCurrent = w.userId === currentOwnerId;
        return (
          <li key={w.userId}>
            <button
              type="button"
              disabled={isSaving || isCurrent}
              onClick={() => onPick(w.userId, w.userName)}
              className={cn(
                "flex w-full items-center justify-between rounded-lg border border-border p-3 text-left text-sm transition-colors",
                isCurrent
                  ? "cursor-default bg-muted"
                  : "hover:border-primary hover:bg-muted/50",
              )}
            >
              <span className="flex items-center gap-2">
                <span className="font-medium">{w.userName}</span>
                {i === 0 && !isCurrent && (
                  <span className="rounded-full bg-success-bg px-2 py-0.5 text-xs text-success">
                    Suggested — lowest load
                  </span>
                )}
                {isCurrent && (
                  <span className="rounded-full bg-muted-foreground/10 px-2 py-0.5 text-xs text-muted-foreground">
                    Current owner
                  </span>
                )}
              </span>
              <span className="text-muted-foreground">
                {w.openRequestCount} open requests · load {w.weightedLoad}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
