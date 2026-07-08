import { useMemo } from "react";
import { Link } from "react-router-dom";
import { format, isSameMonth, parseISO } from "date-fns";
import {
  AlertCircle,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  Clock,
  List,
  PlusCircle,
} from "lucide-react";
import { motion } from "motion/react";
import { KPICard } from "@/components/common/KPICard";
import { PageHero } from "@/components/common";
import { ErrorState } from "@/components/common/ErrorState";
import {
  CardSkeleton,
  ChartSkeleton,
  ListSkeleton,
} from "@/components/common/Skeletons";
import { CAPCard } from "@/components/cap/CAPCard";
import { PieChartCard } from "@/components/charts/PieChartCard";
import { BarChartCard } from "@/components/charts/BarChartCard";
import { AreaChartCard } from "@/components/charts/AreaChartCard";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuthStore } from "@/stores";
import { useCAPList } from "@/hooks/queries";
import { hasPermission } from "@/constants/rbac";
import { ROUTES } from "@/constants/routes";
import { isOverdueDueDate } from "@/lib/due-date";
import type { CAP } from "@/types";
import type { PriorityLevel } from "@/constants/status";

const PRIORITY_ORDER: Record<PriorityLevel, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

function countBy<T>(items: T[], key: keyof T) {
  const map = new Map<string, number>();
  items.forEach((item) => {
    const value = String(item[key] ?? "Unknown");
    map.set(value, (map.get(value) ?? 0) + 1);
  });
  return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
}

