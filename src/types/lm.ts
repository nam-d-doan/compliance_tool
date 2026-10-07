/**
 * PSEUDO CODE — Kiểu dữ liệu module LM (Litigation Management, Phụ lục 2)
 *
 * 1. LitigationCase là thực thể trung tâm: 1 hồ sơ tố tụng/thi hành án của
 *    ngân hàng đối với 1 khách hàng. Nó không tự chứa mốc tiến trình hay hạn
 *    pháp lý — 3 thực thể đó (CaseMilestone, LegalDeadline, CaseEvent) là
 *    bảng con, tra theo `caseId`, giống cách Obligation/CAP tách timeline
 *    riêng thay vì nhét mảng lồng nhau. Lý do: mock handler cần thao tác độc
 *    lập trên từng mốc/hạn (cập nhật 1 mốc không phải rewrite cả hồ sơ), và
 *    KPI b/c ở GĐ4 cần query thẳng trên các bảng con này.
 * 2. `stage` (giai đoạn hiện tại) và `status` (trạng thái tổng thể) TÁCH
 *    NHAU: `stage` đi theo 5 mốc Khởi kiện→Thụ lý→Hòa giải→Xét xử→Thi hành
 *    án (one-way, không nhảy lùi trong demo); `status` chỉ có Open/Closed,
 *    giống NCCStatus — Closed khi mốc "thi_hanh_an" xong. Không dùng chung
 *    OBLIGATION_STATUSES vì workflow duyệt của Obligation (draft/submitted/
 *    approved/rejected) không khớp nghiệp vụ tố tụng.
 * 3. Ownership dùng lại đúng pattern NCC (ownerUnitId/ownerUnitName/
 *    ownerUnitType/ownerUnitRegion trỏ vào OrganizationSettings.hoDepartments
 *    hoặc .branches) — KHÔNG tự bịa cấu trúc phòng ban mới, để form/handler
 *    tái dùng useOrgUnits() có sẵn.
 * 4. LegalDeadline.status theo đúng vòng đời cờ đỏ ở Phụ lục 2 mục b/c:
 *    pending (chưa tới ngưỡng cảnh báo) → flagged (đã bật cờ đỏ) →
 *    acknowledged (đã tiếp nhận) → resolved (đã xử lý xong). Logic TÍNH ra
 *    flagged (so hạn với AlertRule) làm ở GĐ3; GĐ1 chỉ định nghĩa field.
 * 5. Số ngày báo trước trong AlertRule là PLACEHOLDER (xem
 *    docs/lm/00-decisions.md mục 3) — chưa được bộ phận pháp lý xác nhận,
 *    không được coi là đúng luật.
 * 6. CaseEvent bất biến (không có UpdateCaseEventInput) — đây là audit
 *    trail, sửa/xóa phá vỡ mục đích ghi vết của Phụ lục 2 mục b (Audit
 *    Trail). Handler chỉ có create, không có update/delete.
 */

import type { BaseEntity } from "./base";
import type { PriorityLevel } from "@/constants/status";
import type { CaseCategory, CaseStage, DeadlineType } from "@/constants/lm";

/** Trạng thái tổng thể của hồ sơ. Chỉ 2 giá trị, giống NCCStatus — "Overdue"
 * không phải status, nó được tính ra từ hạn pháp lý còn mở. */
export type LMCaseStatus = "Open" | "Closed";

/** Vòng đời xử lý 1 hạn pháp lý (cảnh báo đỏ). Tính tự động ở GĐ3. */
export type LegalDeadlineStatus =
  | "pending"
  | "flagged"
  | "acknowledged"
  | "resolved";

/** Kênh gửi thông báo — giả lập ở GĐ3, chưa gửi thật (xem GĐ5). */
export type NotificationChannel = "app" | "email" | "sms" | "teams";

export interface LitigationCase extends BaseEntity {
  /** Mã hồ sơ hiển thị, dạng `LM-2026-001` (00-decisions.md mục 6). */
  code: string;
  title: string;
  /** Nhóm vụ việc — dùng cho KPI e (00-decisions.md mục 2). */
  category: CaseCategory;

  /** Thông tin khách hàng bị kiện/cưỡng chế thi hành án. */
  customerCif: string;
  customerName: string;
  /** Dư nợ tại thời điểm khởi kiện, đơn vị VND. */
  outstandingDebt: number;
  /** Mô tả tài sản bảo đảm liên quan (tự do, không chuẩn hoá ở GĐ1). */
  collateralDescription?: string;

