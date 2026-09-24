import { useMemo, useState } from "react";
import { format, subMonths } from "date-fns";
import { motion } from "motion/react";
import { toast } from "sonner";
import {
  Sparkles,
  FileText,
  Table2,
  Share2,
  Lightbulb,
  ArrowUpRight,
  CheckCircle2,
} from "lucide-react";
import { useReport, useExecutiveSummary } from "@/hooks/queries";
import { LoadingState } from "@/components/common/LoadingState";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { AreaChartCard, BarChartCard, PieChartCard } from "@/components/charts";
import { RiskHeatmap } from "@/components/charts/RiskHeatmap";
import { TypewriterText } from "@/components/ai/TypewriterText";
import { ConfidenceIndicator } from "@/components/ai/ConfidenceIndicator";
import { AIExplanation } from "@/components/ai/AIExplanation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Report, ReportChart, ExecutiveSummary } from "@/types";
import type { RiskHeatmapData } from "@/types";
import type { ChartDataPoint } from "@/components/charts/chart-theme";
import { PageHero } from "@/components/common";
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
        height={240}
        className="h-full"
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

export default function ReportsExecutivePage() {
  const [startDate, setStartDate] = useState(
    format(subMonths(new Date(), 12), "yyyy-MM-dd"),
  );
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [explainOpen, setExplainOpen] = useState(false);

  const filters = useMemo(
    () => ({
      dateRange: { start: startDate, end: endDate },
    }),
    [startDate, endDate],
  );

  const {
    data: report,
    isPending: reportPending,
    isError: reportError,
    error: reportErrorData,
    refetch: refetchReport,
  } = useReport("executive", filters);

  const {
    data: aiResult,
    isPending: aiPending,
    isError: aiError,
    refetch: refetchAi,
  } = useExecutiveSummary();

  const typedReport = report as
    | (Report & { data?: ExecutiveSummary; heatmapData?: RiskHeatmapData })
    | undefined;
  const summary = typedReport?.data;

  const normalCharts = useMemo(
    () => typedReport?.charts.filter((c) => c.type !== "stacked-bar") ?? [],
    [typedReport],
  );

  const handleExport = (type: string) => {
    toast.info(`${type} export started`, {
      description: "Your executive summary export is being prepared.",
    });
  };

  if (reportPending) {
    return (
      <div className="space-y-6">
        <PageHero
          title="Executive Summary"
          subtitle="AI-generated enterprise health overview for leadership."
        />
        <LoadingState message="Loading executive summary..." />
      </div>
    );
  }

  if (reportError) {
    return (
      <div className="space-y-6">
        <PageHero
          title="Executive Summary"
          subtitle="AI-generated enterprise health overview for leadership."
        />
        <ErrorState
          title="Could not load summary"
          message={reportErrorData?.message}
          onRetry={refetchReport}
        />
      </div>
    );
  }

  if (!typedReport) {
    return (
      <div className="space-y-6">
        <PageHero
          title="Executive Summary"
          subtitle="AI-generated enterprise health overview for leadership."
        />
        <EmptyState
          title="No summary data"
          description="No executive summary is available for the selected period."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHero
        title="Executive Summary"
        subtitle="AI-generated enterprise health overview for leadership."
      >
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Date range
          </label>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
            <span className="text-xs text-muted-foreground">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </div>
        </div>
      </PageHero>

      {/* AI Executive Summary Callout */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <Card className="relative overflow-hidden border-primary/10 bg-gradient-to-br from-primary/5 via-card to-card dark:border-primary/20 dark:from-primary/10">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,var(--primary)_0%,transparent_35%)] opacity-10" />
          <CardHeader className="relative flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Sparkles className="size-5" aria-hidden="true" />
              </div>
              <div>
                <CardTitle>AI Executive Summary</CardTitle>
                <CardDescription>
                  Generated from live compliance and CAP data
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {aiPending ? (
                <span className="text-xs text-muted-foreground">
                  Generating summary...
                </span>
              ) : aiError ? (
                <Button variant="ghost" size="sm" onClick={() => refetchAi()}>
                  Retry AI
                </Button>
              ) : aiResult ? (
                <>
                  <ConfidenceIndicator
                    confidence={aiResult.explanation.confidence}
                    size="sm"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 text-primary"
                    onClick={() => setExplainOpen(true)}
                  >
                    <Lightbulb className="size-3.5" aria-hidden="true" />
                    View reasoning
                  </Button>
                </>
              ) : null}
            </div>
          </CardHeader>
          <CardContent className="relative">
            {aiPending ? (
              <div className="space-y-2">
                <div className="h-4 w-full animate-pulse rounded bg-muted" />
                <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
              </div>
            ) : aiError ? (
              <p className="text-sm text-muted-foreground">
                AI summary is currently unavailable. Report data is still shown
                below.
              </p>
            ) : aiResult ? (
              <div className="text-base leading-relaxed text-foreground">
                <TypewriterText
                  key={aiResult.summary}
                  text={aiResult.summary}
                  speed={18}
                  className="font-medium"
                />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No AI summary available.
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <ReportKPIs kpis={typedReport.kpis} columns={6} />

      {/* Export actions */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => handleExport("PDF")}
        >
          <FileText className="size-3.5" aria-hidden="true" />
          Export PDF
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => handleExport("Excel")}
        >
          <Table2 className="size-3.5" aria-hidden="true" />
          Export Excel
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => handleExport("Share")}
        >
          <Share2 className="size-3.5" aria-hidden="true" />
          Share
        </Button>
      </div>

      <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-2">
        {normalCharts.map((chart) => getChartComponent(chart))}
        {typedReport.heatmapData && (
          <RiskHeatmap
            title="Risk Heatmap"
            subtitle="Compliance risk by department and month"
            data={typedReport.heatmapData}
            className="h-full"
          />
        )}
      </div>

      <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-2">
        {/* Key Insights */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="h-full"
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="size-4 text-primary" aria-hidden="true" />
                Key Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              {typedReport.aiInsights.length === 0 ? (
                <EmptyState
                  title="No insights"
                  description="No AI insights are available."
                  className="border-0 bg-transparent"
                />
              ) : (
                <ul className="space-y-3">
                  {typedReport.aiInsights.map((insight, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2 text-sm text-foreground"
                    >
                      <ArrowUpRight
                        className="mt-0.5 size-4 shrink-0 text-primary"
                        aria-hidden="true"
                      />
                      <span>{insight}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Recommended Actions */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.25 }}
          className="h-full"
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2
                  className="size-4 text-emerald-500"
                  aria-hidden="true"
                />
                Recommended Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!summary || summary.recommendedActions.length === 0 ? (
                <EmptyState
                  title="No recommendations"
                  description="No recommended actions are available."
                  className="border-0 bg-transparent"
                />
              ) : (
                <ul className="space-y-3">
                  {summary.recommendedActions.map((action, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-3 rounded-lg border border-border bg-card p-3 text-sm"
                    >
                      <span
                        className={cn(
                          "flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold",
                          idx === 0
                            ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                            : idx === 1
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                              : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
                        )}
                      >
                        {idx + 1}
                      </span>
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{action}</p>
                        <p className="text-xs text-muted-foreground">
                          Suggested owner:{" "}
                          {summary.departmentRanking[
                            idx % summary.departmentRanking.length
                          ]?.department ?? "Compliance Lead"}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {aiResult && (
        <AIExplanation
          explanation={aiResult.explanation}
          open={explainOpen}
          onOpenChange={setExplainOpen}
        />
      )}
    </div>
  );
}
