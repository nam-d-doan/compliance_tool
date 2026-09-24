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
  submission: "bg-info-bg text-info",
  approval: "bg-success-bg text-success",
  rejection: "bg-danger-bg text-danger",
  upload: "bg-info-bg text-info",
  cap_created: "bg-warning-bg text-warning",
  license_updated: "bg-neutral-bg text-neutral",
  regulation_published: "bg-neutral-bg text-neutral",
  comment: "bg-neutral-bg text-neutral",
  ai_insight: "bg-primary/15 text-primary",
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
