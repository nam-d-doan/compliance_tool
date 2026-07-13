import { useMemo } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  DashboardLayout,
  DashboardKpiCard,
  DashboardChartCard,
  DashboardActivityFeed,
  DashboardAIInsightCard,
  DashboardRiskHeatmap,
  DashboardNeedsAttentionList,
  DashboardAssignmentsCard,
  DashboardUpcomingRegulations,
} from "@/components/dashboard";
import {
  CardSkeleton,
  ChartSkeleton,
  ListSkeleton,
} from "@/components/common/Skeletons";
import { ErrorState } from "@/components/common/ErrorState";
import {
  useDashboard,
  useObligationList,
  useCAPList,
  useAssignmentList,
  useRegulationList,
} from "@/hooks/queries";
import { useExecutiveSummary } from "@/hooks/queries/useAIQueries";
import { EmptyState } from "@/components/common/EmptyState";
import {
  CHART_COLORS,
  RISK_CHART_COLORS,
} from "@/components/charts/chart-theme";
import { DEMO_TODAY } from "@/mocks/db";

function useExecutiveData() {
  const dashboard = useDashboard("executive");
  const compliance = useObligationList({}, 1, 500);
  const caps = useCAPList({ page: 1, pageSize: 500 });
  const assignments = useAssignmentList({}, 1, 200);
  const regulations = useRegulationList({}, 1, 200);
  const aiSummary = useExecutiveSummary();

  const isLoading =
    dashboard.isPending || compliance.isPending || caps.isPending;

  const error = dashboard.error ?? compliance.error ?? caps.error;

  return {
    dashboard,
    compliance,
    caps,
    assignments,
    regulations,
    aiSummary,
    isLoading,
    error,
  };
}

export default function ExecutiveDashboardPage() {
  const {
    dashboard,
    compliance,
    caps,
    assignments,
    regulations,
    aiSummary,
    isLoading,
    error,
  } = useExecutiveData();

  const complianceItems = useMemo(
    () => compliance.data?.items ?? [],
    [compliance.data],
  );
  const capItems = useMemo(() => caps.data?.items ?? [], [caps.data]);
  const assignmentItems = useMemo(
    () => assignments.data?.items ?? [],
    [assignments.data],
  );
  const regulationItems = useMemo(
    () => regulations.data?.items ?? [],
    [regulations.data],
  );

  const riskDistribution = useMemo(() => {
    const counts = new Map<string, number>();
    complianceItems.forEach((item) => {
      counts.set(item.riskLevel, (counts.get(item.riskLevel) ?? 0) + 1);
    });
    return Array.from(counts.entries()).map(([name, value]) => ({
      name,
      value,
      color: RISK_CHART_COLORS[name] ?? "#94a3b8",
    }));
  }, [complianceItems]);

  const capStatusData = useMemo(() => {
    const counts = new Map<string, number>();
    capItems.forEach((item) => {
      counts.set(item.status, (counts.get(item.status) ?? 0) + 1);
    });
    return Array.from(counts.entries()).map(([name, value]) => ({
      name,
      value,
    }));
  }, [capItems]);

  const trendData = useMemo(() => {
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(DEMO_TODAY);
      d.setMonth(d.getMonth() - (5 - i));
      return d;
    });
    // Monthly completion rate among obligations last updated in that month.
    // Months with no activity carry forward the prior month's rate (and
    // leading gaps back-fill from the first observed rate) so the line stays
    // continuous instead of showing misleading gaps/zeros.
    const raw = months.map((monthDate) => {
      const inMonth = complianceItems.filter((item) => {
        const updated = new Date(item.updatedAt);
        return (
          updated.getFullYear() === monthDate.getFullYear() &&
          updated.getMonth() === monthDate.getMonth()
        );
      });
      const completed = inMonth.filter((item) =>
        ["completed", "approved"].includes(item.status),
      ).length;
      return inMonth.length
        ? Math.round((completed / inMonth.length) * 1000) / 10
        : null;
    });
    const firstKnown = raw.find((v) => v !== null) ?? 0;
    let lastValue = firstKnown;
    const filled = raw.map((v) => {
      if (v !== null) lastValue = v;
      return lastValue;
    });
    return months.map((monthDate, i) => ({
      month: monthDate.toLocaleDateString("en-US", { month: "short" }),
      value: filled[i],
    }));
  }, [complianceItems]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <ChartSkeleton />
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <ListSkeleton />
          <ListSkeleton />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Could not load executive dashboard"
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
      title="Executive Dashboard"
      subtitle={aiSummary.data?.summary}
      kpis={(dashboard.data?.kpis ?? []).map((kpi, index) => (
        <DashboardKpiCard key={kpi.id} kpi={kpi} index={index} />
      ))}
    >
      <div className="md:col-span-2">
        <DashboardAIInsightCard
          summary={aiSummary.data?.summary ?? "Loading AI summary..."}
          explanation={aiSummary.data?.explanation}
          isLoading={aiSummary.isPending}
          delay={0.1}
        />
      </div>

      <div className="md:col-span-1">
        <DashboardRiskHeatmap delay={0.15} />
      </div>

      <div className="md:col-span-1">
        <DashboardChartCard title="Compliance Trend" delay={0.2}>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={trendData}
                margin={{ top: 8, right: 16, bottom: 0, left: -16 }}
              >
                <defs>
                  <linearGradient
                    id="complianceGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor={CHART_COLORS[4]}
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor={CHART_COLORS[4]}
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 12 }}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={CHART_COLORS[4]}
                  strokeWidth={2}
                  fill="url(#complianceGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </DashboardChartCard>
      </div>

      <div className="md:col-span-1">
        <DashboardChartCard title="Risk Distribution" delay={0.3}>
          <div className="h-64">
            {riskDistribution.length === 0 ? (
              <EmptyState
                title="No data"
                className="h-full border-0 bg-transparent"
              />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={riskDistribution}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {riskDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
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
        <DashboardChartCard title="CAP Status Breakdown" delay={0.35}>
          <div className="h-64">
            {capStatusData.length === 0 ? (
              <EmptyState
                title="No data"
                className="h-full border-0 bg-transparent"
              />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={capStatusData}
                  margin={{ top: 8, right: 16, bottom: 0, left: -16 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-muted"
                  />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar
                    dataKey="value"
                    fill={CHART_COLORS[2]}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </DashboardChartCard>
      </div>

      <div className="md:col-span-2">
        <DashboardNeedsAttentionList
          compliance={complianceItems}
          caps={capItems}
          delay={0.4}
        />
      </div>

      <div className="md:col-span-1">
        <DashboardUpcomingRegulations
          regulations={regulationItems}
          now={DEMO_TODAY}
          delay={0.45}
        />
      </div>

      <div className="md:col-span-2">
        <DashboardActivityFeed
          items={dashboard.data?.activity}
          title="Organization Activity"
          delay={0.5}
        />
      </div>

      <div className="md:col-span-1">
        <DashboardAssignmentsCard
          title="Compliance Assignments"
          description="By department, with overdue and critical counts."
          assignments={assignmentItems}
          breakdown="department"
          delay={0.55}
        />
      </div>
    </DashboardLayout>
  );
}
