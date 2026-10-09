import { motion } from "motion/react";
import { ArrowDown, ArrowUp, Minus, type LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { DashboardKPI } from "@/types";
import * as Icons from "lucide-react";
import { useL, useTerm } from "@/lib/i18n";

interface DashboardKpiCardProps {
  kpi: DashboardKPI;
  index?: number;
  /** Tailwind classes for the icon circle tint, e.g. "bg-blue-500/10 text-blue-600". Defaults to a cycled palette. */
  iconClassName?: string;
}

function resolveIcon(name?: string): LucideIcon {
  if (!name) return Icons.Activity;
  const key = name
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
  return (
    (Icons as unknown as Record<string, LucideIcon>)[key] ?? Icons.Activity
  );
}

function formatPrevious(previous?: string | number): string {
  if (previous === undefined || previous === null) return "";
  return `${previous}`;
}

// FDM tinted icon circle palette — cycled by index so KPI rows get varied accents.
const KPI_ICON_TINTS = [
  "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  "bg-teal-500/10 text-teal-600 dark:text-teal-400",
  "bg-rose-500/10 text-rose-600 dark:text-rose-400",
];

export function DashboardKpiCard({
  kpi,
  index = 0,
  iconClassName,
}: DashboardKpiCardProps) {
  const Icon = resolveIcon(kpi.icon);
  const L = useL();
  const term = useTerm();
  const trend = kpi.trend ?? "flat";
  const positive = trend === "up";
  const negative = trend === "down";
  const TrendIcon = positive ? ArrowUp : negative ? ArrowDown : Minus;
  const tint = iconClassName ?? KPI_ICON_TINTS[index % KPI_ICON_TINTS.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="h-full"
    >
      <Card
        className={cn(
          "h-full cursor-default transition-shadow hover:shadow-sm",
          kpi.action && "cursor-pointer",
        )}
        onClick={kpi.action}
        role={kpi.action ? "button" : undefined}
        tabIndex={kpi.action ? 0 : undefined}
      >
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {term(kpi.title)}
          </CardTitle>
          <div
            className={cn(
              "flex size-10 items-center justify-center rounded-xl",
              tint,
            )}
          >
            <Icon className="size-5" aria-hidden="true" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold tracking-tight">{kpi.value}</div>
          {(kpi.previousPeriod !== undefined ||
            kpi.trendPercent !== undefined) && (
            <div className="mt-1 flex items-center gap-1.5 text-xs">
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 font-medium",
                  positive && "text-emerald-600 dark:text-emerald-400",
                  negative && "text-red-600 dark:text-red-400",
                  !positive && !negative && "text-muted-foreground",
                )}
              >
                <TrendIcon className="size-3" aria-hidden="true" />
                {kpi.trendPercent !== undefined ? `${kpi.trendPercent}%` : "-"}
              </span>
              {kpi.previousPeriod !== undefined && (
                <span className="text-muted-foreground">
                  {L("vs", "so với")} {formatPrevious(kpi.previousPeriod)}
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
