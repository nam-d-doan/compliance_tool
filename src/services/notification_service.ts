import { apiGet, apiPut } from "@/lib/api";
import { API_ENDPOINTS } from "@/constants/api";
import type { Notification, Paginated } from "@/types";

export const NotificationService = {
  list(
    page = 1,
    pageSize = 20,
    filters: { type?: string; read?: boolean } = {},
  ) {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    });
    if (filters.type) params.set("type", filters.type);
    if (filters.read !== undefined) params.set("read", String(filters.read));
    return apiGet<Paginated<Notification>>(
      `${API_ENDPOINTS.NOTIFICATIONS}?${params.toString()}`,
    );
  },

  markRead(id: string) {
    return apiPut<Notification>(API_ENDPOINTS.NOTIFICATION_READ(id), {});
  },

  markAllRead() {
    return apiPut<{ success: boolean; count: number }>(
      API_ENDPOINTS.NOTIFICATIONS_READ_ALL,
      {},
    );
  },
};
