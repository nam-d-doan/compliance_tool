import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion } from "motion/react";
import { addDays, format, parseISO, subDays } from "date-fns";
import {
  ArrowLeft,
  ArrowRight,
  BookPlus,
  Bot,
  Building2,
  CalendarClock,
  Check,
  CheckCircle2,
  CloudDownload,
  FileText,
  GitBranch,
  Landmark,
  ListChecks,
  Network,
  Plus,
  Send,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
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
  Fact,
  LEGAL_STATUS_TONE,
  RelationshipMap,
  RevisionHealthBadge,
  RfqChip,
  StepBar,
  ToneBadge,
  type StepItem,
} from "@/components/cms";
import {
  useAdminUsers,
  useLegalUpdate,
  useOrgUnits,
  useQdnbList,
  useRevisions,
} from "@/hooks/queries";
import {
  useAssignRevisions,
  useImportLegalToLibrary,
  useMarkLegalRead,
  useSaveMappings,
  useSetApplicability,
} from "@/hooks/mutations";
import { useAuthStore, demoNow } from "@/stores";
import { hasPermission } from "@/constants/rbac";
import {
  LEGAL_STATUS_LABELS,
  MAPPING_ACTION_LABELS,
  MAPPING_ACTION_SHORT,
  REMINDER_OFFSETS,
  REVISION_STATUS_LABELS,
  daysUntil,
  getRevisionHealth,
} from "@/lib/cms-rules";
import { cn } from "@/lib/utils";
import type { LegalMapping, LegalUpdate, MappingAction } from "@/types";

type StepKey =
  | "received"
  | "applicability"
  | "impact"
  | "mapping"
  | "assignment"
  | "tracking";

const STEP_ORDER: StepKey[] = [
  "received",
  "applicability",
  "impact",
  "mapping",
  "assignment",
  "tracking",
];

function currentStep(l: LegalUpdate): StepKey {
  switch (l.status) {
    case "new":
    case "under_review":
      return "applicability";
    case "not_applicable":
      return "applicability";
    case "applicable":
      return "mapping";
    case "mapped":
      return "assignment";
    default:
      return "tracking";
  }
}

