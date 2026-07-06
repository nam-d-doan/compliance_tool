import { useQuery } from "@tanstack/react-query";
import { ReportService } from "@/services";
import { reportKeys } from "@/hooks/query-keys";
import type { ReportFilter, ReportType } from "@/types";

export function useReport(
  type: ReportType,
  filters: ReportFilter = {},
  page = 1,
  pageSize = 20,
) {
  return useQuery({
    queryKey: reportKeys.byType(type, { ...filters, page, pageSize }),
    queryFn: () => ReportService.get(type, { ...filters, page, pageSize }),
    staleTime: 5 * 60 * 1000,
  });
}
