/**
 * PSEUDO CODE (ngắn gọn) — Kiểu dữ liệu module LAW (Legal Advisory Workflow,
 * Phụ lục 3)
 * 1. AdviceRequest là thực thể trung tâm — tương đương LitigationCase của
 *    LM, nhưng vòng đời đơn giản hơn (không có 5-mốc).
 * 2. AdvisoryOpinion tách riêng (không nhét field vào AdviceRequest) vì đó
 *    là "bằng chứng đã đưa ra ý kiến tư vấn" (Phụ lục 3 mục 2.b) — 1 yêu
 *    cầu có thể có nhiều lần ra ý kiến (sửa đi sửa lại).
 * 3. LawEvent bất biến, giống CaseEvent của LM — audit trail mục 2.b.
 * 4. GĐ2 thêm dueDate theo SlaRule. Review GĐ1 (flow 4 bước): lúc tạo là
 *    hạn TẠM theo mức ưu tiên đơn vị đề xuất; bước "Đánh giá ưu tiên"
 *    Manager chốt mức ưu tiên → hạn tính lại 1 lần (submittedAt + slaDays
 *    của mức đã chốt), sau đó không đổi nữa — mốc cam kết cho KPI a.
 * 6. Review GĐ1 — flow tư vấn: Tiếp nhận → Đánh giá ưu tiên (status new →
 *    in_progress) → Trao đổi (LawMessage 2 chiều) → Đóng (AdvisoryOpinion
 *    nộp → pending_approval → Manager duyệt = completed / trả lại =
 *    in_progress + revisedCount++).
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

  /** Chuyên viên phụ trách (role "owner"). Review B: rỗng ("") khi chưa
   * phân công — đơn vị gửi yêu cầu không tự chọn, Manager phân công ở bước 2. */
  ownerId: string;
  ownerName: string;
  /** Manager phụ trách — gán = người đánh giá ở bước 2; rỗng trước đó. */
  managerId: string;
  managerName: string;

  submittedAt: string;
  /** Hạn SLA — tính 1 lần lúc tạo (submittedAt + SlaRule.slaDays), không
   * đổi lại kể cả khi đổi mức ưu tiên sau đó. */
  dueDate: string;
  completedAt?: string;
  /** Số lần bị trả lại yêu cầu sửa — proxy cho KPI b "chất lượng hồ sơ". */
  revisedCount: number;

  /** Mức ưu tiên đơn vị đề xuất lúc gửi — giữ lại để thấy Manager có đổi không. */
  initialPriorityTier: LawPriorityTier;
  /** Review A1 — yêu cầu bổ sung hồ sơ đang mở (status "awaiting_info"). */
  infoRequest?: LawInfoRequest;
  /** Tổng số ngày SLA đã dừng vì chờ bổ sung — đã cộng vào dueDate. */
  slaPausedDays: number;
  /** Review A2 — có khi status "declined" (đóng ở bước phân loại). */
  declineInfo?: LawDeclineInfo;

  /** Bước 2 "Đánh giá ưu tiên" — có khi Manager đã chốt mức ưu tiên. */
  assessedAt?: string;
  assessedById?: string;
  assessedByName?: string;
  assessmentNote?: string;

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
  /** Folder trên File Sharing Storage của yêu cầu — có cả folder rỗng. */
  folders: string[];

  /** Review GĐ5 — yêu cầu Mật: chỉ chuyên viên phụ trách + Manager/Admin
   * xem được (kể cả sau khi đóng), không lưu được thành mẫu. */
  confidential: boolean;
  confidentialReason?: string;
  confidentialSetById?: string;
  confidentialSetByName?: string;
  confidentialSetAt?: string;
  tags: string[];
}

/** Ý kiến tư vấn — bằng chứng đã xử lý (Phụ lục 3 mục 2.b). Mỗi lần nộp là
 * 1 bản (version tăng dần); bị trả lại thì nộp bản mới, không sửa bản cũ. */
export interface AdvisoryOpinion extends BaseEntity {
  requestId: string;
  version: number;
  content: string;
  fileIds: string[];
  issuedById: string;
  issuedByName: string;
  issuedAt: string;
  status: AdvisoryOpinionStatus;
  reviewNote?: string;
  reviewedById?: string;
  reviewedByName?: string;
  reviewedAt?: string;
}

export type AdvisoryOpinionStatus = "submitted" | "approved" | "returned";

