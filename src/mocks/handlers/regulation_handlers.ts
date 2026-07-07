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
  RegulationDependency,
  RegulationDependencyItem,
  VietLexDoc,
  VietLexDocDetail,
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
      item.regulatoryBody.toLowerCase().includes(q.country.toLowerCase()),
    );
  }
  if (q.regulator) {
    items = items.filter((item) =>
      item.regulatoryBody.toLowerCase().includes(q.regulator.toLowerCase()),
    );
  }
  if (q.category) {
    items = items.filter((item) =>
      item.category.toLowerCase().includes(q.category.toLowerCase()),
    );
  }
  if (q.search) {
    items = filterByText(items, q.search, [
      "title",
      "regulatoryBody",
      "category",
      "description",
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

function normalizeRegulationStatus(status?: string): Regulation["status"] {
  const raw = (status ?? "effective").toLowerCase();
  if (raw === "expired") return "Expired";
  if (raw === "superseded") return "Superseded";
  return "Effective";
}

function checkAutoExpire(item: Regulation): void {
  if (item.status === "Effective" && item.expirationDate) {
    const expiration = new Date(item.expirationDate);
    if (!Number.isNaN(expiration.getTime()) && expiration < new Date()) {
      item.status = "Expired";
    }
  }
}

export async function handleCreateRegulation({
  request,
}: {
  request: Request;
}) {
  await getDelay();
  const body = (await request.json()) as Partial<Regulation>;
  if (!body.title) return badRequest("Title is required");
  if (!body.category) return badRequest("Category is required");
  if (!body.regulatoryBody) return badRequest("Regulatory body is required");
  if (!body.effectiveDate) return badRequest("Effective date is required");

  const db = getDb();
  const now = new Date().toISOString();
  const newItem: Regulation = {
    id: `reg-${crypto.randomUUID()}`,
    title: body.title,
    description: body.description ?? "",
    category: body.category,
    regulatoryBody: body.regulatoryBody,
    effectiveDate: body.effectiveDate,
    expirationDate: body.expirationDate,
    status: normalizeRegulationStatus(body.status),
    priority: body.priority ?? "medium",
    source: body.source ?? "internal",
    articles: body.articles ?? [],
    createdDate: now,
    updatedDate: now,
  };
  checkAutoExpire(newItem);
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
  const updated: Regulation = {
    ...db.regulations[index],
    ...body,
    updatedDate: new Date().toISOString(),
  };
  checkAutoExpire(updated);
  db.regulations[index] = updated;
  return jsonResponse(updated);
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
  const aArticleTitles = a.articles.map((article) => article.title);
  const bArticleTitles = b.articles.map((article) => article.title);
  const comparison: RegulationComparison = {
    regulationA: a,
    regulationB: b,
    added: aArticleTitles
      .filter((title) => !bArticleTitles.includes(title))
      .slice(0, 3),
    removed: bArticleTitles
      .filter((title) => !aArticleTitles.includes(title))
      .slice(0, 3),
    modified: aArticleTitles.slice(0, 2),
    moved: [],
    aiSummary: `Comparing ${a.title} and ${b.title}: ${a.articles.length} articles analyzed.`,
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
  const affectedDepartments = ["Risk & Compliance", "Legal", "Operations"];
  const affectedBusinessUnits = ["Retail Banking", "Corporate Banking"];
  const impact: RegulationImpact = {
    regulationId: regulation.id,
    regulationTitle: regulation.title,
    affectedDepartments,
    affectedComplianceIds: db.compliance
      .filter((c) => c.regulationId === regulation.id)
      .map((c) => c.id),
    affectedPolicies: ["Policy A", "Policy B"],
    affectedBusinessUnits,
    affectedRisks: ["Operational Risk", "Compliance Risk", "Reputational Risk"],
    affectedControls: ["Control 1", "Control 2", "Control 3"],
    aiSummary: `This regulation affects ${affectedDepartments.length} departments and ${affectedBusinessUnits.length} business units.`,
    estimatedEffort: `${faker.number.int({ min: 2, max: 12 })} weeks`,
  };
  return jsonResponse(impact);
}

export async function handleArchiveRegulationToggle({
  params,
}: MockResolverContext) {
  await getDelay();
  const db = getDb();
  const index = db.regulations.findIndex((i) => i.id === params.id);
  if (index === -1) return notFound("Regulation not found");
  const item = db.regulations[index];
  const nextStatus = item.status === "Expired" ? "Effective" : "Expired";
  db.regulations[index] = {
    ...item,
    status: nextStatus,
    updatedDate: new Date().toISOString(),
  };
  return jsonResponse(db.regulations[index]);
}

export async function handleBulkArchiveRegulations({
  request,
}: {
  request: Request;
}) {
  await getDelay();
  const body = (await request.json()) as { ids?: string[] };
  const ids = body.ids ?? [];
  if (ids.length === 0) return badRequest("No regulation IDs provided");

  const db = getDb();
  const now = new Date().toISOString();
  let archived = 0;
  ids.forEach((id) => {
    const index = db.regulations.findIndex((i) => i.id === id);
    if (index !== -1 && db.regulations[index].status !== "Expired") {
      db.regulations[index] = {
        ...db.regulations[index],
        status: "Expired",
        updatedDate: now,
      };
      archived++;
    }
  });
  return jsonResponse({ success: true, archived });
}

const VIETLEX_DOCS: VietLexDoc[] = [
  {
    id: "vl-1",
    docNumber: "Thông tư 19/2016/TT-NHNN",
    title: "Quy định tỷ lệ an toàn vốn đối với các tổ chức tín dụng",
    issuer: "Ngân hàng Nhà nước Việt Nam (SBV)",
    date: "2016-06-30T00:00:00.000Z",
  },
  {
    id: "vl-2",
    docNumber: "Thông tư 22/2019/TT-NHNN",
    title: "Quản lý rủi ro trong hoạt động ngân hàng",
    issuer: "Ngân hàng Nhà nước Việt Nam (SBV)",
    date: "2019-11-28T00:00:00.000Z",
  },
  {
    id: "vl-3",
    docNumber: "Thông tư 03/2021/TT-NHNN",
    title: "Phòng, chống khủng bố tài chính trong lĩnh vực ngân hàng",
    issuer: "Ngân hàng Nhà nước Việt Nam (SBV)",
    date: "2021-04-01T00:00:00.000Z",
  },
  {
    id: "vl-4",
    docNumber: "Thông tư 96/2020/TT-UBCK",
    title: "Quản lý hoạt động đầu tư chứng khoán của tổ chức",
    issuer: "Ủy ban Chứng khoán Nhà nước (UBCKNN)",
    date: "2020-12-31T00:00:00.000Z",
  },
  {
    id: "vl-5",
    docNumber: "Thông tư 119/2020/TT-UBCK",
    title: "Công bố thông tin trên thị trường chứng khoán",
    issuer: "Ủy ban Chứng khoán Nhà nước (UBCKNN)",
    date: "2020-12-31T00:00:00.000Z",
  },
  {
    id: "vl-6",
    docNumber: "Thông tư 13/2017/TT-UBCK",
    title: "Quản trị rủi ro đối với công ty chứng khoán",
    issuer: "Ủy ban Chứng khoán Nhà nước (UBCKNN)",
    date: "2017-03-15T00:00:00.000Z",
  },
  {
    id: "vl-7",
    docNumber: "Quyết định 35/2018/QĐ-NHNN",
    title: "Ban hành Biểu mẫu và phương pháp tính tỷ lệ an toàn vốn",
    issuer: "Ngân hàng Nhà nước Việt Nam (SBV)",
    date: "2018-12-28T00:00:00.000Z",
  },
  {
    id: "vl-8",
    docNumber: "Thông tư 52/2018/TT-NHNN",
    title: "Giám sát ngân hàng dựa trên hoạt động và quản lý rủi ro",
    issuer: "Ngân hàng Nhà nước Việt Nam (SBV)",
    date: "2018-12-31T00:00:00.000Z",
  },
];

interface VietLexSearchResult {
  id?: string;
  soHieu?: string;
  title?: string;
  capBanHanh?: string;
  nguon?: string;
  ngayBanHanh?: string;
  loai?: string;
  linhVuc?: string;
}

function parseVietLexDate(value?: string): string {
  if (!value) return new Date().toISOString();
  const parts = value.split("/");
  if (parts.length === 3) {
    const [d, m, y] = parts.map((p) => Number.parseInt(p, 10));
    const date = new Date(y, m - 1, d);
    if (!Number.isNaN(date.getTime())) return date.toISOString();
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? new Date().toISOString()
    : parsed.toISOString();
}

function mapVietLexResult(item: VietLexSearchResult): VietLexDoc {
  const issuer = item.capBanHanh?.trim() || item.nguon || "VietLex";
  return {
    id: item.id || `vl-${crypto.randomUUID()}`,
    docNumber: item.soHieu || "Không rõ số hiệu",
    title: item.title || "Không có tiêu đề",
    issuer,
    date: parseVietLexDate(item.ngayBanHanh),
  };
}

export async function handleSearchVietLex({ request }: { request: Request }) {
  await getDelay();
  const url = new URL(request.url);
  const q = parseQuery(url).q?.trim() ?? "";

  if (!q) {
    return jsonResponse([]);
  }

  try {
    const apiUrl = `https://vietlex.vn/api/v1/search?q=${encodeURIComponent(q)}`;
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      console.error(`[VietLex] Search failed: ${response.status}`);
      return jsonResponse([]);
    }

    const data = (await response.json()) as {
      results?: VietLexSearchResult[];
    };
    const items = Array.isArray(data.results) ? data.results : [];
    const mapped = items.map(mapVietLexResult);
    return jsonResponse(mapped);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[VietLex] Search error: ${message}`);
    return jsonResponse([]);
  }
}

export async function handleGetRegulationDependencies({
  params,
}: MockResolverContext) {
  await getDelay();
  const db = getDb();
  const id = params.id as string;
  const item = findById(db.regulations, id);
  if (!item) return notFound("Regulation not found");

  const dependencies = db.regulationDependencies.filter(
    (d) => d.fromRegulationId === id || d.toRegulationId === id,
  );

  const result: RegulationDependencyItem[] = dependencies.map((d) => {
    const direction: "outgoing" | "incoming" =
      d.fromRegulationId === id ? "outgoing" : "incoming";
    const relatedRegulationId =
      direction === "outgoing" ? d.toRegulationId : d.fromRegulationId;
    const relatedRegulation = findById(db.regulations, relatedRegulationId);
    return {
      ...d,
      direction,
      relatedRegulationId,
      relatedRegulationTitle: relatedRegulation?.title,
    };
  });

  return jsonResponse(result);
}

export async function handleCreateRegulationDependency({
  request,
}: {
  request: Request;
}) {
  await getDelay();
  const body = (await request.json()) as Partial<RegulationDependency>;
  if (!body.fromRegulationId) return badRequest("fromRegulationId is required");
  if (!body.toRegulationId) return badRequest("toRegulationId is required");
  if (!body.type) return badRequest("type is required");

  const db = getDb();
  if (!findById(db.regulations, body.fromRegulationId)) {
    return badRequest("Source regulation not found");
  }
  if (!findById(db.regulations, body.toRegulationId)) {
    return badRequest("Target regulation not found");
  }

  const dependency: RegulationDependency = {
    id: `dep-${crypto.randomUUID()}`,
    fromRegulationId: body.fromRegulationId,
    toRegulationId: body.toRegulationId,
    type: body.type,
    description: body.description ?? "",
    notes: body.notes,
    createdDate: new Date().toISOString(),
  };
  db.regulationDependencies.unshift(dependency);

  if (dependency.type === "supersedes") {
    const targetIndex = db.regulations.findIndex(
      (r) => r.id === dependency.toRegulationId,
    );
    if (targetIndex !== -1) {
      db.regulations[targetIndex] = {
        ...db.regulations[targetIndex],
        status: "Superseded",
        updatedDate: new Date().toISOString(),
      };
    }
  }

  return jsonResponse(dependency, 201);
}

export async function handleUpdateRegulationDependency({
  params,
  request,
}: MockResolverContext) {
  await getDelay();
  const db = getDb();
  const index = db.regulationDependencies.findIndex((d) => d.id === params.id);
  if (index === -1) return notFound("Dependency not found");

  const body = (await request.json()) as Partial<RegulationDependency>;
  const updated: RegulationDependency = {
    ...db.regulationDependencies[index],
    ...body,
  };
  db.regulationDependencies[index] = updated;
  return jsonResponse(updated);
}

export async function handleDeleteRegulationDependency({
  params,
}: MockResolverContext) {
  await getDelay();
  const db = getDb();
  const index = db.regulationDependencies.findIndex((d) => d.id === params.id);
  if (index === -1) return notFound("Dependency not found");
  db.regulationDependencies.splice(index, 1);
  return jsonResponse({ success: true });
}

export async function handleGetVietLexDetail({ params }: MockResolverContext) {
  await getDelay();
  const docNumber = decodeURIComponent(params.docNumber as string);
  const doc = VIETLEX_DOCS.find((d) => d.docNumber === docNumber);
  if (!doc) return notFound("Document not found");

  const detail: VietLexDocDetail = {
    ...doc,
    body: `Văn bản ${doc.docNumber} quy định chi tiết các yêu cầu về ${doc.title.toLowerCase()}. Văn bản này áp dụng đối với các tổ chức tài chính hoạt động tại Việt Nam và được ban hành bởi ${doc.issuer}. Các tổ chức cần tuân thủ các quy định về quy trình, báo cáo và giám sát theo hướng dẫn của cơ quan quản lý.`,
    articles: [
      {
        id: "art-1",
        title: "Điều 1. Phạm vi điều chỉnh",
        content:
          "Quy định này áp dụng đối với các tổ chức tín dụng, chi nhánh ngân hàng nước ngoài và các tổ chức tài chính liên quan.",
      },
      {
        id: "art-2",
        title: "Điều 2. Giải thích từ ngữ",
        content:
          "Các thuật ngữ sử dụng trong văn bản được hiểu theo quy định của pháp luật ngân hàng và chứng khoán hiện hành.",
      },
      {
        id: "art-3",
        title: "Điều 3. Trách nhiệm tuân thủ",
        content:
          "Các tổ chức phải thiết lập quy trình nội bộ, phân công trách nhiệm và báo cáo định kỳ cho cơ quan quản lý.",
      },
      {
        id: "art-4",
        title: "Điều 4. Chế tài xử lý",
        content:
          "Vi phạm các quy định tại văn bản này sẽ bị xử lý theo quy định của pháp luật và thẩm quyền của cơ quan quản lý.",
      },
    ],
  };

  return jsonResponse(detail);
}

export const regulationHandlers = [
  http.get("/api/regulations", handleGetRegulationList),
  http.get("/api/regulations/:id", handleGetRegulationDetail),
  http.post("/api/regulations", handleCreateRegulation),
  http.put("/api/regulations/:id", handleUpdateRegulation),
  http.patch("/api/regulations/:id/archive", handleArchiveRegulationToggle),
  http.patch("/api/regulations/bulk-archive", handleBulkArchiveRegulations),
  http.delete("/api/regulations/:id", handleDeleteRegulation),
  http.get("/api/regulations/:id/timeline", handleGetRegulationTimeline),
  http.get("/api/regulations/:id/comments", handleGetRegulationComments),
  http.post("/api/regulations/:id/comments", handleCreateRegulationComment),
  http.post("/api/regulations/compare", handleCompareRegulations),
  http.post("/api/regulations/impact", handleRegulationImpact),
  http.get(
    "/api/regulations/:id/dependencies",
    handleGetRegulationDependencies,
  ),
  http.post("/api/regulation-dependencies", handleCreateRegulationDependency),
  http.patch(
    "/api/regulation-dependencies/:id",
    handleUpdateRegulationDependency,
  ),
  http.delete(
    "/api/regulation-dependencies/:id",
    handleDeleteRegulationDependency,
  ),
  http.get("/api/vietlex/search", handleSearchVietLex),
  http.get("/api/vietlex/:docNumber", handleGetVietLexDetail),
];
