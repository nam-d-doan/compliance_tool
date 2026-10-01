/**
 * PSEUDO CODE (ngắn gọn)
 * 1. CRUD yêu cầu (list/detail/create/update/delete) — giống hệt khuôn
 *    lm_handlers.ts, chỉ đổi tên thực thể.
 * 2. Mọi thao tác ghi thay đổi đều gọi recordEvent() → push LawEvent (tab
 *    Lịch sử) + AuditLog chung (Phụ lục 3 mục 2.b).
 * 3. GĐ2: dueDate tính 1 lần lúc tạo theo SlaRule (db.slaRules, không
 *    hardcode hằng số ở handler — sửa 1 chỗ trong db áp dụng mọi nơi).
 *    Phân công theo tải (computeOwnerWorkloadForLaw) và "Đôn đốc" dùng
 *    đúng khuôn lm_handlers.ts.
 * 4. GĐ3 — cảnh báo đỏ: evaluateLawAlerts quét alertStatus "pending" của
 *    AdviceRequest (1 request = 1 dueDate, không tách bảng con như LM),
 *    dùng chung lib/deadline-alerts.ts với lm_handlers.ts. Khai thác Tri
 *    thức: CRUD đơn giản + tìm theo từ khóa (filterByText), không sub/tab.
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
  LAW_PRIORITY_SLA_DAYS,
  LAW_PRIORITY_WORKLOAD_WEIGHT,
} from "@/constants/law";
import { nextAlertStatus, alertSeverity } from "@/lib/deadline-alerts";
import { DEMO_TODAY } from "@/mocks/db";
import type {
  AdviceRequest,
  LawEvent,
  CreateAdviceRequestInput,
  UpdateAdviceRequestInput,
  UpdateLawAlertInput,
  LawWorkloadEntry,
  KnowledgeBaseEntry,
  CreateKnowledgeBaseEntryInput,
} from "@/types";
import type { MockDb } from "@/mocks/db";

function recordEvent(
  db: MockDb,
  requestId: string,
  type: LawEvent["type"],
  userId: string,
  userName: string,
  description: string,
  fromValue?: string,
  toValue?: string,
): void {
  const now = new Date().toISOString();
  db.lawEvents.unshift({
    id: `le-${crypto.randomUUID()}`,
    requestId,
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
    object: requestId,
    module: "law",
    ip: "127.0.0.1",
    result: "success",
    details: description,
    createdAt: now,
    updatedAt: now,
  });
}

/**
 * GĐ3 — chạy đầu API đọc yêu cầu: quét alertStatus "pending", bật cờ nếu
 * đã qua ngưỡng SlaRule.alertDaysBefore, ghi LawEvent + Notification.
 * Idempotent, giống evaluateDeadlines của LM (dùng chung lib).
 */
function evaluateLawAlerts(db: MockDb): void {
  db.adviceRequests.forEach((r) => {
    if (r.alertStatus !== "pending") return;
    const rule = db.slaRules.find((sr) => sr.priorityTier === r.priorityTier);
    const daysBefore = rule?.alertDaysBefore ?? 3;
    const next = nextAlertStatus(
      { status: r.alertStatus, dueDate: r.dueDate },
      daysBefore,
      DEMO_TODAY,
    );
    if (next === "flagged") {
      r.alertStatus = "flagged";
      r.flaggedAt = DEMO_TODAY.toISOString();
      r.updatedAt = DEMO_TODAY.toISOString();

      recordEvent(
        db,
        r.id,
        "alert_flagged",
        r.ownerId,
        r.ownerName,
        "System flagged this request's SLA deadline",
      );
      db.notifications.unshift({
        id: `ntf-${crypto.randomUUID()}`,
        userId: r.ownerId,
        title: `SLA alert: ${r.code}`,
        description: `Request "${r.title}" is approaching or past its SLA due date`,
        type: "compliance",
        read: false,
        entityType: "law",
        entityId: r.id,
        actionUrl: `/law/${r.id}`,
        createdAt: DEMO_TODAY.toISOString(),
        updatedAt: DEMO_TODAY.toISOString(),
      });
    }
  });
}

