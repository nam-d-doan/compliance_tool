import { subDays, subHours, subMinutes, formatISO } from "date-fns";
import type {
  AuditLog,
  EscalationRecord,
  EscalationRule,
  LegalUpdate,
  NonComplianceCase,
  Notification,
  NotifyChannel,
  RevisionTask,
  SchedulerEvent,
  UserProfile,
} from "@/types";
import {
  REMINDER_OFFSETS,
  daysUntil,
  getRevisionHealth,
} from "@/lib/cms-rules";
import { demoNow } from "@/stores/demoClockStore";

/**
 * CMS business engine for the mock layer: audit trail, notifications,
 * reminders and escalation. Every CMS handler calls `recordAudit` so the
 * Audit Logs page and the per-record History tabs show real demo actions.
 */

let seq = 0;
const nextId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${(seq++).toString(36)}`;

export interface Actor {
  id: string;
  name: string;
  role: string;
}

/** The signed-in demo user, read from the persisted auth store. */
export function currentActor(): Actor {
  try {
    const raw = window.localStorage.getItem("auth-storage");
    if (raw) {
      const parsed = JSON.parse(raw) as {
        state?: { user?: { id?: string; name?: string; role?: string } };
      };
      const u = parsed.state?.user;
      if (u?.id && u.name) {
        return { id: u.id, name: u.name, role: u.role ?? "" };
      }
    }
  } catch {
    // Storage unavailable — fall back to the system actor.
  }
  return { id: "system", name: "CMS System", role: "system" };
}

export const SYSTEM_ACTOR: Actor = {
  id: "system",
  name: "CMS System",
  role: "system",
};

export interface AuditInput {
  action: AuditLog["action"];
  module: string;
  object: string;
  details?: string;
  entityType?: string;
  entityId?: string;
  changes?: AuditLog["changes"];
  actor?: Actor;
  at?: Date;
}

export function recordAudit(logs: AuditLog[], input: AuditInput): AuditLog {
  const actor = input.actor ?? currentActor();
  const at = formatISO(input.at ?? demoNow());
  const log: AuditLog = {
    id: nextId("aud"),
    timestamp: at,
    userId: actor.id,
    userName: actor.name,
    action: input.action,
    object: input.object,
    module: input.module,
    ip: actor.id === "system" ? "cms-scheduler" : "10.20.1.15",
    result: "success",
    details: input.details,
    entityType: input.entityType,
    entityId: input.entityId,
    changes: input.changes,
    createdAt: at,
    updatedAt: at,
  };
  logs.unshift(log);
  return log;
}

export interface NotifyInput {
  title: string;
  description: string;
  type: Notification["type"];
  actionUrl?: string;
  entityType?: string;
  entityId?: string;
  channels?: NotifyChannel[];
  recipient?: string;
  at?: Date;
}

export function pushNotification(
  list: Notification[],
  input: NotifyInput,
): Notification {
  const at = formatISO(input.at ?? demoNow());
  const n: Notification = {
    id: nextId("ntf"),
    userId: "all",
    title: input.title,
    description: input.description,
    type: input.type,
    read: false,
    entityType: input.entityType,
    entityId: input.entityId,
    actionUrl: input.actionUrl,
    channels: input.channels ?? ["in_app"],
    recipient: input.recipient,
    createdAt: at,
    updatedAt: at,
  };
  list.unshift(n);
  return n;
}

// ---------------------------------------------------------------------------
// Scheduler — reminders, overdue escalation, late-issuance alerts
// ---------------------------------------------------------------------------

export interface SchedulerDb {
  revisionTasks: RevisionTask[];
  nccs: NonComplianceCase[];
  escalationRules: EscalationRule[];
  notifications: Notification[];
  auditLogs: AuditLog[];
}

function reminderKindFor(daysLeft: number): string | null {
  if (daysLeft < 0) return `Overdue +${-daysLeft}`;
  const crossed = REMINDER_OFFSETS.filter((o) => daysLeft <= o);
  if (!crossed.length) return null;
  return `T-${Math.min(...crossed)}`;
}

function overdueEscalations(
  rules: EscalationRule[],
  appliesTo: "issue" | "revision",
  overdueDays: number,
  existing: EscalationRecord[],
): EscalationRule[] {
  return rules
    .filter(
      (r) =>
        r.active &&
        r.trigger === "overdue" &&
        r.appliesTo.includes(appliesTo) &&
        overdueDays >= (r.overdueDays ?? 0) &&
        !existing.some((e) => e.reason === "overdue" && e.level === r.level),
    )
    .sort((a, b) => a.level - b.level);
}

/**
 * Evaluate every open revision task and issue at `now`, appending reminders,
 * escalations, notifications and audit entries. Idempotent: running twice at
 * the same time produces no duplicates.
 */
export function runScheduler(
  db: SchedulerDb,
  now: Date = demoNow(),
): SchedulerEvent[] {
  const events: SchedulerEvent[] = [];
  const at = formatISO(now);

  for (const task of db.revisionTasks) {
    if (task.status === "issued") continue;
    const daysLeft = daysUntil(task.committedDate, now);
    const kind = reminderKindFor(daysLeft);
    if (kind && !task.reminders.some((r) => r.kind === kind)) {
      task.reminders.push({
        id: nextId("rem"),
        at,
        kind,
        to: `${task.leadUnitName}; ${task.ownerName}`,
        channels: ["in_app", "email", "teams"],
      });
      pushNotification(db.notifications, {
        type: "deadline",
        title:
          daysLeft < 0
            ? `QĐNB revision overdue: ${task.qdnbCode}`
            : `Reminder (${kind}): ${task.qdnbCode}`,
        description:
          daysLeft < 0
            ? `${task.qdnbTitle} is ${-daysLeft} day(s) past the committed date.`
            : `${task.qdnbTitle} must be issued in ${daysLeft} day(s).`,
        actionUrl: `/qdnb/${task.qdnbId}`,
        entityType: "revision",
        entityId: task.id,
        channels: ["in_app", "email", "teams"],
        recipient: task.leadUnitName,
        at: now,
      });
      events.push({
        kind: daysLeft < 0 ? "overdue" : "reminder",
        entityType: "revision",
        entityId: task.id,
        entityLabel: task.qdnbCode,
        message:
          daysLeft < 0
            ? `${task.qdnbCode} is now overdue (${-daysLeft} days)`
            : `Reminder ${kind} sent to ${task.leadUnitName}`,
      });
    }

    const health = getRevisionHealth(task, now);
    if (
      health === "late_risk" &&
      !task.reminders.some((r) => r.kind === "Late risk")
    ) {
      task.reminders.push({
        id: nextId("rem"),
        at,
        kind: "Late risk",
        to: `${task.leadUnitName}; Khối Tuân thủ`,
        channels: ["in_app", "email"],
      });
      pushNotification(db.notifications, {
        type: "deadline",
        title: `Late issuance risk: ${task.qdnbCode}`,
        description: `Forecast issue date is after the law's effective date or the committed date.`,
        actionUrl: `/qdnb/${task.qdnbId}`,
        entityType: "revision",
        entityId: task.id,
        channels: ["in_app", "email"],
        recipient: task.leadUnitName,
        at: now,
      });
      events.push({
        kind: "late_risk",
        entityType: "revision",
        entityId: task.id,
        entityLabel: task.qdnbCode,
        message: `${task.qdnbCode} flagged as late-issuance risk`,
      });
    }

    if (daysLeft < 0) {
      for (const rule of overdueEscalations(
        db.escalationRules,
        "revision",
        -daysLeft,
        task.escalations,
      )) {
        const esc: EscalationRecord = {
          id: nextId("esc"),
          level: rule.level,
          to: rule.escalateTo,
          reason: "overdue",
          detail: `${rule.overdueDays} day(s) past the committed date`,
          at,
        };
        task.escalations.push(esc);
        pushNotification(db.notifications, {
          type: "escalation",
          title: `Escalated (level ${rule.level}): ${task.qdnbCode}`,
          description: `${task.qdnbTitle} — ${esc.detail}. Escalated to ${rule.escalateTo}.`,
          actionUrl: `/qdnb/${task.qdnbId}`,
          entityType: "revision",
          entityId: task.id,
          channels: rule.channels,
          recipient: rule.escalateTo,
          at: now,
        });
        recordAudit(db.auditLogs, {
          action: "escalate",
          module: "qdnb",
          object: task.qdnbCode,
          details: `Auto-escalated to ${rule.escalateTo} (${esc.detail})`,
          entityType: "revision",
          entityId: task.id,
          actor: SYSTEM_ACTOR,
          at: now,
        });
        events.push({
          kind: "escalation",
          entityType: "revision",
          entityId: task.id,
          entityLabel: task.qdnbCode,
          message: `${task.qdnbCode} escalated to ${rule.escalateTo}`,
        });
      }
    }
  }

  for (const issue of db.nccs) {
    if (issue.status !== "Open") continue;
    const daysLeft = daysUntil(issue.dueDate, now);
    const kind =
      daysLeft < 0
        ? `Overdue +${-daysLeft}`
        : daysLeft <= 1
          ? "T-1"
          : daysLeft <= 7
            ? "T-7"
            : null;
    if (kind && !issue.reminders.some((r) => r.kind === kind)) {
      issue.reminders.push({
        id: nextId("rem"),
        at,
        kind,
        to: `${issue.ownerUnitName}; ${issue.ownerName}`,
        channels: ["in_app", "email"],
      });
      pushNotification(db.notifications, {
        type: "deadline",
        title:
          daysLeft < 0
            ? `Issue overdue: ${issue.nccId}`
            : `Reminder (${kind}): ${issue.nccId}`,
        description:
          daysLeft < 0
            ? `${issue.title} is ${-daysLeft} day(s) overdue.`
            : `${issue.title} is due in ${daysLeft} day(s).`,
        actionUrl: `/ncc/${issue.id}`,
        entityType: "ncc",
        entityId: issue.id,
        channels: ["in_app", "email"],
        recipient: issue.ownerUnitName,
        at: now,
      });
      events.push({
        kind: daysLeft < 0 ? "overdue" : "reminder",
        entityType: "issue",
        entityId: issue.id,
        entityLabel: issue.nccId,
        message:
          daysLeft < 0
            ? `${issue.nccId} is overdue (${-daysLeft} days)`
            : `Reminder ${kind} sent to ${issue.ownerUnitName}`,
      });
    }
    if (daysLeft < 0) {
      for (const rule of overdueEscalations(
        db.escalationRules,
        "issue",
        -daysLeft,
        issue.escalations,
      )) {
        const esc: EscalationRecord = {
          id: nextId("esc"),
          level: rule.level,
          to: rule.escalateTo,
          reason: "overdue",
          detail: `${rule.overdueDays} day(s) past the due date`,
          at,
        };
        issue.escalations.push(esc);
        pushNotification(db.notifications, {
          type: "escalation",
          title: `Escalated (level ${rule.level}): ${issue.nccId}`,
          description: `${issue.title} — ${esc.detail}. Escalated to ${rule.escalateTo}.`,
          actionUrl: `/ncc/${issue.id}`,
          entityType: "ncc",
          entityId: issue.id,
          channels: rule.channels,
          recipient: rule.escalateTo,
          at: now,
        });
        recordAudit(db.auditLogs, {
          action: "escalate",
          module: "issues",
          object: issue.nccId,
          details: `Auto-escalated to ${rule.escalateTo} (${esc.detail})`,
          entityType: "ncc",
          entityId: issue.id,
          actor: SYSTEM_ACTOR,
          at: now,
        });
        events.push({
          kind: "escalation",
          entityType: "issue",
          entityId: issue.id,
          entityLabel: issue.nccId,
          message: `${issue.nccId} escalated to ${rule.escalateTo}`,
        });
      }
    }
  }

  return events;
}

