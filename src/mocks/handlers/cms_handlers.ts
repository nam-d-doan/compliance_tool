import { http } from "msw";
import { addDays, formatISO, parseISO, subDays } from "date-fns";
import { getDb, findById } from "@/mocks/db";
import {
  getDelay,
  jsonResponse,
  notFound,
  badRequest,
  parseQuery,
  type MockResolverContext,
} from "./utils";
import {
  applyRiskEscalation,
  currentActor,
  pushNotification,
  recordAudit,
  runScheduler,
} from "@/mocks/cms-engine";
import { assessRisk } from "@/mocks/cms-seed";
import {
  ISSUE_SOURCE_LABELS,
  MAPPING_ACTION_SHORT,
  daysUntil,
  fineScoreFromAmount,
  getRevisionHealth,
  recurrenceScoreFromCount,
} from "@/lib/cms-rules";
import { demoNow } from "@/stores/demoClockStore";
import type {
  CmsOverview,
  EscalationRule,
  IcisFinding,
  IssueSource,
  LegalMapping,
  LegalUpdate,
  NonComplianceCase,
  Regulation,
  RevisionApprovalStep,
  RevisionTask,
  RiskLevel,
  RiskMatrix,
  RiskScores,
} from "@/types";

/**
 * Mock API for the CMS modules (Nam A Bank RFQ Phụ lục 1). Routes are
 * declared once in `cmsRoutes` and registered both as MSW handlers and in the
 * dev-mode direct-fetch router (`mocks/directApi.ts`).
 */

const nowIso = () => formatISO(demoNow());

async function body<T>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    return {} as T;
  }
}

function activeMatrix(): RiskMatrix {
  const db = getDb();
  return db.riskMatrices.find((m) => m.status === "active")!;
}

function unitName(id: string): string {
  const org = getDb().organizationSettings;
  return (
    org.hoDepartments.find((u) => u.id === id)?.name ??
    org.branches.find((b) => b.id === id)?.name ??
    id
  );
}

let codeSeq = 40;
const nextLegalCode = () =>
  `LU-${demoNow().getFullYear()}-${String(++codeSeq).padStart(3, "0")}`;
let revSeq = 20;
const nextRevisionCode = () =>
  `RV-${demoNow().getFullYear()}-${String(++revSeq).padStart(3, "0")}`;

// ---------------------------------------------------------------------------
// Overview & scheduler
// ---------------------------------------------------------------------------

export async function handleCmsOverview() {
  await getDelay(80, 160);
  const db = getDb();
  const now = demoNow();
  const open = db.nccs.filter((n) => n.status === "Open");
  const revs = db.revisionTasks;
  const overview: CmsOverview = {
    legalUpdates: {
      unread: db.legalUpdates.filter((l) => !l.read).length,
      awaitingReview: db.legalUpdates.filter((l) =>
        ["new", "under_review"].includes(l.status),
      ).length,
      total: db.legalUpdates.length,
    },
    revisions: {
      notStarted: revs.filter((r) => r.status === "not_started").length,
      inRevision: revs.filter((r) => r.status === "in_revision").length,
      pendingApproval: revs.filter((r) => r.status === "pending_approval")
        .length,
      issued: revs.filter((r) => r.status === "issued").length,
      overdue: revs.filter((r) => getRevisionHealth(r, now) === "overdue")
        .length,
      lateRisk: revs.filter((r) => getRevisionHealth(r, now) === "late_risk")
        .length,
    },
    issues: {
      open: open.length,
      high: open.filter((n) => n.risk.finalLevel === "high").length,
      medium: open.filter((n) => n.risk.finalLevel === "medium").length,
      low: open.filter((n) => n.risk.finalLevel === "low").length,
      escalationsAwaitingAck: [...db.nccs, ...revs].reduce(
        (s, x) =>
          s +
          x.escalations.filter((e) => e.level >= 2 && !e.acknowledgedAt).length,
        0,
      ),
      awaitingReview: open.filter((n) => n.workflow.stage === "review").length,
    },
    icis: {
      pending: db.icisFindings.filter((f) => f.status === "pending").length,
    },
  };
  return jsonResponse(overview);
}

export async function handleRunScheduler({ request }: MockResolverContext) {
  await getDelay(150, 300);
  const { offsetDays = 0 } = await body<{ offsetDays?: number }>(request);
  const db = getDb();
  const events = runScheduler(db);
  recordAudit(db.auditLogs, {
    action: "settings_change",
    module: "demo",
    object: "Demo clock",
    details: `Demo clock set to +${offsetDays} day(s); ${events.length} automatic event(s)`,
  });
  return jsonResponse({ now: nowIso(), offsetDays, events });
}

// ---------------------------------------------------------------------------
// Legal updates (Group 1)
// ---------------------------------------------------------------------------

export async function handleListLegalUpdates({ request }: MockResolverContext) {
  await getDelay(120, 260);
  const q = parseQuery(new URL(request.url));
  let items = [...getDb().legalUpdates];
  if (q.status) {
    const s = q.status.split(",");
    items = items.filter((l) => s.includes(l.status));
  }
  if (q.search) {
    const t = q.search.toLowerCase();
    items = items.filter((l) =>
      [l.docNumber, l.title, l.field, l.issuer, l.summary].some((v) =>
        v.toLowerCase().includes(t),
      ),
    );
  }
  items.sort((a, b) => b.receivedAt.localeCompare(a.receivedAt));
  return jsonResponse(items);
}

export async function handleGetLegalUpdate({ params }: MockResolverContext) {
  await getDelay(100, 200);
  const item = findById(getDb().legalUpdates, params.id as string);
  if (!item) return notFound("Legal update not found");
  return jsonResponse(item);
}

export async function handleSyncLegalFeed() {
  await getDelay(900, 1400);
  const db = getDb();
  const next = db.incomingLegalQueue.shift();
  if (!next) return jsonResponse({ added: [] as LegalUpdate[] });
  const at = nowIso();
  const item: LegalUpdate = {
    ...next,
    code: nextLegalCode(),
    receivedAt: at,
    createdAt: at,
    updatedAt: at,
  };
  db.legalUpdates.unshift(item);
  recordAudit(db.auditLogs, {
    action: "sync",
    module: "legal_updates",
    object: item.docNumber,
    details: `Received automatically from ${item.sourceName}; AI classified as ${item.field}, relevance ${item.relevance.toUpperCase()} (${item.relevanceScore}/100)`,
    entityType: "legal_update",
    entityId: item.id,
    actor: { id: "system", name: "CMS System", role: "system" },
  });
  pushNotification(db.notifications, {
    type: "legal_update",
    title: `New legal document: ${item.docNumber}`,
    description: item.title,
    actionUrl: `/legal-updates/${item.id}`,
    entityType: "legal_update",
    entityId: item.id,
    channels: ["in_app", "email", "teams"],
    recipient: "Khối Tuân thủ",
  });
  return jsonResponse({ added: [item] });
}

export async function handleMarkLegalRead({ params }: MockResolverContext) {
  await getDelay(50, 100);
  const item = findById(getDb().legalUpdates, params.id as string);
  if (!item) return notFound();
  item.read = true;
  return jsonResponse(item);
}

