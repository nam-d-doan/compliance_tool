/**
 * PSEUDO CODE (ngắn gọn)
 * 1. CRUD yêu cầu (list/detail/create/update/delete) — giống hệt khuôn
 *    lm_handlers.ts, chỉ đổi tên thực thể.
 * 2. Mọi thao tác ghi thay đổi đều gọi recordEvent() → push LawEvent (tab
 *    Lịch sử) + AuditLog chung (Phụ lục 3 mục 2.b).
 * 3. GĐ1 chưa có: tính dueDate/SLA (GĐ2), cảnh báo đỏ (GĐ3), ý kiến tư vấn
 *    (AdvisoryOpinion — thêm khi làm tab "Ý kiến tư vấn" sau).
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
import type {
  AdviceRequest,
  LawEvent,
  CreateAdviceRequestInput,
  UpdateAdviceRequestInput,
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

export async function handleGetLawRequestList({
  request,
}: {
  request: Request;
}) {
  await getDelay();
  const url = new URL(request.url);
  const q = parseQuery(url);
  const db = getDb();
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
  return jsonResponse(paginate(items, page, pageSize));
}

export async function handleGetLawRequestDetail({
  params,
}: MockResolverContext) {
  await getDelay();
  const db = getDb();
  const item = findById(db.adviceRequests, params.id as string);
  if (!item) return notFound("Request not found");
  return jsonResponse(item);
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

  const newRequest: AdviceRequest = {
    id: `law-${crypto.randomUUID()}`,
    code: `LAW-${new Date().getFullYear()}-${String(
      db.adviceRequests.length + 1,
    ).padStart(3, "0")}`,
    title: body.title,
    description: body.description,
    priorityTier: body.priorityTier ?? "internal",
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
    revisedCount: 0,
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

export const lawHandlers = [
  http.get("/api/law/requests", handleGetLawRequestList),
  http.post("/api/law/requests", handleCreateLawRequest),
  http.get("/api/law/requests/:id/events", handleGetLawRequestEvents),
  http.get("/api/law/requests/:id", handleGetLawRequestDetail),
  http.put("/api/law/requests/:id", handleUpdateLawRequest),
  http.delete("/api/law/requests/:id", handleDeleteLawRequest),
];
