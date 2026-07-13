import type { LucideIcon } from "lucide-react";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { motion } from "motion/react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CardSkeleton } from "@/components/common/Skeletons";
import { cn } from "@/lib/utils";

export interface KPICardTrend {
  direction: "up" | "down" | "flat";
  percent: number;
  positive?: boolean;
}

export interface KPICardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: KPICardTrend;
  subtitle?: string;
  loading?: boolean;
  className?: string;
  /** Tailwind classes for the icon circle tint, e.g. "bg-blue-500/10 text-blue-600". Defaults to primary. */
  iconClassName?: string;
  onClick?: () => void;
}

export function KPICard({
  label,
  value,
  icon: Icon,
  trend,
  subtitle,
  loading,
  className,
  iconClassName,
  onClick,
}: KPICardProps) {
  if (loading) {
    return <CardSkeleton className={className} />;
  }

  const isPositive = trend?.positive ?? trend?.direction === "up";
  const trendColor = isPositive ? "text-success" : "text-danger";

  const TrendIcon =
    trend?.direction === "up"
      ? ArrowUp
      : trend?.direction === "down"
        ? ArrowDown
        : Minus;

  return (
    <motion.div
      whileHover={onClick ? { y: -2 } : undefined}
      transition={{ duration: 0.2 }}
      className="h-full"
    >
      <Card
        className={cn(
          "h-full overflow-hidden",
          onClick && "cursor-pointer",
          className,
        )}
        onClick={onClick}
      >
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <span className="text-sm font-medium text-muted-foreground">
            {label}
          </span>
          {Icon && (
            <div
              className={cn(
                "flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary",
                iconClassName,
              )}
            >
              <Icon className="size-5" aria-hidden="true" />
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold tracking-tight text-foreground">
            {value}
          </div>
          {(trend || subtitle) && (
            <div className="mt-1 flex items-center gap-2 text-xs">
              {trend && (
                <span
                  className={cn(
                    "inline-flex items-center gap-0.5 font-medium",
                    trendColor,
                  )}
                >
                  <TrendIcon className="size-3" aria-hidden="true" />
                  {trend.percent}%
                </span>
              )}
              {subtitle && (
                <span className="text-muted-foreground">{subtitle}</span>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
