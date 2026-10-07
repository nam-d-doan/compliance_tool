/**
 * PSEUDO CODE (ngắn gọn)
 * 1. CRUD hồ sơ (list/detail/create/update/delete) — giống khuôn ncc_handlers.
 * 2. Mọi thao tác ghi thay đổi đều gọi recordEvent() → vừa push CaseEvent
 *    (hiện trong tab Lịch sử) vừa push AuditLog chung (Phụ lục 2 mục 2.b).
 * 3. Tạo hồ sơ mới luôn bắt đầu stage "khoi_kien" + seed sẵn 5 mốc rỗng.
 * 4. Đổi field "stage" ghi event riêng "stage_changed"; đổi field khác ghi
 *    1 event "updated" liệt kê tên field (không diff chi tiết ở GĐ1).
 * 5. Xóa hồ sơ dọn luôn milestones/deadlines/events con (LM sở hữu riêng,
 *    không như file dùng chung nhiều module nên để mồ côi như NCC).
 */
import { http } from "msw";
import { getDb, findById, paginate, filterByText } from "@/mocks/db";
import {
  getDelay,
  jsonResponse,
  badRequest,
  notFound,
  parseQuery,
  parseNumber,
  normalizeArrayParam,
  type MockResolverContext,
} from "./utils";
import {
  CASE_STAGES,
  CASE_CATEGORIES,
  STAGE_STYLES,
  PRIORITY_WORKLOAD_WEIGHT,
  DEADLINE_TYPE_LABELS,
  DEADLINE_TYPE_DEFAULT_DAYS_BEFORE,
  REQUIRED_DOCS_BY_STAGE,
} from "@/constants/lm";
import { nextDeadlineStatus, deadlineSeverity } from "@/lib/lm-alerts";
import type {
  LitigationCase,
  CaseEvent,
  CreateLMCaseInput,
  UpdateLMCaseInput,
  UpdateLMMilestoneInput,
  UpdateLMDeadlineInput,
  LMWorkloadEntry,
  LMDashboardSummary,
  LMTask,
  CreateLMTaskInput,
  UpdateLMTaskInput,
} from "@/types";
import type { MockDb } from "@/mocks/db";
import { DEMO_TODAY } from "@/mocks/db";

function recordEvent(
  db: MockDb,
  caseId: string,
  type: CaseEvent["type"],
  userId: string,
  userName: string,
  description: string,
  fromValue?: string,
  toValue?: string,
): void {
  const now = new Date().toISOString();
  db.caseEvents.unshift({
    id: `ce-${crypto.randomUUID()}`,
    caseId,
    type,
    userId,
    userName,
    description,
    fromValue,
    toValue,
    createdAt: now,
    updatedAt: now,
  });
  db.auditLogs.unshift({
    id: `aud-${crypto.randomUUID()}`,
    timestamp: now,
    userId,
    userName,
    action: type === "created" ? "create" : "update",
    object: caseId,
    module: "lm",
    ip: "127.0.0.1",
    result: "success",
    details: description,
    createdAt: now,
    updatedAt: now,
  });
}

/**
 * GĐ3 — chạy ở đầu các API đọc hồ sơ/hạn pháp lý: quét hạn "pending", bật
 * cờ đỏ (flagged) nếu đã qua ngưỡng AlertRule.daysBefore, ghi CaseEvent +
 * Notification. Idempotent (hạn đã flagged/resolved/acknowledged bỏ qua) —
 * gọi nhiều lần không sao, không cần cron thật cho demo.
 */
