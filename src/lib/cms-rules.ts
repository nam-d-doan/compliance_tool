import { differenceInCalendarDays, parseISO, startOfDay } from "date-fns";
import { demoNow } from "@/stores/demoClockStore";
import type {
  IssueSource,
  IssueStage,
  LegalUpdateStatus,
  MappingAction,
  NotifyChannel,
  RevisionStatus,
  RevisionTask,
  RiskLevel,
  RiskMatrix,
  RiskScores,
} from "@/types/cms";

/**
 * Shared business rules and labels for the CMS modules. Used by both the mock
 * API (to compute alerts/escalations) and the UI (to render badges), so the
 * two always agree.
 */

// ---------------------------------------------------------------------------
// Labels
// ---------------------------------------------------------------------------

export const ISSUE_SOURCE_LABELS: Record<IssueSource, string> = {
  icis: "ICIS – P.KTKSNB",
  sbv_inspection: "SBV inspection (Thanh tra NHNN)",
  state_audit: "State Audit (KTNN)",
  independent_audit: "Independent audit",
  internal_audit: "Internal audit (KTNB)",
  self_check: "Self-check (Tự kiểm tra)",
  compliance_monitoring: "Compliance monitoring",
  complaint: "Complaints / other",
};

/** Short labels for chips and chart axes. */
export const ISSUE_SOURCE_SHORT: Record<IssueSource, string> = {
  icis: "ICIS",
  sbv_inspection: "SBV inspection",
  state_audit: "State Audit",
  independent_audit: "Indep. audit",
  internal_audit: "Internal audit",
  self_check: "Self-check",
  compliance_monitoring: "Monitoring",
  complaint: "Complaints",
};

export const ISSUE_SOURCES = Object.keys(ISSUE_SOURCE_LABELS) as IssueSource[];

export const LEGAL_STATUS_LABELS: Record<LegalUpdateStatus, string> = {
  new: "New",
  under_review: "Under review",
  applicable: "Applicable",
  not_applicable: "Not applicable",
  mapped: "Mapped",
  assigned: "Assigned",
  completed: "Completed",
};

export const MAPPING_ACTION_LABELS: Record<MappingAction, string> = {
  amend: "Amend (Sửa đổi)",
  supplement: "Supplement (Bổ sung)",
  replace: "Replace (Thay thế)",
  repeal: "Repeal (Bãi bỏ)",
  new: "Issue new (Ban hành mới)",
};

export const MAPPING_ACTION_SHORT: Record<MappingAction, string> = {
  amend: "Amend",
  supplement: "Supplement",
  replace: "Replace",
  repeal: "Repeal",
  new: "Issue new",
};

export const REVISION_STATUS_LABELS: Record<RevisionStatus, string> = {
  not_started: "Not yet revised",
  in_revision: "In revision",
  pending_approval: "Awaiting approval",
  issued: "Issued",
};

export const REVISION_STATUS_VI: Record<RevisionStatus, string> = {
  not_started: "Chưa điều chỉnh",
  in_revision: "Đang điều chỉnh",
  pending_approval: "Chờ phê duyệt",
  issued: "Đã ban hành",
};

export const REVISION_STATUSES: RevisionStatus[] = [
  "not_started",
  "in_revision",
  "pending_approval",
  "issued",
];

export const ISSUE_STAGE_LABELS: Record<IssueStage, string> = {
  check: "Check",
  evidence: "Submit evidence",
  review: "Compliance review",
  approval: "Approve closure",
  closed: "Closed",
};

export const CHANNEL_LABELS: Record<NotifyChannel, string> = {
  in_app: "In-app",
  email: "Email",
  teams: "Teams",
  sms: "SMS",
};

export const RISK_LEVEL_VI: Record<RiskLevel, string> = {
  low: "Thấp",
  medium: "Trung bình",
  high: "Cao",
};

/** Standard violation catalog used to classify issues and ICIS findings. */
export const VIOLATION_CATEGORIES = [
  "KYC / customer identification",
  "AML / suspicious transaction reporting",
  "Credit granting procedure",
  "Collateral & valuation",
  "Interest rate & fees",
  "Prudential ratios reporting",
  "Information security",
  "Consumer protection",
  "Internal regulation not updated",
  "Payment & accounts",
  "Cash & vault operations",
] as const;

// ---------------------------------------------------------------------------
// Risk Rating Matrix
// ---------------------------------------------------------------------------

