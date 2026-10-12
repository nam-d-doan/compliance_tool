/**
 * PSEUDO CODE — tab "Lịch sử" của yêu cầu tư vấn (Nam review LAW: History)
 * 1. Dựng câu song ngữ từ `type` + `subject`/`fromValue`/`toValue` của
 *    LawEvent; event cũ thiếu dữ liệu → dùng `description` tiếng Anh gốc.
 * 2. Hiển thị + lọc theo nhóm/người dùng chung với LM
 *    (components/common/AuditTimeline.tsx).
 */
import { AlertTriangle, Briefcase, FileText, MessageSquare, Route } from "lucide-react";
import { AuditTimeline, type TimelineGroup } from "@/components/common/AuditTimeline";
import { LAW_PRIORITY_STYLES, LAW_STATUS_LABELS, type LawPriorityTier, type LawRequestStatus } from "@/constants/law";
import { useL, useTerm, useDateLocale } from "@/lib/i18n";
import { format, parseISO } from "date-fns";
import type { LawEvent } from "@/types";

type Group = "request" | "flow" | "discussion" | "alert" | "docs";

const GROUP_OF: Record<LawEvent["type"], Group> = {
  created: "request",
  updated: "request",
  reassigned: "request",
  reminded: "request",
  priority_assessed: "flow",
  assigned: "flow",
  info_requested: "discussion",
  info_received: "discussion",
  declined: "flow",
  status_changed: "flow",
  opinion_issued: "flow",
  revision_requested: "flow",
  opinion_approved: "flow",
  saved_to_knowledge_base: "flow",
  confidentiality_changed: "request",
  message_posted: "discussion",
  alert_flagged: "alert",
  alert_acknowledged: "alert",
  alert_resolved: "alert",
  file_attached: "docs",
  file_moved: "docs",
  file_deleted: "docs",
  folder_created: "docs",
};

const GROUPS: Record<Group, TimelineGroup> = {
  request: { icon: Briefcase, className: "bg-info-bg text-info", label: ["Request", "Yêu cầu"] },
  flow: { icon: Route, className: "bg-success-bg text-success", label: ["Advisory flow", "Flow tư vấn"] },
  discussion: { icon: MessageSquare, className: "bg-warning-bg text-warning", label: ["Discussion", "Trao đổi"] },
  alert: { icon: AlertTriangle, className: "bg-danger-bg text-danger", label: ["SLA alerts", "Cảnh báo SLA"] },
  docs: { icon: FileText, className: "bg-muted text-foreground", label: ["Documents", "Tài liệu"] },
};

const FIELD_LABEL: Record<string, [string, string]> = {
  title: ["title", "tiêu đề"],
  description: ["description", "mô tả"],
  priorityTier: ["priority", "mức ưu tiên"],
  requestingUnitId: ["requesting unit", "đơn vị yêu cầu"],
  managerId: ["manager", "quản lý"],
  tags: ["tags", "thẻ"],
};

const isTier = (v?: string): v is LawPriorityTier => !!v && v in LAW_PRIORITY_STYLES;
const isStatus = (v?: string): v is LawRequestStatus => !!v && v in LAW_STATUS_LABELS;

