import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { format, differenceInDays } from "date-fns";
import {
  AlertTriangle,
  ClipboardCheck,
  Plus,
  ArrowRight,
  Users,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { NeedsCapItem } from "@/lib/obligation-helpers";
import { cn } from "@/lib/utils";

const MAX_VISIBLE = 5;

interface NeedsCAPAlertsProps {
  items: NeedsCapItem[];
  ownerId?: string;
}

export function NeedsCAPAlerts({ items, ownerId }: NeedsCAPAlertsProps) {
  const navigate = useNavigate();
  if (items.length === 0) return null;

  const visible = items.slice(0, MAX_VISIBLE);
  const overflow = items.length - visible.length;
  const overflowHref = ownerId
    ? `/obligations?filter=needs-cap&owner=${encodeURIComponent(ownerId)}`
    : "/obligations?filter=needs-cap";

  return (
    <TooltipProvider>
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="rounded-xl border border-red-500/20 bg-gradient-to-br from-red-500/[0.06] via-orange-500/[0.03] to-card shadow-sm"
      >
        <div className="flex items-center justify-between gap-3 border-b border-red-500/15 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-red-500/15 text-red-600 dark:text-red-400">
              <AlertTriangle className="size-4" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-sm font-semibold tracking-tight text-foreground">
                Needs CAP
              </h2>
              <p className="text-xs text-muted-foreground">
                {items.length} {items.length === 1 ? "item" : "items"} need a
                corrective action plan
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="xs"
            className="text-muted-foreground"
            onClick={() => navigate(overflowHref)}
          >
            Manage all
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Button>
        </div>

        <ul className="divide-y divide-border/60">
          <AnimatePresence initial={false}>
            {visible.map((item, idx) => (
              <NeedsCAPRow
                key={item.key}
                item={item}
                index={idx}
                onCreateCap={() =>
                  navigate(
                    `/cap/create?obligations=${item.obligations
                      .map((o) => o.id)
                      .join(",")}`,
                  )
                }
                onGoToCap={(capId) => navigate(`/cap/${capId}`)}
              />
            ))}
          </AnimatePresence>
        </ul>

        {overflow > 0 && (
          <div className="px-4 py-2.5">
            <Button
              variant="ghost"
              size="xs"
              className="w-full justify-center text-muted-foreground"
              onClick={() => navigate(overflowHref)}
            >
              View {overflow} more in Obligations
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </Button>
          </div>
        )}
      </motion.section>
    </TooltipProvider>
  );
}

interface NeedsCAPRowProps {
  item: NeedsCapItem;
  index: number;
  onCreateCap: () => void;
  onGoToCap: (capId: string) => void;
}

function NeedsCAPRow({
  item,
  index,
  onCreateCap,
  onGoToCap,
}: NeedsCAPRowProps) {
  const dueDate = item.nearestDueDate ? new Date(item.nearestDueDate) : null;
  const daysLeft = dueDate ? differenceInDays(dueDate, new Date()) : null;
  const isOverdue = daysLeft !== null && daysLeft < 0;
  const obgCount = item.obligations.length;

  // Article refs: show up to 3, collapse the rest behind a tooltip.
  const visibleRefs = item.articleRefs.slice(0, 3);
  const hiddenRefs = item.articleRefs.slice(3);

  return (
    <motion.li
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, delay: Math.min(index * 0.05, 0.3) }}
      className="flex flex-col gap-3 px-4 py-3 transition-colors hover:bg-muted/30 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate text-sm font-medium text-foreground">
            {item.title}
          </h3>
          {item.cap && (
            <Badge
              variant="outline"
              className="shrink-0 font-mono text-[10px] text-muted-foreground"
            >
              {item.cap.capId}
            </Badge>
          )}
        </div>

        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
          {/* Obligation count with tooltip preview */}
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex cursor-help items-center gap-1">
                <FileText className="size-3" aria-hidden="true" />
                {obgCount} {obgCount === 1 ? "obligation" : "obligations"}
              </span>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              className="max-w-xs whitespace-normal text-left"
            >
              <span className="block font-semibold">
                Linked obligations ({obgCount})
              </span>
              <span className="block opacity-90">
                {item.obligations
                  .map((o) => `${o.articleRef} — ${o.title}`)
                  .join("\n")}
              </span>
            </TooltipContent>
          </Tooltip>

          {/* Article refs (truncated) */}
          <span className="inline-flex items-center gap-1">
            <span className="font-mono">
              {visibleRefs.join(", ")}
              {hiddenRefs.length > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="ml-1 cursor-help rounded bg-muted px-1 font-sans">
                      +{hiddenRefs.length}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    {hiddenRefs.join(", ")}
                  </TooltipContent>
                </Tooltip>
              )}
            </span>
          </span>

          {/* Owner names */}
          {item.ownerNames.length > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex cursor-help items-center gap-1">
                  <Users className="size-3" aria-hidden="true" />
                  {item.ownerNames[0]}
                  {item.ownerNames.length > 1 && (
                    <span className="text-muted-foreground/70">
                      +{item.ownerNames.length - 1}
                    </span>
                  )}
                </span>
              </TooltipTrigger>
              <TooltipContent side="top">
                {item.ownerNames.join(", ")}
              </TooltipContent>
            </Tooltip>
          )}

          {/* Due preview */}
          {dueDate && (
            <span
              className={cn(
                "inline-flex items-center gap-1 font-medium",
                isOverdue
                  ? "text-red-600 dark:text-red-400"
                  : daysLeft !== null && daysLeft <= 7
                    ? "text-orange-600 dark:text-orange-400"
                    : "text-emerald-600 dark:text-emerald-400",
              )}
            >
              {isOverdue
                ? `Overdue ${Math.abs(daysLeft!)}d`
                : daysLeft === 0
                  ? "Due today"
                  : `Due ${format(dueDate, "MMM d")}`}
            </span>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {item.hasCap && item.cap ? (
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => onGoToCap(item.cap!.id)}
          >
            <ClipboardCheck className="size-3.5" aria-hidden="true" />
            Go to CAP
          </Button>
        ) : (
          <Button
            variant="default"
            size="sm"
            className="gap-1.5"
            onClick={onCreateCap}
          >
            <Plus className="size-3.5" aria-hidden="true" />
            Create CAP
          </Button>
        )}
      </div>
    </motion.li>
  );
}
