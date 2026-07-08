import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/common/EmptyState";
import { PriorityBadge } from "@/components/common/PriorityBadge";
import { StatusBadge } from "@/components/common/StatusBadge";
import { ArrowRight, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { isOverdueDueDate } from "@/lib/due-date";
import { cn } from "@/lib/utils";
import type { ComplianceObligation, CAP } from "@/types";
import type { PriorityLevel } from "@/constants/status";

interface AttentionItem {
  id: string;
  type: "compliance" | "cap";
  title: string;
  entityId: string;
  status: string;
  priority: PriorityLevel;
  dueDate: string;
  ownerName: string;
}

interface DashboardNeedsAttentionListProps {
  compliance?: ComplianceObligation[];
  caps?: CAP[];
  title?: string;
  maxItems?: number;
  delay?: number;
}

export function DashboardNeedsAttentionList({
  compliance = [],
  caps = [],
  title = "Needs Attention",
  maxItems = 8,
  delay = 0,
}: DashboardNeedsAttentionListProps) {
  const items: AttentionItem[] = [
    ...compliance
      .filter(
        (c) =>
          isOverdueDueDate(
            c.dueDate,
            ["Completed", "Approved"].includes(c.status),
          ) || c.criticality === "critical",
      )
      .map((c) => ({
        id: c.id,
        type: "compliance" as const,
        title: c.title,
        entityId: c.complianceId,
        status: c.status,
        priority: c.criticality,
        dueDate: c.dueDate,
        ownerName: c.ownerName,
      })),
    ...caps
      .filter(
        (c) =>
          c.status !== "Closed" &&
          (isOverdueDueDate(
            c.dueDate,
            ["Closed", "Rejected"].includes(c.status),
          ) ||
            c.priority === "critical" ||
            c.priority === "high"),
      )
      .map((c) => ({
        id: c.id,
        type: "cap" as const,
        title: c.title,
        entityId: c.capId,
        status: c.status,
        priority: c.priority,
        dueDate: c.dueDate,
        ownerName: c.ownerName,
      })),
  ]
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
      <Card className="h-full border-l-4 border-l-red-500">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="size-5 text-red-500" aria-hidden="true" />
            <CardTitle>{title}</CardTitle>
          </div>
          <Badge variant="destructive" className="h-5">
            {items.length}
          </Badge>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <EmptyState
              title="Nothing needs attention"
              description="No overdue or critical items found."
              className="border-0 bg-transparent"
            />
          ) : (
            <ul className="space-y-3">
              {items.map((item) => (
                <li
                  key={item.id}
                  className={cn(
                    "group flex flex-col gap-2 rounded-lg border border-border bg-card p-3 transition-colors hover:bg-muted/50",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {item.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.entityId} · {item.ownerName}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      asChild
                      className="shrink-0 opacity-0 group-hover:opacity-100"
                    >
                      <Link
                        to={`/${item.type === "compliance" ? "compliance" : "cap"}/${item.id}`}
                      >
                        <ArrowRight className="size-3.5" aria-hidden="true" />
                      </Link>
                    </Button>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={item.status} size="sm" />
                    <PriorityBadge priority={item.priority} size="sm" />
                    <span className="text-xs text-muted-foreground">
                      Due {format(new Date(item.dueDate), "MMM d, yyyy")}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
