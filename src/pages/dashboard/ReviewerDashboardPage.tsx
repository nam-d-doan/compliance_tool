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
  DashboardActivityFeed,
  DashboardReviewQueue,
} from "@/components/dashboard";
import {
  CardSkeleton,
  ChartSkeleton,
  ListSkeleton,
} from "@/components/common/Skeletons";
import { ErrorState } from "@/components/common/ErrorState";
import { useDashboard, useComplianceList } from "@/hooks/queries";
import { CHART_COLORS } from "@/components/charts/chart-theme";

function useReviewerData() {
  const dashboard = useDashboard("reviewer");
  const compliance = useComplianceList({ page: 1, pageSize: 500 }, 1, 500);

  const isLoading = dashboard.isPending || compliance.isPending;
  const error = dashboard.error ?? compliance.error;

  return { dashboard, compliance, isLoading, error };
}

export default function ReviewerDashboardPage() {
  const { dashboard, compliance, isLoading, error } = useReviewerData();
  const complianceItems = useMemo(
    () => compliance.data?.items ?? [],
    [compliance.data],
  );

  const reviewThroughput = useMemo(
    () => [
      { name: "Mon", completed: 4, assigned: 6 },
      { name: "Tue", completed: 7, assigned: 8 },
      { name: "Wed", completed: 5, assigned: 7 },
      { name: "Thu", completed: 9, assigned: 10 },
      { name: "Fri", completed: 6, assigned: 8 },
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
        <div className="grid gap-4 md:grid-cols-2">
          <ChartSkeleton />
          <ListSkeleton />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Could not load reviewer dashboard"
        message={error.message}
        onRetry={() => {
          dashboard.refetch();
          compliance.refetch();
        }}
      />
    );
  }

  return (
    <DashboardLayout
      title="Reviewer Dashboard"
      subtitle="Enterprise oversight, compliance monitoring, and trend analysis."
      kpis={(dashboard.data?.kpis ?? []).map((kpi, index) => (
        <DashboardKpiCard key={kpi.id} kpi={kpi} index={index} />
      ))}
    >
      <div className="md:col-span-2">
        <DashboardReviewQueue compliance={complianceItems} delay={0.1} />
      </div>

      <div className="md:col-span-1">
        <DashboardChartCard title="Review Throughput" delay={0.15}>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={reviewThroughput}
                margin={{ top: 8, right: 16, bottom: 0, left: -16 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="completed"
                  stroke={CHART_COLORS[1]}
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="assigned"
                  stroke={CHART_COLORS[0]}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </DashboardChartCard>
      </div>

      <div className="md:col-span-2">
        <DashboardActivityFeed
          items={dashboard.data?.activity}
          title="Review Activity"
          delay={0.25}
        />
      </div>
    </DashboardLayout>
  );
}
