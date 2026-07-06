import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChartSkeleton } from "@/components/common/Skeletons";
import { EmptyState } from "@/components/common/EmptyState";
import { cn } from "@/lib/utils";
import {
  CHART_COLORS,
  CHART_TOOLTIP_STYLE,
  formatChartValue,
  type ChartDataPoint,
} from "./chart-theme";

export interface LineChartCardProps {
  title: string;
  subtitle?: string;
  data: ChartDataPoint[];
  xKey: string;
  yKeys: { key: string; name: string; color?: string }[];
  height?: number;
  loading?: boolean;
  className?: string;
}

export function LineChartCard({
  title,
  subtitle,
  data,
  xKey,
  yKeys,
  height = 288,
  loading,
  className,
}: LineChartCardProps) {
  if (loading) {
    return <ChartSkeleton className={className} />;
  }

  if (data.length === 0) {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {subtitle && <CardDescription>{subtitle}</CardDescription>}
        </CardHeader>
        <CardContent>
          <EmptyState
            title="No chart data"
            description="There is not enough data to display this chart."
            className="min-h-[12rem]"
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {subtitle && <CardDescription>{subtitle}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 8, right: 16, bottom: 8, left: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--border)"
                vertical={false}
              />
              <XAxis
                dataKey={xKey}
                tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                axisLine={{ stroke: "var(--border)" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value: number) => formatChartValue(value)}
              />
              <Tooltip
                contentStyle={CHART_TOOLTIP_STYLE}
                formatter={(value: number) => [formatChartValue(value), ""]}
              />
              <Legend
                wrapperStyle={{
                  fontSize: 12,
                  color: "var(--muted-foreground)",
                }}
              />
              {yKeys.map((y, index) => (
                <Line
                  key={y.key}
                  type="monotone"
                  dataKey={y.key}
                  name={y.name}
                  stroke={y.color ?? CHART_COLORS[index % CHART_COLORS.length]}
                  strokeWidth={2}
                  dot={{ r: 3, strokeWidth: 2, fill: "var(--background)" }}
                  activeDot={{ r: 5 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
