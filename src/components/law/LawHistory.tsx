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
import { useL, useTerm } from "@/lib/i18n";
import type { LawEvent } from "@/types";

type Group = "request" | "flow" | "discussion" | "alert" | "docs";

const GROUP_OF: Record<LawEvent["type"], Group> = {
  created: "request",
  updated: "request",
  reassigned: "request",
  reminded: "request",
  priority_assessed: "flow",
  status_changed: "flow",
  opinion_issued: "flow",
  revision_requested: "flow",
  opinion_approved: "flow",
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
  const tier = (v?: string) => (isTier(v) ? term(LAW_PRIORITY_STYLES[v].label) : v);
  const status = (v?: string) => (isStatus(v) ? term(LAW_STATUS_LABELS[v]) : v);
  const folder = (v?: string) => v || L("Unfiled", "Chưa phân loại");

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
