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
  BulkCreateObligationsInput,
  BulkUpdateObligationsInput,
  BulkUpdateObligationsResult,
  Obligation,
  ObligationComment,
  ObligationRiskLevel,
  ObligationStatus,
  Assignment,
  CAP,
} from "@/types";

const RISK_LEVELS: ObligationRiskLevel[] = [
  "low",
  "medium",
  "high",
  "critical",
];

const VALID_STATUSES: ObligationStatus[] = [
  "draft",
  "submitted",
  "review_required",
  "approved",
  "rejected",
  "returned",
  "cap_in_progress",
  "completed",
  "archived",
];

function normalizeRisk(value: unknown): ObligationRiskLevel {
  return RISK_LEVELS.includes(value as ObligationRiskLevel)
    ? (value as ObligationRiskLevel)
    : "medium";
}

/**
 * Build a reverse index from obligation id → the (first) CAP that references it.
 * Used to resolve CAP linkage for list filtering and the "needs CAP" flow.
 */
function buildObligationCapIndex(caps: CAP[]): Map<string, CAP> {
  const index = new Map<string, CAP>();
  for (const cap of caps) {
    for (const obgId of cap.obligationIds ?? []) {
      if (!index.has(obgId)) index.set(obgId, cap);
    }
  }
  return index;
}

/**
 * Build a single Obligation record from a bulk input item, resolving the
 * denormalized assignment/department titles from the mock DB.
 */
function buildObligation(
  item: BulkCreateObligationsInput["obligations"][number],
  status: "draft" | "submitted",
  db: ReturnType<typeof getDb>,
  index: number,
  assignment?: Assignment,
): Obligation {
  const now = new Date().toISOString();
  const regulation = item.regulationId
    ? findById(db.regulations, item.regulationId)
    : assignment
      ? findById(db.regulations, assignment.regulationId)
      : undefined;
  const requester = item.ownerId ? findById(db.users, item.ownerId) : undefined;

  return {
    id: `obg-${crypto.randomUUID()}`,
    code: `OBG-${new Date().getFullYear()}-${String(db.obligations.length + index + 1).padStart(3, "0")}`,
    assignmentId: item.assignmentId ?? assignment?.id ?? "",
    assignmentTitle: assignment?.title,
    articleRef: item.articleRef,
    title: item.title,
    description: item.description ?? "",
    regulationId: regulation?.id ?? assignment?.regulationId ?? "",
    regulationName: regulation?.title ?? assignment?.regulationTitle ?? "",
    ownerDepartmentId: item.ownerDepartmentId,
    ownerDepartmentName: item.ownerDepartmentName ?? item.ownerDepartmentId,
    ownerId: item.ownerId ?? "",
    ownerName: item.ownerName ?? requester?.name ?? "",
    approverId: "",
    approverName: "",
    reviewerIds: [],
    businessUnit: "",
    department: item.ownerDepartmentName ?? item.ownerDepartmentId,
    location: "",
    frequency: "once",
    dueDate: item.dueDate,
    riskLevel: normalizeRisk(item.riskLevel),
    status,
    penalty: "",
    aiRiskScore: 50,
    tags: [],
    progress: 0,
    createdAt: now,
    updatedAt: now,
  };
}

export async function handleBulkCreateObligations({
  request,
}: {
  request: Request;
}) {
  await getDelay();
  const body = (await request.json()) as BulkCreateObligationsInput;

  if (!body.obligations || !Array.isArray(body.obligations))
    return badRequest("obligations array is required");
  if (body.obligations.length === 0)
    return badRequest("At least one obligation is required");
  if (body.status !== "draft" && body.status !== "submitted")
    return badRequest("status must be 'draft' or 'submitted'");

  // Pre-validate each row: articleRef + title are required.
  for (let i = 0; i < body.obligations.length; i++) {
    const row = body.obligations[i];
    if (!row.articleRef || !row.articleRef.trim())
      return badRequest(`Row ${i + 1}: Article Ref is required`);
    if (!row.title || !row.title.trim())
      return badRequest(`Row ${i + 1}: Title is required`);
    if (!row.dueDate) return badRequest(`Row ${i + 1}: Due date is required`);
  }

  const db = getDb();
  const items: Obligation[] = body.obligations.map((item, index) => {
    const assignment = item.assignmentId
      ? findById(db.assignments, item.assignmentId)
      : undefined;
    return buildObligation(item, body.status, db, index, assignment);
  });

  db.obligations.unshift(...items);

  return jsonResponse({ success: true, created: items.length, items }, 201);
}

