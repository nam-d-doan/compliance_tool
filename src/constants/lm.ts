/**
 * PSEUDO CODE — Hằng số nghiệp vụ module LM
 *
 * 1. CASE_STAGES là danh sách CÓ THỨ TỰ (mảng, không phải Set) vì tiến trình
 *    hồ sơ đi một chiều Khởi kiện→...→Thi hành án — thứ tự trong mảng chính
 *    là thứ tự hiển thị thanh tiến trình ở GĐ2, và dùng để tính "mốc đã qua"
 *    (so sánh index) cho KPI b.
 * 2. Không thêm 5 stage này vào STATUS_STYLES dùng chung trong
 *    constants/status.ts vì đó là hàm chung cho toàn app (Obligation/CAP/
 *    NCC...); màu/icon riêng cho stage nằm ở STAGE_STYLES ngay dưới, tránh
 *    đụng file status.ts theo tinh thần "ít đụng chạm nhất" đã ghi ở
 *    docs/lm/00-decisions.md.
 * 3. DEADLINE_TYPE_DEFAULTS là PLACEHOLDER cho số ngày báo trước — copy y
 *    nguyên từ docs/lm/00-decisions.md mục 3, CHƯA được pháp lý xác nhận.
 *    Sửa 1 chỗ này khi có số chính thức, mọi nơi dùng AlertRule sẽ tự cập
 *    nhật (không hardcode số ở handler).
 * 4. PRIORITY_WORKLOAD_WEIGHT dùng cho GĐ2 (phân công theo tải): tải(người)
 *    = tổng trọng số ưu tiên của các hồ sơ đang mở được giao. Định nghĩa ở
 *    đây thay vì trong logic handler để test unit riêng được.
 */

import type { ComponentType } from "react";
import {
  FileText,
  Gavel,
  Handshake,
  Scale,
  Landmark,
  type LucideIcon,
} from "lucide-react";
import type { PriorityLevel } from "./status";

export const CASE_STAGES = [
  "khoi_kien",
  "thu_ly",
  "hoa_giai",
  "xet_xu",
  "thi_hanh_an",
] as const;

export type CaseStage = (typeof CASE_STAGES)[number];

export interface StageStyle {
  label: string;
  icon: LucideIcon | ComponentType<{ className?: string }>;
}

export const STAGE_STYLES: Record<CaseStage, StageStyle> = {
  khoi_kien: { label: "Khởi kiện", icon: FileText },
  thu_ly: { label: "Thụ lý", icon: Scale },
  hoa_giai: { label: "Hòa giải", icon: Handshake },
  xet_xu: { label: "Xét xử", icon: Gavel },
  thi_hanh_an: { label: "Thi hành án", icon: Landmark },
};

/** So sánh thứ tự 2 giai đoạn. Dùng để tính "mốc đã qua" cho KPI b. */
export function stageIndex(stage: CaseStage): number {
  return CASE_STAGES.indexOf(stage);
}

export const CASE_CATEGORIES = [
  "no_xau_ca_nhan",
  "no_xau_doanh_nghiep",
  "tranh_chap_hop_dong",
  "xu_ly_tai_san_bao_dam",
  "thi_hanh_an_dan_su",
  "khac",
] as const;

export type CaseCategory = (typeof CASE_CATEGORIES)[number];

export const CASE_CATEGORY_LABELS: Record<CaseCategory, string> = {
  no_xau_ca_nhan: "Nợ xấu tín dụng cá nhân",
  no_xau_doanh_nghiep: "Nợ xấu tín dụng doanh nghiệp",
  tranh_chap_hop_dong: "Tranh chấp hợp đồng tín dụng",
  xu_ly_tai_san_bao_dam: "Xử lý tài sản bảo đảm",
  thi_hanh_an_dan_su: "Thi hành án dân sự",
  khac: "Khác",
};

export const DEADLINE_TYPES = [
  "khang_cao",
  "an_phi",
  "gia_han_thi_hanh_an",
  "khac",
] as const;

export type DeadlineType = (typeof DEADLINE_TYPES)[number];

export const DEADLINE_TYPE_LABELS: Record<DeadlineType, string> = {
  khang_cao: "Kháng cáo",
  an_phi: "Đóng án phí",
  gia_han_thi_hanh_an: "Gia hạn thi hành án",
  khac: "Khác",
};

/**
 * ⏳ CHỜ DÂN LUẬT XÁC NHẬN — placeholder, xem docs/lm/00-decisions.md mục 3.
 * KHÔNG dùng số này để khẳng định thời hạn pháp lý thật.
 */
export const DEADLINE_TYPE_DEFAULT_DAYS_BEFORE: Record<DeadlineType, number> =
  {
    khang_cao: 15,
    an_phi: 7,
    gia_han_thi_hanh_an: 30,
    khac: 7,
  };

/** Tài liệu bắt buộc theo từng giai đoạn — dùng cho KPI d (00-decisions.md mục 4). */
export const REQUIRED_DOCS_BY_STAGE: Record<CaseStage, string[]> = {
  khoi_kien: ["Đơn khởi kiện", "Hợp đồng tín dụng", "Chứng từ giải ngân"],
  thu_ly: ["Thông báo thụ lý của Tòa án"],
  hoa_giai: ["Biên bản hòa giải"],
  xet_xu: ["Bản án/Quyết định của Tòa án"],
  thi_hanh_an: ["Quyết định thi hành án", "Biên bản thi hành án"],
};

/** Trọng số tải công việc theo ưu tiên (00-decisions.md mục 5). */
export const PRIORITY_WORKLOAD_WEIGHT: Record<PriorityLevel, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 5,
};
