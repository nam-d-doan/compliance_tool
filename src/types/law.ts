/**
 * PSEUDO CODE (ngắn gọn) — Kiểu dữ liệu module LAW (Legal Advisory Workflow,
 * Phụ lục 3)
 * 1. AdviceRequest là thực thể trung tâm — tương đương LitigationCase của
 *    LM, nhưng vòng đời đơn giản hơn (không có 5-mốc).
 * 2. AdvisoryOpinion tách riêng (không nhét field vào AdviceRequest) vì đó
 *    là "bằng chứng đã đưa ra ý kiến tư vấn" (Phụ lục 3 mục 2.b) — 1 yêu
 *    cầu có thể có nhiều lần ra ý kiến (sửa đi sửa lại).
 * 3. LawEvent bất biến, giống CaseEvent của LM — audit trail mục 2.b.
 * 4. GĐ2 thêm dueDate (tính 1 lần lúc tạo theo SlaRule, không đổi sau đó —
 *    giữ mốc cam kết gốc cho KPI a).
 * 5. GĐ3 — cảnh báo đỏ: AdviceRequest không có sub-entity "deadline" riêng
 *    như LM (1 yêu cầu chỉ có đúng 1 dueDate) nên field vòng đời cảnh báo
 *    (alertStatus/flaggedAt/...) nằm thẳng trên AdviceRequest thay vì tách
 *    bảng con. Logic tính dùng chung lib/deadline-alerts.ts với LM.
 */
import type { BaseEntity } from "./base";
import type { LawPriorityTier, LawRequestStatus } from "@/constants/law";
import type { AlertLifecycleStatus, DeadlineSeverity } from "@/lib/deadline-alerts";

export interface AdviceRequest extends BaseEntity {
  /** Mã yêu cầu hiển thị, dạng `LAW-2026-001`. */
  code: string;
  title: string;
  description?: string;
  priorityTier: LawPriorityTier;
  status: LawRequestStatus;

  /** Đơn vị gửi yêu cầu — tái dùng đúng pattern NCC/LM (org unit). */
  requestingUnitId: string;
  requestingUnitName: string;
  requestingUnitType: "ho_department" | "branch";
  requestingUnitRegion?: string;

  /** Chuyên viên phụ trách (role "owner" ở GĐ1, giống LM). */
  ownerId: string;
  ownerName: string;
  /** Cấp quản lý phê duyệt/điều phối (role "executive"). */
  managerId: string;
  managerName: string;

  submittedAt: string;
  /** Hạn SLA — tính 1 lần lúc tạo (submittedAt + SlaRule.slaDays), không
   * đổi lại kể cả khi đổi mức ưu tiên sau đó. */
  dueDate: string;
  completedAt?: string;
  /** Số lần bị trả lại yêu cầu sửa — proxy cho KPI b "chất lượng hồ sơ". */
  revisedCount: number;

  /** GĐ3 — vòng đời cảnh báo đỏ, tính tự động (xem lib/deadline-alerts.ts). */
  alertStatus: AlertLifecycleStatus;
  flaggedAt?: string;
  acknowledgedAt?: string;
  acknowledgedById?: string;
  resolvedAt?: string;
  resolvedById?: string;
  /** GĐ3 — server tự tính khi trả response (không lưu): đỏ/vàng/không màu. */
  severity?: DeadlineSeverity;

  fileIds: string[];
  tags: string[];
}

/** Ý kiến tư vấn — bằng chứng đã xử lý (Phụ lục 3 mục 2.b). Có thể nhiều
 * lần/1 yêu cầu nếu bị yêu cầu sửa lại. */
export interface AdvisoryOpinion extends BaseEntity {
  requestId: string;
  content: string;
  fileIds: string[];
  issuedById: string;
  issuedByName: string;
  issuedAt: string;
}

/** GĐ2 — cấu hình SLA theo mức ưu tiên (giống AlertRule của LM). */
export interface SlaRule {
  priorityTier: LawPriorityTier;
  slaDays: number;
  alertDaysBefore: number;
}

/** GĐ2 — tải công việc 1 chuyên viên, cho hộp thoại phân công. */
export interface LawWorkloadEntry {
  userId: string;
  userName: string;
  openRequestCount: number;
  weightedLoad: number;
}

/** Lịch sử thao tác — audit trail bất biến (Phụ lục 3 mục 2.b). */
export interface LawEvent extends BaseEntity {
  requestId: string;
  type:
    | "created"
    | "updated"
    | "status_changed"
    | "opinion_issued"
    | "revision_requested"
    | "reassigned"
    | "reminded"
    | "alert_flagged"
    | "alert_acknowledged"
    | "alert_resolved";
  userId: string;
  userName: string;
  description: string;
  fromValue?: string;
  toValue?: string;
}

/** GĐ3 — tiếp nhận hoặc xử lý xong cảnh báo đỏ của 1 yêu cầu. */
export interface UpdateLawAlertInput {
  action: "acknowledge" | "resolve";
  actorId?: string;
  actorName?: string;
}

export interface LawRequestFilter {
  status?: LawRequestStatus | LawRequestStatus[];
  priorityTier?: LawPriorityTier | LawPriorityTier[];
  ownerId?: string;
  requestingUnitId?: string;
  managerId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
  sortField?: string;
  sortDirection?: "asc" | "desc";
}

export interface CreateAdviceRequestInput {
  title: string;
  description?: string;
  priorityTier: LawPriorityTier;
  requestingUnitId: string;
  ownerId: string;
  managerId: string;
  tags?: string[];
}

/**
 * GĐ3 — Khai thác Tri thức (Phụ lục 3 mục 1.c): kho ý kiến tư vấn mẫu/án
 * lệ nội bộ, tra cứu theo từ khóa/tag. Không gắn với 1 AdviceRequest cụ
 * thể — kho dùng chung, tránh tư vấn trùng lặp.
 */
export interface KnowledgeBaseEntry extends BaseEntity {
  title: string;
  category: string;
  tags: string[];
  summary: string;
  content: string;
  authorId: string;
  authorName: string;
}

export interface CreateKnowledgeBaseEntryInput {
  title: string;
  category: string;
  tags?: string[];
  summary: string;
  content: string;
  authorId?: string;
  authorName?: string;
}

export type UpdateAdviceRequestInput = Partial<
  Omit<
    AdviceRequest,
    | "id"
    | "code"
    | "createdAt"
    | "updatedAt"
    | "fileIds"
    | "submittedAt"
    | "dueDate"
    | "alertStatus"
    | "flaggedAt"
    | "acknowledgedAt"
    | "acknowledgedById"
    | "resolvedAt"
    | "resolvedById"
    | "severity"
  >
>;
