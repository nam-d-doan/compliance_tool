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
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  Check,
  FileCheck,
  AlertTriangle,
  CalendarClock,
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
    icon: FileCheck,
    title: "Evidence approval requested",
    description: "AML-2024-003 evidence pack is pending your review.",
    timestamp: "10 min ago",
    read: false,
    category: "Approvals",
  },
  {
    id: "2",
    icon: AlertTriangle,
    title: "Overdue compliance filing",
    description: "GDPR Article 30 registration is 3 days overdue.",
    timestamp: "1 hr ago",
    read: false,
    category: "Compliance",
  },
  {
    id: "3",
    icon: CalendarClock,
    title: "License expires soon",
    description: "New York MTL license expires in 14 days.",
    timestamp: "3 hr ago",
    read: true,
    category: "Licenses",
  },
  {
    id: "4",
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

  const unreadCount = notifications.filter((n) => !n.read).length;

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
        <SheetHeader className="space-y-1">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2 text-lg font-semibold">
              <Bell className="size-5" />
              Notifications
            </SheetTitle>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="h-6 px-2 text-xs">
                {unreadCount} unread
              </Badge>
            )}
          </div>
          <SheetDescription>
            Stay updated on approvals, deadlines, and AI insights.
          </SheetDescription>
        </SheetHeader>

        <Separator className="my-2" />

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="flex flex-col gap-3 pb-4">
            {notifications.map((notification) => {
              const Icon = notification.icon;
              return (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => markAsRead(notification.id)}
                  className={`flex gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted/50 ${
                    notification.read
                      ? "border-border bg-background opacity-70"
                      : "border-primary/20 bg-primary/5"
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    <Icon className="size-5 text-primary" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium leading-none">
                        {notification.title}
                      </p>
                      {!notification.read && (
                        <span className="mt-0.5 size-2 rounded-full bg-primary" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {notification.description}
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-[10px] text-muted-foreground">
                        {notification.timestamp}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        •
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {notification.category}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </ScrollArea>

        <SheetFooter className="mt-auto flex-col gap-2 sm:flex-col">
          <Button
            variant="outline"
            className="w-full"
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
          >
            <Check className="mr-2 size-4" />
            Mark all as read
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