function evaluateDeadlines(db: MockDb): void {
  db.legalDeadlines.forEach((d) => {
    if (d.status !== "pending") return;
    const rule = db.alertRules.find((r) => r.type === d.type);
    const daysBefore = rule?.daysBefore ?? DEADLINE_TYPE_DEFAULT_DAYS_BEFORE[d.type];
    const next = nextDeadlineStatus(d, daysBefore, DEMO_TODAY);
    if (next === "flagged") {
      d.status = "flagged";
      d.flaggedAt = DEMO_TODAY.toISOString();
      d.updatedAt = DEMO_TODAY.toISOString();

      const lmCase = findById(db.litigationCases, d.caseId);
      if (!lmCase) return;
      const label = DEADLINE_TYPE_LABELS[d.type];
      recordEvent(
        db,
        d.caseId,
        "deadline_flagged",
        lmCase.ownerId,
        lmCase.ownerName,
        `System flagged deadline "${label}"`,
      );
      db.notifications.unshift({
        id: `ntf-${crypto.randomUUID()}`,
        userId: lmCase.ownerId,
        title: `Deadline alert: ${lmCase.code}`,
        description: `Deadline "${label}" on case "${lmCase.title}" is approaching or past the alert threshold`,
        type: "compliance",
        read: false,
        entityType: "lm",
        entityId: lmCase.id,
        actionUrl: `/lm/${lmCase.id}`,
        createdAt: DEMO_TODAY.toISOString(),
        updatedAt: DEMO_TODAY.toISOString(),
      });
    }
  });
}

/** GĐ3 — đếm hạn đang "flagged" (đỏ/vàng) của 1 hồ sơ, cho badge list/detail. */
function countRedFlags(db: MockDb, caseId: string): number {
  return db.legalDeadlines.filter(
    (d) => d.caseId === caseId && d.status === "flagged",
  ).length;
}

function seedMilestones(db: MockDb, caseId: string, createdAt: string): void {
  const base = new Date(createdAt);
  CASE_STAGES.forEach((stage, si) => {
    const planned = new Date(base);
    planned.setDate(planned.getDate() + (si + 1) * 45);
    db.caseMilestones.push({
      id: `ms-${crypto.randomUUID()}`,
      caseId,
      stage,
      originalPlannedDate: planned.toISOString(),
      currentPlannedDate: planned.toISOString(),
      actualDate: undefined,
      createdAt,
      updatedAt: createdAt,
    });
  });
}

