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
 * 5. GĐ4 — handleGetLawDashboard gộp sẵn mọi KPI/biểu đồ trong 1 API, tính
 *    ở server 1 lần — khuôn y hệt handleGetLMDashboard.
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
  actorFromRequest,
  forbidden,
  type MockResolverContext,
} from "./utils";
import { hasPermission } from "@/constants/rbac";
import {
  LAW_DEFAULT_FOLDERS,
  LAW_PRIORITY_SLA_DAYS,
  LAW_PRIORITY_WORKLOAD_WEIGHT,
  LAW_PRIORITY_TIERS,
} from "@/constants/law";
import { LAW_REQUEST_STATUSES } from "@/constants/law";
import { nextAlertStatus, alertSeverity } from "@/lib/deadline-alerts";
import { DEMO_TODAY } from "@/mocks/db";
import type {
  AdviceRequest,
  LawEvent,
  CreateAdviceRequestInput,
  UpdateAdviceRequestInput,
  UpdateLawAlertInput,
  LawWorkloadEntry,
  LawDashboardSummary,
  KnowledgeBaseEntry,
  CreateKnowledgeBaseEntryInput,
  SaveOpinionToKnowledgeBaseInput,
  AdvisoryOpinion,
  LawMessage,
  AssessLawRequestInput,
  CreateLawMessageInput,
  SubmitAdvisoryOpinionInput,
  ReviewAdvisoryOpinionInput,
  UserProfile,
  LawQueueItem,
} from "@/types";
import type { MockDb } from "@/mocks/db";

