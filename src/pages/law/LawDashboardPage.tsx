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

export default function LawDashboardPage() {
  const { role } = useAuthStore();
  const canCreate = hasPermission(role, "law:create");
  const dashboard = useLawDashboard();
  const data = dashboard.data;

  if (dashboard.isPending) {
    return (
      <div className="space-y-6">
        <PageHero title="Legal Advisory Workflow" subtitle="Overview & KPIs." />
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
        <PageHero title="Legal Advisory Workflow" subtitle="Overview & KPIs." />
        <ErrorState onRetry={() => dashboard.refetch()} />
      </div>
    );
  }

  const statusData = data.statusDistribution.map((d) => ({
    name: LAW_STATUS_LABELS[d.status],
    value: d.count,
  }));
  const priorityData = data.priorityDistribution
    .filter((d) => d.count > 0)
    .map((d) => ({ name: LAW_PRIORITY_STYLES[d.priorityTier].label, value: d.count }));
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
      <PageHero title="Legal Advisory Workflow" subtitle="Overview & KPIs.">
        <Button variant="outline" asChild>
          <Link to={ROUTES.LAW.LIST}>
            <List className="size-4" aria-hidden="true" />
            View List
          </Link>
        </Button>
        {canCreate && (
          <Button asChild>
            <Link to={ROUTES.LAW.CREATE}>
              <PlusCircle className="size-4" aria-hidden="true" />
              New Request
            </Link>
          </Button>
        )}
      </PageHero>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <KPICard label="Open Requests" value={data.totalOpen} icon={Briefcase} />
        <KPICard
          label="Requests with Alerts"
          value={data.totalRedFlagRequests}
          icon={AlertTriangle}
          iconClassName="bg-destructive/10 text-destructive"
        />
        <KPICard label="Completed Requests" value={data.totalCompleted} icon={CheckCircle2} />
        <KPICard
          label="On-Time Completion"
          value={`${data.onTimeCompletionRate}%`}
          icon={Clock}
          subtitle="Completed within the SLA due date"
        />
        <KPICard
          label="Quality Rate"
          value={`${data.qualityRate}%`}
          icon={ShieldCheck}
          subtitle="Completed without being sent back for revision"
        />
        <KPICard
          label="Alert Resolution"
          value={`${data.alertResolutionRate}%`}
          icon={AlertTriangle}
          subtitle="Flagged requests already resolved"
        />
      </div>

      <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-2">
        <PieChartCard
          title="By Status"
          data={statusData}
          nameKey="name"
          valueKey="value"
          height={240}
          className="h-full"
        />
        <BarChartCard
          title="By Priority"
          data={priorityData}
          xKey="name"
          yKeys={[{ key: "value", name: "Requests" }]}
          height={240}
          className="h-full"
        />
        <BarChartCard
          title="Specialist Workload"
          subtitle="Number of open requests"
          data={workloadData}
          xKey="name"
          yKeys={[{ key: "value", name: "Open requests" }]}
          height={240}
          className="h-full"
        />
        <BarChartCard
          title="By Requesting Unit"
          data={unitData}
          xKey="name"
          yKeys={[{ key: "value", name: "Requests" }]}
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
            <h3 className="text-sm font-medium">Flagged Requests</h3>
          </div>
          <Badge variant="secondary" className="h-5">
            {items.length}
          </Badge>
        </div>
        {items.length === 0 ? (
          <EmptyState
            title="No requests currently flagged"
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
