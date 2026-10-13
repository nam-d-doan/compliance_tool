import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { format, formatDistance, parseISO } from "date-fns";
import {
  AlarmClock,
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  CircleDashed,
  FileClock,
  FileCheck2,
  Hourglass,
  Plus,
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
import { STATUS_CHART_COLORS } from "@/components/charts/chart-theme";
import { PieChartCard } from "@/components/charts/PieChartCard";
import { PagePurpose, RevisionHealthBadge, ToneBadge } from "@/components/cms";
import { useRevisions, useTaskWorkflow } from "@/hooks/queries";
import { useAuthStore, demoNow } from "@/stores";
import { DEPARTMENT_USER_UNIT } from "@/constants/sideNav";
import { hasPermission } from "@/constants/rbac";
import {
  MAPPING_ACTION_SHORT,
  daysUntil,
  getRevisionHealth,
} from "@/lib/cms-rules";
import {
  TASK_STATUSES,
  TASK_STATUS_LABELS,
  TASK_STATUS_TONE,
  currentTaskStep,
  pendingDeadlineChange,
  taskStatus,
  type TaskStatusKey,
} from "@/lib/task-flow";
import { cn } from "@/lib/utils";

type DueFilter = "" | "overdue" | "week" | "month" | "late_risk";

export default function TaskListPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { role } = useAuthStore();
  const isDepartment = role === "approver";
  const canAssign = hasPermission(role, "legal:review");
  const revisionsQuery = useRevisions();
  const workflowQuery = useTaskWorkflow();
  const now = demoNow();

  const [mine, setMine] = useState(isDepartment);
  const [search, setSearch] = useState(params.get("q") ?? "");
  const [unit, setUnit] = useState("");
  const [status, setStatus] = useState<TaskStatusKey | "">("");
  const [due, setDue] = useState<DueFilter>(
    (params.get("due") as DueFilter) ?? "",
  );
  const [source, setSource] = useState("");
  const [pendingOnly, setPendingOnly] = useState(false);

  const tasks = useMemo(
    () =>
      (revisionsQuery.data ?? []).map((t) => ({
        ...t,
        health: getRevisionHealth(t, now),
        st: taskStatus(t),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [revisionsQuery.data, now.toDateString()],
  );

  const scoped = mine
    ? tasks.filter(
        (t) =>
          t.leadUnitId === DEPARTMENT_USER_UNIT.id ||
          t.supportUnitIds.includes(DEPARTMENT_USER_UNIT.id),
      )
    : tasks;

  const units = Array.from(
    new Set(tasks.flatMap((t) => [t.leadUnitName, ...t.supportUnitNames])),
  ).sort();
  const sources = Array.from(
    new Set(tasks.flatMap((t) => t.sources.map((s) => s.docNumber))),
  ).sort();

  const filtered = scoped.filter((t) => {
    const d = daysUntil(t.committedDate, now);
    const open = t.st !== "completed" && t.st !== "to_complete";
    return (
      (!unit || t.leadUnitName === unit || t.supportUnitNames.includes(unit)) &&
      (!status || t.st === status) &&
      (!source || t.sources.some((s) => s.docNumber === source)) &&
      (!pendingOnly || !!pendingDeadlineChange(t)) &&
      (due === "" ||
        (due === "overdue" && t.health === "overdue") ||
        (due === "late_risk" && t.health === "late_risk") ||
        (due === "week" && open && d >= 0 && d <= 7) ||
        (due === "month" && open && d >= 0 && d <= 30)) &&
      (!search ||
        `${t.code} ${t.qdnbCode} ${t.qdnbTitle} ${t.sources.map((s) => s.docNumber).join(" ")} ${t.leadUnitName} ${t.ownerName}`
          .toLowerCase()
          .includes(search.toLowerCase()))
    );
  });

  const count = (s: TaskStatusKey) => scoped.filter((t) => t.st === s).length;
  const overdue = scoped.filter((t) => t.health === "overdue").length;
  const lateRisk = scoped.filter((t) => t.health === "late_risk").length;
  const pendingRequests = scoped.filter((t) => pendingDeadlineChange(t)).length;

  const byUnit = useMemo(() => {
    const map = new Map<
      string,
      { name: string; Open: number; Overdue: number; Done: number }
    >();
    scoped.forEach((t) => {
      const row = map.get(t.leadUnitName) ?? {
        name: t.leadUnitName.replace("Khối ", ""),
        Open: 0,
        Overdue: 0,
        Done: 0,
      };
      if (t.status === "issued") row.Done++;
      else if (t.health === "overdue") row.Overdue++;
      else row.Open++;
      map.set(t.leadUnitName, row);
    });
    return Array.from(map.values());
  }, [scoped]);

  const byStatus = TASK_STATUSES.map((s) => ({
    name: TASK_STATUS_LABELS[s],
    value: count(s),
  })).filter((x) => x.value > 0);

  const recent = [...scoped]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 6);

  const upcoming = scoped
    .filter((t) => t.status !== "issued")
    .sort((a, b) => a.committedDate.localeCompare(b.committedDate))
    .slice(0, 6);

  const hasFilters = unit || status || due || source || pendingOnly || search;
  const clear = () => {
    setUnit("");
    setStatus("");
    setDue("");
    setSource("");
    setPendingOnly(false);
    setSearch("");
  };

  if (revisionsQuery.isPending || workflowQuery.isPending)
    return <LoadingState message="Loading tasks…" />;
  const template = workflowQuery.data ?? [];

  return (
    <div className="space-y-6">
      <PageHero
        title="Task Management"
        subtitle="Work Compliance has assigned to departments to update or issue internal regulations, and how far each task has come."
      >
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to="/reports/late-issuance">
              <AlarmClock className="size-4" /> Late-issuance alerts
            </Link>
          </Button>
          {canAssign && (
            <Button size="sm" asChild>
              <Link to="/library?type=law">
                <Plus className="size-4" /> Assign from a law
              </Link>
            </Button>
          )}
        </div>
      </PageHero>
      <PagePurpose>
        Each task comes from a legal update that needs an internal regulation
        changed. Departments update progress here; the CMS flags tasks at risk
        of finishing after the law takes effect.
      </PagePurpose>

      {isDepartment && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-info/30 bg-info-bg/40 px-4 py-2.5 text-sm">
          <span>
            Department view: tasks where{" "}
            <b data-no-translate>{DEPARTMENT_USER_UNIT.name}</b> is the lead or
            a supporting unit.
          </span>
          <label className="ml-auto flex items-center gap-2 text-xs font-medium">
            <input
              type="checkbox"
              checked={mine}
              onChange={(e) => setMine(e.target.checked)}
              className="accent-primary"
            />
            My department only
          </label>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-6">
        <KPICard
          label="Not started"
          value={count("not_started")}
          subtitle="Chưa thực hiện"
          icon={CircleDashed}
          iconClassName="bg-neutral-bg text-neutral"
          onClick={() => setStatus("not_started")}
        />
        <KPICard
          label="In progress"
          value={count("in_progress")}
          subtitle="Đang thực hiện"
          icon={FileClock}
          iconClassName="bg-info-bg text-info"
          onClick={() => setStatus("in_progress")}
        />
        <KPICard
          label="Review & approval"
          value={count("pending_approval")}
          subtitle="Rà soát & phê duyệt"
          icon={Hourglass}
          iconClassName="bg-violet-500/10 text-violet-600"
          onClick={() => setStatus("pending_approval")}
        />
        <KPICard
          label="Issued / completed"
          value={count("to_complete") + count("completed")}
          subtitle={`${count("to_complete")} waiting to be closed`}
          icon={CheckCircle2}
          iconClassName="bg-success-bg text-success"
          onClick={() => setStatus("to_complete")}
        />
        <KPICard
          label="Overdue"
          value={overdue}
          subtitle="Quá hạn"
          icon={Siren}
          iconClassName="bg-danger-bg text-danger"
          onClick={() => setDue("overdue")}
          className={cn(overdue > 0 && "ring-1 ring-danger/40")}
        />
        <KPICard
          label="Late-issuance risk"
          value={lateRisk}
          subtitle={`${pendingRequests} deadline request(s) pending`}
          icon={AlertTriangle}
          iconClassName="bg-warning-bg text-warning"
          onClick={() => setDue("late_risk")}
          className={cn(lateRisk > 0 && "ring-1 ring-warning/40")}
        />
      </div>

      <ChartGrid>
        <BarChartCard
          title="Tasks by lead department"
          subtitle="Open, overdue and done"
          data={byUnit}
          xKey="name"
          yKeys={[
            { key: "Open", name: "Open", color: STATUS_CHART_COLORS.info },
            { key: "Overdue", name: "Overdue", color: STATUS_CHART_COLORS.danger },
            { key: "Done", name: "Done", color: STATUS_CHART_COLORS.success },
          ]}
          height={240}
          className="h-full xl:col-span-2"
        />
        <PieChartCard
          title="Tasks by status"
          data={byStatus}
          nameKey="name"
          valueKey="value"
          colors={[
            STATUS_CHART_COLORS.neutral,
            STATUS_CHART_COLORS.info,
            STATUS_CHART_COLORS.ai,
            STATUS_CHART_COLORS.warning,
            STATUS_CHART_COLORS.success,
          ]}
          height={240}
          className="h-full"
        />
      </ChartGrid>

      <Card className="py-3">
        <CardContent className="flex items-center gap-3 overflow-hidden">
          <span className="flex shrink-0 items-center gap-1.5 text-xs font-semibold text-success">
            <Radio className="size-3.5 animate-pulse" /> Live
          </span>
          <div className="flex min-w-0 flex-1 gap-4 overflow-x-auto [scrollbar-width:none]">
            <AnimatePresence initial={false}>
              {recent.map((t) => (
                <motion.button
                  key={`${t.id}-${t.updatedAt}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  type="button"
                  onClick={() => navigate(`/tasks/${t.id}`)}
                  className="flex shrink-0 items-center gap-2 text-xs whitespace-nowrap hover:underline"
                >
                  <span className="font-mono font-semibold">{t.code}</span>
                  <span className="text-muted-foreground">
                    {TASK_STATUS_LABELS[t.st]} ·{" "}
                    {formatDistance(parseISO(t.updatedAt), now, {
                      addSuffix: true,
                    })}
                  </span>
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>

      {/* Filter engine */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[14rem] flex-1">
          <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search task, QĐNB, law, department or officer…"
            className="h-9 pl-9"
          />
        </div>
        <Select value={unit} onChange={setUnit} placeholder="All departments">
          {units.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </Select>
        <Select
          value={status}
          onChange={(v) => setStatus(v as TaskStatusKey | "")}
          placeholder="All statuses"
        >
          {TASK_STATUSES.map((s) => (
            <option key={s} value={s}>
              {TASK_STATUS_LABELS[s]}
            </option>
          ))}
        </Select>
        <Select
          value={due}
          onChange={(v) => setDue(v as DueFilter)}
          placeholder="Any deadline"
        >
          <option value="overdue">Overdue</option>
          <option value="late_risk">Late-issuance risk</option>
          <option value="week">Due within 7 days</option>
          <option value="month">Due within 30 days</option>
        </Select>
        <Select
          value={source}
          onChange={setSource}
          placeholder="All source laws"
        >
          {sources.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
        <label className="flex h-9 items-center gap-2 rounded-lg border border-input px-3 text-xs font-medium">
          <input
            type="checkbox"
            checked={pendingOnly}
            onChange={(e) => setPendingOnly(e.target.checked)}
            className="accent-primary"
          />
          Deadline request pending
        </label>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clear}>
            <X className="size-3.5" /> Clear filters
          </Button>
        )}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="border-b border-border px-4 py-2.5 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">
              {filtered.length}
            </span>{" "}
            task(s)
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Task</th>
                  <th className="px-4 py-3 font-medium">Departments</th>
                  <th className="px-4 py-3 font-medium">Current step</th>
                  <th className="px-4 py-3 font-medium">Progress</th>
                  <th className="px-4 py-3 font-medium">Deadline</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((t) => {
                  const d = daysUntil(t.committedDate, now);
                  const step = currentTaskStep(t, template);
                  const req = pendingDeadlineChange(t);
                  return (
                    <tr
                      key={t.id}
                      onClick={() => navigate(`/tasks/${t.id}`)}
                      className="cursor-pointer align-top hover:bg-muted/50"
                    >
                      <td className="max-w-sm px-4 py-3">
                        <p className="flex flex-wrap items-center gap-1.5 text-xs">
                          <span className="font-mono font-semibold">
                            {t.code}
                          </span>
                          <span className="text-muted-foreground">
                            {MAPPING_ACTION_SHORT[t.action]}
                          </span>
                          <span
                            className="font-mono text-muted-foreground"
                            data-no-translate
                          >
                            {t.qdnbCode}
                          </span>
                        </p>
                        <p className="line-clamp-1 font-medium">
                          {t.qdnbTitle}
                        </p>
                        <p
                          className="mt-0.5 font-mono text-[11px] text-muted-foreground"
                          data-no-translate
                        >
                          ← {t.sources.map((s) => s.docNumber).join(", ")}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <p className="font-medium">{t.leadUnitName}</p>
                        {t.supportUnitNames.length > 0 && (
                          <p className="text-muted-foreground">
                            + {t.supportUnitNames.join(", ")}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {step ? (
                          <span
                            className={cn(
                              step.state === "returned" && "text-warning",
                            )}
                          >
                            {step.step.name}
                            {step.state === "returned" && " (returned)"}
                          </span>
                        ) : (
                          <span className="text-success">Done</span>
                        )}
                        {req && (
                          <ToneBadge
                            tone="warning"
                            icon={CalendarClock}
                            className="mt-1"
                          >
                            Deadline request
                          </ToneBadge>
                        )}
                      </td>
                      <td className="w-32 px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Progress value={t.progress} className="h-1.5" />
                          <span className="text-xs tabular-nums">
                            {t.progress}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs whitespace-nowrap">
                        <p>{format(parseISO(t.committedDate), "dd/MM/yyyy")}</p>
                        {t.status !== "issued" && (
                          <p
                            className={cn(
                              d < 0 ? "text-danger" : "text-muted-foreground",
                            )}
                          >
                            {d < 0 ? `${-d}d late` : `${d}d left`}
                          </p>
                        )}
                      </td>
                      <td className="space-y-1 px-4 py-3">
                        <ToneBadge tone={TASK_STATUS_TONE[t.st]}>
                          {TASK_STATUS_LABELS[t.st]}
                        </ToneBadge>
                        {t.status !== "issued" && t.health !== "on_track" && (
                          <RevisionHealthBadge health={t.health} />
                        )}
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-10 text-center text-sm text-muted-foreground"
                    >
                      No task matches these filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCheck2 className="size-4" /> Deadlines ahead
            </CardTitle>
            <CardDescription>Committed dates of open tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {upcoming.map((t) => {
              const d = daysUntil(t.committedDate, now);
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => navigate(`/tasks/${t.id}`)}
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
                      {t.code} · {t.qdnbCode}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {t.leadUnitName}
                    </span>
                  </span>
                </button>
              );
            })}
            {upcoming.length === 0 && (
              <p className="text-xs text-muted-foreground">No open task.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Select({
  value,
  onChange,
  placeholder,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  children: React.ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "h-9 max-w-[14rem] rounded-lg border border-input bg-background px-2.5 text-sm dark:bg-input/30",
        value && "border-primary/50 font-medium",
      )}
    >
      <option value="">{placeholder}</option>
      {children}
    </select>
  );
}
