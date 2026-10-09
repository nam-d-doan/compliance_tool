/**
 * Chế độ tiếng Việt cho module LM (Nam yêu cầu — chỉ LM, LAW làm sau).
 * Dictionary phẳng, key tiếng Anh ngắn gọn, value là object {en, vi}. Dùng
 * qua hook `useLMT()` (xem cuối file) thay vì import thẳng — hook đã bind
 * sẵn theo `useLanguageStore().lang`, trang gọi `t("caseInformation")` là đủ.
 *
 * Không dịch toàn app — chỉ các trang LM (Dashboard, Detail, các component
 * con trong 2 file đó). Nhãn nghiệp vụ dùng CHUNG nhiều nơi (giai đoạn/nhóm
 * vụ việc/loại hạn) đặt riêng trong constants/lm.ts (STAGE_STYLES_I18N...)
 * vì đã có đúng cấu trúc Record<key,string> ở đó, không cần lặp lại đây.
 */
import { useLanguageStore, type Lang } from "@/stores";
import type { PriorityLevel } from "@/constants/status";

/** Nhãn ưu tiên tiếng Việt — CHỈ dùng trong form tạo Task của LM (select tự
 * viết). KHÔNG đụng `PriorityBadge` dùng chung toàn app (CAP/NCC/Obligation
 * đều dùng) — ngoài phạm vi "chỉ LM" Nam yêu cầu. */
const PRIORITY_LABELS_VI: Record<PriorityLevel, string> = {
  low: "Thấp",
  medium: "Trung bình",
  high: "Cao",
  critical: "Khẩn cấp",
};

export function getPriorityOptionLabel(priority: PriorityLevel, lang: Lang): string {
  if (lang === "vi") return PRIORITY_LABELS_VI[priority];
  return priority[0].toUpperCase() + priority.slice(1);
}