export async function handleGetObligationList({
  request,
}: {
  request: Request;
}) {
  await getDelay();
  const url = new URL(request.url);
  const q = parseQuery(url);

  const db = getDb();
  let items = [...db.obligations];
  const capIndex = buildObligationCapIndex(db.caps);

  if (q.owner) {
    items = items.filter(
      (item) =>
        item.ownerId === q.owner ||
        item.ownerName.toLowerCase().includes(q.owner.toLowerCase()),
    );
  }
  if (q.ownerName) {
    items = items.filter((item) =>
      item.ownerName.toLowerCase().includes(q.ownerName.toLowerCase()),
    );
  }
  if (q.ownerDepartment) {
    items = items.filter(
      (item) =>
        item.ownerDepartmentId === q.ownerDepartment ||
        (item.ownerDepartmentName ?? "")
          .toLowerCase()
          .includes(q.ownerDepartment.toLowerCase()),
    );
  }
  if (q.assignmentId) {
    items = items.filter((item) => item.assignmentId === q.assignmentId);
  }
  if (q.status) {
    const statuses = normalizeArrayParam(q.status);
    items = items.filter((item) => statuses.includes(item.status));
  }
  if (q.riskLevel) {
    const levels = normalizeArrayParam(q.riskLevel);
    items = items.filter((item) => levels.includes(item.riskLevel));
  }
  if (q.overdue === "true") {
    const now = new Date().toISOString();
    items = items.filter(
      (item) => item.status !== "completed" && item.dueDate < now,
    );
  }
  if (q.capId) {
    items = items.filter((item) => capIndex.get(item.id)?.id === q.capId);
  }
  if (q.withoutCap === "true") {
    items = items.filter((item) => !capIndex.has(item.id));
  }
  if (q.dueDateFrom) {
    items = items.filter((item) => item.dueDate >= q.dueDateFrom);
  }
  if (q.dueDateTo) {
    items = items.filter((item) => item.dueDate <= q.dueDateTo);
  }
  if (q.search) {
    items = filterByText(items, q.search, [
      "articleRef",
      "title",
      "ownerName",
      "ownerDepartmentName",
      "status",
    ]);
  }

  const sortField = q.sortField ?? "dueDate";
  const sortDirection = q.sortDirection ?? "asc";
  items.sort((a, b) => {
    const aVal = a[sortField as keyof Obligation];
    const bVal = b[sortField as keyof Obligation];
    if (aVal == null || bVal == null) return 0;
    if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
    if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  const page = parseNumber(q.page, 1);
  const pageSize = parseNumber(q.pageSize, 50);
  return jsonResponse(paginate(items, page, pageSize));
}

export async function handleGetObligationDetail({
  params,
}: MockResolverContext) {
  await getDelay();
  const db = getDb();
  const item = findById(db.obligations, params.id as string);
  if (!item) return notFound("Obligation not found");
  return jsonResponse(item);
}

export async function handleUpdateObligation({
  params,
  request,
}: MockResolverContext) {
  await getDelay();
  const db = getDb();
  const index = db.obligations.findIndex((i) => i.id === params.id);
  if (index === -1) return notFound("Obligation not found");
  const body = (await request.json()) as Partial<Obligation>;
  db.obligations[index] = {
    ...db.obligations[index],
    ...body,
    updatedAt: new Date().toISOString(),
  };
  return jsonResponse(db.obligations[index]);
}

export async function handleDeleteObligation({
  params,
}: MockResolverContext) {
  await getDelay();
  const db = getDb();
  const index = db.obligations.findIndex((i) => i.id === params.id);
  if (index === -1) return notFound("Obligation not found");
  db.obligations.splice(index, 1);
  return jsonResponse({ success: true });
}

export async function handleGetObligationTimeline({
  params,
}: MockResolverContext) {
  await getDelay();
  const db = getDb();
  const item = findById(db.obligations, params.id as string);
  if (!item) return notFound("Obligation not found");
  return jsonResponse(
    db.generateTimelineFor(item.id, "obligation") as unknown[],
  );
}

export async function handleGetObligationComments({
  params,
  request,
}: MockResolverContext) {
  await getDelay();
  const url = new URL(request.url);
  const db = getDb();
  const item = findById(db.obligations, params.id as string);
  if (!item) return notFound("Obligation not found");
  const comments = db.generateCommentsFor(item.id, "obligation");
  const page = parseNumber(parseQuery(url).page, 1);
  const pageSize = parseNumber(parseQuery(url).pageSize, 20);
  return jsonResponse(paginate(comments, page, pageSize));
}

export async function handleCreateObligationComment({
  params,
  request,
}: MockResolverContext) {
  await getDelay();
  const db = getDb();
  const item = findById(db.obligations, params.id as string);
  if (!item) return notFound("Obligation not found");
  const body = (await request.json()) as {
    content?: string;
    userId?: string;
    userName?: string;
  };
  if (!body.content) return badRequest("Comment content is required");
  const comment: ObligationComment = {
    id: `cmt-${crypto.randomUUID()}`,
    obligationId: item.id,
    userId: body.userId ?? "demo-admin",
    userName: body.userName ?? "Alexandra Chen",
    content: body.content,
    timestamp: new Date().toISOString(),
  };
  return jsonResponse(comment, 201);
}

export async function handleBulkUpdateObligations({
  request,
}: {
  request: Request;
}) {
  await getDelay();
  const body = (await request.json()) as BulkUpdateObligationsInput;
  if (!Array.isArray(body.ids) || body.ids.length === 0)
    return badRequest("ids array is required");
  if (!body.status && !body.dueDate)
    return badRequest("Provide a status or dueDate to update");

  if (body.status && !VALID_STATUSES.includes(body.status))
    return badRequest(`status must be one of: ${VALID_STATUSES.join(", ")}`);

  const db = getDb();
  const now = new Date().toISOString();
  const updated: Obligation[] = [];
  const idSet = new Set(body.ids);

  for (const item of db.obligations) {
    if (!idSet.has(item.id)) continue;
    if (body.status) item.status = body.status;
    if (body.dueDate) item.dueDate = body.dueDate;
    item.updatedAt = now;
    updated.push(item);
  }

  const result: BulkUpdateObligationsResult = {
    success: true,
    updated: updated.length,
    items: updated,
  };
  return jsonResponse(result);
}

export const obligationHandlers = [
  http.get("/api/obligations/list", handleGetObligationList),
  http.post("/api/obligations/bulk", handleBulkCreateObligations),
  http.patch("/api/obligations/bulk", handleBulkUpdateObligations),
  http.get("/api/obligations/:id/timeline", handleGetObligationTimeline),
  http.get("/api/obligations/:id/comments", handleGetObligationComments),
  http.post("/api/obligations/:id/comments", handleCreateObligationComment),
  http.get("/api/obligations/:id", handleGetObligationDetail),
  http.put("/api/obligations/:id", handleUpdateObligation),
  http.patch("/api/obligations/:id", handleUpdateObligation),
  http.delete("/api/obligations/:id", handleDeleteObligation),
];

// Re-export the context type for the direct API bridge.
export type { MockResolverContext };
