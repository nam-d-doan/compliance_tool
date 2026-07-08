import { useMemo } from "react";
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
  DashboardApprovalQueue,
  DashboardAssignmentsCard,
} from "@/components/dashboard";
import {
  CardSkeleton,
  ChartSkeleton,
  ListSkeleton,
} from "@/components/common/Skeletons";
import { ErrorState } from "@/components/common/ErrorState";
import { EmptyState } from "@/components/common/EmptyState";
import { CHART_COLORS } from "@/components/charts/chart-theme";
import {
  useDashboard,
  useComplianceList,
  useCAPList,
  useAssignmentList,
} from "@/hooks/queries";

function useApproverData() {
  const dashboard = useDashboard("approver");
  const compliance = useComplianceList({ page: 1, pageSize: 500 }, 1, 500);
  const caps = useCAPList({ page: 1, pageSize: 500 }, 1, 500);
  const assignments = useAssignmentList({}, 1, 200);

  const isLoading =
    dashboard.isPending || compliance.isPending || caps.isPending;
  const error = dashboard.error ?? compliance.error ?? caps.error;

  return { dashboard, compliance, caps, assignments, isLoading, error };
}

export default function ApproverDashboardPage() {
  const { dashboard, compliance, caps, assignments, isLoading, error } =
    useApproverData();

  const complianceItems = useMemo(
    () => compliance.data?.items ?? [],
    [compliance.data],
  );
  const capItems = useMemo(() => caps.data?.items ?? [], [caps.data]);
  const assignmentItems = useMemo(
    () => assignments.data?.items ?? [],
    [assignments.data],
  );

  const approvalStatusData = useMemo(() => {
    const counts = new Map<string, number>();
    complianceItems.forEach((item) => {
      counts.set(item.status, (counts.get(item.status) ?? 0) + 1);
    });
    capItems.forEach((item) => {
      counts.set(item.status, (counts.get(item.status) ?? 0) + 1);
    });
    return Array.from(counts.entries()).map(([name, value]) => ({
      name,
      value,
    }));
  }, [complianceItems, capItems]);

  const turnaroundData = useMemo(
    () => [
      { name: "< 1 day", value: 12 },
      { name: "1-3 days", value: 24 },
      { name: "3-5 days", value: 9 },
      { name: "> 5 days", value: 5 },
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
        title="Could not load approver dashboard"
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
      title="Compliance Approver Dashboard"
      subtitle="Pending approvals, high-risk cases, and review queues."
      kpis={(dashboard.data?.kpis ?? []).map((kpi, index) => (
        <DashboardKpiCard key={kpi.id} kpi={kpi} index={index} />
      ))}
    >
      <div className="md:col-span-2">
        <DashboardApprovalQueue
          compliance={complianceItems}
          caps={capItems}
          delay={0.1}
        />
      </div>

      <div className="md:col-span-1">
        <DashboardChartCard title="Approval Turnaround Time" delay={0.15}>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={turnaroundData}
                margin={{ top: 8, right: 16, bottom: 0, left: -16 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar
                  dataKey="value"
                  fill={CHART_COLORS[4]}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </DashboardChartCard>
      </div>

      <div className="md:col-span-1">
        <DashboardChartCard title="Approval Status Breakdown" delay={0.2}>
          <div className="h-64">
            {approvalStatusData.length === 0 ? (
              <EmptyState
                title="No data"
                className="h-full border-0 bg-transparent"
              />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={approvalStatusData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {approvalStatusData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
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

      <div className="md:col-span-2">
        <DashboardActivityFeed
          items={dashboard.data?.activity}
          title="Recent Approvals"
          delay={0.25}
        />
      </div>

      <div className="md:col-span-1">
        <DashboardAssignmentsCard
          title="Assignments for Review"
          description="Waiting for acknowledgment or completion."
          assignments={assignmentItems}
          breakdown="review"
          linkLabel="Go to assignments"
          delay={0.3}
        />
      </div>
    </DashboardLayout>
  );
}
