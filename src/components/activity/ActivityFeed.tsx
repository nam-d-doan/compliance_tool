import { motion } from "motion/react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ListSkeleton } from "@/components/common/Skeletons";
import { EmptyState } from "@/components/common/EmptyState";
import { TimelineEvent, type TimelineEventItem } from "./TimelineEvent";
import { cn } from "@/lib/utils";

export interface ActivityFeedProps {
  events: TimelineEventItem[];
  loading?: boolean;
  emptyMessage?: string;
  maxHeight?: number | string;
  className?: string;
}

export function ActivityFeed({
  events,
  loading,
  emptyMessage = "No recent activity.",
  maxHeight = 420,
  className,
}: ActivityFeedProps) {
  if (loading) {
    return <ListSkeleton className={className} />;
  }

  if (events.length === 0) {
    return (
      <EmptyState
        title="No activity yet"
        description={emptyMessage}
        className={cn("min-h-[12rem]", className)}
      />
    );
  }

  return (
    <ScrollArea className={className} style={{ maxHeight }}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-1 pr-3"
      >
        {events.map((event, index) => (
          <TimelineEvent
            key={event.id}
            event={event}
            isLast={index === events.length - 1}
          />
        ))}
      </motion.div>
    </ScrollArea>
  );
}
