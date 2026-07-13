import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  Search,
  ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { ErrorState } from "@/components/common/ErrorState";
import { DetailSkeleton } from "@/components/common/Skeletons";
import { KPICard } from "@/components/common/KPICard";
import { PageHero } from "@/components/common";
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
import type { FileAttachment, UpdateNCCInput } from "@/types";

/** Step keys used to bucket file attachments per investigation phase. */
type StepKey = "detection" | "corrective";

const STEP_FILE_STORAGE_PREFIX = "ncc-detail:step-files";

const EMPTY_STEP_FILES: Record<StepKey, string[]> = {
  detection: [],
  corrective: [],
};

/** Load per-step file id buckets from localStorage for a given NCC. Returns
 *  an empty mapping if storage is unavailable or the entry is malformed. */
function loadStepFileIds(nccId: string): Record<StepKey, string[]> {
  if (typeof window === "undefined") return { ...EMPTY_STEP_FILES };
  try {
    const raw = window.localStorage.getItem(
      `${STEP_FILE_STORAGE_PREFIX}:${nccId}`,
    );
    if (!raw) return { ...EMPTY_STEP_FILES };
    const parsed = JSON.parse(raw) as Partial<Record<StepKey, unknown>>;
    return {
      detection: Array.isArray(parsed.detection)
        ? parsed.detection.filter((v): v is string => typeof v === "string")
        : [],
      corrective: Array.isArray(parsed.corrective)
        ? parsed.corrective.filter((v): v is string => typeof v === "string")
        : [],
    };
  } catch {
    return { ...EMPTY_STEP_FILES };
  }
}

/** Persist per-step file id buckets to localStorage. Swallows quota errors
 *  silently — losing the per-step grouping is non-fatal. */
function saveStepFileIds(
  nccId: string,
  mapping: Record<StepKey, string[]>,
): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      `${STEP_FILE_STORAGE_PREFIX}:${nccId}`,
      JSON.stringify(mapping),
    );
  } catch {
    // localStorage may be unavailable (private mode, quota); step grouping
    // is best-effort and not worth surfacing to the user.
  }
}

