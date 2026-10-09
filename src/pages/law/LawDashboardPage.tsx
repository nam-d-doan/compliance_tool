/**
 * PSEUDO CODE (ngắn gọn) — review GĐ3 (Nam: "thiết kế tương tự LM, đưa hạng
 * mục quan trọng lên trước, chuyên viên chỉ thấy case đang mở của mình, bám
 * KPI/SLA")
 * 1. 1 API (useLawDashboard) tính sẵn mọi số liệu; server tự xác định góc
 *    nhìn từ token (scope) — trang chỉ render, không tự lọc.
 * 2. Thứ tự: nhãn góc nhìn → Việc cần xử lý (sort theo SLA, ưu tiên, hạn;
 *    ghi bước tiếp theo do ai làm) + Yêu cầu đang dừng ở đâu → thẻ KPI (cần
 *    hành động trước, tỷ lệ sau) → chart SLA/KPI → chart phân bổ.
 * 3. Chart tải công việc, theo đơn vị, KPI theo chuyên viên chỉ ở góc nhìn
 *    Quản lý. Mục tiêu KPI 80% là số tạm — chờ Nam chốt.
 */
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { format, parseISO } from "date-fns";
import {
  AlertTriangle,
  Briefcase,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Eye,
  Gavel,
  List,
  PlusCircle,
  ShieldCheck,
  Stamp,
} from "lucide-react";
import { KPICard } from "@/components/common/KPICard";
import { PageHero, EmptyState, ErrorState } from "@/components/common";
import { CardSkeleton, ChartSkeleton, ListSkeleton } from "@/components/common/Skeletons";
import { PieChartCard } from "@/components/charts/PieChartCard";
import { BarChartCard } from "@/components/charts/BarChartCard";
import { RISK_CHART_COLORS } from "@/components/charts/chart-theme";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores";
import { useLawDashboard } from "@/hooks/queries";
import { hasPermission } from "@/constants/rbac";
import { ROUTES } from "@/constants/routes";
import { LAW_PRIORITY_STYLES, LAW_STATUS_LABELS, type LawPriorityTier } from "@/constants/law";
import { useL, useTerm, useDateLocale, type Bi } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { LawDashboardSummary, LawQueueItem } from "@/types";

/** Mục tiêu KPI demo — chưa có số chính thức từ Nam/pháp chế. */
const KPI_TARGET = 80;

const SLA_COLORS = {
  good: RISK_CHART_COLORS.low,
  warn: RISK_CHART_COLORS.medium,
  bad: RISK_CHART_COLORS.critical,
  neutral: "#94a3b8",
};

const SLA_CHIP: Record<LawQueueItem["slaState"], { label: Bi; className: string }> = {
  overdue: { label: ["Overdue", "Quá hạn"], className: "bg-destructive/10 text-destructive" },
  due_soon: { label: ["Due soon", "Sắp đến hạn"], className: "bg-warning-bg text-warning" },
  upcoming: { label: ["On track", "Còn hạn"], className: "bg-muted text-muted-foreground" },
};

