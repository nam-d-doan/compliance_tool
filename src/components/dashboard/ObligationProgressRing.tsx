import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import type { ObligationRing } from "@/lib/obligation-helpers";

interface ObligationProgressRingProps {
  ring: ObligationRing;
  /** Diameter in px. */
  size?: number;
  className?: string;
}

/**
 * Circular progress ring showing completed/total obligations as a percentage.
 * Uses an animated SVG stroke-dashoffset; ring is yellow per the Phase 6 spec.
 */
export function ObligationProgressRing({
  ring,
  size = 140,
  className,
}: ObligationProgressRingProps) {
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, ring.percent));
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div
      className={cn("flex flex-col items-center justify-center", className)}
      role="img"
      aria-label={`${ring.percent}% complete — ${ring.completed} of ${ring.total} obligations`}
    >
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="-rotate-90"
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            className="stroke-muted"
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            className="stroke-amber-400"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold tracking-tight text-foreground">
            {ring.percent}%
          </span>
          <span className="text-[11px] font-medium text-muted-foreground">
            {ring.completed}/{ring.total}
          </span>
        </div>
      </div>
      <p className="mt-2 text-xs font-medium text-muted-foreground">
        Obligations completed
      </p>
    </div>
  );
}