export async function handleLegalApplicability({
  params,
  request,
}: MockResolverContext) {
  await getDelay();
  const db = getDb();
  const item = findById(db.legalUpdates, params.id as string);
  if (!item) return notFound();
  const { decision, reason } = await body<{
    decision: "applicable" | "not_applicable" | "under_review";
    reason?: string;
  }>(request);
  const actor = currentActor();
  const before = item.status;
  if (decision === "under_review") {
    item.status = "under_review";
  } else {
    item.applicability = {
      decision,
      reason: reason ?? "",
      decidedBy: actor.name,
      decidedAt: nowIso(),
    };
    item.status = decision;
  }
  item.read = true;
  item.updatedAt = nowIso();
  recordAudit(db.auditLogs, {
    action: "update",
    module: "legal_updates",
    object: item.docNumber,
    details:
      decision === "under_review"
        ? "Review started"
        : `Marked ${decision === "applicable" ? "Applicable" : "Not applicable"}${reason ? `: ${reason}` : ""}`,
    entityType: "legal_update",
    entityId: item.id,
    changes: [{ field: "status", before, after: item.status }],
  });
  return jsonResponse(item);
}

export async function handleSaveMappings({
  params,
  request,
}: MockResolverContext) {
  await getDelay(150, 250);
  const db = getDb();
  const item = findById(db.legalUpdates, params.id as string);
  if (!item) return notFound();
  const { mappings, confirm } = await body<{
    mappings: LegalMapping[];
    confirm?: boolean;
  }>(request);
  item.mappings = mappings;
  item.updatedAt = nowIso();
  if (confirm) {
    const before = item.status;
    item.status = "mapped";
    const accepted = mappings.filter((m) => m.status === "accepted");
    recordAudit(db.auditLogs, {
      action: "update",
      module: "legal_updates",
      object: item.docNumber,
      details: `Legal mapping confirmed: ${accepted
        .map((m) => `${MAPPING_ACTION_SHORT[m.action]} ${m.qdnbCode}`)
        .join("; ")}`,
      entityType: "legal_update",
      entityId: item.id,
      changes: [{ field: "status", before, after: "mapped" }],
    });
  }
  return jsonResponse(item);
}

interface AssignInput {
  tasks: {
    mappingId: string;
    leadUnitId: string;
    supportUnitIds: string[];
    ownerName: string;
    committedDate: string;
  }[];
}

function defaultApprovalSteps(
  leadUnitName: string,
  level: "HĐQT" | "TGĐ",
): RevisionApprovalStep[] {
  return [
    {
      key: "draft",
      label: `Draft by lead unit (${leadUnitName})`,
      state: "pending",
    },
    {
      key: "compliance_review",
      label: "Compliance review (Khối Tuân thủ)",
      state: "pending",
    },
    {
      key: "approval",
      label: `Approval (${level === "HĐQT" ? "Hội đồng Quản trị" : "Tổng Giám đốc"})`,
      state: "pending",
    },
    { key: "issued", label: "Issued with proof", state: "pending" },
  ];
}

export async function handleAssignRevisions({
  params,
  request,
}: MockResolverContext) {
  await getDelay(300, 500);
  const db = getDb();
  const item = findById(db.legalUpdates, params.id as string);
  if (!item) return notFound();
  const { tasks } = await body<AssignInput>(request);
  if (!tasks?.length) return badRequest("No tasks to create");
  const created: RevisionTask[] = [];
  for (const t of tasks) {
    const m = item.mappings.find((x) => x.id === t.mappingId);
    if (!m) continue;
    const qdnb = m.qdnbId
      ? db.internalRegulations.find((q) => q.id === m.qdnbId)
      : undefined;
    // One active revision per QĐNB: merge the new law into it.
    const existing = qdnb?.activeRevisionId
      ? db.revisionTasks.find((r) => r.id === qdnb.activeRevisionId)
      : undefined;
    if (existing && existing.status !== "issued") {
      existing.sources.push({
        legalUpdateId: item.id,
        docNumber: item.docNumber,
        title: item.title,
        effectiveDate: item.effectiveDate,
      });
      if (item.effectiveDate < existing.lawEffectiveDate)
        existing.lawEffectiveDate = item.effectiveDate;
      item.revisionTaskIds.push(existing.id);
      created.push(existing);
      continue;
    }
    const leadUnitName = unitName(t.leadUnitId);
    const at = nowIso();
    const task: RevisionTask = {
      id: `rv-${crypto.randomUUID().slice(0, 8)}`,
      code: nextRevisionCode(),
      qdnbId: qdnb?.id,
      qdnbCode: m.qdnbCode,
      qdnbTitle: m.qdnbTitle,
      action: m.action,
      sources: [
        {
          legalUpdateId: item.id,
          docNumber: item.docNumber,
          title: item.title,
          effectiveDate: item.effectiveDate,
        },
      ],
      lawEffectiveDate: item.effectiveDate,
      leadUnitId: t.leadUnitId,
      leadUnitName,
      supportUnitIds: t.supportUnitIds,
      supportUnitNames: t.supportUnitIds.map(unitName),
      ownerName: t.ownerName,
      committedDate: t.committedDate,
      expectedIssueDate: t.committedDate,
      status: "not_started",
      progress: 0,
      approvalSteps: defaultApprovalSteps(
        leadUnitName,
        qdnb?.issuingLevel ?? "TGĐ",
      ),
      reminders: [],
      escalations: [],
      createdAt: at,
      updatedAt: at,
    };
    db.revisionTasks.unshift(task);
    if (qdnb) qdnb.activeRevisionId = task.id;
    item.revisionTaskIds.push(task.id);
    created.push(task);
    pushNotification(db.notifications, {
      type: "deadline",
      title: `New QĐNB revision assigned: ${task.qdnbCode}`,
      description: `${MAPPING_ACTION_SHORT[task.action]} "${task.qdnbTitle}" because of ${item.docNumber}. Lead: ${leadUnitName}. Deadline ${parseISO(task.committedDate).toLocaleDateString("vi-VN")}.`,
      actionUrl: task.qdnbId ? `/qdnb/${task.qdnbId}` : "/qdnb",
      entityType: "revision",
      entityId: task.id,
      channels: ["in_app", "email", "teams"],
      recipient: [leadUnitName, ...task.supportUnitNames].join(", "),
    });
    recordAudit(db.auditLogs, {
      action: "assign",
      module: "qdnb",
      object: task.code,
      details: `${MAPPING_ACTION_SHORT[task.action]} ${task.qdnbCode} — lead ${leadUnitName}${task.supportUnitNames.length ? `, support ${task.supportUnitNames.join(", ")}` : ""}`,
      entityType: "revision",
      entityId: task.id,
    });
  }
  const before = item.status;
  item.status = "assigned";
  item.updatedAt = nowIso();
  recordAudit(db.auditLogs, {
    action: "assign",
    module: "legal_updates",
    object: item.docNumber,
    details: `Created ${created.length} QĐNB revision task(s)`,
    entityType: "legal_update",
    entityId: item.id,
    changes: [{ field: "status", before, after: "assigned" }],
  });
  return jsonResponse({ legalUpdate: item, tasks: created });
}

