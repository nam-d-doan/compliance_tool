import { http } from "msw";
import { getDb, findById, paginate, filterByText } from "@/mocks/db";
import {
  getDelay,
  jsonResponse,
  notFound,
  parseQuery,
  parseNumber,
  type MockResolverContext,
} from "./utils";
import type { NonComplianceCase } from "@/types";

export async function handleGetNCCList({ request }: { request: Request }) {
  await getDelay();
  const url = new URL(request.url);
  const q = parseQuery(url);

  const db = getDb();
  let items = [...db.nccs];

  if (q.status) {
    const statuses = q.status.split(",").map((s) => s.trim());
    items = items.filter((item) => statuses.includes(item.status));
  }
  if (q.severity) {
    const severities = q.severity.split(",").map((s) => s.trim());
    items = items.filter((item) => severities.includes(item.severity));
  }
  if (q.ownerUnitId) {
    items = items.filter((item) => item.ownerUnitId === q.ownerUnitId);
  }
  if (q.ownerUnitType) {
    items = items.filter((item) => item.ownerUnitType === q.ownerUnitType);
  }
  if (q.ownerUnitRegion) {
    items = items.filter((item) => item.ownerUnitRegion === q.ownerUnitRegion);
  }
  if (q.ownerId) {
    items = items.filter((item) => item.ownerId === q.ownerId);
  }
  if (q.dueDateFrom) {
    items = items.filter((item) => item.dueDate >= q.dueDateFrom);
  }
  if (q.dueDateTo) {
    items = items.filter((item) => item.dueDate <= q.dueDateTo);
  }
  if (q.search) {
    items = filterByText(items, q.search, [
      "nccId",
      "title",
      "ownerName",
      "ownerUnitName",
      "status",
    ]);
  }

  const sortField = q.sortField ?? "createdAt";
  const sortDirection = q.sortDirection ?? "desc";
  items.sort((a, b) => {
    const aVal = a[sortField as keyof NonComplianceCase];
    const bVal = b[sortField as keyof NonComplianceCase];
    if (aVal == null || bVal == null) return 0;
    if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
    if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  const page = parseNumber(q.page, 1);
  const pageSize = parseNumber(q.pageSize, 20);
  return jsonResponse(paginate(items, page, pageSize));
}

export async function handleGetNCCDetail({ params }: MockResolverContext) {
  await getDelay();
  const db = getDb();
  const item = findById(db.nccs, params.id as string);
  if (!item) return notFound("NCC not found");
  return jsonResponse(item);
}

export async function handleCreateNCC({ request }: { request: Request }) {
  await getDelay();
  const body = (await request.json()) as Partial<NonComplianceCase>;
  const now = new Date().toISOString();
  const db = getDb();

  // Derive owner unit name/type/region from organization settings.
  const hoDept = db.organizationSettings.hoDepartments.find(
    (d) => d.id === body.ownerUnitId,
  );
  const branch = db.organizationSettings.branches.find(
    (b) => b.id === body.ownerUnitId,
  );
  const ownerUnitName = hoDept?.name ?? branch?.name ?? "";
  const ownerUnitType = branch ? "branch" : "ho_department";
  const ownerUnitRegion = branch?.region;

  const newItem: NonComplianceCase = {
    id: `ncc-${crypto.randomUUID()}`,
    nccId: `NCC-${new Date().getFullYear()}-${String(db.nccs.length + 1).padStart(3, "0")}`,
    title: body.title ?? "Untitled NCC",
    description: body.description ?? "",
    severity: body.severity ?? "medium",
    ownerUnitId: body.ownerUnitId ?? "",
    ownerUnitName,
    ownerUnitType,
    ownerUnitRegion,
    ownerId: body.ownerId ?? "",
    ownerName: body.ownerName ?? "",
    dueDate: body.dueDate ?? now,
    status: "Open",
    resolution: undefined,
    fileIds: body.fileIds ?? [],
    linkedDocs: body.linkedDocs,
    closedAt: undefined,
    tags: body.tags ?? [],
    createdAt: now,
    updatedAt: now,
  };

  db.nccs.unshift(newItem);
  return jsonResponse(newItem, 201);
}

export async function handleUpdateNCC({
  params,
  request,
}: MockResolverContext) {
  await getDelay();
  const db = getDb();
  const index = db.nccs.findIndex((i) => i.id === params.id);
  if (index === -1) return notFound("NCC not found");
  const body = (await request.json()) as Partial<NonComplianceCase>;

  const prev = db.nccs[index];
  const next: NonComplianceCase = {
    ...prev,
    ...body,
    updatedAt: new Date().toISOString(),
  };

  // When status transitions to "Closed", stamp closedAt.
  if (prev.status !== "Closed" && next.status === "Closed") {
    next.closedAt = new Date().toISOString();
  }
  // When status transitions from "Closed" back to "Open", clear closure data.
  if (prev.status === "Closed" && next.status === "Open") {
    next.closedAt = undefined;
    next.resolution = undefined;
  }

  db.nccs[index] = next;
  return jsonResponse(next);
}

export async function handleDeleteNCC({ params }: MockResolverContext) {
  await getDelay();
  const db = getDb();
  const index = db.nccs.findIndex((i) => i.id === params.id);
  if (index === -1) return notFound("NCC not found");
  db.nccs.splice(index, 1);
  return jsonResponse({ success: true });
}

export const nccHandlers = [
  http.get("/api/ncc", handleGetNCCList),
  http.get("/api/ncc/:id", handleGetNCCDetail),
  http.post("/api/ncc", handleCreateNCC),
  http.put("/api/ncc/:id", handleUpdateNCC),
  http.delete("/api/ncc/:id", handleDeleteNCC),
];
