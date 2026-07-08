import { useMutation, useQueryClient } from "@tanstack/react-query";
import { NCCService } from "@/services";
import { nccKeys } from "@/hooks/query-keys";
import type { NCCFilter, CreateNCCInput, UpdateNCCInput } from "@/types";

export function useCreateNCC(filters: NCCFilter = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateNCCInput) => NCCService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: nccKeys.lists() });
      queryClient.invalidateQueries({ queryKey: nccKeys.list(filters) });
    },
  });
}

export function useUpdateNCC(id: string, filters: NCCFilter = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateNCCInput) => NCCService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: nccKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: nccKeys.lists() });
      queryClient.invalidateQueries({ queryKey: nccKeys.list(filters) });
    },
  });
}

export function useDeleteNCC(filters: NCCFilter = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => NCCService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: nccKeys.lists() });
      queryClient.invalidateQueries({ queryKey: nccKeys.list(filters) });
    },
  });
}
