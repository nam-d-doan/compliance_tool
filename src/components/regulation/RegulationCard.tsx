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
                {item.source}
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
              {item.regulatoryBody}
            </span>
            <span className="inline-flex items-center gap-1">
              <Calendar className="size-3.5" aria-hidden="true" />
              {format(new Date(item.effectiveDate), "MMM d, yyyy")}
            </span>
          </div>

          {item.articles.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {item.articles.slice(0, 3).map((article) => (
                <span
                  key={article.id}
                  className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                >
                  {article.number}
                </span>
              ))}
              {item.articles.length > 3 && (
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  +{item.articles.length - 3}
                </span>
              )}
            </div>
          )}

          <div className="flex items-center justify-between border-t border-border pt-3">
            <span className="text-xs text-muted-foreground">Priority</span>
            <span className="text-xs font-medium capitalize">
              {item.priority}
            </span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
