import { motion } from "motion/react";
import { Card, CardContent } from "@/components/ui/card";
import { Inbox } from "lucide-react";
import {
  getObligationPriorityStats,
  getObligationStatusStats,
  type ObligationPriorityStats,
  type ObligationStatusStats,
} from "@/lib/obligation-helpers";
import { cn } from "@/lib/utils";
import type { Obligation, CAP } from "@/types";

interface ObligationOverviewCardProps {
  obligations: Obligation[];
  capMap: Map<string, CAP[]>;
}

const PRIORITY_ROWS: {
  key: keyof ObligationPriorityStats;
  label: string;
  dot: string;
  text: string;
}[] = [
  {
    key: "critical",
    label: "Critical",
    dot: "bg-red-500",
    text: "text-red-600 dark:text-red-400",
  },
  {
    key: "high",
    label: "High",
    dot: "bg-orange-500",
    text: "text-orange-600 dark:text-orange-400",
  },
  {
    key: "medium",
    label: "Medium",
    dot: "bg-amber-500",
    text: "text-amber-600 dark:text-amber-400",
  },
  {
    key: "low",
    label: "Low",
    dot: "bg-emerald-500",
    text: "text-emerald-600 dark:text-emerald-400",
  },
];

const STATUS_ROWS: {
  key: keyof ObligationStatusStats;
  label: string;
  tone: string;
}[] = [
  { key: "draft", label: "Draft", tone: "text-slate-600 dark:text-slate-400" },
  {
    key: "submitted",
    label: "Submitted",
    tone: "text-blue-600 dark:text-blue-400",
  },
  {
    key: "review_required",
    label: "Review Required",
    tone: "text-amber-600 dark:text-amber-400",
  },
  {
    key: "cap_in_progress",
    label: "CAP In Progress",
    tone: "text-amber-600 dark:text-amber-400",
  },
  {
    key: "completed",
    label: "Completed",
    tone: "text-emerald-600 dark:text-emerald-400",
  },
];

export function ObligationOverviewCard({
  obligations,
  capMap,
}: ObligationOverviewCardProps) {
  const priorityStats = getObligationPriorityStats(obligations);
  const statusStats = getObligationStatusStats(obligations, capMap);
  const total = obligations.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="h-full">
        <CardContent className="p-5">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Inbox className="size-4" aria-hidden="true" />
            </span>
            <div>
              <h3 className="text-sm font-semibold tracking-tight">
                Obligation Overview
              </h3>
              <p className="text-xs text-muted-foreground">
                {total} total · status derived from linked CAPs
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            {/* By priority */}
            <div>
              <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                By Priority
              </p>
              <ul className="space-y-1.5">
                {PRIORITY_ROWS.map((row) => (
                  <li
                    key={row.key}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                      <span
                        className={cn("size-2 rounded-full", row.dot)}
                        aria-hidden="true"
                      />
                      {row.label}
                    </span>
                    <span
                      className={cn("font-semibold tabular-nums", row.text)}
                    >
                      {priorityStats[row.key]}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* By effective status */}
            <div>
              <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                By Status
              </p>
              <ul className="space-y-1.5">
                {STATUS_ROWS.map((row) => (
                  <li
                    key={row.key}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="text-muted-foreground">{row.label}</span>
                    <span
                      className={cn("font-semibold tabular-nums", row.tone)}
                    >
                      {statusStats[row.key]}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
