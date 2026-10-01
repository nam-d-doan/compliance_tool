import { useMutation, useQueryClient } from "@tanstack/react-query";
import { LMService } from "@/services";
import { lmKeys } from "@/hooks/query-keys";
import type {
  LMCaseFilter,
  CreateLMCaseInput,
  UpdateLMCaseInput,
  UpdateLMMilestoneInput,
  UpdateLMDeadlineInput,
} from "@/types";

export function useCreateLMCase(filters: LMCaseFilter = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateLMCaseInput) => LMService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: lmKeys.lists() });
      queryClient.invalidateQueries({ queryKey: lmKeys.list(filters) });
    },
  });
}

export function useUpdateLMCase(id: string, filters: LMCaseFilter = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateLMCaseInput) => LMService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: lmKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: lmKeys.events(id) });
      queryClient.invalidateQueries({ queryKey: lmKeys.lists() });
      queryClient.invalidateQueries({ queryKey: lmKeys.list(filters) });
    },
  });
}

export function useDeleteLMCase(filters: LMCaseFilter = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => LMService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: lmKeys.lists() });
      queryClient.invalidateQueries({ queryKey: lmKeys.list(filters) });
    },
  });
}

/** GĐ2 — đổi ngày kế hoạch hoặc đánh dấu 1 mốc hoàn thành. */
export function useUpdateLMMilestone(caseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateLMMilestoneInput;
    }) => LMService.updateMilestone(id, data),
    onSuccess: () => {
      // Hoàn thành mốc có thể đổi cả stage/status của hồ sơ, nên invalidate
      // luôn detail + events, không chỉ riêng danh sách mốc.
      queryClient.invalidateQueries({ queryKey: lmKeys.milestones(caseId) });
      queryClient.invalidateQueries({ queryKey: lmKeys.detail(caseId) });
      queryClient.invalidateQueries({ queryKey: lmKeys.events(caseId) });
      queryClient.invalidateQueries({ queryKey: lmKeys.lists() });
    },
  });
}

/** GĐ3 — tiếp nhận ("acknowledge") hoặc xử lý xong ("resolve") 1 hạn cảnh báo. */
export function useUpdateLMDeadline(caseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateLMDeadlineInput;
    }) => LMService.updateDeadline(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: lmKeys.deadlines(caseId) });
      queryClient.invalidateQueries({ queryKey: lmKeys.detail(caseId) });
      queryClient.invalidateQueries({ queryKey: lmKeys.events(caseId) });
      queryClient.invalidateQueries({ queryKey: lmKeys.lists() });
    },
  });
}

/** GĐ2 — nút "Đôn đốc": tạo thông báo + ghi lịch sử. */
export function useRemindLMCase(caseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (actor: { fromUserId?: string; fromUserName?: string }) =>
      LMService.remind(caseId, actor.fromUserId, actor.fromUserName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: lmKeys.events(caseId) });
    },
  });
}
