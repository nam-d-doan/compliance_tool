/**
 * PSEUDO CODE (ngắn gọn)
 * 1. GĐ4 — 1 API duy nhất (useLMDashboard) trả sẵn mọi số liệu đã tính ở
 *    server (xem handleGetLMDashboard) — trang chỉ render, không tự tính.
 * 2. 6 thẻ KPI: 3 số đếm (mở/đóng/đang cảnh báo) + 3 tỷ lệ (cập nhật tiến
 *    độ, xử lý cảnh báo, đủ tài liệu — đều là PROXY demo, xem comment ở
 *    type LMDashboardSummary, không phải số liệu pháp lý chính thức.
 * 3. 4 biểu đồ: giai đoạn (pie), nhóm vụ việc (bar), tải theo chuyên viên
 *    (bar), theo đơn vị (bar) — tái dùng PieChartCard/BarChartCard như CAP.
 * 4. AI/xuất CSV/đồng bộ Core Banking KHÔNG làm ở GĐ4 — theo thứ tự cắt ở
 *    docs/lm/00-decisions.md mục 7 khi gấp deadline demo 5/10.
 */
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { format, parseISO } from "date-fns";
import {
  AlertTriangle,
  Briefcase,
  CheckCircle2,
  ClipboardCheck,
  FileCheck2,
  Gavel,
  List,
  PlusCircle,
  Eye,
} from "lucide-react";
import { KPICard } from "@/components/common/KPICard";
import { PageHero, EmptyState, ErrorState } from "@/components/common";
import { CardSkeleton, ChartSkeleton, ListSkeleton } from "@/components/common/Skeletons";
import { PieChartCard } from "@/components/charts/PieChartCard";
import { BarChartCard } from "@/components/charts/BarChartCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuthStore } from "@/stores";
import { useLMDashboard } from "@/hooks/queries";
import { hasPermission } from "@/constants/rbac";
import { ROUTES } from "@/constants/routes";
import { getStageLabel, getCaseCategoryLabel } from "@/constants/lm";
import { useLMT, type LMI18nKey } from "@/constants/lm-i18n";
import { PriorityBadge } from "@/components/common";
import { RISK_CHART_COLORS } from "@/components/charts/chart-theme";
import { cn } from "@/lib/utils";
import type { LMDashboardSummary, LMTaskAlertState } from "@/types";

/** Mục tiêu KPI demo — chưa có số chính thức từ Nam/pháp chế. */
const KPI_TARGET = 80;

const SLA_COLORS = {
  good: RISK_CHART_COLORS.low,
  bad: RISK_CHART_COLORS.critical,
  neutral: "#94a3b8",
};

const ALERT_CHIP: Record<LMTaskAlertState, { key: LMI18nKey; className: string }> = {
  overdue: { key: "alertOverdue", className: "bg-destructive/10 text-destructive" },
  due_soon: { key: "alertDueSoon", className: "bg-warning-bg text-warning" },
  upcoming: { key: "alertUpcoming", className: "bg-muted text-muted-foreground" },
  done: { key: "alertDone", className: "bg-muted text-muted-foreground" },
};

