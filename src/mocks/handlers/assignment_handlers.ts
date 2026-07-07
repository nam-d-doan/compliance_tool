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
import type {
  Assignment,
  CreateAssignmentInput,
  UpdateAssignmentInput,
  BulkAssignmentInput,
  UserProfile,
} from "@/types";

/**
 * Resolve the authenticated user from the Bearer token issued by the mock
 * auth handler. Token shape: `fake-jwt-{userId}-{timestamp}`.
 */
function getCurrentUser(request: Request): UserProfile | undefined {
  const authHeader = request.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  const match = token.match(/^fake-jwt-(.+)-\d+$/);
  const userId = match?.[1];
  if (!userId) return undefined;
  const db = getDb();
  return db.users.find((u) => u.id === userId);
}

function normalizePriority(priority?: string): Assignment["priority"] {
  const raw = (priority ?? "medium").toLowerCase();
  if (
    raw === "low" ||
    raw === "medium" ||
    raw === "high" ||
    raw === "critical"
  ) {
    return raw;
  }
  return "medium";
}

function normalizeStatus(status?: string): Assignment["status"] {
  const raw = (status ?? "draft").toLowerCase();
  const allowed: Assignment["status"][] = [
    "draft",
    "published",
    "acknowledged",
    "in_progress",
    "completed",
    "cancelled",
  ];
  return (allowed as string[]).includes(raw)
    ? (raw as Assignment["status"])
    : "draft";
}

