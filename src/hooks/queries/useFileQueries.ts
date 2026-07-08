import { useQuery } from "@tanstack/react-query";
import { FileService } from "@/services";
import { fileKeys } from "@/hooks/query-keys";

/** Fetch files attached to a CAP (or all files when capId is omitted). */
export function useFileList(filters: { capId?: string; search?: string } = {}) {
  return useQuery({
    queryKey: fileKeys.list(filters),
    queryFn: () => FileService.list(filters),
    staleTime: 2 * 60 * 1000,
  });
}

export function useCapFiles(capId: string | undefined) {
  return useQuery({
    queryKey: capId ? fileKeys.byCap(capId) : ["files", "cap", "none"],
    queryFn: () => FileService.list({ capId }),
    enabled: Boolean(capId),
    staleTime: 2 * 60 * 1000,
  });
}

export function useNccFiles(nccId: string | undefined) {
  return useQuery({
    queryKey: nccId ? fileKeys.byNcc(nccId) : ["files", "ncc", "none"],
    queryFn: () => FileService.list({ nccId }),
    enabled: Boolean(nccId),
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Fetch files by explicit ID list. Used by the CAP detail page, which knows
 * the linked IDs from the CAP record regardless of whether each file's
 * `capId` is set (e.g. files uploaded before the CAP existed).
 */
export function useFilesByIds(ids: string[]) {
  const idsKey = ids.join(",");
  return useQuery({
    queryKey: ["files", "byIds", idsKey],
    queryFn: () => FileService.list({ ids }),
    enabled: ids.length > 0,
    staleTime: 2 * 60 * 1000,
  });
}