/** Bước 3 "Trao đổi hai chiều": tin nhắn giữa đơn vị yêu cầu và pháp chế. */
export interface LawMessage extends BaseEntity {
  requestId: string;
  /** "requester" = đơn vị yêu cầu; "legal" = chuyên viên/quản lý pháp chế. */
  side: "requester" | "legal";
  authorId: string;
  authorName: string;
  content: string;
  fileIds: string[];
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
    | "alert_resolved"
    | "priority_assessed"
    | "assigned"
    | "message_posted"
    | "opinion_approved"
    | "file_attached"
    | "file_moved"
    | "file_deleted"
    | "folder_created"
    | "saved_to_knowledge_base"
    | "confidentiality_changed"
    | "info_requested"
    | "info_received"
    | "declined";
  userId: string;
  userName: string;
  description: string;
  fromValue?: string;
  toValue?: string;
  /** Đối tượng của thao tác (mức ưu tiên, phiên bản ý kiến...) — để UI dựng
   * câu song ngữ, giống CaseEvent.subject của LM. */
  subject?: string;
}

/** Review A1 — 1 lần yêu cầu đơn vị bổ sung hồ sơ. */
export interface LawInfoRequest {
  note: string;
  requestedById: string;
  requestedByName: string;
  requestedAt: string;
  /** Bước để quay về khi đã nhận đủ: chờ đánh giá hoặc đang trao đổi. */
  resumeStatus: "new" | "in_progress";
}

export interface RequestLawInfoInput {
  note: string;
}

/** Review A2 — 3 kiểu đóng không tư vấn ở bước phân loại. */
export type LawDeclineType = "rejected" | "transferred" | "duplicate";
export type LawRejectReason = "not_legal" | "out_of_scope" | "other";

export interface LawDeclineInfo {
  type: LawDeclineType;
  note: string;
  rejectReason?: LawRejectReason;
  transferredToUnitId?: string;
  transferredToUnitName?: string;
  /** Trùng: trỏ tới 1 mục kho tri thức hoặc 1 yêu cầu đã đóng. */
  duplicateOf?: { kind: "kb" | "request"; id: string; title: string; code?: string };
  declinedById: string;
  declinedByName: string;
  declinedAt: string;
}

export interface DeclineLawRequestInput {
  type: LawDeclineType;
  note: string;
  rejectReason?: LawRejectReason;
  transferredToUnitId?: string;
  duplicateOf?: { kind: "kb" | "request"; id: string };
}

/** Review GĐ5 — gắn / gỡ cờ Mật. Gắn bắt buộc lý do. */
export interface SetLawConfidentialityInput {
  confidential: boolean;
  reason?: string;
}

/** Bước 2 — Manager chốt mức ưu tiên. */
export interface AssessLawRequestInput {
  priorityTier: LawPriorityTier;
  /** Review B — chuyên viên được phân công (role owner). */
  ownerId: string;
  note?: string;
}

export interface CreateLawMessageInput {
  side: LawMessage["side"];
  content: string;
  fileIds?: string[];
}

export interface SubmitAdvisoryOpinionInput {
  content: string;
  fileIds?: string[];
}

export interface ReviewAdvisoryOpinionInput {
  action: "approve" | "return";
  note?: string;
}

/** GĐ3 — tiếp nhận hoặc xử lý xong cảnh báo đỏ của 1 yêu cầu. */
export interface UpdateLawAlertInput {
  action: "acknowledge" | "resolve";
  actorId?: string;
  actorName?: string;
}

export interface LawRequestFilter {
  /** Chuyên viên: "mine" (mặc định) = yêu cầu mình phụ trách; "reference" =
   * yêu cầu đã đóng, không Mật của người khác — đọc để tham khảo. */
  scope?: "mine" | "reference";
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
  /** Mức ưu tiên ĐỀ XUẤT của đơn vị — Manager chốt ở bước 2. */
  priorityTier: LawPriorityTier;
  requestingUnitId: string;
  tags?: string[];
}

/**
 * GĐ3 — Khai thác Tri thức (Phụ lục 3 mục 1.c): kho ý kiến tư vấn mẫu/án
 * lệ nội bộ, tra cứu theo từ khóa/tag. Không gắn với 1 AdviceRequest cụ
 * thể — kho dùng chung, tránh tư vấn trùng lặp.
 */
