import type { LucideIcon } from "lucide-react";
import { motion } from "motion/react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface SummaryCardData {
  title: string;
  value: string | number;
  /** Optional small sub-text under the value (e.g. "3 not assigned"). */
  hint?: string;
  icon?: LucideIcon;
  /** Tailwind classes for the icon circle tint, e.g. "bg-amber-500/10 text-amber-600". */
  iconClassName?: string;
  /** When true, the value uses the danger color (e.g. overdue / needs-attention). */
  emphasis?: boolean;
}

// Tinted icon-circle palette cycled by index so summary rows get varied accents.
const SUMMARY_TINTS = [
  "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  "bg-teal-500/10 text-teal-600 dark:text-teal-400",
];

export function SummaryCard({
  card,
  index = 0,
}: {
  card: SummaryCardData;
  index?: number;
}) {
  const Icon = card.icon;
  const tint =
    card.iconClassName ?? SUMMARY_TINTS[index % SUMMARY_TINTS.length];
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04 }}
      className="h-full"
    >
      <Card className="h-full gap-2 py-3">
        <CardContent className="flex items-center gap-3">
          {Icon && (
            <div
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-xl",
                tint,
              )}
            >
              <Icon className="size-4.5" aria-hidden="true" />
            </div>
          )}
          <div className="min-w-0">
            <p className="text-[11px] font-medium truncate text-muted-foreground">
              {card.title}
            </p>
            <p
              className={cn(
                "text-xl leading-tight font-bold tracking-tight",
                card.emphasis && "text-danger",
              )}
            >
              {card.value}
            </p>
            {card.hint && (
              <p className="text-[10.5px] text-muted-foreground truncate">
                {card.hint}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function SummaryCardBar({
  cards,
  className,
}: {
  cards: SummaryCardData[];
  className?: string;
}) {
  const visible = cards.filter((c) => c !== null && c !== undefined);
  if (visible.length === 0) return null;
  return (
    <div className={cn("grid gap-3 sm:grid-cols-2 lg:grid-cols-4", className)}>
      {visible.map((card, i) => (
        <SummaryCard key={card.title} card={card} index={i} />
      ))}
    </div>
  );
}
