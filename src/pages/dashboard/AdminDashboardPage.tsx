import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  DashboardLayout,
  DashboardKpiCard,
  DashboardChartCard,
  DashboardAdminStats,
  DashboardAssignmentsCard,
} from "@/components/dashboard";
import {
  CardSkeleton,
  ChartSkeleton,
  ListSkeleton,
} from "@/components/common/Skeletons";
import { ErrorState } from "@/components/common/ErrorState";
import { useDashboard, useAssignmentList } from "@/hooks/queries";
import {
  useAdminUsers,
  useAdminAuditLogs,
  useAdminAIConfig,
} from "@/hooks/queries/useAdminQueries";
import {
  CHART_COLORS,
  type ChartDataPoint,
} from "@/components/charts/chart-theme";

function useAdminData() {
  const dashboard = useDashboard("admin");
  const users = useAdminUsers(1, 500);
  const auditLogs = useAdminAuditLogs(1, 100);
  const aiConfig = useAdminAIConfig();
  const assignments = useAssignmentList({}, 1, 200);

  const isLoading =
    dashboard.isPending ||
    users.isPending ||
    auditLogs.isPending ||
    aiConfig.isPending;
  const error =
    dashboard.error ?? users.error ?? auditLogs.error ?? aiConfig.error;

  return {
    dashboard,
    users,
    auditLogs,
    aiConfig,
    assignments,
    isLoading,
    error,
  };
}

export default function AdminDashboardPage() {
  const {
    dashboard,
    users,
    auditLogs,
    aiConfig,
    assignments,
    isLoading,
    error,
  } = useAdminData();

  const userItems = useMemo(() => users.data?.items ?? [], [users.data]);
  const auditItems = useMemo(
    () => auditLogs.data?.items ?? [],
    [auditLogs.data],
  );
  const assignmentItems = useMemo(
    () => assignments.data?.items ?? [],
    [assignments.data],
  );

  const userActivity = useMemo(() => {
    const counts = new Map<string, number>();
    userItems.forEach((user) => {
      const role = user.role;
      counts.set(role, (counts.get(role) ?? 0) + 1);
    });
    return Array.from(counts.entries()).map(([name, value]) => ({
      name,
      value,
    }));
  }, [userItems]);

  const auditEvents = useMemo(() => {
    const grouped = new Map<string, number>();
    auditItems.forEach((log) => {
      const date = new Date(log.timestamp).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      grouped.set(date, (grouped.get(date) ?? 0) + 1);
    });
    return Array.from(grouped.entries())
      .slice(-7)
      .map(([name, value]) => ({ name, value }));
  }, [auditItems]);

  const aiUsage = useMemo(
    () => [
      { name: "Mon", queries: 120 },
      { name: "Tue", queries: 145 },
      { name: "Wed", queries: 132 },
      { name: "Thu", queries: 168 },
      { name: "Fri", queries: 154 },
      { name: "Sat", queries: 78 },
      { name: "Sun", queries: 65 },
    ],
    [],
  );

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
        title="Could not load admin dashboard"
        message={error.message}
        onRetry={() => {
          dashboard.refetch();
          users.refetch();
          auditLogs.refetch();
          aiConfig.refetch();
        }}
      />
    );
  }

  return (
    <DashboardLayout
      title="Admin Dashboard"
      subtitle="User management, roles, organization settings, and system configuration."
      kpis={(dashboard.data?.kpis ?? []).map((kpi, index) => (
        <DashboardKpiCard key={kpi.id} kpi={kpi} index={index} />
      ))}
    >
      <div className="md:col-span-1">
        <DashboardChartCard title="User Activity by Role" delay={0.1}>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={userActivity}
                margin={{ top: 8, right: 16, bottom: 0, left: -16 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar
                  dataKey="value"
                  fill={CHART_COLORS[0]}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </DashboardChartCard>
      </div>

      <div className="md:col-span-1">
        <DashboardChartCard title="Audit Log Events" delay={0.15}>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={
                  (auditEvents.length
                    ? auditEvents
                    : aiUsage) as ChartDataPoint[]
                }
                margin={{ top: 8, right: 16, bottom: 0, left: -16 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={CHART_COLORS[2]}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </DashboardChartCard>
      </div>

      <div className="md:col-span-1">
        <DashboardChartCard title="AI Usage (Queries)" delay={0.2}>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={aiUsage}
                margin={{ top: 8, right: 16, bottom: 0, left: -16 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar
                  dataKey="queries"
                  fill={CHART_COLORS[4]}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </DashboardChartCard>
      </div>

      <div className="md:col-span-1">
        <DashboardAssignmentsCard
          title="Review Assignments"
          description="Assignments routed to departments."
          assignments={assignmentItems}
          breakdown="status"
          delay={0.25}
        />
      </div>

      <div className="md:col-span-2">
        <DashboardAdminStats
          auditLogs={auditItems}
          aiConfig={aiConfig.data ?? null}
          delay={0.3}
        />
      </div>
    </DashboardLayout>
  );
}