/** Escalation triggered by the risk level when an issue is rated. */
export function applyRiskEscalation(
  issue: NonComplianceCase,
  rules: EscalationRule[],
  notifications: Notification[],
  auditLogs: AuditLog[],
): EscalationRecord | null {
  const rule = rules.find(
    (r) =>
      r.active &&
      r.trigger === "risk_level" &&
      r.riskLevel === issue.risk.finalLevel &&
      r.appliesTo.includes("issue"),
  );
  if (!rule || rule.level < 2) return null;
  if (
    issue.escalations.some(
      (e) => e.reason === "high_risk" && e.level >= rule.level,
    )
  )
    return null;
  const at = formatISO(demoNow());
  const esc: EscalationRecord = {
    id: nextId("esc"),
    level: rule.level,
    to: rule.escalateTo,
    reason: "high_risk",
    detail: `Rated ${issue.risk.finalLevel.toUpperCase()} (score ${issue.risk.weightedScore})`,
    at,
  };
  issue.escalations.push(esc);
  pushNotification(notifications, {
    type: "escalation",
    title:
      rule.level === 3
        ? `HIGH-risk issue escalated to BĐH & BKS: ${issue.nccId}`
        : `Issue escalated to Head of Compliance: ${issue.nccId}`,
    description: `${issue.title} — ${esc.detail}. Acknowledgement ${rule.requireAck ? "required" : "not required"} within ${rule.slaHours}h.`,
    actionUrl: `/ncc/${issue.id}`,
    entityType: "ncc",
    entityId: issue.id,
    channels: rule.channels,
    recipient: rule.escalateTo,
  });
  recordAudit(auditLogs, {
    action: "escalate",
    module: "issues",
    object: issue.nccId,
    details: `Auto-escalated to ${rule.escalateTo} (${esc.detail})`,
    entityType: "ncc",
    entityId: issue.id,
    actor: SYSTEM_ACTOR,
  });
  return esc;
}

