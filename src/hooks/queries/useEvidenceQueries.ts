import { useQuery } from "@tanstack/react-query";
import { EvidenceService } from "@/services";
import { evidenceKeys } from "@/hooks/query-keys";
import type { EvidenceFilter } from "@/types";

export function useEvidenceList(
  filters: EvidenceFilter = {},
  page = 1,
  pageSize = 20,
) {
  return useQuery({
    queryKey: evidenceKeys.list({ ...filters, page, pageSize }),
    queryFn: () => EvidenceService.list({ ...filters, page, pageSize }),
    staleTime: 5 * 60 * 1000,
  });
}

export function useEvidenceDetail(id: string) {
  return useQuery({
    queryKey: evidenceKeys.detail(id),
    queryFn: () => EvidenceService.get(id),
    enabled: Boolean(id),
    staleTime: 5 * 60 * 1000,
  });
}

export function useEvidenceComments(id: string) {
  return useQuery({
    queryKey: evidenceKeys.comments(id),
    queryFn: () => EvidenceService.comments(id),
    enabled: Boolean(id),
    staleTime: 5 * 60 * 1000,
  });
}

export function useEvidenceTimeline(id: string) {
  return useQuery({
    queryKey: evidenceKeys.timeline(id),
    queryFn: () => EvidenceService.timeline(id),
    enabled: Boolean(id),
    staleTime: 5 * 60 * 1000,
  });
}
