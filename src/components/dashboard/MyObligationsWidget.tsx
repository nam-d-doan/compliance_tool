import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { format } from "date-fns";
import {
  AlertTriangle,
  CalendarClock,
  PlayCircle,
  CheckCircle2,
  ArrowRight,
  Plus,
  ChevronRight,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { StatusBadge, EmptyState } from "@/components/common";
import {
  classifyObligation,
  getObligationCap,
  buildObligationCapMap,
  type ObligationTab,
} from "@/lib/obligation-helpers";
import { cn } from "@/lib/utils";
import type { Obligation, CAP } from "@/types";
import { useL, useDateLocale, type Bi } from "@/lib/i18n";

interface MyObligationsWidgetProps {
  obligations: Obligation[];
  caps: CAP[];
}

const MAX_ROWS = 5;

const TABS: {
  id: ObligationTab;
  label: Bi;
  icon: typeof AlertTriangle;
  accent: string;
  emptyTitle: Bi;
  emptyDescription: Bi;
}[] = [
  {
    id: "need_attention",
    label: ["Need Attention", "Cần xử lý"],
    icon: AlertTriangle,
    accent:
      "data-[state=active]:bg-red-500/10 data-[state=active]:text-red-600 dark:data-[state=active]:text-red-400",
    emptyTitle: ["Nothing needs attention", "Không có việc cần xử lý"],
    emptyDescription: [
      "No overdue, critical, or review-required obligations. You're all caught up.",
      "Không có nghĩa vụ quá hạn, khẩn cấp hoặc cần rà soát.",
    ],
  },
  {
    id: "upcoming",
    label: ["Upcoming", "Sắp tới"],
    icon: CalendarClock,
    accent:
      "data-[state=active]:bg-orange-500/10 data-[state=active]:text-orange-600 dark:data-[state=active]:text-orange-400",
    emptyTitle: ["No upcoming deadlines", "Không có hạn sắp tới"],
    emptyDescription: ["Nothing is due in the next 7 days.", "Không có việc đến hạn trong 7 ngày tới."],
  },
  {
    id: "in_progress",
    label: ["In Progress", "Đang thực hiện"],
    icon: PlayCircle,
    accent:
      "data-[state=active]:bg-blue-500/10 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400",
    emptyTitle: ["Nothing in progress", "Chưa có việc đang thực hiện"],
    emptyDescription: [
      "Drafts and active obligations will appear here.",
      "Nghĩa vụ nháp và đang thực hiện sẽ hiện ở đây.",
    ],
  },
  {
    id: "completed",
    label: ["Completed", "Hoàn thành"],
    icon: CheckCircle2,
    accent:
      "data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400",
    emptyTitle: ["No completed obligations yet", "Chưa có nghĩa vụ hoàn thành"],
    emptyDescription: [
      "Finished obligations are tracked here for your record.",
      "Nghĩa vụ đã hoàn thành được lưu ở đây.",
    ],
  },
];

export function MyObligationsWidget({
  obligations,
  caps,
}: MyObligationsWidgetProps) {
  const navigate = useNavigate();
  const L = useL();
  const dateLocale = useDateLocale();
  const [activeTab, setActiveTab] = useState<ObligationTab>("need_attention");
  const capMap = useMemo(() => buildObligationCapMap(caps), [caps]);

  const buckets = useMemo(() => {
    const b: Record<ObligationTab, Obligation[]> = {
      need_attention: [],
      upcoming: [],
      in_progress: [],
      completed: [],
    };
    for (const obg of obligations) {
      b[classifyObligation(obg)].push(obg);
    }
    // Sort each bucket by due date ascending.
    (Object.keys(b) as ObligationTab[]).forEach((k) => {
      b[k].sort(
        (a, c) => new Date(a.dueDate).getTime() - new Date(c.dueDate).getTime(),
      );
    });
    return b;
  }, [obligations]);

  const items = buckets[activeTab];

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <div className="border-b border-border px-4 pt-4 pb-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold tracking-tight">
            {L("My Obligations", "Nghĩa vụ của tôi")}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={() => navigate("/obligations")}
          >
            {L("View All", "Xem tất cả")}
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Button>
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {L("Prioritised by urgency and risk across everything you own.", "Sắp theo mức khẩn và rủi ro trên toàn bộ nghĩa vụ bạn phụ trách.")}
        </p>
      </div>

      <div className="px-3 pt-3">
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as ObligationTab)}
          defaultValue="need_attention"
        >
          <TooltipProvider>
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
                        count > 0 && tab.id === "need_attention"
                          ? "bg-red-500/15 text-red-600 dark:text-red-400"
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
                          {items.slice(0, MAX_ROWS).map((obg) => {
                            const cap = getObligationCap(obg, capMap);
                            const capEligible =
                              obg.status === "submitted" ||
                              obg.status === "review_required";
                            const showCreateCap = capEligible && !cap;
                            return (
                              <button
                                key={obg.id}
                                type="button"
                                onClick={() =>
                                  navigate(`/obligations/${obg.id}`)
                                }
                                className="group flex w-full items-center gap-3 border-b border-border/50 py-2 text-left text-sm transition-colors last:border-b-0 hover:bg-muted/50"
                              >
                                <StatusBadge status={obg.status} size="sm" />
                                <span className="line-clamp-1 flex-1 font-medium text-foreground group-hover:text-primary">
                                  {obg.title}
                                </span>
                                <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                                  {format(new Date(obg.dueDate), "MMM d", { locale: dateLocale })}
                                </span>
                                {showCreateCap && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        size="icon-sm"
                                        variant="ghost"
                                        className="text-muted-foreground hover:text-primary"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          navigate(
                                            `/cap/create?obligations=${obg.id}`,
                                          );
                                        }}
                                        aria-label={L("Create CAP", "Tạo kế hoạch khắc phục")}
                                      >
                                        <Plus
                                          className="size-3.5"
                                          aria-hidden="true"
                                        />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="top">
                                      {L("Create CAP", "Tạo kế hoạch khắc phục")}
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                                <ChevronRight
                                  className="size-4 shrink-0 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5 group-hover:text-foreground"
                                  aria-hidden="true"
                                />
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </TabsContent>
            ))}
          </TooltipProvider>
        </Tabs>
      </div>
    </div>
  );
}
