import { useQuery } from "@tanstack/react-query";
import { DashboardService } from "@/services";
import { dashboardKeys } from "@/hooks/query-keys";

export function useDashboard(role: string) {
  return useQuery({
    queryKey: dashboardKeys.byRole(role),
    queryFn: () => DashboardService.get(role),
    staleTime: 5 * 60 * 1000,
  });
}
