import { useQuery } from "@tanstack/react-query";
import { ComplianceService } from "@/services";
import { complianceKeys } from "@/hooks/query-keys";
import type { ComplianceFilter, ComplianceSubmission } from "@/types";

export function useComplianceList(
  filters: ComplianceFilter = {},
  page = 1,
  pageSize = 20,
) {
  return useQuery({
    queryKey: complianceKeys.list({ ...filters, page, pageSize }),
    queryFn: () => ComplianceService.list({ ...filters, page, pageSize }),
    staleTime: 5 * 60 * 1000,
  });
}

export function useComplianceDetail(id: string) {
  return useQuery({
    queryKey: complianceKeys.detail(id),
    queryFn: () => ComplianceService.get(id),
    enabled: Boolean(id),
    staleTime: 5 * 60 * 1000,
  });
}

export function useComplianceTimeline(id: string) {
  return useQuery({
    queryKey: complianceKeys.timeline(id),
    queryFn: () => ComplianceService.timeline(id),
    enabled: Boolean(id),
    staleTime: 5 * 60 * 1000,
  });
}

export function useComplianceComments(id: string) {
  return useQuery({
    queryKey: complianceKeys.comments(id),
    queryFn: () => ComplianceService.comments(id),
    enabled: Boolean(id),
    staleTime: 5 * 60 * 1000,
  });
}

export function useComplianceSubmissions(
  filters: ComplianceFilter = {},
  page = 1,
  pageSize = 20,
) {
  return useQuery({
    queryKey: complianceKeys.history({ ...filters, page, pageSize }),
    queryFn: () => ComplianceService.history({ ...filters, page, pageSize }),
    staleTime: 5 * 60 * 1000,
  });
}

export function useComplianceSubmissionHistory(filters: ComplianceFilter = {}) {
  return useQuery<ComplianceSubmission[]>({
    queryKey: complianceKeys.history(filters),
    queryFn: async () => {
      const result = await ComplianceService.history(filters);
      return result.items;
    },
    staleTime: 5 * 60 * 1000,
  });
}
