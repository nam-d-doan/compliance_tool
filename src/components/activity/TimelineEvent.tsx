import {
  CheckCircle,
  FileBadge,
  FilePlus,
  MessageSquare,
  Scale,
  Sparkles,
  ThumbsUp,
  UploadCloud,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { motion } from "motion/react";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { ActivityFeedItem } from "@/types";

export interface TimelineEventItem extends ActivityFeedItem {
  icon?: string;
}

export interface TimelineEventProps {
  event: TimelineEventItem;
  isLast?: boolean;
  className?: string;
}

const iconMap: Record<ActivityFeedItem["type"], LucideIcon> = {
  submission: CheckCircle,
  approval: ThumbsUp,
  rejection: XCircle,
  upload: UploadCloud,
  cap_created: FilePlus,
  license_updated: FileBadge,
  regulation_published: Scale,
  comment: MessageSquare,
  ai_insight: Sparkles,
};

const typeColor: Record<ActivityFeedItem["type"], string> = {
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
    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  comment: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  ai_insight:
    "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/30 dark:text-fuchsia-400",
};

export function TimelineEvent({
  event,
  isLast,
  className,
}: TimelineEventProps) {
  const Icon =
    event.icon && iconMap[event.icon as ActivityFeedItem["type"]]
      ? iconMap[event.icon as ActivityFeedItem["type"]]
      : iconMap[event.type];

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn("relative flex gap-3", className)}
    >
      <div className="relative flex flex-col items-center">
        <div
          className={cn(
            "flex size-8 items-center justify-center rounded-full border-2 border-background",
            typeColor[event.type],
          )}
        >
          <Icon className="size-4" aria-hidden="true" />
        </div>
        {!isLast && <div className="mt-1 w-px flex-1 bg-border" />}
      </div>
      <div className={cn("flex-1 pb-5", isLast && "pb-0")}>
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-medium text-foreground">
              {event.title}
            </h4>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(event.timestamp), {
                addSuffix: true,
              })}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">{event.description}</p>
          <div className="mt-1.5 flex items-center gap-2">
            <Avatar size="sm">
              <AvatarFallback className="text-xs">
                {event.userName
                  .split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground">
              {event.userName}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
