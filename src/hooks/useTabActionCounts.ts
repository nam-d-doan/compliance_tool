import { useAuthStore } from "@/stores";
import { hasPermission } from "@/constants/rbac";
import {
  useAssignmentList,
  useCAPList,
  useNCCList,
  useObligationList,
  useRegulationList,
} from "@/hooks/queries";

/**
 * Per-tab "needs my action" counts, role-aware. Consumed by the nav-pill
 * attention badges and the list-page summary cards.
 *
 * Roles: admin, executive, owner, approver. Executive does NOT approve — it
 * only views + comments — so exec counts are oversight-oriented (overdue /
 * high-risk / pending other people's action), never "awaiting my approval".
 */
export interface TabActionCounts {
  regulations: number;
  assignments: number;
  obligations: number;
  caps: number;
  nccs: number;
}

const OVERDUE_OBLIGATION_TERMINAL = new Set([
  "completed",
  "approved",
  "archived",
]);

function parseDate(value: string | undefined): number {
  if (!value) return 0;
  const t = Date.parse(value);
  return Number.isNaN(t) ? 0 : t;
}

function isOverdue(dueDate: string | undefined, isTerminal: boolean): boolean {
  if (!dueDate || isTerminal) return false;
  return parseDate(dueDate) < Date.now();
}

function isHighOrCritical(severity: string | undefined): boolean {
  return severity === "high";
}

/**
 * Counts are defensive: any query still loading or errored contributes 0 for
 * that tab. This is a prototype mock layer, so counts are best-effort from the
 * fetched page (pageSize 500) rather than a dedicated aggregate endpoint.
 */
export function useTabActionCounts(): TabActionCounts {
  const role = useAuthStore((s) => s.role);
  const userId = useAuthStore((s) => s.user?.id);

  const canReg = hasPermission(role, "regulation:read");
  const canAssign = hasPermission(role, "assignment:read");
  const canObg = hasPermission(role, "compliance:read");
  const canCap = hasPermission(role, "cap:read");
  const canNcc = hasPermission(role, "ncc:read");

  const regs = useRegulationList({}, 1, 500);
  const assignments = useAssignmentList({}, 1, 500);
  const obligations = useObligationList({}, 1, 500);
  const caps = useCAPList({}, 1, 500);
  const nccs = useNCCList({}, 1, 500);

  const regulationCount = (() => {
    if (!canReg || !regs.data) return 0;
    const effective = new Set(
      regs.data.items.filter((r) => r.status === "Effective").map((r) => r.id),
    );
    if (effective.size === 0) return 0;
    // Regulations needing action = those referenced by a published-but-unack'd
    // assignment, or by an obligation awaiting review/submission.
    const needAction = new Set<string>();
    (assignments.data?.items ?? []).forEach((a) => {
      if (a.status === "published") needAction.add(a.regulationId);
    });
    (obligations.data?.items ?? []).forEach((o) => {
      if (o.status === "review_required" || o.status === "submitted") {
        (o.regulationIds ?? [o.regulationId]).forEach((id) =>
          needAction.add(id),
        );
      }
    });
    let n = 0;
    needAction.forEach((id) => {
      if (effective.has(id)) n++;
    });
    return n;
  })();

  const assignmentCount = (() => {
    if (!canAssign || !assignments.data) return 0;
    const items = assignments.data.items;
    if (role === "executive") return 0;
    // Pending acknowledgment (published, not yet acknowledged) is the
    // primary action signal for everyone who acts on assignments.
    let count = items.filter((a) => a.status === "published").length;
    if (role === "owner") {
      // Owners also drive acknowledged assignments toward completion.
      count += items.filter(
        (a) => a.assignorId === userId && a.status === "acknowledged",
      ).length;
    }
    return count;
  })();

  const obligationCount = (() => {
    if (!canObg || !obligations.data) return 0;
    const items = obligations.data.items;
    if (role === "owner") {
      return items.filter((o) => {
        const needsWork = ["draft", "submitted", "returned"].includes(o.status);
        const terminal = OVERDUE_OBLIGATION_TERMINAL.has(o.status);
        const overdue = isOverdue(o.dueDate, terminal);
        // Owner's own obligations needing work, or their own overdue items.
        return o.ownerId === userId && (needsWork || overdue);
      }).length;
    }
    if (role === "approver") {
      const mine = items.filter(
        (o) =>
          (o.status === "review_required" || o.status === "submitted") &&
          o.approverId === userId,
      ).length;
      // Approver pool is thin in the mock; fall back to all pending review.
      const fallback = items.filter(
        (o) => o.status === "review_required" || o.status === "submitted",
      ).length;
      return mine > 0 ? mine : fallback;
    }
    if (role === "admin") {
      return items.filter((o) => {
        const terminal = OVERDUE_OBLIGATION_TERMINAL.has(o.status);
        return (
          o.status === "review_required" ||
          o.status === "submitted" ||
          isOverdue(o.dueDate, terminal)
        );
      }).length;
    }
    // executive — oversight: overdue only
    return items.filter((o) => {
      const terminal = OVERDUE_OBLIGATION_TERMINAL.has(o.status);
      return isOverdue(o.dueDate, terminal);
    }).length;
  })();

  const capCount = (() => {
    if (!canCap || !caps.data) return 0;
    const items = caps.data.items;
    const overdue = (c: (typeof items)[number]) =>
      isOverdue(c.dueDate, c.status === "Closed");
    if (role === "owner") {
      return items.filter(
        (c) => c.ownerId === userId && (c.status !== "Closed" || overdue(c)),
      ).length;
    }
    if (role === "approver") {
      const mine = items.filter(
        (c) => c.status === "Pending Approval" && c.approverId === userId,
      ).length;
      const fallback = items.filter(
        (c) => c.status === "Pending Approval",
      ).length;
      return mine > 0 ? mine : fallback;
    }
    if (role === "admin") {
      // Open CAPs (not Closed) plus any overdue CAP (even if Closed late).
      return items.filter((c) => c.status !== "Closed" || overdue(c)).length;
    }
    // executive — oversight: overdue only
    return items.filter(overdue).length;
  })();

  const nccCount = (() => {
    if (!canNcc || !nccs.data) return 0;
    const items = nccs.data.items;
    if (role === "owner") {
      return items.filter(
        (n) =>
          (n.ownerId === userId && n.status === "Open") ||
          (n.ownerId === userId && isOverdue(n.dueDate, n.status === "Closed")),
      ).length;
    }
    // approver / admin / executive — oversight: high/critical open NCCs
    return items.filter(
      (n) => n.status === "Open" && isHighOrCritical(n.severity),
    ).length;
  })();

  return {
    regulations: regulationCount,
    assignments: assignmentCount,
    obligations: obligationCount,
    caps: capCount,
    nccs: nccCount,
  };
}
