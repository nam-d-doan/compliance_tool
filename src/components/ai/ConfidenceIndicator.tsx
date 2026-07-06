import { HelpCircle } from "lucide-react";
import { motion } from "motion/react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export type ConfidenceSize = "sm" | "md" | "lg";

export interface ConfidenceIndicatorProps {
  confidence: number;
  size?: ConfidenceSize;
  showLabel?: boolean;
  className?: string;
}

const sizeClasses: Record<ConfidenceSize, { bar: string; text: string }> = {
  sm: { bar: "h-1.5 w-16", text: "text-xs" },
  md: { bar: "h-2 w-24", text: "text-sm" },
  lg: { bar: "h-2.5 w-32", text: "text-base" },
};

export function ConfidenceIndicator({
  confidence,
  size = "md",
  showLabel = true,
  className,
}: ConfidenceIndicatorProps) {
  const clamped = Math.max(0, Math.min(1, confidence));
  const percent = Math.round(clamped * 100);

  const color =
    clamped < 0.6
      ? "bg-red-500 dark:bg-red-400"
      : clamped <= 0.8
        ? "bg-amber-500 dark:bg-amber-400"
        : "bg-emerald-500 dark:bg-emerald-400";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn("inline-flex items-center gap-2", className)}
          role="meter"
          aria-label={`AI confidence ${percent}%`}
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className={cn(
              "relative overflow-hidden rounded-full bg-muted",
              sizeClasses[size].bar,
            )}
          >
            <motion.div
              className={cn("absolute top-0 left-0 h-full rounded-full", color)}
              initial={{ width: 0 }}
              animate={{ width: `${percent}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
          {showLabel && (
            <span
              className={cn("font-medium tabular-nums", sizeClasses[size].text)}
            >
              {percent}%
            </span>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="flex max-w-xs items-center gap-1.5">
        <HelpCircle className="size-3.5 shrink-0" aria-hidden="true" />
        <span>
          AI confidence reflects how certain the model is about this insight.
        </span>
      </TooltipContent>
    </Tooltip>
  );
}
