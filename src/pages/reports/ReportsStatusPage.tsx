import { useMemo, useState } from "react";
import { format, subMonths } from "date-fns";
import { motion } from "motion/react";
import { toast } from "sonner";
import { useReport } from "@/hooks/queries";
import { LoadingState } from "@/components/common/LoadingState";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import {
  BarChartCard,
  LineChartCard,
  PieChartCard,
  AreaChartCard,
} from "@/components/charts";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ReportChart } from "@/types";
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

function getChartComponent(chart: ReportChart, index: number) {
  const data = chartToDataPoints(chart);
  const keys = chart.datasets.map((ds) => ({
    key: ds.label,
    name: ds.label,
    color: ds.color ?? undefined,
  }));

  const className = index < 2 ? "md:col-span-1" : "md:col-span-1";

  if (chart.type === "pie" || chart.type === "donut") {
    return (
      <PieChartCard
        key={chart.id}
        title={chart.title}
        data={data}
        nameKey="name"
        valueKey={chart.datasets[0]?.label ?? "value"}
        className={className}
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
        className={className}
      />
    );
  }

  if (chart.type === "area") {
    return (
      <AreaChartCard
        key={chart.id}
        title={chart.title}
        data={data}
        xKey="name"
        yKeys={keys}
        className={className}
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
      className={className}
    />
  );
}

export default function ReportsStatusPage() {
  const [startDate, setStartDate] = useState(
    format(subMonths(new Date(), 3), "yyyy-MM-dd"),
  );
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [businessUnit, setBusinessUnit] = useState("");
  const [department, setDepartment] = useState("");
  const [regulation, setRegulation] = useState("");

  const filters = useMemo(
    () => ({
      dateRange: { start: startDate, end: endDate },
      businessUnit: businessUnit || undefined,
      department: department || undefined,
      regulation: regulation || undefined,
    }),
    [startDate, endDate, businessUnit, department, regulation],
  );

  const {
    data: report,
    isPending,
    isError,
    error,
    refetch,
  } = useReport("status", filters);

  const tableData = useMemo(() => {
    if (!report) return [];
    return report.tableData.filter((row) => {
      const bu = String(row.businessUnit ?? "");
      const dept = String(row.department ?? "");
      const reg = String(row.regulation ?? "");
      return (
        (!businessUnit || bu === businessUnit) &&
        (!department || dept === department) &&
        (!regulation || reg === regulation)
      );
    });
  }, [report, businessUnit, department, regulation]);

  const businessUnits = useMemo(
    () => [
      ...new Set(
        report?.tableData
          .map((r) => String(r.businessUnit ?? ""))
          .filter(Boolean) ?? [],
      ),
    ],
    [report],
  );
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
  const regulations = useMemo(
    () => [
      ...new Set(
        report?.tableData
          .map((r) => String(r.regulation ?? ""))
          .filter(Boolean) ?? [],
      ),
    ],
    [report],
  );

  const handleExport = () => {
    toast.info("Export started", {
      description: "Your status report export is being prepared.",
    });
  };

  if (isPending) {
    return (
      <div className="space-y-6">
        <PageHero
          title="Status Report"
          subtitle="Compliance status, trends, and detailed obligation breakdown."
        />
        <LoadingState message="Loading status report..." />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <PageHero
          title="Status Report"
          subtitle="Compliance status, trends, and detailed obligation breakdown."
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
          title="Status Report"
          subtitle="Compliance status, trends, and detailed obligation breakdown."
        />
        <EmptyState
          title="No report data"
          description="No status report data is available for the selected filters."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHero
        title="Status Report"
        subtitle="Compliance status, trends, and detailed obligation breakdown."
      />

      <ReportFilterBar
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        businessUnit={businessUnit}
        department={department}
        regulation={regulation}
        businessUnits={businessUnits}
        departments={departments}
        regulations={regulations}
        onBusinessUnitChange={setBusinessUnit}
        onDepartmentChange={setDepartment}
        onRegulationChange={setRegulation}
        onExport={handleExport}
      />

      <ReportKPIs kpis={report.kpis} />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {report.charts.map((chart, index) => getChartComponent(chart, index))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Detailed Compliance Items</CardTitle>
          </CardHeader>
          <CardContent>
            {tableData.length === 0 ? (
              <EmptyState
                title="No items match"
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
                        Owner
                      </th>
                      <th className="px-3 py-2 text-left font-semibold text-muted-foreground">
                        Status
                      </th>
                      <th className="px-3 py-2 text-left font-semibold text-muted-foreground">
                        Due Date
                      </th>
                      <th className="px-3 py-2 text-left font-semibold text-muted-foreground">
                        Outcome
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
                        <td className="px-3 py-2.5 text-muted-foreground">
                          {String(row.owner)}
                        </td>
                        <td className="px-3 py-2.5">
                          <StatusBadge status={String(row.status)} />
                        </td>
                        <td className="px-3 py-2.5 text-muted-foreground">
                          {row.dueDate
                            ? format(
                                new Date(String(row.dueDate)),
                                "MMM d, yyyy",
                              )
                            : "—"}
                        </td>
                        <td className="px-3 py-2.5">
                          <span
                            className={cn(
                              "inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold",
                              String(row.outcome) === "Compliant"
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                : String(row.outcome) === "Overdue"
                                  ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                  : String(row.outcome) === "Non-compliant"
                                    ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                                    : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
                            )}
                          >
                            {String(row.outcome)}
                          </span>
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
