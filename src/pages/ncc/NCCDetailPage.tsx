import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { format, parseISO } from "date-fns";
import {
  ArrowLeft,
  Calendar,
  Building2,
  User,
  CheckCircle,
  AlertTriangle,
  Trash2,
  Pencil,
  ExternalLink,
  RotateCcw,
  Tag,
  ClipboardList,
  FileSearch,
  Gauge,
  Inbox,
  Paperclip,
  Repeat,
  Scale,
  Send,
  ShieldCheck,
  Undo2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import {
  Callout,
  EntityHistory,
  EscalationPanel,
  Fact,
  FileNamePicker,
  RfqChip,
  RiskRatingPanel,
  SourceBadge,
  StepBar,
  isRatingValid,
  type RiskRatingValue,
  type StepItem,
} from "@/components/cms";
import { useNCCDetail } from "@/hooks/queries/useNCCQueries";
import { useAdminUsers } from "@/hooks/queries/useAdminQueries";
import { useActiveRiskMatrix } from "@/hooks/queries";
import { useUpdateNCC, useDeleteNCC } from "@/hooks/mutations/useNCCMutations";
import { useIssueWorkflow, useRateIssue } from "@/hooks/mutations";
import { useAuthStore, demoNow } from "@/stores";
import { hasPermission } from "@/constants/rbac";
import {
  ISSUE_SOURCE_LABELS,
  ISSUE_STAGE_LABELS,
  daysUntil,
} from "@/lib/cms-rules";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type {
  IssueSource,
  IssueStage,
  NonComplianceCase,
  UpdateNCCInput,
} from "@/types";

const STAGES: IssueStage[] = ["check", "evidence", "review", "approval"];

export default function NCCDetailPage() {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { role } = useAuthStore();
  const canEdit = hasPermission(role, "ncc:update");
  const canDelete = hasPermission(role, "ncc:delete");

  const [editOpen, setEditOpen] = useState(false);
  const detail = useNCCDetail(id);
  const update = useUpdateNCC(id);
  const remove = useDeleteNCC();
  const usersQuery = useAdminUsers(1, 200, { status: "Active" });

  const item = detail.data;

  if (detail.isPending) return <DetailSkeleton />;
  if (detail.isError || !item)
    return <ErrorState onRetry={() => detail.refetch()} />;

  const daysToDue = daysUntil(item.dueDate, demoNow());

  const handleDelete = () => {
    if (!window.confirm("Delete this compliance issue?")) return;
    remove.mutate(item.id, {
      onSuccess: () => {
        toast.success("Compliance issue deleted");
        navigate("/ncc/list");
      },
    });
  };

  const handleEditSubmit = (values: NCCFormValues) => {
    const owner = usersQuery.data?.items.find((u) => u.id === values.ownerId);
    const payload: UpdateNCCInput = {
      title: values.title,
      description: values.description,
      ownerId: values.ownerId,
      ownerName: owner?.name ?? item.ownerName,
      dueDate: new Date(values.dueDate).toISOString(),
      linkedDocs: values.linkedDocs || undefined,
      source: values.source as IssueSource,
      sourceRef: values.sourceRef || undefined,
      category: values.category,
      regulationRef: values.regulationRef || undefined,
      tags:
        values.tags
          ?.split(",")
          .map((t) => t.trim())
          .filter(Boolean) ?? [],
    };
    update.mutate(payload, {
      onSuccess: () => {
        toast.success("Issue updated");
        setEditOpen(false);
      },
    });
  };

  const editDefaults: Partial<NCCFormValues> = {
    title: item.title,
    description: item.description,
    severity: item.severity,
    ownerUnitId: item.ownerUnitId,
    ownerId: item.ownerId,
    dueDate: item.dueDate.slice(0, 10),
    linkedDocs: item.linkedDocs ?? "",
    tags: item.tags.join(", "),
    source: item.source,
    sourceRef: item.sourceRef ?? "",
    category: item.category,
    regulationRef: item.regulationRef ?? "",
  };

  const unitLabel =
    item.ownerUnitType === "branch" && item.ownerUnitRegion
      ? `${item.ownerUnitName} (${item.ownerUnitRegion})`
      : item.ownerUnitName;

  const levelTint =
    item.risk.finalLevel === "high"
      ? "bg-danger-bg text-danger"
      : item.risk.finalLevel === "medium"
        ? "bg-warning-bg text-warning"
        : "bg-success-bg text-success";

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
        <ArrowLeft className="size-4" aria-hidden="true" /> Back to Issues
      </Button>

      <PageHero
        title={item.title}
        subtitle={`${item.nccId} · ${unitLabel} · ${ISSUE_SOURCE_LABELS[item.source]}${item.sourceRef ? ` (${item.sourceRef})` : ""}`}
      >
        <div className="flex items-center gap-2">
          <SourceBadge source={item.source} />
          <RfqChip code="3.3" />
          {canDelete && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              className="hover:bg-red-500/10 hover:text-destructive"
            >
              <Trash2 className="size-4" aria-hidden="true" /> Delete
            </Button>
          )}
        </div>
      </PageHero>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:items-stretch">
        <KPICard
          label="Due"
          value={item.status === "Closed" ? "Closed" : Math.abs(daysToDue)}
          subtitle={
            item.status === "Closed"
              ? item.closedAt
                ? `on ${format(parseISO(item.closedAt), "dd/MM/yyyy")}`
                : ""
              : daysToDue < 0
                ? `days overdue (${format(parseISO(item.dueDate), "dd/MM")})`
                : daysToDue === 0
                  ? "Due today"
                  : `days left (${format(parseISO(item.dueDate), "dd/MM")})`
          }
          icon={Calendar}
          iconClassName={
            daysToDue < 0 && item.status !== "Closed"
              ? "bg-danger-bg text-danger"
              : undefined
          }
        />
        <KPICard
          label="Stage"
          value={ISSUE_STAGE_LABELS[item.workflow.stage]}
          subtitle={`${item.workflow.rounds.length} evidence round(s)`}
          icon={ClipboardList}
          iconClassName="bg-info-bg text-info"
        />
        <KPICard
          label="Risk level"
          value={
            item.risk.finalLevel.charAt(0).toUpperCase() +
            item.risk.finalLevel.slice(1)
          }
          subtitle={`score ${item.risk.weightedScore.toFixed(2)} · matrix v${item.risk.matrixVersion}`}
          icon={Gauge}
          iconClassName={levelTint}
        />
        <KPICard
          label="Recurrence"
          value={`${item.repeatCount}×`}
          subtitle={
            item.repeatCount > 1
              ? "same category, same unit, 12 months"
              : "first occurrence"
          }
          icon={Repeat}
          iconClassName={
            item.repeatCount > 2
              ? "bg-danger-bg text-danger"
              : "bg-neutral-bg text-neutral"
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <EvidenceWorkflow item={item} />
          <RiskCard item={item} />
          <Card>
            <CardHeader>
              <CardTitle>History</CardTitle>
              <CardDescription>
                Permanent audit trail of every action on this issue (RFQ 5.4)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EntityHistory entityId={item.id} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Issue details</CardTitle>
              {canEdit && (
                <CardAction>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditOpen(true)}
                  >
                    <Pencil className="size-3.5" aria-hidden="true" /> Edit
                  </Button>
                </CardAction>
              )}
            </CardHeader>
            <CardContent>
              <dl className="grid gap-3">
                <Fact
                  icon={Inbox}
                  label="Source"
                  value={ISSUE_SOURCE_LABELS[item.source]}
                />
                {item.sourceRef && (
                  <Fact
                    icon={FileSearch}
                    label="Source reference"
                    value={item.sourceRef}
                  />
                )}
                <Fact
                  icon={ShieldCheck}
                  label="Category"
                  value={item.category}
                />
                {item.regulationRef && (
                  <Fact
                    icon={Scale}
                    label="Linked law / QĐNB"
                    value={item.regulationRef}
                  />
                )}
                <Fact icon={Building2} label="Unit" value={unitLabel} />
                <Fact
                  icon={User}
                  label="Responsible officer"
                  value={item.ownerName}
                />
                <Fact
                  icon={Calendar}
                  label="Recorded"
                  value={format(parseISO(item.createdAt), "dd/MM/yyyy")}
                />
                {item.linkedDocs && item.linkedDocs !== item.sourceRef && (
                  <Fact
                    icon={ExternalLink}
                    label="Linked docs"
                    value={item.linkedDocs}
                  />
                )}
                {item.status === "Closed" && item.resolution && (
                  <Fact
                    icon={CheckCircle}
                    label="Resolution"
                    value={item.resolution}
                  />
                )}
                {item.tags.length > 0 && (
                  <div className="space-y-1 rounded-lg border border-border bg-card p-3">
                    <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Tag className="size-3.5" /> Tags
                    </dt>
                    <dd className="flex flex-wrap gap-1.5">
                      {item.tags.map((t) => (
                        <Badge key={t} variant="secondary" className="text-xs">
                          {t}
                        </Badge>
                      ))}
                    </dd>
                  </div>
                )}
              </dl>
              <div className="mt-4 border-t border-border pt-4">
                <h4 className="mb-1 text-sm font-semibold">Description</h4>
                <p className="text-sm whitespace-pre-line text-muted-foreground">
                  {item.description}
                </p>
              </div>
              {item.icisFindingId && (
                <Button
                  variant="link"
                  className="mt-2 h-auto p-0 text-xs"
                  asChild
                >
                  <Link to="/ncc/list?tab=icis">
                    View the original ICIS finding
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Escalations</CardTitle>
              <CardDescription>By risk level and days overdue</CardDescription>
            </CardHeader>
            <CardContent>
              <EscalationPanel
                escalations={item.escalations}
                entityType="ncc"
                entityId={item.id}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Action plan</CardTitle>
              <CardDescription>Kế hoạch hành động khắc phục</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {item.capId ? (
                <Button variant="outline" asChild>
                  <Link to={`/cap/${item.capId}`}>Open linked CAP</Link>
                </Button>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    Create a corrective action plan when remediation needs
                    several actions or owners.
                  </p>
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/cap/create">Create action plan (CAP)</Link>
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Reminders</CardTitle>
              <CardAction>
                <Badge variant="secondary">{item.reminders.length}</Badge>
              </CardAction>
            </CardHeader>
            <CardContent>
              <ol className="space-y-1.5">
                {[...item.reminders].reverse().map((r) => (
                  <li key={r.id} className="flex items-center gap-2 text-xs">
                    <span
                      className={cn(
                        "rounded px-1.5 py-0.5 font-semibold",
                        r.kind.startsWith("Overdue")
                          ? "bg-danger-bg text-danger"
                          : "bg-muted",
                      )}
                    >
                      {r.kind}
                    </span>
                    <span className="text-muted-foreground">
                      {format(parseISO(r.at), "dd/MM/yyyy")}
                    </span>
                    <span className="truncate">→ {r.to}</span>
                  </li>
                ))}
                {item.reminders.length === 0 && (
                  <li className="text-xs text-muted-foreground">
                    No reminder sent yet. Reminders go out 7 and 1 day(s) before
                    the due date, then daily when overdue.
                  </li>
                )}
              </ol>
            </CardContent>
          </Card>
        </div>
      </div>

      <Sheet open={editOpen} onOpenChange={setEditOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Edit compliance issue</SheetTitle>
            <SheetDescription>
              Update the details of {item.nccId}. The risk level is changed with
              “Re-rate”.
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            <NCCForm
              defaultValues={editDefaults}
              lockOwnerUnit
              onSubmit={handleEditSubmit}
              onCancel={() => setEditOpen(false)}
              isSubmitting={update.isPending}
              submitLabel="Save changes"
            />
          </div>
        </SheetContent>
      </Sheet>
    </motion.div>
  );
}

type WorkflowAction =
  "check" | "submit" | "accept" | "return" | "approve" | "reopen";

function EvidenceWorkflow({ item }: { item: NonComplianceCase }) {
  const { role } = useAuthStore();
  const isCompliance = hasPermission(role, "issue:review");
  const canApprove = hasPermission(role, "issue:approve");
  const canSubmit = hasPermission(role, "ncc:update") || role === "approver";
  const wf = useIssueWorkflow(item.id);
  const [note, setNote] = useState("");
  const [files, setFiles] = useState<string[]>([]);
  const [comment, setComment] = useState("");

  useEffect(() => {
    setNote("");
    setFiles([]);
    setComment("");
  }, [item.workflow.stage]);

  const stage = item.workflow.stage;
  const stageIdx = stage === "closed" ? STAGES.length : STAGES.indexOf(stage);
  const lastRound = item.workflow.rounds[item.workflow.rounds.length - 1];
  const returned = stage === "evidence" && lastRound?.decision === "returned";

  const steps: StepItem[] = STAGES.map((s, i) => ({
    key: s,
    label: ISSUE_STAGE_LABELS[s],
    hint:
      s === "check"
        ? "Verify with the unit"
        : s === "evidence"
          ? "Unit uploads proof"
          : s === "review"
            ? "Khối Tuân thủ"
            : "Approver closes",
    state:
      i < stageIdx
        ? "done"
        : i === stageIdx
          ? s === "evidence" && returned
            ? "returned"
            : "current"
          : "pending",
  }));

  const run = (
    action: WorkflowAction,
    msg: string,
    extra: {
      note?: string;
      fileNames?: string[];
      comment?: string;
      resolution?: string;
    } = {},
  ) => wf.mutate({ action, ...extra }, { onSuccess: () => toast.success(msg) });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Evidence submission & approval</CardTitle>
        <CardDescription>
          Kiểm tra → Nộp bằng chứng → Thẩm định → Phê duyệt đóng
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <StepBar steps={steps} />

        {stage === "check" && (
          <div className="space-y-3 rounded-xl border border-border p-4">
            <p className="text-sm font-medium">
              Step 1 — Check the finding with the unit
            </p>
            <p className="text-xs text-muted-foreground">
              Confirm the facts and root cause with {item.ownerUnitName} before
              asking for evidence.
            </p>
            {isCompliance ? (
              <>
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="What was confirmed with the unit?"
                  className="min-h-16"
                />
                <Button
                  disabled={!note.trim() || wf.isPending}
                  onClick={() =>
                    run(
                      "check",
                      "Finding confirmed — unit asked to submit evidence",
                      { note: note.trim() },
                    )
                  }
                >
                  <CheckCircle className="size-4" /> Confirm & request evidence
                </Button>
              </>
            ) : (
              <p className="text-xs text-muted-foreground">
                Waiting for Compliance (Owner role).
              </p>
            )}
          </div>
        )}

        {stage === "evidence" && (
          <div className="space-y-3 rounded-xl border border-border p-4">
            {returned && (
              <Callout
                tone="warning"
                title={`Round ${lastRound.round} returned by ${lastRound.reviewer}`}
              >
                {lastRound.reviewComment}
              </Callout>
            )}
            <p className="text-sm font-medium">
              Step 2 — Unit submits remediation evidence
            </p>
            {canSubmit ? (
              <>
                <FileNamePicker
                  value={files}
                  onChange={setFiles}
                  sampleName={`Bang_chung_khac_phuc_${item.nccId}.pdf`}
                />
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="What was done to fix the issue?"
                  className="min-h-16"
                />
                <Button
                  disabled={!files.length || !note.trim() || wf.isPending}
                  onClick={() =>
                    run(
                      "submit",
                      "Evidence submitted — Compliance notified for review",
                      { note: note.trim(), fileNames: files },
                    )
                  }
                >
                  <Send className="size-4" /> Submit evidence (round{" "}
                  {item.workflow.rounds.length + 1})
                </Button>
              </>
            ) : (
              <p className="text-xs text-muted-foreground">
                Waiting for {item.ownerUnitName}.
              </p>
            )}
          </div>
        )}

        {stage === "review" && lastRound && (
          <div className="space-y-3 rounded-xl border border-border p-4">
            <p className="text-sm font-medium">
              Step 3 — Compliance reviews round {lastRound.round}
            </p>
            <div className="rounded-lg bg-muted/40 p-3 text-sm">
              <p>{lastRound.note}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {lastRound.fileNames.map((f) => (
                  <span
                    key={f}
                    className="inline-flex items-center gap-1 rounded-md bg-background px-2 py-0.5 text-xs"
                  >
                    <Paperclip className="size-3" />
                    {f}
                  </span>
                ))}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Submitted by {lastRound.submittedBy} ·{" "}
                {format(parseISO(lastRound.submittedAt), "dd/MM/yyyy HH:mm")}
              </p>
            </div>
            {isCompliance ? (
              <>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Review comment (required to return)"
                  className="min-h-16"
                />
                <div className="flex flex-wrap gap-2">
                  <Button
                    disabled={wf.isPending}
                    onClick={() =>
                      run(
                        "accept",
                        "Evidence accepted — sent for closure approval",
                        { comment: comment.trim() || "Bằng chứng đầy đủ." },
                      )
                    }
                  >
                    <CheckCircle className="size-4" /> Accept evidence
                  </Button>
                  <Button
                    variant="outline"
                    disabled={!comment.trim() || wf.isPending}
                    onClick={() =>
                      run("return", "Evidence returned to the unit", {
                        comment: comment.trim(),
                      })
                    }
                  >
                    <Undo2 className="size-4" /> Return for more evidence
                  </Button>
                </div>
              </>
            ) : (
              <p className="text-xs text-muted-foreground">
                Waiting for Compliance review.
              </p>
            )}
          </div>
        )}

        {stage === "approval" && (
          <div className="space-y-3 rounded-xl border border-border p-4">
            <p className="text-sm font-medium">Step 4 — Approve closure</p>
            {canApprove ? (
              <>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Resolution summary"
                  className="min-h-16"
                />
                <Button
                  disabled={!comment.trim() || wf.isPending}
                  onClick={() =>
                    run("approve", "Issue closed", {
                      resolution: comment.trim(),
                    })
                  }
                >
                  <ShieldCheck className="size-4" /> Approve closure
                </Button>
              </>
            ) : (
              <p className="text-xs text-muted-foreground">
                Waiting for the approver. Switch to the Approver or Executive
                role to approve.
              </p>
            )}
          </div>
        )}

        {stage === "closed" && (
          <Callout
            tone="success"
            title={`Closed${item.workflow.approvedBy ? ` — approved by ${item.workflow.approvedBy}` : ""}`}
            action={
              isCompliance ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => run("reopen", "Issue reopened")}
                >
                  <RotateCcw className="size-3.5" /> Reopen
                </Button>
              ) : undefined
            }
          >
            {item.resolution}
          </Callout>
        )}

        {item.workflow.rounds.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase">
              Evidence rounds
            </p>
            {[...item.workflow.rounds].reverse().map((r) => (
              <div
                key={r.id}
                className="rounded-lg border border-border p-3 text-sm"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">Round {r.round}</span>
                  <span className="text-xs text-muted-foreground">
                    {format(parseISO(r.submittedAt), "dd/MM/yyyy")} ·{" "}
                    {r.submittedBy}
                  </span>
                  {r.decision && (
                    <span
                      className={cn(
                        "ml-auto rounded px-1.5 py-0.5 text-xs font-semibold",
                        r.decision === "accepted"
                          ? "bg-success-bg text-success"
                          : "bg-warning-bg text-warning",
                      )}
                    >
                      {r.decision === "accepted" ? "Accepted" : "Returned"}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-muted-foreground">{r.note}</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {r.fileNames.map((f) => (
                    <span
                      key={f}
                      className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs"
                    >
                      <Paperclip className="size-3" />
                      {f}
                    </span>
                  ))}
                </div>
                {r.reviewComment && (
                  <p className="mt-1 text-xs italic">
                    Review: “{r.reviewComment}” — {r.reviewer}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RiskCard({ item }: { item: NonComplianceCase }) {
  const { role } = useAuthStore();
  const canRate = hasPermission(role, "issue:review");
  const { data: matrix } = useActiveRiskMatrix();
  const rate = useRateIssue(item.id);
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState<RiskRatingValue>({
    scores: item.risk.scores,
    overrideLevel: item.risk.overridden ? item.risk.finalLevel : undefined,
    overrideReason: item.risk.overrideReason,
  });

  useEffect(() => {
    setValue({
      scores: item.risk.scores,
      overrideLevel: item.risk.overridden ? item.risk.finalLevel : undefined,
      overrideReason: item.risk.overrideReason,
    });
  }, [item.risk]);

  if (!matrix) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="size-4" /> Risk rating
        </CardTitle>
        <CardDescription>
          Rated {format(parseISO(item.risk.ratedAt), "dd/MM/yyyy")} by{" "}
          {item.risk.ratedBy}
          {item.risk.overridden &&
            ` · overridden from ${item.risk.suggestedLevel.toUpperCase()}: ${item.risk.overrideReason}`}
        </CardDescription>
        <CardAction className="flex items-center gap-2">
          <RfqChip code="4.2" />
          {canRate && !editing && item.status === "Open" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setEditing(true)}
            >
              Re-rate
            </Button>
          )}
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-3">
        <RiskRatingPanel
          matrix={matrix}
          value={value}
          onChange={setValue}
          readOnly={!editing}
          hints={{
            recurrence:
              item.repeatCount > 1
                ? `${item.repeatCount} occurrences of “${item.category}” at ${item.ownerUnitName} in 12 months`
                : undefined,
          }}
        />
        {editing && (
          <div className="flex gap-2">
            <Button
              disabled={!isRatingValid(matrix, value) || rate.isPending}
              onClick={() =>
                rate.mutate(value, {
                  onSuccess: (res) => {
                    setEditing(false);
                    toast.success(
                      res.risk.finalLevel === "high"
                        ? "Re-rated HIGH — escalated to BĐH & BKS"
                        : `Re-rated ${res.risk.finalLevel.toUpperCase()}`,
                    );
                  },
                })
              }
            >
              Save rating
            </Button>
            <Button variant="ghost" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