/** Simulated OCR: turns an uploaded scan into a structured legal update. */
export async function handleOcrLegalDocument({ request }: MockResolverContext) {
  await getDelay(1500, 2200);
  const db = getDb();
  const { fileName } = await body<{ fileName: string }>(request);
  const at = nowIso();
  const now = demoNow();
  const item: LegalUpdate = {
    id: `lu-ocr-${crypto.randomUUID().slice(0, 6)}`,
    code: nextLegalCode(),
    docNumber: "35/2026/TT-NHNN",
    title:
      "Thông tư quy định về hoạt động cung ứng dịch vụ ngân hàng số và quản lý rủi ro gian lận trực tuyến",
    docType: "Thông tư",
    issuer: "NHNN",
    issueDate: formatISO(subDays(now, 3)),
    effectiveDate: formatISO(addDays(now, 50)),
    receivedAt: at,
    channel: "ocr",
    sourceName: `OCR upload – ${fileName}`,
    field: "Ngân hàng số",
    relevance: "high",
    relevanceScore: 87,
    relevanceReason:
      "Digital banking and online fraud controls apply to the Nam A Bank app and internet banking.",
    summary:
      "Yêu cầu giám sát giao dịch gian lận theo thời gian thực, giới hạn giao dịch trên thiết bị mới và chia sẻ dữ liệu tài khoản nghi ngờ với SIMO.",
    aiSummary: {
      keyChanges: [
        "Real-time fraud monitoring for online transfers — Điều 8",
        "Transfer limit of 10 million VND in the first 24h on a new device — Điều 11",
        "Suspicious accounts shared with the SIMO database within 2 hours — Điều 15",
      ],
      affectedUnits: [
        "Khối Công nghệ thông tin",
        "Khối Vận hành",
        "Khối Phòng chống Rửa tiền",
      ],
      affectedProducts: ["Ứng dụng Nam A Bank", "Internet Banking"],
      suggestedDeadline: formatISO(addDays(now, 35)),
      confidence: 82,
      impactNote:
        "Extracted by OCR (3 pages, 98% character confidence). Two internal regulations likely affected.",
    },
    articles: [
      {
        id: "ocr-8",
        number: "Điều 8",
        title: "Giám sát giao dịch",
        content:
          "Tổ chức tín dụng giám sát giao dịch trực tuyến theo thời gian thực để phát hiện dấu hiệu gian lận.",
      },
      {
        id: "ocr-11",
        number: "Điều 11",
        title: "Giới hạn trên thiết bị mới",
        content:
          "Trong 24 giờ đầu đăng nhập trên thiết bị mới, tổng hạn mức chuyển tiền không vượt quá 10 triệu đồng.",
      },
      {
        id: "ocr-15",
        number: "Điều 15",
        title: "Chia sẻ dữ liệu SIMO",
        content:
          "Tài khoản nghi ngờ gian lận được cập nhật lên hệ thống SIMO trong vòng 2 giờ.",
      },
    ],
    relations: [
      {
        type: "guided_by",
        docNumber: "32/2024/QH15",
        title: "Luật Các tổ chức tín dụng 2024",
      },
    ],
    status: "new",
    read: false,
    mappings: [
      {
        id: "m-ocr-1",
        qdnbId: "qd-biometric",
        qdnbCode: "QĐ 1410/2025/QĐ-TGĐ",
        qdnbTitle: "Quy trình xác thực sinh trắc học trong giao dịch điện tử",
        lawArticles: ["Điều 11"],
        qdnbArticles: "Mục 4",
        action: "amend",
        origin: "ai",
        confidence: 83,
        reason:
          "New-device transfer limit must be enforced after biometric login.",
        status: "suggested",
        leadUnitId: "dept-it",
      },
      {
        id: "m-ocr-2",
        qdnbId: "qd-aml",
        qdnbCode: "QĐ 0306/2024/QĐ-HĐQT",
        qdnbTitle: "Quy định nội bộ về phòng, chống rửa tiền",
        lawArticles: ["Điều 15"],
        qdnbArticles: "Điều 24",
        action: "supplement",
        origin: "ai",
        confidence: 76,
        reason: "Add the SIMO reporting duty to the AML regulation.",
        status: "suggested",
        leadUnitId: "dept-aml",
      },
    ],
    revisionTaskIds: [],
    createdAt: at,
    updatedAt: at,
  };
  db.legalUpdates.unshift(item);
  recordAudit(db.auditLogs, {
    action: "ai_usage",
    module: "legal_updates",
    object: item.docNumber,
    details: `OCR + AI extraction from ${fileName}: ${item.articles.length} articles, ${item.mappings.length} mapping suggestions`,
    entityType: "legal_update",
    entityId: item.id,
  });
  return jsonResponse(item);
}

export async function handleImportLegalToLibrary({
  params,
}: MockResolverContext) {
  await getDelay();
  const db = getDb();
  const item = findById(db.legalUpdates, params.id as string);
  if (!item) return notFound();
  if (item.regulationId) return jsonResponse(item);
  const at = nowIso();
  const reg: Regulation = {
    id: `reg-${item.id}`,
    title: `${item.docType} ${item.docNumber} — ${item.title}`,
    description: item.summary,
    category: item.field,
    regulatoryBody:
      item.issuer === "NHNN"
        ? "Ngân hàng Nhà nước Việt Nam (SBV)"
        : item.issuer,
    issueDate: item.issueDate,
    effectiveDate: item.effectiveDate,
    status: "Effective",
    priority: item.relevance,
    source: "external",
    articles: item.articles.map((a) => ({
      id: `${item.id}-${a.id}`,
      number: a.number.replace("Điều ", ""),
      title: a.title,
      summary: a.content,
      effectiveDate: item.effectiveDate,
      status: "active" as const,
    })),
    createdDate: at,
    updatedDate: at,
  };
  db.regulations.unshift(reg);
  item.regulationId = reg.id;
  recordAudit(db.auditLogs, {
    action: "create",
    module: "regulation",
    object: item.docNumber,
    details: "Added to the Regulation Library from Legal Updates",
    entityType: "legal_update",
    entityId: item.id,
  });
  return jsonResponse(item);
}

// ---------------------------------------------------------------------------
// Internal regulations & revisions (Group 2)
// ---------------------------------------------------------------------------

export async function handleListQdnb() {
  await getDelay(120, 240);
  return jsonResponse(getDb().internalRegulations);
}

export async function handleGetQdnb({ params }: MockResolverContext) {
  await getDelay(100, 200);
  const db = getDb();
  const reg = findById(db.internalRegulations, params.id as string);
  if (!reg) return notFound("Internal regulation not found");
  const revisions = db.revisionTasks.filter((r) => r.qdnbId === reg.id);
  const legalUpdates = db.legalUpdates.filter((l) =>
    l.mappings.some((m) => m.qdnbId === reg.id && m.status !== "rejected"),
  );
  return jsonResponse({ regulation: reg, revisions, legalUpdates });
}

export async function handleListRevisions() {
  await getDelay(120, 240);
  return jsonResponse(getDb().revisionTasks);
}

