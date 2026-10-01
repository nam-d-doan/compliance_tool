/**
 * PSEUDO CODE (ngắn gọn) — Logic cảnh báo đỏ (GĐ3, Phụ lục 2 mục b/c)
 * 1. "Hôm nay" dùng DEMO_TODAY (mốc cố định của toàn bộ dữ liệu mẫu), KHÔNG
 *    dùng ngày thực của máy — nếu không mọi hạn seed (quanh DEMO_TODAY) sẽ
 *    hiện quá hạn hết, mất phân biệt đỏ/vàng/chưa tới hạn khi demo.
 * 2. pending -> flagged khi now >= dueDate - daysBefore. acknowledged/resolved
 *    là hành động thủ công, không tự đổi ngược.
 * 3. Màu hiển thị: đỏ = đã qua dueDate, vàng = đã bật cờ nhưng chưa tới
 *    dueDate, không màu = pending/acknowledged/resolved.
 * 4. File thuần (không import db/handler) để dùng chung được cả server mock
 *    lẫn UI — tránh tính 2 lần 2 công thức khác nhau.
 */
import type { LegalDeadline, LegalDeadlineStatus } from "@/types";

export type DeadlineSeverity = "red" | "amber" | "none";

export function isPastAlertThreshold(
  dueDate: string,
  daysBefore: number,
  now: Date,
): boolean {
  const thresholdMs = new Date(dueDate).getTime() - daysBefore * 86_400_000;
  return now.getTime() >= thresholdMs;
}

export function nextDeadlineStatus(
  deadline: Pick<LegalDeadline, "status" | "dueDate">,
  daysBefore: number,
  now: Date,
): LegalDeadlineStatus {
  if (deadline.status !== "pending") return deadline.status;
  return isPastAlertThreshold(deadline.dueDate, daysBefore, now)
    ? "flagged"
    : "pending";
}

export function deadlineSeverity(
  deadline: Pick<LegalDeadline, "status" | "dueDate">,
  now: Date,
): DeadlineSeverity {
  if (deadline.status !== "flagged") return "none";
  return new Date(deadline.dueDate).getTime() < now.getTime() ? "red" : "amber";
}