  /** Tòa án hoặc cơ quan thi hành án đang thụ lý. */
  courtOrEnforcementAgency: string;
  /** Thẩm phán phụ trách (có thể trống ở giai đoạn Khởi kiện). */
  judgeName?: string;

  /** Giai đoạn hiện tại — luôn khớp với mốc CaseMilestone mới nhất đã hoàn thành + 1. */
  stage: CaseStage;
  status: LMCaseStatus;
  priority: PriorityLevel;

  /** Đơn vị sở hữu hồ sơ — tái dùng đúng pattern NCC (org unit). */
  ownerUnitId: string;
  ownerUnitName: string;
  ownerUnitType: "ho_department" | "branch";
  ownerUnitRegion?: string;

  /** Chuyên viên thụ lý chính (role "owner" ở GĐ1, chờ Nam duyệt role business_unit riêng). */
  ownerId: string;
  ownerName: string;
  /** Cấp Quản lý phê duyệt/điều phối hồ sơ. */
  managerId: string;
  managerName: string;

  /** IDs của FileAttachment gắn với hồ sơ (dùng chung hệ thống file của CAP/NCC). */
  fileIds: string[];
  tags: string[];

  /** GĐ3 — server tự tính khi trả response (list/detail), KHÔNG lưu trong
   * entity thật và client KHÔNG được gửi field này qua PUT. Số hạn pháp lý
   * đang ở trạng thái "flagged" (đỏ hoặc vàng) của hồ sơ. */
  redFlagCount?: number;
}

/** Một mốc trong 5 mốc tiến trình của hồ sơ (Phụ lục 2 mục 1, hàng "Theo dõi Tiến trình"). */
export interface CaseMilestone extends BaseEntity {
  caseId: string;
  stage: CaseStage;
  /** Ngày kế hoạch GỐC — không đổi sau khi tạo, dùng để đo độ lệch (KPI liên quan lộ trình). */
  originalPlannedDate: string;
  /** Ngày kế hoạch HIỆN TẠI — đổi mỗi lần dời lịch; mỗi lần đổi phải kèm 1 CaseEvent. */
  currentPlannedDate: string;
  /** Ngày hoàn thành thực tế; undefined nghĩa là mốc chưa xong. */
  actualDate?: string;
  notes?: string;
}

/** Một hạn pháp lý cần theo dõi cảnh báo đỏ (Phụ lục 2 mục 1 hàng "Cảnh báo & Nhắc lịch"). */
export interface LegalDeadline extends BaseEntity {
  caseId: string;
  type: DeadlineType;
  /** Hạn chót xử lý. */
  dueDate: string;
  status: LegalDeadlineStatus;
  /** Thời điểm hệ thống bật cờ đỏ (tính từ dueDate trừ số ngày báo trước trong AlertRule). */
  flaggedAt?: string;
  /** Thời điểm chuyên viên bấm "Đã tiếp nhận". */
  acknowledgedAt?: string;
  acknowledgedById?: string;
  /** Thời điểm bấm "Đã xử lý". */
  resolvedAt?: string;
  resolvedById?: string;
  notes?: string;

  /** GĐ3 — server tự tính khi trả response (không lưu): "red" đã quá
   * dueDate, "amber" đã flagged nhưng chưa tới dueDate, "none" còn lại.
   * Tính theo "hôm nay" của hệ thống (DEMO_TODAY) để nhất quán với dữ liệu
   * mẫu — client không tự tính lại bằng ngày thực của máy. */
  severity?: "red" | "amber" | "none";
}

/** Cấu hình số ngày báo trước theo từng loại hạn (Admin chỉnh ở GĐ3). */
export interface AlertRule {
  type: DeadlineType;
  /** Số ngày báo trước khi tới hạn — PLACEHOLDER, xem docs/lm/00-decisions.md mục 3. */
  daysBefore: number;
  channels: NotificationChannel[];
}

/** Lịch sử thao tác trên hồ sơ — audit trail bất biến (Phụ lục 2 mục 2.b). */
export interface CaseEvent extends BaseEntity {
  caseId: string;
  type:
    | "created"
    | "updated"
    | "stage_changed"
    | "milestone_date_changed"
    | "milestone_completed"
    | "deadline_flagged"
    | "deadline_acknowledged"
    | "deadline_resolved"
    | "file_attached"
    | "reassigned"
    | "reminded";
  userId: string;
  userName: string;
  /** Mô tả ngắn, hiển thị trực tiếp trong ActivityFeed. */
  description: string;
  /** Giá trị trước/sau khi đổi — chỉ điền khi có ý nghĩa (vd đổi ngày, đổi người). */
  fromValue?: string;
  toValue?: string;
}

