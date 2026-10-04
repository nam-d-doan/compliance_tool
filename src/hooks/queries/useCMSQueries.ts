import { useQuery } from "@tanstack/react-query";
import { CMSService } from "@/services";
import { cmsKeys } from "@/hooks/query-keys";

// CMS data changes through demo actions and the demo clock, so keep it fresh.
const CMS_STALE = 15 * 1000;

export function useCmsOverview() {
  return useQuery({
    queryKey: cmsKeys.overview(),
    queryFn: () => CMSService.overview(),
    staleTime: CMS_STALE,
  });
}

export function useLegalUpdates() {
  return useQuery({
    queryKey: cmsKeys.legalUpdates(),
    queryFn: () => CMSService.legalUpdates(),
    staleTime: CMS_STALE,
  });
}

export function useLegalUpdate(id: string) {
  return useQuery({
    queryKey: cmsKeys.legalUpdate(id),
    queryFn: () => CMSService.legalUpdate(id),
    enabled: Boolean(id),
    staleTime: CMS_STALE,
  });
}

export function useQdnbList() {
  return useQuery({
    queryKey: cmsKeys.qdnbList(),
    queryFn: () => CMSService.qdnbList(),
    staleTime: CMS_STALE,
  });
}

export function useQdnb(id: string) {
  return useQuery({
    queryKey: cmsKeys.qdnb(id),
    queryFn: () => CMSService.qdnb(id),
    enabled: Boolean(id),
    staleTime: CMS_STALE,
  });
}

export function useRevisions() {
  return useQuery({
    queryKey: cmsKeys.revisions(),
    queryFn: () => CMSService.revisions(),
    staleTime: CMS_STALE,
  });
}

export function useIcisFindings() {
  return useQuery({
    queryKey: cmsKeys.icis(),
    queryFn: () => CMSService.icisFindings(),
    staleTime: CMS_STALE,
  });
}

export function useIcisSuggestion(id: string | null) {
  return useQuery({
    queryKey: cmsKeys.icisSuggestion(id ?? ""),
    queryFn: () => CMSService.icisSuggestion(id ?? ""),
    enabled: Boolean(id),
  });
}

export function useRiskMatrices() {
  return useQuery({
    queryKey: cmsKeys.riskMatrices(),
    queryFn: () => CMSService.riskMatrices(),
    staleTime: CMS_STALE,
  });
}

/** The active Risk Rating Matrix (convenience selector). */
export function useActiveRiskMatrix() {
  const q = useRiskMatrices();
  return { ...q, data: q.data?.find((m) => m.status === "active") };
}

export function useEscalationRules() {
  return useQuery({
    queryKey: cmsKeys.escalationRules(),
    queryFn: () => CMSService.escalationRules(),
    staleTime: CMS_STALE,
  });
}

export function useCmsReports() {
  return useQuery({
    queryKey: cmsKeys.reports(),
    queryFn: () => CMSService.reports(),
    staleTime: CMS_STALE,
  });
}

export function useSmartSearch(q: string, mode: "semantic" | "keyword") {
  return useQuery({
    queryKey: cmsKeys.search(q, mode),
    queryFn: () => CMSService.search(q, mode),
    enabled: q.trim().length >= 2,
    staleTime: CMS_STALE,
  });
}

/** Audit trail for one record — powers the History tabs. */
export function useEntityHistory(entityId: string) {
  return useQuery({
    queryKey: cmsKeys.history(entityId),
    queryFn: () => CMSService.history(entityId),
    enabled: Boolean(entityId),
    staleTime: 0,
  });
}
