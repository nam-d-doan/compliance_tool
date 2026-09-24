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
  Legend,
} from "recharts";
import {
  DashboardLayout,
  DashboardKpiCard,
  DashboardChartCard,
  DashboardActivityFeed,
  DashboardApprovalQueue,
  DashboardAssignmentsCard,
  DashboardUpcomingRegulations,
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
  useObligationList,
  useCAPList,
  useAssignmentList,
  useRegulationList,
} from "@/hooks/queries";
import { DEMO_TODAY } from "@/mocks/db";

function useApproverData() {
  const dashboard = useDashboard("approver");
  const compliance = useObligationList({}, 1, 500);
  const caps = useCAPList({ page: 1, pageSize: 500 }, 1, 500);
  const assignments = useAssignmentList({}, 1, 200);
  const regulations = useRegulationList({}, 1, 200);

  const isLoading =
    dashboard.isPending || compliance.isPending || caps.isPending;
  const error = dashboard.error ?? compliance.error ?? caps.error;

  return {
    dashboard,
    compliance,
    caps,
    assignments,
    regulations,
    isLoading,
    error,
  };
}

export default function ApproverDashboardPage() {
  const {
    dashboard,
    compliance,
    caps,
    assignments,
    regulations,
    isLoading,
    error,
  } = useApproverData();

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

  const pendingApprovalCount = useMemo(
    () =>
      complianceItems.filter((c) =>
        ["review_required", "submitted"].includes(c.status),
      ).length + capItems.filter((c) => c.status === "Pending Approval").length,
    [complianceItems, capItems],
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

  const turnaroundData = useMemo(() => {
    const decided = complianceItems.filter((item) =>
      ["approved", "rejected", "returned"].includes(item.status),
    );
    const buckets = [
      { name: "< 1 day", min: 0, max: 1, value: 0 },
      { name: "1-3 days", min: 1, max: 3, value: 0 },
      { name: "3-5 days", min: 3, max: 5, value: 0 },
      { name: "> 5 days", min: 5, max: Infinity, value: 0 },
    ];
    decided.forEach((item) => {
      const days =
        (new Date(item.updatedAt).getTime() -
          new Date(item.createdAt).getTime()) /
        (1000 * 60 * 60 * 24);
      const bucket = buckets.find((b) => days >= b.min && days < b.max);
      if (bucket) bucket.value += 1;
    });
    return buckets.map(({ name, value }) => ({ name, value }));
  }, [complianceItems]);

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
      subtitle={`${pendingApprovalCount} item${pendingApprovalCount === 1 ? "" : "s"} ${pendingApprovalCount === 1 ? "is" : "are"} waiting on your approval right now.`}
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
                  <Legend
                    layout="vertical"
                    verticalAlign="middle"
                    align="right"
                    wrapperStyle={{
                      fontSize: 12,
                      color: "var(--muted-foreground)",
                    }}
                  />
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

      <div className="md:col-span-2">
        <DashboardAssignmentsCard
          title="Assignments for Review"
          description="Waiting for acknowledgment or completion."
          assignments={assignmentItems}
          breakdown="review"
          linkLabel="Go to assignments"
          delay={0.3}
        />
      </div>

      <div className="md:col-span-1">
        <DashboardUpcomingRegulations
          regulations={regulationItems}
          now={DEMO_TODAY}
          delay={0.35}
        />
      </div>
    </DashboardLayout>
  );
}
