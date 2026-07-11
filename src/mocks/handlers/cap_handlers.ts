import { http } from "msw";
import { getDb, findById, paginate, filterByText } from "@/mocks/db";
import {
  getDelay,
  jsonResponse,
  badRequest,
  notFound,
  parseQuery,
  parseNumber,
  type MockResolverContext,
} from "./utils";
import type { CAP, CAPComment, Obligation } from "@/types";

export async function handleGetCapList({ request }: { request: Request }) {
  await getDelay();
  const url = new URL(request.url);
  const q = parseQuery(url);

  const db = getDb();
  let items = [...db.caps];

  if (q.status) {
    const statuses = q.status.split(",").map((s) => s.trim());
    items = items.filter((item) => statuses.includes(item.status));
  }
  if (q.priority) {
    const priorities = q.priority.split(",").map((s) => s.trim());
    items = items.filter((item) => priorities.includes(item.priority));
  }
  if (q.owner) {
    items = items.filter(
      (item) =>
        item.ownerId === q.owner ||
        item.ownerName.toLowerCase().includes(q.owner.toLowerCase()),
    );
  }
  if (q.department) {
    items = items.filter((item) =>
      item.department.toLowerCase().includes(q.department.toLowerCase()),
    );
  }
  if (q.compliance) {
    items = items.filter(
      (item) =>
        item.obligationIds.includes(q.compliance!) ||
        (item.complianceTitle ?? "")
          .toLowerCase()
          .includes(q.compliance!.toLowerCase()),
    );
  }
  if (q.dueDateFrom) {
    items = items.filter((item) => item.dueDate >= q.dueDateFrom);
  }
  if (q.dueDateTo) {
    items = items.filter((item) => item.dueDate <= q.dueDateTo);
  }
  if (q.search) {
    items = filterByText(items, q.search, [
      "capId",
      "title",
      "ownerName",
      "department",
      "status",
    ]);
  }

  const page = parseNumber(q.page, 1);
  const pageSize = parseNumber(q.pageSize, 20);
  return jsonResponse(paginate(items, page, pageSize));
}

export async function handleGetCapDetail({ params }: MockResolverContext) {
  await getDelay();
  const db = getDb();
  const item = findById(db.caps, params.id as string);
  if (!item) return notFound("CAP not found");
  return jsonResponse(item);
}

export async function handleCreateCap({ request }: { request: Request }) {
  await getDelay();
  const body = (await request.json()) as Partial<CAP> & {
    complianceId?: string;
    obligationIds?: string[];
  };
  const now = new Date().toISOString();
  const db = getDb();

  // Backward compatibility: accept legacy single `complianceId` and wrap it.
  const obligationIds =
    body.obligationIds && body.obligationIds.length > 0
      ? body.obligationIds
      : body.complianceId
        ? [body.complianceId]
        : [];

  // Derive primary title from the first linked obligation (if any).
  const primary =
    obligationIds.length > 0
      ? findById(db.obligations, obligationIds[0])
      : undefined;

  const newItem: CAP = {
    id: `cap-${crypto.randomUUID()}`,
    capId: `CAP-${new Date().getFullYear()}-${String(db.caps.length + 1).padStart(3, "0")}`,
    title: body.title ?? "Untitled CAP",
    description: body.description ?? "",
    priority: body.priority ?? "medium",
    risk: body.risk ?? "medium",
    ownerId: body.ownerId ?? "",
    ownerName: body.ownerName ?? "",
    approverId: body.approverId ?? "",
    approverName: body.approverName ?? "",
    department: body.department ?? "",
    businessUnit: body.businessUnit ?? "",
    location: body.location,
    dueDate: body.dueDate ?? now,
    status: body.status ?? "Open",
    estimatedCost: body.estimatedCost ?? 0,
    actualCost: body.actualCost ?? 0,
    rootCause: body.rootCause ?? "",
    obligationIds,
    complianceTitle: body.complianceTitle ?? primary?.title,
    actions: body.actions ?? [],
    aiSuggestions: body.aiSuggestions ?? [],
    progress: body.progress ?? 0,
    tags: body.tags ?? [],
    fileIds: body.fileIds ?? [],
    createdAt: now,
    updatedAt: now,
  };

  // Bulk update linked obligations: mark as under active remediation.
  bulkUpdateObligationStatus(db, obligationIds, "cap_in_progress");

  db.caps.unshift(newItem);
  return jsonResponse(newItem, 201);
}

