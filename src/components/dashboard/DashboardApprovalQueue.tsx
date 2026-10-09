import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/common/EmptyState";
import { PriorityBadge } from "@/components/common/PriorityBadge";
import { StatusBadge } from "@/components/common/StatusBadge";
import {
  CheckCircle,
  XCircle,
  ArrowRight,
  FileText,
  ShieldAlert,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { Obligation, CAP } from "@/types";
import type { PriorityLevel } from "@/constants/status";
import { useL, useDateLocale } from "@/lib/i18n";

interface QueueItem {
  id: string;
  type: "compliance" | "cap";
  title: string;
  entityId: string;
  status: string;
  priority: PriorityLevel;
  dueDate: string;
  ownerName: string;
}

interface DashboardApprovalQueueProps {
  compliance?: Obligation[];
  caps?: CAP[];
  title?: string;
  maxItems?: number;
  delay?: number;
}

export function DashboardApprovalQueue({
  compliance = [],
  caps = [],
  title,
  maxItems = 10,
  delay = 0,
}: DashboardApprovalQueueProps) {
  const L = useL();
  const dateLocale = useDateLocale();
  title ??= L("Approval Queue", "Hàng đợi phê duyệt");
  const items: QueueItem[] = [
    ...compliance
      .filter((c) => ["review_required", "submitted"].includes(c.status))
      .map((c) => ({
        id: c.id,
        type: "compliance" as const,
        title: c.title,
        entityId: c.code,
        status: c.status,
        priority: c.riskLevel,
        dueDate: c.dueDate,
        ownerName: c.ownerName,
      })),
    ...caps
      .filter((c) => c.status === "Pending Approval")
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

  const grouped = items.reduce<Record<string, QueueItem[]>>((acc, item) => {
    acc[item.type] = acc[item.type] ?? [];
    acc[item.type].push(item);
    return acc;
  }, {});

  const typeIcons = {
    compliance: FileText,
    cap: ShieldAlert,
  };

  const typeLabels = {
    compliance: L("Compliance", "Tuân thủ"),
    cap: "CAP",
  };

  const typeRoutes = {
    compliance: "obligations",
    cap: "cap",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className="h-full"
    >
      <Card className="h-full">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle>{title}</CardTitle>
          <Badge variant="secondary" className="h-5">
            {items.length}
          </Badge>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <EmptyState
              title={L("No pending approvals", "Không có mục chờ duyệt")}
              description={L("You're all caught up.", "Bạn đã xử lý hết.")}
              className="border-0 bg-transparent"
            />
          ) : (
            <div className="space-y-5">
              {Object.entries(grouped).map(([type, groupItems]) => {
                const Icon = typeIcons[type as keyof typeof typeIcons];
                return (
                  <div key={type}>
                    <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      <Icon className="size-3.5" aria-hidden="true" />
                      {typeLabels[type as keyof typeof typeLabels]}
                      <Badge variant="outline" className="h-4 text-[10px]">
                        {groupItems.length}
                      </Badge>
                    </div>
                    <ul className="space-y-2">
                      {groupItems.map((item) => (
                        <li
                          key={item.id}
                          className={cn(
                            "group flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-2.5 transition-colors hover:bg-muted/50",
                          )}
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-foreground">
                              {item.title}
                            </p>
                            <div className="mt-1 flex flex-wrap items-center gap-2">
                              <StatusBadge status={item.status} size="sm" />
                              <PriorityBadge
                                priority={item.priority}
                                size="sm"
                              />
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(item.dueDate), "MMM d", { locale: dateLocale })}
                              </span>
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              className="text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-900/30"
                              title={L("Approve", "Phê duyệt")}
                            >
                              <CheckCircle
                                className="size-3.5"
                                aria-hidden="true"
                              />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              className="text-red-600 hover:bg-red-100 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/30"
                              title={L("Reject", "Từ chối")}
                            >
                              <XCircle
                                className="size-3.5"
                                aria-hidden="true"
                              />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              asChild
                              className="opacity-0 group-hover:opacity-100"
                            >
                              <Link
                                to={`/${typeRoutes[item.type as keyof typeof typeRoutes]}/${item.id}`}
                              >
                                <ArrowRight
                                  className="size-3.5"
                                  aria-hidden="true"
                                />
                              </Link>
                            </Button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
