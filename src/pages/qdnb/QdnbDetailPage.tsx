import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion } from "motion/react";
import { format, parseISO } from "date-fns";
import {
  ArrowLeft,
  Building2,
  CalendarCheck,
  CalendarClock,
  CheckCircle2,
  Download,
  FileText,
  ListChecks,
  FileCheck2,
  GitCompare,
  Scale,
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
  Fact,
  FileNamePicker,
  RevisionHealthBadge,
  ToneBadge,
} from "@/components/cms";
import { useQdnb } from "@/hooks/queries";
import { useClientAudit, useIssueRevision } from "@/hooks/mutations";
import { demoNow } from "@/stores";
import {
  MAPPING_ACTION_LABELS,
  REVISION_STATUS_LABELS,
  getRevisionHealth,
} from "@/lib/cms-rules";
import type { RevisionTask } from "@/types";

export default function QdnbDetailPage() {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isPending, isError, refetch } = useQdnb(id);
  const audit = useClientAudit();
  const [tab, setTab] = useState("basic");

  if (isPending) return <DetailSkeleton />;
  if (isError || !data) return <ErrorState onRetry={() => refetch()} />;

  const { regulation: q, revisions, legalUpdates } = data;
  const active = revisions.find((r) => r.id === q.activeRevisionId);
  const latest = q.versions[q.versions.length - 1];
  const units = Array.from(
    new Set(revisions.flatMap((r) => r.supportUnitNames)),
  );

  const download = () => {
    audit.mutate({
      action: "export",
      module: "qdnb",
      object: q.code,
      details: `Downloaded ${q.code} v${q.currentVersion}`,
    });
    toast.success(
      `${q.code.replace(/[ /]/g, "_")}_v${q.currentVersion}.pdf downloaded (demo file)`,
    );
  };

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
        onClick={() => navigate("/library?type=qdnb")}
        className="-ml-2 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to the Document Library
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
          <Button variant="outline" size="sm" onClick={download}>
            <Download className="size-4" /> Download
          </Button>
          {active && (
            <Button variant="outline" size="sm" asChild>
              <Link to={`/tasks/${active.id}`}>
                <ListChecks className="size-4" /> Open revision task
              </Link>
            </Button>
          )}
        </div>
      </PageHero>

      <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Fact icon={Building2} label="Owner unit" value={q.ownerUnitName} />
        <Fact icon={ShieldCheck} label="Field" value={q.field} />
        <Fact
          icon={CalendarCheck}
          label="Current version issued"
          value={format(parseISO(latest.issuedAt), "dd/MM/yyyy")}
        />
        <Fact
          icon={Scale}
          label="Based on"
          value={
            <span className="font-mono text-xs">{q.basedOn.join(", ")}</span>
          }
        />
      </dl>

      <Tabs value={tab} onValueChange={setTab} defaultValue="basic">
        <TabsList className="flex-wrap">
          <TabsTrigger value="basic">Basic info</TabsTrigger>
          <TabsTrigger value="scope">Scope</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="mapping">
            Legal mapping ({legalUpdates.length})
          </TabsTrigger>
          <TabsTrigger value="versions">
            Versions ({q.versions.length})
          </TabsTrigger>
          <TabsTrigger value="tasks">Tasks ({revisions.length})</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4 pt-2">
          <Card>
            <CardHeader>
              <CardTitle>Basic information</CardTitle>
              <CardDescription>
                Internal regulation of Nam A Bank
              </CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <Fact icon={FileText} label="Number" value={q.code} />
                <Fact icon={FileText} label="Type" value={q.docType} />
                <Fact icon={User} label="Signed by" value={q.issuingLevel} />
                <Fact
                  icon={CalendarCheck}
                  label="Issued"
                  value={format(parseISO(latest.issuedAt), "dd/MM/yyyy")}
                />
                <Fact
                  icon={CalendarClock}
                  label="Effective"
                  value={format(parseISO(latest.effectiveAt), "dd/MM/yyyy")}
                />
                <Fact
                  icon={GitCompare}
                  label="Current version"
                  value={`v${q.currentVersion} · ${latest.decisionNo}`}
                />
              </dl>
              <p className="mt-4 text-sm text-muted-foreground">
                Latest change: {latest.changeSummary}
              </p>
            </CardContent>
          </Card>
          {active && (
            <Callout
              tone="warning"
              title={`Being revised — ${active.code}`}
              action={
                <Button size="sm" variant="outline" asChild>
                  <Link to={`/tasks/${active.id}`}>Open task</Link>
                </Button>
              }
            >
              {MAPPING_ACTION_LABELS[active.action]} because of{" "}
              {active.sources.map((s) => s.docNumber).join(", ")}. Lead:{" "}
              {active.leadUnitName}, deadline{" "}
              {format(parseISO(active.committedDate), "dd/MM/yyyy")}.
            </Callout>
          )}
        </TabsContent>

        <TabsContent value="scope" className="pt-2">
          <Card>
            <CardHeader>
              <CardTitle>Scope</CardTitle>
              <CardDescription>
                Who and what this regulation covers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <Fact
                  icon={Building2}
                  label="Owner unit"
                  value={q.ownerUnitName}
                />
                <Fact
                  icon={ShieldCheck}
                  label="Business field"
                  value={q.field}
                />
                <Fact
                  icon={Users}
                  label="Units involved in revisions"
                  value={units.join(", ") || "—"}
                />
                <Fact
                  icon={Scale}
                  label="Laws implemented"
                  value={q.basedOn.length}
                />
                <Fact
                  icon={FileText}
                  label="Articles"
                  value={latest.articles.length}
                />
                <Fact
                  icon={User}
                  label="Applies to"
                  value="Head office and all branches"
                />
              </dl>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content" className="pt-2">
          <Card>
            <CardHeader>
              <CardTitle>
                Current content — version {q.currentVersion}
              </CardTitle>
              <CardDescription>{latest.decisionNo}</CardDescription>
              <CardAction>
                <Button variant="outline" size="sm" onClick={download}>
                  <Download className="size-4" /> Download
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent className="space-y-3">
              {latest.articles.map((a) => (
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
              <CardTitle>Laws mapped to this regulation</CardTitle>
              <CardDescription>Only the links of this document</CardDescription>
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

        <TabsContent value="tasks" className="pt-2">
          <Card>
            <CardHeader>
              <CardTitle>Tasks that changed this regulation</CardTitle>
              <CardDescription>Open a task to see its workflow</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {revisions.length === 0 && (
                <p className="text-sm text-muted-foreground">No task yet.</p>
              )}
              {revisions.map((r) => (
                <Link
                  key={r.id}
                  to={`/tasks/${r.id}`}
                  className="flex flex-wrap items-center gap-3 rounded-lg border border-border p-3 text-sm hover:bg-muted/50"
                >
                  <span className="font-mono text-xs font-semibold">
                    {r.code}
                  </span>
                  <span className="min-w-0 flex-1 truncate">
                    {MAPPING_ACTION_LABELS[r.action]} ·{" "}
                    {r.sources.map((s) => s.docNumber).join(", ")}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {r.leadUnitName}
                  </span>
                  <span className="text-xs">
                    {REVISION_STATUS_LABELS[r.status]}
                  </span>
                  <RevisionHealthBadge health={getRevisionHealth(r)} />
                </Link>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="pt-2">
          <Card>
            <CardHeader>
              <CardTitle>Audit trail</CardTitle>
              <CardDescription>
                Every action on this regulation and its revisions
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

export function IssueSheet({
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
