import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/common/EmptyState";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import {
  Shield,
  Server,
  Cpu,
  Database,
  Activity,
  CheckCircle,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AuditLog, AIConfig } from "@/types";

interface DashboardAdminStatsProps {
  auditLogs?: AuditLog[];
  aiConfig?: AIConfig | null;
  title?: string;
  maxItems?: number;
  delay?: number;
}

const actionIcons: Record<AuditLog["action"], LucideIcon> = {
  login: CheckCircle,
  logout: Activity,
  create: CheckCircle,
  update: Activity,
  delete: Activity,
  approve: CheckCircle,
  ai_usage: Cpu,
  export: Activity,
  settings_change: Server,
  submit: Activity,
  return: Activity,
  escalate: Shield,
  acknowledge: CheckCircle,
  sync: Database,
  assign: Activity,
  override: Shield,
};

const actionColors: Record<AuditLog["action"], string> = {
  login:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  logout: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  create: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  update:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  delete: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  approve:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  ai_usage:
    "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  export: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
  settings_change:
    "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  submit: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  return:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  escalate: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  acknowledge:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  sync: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
  assign: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  override:
    "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
};

export function DashboardAdminStats({
  auditLogs = [],
  aiConfig,
  title = "Recent Audit Logs",
  maxItems = 10,
  delay = 0,
}: DashboardAdminStatsProps) {
  const logs = auditLogs.slice(0, maxItems);

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
            <Shield className="size-5 text-emerald-600" aria-hidden="true" />
            <CardTitle>{title}</CardTitle>
          </div>
          <Badge variant="secondary" className="h-5">
            {logs.length}
          </Badge>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <EmptyState
              title="No audit logs"
              description="System activity will be recorded here."
              className="border-0 bg-transparent"
            />
          ) : (
            <ScrollArea className="h-72 pr-3">
              <ul className="space-y-2">
                {logs.map((log) => {
                  const Icon = actionIcons[log.action] ?? Activity;
                  return (
                    <li
                      key={log.id}
                      className="flex items-center gap-3 rounded-lg border border-border bg-card p-2.5"
                    >
                      <div
                        className={cn(
                          "flex size-8 shrink-0 items-center justify-center rounded-full",
                          actionColors[log.action],
                        )}
                      >
                        <Icon className="size-3.5" aria-hidden="true" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground">
                          {log.action}{" "}
                          <span className="text-muted-foreground">·</span>{" "}
                          {log.module}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {log.userName} · {log.object}
                        </p>
                      </div>
                      <time
                        dateTime={log.timestamp}
                        className="shrink-0 text-xs text-muted-foreground"
                      >
                        {format(new Date(log.timestamp), "MMM d, HH:mm")}
                      </time>
                    </li>
                  );
                })}
              </ul>
            </ScrollArea>
          )}

          {aiConfig && (
            <div className="mt-4 rounded-lg border bg-muted/50 p-3">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
                <Database className="size-4" aria-hidden="true" />
                System / AI Config
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div>
                  <span className="block font-medium text-foreground">
                    Model
                  </span>
                  {aiConfig.preferredModel}
                </div>
                <div>
                  <span className="block font-medium text-foreground">
                    Confidence
                  </span>
                  {aiConfig.confidenceThreshold}
                </div>
                <div>
                  <span className="block font-medium text-foreground">
                    Auto Recommend
                  </span>
                  {aiConfig.autoRecommendation ? "On" : "Off"}
                </div>
                <div>
                  <span className="block font-medium text-foreground">
                    Explainable AI
                  </span>
                  {aiConfig.explainableAI ? "On" : "Off"}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
