import { Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { Textarea } from "@/components/ui/textarea";
import { PriorityBadge } from "@/components/common/PriorityBadge";
import { cn } from "@/lib/utils";
import {
  RISK_LEVEL_VI,
  computeWeightedScore,
  criterionContributions,
  levelForScore,
} from "@/lib/cms-rules";
import { PRIORITY_LEVELS } from "@/constants/status";
import type {
  RiskCriterionKey,
  RiskLevel,
  RiskMatrix,
  RiskScores,
} from "@/types";

export interface RiskRatingValue {
  scores: RiskScores;
  overrideLevel?: RiskLevel;
  overrideReason?: string;
}

const LEVEL_BAR: Record<RiskLevel, string> = {
  low: "bg-success",
  medium: "bg-warning",
  high: "bg-danger",
};

/**
 * Risk Rating Matrix explainer + editor (RFQ 4.2). Shows the suggested level
 * from the active matrix with each criterion's contribution, and lets the
 * user adjust scores or override the level with a mandatory reason.
 */
export function RiskRatingPanel({
  matrix,
  value,
  onChange,
  readOnly,
  hints,
}: {
  matrix: RiskMatrix;
  value: RiskRatingValue;
  onChange?: (v: RiskRatingValue) => void;
  readOnly?: boolean;
  /** Per-criterion notes on where an input came from (e.g. "3rd time in 12 months"). */
  hints?: Partial<Record<RiskCriterionKey, string>>;
}) {
  const score = computeWeightedScore(value.scores, matrix);
  const suggested = levelForScore(score, matrix.thresholds);
  const contributions = criterionContributions(value.scores, matrix);
  const finalLevel = value.overrideLevel ?? suggested;
  const maxContribution = Math.max(
    ...contributions.map((c) => c.contribution),
    0.01,
  );

  const setScore = (key: RiskCriterionKey, s: number) =>
    onChange?.({ ...value, scores: { ...value.scores, [key]: s } });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 rounded-xl bg-gradient-to-br from-[#102f57] to-[#1c5894] p-4 text-white">
        <div>
          <p className="text-[11px] tracking-wide text-white/70 uppercase">
            Weighted score
          </p>
          <p className="text-3xl font-black tabular-nums">{score.toFixed(2)}</p>
        </div>
        <div className="h-10 w-px bg-white/20" aria-hidden="true" />
        <div>
          <p className="text-[11px] tracking-wide text-white/70 uppercase">
            Suggested level
          </p>
          <p className="text-lg font-bold">
            {suggested.charAt(0).toUpperCase() + suggested.slice(1)} ·{" "}
            {RISK_LEVEL_VI[suggested]}
          </p>
        </div>
        <div className="ml-auto text-right text-[11px] text-white/70">
          Matrix v{matrix.version}
          <br />
          Medium ≥ {matrix.thresholds.medium} · High ≥ {matrix.thresholds.high}
        </div>
        <div className="relative mt-1 h-2 w-full overflow-hidden rounded-full bg-white/15">
          <span
            className="absolute inset-y-0 left-0 rounded-full bg-white/80"
            style={{ width: `${((score - 1) / 4) * 100}%` }}
          />
          <span
            className="absolute inset-y-0 w-0.5 bg-amber-300"
            style={{ left: `${((matrix.thresholds.medium - 1) / 4) * 100}%` }}
          />
          <span
            className="absolute inset-y-0 w-0.5 bg-red-400"
            style={{ left: `${((matrix.thresholds.high - 1) / 4) * 100}%` }}
          />
        </div>
      </div>

      <div className="space-y-3">
        {contributions.map((c, idx) => {
          const criterion = matrix.criteria.find((x) => x.key === c.key)!;
          return (
            <div
              key={c.key}
              className="rounded-lg border border-border bg-card p-3"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="flex size-6 items-center justify-center rounded-full bg-orange-500/15 text-xs font-bold text-orange-600">
                  {idx + 1}
                </span>
                <span className="text-sm font-semibold">{c.label}</span>
                <span className="text-xs text-muted-foreground">
                  {c.labelVi} · weight {c.weight}%
                </span>
                <span className="ml-auto text-xs font-medium tabular-nums">
                  {c.score}/5 → +{c.contribution.toFixed(2)}
                </span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: `${(c.contribution / maxContribution) * 100}%`,
                  }}
                  className="h-full rounded-full bg-gradient-to-r from-orange-400 to-red-500"
                />
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {criterion.scale.map((step) => (
                  <button
                    key={step.score}
                    type="button"
                    disabled={readOnly}
                    title={step.description}
                    onClick={() => setScore(c.key, step.score)}
                    className={cn(
                      "rounded-md border px-2 py-1 text-[11px] transition-colors",
                      step.score === c.score
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-muted/40 text-muted-foreground",
                      !readOnly && step.score !== c.score && "hover:bg-muted",
                      readOnly && "cursor-default",
                    )}
                  >
                    {step.score} · {step.label}
                  </button>
                ))}
              </div>
              {hints?.[c.key] && (
                <p className="mt-1.5 flex items-center gap-1 text-[11px] text-violet-600 dark:text-violet-300">
                  <Sparkles className="size-3" aria-hidden="true" />
                  {hints[c.key]}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="rounded-lg border border-border bg-muted/30 p-3">
        <p className="mb-2 text-xs font-semibold text-muted-foreground">
          Final level
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {PRIORITY_LEVELS.map((lvl) => {
            const isSuggested = lvl === suggested;
            const active = lvl === finalLevel;
            return (
              <button
                key={lvl}
                type="button"
                disabled={readOnly}
                onClick={() =>
                  onChange?.({
                    ...value,
                    overrideLevel: isSuggested ? undefined : lvl,
                    overrideReason: isSuggested
                      ? undefined
                      : value.overrideReason,
                  })
                }
                className={cn(
                  "flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-colors",
                  active
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-border",
                  readOnly && "cursor-default",
                )}
              >
                <span className={cn("size-2 rounded-full", LEVEL_BAR[lvl])} />
                {lvl.charAt(0).toUpperCase() + lvl.slice(1)}
                {isSuggested && (
                  <span className="text-[10px] text-muted-foreground">
                    suggested
                  </span>
                )}
              </button>
            );
          })}
          <span className="ml-auto">
            <PriorityBadge priority={finalLevel} />
          </span>
        </div>
        {value.overrideLevel && value.overrideLevel !== suggested && (
          <div className="mt-3 space-y-1">
            <label className="text-xs font-medium" htmlFor="override-reason">
              Reason for overriding the suggestion{" "}
              <span className="text-destructive">*</span>
            </label>
            <Textarea
              id="override-reason"
              disabled={readOnly}
              value={value.overrideReason ?? ""}
              onChange={(e) =>
                onChange?.({ ...value, overrideReason: e.target.value })
              }
              placeholder="Explain why the level differs from the matrix (recorded in the audit trail)…"
              className="min-h-16"
            />
          </div>
        )}
        {finalLevel === "high" && (
          <p className="mt-2 text-xs font-medium text-danger">
            High risk → escalated automatically to the Ban Điều hành & Ban Kiểm
            soát.
          </p>
        )}
      </div>
    </div>
  );
}

/** True when the rating can be saved (override needs a reason). */
export function isRatingValid(matrix: RiskMatrix, v: RiskRatingValue) {
  const suggested = levelForScore(
    computeWeightedScore(v.scores, matrix),
    matrix.thresholds,
  );
  return (
    !v.overrideLevel ||
    v.overrideLevel === suggested ||
    Boolean(v.overrideReason?.trim())
  );
}

/** Compact read-only summary used in tables and headers. */
export function RiskScoreChip({
  score,
  level,
}: {
  score: number;
  level: RiskLevel;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <PriorityBadge priority={level} />
      <span className="text-xs tabular-nums text-muted-foreground">
        {score.toFixed(2)}
      </span>
    </span>
  );
}
