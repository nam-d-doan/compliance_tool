import { http } from "msw";
import { faker } from "@faker-js/faker";
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
  Regulation,
  RegulationImpact,
  RegulationComparison,
  ActivityFeedItem,
} from "@/types";

interface CommentItem {
  id: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: string;
}

function mapTimelineEvent(event: Record<string, unknown>): ActivityFeedItem {
  const rawType = String(event.type ?? "published");
  const type: ActivityFeedItem["type"] =
    rawType === "updated" ? "regulation_published" : "regulation_published";
  return {
    id: String(event.id),
    type,
    title: String(event.title),
    description: String(event.description),
    userId: String(event.userId),
    userName: String(event.userName),
    entityType: "regulation",
    entityId: String(event.entityId),
    timestamp: String(event.timestamp),
    createdAt: String(event.timestamp),
    updatedAt: String(event.timestamp),
  };
}

function mapComment(comment: Record<string, unknown>): CommentItem {
  return {
    id: String(comment.id),
    userId: String(comment.userId),
    userName: String(comment.userName),
    content: String(comment.content),
    timestamp: String(comment.timestamp),
  };
}

export async function handleGetRegulationList({
  request,
}: {
  request: Request;
}) {
  await getDelay();
  const url = new URL(request.url);
  const q = parseQuery(url);

  const db = getDb();
  let items = [...db.regulations];

  if (q.status) {
    const statuses = q.status.split(",").map((s) => s.trim());
    items = items.filter((item) => statuses.includes(item.status));
  }
  if (q.country) {
    items = items.filter((item) =>
      item.jurisdiction.toLowerCase().includes(q.country.toLowerCase()),
    );
  }
  if (q.regulator) {
    items = items.filter((item) =>
      item.regulator.toLowerCase().includes(q.regulator.toLowerCase()),
    );
  }
  if (q.industry) {
    items = items.filter((item) =>
      item.industry.toLowerCase().includes(q.industry.toLowerCase()),
    );
  }
  if (q.category) {
    items = items.filter((item) =>
      item.category.toLowerCase().includes(q.category.toLowerCase()),
    );
  }
  if (q.department) {
    items = items.filter((item) =>
      item.affectedDepartments.some((d) =>
        d.toLowerCase().includes(q.department.toLowerCase()),
      ),
    );
  }
  if (q.search) {
    items = filterByText(items, q.search, [
      "reference",
      "title",
      "regulator",
      "category",
      "summary",
    ]);
  }

  const page = parseNumber(q.page, 1);
  const pageSize = parseNumber(q.pageSize, 20);
  return jsonResponse(paginate(items, page, pageSize));
}

export async function handleGetRegulationDetail({
  params,
}: MockResolverContext) {
  await getDelay();
  const db = getDb();
  const item = findById(db.regulations, params.id as string);
  if (!item) return notFound("Regulation not found");
  return jsonResponse(item);
}

export async function handleCreateRegulation({
  request,
}: {
  request: Request;
}) {
  await getDelay();
  const body = (await request.json()) as Partial<Regulation>;
  const db = getDb();
  const now = new Date().toISOString();
  const newItem: Regulation = {
    id: `reg-${crypto.randomUUID()}`,
    reference: body.reference ?? `REG-NEW-${String(Date.now()).slice(-4)}`,
    title: body.title ?? "New Regulation",
    regulator: body.regulator ?? "",
    publicationDate: body.publicationDate ?? now,
    effectiveDate: body.effectiveDate ?? now,
    supersedes: body.supersedes,
    status: body.status ?? "Published",
    category: body.category ?? "General",
    jurisdiction: body.jurisdiction ?? "",
    industry: body.industry ?? "",
    affectedDepartments: body.affectedDepartments ?? [],
    affectedBusinessUnits: body.affectedBusinessUnits ?? [],
    summary: body.summary ?? "",
    requirements: body.requirements ?? [],
    aiImpactScore: body.aiImpactScore ?? 50,
    version: body.version ?? "v1.0",
    tags: body.tags ?? [],
    createdAt: now,
    updatedAt: now,
  };
  db.regulations.unshift(newItem);
  return jsonResponse(newItem, 201);
}

export async function handleUpdateRegulation({
  params,
  request,
}: MockResolverContext) {
  await getDelay();
  const db = getDb();
  const index = db.regulations.findIndex((i) => i.id === params.id);
  if (index === -1) return notFound("Regulation not found");
  const body = (await request.json()) as Partial<Regulation>;
  db.regulations[index] = {
    ...db.regulations[index],
    ...body,
    updatedAt: new Date().toISOString(),
  };
  return jsonResponse(db.regulations[index]);
}

