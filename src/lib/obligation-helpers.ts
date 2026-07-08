import type { Obligation, CAP } from "@/types";
import { getDueDateTone } from "@/lib/due-date";

/** Reference "now" — captured once per call chain so tab/badge math is stable. */
function now(): Date {
  return new Date();
}

/** Whole days from today to the obligation due date (negative = past). */
export function daysUntilDue(
  obligation: Obligation,
  ref: Date = now(),
): number {
  const due = new Date(obligation.dueDate);
  const ms = due.getTime() - ref.getTime();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

/** An obligation is overdue when its due date has passed and it isn't completed. */
export function isOverdue(obligation: Obligation, ref: Date = now()): boolean {
  return (
    obligation.status !== "completed" && new Date(obligation.dueDate) < ref
  );
}

/** Due within the next `days` days, excluding completed and already-overdue. */
export function isDueSoon(
  obligation: Obligation,
  days = 7,
  ref: Date = now(),
): boolean {
  if (obligation.status === "completed") return false;
  const d = daysUntilDue(obligation, ref);
  return d >= 0 && d <= days;
}

/** True when the obligation matches the "needs attention" criteria. */
export function needsAttention(
  obligation: Obligation,
  ref: Date = now(),
): boolean {
  if (obligation.status === "completed") return false;
  return (
    isOverdue(obligation, ref) ||
    obligation.riskLevel === "critical" ||
    obligation.status === "review_required"
  );
}

/** Build an obligation-id → CAP lookup map (first CAP that references it wins). */
export function buildObligationCapMap(caps: CAP[]): Map<string, CAP> {
  const map = new Map<string, CAP>();
  for (const cap of caps) {
    for (const id of cap.obligationIds ?? []) {
      if (!map.has(id)) map.set(id, cap);
    }
  }
  return map;
}

/** Resolve the CAP linked to an obligation, if any. */
export function getObligationCap(
  obligation: Obligation,
  caps: CAP[] | Map<string, CAP>,
): CAP | undefined {
  const map = Array.isArray(caps) ? buildObligationCapMap(caps) : caps;
  return map.get(obligation.id);
}

export type ObligationTab =
  "need_attention" | "upcoming" | "in_progress" | "completed";

/** Assign a single obligation to exactly one dashboard tab (precedence-based). */
export function classifyObligation(
  obligation: Obligation,
  ref: Date = now(),
): ObligationTab {
  if (obligation.status === "completed") return "completed";
  if (needsAttention(obligation, ref)) return "need_attention";
  if (isDueSoon(obligation, 7, ref)) return "upcoming";
  return "in_progress";
}

export interface SummaryStats {
  total: number;
  completed: number;
  overdue: number;
  critical: number;
  reviewRequired: number;
  upcoming: number;
  inProgress: number;
  /** Union of overdue + critical + review_required (de-duplicated). */
  needAttention: number;
  /** Obligations matching needs-CAP criteria that have no CAP yet. */
  needsCap: number;
}

/**
 * Roll up obligation counts for KPI cards, tab badges, and the TopNav alert.
 * Pure function — pass the owner's already-filtered obligations + all CAPs.
 */
export function getSummaryStats(
  obligations: Obligation[],
  caps: CAP[] | Map<string, CAP> = [],
  ref: Date = now(),
): SummaryStats {
  const capMap = Array.isArray(caps) ? buildObligationCapMap(caps) : caps;

  let completed = 0;
  let overdue = 0;
  let critical = 0;
  let reviewRequired = 0;
  let upcoming = 0;
  let inProgress = 0;
  let needAttention = 0;
  let needsCap = 0;

  for (const obg of obligations) {
    const tab = classifyObligation(obg, ref);
    if (tab === "completed") {
      completed++;
      continue;
    }
    if (tab === "need_attention") needAttention++;
    if (tab === "upcoming") upcoming++;
    if (tab === "in_progress") inProgress++;

    if (isOverdue(obg, ref)) overdue++;
    if (obg.riskLevel === "critical") critical++;
    if (obg.status === "review_required") reviewRequired++;

    // Needs-CAP = matches criteria AND has no linked CAP.
    if (needsAttention(obg, ref) && !capMap.has(obg.id)) needsCap++;
  }

  return {
    total: obligations.length,
    completed,
    overdue,
    critical,
    reviewRequired,
    upcoming,
    inProgress,
    needAttention,
    needsCap,
  };
}

export interface ObligationRing {
  completed: number;
  total: number;
  /** 0–100, rounded. 0 when there are no obligations. */
  percent: number;
}

/** Progress ring: completed obligations as a percentage of the total. */
export function getObligationsRing(obligations: Obligation[]): ObligationRing {
  const total = obligations.length;
  const completed = obligations.filter((o) => o.status === "completed").length;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
  return { completed, total, percent };
}

export interface NeedsCapItem {
  /** Stable key for React lists. */
  key: string;
  /** Display title — the CAP title, or "New CAP" when no CAP exists. */
  title: string;
  /** The CAP to navigate to, when one already exists. */
  cap?: CAP;
  /** Underlying obligations that triggered this alert. */
  obligations: Obligation[];
  /** Comma-joined article refs (may be truncated by the UI). */
  articleRefs: string[];
  /** Distinct owner names across the obligations. */
  ownerNames: string[];
  /** Nearest upcoming due date (ISO), for the due preview. */
  nearestDueDate?: string;
  /** Whether the action is "Create CAP" (no cap) or "Go to CAP". */
  hasCap: boolean;
}

/**
 * Build the deduplicated "Needs CAP" alert items for an owner.
 *
 * - Obligations matching the criteria (overdue OR critical OR review_required)
 *   are grouped by their linked CAP.
 * - Each CAP group becomes ONE item with a "Go to CAP" action.
 * - Obligations with no CAP each become their own "Create CAP" item.
 *
 * Items are ordered so the most urgent (earliest due date) surface first.
 */
export function getNeedsCapsForOwner(
  obligations: Obligation[],
  caps: CAP[] | Map<string, CAP> = [],
  ref: Date = now(),
): NeedsCapItem[] {
  const capMap = Array.isArray(caps) ? buildObligationCapMap(caps) : caps;
  const candidates = obligations.filter((o) => needsAttention(o, ref));

  // Group obligations by their linked CAP id (or "no-cap:<obgId>" for singles).
  const groups = new Map<string, Obligation[]>();
  for (const obg of candidates) {
    const cap = capMap.get(obg.id);
    const groupKey = cap ? `cap:${cap.id}` : `nocap:${obg.id}`;
    const arr = groups.get(groupKey) ?? [];
    arr.push(obg);
    groups.set(groupKey, arr);
  }

  const items: NeedsCapItem[] = [];
  for (const [groupKey, obgs] of groups) {
    const cap = capMap.get(obgs[0].id);
    const sorted = [...obgs].sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
    );
    items.push({
      key: groupKey,
      title: cap?.title ?? "New CAP",
      cap,
      obligations: sorted,
      articleRefs: sorted.map((o) => o.articleRef),
      ownerNames: Array.from(new Set(sorted.map((o) => o.ownerName))).filter(
        Boolean,
      ),
      nearestDueDate: sorted[0]?.dueDate,
      hasCap: Boolean(cap),
    });
  }

  // Most urgent (earliest due) first.
  items.sort(
    (a, b) =>
      new Date(a.nearestDueDate ?? 0).getTime() -
      new Date(b.nearestDueDate ?? 0).getTime(),
  );

  return items;
}