export async function handleGetLawRequestList({
  request,
}: {
  request: Request;
}) {
  await getDelay();
  const url = new URL(request.url);
  const q = parseQuery(url);
  const db = getDb();
  evaluateLawAlerts(db);
  let items = [...db.adviceRequests];

  if (q.status) {
    const statuses = normalizeArrayParam(q.status);
    items = items.filter((r) => statuses.includes(r.status));
  }
  if (q.priorityTier) {
    const tiers = normalizeArrayParam(q.priorityTier);
    items = items.filter((r) => tiers.includes(r.priorityTier));
  }
  if (q.ownerId) {
    items = items.filter((r) => r.ownerId === q.ownerId);
  }
  if (q.requestingUnitId) {
    items = items.filter((r) => r.requestingUnitId === q.requestingUnitId);
  }
  if (q.managerId) {
    items = items.filter((r) => r.managerId === q.managerId);
  }
  if (q.search) {
    items = filterByText(items, q.search, ["code", "title"]);
  }

  const sortField = q.sortField ?? "submittedAt";
  const sortDirection = q.sortDirection ?? "desc";
  items.sort((a, b) => {
    const aVal = a[sortField as keyof AdviceRequest];
    const bVal = b[sortField as keyof AdviceRequest];
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
    items: result.items.map((r) => ({
      ...r,
      severity: alertSeverity(
        { status: r.alertStatus, dueDate: r.dueDate },
        DEMO_TODAY,
      ),
    })),
  });
}

export async function handleGetLawRequestDetail({
  params,
}: MockResolverContext) {
  await getDelay();
  const db = getDb();
  evaluateLawAlerts(db);
  const item = findById(db.adviceRequests, params.id as string);
  if (!item) return notFound("Request not found");
  return jsonResponse({
    ...item,
    severity: alertSeverity(
      { status: item.alertStatus, dueDate: item.dueDate },
      DEMO_TODAY,
    ),
  });
}

export async function handleCreateLawRequest({
  request,
}: {
  request: Request;
}) {
  await getDelay();
  const body = (await request.json()) as Partial<CreateAdviceRequestInput>;
  if (!body.title || !body.requestingUnitId || !body.ownerId) {
    return badRequest("title, requestingUnitId and ownerId are required");
  }
  const db = getDb();
  const now = new Date().toISOString();

  const hoDept = db.organizationSettings.hoDepartments.find(
    (d) => d.id === body.requestingUnitId,
  );
  const branch = db.organizationSettings.branches.find(
    (b) => b.id === body.requestingUnitId,
  );
  const owner = findById(db.users, body.ownerId);
  const manager = body.managerId ? findById(db.users, body.managerId) : undefined;

  const priorityTier = body.priorityTier ?? "internal";
  const slaRule = db.slaRules.find((r) => r.priorityTier === priorityTier);
  const slaDays = slaRule?.slaDays ?? LAW_PRIORITY_SLA_DAYS[priorityTier];
  const dueDate = new Date(
    Date.now() + slaDays * 86_400_000,
  ).toISOString();

  const newRequest: AdviceRequest = {
    id: `law-${crypto.randomUUID()}`,
    code: `LAW-${new Date().getFullYear()}-${String(
      db.adviceRequests.length + 1,
    ).padStart(3, "0")}`,
    title: body.title,
    description: body.description,
    priorityTier,
    status: "new",
    requestingUnitId: body.requestingUnitId,
    requestingUnitName: hoDept?.name ?? branch?.name ?? "",
    requestingUnitType: branch ? "branch" : "ho_department",
    requestingUnitRegion: branch?.region,
    ownerId: body.ownerId,
    ownerName: owner?.name ?? "",
    managerId: body.managerId ?? "",
    managerName: manager?.name ?? "",
    submittedAt: now,
    dueDate,
    revisedCount: 0,
    alertStatus: "pending",
    fileIds: [],
    tags: body.tags ?? [],
    createdAt: now,
    updatedAt: now,
  };

  db.adviceRequests.unshift(newRequest);
  recordEvent(
    db,
    newRequest.id,
    "created",
    newRequest.ownerId,
    newRequest.ownerName,
    `Created request ${newRequest.code}`,
  );

  return jsonResponse(newRequest, 201);
}

