import { useMutation, useQueryClient } from "@tanstack/react-query";
import { LawService } from "@/services";
import { lawKeys } from "@/hooks/query-keys";
import type {
  LawRequestFilter,
  CreateAdviceRequestInput,
  UpdateAdviceRequestInput,
  UpdateLawAlertInput,
  CreateKnowledgeBaseEntryInput,
  AssessLawRequestInput,
  CreateLawMessageInput,
  SubmitAdvisoryOpinionInput,
  ReviewAdvisoryOpinionInput,
  SaveOpinionToKnowledgeBaseInput,
  SetLawConfidentialityInput,
  RequestLawInfoInput,
} from "@/types";

/** Mọi bước của flow tư vấn đổi status/ghi lịch sử — làm mới đủ các nơi hiển thị. */
function invalidateFlow(queryClient: ReturnType<typeof useQueryClient>, requestId: string) {
  queryClient.invalidateQueries({ queryKey: lawKeys.detail(requestId) });
  queryClient.invalidateQueries({ queryKey: lawKeys.lists() });
  queryClient.invalidateQueries({ queryKey: lawKeys.dashboard() });
  queryClient.invalidateQueries({ queryKey: lawKeys.workload() });
}

export function useAssessLawRequest(requestId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AssessLawRequestInput) => LawService.assess(requestId, data),
    onSuccess: () => invalidateFlow(queryClient, requestId),
  });
}

export function usePostLawMessage(requestId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateLawMessageInput) => LawService.postMessage(requestId, data),
    onSuccess: () => invalidateFlow(queryClient, requestId),
  });
}

export function useSubmitLawOpinion(requestId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SubmitAdvisoryOpinionInput) => LawService.submitOpinion(requestId, data),
    onSuccess: () => invalidateFlow(queryClient, requestId),
  });
}

export function useReviewLawOpinion(requestId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ opinionId, data }: { opinionId: string; data: ReviewAdvisoryOpinionInput }) =>
      LawService.reviewOpinion(opinionId, data),
    onSuccess: () => invalidateFlow(queryClient, requestId),
  });
}

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
/** Review A1 — yêu cầu đơn vị bổ sung hồ sơ (SLA dừng). */
export function useRequestLawInfo(requestId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: RequestLawInfoInput) => LawService.requestInfo(requestId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: lawKeys.all }),
  });
}

/** Review A1 — đã nhận đủ bổ sung: SLA chạy lại, quay về bước trước. */
export function useReceiveLawInfo(requestId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => LawService.infoReceived(requestId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: lawKeys.all }),
  });
}

/** Review GĐ5 — gắn / gỡ cờ Mật. */
export function useSetLawConfidentiality(requestId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SetLawConfidentialityInput) => LawService.setConfidentiality(requestId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: lawKeys.all }),
  });
}

/** Review GĐ4 — "Lưu thành mẫu" từ ý kiến đã duyệt của yêu cầu đã đóng. */
export function useSaveOpinionToKnowledgeBase(requestId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SaveOpinionToKnowledgeBaseInput) => LawService.saveToKnowledgeBase(requestId, data),
    // lawKeys.all gồm cả kho tri thức lẫn lịch sử của yêu cầu.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: lawKeys.all }),
  });
}

export function useCreateKnowledgeBaseEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateKnowledgeBaseEntryInput) => LawService.kbCreate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: lawKeys.all });
    },
  });
}
