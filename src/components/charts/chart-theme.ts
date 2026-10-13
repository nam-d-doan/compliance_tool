export type ChartDataPoint = Record<string, string | number>;

export const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

/**
 * Status colours for chart series, from the app theme so a chart's "overdue",
 * "done" or "at risk" matches the status pills next to it.
 */
export const STATUS_CHART_COLORS = {
  success: "var(--success)",
  warning: "var(--warning)",
  danger: "var(--danger)",
  info: "var(--info)",
  neutral: "var(--neutral)",
  ai: "var(--color-violet-600)",
} as const;

/**
 * Semantic colors for risk/severity levels in charts. recharts needs raw
 * color values (not CSS vars) for per-cell fills. Mirrors the tailwind ramp
 * used by PRIORITY_STYLES and RiskHeatmap: emerald -> amber -> red
 * (low -> medium -> high), Nam A Bank's 3-level scale.
 */
export const RISK_CHART_COLORS: Record<string, string> = {
  low: STATUS_CHART_COLORS.success,
  medium: STATUS_CHART_COLORS.warning,
  high: STATUS_CHART_COLORS.danger,
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