// ---------------------------------------------------------------------------
// Seed history — meaningful notifications and audit entries
// ---------------------------------------------------------------------------

export function generateCmsNotifications(
  legalUpdates: LegalUpdate[],
  tasks: RevisionTask[],
  issues: NonComplianceCase[],
): Notification[] {
  const now = new Date();
  const list: Notification[] = [];
  const add = (input: NotifyInput & { read?: boolean }) => {
    const n = pushNotification(list, input);
    n.read = input.read ?? false;
  };
  // Oldest first so newest ends up on top.
  issues
    .filter((i) => i.escalations.some((e) => !e.acknowledgedAt))
    .slice(0, 4)
    .forEach((i, idx) => {
      const e = i.escalations.find((x) => !x.acknowledgedAt)!;
      add({
        type: "escalation",
        title: `Escalated (level ${e.level}): ${i.nccId}`,
        description: `${i.title} — ${e.detail}. Escalated to ${e.to}.`,
        actionUrl: `/ncc/${i.id}`,
        entityType: "ncc",
        entityId: i.id,
        channels: ["in_app", "email", "teams"],
        recipient: e.to,
        at: subDays(now, 6 - idx),
        read: idx > 1,
      });
    });
  tasks
    .filter((t) => t.status !== "issued")
    .forEach((t, idx) => {
      const r = t.reminders[t.reminders.length - 1];
      if (!r) return;
      add({
        type: "deadline",
        title: r.kind.startsWith("Overdue")
          ? `QĐNB revision overdue: ${t.qdnbCode}`
          : `Reminder (${r.kind}): ${t.qdnbCode}`,
        description: `${t.qdnbTitle} — lead unit ${t.leadUnitName}.`,
        actionUrl: `/qdnb/${t.qdnbId}`,
        entityType: "revision",
        entityId: t.id,
        channels: ["in_app", "email"],
        recipient: t.leadUnitName,
        at: subHours(now, 30 - idx * 3),
        read: idx > 3,
      });
    });
  add({
    type: "icis",
    title: "ICIS sync: 6 new findings from P.KTKSNB",
    description:
      "Kiểm tra định kỳ Q3/2026 (Cần Thơ, Đà Nẵng), chuyên đề AML (TP.HCM), off-site Khối Vận hành.",
    actionUrl: "/ncc/list?tab=icis",
    channels: ["in_app"],
    recipient: "Khối Tuân thủ",
    at: subHours(now, 15),
  });
  legalUpdates
    .filter((l) => l.status === "new")
    .forEach((l, idx) =>
      add({
        type: "legal_update",
        title: `New legal document: ${l.docNumber}`,
        description: l.title,
        actionUrl: `/legal-updates/${l.id}`,
        entityType: "legal_update",
        entityId: l.id,
        channels: ["in_app", "email"],
        recipient: "Khối Tuân thủ",
        at: subMinutes(now, 300 - idx * 40),
      }),
    );
  return list;
}