export async function handleUpdateLawRequest({
  params,
  request,
}: MockResolverContext) {
  await getDelay();
  const db = getDb();
  const index = db.adviceRequests.findIndex((r) => r.id === params.id);
  if (index === -1) return notFound("Request not found");
  const body = (await request.json()) as UpdateAdviceRequestInput;
  const prev = db.adviceRequests[index];
  const next: AdviceRequest = {
    ...prev,
    ...body,
    updatedAt: new Date().toISOString(),
  };
  // Giống bug đã sửa ở lm_handlers.ts: body chỉ gửi ownerId, không gửi kèm
  // ownerName -> phải tự tra tên mới.
  if (body.ownerId && body.ownerId !== prev.ownerId) {
    next.ownerName = findById(db.users, body.ownerId)?.name ?? next.ownerName;
  }

  const actorId = next.ownerId || prev.ownerId;
  const actorName = next.ownerName || prev.ownerName;

  if (body.status && body.status !== prev.status) {
    if (body.status === "completed") {
      next.completedAt = next.completedAt ?? new Date().toISOString();
      // Hoàn thành thì coi cảnh báo (nếu có) đã xử lý xong — không để
      // treo 1 request đã xong việc nhưng vẫn hiện đỏ.
      if (next.alertStatus !== "resolved") {
        next.alertStatus = "resolved";
        next.resolvedAt = next.completedAt;
        next.resolvedById = actorId;
      }
    }
    recordEvent(
      db,
      prev.id,
      "status_changed",
      actorId,
      actorName,
      `Status changed: ${prev.status} → ${body.status}`,
      prev.status,
      body.status,
    );
  }

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
      k !== "status" &&
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

  db.adviceRequests[index] = next;
  return jsonResponse(next);
}

export async function handleDeleteLawRequest({ params }: MockResolverContext) {
  await getDelay();
  const db = getDb();
  const id = params.id as string;
  const index = db.adviceRequests.findIndex((r) => r.id === id);
  if (index === -1) return notFound("Request not found");
  db.adviceRequests.splice(index, 1);
  db.lawEvents = db.lawEvents.filter((e) => e.requestId !== id);
  return jsonResponse({ success: true });
}

