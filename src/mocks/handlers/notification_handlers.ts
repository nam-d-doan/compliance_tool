import { http } from "msw";
import { getDb, findById, paginate } from "@/mocks/db";
import {
  getDelay,
  jsonResponse,
  notFound,
  parseQuery,
  parseNumber,
  type MockResolverContext,
} from "./utils";

export async function handleGetNotifications({
  request,
}: {
  request: Request;
}) {
  await getDelay();
  const url = new URL(request.url);
  const q = parseQuery(url);
  const db = getDb();
  let items = [...db.notifications];
  if (q.type) items = items.filter((n) => n.type === q.type);
  if (q.read) items = items.filter((n) => String(n.read) === q.read);
  const page = parseNumber(q.page, 1);
  const pageSize = parseNumber(q.pageSize, 20);
  return jsonResponse(paginate(items, page, pageSize));
}

export async function handleMarkNotificationRead({
  params,
}: MockResolverContext) {
  await getDelay();
  const db = getDb();
  const item = findById(db.notifications, params.id as string);
  if (!item) return notFound("Notification not found");
  item.read = true;
  item.updatedAt = new Date().toISOString();
  return jsonResponse(item);
}

export async function handleMarkAllNotificationsRead() {
  await getDelay();
  const db = getDb();
  db.notifications.forEach((n) => {
    n.read = true;
    n.updatedAt = new Date().toISOString();
  });
  return jsonResponse({ success: true, count: db.notifications.length });
}

export const notificationHandlers = [
  http.get("/api/notifications", handleGetNotifications),
  http.put("/api/notifications/:id/read", handleMarkNotificationRead),
  http.put("/api/notifications/read-all", handleMarkAllNotificationsRead),
];