export async function handleGetLMCaseList({
  request,
}: {
  request: Request;
}) {
  await getDelay();
  const url = new URL(request.url);
  const q = parseQuery(url);
  const db = getDb();
  evaluateDeadlines(db);
  let items = [...db.litigationCases];

  if (q.stage) {
    const stages = normalizeArrayParam(q.stage);
    items = items.filter((c) => stages.includes(c.stage));
  }
  if (q.status) {
    const statuses = normalizeArrayParam(q.status);
    items = items.filter((c) => statuses.includes(c.status));
  }
  if (q.priority) {
    const priorities = normalizeArrayParam(q.priority);
    items = items.filter((c) => priorities.includes(c.priority));
  }
  if (q.category) {
    const categories = normalizeArrayParam(q.category);
    items = items.filter((c) => categories.includes(c.category));
  }
  if (q.ownerId) {
    items = items.filter((c) => c.ownerId === q.ownerId);
  }
  if (q.ownerUnitId) {
    items = items.filter((c) => c.ownerUnitId === q.ownerUnitId);
  }
  if (q.managerId) {
    items = items.filter((c) => c.managerId === q.managerId);
  }
  if (q.search) {
    items = filterByText(items, q.search, [
      "code",
      "title",
      "customerName",
      "customerCif",
    ]);
  }

  const sortField = q.sortField ?? "createdAt";
  const sortDirection = q.sortDirection ?? "desc";
  items.sort((a, b) => {
    const aVal = a[sortField as keyof LitigationCase];
    const bVal = b[sortField as keyof LitigationCase];
    if (aVal == null || bVal == null) return 0;
    if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
    if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  const page = parseNumber(q.page, 1);
  const pageSize = parseNumber(q.pageSize, 20);
  const result = paginate(items, page, pageSize);
  return jsonResponse({
    ...result,
    items: result.items.map((c) => ({
      ...c,
      redFlagCount: countRedFlags(db, c.id),
    })),
  });
}

export async function handleGetLMCaseDetail({ params }: MockResolverContext) {
  await getDelay();
  const db = getDb();
  evaluateDeadlines(db);
  const item = findById(db.litigationCases, params.id as string);
  if (!item) return notFound("Case not found");
  return jsonResponse({ ...item, redFlagCount: countRedFlags(db, item.id) });
}

export async function handleCreateLMCase({
  request,
}: {
  request: Request;
}) {
  await getDelay();
  const body = (await request.json()) as Partial<CreateLMCaseInput>;
  if (!body.title || !body.ownerUnitId || !body.ownerId) {
    return badRequest("title, ownerUnitId and ownerId are required");
  }
  const db = getDb();
  const now = new Date().toISOString();

  const hoDept = db.organizationSettings.hoDepartments.find(
    (d) => d.id === body.ownerUnitId,
  );
  const branch = db.organizationSettings.branches.find(
    (b) => b.id === body.ownerUnitId,
  );
  const owner = findById(db.users, body.ownerId);
  const manager = body.managerId ? findById(db.users, body.managerId) : undefined;

  const newCase: LitigationCase = {
    id: `lm-${crypto.randomUUID()}`,
    code: `LM-${new Date().getFullYear()}-${String(
      db.litigationCases.length + 1,
    ).padStart(3, "0")}`,
    title: body.title,
    category: body.category ?? "khac",
    customerCif: body.customerCif ?? "",
    customerName: body.customerName ?? "",
    outstandingDebt: body.outstandingDebt ?? 0,
    collateralDescription: body.collateralDescription,
    courtOrEnforcementAgency: body.courtOrEnforcementAgency ?? "",
    judgeName: body.judgeName,
    stage: "khoi_kien",
    status: "Open",
    priority: body.priority ?? "medium",
    ownerUnitId: body.ownerUnitId,
    ownerUnitName: hoDept?.name ?? branch?.name ?? "",
    ownerUnitType: branch ? "branch" : "ho_department",
    ownerUnitRegion: branch?.region,
    ownerId: body.ownerId,
    ownerName: owner?.name ?? "",
    managerId: body.managerId ?? "",
    managerName: manager?.name ?? "",
    fileIds: [],
    tags: body.tags ?? [],
    createdAt: now,
    updatedAt: now,
  };

  db.litigationCases.unshift(newCase);
  seedMilestones(db, newCase.id, now);
  recordEvent(
    db,
    newCase.id,
    "created",
    newCase.ownerId,
    newCase.ownerName,
    `Created case ${newCase.code}`,
  );

  return jsonResponse(newCase, 201);
}

export async function handleUpdateLMCase({
  params,
  request,
}: MockResolverContext) {
  await getDelay();
  const db = getDb();
  const index = db.litigationCases.findIndex((c) => c.id === params.id);
  if (index === -1) return notFound("Case not found");
  const body = (await request.json()) as UpdateLMCaseInput;
  const prev = db.litigationCases[index];
  const next: LitigationCase = {
    ...prev,
    ...body,
    updatedAt: new Date().toISOString(),
  };
  // BƯỚC (GĐ2): body chỉ gửi ownerId, không gửi kèm ownerName -> phải tự
  // tra tên mới, không thì next.ownerName giữ tên cũ (bug hiện tên sai).
  if (body.ownerId && body.ownerId !== prev.ownerId) {
    next.ownerName = findById(db.users, body.ownerId)?.name ?? next.ownerName;
  }

  const actorId = next.ownerId || prev.ownerId;
  const actorName = next.ownerName || prev.ownerName;

  if (body.stage && body.stage !== prev.stage) {
    recordEvent(
      db,
      prev.id,
      "stage_changed",
      actorId,
      actorName,
      `Stage changed: ${STAGE_STYLES[prev.stage].label} → ${STAGE_STYLES[body.stage].label}`,
      prev.stage,
      body.stage,
    );
  }

  // BƯỚC (GĐ2): đổi ownerId (phân công lại) ghi event riêng "reassigned"
  // thay vì gộp vào "updated" chung, để tab Lịch sử đọc rõ ai giao cho ai.
  if (body.ownerId && body.ownerId !== prev.ownerId) {
    recordEvent(
      db,
      prev.id,
      "reassigned",
      actorId,
      actorName,
      `Reassigned: ${prev.ownerName} → ${next.ownerName}`,
      prev.ownerName,
      next.ownerName,
    );
  }
  const changedKeys = Object.keys(body).filter(
    (k) =>
      k !== "stage" &&
      k !== "ownerId" &&
      (body as Record<string, unknown>)[k] !== undefined,
  );
  if (changedKeys.length > 0) {
    recordEvent(
      db,
      prev.id,
      "updated",
      actorId,
      actorName,
      `Updated: ${changedKeys.join(", ")}`,
    );
  }

  db.litigationCases[index] = next;
  return jsonResponse(next);
}

export async function handleDeleteLMCase({ params }: MockResolverContext) {
  await getDelay();
  const db = getDb();
  const id = params.id as string;
  const index = db.litigationCases.findIndex((c) => c.id === id);
  if (index === -1) return notFound("Case not found");
  db.litigationCases.splice(index, 1);
  db.caseMilestones = db.caseMilestones.filter((m) => m.caseId !== id);
  db.legalDeadlines = db.legalDeadlines.filter((d) => d.caseId !== id);
  db.caseEvents = db.caseEvents.filter((e) => e.caseId !== id);
  return jsonResponse({ success: true });
}

export async function handleGetLMCaseMilestones({
  params,
}: MockResolverContext) {
  await getDelay();
  const db = getDb();
  const items = db.caseMilestones
    .filter((m) => m.caseId === params.id)
    .sort((a, b) => a.originalPlannedDate.localeCompare(b.originalPlannedDate));
  return jsonResponse(items);
}

export async function handleGetLMCaseDeadlines({
  params,
}: MockResolverContext) {
  await getDelay();
  const db = getDb();
  evaluateDeadlines(db);
  const items = db.legalDeadlines
    .filter((d) => d.caseId === params.id)
    .map((d) => ({ ...d, severity: deadlineSeverity(d, DEMO_TODAY) }));
  return jsonResponse(items);
}

/**
 * PSEUDO CODE (GĐ3 — xử lý 1 hạn cảnh báo)
 * 1. action="acknowledge": flagged -> acknowledged, ghi nhận ai tiếp nhận.
 * 2. action="resolve": flagged|acknowledged -> resolved, ghi nhận ai xử lý.
 * 3. Không cho resolve/acknowledge hạn đang "pending" (chưa có gì để xử lý)
 *    hoặc đã "resolved" (tránh ghi đè lịch sử xử lý cũ).
 */
export async function handleUpdateLMDeadline({
  params,
  request,
}: MockResolverContext) {
  await getDelay();
  const db = getDb();
  const deadline = findById(db.legalDeadlines, params.id as string);
  if (!deadline) return notFound("Deadline not found");
  const lmCase = findById(db.litigationCases, deadline.caseId);
  if (!lmCase) return notFound("Case not found");

  const body = (await request.json()) as UpdateLMDeadlineInput;
  const actorId = body.actorId || lmCase.ownerId;
  const actorName = body.actorName || lmCase.ownerName;
  const now = new Date().toISOString();
  const label = DEADLINE_TYPE_LABELS[deadline.type];

  if (body.action === "acknowledge") {
    if (deadline.status !== "flagged") {
      return badRequest("Only a flagged deadline can be acknowledged");
    }
    deadline.status = "acknowledged";
    deadline.acknowledgedAt = now;
    deadline.acknowledgedById = actorId;
    recordEvent(
      db,
      lmCase.id,
      "deadline_acknowledged",
      actorId,
      actorName,
      `Acknowledged alert for deadline "${label}"`,
    );
  } else if (body.action === "resolve") {
    if (deadline.status !== "flagged" && deadline.status !== "acknowledged") {
      return badRequest("Deadline has not been flagged yet or is already resolved");
    }
    deadline.status = "resolved";
    deadline.resolvedAt = now;
    deadline.resolvedById = actorId;
    recordEvent(
      db,
      lmCase.id,
      "deadline_resolved",
      actorId,
      actorName,
      `Resolved alert for deadline "${label}"`,
    );
  } else {
    return badRequest("action must be acknowledge or resolve");
  }

  deadline.updatedAt = now;
  return jsonResponse(deadline);
}

export async function handleGetLMCaseEvents({
  params,
}: MockResolverContext) {
  await getDelay();
  const db = getDb();
  const items = db.caseEvents
    .filter((e) => e.caseId === params.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return jsonResponse(items);
}

/**
 * Nam review R3 (docs/lm/02-review-changes.md mục 4) — task tự do của 1 hồ
 * sơ, hiển thị cùng LegalDeadline trong tab "Work Calendar". Sort theo hạn
 * gần nhất trước, giống cách Deadlines đang sort ở FE.
 */
export async function handleGetLMCaseTasks({ params }: MockResolverContext) {
  await getDelay();
  const db = getDb();
  const items = db.lmTasks
    .filter((t) => t.caseId === params.id)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  return jsonResponse(items);
}

export async function handleCreateLMTask({ request }: MockResolverContext) {
  await getDelay();
  const db = getDb();
  const body = (await request.json()) as CreateLMTaskInput;
  if (!body.caseId || !body.title || !body.dueDate || !body.priority) {
    return badRequest("caseId, title, dueDate and priority are required");
  }
  const lmCase = findById(db.litigationCases, body.caseId);
  if (!lmCase) return notFound("Case not found");

  const now = new Date().toISOString();
  const task: LMTask = {
    id: `task-${crypto.randomUUID()}`,
    caseId: body.caseId,
    title: body.title,
    description: body.description,
    dueDate: body.dueDate,
    priority: body.priority,
    status: "open",
    createdById: lmCase.ownerId,
    createdByName: lmCase.ownerName,
    createdAt: now,
    updatedAt: now,
  };
  db.lmTasks.unshift(task);
  return jsonResponse(task, 201);
}

export async function handleUpdateLMTask({
  params,
  request,
}: MockResolverContext) {
  await getDelay();
  const db = getDb();
  const task = findById(db.lmTasks, params.id as string);
  if (!task) return notFound("Task not found");

  const body = (await request.json()) as UpdateLMTaskInput;
  Object.assign(task, body, { updatedAt: new Date().toISOString() });
  return jsonResponse(task);
}

/**
 * PSEUDO CODE (GĐ2 — sửa mốc)
 * 1. Đổi currentPlannedDate (chưa hoàn thành) → ghi event dời ngày.
 * 2. Set actualDate (đánh dấu xong) → ghi event hoàn thành mốc.
 *    Nếu mốc đó ĐÚNG bằng giai đoạn hiện tại của hồ sơ: sang giai đoạn kế
 *    tiếp; nếu đây là mốc CUỐI (thi_hanh_an) thì đóng hồ sơ (status=Closed)
 *    thay vì tự động đóng lúc đổi stage thủ công (xem comment ở GĐ1).
 */
export async function handleUpdateLMMilestone({
  params,
  request,
}: MockResolverContext) {
  await getDelay();
  const db = getDb();
  const milestone = findById(db.caseMilestones, params.id as string);
  if (!milestone) return notFound("Milestone not found");
  const lmCase = findById(db.litigationCases, milestone.caseId);
  if (!lmCase) return notFound("Case not found");

  const body = (await request.json()) as UpdateLMMilestoneInput;

  // Chặn ngày rác từ client (vd input type="date" bị gõ lệch cho ra năm
  // 252026) trước khi ghi vào db — không tin tưởng client validate đủ.
  const isPlausibleDate = (s: string) => {
    const d = new Date(s);
    return !Number.isNaN(d.getTime()) && d.getFullYear() >= 2000 && d.getFullYear() <= 2100;
  };
  if (body.currentPlannedDate && !isPlausibleDate(body.currentPlannedDate)) {
    return badRequest("currentPlannedDate is invalid");
  }
  if (body.actualDate && !isPlausibleDate(body.actualDate)) {
    return badRequest("actualDate is invalid");
  }

  const now = new Date().toISOString();
  const stageLabel = STAGE_STYLES[milestone.stage].label;

  if (
    body.currentPlannedDate &&
    body.currentPlannedDate !== milestone.currentPlannedDate
  ) {
    recordEvent(
      db,
      lmCase.id,
      "milestone_date_changed",
      lmCase.ownerId,
      lmCase.ownerName,
      `Rescheduled milestone "${stageLabel}"`,
      milestone.currentPlannedDate,
      body.currentPlannedDate,
    );
    milestone.currentPlannedDate = body.currentPlannedDate;
  }

  if (body.actualDate && body.actualDate !== milestone.actualDate) {
    milestone.actualDate = body.actualDate;
    recordEvent(
      db,
      lmCase.id,
      "milestone_completed",
      lmCase.ownerId,
      lmCase.ownerName,
      `Completed milestone "${stageLabel}"`,
    );

    // Chỉ tự chuyển giai đoạn khi hoàn thành ĐÚNG mốc đang là giai đoạn
    // hiện tại — hoàn thành mốc tương lai (ngoài thứ tự) không đẩy stage.
    if (milestone.stage === lmCase.stage) {
      const idx = CASE_STAGES.indexOf(milestone.stage);
      const nextStage = CASE_STAGES[idx + 1];
      if (nextStage) {
        recordEvent(
          db,
          lmCase.id,
          "stage_changed",
          lmCase.ownerId,
          lmCase.ownerName,
          `Stage changed: ${stageLabel} → ${STAGE_STYLES[nextStage].label}`,
          lmCase.stage,
          nextStage,
        );
        lmCase.stage = nextStage;
      } else {
        // Không còn giai đoạn kế tiếp — đây là mốc thi_hanh_an, đóng hồ sơ.
        lmCase.status = "Closed";
        recordEvent(
          db,
          lmCase.id,
          "updated",
          lmCase.ownerId,
          lmCase.ownerName,
          "Case closed — enforcement completed",
        );
      }
      lmCase.updatedAt = now;
    }
  }

  if (body.linkedFileIds) {
    milestone.linkedFileIds = body.linkedFileIds;
  }

  milestone.updatedAt = now;
  return jsonResponse(milestone);
}

/** GĐ2 — tải công việc từng chuyên viên. Dùng chung cho hộp thoại phân công
 * (GĐ2) và dashboard (GĐ4) — tránh tính 2 công thức khác nhau 2 chỗ. */
function computeOwnerWorkload(db: MockDb): LMWorkloadEntry[] {
  const owners = db.users.filter((u) => u.role === "owner");
  const openCases = db.litigationCases.filter((c) => c.status === "Open");

  const entries: LMWorkloadEntry[] = owners.map((u) => {
    const mine = openCases.filter((c) => c.ownerId === u.id);
    const weightedLoad = mine.reduce(
      (sum, c) => sum + PRIORITY_WORKLOAD_WEIGHT[c.priority],
      0,
    );
    return {
      userId: u.id,
      userName: u.name,
      openCaseCount: mine.length,
      weightedLoad,
    };
  });
  entries.sort((a, b) => a.weightedLoad - b.weightedLoad);
  return entries;
}

export async function handleGetLMWorkload() {
  await getDelay();
  const db = getDb();
  return jsonResponse(computeOwnerWorkload(db));
}

/** GĐ2 — "Đôn đốc": tạo Notification cho chuyên viên + ghi CaseEvent. */
export async function handleRemindLMCase({
  params,
  request,
}: MockResolverContext) {
  await getDelay();
  const db = getDb();
  const lmCase = findById(db.litigationCases, params.id as string);
  if (!lmCase) return notFound("Case not found");

  const body = (await request
    .json()
    .catch(() => ({}) as { fromUserId?: string; fromUserName?: string })) as {
    fromUserId?: string;
    fromUserName?: string;
  };
  const fromUserId = body.fromUserId || lmCase.managerId || lmCase.ownerId;
  const fromUserName =
    body.fromUserName || lmCase.managerName || lmCase.ownerName;

  const now = new Date().toISOString();
  db.notifications.unshift({
    id: `ntf-${crypto.randomUUID()}`,
    userId: lmCase.ownerId,
    title: `Reminder: ${lmCase.code}`,
    description: `${fromUserName} is asking for a progress update on case "${lmCase.title}"`,
    type: "compliance",
    read: false,
    entityType: "lm",
    entityId: lmCase.id,
    actionUrl: `/lm/${lmCase.id}`,
    createdAt: now,
    updatedAt: now,
  });

  recordEvent(
    db,
    lmCase.id,
    "reminded",
    fromUserId,
    fromUserName,
    `Reminder sent to ${lmCase.ownerName}`,
  );

  return jsonResponse({ success: true });
}

export async function handleGetLMAlertRules() {
  await getDelay();
  const db = getDb();
  return jsonResponse(db.alertRules);
}

/**
 * PSEUDO CODE (GĐ4 — tổng hợp dashboard)
 * 1. Chạy evaluateDeadlines trước để KPI cảnh báo dùng trạng thái mới nhất.
 * 2. milestoneUpdateRate: so khớp CHÍNH XÁC description event với mốc đã
 *    hoàn thành (template cố định ở recordEvent/seed, không trùng giữa các
 *    giai đoạn) — tránh đếm nhầm mốc nào có/thiếu event.
 * 3. documentCompletionRate: proxy đếm SỐ LƯỢNG file, không check loại tài
 *    liệu (xem comment ở type LMDashboardSummary).
 * 4. Gộp sẵn 1 API duy nhất thay vì bắt FE gọi nhiều endpoint rồi tự tính —
 *    toàn bộ dữ liệu đã có sẵn trong getDb(), tính 1 lần ở server rẻ hơn.
 */
/**
 * GĐ4 + Nam review R1 (docs/lm/02-review-changes.md mục 3): nhận `ownerId`
 * qua query string. Khi có — scope TOÀN BỘ số liệu theo hồ sơ của 1 chuyên
 * viên (view "My Cases"); khi không — giữ nguyên hành vi cũ (view Manager,
 * toàn hàng). `ownerWorkload` không có nghĩa khi đã scope về 1 người nên
 * trả `[]` — trang (LMDashboardPage) không render chart đó ở view chuyên viên.
 */
export async function handleGetLMDashboard({ request }: { request: Request }) {
  await getDelay();
  const url = new URL(request.url);
  const ownerId = url.searchParams.get("ownerId") ?? undefined;
  const db = getDb();
  evaluateDeadlines(db);

  const scopedCases = ownerId
    ? db.litigationCases.filter((c) => c.ownerId === ownerId)
    : db.litigationCases;
  const scopedCaseIds = new Set(scopedCases.map((c) => c.id));

  const openCases = scopedCases.filter((c) => c.status === "Open");
  const closedCases = scopedCases.filter((c) => c.status === "Closed");
  const scopedDeadlines = db.legalDeadlines.filter((d) =>
    scopedCaseIds.has(d.caseId),
  );
  const redFlagCaseIds = new Set(
    scopedDeadlines.filter((d) => d.status === "flagged").map((d) => d.caseId),
  );

  const scopedMilestones = db.caseMilestones.filter((m) =>
    scopedCaseIds.has(m.caseId),
  );
  const completedMilestones = scopedMilestones.filter((m) => m.actualDate);
  const completedWithEvent = completedMilestones.filter((m) => {
    const label = STAGE_STYLES[m.stage].label;
    return db.caseEvents.some(
      (e) =>
        e.caseId === m.caseId &&
        e.type === "milestone_completed" &&
        e.description === `Completed milestone "${label}"`,
    );
  });
  const milestoneUpdateRate =
    completedMilestones.length > 0
      ? Math.round((completedWithEvent.length / completedMilestones.length) * 100)
      : 0;

  // KPI a (Phụ lục 2 mục 3.2.a) — mốc hoàn thành đúng hoặc trước ngày kế
  // hoạch HIỆN TẠI (currentPlannedDate, không phải originalPlannedDate —
  // dời lịch hợp lệ không nên bị tính là "trễ").
  const onTimeCompleted = completedMilestones.filter(
    (m) => m.actualDate! <= m.currentPlannedDate,
  );
  const onTimeCompletionRate =
    completedMilestones.length > 0
      ? Math.round((onTimeCompleted.length / completedMilestones.length) * 100)
      : 0;

  const everFlagged = scopedDeadlines.filter((d) => d.status !== "pending");
  const resolved = scopedDeadlines.filter((d) => d.status === "resolved");
  const alertResolutionRate =
    everFlagged.length > 0
      ? Math.round((resolved.length / everFlagged.length) * 100)
      : 0;

  const sufficientDocCases = scopedCases.filter(
    (c) => c.fileIds.length >= REQUIRED_DOCS_BY_STAGE[c.stage].length,
  );
  const documentCompletionRate =
    scopedCases.length > 0
      ? Math.round((sufficientDocCases.length / scopedCases.length) * 100)
      : 0;

  const stageDistribution = CASE_STAGES.map((stage) => ({
    stage,
    count: scopedCases.filter((c) => c.stage === stage).length,
  }));
  const categoryDistribution = CASE_CATEGORIES.map((category) => ({
    category,
    count: scopedCases.filter((c) => c.category === category).length,
  }));

  const unitCounts = new Map<string, number>();
  scopedCases.forEach((c) => {
    unitCounts.set(c.ownerUnitName, (unitCounts.get(c.ownerUnitName) ?? 0) + 1);
  });
  const unitDistribution = Array.from(unitCounts.entries())
    .map(([unitName, count]) => ({ unitName, count }))
    .sort((a, b) => b.count - a.count);

  const topRedFlagCases = scopedCases
    .filter((c) => redFlagCaseIds.has(c.id))
    .map((c) => ({
      id: c.id,
      code: c.code,
      title: c.title,
      ownerName: c.ownerName,
      redFlagCount: countRedFlags(db, c.id),
    }))
    .sort((a, b) => b.redFlagCount - a.redFlagCount)
    .slice(0, 5);

  const summary: LMDashboardSummary = {
    totalOpen: openCases.length,
    totalClosed: closedCases.length,
    totalRedFlagCases: redFlagCaseIds.size,
    milestoneUpdateRate,
    onTimeCompletionRate,
    alertResolutionRate,
    documentCompletionRate,
    stageDistribution,
    categoryDistribution,
    unitDistribution,
    ownerWorkload: ownerId ? [] : computeOwnerWorkload(db),
    topRedFlagCases,
  };
  return jsonResponse(summary);
}

export const lmHandlers = [
  http.get("/api/lm/cases", handleGetLMCaseList),
  http.post("/api/lm/cases", handleCreateLMCase),
  http.get("/api/lm/cases/:id/milestones", handleGetLMCaseMilestones),
  http.get("/api/lm/cases/:id/deadlines", handleGetLMCaseDeadlines),
  http.put("/api/lm/deadlines/:id", handleUpdateLMDeadline),
  http.get("/api/lm/cases/:id/events", handleGetLMCaseEvents),
  http.get("/api/lm/cases/:id/tasks", handleGetLMCaseTasks),
  http.post("/api/lm/tasks", handleCreateLMTask),
  http.put("/api/lm/tasks/:id", handleUpdateLMTask),
  http.get("/api/lm/cases/:id", handleGetLMCaseDetail),
  http.put("/api/lm/cases/:id", handleUpdateLMCase),
  http.delete("/api/lm/cases/:id", handleDeleteLMCase),
  http.get("/api/lm/alert-rules", handleGetLMAlertRules),
  http.put("/api/lm/milestones/:id", handleUpdateLMMilestone),
  http.get("/api/lm/workload", handleGetLMWorkload),
  http.get("/api/lm/dashboard", handleGetLMDashboard),
  http.post("/api/lm/cases/:id/remind", handleRemindLMCase),
];