export async function handleUpdateRevision({
  params,
  request,
}: MockResolverContext) {
  await getDelay();
  const db = getDb();
  const task = findById(db.revisionTasks, params.id as string);
  if (!task) return notFound();
  const patch =
    await body<
      Partial<
        Pick<
          RevisionTask,
          "progress" | "expectedIssueDate" | "committedDate" | "ownerName"
        >
      >
    >(request);
  const changes = (Object.keys(patch) as (keyof typeof patch)[]).map((k) => ({
    field: k,
    before: String(task[k] ?? ""),
    after: String(patch[k] ?? ""),
  }));
  Object.assign(task, patch);
  task.updatedAt = nowIso();
  recordAudit(db.auditLogs, {
    action: "update",
    module: "qdnb",
    object: task.qdnbCode,
    details: `Revision ${task.code} updated`,
    entityType: "revision",
    entityId: task.id,
    changes,
  });
  return jsonResponse(task);
}

export async function handleAdvanceRevision({
  params,
  request,
}: MockResolverContext) {
  await getDelay();
  const db = getDb();
  const task = findById(db.revisionTasks, params.id as string);
  if (!task) return notFound();
  const { action, comment } = await body<{
    action: "start" | "submit" | "approve" | "return";
    comment?: string;
  }>(request);
  const actor = currentActor();
  const at = nowIso();
  const before = task.status;
  const step = (key: RevisionApprovalStep["key"]) =>
    task.approvalSteps.find((s) => s.key === key)!;
  switch (action) {
    case "start":
      task.status = "in_revision";
      task.progress = Math.max(task.progress, 10);
      step("draft").state = "current";
      break;
    case "submit":
      task.status = "pending_approval";
      task.progress = Math.max(task.progress, 80);
      Object.assign(step("draft"), {
        state: "done",
        by: actor.name,
        at,
        comment,
      });
      step("compliance_review").state = "current";
      break;
    case "approve": {
      const review = step("compliance_review");
      if (review.state !== "done") {
        Object.assign(review, { state: "done", by: actor.name, at, comment });
        step("approval").state = "current";
        task.progress = Math.max(task.progress, 90);
      } else {
        Object.assign(step("approval"), {
          state: "done",
          by: actor.name,
          at,
          comment,
        });
        step("issued").state = "current";
        task.progress = 95;
      }
      break;
    }
    case "return":
      task.status = "in_revision";
      task.progress = Math.min(task.progress, 60);
      Object.assign(step("draft"), {
        state: "returned",
        comment,
        at,
        by: actor.name,
      });
      step("compliance_review").state = "pending";
      step("approval").state = "pending";
      break;
  }
  task.updatedAt = at;
  recordAudit(db.auditLogs, {
    action:
      action === "approve"
        ? "approve"
        : action === "return"
          ? "return"
          : action === "submit"
            ? "submit"
            : "update",
    module: "qdnb",
    object: task.qdnbCode,
    details: `${action === "start" ? "Revision started" : action === "submit" ? "Draft submitted for review" : action === "approve" ? "Approved" : "Returned for changes"}${comment ? `: ${comment}` : ""}`,
    entityType: "revision",
    entityId: task.id,
    changes:
      before !== task.status
        ? [{ field: "status", before, after: task.status }]
        : undefined,
  });
  return jsonResponse(task);
}

export async function handleIssueRevision({
  params,
  request,
}: MockResolverContext) {
  await getDelay(300, 500);
  const db = getDb();
  const task = findById(db.revisionTasks, params.id as string);
  if (!task) return notFound();
  const input = await body<{
    decisionNo: string;
    issueDate: string;
    effectiveDate: string;
    fileName: string;
    note?: string;
  }>(request);
  if (!input.decisionNo || !input.fileName)
    return badRequest("Decision number and signed file are required");
  const actor = currentActor();
  const at = nowIso();
  const before = task.status;
  task.status = "issued";
  task.progress = 100;
  task.issuedAt = input.issueDate;
  task.evidence = { ...input, recordedBy: actor.name, recordedAt: at };
  task.approvalSteps.forEach((s) => {
    if (s.state !== "done")
      Object.assign(s, { state: "done", at, by: s.by ?? actor.name });
  });
  task.updatedAt = at;
  const qdnb = task.qdnbId
    ? db.internalRegulations.find((q) => q.id === task.qdnbId)
    : undefined;
  if (qdnb) {
    const last = qdnb.versions[qdnb.versions.length - 1];
    qdnb.versions.push({
      version: last.version + 1,
      decisionNo: input.decisionNo,
      issuedAt: input.issueDate,
      effectiveAt: input.effectiveDate,
      changeSummary: `${MAPPING_ACTION_SHORT[task.action]} theo ${task.sources.map((s) => s.docNumber).join(", ")}`,
      articles:
        qdnb.draftArticles ??
        last.articles.map((a, i) =>
          i === 0
            ? {
                ...a,
                content: `${a.content} (Cập nhật theo ${task.sources[0].docNumber}.)`,
              }
            : a,
        ),
    });
    qdnb.draftArticles = undefined;
    qdnb.currentVersion = last.version + 1;
    qdnb.code = input.decisionNo;
    qdnb.activeRevisionId = undefined;
    qdnb.updatedAt = at;
    for (const s of task.sources)
      if (!qdnb.basedOn.includes(s.docNumber)) qdnb.basedOn.push(s.docNumber);
  }
  // Close the legal update when all its revisions are issued.
  for (const s of task.sources) {
    const lu = s.legalUpdateId
      ? db.legalUpdates.find((l) => l.id === s.legalUpdateId)
      : undefined;
    if (
      lu &&
      lu.revisionTaskIds.every(
        (id) => db.revisionTasks.find((r) => r.id === id)?.status === "issued",
      )
    ) {
      lu.status = "completed";
    }
  }
  pushNotification(db.notifications, {
    type: "approval",
    title: `QĐNB issued: ${input.decisionNo}`,
    description: `${task.qdnbTitle} issued ${daysUntil(task.lawEffectiveDate, parseISO(input.issueDate)) >= 0 ? "before" : "after"} the law's effective date.`,
    actionUrl: task.qdnbId ? `/qdnb/${task.qdnbId}` : "/qdnb",
    entityType: "revision",
    entityId: task.id,
    channels: ["in_app", "email"],
    recipient: "Khối Tuân thủ",
  });
  recordAudit(db.auditLogs, {
    action: "approve",
    module: "qdnb",
    object: task.qdnbCode,
    details: `Issued as ${input.decisionNo}; signed file ${input.fileName} attached as proof of completion`,
    entityType: "revision",
    entityId: task.id,
    changes: [{ field: "status", before, after: "issued" }],
  });
  return jsonResponse(task);
}

export async function handleAcknowledgeEscalation({
  request,
}: MockResolverContext) {
  await getDelay();
  const db = getDb();
  const { entityType, entityId, escalationId } = await body<{
    entityType: "ncc" | "revision";
    entityId: string;
    escalationId: string;
  }>(request);
  const entity =
    entityType === "ncc"
      ? findById(db.nccs, entityId)
      : findById(db.revisionTasks, entityId);
  if (!entity) return notFound();
  const esc = entity.escalations.find((e) => e.id === escalationId);
  if (!esc) return notFound("Escalation not found");
  const actor = currentActor();
  esc.acknowledgedBy = actor.name;
  esc.acknowledgedAt = nowIso();
  recordAudit(db.auditLogs, {
    action: "acknowledge",
    module: entityType === "ncc" ? "issues" : "qdnb",
    object: "nccId" in entity ? entity.nccId : entity.qdnbCode,
    details: `Escalation (level ${esc.level}, ${esc.to}) acknowledged`,
    entityType,
    entityId,
  });
  return jsonResponse(entity);
}

