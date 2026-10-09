/**
 * PSEUDO CODE — tab "Lịch sử" (Nam review: History / Audit Trails)
 * 1. Mỗi CaseEvent hiển thị: icon theo nhóm, câu mô tả song ngữ dựng từ
 *    `type` + `subject` (KHÔNG dịch `description` — đó là fallback tiếng
 *    Anh cho event cũ thiếu subject), người thực hiện, ngày + giờ, và khối
 *    "trước → sau" khi event có fromValue/toValue.
 * 2. Hiển thị + lọc dùng chung: components/common/AuditTimeline.tsx (LAW
 *    cũng dùng). File này chỉ giữ phần dựng câu theo loại CaseEvent.
 */
import { format, parseISO } from "date-fns";
import { AlertTriangle, Briefcase, FileText, ListTodo, Route } from "lucide-react";
import { AuditTimeline, type TimelineGroup } from "@/components/common/AuditTimeline";
import { useLanguageStore } from "@/stores";
import { useL, useDateLocale } from "@/lib/i18n";
import {
  getStageLabel,
  getDeadlineTypeLabel,
  type CaseStage,
  type DeadlineType,
} from "@/constants/lm";
import type { CaseEvent } from "@/types";

type Group = "case" | "progress" | "alert" | "task" | "docs";

const GROUP_OF: Record<CaseEvent["type"], Group> = {
  created: "case",
  updated: "case",
  reassigned: "case",
  case_closed: "case",
  reminded: "case",
  stage_changed: "progress",
  milestone_date_changed: "progress",
  milestone_completed: "progress",
  deadline_flagged: "alert",
  deadline_acknowledged: "alert",
  deadline_resolved: "alert",
  task_created: "task",
  task_updated: "task",
  task_status_changed: "task",
  task_deleted: "task",
  file_attached: "docs",
  file_moved: "docs",
  file_deleted: "docs",
  milestone_file_linked: "docs",
  milestone_file_unlinked: "docs",
  folder_created: "docs",
};

const GROUP_STYLE: Record<Group, TimelineGroup> = {
  case: { icon: Briefcase, className: "bg-info-bg text-info", label: ["Case", "Hồ sơ"] },
  progress: { icon: Route, className: "bg-success-bg text-success", label: ["Milestones & stage", "Mốc & giai đoạn"] },
  alert: { icon: AlertTriangle, className: "bg-danger-bg text-danger", label: ["Alerts", "Cảnh báo"] },
  task: { icon: ListTodo, className: "bg-warning-bg text-warning", label: ["Tasks", "Công việc"] },
  docs: { icon: FileText, className: "bg-muted text-foreground", label: ["Documents", "Tài liệu"] },
};

const FIELD_LABEL: Record<string, [string, string]> = {
  title: ["title", "tiêu đề"],
  category: ["category", "nhóm vụ việc"],
  customerCif: ["customer CIF", "CIF khách hàng"],
  customerName: ["customer name", "tên khách hàng"],
  outstandingDebt: ["outstanding debt", "dư nợ"],
  collateralDescription: ["collateral", "tài sản bảo đảm"],
  courtOrEnforcementAgency: ["court / agency", "tòa án / cơ quan THA"],
  judgeName: ["judge", "thẩm phán"],
  priority: ["priority", "mức ưu tiên"],
  ownerUnitId: ["owner unit", "đơn vị phụ trách"],
  managerId: ["manager", "quản lý"],
  tags: ["tags", "thẻ"],
  status: ["status", "trạng thái"],
};

const isIsoDate = (v: string) => /^\d{4}-\d{2}-\d{2}T/.test(v);

