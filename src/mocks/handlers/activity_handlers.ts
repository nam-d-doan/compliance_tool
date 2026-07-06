import { http } from "msw";
import { getDb, paginate } from "@/mocks/db";
import { getDelay, jsonResponse, parseQuery, parseNumber } from "./utils";
import type { ActivityFeedItem } from "@/types";

export async function handleGetActivity({ request }: { request: Request }) {
  await getDelay();
  const url = new URL(request.url);
  const q = parseQuery(url);
  const db = getDb();

  const items: ActivityFeedItem[] = db.auditLogs.slice(0, 50).map((log) => ({
    id: log.id,
    type: log.action === "login" ? "submission" : "comment",
    title: `${log.action} in ${log.module}`,
    description: log.details ?? "",
    userId: log.userId,
    userName: log.userName,
    entityType: "compliance",
    entityId: log.object,
    timestamp: log.timestamp,
    createdAt: log.createdAt,
    updatedAt: log.updatedAt,
  }));

  let filtered = items;
  if (q.type) filtered = filtered.filter((i) => i.type === q.type);
  if (q.entityType)
    filtered = filtered.filter((i) => i.entityType === q.entityType);

  const page = parseNumber(q.page, 1);
  const pageSize = parseNumber(q.pageSize, 20);
  return jsonResponse(paginate(filtered, page, pageSize));
}

export const activityHandlers = [http.get("/api/activity", handleGetActivity)];
