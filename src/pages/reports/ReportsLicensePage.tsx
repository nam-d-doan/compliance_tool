import { useMemo, useState } from "react";
import { format, subMonths } from "date-fns";
import { motion } from "motion/react";
import { toast } from "sonner";
import { useReport } from "@/hooks/queries";
import { LoadingState } from "@/components/common/LoadingState";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { BarChartCard, PieChartCard } from "@/components/charts";
import { StatusBadge } from "@/components/common/StatusBadge";
import { PriorityBadge } from "@/components/common/PriorityBadge";
import { AIInsightCard } from "@/components/ai/AIInsightCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ReportChart, AIInsight } from "@/types";
import type { ChartDataPoint } from "@/components/charts/chart-theme";
import { PageHero } from "@/components/common";
import { ReportFilterBar } from "./components/ReportFilterBar";
import { ReportKPIs } from "./components/ReportKPIs";
import { cn } from "@/lib/utils";

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
    />
  );
}

export default function ReportsLicensePage() {
  const [startDate, setStartDate] = useState(
    format(subMonths(new Date(), 3), "yyyy-MM-dd"),
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
  } = useReport("license", filters);

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
      id: "license-ai-summary",
      createdAt: report.createdAt,
      updatedAt: report.updatedAt,
      title: "License Renewal Outlook",
      description: report.summary,
      type: "risk",
      confidence: 0.86,
      recommendation: report.aiInsights[0] ?? "Review expiring licenses",
      reasoning: report.aiInsights,
      references: [],
    };
  }, [report]);

  const handleExport = () => {
    toast.info("Export started", {
      description: "Your license report export is being prepared.",
    });
  };

  if (isPending) {
    return (
      <div className="space-y-6">
        <PageHero
          title="License Report"
          subtitle="License status, expiry timelines, and renewal tracking."
        />
        <LoadingState message="Loading license report..." />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <PageHero
          title="License Report"
          subtitle="License status, expiry timelines, and renewal tracking."
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
          title="License Report"
          subtitle="License status, expiry timelines, and renewal tracking."
        />
        <EmptyState
          title="No report data"
          description="No license report data is available for the selected filters."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHero
        title="License Report"
        subtitle="License status, expiry timelines, and renewal tracking."
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

      <ReportKPIs kpis={report.kpis} columns={6} />

      {aiInsight && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <AIInsightCard insight={aiInsight} />
        </motion.div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {report.charts.map((chart) => getChartComponent(chart))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>License Details</CardTitle>
          </CardHeader>
          <CardContent>
            {tableData.length === 0 ? (
              <EmptyState
                title="No licenses match"
                description="Try adjusting your filters."
                className="border-0 bg-transparent"
              />
            ) : (
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold text-muted-foreground">
                        Number
                      </th>
                      <th className="px-3 py-2 text-left font-semibold text-muted-foreground">
                        Name
                      </th>
                      <th className="px-3 py-2 text-left font-semibold text-muted-foreground">
                        Owner
                      </th>
                      <th className="px-3 py-2 text-left font-semibold text-muted-foreground">
                        Expiry
                      </th>
                      <th className="px-3 py-2 text-left font-semibold text-muted-foreground">
                        Status
                      </th>
                      <th className="px-3 py-2 text-left font-semibold text-muted-foreground">
                        Criticality
                      </th>
                      <th className="px-3 py-2 text-left font-semibold text-muted-foreground">
                        Remaining
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {tableData.map((row, idx) => {
                      const remaining = Number(row.remainingDays);
                      return (
                        <tr key={idx} className="hover:bg-muted/30">
                          <td className="px-3 py-2.5 font-medium text-foreground">
                            {String(row.number)}
                          </td>
                          <td className="px-3 py-2.5 text-foreground">
                            {String(row.name)}
                          </td>
                          <td className="px-3 py-2.5 text-muted-foreground">
                            {String(row.owner)}
                          </td>
                          <td className="px-3 py-2.5 text-muted-foreground">
                            {row.expiry
                              ? format(
                                  new Date(String(row.expiry)),
                                  "MMM d, yyyy",
                                )
                              : "—"}
                          </td>
                          <td className="px-3 py-2.5">
                            <StatusBadge status={String(row.status)} />
                          </td>
                          <td className="px-3 py-2.5">
                            <PriorityBadge
                              priority={
                                String(row.criticality) as
                                  "low" | "medium" | "high" | "critical"
                              }
                            />
                          </td>
                          <td className="px-3 py-2.5">
                            <span
                              className={cn(
                                "inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold",
                                remaining < 0
                                  ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                  : remaining <= 30
                                    ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                                    : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
                              )}
                            >
                              {remaining < 0
                                ? `${Math.abs(remaining)}d overdue`
                                : `${remaining}d left`}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
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