function daysBetween(start: string, end: string) {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

export default function CAPDashboardPage() {
  const { user, role } = useAuthStore();
  const canCreate = hasPermission(role, "cap:create");
  const capsQuery = useCAPList({}, 1, 500);
  const caps = useMemo(() => capsQuery.data?.items ?? [], [capsQuery.data]);

  const {
    openCount,
    overdueCount,
    pendingApprovalCount,
    closedThisMonthCount,
    avgDaysToClose,
    statusData,
    priorityData,
    trendData,
    departmentData,
    myCaps,
    needsApproval,
  } = useMemo(() => {
    const now = new Date();
    const thisMonth = isSameMonth;

    const openItems = caps.filter((c) => c.status !== "Closed");
    const overdueItems = caps.filter((c) =>
      isOverdueDueDate(c.dueDate, c.status === "Closed"),
    );
    const pendingItems = caps.filter((c) => c.status === "Pending Approval");
    const closedThisMonthItems = caps.filter(
      (c) => c.status === "Closed" && thisMonth(parseISO(c.updatedAt), now),
    );
    const closedItems = caps.filter((c) => c.status === "Closed");
    const avgDays =
      closedItems.length > 0
        ? Math.round(
            closedItems.reduce(
              (sum, c) => sum + daysBetween(c.createdAt, c.updatedAt),
              0,
            ) / closedItems.length,
          )
        : 0;

    const trendMap = new Map<string, number>();
    caps.forEach((c) => {
      const label = format(parseISO(c.createdAt), "MMM yyyy");
      trendMap.set(label, (trendMap.get(label) ?? 0) + 1);
    });
    const sortedTrend = Array.from(trendMap.entries())
      .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
      .map(([name, value]) => ({ name, value }));

    return {
      openCount: openItems.length,
      overdueCount: overdueItems.length,
      pendingApprovalCount: pendingItems.length,
      closedThisMonthCount: closedThisMonthItems.length,
      avgDaysToClose: avgDays,
      statusData: countBy(caps, "status"),
      priorityData: countBy(caps, "priority").sort(
        (a, b) =>
          PRIORITY_ORDER[a.name as PriorityLevel] -
          PRIORITY_ORDER[b.name as PriorityLevel],
      ),
      trendData: sortedTrend,
      departmentData: countBy(caps, "department").sort(
        (a, b) => b.value - a.value,
      ),
      myCaps: caps
        .filter((c) => c.ownerId === user?.id)
        .sort(
          (a, b) =>
            new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
        )
        .slice(0, 5),
      needsApproval: caps
        .filter(
          (c) => c.status === "Pending Approval" && c.approverId === user?.id,
        )
        .sort(
          (a, b) =>
            new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
        )
        .slice(0, 5),
    };
  }, [caps, user?.id]);

  if (capsQuery.isPending) {
    return (
      <div className="space-y-6">
        <PageHero
          title="Corrective Action Plans"
          subtitle="Monitor, track and remediate compliance gaps."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <ChartSkeleton />
          <ChartSkeleton />
          <ListSkeleton />
        </div>
      </div>
    );
  }

  if (capsQuery.error) {
    return (
      <div className="space-y-6">
        <PageHero
          title="Corrective Action Plans"
          subtitle="Monitor, track and remediate compliance gaps."
        />
        <ErrorState
          title="Could not load dashboard"
          message={capsQuery.error.message}
          onRetry={() => capsQuery.refetch()}
        />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <PageHero
        title="Corrective Action Plans"
        subtitle="Monitor, track and remediate compliance gaps."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 xl:grid-cols-6">
        <KPICard
          key="open"
          label="Total Open CAPs"
          value={openCount}
          icon={ClipboardList}
          subtitle="Excluding closed"
        />
        <KPICard
          key="overdue"
          label="Overdue CAPs"
          value={overdueCount}
          icon={AlertCircle}
          trend={{ direction: "up", percent: overdueCount, positive: false }}
        />
        <KPICard
          key="pending"
          label="Pending Approval"
          value={pendingApprovalCount}
          icon={Clock}
        />
        <KPICard
          key="closed"
          label="Closed This Month"
          value={closedThisMonthCount}
          icon={CheckCircle2}
        />
        <KPICard
          key="avg"
          label="Avg Time to Close"
          value={`${avgDaysToClose} days`}
          icon={BarChart3}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <div className="md:col-span-1">
          <PieChartCard
            title="CAPs by Status"
            data={statusData}
            nameKey="name"
            valueKey="value"
            loading={capsQuery.isPending}
          />
        </div>

        <div className="md:col-span-1">
          <BarChartCard
            title="CAPs by Priority"
            data={priorityData}
            xKey="name"
            yKeys={[{ key: "value", name: "CAPs" }]}
            loading={capsQuery.isPending}
          />
        </div>

        <div className="md:col-span-1">
          <AreaChartCard
            title="CAPs Over Time"
            subtitle="Created by month"
            data={trendData}
            xKey="name"
            yKeys={[{ key: "value", name: "Created" }]}
            loading={capsQuery.isPending}
          />
        </div>

        <div className="md:col-span-1">
          <BarChartCard
            title="CAPs by Department"
            data={departmentData.slice(0, 8)}
            xKey="name"
            yKeys={[{ key: "value", name: "CAPs" }]}
            loading={capsQuery.isPending}
          />
        </div>

        <div className="lg:col-span-2">
          <CAPListCard
            title="My CAPs"
            items={myCaps}
            emptyText="No CAPs assigned to you."
            action={
              canCreate ? (
                <Button size="sm" asChild>
                  <Link to={ROUTES.CAP.CREATE}>
                    <PlusCircle className="size-4" aria-hidden="true" />
                    Create CAP
                  </Link>
                </Button>
              ) : undefined
            }
          />
        </div>

        <div className="lg:col-span-2">
          <CAPListCard
            title="Needs Approval"
            items={needsApproval}
            emptyText="No CAPs awaiting your approval."
          />
        </div>
      </div>
    </motion.div>
  );
}

interface CAPListCardProps {
  title: string;
  items: CAP[];
  emptyText: string;
  action?: React.ReactNode;
}

function CAPListCard({ title, items, emptyText, action }: CAPListCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      className="h-full"
    >
      <div className="flex h-full flex-col rounded-xl bg-card p-4 ring-1 ring-foreground/10">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <List className="size-4 text-muted-foreground" aria-hidden="true" />
            <h3 className="text-sm font-medium">{title}</h3>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="h-5">
              {items.length}
            </Badge>
            {action}
          </div>
        </div>
        {items.length === 0 ? (
          <EmptyState
            title={emptyText}
            className="h-64 border-0 bg-transparent"
          />
        ) : (
          <ScrollArea className="h-72 pr-3">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              {items.map((item) => (
                <Link key={item.id} to={`/cap/${item.id}`} className="block">
                  <CAPCard item={item} />
                </Link>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
    </motion.div>
  );
}