export async function handleDeleteRegulation({ params }: MockResolverContext) {
  await getDelay();
  const db = getDb();
  const index = db.regulations.findIndex((i) => i.id === params.id);
  if (index === -1) return notFound("Regulation not found");
  db.regulations.splice(index, 1);
  return jsonResponse({ success: true });
}

export async function handleGetRegulationTimeline({
  params,
}: MockResolverContext) {
  await getDelay();
  const db = getDb();
  const item = findById(db.regulations, params.id as string);
  if (!item) return notFound("Regulation not found");
  const events = db.generateTimelineFor(
    item.id,
    "regulation",
  ) as unknown as Record<string, unknown>[];
  return jsonResponse(events.map(mapTimelineEvent));
}

export async function handleGetRegulationComments({
  params,
  request,
}: MockResolverContext) {
  await getDelay();
  const url = new URL(request.url);
  const q = parseQuery(url);
  const db = getDb();
  const item = findById(db.regulations, params.id as string);
  if (!item) return notFound("Regulation not found");
  const comments = db.generateCommentsFor(
    item.id,
    "regulation",
  ) as unknown as Record<string, unknown>[];
  const page = parseNumber(q.page, 1);
  const pageSize = parseNumber(q.pageSize, 20);
  return jsonResponse(paginate(comments.map(mapComment), page, pageSize));
}

export async function handleCreateRegulationComment({
  params,
  request,
}: MockResolverContext) {
  await getDelay();
  const db = getDb();
  const item = findById(db.regulations, params.id as string);
  if (!item) return notFound("Regulation not found");
  const body = (await request.json()) as {
    content?: string;
    userId?: string;
    userName?: string;
  };
  if (!body.content) return badRequest("Comment content is required");
  const comment: CommentItem = {
    id: `cmt-${crypto.randomUUID()}`,
    userId: body.userId ?? "system",
    userName: body.userName ?? "Current User",
    content: body.content,
    timestamp: new Date().toISOString(),
  };
  return jsonResponse(comment, 201);
}

export async function handleCompareRegulations({
  request,
}: {
  request: Request;
}) {
  await getDelay();
  const body = (await request.json()) as { a?: string; b?: string };
  const db = getDb();
  const a = body.a ? findById(db.regulations, body.a) : undefined;
  const b = body.b ? findById(db.regulations, body.b) : undefined;
  if (!a || !b) return badRequest("Both regulation IDs are required");
  const comparison: RegulationComparison = {
    regulationA: a,
    regulationB: b,
    added: a.requirements
      .filter((r) => !b.requirements.includes(r))
      .slice(0, 3),
    removed: b.requirements
      .filter((r) => !a.requirements.includes(r))
      .slice(0, 3),
    modified: a.requirements.slice(0, 2),
    moved: [],
    aiSummary: `Comparing ${a.reference} and ${b.reference}: ${a.requirements.length} requirements analyzed.`,
  };
  return jsonResponse(comparison);
}

export async function handleRegulationImpact({
  request,
}: {
  request: Request;
}) {
  await getDelay();
  const body = (await request.json()) as { id?: string };
  const db = getDb();
  const regulation = body.id ? findById(db.regulations, body.id) : undefined;
  if (!regulation) return badRequest("Regulation ID is required");
  const impact: RegulationImpact = {
    regulationId: regulation.id,
    regulationTitle: regulation.title,
    affectedDepartments: regulation.affectedDepartments,
    affectedComplianceIds: db.compliance
      .filter((c) => c.regulationId === regulation.id)
      .map((c) => c.id),
    affectedPolicies: ["Policy A", "Policy B"],
    affectedBusinessUnits: regulation.affectedBusinessUnits,
    affectedRisks: ["Operational Risk", "Compliance Risk", "Reputational Risk"],
    affectedControls: ["Control 1", "Control 2", "Control 3"],
    aiSummary: `This regulation affects ${regulation.affectedDepartments.length} departments and ${regulation.affectedBusinessUnits.length} business units.`,
    estimatedEffort: `${faker.number.int({ min: 2, max: 12 })} weeks`,
  };
  return jsonResponse(impact);
}

export const regulationHandlers = [
  http.get("/api/regulation", handleGetRegulationList),
  http.get("/api/regulation/:id", handleGetRegulationDetail),
  http.post("/api/regulation", handleCreateRegulation),
  http.put("/api/regulation/:id", handleUpdateRegulation),
  http.delete("/api/regulation/:id", handleDeleteRegulation),
  http.get("/api/regulation/:id/timeline", handleGetRegulationTimeline),
  http.get("/api/regulation/:id/comments", handleGetRegulationComments),
  http.post("/api/regulation/:id/comments", handleCreateRegulationComment),
  http.post("/api/regulation/compare", handleCompareRegulations),
  http.post("/api/regulation/impact", handleRegulationImpact),
];
