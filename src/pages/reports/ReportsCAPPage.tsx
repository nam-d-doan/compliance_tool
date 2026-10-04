import { useMemo, useState } from "react";
import { format, subMonths } from "date-fns";
import { motion } from "motion/react";
import { toast } from "sonner";
import { useReport } from "@/hooks/queries";
import { LoadingState } from "@/components/common/LoadingState";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { BarChartCard, LineChartCard, PieChartCard } from "@/components/charts";
import { StatusBadge } from "@/components/common/StatusBadge";
import { PriorityBadge } from "@/components/common/PriorityBadge";
import { AIInsightCard } from "@/components/ai/AIInsightCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { ReportChart, AIInsight } from "@/types";
import type { ChartDataPoint } from "@/components/charts/chart-theme";
import { PageHero } from "@/components/common";
import { ReportFilterBar } from "./components/ReportFilterBar";
import { ReportKPIs } from "./components/ReportKPIs";

function chartToDataPoints(chart: ReportChart): ChartDataPoint[] {
  return chart.labels.map((label, index) => {
    const point: ChartDataPoint = { name: label };
    chart.datasets.forEach((dataset) => {
      point[dataset.label] = dataset.data[index] ?? 0;
    });
    return point;
  });
}

function getChartComponent(chart: ReportChart) {
  const data = chartToDataPoints(chart);
  const keys = chart.datasets.map((ds) => ({
    key: ds.label,
    name: ds.label,
    color: ds.color ?? undefined,
  }));

  if (chart.type === "pie" || chart.type === "donut") {
    return (
      <PieChartCard
        key={chart.id}
        title={chart.title}
        data={data}
        nameKey="name"
        valueKey={chart.datasets[0]?.label ?? "value"}
        height={240}
        className="h-full"
      />
    );
  }

  if (chart.type === "line") {
    return (
      <LineChartCard
        key={chart.id}
        title={chart.title}
        data={data}
        xKey="name"
        yKeys={keys}
        height={240}
        className="h-full"
      />
    );
  }

  return (
    <BarChartCard
      key={chart.id}
      title={chart.title}
      data={data}
      xKey="name"
      yKeys={keys}
      height={240}
      className="h-full"
    />
  );
}

export default function ReportsCAPPage() {
  const [startDate, setStartDate] = useState(
    format(subMonths(new Date(), 6), "yyyy-MM-dd"),
  );
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [department, setDepartment] = useState("");
  const [status, setStatus] = useState("");

  const filters = useMemo(
    () => ({
      dateRange: { start: startDate, end: endDate },
      department: department || undefined,
      status: status || undefined,
    }),
    [startDate, endDate, department, status],
  );

  const {
    data: report,
    isPending,
    isError,
    error,
    refetch,
  } = useReport("cap", filters);

  const tableData = useMemo(() => {
    if (!report) return [];
    return report.tableData.filter((row) => {
      const dept = String(row.department ?? "");
      const st = String(row.status ?? "");
      return (!department || dept === department) && (!status || st === status);
    });
  }, [report, department, status]);

  const departments = useMemo(
    () => [
      ...new Set(
        report?.tableData
          .map((r) => String(r.department ?? ""))
          .filter(Boolean) ?? [],
      ),
    ],
    [report],
  );
  const statuses = useMemo(
    () => [
      ...new Set(
        report?.tableData.map((r) => String(r.status ?? "")).filter(Boolean) ??
          [],
      ),
    ],
    [report],
  );

  const aiInsight: AIInsight | null = useMemo(() => {
    if (!report) return null;
    return {
      id: "cap-ai-summary",
      createdAt: report.createdAt,
      updatedAt: report.updatedAt,
      title: "CAP Performance Summary",
      description: report.summary,
      type: "action",
      confidence: 0.88,
      recommendation: report.aiInsights[0] ?? "Review open CAPs",
      reasoning: report.aiInsights,
      references: [],
    };
  }, [report]);

  const handleExport = () => {
    toast.info("Export started", {
      description: "Your CAP report export is being prepared.",
    });
  };

  if (isPending) {
    return (
      <div className="space-y-6">
        <PageHero
          title="CAP Report"
          subtitle="Corrective action plan performance and remediation tracking."
        />
        <LoadingState message="Loading CAP report..." />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <PageHero
          title="CAP Report"
          subtitle="Corrective action plan performance and remediation tracking."
        />
        <ErrorState
          title="Could not load report"
          message={error?.message}
          onRetry={refetch}
        />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="space-y-6">
        <PageHero
          title="CAP Report"
          subtitle="Corrective action plan performance and remediation tracking."
        />
        <EmptyState
          title="No report data"
          description="No CAP report data is available for the selected filters."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHero
        title="CAP Report"
        subtitle="Corrective action plan performance and remediation tracking."
      />

      <ReportFilterBar
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        department={department}
        status={status}
        departments={departments}
        statuses={statuses}
        onDepartmentChange={setDepartment}
        onStatusChange={setStatus}
        onExport={handleExport}
      />

      <ReportKPIs kpis={report.kpis} columns={4} />

      {aiInsight && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <AIInsightCard insight={aiInsight} />
        </motion.div>
      )}

      <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-2">
        {report.charts.map((chart) => getChartComponent(chart))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>CAP Details</CardTitle>
          </CardHeader>
          <CardContent>
            {tableData.length === 0 ? (
              <EmptyState
                title="No CAPs match"
                description="Try adjusting your filters."
                className="border-0 bg-transparent"
              />
            ) : (
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold text-muted-foreground">
                        ID
                      </th>
                      <th className="px-3 py-2 text-left font-semibold text-muted-foreground">
                        Title
                      </th>
                      <th className="px-3 py-2 text-left font-semibold text-muted-foreground">
                        Priority
                      </th>
                      <th className="px-3 py-2 text-left font-semibold text-muted-foreground">
                        Status
                      </th>
                      <th className="px-3 py-2 text-left font-semibold text-muted-foreground">
                        Owner
                      </th>
                      <th className="px-3 py-2 text-left font-semibold text-muted-foreground">
                        Due
                      </th>
                      <th className="px-3 py-2 text-left font-semibold text-muted-foreground">
                        Cost
                      </th>
                      <th className="px-3 py-2 text-left font-semibold text-muted-foreground">
                        Progress
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {tableData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-muted/30">
                        <td className="px-3 py-2.5 font-medium text-foreground">
                          {String(row.id)}
                        </td>
                        <td className="px-3 py-2.5 text-foreground">
                          {String(row.title)}
                        </td>
                        <td className="px-3 py-2.5">
                          <PriorityBadge
                            priority={
                              String(row.priority) as "low" | "medium" | "high"
                            }
                          />
                        </td>
                        <td className="px-3 py-2.5">
                          <StatusBadge status={String(row.status)} />
                        </td>
                        <td className="px-3 py-2.5 text-muted-foreground">
                          {String(row.owner)}
                        </td>
                        <td className="px-3 py-2.5 text-muted-foreground">
                          {row.due
                            ? format(new Date(String(row.due)), "MMM d, yyyy")
                            : "—"}
                        </td>
                        <td className="px-3 py-2.5 text-muted-foreground">
                          ${Number(row.cost).toLocaleString()}
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2">
                            <Progress
                              value={Number(row.progress)}
                              className="h-1.5 w-16"
                            />
                            <span className="text-[10px] tabular-nums text-muted-foreground">
                              {Math.round(Number(row.progress))}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
