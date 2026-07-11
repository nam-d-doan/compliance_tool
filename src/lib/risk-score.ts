/**
 * Color logic for risk/impact scores where a HIGHER score is WORSE
 * (e.g. aiRiskScore, aiImpactScore, regulation impact %).
 *
 * This is the opposite direction from confidence/completion scores, where
 * higher is better — those use their own (green = high) scale and must NOT
 * reuse these helpers.
 *
 * Ramp (matches PRIORITY_STYLES / RiskHeatmap):
 *   >= 80 -> critical (red)
 *   >= 50 -> elevated (amber)
 *   <  50 -> normal   (emerald)
 */

export type RiskScoreTone = "critical" | "elevated" | "normal";

export const RISK_SCORE_HIGH_THRESHOLD = 80;
export const RISK_SCORE_MEDIUM_THRESHOLD = 50;

export function getRiskScoreTone(score: number): RiskScoreTone {
  if (score >= RISK_SCORE_HIGH_THRESHOLD) return "critical";
  if (score >= RISK_SCORE_MEDIUM_THRESHOLD) return "elevated";
  return "normal";
}

/** Text-color classes for a numeric score shown inline. */
export function riskScoreTextClasses(score: number): string {
  switch (getRiskScoreTone(score)) {
    case "critical":
      return "text-danger";
    case "elevated":
      return "text-warning";
    default:
      return "text-success";
  }
}

/** Stroke/fill classes for a gauge ring. */
export function riskScoreStrokeClasses(score: number): string {
  switch (getRiskScoreTone(score)) {
    case "critical":
      return "text-danger";
    case "elevated":
      return "text-warning";
    default:
      return "text-success";
  }
}