export function generateCmsAuditLogs(
  users: UserProfile[],
  legalUpdates: LegalUpdate[],
  tasks: RevisionTask[],
  issues: NonComplianceCase[],
): AuditLog[] {
  const logs: AuditLog[] = [];
  const byName = (name: string): Actor => {
    const u = users.find((x) => x.name === name);
    return { id: u?.id ?? name, name, role: u?.role ?? "" };
  };
  const hoa = byName("Lê Thị Hoa");
  const add = (input: AuditInput & { at: Date }) => recordAudit(logs, input);

  legalUpdates.forEach((l) => {
    add({
      action: "sync",
      module: "legal_updates",
      object: l.docNumber,
      details: `Received from ${l.sourceName}`,
      entityType: "legal_update",
      entityId: l.id,
      actor: SYSTEM_ACTOR,
      at: new Date(l.receivedAt),
    });
    if (l.applicability) {
      add({
        action: "update",
        module: "legal_updates",
        object: l.docNumber,
        details: `Marked ${l.applicability.decision === "applicable" ? "Applicable" : "Not applicable"}: ${l.applicability.reason}`,
        entityType: "legal_update",
        entityId: l.id,
        actor: hoa,
        changes: [
          {
            field: "status",
            before: "under_review",
            after: l.applicability.decision,
          },
        ],
        at: new Date(l.applicability.decidedAt),
      });
    }
    if (l.revisionTaskIds.length) {
      add({
        action: "assign",
        module: "legal_updates",
        object: l.docNumber,
        details: `Created ${l.revisionTaskIds.length} QĐNB revision task(s)`,
        entityType: "legal_update",
        entityId: l.id,
        actor: hoa,
        at: new Date(
          new Date(l.applicability?.decidedAt ?? l.receivedAt).getTime() +
            86400000,
        ),
      });
    }
  });
  tasks.forEach((t) => {
    add({
      action: "create",
      module: "qdnb",
      object: t.code,
      details: `Revision task for ${t.qdnbCode} assigned to ${t.leadUnitName}`,
      entityType: "revision",
      entityId: t.id,
      actor: hoa,
      at: new Date(t.createdAt),
    });
    t.escalations.forEach((e) =>
      add({
        action: "escalate",
        module: "qdnb",
        object: t.qdnbCode,
        details: `Auto-escalated to ${e.to} (${e.detail})`,
        entityType: "revision",
        entityId: t.id,
        actor: SYSTEM_ACTOR,
        at: new Date(e.at),
      }),
    );
    if (t.evidence) {
      add({
        action: "approve",
        module: "qdnb",
        object: t.qdnbCode,
        details: `Issued as ${t.evidence.decisionNo}; signed file ${t.evidence.fileName} attached`,
        entityType: "revision",
        entityId: t.id,
        actor: byName(t.ownerName),
        changes: [
          { field: "status", before: "pending_approval", after: "issued" },
        ],
        at: new Date(t.evidence.recordedAt),
      });
    }
  });
  issues.forEach((i) => {
    add({
      action: "create",
      module: "issues",
      object: i.nccId,
      details: `Issue recorded from ${i.source}${i.sourceRef ? ` (${i.sourceRef})` : ""}`,
      entityType: "ncc",
      entityId: i.id,
      actor: hoa,
      at: new Date(i.createdAt),
    });
    add({
      action: "update",
      module: "issues",
      object: i.nccId,
      details: `Risk rated ${i.risk.finalLevel.toUpperCase()} (score ${i.risk.weightedScore}, matrix v${i.risk.matrixVersion})${i.risk.overridden ? ` — overridden: ${i.risk.overrideReason}` : ""}`,
      entityType: "ncc",
      entityId: i.id,
      actor: hoa,
      at: new Date(i.risk.ratedAt),
    });
    i.escalations.forEach((e) => {
      add({
        action: "escalate",
        module: "issues",
        object: i.nccId,
        details: `Escalated to ${e.to} (${e.detail})`,
        entityType: "ncc",
        entityId: i.id,
        actor: SYSTEM_ACTOR,
        at: new Date(e.at),
      });
      if (e.acknowledgedAt)
        add({
          action: "acknowledge",
          module: "issues",
          object: i.nccId,
          details: `Escalation acknowledged by ${e.acknowledgedBy}`,
          entityType: "ncc",
          entityId: i.id,
          actor: byName(e.acknowledgedBy ?? ""),
          at: new Date(e.acknowledgedAt),
        });
    });
    i.workflow.rounds.forEach((r) => {
      add({
        action: "submit",
        module: "issues",
        object: i.nccId,
        details: `Evidence round ${r.round} submitted (${r.fileNames.join(", ")})`,
        entityType: "ncc",
        entityId: i.id,
        actor: byName(r.submittedBy),
        at: new Date(r.submittedAt),
      });
      if (r.decision && r.reviewedAt)
        add({
          action: r.decision === "accepted" ? "approve" : "return",
          module: "issues",
          object: i.nccId,
          details: `Evidence round ${r.round} ${r.decision}: ${r.reviewComment ?? ""}`,
          entityType: "ncc",
          entityId: i.id,
          actor: hoa,
          at: new Date(r.reviewedAt),
        });
    });
    if (i.workflow.approvedAt)
      add({
        action: "approve",
        module: "issues",
        object: i.nccId,
        details: `Closure approved by ${i.workflow.approvedBy}`,
        entityType: "ncc",
        entityId: i.id,
        actor: byName(i.workflow.approvedBy ?? ""),
        changes: [{ field: "status", before: "Open", after: "Closed" }],
        at: new Date(i.workflow.approvedAt),
      });
  });
  add({
    action: "settings_change",
    module: "risk_matrix",
    object: "Risk Rating Matrix v2",
    details: "Matrix v2 approved and activated (fine weight 35%, High ≥ 3.4)",
    entityType: "risk_matrix",
    entityId: "rm-v2",
    actor: byName("Nguyễn Văn Hùng"),
    at: subDays(new Date(), 120),
  });

  return logs;
}

