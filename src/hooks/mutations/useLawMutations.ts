import { useMutation, useQueryClient } from "@tanstack/react-query";
import { LawService } from "@/services";
import { lawKeys } from "@/hooks/query-keys";
import type {
  LawRequestFilter,
  CreateAdviceRequestInput,
  UpdateAdviceRequestInput,
  UpdateLawAlertInput,
  CreateKnowledgeBaseEntryInput,
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

/** GĐ2 — "Đôn đốc": tạo thông báo + ghi lịch sử. */
export function useRemindLawRequest(requestId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (actor: { fromUserId?: string; fromUserName?: string }) =>
      LawService.remind(requestId, actor.fromUserId, actor.fromUserName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: lawKeys.events(requestId) });
    },
  });
}

/** GĐ3 — tiếp nhận/xử lý xong cảnh báo đỏ. */
export function useUpdateLawAlert(requestId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateLawAlertInput) =>
      LawService.updateAlert(requestId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: lawKeys.detail(requestId) });
      queryClient.invalidateQueries({ queryKey: lawKeys.events(requestId) });
      queryClient.invalidateQueries({ queryKey: lawKeys.lists() });
    },
  });
}

/** GĐ3 — thêm 1 mục vào kho tri thức. */
export function useCreateKnowledgeBaseEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateKnowledgeBaseEntryInput) => LawService.kbCreate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: lawKeys.all });
    },
  });
}
