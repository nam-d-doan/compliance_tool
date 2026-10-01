import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
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

export interface PieChartCardProps {
  title: string;
  subtitle?: string;
  data: ChartDataPoint[];
  nameKey: string;
  valueKey: string;
  colors?: string[];
  height?: number;
  loading?: boolean;
  className?: string;
}

export function PieChartCard({
  title,
  subtitle,
  data,
  nameKey,
  valueKey,
  colors = CHART_COLORS,
  height = 288,
  loading,
  className,
}: PieChartCardProps) {
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
            <PieChart>
              <Pie
                data={data}
                dataKey={valueKey}
                nameKey={nameKey}
                cx="50%"
                cy="50%"
                outerRadius={Math.min(height, 240) / 2.5}
                innerRadius={height > 240 ? 60 : 0}
                paddingAngle={2}
                isAnimationActive={false}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      (typeof entry.color === "string" && entry.color) ||
                      colors[index % colors.length]
                    }
                    stroke="var(--background)"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={CHART_TOOLTIP_STYLE}
                formatter={(value, name) => [
                  formatChartValue(value as number),
                  name,
                ]}
              />
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
        </div>
      </CardContent>
    </Card>
  );
}
