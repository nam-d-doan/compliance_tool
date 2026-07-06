import { http } from "msw";
import { getDb, paginate } from "@/mocks/db";
import {
  getDelay,
  jsonResponse,
  parseQuery,
  parseNumber,
  type MockResolverContext,
} from "./utils";

export async function handleGetComments({
  params,
  request,
}: MockResolverContext) {
  await getDelay();
  const url = new URL(request.url);
  const q = parseQuery(url);
  const db = getDb();
  const entityType = params.entityType as "compliance" | "cap" | "regulation";
  const entityId = params.entityId as string;
  const comments = db.generateCommentsFor(entityId, entityType);
  const page = parseNumber(q.page, 1);
  const pageSize = parseNumber(q.pageSize, 20);
  return jsonResponse(paginate(comments, page, pageSize));
}

export const commentHandlers = [
  http.get("/api/comments/:entityType/:entityId", handleGetComments),
];