// ---------------------------------------------------------------------------
// ICIS intake (Group 3)
// ---------------------------------------------------------------------------

export async function handleListIcis() {
  await getDelay(120, 240);
  const items = [...getDb().icisFindings].sort((a, b) =>
    b.receivedAt.localeCompare(a.receivedAt),
  );
  return jsonResponse(items);
}

export async function handleSyncIcis() {
  await getDelay(900, 1400);
  const db = getDb();
  const added: IcisFinding[] = [];
  const at = nowIso();
  while (db.incomingIcisQueue.length) {
    const f = db.incomingIcisQueue.shift()!;
    const item = { ...f, receivedAt: at, createdAt: at, updatedAt: at };
    db.icisFindings.unshift(item);
    added.push(item);
  }
  if (added.length) {
    pushNotification(db.notifications, {
      type: "icis",
      title: `ICIS sync: ${added.length} new finding(s) from P.KTKSNB`,
      description: added.map((a) => `${a.code} – ${a.unitName}`).join("; "),
      actionUrl: "/ncc/list?tab=icis",
      channels: ["in_app"],
      recipient: "Khối Tuân thủ",
    });
  }
  recordAudit(db.auditLogs, {
    action: "sync",
    module: "icis",
    object: "ICIS connector",
    details: `Synchronised with ICIS: ${added.length} new finding(s)`,
    actor: { id: "system", name: "CMS System", role: "system" },
  });
  return jsonResponse({ added });
}

function suggestedScoresForFinding(f: IcisFinding): RiskScores {
  const db = getDb();
  const repeat =
    db.nccs.filter(
      (n) => n.ownerUnitId === f.unitId && n.category === f.category,
    ).length + 1;
  const reputationBySeverity: Record<RiskLevel, number> = {
    low: 1,
    medium: 2,
    high: 4,
  };
  return {
    fine: fineScoreFromAmount(f.finePotential),
    reputation: reputationBySeverity[f.severityHint],
    scope: f.scopeHint ?? (f.unitId.startsWith("branch") ? 2 : 3),
    recurrence: recurrenceScoreFromCount(repeat),
  };
}

export async function handleIcisSuggestion({ params }: MockResolverContext) {
  await getDelay(300, 500);
  const db = getDb();
  const f = findById(db.icisFindings, params.id as string);
  if (!f) return notFound();
  const scores = suggestedScoresForFinding(f);
  const repeatCount =
    db.nccs.filter(
      (n) => n.ownerUnitId === f.unitId && n.category === f.category,
    ).length + 1;
  const similar = db.nccs
    .filter(
      (n) =>
        n.status === "Open" &&
        n.ownerUnitId === f.unitId &&
        n.category === f.category,
    )
    .map((n) => ({ id: n.id, nccId: n.nccId, title: n.title }));
  return jsonResponse({ scores, repeatCount, similar });
}

function createIssue(input: {
  title: string;
  description: string;
  category: string;
  source: IssueSource;
  sourceRef?: string;
  regulationRef?: string;
  unitId: string;
  ownerId: string;
  ownerName: string;
  dueDate: string;
  scores: RiskScores;
  overrideLevel?: RiskLevel;
  overrideReason?: string;
  icisFindingId?: string;
  tags?: string[];
  linkedDocs?: string;
  fileIds?: string[];
}): NonComplianceCase {
  const db = getDb();
  const org = db.organizationSettings;
  const branch = org.branches.find((b) => b.id === input.unitId);
  const actor = currentActor();
  const at = nowIso();
  const matrix = activeMatrix();
  const risk = assessRisk(
    input.scores,
    matrix,
    actor.name,
    at,
    input.overrideLevel
      ? { level: input.overrideLevel, reason: input.overrideReason ?? "" }
      : undefined,
  );
  const repeatCount =
    db.nccs.filter(
      (n) => n.ownerUnitId === input.unitId && n.category === input.category,
    ).length + 1;
  const issue: NonComplianceCase = {
    id: `ncc-${crypto.randomUUID().slice(0, 8)}`,
    nccId: `NCC-${demoNow().getFullYear()}-${String(db.nccs.length + 1).padStart(3, "0")}`,
    title: input.title,
    description: input.description,
    severity: risk.finalLevel,
    ownerUnitId: input.unitId,
    ownerUnitName: unitName(input.unitId),
    ownerUnitType: branch ? "branch" : "ho_department",
    ownerUnitRegion: branch?.region,
    ownerId: input.ownerId,
    ownerName: input.ownerName,
    dueDate: input.dueDate,
    status: "Open",
    fileIds: input.fileIds ?? [],
    linkedDocs: input.linkedDocs ?? input.sourceRef,
    tags: input.tags ?? [],
    source: input.source,
    sourceRef: input.sourceRef,
    category: input.category,
    regulationRef: input.regulationRef,
    icisFindingId: input.icisFindingId,
    repeatCount,
    risk,
    escalations: [],
    reminders: [],
    workflow: { stage: "check", rounds: [] },
    createdAt: at,
    updatedAt: at,
  };
  db.nccs.unshift(issue);
  recordAudit(db.auditLogs, {
    action: "create",
    module: "issues",
    object: issue.nccId,
    details: `Issue recorded from ${ISSUE_SOURCE_LABELS[issue.source]}${issue.sourceRef ? ` (${issue.sourceRef})` : ""}`,
    entityType: "ncc",
    entityId: issue.id,
  });
  recordAudit(db.auditLogs, {
    action: risk.overridden ? "override" : "update",
    module: "issues",
    object: issue.nccId,
    details: `Risk rated ${risk.finalLevel.toUpperCase()} (score ${risk.weightedScore}, matrix v${risk.matrixVersion})${risk.overridden ? ` — suggested ${risk.suggestedLevel.toUpperCase()}, overridden: ${risk.overrideReason}` : ""}`,
    entityType: "ncc",
    entityId: issue.id,
  });
  applyRiskEscalation(
    issue,
    db.escalationRules,
    db.notifications,
    db.auditLogs,
  );
  return issue;
}

export { createIssue };

export async function handleAcceptIcis({
  params,
  request,
}: MockResolverContext) {
  await getDelay(300, 500);
  const db = getDb();
  const f = findById(db.icisFindings, params.id as string);
  if (!f) return notFound();
  const input = await body<{
    ownerId: string;
    ownerName: string;
    dueDate: string;
    scores?: RiskScores;
    overrideLevel?: RiskLevel;
    overrideReason?: string;
  }>(request);
  const issue = createIssue({
    title: `${f.category} – ${f.unitName}`,
    description: `${f.description}\n\nKiến nghị của P.KTKSNB: ${f.recommendation}`,
    category: f.category,
    source: "icis",
    sourceRef: f.code,
    unitId: f.unitId,
    ownerId: input.ownerId,
    ownerName: input.ownerName,
    dueDate: input.dueDate,
    scores: input.scores ?? suggestedScoresForFinding(f),
    overrideLevel: input.overrideLevel,
    overrideReason: input.overrideReason,
    icisFindingId: f.id,
    tags: ["ICIS", f.auditRound.split("–")[0].trim()],
  });
  f.status = "accepted";
  f.issueId = issue.id;
  f.updatedAt = nowIso();
  recordAudit(db.auditLogs, {
    action: "approve",
    module: "icis",
    object: f.code,
    details: `Accepted as compliance issue ${issue.nccId}`,
    entityType: "icis",
    entityId: f.id,
  });
  return jsonResponse({ finding: f, issue });
}