/** Weighted score on the 1–5 scale, rounded to 2 decimals. */
export function computeWeightedScore(
  scores: RiskScores,
  matrix: Pick<RiskMatrix, "criteria">,
): number {
  const totalWeight = matrix.criteria.reduce((s, c) => s + c.weight, 0) || 1;
  const raw = matrix.criteria.reduce(
    (s, c) => s + (scores[c.key] ?? 1) * c.weight,
    0,
  );
  return Math.round((raw / totalWeight) * 100) / 100;
}

export function levelForScore(
  score: number,
  thresholds: RiskMatrix["thresholds"],
): RiskLevel {
  if (score >= thresholds.high) return "high";
  if (score >= thresholds.medium) return "medium";
  return "low";
}

/** Contribution of each criterion to the weighted score (for explain bars). */
export function criterionContributions(
  scores: RiskScores,
  matrix: Pick<RiskMatrix, "criteria">,
) {
  const totalWeight = matrix.criteria.reduce((s, c) => s + c.weight, 0) || 1;
  return matrix.criteria.map((c) => ({
    key: c.key,
    label: c.label,
    labelVi: c.labelVi,
    score: scores[c.key] ?? 1,
    weight: c.weight,
    contribution:
      Math.round((((scores[c.key] ?? 1) * c.weight) / totalWeight) * 100) / 100,
    stepLabel: c.scale.find((s) => s.score === (scores[c.key] ?? 1))?.label,
  }));
}

/** Fine score (1–5) from a potential fine in VND. */
export function fineScoreFromAmount(vnd?: number): 1 | 2 | 3 | 4 | 5 {
  if (!vnd || vnd <= 0) return 1;
  if (vnd < 20_000_000) return 1;
  if (vnd < 100_000_000) return 2;
  if (vnd < 500_000_000) return 3;
  if (vnd < 2_000_000_000) return 4;
  return 5;
}

/** Recurrence score (1–5) from the number of occurrences in 12 months. */
export function recurrenceScoreFromCount(count: number): 1 | 2 | 3 | 4 | 5 {
  if (count <= 1) return 1;
  if (count === 2) return 2;
  if (count === 3) return 3;
  if (count <= 5) return 4;
  return 5;
}

// ---------------------------------------------------------------------------
// QĐNB revision health
// ---------------------------------------------------------------------------

export type RevisionHealth = "on_track" | "late_risk" | "overdue" | "issued";

/** Days before the committed date when a revision is flagged at risk. */
export const LATE_RISK_WINDOW_DAYS = 14;

export function daysUntil(dateIso: string, now: Date = demoNow()): number {
  return differenceInCalendarDays(
    startOfDay(parseISO(dateIso)),
    startOfDay(now),
  );
}

/**
 * Health of a QĐNB revision against the law's effective date and the
 * committed date (RFQ 2.3 — cảnh báo chậm trễ ban hành):
 * - overdue: past the committed date and not yet issued;
 * - late_risk: forecast issue date is after the law's effective date or the
 *   committed date, or the deadline is near and work has barely started.
 */
export function getRevisionHealth(
  task: Pick<
    RevisionTask,
    | "status"
    | "committedDate"
    | "expectedIssueDate"
    | "lawEffectiveDate"
    | "progress"
  >,
  now: Date = demoNow(),
): RevisionHealth {
  if (task.status === "issued") return "issued";
  if (daysUntil(task.committedDate, now) < 0) return "overdue";
  const forecastLate =
    parseISO(task.expectedIssueDate) > parseISO(task.lawEffectiveDate) ||
    parseISO(task.expectedIssueDate) > parseISO(task.committedDate);
  const nearAndBehind =
    daysUntil(task.committedDate, now) <= LATE_RISK_WINDOW_DAYS &&
    task.progress < 60;
  return forecastLate || nearAndBehind ? "late_risk" : "on_track";
}

export const REVISION_HEALTH_LABELS: Record<RevisionHealth, string> = {
  on_track: "On track",
  late_risk: "Late risk",
  overdue: "Overdue",
  issued: "Issued",
};

/** Reminder offsets (days before the deadline) used by the scheduler. */
export const REMINDER_OFFSETS = [30, 14, 7, 1] as const;

export function formatVnd(amount: number): string {
  return new Intl.NumberFormat("vi-VN").format(amount) + " ₫";
}