/** GĐ2 — tải công việc 1 chuyên viên, dùng cho hộp thoại phân công. */
export interface LMWorkloadEntry {
  userId: string;
  userName: string;
  /** Số hồ sơ đang mở (status Open) được giao cho người này. */
  openCaseCount: number;
  /** Tổng trọng số ưu tiên (PRIORITY_WORKLOAD_WEIGHT) của các hồ sơ đó. */
  weightedLoad: number;
}

/** Payload cập nhật 1 mốc — GĐ2 (đổi ngày kế hoạch hoặc đánh dấu hoàn thành). */
export interface UpdateLMMilestoneInput {
  /** Dời ngày kế hoạch hiện tại (không đổi ngày gốc). */
  currentPlannedDate?: string;
  /** Đánh dấu mốc hoàn thành vào ngày này. */
  actualDate?: string;
}

/**
 * GĐ4 — tổng hợp cho trang Dashboard & KPI. Tất cả rate tính sẵn 0-100.
 * documentCompletionRate là PROXY theo SỐ LƯỢNG file >= số tài liệu bắt
 * buộc của giai đoạn (REQUIRED_DOCS_BY_STAGE) — dữ liệu mẫu chưa gắn loại
 * tài liệu cụ thể vào từng file nên không check được đúng LOẠI, chỉ đếm đủ
 * số lượng. Ghi rõ ở đây để không ai hiểu nhầm đây là số liệu pháp lý thật.
 */
export interface LMDashboardSummary {
  totalOpen: number;
  totalClosed: number;
  /** Số hồ sơ đang có ít nhất 1 hạn ở trạng thái "flagged". */
  totalRedFlagCases: number;
  /** % mốc đã hoàn thành có ghi CaseEvent "milestone_completed" tương ứng. */
  milestoneUpdateRate: number;
  /** KPI a (Phụ lục 2 mục 3.2.a) — % mốc đã hoàn thành có actualDate <=
   * currentPlannedDate. Bổ sung theo feedback review của Nam (thiếu hẳn
   * trước đây) — xem docs/lm/02-review-changes.md mục 0. */
  onTimeCompletionRate: number;
  /** % hạn đã từng bật cờ (flagged/acknowledged/resolved) mà đã xử lý xong. */
  alertResolutionRate: number;
  /** % hồ sơ có đủ SỐ LƯỢNG tài liệu theo yêu cầu giai đoạn hiện tại. */
  documentCompletionRate: number;
  stageDistribution: { stage: CaseStage; count: number }[];
  categoryDistribution: { category: CaseCategory; count: number }[];
  unitDistribution: { unitName: string; count: number }[];
  ownerWorkload: LMWorkloadEntry[];
  topRedFlagCases: {
    id: string;
    code: string;
    title: string;
    ownerName: string;
    redFlagCount: number;
  }[];
}

export interface LMCaseFilter {
  stage?: CaseStage | CaseStage[];
  status?: LMCaseStatus | LMCaseStatus[];
  priority?: PriorityLevel | PriorityLevel[];
  category?: CaseCategory | CaseCategory[];
  ownerId?: string;
  ownerUnitId?: string;
  managerId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
  sortField?: string;
  sortDirection?: "asc" | "desc";
}

/** Payload tạo hồ sơ mới. `code` do handler tự sinh, không nhận từ client. */
export interface CreateLMCaseInput {
  title: string;
  category: CaseCategory;
  customerCif: string;
  customerName: string;
  outstandingDebt: number;
  collateralDescription?: string;
  courtOrEnforcementAgency: string;
  judgeName?: string;
  priority: PriorityLevel;
  ownerUnitId: string;
  ownerId: string;
  managerId: string;
  tags?: string[];
}

export type UpdateLMCaseInput = Partial<
  Omit<
    LitigationCase,
    "id" | "code" | "createdAt" | "updatedAt" | "fileIds" | "redFlagCount"
  >
>;

/** GĐ3 — tiếp nhận hoặc xử lý xong 1 hạn pháp lý đang cảnh báo. */
export interface UpdateLMDeadlineInput {
  action: "acknowledge" | "resolve";
  actorId?: string;
  actorName?: string;
}
