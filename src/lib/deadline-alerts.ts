/**
 * PSEUDO CODE (ngắn gọn) — Logic cảnh báo đỏ dùng chung LM + LAW (GĐ3)
 * 1. Tổng quát hoá từ lib/lm-alerts.ts (chỉ LM dùng) — LAW GĐ3 cần đúng
 *    logic này cho AdviceRequest.alertStatus, tách ra đây để không copy
 *    2 bản giống hệt nhau (đã note trước ở docs/law/00-decisions.md GĐ3).
 * 2. "Hôm nay" dùng DEMO_TODAY (mốc cố định dữ liệu mẫu), KHÔNG dùng ngày
 *    thực của máy — nếu không mọi hạn seed sẽ hiện quá hạn hết.
 * 3. pending -> flagged khi now >= dueDate - daysBefore. acknowledged/
 *    resolved là hành động thủ công, không tự đổi ngược.
 * 4. Màu: đỏ = đã qua dueDate, vàng = đã flagged nhưng chưa tới dueDate,
 *    không màu = pending/acknowledged/resolved.
 * 5. Kiểu input là object thuần {status, dueDate} — không import LM hay
 *    LAW type cụ thể, để cả 2 module dùng qua structural typing.
 */
export type AlertLifecycleStatus =
  | "pending"
  | "flagged"
  | "acknowledged"
  | "resolved";

export type DeadlineSeverity = "red" | "amber" | "none";

export interface AlertLike {
  status: AlertLifecycleStatus;
  dueDate: string;
}

export function isPastAlertThreshold(
  dueDate: string,
  daysBefore: number,
  now: Date,
): boolean {
  const thresholdMs = new Date(dueDate).getTime() - daysBefore * 86_400_000;
  return now.getTime() >= thresholdMs;
}

export function nextAlertStatus(
  item: AlertLike,
  daysBefore: number,
  now: Date,
): AlertLifecycleStatus {
  if (item.status !== "pending") return item.status;
  return isPastAlertThreshold(item.dueDate, daysBefore, now)
    ? "flagged"
    : "pending";
}

export function alertSeverity(item: AlertLike, now: Date): DeadlineSeverity {
  if (item.status !== "flagged") return "none";
  return new Date(item.dueDate).getTime() < now.getTime() ? "red" : "amber";
}