export async function handleMergeIcis({
  params,
  request,
}: MockResolverContext) {
  await getDelay();
  const db = getDb();
  const f = findById(db.icisFindings, params.id as string);
  if (!f) return notFound();
  const { issueId } = await body<{ issueId: string }>(request);
  const issue = findById(db.nccs, issueId);
  if (!issue) return notFound("Issue not found");
  f.status = "merged";
  f.issueId = issue.id;
  f.resolutionNote = `Merged into ${issue.nccId}`;
  issue.repeatCount += 1;
  issue.description += `\n\n+ ${f.code}: ${f.description}`;
  issue.updatedAt = nowIso();
  recordAudit(db.auditLogs, {
    action: "update",
    module: "icis",
    object: f.code,
    details: `Merged into existing issue ${issue.nccId} (repeat count now ${issue.repeatCount})`,
    entityType: "icis",
    entityId: f.id,
  });
  recordAudit(db.auditLogs, {
    action: "update",
    module: "issues",
    object: issue.nccId,
    details: `ICIS finding ${f.code} merged into this issue`,
    entityType: "ncc",
    entityId: issue.id,
  });
  return jsonResponse({ finding: f, issue });
}

export async function handleRejectIcis({
  params,
  request,
}: MockResolverContext) {
  await getDelay();
  const db = getDb();
  const f = findById(db.icisFindings, params.id as string);
  if (!f) return notFound();
  const { reason } = await body<{ reason: string }>(request);
  f.status = "rejected";
  f.resolutionNote = reason;
  recordAudit(db.auditLogs, {
    action: "return",
    module: "icis",
    object: f.code,
    details: `Rejected: ${reason}`,
    entityType: "icis",
    entityId: f.id,
  });
  return jsonResponse(f);
}

// ---------------------------------------------------------------------------
// Issues: rating and evidence workflow (Groups 3 & 4)
// ---------------------------------------------------------------------------

export async function handleRateIssue({
  params,
  request,
}: MockResolverContext) {
  await getDelay();
  const db = getDb();
  const issue = findById(db.nccs, params.id as string);
  if (!issue) return notFound();
  const input = await body<{
    scores: RiskScores;
    overrideLevel?: RiskLevel;
    overrideReason?: string;
  }>(request);
  const actor = currentActor();
  const before = issue.risk.finalLevel;
  issue.risk = assessRisk(
    input.scores,
    activeMatrix(),
    actor.name,
    nowIso(),
    input.overrideLevel
      ? { level: input.overrideLevel, reason: input.overrideReason ?? "" }
      : undefined,
  );
  issue.severity = issue.risk.finalLevel;
  issue.updatedAt = nowIso();
  recordAudit(db.auditLogs, {
    action: issue.risk.overridden ? "override" : "update",
    module: "issues",
    object: issue.nccId,
    details: `Risk re-rated ${issue.risk.finalLevel.toUpperCase()} (score ${issue.risk.weightedScore})${issue.risk.overridden ? ` — suggested ${issue.risk.suggestedLevel.toUpperCase()}, overridden: ${issue.risk.overrideReason}` : ""}`,
    entityType: "ncc",
    entityId: issue.id,
    changes: [{ field: "risk", before, after: issue.risk.finalLevel }],
  });
  applyRiskEscalation(
    issue,
    db.escalationRules,
    db.notifications,
    db.auditLogs,
  );
  return jsonResponse(issue);
}

export async function handleIssueWorkflow({
  params,
  request,
}: MockResolverContext) {
  await getDelay(200, 400);
  const db = getDb();
  const issue = findById(db.nccs, params.id as string);
  if (!issue) return notFound();
  const input = await body<{
    action: "check" | "submit" | "accept" | "return" | "approve" | "reopen";
    note?: string;
    fileNames?: string[];
    comment?: string;
    resolution?: string;
  }>(request);
  const actor = currentActor();
  const at = nowIso();
  const wf = issue.workflow;
  const beforeStage = wf.stage;
  let details = "";
  switch (input.action) {
    case "check":
      wf.stage = "evidence";
      wf.checkNote = input.note;
      wf.checkedBy = actor.name;
      wf.checkedAt = at;
      details = `Finding checked with the unit${input.note ? `: ${input.note}` : ""}`;
      break;
    case "submit":
      wf.rounds.push({
        id: `${issue.id}-round-${wf.rounds.length + 1}`,
        round: wf.rounds.length + 1,
        submittedBy: actor.name,
        submittedAt: at,
        fileNames: input.fileNames ?? [],
        note: input.note ?? "",
      });
      wf.stage = "review";
      details = `Evidence round ${wf.rounds.length} submitted (${(input.fileNames ?? []).join(", ") || "no files"})`;
      pushNotification(db.notifications, {
        type: "approval",
        title: `Evidence submitted: ${issue.nccId}`,
        description: `${issue.ownerUnitName} submitted evidence round ${wf.rounds.length} for review.`,
        actionUrl: `/ncc/${issue.id}`,
        entityType: "ncc",
        entityId: issue.id,
        channels: ["in_app", "email"],
        recipient: "Khối Tuân thủ",
      });
      break;
    case "accept":
    case "return": {
      const r = wf.rounds[wf.rounds.length - 1];
      if (!r) return badRequest("No evidence to review");
      r.decision = input.action === "accept" ? "accepted" : "returned";
      r.reviewer = actor.name;
      r.reviewedAt = at;
      r.reviewComment = input.comment;
      wf.stage = input.action === "accept" ? "approval" : "evidence";
      details = `Evidence round ${r.round} ${r.decision}${input.comment ? `: ${input.comment}` : ""}`;
      if (input.action === "return")
        pushNotification(db.notifications, {
          type: "deadline",
          title: `Evidence returned: ${issue.nccId}`,
          description: `Compliance returned round ${r.round}: ${input.comment ?? ""}`,
          actionUrl: `/ncc/${issue.id}`,
          entityType: "ncc",
          entityId: issue.id,
          channels: ["in_app", "email"],
          recipient: issue.ownerUnitName,
        });
      break;
    }
    case "approve":
      wf.stage = "closed";
      wf.approvedBy = actor.name;
      wf.approvedAt = at;
      issue.status = "Closed";
      issue.closedAt = at;
      issue.resolution = input.resolution ?? input.comment;
      details = `Closure approved${issue.resolution ? `: ${issue.resolution}` : ""}`;
      break;
    case "reopen":
      wf.stage = "evidence";
      issue.status = "Open";
      issue.closedAt = undefined;
      details = "Issue reopened";
      break;
  }
  issue.updatedAt = at;
  recordAudit(db.auditLogs, {
    action:
      input.action === "submit"
        ? "submit"
        : input.action === "return"
          ? "return"
          : input.action === "accept" || input.action === "approve"
            ? "approve"
            : "update",
    module: "issues",
    object: issue.nccId,
    details,
    entityType: "ncc",
    entityId: issue.id,
    changes:
      beforeStage !== wf.stage
        ? [{ field: "stage", before: beforeStage, after: wf.stage }]
        : undefined,
  });
  return jsonResponse(issue);
}

