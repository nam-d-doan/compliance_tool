import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/common/EmptyState";
import { PriorityBadge } from "@/components/common/PriorityBadge";
import { StatusBadge } from "@/components/common/StatusBadge";
import { ArrowRight, Eye, Clock } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { Obligation } from "@/types";
import type { PriorityLevel } from "@/constants/status";

interface ReviewItem {
  id: string;
  title: string;
  entityId: string;
  status: string;
  priority: PriorityLevel;
  dueDate: string;
  ownerName: string;
  evidenceScore?: number;
}

interface DashboardReviewQueueProps {
  compliance?: Obligation[];
  title?: string;
  maxItems?: number;
  delay?: number;
}

export function DashboardReviewQueue({
  compliance = [],
  title = "My Review Queue",
  maxItems = 10,
  delay = 0,
}: DashboardReviewQueueProps) {
  const items: ReviewItem[] = compliance
    .filter((c) => ["submitted", "review_required"].includes(c.status))
    .map((c) => ({
      id: c.id,
      title: c.title,
      entityId: c.code,
      status: c.status,
      priority: c.riskLevel,
      dueDate: c.dueDate,
      ownerName: c.ownerName,
    }))
    .sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
    )
    .slice(0, maxItems);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className="h-full"
    >
      <Card className="h-full">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            <Eye className="size-5 text-blue-500" aria-hidden="true" />
            <CardTitle>{title}</CardTitle>
          </div>
          <Badge variant="secondary" className="h-5">
            {items.length}
          </Badge>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <EmptyState
              title="No reviews assigned"
              description="Submissions awaiting review will appear here."
              className="border-0 bg-transparent"
            />
          ) : (
            <ul className="space-y-2">
              {items.map((item) => (
                <li
                  key={item.id}
                  className={cn(
                    "group flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:bg-muted/50",
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {item.title}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <StatusBadge status={item.status} size="sm" />
                      <PriorityBadge priority={item.priority} size="sm" />
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="size-3" aria-hidden="true" />
                        {format(new Date(item.dueDate), "MMM d")}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    asChild
                    className="shrink-0 opacity-0 group-hover:opacity-100"
                  >
                    <Link to={`/obligations/${item.id}`}>
                      <ArrowRight className="size-3.5" aria-hidden="true" />
                    </Link>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
