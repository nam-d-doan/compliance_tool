import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { format } from "date-fns";
import {
  AlertTriangle,
  CalendarClock,
  PlayCircle,
  CheckCircle2,
  ClipboardCheck,
  ArrowRight,
  Plus,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { StatusBadge, PriorityBadge, EmptyState } from "@/components/common";
import {
  classifyObligation,
  dueDateLabel,
  dueDateTone,
  getObligationCap,
  buildObligationCapMap,
  type ObligationTab,
} from "@/lib/obligation-helpers";
import { cn } from "@/lib/utils";
import type { Obligation, CAP } from "@/types";

interface MyObligationsWidgetProps {
  obligations: Obligation[];
  caps: CAP[];
}

const TABS: {
  id: ObligationTab;
  label: string;
  icon: typeof AlertTriangle;
  accent: string;
  emptyTitle: string;
  emptyDescription: string;
}[] = [
  {
    id: "need_attention",
    label: "Need Attention",
    icon: AlertTriangle,
    accent:
      "data-[state=active]:bg-red-500/10 data-[state=active]:text-red-600 dark:data-[state=active]:text-red-400",
    emptyTitle: "Nothing needs attention",
    emptyDescription:
      "No overdue, critical, or review-required obligations. You're all caught up.",
  },
  {
    id: "upcoming",
    label: "Upcoming",
    icon: CalendarClock,
    accent:
      "data-[state=active]:bg-orange-500/10 data-[state=active]:text-orange-600 dark:data-[state=active]:text-orange-400",
    emptyTitle: "No upcoming deadlines",
    emptyDescription: "Nothing is due in the next 7 days.",
  },
  {
    id: "in_progress",
    label: "In Progress",
    icon: PlayCircle,
    accent:
      "data-[state=active]:bg-blue-500/10 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400",
    emptyTitle: "Nothing in progress",
    emptyDescription: "Drafts and active obligations will appear here.",
  },
  {
    id: "completed",
    label: "Completed",
    icon: CheckCircle2,
    accent:
      "data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400",
    emptyTitle: "No completed obligations yet",
    emptyDescription: "Finished obligations are tracked here for your record.",
  },
];

export function MyObligationsWidget({
  obligations,
  caps,
}: MyObligationsWidgetProps) {
  const navigate = useNavigate();
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
            My Obligations
          </h2>
          <Button
            variant="ghost"
            size="xs"
            className="text-muted-foreground"
            onClick={() => navigate("/obligations")}
          >
            View all
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Button>
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Prioritised by urgency and risk across everything you own.
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
                    <span>{tab.label}</span>
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
                          title={tab.emptyTitle}
                          description={tab.emptyDescription}
                          className="border-0 bg-transparent py-10"
                        />
                      ) : (
                        <div className="grid gap-3 pb-4 sm:grid-cols-2">
                          {items.map((obg, idx) => (
                            <ObligationCard
                              key={obg.id}
                              obligation={obg}
                              cap={getObligationCap(obg, capMap)}
                              index={idx}
                              onOpen={() => navigate(`/obligations/${obg.id}`)}
                              onCreateCap={(ids) =>
                                navigate(
                                  `/cap/create?obligations=${ids.join(",")}`,
                                )
                              }
                              onGoToCap={(capId) => navigate(`/cap/${capId}`)}
                            />
                          ))}
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

interface ObligationCardProps {
  obligation: Obligation;
  cap?: CAP;
  index: number;
  onOpen: () => void;
  onCreateCap: (obligationIds: string[]) => void;
  onGoToCap: (capId: string) => void;
}

function ObligationCard({
  obligation,
  cap,
  index,
  onOpen,
  onCreateCap,
  onGoToCap,
}: ObligationCardProps) {
  // CAP action is offered for submitted / review_required obligations (per spec),
  // surfaced for any obligation that already has a linked CAP.
  const capEligible =
    obligation.status === "submitted" ||
    obligation.status === "review_required";
  const showCapAction = capEligible || Boolean(cap);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(index * 0.04, 0.3) }}
      className="group relative flex flex-col rounded-lg border border-border bg-background p-3.5 transition-all hover:border-primary/30 hover:shadow-sm"
    >
      <button
        type="button"
        onClick={onOpen}
        className="flex flex-1 flex-col text-left"
      >
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="shrink-0 border-border bg-muted/50 font-mono text-[11px] font-medium text-muted-foreground"
          >
            {obligation.articleRef}
          </Badge>
          <StatusBadge status={obligation.status} size="sm" />
          {obligation.riskLevel === "critical" && (
            <PriorityBadge priority="critical" size="sm" />
          )}
        </div>

        <h3 className="mt-2 line-clamp-2 text-sm font-medium leading-snug text-foreground group-hover:text-primary">
          {obligation.title}
        </h3>

        <div className="mt-auto flex flex-wrap items-center gap-2 pt-3">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium",
              dueDateTone(obligation),
            )}
          >
            <CalendarClock className="size-3" aria-hidden="true" />
            {dueDateLabel(obligation)}
          </span>
          <span className="text-[11px] text-muted-foreground">
            {format(new Date(obligation.dueDate), "MMM d, yyyy")}
          </span>
        </div>
      </button>

      {showCapAction && (
        <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
          {cap ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="xs"
                  className="gap-1.5"
                  onClick={() => onGoToCap(cap.id)}
                >
                  <ClipboardCheck className="size-3.5" aria-hidden="true" />
                  Go to CAP
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">{cap.capId}</TooltipContent>
            </Tooltip>
          ) : (
            <Button
              variant="default"
              size="xs"
              className="gap-1.5"
              onClick={() => onCreateCap([obligation.id])}
            >
              <Plus className="size-3.5" aria-hidden="true" />
              Create CAP
            </Button>
          )}
          <Button
            variant="ghost"
            size="xs"
            className="ml-auto text-muted-foreground"
            onClick={onOpen}
          >
            Details
            <ArrowRight className="size-3" aria-hidden="true" />
          </Button>
        </div>
      )}
    </motion.div>
  );
}