// ---------------------------------------------------------------------------
// Risk matrix & escalation rules (Group 4)
// ---------------------------------------------------------------------------

export async function handleListRiskMatrices() {
  await getDelay(100, 200);
  return jsonResponse(
    [...getDb().riskMatrices].sort((a, b) => b.version - a.version),
  );
}

export async function handleSaveRiskMatrix({ request }: MockResolverContext) {
  await getDelay(300, 500);
  const db = getDb();
  const input = await body<{
    criteria: RiskMatrix["criteria"];
    thresholds: RiskMatrix["thresholds"];
    note?: string;
    activate?: boolean;
  }>(request);
  const current = activeMatrix();
  const actor = currentActor();
  const at = nowIso();
  const draft = db.riskMatrices.find((m) => m.status === "draft");
  const version =
    Math.max(...db.riskMatrices.map((m) => m.version)) + (draft ? 0 : 1);
  const next: RiskMatrix = {
    id: draft?.id ?? `rm-v${version}`,
    version: draft?.version ?? version,
    status: input.activate ? "active" : "draft",
    effectiveFrom: input.activate ? at : (draft?.effectiveFrom ?? at),
    approvedBy: input.activate ? actor.name : undefined,
    approvedAt: input.activate ? at : undefined,
    note: input.note,
    criteria: input.criteria,
    thresholds: input.thresholds,
    createdAt: draft?.createdAt ?? at,
    updatedAt: at,
  };
  db.riskMatrices = db.riskMatrices.filter((m) => m.id !== next.id);
  if (input.activate) {
    current.status = "retired";
    current.updatedAt = at;
  }
  db.riskMatrices.push(next);
  recordAudit(db.auditLogs, {
    action: "settings_change",
    module: "risk_matrix",
    object: `Risk Rating Matrix v${next.version}`,
    details: input.activate
      ? `Matrix v${next.version} approved and activated (replaces v${current.version}). Weights: ${input.criteria.map((c) => `${c.label} ${c.weight}%`).join(", ")}; Medium ≥ ${input.thresholds.medium}, High ≥ ${input.thresholds.high}`
      : `Draft v${next.version} saved`,
    entityType: "risk_matrix",
    entityId: next.id,
  });
  return jsonResponse(next);
}

export async function handleListEscalationRules() {
  await getDelay(100, 200);
  return jsonResponse(getDb().escalationRules);
}

export async function handleUpdateEscalationRule({
  params,
  request,
}: MockResolverContext) {
  await getDelay();
  const db = getDb();
  const rule = findById(db.escalationRules, params.id as string);
  if (!rule) return notFound();
  const patch = await body<Partial<EscalationRule>>(request);
  Object.assign(rule, patch, { updatedAt: nowIso() });
  recordAudit(db.auditLogs, {
    action: "settings_change",
    module: "escalation",
    object: rule.name,
    details: `Escalation rule updated: ${Object.keys(patch).join(", ")}`,
    entityType: "escalation_rule",
    entityId: rule.id,
  });
  return jsonResponse(rule);
}

// ---------------------------------------------------------------------------
// Reports (Group 5)
// ---------------------------------------------------------------------------

export async function handleListReportTemplates() {
  await getDelay(100, 200);
  const db = getDb();
  return jsonResponse({
    templates: db.reportTemplates,
    schedule: db.scheduledReports,
  });
}

export async function handleSubmitScheduledReport({
  params,
}: MockResolverContext) {
  await getDelay();
  const db = getDb();
  const s = findById(db.scheduledReports, params.id as string);
  if (!s) return notFound();
  const actor = currentActor();
  s.status = "submitted";
  s.submittedAt = nowIso();
  s.submittedBy = actor.name;
  const t = db.reportTemplates.find((x) => x.id === s.templateId);
  recordAudit(db.auditLogs, {
    action: "submit",
    module: "report",
    object: `${t?.code ?? ""} ${s.period}`,
    details: `Report submitted to ${t?.recipient}`,
    entityType: "report",
    entityId: s.id,
  });
  return jsonResponse(s);
}

/** Generic audit hook for client-side actions (exports, previews). */
export async function handleClientAudit({ request }: MockResolverContext) {
  await getDelay(30, 60);
  const input = await body<{
    action: "export" | "ai_usage";
    module: string;
    object: string;
    details?: string;
  }>(request);
  const log = recordAudit(getDb().auditLogs, input);
  return jsonResponse(log);
}

// ---------------------------------------------------------------------------
// Smart search (Group 5.1)
// ---------------------------------------------------------------------------

const SYNONYMS: Record<string, string[]> = {
  ltv: ["tỷ lệ cho vay", "giá trị tài sản bảo đảm", "mức cho vay"],
  "bất động sản": ["nhà ở", "tài sản bảo đảm", "bđs"],
  kyc: ["nhận biết khách hàng", "định danh", "sinh trắc"],
  "sinh trắc": ["sinh trắc học", "xác thực", "cccd"],
  "rửa tiền": ["pcrt", "aml", "giao dịch đáng ngờ"],
  aml: ["rửa tiền", "giao dịch đáng ngờ"],
  "kiểm soát nội bộ": ["ksnb", "ba tuyến", "3 tuyến"],
  "dữ liệu cá nhân": ["bảo vệ dữ liệu", "đồng ý"],
  phạt: ["xử phạt", "mức phạt"],
};

function expandTerms(q: string, semantic: boolean): string[] {
  const words = q
    .toLowerCase()
    .split(/[\s,.;]+/)
    .filter(Boolean);
  if (!semantic) return [q.toLowerCase()];
  // Vietnamese words are mostly two syllables, so match on syllable pairs
  // ("tỷ lệ", "cho vay", "bất động") plus distinctive single tokens (LTV, AML).
  const bigrams = words.slice(1).map((w, i) => `${words[i]} ${w}`);
  const tokens = words.filter((w) => /^[a-z0-9]{3,}$/.test(w));
  const terms = new Set<string>([q.toLowerCase(), ...bigrams, ...tokens]);
  for (const [k, vals] of Object.entries(SYNONYMS)) {
    if (q.toLowerCase().includes(k)) vals.forEach((v) => terms.add(v));
  }
  return [...terms];
}

