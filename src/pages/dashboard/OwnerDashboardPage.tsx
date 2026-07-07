import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from "recharts";
import {
  DashboardLayout,
  DashboardKpiCard,
  DashboardChartCard,
  DashboardActivityFeed,
  DashboardAssignmentsCard,
} from "@/components/dashboard";
import {
  CardSkeleton,
  ChartSkeleton,
  ListSkeleton,
} from "@/components/common/Skeletons";
import { ErrorState } from "@/components/common/ErrorState";
import { EmptyState } from "@/components/common/EmptyState";
import { StatusBadge } from "@/components/common/StatusBadge";
import { PriorityBadge } from "@/components/common/PriorityBadge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuthStore } from "@/stores";
import {
  useDashboard,
  useComplianceList,
  useCAPList,
  useAssignmentList,
} from "@/hooks/queries";
import { format } from "date-fns";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ComplianceObligation } from "@/types";

function useOwnerData() {
  const { user } = useAuthStore();
  const dashboard = useDashboard("owner");
  const compliance = useComplianceList({ page: 1, pageSize: 500 }, 1, 500);
  const caps = useCAPList({ page: 1, pageSize: 500 }, 1, 500);
  const assignments = useAssignmentList({}, 1, 200);

  const isLoading =
    dashboard.isPending || compliance.isPending || caps.isPending;
  const error = dashboard.error ?? compliance.error ?? caps.error;

  return { user, dashboard, compliance, caps, assignments, isLoading, error };
}

function TaskList({
  items,
  title,
  emptyText,
}: {
  items: ComplianceObligation[];
  title: string;
  emptyText: string;
}) {
  return (
    <div className="h-full rounded-xl bg-card p-4 ring-1 ring-foreground/10">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium">{title}</h3>
        <Badge variant="secondary" className="h-5">
          {items.length}
        </Badge>
      </div>
      {items.length === 0 ? (
        <EmptyState
          title={emptyText}
          className="h-64 border-0 bg-transparent"
        />
      ) : (
        <ScrollArea className="h-64 pr-3">
          <ul className="space-y-2">
            {items.map((item) => (
              <li
                key={item.id}
                className={cn(
                  "group flex items-center justify-between gap-3 rounded-lg border border-border bg-background p-2.5 transition-colors hover:bg-muted/50",
                )}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.title}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <StatusBadge status={item.status} size="sm" />
                    <PriorityBadge priority={item.criticality} size="sm" />
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(item.dueDate), "MMM d")}
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  asChild
                  className="shrink-0 opacity-0 group-hover:opacity-100"
                >
                  <Link to={`/obligations/${item.id}`}>
                    <ArrowRight className="size-3.5" aria-hidden="true" />
                  </Link>
                </Button>
              </li>
            ))}
          </ul>
        </ScrollArea>
      )}
    </div>
  );
}

export default function OwnerDashboardPage() {
  const { user, dashboard, compliance, caps, assignments, isLoading, error } =
    useOwnerData();
  const complianceItems = useMemo(
    () => compliance.data?.items ?? [],
    [compliance.data],
  );
  const capItems = useMemo(() => caps.data?.items ?? [], [caps.data]);
  const assignmentItems = useMemo(
    () => assignments.data?.items ?? [],
    [assignments.data],
  );

  const statusData = useMemo(() => {
    const counts = new Map<string, number>();
    complianceItems.forEach((item) => {
      counts.set(item.status, (counts.get(item.status) ?? 0) + 1);
    });
    return Array.from(counts.entries()).map(([name, value]) => ({
      name,
      value,
    }));
  }, [complianceItems]);

  const deadlineData = useMemo(() => {
    const now = new Date();
    const ranges = [
      { label: "0-30 days", count: 0 },
      { label: "31-60 days", count: 0 },
      { label: "61-90 days", count: 0 },
      { label: ">90 days", count: 0 },
    ];

    complianceItems.forEach((item) => {
      const due = new Date(item.dueDate);
      const days = Math.ceil(
        (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );
      if (days <= 30) ranges[0].count++;
      else if (days <= 60) ranges[1].count++;
      else if (days <= 90) ranges[2].count++;
      else ranges[3].count++;
    });

    return ranges;
  }, [complianceItems]);

  const capProgressData = useMemo(
    () =>
      capItems
        .filter((cap) => cap.status !== "Closed")
        .slice(0, 8)
        .map((cap) => ({ name: cap.capId, value: cap.progress })),
    [capItems],
  );

  const myTasks = complianceItems
    .filter((item) =>
      ["Assigned", "Draft", "Pending Information"].includes(item.status),
    )
    .sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
    )
    .slice(0, 10);

  const colors = [
    "#3b82f6",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#06b6d4",
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
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

  if (error) {
    return (
      <ErrorState
        title="Could not load owner dashboard"
        message={error.message}
        onRetry={() => {
          dashboard.refetch();
          compliance.refetch();
          caps.refetch();
        }}
      />
    );
  }

  return (
    <DashboardLayout
      title="Compliance Owner Dashboard"
      subtitle={`Operational dashboard for ${user?.name ?? "the owner"}.`}
      kpis={(dashboard.data?.kpis ?? []).map((kpi, index) => (
        <DashboardKpiCard key={kpi.id} kpi={kpi} index={index} />
      ))}
    >
      <div className="md:col-span-1">
        <DashboardChartCard title="My Compliance Status" delay={0.1}>
          <div className="h-56">
            {statusData.length === 0 ? (
              <EmptyState
                title="No data"
                className="h-full border-0 bg-transparent"
              />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={80}
                  >
                    {statusData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={colors[index % colors.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </DashboardChartCard>
      </div>

      <div className="md:col-span-1">
        <DashboardChartCard title="Upcoming Deadlines" delay={0.15}>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={deadlineData}
                margin={{ top: 8, right: 16, bottom: 0, left: -16 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </DashboardChartCard>
      </div>

      <div className="md:col-span-1">
        <DashboardChartCard title="My CAP Progress" delay={0.2}>
          <div className="h-56">
            {capProgressData.length === 0 ? (
              <EmptyState
                title="No open CAPs"
                className="h-full border-0 bg-transparent"
              />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={capProgressData}
                  layout="vertical"
                  margin={{ top: 8, right: 16, bottom: 0, left: 24 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-muted"
                  />
                  <XAxis
                    type="number"
                    domain={[0, 100]}
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 10 }}
                    width={60}
                  />
                  <Tooltip />
                  <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </DashboardChartCard>
      </div>

      <div className="md:col-span-2">
        <TaskList
          items={myTasks}
          title="My Tasks"
          emptyText="No active tasks"
        />
      </div>

      <div className="md:col-span-1">
        <DashboardActivityFeed
          items={dashboard.data?.activity}
          title="Activity on My Items"
          delay={0.3}
        />
      </div>

      <div className="md:col-span-1">
        <DashboardAssignmentsCard
          title="My Department Assignments"
          description="Priority breakdown of assignments routed for review."
          assignments={assignmentItems}
          breakdown="priority"
          delay={0.35}
        />
      </div>
    </DashboardLayout>
  );
}
