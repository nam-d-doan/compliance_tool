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
import { useNotifications } from "@/hooks/queries";
import {
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from "@/hooks/mutations";
import type { Notification } from "@/types";
import { formatDistance } from "date-fns";
import { useNavigate } from "react-router-dom";
import { demoNow } from "@/stores";
import { ChannelPreview } from "@/components/cms";
import {
  Bell,
  Check,
  AlertTriangle,
  ScrollText,
  Sparkles,
  Megaphone,
  Loader2,
  Newspaper,
  CalendarClock,
  Siren,
  Inbox,
  type LucideIcon,
} from "lucide-react";

// API notification `type` -> icon + display label. Keeps the drawer driven by
// real data instead of a hardcoded list, so the badge count and the drawer
// contents always agree (both read from /api/notifications).
const TYPE_ICON: Record<Notification["type"], LucideIcon> = {
  approval: Check,
  compliance: AlertTriangle,
  cap: ScrollText,
  ai: Sparkles,
  system: Megaphone,
  legal_update: Newspaper,
  deadline: CalendarClock,
  escalation: Siren,
  icis: Inbox,
};

const TYPE_LABEL: Record<Notification["type"], string> = {
  approval: "Approval",
  compliance: "Compliance",
  cap: "CAP",
  ai: "AI",
  system: "System",
  legal_update: "Legal update",
  deadline: "Deadline",
  escalation: "Escalation",
  icis: "ICIS",
};

// Category -> tinted icon chip. Mirrors the established pattern in
// TimelineEvent.tsx so colors stay correct in light + dark mode.
const CATEGORY_STYLES: Record<string, string> = {
  Approval: "bg-success-bg text-success",
  Compliance: "bg-danger-bg text-danger",
  AI: "bg-chip text-foreground",
  CAP: "bg-warning-bg text-warning",
  System: "bg-info-bg text-info",
  "Legal update": "bg-info-bg text-info",
  Deadline: "bg-warning-bg text-warning",
  Escalation: "bg-danger-bg text-danger",
  ICIS: "bg-chip text-foreground",
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
  const [filter, setFilter] = useState<NotificationFilter>("all");
  const [preview, setPreview] = useState<Notification | null>(null);
  const navigate = useNavigate();

  // Fetch a generous page so the drawer lists everything the mock generates.
  // The TopNav badge reads the same endpoint (filtered to unread) and shares
  // the notificationKeys.list() cache prefix, so mark-read mutations refresh
  // both the drawer list and the badge count.
  const { data, isLoading } = useNotifications(1, 50);
  const markReadMutation = useMarkNotificationRead();
  const markAllMutation = useMarkAllNotificationsRead();

  const notifications = data?.items ?? [];
  const unreadCount = notifications.filter((n) => !n.read).length;
  const visibleNotifications =
    filter === "unread" ? notifications.filter((n) => !n.read) : notifications;

  const markAllAsRead = () => markAllMutation.mutate();
  const markAsRead = (id: string) => markReadMutation.mutate(id);
  const openNotification = (n: Notification) => {
    if (!n.read) markAsRead(n.id);
    if (n.actionUrl && n.actionUrl !== "#") {
      onOpenChange(false);
      navigate(n.actionUrl);
    }
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
              Legal updates, deadlines, escalations, ICIS findings and approvals
              — also sent by email / Teams.
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
          {isLoading ? (
            <div className="flex items-center justify-center px-6 py-20 text-muted-foreground">
              <Loader2 className="size-5 animate-spin" />
            </div>
          ) : visibleNotifications.length === 0 ? (
            <EmptyState filter={filter} />
          ) : (
            <div className="flex flex-col gap-2 px-6 py-4">
              {visibleNotifications.map((notification, index) => {
                const Icon = TYPE_ICON[notification.type] ?? Bell;
                const category =
                  TYPE_LABEL[notification.type] ?? notification.type;
                return (
                  <motion.div
                    key={notification.id}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") openNotification(notification);
                    }}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.22,
                      delay: Math.min(index * 0.04, 0.24),
                      ease: "easeOut",
                    }}
                    onClick={() => openNotification(notification)}
                    className={cn(
                      "group flex w-full cursor-pointer items-start gap-3 rounded-xl border p-3.5 text-left transition-colors duration-200",
                      notification.read
                        ? "border-border/70 bg-card/40 hover:border-border hover:bg-muted/60"
                        : "border-primary/15 bg-primary/[0.05] hover:bg-primary/[0.09]",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-9 shrink-0 items-center justify-center rounded-lg",
                        CATEGORY_STYLES[category] ?? DEFAULT_CATEGORY_STYLE,
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
                        <span>
                          {formatDistance(
                            new Date(notification.createdAt),
                            demoNow(),
                            { addSuffix: true },
                          )}
                        </span>
                        <span aria-hidden="true" className="opacity-50">
                          &middot;
                        </span>
                        <span>{category}</span>
                        {notification.recipient && (
                          <>
                            <span aria-hidden="true" className="opacity-50">
                              &middot;
                            </span>
                            <span className="truncate">
                              To {notification.recipient}
                            </span>
                          </>
                        )}
                      </div>
                      {notification.channels?.some((c) => c !== "in_app") && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreview(notification);
                          }}
                          className="mt-1 text-[11px] font-medium text-primary underline-offset-2 hover:underline"
                        >
                          Preview{" "}
                          {notification.channels
                            .filter((c) => c !== "in_app")
                            .map((c) =>
                              c === "teams"
                                ? "Teams"
                                : c === "sms"
                                  ? "SMS"
                                  : "email",
                            )
                            .join(" / ")}{" "}
                          message
                        </button>
                      )}
                    </div>
                  </motion.div>
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
            disabled={unreadCount === 0 || markAllMutation.isPending}
          >
            <Check className="size-4" />
            Mark all as read
          </Button>
        </SheetFooter>
      </SheetContent>
      <ChannelPreview
        notification={preview}
        onOpenChange={(o) => !o && setPreview(null)}
      />
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
