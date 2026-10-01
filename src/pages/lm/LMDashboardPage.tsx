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
import {
  AlertTriangle,
  Briefcase,
  CheckCircle2,
  ClipboardCheck,
  FileCheck2,
  Gavel,
  List,
  PlusCircle,
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
import { STAGE_STYLES, CASE_CATEGORY_LABELS } from "@/constants/lm";

export default function LMDashboardPage() {
  const { role } = useAuthStore();
  const canCreate = hasPermission(role, "lm:create");
  const dashboard = useLMDashboard();
  const data = dashboard.data;

  if (dashboard.isPending) {
    return (
      <div className="space-y-6">
        <PageHero title="Tố tụng & Thi hành án" subtitle="Tổng quan & KPI." />
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
        <PageHero title="Tố tụng & Thi hành án" subtitle="Tổng quan & KPI." />
        <ErrorState onRetry={() => dashboard.refetch()} />
      </div>
    );
  }

  const stageData = data.stageDistribution.map((d) => ({
    name: STAGE_STYLES[d.stage].label,
    value: d.count,
  }));
  const categoryData = data.categoryDistribution
    .filter((d) => d.count > 0)
    .map((d) => ({ name: CASE_CATEGORY_LABELS[d.category], value: d.count }));
  const workloadData = data.ownerWorkload.map((w) => ({
    name: w.userName,
    value: w.openCaseCount,
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
      <PageHero title="Tố tụng & Thi hành án" subtitle="Tổng quan & KPI.">
        <Button variant="outline" asChild>
          <Link to={ROUTES.LM.LIST}>
            <List className="size-4" aria-hidden="true" />
            Xem danh sách
          </Link>
        </Button>
        {canCreate && (
          <Button asChild>
            <Link to={ROUTES.LM.CREATE}>
              <PlusCircle className="size-4" aria-hidden="true" />
              Tạo hồ sơ
            </Link>
          </Button>
        )}
      </PageHero>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <KPICard label="Hồ sơ đang mở" value={data.totalOpen} icon={Briefcase} />
        <KPICard
          label="Hồ sơ đang cảnh báo"
          value={data.totalRedFlagCases}
          icon={AlertTriangle}
          iconClassName="bg-destructive/10 text-destructive"
        />
        <KPICard label="Hồ sơ đã đóng" value={data.totalClosed} icon={CheckCircle2} />
        <KPICard
          label="Cập nhật tiến độ"
          value={`${data.milestoneUpdateRate}%`}
          icon={ClipboardCheck}
          subtitle="Mốc hoàn thành có ghi lịch sử"
        />
        <KPICard
          label="Xử lý cảnh báo"
          value={`${data.alertResolutionRate}%`}
          icon={Gavel}
          subtitle="Hạn đã bật cờ mà xử lý xong"
        />
        <KPICard
          label="Đủ tài liệu"
          value={`${data.documentCompletionRate}%`}
          icon={FileCheck2}
          subtitle="Theo số lượng yêu cầu/giai đoạn"
        />
      </div>

      <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-2">
        <PieChartCard
          title="Theo giai đoạn"
          data={stageData}
          nameKey="name"
          valueKey="value"
          height={240}
          className="h-full"
        />
        <BarChartCard
          title="Theo nhóm vụ việc"
          data={categoryData}
          xKey="name"
          yKeys={[{ key: "value", name: "Hồ sơ" }]}
          height={240}
          className="h-full"
        />
        <BarChartCard
          title="Tải công việc theo chuyên viên"
          subtitle="Số hồ sơ đang mở"
          data={workloadData}
          xKey="name"
          yKeys={[{ key: "value", name: "Hồ sơ mở" }]}
          height={240}
          className="h-full"
        />
        <BarChartCard
          title="Theo đơn vị"
          data={unitData}
          xKey="name"
          yKeys={[{ key: "value", name: "Hồ sơ" }]}
          height={240}
          className="h-full"
        />
      </div>

      <TopRedFlagCard items={data.topRedFlagCases} />
    </motion.div>
  );
}

function TopRedFlagCard({
  items,
}: {
  items: { id: string; code: string; title: string; ownerName: string; redFlagCount: number }[];
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
            <h3 className="text-sm font-medium">Hồ sơ cảnh báo nhiều nhất</h3>
          </div>
          <Badge variant="secondary" className="h-5">
            {items.length}
          </Badge>
        </div>
        {items.length === 0 ? (
          <EmptyState
            title="Không có hồ sơ nào đang cảnh báo"
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
