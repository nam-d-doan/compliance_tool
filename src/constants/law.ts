/**
 * PSEUDO CODE (ngắn gọn) — Hằng số nghiệp vụ module LAW
 * 1. Mức ưu tiên gắn CĂN CỨ PHÁP LÝ (không phải mức nghiêm trọng chung như
 *    PriorityLevel) — enum riêng, đúng 3 mức theo Phụ lục 3 mục 1.a.
 * 2. LAW_PRIORITY_SLA_DAYS là PLACEHOLDER — Phụ lục 3 KHÔNG nêu số ngày
 *    SLA cụ thể (khác LM còn có gợi ý). Chưa có xác nhận từ Nam/pháp chế,
 *    xem docs/law/00-decisions.md mục 5.
 * 3. Vòng đời yêu cầu chỉ 3 trạng thái — không có 5-mốc như LM.
 */
import type { ComponentType } from "react";
import { Gavel, ShieldAlert, Building2, type LucideIcon } from "lucide-react";

export const LAW_PRIORITY_TIERS = [
  "law_mandatory",
  "sbv_regulation",
  "internal",
] as const;

export type LawPriorityTier = (typeof LAW_PRIORITY_TIERS)[number];

export interface LawPriorityStyle {
  label: string;
  icon: LucideIcon | ComponentType<{ className?: string }>;
}

export const LAW_PRIORITY_STYLES: Record<LawPriorityTier, LawPriorityStyle> = {
  law_mandatory: { label: "Priority 1 — Legally Mandatory", icon: Gavel },
  sbv_regulation: { label: "Priority 2 — SBV Regulation", icon: ShieldAlert },
  internal: { label: "Priority 3 — Internal", icon: Building2 },
};

/**
 * ⏳ CHỜ XÁC NHẬN — placeholder, xem docs/law/00-decisions.md mục 5.
 * KHÔNG dùng số này để cam kết SLA thật.
 */
export const LAW_PRIORITY_SLA_DAYS: Record<LawPriorityTier, number> = {
  law_mandatory: 5,
  sbv_regulation: 10,
  internal: 15,
};

/** ⏳ CHỜ XÁC NHẬN — placeholder cùng lý do với LAW_PRIORITY_SLA_DAYS. */
export const LAW_PRIORITY_ALERT_DAYS_BEFORE: Record<LawPriorityTier, number> = {
  law_mandatory: 2,
  sbv_regulation: 3,
  internal: 3,
};

/** GĐ2 — trọng số tải công việc theo mức ưu tiên, dùng cho hộp thoại phân
 * công (giống PRIORITY_WORKLOAD_WEIGHT của LM nhưng theo 3 mức riêng). */
export const LAW_PRIORITY_WORKLOAD_WEIGHT: Record<LawPriorityTier, number> = {
  law_mandatory: 5,
  sbv_regulation: 3,
  internal: 1,
};

export const LAW_REQUEST_STATUSES = ["new", "in_progress", "completed"] as const;

export type LawRequestStatus = (typeof LAW_REQUEST_STATUSES)[number];

export const LAW_STATUS_LABELS: Record<LawRequestStatus, string> = {
  new: "New",
  in_progress: "In Progress",
  completed: "Completed",
};