export async function handleUpdateCap({
  params,
  request,
}: MockResolverContext) {
  await getDelay();
  const db = getDb();
  const index = db.caps.findIndex((i) => i.id === params.id);
  if (index === -1) return notFound("CAP not found");
  const body = (await request.json()) as Partial<CAP> & {
    complianceId?: string;
    obligationIds?: string[];
  };

  // Backward compatibility: legacy single `complianceId` collapses into the array.
  let nextObligationIds = db.caps[index].obligationIds;
  if (body.obligationIds) {
    nextObligationIds = body.obligationIds;
  } else if (body.complianceId !== undefined) {
    nextObligationIds = body.complianceId ? [body.complianceId] : [];
  }

  const prev = db.caps[index];
  db.caps[index] = {
    ...prev,
    ...body,
    obligationIds: nextObligationIds,
    updatedAt: new Date().toISOString(),
  };

  // When a CAP transitions to Closed, mark all linked obligations as Completed.
  if (prev.status !== "Closed" && db.caps[index].status === "Closed") {
    bulkUpdateObligationStatus(db, nextObligationIds, "completed");
  }
  return jsonResponse(db.caps[index]);
}

/**
 * Bulk-set a status on every linked Obligation (the entities surfaced in the
 * /obligations UI). Silently skips IDs that no longer exist.
 */
function bulkUpdateObligationStatus(
  db: ReturnType<typeof getDb>,
  obligationIds: string[],
  status: Obligation["status"],
): void {
  for (const id of obligationIds) {
    const idx = db.obligations.findIndex((c) => c.id === id);
    if (idx !== -1) {
      db.obligations[idx] = {
        ...db.obligations[idx],
        status,
        updatedAt: new Date().toISOString(),
      };
    }
  }
}

export async function handleDeleteCap({ params }: MockResolverContext) {
  await getDelay();
  const db = getDb();
  const index = db.caps.findIndex((i) => i.id === params.id);
  if (index === -1) return notFound("CAP not found");
  db.caps.splice(index, 1);
  return jsonResponse({ success: true });
}

export async function handleGetCapTimeline({ params }: MockResolverContext) {
  await getDelay();
  const db = getDb();
  const item = findById(db.caps, params.id as string);
  if (!item) return notFound("CAP not found");
  return jsonResponse(db.generateTimelineFor(item.id, "cap") as unknown[]);
}

export async function handleGetCapComments({
  params,
  request,
}: MockResolverContext) {
  await getDelay();
  const url = new URL(request.url);
  const db = getDb();
  const item = findById(db.caps, params.id as string);
  if (!item) return notFound("CAP not found");
  const comments = db.generateCommentsFor(item.id, "cap");
  const page = parseNumber(parseQuery(url).page, 1);
  const pageSize = parseNumber(parseQuery(url).pageSize, 20);
  return jsonResponse(paginate(comments, page, pageSize));
}

export async function handleCreateCapComment({
  params,
  request,
}: MockResolverContext) {
  await getDelay();
  const db = getDb();
  const item = findById(db.caps, params.id as string);
  if (!item) return notFound("CAP not found");
  const body = (await request.json()) as {
    content?: string;
    userId?: string;
    userName?: string;
  };
  if (!body.content) return badRequest("Comment content is required");
  const comment: CAPComment = {
    id: `cmt-${crypto.randomUUID()}`,
    capId: item.id,
    userId: body.userId ?? "demo-admin",
    userName: body.userName ?? "Alexandra Chen",
    content: body.content,
    timestamp: new Date().toISOString(),
  };
  return jsonResponse(comment, 201);
}

export const capHandlers = [
  http.get("/api/cap", handleGetCapList),
  http.get("/api/cap/:id", handleGetCapDetail),
  http.post("/api/cap", handleCreateCap),
  http.put("/api/cap/:id", handleUpdateCap),
  http.delete("/api/cap/:id", handleDeleteCap),
  http.get("/api/cap/:id/timeline", handleGetCapTimeline),
  http.get("/api/cap/:id/comments", handleGetCapComments),
  http.post("/api/cap/:id/comments", handleCreateCapComment),
];
