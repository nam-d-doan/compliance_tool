import { useMutation, useQueryClient } from "@tanstack/react-query";
import { LawService } from "@/services";
import { lawKeys } from "@/hooks/query-keys";
import type {
  LawRequestFilter,
  CreateAdviceRequestInput,
  UpdateAdviceRequestInput,
} from "@/types";

export function useCreateLawRequest(filters: LawRequestFilter = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAdviceRequestInput) => LawService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: lawKeys.lists() });
      queryClient.invalidateQueries({ queryKey: lawKeys.list(filters) });
    },
  });
}

export function useUpdateLawRequest(id: string, filters: LawRequestFilter = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateAdviceRequestInput) => LawService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: lawKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: lawKeys.events(id) });
      queryClient.invalidateQueries({ queryKey: lawKeys.lists() });
      queryClient.invalidateQueries({ queryKey: lawKeys.list(filters) });
    },
  });
}

export function useDeleteLawRequest(filters: LawRequestFilter = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => LawService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: lawKeys.lists() });
      queryClient.invalidateQueries({ queryKey: lawKeys.list(filters) });
    },
  });
}