export function LMHistory({ events }: { events: CaseEvent[] }) {
  const L = useL();
  const lang = useLanguageStore((s) => s.lang);
  const dateLocale = useDateLocale();
  const stage = (v?: string) => (v ? getStageLabel(v as CaseStage, lang) : "");
  const folder = (v?: string) => v || L("Unfiled", "Chưa phân loại");
  const value = (v: string) =>
    isIsoDate(v) ? format(parseISO(v), "dd/MM/yyyy", { locale: dateLocale }) : v;

  /** Câu mô tả + khối trước/sau. Thiếu subject (event cũ) → dùng description gốc. */
  const describe = (e: CaseEvent): { text: string; from?: string; to?: string } => {
    const s = e.subject ?? "";
    const q = `"${s}"`;
    switch (e.type) {
      case "created":
        return { text: L(`Created case ${s}`, `Tạo hồ sơ ${s}`) };
      case "updated": {
        if (!s) break;
        const fields = s.split(", ").map((k) => (FIELD_LABEL[k] ? L(...FIELD_LABEL[k]) : k)).join(", ");
        return { text: L(`Updated case details: ${fields}`, `Cập nhật thông tin hồ sơ: ${fields}`) };
      }
      case "reassigned":
        return { text: L("Reassigned case", "Phân công lại hồ sơ"), from: e.fromValue, to: e.toValue };
      case "case_closed":
        return { text: L("Case closed — enforcement completed", "Đóng hồ sơ — thi hành án hoàn tất") };
      case "reminded":
        if (!s) break;
        return { text: L(`Sent a progress reminder to ${s}`, `Đôn đốc tiến độ tới ${s}`) };
      case "stage_changed":
        return { text: L("Stage changed", "Chuyển giai đoạn"), from: stage(e.fromValue), to: stage(e.toValue) };
      case "milestone_date_changed":
        if (!s) break;
        return {
          text: L(`Rescheduled milestone "${stage(s)}"`, `Dời lịch mốc "${stage(s)}"`),
          from: e.fromValue && value(e.fromValue),
          to: e.toValue && value(e.toValue),
        };
      case "milestone_completed":
        if (!s) break;
        return { text: L(`Completed milestone "${stage(s)}"`, `Hoàn thành mốc "${stage(s)}"`) };
      case "deadline_flagged":
      case "deadline_acknowledged":
      case "deadline_resolved": {
        if (!s) break;
        const dl = getDeadlineTypeLabel(s as DeadlineType, lang);
        if (e.type === "deadline_flagged") return { text: L(`Flagged deadline "${dl}"`, `Gắn cờ hạn "${dl}"`) };
        if (e.type === "deadline_acknowledged")
          return { text: L(`Acknowledged alert for "${dl}"`, `Tiếp nhận cảnh báo hạn "${dl}"`) };
        return { text: L(`Resolved alert for "${dl}"`, `Xử lý xong cảnh báo hạn "${dl}"`) };
      }
      case "task_created":
        if (!s) break;
        return { text: L(`Created task ${q}`, `Tạo việc ${q}`) };
      case "task_updated":
        if (!s) break;
        return { text: L(`Edited task ${q}`, `Sửa việc ${q}`) };
      case "task_deleted":
        if (!s) break;
        return { text: L(`Deleted task ${q}`, `Xoá việc ${q}`) };
      case "task_status_changed": {
        if (!s) break;
        const st = (v?: string) => (v === "done" ? L("Done", "Đã xong") : L("Open", "Đang mở"));
        return { text: L(`Task ${q}`, `Việc ${q}`), from: st(e.fromValue), to: st(e.toValue) };
      }
      case "file_attached":
        if (!s) break;
        return { text: L(`Uploaded ${q} to ${folder(e.toValue)}`, `Tải lên ${q} vào ${folder(e.toValue)}`) };
      case "file_moved":
        return { text: L(`Moved ${q}`, `Chuyển ${q}`), from: folder(e.fromValue), to: folder(e.toValue) };
      case "file_deleted":
        return { text: L(`Deleted file ${q}`, `Xoá file ${q}`) };
      case "milestone_file_linked":
        return { text: L(`Linked ${q} to milestone "${stage(e.toValue)}"`, `Gắn ${q} vào mốc "${stage(e.toValue)}"`) };
      case "milestone_file_unlinked":
        return { text: L(`Unlinked ${q} from milestone "${stage(e.fromValue)}"`, `Gỡ ${q} khỏi mốc "${stage(e.fromValue)}"`) };
      case "folder_created":
        return { text: L(`Created folder ${q}`, `Tạo folder ${q}`) };
    }
    return { text: e.description };
  };

  return (
    <AuditTimeline
      groups={GROUP_STYLE}
      entries={events.map((e) => {
        const d = describe(e);
        return {
          id: e.id,
          group: GROUP_OF[e.type] ?? "case",
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
