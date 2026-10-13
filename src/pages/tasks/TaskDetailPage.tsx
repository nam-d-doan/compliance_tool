import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion } from "motion/react";
import { format, parseISO } from "date-fns";
import {
  ArrowLeft,
  BellRing,
  BookMarked,
  Building2,
  CalendarCheck,
  CalendarClock,
  Check,
  CheckCircle2,
  ClipboardCheck,
  FileCheck2,
  FileText,
  Link2,
  RotateCcw,
  Scale,
  Send,
  Upload,
  User,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHero } from "@/components/common";
import { DetailSkeleton } from "@/components/common/Skeletons";
import { ErrorState } from "@/components/common/ErrorState";
import {
  Callout,
  EntityHistory,
  EscalationPanel,
  Fact,
  FileNamePicker,
  RevisionHealthBadge,
  StepBar,
  ToneBadge,
  type StepItem,
} from "@/components/cms";
import { useQdnbList, useRevisions, useTaskWorkflow } from "@/hooks/queries";
import {
  useAcceptTask,
  useAddDraft,
  useAdvanceRevision,
  useCompleteTask,
  useCustomStepDone,
  useDecideDeadlineChange,
  useRequestDeadlineChange,
  useUpdateRevision,
} from "@/hooks/mutations";
import { useAuthStore, demoNow } from "@/stores";
import {
  MAPPING_ACTION_LABELS,
  daysUntil,
  getRevisionHealth,
} from "@/lib/cms-rules";
import {
  STEP_OWNER_LABELS,
  TASK_STATUS_LABELS,
  TASK_STATUS_TONE,
  taskFlow,
  taskStatus,
  type TaskFlowStep,
} from "@/lib/task-flow";
import { cn } from "@/lib/utils";
import type { Role, RevisionTask, TaskStepOwner } from "@/types";
import { IssueSheet } from "@/pages/qdnb/QdnbDetailPage";

/** Which demo roles act for each step owner (admin can do everything). */
const OWNER_ROLES: Record<TaskStepOwner, Role[]> = {
  compliance: ["owner", "admin"],
  department: ["approver", "admin"],
  approver: ["executive", "admin"],
};
const OWNER_SWITCH_HINT: Record<TaskStepOwner, string> = {
  compliance: "Switch to the Compliance (CMS owner) role to continue.",
  department: "Switch to the Department role to continue.",
  approver: "Switch to the Executive role to approve.",
};

