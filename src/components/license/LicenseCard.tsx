import { Calendar, User } from "lucide-react";
import { motion } from "motion/react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/common/StatusBadge";
import { PriorityBadge } from "@/components/common/PriorityBadge";
import { cn } from "@/lib/utils";
import type { License } from "@/types";

export interface LicenseCardProps {
  item: License;
  onClick?: () => void;
  className?: string;
}

export function LicenseCard({ item, onClick, className }: LicenseCardProps) {
  const days = item.remainingDays;
  const daysColor =
    days < 0
      ? "text-red-600 dark:text-red-400"
      : days <= 30
        ? "text-amber-600 dark:text-amber-400"
        : "text-emerald-600 dark:text-emerald-400";

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
                {item.licenseNumber}
              </span>
              <CardTitle className="mt-0.5 line-clamp-2 text-sm font-medium leading-snug">
                {item.licenseName}
              </CardTitle>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1.5">
              <StatusBadge status={item.status} size="sm" />
              <PriorityBadge priority={item.criticality} size="sm" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <User className="size-3.5" aria-hidden="true" />
              {item.ownerName}
            </span>
            <span className="inline-flex items-center gap-1">
              <Calendar className="size-3.5" aria-hidden="true" />
              {format(new Date(item.expiryDate), "MMM d, yyyy")}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Remaining days</span>
            <span className={cn("font-medium tabular-nums", daysColor)}>
              {days < 0
                ? `${Math.abs(days)} days overdue`
                : `${days} days left`}
            </span>
          </div>

          {item.aiRiskScore > 0 && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">AI risk score</span>
              <span
                className={cn(
                  "font-medium",
                  item.aiRiskScore >= 80
                    ? "text-red-600 dark:text-red-400"
                    : item.aiRiskScore >= 50
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-emerald-600 dark:text-emerald-400",
                )}
              >
                {item.aiRiskScore}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
