import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { format } from "date-fns";
import {
  PlayCircle,
  Hourglass,
  CheckCircle2,
  ArrowRight,
  ChevronRight,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { StatusBadge, EmptyState } from "@/components/common";
import { cn } from "@/lib/utils";
import type { CAP } from "@/types";
import { useL, useDateLocale, type Bi } from "@/lib/i18n";

type CapTab = "open" | "pending_approval" | "closed";

const MAX_ROWS = 5;

const TABS: {
  id: CapTab;
  label: Bi;
  match: CAP["status"];
  icon: typeof PlayCircle;
  accent: string;
  emptyTitle: Bi;
  emptyDescription: Bi;
}[] = [
  {
    id: "open",
    label: ["Open", "Đang mở"],
    match: "Open",
    icon: PlayCircle,
    accent: "data-[state=active]:bg-info-bg data-[state=active]:text-info",
    emptyTitle: ["No open action plans", "Chưa có kế hoạch đang mở"],
    emptyDescription: [
      "Action plans you're working on will appear here. Create one from an obligation.",
      "Kế hoạch bạn đang thực hiện sẽ hiện ở đây. Tạo kế hoạch từ một nghĩa vụ.",
    ],
  },
  {
    id: "pending_approval",
    label: ["Pending Approval", "Chờ phê duyệt"],
    match: "Pending Approval",
    icon: Hourglass,
    accent:
      "data-[state=active]:bg-warning-bg data-[state=active]:text-warning",
    emptyTitle: ["Nothing awaiting approval", "Không có mục chờ duyệt"],
    emptyDescription: [
      "Submitted action plans pending compliance review show here.",
      "Kế hoạch đã nộp chờ bộ phận tuân thủ rà soát sẽ hiện ở đây.",
    ],
  },
  {
    id: "closed",
    label: ["Closed", "Đã đóng"],
    icon: CheckCircle2,
    match: "Closed",
    accent:
      "data-[state=active]:bg-success-bg data-[state=active]:text-success",
    emptyTitle: ["No closed plans yet", "Chưa có kế hoạch đã đóng"],
    emptyDescription: [
      "Completed and approved action plans are tracked here.",
      "Kế hoạch đã hoàn thành và được duyệt được lưu ở đây.",
    ],
  },
];

interface MyCAPsWidgetProps {
  caps: CAP[];
}

export function MyCAPsWidget({ caps }: MyCAPsWidgetProps) {
  const navigate = useNavigate();
  const L = useL();
  const dateLocale = useDateLocale();
  const [activeTab, setActiveTab] = useState<CapTab>("open");

  const buckets = useMemo(() => {
    const b: Record<CapTab, CAP[]> = {
      open: [],
      pending_approval: [],
      closed: [],
    };
    for (const cap of caps) {
      if (cap.status === "Open") b.open.push(cap);
      else if (cap.status === "Pending Approval") b.pending_approval.push(cap);
      else if (cap.status === "Closed") b.closed.push(cap);
    }
    // Sort each bucket by due date ascending (closed by updatedAt desc).
    b.open.sort(
      (a, c) => new Date(a.dueDate).getTime() - new Date(c.dueDate).getTime(),
    );
    b.pending_approval.sort(
      (a, c) => new Date(a.dueDate).getTime() - new Date(c.dueDate).getTime(),
    );
    b.closed.sort(
      (a, c) =>
        new Date(c.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
    return b;
  }, [caps]);

  const items = buckets[activeTab];

  return (
    <div className="rounded-[20px] border bg-card shadow-[var(--card-shadow)] backdrop-blur-xl [border-color:var(--card-border)]">
      <div className="border-b border-border px-4 pt-4 pb-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold tracking-tight">
              {L("My CAPs", "Kế hoạch khắc phục của tôi")}
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {L("Your corrective action plans across the remediation lifecycle.", "Các kế hoạch khắc phục của bạn qua từng giai đoạn.")}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={() => navigate("/cap/list")}
          >
            {L("View All", "Xem tất cả")}
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Button>
        </div>
      </div>

      <div className="px-3 pt-3">
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as CapTab)}
          defaultValue="open"
        >
          <TabsList className="h-auto w-full flex-wrap justify-start gap-1 bg-transparent p-0">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const count = buckets[tab.id].length;
              const isActive = activeTab === tab.id;
              return (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className={cn(
                    "h-9 gap-1.5 rounded-lg px-3 data-[state=inactive]:bg-muted/50 data-[state=inactive]:text-muted-foreground",
                    tab.accent,
                  )}
                >
                  <Icon className="size-3.5" aria-hidden="true" />
                  <span>{L(...tab.label)}</span>
                  <span
                    className={cn(
                      "ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold",
                      count > 0 && tab.id === "open"
                        ? "bg-info-bg text-info"
                        : isActive
                          ? "bg-foreground/10"
                          : "bg-muted text-muted-foreground",
                    )}
                  >
                    {count}
                  </span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {TABS.map((tab) => (
            <TabsContent key={tab.id} value={tab.id} className="mt-3">
              <AnimatePresence mode="wait">
                {activeTab === tab.id && (
                  <motion.div
                    key={tab.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2 }}
                  >
                    {items.length === 0 ? (
                      <EmptyState
                        title={L(...tab.emptyTitle)}
                        description={L(...tab.emptyDescription)}
                        className="border-0 bg-transparent py-10"
                      />
                    ) : (
                      <div className="flex flex-col">
                        {items.slice(0, MAX_ROWS).map((cap) => (
                          <button
                            key={cap.id}
                            type="button"
                            onClick={() => navigate(`/cap/${cap.id}`)}
                            className="group flex w-full items-center gap-3 border-b border-border/50 py-2 text-left text-sm transition-colors last:border-b-0 hover:bg-muted/50"
                          >
                            <StatusBadge status={cap.status} size="sm" />
                            <span className="line-clamp-1 flex-1 font-medium text-foreground group-hover:text-primary">
                              {cap.title}
                            </span>
                            <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                              {format(new Date(cap.dueDate), "MMM d", { locale: dateLocale })}
                            </span>
                            <span className="w-10 shrink-0 text-right text-xs text-muted-foreground tabular-nums">
                              {cap.progress}%
                            </span>
                            <ChevronRight
                              className="size-4 shrink-0 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5 group-hover:text-foreground"
                              aria-hidden="true"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