export async function handleGetLawRequestEvents({
  params,
}: MockResolverContext) {
  await getDelay();
  const db = getDb();
  const items = db.lawEvents
    .filter((e) => e.requestId === params.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return jsonResponse(items);
}

/** GĐ2 — tải công việc từng chuyên viên, cho hộp thoại phân công. Khuôn y
 * hệt computeOwnerWorkload của LM, đổi nguồn case sang adviceRequest và
 * trọng số theo mức ưu tiên LAW. */
function computeOwnerWorkloadForLaw(db: MockDb): LawWorkloadEntry[] {
  const owners = db.users.filter((u) => u.role === "owner");
  const openRequests = db.adviceRequests.filter((r) => r.status !== "completed");

  const entries: LawWorkloadEntry[] = owners.map((u) => {
    const mine = openRequests.filter((r) => r.ownerId === u.id);
    const weightedLoad = mine.reduce(
      (sum, r) => sum + LAW_PRIORITY_WORKLOAD_WEIGHT[r.priorityTier],
      0,
    );
    return {
      userId: u.id,
      userName: u.name,
      openRequestCount: mine.length,
      weightedLoad,
    };
  });
  entries.sort((a, b) => a.weightedLoad - b.weightedLoad);
  return entries;
}

export async function handleGetLawWorkload() {
  await getDelay();
  const db = getDb();
  return jsonResponse(computeOwnerWorkloadForLaw(db));
}

/** GĐ2 — "Đôn đốc": tạo Notification cho chuyên viên + ghi LawEvent. Khuôn
 * y hệt handleRemindLMCase. */
export async function handleRemindLawRequest({
  params,
  request,
}: MockResolverContext) {
  await getDelay();
  const db = getDb();
  const req = findById(db.adviceRequests, params.id as string);
  if (!req) return notFound("Request not found");

  const body = (await request
    .json()
    .catch(() => ({}) as { fromUserId?: string; fromUserName?: string })) as {
    fromUserId?: string;
    fromUserName?: string;
  };
  const fromUserId = body.fromUserId || req.managerId || req.ownerId;
  const fromUserName = body.fromUserName || req.managerName || req.ownerName;

  const now = new Date().toISOString();
  db.notifications.unshift({
    id: `ntf-${crypto.randomUUID()}`,
    userId: req.ownerId,
    title: `Reminder: ${req.code}`,
    description: `${fromUserName} is asking for a progress update on request "${req.title}"`,
    type: "compliance",
    read: false,
    entityType: "law",
    entityId: req.id,
    actionUrl: `/law/${req.id}`,
    createdAt: now,
    updatedAt: now,
  });

  recordEvent(
    db,
    req.id,
    "reminded",
    fromUserId,
    fromUserName,
    `Reminder sent to ${req.ownerName}`,
  );

  return jsonResponse({ success: true });
}

export async function handleGetLawSlaRules() {
  await getDelay();
  const db = getDb();
  return jsonResponse(db.slaRules);
}

/**
 * PSEUDO CODE (GĐ3 — xử lý cảnh báo đỏ của 1 yêu cầu)
 * 1. action="acknowledge": flagged -> acknowledged.
 * 2. action="resolve": flagged|acknowledged -> resolved.
 * 3. Khuôn y hệt handleUpdateLMDeadline của LM.
 */
export async function handleUpdateLawAlert({
  params,
  request,
}: MockResolverContext) {
  await getDelay();
  const db = getDb();
  const req = findById(db.adviceRequests, params.id as string);
  if (!req) return notFound("Request not found");

  const body = (await request.json()) as UpdateLawAlertInput;
  const actorId = body.actorId || req.ownerId;
  const actorName = body.actorName || req.ownerName;
  const now = new Date().toISOString();

  if (body.action === "acknowledge") {
    if (req.alertStatus !== "flagged") {
      return badRequest("Only a flagged request can be acknowledged");
    }
    req.alertStatus = "acknowledged";
    req.acknowledgedAt = now;
    req.acknowledgedById = actorId;
    recordEvent(
      db,
      req.id,
      "alert_acknowledged",
      actorId,
      actorName,
      "Acknowledged SLA alert",
    );
  } else if (body.action === "resolve") {
    if (req.alertStatus !== "flagged" && req.alertStatus !== "acknowledged") {
      return badRequest("Request has not been flagged yet or is already resolved");
    }
    req.alertStatus = "resolved";
    req.resolvedAt = now;
    req.resolvedById = actorId;
    recordEvent(
      db,
      req.id,
      "alert_resolved",
      actorId,
      actorName,
      "Resolved SLA alert",
    );
  } else {
    return badRequest("action must be acknowledge or resolve");
  }

  req.updatedAt = now;
  return jsonResponse(req);
}

/**
 * PSEUDO CODE (GĐ3 — Khai thác Tri thức, Phụ lục 3 mục 1.c)
 * 1. List hỗ trợ tìm theo từ khóa (title/summary/tags) — client gửi q.search,
 *    dùng filterByText trên title+summary, lọc tags riêng vì là mảng.
 * 2. Không có update/delete ở GĐ3 — kho tri thức chỉ thêm, không sửa (đủ
 *    cho demo "tránh tư vấn trùng lặp").
 */
export async function handleGetKnowledgeBaseList({
  request,
}: {
  request: Request;
}) {
  await getDelay();
  const url = new URL(request.url);
  const q = parseQuery(url);
  const db = getDb();
  let items = [...db.knowledgeBase];

  if (q.search) {
    const term = q.search.toLowerCase();
    items = items.filter(
      (e) =>
        e.title.toLowerCase().includes(term) ||
        e.summary.toLowerCase().includes(term) ||
        e.tags.some((t) => t.toLowerCase().includes(term)),
    );
  }
  items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return jsonResponse(items);
}

export async function handleCreateKnowledgeBaseEntry({
  request,
}: {
  request: Request;
}) {
  await getDelay();
  const body = (await request.json()) as Partial<CreateKnowledgeBaseEntryInput>;
  if (!body.title || !body.summary || !body.content) {
    return badRequest("title, summary and content are required");
  }
  const db = getDb();
  const now = new Date().toISOString();
  const author = body.authorId ? findById(db.users, body.authorId) : undefined;

  const entry: KnowledgeBaseEntry = {
    id: `kb-${crypto.randomUUID()}`,
    title: body.title,
    category: body.category ?? "Other",
    tags: body.tags ?? [],
    summary: body.summary,
    content: body.content,
    authorId: author?.id ?? body.authorId ?? "",
    authorName: author?.name ?? body.authorName ?? "",
    createdAt: now,
    updatedAt: now,
  };
  db.knowledgeBase.unshift(entry);
  return jsonResponse(entry, 201);
}

export const lawHandlers = [
  http.get("/api/law/requests", handleGetLawRequestList),
  http.post("/api/law/requests", handleCreateLawRequest),
  http.get("/api/law/requests/:id/events", handleGetLawRequestEvents),
  http.put("/api/law/requests/:id/alert", handleUpdateLawAlert),
  http.get("/api/law/requests/:id", handleGetLawRequestDetail),
  http.put("/api/law/requests/:id", handleUpdateLawRequest),
  http.delete("/api/law/requests/:id", handleDeleteLawRequest),
  http.get("/api/law/workload", handleGetLawWorkload),
  http.post("/api/law/requests/:id/remind", handleRemindLawRequest),
  http.get("/api/law/sla-rules", handleGetLawSlaRules),
  http.get("/api/law/knowledge-base", handleGetKnowledgeBaseList),
  http.post("/api/law/knowledge-base", handleCreateKnowledgeBaseEntry),
];
