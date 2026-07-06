import { Building2, Calendar } from "lucide-react";
import { motion } from "motion/react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/common/StatusBadge";
import { cn } from "@/lib/utils";
import type { Regulation } from "@/types";

export interface RegulationCardProps {
  item: Regulation;
  onClick?: () => void;
  className?: string;
}

function ScoreGauge({ value, size = 36 }: { value: number; size?: number }) {
  const radius = (size - 6) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.max(0, Math.min(100, value)) / 100);
  const color =
    value >= 80
      ? "text-red-500 dark:text-red-400"
      : value >= 50
        ? "text-amber-500 dark:text-amber-400"
        : "text-emerald-500 dark:text-emerald-400";

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className="fill-none stroke-muted"
          strokeWidth={4}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className={cn("fill-none", color)}
          strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold">
        {value}
      </span>
    </div>
  );
}

export function RegulationCard({
  item,
  onClick,
  className,
}: RegulationCardProps) {
  return (
    <motion.div
      whileHover={onClick ? { y: -4 } : undefined}
      transition={{ duration: 0.2 }}
      className={className}
    >
      <Card
        className={cn(
          "group overflow-hidden transition-shadow hover:shadow-md",
          onClick && "cursor-pointer",
        )}
        onClick={onClick}
      >
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <span className="text-xs text-muted-foreground">
                {item.reference}
              </span>
              <CardTitle className="mt-0.5 line-clamp-2 text-sm font-medium leading-snug">
                {item.title}
              </CardTitle>
            </div>
            <StatusBadge status={item.status} size="sm" />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Building2 className="size-3.5" aria-hidden="true" />
              {item.regulator}
            </span>
            <span className="inline-flex items-center gap-1">
              <Calendar className="size-3.5" aria-hidden="true" />
              {format(new Date(item.effectiveDate), "MMM d, yyyy")}
            </span>
          </div>

          {item.affectedDepartments.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {item.affectedDepartments.slice(0, 3).map((dept) => (
                <span
                  key={dept}
                  className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                >
                  {dept}
                </span>
              ))}
              {item.affectedDepartments.length > 3 && (
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  +{item.affectedDepartments.length - 3}
                </span>
              )}
            </div>
          )}

          <div className="flex items-center justify-between border-t border-border pt-3">
            <span className="text-xs text-muted-foreground">AI impact</span>
            <ScoreGauge value={item.aiImpactScore} />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
