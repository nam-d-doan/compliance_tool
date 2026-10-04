import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { format, formatDistance, parseISO } from "date-fns";
import {
  AlarmClock,
  AlertTriangle,
  BookMarked,
  CheckCircle2,
  CircleDashed,
  FileClock,
  Hourglass,
  LayoutGrid,
  List,
  Radio,
  Search,
  Siren,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PageHero, ChartGrid } from "@/components/common";
import { KPICard } from "@/components/common/KPICard";
import { LoadingState } from "@/components/common/LoadingState";
import { BarChartCard } from "@/components/charts/BarChartCard";
import {
  PagePurpose,
  RevisionHealthBadge,
  RfqChip,
  ToneBadge,
} from "@/components/cms";
import { useQdnbList, useRevisions } from "@/hooks/queries";
import { demoNow } from "@/stores";
import {
  MAPPING_ACTION_SHORT,
  REVISION_STATUSES,
  REVISION_STATUS_LABELS,
  REVISION_STATUS_VI,
  daysUntil,
  getRevisionHealth,
  type RevisionHealth,
} from "@/lib/cms-rules";
import { cn } from "@/lib/utils";
import type { RevisionStatus, RevisionTask } from "@/types";

type View = "board" | "table" | "register";
type HealthFilter = RevisionHealth | "all";

const COLUMN_ICON: Record<RevisionStatus, typeof CircleDashed> = {
  not_started: CircleDashed,
  in_revision: FileClock,
  pending_approval: Hourglass,
  issued: CheckCircle2,
};

