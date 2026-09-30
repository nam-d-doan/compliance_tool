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
  STAGE_STYLES,
  PRIORITY_WORKLOAD_WEIGHT,
} from "@/constants/lm";
import type {
  LitigationCase,
  CaseEvent,
  CreateLMCaseInput,
  UpdateLMCaseInput,
  UpdateLMMilestoneInput,
  LMWorkloadEntry,
} from "@/types";
import type { MockDb } from "@/mocks/db";

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
  return jsonResponse(paginate(items, page, pageSize));
}

export async function handleGetLMCaseDetail({ params }: MockResolverContext) {
  await getDelay();
  const db = getDb();
  const item = findById(db.litigationCases, params.id as string);
  if (!item) return notFound("Case not found");
  return jsonResponse(item);
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
    `Tạo hồ sơ ${newCase.code}`,
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
      `Chuyển giai đoạn: ${STAGE_STYLES[prev.stage].label} → ${STAGE_STYLES[body.stage].label}`,
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
      `Phân công lại: ${prev.ownerName} → ${next.ownerName}`,
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
      `Cập nhật: ${changedKeys.join(", ")}`,
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
  const items = db.legalDeadlines.filter((d) => d.caseId === params.id);
  return jsonResponse(items);
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
    return badRequest("currentPlannedDate không hợp lệ");
  }
  if (body.actualDate && !isPlausibleDate(body.actualDate)) {
    return badRequest("actualDate không hợp lệ");
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
      `Dời ngày kế hoạch mốc "${stageLabel}"`,
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
      `Hoàn thành mốc "${stageLabel}"`,
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
          `Chuyển giai đoạn: ${stageLabel} → ${STAGE_STYLES[nextStage].label}`,
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
          "Đóng hồ sơ — hoàn tất thi hành án",
        );
      }
      lmCase.updatedAt = now;
    }
  }

  milestone.updatedAt = now;
  return jsonResponse(milestone);
}

/** GĐ2 — tải công việc từng chuyên viên, cho hộp thoại phân công. */
export async function handleGetLMWorkload() {
  await getDelay();
  const db = getDb();
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
  return jsonResponse(entries);
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
    title: `Đôn đốc: ${lmCase.code}`,
    description: `${fromUserName} nhắc cập nhật tiến độ hồ sơ "${lmCase.title}"`,
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
    `Đôn đốc tiến độ gửi tới ${lmCase.ownerName}`,
  );

  return jsonResponse({ success: true });
}

export async function handleGetLMAlertRules() {
  await getDelay();
  const db = getDb();
  return jsonResponse(db.alertRules);
}

export const lmHandlers = [
  http.get("/api/lm/cases", handleGetLMCaseList),
  http.post("/api/lm/cases", handleCreateLMCase),
  http.get("/api/lm/cases/:id/milestones", handleGetLMCaseMilestones),
  http.get("/api/lm/cases/:id/deadlines", handleGetLMCaseDeadlines),
  http.get("/api/lm/cases/:id/events", handleGetLMCaseEvents),
  http.get("/api/lm/cases/:id", handleGetLMCaseDetail),
  http.put("/api/lm/cases/:id", handleUpdateLMCase),
  http.delete("/api/lm/cases/:id", handleDeleteLMCase),
  http.get("/api/lm/alert-rules", handleGetLMAlertRules),
  http.put("/api/lm/milestones/:id", handleUpdateLMMilestone),
  http.get("/api/lm/workload", handleGetLMWorkload),
  http.post("/api/lm/cases/:id/remind", handleRemindLMCase),
];
