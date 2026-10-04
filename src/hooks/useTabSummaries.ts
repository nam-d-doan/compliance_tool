import {
  AlertCircle,
  AlertTriangle,
  Archive,
  BookOpen,
  CalendarClock,
  CheckCircle,
  ClipboardCheck,
  ClipboardList,
  Clock,
  Eye,
  Mail,
  PlayCircle,
  ShieldAlert,
  ShieldCheck,
  UploadCloud,
  UserCheck,
} from "lucide-react";
import { useAuthStore } from "@/stores";
import { useTabActionCounts } from "@/hooks/useTabActionCounts";
import {
  useAssignmentList,
  useCAPList,
  useNCCList,
  useObligationList,
  useRegulationList,
} from "@/hooks/queries";
import type { SummaryCardData } from "@/components/common";

const MS_30_DAYS = 30 * 24 * 60 * 60 * 1000;
const OBLIGATION_TERMINAL = new Set(["completed", "approved", "archived"]);

function ts(value: string | undefined): number {
  if (!value) return 0;
  const t = Date.parse(value);
  return Number.isNaN(t) ? 0 : t;
}

function isOverdue(dueDate: string | undefined, terminal: boolean): boolean {
  if (!dueDate || terminal) return false;
  return ts(dueDate) < Date.now();
}

function isHighOrCritical(value: string | undefined): boolean {
  return value === "high";
}

/** Role label for the "needs my action" card hint. */
function actionHint(role: string | null, fallback: string): string {
  if (role === "executive") return "View + comment only";
  if (role === "approver") return "Awaiting my review";
  if (role === "owner") return "Awaiting my action";
  return fallback;
}

const TINT_INFO = "bg-blue-500/10 text-blue-600 dark:text-blue-400";
const TINT_SUCCESS = "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
const TINT_WARN = "bg-amber-500/10 text-amber-600 dark:text-amber-400";
const TINT_DANGER = "bg-rose-500/10 text-rose-600 dark:text-rose-400";

export function useRegulationsSummary(): SummaryCardData[] {
  const role = useAuthStore((s) => s.role);
  const counts = useTabActionCounts();
  const regs = useRegulationList({}, 1, 500);
  const assignments = useAssignmentList({}, 1, 500);

  const items = regs.data?.items ?? [];
  const cutoff = Date.now() - MS_30_DAYS;

  const effective = items.filter((r) => r.status === "Effective");
  const recent = items.filter((r) => ts(r.createdDate) >= cutoff);
  const superseded = items.filter((r) => r.status === "Superseded");

  // Regulations referenced by at least one assignment (mapped for the
  // "not yet assigned" sub-metric).
  const assignedRegIds = new Set(
    (assignments.data?.items ?? []).map((a) => a.regulationId),
  );
  const recentNotAssigned = recent.filter(
    (r) => !assignedRegIds.has(r.id),
  ).length;

  return [
    {
      title: "Effective Regulations",
      value: effective.length,
      icon: BookOpen,
      iconClassName: TINT_SUCCESS,
      hint: `${items.length} Total`,
    },
    {
      title: "Recently Added (30d)",
      value: recent.length,
      icon: CalendarClock,
      iconClassName: TINT_INFO,
      hint:
        recentNotAssigned > 0
          ? `${recentNotAssigned} not yet assigned`
          : undefined,
    },
    {
      title: "Superseded",
      value: superseded.length,
      icon: Archive,
      iconClassName: TINT_WARN,
      hint: "Review impacted items",
    },
    {
      title:
        role === "approver"
          ? "Needs My Review"
          : role === "owner"
            ? "Pending My Review"
            : "Needs Attention",
      value: counts.regulations,
      icon: Eye,
      iconClassName: counts.regulations > 0 ? TINT_DANGER : TINT_INFO,
      hint: actionHint(role, "Awaiting review"),
    },
  ];
}

export function useAssignmentsSummary(): SummaryCardData[] {
  const role = useAuthStore((s) => s.role);
  const counts = useTabActionCounts();
  const assignments = useAssignmentList({}, 1, 500);

  const items = assignments.data?.items ?? [];
  const published = items.filter((a) => a.status === "published").length;
  const inProgress = items.filter((a) => a.status === "in_progress").length;
  const acknowledged = items.filter((a) => a.status === "acknowledged").length;

  return [
    {
      title: "Total Assignments",
      value: items.length,
      icon: ClipboardCheck,
      iconClassName: TINT_INFO,
      hint: `${published} Published · ${inProgress} In Progress`,
    },
    {
      title: "Pending Acknowledgment",
      value: published,
      icon: Mail,
      iconClassName: published > 0 ? TINT_WARN : TINT_INFO,
      hint: "Awaiting dept. acknowledgment",
    },
    {
      title: "In Progress",
      value: inProgress,
      icon: PlayCircle,
      iconClassName: TINT_SUCCESS,
      hint: `${acknowledged} Acknowledged`,
    },
    {
      title: role === "approver" ? "Needs My Review" : "Needs My Action",
      value: counts.assignments,
      icon: UserCheck,
      iconClassName: counts.assignments > 0 ? TINT_DANGER : TINT_INFO,
      hint: actionHint(role, "Awaiting acknowledgment"),
    },
  ];
}

