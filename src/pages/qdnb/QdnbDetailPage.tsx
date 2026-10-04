import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion } from "motion/react";
import { format, parseISO } from "date-fns";
import {
  ArrowLeft,
  BellRing,
  Building2,
  CalendarCheck,
  CalendarClock,
  CheckCircle2,
  FileCheck2,
  GitCompare,
  Play,
  RotateCcw,
  Scale,
  Send,
  ShieldCheck,
  User,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { PageHero } from "@/components/common";
import { DetailSkeleton } from "@/components/common/Skeletons";
import { ErrorState } from "@/components/common/ErrorState";
import {
  Callout,
  DiffView,
  EntityHistory,
  EscalationPanel,
  Fact,
  FileNamePicker,
  RevisionHealthBadge,
  RfqChip,
  StepBar,
  ToneBadge,
  type StepItem,
} from "@/components/cms";
import { useQdnb } from "@/hooks/queries";
import {
  useAdvanceRevision,
  useIssueRevision,
  useUpdateRevision,
} from "@/hooks/mutations";
import { useAuthStore, demoNow } from "@/stores";
import { hasPermission } from "@/constants/rbac";
import {
  MAPPING_ACTION_LABELS,
  REVISION_STATUS_LABELS,
  REVISION_STATUS_VI,
  REVISION_STATUSES,
  daysUntil,
  getRevisionHealth,
} from "@/lib/cms-rules";
import { cn } from "@/lib/utils";
import type { RevisionTask } from "@/types";

export default function QdnbDetailPage() {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isPending, isError, refetch } = useQdnb(id);
  const [tab, setTab] = useState("revision");

  if (isPending) return <DetailSkeleton />;
  if (isError || !data) return <ErrorState onRetry={() => refetch()} />;

  const { regulation: q, revisions, legalUpdates } = data;
  const active = revisions.find((r) => r.id === q.activeRevisionId);
  const latestDone = [...revisions]
    .filter((r) => r.status === "issued")
    .sort((a, b) => (b.issuedAt ?? "").localeCompare(a.issuedAt ?? ""))[0];
  const shown = active ?? latestDone;

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
        onClick={() => navigate("/qdnb")}
        className="-ml-2 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to Internal Regulations
      </Button>

      <PageHero
        title={q.title}
        subtitle={`${q.code} · ${q.docType} · signed by ${q.issuingLevel} · version ${q.currentVersion}`}
      >
        <div className="flex flex-wrap items-center gap-2">
          {active ? (
            <RevisionHealthBadge health={getRevisionHealth(active)} />
          ) : (
            <ToneBadge tone="success" icon={CheckCircle2}>
              Current — no revision pending
            </ToneBadge>
          )}
          <RfqChip code="2.2" />
        </div>
      </PageHero>

      <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Fact icon={Building2} label="Owner unit" value={q.ownerUnitName} />
        <Fact icon={ShieldCheck} label="Field" value={q.field} />
        <Fact
          icon={CalendarCheck}
          label="Current version issued"
          value={format(
            parseISO(q.versions[q.versions.length - 1].issuedAt),
            "dd/MM/yyyy",
          )}
        />
        <Fact
          icon={Scale}
          label="Based on"
          value={
            <span className="font-mono text-xs">{q.basedOn.join(", ")}</span>
          }
        />
      </dl>

      <Tabs value={tab} onValueChange={setTab} defaultValue="revision">
        <TabsList className="flex-wrap">
          <TabsTrigger value="revision">
            Revision {active ? "in progress" : ""}
          </TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="mapping">Mapping (laws)</TabsTrigger>
          <TabsTrigger value="versions">Versions & compare</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="revision" className="pt-2">
          {shown ? (
            <RevisionWorkspace task={shown} />
          ) : (
            <Callout tone="success" title="No revision required">
              No new law currently requires this regulation to change. When a
              legal update is mapped to it, the revision will appear here.
            </Callout>
          )}
        </TabsContent>

        <TabsContent value="content" className="pt-2">
          <Card>
            <CardHeader>
              <CardTitle>
                Current content — version {q.currentVersion}
              </CardTitle>
              <CardDescription>
                {q.versions[q.versions.length - 1].decisionNo}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {q.versions[q.versions.length - 1].articles.map((a) => (
                <div
                  key={a.number}
                  className="rounded-lg border border-border p-3"
                >
                  <p className="text-sm font-semibold">
                    {a.number}. {a.title}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {a.content}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mapping" className="pt-2">
          <Card>
            <CardHeader>
              <CardTitle>Laws that affect this regulation</CardTitle>
              <CardDescription>From Legal Mapping (RFQ 1.2)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {legalUpdates.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No mapped legal updates.
                </p>
              )}
              {legalUpdates.map((lu) => {
                const m = lu.mappings.find((x) => x.qdnbId === q.id)!;
                return (
                  <Link
                    key={lu.id}
                    to={`/legal-updates/${lu.id}`}
                    className="block rounded-lg border border-border p-3 hover:bg-muted/50"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-semibold">
                        {lu.docType} {lu.docNumber}
                      </span>
                      <ToneBadge
                        tone={m.status === "accepted" ? "success" : "ai"}
                      >
                        {m.status === "accepted"
                          ? "Confirmed"
                          : "AI suggestion"}
                      </ToneBadge>
                      <span className="text-xs text-muted-foreground">
                        {MAPPING_ACTION_LABELS[m.action]}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-1 text-sm">{lu.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Law articles {m.lawArticles.join(", ")} →{" "}
                      {m.qdnbArticles ?? "to be determined"} · effective{" "}
                      {format(parseISO(lu.effectiveDate), "dd/MM/yyyy")}
                    </p>
                  </Link>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="versions" className="pt-2">
          <VersionsTab
            versions={
              q.draftArticles && active
                ? [
                    ...q.versions,
                    {
                      version: q.currentVersion + 1,
                      decisionNo: "Draft — in revision",
                      issuedAt: active.updatedAt,
                      changeSummary: `Draft prepared by ${active.leadUnitName} for ${active.sources.map((s) => s.docNumber).join(", ")}`,
                      articles: q.draftArticles,
                    },
                  ]
                : q.versions
            }
          />
        </TabsContent>

        <TabsContent value="history" className="pt-2">
          <Card>
            <CardHeader>
              <CardTitle>Audit trail</CardTitle>
              <CardDescription>
                Every action on this regulation's revisions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {revisions.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No revisions recorded.
                </p>
              )}
              {revisions.map((r) => (
                <div key={r.id}>
                  <p className="mb-2 text-xs font-semibold text-muted-foreground">
                    {r.code} · {REVISION_STATUS_LABELS[r.status]}
                  </p>
                  <EntityHistory entityId={r.id} />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}

function RevisionWorkspace({ task }: { task: RevisionTask }) {
  const { role } = useAuthStore();
  const canUpdate = hasPermission(role, "qdnb:update");
  const canApprove = hasPermission(role, "qdnb:approve");
  const isCompliance = role === "owner" || role === "admin";
  const advance = useAdvanceRevision();
  const update = useUpdateRevision();
  const [comment, setComment] = useState("");
  const [issueOpen, setIssueOpen] = useState(false);
  const [progress, setProgress] = useState(task.progress);
  const [forecast, setForecast] = useState(task.expectedIssueDate.slice(0, 10));

  useEffect(() => {
    setProgress(task.progress);
    setForecast(task.expectedIssueDate.slice(0, 10));
  }, [task.progress, task.expectedIssueDate]);

  const now = demoNow();
  const health = getRevisionHealth(task, now);
  const daysToDeadline = daysUntil(task.committedDate, now);
  const daysToLaw = daysUntil(task.lawEffectiveDate, now);
  const statusIdx = REVISION_STATUSES.indexOf(task.status);
  const steps: StepItem[] = REVISION_STATUSES.map((s, i) => ({
    key: s,
    label: REVISION_STATUS_LABELS[s],
    hint: REVISION_STATUS_VI[s],
    state:
      task.status === "issued" || i < statusIdx
        ? "done"
        : i === statusIdx
          ? task.approvalSteps.some((a) => a.state === "returned") &&
            s === "in_revision"
            ? "returned"
            : "current"
          : "pending",
  }));
  const reviewStep = task.approvalSteps.find(
    (s) => s.key === "compliance_review",
  );
  const approvalStep = task.approvalSteps.find((s) => s.key === "approval");
  const issuedStep = task.approvalSteps.find((s) => s.key === "issued");

  const act = (
    action: "start" | "submit" | "approve" | "return",
    msg: string,
  ) =>
    advance.mutate(
      { id: task.id, action, comment: comment.trim() || undefined },
      {
        onSuccess: () => {
          toast.success(msg);
          setComment("");
        },
      },
    );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-2">
            {task.code} · {MAPPING_ACTION_LABELS[task.action]}
            <RevisionHealthBadge health={health} />
          </CardTitle>
          <CardDescription>
            Because of {task.sources.map((s) => `${s.docNumber}`).join(", ")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <StepBar steps={steps} />

          {health === "overdue" && (
            <Callout
              tone="danger"
              title={`Overdue by ${-daysToDeadline} day(s)`}
            >
              The committed date{" "}
              {format(parseISO(task.committedDate), "dd/MM/yyyy")} has passed.
              {daysToLaw < 0 &&
                ` The law has been in force for ${-daysToLaw} day(s) — the bank is exposed until the regulation is issued.`}{" "}
              Escalation follows the overdue rules.
            </Callout>
          )}
          {health === "late_risk" && (
            <Callout tone="warning" title="Risk of late issuance">
              Forecast issue date{" "}
              {format(parseISO(task.expectedIssueDate), "dd/MM/yyyy")} is after
              {parseISO(task.expectedIssueDate) >
              parseISO(task.lawEffectiveDate)
                ? ` the law's effective date (${format(parseISO(task.lawEffectiveDate), "dd/MM/yyyy")})`
                : ` the committed date (${format(parseISO(task.committedDate), "dd/MM/yyyy")})`}
              {task.progress < 60 && daysToDeadline <= 14
                ? `, and only ${task.progress}% is done with ${daysToDeadline} day(s) left`
                : ""}
              .
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
            <Fact
              icon={User}
              label="Responsible officer"
              value={task.ownerName}
            />
            <Fact
              icon={CalendarClock}
              label="Committed date"
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
              icon={BellRing}
              label="Reminders sent"
              value={task.reminders.length}
            />
          </dl>

          {task.status !== "issued" && canUpdate && (
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
                      {
                        onSuccess: () =>
                          toast.success(
                            "Progress updated — dashboard refreshed",
                          ),
                      },
                    )
                  }
                >
                  Update progress
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Approval flow</CardTitle>
            <CardDescription>
              Draft → Compliance review → Approval → Issued with proof
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ol className="space-y-2">
              {task.approvalSteps.map((s) => (
                <li
                  key={s.key}
                  className={cn(
                    "flex items-start gap-3 rounded-lg border p-3",
                    s.state === "done" && "border-success/30 bg-success-bg/40",
                    s.state === "current" &&
                      "border-primary/40 bg-primary/[0.05]",
                    s.state === "returned" &&
                      "border-warning/40 bg-warning-bg/40",
                    s.state === "pending" && "border-border",
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 size-2.5 shrink-0 rounded-full",
                      s.state === "done"
                        ? "bg-success"
                        : s.state === "current"
                          ? "bg-primary"
                          : s.state === "returned"
                            ? "bg-warning"
                            : "bg-muted-foreground/30",
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{s.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {s.state === "done" &&
                        `Done${s.by ? ` by ${s.by}` : ""}${s.at ? ` · ${format(parseISO(s.at), "dd/MM/yyyy HH:mm")}` : ""}`}
                      {s.state === "current" && "In progress"}
                      {s.state === "returned" &&
                        `Returned${s.by ? ` by ${s.by}` : ""}`}
                      {s.state === "pending" && "Waiting"}
                    </p>
                    {s.comment && (
                      <p className="mt-1 text-xs italic">“{s.comment}”</p>
                    )}
                  </div>
                </li>
              ))}
            </ol>

            {task.status !== "issued" && (
              <div className="space-y-2 border-t border-border pt-4">
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Comment (optional) — recorded in the audit trail"
                  className="min-h-14"
                />
                <div className="flex flex-wrap gap-2">
                  {task.status === "not_started" && canUpdate && (
                    <Button
                      onClick={() => act("start", "Revision started")}
                      disabled={advance.isPending}
                    >
                      <Play className="size-4" /> Start revision
                    </Button>
                  )}
                  {task.status === "in_revision" && canUpdate && (
                    <Button
                      onClick={() =>
                        act(
                          "submit",
                          "Draft submitted to Compliance for review",
                        )
                      }
                      disabled={advance.isPending}
                    >
                      <Send className="size-4" /> Submit draft for review
                    </Button>
                  )}
                  {task.status === "pending_approval" &&
                    reviewStep?.state === "current" &&
                    isCompliance && (
                      <>
                        <Button
                          onClick={() =>
                            act(
                              "approve",
                              "Compliance review passed — sent for approval",
                            )
                          }
                          disabled={advance.isPending}
                        >
                          <CheckCircle2 className="size-4" /> Compliance: OK,
                          send for approval
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() =>
                            act("return", "Draft returned to the lead unit")
                          }
                          disabled={advance.isPending}
                        >
                          <RotateCcw className="size-4" /> Return for changes
                        </Button>
                      </>
                    )}
                  {task.status === "pending_approval" &&
                    approvalStep?.state === "current" &&
                    canApprove && (
                      <Button
                        onClick={() =>
                          act(
                            "approve",
                            "Approved — record the issuance to close the revision",
                          )
                        }
                        disabled={advance.isPending}
                      >
                        <CheckCircle2 className="size-4" /> Approve
                      </Button>
                    )}
                  {task.status === "pending_approval" &&
                    issuedStep?.state === "current" &&
                    canUpdate && (
                      <Button onClick={() => setIssueOpen(true)}>
                        <FileCheck2 className="size-4" /> Record issuance
                        (proof)
                      </Button>
                    )}
                  {task.status === "pending_approval" &&
                    reviewStep?.state === "current" &&
                    !isCompliance && (
                      <p className="text-xs text-muted-foreground">
                        Waiting for Compliance review (Khối Tuân thủ).
                      </p>
                    )}
                  {task.status === "pending_approval" &&
                    approvalStep?.state === "current" &&
                    !canApprove && (
                      <p className="text-xs text-muted-foreground">
                        Waiting for approval. Switch to the Approver or
                        Executive role to approve.
                      </p>
                    )}
                </div>
              </div>
            )}

            {task.evidence && (
              <Callout
                tone="success"
                icon={FileCheck2}
                title={`Issued as ${task.evidence.decisionNo}`}
              >
                Signed on{" "}
                {format(parseISO(task.evidence.issueDate), "dd/MM/yyyy")},
                effective{" "}
                {format(parseISO(task.evidence.effectiveDate), "dd/MM/yyyy")}.
                Proof:{" "}
                <span className="font-medium text-foreground">
                  {task.evidence.fileName}
                </span>{" "}
                · recorded by {task.evidence.recordedBy}.
              </Callout>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
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
              <CardTitle>Reminders</CardTitle>
              <CardAction>
                <Badge variant="secondary">{task.reminders.length}</Badge>
              </CardAction>
            </CardHeader>
            <CardContent>
              <p className="mb-2 text-xs text-muted-foreground">
                Schedule: 30, 14, 7 and 1 day(s) before the deadline, then daily
                when overdue.
              </p>
              <ol className="space-y-1.5">
                {[...task.reminders].reverse().map((r) => (
                  <li key={r.id} className="flex items-center gap-2 text-xs">
                    <span
                      className={cn(
                        "rounded px-1.5 py-0.5 font-semibold",
                        r.kind.startsWith("Overdue")
                          ? "bg-danger-bg text-danger"
                          : r.kind === "Late risk"
                            ? "bg-warning-bg text-warning"
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
        </div>
      </div>

      <IssueSheet task={task} open={issueOpen} onOpenChange={setIssueOpen} />
    </div>
  );
}

function IssueSheet({
  task,
  open,
  onOpenChange,
}: {
  task: RevisionTask;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const issue = useIssueRevision();
  const today = format(demoNow(), "yyyy-MM-dd");
  const year = demoNow().getFullYear();
  const num = task.qdnbCode.split(" ")[1]?.split("/")[0] ?? "0001";
  const suffix = task.qdnbCode.split("/").pop();
  const [decisionNo, setDecisionNo] = useState(`QĐ ${num}/${year}/${suffix}`);
  const [issueDate, setIssueDate] = useState(today);
  const [effectiveDate, setEffectiveDate] = useState(today);
  const [files, setFiles] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const valid =
    decisionNo.trim() && issueDate && effectiveDate && files.length > 0;
  const lateVsLaw =
    issueDate && new Date(issueDate) > parseISO(task.lawEffectiveDate);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Record issuance — proof of completion</SheetTitle>
          <SheetDescription>
            Required to move {task.qdnbCode} to “Issued” (RFQ 2.2 — lưu trữ bằng
            chứng hoàn thành).
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 space-y-4 overflow-y-auto px-4 pb-6">
          <div className="space-y-1.5">
            <Label htmlFor="decisionNo">Issuing decision number *</Label>
            <Input
              id="decisionNo"
              value={decisionNo}
              onChange={(e) => setDecisionNo(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="issueDate">Issue date *</Label>
              <Input
                id="issueDate"
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="effDate">Effective date *</Label>
              <Input
                id="effDate"
                type="date"
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Signed document *</Label>
            <FileNamePicker
              value={files}
              onChange={setFiles}
              multiple={false}
              sampleName={`${decisionNo.replace(/[ /]/g, "_")}_signed.pdf`}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="note">Note</Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Ban hành kèm Phụ lục 2 mới"
            />
          </div>
          {lateVsLaw && (
            <Callout
              tone="warning"
              title="Issued after the law's effective date"
            >
              The law took effect on{" "}
              {format(parseISO(task.lawEffectiveDate), "dd/MM/yyyy")}; this will
              be reported as a late issuance.
            </Callout>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              disabled={!valid || issue.isPending}
              onClick={() =>
                issue.mutate(
                  {
                    id: task.id,
                    input: {
                      decisionNo: decisionNo.trim(),
                      issueDate: new Date(issueDate).toISOString(),
                      effectiveDate: new Date(effectiveDate).toISOString(),
                      fileName: files[0],
                      note: note.trim() || undefined,
                    },
                  },
                  {
                    onSuccess: () => {
                      toast.success(
                        `${decisionNo} issued — new version recorded`,
                      );
                      onOpenChange(false);
                    },
                  },
                )
              }
            >
              <FileCheck2 className="size-4" /> Mark as issued
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function VersionsTab({
  versions,
}: {
  versions: {
    version: number;
    decisionNo: string;
    issuedAt: string;
    changeSummary: string;
    articles: { number: string; title: string; content: string }[];
  }[];
}) {
  const [a, setA] = useState(Math.max(1, versions.length - 1));
  const [b, setB] = useState(versions.length);
  const va = versions.find((v) => v.version === a);
  const vb = versions.find((v) => v.version === b);
  const options = useMemo(() => versions.map((v) => v.version), [versions]);

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>Version history</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {[...versions].reverse().map((v) => (
            <div
              key={v.version}
              className="rounded-lg border border-border p-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">v{v.version}</span>
                <span className="text-xs text-muted-foreground">
                  {format(parseISO(v.issuedAt), "dd/MM/yyyy")}
                </span>
              </div>
              <p className="font-mono text-xs">{v.decisionNo}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {v.changeSummary}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitCompare className="size-4" /> Compare versions (diff check)
          </CardTitle>
          <CardDescription>
            Automatic comparison of old and new text — RFQ 5.1
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {versions.length < 2 ? (
            <p className="text-sm text-muted-foreground">
              Only one version exists.
            </p>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <select
                  value={a}
                  onChange={(e) => setA(Number(e.target.value))}
                  className="h-9 rounded-lg border border-input bg-background px-2 dark:bg-input/30"
                >
                  {options.map((o) => (
                    <option key={o} value={o}>
                      v{o}
                    </option>
                  ))}
                </select>
                <span className="text-muted-foreground">compared with</span>
                <select
                  value={b}
                  onChange={(e) => setB(Number(e.target.value))}
                  className="h-9 rounded-lg border border-input bg-background px-2 dark:bg-input/30"
                >
                  {options.map((o) => (
                    <option key={o} value={o}>
                      v{o}
                    </option>
                  ))}
                </select>
              </div>
              {va && vb && (
                <DiffView
                  before={va.articles}
                  after={vb.articles}
                  beforeLabel={`v${va.version} · ${va.decisionNo}`}
                  afterLabel={`v${vb.version} · ${vb.decisionNo}`}
                />
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
