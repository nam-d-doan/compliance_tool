import { useMemo, useState } from "react";
import { format, subMonths } from "date-fns";
import { motion } from "motion/react";
import { AlertTriangle, AlertCircle, Info, Calendar } from "lucide-react";
import { useEWSReport } from "@/hooks/queries";
import {
  PageHero,
  KPICard,
  LoadingState,
  EmptyState,
  ErrorState,
} from "@/components/common";
import { LineChartCard, BarChartCard, PieChartCard } from "@/components/charts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ChartDataPoint } from "@/components/charts/chart-theme";

export default function EWSReportPage() {
  const [startDate, setStartDate] = useState(
    format(subMonths(new Date(), 12), "yyyy-MM-dd"),
  );
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));

  const filters = useMemo(
    () => ({ from: startDate, to: endDate }),
    [startDate, endDate],
  );

  const {
    data: report,
    isPending,
    isError,
    error,
    refetch,
  } = useEWSReport(filters);

  if (isPending) {
    return (
      <div className="space-y-6">
        <PageHero
          title="Early Warning System"
          subtitle="Trending analysis of non-compliance metrics across units and regions."
        />
        <LoadingState message="Loading early warning report..." />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <PageHero
          title="Early Warning System"
          subtitle="Trending analysis of non-compliance metrics across units and regions."
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
          title="Early Warning System"
          subtitle="Trending analysis of non-compliance metrics across units and regions."
        />
        <EmptyState
          title="No report data"
          description="No early warning data is available for the selected period."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHero
        title="Early Warning System"
        subtitle="Trending analysis of non-compliance metrics across units and regions."
      >
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-blue-100">Date range</label>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-8 rounded-lg border-0 bg-white/20 px-2.5 text-xs text-white outline-none focus:bg-white/30"
            />
            <span className="text-xs text-blue-100">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-8 rounded-lg border-0 bg-white/20 px-2.5 text-xs text-white outline-none focus:bg-white/30"
            />
          </div>
        </div>
      </PageHero>

      {/* Provisional methodology disclaimer */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="flex items-start gap-3 py-4">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <Info className="size-4" aria-hidden="true" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">
                Provisional Methodology
              </p>
              <p className="text-sm text-muted-foreground">
                This report uses a simplified trending analysis based on
                non-compliance case data. The methodology is provisional and
                subject to refinement. Metrics should be interpreted as
                indicators, not definitive assessments.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {report.kpis.map((kpi) => (
          <KPICard
            key={kpi.label}
            label={kpi.label}
            value={kpi.value}
            icon={Calendar}
            trend={
              kpi.trend
                ? {
                    direction: kpi.trend,
                    percent: kpi.trendPercent ?? 0,
                    positive: kpi.trend !== "up",
                  }
                : undefined
            }
          />
        ))}
      </div>

      {/* Risk Alerts */}
      {report.riskAlerts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle
                  className="size-4 text-amber-500"
                  aria-hidden="true"
                />
                Risk Alerts
              </CardTitle>
              <CardDescription>
                Units with elevated overdue rates requiring attention.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {report.riskAlerts.map((alert) => (
                <div
                  key={`${alert.unitName}-${alert.region ?? ""}`}
                  className="flex items-center justify-between rounded-lg border border-border p-3"
                >
                  <div className="flex items-center gap-3">
                    {alert.severity === "high" ? (
                      <AlertTriangle
                        className="size-4 shrink-0 text-red-500"
                        aria-hidden="true"
                      />
                    ) : (
                      <AlertCircle
                        className="size-4 shrink-0 text-amber-500"
                        aria-hidden="true"
                      />
                    )}
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">{alert.unitName}</p>
                      {alert.region && (
                        <p className="text-xs text-muted-foreground">
                          {alert.region}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">
                      {alert.overdueCount} overdue / {alert.totalOpen} open
                    </span>
                    <Badge
                      variant={
                        alert.severity === "high" ? "destructive" : "secondary"
                      }
                    >
                      {alert.overdueRate}% overdue
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Charts grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <LineChartCard
          title="NCC Creation & Closure Trend"
          subtitle="New and closed non-compliance cases per month"
          data={report.creationTrend as unknown as ChartDataPoint[]}
          xKey="month"
          yKeys={[
            { key: "newCases", name: "New Cases" },
            { key: "closedCases", name: "Closed Cases" },
          ]}
        />

        <LineChartCard
          title="Overdue Rate Trend"
          subtitle="Percentage of open cases that are overdue, per month"
          data={report.overdueTrend as unknown as ChartDataPoint[]}
          xKey="month"
          yKeys={[{ key: "overdueRate", name: "Overdue Rate (%)" }]}
        />

        <BarChartCard
          title="Cases by Owner Unit"
          subtitle="Top units by total non-compliance case volume"
          data={report.byUnit as unknown as ChartDataPoint[]}
          xKey="unitName"
          yKeys={[
            { key: "total", name: "Total" },
            { key: "open", name: "Open" },
            { key: "overdue", name: "Overdue" },
          ]}
        />

        <BarChartCard
          title="Cases by Region"
          subtitle="Non-compliance cases by branch region"
          data={report.byRegion as unknown as ChartDataPoint[]}
          xKey="region"
          yKeys={[
            { key: "total", name: "Total" },
            { key: "open", name: "Open" },
            { key: "overdue", name: "Overdue" },
          ]}
        />

        <PieChartCard
          title="Cases by Severity"
          subtitle="Distribution of non-compliance cases by severity"
          data={
            report.bySeverity.map((s) => ({
              name: s.severity,
              value: s.total,
            })) as unknown as ChartDataPoint[]
          }
          nameKey="name"
          valueKey="value"
          className="lg:col-span-2"
        />
      </div>
    </div>
  );
}
