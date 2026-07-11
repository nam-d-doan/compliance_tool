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
    dot: "bg-danger",
    text: "text-danger",
  },
  {
    key: "high",
    label: "High",
    dot: "bg-warning",
    text: "text-warning",
  },
  {
    key: "medium",
    label: "Medium",
    dot: "bg-info",
    text: "text-info",
  },
  {
    key: "low",
    label: "Low",
    dot: "bg-neutral",
    text: "text-neutral",
  },
];

const STATUS_ROWS: {
  key: keyof ObligationStatusStats;
  label: string;
  tone: string;
}[] = [
  { key: "draft", label: "Draft", tone: "text-neutral" },
  {
    key: "submitted",
    label: "Submitted",
    tone: "text-info",
  },
  {
    key: "review_required",
    label: "Review Required",
    tone: "text-warning",
  },
  {
    key: "cap_in_progress",
    label: "CAP In Progress",
    tone: "text-warning",
  },
  {
    key: "completed",
    label: "Completed",
    tone: "text-success",
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
            <span className="bg-info-bg text-info flex size-8 items-center justify-center rounded-lg">
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
