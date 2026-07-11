import { Calendar, User } from "lucide-react";
import { motion } from "motion/react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/common/StatusBadge";
import { PriorityBadge } from "@/components/common/PriorityBadge";
import { cn } from "@/lib/utils";
import { riskScoreTextClasses } from "@/lib/risk-score";
import type { Obligation } from "@/types";

export interface ComplianceCardProps {
  item: Obligation;
  onClick?: () => void;
  className?: string;
}

export function ComplianceCard({
  item,
  onClick,
  className,
}: ComplianceCardProps) {
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
                {item.code}
              </span>
              <CardTitle className="mt-0.5 line-clamp-2 text-sm font-medium leading-snug">
                {item.title}
              </CardTitle>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1.5">
              <StatusBadge status={item.status} size="sm" />
              <PriorityBadge priority={item.riskLevel} size="sm" />
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
              {format(new Date(item.dueDate), "MMM d, yyyy")}
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium text-foreground">
                {item.progress}%
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <motion.div
                className="h-full rounded-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${item.progress}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
          </div>

          {item.aiRiskScore > 0 && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">AI risk score</span>
              <span
                className={cn(
                  "font-medium",
                  riskScoreTextClasses(item.aiRiskScore),
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
