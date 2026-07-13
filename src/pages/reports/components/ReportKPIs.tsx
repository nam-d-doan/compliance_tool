import { KPICard } from "@/components/common/KPICard";
import type { ReportKPI } from "@/types";
import * as Icons from "lucide-react";
import type { LucideIcon } from "lucide-react";

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

export interface ReportKPIsProps {
  kpis: ReportKPI[];
  loading?: boolean;
  columns?: 4 | 5 | 6;
}

export function ReportKPIs({ kpis, loading, columns = 5 }: ReportKPIsProps) {
  const gridClass =
    columns === 4
      ? "sm:grid-cols-2 lg:grid-cols-4"
      : columns === 6
        ? "sm:grid-cols-2 lg:grid-cols-5 xl:grid-cols-6"
        : "sm:grid-cols-2 lg:grid-cols-5";

  return (
    <div className={`grid items-stretch gap-4 ${gridClass}`}>
      {kpis.map((kpi, index) => (
        <KPICard
          key={`${kpi.label}-${index}`}
          label={kpi.label}
          value={kpi.value}
          icon={resolveIcon(kpi.icon)}
          loading={loading}
          className="h-full"
          trend={
            kpi.trend && kpi.trendPercent !== undefined
              ? { direction: kpi.trend, percent: kpi.trendPercent }
              : undefined
          }
        />
      ))}
    </div>
  );
}