export const LM_I18N = {
  // Dashboard
  heroTitleManager: { en: "Litigation & Enforcement", vi: "Tố tụng & Thi hành án" },
  heroTitleSpecialist: { en: "My Cases", vi: "Hồ sơ của tôi" },
  heroSubtitleManager: { en: "Overview & KPIs.", vi: "Tổng quan & chỉ số KPI." },
  heroSubtitleSpecialist: {
    en: "Your assigned cases & KPIs.",
    vi: "Hồ sơ được giao & chỉ số KPI của bạn.",
  },
  viewList: { en: "View List", vi: "Xem danh sách" },
  newCase: { en: "New Case", vi: "Tạo hồ sơ mới" },
  needsAttention: { en: "Needs Attention", vi: "Cần xử lý" },
  noCasesFlagged: {
    en: "No cases currently flagged",
    vi: "Hiện không có hồ sơ nào bị gắn cờ",
  },
  kpiAlerts: { en: "Cases with Alerts", vi: "Hồ sơ có cảnh báo" },
  kpiOpen: { en: "Open Cases", vi: "Hồ sơ đang mở" },
  kpiOnTime: { en: "On-Time Completion", vi: "Hoàn thành đúng hạn" },
  kpiOnTimeSub: {
    en: "Milestones completed by their planned date",
    vi: "Mốc hoàn thành đúng ngày kế hoạch",
  },
  kpiAlertRes: { en: "Alert Resolution", vi: "Xử lý cảnh báo" },
  kpiAlertResSub: {
    en: "Flagged deadlines already resolved",
    vi: "Hạn đã gắn cờ được xử lý xong",
  },
  kpiProgress: { en: "Progress Updates", vi: "Cập nhật tiến độ" },
  kpiProgressSub: {
    en: "Completed milestones with a logged event",
    vi: "Mốc hoàn thành có ghi lịch sử",
  },
  kpiDocs: { en: "Document Completeness", vi: "Đầy đủ tài liệu" },
  kpiDocsSub: {
    en: "By required count per stage",
    vi: "Theo số lượng bắt buộc từng giai đoạn",
  },
  kpiClosed: { en: "Closed Cases", vi: "Hồ sơ đã đóng" },
  chartByStage: { en: "By Stage", vi: "Theo giai đoạn" },
  chartWorkload: { en: "Owner Workload", vi: "Tải công việc chuyên viên" },
  chartWorkloadSub: { en: "Number of open cases", vi: "Số hồ sơ đang mở" },
  chartOpenCasesSeries: { en: "Open cases", vi: "Hồ sơ đang mở" },
  chartByCategory: { en: "By Case Category", vi: "Theo nhóm vụ việc" },
  chartCasesSeries: { en: "Cases", vi: "Hồ sơ" },
  chartByUnit: { en: "By Business Unit", vi: "Theo đơn vị" },
  viewSpecialist: { en: "View: Case Specialist", vi: "Góc nhìn: Chuyên viên thụ lý" },
  viewSpecialistScope: {
    en: "only cases assigned to you",
    vi: "chỉ các hồ sơ bạn đang phụ trách",
  },
  viewManager: { en: "View: Manager", vi: "Góc nhìn: Quản lý" },
  viewManagerScope: {
    en: "all cases bank-wide, with workload and per-specialist KPIs",
    vi: "toàn bộ hồ sơ toàn ngân hàng, kèm tải công việc và KPI từng chuyên viên",
  },
  myTasksManager: { en: "Open Tasks", vi: "Việc đang mở" },
  myTasksSpecialist: { en: "My Tasks", vi: "Việc của tôi" },
  noOpenTasks: { en: "No open tasks", vi: "Không có việc nào đang mở" },
  alertOverdue: { en: "Overdue", vi: "Quá hạn" },
  alertDueSoon: { en: "Due soon", vi: "Sắp đến hạn" },
  alertUpcoming: { en: "Upcoming", vi: "Chưa tới hạn" },
  alertDone: { en: "Done", vi: "Đã xong" },
  showingTopTasks: { en: "Showing most urgent 10", vi: "Hiển thị 10 việc gấp nhất" },
  chartSlaTrend: { en: "Milestone SLA by Month", vi: "SLA mốc tiến trình theo tháng" },
  chartSlaTrendSub: {
    en: "Completed on time vs. late (vs. current planned date)",
    vi: "Hoàn thành đúng hạn so với trễ hạn (theo ngày kế hoạch hiện tại)",
  },
  seriesOnTime: { en: "On time", vi: "Đúng hạn" },
  seriesLate: { en: "Late", vi: "Trễ hạn" },
  chartDeadlineSla: { en: "Legal Deadline SLA", vi: "SLA hạn pháp lý" },
  slaResolved: { en: "Resolved", vi: "Đã xử lý" },
  slaWithin: { en: "Open — within SLA", vi: "Đang mở — trong hạn" },
  slaBreached: { en: "Open — SLA breached", vi: "Đang mở — vi phạm SLA" },
  chartKpiVsTarget: { en: "KPI vs. Target", vi: "KPI so với mục tiêu" },
  chartKpiVsTargetSub: {
    en: "Target is a demo placeholder (80%)",
    vi: "Mục tiêu là giá trị demo (80%)",
  },
  seriesActual: { en: "Actual %", vi: "Thực tế %" },
  seriesTarget: { en: "Target %", vi: "Mục tiêu %" },
  chartOwnerKpi: { en: "KPI by Specialist", vi: "KPI theo chuyên viên" },
  seriesAlertRes: { en: "Alert resolution %", vi: "Xử lý cảnh báo %" },
  seriesOnTimePct: { en: "On-time %", vi: "Đúng hạn %" },

  // Detail — 403 (chuyên viên mở hồ sơ người khác qua URL)
  forbiddenTitle: { en: "Not your case", vi: "Hồ sơ không thuộc quyền xem" },
  forbiddenMessage: {
    en: "Case specialists can only open cases assigned to them.",
    vi: "Chuyên viên thụ lý chỉ xem được hồ sơ mình phụ trách.",
  },
  backToMyCases: { en: "Back to my cases", vi: "Về hồ sơ của tôi" },

  // Detail — header actions
  remind: { en: "Remind", vi: "Đôn đốc" },
  assign: { en: "Assign", vi: "Phân công" },
  editCase: { en: "Edit Case", vi: "Sửa hồ sơ" },

  // Detail — tabs
  tabProfile: { en: "Case Profile", vi: "Hồ sơ sự vụ" },
  tabCalendar: { en: "Work Calendar", vi: "Lịch làm việc" },
  tabDocuments: { en: "Documents", vi: "Tài liệu" },
  tabHistory: { en: "History", vi: "Lịch sử" },

  // Detail — Case Profile
  caseInformation: { en: "Case Information", vi: "Thông tin hồ sơ" },
  fieldCategory: { en: "Case Category", vi: "Nhóm vụ việc" },
  fieldCustomer: { en: "Customer", vi: "Khách hàng" },
  fieldDebt: { en: "Outstanding Debt", vi: "Dư nợ" },
  fieldCollateral: { en: "Collateral", vi: "Tài sản bảo đảm" },
  fieldCourt: { en: "Court / Enforcement Agency", vi: "Tòa án / Cơ quan thi hành án" },
  fieldJudge: { en: "Judge", vi: "Thẩm phán" },
  fieldOwnerUnit: { en: "Owner Unit", vi: "Đơn vị phụ trách" },
  fieldCaseOwner: { en: "Case Owner", vi: "Chuyên viên thụ lý" },
  fieldManager: { en: "Manager", vi: "Quản lý" },
  fieldLastUpdated: { en: "Last Updated", vi: "Cập nhật lần cuối" },
  milestoneProgress: { en: "5-Milestone Progress", vi: "Tiến trình 5 mốc" },
  noMilestones: { en: "No milestones yet", vi: "Chưa có mốc nào" },
  originalPlan: { en: "Original plan:", vi: "Kế hoạch gốc:" },
  currentLabel: { en: "Current:", vi: "Hiện tại:" },
  daysLabel: { en: "days", vi: "ngày" },
  completedLabel: { en: "Completed:", vi: "Hoàn thành:" },
  notCompleted: { en: "Not completed", vi: "Chưa hoàn thành" },
  reschedule: { en: "Reschedule", vi: "Dời lịch" },
  markComplete: { en: "Mark Complete", vi: "Đánh dấu hoàn thành" },
  noLinkedDocs: { en: "No linked documents", vi: "Chưa có tài liệu liên kết" },
  linkAFile: { en: "+ Link a file...", vi: "+ Liên kết tài liệu..." },

  // Detail — Work Calendar
  newTask: { en: "New Task", vi: "Tạo việc mới" },
  nothingOnCalendar: { en: "Nothing on the calendar", vi: "Chưa có việc nào" },
  acknowledge: { en: "Acknowledge", vi: "Đã tiếp nhận" },
  resolve: { en: "Resolve", vi: "Đã xử lý" },
  markDone: { en: "Mark Done", vi: "Đánh dấu xong" },
  reopen: { en: "Reopen", vi: "Mở lại" },
  deadlineStatusPending: { en: "Not due yet", vi: "Chưa tới hạn" },
  deadlineStatusFlagged: { en: "Flagged", vi: "Đã gắn cờ" },
  deadlineStatusAcknowledged: { en: "Acknowledged", vi: "Đã tiếp nhận" },
  deadlineStatusResolved: { en: "Resolved", vi: "Đã xử lý" },
  viewTable: { en: "Table", vi: "Bảng" },
  viewCalendar: { en: "Calendar", vi: "Lịch" },
  editTask: { en: "Edit", vi: "Sửa" },
  deleteTask: { en: "Delete", vi: "Xoá" },
  confirmDelete: { en: "Confirm delete?", vi: "Xác nhận xoá?" },
  cancel: { en: "Cancel", vi: "Huỷ" },
  remindBefore: { en: "Remind", vi: "Nhắc trước" },
  legalDeadline: { en: "Legal deadline", vi: "Hạn pháp lý" },
  taskLabel: { en: "Task", vi: "Việc" },
  nothingThisDay: { en: "Nothing due this day", vi: "Không có việc trong ngày này" },
  colItem: { en: "Item", vi: "Nội dung" },
  colType: { en: "Type", vi: "Loại" },
  colDue: { en: "Due", vi: "Hạn" },
  colPriority: { en: "Priority", vi: "Ưu tiên" },
  colAlert: { en: "Alert", vi: "Cảnh báo" },
  colActions: { en: "Actions", vi: "Thao tác" },

  // Detail — Documents
  attachedDocuments: { en: "Attached Documents", vi: "Tài liệu đính kèm" },

  // Detail — History
  activityHistory: { en: "Activity History", vi: "Lịch sử thao tác" },
  noHistory: { en: "No history yet", vi: "Chưa có lịch sử" },

  // Detail — sheets
  saveChanges: { en: "Save Changes", vi: "Lưu thay đổi" },
  suggestedLowestLoad: { en: "Suggested — lowest load", vi: "Gợi ý — tải thấp nhất" },
  currentOwner: { en: "Current owner", vi: "Đang phụ trách" },
  taskTitleLabel: { en: "Title", vi: "Tiêu đề" },
  taskDescLabel: { en: "Description", vi: "Mô tả" },
  taskDueLabel: { en: "Due Date", vi: "Hạn xử lý" },
  taskPriorityLabel: { en: "Priority", vi: "Mức ưu tiên" },
  taskTitlePlaceholder: {
    en: "e.g. Follow up with court clerk",
    vi: "VD: Theo dõi biên lai nộp đơn tại tòa",
  },
  taskRemindLabel: { en: "Remind me (days before due)", vi: "Nhắc trước hạn (số ngày)" },
  taskRemindHint: {
    en: "0 = alert only once overdue",
    vi: "0 = chỉ cảnh báo khi đã quá hạn",
  },
  creating: { en: "Creating…", vi: "Đang tạo…" },
  createTask: { en: "Create Task", vi: "Tạo việc" },
  saving: { en: "Saving…", vi: "Đang lưu…" },

  // Toasts
  caseUpdated: { en: "Case updated", vi: "Đã cập nhật hồ sơ" },
  updateFailed: { en: "Update failed", vi: "Cập nhật thất bại" },
  reminderSent: { en: "Reminder sent", vi: "Đã gửi nhắc nhở" },
  reminderFailed: { en: "Failed to send reminder", vi: "Gửi nhắc nhở thất bại" },
  alertAcknowledged: { en: "Alert acknowledged", vi: "Đã tiếp nhận cảnh báo" },
  alertResolved: { en: "Alert resolved", vi: "Đã xử lý cảnh báo" },
  actionFailed: { en: "Action failed", vi: "Thao tác thất bại" },
  invalidDueDate: { en: "Invalid due date", vi: "Hạn xử lý không hợp lệ" },
  taskCreated: { en: "Task created", vi: "Đã tạo việc" },
  taskCreateFailed: { en: "Failed to create task", vi: "Tạo việc thất bại" },
  taskUpdateFailed: { en: "Failed to update task", vi: "Cập nhật việc thất bại" },
  taskUpdated: { en: "Task updated", vi: "Đã cập nhật việc" },
  taskDeleted: { en: "Task deleted", vi: "Đã xoá việc" },
  taskDeleteFailed: { en: "Failed to delete task", vi: "Xoá việc thất bại" },
  invalidRemindDays: {
    en: "Reminder must be 0–90 days",
    vi: "Số ngày nhắc phải từ 0 đến 90",
  },
  assignmentFailed: { en: "Assignment failed", vi: "Phân công thất bại" },
  plannedRescheduled: { en: "Planned date rescheduled", vi: "Đã dời ngày kế hoạch" },
  rescheduleFailed: { en: "Reschedule failed", vi: "Dời lịch thất bại" },
  linkFilesFailed: {
    en: "Failed to update linked files",
    vi: "Cập nhật liên kết tài liệu thất bại",
  },
  invalidPlannedDate: { en: "Invalid planned date", vi: "Ngày kế hoạch không hợp lệ" },
  invalidCompletionDate: {
    en: "Invalid completion date",
    vi: "Ngày hoàn thành không hợp lệ",
  },
  titleDueRequired: {
    en: "Title and due date are required",
    vi: "Cần nhập tiêu đề và hạn xử lý",
  },

} as const;

export type LMI18nKey = keyof typeof LM_I18N;

/**
 * Hook chính dùng trong trang: `const { t, lang, toggleLang } = useLMT();`
 * `t` chỉ nhận key tĩnh (literal union) — không phải hàm dịch chuỗi tự do,
 * nên không cần runtime fallback phức tạp như hệ i18n pattern-based.
 */
export function useLMT() {
  const lang = useLanguageStore((s) => s.lang);
  const toggleLang = useLanguageStore((s) => s.toggleLang);
  const t = (key: LMI18nKey): string => LM_I18N[key][lang];
  return { t, lang, toggleLang };
}