export default function NCCDetailPage() {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { role, user } = useAuthStore();
  const canEdit = hasPermission(role, "ncc:update");
  const canDelete = hasPermission(role, "ncc:delete");

  const [editOpen, setEditOpen] = useState(false);
  const [closeOpen, setCloseOpen] = useState(false);
  const [resolution, setResolution] = useState("");

  const detail = useNCCDetail(id);
  const update = useUpdateNCC(id);
  const remove = useDeleteNCC();
  const usersQuery = useAdminUsers(1, 200, { status: "Active" });

  const item = detail.data;

  // Per-step completion and notes (local state — no backend).
  // When the case is already closed, both steps render as completed on mount.
  const [step1Complete, setStep1Complete] = useState(
    () => detail.data?.status === "Closed",
  );
  const [step2Complete, setStep2Complete] = useState(
    () => detail.data?.status === "Closed",
  );
  const [step1Description, setStep1Description] = useState("");
  const [step2Description, setStep2Description] = useState("");

  // Files linked to this NCC. Fetched by ID list (robust to files uploaded
  // before the NCC existed, which carry no `nccId`).
  const filesQuery = useFilesByIds(item?.fileIds ?? []);

  // Per-step file id buckets, persisted to localStorage. The buckets are a
  // client-side mapping; the underlying files are still linked to the NCC.
  const [stepFileIds, setStepFileIds] = useState<Record<StepKey, string[]>>(
    () => (id ? loadStepFileIds(id) : { ...EMPTY_STEP_FILES }),
  );

  // Re-hydrate the buckets when the NCC id changes (e.g. user navigates from
  // one case to another without unmounting the page).
  const lastNccIdRef = useRef(id);
  useEffect(() => {
    if (lastNccIdRef.current === id) return;
    lastNccIdRef.current = id;
    setStepFileIds(id ? loadStepFileIds(id) : { ...EMPTY_STEP_FILES });
  }, [id]);

  // When the case is already Closed on first load, both steps render as
  // completed. The useState initializers run before the query resolves, so
  // we sync once the data arrives.
  useEffect(() => {
    if (detail.data?.status === "Closed") {
      setStep1Complete(true);
      setStep2Complete(true);
    }
  }, [detail.data?.status]);

  const persistStepFileIds = useCallback(
    (mapping: Record<StepKey, string[]>) => {
      if (!item) return;
      saveStepFileIds(item.id, mapping);
    },
    [item],
  );

  // Fake documents for completed steps on closed cases (demo data).
  const fakeStepFiles = useMemo(
    () =>
      item?.status === "Closed"
        ? ({
            detection: [
              {
                id: "fake-det-1",
                name: "Compliance_Breach_Report.pdf",
                size: 245678,
                type: "application/pdf",
                url: "",
                uploadedAt: item.createdAt ?? new Date().toISOString(),
                uploadedBy: item.ownerName,
                uploadedById: "system",
                nccId: item.id,
              },
              {
                id: "fake-det-2",
                name: "Regulation_Reference_Circular09.pdf",
                size: 189234,
                type: "application/pdf",
                url: "",
                uploadedAt: item.createdAt ?? new Date().toISOString(),
                uploadedBy: item.ownerName,
                uploadedById: "system",
                nccId: item.id,
              },
            ],
            corrective: [
              {
                id: "fake-cor-1",
                name: "Corrective_Action_Plan.docx",
                size: 87234,
                type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                url: "",
                uploadedAt: item.createdAt ?? new Date().toISOString(),
                uploadedBy: item.ownerName,
                uploadedById: "system",
                nccId: item.id,
              },
            ],
          } as { detection: FileAttachment[]; corrective: FileAttachment[] })
        : null,
    [item?.status, item?.createdAt, item?.ownerName, item?.id],
  );

  // Memoized filtered file lists per step so the FileUploadComponent's
  // prop-reference resync doesn't fire on every parent render.
  const filesByStep = useMemo(() => {
    const items = filesQuery.data?.items ?? [];
    const real = {
      detection: items.filter((f) => stepFileIds.detection.includes(f.id)),
      corrective: items.filter((f) => stepFileIds.corrective.includes(f.id)),
    };
    // For closed cases with no real uploaded files, show fake demo docs.
    if (fakeStepFiles) {
      return {
        detection:
          real.detection.length > 0 ? real.detection : fakeStepFiles.detection,
        corrective:
          real.corrective.length > 0
            ? real.corrective
            : fakeStepFiles.corrective,
      };
    }
    return real;
  }, [filesQuery.data, stepFileIds]);

  const handleStepFilesChange = useCallback(
    (step: StepKey) => (files: FileAttachment[]) => {
      setStepFileIds((prev) => {
        const next: Record<StepKey, string[]> = {
          ...prev,
          [step]: files.map((f) => f.id),
        };
        persistStepFileIds(next);
        return next;
      });
    },
    [persistStepFileIds],
  );

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

  const unitLabel =
    item.ownerUnitType === "branch" && item.ownerUnitRegion
      ? `${item.ownerUnitName} (${item.ownerUnitRegion})`
      : item.ownerUnitName;

  const createdLabel = item.createdAt
    ? format(parseISO(item.createdAt), "PPP")
    : "—";

  const rootCauseBySeverity: Record<string, string> = {
    critical: "systemic process failure",
    high: "procedural gap",
    medium: "oversight lapse",
    low: "documentation issue",
  };

  const urgencyNote =
    daysToDue < 0
      ? `${Math.abs(daysToDue)} day${Math.abs(daysToDue) === 1 ? "" : "s"} overdue — regulatory exposure is elevated`
      : daysToDue <= 7
        ? "due within 7 days — prompt action is required"
        : "remediation window is still open";

  // Investigation reasoning steps — derived from the NCC record. Condensed
  // from the 5-phase FDM pattern to a 3-phase flow focused on the actions an
  // owner can take on a case: detect, fix, close.
  const investigationSteps = [
    {
      key: "detection" as const,
      icon: Search,
      title: "Detection & Classification",
      description: `Non-compliance was identified on ${createdLabel} and recorded as case ${item.nccId}. The event was classified as ${severityLabel} severity based on the reported description${item.description ? `: ${item.description}` : "."}`,
    },
    {
      key: "corrective" as const,
      icon: ClipboardList,
      title: "Corrective Actions",
      description: `Preliminary review points to a ${rootCauseBySeverity[item.severity] ?? "control gap"} within ${unitLabel}. A corrective action must be planned and tracked against the due date of ${format(parseISO(item.dueDate), "PPP")}. Owner of record: ${item.ownerName}. ${urgencyNote}.`,
    },
    {
      key: "closure" as const,
      icon: CheckCircle,
      title: "Resolution and Closure",
      description:
        item.status === "Closed" && item.resolution
          ? `Closed on ${item.closedAt ? format(parseISO(item.closedAt), "PPP") : "—"}. Resolution: ${item.resolution}`
          : `Pending resolution. ${item.ownerName} is responsible for closing the case with documented resolution notes.`,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate("/ncc/list")}
        className="-ml-2 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to Cases
      </Button>

      <PageHero
        title={item.title}
        subtitle={`${item.nccId} · ${item.ownerName} · Due ${format(parseISO(item.dueDate), "PPP")}`}
      >
        <div className="flex items-center gap-2">
          {canDelete && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              className="hover:bg-red-500/10 hover:text-destructive"
            >
              <Trash2 className="size-4" aria-hidden="true" />
              Delete
            </Button>
          )}
        </div>
      </PageHero>

      {/* KPI cards row — placed directly after the PageHero per the redesign. */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:items-stretch">
        <KPICard
          label="Days"
          value={Math.abs(daysToDue)}
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
        <KPICard
          label="Status"
          value={item.status}
          icon={CheckCircle}
          iconClassName="bg-blue-500/10 text-blue-600"
        />
        <KPICard
          label="Severity"
          value={severityLabel}
          icon={AlertTriangle}
          iconClassName="bg-amber-500/10 text-amber-600"
        />
      </div>

      {/* Two-column layout: investigation workflow (left, wider) + case
          details (right, narrower). The case details column also hosts the
          description that used to be its own card. */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>NCC Investigation Workflow</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="relative space-y-8">
              {/* Continuous vertical connector line — spans from the first
                  circle center to the last, regardless of step content
                  height. Circles cover it where they sit. */}
              <span
                aria-hidden
                className="pointer-events-none absolute bottom-[1.125rem] left-[1.125rem] top-[1.125rem] w-0.5 bg-border"
              />
              {investigationSteps.map((step, idx) => {
                const Icon = step.icon;
                const isLast = idx === investigationSteps.length - 1;
                const showAttachments =
                  step.key === "detection" || step.key === "corrective";
                const stepState =
                  step.key === "detection"
                    ? {
                        complete: step1Complete,
                        setComplete: setStep1Complete,
                        description: step1Description,
                        setDescription: setStep1Description,
                      }
                    : step.key === "corrective"
                      ? {
                          complete: step2Complete,
                          setComplete: setStep2Complete,
                          description: step2Description,
                          setDescription: setStep2Description,
                        }
                      : null;
                return (
                  <li key={step.key} className="relative pl-12">
                    <span
                      className={cn(
                        "absolute left-0 top-0 z-10 flex size-9 items-center justify-center rounded-full border-2 bg-background text-sm font-semibold",
                        stepState?.complete
                          ? "border-success bg-success text-white"
                          : isLast
                            ? "border-success text-success"
                            : "border-primary text-primary",
                      )}
                    >
                      {idx + 1}
                    </span>
                    <h3 className="flex items-center gap-2 pt-1.5 text-sm font-semibold text-foreground">
                      <Icon
                        className="size-4 text-primary"
                        aria-hidden="true"
                      />
                      {step.title}
                      {stepState?.complete && (
                        <Badge
                          variant="secondary"
                          className="bg-success-bg text-success"
                        >
                          Completed
                        </Badge>
                      )}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {step.description}
                    </p>
                    {showAttachments && stepState && (
                      <div className="mt-4 space-y-3">
                        <div className="space-y-2">
                          <Label htmlFor={`${step.key}-description`}>
                            Step Notes
                          </Label>
                          <Textarea
                            id={`${step.key}-description`}
                            value={stepState.description}
                            onChange={(e) =>
                              stepState.setDescription(e.target.value)
                            }
                            placeholder={`Add notes for ${step.title.toLowerCase()}...`}
                            disabled={
                              item.status === "Closed" || stepState.complete
                            }
                            className="min-h-20"
                          />
                        </div>
                        {/* Attachment box: collapses to a short summary when
                            the step is complete with no files. */}
                        {stepState.complete &&
                        filesByStep[step.key].length === 0 ? (
                          <div className="flex items-center gap-2 rounded-lg border border-dashed border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                            <Paperclip
                              className="size-3.5 shrink-0"
                              aria-hidden="true"
                            />
                            No attachments for this step.
                          </div>
                        ) : (
                          <div className="rounded-lg border border-dashed border-border bg-muted/30 p-3">
                            <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                              <Paperclip
                                className="size-3.5"
                                aria-hidden="true"
                              />
                              Attachments for this step
                              {filesByStep[step.key].length > 0 && (
                                <Badge variant="secondary" className="text-xs">
                                  {filesByStep[step.key].length}
                                </Badge>
                              )}
                            </div>
                            <FileUploadComponent
                              files={filesByStep[step.key]}
                              onFilesChange={handleStepFilesChange(step.key)}
                              nccId={item.id}
                              uploadedBy={user?.name}
                              uploadedById={user?.id}
                              disabled={item.status === "Closed"}
                              listOnly={
                                stepState.complete || item.status === "Closed"
                              }
                            />
                            {item.status === "Closed" && (
                              <p className="mt-2 text-xs text-muted-foreground">
                                This case is closed — file attachments are
                                read-only.
                              </p>
                            )}
                          </div>
                        )}
                        {/* Mark-complete / edit-notes button lives BELOW
                            the attachment section. */}
                        {stepState.complete ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => stepState.setComplete(false)}
                            disabled={item.status === "Closed"}
                          >
                            <Pencil className="size-3.5" aria-hidden="true" />
                            Edit step notes
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => stepState.setComplete(true)}
                            disabled={
                              item.status === "Closed" ||
                              !stepState.description.trim()
                            }
                          >
                            <CheckCircle
                              className="size-3.5"
                              aria-hidden="true"
                            />
                            Mark Step Complete
                          </Button>
                        )}
                      </div>
                    )}
                    {isLast && canEdit && (
                      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4">
                        {item.status === "Open" && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => setCloseOpen(true)}
                              disabled={!step1Complete || !step2Complete}
                            >
                              <Lock className="size-4" aria-hidden="true" />
                              Close Case
                            </Button>
                            {(!step1Complete || !step2Complete) && (
                              <p className="text-xs text-muted-foreground">
                                Complete steps 1 and 2 to enable closing this
                                case.
                              </p>
                            )}
                            {step1Complete &&
                              step2Complete &&
                              filesByStep.detection.length === 0 &&
                              filesByStep.corrective.length === 0 && (
                                <p className="text-xs text-amber-600 dark:text-amber-400">
                                  ⚠ No attachments uploaded for steps 1 or 2.
                                  Consider adding evidence before closing.
                                </p>
                              )}
                          </>
                        )}
                        {item.status === "Closed" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleReopen}
                          >
                            <RotateCcw className="size-4" aria-hidden="true" />
                            Reopen Case
                          </Button>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Case Details</CardTitle>
            {canEdit && (
              <CardAction>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditOpen(true)}
                >
                  <Pencil className="size-3.5" aria-hidden="true" />
                  Edit
                </Button>
              </CardAction>
            )}
          </CardHeader>
          <CardContent>
            <dl className="grid gap-3 sm:grid-cols-2">
              <Fact
                icon={Building2}
                label="Owner Unit"
                value={
                  item.ownerUnitType === "branch" && item.ownerUnitRegion
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
              <Fact icon={CheckCircle} label="Status" value={item.status} />
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
                  className="sm:col-span-2"
                />
              )}
              {item.status === "Closed" && item.resolution && (
                <Fact
                  icon={CheckCircle}
                  label="Resolution"
                  value={item.resolution}
                  className="sm:col-span-2"
                />
              )}
              {item.tags.length > 0 && (
                <div className="space-y-1 rounded-lg border border-border bg-card p-3 sm:col-span-2">
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
            <div className="mt-6 border-t border-border pt-4">
              <h4 className="mb-2 text-sm font-semibold text-foreground">
                Description
              </h4>
              <p className="text-sm text-muted-foreground">
                {item.description}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Sheet open={editOpen} onOpenChange={setEditOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Edit Non-Compliance Case</SheetTitle>
            <SheetDescription>
              Update the details for {item.nccId}.
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-4 pb-4">
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