export default function LMDashboardPage() {
  const { role, user } = useAuthStore();
  const { t, lang } = useLMT();
  const canCreate = hasPermission(role, "lm:create");
  // Nam review R1 (docs/lm/02-review-changes.md mục 3): chuyên viên chỉ
  // thấy hồ sơ của mình, Manager/Admin vẫn thấy toàn hàng như cũ.
  const isSpecialistView = role === "owner";
  const dashboard = useLMDashboard(isSpecialistView ? user?.id : undefined);
  const data = dashboard.data;
  const heroTitle = isSpecialistView ? t("heroTitleSpecialist") : t("heroTitleManager");
  const heroSubtitle = isSpecialistView
    ? t("heroSubtitleSpecialist")
    : t("heroSubtitleManager");

  if (dashboard.isPending) {
    return (
      <div className="space-y-6">
        <PageHero title={heroTitle} subtitle={heroSubtitle} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
        <ListSkeleton />
      </div>
    );
  }

  if (dashboard.isError || !data) {
    return (
      <div className="space-y-6">
        <PageHero title={heroTitle} subtitle={heroSubtitle} />
        <ErrorState onRetry={() => dashboard.refetch()} />
      </div>
    );
  }

  const stageData = data.stageDistribution.map((d) => ({
    name: getStageLabel(d.stage, lang),
    value: d.count,
  }));
  const categoryData = data.categoryDistribution
    .filter((d) => d.count > 0)
    .map((d) => ({ name: getCaseCategoryLabel(d.category, lang), value: d.count }));
  const workloadData = data.ownerWorkload.map((w) => ({
    name: w.userName,
    value: w.openCaseCount,
  }));
  const unitData = data.unitDistribution.map((d) => ({
    name: d.unitName,
    value: d.count,
  }));
  const slaTrendData = data.slaTrend.map((m) => ({
    month: format(parseISO(`${m.month}-01`), "MM/yyyy"),
    onTime: m.onTime,
    late: m.late,
  }));
  const deadlineSlaData = [
    { name: t("slaResolved"), value: data.deadlineSla.resolved },
    { name: t("slaWithin"), value: data.deadlineSla.withinSla },
    { name: t("slaBreached"), value: data.deadlineSla.breached },
  ];
  const kpiVsTargetData = [
    { name: t("kpiOnTime"), actual: data.onTimeCompletionRate, target: KPI_TARGET },
    { name: t("kpiAlertRes"), actual: data.alertResolutionRate, target: KPI_TARGET },
    { name: t("kpiProgress"), actual: data.milestoneUpdateRate, target: KPI_TARGET },
    { name: t("kpiDocs"), actual: data.documentCompletionRate, target: KPI_TARGET },
  ];
  const ownerKpiData = data.ownerKpi.map((k) => ({
    name: k.userName,
    onTime: k.onTimeRate,
    alertRes: k.alertResolutionRate,
  }));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <PageHero title={heroTitle} subtitle={heroSubtitle}>
        <Button variant="outline" asChild>
          <Link to={ROUTES.LM.LIST}>
            <List className="size-4" aria-hidden="true" />
            {t("viewList")}
          </Link>
        </Button>
        {canCreate && (
          <Button asChild>
            <Link to={ROUTES.LM.CREATE}>
              <PlusCircle className="size-4" aria-hidden="true" />
              {t("newCase")}
            </Link>
          </Button>
        )}
      </PageHero>

      {/* Nam review: 2 góc nhìn phải nhận ra ngay, không phải so 2 màn hình. */}
      <div
        className={cn(
          "flex flex-wrap items-center gap-2 rounded-lg px-3 py-2 text-sm",
          isSpecialistView ? "bg-info-bg text-info" : "bg-success-bg text-success",
        )}
      >
        <Eye className="size-4 shrink-0" aria-hidden="true" />
        <span className="font-medium">
          {isSpecialistView ? t("viewSpecialist") : t("viewManager")}
        </span>
        <span className="text-muted-foreground">
          {isSpecialistView
            ? `${user?.name ?? ""} — ${t("viewSpecialistScope")}`
            : t("viewManagerScope")}
        </span>
      </div>

      {/* Nam review: work list first, ranked overdue → due soon → upcoming,
          then priority, then due date (server-sorted). */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <TasksCard
          className="lg:col-span-2"
          title={isSpecialistView ? t("myTasksSpecialist") : t("myTasksManager")}
          tasks={data.openTasks}
          counts={data.taskCounts}
          showOwner={!isSpecialistView}
        />
        <NeedsAttentionCard items={data.topRedFlagCases} />
      </div>

      {/* KPI cards ordered by urgency: alerts/open (act now) -> SLA/compliance
          rates (KPI a-d) -> closed (least actionable, a record). */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7">
        <KPICard
          label={t("kpiAlerts")}
          value={data.totalRedFlagCases}
          icon={AlertTriangle}
          iconClassName="bg-destructive/10 text-destructive"
        />
        <KPICard label={t("kpiOpen")} value={data.totalOpen} icon={Briefcase} />
        <KPICard
          label={t("kpiOnTime")}
          value={`${data.onTimeCompletionRate}%`}
          icon={Gavel}
          subtitle={t("kpiOnTimeSub")}
        />
        <KPICard
          label={t("kpiAlertRes")}
          value={`${data.alertResolutionRate}%`}
          icon={Gavel}
          subtitle={t("kpiAlertResSub")}
        />
        <KPICard
          label={t("kpiProgress")}
          value={`${data.milestoneUpdateRate}%`}
          icon={ClipboardCheck}
          subtitle={t("kpiProgressSub")}
        />
        <KPICard
          label={t("kpiDocs")}
          value={`${data.documentCompletionRate}%`}
          icon={FileCheck2}
          subtitle={t("kpiDocsSub")}
        />
        <KPICard label={t("kpiClosed")} value={data.totalClosed} icon={CheckCircle2} />
      </div>

      {/* Performance (SLA/KPI) before distribution — answers "are we on
          track?" before "where is the volume?". */}
      <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-2">
        <BarChartCard
          title={t("chartSlaTrend")}
          subtitle={t("chartSlaTrendSub")}
          data={slaTrendData}
          xKey="month"
          yKeys={[
            { key: "onTime", name: t("seriesOnTime"), color: SLA_COLORS.good },
            { key: "late", name: t("seriesLate"), color: SLA_COLORS.bad },
          ]}
          height={240}
          className="h-full"
        />
        <PieChartCard
          title={t("chartDeadlineSla")}
          data={deadlineSlaData}
          nameKey="name"
          valueKey="value"
          colors={[SLA_COLORS.good, SLA_COLORS.neutral, SLA_COLORS.bad]}
          height={240}
          className="h-full"
        />
        <BarChartCard
          title={t("chartKpiVsTarget")}
          subtitle={t("chartKpiVsTargetSub")}
          data={kpiVsTargetData}
          xKey="name"
          yKeys={[
            { key: "actual", name: t("seriesActual") },
            { key: "target", name: t("seriesTarget"), color: SLA_COLORS.neutral },
          ]}
          height={240}
          className="h-full"
        />
        {!isSpecialistView && (
          <BarChartCard
            title={t("chartOwnerKpi")}
            data={ownerKpiData}
            xKey="name"
            yKeys={[
              { key: "onTime", name: t("seriesOnTimePct") },
              { key: "alertRes", name: t("seriesAlertRes") },
            ]}
            height={240}
            className="h-full"
          />
        )}
      </div>

      {/* Distribution charts: pipeline view always matters; Workload/Unit are
          manager-only (bank-wide) decision inputs. */}
      <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-2">
        <PieChartCard
          title={t("chartByStage")}
          data={stageData}
          nameKey="name"
          valueKey="value"
          height={240}
          className="h-full"
        />
        {!isSpecialistView && (
          <BarChartCard
            title={t("chartWorkload")}
            subtitle={t("chartWorkloadSub")}
            data={workloadData}
            xKey="name"
            yKeys={[{ key: "value", name: t("chartOpenCasesSeries") }]}
            height={240}
            className="h-full"
          />
        )}
        <BarChartCard
          title={t("chartByCategory")}
          data={categoryData}
          xKey="name"
          yKeys={[{ key: "value", name: t("chartCasesSeries") }]}
          height={240}
          className="h-full"
        />
        {!isSpecialistView && (
          <BarChartCard
            title={t("chartByUnit")}
            data={unitData}
            xKey="name"
            yKeys={[{ key: "value", name: t("chartCasesSeries") }]}
            height={240}
            className="h-full"
          />
        )}
      </div>
    </motion.div>
  );
}

function TasksCard({
  title,
  tasks,
  counts,
  showOwner,
  className,
}: {
  title: string;
  tasks: LMDashboardSummary["openTasks"];
  counts: LMDashboardSummary["taskCounts"];
  showOwner: boolean;
  className?: string;
}) {
  const { t } = useLMT();
  const total = counts.overdue + counts.dueSoon + counts.upcoming;
  return (
    <div className={cn("rounded-xl bg-card p-4 ring-1 ring-foreground/10", className)}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="size-4 text-primary" aria-hidden="true" />
          <h3 className="text-sm font-medium">{title}</h3>
        </div>
        <div className="flex flex-wrap gap-1.5 text-xs">
          <span className={cn("rounded-md px-1.5 py-0.5", ALERT_CHIP.overdue.className)}>
            {t("alertOverdue")} {counts.overdue}
          </span>
          <span className={cn("rounded-md px-1.5 py-0.5", ALERT_CHIP.due_soon.className)}>
            {t("alertDueSoon")} {counts.dueSoon}
          </span>
          <span className={cn("rounded-md px-1.5 py-0.5", ALERT_CHIP.upcoming.className)}>
            {t("alertUpcoming")} {counts.upcoming}
          </span>
        </div>
      </div>
      {tasks.length === 0 ? (
        <EmptyState title={t("noOpenTasks")} className="h-40 border-0 bg-transparent" />
      ) : (
        <>
          <div className="max-h-80 overflow-y-auto pr-1">
            <ul className="space-y-2">
              {tasks.map((task) => {
                const chip = ALERT_CHIP[task.alertState];
                return (
                  <li key={task.id}>
                    <Link
                      to={`/lm/${task.caseId}`}
                      className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-border p-3 text-sm transition-colors hover:border-primary hover:bg-muted/50"
                    >
                      <span
                        className={cn(
                          "w-24 shrink-0 rounded-md px-1.5 py-0.5 text-center text-xs font-medium",
                          chip.className,
                        )}
                      >
                        {t(chip.key)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="font-medium">{task.title}</span>
                        <span className="block text-xs text-muted-foreground">
                          {task.caseCode}
                          {showOwner && ` · ${task.ownerName}`}
                        </span>
                      </span>
                      <PriorityBadge priority={task.priority} />
                      <span className="w-20 shrink-0 text-right text-xs text-muted-foreground">
                        {format(parseISO(task.dueDate), "dd/MM/yyyy")}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
          {total > tasks.length && (
            <p className="mt-2 text-xs text-muted-foreground">
              {t("showingTopTasks")} / {total}
            </p>
          )}
        </>
      )}
    </div>
  );
}

function NeedsAttentionCard({
  items,
}: {
  items: { id: string; code: string; title: string; ownerName: string; redFlagCount: number }[];
}) {
  const { t } = useLMT();
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 text-destructive" aria-hidden="true" />
            <h3 className="text-sm font-medium">{t("needsAttention")}</h3>
          </div>
          <Badge variant="secondary" className="h-5">
            {items.length}
          </Badge>
        </div>
        {items.length === 0 ? (
          <EmptyState
            title={t("noCasesFlagged")}
            className="h-40 border-0 bg-transparent"
          />
        ) : (
          <ScrollArea className="max-h-72">
            <ul className="space-y-2">
              {items.map((c) => (
                <li key={c.id}>
                  <Link
                    to={`/lm/${c.id}`}
                    className="flex items-center justify-between gap-2 rounded-lg border border-border p-3 text-sm transition-colors hover:border-primary hover:bg-muted/50"
                  >
                    <span>
                      <span className="font-medium">{c.code}</span>
                      <span className="text-muted-foreground"> — {c.title}</span>
                    </span>
                    <span className="flex items-center gap-3 shrink-0">
                      <span className="text-muted-foreground">{c.ownerName}</span>
                      <Badge variant="destructive">{c.redFlagCount}</Badge>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </ScrollArea>
        )}
      </div>
    </motion.div>
  );
}