/** Count of deduplicated Needs-CAP items (used by the TopNav badge). */
export function countNeedsCapsForOwner(
  obligations: Obligation[],
  caps: CAP[] | Map<string, CAP> = [],
  ref: Date = now(),
): number {
  return getNeedsCapsForOwner(obligations, caps, ref).length;
}

/** Tailwind class string for the due-date chip colour by urgency. */
export function dueDateTone(obligation: Obligation, ref: Date = now()): string {
  // Delegate the tier to the shared due-date logic so thresholds and colours
  // stay in sync with DueDateCell. `ref` is kept for API compatibility; the
  // shared logic uses "today" (the widget always calls without a ref).
  const completed = obligation.status === "completed";
  switch (getDueDateTone(obligation.dueDate, completed)) {
    case "overdue":
      return "text-red-600 dark:text-red-400 bg-red-500/10";
    case "soon":
      return "text-amber-600 dark:text-amber-400 bg-amber-500/15";
    default:
      return "text-muted-foreground";
  }
}

/** Human label for the due chip: "Overdue" / "N days left" / "Due today". */
export function dueDateLabel(
  obligation: Obligation,
  ref: Date = now(),
): string {
  if (isOverdue(obligation, ref)) {
    const d = Math.abs(daysUntilDue(obligation, ref));
    return d === 0 ? "Overdue" : `Overdue ${d}d`;
  }
  const d = daysUntilDue(obligation, ref);
  if (d === 0) return "Due today";
  if (d === 1) return "1 day left";
  return `${d} days left`;
}
