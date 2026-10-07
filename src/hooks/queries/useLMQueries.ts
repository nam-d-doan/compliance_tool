import { useQuery } from "@tanstack/react-query";
import { LMService } from "@/services";
import { lmKeys } from "@/hooks/query-keys";
import type { LMCaseFilter } from "@/types";

export function useLMCaseList(
  filters: LMCaseFilter = {},
  page = 1,
  pageSize = 20,
) {
  return useQuery({
    queryKey: lmKeys.list({ ...filters, page, pageSize }),
    queryFn: () => LMService.list({ ...filters, page, pageSize }),
    staleTime: 5 * 60 * 1000,
  });
}

export function useLMCaseDetail(id: string) {
  return useQuery({
    queryKey: lmKeys.detail(id),
    queryFn: () => LMService.get(id),
    enabled: Boolean(id),
    staleTime: 5 * 60 * 1000,
  });
}

export function useLMCaseMilestones(id: string) {
  return useQuery({
    queryKey: lmKeys.milestones(id),
    queryFn: () => LMService.milestones(id),
    enabled: Boolean(id),
    staleTime: 5 * 60 * 1000,
  });
}

export function useLMCaseDeadlines(id: string) {
  return useQuery({
    queryKey: lmKeys.deadlines(id),
    queryFn: () => LMService.deadlines(id),
    enabled: Boolean(id),
    staleTime: 5 * 60 * 1000,
  });
}

export function useLMCaseEvents(id: string) {
  return useQuery({
    queryKey: lmKeys.events(id),
    queryFn: () => LMService.events(id),
    enabled: Boolean(id),
    staleTime: 5 * 60 * 1000,
  });
}

/** Nam review R3 — task tự do của 1 hồ sơ, cho tab "Work Calendar". */
export function useLMCaseTasks(id: string) {
  return useQuery({
    queryKey: lmKeys.tasks(id),
    queryFn: () => LMService.tasks(id),
    enabled: Boolean(id),
    staleTime: 60 * 1000,
  });
}

export function useLMAlertRules() {
  return useQuery({
    queryKey: lmKeys.alertRules(),
    queryFn: () => LMService.alertRules(),
    staleTime: 5 * 60 * 1000,
  });
}

/** GĐ2 — tải công việc từng chuyên viên, cho hộp thoại phân công. */
export function useLMWorkload() {
  return useQuery({
    queryKey: lmKeys.workload(),
    queryFn: () => LMService.workload(),
    staleTime: 60 * 1000,
  });
}

/** GĐ4 — tổng hợp KPI/biểu đồ cho trang Dashboard. `ownerId` (Nam review R1)
 * scope toàn bộ số liệu về 1 chuyên viên — xem docs/lm/02-review-changes.md. */
export function useLMDashboard(ownerId?: string) {
  return useQuery({
    queryKey: lmKeys.dashboard(ownerId),
    queryFn: () => LMService.dashboard(ownerId),
    staleTime: 60 * 1000,
  });
}