export async function handleSmartSearch({ request }: MockResolverContext) {
  await getDelay(250, 450);
  const q = parseQuery(new URL(request.url));
  const query = (q.q ?? "").trim();
  if (!query) return jsonResponse([]);
  const semantic = q.mode !== "keyword";
  const terms = expandTerms(query, semantic);
  const db = getDb();
  type Hit = {
    id: string;
    kind: "law" | "qdnb" | "article" | "issue";
    title: string;
    subtitle: string;
    snippet: string;
    url: string;
    score: number;
  };
  const hits: Hit[] = [];
  const scoreText = (text: string) => {
    const t = text.toLowerCase();
    let s = 0;
    for (const term of terms) if (t.includes(term)) s += term.split(" ").length;
    return s;
  };
  const snippetOf = (text: string) => {
    const t = text.toLowerCase();
    const term = terms.find((x) => t.includes(x));
    if (!term) return text.slice(0, 140);
    const i = Math.max(0, t.indexOf(term) - 50);
    return (i > 0 ? "…" : "") + text.slice(i, i + 160) + "…";
  };
  for (const l of db.legalUpdates) {
    const s = scoreText(`${l.docNumber} ${l.title} ${l.summary}`);
    if (s)
      hits.push({
        id: l.id,
        kind: "law",
        title: `${l.docType} ${l.docNumber}`,
        subtitle: l.title,
        snippet: snippetOf(l.summary),
        url: `/legal-updates/${l.id}`,
        score: s + 1,
      });
    for (const a of l.articles) {
      const sa = scoreText(`${a.title} ${a.content}`);
      if (sa)
        hits.push({
          id: `${l.id}-${a.id}`,
          kind: "article",
          title: `${l.docNumber} – ${a.number}: ${a.title}`,
          subtitle: "Legal article",
          snippet: snippetOf(a.content),
          url: `/legal-updates/${l.id}`,
          score: sa,
        });
    }
  }
  for (const r of db.internalRegulations) {
    const latest = r.versions[r.versions.length - 1];
    const s = scoreText(`${r.code} ${r.title} ${r.field}`);
    if (s)
      hits.push({
        id: r.id,
        kind: "qdnb",
        title: r.code,
        subtitle: r.title,
        snippet: `${r.field} · ${r.ownerUnitName} · v${r.currentVersion}`,
        url: `/qdnb/${r.id}`,
        score: s + 1,
      });
    for (const a of latest.articles) {
      const sa = scoreText(`${a.title} ${a.content}`);
      if (sa)
        hits.push({
          id: `${r.id}-${a.number}`,
          kind: "article",
          title: `${r.code} – ${a.number}: ${a.title}`,
          subtitle: "Internal regulation article",
          snippet: snippetOf(a.content),
          url: `/qdnb/${r.id}`,
          score: sa,
        });
    }
  }
  for (const n of db.nccs) {
    const s = scoreText(`${n.title} ${n.description} ${n.category}`);
    if (s)
      hits.push({
        id: n.id,
        kind: "issue",
        title: `${n.nccId} – ${n.title}`,
        subtitle: `${n.ownerUnitName} · ${n.status}`,
        snippet: snippetOf(n.description),
        url: `/ncc/${n.id}`,
        score: s,
      });
  }
  hits.sort((a, b) => b.score - a.score);
  const max = hits[0]?.score ?? 1;
  return jsonResponse(
    hits
      .slice(0, 25)
      .map((h) => ({ ...h, relevance: Math.round((h.score / max) * 100) })),
  );
}

// ---------------------------------------------------------------------------
// Route table (single source for MSW + direct mode)
// ---------------------------------------------------------------------------

type Method = "get" | "post" | "put" | "delete";
export const cmsRoutes: {
  method: Method;
  path: string;
  handler: (ctx: MockResolverContext) => Promise<Response>;
}[] = [
  { method: "get", path: "/api/cms/overview", handler: handleCmsOverview },
  {
    method: "post",
    path: "/api/cms/scheduler/run",
    handler: handleRunScheduler,
  },
  {
    method: "get",
    path: "/api/cms/legal-updates",
    handler: handleListLegalUpdates,
  },
  {
    method: "post",
    path: "/api/cms/legal-updates/sync",
    handler: handleSyncLegalFeed,
  },
  {
    method: "post",
    path: "/api/cms/legal-updates/ocr",
    handler: handleOcrLegalDocument,
  },
  {
    method: "get",
    path: "/api/cms/legal-updates/:id",
    handler: handleGetLegalUpdate,
  },
  {
    method: "post",
    path: "/api/cms/legal-updates/:id/read",
    handler: handleMarkLegalRead,
  },
  {
    method: "post",
    path: "/api/cms/legal-updates/:id/applicability",
    handler: handleLegalApplicability,
  },
  {
    method: "put",
    path: "/api/cms/legal-updates/:id/mappings",
    handler: handleSaveMappings,
  },
  {
    method: "post",
    path: "/api/cms/legal-updates/:id/assign",
    handler: handleAssignRevisions,
  },
  {
    method: "post",
    path: "/api/cms/legal-updates/:id/import",
    handler: handleImportLegalToLibrary,
  },
  { method: "get", path: "/api/cms/qdnb", handler: handleListQdnb },
  { method: "get", path: "/api/cms/qdnb/:id", handler: handleGetQdnb },
  { method: "get", path: "/api/cms/revisions", handler: handleListRevisions },
  {
    method: "put",
    path: "/api/cms/revisions/:id",
    handler: handleUpdateRevision,
  },
  {
    method: "post",
    path: "/api/cms/revisions/:id/advance",
    handler: handleAdvanceRevision,
  },
  {
    method: "post",
    path: "/api/cms/revisions/:id/issue",
    handler: handleIssueRevision,
  },
  {
    method: "post",
    path: "/api/cms/escalations/ack",
    handler: handleAcknowledgeEscalation,
  },
  { method: "get", path: "/api/cms/icis", handler: handleListIcis },
  { method: "post", path: "/api/cms/icis/sync", handler: handleSyncIcis },
  {
    method: "get",
    path: "/api/cms/icis/:id/suggestion",
    handler: handleIcisSuggestion,
  },
  {
    method: "post",
    path: "/api/cms/icis/:id/accept",
    handler: handleAcceptIcis,
  },
  { method: "post", path: "/api/cms/icis/:id/merge", handler: handleMergeIcis },
  {
    method: "post",
    path: "/api/cms/icis/:id/reject",
    handler: handleRejectIcis,
  },
  {
    method: "post",
    path: "/api/cms/issues/:id/rate",
    handler: handleRateIssue,
  },
  {
    method: "post",
    path: "/api/cms/issues/:id/workflow",
    handler: handleIssueWorkflow,
  },
  {
    method: "get",
    path: "/api/cms/risk-matrices",
    handler: handleListRiskMatrices,
  },
  {
    method: "post",
    path: "/api/cms/risk-matrices",
    handler: handleSaveRiskMatrix,
  },
  {
    method: "get",
    path: "/api/cms/escalation-rules",
    handler: handleListEscalationRules,
  },
  {
    method: "put",
    path: "/api/cms/escalation-rules/:id",
    handler: handleUpdateEscalationRule,
  },
  {
    method: "get",
    path: "/api/cms/reports",
    handler: handleListReportTemplates,
  },
  {
    method: "post",
    path: "/api/cms/reports/schedule/:id/submit",
    handler: handleSubmitScheduledReport,
  },
  { method: "post", path: "/api/cms/audit", handler: handleClientAudit },
  { method: "get", path: "/api/cms/search", handler: handleSmartSearch },
];

export const cmsHandlers = cmsRoutes.map((r) =>
  http[r.method](r.path, r.handler),
);
