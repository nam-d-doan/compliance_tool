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
import {
  useDashboard,
  useComplianceList,
  useEvidenceList,
} from "@/hooks/queries";

function useReviewerData() {
  const dashboard = useDashboard("reviewer");
  const compliance = useComplianceList({ page: 1, pageSize: 500 }, 1, 500);
  const evidence = useEvidenceList({ page: 1, pageSize: 500 }, 1, 500);

  const isLoading =
    dashboard.isPending || compliance.isPending || evidence.isPending;
  const error = dashboard.error ?? compliance.error ?? evidence.error;

  return { dashboard, compliance, evidence, isLoading, error };
}

export default function ReviewerDashboardPage() {
  const { dashboard, compliance, evidence, isLoading, error } =
    useReviewerData();
  const complianceItems = useMemo(
    () => compliance.data?.items ?? [],
    [compliance.data],
  );
  const evidenceItems = useMemo(
    () => evidence.data?.items ?? [],
    [evidence.data],
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

  const evidenceQuality = useMemo(() => {
    const buckets = [
      { name: "90-100%", count: 0 },
      { name: "80-89%", count: 0 },
      { name: "70-79%", count: 0 },
      { name: "< 70%", count: 0 },
    ];

    evidenceItems.forEach((item) => {
      const score = item.aiValidation?.score ?? 85;
      if (score >= 90) buckets[0].count++;
      else if (score >= 80) buckets[1].count++;
      else if (score >= 70) buckets[2].count++;
      else buckets[3].count++;
    });

    if (evidenceItems.length === 0) {
      buckets[0].count = 14;
      buckets[1].count = 8;
      buckets[2].count = 4;
      buckets[3].count = 2;
    }

    return buckets;
  }, [evidenceItems]);

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
          evidence.refetch();
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
                  stroke="#10b981"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="assigned"
                  stroke="#3b82f6"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </DashboardChartCard>
      </div>

      <div className="md:col-span-1">
        <DashboardChartCard title="Evidence Quality (AI Scores)" delay={0.2}>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={evidenceQuality}
                margin={{ top: 8, right: 16, bottom: 0, left: -16 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              </BarChart>
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