export default function TaskDetailPage() {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const revisions = useRevisions();
  const workflow = useTaskWorkflow();

  if (revisions.isPending || workflow.isPending) return <DetailSkeleton />;
  const task = revisions.data?.find((t) => t.id === id);
  if (revisions.isError || !task)
    return <ErrorState onRetry={() => revisions.refetch()} />;

  const template = workflow.data ?? [];
  const flow = taskFlow(task, template);
  const current = flow.find((s) => s.state !== "done");
  const now = demoNow();
  const health = getRevisionHealth(task, now);
  const st = taskStatus(task);
  const daysToDeadline = daysUntil(task.committedDate, now);
  const daysToLaw = daysUntil(task.lawEffectiveDate, now);

  const steps: StepItem[] = flow.map((f) => ({
    key: String(f.step.key),
    label: f.step.name,
    hint:
      f.state === "done" && f.at
        ? format(parseISO(f.at), "dd/MM/yyyy")
        : STEP_OWNER_LABELS[f.step.owner],
    state: f.state,
  }));

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
        onClick={() => navigate("/tasks")}
        className="-ml-2 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to Task Management
      </Button>

      <PageHero
        title={`${task.code} · ${MAPPING_ACTION_LABELS[task.action]}`}
        subtitle={`${task.qdnbCode} — ${task.qdnbTitle}`}
      >
        <div className="flex flex-wrap items-center gap-2">
          <ToneBadge tone={TASK_STATUS_TONE[st]}>
            {TASK_STATUS_LABELS[st]}
          </ToneBadge>
          {task.status !== "issued" && <RevisionHealthBadge health={health} />}
        </div>
      </PageHero>

      <StepBar steps={steps} />

      {health === "overdue" && (
        <Callout tone="danger" title={`Overdue by ${-daysToDeadline} day(s)`}>
          The deadline {format(parseISO(task.committedDate), "dd/MM/yyyy")} has
          passed.
          {daysToLaw < 0 &&
            ` The law has been in force for ${-daysToLaw} day(s) — the bank is exposed until the regulation is issued.`}{" "}
          Reminders and escalation follow the overdue rules.
        </Callout>
      )}
      {health === "late_risk" && (
        <Callout tone="warning" title="Risk of late issuance">
          Forecast issue date{" "}
          {format(parseISO(task.expectedIssueDate), "dd/MM/yyyy")} is after the
          {parseISO(task.expectedIssueDate) > parseISO(task.lawEffectiveDate)
            ? ` law's effective date (${format(parseISO(task.lawEffectiveDate), "dd/MM/yyyy")})`
            : ` deadline (${format(parseISO(task.committedDate), "dd/MM/yyyy")})`}
          , or too little is done with the deadline close.
        </Callout>
      )}

      <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Fact
          icon={Building2}
          label="Lead unit (chủ trì)"
          value={task.leadUnitName}
        />
        <Fact
          icon={Users}
          label="Supporting units (phối hợp)"
          value={task.supportUnitNames.join(", ") || "—"}
        />
        <Fact icon={User} label="Responsible officer" value={task.ownerName} />
        <Fact
          icon={CalendarClock}
          label="Deadline"
          value={`${format(parseISO(task.committedDate), "dd/MM/yyyy")}${task.status !== "issued" ? ` (${daysToDeadline < 0 ? `${-daysToDeadline}d late` : `${daysToDeadline}d left`})` : ""}`}
          alert={health === "overdue"}
        />
        <Fact
          icon={Scale}
          label="Law effective date"
          value={`${format(parseISO(task.lawEffectiveDate), "dd/MM/yyyy")} (${daysToLaw < 0 ? `in force ${-daysToLaw}d` : `in ${daysToLaw}d`})`}
        />
        <Fact
          icon={CalendarCheck}
          label="Forecast issue date"
          value={format(parseISO(task.expectedIssueDate), "dd/MM/yyyy")}
          alert={health === "late_risk"}
        />
        <Fact
          icon={CheckCircle2}
          label="Progress"
          value={`${task.progress}%`}
        />
        <Fact
          icon={ClipboardCheck}
          label="Response deadline"
          value={
            task.responseDeadline
              ? format(parseISO(task.responseDeadline), "dd/MM/yyyy")
              : "—"
          }
        />
      </dl>

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="min-w-0 space-y-4">
          {current ? (
            <CurrentStepCard task={task} current={current} />
          ) : (
            <Callout tone="success" icon={CheckCircle2} title="Task completed">
              Completed
              {task.completedAt
                ? ` on ${format(parseISO(task.completedAt), "dd/MM/yyyy")}`
                : ""}
              {task.completedBy ? ` by ${task.completedBy}` : ""}. The issued
              regulation and its version history are kept in the Document
              Library.
            </Callout>
          )}
          <StepTimeline task={task} flow={flow} />
        </div>

        <aside className="space-y-4">
          <SourcesCard task={task} />
          <DeadlineChangesCard task={task} />
          <Card>
            <CardHeader>
              <CardTitle>Escalations</CardTitle>
            </CardHeader>
            <CardContent>
              <EscalationPanel
                escalations={task.escalations}
                entityType="revision"
                entityId={task.id}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BellRing className="size-4" /> Reminders
              </CardTitle>
              <CardAction>
                <Badge variant="secondary">{task.reminders.length}</Badge>
              </CardAction>
            </CardHeader>
            <CardContent>
              <p className="mb-2 text-xs text-muted-foreground">
                Sent 30, 14, 7 and 1 day(s) before the deadline, then daily when
                overdue.
              </p>
              <ol className="space-y-1.5">
                {[...task.reminders].reverse().map((r) => (
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
                {task.reminders.length === 0 && (
                  <li className="text-xs text-muted-foreground">
                    No reminder sent yet.
                  </li>
                )}
              </ol>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>History</CardTitle>
              <CardDescription>
                Every action on this task (audit trail)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EntityHistory entityId={task.id} />
            </CardContent>
          </Card>
        </aside>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------

function CurrentStepCard({
  task,
  current,
}: {
  task: RevisionTask;
  current: TaskFlowStep;
}) {
  const { role } = useAuthStore();
  const owner = current.step.owner;
  const canAct = !!role && OWNER_ROLES[owner].includes(role);
  const key = String(current.step.key);

  return (
    <Card className="border-primary/30 ring-2 ring-primary/10">
      <CardHeader>
        <CardDescription>Current step</CardDescription>
        <CardTitle className="flex flex-wrap items-center gap-2">
          {current.step.name}
          {current.state === "returned" && (
            <ToneBadge tone="warning" icon={RotateCcw}>
              Returned for changes
            </ToneBadge>
          )}
        </CardTitle>
        <CardAction>
          <ToneBadge tone="info">{STEP_OWNER_LABELS[owner]}</ToneBadge>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-4">
        {current.step.description && (
          <p className="text-sm text-muted-foreground">
            {current.step.description}
          </p>
        )}
        {!canAct ? (
          <Callout
            tone="info"
            title={`Waiting for ${STEP_OWNER_LABELS[owner]}`}
          >
            {OWNER_SWITCH_HINT[owner]}
          </Callout>
        ) : key === "accept" ? (
          <AcceptAction task={task} />
        ) : key === "draft" ? (
          <DraftAction task={task} returned={current.state === "returned"} />
        ) : key === "review" ? (
          <ReviewAction task={task} />
        ) : key === "approve" ? (
          <ApproveAction task={task} />
        ) : key === "issue" ? (
          <IssueAction task={task} />
        ) : key === "complete" ? (
          <CompleteAction task={task} />
        ) : (
          <CustomStepAction task={task} stepKey={key} />
        )}
      </CardContent>
    </Card>
  );
}

function AcceptAction({ task }: { task: RevisionTask }) {
  const accept = useAcceptTask();
  const [note, setNote] = useState("");
  return (
    <div className="space-y-3">
      <Callout tone="info" title="What Compliance asks">
        {task.brief}
      </Callout>
      <Textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Note to Compliance (optional)"
        className="min-h-14"
      />
      <div className="flex flex-wrap gap-2">
        <Button
          disabled={accept.isPending}
          onClick={() =>
            accept.mutate(
              { id: task.id, note: note.trim() || undefined },
              {
                onSuccess: () =>
                  toast.success("Task accepted — drafting can start"),
              },
            )
          }
        >
          <Check className="size-4" /> Accept task
        </Button>
        <p className="self-center text-xs text-muted-foreground">
          Need more time? Use “Request deadline change” on the right.
        </p>
      </div>
    </div>
  );
}

function DraftAction({
  task,
  returned,
}: {
  task: RevisionTask;
  returned: boolean;
}) {
  const addDraft = useAddDraft();
  const advance = useAdvanceRevision();
  const update = useUpdateRevision();
  const [files, setFiles] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [progress, setProgress] = useState(task.progress);
  const [forecast, setForecast] = useState(task.expectedIssueDate.slice(0, 10));
  const drafts = task.drafts ?? [];
  const next = drafts.length + 1;
  const reviewComment = task.approvalSteps.find(
    (s) => s.key === "draft",
  )?.comment;

  useEffect(() => {
    setProgress(task.progress);
    setForecast(task.expectedIssueDate.slice(0, 10));
  }, [task.progress, task.expectedIssueDate]);

  return (
    <div className="space-y-4">
      {returned && reviewComment && (
        <Callout tone="warning" title="Compliance returned the draft">
          “{reviewComment}” — upload a new draft and submit it again.
        </Callout>
      )}
      <div className="space-y-2 rounded-xl border border-border p-3">
        <p className="text-sm font-medium">Upload draft {next}</p>
        <FileNamePicker
          value={files}
          onChange={setFiles}
          multiple={false}
          sampleName={`${task.code}_Du_thao_${next}.docx`}
        />
        <Input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="What changed in this draft (optional)"
        />
        <Button
          variant="outline"
          size="sm"
          disabled={!files.length || addDraft.isPending}
          onClick={() =>
            addDraft.mutate(
              { id: task.id, fileName: files[0], note },
              {
                onSuccess: () => {
                  toast.success(`Draft ${next} saved`);
                  setFiles([]);
                  setNote("");
                },
              },
            )
          }
        >
          <Upload className="size-4" /> Save draft {next}
        </Button>
      </div>

      <div className="grid gap-3 rounded-xl border border-border bg-muted/20 p-3 md:grid-cols-[1fr_auto_auto]">
        <div className="space-y-1">
          <Label className="text-xs">Progress: {progress}%</Label>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={progress}
            onChange={(e) => setProgress(Number(e.target.value))}
            className="w-full accent-primary"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs" htmlFor="forecast">
            Forecast issue date
          </Label>
          <Input
            id="forecast"
            type="date"
            value={forecast}
            onChange={(e) => setForecast(e.target.value)}
            className="h-9"
          />
        </div>
        <div className="flex items-end">
          <Button
            variant="outline"
            disabled={
              update.isPending ||
              (progress === task.progress &&
                forecast === task.expectedIssueDate.slice(0, 10))
            }
            onClick={() =>
              update.mutate(
                {
                  id: task.id,
                  patch: {
                    progress,
                    expectedIssueDate: new Date(forecast).toISOString(),
                  },
                },
                { onSuccess: () => toast.success("Progress updated") },
              )
            }
          >
            Update progress
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
        <Button
          disabled={drafts.length === 0 || advance.isPending}
          onClick={() =>
            advance.mutate(
              {
                id: task.id,
                action: "submit",
                comment: `Draft ${drafts.length} submitted`,
              },
              {
                onSuccess: () =>
                  toast.success(
                    `Draft ${drafts.length} sent to Compliance for review`,
                  ),
              },
            )
          }
        >
          <Send className="size-4" /> Submit draft {drafts.length || ""} for
          review
        </Button>
        {drafts.length === 0 && (
          <span className="text-xs text-muted-foreground">
            Upload at least one draft first.
          </span>
        )}
      </div>
    </div>
  );
}

function ReviewAction({ task }: { task: RevisionTask }) {
  const advance = useAdvanceRevision();
  const [comment, setComment] = useState("");
  const last = task.drafts?.[task.drafts.length - 1];
  return (
    <div className="space-y-3">
      {last && (
        <div className="flex items-center gap-2 rounded-lg border border-border p-2.5 text-sm">
          <FileText className="size-4 text-muted-foreground" />
          <span className="font-medium">{last.fileName}</span>
          <span className="text-xs text-muted-foreground">
            Draft {last.version} · {last.by} ·{" "}
            {format(parseISO(last.at), "dd/MM/yyyy")}
          </span>
        </div>
      )}
      <Textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Review comment — required to return the draft"
        className="min-h-16"
      />
      <div className="flex flex-wrap gap-2">
        <Button
          disabled={advance.isPending}
          onClick={() =>
            advance.mutate(
              {
                id: task.id,
                action: "approve",
                comment: comment.trim() || undefined,
              },
              {
                onSuccess: () => {
                  toast.success("Review passed — sent for approval");
                  setComment("");
                },
              },
            )
          }
        >
          <CheckCircle2 className="size-4" /> Pass review, send for approval
        </Button>
        <Button
          variant="outline"
          disabled={!comment.trim() || advance.isPending}
          onClick={() =>
            advance.mutate(
              { id: task.id, action: "return", comment: comment.trim() },
              {
                onSuccess: () => {
                  toast.success("Draft returned to the department");
                  setComment("");
                },
              },
            )
          }
        >
          <RotateCcw className="size-4" /> Return to department
        </Button>
      </div>
    </div>
  );
}

function ApproveAction({ task }: { task: RevisionTask }) {
  const advance = useAdvanceRevision();
  const [comment, setComment] = useState("");
  return (
    <div className="space-y-3">
      <Textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Approval note (optional)"
        className="min-h-14"
      />
      <Button
        disabled={advance.isPending}
        onClick={() =>
          advance.mutate(
            {
              id: task.id,
              action: "approve",
              comment: comment.trim() || undefined,
            },
            {
              onSuccess: () =>
                toast.success("Approved — the department can issue it"),
            },
          )
        }
      >
        <CheckCircle2 className="size-4" /> Approve for issuance
      </Button>
    </div>
  );
}

function IssueAction({ task }: { task: RevisionTask }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Record the decision number, the issue and effective dates and the signed
        file. The internal regulation gets a new version in the Document
        Library.
      </p>
      <Button onClick={() => setOpen(true)}>
        <FileCheck2 className="size-4" /> Record issuance & evidence
      </Button>
      <IssueSheet task={task} open={open} onOpenChange={setOpen} />
    </div>
  );
}

function CompleteAction({ task }: { task: RevisionTask }) {
  const complete = useCompleteTask();
  const qdnbs = useQdnbList();
  const [selected, setSelected] = useState<string[]>(
    task.qdnbId ? [task.qdnbId] : [],
  );
  const [adding, setAdding] = useState("");
  const all = qdnbs.data ?? [];
  const options = all.filter((q) => !selected.includes(q.id));

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Link every internal regulation issued for this task. The task cannot be
        completed without at least one.
      </p>
      <ul className="space-y-2">
        {selected.map((id) => {
          const q = all.find((x) => x.id === id);
          if (!q) return null;
          const v = q.versions[q.versions.length - 1];
          return (
            <li
              key={id}
              className="flex items-center gap-2 rounded-lg border border-success/30 bg-success-bg/40 p-2.5 text-sm"
            >
              <BookMarked className="size-4 text-success" />
              <span className="min-w-0 flex-1">
                <span className="block font-mono text-xs font-semibold">
                  {q.code} · v{q.currentVersion}
                </span>
                <span className="block truncate">{q.title}</span>
                <span className="block text-xs text-muted-foreground">
                  Issued {format(parseISO(v.issuedAt), "dd/MM/yyyy")}
                </span>
              </span>
              <button
                type="button"
                aria-label="Remove link"
                onClick={() => setSelected(selected.filter((x) => x !== id))}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </li>
          );
        })}
      </ul>
      <div className="flex flex-wrap gap-2">
        <select
          value={adding}
          onChange={(e) => setAdding(e.target.value)}
          className="h-9 min-w-0 flex-1 rounded-lg border border-input bg-background px-2.5 text-sm dark:bg-input/30"
        >
          <option value="">Add another issued QĐNB…</option>
          {options.map((q) => (
            <option key={q.id} value={q.id}>
              {q.code} — {q.title}
            </option>
          ))}
        </select>
        <Button
          variant="outline"
          disabled={!adding}
          onClick={() => {
            setSelected([...selected, adding]);
            setAdding("");
          }}
        >
          <Link2 className="size-4" /> Link
        </Button>
      </div>
      <Button
        disabled={!selected.length || complete.isPending}
        onClick={() =>
          complete.mutate(
            { id: task.id, qdnbIds: selected },
            { onSuccess: () => toast.success("Task completed") },
          )
        }
      >
        <CheckCircle2 className="size-4" /> Complete task
      </Button>
    </div>
  );
}

function CustomStepAction({
  task,
  stepKey,
}: {
  task: RevisionTask;
  stepKey: string;
}) {
  const done = useCustomStepDone();
  return (
    <Button
      disabled={done.isPending}
      onClick={() =>
        done.mutate(
          { id: task.id, key: stepKey },
          { onSuccess: () => toast.success("Step marked as done") },
        )
      }
    >
      <Check className="size-4" /> Mark step as done
    </Button>
  );
}

// ---------------------------------------------------------------------------

function StepTimeline({
  task,
  flow,
}: {
  task: RevisionTask;
  flow: TaskFlowStep[];
}) {
  const qdnbs = useQdnbList();
  return (
    <Card>
      <CardHeader>
        <CardTitle>Workflow</CardTitle>
        <CardDescription>
          Every step with who did it and when; drafts and evidence are kept
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ol className="relative space-y-3 border-l border-border pl-5">
          {flow.map((f, i) => {
            const key = String(f.step.key);
            return (
              <li key={key} className="relative">
                <span
                  className={cn(
                    "absolute top-0.5 -left-[29px] flex size-[17px] items-center justify-center rounded-full text-[9px] font-bold",
                    f.state === "done" && "bg-success text-white",
                    f.state === "current" &&
                      "bg-primary text-primary-foreground",
                    f.state === "returned" && "bg-warning text-white",
                    f.state === "pending" && "bg-muted text-muted-foreground",
                  )}
                >
                  {f.state === "done" ? <Check className="size-2.5" /> : i + 1}
                </span>
                <p
                  className={cn(
                    "text-sm font-medium",
                    f.state === "pending" && "text-muted-foreground",
                  )}
                >
                  {f.step.name}
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    {STEP_OWNER_LABELS[f.step.owner]}
                    {f.step.days > 0 && ` · ${f.step.days} day(s)`}
                    {f.step.evidenceRequired && " · evidence required"}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {f.state === "done"
                    ? `Done${f.by ? ` by ${f.by}` : ""}${f.at ? ` · ${format(parseISO(f.at), "dd/MM/yyyy HH:mm")}` : ""}`
                    : f.state === "current"
                      ? "In progress"
                      : f.state === "returned"
                        ? "Returned for changes"
                        : "Waiting"}
                </p>
                {f.comment && (
                  <p className="mt-0.5 text-xs italic">“{f.comment}”</p>
                )}

                {key === "assign" && task.brief && (
                  <p className="mt-1.5 rounded-lg bg-muted/50 p-2 text-xs">
                    {task.brief}
                  </p>
                )}
                {key === "draft" && (task.drafts?.length ?? 0) > 0 && (
                  <ul className="mt-1.5 space-y-1">
                    {task.drafts!.map((d) => (
                      <li
                        key={d.id}
                        className="flex flex-wrap items-center gap-2 rounded-lg border border-border px-2 py-1.5 text-xs"
                      >
                        <FileText className="size-3.5 text-muted-foreground" />
                        <span className="font-semibold">Draft {d.version}</span>
                        <span>{d.fileName}</span>
                        <span className="text-muted-foreground">
                          {d.by} · {format(parseISO(d.at), "dd/MM/yyyy")}
                        </span>
                        {d.note && (
                          <span className="w-full text-muted-foreground">
                            {d.note}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
                {key === "issue" && task.evidence && (
                  <div className="mt-1.5 rounded-lg border border-success/30 bg-success-bg/40 px-2 py-1.5 text-xs">
                    <span className="font-semibold">
                      {task.evidence.decisionNo}
                    </span>{" "}
                    · signed{" "}
                    {format(parseISO(task.evidence.issueDate), "dd/MM/yyyy")} ·
                    effective{" "}
                    {format(
                      parseISO(task.evidence.effectiveDate),
                      "dd/MM/yyyy",
                    )}{" "}
                    · proof: {task.evidence.fileName}
                  </div>
                )}
                {key === "complete" &&
                  (task.linkedQdnbIds?.length ?? 0) > 0 && (
                    <ul className="mt-1.5 space-y-1">
                      {task.linkedQdnbIds!.map((id) => {
                        const q = qdnbs.data?.find((x) => x.id === id);
                        return (
                          <li key={id}>
                            <Link
                              to={`/qdnb/${id}`}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2 py-1 text-xs hover:bg-muted/50"
                            >
                              <BookMarked className="size-3.5" />
                              <span className="font-mono font-semibold">
                                {q?.code ?? id}
                              </span>
                              {q && <span>v{q.currentVersion}</span>}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
              </li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
}

function SourcesCard({ task }: { task: RevisionTask }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Linked documents</CardTitle>
        <CardDescription>Open them in the Document Library</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground">
          Because of (law)
        </p>
        {task.sources.map((s) => (
          <Link
            key={s.docNumber}
            to={
              s.legalUpdateId ? `/legal-updates/${s.legalUpdateId}` : "/library"
            }
            className="flex items-start gap-2 rounded-lg border border-border p-2 text-xs hover:bg-muted/50"
          >
            <Scale className="mt-0.5 size-3.5 shrink-0 text-info" />
            <span className="min-w-0">
              <span className="block font-mono font-semibold">
                {s.docNumber}
              </span>
              <span className="line-clamp-2 text-muted-foreground">
                {s.title}
              </span>
              <span className="text-muted-foreground">
                Effective {format(parseISO(s.effectiveDate), "dd/MM/yyyy")}
              </span>
            </span>
          </Link>
        ))}
        <p className="pt-1 text-xs font-semibold text-muted-foreground">
          Internal regulation to change
        </p>
        <Link
          to={task.qdnbId ? `/qdnb/${task.qdnbId}` : "/library?type=qdnb"}
          className="flex items-start gap-2 rounded-lg border border-border p-2 text-xs hover:bg-muted/50"
        >
          <BookMarked className="mt-0.5 size-3.5 shrink-0" />
          <span className="min-w-0">
            <span className="block font-mono font-semibold">
              {task.qdnbCode}
            </span>
            <span className="line-clamp-2 text-muted-foreground">
              {task.qdnbTitle}
            </span>
          </span>
        </Link>
      </CardContent>
    </Card>
  );
}

function DeadlineChangesCard({ task }: { task: RevisionTask }) {
  const { role } = useAuthStore();
  const canRequest =
    !!role && OWNER_ROLES.department.includes(role) && task.status !== "issued";
  const canDecide = !!role && OWNER_ROLES.compliance.includes(role);
  const request = useRequestDeadlineChange();
  const decide = useDecideDeadlineChange();
  const [open, setOpen] = useState(false);
  const [to, setTo] = useState("");
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const changes = [...(task.deadlineChanges ?? [])].reverse();
  const hasPending = changes.some((c) => c.status === "pending");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarClock className="size-4" /> Deadline changes
        </CardTitle>
        <CardDescription>Who asked, who approved</CardDescription>
        {canRequest && !hasPending && (
          <CardAction>
            <Button size="sm" variant="outline" onClick={() => setOpen(!open)}>
              Request change
            </Button>
          </CardAction>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {open && (
          <div className="space-y-2 rounded-lg border border-border p-3">
            <Label htmlFor="dc-to" className="text-xs">
              New deadline (now{" "}
              {format(parseISO(task.committedDate), "dd/MM/yyyy")})
            </Label>
            <Input
              id="dc-to"
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="h-9"
            />
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason"
              className="min-h-14"
            />
            <Button
              size="sm"
              disabled={!to || !reason.trim() || request.isPending}
              onClick={() =>
                request.mutate(
                  {
                    id: task.id,
                    to: new Date(to).toISOString(),
                    reason,
                  },
                  {
                    onSuccess: () => {
                      toast.success("Request sent to Compliance");
                      setOpen(false);
                      setTo("");
                      setReason("");
                    },
                  },
                )
              }
            >
              <Send className="size-4" /> Send request
            </Button>
          </div>
        )}
        {changes.length === 0 && !open && (
          <p className="text-xs text-muted-foreground">
            The deadline has not been changed.
          </p>
        )}
        {changes.map((c) => (
          <div
            key={c.id}
            className={cn(
              "space-y-1 rounded-lg border p-2.5 text-xs",
              c.status === "pending" && "border-warning/50 bg-warning-bg/40",
              c.status === "approved" && "border-border",
              c.status === "rejected" && "border-border opacity-80",
            )}
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold">
                {format(parseISO(c.from), "dd/MM/yyyy")} →{" "}
                {format(parseISO(c.to), "dd/MM/yyyy")}
              </span>
              <ToneBadge
                tone={
                  c.status === "pending"
                    ? "warning"
                    : c.status === "approved"
                      ? "success"
                      : "danger"
                }
              >
                {c.status === "pending"
                  ? "Pending"
                  : c.status === "approved"
                    ? "Approved"
                    : "Rejected"}
              </ToneBadge>
            </div>
            <p className="text-muted-foreground">
              Asked by {c.requestedBy} ({c.requestedByUnit}) ·{" "}
              {format(parseISO(c.requestedAt), "dd/MM/yyyy")}
            </p>
            <p>“{c.reason}”</p>
            {c.decidedBy && (
              <p className="text-muted-foreground">
                {c.status === "approved" ? "Approved" : "Rejected"} by{" "}
                {c.decidedBy}
                {c.decidedAt
                  ? ` · ${format(parseISO(c.decidedAt), "dd/MM/yyyy")}`
                  : ""}
                {c.decisionNote ? ` — ${c.decisionNote}` : ""}
              </p>
            )}
            {c.status === "pending" && canDecide && (
              <div className="space-y-2 pt-1">
                <Input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Decision note (optional)"
                  className="h-8 text-xs"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    disabled={decide.isPending}
                    onClick={() =>
                      decide.mutate(
                        {
                          id: task.id,
                          changeId: c.id,
                          decision: "approved",
                          note,
                        },
                        {
                          onSuccess: () => {
                            toast.success("New deadline approved");
                            setNote("");
                          },
                        },
                      )
                    }
                  >
                    <Check className="size-3.5" /> Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={decide.isPending}
                    onClick={() =>
                      decide.mutate(
                        {
                          id: task.id,
                          changeId: c.id,
                          decision: "rejected",
                          note,
                        },
                        {
                          onSuccess: () => {
                            toast.success("Request rejected");
                            setNote("");
                          },
                        },
                      )
                    }
                  >
                    <X className="size-3.5" /> Reject
                  </Button>
                </div>
              </div>
            )}
            {c.status === "pending" && !canDecide && (
              <p className="text-muted-foreground italic">
                Waiting for Compliance to decide.
              </p>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