export function LawHistory({ events }: { events: LawEvent[] }) {
  const L = useL();
  const term = useTerm();
  const dateLocale = useDateLocale();
  const tier = (v?: string) => (isTier(v) ? term(LAW_PRIORITY_STYLES[v].label) : v);
  const status = (v?: string) => (isStatus(v) ? term(LAW_STATUS_LABELS[v]) : v);
  const folder = (v?: string) => v || L("Unfiled", "Chưa phân loại");
  const dateOf = (v?: string) => (v ? format(parseISO(v), "dd/MM/yyyy", { locale: dateLocale }) : undefined);

  const describe = (e: LawEvent): { text: string; from?: string; to?: string } => {
    const s = e.subject ?? "";
    const q = `"${s}"`;
    switch (e.type) {
      case "created":
        return { text: s ? L(`Submitted request ${s}`, `Gửi yêu cầu ${s}`) : L("Submitted request", "Gửi yêu cầu") };
      case "updated": {
        if (!s) break;
        const fields = s.split(", ").map((k) => (FIELD_LABEL[k] ? L(...FIELD_LABEL[k]) : k)).join(", ");
        return { text: L(`Updated request details: ${fields}`, `Cập nhật thông tin yêu cầu: ${fields}`) };
      }
      case "reassigned":
        return { text: L("Reassigned specialist", "Phân công lại chuyên viên"), from: e.fromValue, to: e.toValue };
      case "reminded":
        if (!s) break;
        return { text: L(`Sent a progress reminder to ${s}`, `Đôn đốc tiến độ tới ${s}`) };
      case "priority_assessed":
        return { text: L("Assessed priority", "Đánh giá mức ưu tiên"), from: tier(e.fromValue), to: tier(e.toValue) };
      case "info_requested":
        return { text: s ? L(`Requested more information: ${s}`, `Yêu cầu bổ sung hồ sơ: ${s}`) : L("Requested more information", "Yêu cầu bổ sung hồ sơ") };
      case "info_received":
        return {
          text: L(
            `Information received — SLA paused ${s || "0"} day(s), due date moved`,
            `Đã nhận bổ sung — SLA dừng ${s || "0"} ngày, dời hạn`,
          ),
          from: dateOf(e.fromValue),
          to: dateOf(e.toValue),
        };
      case "declined": {
        const what =
          e.toValue === "transferred"
            ? L("Transferred to another unit", "Chuyển đơn vị khác")
            : e.toValue === "duplicate"
              ? L("Closed as duplicate", "Đóng vì trùng")
              : L("Rejected at triage", "Từ chối tiếp nhận");
        return { text: s ? `${what} — ${s}` : what };
      }
      case "assigned":
        return { text: s ? L(`Assigned to ${s}`, `Phân công cho ${s}`) : L("Assigned a specialist", "Phân công chuyên viên") };
      case "status_changed":
        return { text: L("Status changed", "Đổi trạng thái"), from: status(e.fromValue), to: status(e.toValue) };
      case "opinion_issued":
        if (!s) break;
        return { text: L(`Submitted advisory opinion v${s}`, `Nộp ý kiến tư vấn bản v${s}`) };
      case "revision_requested":
        if (!s) break;
        return { text: L(`Returned opinion v${s} for revision`, `Trả lại ý kiến bản v${s} để sửa`) };
      case "opinion_approved":
        if (!s) break;
        return { text: L(`Approved opinion v${s}`, `Duyệt ý kiến tư vấn bản v${s}`) };
      case "confidentiality_changed":
        return e.toValue === "true"
          ? { text: s ? L(`Marked confidential — ${s}`, `Gắn cờ Mật — ${s}`) : L("Marked confidential", "Gắn cờ Mật") }
          : { text: L("Lifted confidentiality", "Gỡ cờ Mật") };
      case "saved_to_knowledge_base":
        if (!s) break;
        return {
          text:
            e.toValue === "precedent"
              ? L(`Saved as an internal precedent: ${q}`, `Lưu thành án lệ nội bộ: ${q}`)
              : L(`Saved as an opinion template: ${q}`, `Lưu thành mẫu ý kiến: ${q}`),
        };
      case "message_posted":
        return {
          text:
            s === "requester"
              ? L("Message from the requesting unit", "Tin nhắn từ đơn vị yêu cầu")
              : L("Message from legal", "Tin nhắn từ pháp chế"),
        };
      case "alert_flagged":
        return { text: L("Flagged the SLA due date", "Gắn cờ cảnh báo hạn SLA") };
      case "alert_acknowledged":
        return { text: L("Acknowledged the SLA alert", "Tiếp nhận cảnh báo SLA") };
      case "alert_resolved":
        return { text: L("Resolved the SLA alert", "Xử lý xong cảnh báo SLA") };
      case "file_attached":
        if (!s) break;
        return { text: L(`Uploaded ${q} to ${folder(e.toValue)}`, `Tải lên ${q} vào ${folder(e.toValue)}`) };
      case "file_moved":
        return { text: L(`Moved ${q}`, `Chuyển ${q}`), from: folder(e.fromValue), to: folder(e.toValue) };
      case "file_deleted":
        return { text: L(`Deleted file ${q}`, `Xoá file ${q}`) };
      case "folder_created":
        return { text: L(`Created folder ${q}`, `Tạo folder ${q}`) };
    }
    return { text: e.description };
  };

  return (
    <AuditTimeline
      groups={GROUPS}
      entries={events.map((e) => {
        const d = describe(e);
        return {
          id: e.id,
          group: GROUP_OF[e.type] ?? "request",
          text: d.text,
          from: d.from,
          to: d.to,
          userName: e.userName,
          isSystem: e.userId === "system",
          createdAt: e.createdAt,
        };
      })}
    />
  );
}