export function useObligationsSummary(): SummaryCardData[] {
  const role = useAuthStore((s) => s.role);
  const counts = useTabActionCounts();
  const obligations = useObligationList({}, 1, 500);

  const items = obligations.data?.items ?? [];
  const overdue = items.filter((o) =>
    isOverdue(o.dueDate, OBLIGATION_TERMINAL.has(o.status)),
  ).length;
  const submitted = items.filter((o) => o.status === "submitted").length;
  const reviewRequired = items.filter(
    (o) => o.status === "review_required",
  ).length;

  return [
    {
      title: "Total Obligations",
      value: items.length,
      icon: ShieldCheck,
      iconClassName: TINT_INFO,
      hint: `${reviewRequired} Pending review`,
    },
    {
      title: "Overdue / At Risk",
      value: overdue,
      icon: AlertCircle,
      iconClassName: overdue > 0 ? TINT_DANGER : TINT_WARN,
      emphasis: overdue > 0,
    },
    {
      title: "Recently Submitted",
      value: submitted,
      icon: UploadCloud,
      iconClassName: TINT_INFO,
    },
    {
      title:
        role === "approver"
          ? "Awaiting My Approval"
          : role === "owner"
            ? "My Open & Pending"
            : role === "executive"
              ? "Overdue (oversight)"
              : "Needs Approval / Overdue",
      value: counts.obligations,
      icon: CheckCircle,
      iconClassName: counts.obligations > 0 ? TINT_DANGER : TINT_SUCCESS,
      hint: actionHint(role, "Pending + overdue"),
    },
  ];
}

export function useCAPsSummary(): SummaryCardData[] {
  const role = useAuthStore((s) => s.role);
  const counts = useTabActionCounts();
  const caps = useCAPList({}, 1, 500);

  const items = caps.data?.items ?? [];
  const open = items.filter((c) => c.status !== "Closed").length;
  const overdue = items.filter((c) =>
    isOverdue(c.dueDate, c.status === "Closed"),
  ).length;
  const pendingApproval = items.filter(
    (c) => c.status === "Pending Approval",
  ).length;
  const highCriticalOpen = items.filter(
    (c) =>
      c.status !== "Closed" &&
      (isHighOrCritical(c.priority) || isHighOrCritical(c.risk)),
  ).length;

  return [
    {
      title: "Total CAPs",
      value: items.length,
      icon: ClipboardList,
      iconClassName: TINT_INFO,
      hint: `${open} Open · ${pendingApproval} Pending approval`,
    },
    {
      title: "Overdue / At Risk",
      value: overdue,
      icon: AlertCircle,
      iconClassName: overdue > 0 ? TINT_DANGER : TINT_WARN,
      emphasis: overdue > 0,
    },
    {
      title: "High Risk Open",
      value: highCriticalOpen,
      icon: ShieldAlert,
      iconClassName: highCriticalOpen > 0 ? TINT_DANGER : TINT_WARN,
    },
    {
      title:
        role === "approver"
          ? "Pending My Approval"
          : role === "owner"
            ? "My Open CAPs"
            : role === "executive"
              ? "Overdue (oversight)"
              : "Open + Overdue",
      value: counts.caps,
      icon: Clock,
      iconClassName: counts.caps > 0 ? TINT_DANGER : TINT_SUCCESS,
      hint: actionHint(role, "Open + overdue"),
    },
  ];
}

export function useNCCsSummary(): SummaryCardData[] {
  const role = useAuthStore((s) => s.role);
  const counts = useTabActionCounts();
  const nccs = useNCCList({}, 1, 500);

  const items = nccs.data?.items ?? [];
  const open = items.filter((n) => n.status === "Open").length;
  const highCriticalOpen = items.filter(
    (n) => n.status === "Open" && isHighOrCritical(n.severity),
  ).length;
  const overdue = items.filter((n) =>
    isOverdue(n.dueDate, n.status === "Closed"),
  ).length;

  return [
    {
      title: "Open Cases",
      value: open,
      icon: ShieldAlert,
      iconClassName: open > 0 ? TINT_WARN : TINT_SUCCESS,
      hint: `${items.length} Total`,
    },
    {
      title: "High Risk & Open",
      value: highCriticalOpen,
      icon: AlertTriangle,
      iconClassName: highCriticalOpen > 0 ? TINT_DANGER : TINT_WARN,
    },
    {
      title: "Overdue",
      value: overdue,
      icon: Clock,
      iconClassName: overdue > 0 ? TINT_DANGER : TINT_WARN,
      emphasis: overdue > 0,
    },
    {
      title: role === "owner" ? "Needs My Action" : "Needs Oversight",
      value: counts.nccs,
      icon: UserCheck,
      iconClassName: counts.nccs > 0 ? TINT_DANGER : TINT_INFO,
      hint: role === "owner" ? "My open / overdue" : "High risk",
    },
  ];
}

export type { SummaryCardData };
