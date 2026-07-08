import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import {
  Bell,
  Check,
  AlertTriangle,
  ScrollText,
  Sparkles,
  Megaphone,
} from "lucide-react";

interface Notification {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  category: string;
}

const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    icon: AlertTriangle,
    title: "Overdue obligation filing",
    description: "GDPR Article 30 registration is 3 days overdue.",
    timestamp: "1 hr ago",
    read: false,
    category: "Compliance",
  },
  {
    id: "2",
    icon: Sparkles,
    title: "AI recommendation",
    description: "AI detected 12 likely overdue submissions in Retail Banking.",
    timestamp: "5 hr ago",
    read: false,
    category: "AI",
  },
  {
    id: "5",
    icon: ScrollText,
    title: "CAP due date approaching",
    description: "CAP-2024-011 remediation is due tomorrow.",
    timestamp: "Yesterday",
    read: true,
    category: "CAP",
  },
  {
    id: "6",
    icon: Megaphone,
    title: "System maintenance",
    description: "Scheduled maintenance on Sunday 02:00 UTC.",
    timestamp: "2 days ago",
    read: true,
    category: "System",
  },
];

// Category -> tinted icon chip. Mirrors the established pattern in
// TimelineEvent.tsx so colors stay correct in light + dark mode.
const CATEGORY_STYLES: Record<string, string> = {
  Compliance: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  AI: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  CAP: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  System: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
};

const DEFAULT_CATEGORY_STYLE = "bg-muted text-muted-foreground";

type NotificationFilter = "all" | "unread";

interface NotificationDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NotificationDrawer({
  open,
  onOpenChange,
}: NotificationDrawerProps) {
  const [notifications, setNotifications] = useState<Notification[]>(
    INITIAL_NOTIFICATIONS,
  );
  const [filter, setFilter] = useState<NotificationFilter>("all");

  const unreadCount = notifications.filter((n) => !n.read).length;
  const visibleNotifications =
    filter === "unread" ? notifications.filter((n) => !n.read) : notifications;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col sm:max-w-md">
        <SheetHeader className="gap-4 px-6 pt-6 pb-0">
          {/* Title block — kept on the left so it never clashes with the top-right close button. */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Bell className="size-5" />
              </span>
              <SheetTitle className="text-base font-semibold tracking-tight">
                Notifications
              </SheetTitle>
            </div>
            <SheetDescription className="text-xs">
              Stay updated on approvals, deadlines, and AI insights.
            </SheetDescription>
          </div>

          {/* Segmented filter control */}
          <div
            role="group"
            aria-label="Filter notifications"
            className="inline-flex w-full items-center gap-1 rounded-lg bg-muted p-1"
          >
            <FilterTab
              label="All"
              active={filter === "all"}
              onClick={() => setFilter("all")}
            />
            <FilterTab
              label="Unread"
              active={filter === "unread"}
              count={unreadCount}
              onClick={() => setFilter("unread")}
            />
          </div>
        </SheetHeader>

        <ScrollArea className="min-h-0 flex-1">
          {visibleNotifications.length === 0 ? (
            <EmptyState filter={filter} />
          ) : (
            <div className="flex flex-col gap-2 px-6 py-4">
              {visibleNotifications.map((notification, index) => {
                const Icon = notification.icon;
                return (
                  <motion.button
                    key={notification.id}
                    type="button"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.22,
                      delay: Math.min(index * 0.04, 0.24),
                      ease: "easeOut",
                    }}
                    onClick={() => markAsRead(notification.id)}
                    className={cn(
                      "group flex w-full items-start gap-3 rounded-xl border p-3.5 text-left transition-colors duration-200",
                      notification.read
                        ? "border-border/70 bg-card/40 hover:border-border hover:bg-muted/60"
                        : "border-primary/15 bg-primary/[0.05] hover:bg-primary/[0.09]",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-9 shrink-0 items-center justify-center rounded-lg",
                        CATEGORY_STYLES[notification.category] ??
                          DEFAULT_CATEGORY_STYLE,
                      )}
                    >
                      <Icon className="size-5" />
                    </span>

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={cn(
                            "text-sm leading-snug",
                            notification.read
                              ? "font-normal text-muted-foreground"
                              : "font-medium text-foreground",
                          )}
                        >
                          {notification.title}
                        </p>
                        {!notification.read && (
                          <span
                            aria-hidden="true"
                            className="mt-1.5 size-2 shrink-0 rounded-full bg-primary ring-2 ring-primary/20"
                          />
                        )}
                      </div>
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        {notification.description}
                      </p>
                      <div className="flex items-center gap-1.5 pt-0.5 text-[11px] text-muted-foreground/70">
                        <span>{notification.timestamp}</span>
                        <span aria-hidden="true" className="opacity-50">
                          &middot;
                        </span>
                        <span>{notification.category}</span>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <SheetFooter className="px-6 pb-6 pt-0">
          <Button
            variant="outline"
            className="w-full"
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
          >
            <Check className="size-4" />
            Mark all as read
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function FilterTab({
  label,
  active,
  count,
  onClick,
}: {
  label: string;
  active: boolean;
  count?: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
        active
          ? "bg-background text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
      {count !== undefined && count > 0 && (
        <span
          className={cn(
            "tabular-nums text-[11px]",
            active ? "text-muted-foreground" : "text-muted-foreground/70",
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function EmptyState({ filter }: { filter: NotificationFilter }) {
  const isUnread = filter === "unread";
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-20 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        {isUnread ? <Check className="size-5" /> : <Bell className="size-5" />}
      </span>
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">
          {isUnread ? "You're all caught up" : "No notifications"}
        </p>
        <p className="text-xs text-muted-foreground">
          {isUnread
            ? "No unread items right now."
            : "New activity will show up here."}
        </p>
      </div>
    </div>
  );
}
