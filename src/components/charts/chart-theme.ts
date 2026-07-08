export type ChartDataPoint = Record<string, string | number>;

export const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

/**
 * Semantic hex colors for risk/severity levels in charts. recharts needs raw
 * color values (not CSS vars) for per-cell fills. Mirrors the tailwind ramp
 * used by PRIORITY_STYLES and RiskHeatmap: emerald -> amber -> orange -> red
 * (low -> medium -> high -> critical).
 */
export const RISK_CHART_COLORS: Record<string, string> = {
  low: "#10b981",
  medium: "#f59e0b",
  high: "#f97316",
  critical: "#ef4444",
};

export const CHART_TOOLTIP_STYLE = {
  backgroundColor: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-md)",
  color: "var(--popover-foreground)",
};

export function formatChartValue(value: number | string): string {
  if (typeof value === "number") {
    return Number.isInteger(value) ? String(value) : value.toFixed(2);
  }
  return String(value);
}