export interface KnowledgeBaseEntry extends BaseEntity {
  /** Review GĐ4 — "template" = mẫu ý kiến tư vấn (dùng để soạn nhanh),
   * "precedent" = án lệ / tiền lệ nội bộ (tham khảo). */
  kind: KnowledgeBaseKind;
  title: string;
  category: string;
  tags: string[];
  summary: string;
  content: string;
  authorId: string;
  authorName: string;
  /** Có khi mục được lưu từ 1 yêu cầu đã đóng ("Lưu thành mẫu"). */
  sourceRequestId?: string;
  sourceRequestCode?: string;
}

export type KnowledgeBaseKind = "template" | "precedent";

export interface CreateKnowledgeBaseEntryInput {
  kind?: KnowledgeBaseKind;
  title: string;
  category: string;
  tags?: string[];
  summary: string;
  content: string;
  authorId?: string;
  authorName?: string;
}

/** Review GĐ4 — lưu ý kiến đã duyệt của 1 yêu cầu đã đóng vào kho tri thức. */
export interface SaveOpinionToKnowledgeBaseInput {
  kind: KnowledgeBaseKind;
  title: string;
  category?: string;
  tags?: string[];
}

/**
 * GĐ4 — tổng hợp cho trang Dashboard & KPI. Công thức theo Phụ lục 3 mục
 * 3.2 (xem docs/law/00-decisions.md mục 4):
 * a. onTimeCompletionRate: hoàn thành trong SLA ÷ tổng hoàn thành.
 * b. qualityRate: hoàn thành không bị trả lại sửa (revisedCount=0) ÷ tổng
 *    hoàn thành — proxy demo, không có nghiệp vụ "review" thật.
 * c. alertResolutionRate: cảnh báo đã xử lý xong ÷ tổng cảnh báo từng bật
 *    cờ — y hệt KPI c của LM.
 */
/**
 * Review GĐ3 — dashboard theo góc nhìn. `scope` do server quyết từ token:
 * "specialist" = chỉ yêu cầu chuyên viên phụ trách (hàng đợi chỉ yêu cầu đang
 * mở), "manager" = toàn bộ. KPI a/b/c tính trên yêu cầu đã đóng trong phạm vi.
 */
export interface LawDashboardSummary {
  scope: "specialist" | "manager";
  totalOpen: number;
  totalCompleted: number;
  totalRedFlagRequests: number;
  /** Bước 2 đang chờ Manager chốt ưu tiên. */
  awaitingAssessment: number;
  /** Bước 4 đang chờ Manager duyệt ý kiến. */
  awaitingApproval: number;
  /** Đang trao đổi và ý kiến gần nhất bị trả lại — chuyên viên cần sửa. */
  returnedForRevision: number;
  /** Đang chờ đơn vị bổ sung hồ sơ (SLA dừng). */
  awaitingInfo: number;
  /** Đóng không tư vấn (từ chối / chuyển / trùng) — không tính KPI a/b. */
  totalDeclined: number;
  onTimeCompletionRate: number;
  qualityRate: number;
  alertResolutionRate: number;
  statusDistribution: { status: LawRequestStatus; count: number }[];
  priorityDistribution: { priorityTier: LawPriorityTier; count: number }[];
  unitDistribution: { unitName: string; count: number }[];
  ownerWorkload: LawWorkloadEntry[];
  /** Yêu cầu đang mở, đã sort: quá hạn → sắp hạn → còn hạn, rồi ưu tiên, rồi hạn gần. */
  queue: LawQueueItem[];
  queueCounts: { overdue: number; dueSoon: number; upcoming: number; paused: number };
  /** SLA theo tháng đóng yêu cầu (6 tháng gần nhất): đóng đúng hạn / trễ. */
  slaTrend: { month: string; onTime: number; late: number }[];
  slaStatus: { closedOnTime: number; closedLate: number; openWithinSla: number; openBreached: number };
  /** KPI từng chuyên viên — rỗng ở góc nhìn chuyên viên. */
  ownerKpi: { userName: string; onTimeRate: number; qualityRate: number; openCount: number }[];
}

export interface LawQueueItem {
  id: string;
  code: string;
  title: string;
  ownerName: string;
  status: LawRequestStatus;
  priorityTier: LawPriorityTier;
  dueDate: string;
  /** "paused" = đang chờ đơn vị bổ sung hồ sơ, SLA dừng. */
  slaState: "overdue" | "due_soon" | "upcoming" | "paused";
  /** Bước tiếp theo do ai làm: Manager (đánh giá / duyệt) hay chuyên viên (trao đổi, soạn ý kiến). */
  nextActor: "manager" | "specialist" | "requester";
  /** Ý kiến gần nhất bị trả lại — chuyên viên cần sửa. */
  returned: boolean;
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
