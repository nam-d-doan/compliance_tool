import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import {
  ChevronRight,
  ChevronDown,
  BookOpen,
  ClipboardCheck,
  ShieldCheck,
  ClipboardList,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { MiniDonut, type MiniDonutSlice } from "@/components/charts";
import { cn } from "@/lib/utils";

export interface ChainStage {
  key: string;
  label: string;
  icon: typeof BookOpen;
  /** Fixed brand color for this stage — matches the login screen's chain motif. */
  color: string;
  /** Primary number shown large. */
  value: number;
  /** Status breakdown driving the mini donut + legend. */
  breakdown: MiniDonutSlice[];
  path: string;
}

export interface ComplianceChainSummaryProps {
  stages: ChainStage[];
}

/**
 * The dashboard's signature element: a vertical pipeline of the compliance
 * lifecycle (Regulation → Assignment → Obligation → CAP). Each stage is a
 * full-width row with its own donut + status legend, so the page reads as
 * one story moving top to bottom instead of a grid of disconnected tiles.
 */
export function ComplianceChainSummary({
  stages,
}: ComplianceChainSummaryProps) {
  const navigate = useNavigate();

  return (
    <Card className="gap-0 overflow-hidden p-0">
      {stages.map((stage, index) => {
        const Icon = stage.icon;
        const isLast = index === stages.length - 1;
        return (
          <motion.button
            key={stage.key}
            type="button"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.06 }}
            onClick={() => navigate(stage.path)}
            className={cn(
              "group relative flex h-28 w-full items-center gap-x-6 gap-y-4 p-7 text-left transition-colors hover:bg-muted/30",
              !isLast && "border-b border-border",
            )}
          >
            <span
              className="relative flex size-12 shrink-0 items-center justify-center rounded-xl"
              style={{
                background: `color-mix(in srgb, ${stage.color} 16%, transparent)`,
                color: stage.color,
              }}
            >
              <Icon className="size-5" aria-hidden="true" />

              {!isLast && (
                <>
                  {/* Connector line anchored to this icon's own bottom edge,
                      reaching down to the next stage's icon regardless of
                      row padding — its length is the row-height/icon-size
                      gap (112 - 48 = 64px), not a guessed offset. */}
                  <span
                    className="absolute top-full left-1/2 z-10 h-16 w-[3px] -translate-x-1/2 rounded-full"
                    style={{
                      background: `linear-gradient(180deg, ${stage.color}, ${stages[index + 1].color})`,
                    }}
                    aria-hidden="true"
                  />
                  {/* Arrowhead marking the flow direction, at the midpoint
                      of the connector (the boundary between stages). */}
                  <span
                    className="bg-card absolute left-1/2 z-10 flex size-[18px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full"
                    style={{ top: "calc(100% + 2rem)" }}
                    aria-hidden="true"
                  >
                    <ChevronDown
                      className="size-3.5"
                      style={{ color: stages[index + 1].color }}
                      aria-hidden="true"
                    />
                  </span>
                </>
              )}
            </span>

            <div className="w-32 shrink-0">
              <p className="text-[11px] font-bold tracking-wide text-muted-foreground uppercase">
                {stage.label}
              </p>
              <p className="mt-0.5 text-2xl font-bold tracking-tight">
                {stage.value}
              </p>
            </div>

            <div className="flex min-w-0 flex-1 items-center gap-4">
              <MiniDonut data={stage.breakdown} size={68} />
              <ul className="flex min-w-0 flex-1 flex-wrap gap-x-4 gap-y-1.5">
                {stage.breakdown.map((slice) => (
                  <li
                    key={slice.label}
                    className="flex items-center gap-1.5 text-xs whitespace-nowrap text-muted-foreground"
                  >
                    <span
                      className="size-1.5 shrink-0 rounded-full"
                      style={{ background: slice.color }}
                      aria-hidden="true"
                    />
                    {slice.value} {slice.label}
                  </li>
                ))}
              </ul>
            </div>

            <ChevronRight
              className="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
              aria-hidden="true"
            />
          </motion.button>
        );
      })}
    </Card>
  );
}

export const CHAIN_ICONS = {
  regulation: BookOpen,
  assignment: ClipboardList,
  obligation: ShieldCheck,
  cap: ClipboardCheck,
};

/** Fixed brand colors for the chain stages — consistent with the login screen. */
export const CHAIN_COLORS = {
  regulation: "#4fa98a",
  assignment: "#6e7bff",
  obligation: "#c9a400",
  cap: "#ff6a52",
};
