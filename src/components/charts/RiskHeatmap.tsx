import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { RiskHeatmapData } from "@/types";

export interface RiskHeatmapProps {
  title: string;
  subtitle?: string;
  data: RiskHeatmapData;
  loading?: boolean;
  className?: string;
}

const statusClasses: Record<
  RiskHeatmapData["cells"][number]["status"],
  string
> = {
  low: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  medium:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  high: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const statusLabel: Record<RiskHeatmapData["cells"][number]["status"], string> =
  {
    low: "Low",
    medium: "Medium",
    high: "High",
  };

export function RiskHeatmap({
  title,
  subtitle,
  data,
  className,
}: RiskHeatmapProps) {
  const [hoveredCell, setHoveredCell] = useState<
    RiskHeatmapData["cells"][number] | null
  >(null);

  const cellMap = new Map(data.cells.map((c) => [`${c.row}|${c.col}`, c]));

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {subtitle && <CardDescription>{subtitle}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div
            className="grid gap-1"
            style={{
              gridTemplateColumns: `auto repeat(${data.cols.length}, minmax(5rem, 1fr))`,
            }}
          >
            <div />
            {data.cols.map((col) => (
              <div
                key={col}
                className="px-1 py-2 text-center text-xs font-medium text-muted-foreground"
              >
                {col}
              </div>
            ))}
            {data.rows.map((row) => (
              <div key={row} className="contents">
                <div className="flex items-center px-2 py-1 text-xs font-medium text-muted-foreground">
                  {row}
                </div>
                {data.cols.map((col) => {
                  const cell = cellMap.get(`${row}|${col}`);
                  return (
                    <motion.button
                      key={`${row}-${col}`}
                      type="button"
                      className={cn(
                        "relative rounded-md px-2 py-3 text-center text-xs font-semibold transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-ring",
                        cell
                          ? statusClasses[cell.status]
                          : "bg-muted text-muted-foreground",
                      )}
                      onMouseEnter={() => setHoveredCell(cell ?? null)}
                      onMouseLeave={() => setHoveredCell(null)}
                    >
                      {cell ? `${Math.round(cell.value * 100)}%` : "—"}
                    </motion.button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        <AnimatePresence>
          {hoveredCell && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              className="mt-4 rounded-lg border bg-popover p-3 text-sm text-popover-foreground shadow-sm"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">
                  {hoveredCell.row} × {hoveredCell.col}
                </span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-medium",
                    statusClasses[hoveredCell.status],
                  )}
                >
                  {statusLabel[hoveredCell.status]}
                </span>
              </div>
              <p className="mt-1 text-muted-foreground">
                Risk score: {Math.round(hoveredCell.value * 100)}%
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          {(
            Object.keys(
              statusLabel,
            ) as RiskHeatmapData["cells"][number]["status"][]
          ).map((status) => (
            <div key={status} className="flex items-center gap-1.5">
              <span
                className={cn("size-3 rounded-sm", statusClasses[status])}
              />
              <span className="text-xs text-muted-foreground">
                {statusLabel[status]}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
