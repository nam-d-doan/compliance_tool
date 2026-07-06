import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EmptyState } from "@/components/common/EmptyState";
import { formatDistanceToNow } from "date-fns";
import {
  CheckCircle,
  Clock,
  FileText,
  MessageSquare,
  ShieldAlert,
  UploadCloud,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ActivityFeedItem } from "@/types";

interface DashboardActivityFeedProps {
  items?: ActivityFeedItem[];
  title?: string;
  maxItems?: number;
  delay?: number;
}

const typeIcons: Record<ActivityFeedItem["type"], LucideIcon> = {
  submission: UploadCloud,
  approval: CheckCircle,
  rejection: XCircle,
  upload: UploadCloud,
  cap_created: ShieldAlert,
  license_updated: FileText,
  regulation_published: FileText,
  comment: MessageSquare,
  ai_insight: Clock,
};

const typeColors: Record<ActivityFeedItem["type"], string> = {
  submission:
    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  approval:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  rejection: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  upload:
    "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  cap_created:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  license_updated:
    "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
  regulation_published:
    "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  comment: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  ai_insight:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
};

export function DashboardActivityFeed({
  items = [],
  title = "Recent Activity",
  maxItems = 10,
  delay = 0,
}: DashboardActivityFeedProps) {
  const visible = items.slice(0, maxItems);

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
          {visible.length === 0 ? (
            <EmptyState
              title="No recent activity"
              description="Check back later for updates."
              className="border-0 bg-transparent"
            />
          ) : (
            <ScrollArea className="h-72 pr-3">
              <ul className="space-y-3">
                {visible.map((item) => {
                  const Icon = typeIcons[item.type] ?? MessageSquare;
                  return (
                    <li key={item.id} className="flex gap-3">
                      <div
                        className={cn(
                          "flex size-8 shrink-0 items-center justify-center rounded-full",
                          typeColors[item.type],
                        )}
                      >
                        <Icon className="size-3.5" aria-hidden="true" />
                      </div>
                      <div className="flex-1 space-y-0.5">
                        <p className="text-sm font-medium text-foreground">
                          {item.title}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {item.description}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{item.userName}</span>
                          <span aria-hidden="true">·</span>
                          <time dateTime={item.timestamp}>
                            {formatDistanceToNow(new Date(item.timestamp), {
                              addSuffix: true,
                            })}
                          </time>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
