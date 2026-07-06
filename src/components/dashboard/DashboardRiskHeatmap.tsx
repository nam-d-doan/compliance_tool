import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { RiskHeatmapData } from "@/types";

interface DashboardRiskHeatmapProps {
  data?: RiskHeatmapData;
  title?: string;
  delay?: number;
}

const statusClasses: Record<
  RiskHeatmapData["cells"][number]["status"],
  string
> = {
  low: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  medium:
    "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  critical: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

function buildDefaultData(): RiskHeatmapData {
  const rows = ["Treasury", "Operations", "Retail Banking", "Risk", "IT"];
  const cols = [
    "Regulatory",
    "Operational",
    "Financial",
    "Cyber",
    "Third-Party",
  ];
  const cells: RiskHeatmapData["cells"] = [];

  rows.forEach((row) => {
    cols.forEach((col) => {
      const statuses: RiskHeatmapData["cells"][number]["status"][] = [
        "low",
        "medium",
        "high",
        "critical",
      ];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      cells.push({
        row,
        col,
        value: Math.floor(Math.random() * 40) + 1,
        status,
      });
    });
  });

  return { rows, cols, cells };
}

export function DashboardRiskHeatmap({
  data,
  title = "Risk Heatmap",
  delay = 0,
}: DashboardRiskHeatmapProps) {
  const heatmap = data ?? buildDefaultData();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className="h-full"
    >
      <Card className="h-full">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr>
                  <th className="p-2 text-left font-medium text-muted-foreground">
                    Business Unit
                  </th>
                  {heatmap.cols.map((col) => (
                    <th
                      key={col}
                      className="p-2 text-center font-medium text-muted-foreground"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {heatmap.rows.map((row) => (
                  <tr key={row}>
                    <td className="p-2 font-medium text-foreground">{row}</td>
                    {heatmap.cols.map((col) => {
                      const cell = heatmap.cells.find(
                        (c) => c.row === row && c.col === col,
                      );
                      return (
                        <td key={col} className="p-1">
                          <div
                            className={cn(
                              "flex h-9 items-center justify-center rounded-md font-semibold",
                              cell
                                ? statusClasses[cell.status]
                                : "bg-muted text-muted-foreground",
                            )}
                            title={
                              cell
                                ? `${row} · ${col}: ${cell.value}`
                                : undefined
                            }
                          >
                            {cell?.value ?? "-"}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <span
                className="size-2 rounded-full bg-emerald-500"
                aria-hidden="true"
              />{" "}
              Low
            </span>
            <span className="inline-flex items-center gap-1">
              <span
                className="size-2 rounded-full bg-amber-500"
                aria-hidden="true"
              />{" "}
              Medium
            </span>
            <span className="inline-flex items-center gap-1">
              <span
                className="size-2 rounded-full bg-orange-500"
                aria-hidden="true"
              />{" "}
              High
            </span>
            <span className="inline-flex items-center gap-1">
              <span
                className="size-2 rounded-full bg-red-500"
                aria-hidden="true"
              />{" "}
              Critical
            </span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
