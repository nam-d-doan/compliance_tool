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
import type { Evidence, EvidenceComment } from "@/types";

export async function handleGetEvidenceList({ request }: { request: Request }) {
  await getDelay();
  const url = new URL(request.url);
  const q = parseQuery(url);

  const db = getDb();
  let items = [...db.evidence];

  if (q.status) {
    const statuses = q.status.split(",").map((s) => s.trim());
    items = items.filter((item) => statuses.includes(item.status));
  }
  if (q.category) {
    items = items.filter((item) =>
      item.category.toLowerCase().includes(q.category.toLowerCase()),
    );
  }
  if (q.owner) {
    items = items.filter(
      (item) =>
        item.ownerId === q.owner ||
        item.ownerName.toLowerCase().includes(q.owner.toLowerCase()),
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
  if (q.dateFrom) {
    items = items.filter((item) => item.uploadDate >= q.dateFrom);
  }
  if (q.dateTo) {
    items = items.filter((item) => item.uploadDate <= q.dateTo);
  }
  if (q.search) {
    items = filterByText(items, q.search, [
      "name",
      "fileName",
      "category",
      "ownerName",
      "status",
    ]);
  }

  const page = parseNumber(q.page, 1);
  const pageSize = parseNumber(q.pageSize, 20);
  return jsonResponse(paginate(items, page, pageSize));
}

export async function handleGetEvidenceDetail({ params }: MockResolverContext) {
  await getDelay();
  const db = getDb();
  const item = findById(db.evidence, params.id as string);
  if (!item) return notFound("Evidence not found");
  return jsonResponse(item);
}

export async function handleCreateEvidence({ request }: { request: Request }) {
  await getDelay();
  const body = (await request.json()) as Partial<Evidence>;
  const now = new Date().toISOString();
  const db = getDb();
  const newItem: Evidence = {
    id: `evd-${crypto.randomUUID()}`,
    name: body.name ?? "Untitled evidence",
    fileName: body.fileName ?? "document.pdf",
    category: body.category ?? "Policy Document",
    complianceId: body.complianceId,
    complianceTitle: body.complianceTitle,
    ownerId: body.ownerId ?? "",
    ownerName: body.ownerName ?? "",
    department: body.department,
    businessUnit: body.businessUnit,
    uploadDate: now,
    version: 1,
    status: body.status ?? "Uploading",
    aiValidation: body.aiValidation ?? {
      status: "pending",
      score: 0,
      issues: [],
      missingItems: [],
      confidence: 0,
      recommendations: [],
    },
    fileSize: body.fileSize ?? 0,
    fileType: body.fileType ?? "application/pdf",
    checksum: body.checksum ?? "",
    tags: body.tags ?? [],
    url: body.url ?? "",
    createdAt: now,
    updatedAt: now,
  };
  db.evidence.unshift(newItem);
  return jsonResponse(newItem, 201);
}

export async function handleUpdateEvidence({
  params,
  request,
}: MockResolverContext) {
  await getDelay();
  const db = getDb();
  const index = db.evidence.findIndex((i) => i.id === params.id);
  if (index === -1) return notFound("Evidence not found");
  const body = (await request.json()) as Partial<Evidence>;
  db.evidence[index] = {
    ...db.evidence[index],
    ...body,
    updatedAt: new Date().toISOString(),
  };
  return jsonResponse(db.evidence[index]);
}

export async function handleDeleteEvidence({ params }: MockResolverContext) {
  await getDelay();
  const db = getDb();
  const index = db.evidence.findIndex((i) => i.id === params.id);
  if (index === -1) return notFound("Evidence not found");
  db.evidence.splice(index, 1);
  return jsonResponse({ success: true });
}

export async function handleGetEvidenceTimeline({
  params,
}: MockResolverContext) {
  await getDelay();
  const db = getDb();
  const item = findById(db.evidence, params.id as string);
  if (!item) return notFound("Evidence not found");
  return jsonResponse(db.generateTimelineFor(item.id, "evidence") as unknown[]);
}

export async function handleGetEvidenceComments({
  params,
  request,
}: MockResolverContext) {
  await getDelay();
  const url = new URL(request.url);
  const db = getDb();
  const item = findById(db.evidence, params.id as string);
  if (!item) return notFound("Evidence not found");
  const comments = db.generateCommentsFor(item.id, "evidence");
  const page = parseNumber(parseQuery(url).page, 1);
  const pageSize = parseNumber(parseQuery(url).pageSize, 20);
  return jsonResponse(paginate(comments, page, pageSize));
}

export async function handleCreateEvidenceComment({
  params,
  request,
}: MockResolverContext) {
  await getDelay();
  const db = getDb();
  const item = findById(db.evidence, params.id as string);
  if (!item) return notFound("Evidence not found");
  const body = (await request.json()) as {
    content?: string;
    userId?: string;
    userName?: string;
  };
  if (!body.content) return badRequest("Comment content is required");
  const comment: EvidenceComment = {
    id: `cmt-${crypto.randomUUID()}`,
    evidenceId: item.id,
    userId: body.userId ?? "demo-admin",
    userName: body.userName ?? "Alexandra Chen",
    content: body.content,
    timestamp: new Date().toISOString(),
  };
  return jsonResponse(comment, 201);
}

export const evidenceHandlers = [
  http.get("/api/evidence", handleGetEvidenceList),
  http.get("/api/evidence/:id", handleGetEvidenceDetail),
  http.post("/api/evidence", handleCreateEvidence),
  http.put("/api/evidence/:id", handleUpdateEvidence),
  http.delete("/api/evidence/:id", handleDeleteEvidence),
  http.get("/api/evidence/:id/timeline", handleGetEvidenceTimeline),
  http.get("/api/evidence/:id/comments", handleGetEvidenceComments),
  http.post("/api/evidence/:id/comments", handleCreateEvidenceComment),
];