export default function LegalUpdateDetailPage() {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: item, isPending, isError, refetch } = useLegalUpdate(id);
  const markRead = useMarkLegalRead();
  const [panel, setPanel] = useState<StepKey | null>(null);
  const markedRef = useRef<string | null>(null);

  useEffect(() => {
    if (item && !item.read && markedRef.current !== item.id) {
      markedRef.current = item.id;
      markRead.mutate(item.id);
    }
  }, [item]); // eslint-disable-line react-hooks/exhaustive-deps

  // Follow the workflow: when the status moves on, show the next step.
  const lastStatus = useRef<string | null>(null);
  useEffect(() => {
    if (!item) return;
    if (lastStatus.current && lastStatus.current !== item.status)
      setPanel(currentStep(item));
    lastStatus.current = item.status;
  }, [item?.status]); // eslint-disable-line react-hooks/exhaustive-deps

  if (isPending) return <DetailSkeleton />;
  if (isError || !item) return <ErrorState onRetry={() => refetch()} />;

  const cur = currentStep(item);
  const active = panel ?? cur;
  const curIdx = STEP_ORDER.indexOf(cur);
  const notApplicable = item.status === "not_applicable";
  const completed = item.status === "completed";

  const steps: StepItem[] = [
    {
      key: "received",
      label: "Received",
      hint:
        item.channel === "auto_feed"
          ? "Auto intake"
          : item.channel === "ocr"
            ? "OCR upload"
            : "Manual",
    },
    {
      key: "applicability",
      label: "Applicability",
      hint: item.applicability
        ? item.applicability.decision === "applicable"
          ? "Applicable"
          : "Not applicable"
        : "To decide",
    },
    {
      key: "impact",
      label: "Impact & AI summary",
      hint: `${item.aiSummary.confidence}% confidence`,
    },
    {
      key: "mapping",
      label: "Legal mapping",
      hint: `${item.mappings.filter((m) => m.status === "accepted").length} QĐNB confirmed`,
    },
    {
      key: "assignment",
      label: "Assignment",
      hint: `${item.revisionTaskIds.length} task(s)`,
    },
    {
      key: "tracking",
      label: "Tracking",
      hint: completed ? "Completed" : "Until issuance",
    },
  ].map((s, i) => ({
    ...s,
    key: s.key,
    state: completed
      ? "done"
      : notApplicable
        ? i <= 1
          ? "done"
          : "pending"
        : i < curIdx || (s.key === "impact" && curIdx >= 2)
          ? "done"
          : i === curIdx
            ? "current"
            : "pending",
  })) as StepItem[];

  const effDays = daysUntil(item.effectiveDate);

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
        onClick={() => navigate("/legal-updates")}
        className="-ml-2 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to Legal Updates
      </Button>

      <PageHero
        title={`${item.docType} ${item.docNumber}`}
        subtitle={item.title}
      >
        <div className="flex flex-wrap items-center gap-2">
          <ToneBadge tone={LEGAL_STATUS_TONE[item.status]}>
            {LEGAL_STATUS_LABELS[item.status]}
          </ToneBadge>
          <span className="font-mono text-xs text-muted-foreground">
            {item.code}
          </span>
          <RfqChip code="1.1–1.3" />
        </div>
      </PageHero>

      <StepBar steps={steps} onStepClick={(k) => setPanel(k as StepKey)} />

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-4">
          {active === "received" && <ReceivedPanel item={item} />}
          {active === "applicability" && (
            <ApplicabilityPanel item={item} onNext={() => setPanel("impact")} />
          )}
          {active === "impact" && (
            <ImpactPanel item={item} onNext={() => setPanel("mapping")} />
          )}
          {active === "mapping" && <MappingPanel item={item} />}
          {active === "assignment" && <AssignmentPanel item={item} />}
          {active === "tracking" && <TrackingPanel item={item} />}
        </div>

        <aside className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Key dates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Issuer</span>
                <span className="font-medium">{item.issuer}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Issued</span>
                <span>{format(parseISO(item.issueDate), "dd/MM/yyyy")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Effective</span>
                <span className="font-semibold">
                  {format(parseISO(item.effectiveDate), "dd/MM/yyyy")}
                </span>
              </div>
              <div
                className={cn(
                  "rounded-lg p-2 text-center text-sm font-semibold",
                  effDays < 0
                    ? "bg-danger-bg text-danger"
                    : effDays <= 30
                      ? "bg-warning-bg text-warning"
                      : "bg-muted",
                )}
              >
                {effDays < 0
                  ? `In force for ${-effDays} day(s)`
                  : `${effDays} day(s) until it takes effect`}
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Received</span>
                <span>
                  {format(parseISO(item.receivedAt), "dd/MM/yyyy HH:mm")}
                </span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">History</CardTitle>
            </CardHeader>
            <CardContent>
              <EntityHistory entityId={item.id} />
            </CardContent>
          </Card>
        </aside>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------

function ReceivedPanel({ item }: { item: LegalUpdate }) {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CloudDownload className="size-4" /> Received document
          </CardTitle>
          <CardDescription>
            {item.channel === "auto_feed"
              ? "Received automatically"
              : item.channel === "ocr"
                ? "Extracted by OCR"
                : "Imported manually"}{" "}
            from {item.sourceName}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <dl className="grid gap-3 sm:grid-cols-3">
            <Fact icon={Landmark} label="Issuer" value={item.issuer} />
            <Fact icon={FileText} label="Type" value={item.docType} />
            <Fact icon={Sparkles} label="AI field" value={item.field} />
          </dl>
          <p className="text-sm text-muted-foreground">{item.summary}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Articles ({item.articles.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {item.articles.map((a) => (
            <div key={a.id} className="rounded-lg border border-border p-3">
              <p className="text-sm font-semibold">
                {a.number}. {a.title}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{a.content}</p>
            </div>
          ))}
        </CardContent>
      </Card>
      {item.relations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GitBranch className="size-4" /> Family tree (Lược đồ văn bản)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {item.relations.map((r) => (
              <div
                key={r.docNumber}
                className="flex items-center gap-2 text-sm"
              >
                <ToneBadge
                  tone={
                    r.type === "replaces" || r.type === "repeals"
                      ? "danger"
                      : r.type === "amends"
                        ? "warning"
                        : "info"
                  }
                >
                  {r.type.replace("_", " ")}
                </ToneBadge>
                <span className="font-mono text-xs font-semibold">
                  {r.docNumber}
                </span>
                <span className="truncate text-muted-foreground">
                  {r.title}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </>
  );
}

function ApplicabilityPanel({
  item,
  onNext,
}: {
  item: LegalUpdate;
  onNext: () => void;
}) {
  const { role } = useAuthStore();
  const canReview = hasPermission(role, "legal:review");
  const setApp = useSetApplicability(item.id);
  const importLib = useImportLegalToLibrary();
  const [reason, setReason] = useState("");
  const decided = item.applicability;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Does this document apply to Nam A Bank?</CardTitle>
        <CardDescription>
          Compliance decides; AI gives a first assessment.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Callout
          tone="ai"
          title={`AI relevance: ${item.relevance.toUpperCase()} (${item.relevanceScore}/100)`}
        >
          {item.relevanceReason}
        </Callout>
        {decided ? (
          <Callout
            tone={decided.decision === "applicable" ? "success" : "info"}
            icon={decided.decision === "applicable" ? CheckCircle2 : X}
            title={
              decided.decision === "applicable"
                ? "Marked Applicable"
                : "Marked Not applicable"
            }
          >
            {decided.reason} — {decided.decidedBy},{" "}
            {format(parseISO(decided.decidedAt), "dd/MM/yyyy HH:mm")}
          </Callout>
        ) : canReview ? (
          <div className="space-y-3">
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason (recorded in the audit trail)"
              className="min-h-16"
            />
            <div className="flex flex-wrap gap-2">
              <Button
                disabled={setApp.isPending}
                onClick={() =>
                  setApp.mutate(
                    {
                      decision: "applicable",
                      reason: reason.trim() || item.relevanceReason,
                    },
                    {
                      onSuccess: () =>
                        toast.success(
                          "Marked Applicable — continue with the legal mapping",
                        ),
                    },
                  )
                }
              >
                <ThumbsUp className="size-4" /> Applicable
              </Button>
              <Button
                variant="outline"
                disabled={setApp.isPending || !reason.trim()}
                onClick={() =>
                  setApp.mutate(
                    { decision: "not_applicable", reason: reason.trim() },
                    {
                      onSuccess: () =>
                        toast.success("Marked Not applicable and archived"),
                    },
                  )
                }
              >
                <ThumbsDown className="size-4" /> Not applicable
              </Button>
              {item.status === "new" && (
                <Button
                  variant="ghost"
                  disabled={setApp.isPending}
                  onClick={() =>
                    setApp.mutate(
                      { decision: "under_review" },
                      { onSuccess: () => toast.info("Review started") },
                    )
                  }
                >
                  Start review later
                </Button>
              )}
            </div>
            {!reason.trim() && (
              <p className="text-xs text-muted-foreground">
                A reason is required for “Not applicable”.
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Waiting for Compliance (Khối Tuân thủ) to decide. Switch to the
            Owner role to act.
          </p>
        )}

        {decided?.decision === "applicable" && (
          <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
            <Button variant="outline" onClick={onNext}>
              See AI impact summary <ArrowRight className="size-4" />
            </Button>
            {item.regulationId ? (
              <Button variant="ghost" asChild>
                <Link to={`/regulation/${item.regulationId}`}>
                  <BookPlus className="size-4" /> Open in Regulation Library
                </Link>
              </Button>
            ) : (
              canReview && (
                <Button
                  variant="ghost"
                  disabled={importLib.isPending}
                  onClick={() =>
                    importLib.mutate(item.id, {
                      onSuccess: () =>
                        toast.success(
                          "Added to the Regulation Library — obligations can now be created from it",
                        ),
                    })
                  }
                >
                  <BookPlus className="size-4" /> Add to Regulation Library
                </Button>
              )
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ImpactPanel({
  item,
  onNext,
}: {
  item: LegalUpdate;
  onNext: () => void;
}) {
  const s = item.aiSummary;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="size-4" /> AI compliance impact summary
        </CardTitle>
        <CardDescription>
          Generated from the full text · confidence {s.confidence}% · RFQ 5.2
        </CardDescription>
        <CardAction>
          <RfqChip code="5.2" />
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-4">
        <Callout tone="ai" title="Impact for Nam A Bank">
          {s.impactNote}
        </Callout>
        <div>
          <p className="mb-2 text-xs font-semibold text-muted-foreground uppercase">
            Key changes
          </p>
          <ol className="space-y-2">
            {s.keyChanges.map((k, i) => (
              <li
                key={k}
                className="flex items-start gap-3 rounded-lg border border-border p-2.5 text-sm"
              >
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-orange-500/15 text-xs font-bold text-orange-600">
                  {i + 1}
                </span>
                {k}
              </li>
            ))}
          </ol>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-lg border border-border p-3">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <Building2 className="size-3.5" /> Affected units
            </p>
            <div className="flex flex-wrap gap-1.5">
              {s.affectedUnits.map((u) => (
                <span
                  key={u}
                  className="rounded-md bg-muted px-2 py-0.5 text-xs"
                >
                  {u}
                </span>
              ))}
              {!s.affectedUnits.length && (
                <span className="text-xs text-muted-foreground">None</span>
              )}
            </div>
          </div>
          <div className="rounded-lg border border-border p-3">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <ListChecks className="size-3.5" /> Affected products
            </p>
            <div className="flex flex-wrap gap-1.5">
              {s.affectedProducts.map((u) => (
                <span
                  key={u}
                  className="rounded-md bg-muted px-2 py-0.5 text-xs"
                >
                  {u}
                </span>
              ))}
              {!s.affectedProducts.length && (
                <span className="text-xs text-muted-foreground">None</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted/40 p-3 text-sm">
          <span className="flex items-center gap-2">
            <CalendarClock className="size-4" /> Suggested internal deadline:{" "}
            <b>{format(parseISO(s.suggestedDeadline), "dd/MM/yyyy")}</b> (before
            the effective date)
          </span>
          {item.status !== "not_applicable" && (
            <Button size="sm" onClick={onNext}>
              Go to legal mapping <ArrowRight className="size-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function MappingPanel({ item }: { item: LegalUpdate }) {
  const { role } = useAuthStore();
  const canEdit =
    hasPermission(role, "legal:review") &&
    ["applicable", "under_review", "new", "mapped"].includes(item.status);
  const save = useSaveMappings(item.id);
  const qdnbQuery = useQdnbList();
  const unitsQuery = useOrgUnits();
  const [mappings, setMappings] = useState<LegalMapping[]>(item.mappings);
  const [focus, setFocus] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [newQdnb, setNewQdnb] = useState("");
  const [newAction, setNewAction] = useState<MappingAction>("amend");
  const [newArticles, setNewArticles] = useState<string[]>([]);

  useEffect(() => setMappings(item.mappings), [item.mappings]);

  const unitNames = useMemo(
    () =>
      Object.fromEntries(
        (unitsQuery.data?.allUnits ?? []).map((u) => [u.id, u.name]),
      ),
    [unitsQuery.data],
  );
  const focused = mappings.find((m) => m.id === focus);
  const accepted = mappings.filter((m) => m.status === "accepted").length;
  const dirty = JSON.stringify(mappings) !== JSON.stringify(item.mappings);
  const needsApplicability =
    item.status === "new" || item.status === "under_review";

  const update = (id: string, patch: Partial<LegalMapping>) =>
    setMappings((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    );

  const addManual = () => {
    const q = qdnbQuery.data?.find((x) => x.id === newQdnb);
    if (!q || !newArticles.length) return;
    setMappings((prev) => [
      ...prev,
      {
        id: `m-man-${Date.now()}`,
        qdnbId: q.id,
        qdnbCode: q.code,
        qdnbTitle: q.title,
        lawArticles: newArticles,
        action: newAction,
        origin: "manual",
        status: "accepted",
        reason: "Added manually by Compliance",
        leadUnitId: q.ownerUnitId,
      },
    ]);
    setAddOpen(false);
    setNewQdnb("");
    setNewArticles([]);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="size-4" /> Legal mapping — which internal
            regulations must change?
          </CardTitle>
          <CardDescription>
            AI links the new law to Nam A Bank's QĐNB; Compliance confirms. RFQ
            1.2
          </CardDescription>
          <CardAction className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowMap((v) => !v)}
            >
              {showMap ? "Hide" : "Show"} relationship map
            </Button>
            <Button size="sm" variant="outline" asChild>
              <Link to="/legal-mapping">
                <Network className="size-3.5" /> Open full Legal Mapping
              </Link>
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="space-y-4">
          {needsApplicability && (
            <Callout tone="warning" title="Decide applicability first">
              Mark the document Applicable before confirming the mapping.
            </Callout>
          )}
          {showMap && (
            <RelationshipMap
              update={{ ...item, mappings }}
              unitNames={unitNames}
            />
          )}

          <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase">
                New law — articles
              </p>
              {item.articles.map((a) => {
                const hit = focused?.lawArticles.includes(a.number);
                return (
                  <div
                    key={a.id}
                    className={cn(
                      "rounded-lg border p-2.5 text-sm transition-colors",
                      hit
                        ? "border-primary bg-chart-accent/15"
                        : "border-border",
                    )}
                  >
                    <p className="text-xs font-semibold">
                      {a.number}. {a.title}
                    </p>
                    <p className="mt-0.5 line-clamp-3 text-xs text-muted-foreground">
                      {a.content}
                    </p>
                  </div>
                );
              })}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-muted-foreground uppercase">
                  Affected internal regulations
                </p>
                {canEdit && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7"
                    onClick={() => setAddOpen((v) => !v)}
                  >
                    <Plus className="size-3.5" /> Add QĐNB manually
                  </Button>
                )}
              </div>
              {addOpen && (
                <div className="space-y-2 rounded-lg border border-dashed border-primary/50 p-3">
                  <select
                    value={newQdnb}
                    onChange={(e) => setNewQdnb(e.target.value)}
                    className="h-9 w-full rounded-lg border border-input bg-background px-2 text-sm dark:bg-input/30"
                  >
                    <option value="">Choose an internal regulation…</option>
                    {qdnbQuery.data?.map((q) => (
                      <option key={q.id} value={q.id}>
                        {q.code} — {q.title}
                      </option>
                    ))}
                  </select>
                  <div className="flex flex-wrap gap-1.5">
                    {item.articles.map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() =>
                          setNewArticles((p) =>
                            p.includes(a.number)
                              ? p.filter((x) => x !== a.number)
                              : [...p, a.number],
                          )
                        }
                        className={cn(
                          "rounded-md border px-2 py-0.5 text-xs",
                          newArticles.includes(a.number)
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border",
                        )}
                      >
                        {a.number}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={newAction}
                      onChange={(e) =>
                        setNewAction(e.target.value as MappingAction)
                      }
                      className="h-9 flex-1 rounded-lg border border-input bg-background px-2 text-sm dark:bg-input/30"
                    >
                      {(
                        Object.keys(MAPPING_ACTION_LABELS) as MappingAction[]
                      ).map((a) => (
                        <option key={a} value={a}>
                          {MAPPING_ACTION_LABELS[a]}
                        </option>
                      ))}
                    </select>
                    <Button
                      size="sm"
                      className="h-9"
                      disabled={!newQdnb || !newArticles.length}
                      onClick={addManual}
                    >
                      Add
                    </Button>
                  </div>
                </div>
              )}
              {mappings.map((m) => (
                <div
                  key={m.id}
                  onMouseEnter={() => setFocus(m.id)}
                  onMouseLeave={() => setFocus(null)}
                  className={cn(
                    "rounded-xl border p-3 transition-colors",
                    m.status === "accepted" &&
                      "border-success/40 bg-success-bg/30",
                    m.status === "rejected" && "border-border opacity-55",
                    m.status === "suggested" &&
                      "border-violet-500/40 bg-violet-500/[0.04]",
                  )}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-semibold">
                      {m.qdnbCode}
                    </span>
                    {m.origin === "ai" ? (
                      <ToneBadge tone="ai" icon={Sparkles}>
                        AI {m.confidence}%
                      </ToneBadge>
                    ) : (
                      <ToneBadge tone="neutral">Manual</ToneBadge>
                    )}
                    <span className="ml-auto text-[11px] text-muted-foreground">
                      Law {m.lawArticles.join(", ")}
                    </span>
                  </div>
                  <p className="mt-1 text-sm font-medium">{m.qdnbTitle}</p>
                  {m.reason && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {m.reason}
                    </p>
                  )}
                  {m.origin === "ai" && m.confidence !== undefined && (
                    <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-violet-500"
                        style={{ width: `${m.confidence}%` }}
                      />
                    </div>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <select
                      disabled={!canEdit}
                      value={m.action}
                      onChange={(e) =>
                        update(m.id, {
                          action: e.target.value as MappingAction,
                        })
                      }
                      className="h-8 rounded-lg border border-input bg-background px-2 text-xs dark:bg-input/30"
                    >
                      {(
                        Object.keys(MAPPING_ACTION_LABELS) as MappingAction[]
                      ).map((a) => (
                        <option key={a} value={a}>
                          {MAPPING_ACTION_LABELS[a]}
                        </option>
                      ))}
                    </select>
                    <Input
                      disabled={!canEdit}
                      value={m.qdnbArticles ?? ""}
                      onChange={(e) =>
                        update(m.id, { qdnbArticles: e.target.value })
                      }
                      placeholder="QĐNB articles affected"
                      className="h-8 w-44 text-xs"
                    />
                    {canEdit && (
                      <div className="ml-auto flex gap-1">
                        <Button
                          size="sm"
                          variant={
                            m.status === "accepted" ? "default" : "outline"
                          }
                          className="h-8"
                          onClick={() =>
                            update(m.id, {
                              status:
                                m.status === "accepted"
                                  ? "suggested"
                                  : "accepted",
                            })
                          }
                        >
                          <Check className="size-3.5" />{" "}
                          {m.status === "accepted" ? "Accepted" : "Accept"}
                        </Button>
                        <Button
                          size="sm"
                          variant={
                            m.status === "rejected" ? "secondary" : "ghost"
                          }
                          className="h-8"
                          onClick={() =>
                            update(m.id, {
                              status:
                                m.status === "rejected"
                                  ? "suggested"
                                  : "rejected",
                            })
                          }
                        >
                          <X className="size-3.5" />{" "}
                          {m.status === "rejected" ? "Rejected" : "Reject"}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {mappings.length === 0 && (
                <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                  No internal regulation affected. Add one manually if needed.
                </p>
              )}
            </div>
          </div>

          {canEdit && (
            <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
              <Button
                disabled={!accepted || save.isPending || needsApplicability}
                onClick={() =>
                  save.mutate(
                    { mappings, confirm: true },
                    {
                      onSuccess: () =>
                        toast.success(
                          `Mapping confirmed: ${accepted} internal regulation(s) to revise`,
                        ),
                    },
                  )
                }
              >
                <CheckCircle2 className="size-4" /> Confirm mapping ({accepted})
              </Button>
              <Button
                variant="outline"
                disabled={!dirty || save.isPending}
                onClick={() =>
                  save.mutate(
                    { mappings },
                    { onSuccess: () => toast.success("Draft mapping saved") },
                  )
                }
              >
                Save draft
              </Button>
              <span className="text-xs text-muted-foreground">
                Next: assign lead and supporting units.
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface AssignRow {
  mappingId: string;
  leadUnitId: string;
  supportUnitIds: string[];
  ownerName: string;
  committedDate: string;
}

function AssignmentPanel({ item }: { item: LegalUpdate }) {
  const { role } = useAuthStore();
  const canAssign =
    hasPermission(role, "legal:review") && item.status === "mapped";
  const unitsQuery = useOrgUnits();
  const usersQuery = useAdminUsers(1, 200, { status: "Active" });
  const assign = useAssignRevisions(item.id);
  const accepted = item.mappings.filter((m) => m.status === "accepted");
  const hoUnits = (unitsQuery.data?.allUnits ?? []).filter(
    (u) => u.type === "ho_department",
  );
  const defaultDeadline = format(
    subDays(parseISO(item.effectiveDate), 15) < demoNow()
      ? addDays(demoNow(), 14)
      : subDays(parseISO(item.effectiveDate), 15),
    "yyyy-MM-dd",
  );

  const [rows, setRows] = useState<AssignRow[]>(() =>
    accepted.map((m) => ({
      mappingId: m.id,
      leadUnitId: m.leadUnitId ?? "dept-compliance",
      supportUnitIds: ["dept-compliance", "dept-legal"]
        .filter((u) => u !== m.leadUnitId)
        .slice(0, 1),
      ownerName: "",
      committedDate: defaultDeadline,
    })),
  );
  const [editingSupport, setEditingSupport] = useState<string | null>(null);

  useEffect(() => {
    const users = usersQuery.data?.items ?? [];
    if (!users.length) return;
    setRows((prev) =>
      prev.map((r, i) =>
        r.ownerName
          ? r
          : { ...r, ownerName: users[(i + 4) % users.length].name },
      ),
    );
  }, [usersQuery.data]);

  if (item.status !== "mapped") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Assignment</CardTitle>
        </CardHeader>
        <CardContent>
          {item.revisionTaskIds.length ? (
            <Callout
              tone="success"
              title={`${item.revisionTaskIds.length} revision task(s) created`}
            >
              Units have been notified. Follow progress in the Tracking step or
              on the Internal Regulations board.
            </Callout>
          ) : (
            <Callout tone="info" title="Confirm the legal mapping first">
              Assignment is available once Compliance confirms which QĐNB must
              change.
            </Callout>
          )}
        </CardContent>
      </Card>
    );
  }

  const set = (id: string, patch: Partial<AssignRow>) =>
    setRows((p) => p.map((r) => (r.mappingId === id ? { ...r, ...patch } : r)));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="size-4" /> Assign lead and supporting units
        </CardTitle>
        <CardDescription>
          One revision task per QĐNB. Units are notified and reminded
          automatically. RFQ 1.3
        </CardDescription>
        <CardAction>
          <RfqChip code="1.3" />
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-3">
        {rows.map((r) => {
          const m = accepted.find((x) => x.id === r.mappingId)!;
          const deadline = parseISO(r.committedDate);
          return (
            <div
              key={r.mappingId}
              className="space-y-3 rounded-xl border border-border p-3"
            >
              <div className="flex flex-wrap items-center gap-2">
                <ToneBadge tone="warning">
                  {MAPPING_ACTION_SHORT[m.action]}
                </ToneBadge>
                <span className="font-mono text-xs font-semibold">
                  {m.qdnbCode}
                </span>
                <span className="truncate text-sm">{m.qdnbTitle}</span>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="space-y-1">
                  <Label className="text-xs">Lead unit (chủ trì)</Label>
                  <select
                    disabled={!canAssign}
                    value={r.leadUnitId}
                    onChange={(e) =>
                      set(r.mappingId, { leadUnitId: e.target.value })
                    }
                    className="h-9 w-full rounded-lg border border-input bg-background px-2 text-sm dark:bg-input/30"
                  >
                    {hoUnits.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Responsible officer</Label>
                  <select
                    disabled={!canAssign}
                    value={r.ownerName}
                    onChange={(e) =>
                      set(r.mappingId, { ownerName: e.target.value })
                    }
                    className="h-9 w-full rounded-lg border border-input bg-background px-2 text-sm dark:bg-input/30"
                  >
                    <option value="">Choose…</option>
                    {(usersQuery.data?.items ?? []).map((u) => (
                      <option key={u.id} value={u.name}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Deadline (committed date)</Label>
                  <Input
                    disabled={!canAssign}
                    type="date"
                    value={r.committedDate}
                    onChange={(e) =>
                      set(r.mappingId, { committedDate: e.target.value })
                    }
                    className="h-9"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Supporting units (phối hợp)</Label>
                <div className="flex flex-wrap items-center gap-1.5">
                  {r.supportUnitIds.map((u) => (
                    <span
                      key={u}
                      className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs"
                    >
                      {hoUnits.find((x) => x.id === u)?.name ?? u}
                      {canAssign && (
                        <button
                          type="button"
                          onClick={() =>
                            set(r.mappingId, {
                              supportUnitIds: r.supportUnitIds.filter(
                                (x) => x !== u,
                              ),
                            })
                          }
                          aria-label="Remove"
                        >
                          ×
                        </button>
                      )}
                    </span>
                  ))}
                  {canAssign && (
                    <button
                      type="button"
                      onClick={() =>
                        setEditingSupport(
                          editingSupport === r.mappingId ? null : r.mappingId,
                        )
                      }
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      + add unit
                    </button>
                  )}
                </div>
                {editingSupport === r.mappingId && (
                  <div className="flex flex-wrap gap-1.5 rounded-lg border border-dashed border-border p-2">
                    {hoUnits
                      .filter(
                        (u) =>
                          u.id !== r.leadUnitId &&
                          !r.supportUnitIds.includes(u.id),
                      )
                      .map((u) => (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() =>
                            set(r.mappingId, {
                              supportUnitIds: [...r.supportUnitIds, u.id],
                            })
                          }
                          className="rounded-md border border-border px-2 py-0.5 text-xs hover:bg-muted"
                        >
                          {u.name}
                        </button>
                      ))}
                  </div>
                )}
              </div>
              <p className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                Reminders:
                {REMINDER_OFFSETS.map((o) => (
                  <span key={o} className="rounded bg-muted px-1.5 py-0.5">
                    T-{o} · {format(subDays(deadline, o), "dd/MM")}
                  </span>
                ))}
                <span>then daily if overdue · Email + Teams + in-app</span>
              </p>
              {deadline > parseISO(item.effectiveDate) && (
                <p className="text-xs font-medium text-warning">
                  Deadline is after the law's effective date (
                  {format(parseISO(item.effectiveDate), "dd/MM/yyyy")}) — this
                  task will be flagged as a late-issuance risk.
                </p>
              )}
            </div>
          );
        })}
        {canAssign && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Button
              disabled={assign.isPending || rows.some((r) => !r.ownerName)}
              onClick={() =>
                assign.mutate(
                  rows.map((r) => ({
                    ...r,
                    committedDate: new Date(r.committedDate).toISOString(),
                  })),
                  {
                    onSuccess: (res) =>
                      toast.success(
                        `${res.tasks.length} revision task(s) created — units notified by email & Teams`,
                      ),
                  },
                )
              }
            >
              <Send className="size-4" /> Create {rows.length} task(s) & notify
              units
            </Button>
            {rows.some((r) => !r.ownerName) && (
              <span className="text-xs text-muted-foreground">
                Choose a responsible officer for every task.
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TrackingPanel({ item }: { item: LegalUpdate }) {
  const revisions = useRevisions();
  const tasks = (revisions.data ?? []).filter((r) =>
    item.revisionTaskIds.includes(r.id),
  );
  const issued = tasks.filter((t) => t.status === "issued").length;
  const pct = tasks.length ? Math.round((issued / tasks.length) * 100) : 0;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tracking until issuance</CardTitle>
        <CardDescription>
          {issued} of {tasks.length} internal regulation(s) issued
        </CardDescription>
        <CardAction>
          <Button variant="outline" size="sm" asChild>
            <Link to="/qdnb">Open QĐNB board</Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-3">
          <Progress value={pct} className="h-2" />
          <span className="text-sm font-semibold tabular-nums">{pct}%</span>
        </div>
        {tasks.map((t) => {
          const d = daysUntil(t.committedDate);
          return (
            <Link
              key={t.id}
              to={t.qdnbId ? `/qdnb/${t.qdnbId}` : "/qdnb"}
              className="flex flex-wrap items-center gap-3 rounded-lg border border-border p-3 hover:bg-muted/50"
            >
              <span className="font-mono text-xs font-semibold">
                {t.qdnbCode}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm">
                {t.qdnbTitle}
              </span>
              <span className="text-xs text-muted-foreground">
                {t.leadUnitName}
              </span>
              <span className="text-xs">
                {REVISION_STATUS_LABELS[t.status]}
              </span>
              <span className="w-24">
                <Progress value={t.progress} className="h-1.5" />
              </span>
              {t.status !== "issued" && (
                <span
                  className={cn(
                    "text-xs",
                    d < 0 && "font-semibold text-danger",
                  )}
                >
                  {d < 0 ? `${-d}d late` : `${d}d left`}
                </span>
              )}
              <RevisionHealthBadge health={getRevisionHealth(t)} />
            </Link>
          );
        })}
        {!tasks.length && (
          <p className="text-sm text-muted-foreground">
            No revision tasks yet.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
