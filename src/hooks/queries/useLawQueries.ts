import { useQuery } from "@tanstack/react-query";
import { LawService } from "@/services";
import { lawKeys } from "@/hooks/query-keys";
import { useAuthStore } from "@/stores";
import type { KnowledgeBaseKind, LawRequestFilter } from "@/types";

export function useLawRequestList(
  filters: LawRequestFilter = {},
  page = 1,
  pageSize = 20,
) {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    // Server lọc theo người đăng nhập (chuyên viên chỉ thấy yêu cầu của mình).
    queryKey: [...lawKeys.list({ ...filters, page, pageSize }), userId ?? "anon"],
    queryFn: () => LawService.list({ ...filters, page, pageSize }),
    staleTime: 5 * 60 * 1000,
  });
}

export function useLawRequestDetail(id: string) {
  return useQuery({
    queryKey: lawKeys.detail(id),
    queryFn: () => LawService.get(id),
    enabled: Boolean(id),
    staleTime: 5 * 60 * 1000,
  });
}

export function useLawRequestEvents(id: string) {
  return useQuery({
    queryKey: lawKeys.events(id),
    queryFn: () => LawService.events(id),
    enabled: Boolean(id),
    staleTime: 5 * 60 * 1000,
  });
}

/** Review GĐ1 — bước "Trao đổi": tin nhắn 2 chiều, cũ → mới. */
export function useLawMessages(id: string) {
  return useQuery({
    queryKey: lawKeys.messages(id),
    queryFn: () => LawService.messages(id),
    enabled: Boolean(id),
  });
}

/** Review GĐ1 — bước "Đóng": các phiên bản ý kiến tư vấn, mới → cũ. */
export function useLawOpinions(id: string) {
  return useQuery({
    queryKey: lawKeys.opinions(id),
    queryFn: () => LawService.opinions(id),
    enabled: Boolean(id),
  });
}

/** GĐ2 — tải công việc từng chuyên viên, cho hộp thoại phân công. */
export function useLawWorkload(enabled = true) {
  return useQuery({
    enabled,
    queryKey: lawKeys.workload(),
    queryFn: () => LawService.workload(),
    staleTime: 60 * 1000,
  });
}

/** GĐ3 — Khai thác Tri thức: danh sách + tìm theo từ khóa. */
export function useKnowledgeBaseList(search?: string, kind?: KnowledgeBaseKind) {
  return useQuery({
    queryKey: lawKeys.knowledgeBase(search, kind),
    queryFn: () => LawService.kbList(search, kind),
    staleTime: 5 * 60 * 1000,
  });
}

/** GĐ4 — tổng hợp KPI/biểu đồ cho trang Dashboard. */
/** Kết quả phụ thuộc người đăng nhập (phạm vi chuyên viên/manager) — key theo user. */
export function useLawDashboard() {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: [...lawKeys.dashboard(), userId ?? "anon"],
    queryFn: () => LawService.dashboard(),
    staleTime: 60 * 1000,
  });
}