export async function handleGetAssignmentList({
  request,
}: {
  request: Request;
}) {
  await getDelay();
  const url = new URL(request.url);
  const q = parseQuery(url);

  const db = getDb();
  let items = [...db.assignments];

  if (q.status) {
    const statuses = q.status.split(",").map((s) => s.trim().toLowerCase());
    items = items.filter((item) => statuses.includes(item.status));
  }
  if (q.priority) {
    const priorities = q.priority.split(",").map((s) => s.trim().toLowerCase());
    items = items.filter((item) => priorities.includes(item.priority));
  }
  if (q.department) {
    items = items.filter(
      (item) =>
        item.assignedDepartmentId === q.department ||
        (item.assignedDepartmentName ?? "")
          .toLowerCase()
          .includes(q.department.toLowerCase()),
    );
  }
  if (q.office) {
    items = items.filter(
      (item) =>
        item.assignedOfficeId === q.office ||
        (item.assignedOfficeName ?? "")
          .toLowerCase()
          .includes(q.office.toLowerCase()),
    );
  }
  if (q.assignor) {
    items = items.filter(
      (item) =>
        item.assignorId === q.assignor ||
        (item.assignorName ?? "")
          .toLowerCase()
          .includes(q.assignor.toLowerCase()),
    );
  }
  if (q.regulation) {
    items = items.filter(
      (item) =>
        item.regulationId === q.regulation ||
        (item.regulationTitle ?? "")
          .toLowerCase()
          .includes(q.regulation.toLowerCase()),
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
      "title",
      "description",
      "regulationTitle",
      "assignedDepartmentName",
      "assignorName",
      "status",
    ]);
  }

  const sortField = q.sortField ?? "createdDate";
  const sortDirection = q.sortDirection ?? "desc";
  items.sort((a, b) => {
    const aVal = a[sortField as keyof Assignment];
    const bVal = b[sortField as keyof Assignment];
    if (aVal == null || bVal == null) return 0;
    if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
    if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  const page = parseNumber(q.page, 1);
  const pageSize = parseNumber(q.pageSize, 20);
  return jsonResponse(paginate(items, page, pageSize));
}

export async function handleGetAssignmentDetail({
  params,
}: MockResolverContext) {
  await getDelay();
  const db = getDb();
  const item = findById(db.assignments, params.id as string);
  if (!item) return notFound("Assignment not found");
  return jsonResponse(item);
}

export async function handleCreateAssignment({
  request,
}: {
  request: Request;
}) {
  await getDelay();
  const body = (await request.json()) as Partial<CreateAssignmentInput>;

  if (!body.title) return badRequest("Title is required");
  if (!body.regulationId) return badRequest("Regulation is required");
  if (!body.assignedDepartmentId) return badRequest("Department is required");
  if (!body.dueDate) return badRequest("Due date is required");
  if (!body.priority) return badRequest("Priority is required");

  const db = getDb();
  const regulation = findById(db.regulations, body.regulationId);
  if (!regulation) return badRequest("Referenced regulation not found");

  // Resolve the assignor from the auth token (existing user lookup).
  const currentUser = getCurrentUser(request);
  const assignorId = currentUser?.id ?? body.regulationId ?? "system";
  const assignorName = currentUser?.name ?? "System";

  const now = new Date().toISOString();
  const newItem: Assignment = {
    id: `asn-${crypto.randomUUID()}`,
    title: body.title,
    description: body.description ?? "",
    regulationId: regulation.id,
    regulationTitle: regulation.title,
    assignorId,
    assignorName,
    assignedDepartmentId: body.assignedDepartmentId,
    assignedDepartmentName:
      body.assignedDepartmentName ?? body.assignedDepartmentId,
    assignedOfficeId: body.assignedOfficeId,
    assignedOfficeName: body.assignedOfficeName,
    status: normalizeStatus(body.status),
    priority: normalizePriority(body.priority),
    dueDate: body.dueDate,
    createdDate: now,
    updatedDate: now,
    notes: body.notes,
  };

  db.assignments.unshift(newItem);
  return jsonResponse(newItem, 201);
}

export async function handleUpdateAssignment({
  params,
  request,
}: MockResolverContext) {
  await getDelay();
  const db = getDb();
  const index = db.assignments.findIndex((a) => a.id === params.id);
  if (index === -1) return notFound("Assignment not found");
  const body = (await request.json()) as Partial<UpdateAssignmentInput>;
  if (body.priority) body.priority = normalizePriority(body.priority);
  if (body.status) body.status = normalizeStatus(body.status);
  db.assignments[index] = {
    ...db.assignments[index],
    ...body,
    updatedDate: new Date().toISOString(),
  };
  return jsonResponse(db.assignments[index]);
}

export async function handleAcknowledgeAssignment({
  params,
  request,
}: MockResolverContext) {
  await getDelay();
  const db = getDb();
  const index = db.assignments.findIndex((a) => a.id === params.id);
  if (index === -1) return notFound("Assignment not found");
  const current = db.assignments[index];
  if (!["published", "acknowledged"].includes(current.status)) {
    return badRequest(
      `Cannot acknowledge an assignment in "${current.status}" status`,
    );
  }
  db.assignments[index] = {
    ...current,
    status: "acknowledged",
    updatedDate: new Date().toISOString(),
  };
  return jsonResponse(db.assignments[index]);
}

export async function handleCancelAssignment({ params }: MockResolverContext) {
  await getDelay();
  const db = getDb();
  const index = db.assignments.findIndex((a) => a.id === params.id);
  if (index === -1) return notFound("Assignment not found");
  const current = db.assignments[index];
  if (["completed", "cancelled"].includes(current.status)) {
    return badRequest(
      `Cannot cancel an assignment that is already "${current.status}"`,
    );
  }
  db.assignments[index] = {
    ...current,
    status: "cancelled",
    updatedDate: new Date().toISOString(),
  };
  return jsonResponse(db.assignments[index]);
}

export async function handleGetAssignmentTimeline({
  params,
}: MockResolverContext) {
  await getDelay();
  const db = getDb();
  const item = findById(db.assignments, params.id as string);
  if (!item) return notFound("Assignment not found");
  return jsonResponse(
    db.generateTimelineFor(item.id, "assignment") as unknown[],
  );
}

export async function handleBulkUpdateAssignments({
  request,
}: {
  request: Request;
}) {
  await getDelay();
  const body = (await request.json()) as BulkAssignmentInput;
  if (!body.ids || !Array.isArray(body.ids) || body.ids.length === 0)
    return badRequest("ids array is required");
  if (!body.action) return badRequest("action is required");

  const db = getDb();
  const now = new Date().toISOString();
  const updated: Assignment[] = [];

  body.ids.forEach((id) => {
    const index = db.assignments.findIndex((a) => a.id === id);
    if (index === -1) return;
    const current = db.assignments[index];
    if (body.action === "cancel") {
      if (["completed", "cancelled"].includes(current.status)) return;
      db.assignments[index] = {
        ...current,
        status: "cancelled",
        updatedDate: now,
      };
    } else if (body.action === "setPriority" && body.priority) {
      db.assignments[index] = {
        ...current,
        priority: normalizePriority(body.priority),
        updatedDate: now,
      };
    }
    updated.push(db.assignments[index]);
  });

  return jsonResponse({
    success: true,
    updated: updated.length,
    items: updated,
  });
}

export const assignmentHandlers = [
  http.get("/api/assignments", handleGetAssignmentList),
  http.post("/api/assignments", handleCreateAssignment),
  http.post("/api/assignments/bulk", handleBulkUpdateAssignments),
  http.get("/api/assignments/:id", handleGetAssignmentDetail),
  http.put("/api/assignments/:id", handleUpdateAssignment),
  http.get("/api/assignments/:id/timeline", handleGetAssignmentTimeline),
  http.post("/api/assignments/:id/acknowledge", handleAcknowledgeAssignment),
  http.post("/api/assignments/:id/cancel", handleCancelAssignment),
];
