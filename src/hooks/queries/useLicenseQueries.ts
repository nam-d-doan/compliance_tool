import { useQuery } from "@tanstack/react-query";
import { LicenseService } from "@/services";
import { apiGet } from "@/lib/api";
import { API_ENDPOINTS } from "@/constants/api";
import { licenseKeys } from "@/hooks/query-keys";
import type { LicenseFilter, LicenseComment } from "@/types";

export function useLicenseList(
  filters: LicenseFilter = {},
  page = 1,
  pageSize = 20,
) {
  return useQuery({
    queryKey: licenseKeys.list({ ...filters, page, pageSize }),
    queryFn: () => LicenseService.list({ ...filters, page, pageSize }),
    staleTime: 5 * 60 * 1000,
  });
}

export function useLicenseDetail(id: string) {
  return useQuery({
    queryKey: licenseKeys.detail(id),
    queryFn: () => LicenseService.get(id),
    enabled: Boolean(id),
    staleTime: 5 * 60 * 1000,
  });
}

export function useLicenseCalendar(
  filters: { dateFrom?: string; dateTo?: string } = {},
  page = 1,
  pageSize = 50,
) {
  return useQuery({
    queryKey: licenseKeys.calendar(),
    queryFn: () => LicenseService.calendar({ ...filters, page, pageSize }),
    staleTime: 5 * 60 * 1000,
  });
}

export function useLicenseComments(id: string) {
  return useQuery({
    queryKey: [...licenseKeys.detail(id), "comments"],
    queryFn: async () => {
      const res = await apiGet<{
        items: LicenseComment[];
        total: number;
        page: number;
        pageSize: number;
      }>(API_ENDPOINTS.LICENSE_COMMENTS(id));
      return res.items;
    },
    enabled: Boolean(id),
    staleTime: 5 * 60 * 1000,
  });
}
