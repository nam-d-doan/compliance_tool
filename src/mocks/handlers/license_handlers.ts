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
import type { Comment } from "@/mocks/db";
import type { License, LicenseCalendarEvent, LicenseComment } from "@/types";

const addedComments = new Map<string, LicenseComment[]>();

export async function handleGetLicenseList({ request }: { request: Request }) {
  await getDelay();
  const url = new URL(request.url);
  const q = parseQuery(url);

  const db = getDb();
  let items = [...db.licenses];

  if (q.status) {
    const statuses = q.status.split(",").map((s) => s.trim());
    items = items.filter((item) => statuses.includes(item.status));
  }
  if (q.type) {
    items = items.filter((item) =>
      item.licenseName.toLowerCase().includes(q.type.toLowerCase()),
    );
  }
  if (q.owner) {
    items = items.filter(
      (item) =>
        item.ownerId === q.owner ||
        item.ownerName.toLowerCase().includes(q.owner.toLowerCase()),
    );
  }
  if (q.country) {
    items = items.filter((item) =>
      item.country.toLowerCase().includes(q.country.toLowerCase()),
    );
  }
  if (q.department) {
    items = items.filter((item) =>
      item.department.toLowerCase().includes(q.department.toLowerCase()),
    );
  }
  if (q.expiryDateFrom) {
    items = items.filter((item) => item.expiryDate >= q.expiryDateFrom);
  }
  if (q.expiryDateTo) {
    items = items.filter((item) => item.expiryDate <= q.expiryDateTo);
  }
  if (q.search) {
    items = filterByText(items, q.search, [
      "licenseNumber",
      "licenseName",
      "issuingAuthority",
      "ownerName",
      "status",
    ]);
  }

  const page = parseNumber(q.page, 1);
  const pageSize = parseNumber(q.pageSize, 20);
  return jsonResponse(paginate(items, page, pageSize));
}

export async function handleGetLicenseDetail({ params }: MockResolverContext) {
  await getDelay();
  const db = getDb();
  const item = findById(db.licenses, params.id as string);
  if (!item) return notFound("License not found");
  return jsonResponse(item);
}

export async function handleCreateLicense({ request }: { request: Request }) {
  await getDelay();
  const body = (await request.json()) as Partial<License>;
  const db = getDb();
  const now = new Date().toISOString();
  const newItem: License = {
    id: `lic-${crypto.randomUUID()}`,
    licenseNumber:
      body.licenseNumber ?? `LIC-NEW-${String(Date.now()).slice(-4)}`,
    licenseName: body.licenseName ?? "New License",
    issuingAuthority: body.issuingAuthority ?? "",
    department: body.department ?? "",
    businessUnit: body.businessUnit ?? "",
    country: body.country ?? "",
    location: body.location ?? "",
    issueDate: body.issueDate ?? now,
    expiryDate: body.expiryDate ?? now,
    renewalCycle: body.renewalCycle ?? "Annual",
    ownerId: body.ownerId ?? "",
    ownerName: body.ownerName ?? "",
    approverId: body.approverId ?? "",
    approverName: body.approverName ?? "",
    criticality: body.criticality ?? "medium",
    status: body.status ?? "Active",
    regulationId: body.regulationId,
    regulationName: body.regulationName,
    aiRiskScore: body.aiRiskScore ?? 50,
    remainingDays: body.remainingDays ?? 0,
    renewalPriority: body.renewalPriority ?? "medium",
    supportingDocumentIds: body.supportingDocumentIds ?? [],
    tags: body.tags ?? [],
    createdAt: now,
    updatedAt: now,
  };
  db.licenses.unshift(newItem);
  return jsonResponse(newItem, 201);
}

export async function handleUpdateLicense({
  params,
  request,
}: MockResolverContext) {
  await getDelay();
  const db = getDb();
  const index = db.licenses.findIndex((i) => i.id === params.id);
  if (index === -1) return notFound("License not found");
  const body = (await request.json()) as Partial<License>;
  db.licenses[index] = {
    ...db.licenses[index],
    ...body,
    updatedAt: new Date().toISOString(),
  };
  return jsonResponse(db.licenses[index]);
}

export async function handleDeleteLicense({ params }: MockResolverContext) {
  await getDelay();
  const db = getDb();
  const index = db.licenses.findIndex((i) => i.id === params.id);
  if (index === -1) return notFound("License not found");
  db.licenses.splice(index, 1);
  return jsonResponse({ success: true });
}

export async function handleGetLicenseComments({
  params,
  request,
}: MockResolverContext) {
  await getDelay();
  const url = new URL(request.url);
  const q = parseQuery(url);
  const db = getDb();
  const id = params.id as string;
  const base = db.generateCommentsFor(id, "license") as Comment[];
  const extra = addedComments.get(id) ?? [];
  const page = parseNumber(q.page, 1);
  const pageSize = parseNumber(q.pageSize, 20);
  return jsonResponse(paginate([...base, ...extra], page, pageSize));
}

export async function handleCreateLicenseComment({
  params,
  request,
}: MockResolverContext) {
  await getDelay();
  const body = (await request.json()) as {
    content?: string;
    userId?: string;
    userName?: string;
  };
  if (!body.content) return badRequest("Comment content is required");
  const id = params.id as string;
  const comment: LicenseComment = {
    id: `cmt-${crypto.randomUUID()}`,
    userId: body.userId ?? "unknown",
    userName: body.userName ?? "Unknown user",
    content: body.content,
    timestamp: new Date().toISOString(),
  };
  const existing = addedComments.get(id) ?? [];
  addedComments.set(id, [...existing, comment]);
  return jsonResponse(comment, 201);
}

export async function handleGetLicenseCalendar({
  request,
}: {
  request: Request;
}) {
  await getDelay();
  const url = new URL(request.url);
  const q = parseQuery(url);
  const db = getDb();
  const events: LicenseCalendarEvent[] = db.licenses.flatMap((license) => [
    {
      id: `evt-issue-${license.id}`,
      title: `${license.licenseName} issued`,
      date: license.issueDate,
      type: "issue",
      entityId: license.id,
      entityType: "license",
      status: license.status,
      description: `Issued by ${license.issuingAuthority}`,
      createdAt: license.issueDate,
      updatedAt: license.issueDate,
    },
    {
      id: `evt-expiry-${license.id}`,
      title: `${license.licenseName} expires`,
      date: license.expiryDate,
      type: "expiry",
      entityId: license.id,
      entityType: "license",
      status: license.status,
      description: `License expires on ${license.expiryDate}`,
      createdAt: license.expiryDate,
      updatedAt: license.expiryDate,
    },
  ]);
  let filtered = events;
  if (q.dateFrom) filtered = filtered.filter((e) => e.date >= q.dateFrom);
  if (q.dateTo) filtered = filtered.filter((e) => e.date <= q.dateTo);
  const page = parseNumber(q.page, 1);
  const pageSize = parseNumber(q.pageSize, 50);
  return jsonResponse(paginate(filtered, page, pageSize));
}

export const licenseHandlers = [
  http.get("/api/license", handleGetLicenseList),
  http.get("/api/license/:id", handleGetLicenseDetail),
  http.post("/api/license", handleCreateLicense),
  http.put("/api/license/:id", handleUpdateLicense),
  http.delete("/api/license/:id", handleDeleteLicense),
  http.get("/api/license/:id/comments", handleGetLicenseComments),
  http.post("/api/license/:id/comments", handleCreateLicenseComment),
  http.get("/api/license/calendar", handleGetLicenseCalendar),
];