// ---------------------------------------------------------------------------
// Generic audit for the original modules (CAP, obligations, assignments,
// regulations, admin, AI). Called by the mock transport for every mutating
// request so the audit trail covers the whole application (RFQ 5.4).
// ---------------------------------------------------------------------------

const AUDIT_PREFIXES: { prefix: string; module: string }[] = [
  { prefix: "/api/cap", module: "cap" },
  { prefix: "/api/obligations", module: "compliance" },
  { prefix: "/api/assignments", module: "assignment" },
  { prefix: "/api/regulation-dependencies", module: "regulation" },
  { prefix: "/api/regulations", module: "regulation" },
  { prefix: "/api/files", module: "files" },
  { prefix: "/api/admin", module: "admin" },
  { prefix: "/api/ai", module: "ai" },
];

export function auditMutation(
  logs: AuditLog[],
  method: string,
  pathname: string,
  status: number,
  body: unknown,
): void {
  if (method === "GET" || status >= 400) return;
  if (pathname.startsWith("/api/admin/audit-logs")) return;
  const match = AUDIT_PREFIXES.find((p) => pathname.startsWith(p.prefix));
  if (!match) return;
  const rec = (body && typeof body === "object" ? body : {}) as Record<
    string,
    unknown
  >;
  const label =
    (rec.capId as string) ??
    (rec.code as string) ??
    (rec.title as string) ??
    (rec.name as string) ??
    pathname.split("/").slice(2).join("/");
  const action: AuditLog["action"] =
    match.module === "ai"
      ? "ai_usage"
      : match.module === "admin"
        ? "settings_change"
        : method === "DELETE"
          ? "delete"
          : method === "POST" &&
              !/\/(acknowledge|cancel|archive)/.test(pathname)
            ? "create"
            : "update";
  recordAudit(logs, {
    action,
    module: match.module,
    object: String(label).slice(0, 80),
    details:
      action === "ai_usage"
        ? `AI request: ${pathname.replace("/api/ai/", "")}`
        : `${method} ${pathname.replace("/api/", "")}`,
    entityType: match.module,
    entityId: typeof rec.id === "string" ? rec.id : undefined,
  });
}