export default function LawDashboardPage() {
  const { role, user } = useAuthStore();
  const L = useL();
  const term = useTerm();
  const canCreate = hasPermission(role, "law:create");
  const dashboard = useLawDashboard();
  const data = dashboard.data;
  const isSpecialist = data?.scope === "specialist";
  const heroTitle = isSpecialist
    ? L("My Advisory Requests", "Yêu cầu tư vấn của tôi")
    : L("Legal Advisory Workflow", "Quy trình tư vấn pháp lý");
  const heroSubtitle = L("Work queue, SLA & KPIs.", "Việc cần xử lý, SLA & KPI.");

  if (dashboard.isPending) {
    return (
      <div className="space-y-6">
        <PageHero title={heroTitle} subtitle={heroSubtitle} />
        <ListSkeleton />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
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

  const tierLabel = (t: LawPriorityTier) => term(LAW_PRIORITY_STYLES[t].label);
  const slaTrendData = data.slaTrend.map((m) => ({
    month: format(parseISO(`${m.month}-01`), "MM/yyyy"),
    onTime: m.onTime,
    late: m.late,
  }));
  const slaStatusData = [
    { name: L("Closed on time", "Đóng đúng hạn"), value: data.slaStatus.closedOnTime },
    { name: L("Closed late", "Đóng trễ hạn"), value: data.slaStatus.closedLate },
    { name: L("Open — within SLA", "Đang mở — trong hạn"), value: data.slaStatus.openWithinSla },
    { name: L("Open — SLA breached", "Đang mở — quá hạn"), value: data.slaStatus.openBreached },
  ];
  const kpiData = [
    { name: L("On-time", "Đúng hạn"), actual: data.onTimeCompletionRate, target: KPI_TARGET },
    { name: L("Quality", "Chất lượng"), actual: data.qualityRate, target: KPI_TARGET },
    { name: L("Alert resolution", "Xử lý cảnh báo"), actual: data.alertResolutionRate, target: KPI_TARGET },
  ];
  const ownerKpiData = data.ownerKpi.map((k) => ({ name: k.userName, onTime: k.onTimeRate, quality: k.qualityRate }));
  const statusData = data.statusDistribution
    .filter((d) => d.count > 0)
    .map((d) => ({ name: term(LAW_STATUS_LABELS[d.status]), value: d.count }));
  const priorityData = data.priorityDistribution
    .filter((d) => d.count > 0)
    .map((d) => ({ name: tierLabel(d.priorityTier), value: d.count }));
  const workloadData = data.ownerWorkload.map((w) => ({ name: w.userName, value: w.openRequestCount }));
  const unitData = data.unitDistribution.map((d) => ({ name: d.unitName, value: d.count }));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="space-y-6">
      <PageHero title={heroTitle} subtitle={heroSubtitle}>
        <Button variant="outline" asChild>
          <Link to={ROUTES.LAW.LIST}>
            <List className="size-4" aria-hidden="true" />
            {L("View List", "Xem danh sách")}
          </Link>
        </Button>
        {canCreate && (
          <Button asChild>
            <Link to={ROUTES.LAW.CREATE}>
              <PlusCircle className="size-4" aria-hidden="true" />
              {L("New Request", "Tạo yêu cầu")}
            </Link>
          </Button>
        )}
      </PageHero>

      {/* Nam review: 2 góc nhìn phải nhận ra ngay. */}
      <div
        className={cn(
          "flex flex-wrap items-center gap-2 rounded-lg px-3 py-2 text-sm",
          isSpecialist ? "bg-info-bg text-info" : "bg-success-bg text-success",
        )}
      >
        <Eye className="size-4 shrink-0" aria-hidden="true" />
        <span className="font-medium">
          {isSpecialist ? L("View: Advisory Specialist", "Góc nhìn: Chuyên viên tư vấn") : L("View: Manager", "Góc nhìn: Quản lý")}
        </span>
        <span className="text-muted-foreground">
          {isSpecialist
            ? `${user?.name ?? ""} — ${L("only open requests assigned to you", "chỉ các yêu cầu đang mở bạn phụ trách")}`
            : L("all requests, with workload and per-specialist KPIs", "toàn bộ yêu cầu, kèm tải công việc và KPI từng chuyên viên")}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <QueueCard className="lg:col-span-2" data={data} showOwner={!isSpecialist} />
        <HoldersCard data={data} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          label={L("SLA alerts", "Cảnh báo SLA")}
          value={data.totalRedFlagRequests}
          icon={AlertTriangle}
          iconClassName="bg-destructive/10 text-destructive"
        />
        <KPICard label={L("Open requests", "Yêu cầu đang mở")} value={data.totalOpen} icon={Briefcase} />
        <KPICard
          label={L("Awaiting assessment", "Chờ đánh giá ưu tiên")}
          value={data.awaitingAssessment}
          icon={Gavel}
          subtitle={L("Manager to confirm priority", "Manager cần chốt mức ưu tiên")}
        />
        <KPICard
          label={L("Awaiting approval", "Chờ phê duyệt ý kiến")}
          value={data.awaitingApproval}
          icon={Stamp}
          subtitle={L("Manager to approve the opinion", "Manager cần duyệt ý kiến tư vấn")}
        />
        <KPICard
          label={L("On-time completion", "Hoàn thành đúng hạn")}
          value={`${data.onTimeCompletionRate}%`}
          icon={Clock}
          subtitle={L("Closed within the SLA due date", "Đóng trong hạn SLA")}
        />
        <KPICard
          label={L("Quality rate", "Tỷ lệ chất lượng")}
          value={`${data.qualityRate}%`}
          icon={ShieldCheck}
          subtitle={L("Approved without being returned", "Được duyệt không bị trả lại")}
        />
        <KPICard
          label={L("Alert resolution", "Xử lý cảnh báo")}
          value={`${data.alertResolutionRate}%`}
          icon={ClipboardCheck}
          subtitle={L("Flagged requests already resolved", "Yêu cầu gắn cờ đã xử lý xong")}
        />
        <KPICard label={L("Closed requests", "Yêu cầu đã đóng")} value={data.totalCompleted} icon={CheckCircle2} />
      </div>

      <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-2">
        <BarChartCard
          title={L("SLA by Month", "SLA theo tháng")}
          subtitle={L("Requests closed on time vs. late", "Yêu cầu đóng đúng hạn so với trễ hạn")}
          data={slaTrendData}
          xKey="month"
          yKeys={[
            { key: "onTime", name: L("On time", "Đúng hạn"), color: SLA_COLORS.good },
            { key: "late", name: L("Late", "Trễ hạn"), color: SLA_COLORS.bad },
          ]}
          height={240}
          className="h-full"
        />
        <PieChartCard
          title={L("SLA Status", "Trạng thái SLA")}
          data={slaStatusData}
          nameKey="name"
          valueKey="value"
          colors={[SLA_COLORS.good, SLA_COLORS.warn, SLA_COLORS.neutral, SLA_COLORS.bad]}
          height={240}
          className="h-full"
        />
        <BarChartCard
          title={L("KPI vs. Target", "KPI so với mục tiêu")}
          subtitle={L("Target is a demo placeholder (80%)", "Mục tiêu là giá trị demo (80%)")}
          data={kpiData}
          xKey="name"
          yKeys={[
            { key: "actual", name: L("Actual %", "Thực tế %") },
            { key: "target", name: L("Target %", "Mục tiêu %"), color: SLA_COLORS.neutral },
          ]}
          height={240}
          className="h-full"
        />
        {!isSpecialist && (
          <BarChartCard
            title={L("KPI by Specialist", "KPI theo chuyên viên")}
            data={ownerKpiData}
            xKey="name"
            yKeys={[
              { key: "onTime", name: L("On-time %", "Đúng hạn %") },
              { key: "quality", name: L("Quality %", "Chất lượng %") },
            ]}
            height={240}
            className="h-full"
          />
        )}
      </div>

      <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-2">
        <PieChartCard
          title={isSpecialist ? L("My Open Requests by Status", "Yêu cầu đang mở theo trạng thái") : L("By Status", "Theo trạng thái")}
          data={statusData}
          nameKey="name"
          valueKey="value"
          height={240}
          className="h-full"
        />
        <BarChartCard
          title={L("By Priority", "Theo mức ưu tiên")}
          data={priorityData}
          xKey="name"
          yKeys={[{ key: "value", name: L("Requests", "Yêu cầu") }]}
          height={240}
          className="h-full"
        />
        {!isSpecialist && (
          <BarChartCard
            title={L("Specialist Workload", "Tải công việc chuyên viên")}
            subtitle={L("Number of open requests", "Số yêu cầu đang mở")}
            data={workloadData}
            xKey="name"
            yKeys={[{ key: "value", name: L("Open requests", "Yêu cầu đang mở") }]}
            height={240}
            className="h-full"
          />
        )}
        {!isSpecialist && (
          <BarChartCard
            title={L("By Requesting Unit", "Theo đơn vị gửi yêu cầu")}
            data={unitData}
            xKey="name"
            yKeys={[{ key: "value", name: L("Requests", "Yêu cầu") }]}
            height={240}
            className="h-full"
          />
        )}
      </div>
    </motion.div>
  );
}

function QueueCard({ data, showOwner, className }: { data: LawDashboardSummary; showOwner: boolean; className?: string }) {
  const L = useL();
  const term = useTerm();
  const dateLocale = useDateLocale();
  const counts: Record<LawQueueItem["slaState"], number> = {
    overdue: data.queueCounts.overdue,
    due_soon: data.queueCounts.dueSoon,
    upcoming: data.queueCounts.upcoming,
  };
  const total = counts.overdue + counts.due_soon + counts.upcoming;
  return (
    <div className={cn("rounded-xl bg-card p-4 ring-1 ring-foreground/10", className)}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="size-4 text-primary" aria-hidden="true" />
          <h3 className="text-sm font-medium">
            {showOwner ? L("Open Requests", "Yêu cầu đang mở") : L("My Work Queue", "Việc của tôi")}
          </h3>
        </div>
        <div className="flex flex-wrap gap-1.5 text-xs">
          {(["overdue", "due_soon", "upcoming"] as const).map((k) => (
            <span key={k} className={cn("rounded-md px-1.5 py-0.5", SLA_CHIP[k].className)}>
              {L(...SLA_CHIP[k].label)} {counts[k]}
            </span>
          ))}
        </div>
      </div>
      {data.queue.length === 0 ? (
        <EmptyState title={L("No open requests", "Không có yêu cầu đang mở")} className="h-40 border-0 bg-transparent" />
      ) : (
        <>
          <div className="max-h-96 overflow-y-auto pr-1">
            <ul className="space-y-2">
              {data.queue.map((q) => (
                <li key={q.id}>
                  <Link
                    to={`/law/${q.id}`}
                    className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-border p-3 text-sm transition-colors hover:border-primary hover:bg-muted/50"
                  >
                    <span
                      className={cn(
                        "w-24 shrink-0 rounded-md px-1.5 py-0.5 text-center text-xs font-medium",
                        SLA_CHIP[q.slaState].className,
                      )}
                    >
                      {L(...SLA_CHIP[q.slaState].label)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="font-medium">{q.title}</span>
                      <span className="block text-xs text-muted-foreground">
                        {q.code} · {term(LAW_PRIORITY_STYLES[q.priorityTier].label)}
                        {showOwner && ` · ${q.ownerName}`}
                      </span>
                    </span>
                    <span className="flex shrink-0 flex-col items-end gap-0.5">
                      <span
                        className={cn(
                          "rounded-md px-1.5 py-0.5 text-[11px] font-medium",
                          q.returned ? "bg-danger-bg text-danger" : "bg-muted text-muted-foreground",
                        )}
                      >
                        {q.returned
                          ? L("Returned — revise opinion", "Bị trả lại — cần sửa")
                          : `${term(LAW_STATUS_LABELS[q.status])} · ${
                              q.nextActor === "manager" ? L("Manager acts", "Manager xử lý") : L("Specialist acts", "Chuyên viên xử lý")
                            }`}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {L("Due", "Hạn")} {format(parseISO(q.dueDate), "dd/MM/yyyy", { locale: dateLocale })}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          {total > data.queue.length && (
            <p className="mt-2 text-xs text-muted-foreground">
              {L(`Showing most urgent ${data.queue.length} of ${total}`, `Hiển thị ${data.queue.length} việc gấp nhất / ${total}`)}
            </p>
          )}
        </>
      )}
    </div>
  );
}

/** "Yêu cầu đang dừng ở đâu": việc đang mở theo bước flow và ai cần xử lý. */
function HoldersCard({ data }: { data: LawDashboardSummary }) {
  const L = useL();
  const discussing = data.totalOpen - data.awaitingAssessment - data.awaitingApproval - data.returnedForRevision;
  const rows: { key: string; label: string; who: string; value: number; bar: string }[] = [
    { key: "assess", label: L("Awaiting priority assessment", "Chờ đánh giá ưu tiên"), who: "Manager", value: data.awaitingAssessment, bar: "bg-info" },
    { key: "discuss", label: L("In discussion", "Đang trao đổi"), who: L("Specialist", "Chuyên viên"), value: discussing, bar: "bg-primary" },
    { key: "returned", label: L("Returned — revising", "Bị trả lại — đang sửa"), who: L("Specialist", "Chuyên viên"), value: data.returnedForRevision, bar: "bg-destructive" },
    { key: "approve", label: L("Awaiting approval", "Chờ phê duyệt ý kiến"), who: "Manager", value: data.awaitingApproval, bar: "bg-warning" },
  ];
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
      <h3 className="text-sm font-medium">{L("Where requests are waiting", "Yêu cầu đang dừng ở đâu")}</h3>
      <p className="mb-4 text-xs text-muted-foreground">
        {L("Open requests by flow step and who acts next", "Yêu cầu đang mở theo bước flow và ai cần xử lý")}
      </p>
      <ul className="space-y-3">
        {rows.map((r) => (
          <li key={r.key}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span>
                {r.label} <span className="text-muted-foreground">· {r.who}</span>
              </span>
              <span className="font-semibold">{r.value}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div className={cn("h-full rounded-full", r.bar)} style={{ width: `${(r.value / max) * 100}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
