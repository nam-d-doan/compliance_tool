import { useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { isBefore, parseISO, differenceInDays } from "date-fns";
import { ArrowRight, AlertTriangle, Clock, ClipboardCheck } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/common/StatusBadge";
import { PriorityBadge } from "@/components/common/PriorityBadge";
import { EmptyState } from "@/components/common/EmptyState";
import { ROUTES } from "@/constants/routes";
import type { Assignment } from "@/types";
import { cn } from "@/lib/utils";

type Breakdown = "status" | "department" | "priority" | "review";

export interface DashboardAssignmentsCardProps {
  title: string;
  description?: string;
  assignments: Assignment[];
  linkTo?: string;
  linkLabel?: string;
  breakdown?: Breakdown;
  delay?: number;
  className?: string;
}

function isOverdue(a: Assignment): boolean {
  return (
    isBefore(new Date(a.dueDate), new Date()) &&
    !["completed", "cancelled"].includes(a.status)
  );
}

function isDueSoon(a: Assignment): boolean {
  const days = differenceInDays(parseISO(a.dueDate), new Date());
  return (
    days >= 0 && days <= 7 && !["completed", "cancelled"].includes(a.status)
  );
}

export function DashboardAssignmentsCard({
  title,
  description,
  assignments,
  linkTo = ROUTES.ASSIGNMENTS.LIST,
  linkLabel = "View all assignments",
  breakdown = "status",
  delay = 0,
  className,
}: DashboardAssignmentsCardProps) {
  const stats = useMemo(() => {
    const overdue = assignments.filter(isOverdue).length;
    const dueSoon = assignments.filter(isDueSoon).length;
    const critical = assignments.filter(
      (a) => a.priority === "critical",
    ).length;
    const active = assignments.filter(
      (a) => !["completed", "cancelled"].includes(a.status),
    ).length;
    return { overdue, dueSoon, critical, active, total: assignments.length };
  }, [assignments]);

  const breakdownRows = useMemo(() => {
    const map = new Map<string, number>();
    assignments.forEach((a) => {
      let keys: string[];
      if (breakdown === "department") {
        const names = a.assignedDepartmentNames?.length
          ? a.assignedDepartmentNames
          : a.assignedDepartmentIds;
        keys = names.length ? names : ["Unassigned"];
      } else if (breakdown === "priority") {
        keys = [a.priority];
      } else {
        keys = [a.status];
      }
      keys.forEach((key) => {
        map.set(key, (map.get(key) ?? 0) + 1);
      });
    });
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [assignments, breakdown]);

  // For review variant, filter to assignments waiting for acknowledgment/completion
  const reviewItems = useMemo(() => {
    if (breakdown !== "review") return [];
    return assignments
      .filter((a) =>
        ["published", "acknowledged", "in_progress"].includes(a.status),
      )
      .sort(
        (a, b) => parseISO(a.dueDate).getTime() - parseISO(b.dueDate).getTime(),
      )
      .slice(0, 5);
  }, [assignments, breakdown]);

  const maxCount = Math.max(1, ...breakdownRows.map((r) => r.value));

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className={cn("h-full", className)}
    >
      <Card className="h-full">
        <CardHeader className="flex flex-row items-start justify-between gap-2">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <ClipboardCheck
                className="size-4 text-primary"
                aria-hidden="true"
              />
              {title}
            </CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          <Badge variant="secondary" className="shrink-0">
            {stats.total}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* KPI row */}
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-lg border border-border bg-muted/30 p-2.5 text-center">
              <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                <AlertTriangle className="size-3" aria-hidden="true" />
                Overdue
              </div>
              <div
                className={cn(
                  "mt-0.5 text-lg font-bold",
                  stats.overdue > 0
                    ? "text-red-600 dark:text-red-400"
                    : "text-foreground",
                )}
              >
                {stats.overdue}
              </div>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-2.5 text-center">
              <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                <Clock className="size-3" aria-hidden="true" />
                Due ≤7d
              </div>
              <div
                className={cn(
                  "mt-0.5 text-lg font-bold",
                  stats.dueSoon > 0
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-foreground",
                )}
              >
                {stats.dueSoon}
              </div>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-2.5 text-center">
              <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                <AlertTriangle className="size-3" aria-hidden="true" />
                Critical
              </div>
              <div
                className={cn(
                  "mt-0.5 text-lg font-bold",
                  stats.critical > 0
                    ? "text-red-600 dark:text-red-400"
                    : "text-foreground",
                )}
              >
                {stats.critical}
              </div>
            </div>
          </div>

          {/* Breakdown */}
          {breakdown === "review" ? (
            reviewItems.length === 0 ? (
              <EmptyState
                title="Nothing awaiting review"
                className="border-0 bg-transparent py-6"
              />
            ) : (
              <ul className="space-y-1.5">
                {reviewItems.map((a) => (
                  <li key={a.id}>
                    <Link
                      to={`/assignment/${a.id}`}
                      className="group flex items-center justify-between gap-2 rounded-md border border-border bg-card p-2 transition-colors hover:bg-muted/50"
                    >
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <p className="truncate text-xs font-medium">
                          {a.title}
                        </p>
                        <p className="truncate text-[11px] text-muted-foreground">
                          {(a.assignedDepartmentNames?.length
                            ? a.assignedDepartmentNames
                            : a.assignedDepartmentIds
                          ).join(", ")}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <StatusBadge status={a.status} size="sm" />
                        <ArrowRight
                          className="size-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
                          aria-hidden="true"
                        />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )
          ) : breakdownRows.length === 0 ? (
            <EmptyState
              title="No assignments"
              className="border-0 bg-transparent py-6"
            />
          ) : (
            <div className="space-y-2">
              {breakdownRows.map((row) => (
                <div key={row.name} className="flex items-center gap-2">
                  <span className="w-28 shrink-0 truncate text-xs text-muted-foreground">
                    {breakdown === "priority" ? (
                      <PriorityBadge
                        priority={row.name as Assignment["priority"]}
                        size="sm"
                      />
                    ) : breakdown === "status" ? (
                      <StatusBadge status={row.name} size="sm" />
                    ) : (
                      row.name
                    )}
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${(row.value / maxCount) * 100}%`,
                      }}
                      transition={{ duration: 0.5, delay: delay + 0.1 }}
                      className="h-full rounded-full bg-primary"
                    />
                  </div>
                  <span className="w-6 shrink-0 text-right text-xs font-medium">
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          )}

          <Link
            to={linkTo}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-border py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/5"
          >
            {linkLabel}
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        </CardContent>
      </Card>
    </motion.div>
  );
}
