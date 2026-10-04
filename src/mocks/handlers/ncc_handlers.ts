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
import { createIssue } from "./cms_handlers";
import { recordAudit } from "@/mocks/cms-engine";
import type { CreateNCCInput, NonComplianceCase } from "@/types";

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
  if (q.source) {
    const sources = q.source.split(",").map((s) => s.trim());
    items = items.filter((item) => sources.includes(item.source));
  }
  if (q.escalated === "true") {
    items = items.filter((item) => item.escalations.some((e) => e.level >= 2));
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
  const body = (await request.json()) as CreateNCCInput;
  // Without an explicit assessment, derive neutral scores from the chosen
  // severity so the issue still lands at that level on the active matrix.
  const fallbackScore = { low: 1, medium: 3, high: 4 }[
    body.severity ?? "medium"
  ];
  const scores = body.risk?.scores ?? {
    fine: fallbackScore,
    reputation: fallbackScore,
    scope: fallbackScore,
    recurrence: fallbackScore,
  };
  const issue = createIssue({
    title: body.title ?? "Untitled issue",
    description: body.description ?? "",
    category: body.category ?? "Other",
    source: body.source ?? "compliance_monitoring",
    sourceRef: body.sourceRef,
    regulationRef: body.regulationRef,
    unitId: body.ownerUnitId,
    ownerId: body.ownerId,
    ownerName: body.ownerName,
    dueDate: body.dueDate,
    scores,
    overrideLevel: body.risk?.overridden ? body.risk.finalLevel : undefined,
    overrideReason: body.risk?.overrideReason,
    tags: body.tags,
    linkedDocs: body.linkedDocs,
    fileIds: body.fileIds,
  });
  return jsonResponse(issue, 201);
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
  const changed = (Object.keys(body) as (keyof NonComplianceCase)[]).filter(
    (k) => String(prev[k] ?? "") !== String(next[k] ?? ""),
  );
  if (changed.length) {
    recordAudit(db.auditLogs, {
      action: "update",
      module: "issues",
      object: next.nccId,
      details: `Updated ${changed.join(", ")}`,
      entityType: "ncc",
      entityId: next.id,
      changes: changed
        .filter((k) => typeof next[k] !== "object")
        .map((k) => ({
          field: String(k),
          before: String(prev[k] ?? ""),
          after: String(next[k] ?? ""),
        })),
    });
  }
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
