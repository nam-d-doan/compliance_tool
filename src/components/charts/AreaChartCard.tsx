import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
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

export interface AreaChartCardProps {
  title: string;
  subtitle?: string;
  data: ChartDataPoint[];
  xKey: string;
  yKeys: { key: string; name: string; color?: string }[];
  height?: number;
  loading?: boolean;
  className?: string;
}

export function AreaChartCard({
  title,
  subtitle,
  data,
  xKey,
  yKeys,
  height = 288,
  loading,
  className,
}: AreaChartCardProps) {
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
            <AreaChart
              data={data}
              margin={{ top: 8, right: 16, bottom: 8, left: 0 }}
            >
              <defs>
                {yKeys.map((y, index) => {
                  const color =
                    y.color ?? CHART_COLORS[index % CHART_COLORS.length];
                  return (
                    <linearGradient
                      key={y.key}
                      id={`area-gradient-${y.key}`}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={color} stopOpacity={0.02} />
                    </linearGradient>
                  );
                })}
              </defs>
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
              {yKeys.map((y, index) => {
                const color =
                  y.color ?? CHART_COLORS[index % CHART_COLORS.length];
                return (
                  <Area
                    key={y.key}
                    type="monotone"
                    dataKey={y.key}
                    name={y.name}
                    stroke={color}
                    strokeWidth={2}
                    fill={`url(#area-gradient-${y.key})`}
                    activeDot={{
                      r: 5,
                      strokeWidth: 2,
                      fill: "var(--background)",
                    }}
                  />
                );
              })}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
