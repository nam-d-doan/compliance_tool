import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { PlayCircle, Hourglass, CheckCircle2, ArrowRight } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  StatusBadge,
  PriorityBadge,
  EmptyState,
  DueDateCell,
} from "@/components/common";
import { cn } from "@/lib/utils";
import type { CAP } from "@/types";

type CapTab = "open" | "pending_approval" | "closed";

const TABS: {
  id: CapTab;
  label: string;
  match: CAP["status"];
  icon: typeof PlayCircle;
  accent: string;
  emptyTitle: string;
  emptyDescription: string;
}[] = [
  {
    id: "open",
    label: "Open",
    match: "Open",
    icon: PlayCircle,
    accent:
      "data-[state=active]:bg-blue-500/10 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400",
    emptyTitle: "No open action plans",
    emptyDescription:
      "Action plans you're working on will appear here. Create one from an obligation.",
  },
  {
    id: "pending_approval",
    label: "Pending Approval",
    match: "Pending Approval",
    icon: Hourglass,
    accent:
      "data-[state=active]:bg-violet-500/10 data-[state=active]:text-violet-600 dark:data-[state=active]:text-violet-400",
    emptyTitle: "Nothing awaiting approval",
    emptyDescription:
      "Submitted action plans pending compliance review show here.",
  },
  {
    id: "closed",
    label: "Closed",
    match: "Closed",
    icon: CheckCircle2,
    accent:
      "data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400",
    emptyTitle: "No closed plans yet",
    emptyDescription: "Completed and approved action plans are tracked here.",
  },
];

interface MyCAPsWidgetProps {
  caps: CAP[];
}

export function MyCAPsWidget({ caps }: MyCAPsWidgetProps) {
  const navigate = useNavigate();
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
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <div className="border-b border-border px-4 pt-4 pb-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold tracking-tight">My CAPs</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Your corrective action plans across the remediation lifecycle.
            </p>
          </div>
          <Button
            variant="ghost"
            size="xs"
            className="text-muted-foreground"
            onClick={() => navigate("/cap")}
          >
            View all
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
                  <span>{tab.label}</span>
                  <span
                    className={cn(
                      "ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold",
                      count > 0 && tab.id === "open"
                        ? "bg-blue-500/15 text-blue-600 dark:text-blue-400"
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
                        {items.map((cap, idx) => (
                          <CAPCard
                            key={cap.id}
                            cap={cap}
                            index={idx}
                            onOpen={() => navigate(`/cap/${cap.id}`)}
                          />
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

interface CAPCardProps {
  cap: CAP;
  index: number;
  onOpen: () => void;
}

function CAPCard({ cap, index, onOpen }: CAPCardProps) {
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
            {cap.capId}
          </Badge>
          <StatusBadge status={cap.status} size="sm" />
          <PriorityBadge priority={cap.priority} size="sm" />
        </div>

        <h3 className="mt-2 line-clamp-2 text-sm font-medium leading-snug text-foreground group-hover:text-primary">
          {cap.title}
        </h3>

        {cap.obligationIds.length > 0 && (
          <p className="mt-1 text-[11px] text-muted-foreground">
            {cap.obligationIds.length} linked{" "}
            {cap.obligationIds.length === 1 ? "obligation" : "obligations"}
          </p>
        )}

        <div className="mt-auto flex flex-wrap items-center gap-2 pt-3">
          <DueDateCell
            dueDate={cap.dueDate}
            completed={cap.status === "Closed"}
          />
        </div>

        {cap.status !== "Closed" && (
          <div className="mt-2">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Progress</span>
              <span className="font-medium tabular-nums">{cap.progress}%</span>
            </div>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${cap.progress}%` }}
              />
            </div>
          </div>
        )}
      </button>

      <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
        <Button
          variant="ghost"
          size="xs"
          className="ml-auto text-muted-foreground"
          onClick={onOpen}
        >
          Open
          <ArrowRight className="size-3" aria-hidden="true" />
        </Button>
      </div>
    </motion.div>
  );
}
