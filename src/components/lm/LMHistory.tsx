/**
 * PSEUDO CODE — tab "Lịch sử" (Nam review: History / Audit Trails)
 * 1. Mỗi CaseEvent hiển thị: icon theo nhóm, câu mô tả song ngữ dựng từ
 *    `type` + `subject` (KHÔNG dịch `description` — đó là fallback tiếng
 *    Anh cho event cũ thiếu subject), người thực hiện, ngày + giờ, và khối
 *    "trước → sau" khi event có fromValue/toValue.
 * 2. Lọc theo nhóm thao tác và theo người thực hiện (lọc phía client — 1
 *    hồ sơ chỉ vài chục event).
 */
import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import {
  AlertTriangle,
  ArrowRight,
  Briefcase,
  FileText,
  ListTodo,
  Route,
  type LucideIcon,
} from "lucide-react";
import { EmptyState } from "@/components/common";
import { useLanguageStore } from "@/stores";
import { useL, useDateLocale } from "@/lib/i18n";
import {
  getStageLabel,
  getDeadlineTypeLabel,
  type CaseStage,
  type DeadlineType,
} from "@/constants/lm";
import { cn } from "@/lib/utils";
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

const GROUP_STYLE: Record<Group, { icon: LucideIcon; className: string; label: [string, string] }> = {
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
  const [group, setGroup] = useState<Group | "all">("all");
  const [person, setPerson] = useState("all");

  const people = useMemo(
    () => Array.from(new Set(events.map((e) => e.userName))).sort(),
    [events],
  );
  const visible = events.filter(
    (e) => (group === "all" || GROUP_OF[e.type] === group) && (person === "all" || e.userName === person),
  );

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

  const selectClass =
    "h-8 rounded-lg border border-input bg-transparent px-2 text-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={group}
          onChange={(e) => setGroup(e.target.value as Group | "all")}
          aria-label={L("Filter by action type", "Lọc theo loại thao tác")}
          className={selectClass}
        >
          <option value="all">{L("All actions", "Tất cả thao tác")}</option>
          {(Object.keys(GROUP_STYLE) as Group[]).map((g) => (
            <option key={g} value={g}>
              {L(...GROUP_STYLE[g].label)}
            </option>
          ))}
        </select>
        <select
          value={person}
          onChange={(e) => setPerson(e.target.value)}
          aria-label={L("Filter by person", "Lọc theo người thực hiện")}
          className={selectClass}
        >
          <option value="all">{L("Everyone", "Mọi người")}</option>
          {people.map((p) => (
            <option key={p} value={p}>
              {p === "System" ? L("System", "Hệ thống") : p}
            </option>
          ))}
        </select>
        <span className="text-xs text-muted-foreground">
          {visible.length}/{events.length} {L("entries", "bản ghi")}
        </span>
      </div>

      {visible.length === 0 ? (
        <EmptyState title={L("No matching entries", "Không có bản ghi phù hợp")} className="border-0 bg-transparent" />
      ) : (
        <ol className="relative space-y-4 border-l border-border pl-6">
          {visible.map((e) => {
            const style = GROUP_STYLE[GROUP_OF[e.type] ?? "case"];
            const Icon = style.icon;
            const d = describe(e);
            return (
              <li key={e.id} className="relative">
                <span
                  className={cn(
                    "absolute -left-[37px] flex size-6 items-center justify-center rounded-full ring-4 ring-card",
                    style.className,
                  )}
                  aria-hidden="true"
                >
                  <Icon className="size-3.5" />
                </span>
                <p className="text-sm">{d.text}</p>
                {(d.from || d.to) && (
                  <p className="mt-1 inline-flex flex-wrap items-center gap-1.5 rounded-md bg-muted px-2 py-0.5 text-xs">
                    <span className="text-muted-foreground line-through">{d.from || "—"}</span>
                    <ArrowRight className="size-3 text-muted-foreground" aria-hidden="true" />
                    <span className="font-medium">{d.to || "—"}</span>
                  </p>
                )}
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {e.userId === "system" ? L("System", "Hệ thống") : e.userName} ·{" "}
                  {format(parseISO(e.createdAt), "dd/MM/yyyy HH:mm", { locale: dateLocale })}
                </p>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