export function recordEvent(
  db: MockDb,
  requestId: string,
  type: LawEvent["type"],
  userId: string,
  userName: string,
  description: string,
  fromValue?: string,
  toValue?: string,
  subject?: string,
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
    subject,
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
        "system",
        "System",
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

/**
 * Review GĐ3 — chuyên viên tư vấn (role owner) chỉ xem yêu cầu mình phụ
 * trách, kể cả khi gõ thẳng URL. Manager/Approver/Admin xem mọi yêu cầu.
 * Request không có token (seed/test) không bị chặn.
 */
function assertRequestAccess(db: MockDb, request: Request, requestId: string): Response | null {
  const user = currentUser(db, request);
  if (!user || user.role !== "owner") return null;
  const item = findById(db.adviceRequests, requestId);
  if (item && item.ownerId !== user.id) {
    return forbidden("You can only view requests assigned to you");
  }
  return null;
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
  const viewer = currentUser(db, request);
  let items =
    viewer?.role === "owner"
      ? db.adviceRequests.filter((r) => r.ownerId === viewer.id)
      : [...db.adviceRequests];

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

export async function handleGetLawRequestDetail({ params, request }: MockResolverContext) {
  await getDelay();
  const db = getDb();
  const denied = assertRequestAccess(db, request, params.id as string);
  if (denied) return denied;
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
    initialPriorityTier: priorityTier,
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
    folders: [...LAW_DEFAULT_FOLDERS],
    tags: body.tags ?? [],
    createdAt: now,
    updatedAt: now,
  };

  db.adviceRequests.unshift(newRequest);
  const creator = actorFromRequest(request, db.users) ?? {
    id: newRequest.ownerId,
    name: newRequest.ownerName,
  };
  recordEvent(
    db,
    newRequest.id,
    "created",
    creator.id,
    creator.name,
    `Created request ${newRequest.code}`,
    undefined,
    undefined,
    newRequest.code,
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

  const actor = actorFromRequest(request, db.users) ?? { id: prev.ownerId, name: prev.ownerName };
  const actorId = actor.id;
  const actorName = actor.name;

  // Folder mới (tab Tài liệu) ghi event riêng, không gộp vào "updated".
  if (body.folders) {
    body.folders
      .filter((f) => !(prev.folders ?? []).includes(f))
      .forEach((f) =>
        recordEvent(db, prev.id, "folder_created", actorId, actorName, `Created folder "${f}"`, undefined, undefined, f),
      );
  }

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
      k !== "folders" &&
      (body as Record<string, unknown>)[k] !== undefined &&
      // Form sửa gửi lại MỌI field — chỉ ghi field giá trị thật sự đổi.
      JSON.stringify((body as Record<string, unknown>)[k]) !==
        JSON.stringify((prev as unknown as Record<string, unknown>)[k]),
  );
  if (changedKeys.length > 0) {
    recordEvent(
      db,
      prev.id,
      "updated",
      actorId,
      actorName,
      `Updated: ${changedKeys.join(", ")}`,
      undefined,
      undefined,
      changedKeys.join(", "),
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
  // Audit trail KHÔNG xoá theo yêu cầu — vẫn tra lại được sau khi xoá.
  db.lawMessages = db.lawMessages.filter((m) => m.requestId !== id);
  db.advisoryOpinions = db.advisoryOpinions.filter((o) => o.requestId !== id);
  return jsonResponse({ success: true });
}

export async function handleGetLawRequestEvents({ params, request }: MockResolverContext) {
  await getDelay();
  const db = getDb();
  const denied = assertRequestAccess(db, request, params.id as string);
  if (denied) return denied;
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
  const fromToken = actorFromRequest(request, db.users);
  const fromUserId = fromToken?.id || body.fromUserId || req.managerId || req.ownerId;
  const fromUserName = fromToken?.name || body.fromUserName || req.managerName || req.ownerName;

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
    undefined,
    undefined,
    req.ownerName,
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
  const fromToken = actorFromRequest(request, db.users);
  const actorId = fromToken?.id || body.actorId || req.ownerId;
  const actorName = fromToken?.name || body.actorName || req.ownerName;
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

  if (q.kind) {
    items = items.filter((e) => e.kind === q.kind);
  }
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
  const author = currentUser(db, request) ?? (body.authorId ? findById(db.users, body.authorId) : undefined);

  const entry: KnowledgeBaseEntry = {
    id: `kb-${crypto.randomUUID()}`,
    kind: body.kind === "precedent" ? "precedent" : "template",
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

/**
 * PSEUDO CODE — review GĐ4 "Tư vấn mẫu": lưu ý kiến đã duyệt thành mục kho
 * 1. Chỉ yêu cầu đã đóng, có bản ý kiến "approved". Người lưu: chuyên viên
 *    phụ trách hoặc Manager (law:approve).
 * 2. Ẩn danh: thay tên đơn vị yêu cầu và mã yêu cầu trong nội dung — mẫu
 *    dùng chung toàn pháp chế, không lộ ai đã hỏi.
 * 3. Mỗi yêu cầu lưu 1 lần (chặn trùng theo sourceRequestId). Ghi LawEvent.
 */
export async function handleSaveOpinionToKnowledgeBase({ params, request }: MockResolverContext) {
  await getDelay();
  const db = getDb();
  const item = findById(db.adviceRequests, params.id as string);
  if (!item) return notFound("Request not found");
  const user = currentUser(db, request);
  if (!user || (user.id !== item.ownerId && !hasPermission(user.role, "law:approve"))) {
    return forbidden("Only the assigned specialist or a manager can save this opinion");
  }
  if (item.status !== "completed") return badRequest("Only closed requests can be saved to the knowledge base");
  const approved = db.advisoryOpinions
    .filter((o) => o.requestId === item.id && o.status === "approved")
    .sort((a, b) => b.version - a.version)[0];
  if (!approved) return badRequest("This request has no approved opinion");
  if (db.knowledgeBase.some((e) => e.sourceRequestId === item.id)) {
    return badRequest("This request has already been saved to the knowledge base");
  }
  const body = (await request.json()) as SaveOpinionToKnowledgeBaseInput;
  const title = body.title?.trim();
  if (!title) return badRequest("title is required");

  const anonymize = (text: string) =>
    text.split(item.requestingUnitName).join("[Requesting unit]").split(item.code).join("[Request]");
  const content = anonymize(approved.content);
  const now = new Date().toISOString();
  const entry: KnowledgeBaseEntry = {
    id: `kb-${crypto.randomUUID()}`,
    kind: body.kind === "precedent" ? "precedent" : "template",
    title: anonymize(title),
    category: body.category?.trim() || "Other",
    tags: body.tags ?? [],
    summary: content.length > 180 ? `${content.slice(0, 177)}...` : content,
    content,
    authorId: user.id,
    authorName: user.name,
    sourceRequestId: item.id,
    sourceRequestCode: item.code,
    createdAt: now,
    updatedAt: now,
  };
  db.knowledgeBase.unshift(entry);
  recordEvent(db, item.id, "saved_to_knowledge_base", user.id, user.name,
    `Saved advisory opinion v${approved.version} to the knowledge base`, undefined, entry.kind, entry.title);
  return jsonResponse(entry, 201);
}

/**
 * PSEUDO CODE (GĐ4 + review GĐ3 — tổng hợp dashboard)
 * 1. Chạy evaluateLawAlerts trước để KPI cảnh báo dùng trạng thái mới nhất.
 * 2. Phạm vi từ token: chuyên viên (role owner) → chỉ yêu cầu mình phụ
 *    trách; còn lại → toàn bộ. Hàng đợi chỉ gồm yêu cầu đang mở.
 * 3. KPI a đúng hạn: completedAt <= dueDate ÷ đã đóng. KPI b chất lượng:
 *    revisedCount===0 ÷ đã đóng (dữ liệu thật từ flow duyệt). KPI c xử lý
 *    cảnh báo: resolved ÷ đã từng flagged.
 * 4. Trạng thái SLA hàng đợi theo DEMO_TODAY: quá hạn / trong ngưỡng
 *    SlaRule.alertDaysBefore (sắp hạn) / còn hạn.
 */
const TIER_RANK: Record<string, number> = { law_mandatory: 0, sbv_regulation: 1, internal: 2 };
const SLA_RANK = { overdue: 0, due_soon: 1, upcoming: 2 } as const;

function slaStateOf(db: MockDb, r: AdviceRequest): LawQueueItem["slaState"] {
  const days = (new Date(r.dueDate).getTime() - DEMO_TODAY.getTime()) / 86_400_000;
  if (days < 0) return "overdue";
  const rule = db.slaRules.find((sr) => sr.priorityTier === r.priorityTier);
  return days <= (rule?.alertDaysBefore ?? 3) ? "due_soon" : "upcoming";
}

const rate = (num: number, den: number) => (den > 0 ? Math.round((num / den) * 100) : 0);
const isOnTime = (r: AdviceRequest) => !!r.completedAt && new Date(r.completedAt) <= new Date(r.dueDate);

export async function handleGetLawDashboard({ request }: { request: Request }) {
  await getDelay();
  const db = getDb();
  evaluateLawAlerts(db);

  const user = currentUser(db, request);
  const scope: LawDashboardSummary["scope"] = user?.role === "owner" ? "specialist" : "manager";
  const scoped =
    scope === "specialist" ? db.adviceRequests.filter((r) => r.ownerId === user!.id) : db.adviceRequests;

  const openRequests = scoped.filter((r) => r.status !== "completed");
  const completedRequests = scoped.filter((r) => r.status === "completed");

  const everFlagged = scoped.filter((r) => r.alertStatus !== "pending");
  const resolved = scoped.filter((r) => r.alertStatus === "resolved");

  const lastOpinion = (id: string) =>
    db.advisoryOpinions.filter((o) => o.requestId === id).sort((x, y) => y.version - x.version)[0];

  const queueAll: LawQueueItem[] = openRequests
    .map((r) => ({
      id: r.id,
      code: r.code,
      title: r.title,
      ownerName: r.ownerName,
      status: r.status,
      priorityTier: r.priorityTier,
      dueDate: r.dueDate,
      slaState: slaStateOf(db, r),
      nextActor: (r.status === "in_progress" ? "specialist" : "manager") as LawQueueItem["nextActor"],
      returned: r.status === "in_progress" && lastOpinion(r.id)?.status === "returned",
    }))
    .sort(
      (x, y) =>
        SLA_RANK[x.slaState] - SLA_RANK[y.slaState] ||
        TIER_RANK[x.priorityTier] - TIER_RANK[y.priorityTier] ||
        x.dueDate.localeCompare(y.dueDate),
    );

  const slaTrend = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(DEMO_TODAY);
    d.setMonth(d.getMonth() - (5 - i));
    const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const inMonth = completedRequests.filter((r) => r.completedAt!.startsWith(month));
    const onTime = inMonth.filter(isOnTime).length;
    return { month, onTime, late: inMonth.length - onTime };
  });

  const unitCounts = new Map<string, number>();
  scoped.forEach((r) => unitCounts.set(r.requestingUnitName, (unitCounts.get(r.requestingUnitName) ?? 0) + 1));

  const ownerKpi =
    scope === "specialist"
      ? []
      : db.users
          .filter((u) => u.role === "owner")
          .map((u) => {
            const mine = db.adviceRequests.filter((r) => r.ownerId === u.id);
            const done = mine.filter((r) => r.status === "completed");
            return {
              userName: u.name,
              total: mine.length,
              onTimeRate: rate(done.filter(isOnTime).length, done.length),
              qualityRate: rate(done.filter((r) => r.revisedCount === 0).length, done.length),
              openCount: mine.length - done.length,
            };
          })
          .filter((k) => k.total > 0)
          .map(({ userName, onTimeRate, qualityRate, openCount }) => ({ userName, onTimeRate, qualityRate, openCount }));

  const summary: LawDashboardSummary = {
    scope,
    totalOpen: openRequests.length,
    totalCompleted: completedRequests.length,
    totalRedFlagRequests: scoped.filter((r) => r.alertStatus === "flagged").length,
    awaitingAssessment: openRequests.filter((r) => r.status === "new").length,
    awaitingApproval: openRequests.filter((r) => r.status === "pending_approval").length,
    returnedForRevision: queueAll.filter((q) => q.returned).length,
    onTimeCompletionRate: rate(completedRequests.filter(isOnTime).length, completedRequests.length),
    qualityRate: rate(completedRequests.filter((r) => r.revisedCount === 0).length, completedRequests.length),
    alertResolutionRate: rate(resolved.length, everFlagged.length),
    // Chuyên viên: chỉ phân bổ của yêu cầu đang mở (comment: "chỉ thấy case đang mở").
    statusDistribution: LAW_REQUEST_STATUSES.map((status) => ({
      status,
      count: (scope === "specialist" ? openRequests : scoped).filter((r) => r.status === status).length,
    })),
    priorityDistribution: LAW_PRIORITY_TIERS.map((priorityTier) => ({
      priorityTier,
      count: (scope === "specialist" ? openRequests : scoped).filter((r) => r.priorityTier === priorityTier).length,
    })),
    unitDistribution: Array.from(unitCounts.entries())
      .map(([unitName, count]) => ({ unitName, count }))
      .sort((x, y) => y.count - x.count),
    ownerWorkload: scope === "specialist" ? [] : computeOwnerWorkloadForLaw(db),
    queue: queueAll.slice(0, 10),
    queueCounts: {
      overdue: queueAll.filter((q) => q.slaState === "overdue").length,
      dueSoon: queueAll.filter((q) => q.slaState === "due_soon").length,
      upcoming: queueAll.filter((q) => q.slaState === "upcoming").length,
    },
    slaTrend,
    slaStatus: {
      closedOnTime: completedRequests.filter(isOnTime).length,
      closedLate: completedRequests.filter((r) => !isOnTime(r)).length,
      openWithinSla: queueAll.filter((q) => q.slaState !== "overdue").length,
      openBreached: queueAll.filter((q) => q.slaState === "overdue").length,
    },
    ownerKpi,
  };
  return jsonResponse(summary);
}

/**
 * PSEUDO CODE — review GĐ1: flow tư vấn 4 bước
 * 1. Đánh giá ưu tiên (Manager = quyền law:approve): chỉ khi status "new".
 *    Chốt mức ưu tiên → hạn SLA tính lại 1 lần từ submittedAt → "in_progress".
 * 2. Trao đổi: tin nhắn khi "in_progress"/"pending_approval". Bên "legal" =
 *    người đăng nhập; bên "requester" là MÔ PHỎNG (demo chưa có vai trò đơn
 *    vị nghiệp vụ) — ghi tên đơn vị, audit vẫn ghi người thật đã bấm gửi.
 * 3. Nộp ý kiến: chuyên viên phụ trách (hoặc Admin), khi "in_progress" →
 *    "pending_approval". Mỗi lần nộp 1 version mới, không sửa bản cũ.
 * 4. Duyệt: Manager. approve → "completed" + tự xử lý cảnh báo treo;
 *    return → "in_progress", revisedCount++ (KPI b chất lượng).
 * Người thực hiện luôn lấy từ token — không tin actor client gửi lên.
 */
function currentUser(db: MockDb, request: Request): UserProfile | undefined {
  const actor = actorFromRequest(request, db.users);
  return actor ? findById(db.users, actor.id) : undefined;
}

export async function handleAssessLawRequest({ params, request }: MockResolverContext) {
  await getDelay();
  const db = getDb();
  const item = findById(db.adviceRequests, params.id as string);
  if (!item) return notFound("Request not found");
  const user = currentUser(db, request);
  if (!user || !hasPermission(user.role, "law:approve")) {
    return forbidden("Only a manager can assess priority");
  }
  if (item.status !== "new") return badRequest("Priority has already been assessed");

  const body = (await request.json()) as AssessLawRequestInput;
  if (!LAW_PRIORITY_TIERS.includes(body.priorityTier)) {
    return badRequest("priorityTier is invalid");
  }
  const now = new Date().toISOString();
  const rule = db.slaRules.find((r) => r.priorityTier === body.priorityTier);
  const slaDays = rule?.slaDays ?? LAW_PRIORITY_SLA_DAYS[body.priorityTier];
  const prevTier = item.priorityTier;

  item.priorityTier = body.priorityTier;
  item.dueDate = new Date(new Date(item.submittedAt).getTime() + slaDays * 86_400_000).toISOString();
  item.assessedAt = now;
  item.assessedById = user.id;
  item.assessedByName = user.name;
  item.assessmentNote = body.note?.trim() || undefined;
  item.status = "in_progress";
  item.updatedAt = now;
  // Hạn mới có thể chưa tới ngưỡng cảnh báo — cho engine đánh giá lại.
  if (item.alertStatus === "flagged") item.alertStatus = "pending";

  recordEvent(db, item.id, "priority_assessed", user.id, user.name,
    `Assessed priority: ${prevTier} → ${body.priorityTier}`, prevTier, body.priorityTier);
  return jsonResponse(item);
}

export async function handleGetLawMessages({ params, request }: MockResolverContext) {
  await getDelay();
  const db = getDb();
  const denied = assertRequestAccess(db, request, params.id as string);
  if (denied) return denied;
  const items = db.lawMessages
    .filter((m) => m.requestId === params.id)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  return jsonResponse(items);
}

export async function handlePostLawMessage({ params, request }: MockResolverContext) {
  await getDelay();
  const db = getDb();
  const denied = assertRequestAccess(db, request, params.id as string);
  if (denied) return denied;
  const item = findById(db.adviceRequests, params.id as string);
  if (!item) return notFound("Request not found");
  const user = currentUser(db, request);
  if (!user || !hasPermission(user.role, "law:read")) return forbidden("Not allowed");
  if (item.status !== "in_progress" && item.status !== "pending_approval") {
    return badRequest("Messages are only open while the request is in discussion");
  }
  const body = (await request.json()) as CreateLawMessageInput;
  const content = body.content?.trim();
  if (!content && !(body.fileIds?.length)) return badRequest("Message is empty");
  if (body.side !== "legal" && body.side !== "requester") return badRequest("side is invalid");

  const now = new Date().toISOString();
  const message: LawMessage = {
    id: `lmsg-${crypto.randomUUID()}`,
    requestId: item.id,
    side: body.side,
    // Bên đơn vị là mô phỏng — hiển thị tên đơn vị, không mạo danh 1 người cụ thể.
    authorId: body.side === "legal" ? user.id : `contact-${item.requestingUnitId}`,
    authorName: body.side === "legal" ? user.name : item.requestingUnitName,
    content: content ?? "",
    fileIds: body.fileIds ?? [],
    createdAt: now,
    updatedAt: now,
  };
  db.lawMessages.push(message);
  item.updatedAt = now;
  recordEvent(db, item.id, "message_posted", user.id, user.name,
    body.side === "legal" ? "Posted a message" : `Posted a message on behalf of ${item.requestingUnitName}`,
    undefined, undefined, body.side);
  return jsonResponse(message, 201);
}

export async function handleGetLawOpinions({ params, request }: MockResolverContext) {
  await getDelay();
  const db = getDb();
  const denied = assertRequestAccess(db, request, params.id as string);
  if (denied) return denied;
  const items = db.advisoryOpinions
    .filter((o) => o.requestId === params.id)
    .sort((a, b) => b.version - a.version);
  return jsonResponse(items);
}

export async function handleSubmitLawOpinion({ params, request }: MockResolverContext) {
  await getDelay();
  const db = getDb();
  const item = findById(db.adviceRequests, params.id as string);
  if (!item) return notFound("Request not found");
  const user = currentUser(db, request);
  if (!user || (user.id !== item.ownerId && user.role !== "admin")) {
    return forbidden("Only the assigned specialist can submit the opinion");
  }
  if (item.status !== "in_progress") {
    return badRequest("An opinion can only be submitted while the request is in discussion");
  }
  const body = (await request.json()) as SubmitAdvisoryOpinionInput;
  const content = body.content?.trim();
  if (!content) return badRequest("Opinion content is required");

  const now = new Date().toISOString();
  const version =
    Math.max(0, ...db.advisoryOpinions.filter((o) => o.requestId === item.id).map((o) => o.version)) + 1;
  const opinion: AdvisoryOpinion = {
    id: `op-${crypto.randomUUID()}`,
    requestId: item.id,
    version,
    content,
    fileIds: body.fileIds ?? [],
    issuedById: user.id,
    issuedByName: user.name,
    issuedAt: now,
    status: "submitted",
    createdAt: now,
    updatedAt: now,
  };
  db.advisoryOpinions.push(opinion);
  item.status = "pending_approval";
  item.updatedAt = now;
  recordEvent(db, item.id, "opinion_issued", user.id, user.name,
    `Submitted advisory opinion v${version}`, undefined, undefined, String(version));
  return jsonResponse(opinion, 201);
}

export async function handleReviewLawOpinion({ params, request }: MockResolverContext) {
  await getDelay();
  const db = getDb();
  const opinion = findById(db.advisoryOpinions, params.id as string);
  if (!opinion) return notFound("Opinion not found");
  const item = findById(db.adviceRequests, opinion.requestId);
  if (!item) return notFound("Request not found");
  const user = currentUser(db, request);
  if (!user || !hasPermission(user.role, "law:approve")) {
    return forbidden("Only a manager can review the opinion");
  }
  if (opinion.status !== "submitted" || item.status !== "pending_approval") {
    return badRequest("This opinion is not awaiting review");
  }
  const body = (await request.json()) as ReviewAdvisoryOpinionInput;
  const note = body.note?.trim();
  if (body.action === "return" && !note) {
    return badRequest("Please explain what needs to be revised");
  }
  const now = new Date().toISOString();
  opinion.reviewedById = user.id;
  opinion.reviewedByName = user.name;
  opinion.reviewedAt = now;
  opinion.reviewNote = note || undefined;
  opinion.updatedAt = now;

  if (body.action === "approve") {
    opinion.status = "approved";
    item.status = "completed";
    item.completedAt = now;
    if (item.alertStatus !== "resolved") {
      item.alertStatus = "resolved";
      item.resolvedAt = now;
      item.resolvedById = user.id;
    }
    recordEvent(db, item.id, "opinion_approved", user.id, user.name,
      `Approved advisory opinion v${opinion.version}`, undefined, undefined, String(opinion.version));
    recordEvent(db, item.id, "status_changed", user.id, user.name,
      "Request closed", "pending_approval", "completed");
  } else if (body.action === "return") {
    opinion.status = "returned";
    item.status = "in_progress";
    item.revisedCount += 1;
    recordEvent(db, item.id, "revision_requested", user.id, user.name,
      `Returned advisory opinion v${opinion.version} for revision`, undefined, undefined, String(opinion.version));
  } else {
    return badRequest("action must be approve or return");
  }
  item.updatedAt = now;
  return jsonResponse(opinion);
}

export const lawHandlers = [
  http.get("/api/law/requests", handleGetLawRequestList),
  http.post("/api/law/requests", handleCreateLawRequest),
  http.get("/api/law/requests/:id/events", handleGetLawRequestEvents),
  http.post("/api/law/requests/:id/assess", handleAssessLawRequest),
  http.get("/api/law/requests/:id/messages", handleGetLawMessages),
  http.post("/api/law/requests/:id/messages", handlePostLawMessage),
  http.get("/api/law/requests/:id/opinions", handleGetLawOpinions),
  http.post("/api/law/requests/:id/opinions", handleSubmitLawOpinion),
  http.post("/api/law/opinions/:id/review", handleReviewLawOpinion),
  http.post("/api/law/requests/:id/save-to-kb", handleSaveOpinionToKnowledgeBase),
  http.put("/api/law/requests/:id/alert", handleUpdateLawAlert),
  http.get("/api/law/requests/:id", handleGetLawRequestDetail),
  http.put("/api/law/requests/:id", handleUpdateLawRequest),
  http.delete("/api/law/requests/:id", handleDeleteLawRequest),
  http.get("/api/law/workload", handleGetLawWorkload),
  http.post("/api/law/requests/:id/remind", handleRemindLawRequest),
  http.get("/api/law/sla-rules", handleGetLawSlaRules),
  http.get("/api/law/knowledge-base", handleGetKnowledgeBaseList),
  http.post("/api/law/knowledge-base", handleCreateKnowledgeBaseEntry),
  http.get("/api/law/dashboard", handleGetLawDashboard),
];
