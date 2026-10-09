import {
  Bar,
  BarChart,
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
import { useCommonT } from "@/constants/i18n/common";
import {
  CHART_COLORS,
  CHART_TOOLTIP_STYLE,
  formatChartValue,
  type ChartDataPoint,
} from "./chart-theme";

export interface BarChartCardProps {
  title: string;
  subtitle?: string;
  data: ChartDataPoint[];
  xKey: string;
  yKeys: { key: string; name: string; color?: string }[];
  height?: number;
  loading?: boolean;
  className?: string;
}

export function BarChartCard({
  title,
  subtitle,
  data,
  xKey,
  yKeys,
  height = 288,
  loading,
  className,
}: BarChartCardProps) {
  const { t } = useCommonT();
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
            title={t("noChartData")}
            description={t("noChartDataDesc")}
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
            <BarChart
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
                formatter={(value) => [formatChartValue(value as number), ""]}
              />
              <Legend
                wrapperStyle={{
                  fontSize: 12,
                  color: "var(--muted-foreground)",
                }}
              />
              {yKeys.map((y, index) => (
                <Bar
                  key={y.key}
                  dataKey={y.key}
                  name={y.name}
                  fill={y.color ?? CHART_COLORS[index % CHART_COLORS.length]}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
