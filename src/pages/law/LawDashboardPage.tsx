/**
 * PSEUDO CODE (ngắn gọn)
 * 1. GĐ4 — 1 API duy nhất (useLawDashboard) trả sẵn mọi số liệu đã tính ở
 *    server (xem handleGetLawDashboard) — trang chỉ render, không tự tính.
 * 2. 6 thẻ KPI: 3 số đếm (mở/đóng/đang cảnh báo) + 3 tỷ lệ KPI a/b/c theo
 *    Phụ lục 3 mục 3.2 — công thức xem type LawDashboardSummary.
 * 3. 4 biểu đồ: trạng thái (pie), mức ưu tiên (bar), tải theo chuyên viên
 *    (bar), theo đơn vị gửi yêu cầu (bar) — khuôn y hệt LMDashboardPage.
 * 4. AI/xuất CSV KHÔNG làm ở GĐ4 — theo thứ tự cắt ở
 *    docs/law/00-decisions.md mục 5 khi gấp deadline demo 5/10.
 */
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import {
  AlertTriangle,
  Briefcase,
  CheckCircle2,
  Clock,
  List,
  PlusCircle,
  ShieldCheck,
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
import { useLawDashboard } from "@/hooks/queries";
import { hasPermission } from "@/constants/rbac";
import { ROUTES } from "@/constants/routes";
import { LAW_PRIORITY_STYLES, LAW_STATUS_LABELS } from "@/constants/law";
import { useL, useTerm } from "@/lib/i18n";

export default function LawDashboardPage() {
  const { role } = useAuthStore();
  const canCreate = hasPermission(role, "law:create");
  const dashboard = useLawDashboard();
  const data = dashboard.data;
  const L = useL();
  const term = useTerm();
  const heroTitle = L("Legal Advisory Workflow", "Quy trình tư vấn pháp lý");
  const heroSubtitle = L("Overview & KPIs.", "Tổng quan & chỉ số KPI.");

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

  const statusData = data.statusDistribution.map((d) => ({
    name: term(LAW_STATUS_LABELS[d.status]),
    value: d.count,
  }));
  const priorityData = data.priorityDistribution
    .filter((d) => d.count > 0)
    .map((d) => ({ name: term(LAW_PRIORITY_STYLES[d.priorityTier].label), value: d.count }));
  const workloadData = data.ownerWorkload.map((w) => ({
    name: w.userName,
    value: w.openRequestCount,
  }));
  const unitData = data.unitDistribution.map((d) => ({
    name: d.unitName,
    value: d.count,
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <KPICard label={L("Open Requests", "Yêu cầu đang mở")} value={data.totalOpen} icon={Briefcase} />
        <KPICard
          label={L("Requests with Alerts", "Yêu cầu có cảnh báo")}
          value={data.totalRedFlagRequests}
          icon={AlertTriangle}
          iconClassName="bg-destructive/10 text-destructive"
        />
        <KPICard
          label={L("Completed Requests", "Yêu cầu đã hoàn thành")}
          value={data.totalCompleted}
          icon={CheckCircle2}
        />
        <KPICard
          label={L("On-Time Completion", "Hoàn thành đúng hạn")}
          value={`${data.onTimeCompletionRate}%`}
          icon={Clock}
          subtitle={L("Completed within the SLA due date", "Hoàn thành trong hạn SLA")}
        />
        <KPICard
          label={L("Quality Rate", "Tỷ lệ chất lượng")}
          value={`${data.qualityRate}%`}
          icon={ShieldCheck}
          subtitle={L("Completed without being sent back for revision", "Hoàn thành không bị trả lại sửa")}
        />
        <KPICard
          label={L("Alert Resolution", "Xử lý cảnh báo")}
          value={`${data.alertResolutionRate}%`}
          icon={AlertTriangle}
          subtitle={L("Flagged requests already resolved", "Yêu cầu gắn cờ đã xử lý xong")}
        />
      </div>

      <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-2">
        <PieChartCard
          title={L("By Status", "Theo trạng thái")}
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
        <BarChartCard
          title={L("Specialist Workload", "Tải công việc chuyên viên")}
          subtitle={L("Number of open requests", "Số yêu cầu đang mở")}
          data={workloadData}
          xKey="name"
          yKeys={[{ key: "value", name: L("Open requests", "Yêu cầu đang mở") }]}
          height={240}
          className="h-full"
        />
        <BarChartCard
          title={L("By Requesting Unit", "Theo đơn vị gửi yêu cầu")}
          data={unitData}
          xKey="name"
          yKeys={[{ key: "value", name: L("Requests", "Yêu cầu") }]}
          height={240}
          className="h-full"
        />
      </div>

      <TopRedFlagCard items={data.topRedFlagRequests} />
    </motion.div>
  );
}

function TopRedFlagCard({
  items,
}: {
  items: { id: string; code: string; title: string; ownerName: string }[];
}) {
  const L = useL();
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
    >
      <div className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 text-destructive" aria-hidden="true" />
            <h3 className="text-sm font-medium">{L("Flagged Requests", "Yêu cầu bị gắn cờ")}</h3>
          </div>
          <Badge variant="secondary" className="h-5">
            {items.length}
          </Badge>
        </div>
        {items.length === 0 ? (
          <EmptyState
            title={L("No requests currently flagged", "Hiện không có yêu cầu bị gắn cờ")}
            className="h-40 border-0 bg-transparent"
          />
        ) : (
          <ScrollArea className="max-h-72">
            <ul className="space-y-2">
              {items.map((r) => (
                <li key={r.id}>
                  <Link
                    to={`/law/${r.id}`}
                    className="flex items-center justify-between gap-2 rounded-lg border border-border p-3 text-sm transition-colors hover:border-primary hover:bg-muted/50"
                  >
                    <span>
                      <span className="font-medium">{r.code}</span>
                      <span className="text-muted-foreground"> — {r.title}</span>
                    </span>
                    <span className="text-muted-foreground">{r.ownerName}</span>
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
