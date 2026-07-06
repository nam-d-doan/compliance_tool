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
import type { CAP, CAPComment } from "@/types";

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
        item.complianceId === q.compliance ||
        (item.complianceTitle ?? "")
          .toLowerCase()
          .includes(q.compliance.toLowerCase()),
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
  const body = (await request.json()) as Partial<CAP>;
  const now = new Date().toISOString();
  const db = getDb();
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
    complianceId: body.complianceId,
    complianceTitle: body.complianceTitle,
    actions: body.actions ?? [],
    aiSuggestions: body.aiSuggestions ?? [],
    progress: body.progress ?? 0,
    tags: body.tags ?? [],
    createdAt: now,
    updatedAt: now,
  };
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
  const body = (await request.json()) as Partial<CAP>;
  db.caps[index] = {
    ...db.caps[index],
    ...body,
    updatedAt: new Date().toISOString(),
  };
  return jsonResponse(db.caps[index]);
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