export default function QdnbTrackerPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const view = (params.get("view") as View) ?? "board";
  const [health, setHealth] = useState<HealthFilter>("all");
  const [statusFilter, setStatusFilter] = useState<RevisionStatus | "all">(
    "all",
  );
  const [unit, setUnit] = useState("");
  const [search, setSearch] = useState("");

  const revisionsQuery = useRevisions();
  const qdnbQuery = useQdnbList();
  const now = demoNow();

  const revisions = useMemo(
    () =>
      (revisionsQuery.data ?? []).map((r) => ({
        ...r,
        health: getRevisionHealth(r, now),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [revisionsQuery.data, now.toDateString()],
  );

  const units = Array.from(
    new Set(revisions.map((r) => r.leadUnitName)),
  ).sort();

  const filtered = revisions.filter(
    (r) =>
      (health === "all" || r.health === health) &&
      (statusFilter === "all" || r.status === statusFilter) &&
      (!unit || r.leadUnitName === unit) &&
      (!search ||
        `${r.qdnbCode} ${r.qdnbTitle} ${r.sources.map((s) => s.docNumber).join(" ")}`
          .toLowerCase()
          .includes(search.toLowerCase())),
  );

  const count = (s: RevisionStatus) =>
    revisions.filter((r) => r.status === s).length;
  const overdue = revisions.filter((r) => r.health === "overdue").length;
  const lateRisk = revisions.filter((r) => r.health === "late_risk").length;

  const recent = [...revisions]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 5);

  const byUnit = useMemo(() => {
    const map = new Map<
      string,
      { name: string; Open: number; Issued: number; Overdue: number }
    >();
    revisions.forEach((r) => {
      const row = map.get(r.leadUnitName) ?? {
        name: r.leadUnitName.replace("Khối ", ""),
        Open: 0,
        Issued: 0,
        Overdue: 0,
      };
      if (r.status === "issued") row.Issued++;
      else if (r.health === "overdue") row.Overdue++;
      else row.Open++;
      map.set(r.leadUnitName, row);
    });
    return Array.from(map.values());
  }, [revisions]);

  const upcoming = revisions
    .filter((r) => r.status !== "issued")
    .sort((a, b) => a.committedDate.localeCompare(b.committedDate));

  const setView = (v: View) => {
    params.set("view", v);
    setParams(params, { replace: true });
  };

  const hasFilters =
    health !== "all" || statusFilter !== "all" || unit || search;

  if (revisionsQuery.isPending || qdnbQuery.isPending) {
    return <LoadingState message="Loading internal regulations…" />;
  }

  return (
    <div className="space-y-6">
      <PageHero
        title="Internal Regulations (QĐNB)"
        subtitle="Theo dõi tiến độ cập nhật và ban hành văn bản nội bộ — every revision triggered by a new law, from assignment to issuance."
      >
        <div className="flex items-center gap-2">
          <RfqChip code="2.1" />
          <RfqChip code="2.2" />
          <RfqChip code="2.3" />
          <Button variant="outline" size="sm" asChild>
            <Link to="/reports/late-issuance">
              <AlarmClock className="size-4" /> Late issuance report
            </Link>
          </Button>
        </div>
      </PageHero>
      <PagePurpose>
        Each card is one internal regulation that must change because of a new
        law. Status updates appear here instantly; the CMS warns when issuance
        will be later than the law's effective date or the committed date.
      </PagePurpose>

      <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-6">
        <KPICard
          label="Not yet revised"
          value={count("not_started")}
          subtitle={REVISION_STATUS_VI.not_started}
          icon={CircleDashed}
          iconClassName="bg-neutral-bg text-neutral"
          onClick={() => {
            setStatusFilter("not_started");
            setHealth("all");
          }}
        />
        <KPICard
          label="In revision"
          value={count("in_revision")}
          subtitle={REVISION_STATUS_VI.in_revision}
          icon={FileClock}
          iconClassName="bg-info-bg text-info"
          onClick={() => {
            setStatusFilter("in_revision");
            setHealth("all");
          }}
        />
        <KPICard
          label="Awaiting approval"
          value={count("pending_approval")}
          subtitle={REVISION_STATUS_VI.pending_approval}
          icon={Hourglass}
          iconClassName="bg-violet-500/10 text-violet-600"
          onClick={() => {
            setStatusFilter("pending_approval");
            setHealth("all");
          }}
        />
        <KPICard
          label="Issued"
          value={count("issued")}
          subtitle={REVISION_STATUS_VI.issued}
          icon={CheckCircle2}
          iconClassName="bg-success-bg text-success"
          onClick={() => {
            setStatusFilter("issued");
            setHealth("all");
          }}
        />
        <KPICard
          label="Overdue"
          value={overdue}
          subtitle="Quá hạn"
          icon={Siren}
          iconClassName="bg-danger-bg text-danger"
          onClick={() => {
            setHealth("overdue");
            setStatusFilter("all");
          }}
          className={cn(overdue > 0 && "ring-1 ring-danger/40")}
        />
        <KPICard
          label="Late-issuance risk"
          value={lateRisk}
          subtitle="Nguy cơ chậm ban hành"
          icon={AlertTriangle}
          iconClassName="bg-warning-bg text-warning"
          onClick={() => {
            setHealth("late_risk");
            setStatusFilter("all");
          }}
          className={cn(lateRisk > 0 && "ring-1 ring-warning/40")}
        />
      </div>

      <Card className="py-3">
        <CardContent className="flex items-center gap-3 overflow-hidden">
          <span className="flex shrink-0 items-center gap-1.5 text-xs font-semibold text-success">
            <Radio className="size-3.5 animate-pulse" /> Live
          </span>
          <div className="flex min-w-0 flex-1 gap-4 overflow-x-auto [scrollbar-width:none]">
            <AnimatePresence initial={false}>
              {recent.map((r) => (
                <motion.button
                  key={`${r.id}-${r.updatedAt}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  type="button"
                  onClick={() => r.qdnbId && navigate(`/qdnb/${r.qdnbId}`)}
                  className="flex shrink-0 items-center gap-2 text-xs whitespace-nowrap hover:underline"
                >
                  <span className="font-mono font-semibold">{r.qdnbCode}</span>
                  <span className="text-muted-foreground">
                    {REVISION_STATUS_LABELS[r.status]} ·{" "}
                    {formatDistance(parseISO(r.updatedAt), now, {
                      addSuffix: true,
                    })}
                  </span>
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex items-center gap-1 rounded-lg bg-muted p-1">
          {(
            [
              ["board", "Board", LayoutGrid],
              ["table", "Table", List],
              ["register", "Register (all QĐNB)", BookMarked],
            ] as const
          ).map(([v, label, Icon]) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={cn(
                "flex h-8 items-center gap-1.5 rounded-md px-3 text-xs font-semibold",
                view === v
                  ? "bg-background shadow-sm"
                  : "text-muted-foreground",
              )}
            >
              <Icon className="size-3.5" /> {label}
            </button>
          ))}
        </div>
        {view !== "register" && (
          <>
            <div className="relative min-w-[12rem] flex-1">
              <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search QĐNB or law number…"
                className="h-9 pl-9"
              />
            </div>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="h-9 min-w-[12rem] rounded-lg border border-input bg-background px-3 text-sm dark:bg-input/30"
            >
              <option value="">All lead units</option>
              {units.map((u) => (
                <option key={u}>{u}</option>
              ))}
            </select>
            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setHealth("all");
                  setStatusFilter("all");
                  setUnit("");
                  setSearch("");
                }}
              >
                <X className="size-3.5" /> Clear filters
              </Button>
            )}
          </>
        )}
      </div>

      {view === "board" && (
        <div className="grid gap-3 lg:grid-cols-4">
          {REVISION_STATUSES.map((status) => {
            const Icon = COLUMN_ICON[status];
            const items = filtered.filter((r) => r.status === status);
            return (
              <div
                key={status}
                className="flex min-h-[16rem] flex-col rounded-2xl border border-border bg-muted/20 p-2"
              >
                <div className="flex items-center justify-between px-2 py-1.5">
                  <span className="flex items-center gap-1.5 text-sm font-semibold">
                    <Icon className="size-4" /> {REVISION_STATUS_LABELS[status]}
                  </span>
                  <span className="rounded-full bg-muted px-2 text-xs font-semibold">
                    {items.length}
                  </span>
                </div>
                <p className="px-2 pb-2 text-[11px] text-muted-foreground">
                  {REVISION_STATUS_VI[status]}
                </p>
                <div className="space-y-2">
                  <AnimatePresence>
                    {items.map((r) => (
                      <RevisionCard
                        key={r.id}
                        task={r}
                        health={r.health}
                        onOpen={() => r.qdnbId && navigate(`/qdnb/${r.qdnbId}`)}
                      />
                    ))}
                  </AnimatePresence>
                  {items.length === 0 && (
                    <p className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                      Nothing here
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {view === "table" && (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">QĐNB</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                  <th className="px-4 py-3 font-medium">Because of</th>
                  <th className="px-4 py-3 font-medium">Lead unit</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Progress</th>
                  <th className="px-4 py-3 font-medium">Committed</th>
                  <th className="px-4 py-3 font-medium">Law effective</th>
                  <th className="px-4 py-3 font-medium">Alert</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => r.qdnbId && navigate(`/qdnb/${r.qdnbId}`)}
                    className="cursor-pointer hover:bg-muted/50"
                  >
                    <td className="px-4 py-3">
                      <p className="font-mono text-xs font-semibold">
                        {r.qdnbCode}
                      </p>
                      <p className="line-clamp-1 max-w-xs">{r.qdnbTitle}</p>
                    </td>
                    <td className="px-4 py-3">
                      {MAPPING_ACTION_SHORT[r.action]}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {r.sources.map((s) => s.docNumber).join(", ")}
                    </td>
                    <td className="px-4 py-3">{r.leadUnitName}</td>
                    <td className="px-4 py-3">
                      {REVISION_STATUS_LABELS[r.status]}
                    </td>
                    <td className="w-32 px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Progress value={r.progress} className="h-1.5" />
                        <span className="text-xs tabular-nums">
                          {r.progress}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {format(parseISO(r.committedDate), "dd/MM/yyyy")}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {format(parseISO(r.lawEffectiveDate), "dd/MM/yyyy")}
                    </td>
                    <td className="px-4 py-3">
                      <RevisionHealthBadge health={r.health} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {view === "register" && (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Code</th>
                  <th className="px-4 py-3 font-medium">Title</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Signed by</th>
                  <th className="px-4 py-3 font-medium">Owner unit</th>
                  <th className="px-4 py-3 font-medium">Version</th>
                  <th className="px-4 py-3 font-medium">Based on</th>
                  <th className="px-4 py-3 font-medium">State</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(qdnbQuery.data ?? []).map((q) => {
                  const rev = revisions.find(
                    (r) => r.id === q.activeRevisionId,
                  );
                  return (
                    <tr
                      key={q.id}
                      onClick={() => navigate(`/qdnb/${q.id}`)}
                      className="cursor-pointer hover:bg-muted/50"
                    >
                      <td className="px-4 py-3 font-mono text-xs font-semibold whitespace-nowrap">
                        {q.code}
                      </td>
                      <td className="max-w-sm px-4 py-3">
                        <span className="line-clamp-1">{q.title}</span>
                      </td>
                      <td className="px-4 py-3">{q.docType}</td>
                      <td className="px-4 py-3">{q.issuingLevel}</td>
                      <td className="px-4 py-3">{q.ownerUnitName}</td>
                      <td className="px-4 py-3">v{q.currentVersion}</td>
                      <td className="px-4 py-3 font-mono text-xs">
                        {q.basedOn.slice(0, 2).join(", ")}
                        {q.basedOn.length > 2 ? "…" : ""}
                      </td>
                      <td className="px-4 py-3">
                        {rev ? (
                          <RevisionHealthBadge health={rev.health} />
                        ) : (
                          <ToneBadge tone="success">Current</ToneBadge>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ChartGrid>
        <BarChartCard
          title="Revisions by lead unit"
          subtitle="Open, overdue and issued"
          data={byUnit}
          xKey="name"
          yKeys={[
            { key: "Open", name: "Open", color: "#3b82f6" },
            { key: "Overdue", name: "Overdue", color: "#ef4444" },
            { key: "Issued", name: "Issued", color: "#10b981" },
          ]}
          height={240}
          className="h-full xl:col-span-2"
        />
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Deadlines ahead</CardTitle>
            <CardDescription>Committed dates of open revisions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {upcoming.slice(0, 6).map((r) => {
              const d = daysUntil(r.committedDate, now);
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => r.qdnbId && navigate(`/qdnb/${r.qdnbId}`)}
                  className="flex w-full items-center gap-3 rounded-lg border border-border p-2 text-left hover:bg-muted/50"
                >
                  <span
                    className={cn(
                      "flex w-12 shrink-0 flex-col items-center rounded-md py-1 text-xs font-bold",
                      d < 0
                        ? "bg-danger-bg text-danger"
                        : d <= 14
                          ? "bg-warning-bg text-warning"
                          : "bg-muted",
                    )}
                  >
                    {d < 0 ? `+${-d}` : d}
                    <span className="text-[9px] font-medium">
                      {d < 0 ? "late" : "days"}
                    </span>
                  </span>
                  <span className="min-w-0">
                    <span className="block font-mono text-xs font-semibold">
                      {r.qdnbCode}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {r.qdnbTitle}
                    </span>
                  </span>
                </button>
              );
            })}
          </CardContent>
        </Card>
      </ChartGrid>
    </div>
  );
}

function RevisionCard({
  task,
  health,
  onOpen,
}: {
  task: RevisionTask;
  health: RevisionHealth;
  onOpen: () => void;
}) {
  const now = demoNow();
  const days = daysUntil(task.committedDate, now);
  const lawDays = daysUntil(task.lawEffectiveDate, now);
  const unacked = task.escalations.some(
    (e) => e.level >= 2 && !e.acknowledgedAt,
  );
  return (
    <motion.button
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      whileHover={{ y: -2 }}
      type="button"
      onClick={onOpen}
      className={cn(
        "w-full rounded-xl border bg-card p-3 text-left shadow-sm transition-shadow hover:shadow-md",
        health === "overdue" && "border-danger/50",
        health === "late_risk" && "border-warning/50",
        health !== "overdue" && health !== "late_risk" && "border-border",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="font-mono text-[11px] font-semibold">
          {task.qdnbCode}
        </span>
        <RevisionHealthBadge health={health} />
      </div>
      <p className="mt-1 line-clamp-2 text-sm font-medium leading-snug">
        {task.qdnbTitle}
      </p>
      <p className="mt-1 text-[11px] text-muted-foreground">
        {MAPPING_ACTION_SHORT[task.action]} ·{" "}
        {task.sources.map((s) => s.docNumber).join(", ")}
      </p>
      <p className="mt-0.5 text-[11px] text-muted-foreground">
        Lead: {task.leadUnitName}
      </p>
      {task.status !== "issued" ? (
        <>
          <div className="mt-2 flex items-center gap-2">
            <Progress value={task.progress} className="h-1.5" />
            <span className="text-[11px] tabular-nums">{task.progress}%</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
            <span
              className={cn(
                "rounded-md px-1.5 py-0.5",
                days < 0 ? "bg-danger-bg text-danger" : "bg-muted",
              )}
            >
              {days < 0 ? `${-days}d overdue` : `${days}d to deadline`}
            </span>
            <span
              className={cn(
                "rounded-md px-1.5 py-0.5",
                lawDays < 0 ? "bg-danger-bg/60 text-danger" : "bg-muted",
              )}
            >
              Law{" "}
              {lawDays < 0
                ? `in force ${-lawDays}d ago`
                : `in force in ${lawDays}d`}
            </span>
            {unacked && (
              <span className="flex items-center gap-1 rounded-md bg-danger-bg px-1.5 py-0.5 text-danger">
                <Siren className="size-3" /> Escalated
              </span>
            )}
          </div>
        </>
      ) : (
        <p className="mt-2 text-[11px] text-success">
          Issued{" "}
          {task.issuedAt ? format(parseISO(task.issuedAt), "dd/MM/yyyy") : ""} ·{" "}
          {task.evidence?.decisionNo}
        </p>
      )}
    </motion.button>
  );
}
