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
import type { ComplianceObligation, ComplianceComment } from "@/types";

export async function handleGetComplianceList({
  request,
}: {
  request: Request;
}) {
  await getDelay();
  const url = new URL(request.url);
  const q = parseQuery(url);

  const db = getDb();
  let items = [...db.compliance];

  if (q.status) {
    const statuses = q.status.split(",").map((s) => s.trim());
    items = items.filter((item) => statuses.includes(item.status));
  }
  if (q.priority) {
    const priorities = q.priority.split(",").map((s) => s.trim());
    items = items.filter((item) => priorities.includes(item.criticality));
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
  if (q.businessUnit) {
    items = items.filter((item) =>
      item.businessUnit.toLowerCase().includes(q.businessUnit.toLowerCase()),
    );
  }
  if (q.regulation) {
    items = items.filter(
      (item) =>
        item.regulationId === q.regulation ||
        item.regulationName.toLowerCase().includes(q.regulation.toLowerCase()),
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
      "complianceId",
      "title",
      "ownerName",
      "department",
      "status",
    ]);
  }

  const sortField = q.sortField ?? "dueDate";
  const sortDirection = q.sortDirection ?? "asc";
  items.sort((a, b) => {
    const aVal = a[sortField as keyof ComplianceObligation];
    const bVal = b[sortField as keyof ComplianceObligation];
    if (aVal == null || bVal == null) return 0;
    if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
    if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  const page = parseNumber(q.page, 1);
  const pageSize = parseNumber(q.pageSize, 20);
  return jsonResponse(paginate(items, page, pageSize));
}

export async function handleGetComplianceDetail({
  params,
}: MockResolverContext) {
  await getDelay();
  const db = getDb();
  const item = findById(db.compliance, params.id as string);
  if (!item) return notFound("Compliance obligation not found");
  return jsonResponse(item);
}

export async function handleCreateCompliance({
  request,
}: {
  request: Request;
}) {
  await getDelay();
  const body = (await request.json()) as Partial<ComplianceObligation>;
  const db = getDb();
  const now = new Date().toISOString();
  const newItem: ComplianceObligation = {
    id: `cmp-${crypto.randomUUID()}`,
    complianceId: `COMP-${new Date().getFullYear()}-${String(db.compliance.length + 1).padStart(3, "0")}`,
    title: body.title ?? "Untitled",
    description: body.description ?? "",
    businessUnit: body.businessUnit ?? "",
    department: body.department ?? "",
    location: body.location ?? "",
    regulationId: body.regulationId ?? "",
    regulationName: body.regulationName ?? "",
    ownerId: body.ownerId ?? "",
    ownerName: body.ownerName ?? "",
    approverId: body.approverId ?? "",
    approverName: body.approverName ?? "",
    reviewerIds: body.reviewerIds ?? [],
    frequency: body.frequency ?? "annually",
    criticality: body.criticality ?? "medium",
    dueDate: body.dueDate ?? now,
    penalty: body.penalty ?? "",
    status: body.status ?? "Draft",
    aiRiskScore: body.aiRiskScore ?? 50,
    tags: body.tags ?? [],
    progress: body.progress ?? 0,
    createdAt: now,
    updatedAt: now,
  };
  db.compliance.unshift(newItem);
  return jsonResponse(newItem, 201);
}

export async function handleUpdateCompliance({
  params,
  request,
}: MockResolverContext) {
  await getDelay();
  const db = getDb();
  const index = db.compliance.findIndex((i) => i.id === params.id);
  if (index === -1) return notFound("Compliance obligation not found");
  const body = (await request.json()) as Partial<ComplianceObligation>;
  db.compliance[index] = {
    ...db.compliance[index],
    ...body,
    updatedAt: new Date().toISOString(),
  };
  return jsonResponse(db.compliance[index]);
}

export async function handleDeleteCompliance({ params }: MockResolverContext) {
  await getDelay();
  const db = getDb();
  const index = db.compliance.findIndex((i) => i.id === params.id);
  if (index === -1) return notFound("Compliance obligation not found");
  db.compliance.splice(index, 1);
  return jsonResponse({ success: true });
}

export async function handleGetComplianceTimeline({
  params,
}: MockResolverContext) {
  await getDelay();
  const db = getDb();
  const item = findById(db.compliance, params.id as string);
  if (!item) return notFound("Compliance obligation not found");
  return jsonResponse(
    db.generateTimelineFor(item.id, "compliance") as unknown[],
  );
}

export async function handleGetComplianceComments({
  params,
  request,
}: MockResolverContext) {
  await getDelay();
  const url = new URL(request.url);
  const db = getDb();
  const item = findById(db.compliance, params.id as string);
  if (!item) return notFound("Compliance obligation not found");
  const comments = db.generateCommentsFor(item.id, "compliance");
  const page = parseNumber(parseQuery(url).page, 1);
  const pageSize = parseNumber(parseQuery(url).pageSize, 20);
  return jsonResponse(paginate(comments, page, pageSize));
}

export async function handleCreateComplianceComment({
  params,
  request,
}: MockResolverContext) {
  await getDelay();
  const db = getDb();
  const item = findById(db.compliance, params.id as string);
  if (!item) return notFound("Compliance obligation not found");
  const body = (await request.json()) as {
    content?: string;
    userId?: string;
    userName?: string;
  };
  if (!body.content) return badRequest("Comment content is required");
  const comment: ComplianceComment = {
    id: `cmt-${crypto.randomUUID()}`,
    complianceId: item.id,
    userId: body.userId ?? "demo-admin",
    userName: body.userName ?? "Alexandra Chen",
    content: body.content,
    timestamp: new Date().toISOString(),
  };
  return jsonResponse(comment, 201);
}

export const complianceHandlers = [
  http.get("/api/compliance", handleGetComplianceList),
  http.get("/api/compliance/:id", handleGetComplianceDetail),
  http.post("/api/compliance", handleCreateCompliance),
  http.put("/api/compliance/:id", handleUpdateCompliance),
  http.delete("/api/compliance/:id", handleDeleteCompliance),
  http.get("/api/compliance/:id/timeline", handleGetComplianceTimeline),
  http.get("/api/compliance/:id/comments", handleGetComplianceComments),
  http.post("/api/compliance/:id/comments", handleCreateComplianceComment),
];

// Placeholder obligation handlers for Phase 3B
export const obligationHandlers = [] as const;
