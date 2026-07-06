import { useQuery } from "@tanstack/react-query";
import { NotificationService } from "@/services";
import { notificationKeys } from "@/hooks/query-keys";

export function useNotifications(
  page = 1,
  pageSize = 20,
  filters: { type?: string; read?: boolean } = {},
) {
  return useQuery({
    queryKey: [...notificationKeys.list(), { page, pageSize, ...filters }],
    queryFn: () => NotificationService.list(page, pageSize, filters),
    staleTime: 2 * 60 * 1000,
  });
}
