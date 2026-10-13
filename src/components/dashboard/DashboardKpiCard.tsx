import { motion } from "motion/react";
import type { LucideIcon } from "lucide-react";
import { KPICard } from "@/components/common/KPICard";
import type { DashboardKPI } from "@/types";
import * as Icons from "lucide-react";

interface DashboardKpiCardProps {
  kpi: DashboardKPI;
  index?: number;
  /** Tailwind classes for the icon circle tint. Defaults to a tint picked from the KPI title's meaning. */
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

/** Dashboard KPI tile — the shared KPICard fed from dashboard KPI data. */
export function DashboardKpiCard({
  kpi,
  index = 0,
  iconClassName,
}: DashboardKpiCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="h-full"
    >
      <KPICard
        label={kpi.title}
        value={kpi.value}
        icon={resolveIcon(kpi.icon)}
        iconClassName={iconClassName}
        onClick={kpi.action}
        trend={
          kpi.trend && kpi.trendPercent !== undefined
            ? { direction: kpi.trend, percent: kpi.trendPercent }
            : undefined
        }
        subtitle={
          kpi.previousPeriod !== undefined
            ? `vs ${kpi.previousPeriod}`
            : undefined
        }
      />
    </motion.div>
  );
}
