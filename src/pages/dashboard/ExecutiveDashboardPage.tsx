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
} from "@/hooks/queries";
import { useExecutiveSummary } from "@/hooks/queries/useAIQueries";
import { EmptyState } from "@/components/common/EmptyState";
import {
  CHART_COLORS,
  RISK_CHART_COLORS,
} from "@/components/charts/chart-theme";

const TREND_MONTHS = ["Aug", "Sep", "Oct", "Nov", "Dec", "Jan"];
const TREND_VALUES = [91, 92, 90, 93, 94, 95];

function useExecutiveData() {
  const dashboard = useDashboard("executive");
  const compliance = useObligationList({}, 1, 500);
  const caps = useCAPList({ page: 1, pageSize: 500 });
  const assignments = useAssignmentList({}, 1, 200);
  const aiSummary = useExecutiveSummary();

  const isLoading =
    dashboard.isPending || compliance.isPending || caps.isPending;

  const error = dashboard.error ?? compliance.error ?? caps.error;

  return {
    dashboard,
    compliance,
    caps,
    assignments,
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

  const complianceByBU = useMemo(() => {
    const counts = new Map<string, number>();
    complianceItems.forEach((item) => {
      counts.set(item.businessUnit, (counts.get(item.businessUnit) ?? 0) + 1);
    });
    return Array.from(counts.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [complianceItems]);

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

  const trendData = useMemo(
    () =>
      TREND_MONTHS.map((month, index) => ({
        month,
        value: TREND_VALUES[index],
      })),
    [],
  );

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
      subtitle="Enterprise compliance health, risk overview, and AI-generated insights."
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
                <YAxis domain={[80, 100]} tick={{ fontSize: 12 }} />
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
        <DashboardChartCard title="Compliance by Business Unit" delay={0.25}>
          <div className="h-64">
            {complianceByBU.length === 0 ? (
              <EmptyState
                title="No data"
                className="h-full border-0 bg-transparent"
              />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={complianceByBU}
                  margin={{ top: 8, right: 16, bottom: 24, left: -16 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-muted"
                  />
                  <XAxis
                    dataKey="name"
                    angle={-30}
                    textAnchor="end"
                    height={60}
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar
                    dataKey="value"
                    fill={CHART_COLORS[0]}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
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

      <div className="md:col-span-2">
        <DashboardActivityFeed
          items={dashboard.data?.activity}
          title="Organization Activity"
          delay={0.45}
        />
      </div>

      <div className="md:col-span-1">
        <DashboardAssignmentsCard
          title="Compliance Assignments"
          description="By department, with overdue and critical counts."
          assignments={assignmentItems}
          breakdown="department"
          delay={0.5}
        />
      </div>
    </DashboardLayout>
  );
}
