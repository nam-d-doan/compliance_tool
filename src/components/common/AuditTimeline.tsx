/**
 * PSEUDO CODE — timeline lịch sử / audit trail dùng chung LM + LAW
 * 1. Nhận danh sách entry đã dựng sẵn câu mô tả (mỗi module tự dựng câu
 *    song ngữ theo loại sự kiện của mình) + bảng nhóm (icon, màu, nhãn).
 * 2. Hiển thị: icon theo nhóm, câu mô tả, khối "trước → sau" nếu có, người
 *    thực hiện ("Hệ thống" với thao tác tự động), ngày + giờ.
 * 3. Lọc theo nhóm và theo người (phía client — 1 bản ghi chỉ vài chục mục).
 */
import { useState } from "react";
import { format, parseISO } from "date-fns";
import { ArrowRight, type LucideIcon } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { useL, useDateLocale, type Bi } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export interface TimelineGroup {
  icon: LucideIcon;
  className: string;
  label: Bi;
}

export interface TimelineEntry {
  id: string;
  group: string;
  text: string;
  from?: string;
  to?: string;
  userName: string;
  isSystem: boolean;
  createdAt: string;
}

const selectClass =
  "h-8 rounded-lg border border-input bg-transparent px-2 text-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

export function AuditTimeline({
  entries,
  groups,
}: {
  entries: TimelineEntry[];
  groups: Record<string, TimelineGroup>;
}) {
  const L = useL();
  const dateLocale = useDateLocale();
  const [group, setGroup] = useState("all");
  const [person, setPerson] = useState("all");
  const systemName = L("System", "Hệ thống");
  const who = (e: TimelineEntry) => (e.isSystem ? systemName : e.userName);

  const people = Array.from(new Set(entries.map(who))).sort();
  const visible = entries.filter(
    (e) => (group === "all" || e.group === group) && (person === "all" || who(e) === person),
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={group}
          onChange={(e) => setGroup(e.target.value)}
          aria-label={L("Filter by action type", "Lọc theo loại thao tác")}
          className={selectClass}
        >
          <option value="all">{L("All actions", "Tất cả thao tác")}</option>
          {Object.entries(groups).map(([key, g]) => (
            <option key={key} value={key}>
              {L(...g.label)}
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
              {p}
            </option>
          ))}
        </select>
        <span className="text-xs text-muted-foreground">
          {visible.length}/{entries.length} {L("entries", "bản ghi")}
        </span>
      </div>

      {visible.length === 0 ? (
        <EmptyState title={L("No matching entries", "Không có bản ghi phù hợp")} className="border-0 bg-transparent" />
      ) : (
        <ol className="relative space-y-4 border-l border-border pl-6">
          {visible.map((e) => {
            const style = groups[e.group] ?? Object.values(groups)[0];
            const Icon = style.icon;
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
                <p className="text-sm">{e.text}</p>
                {(e.from || e.to) && (
                  <p className="mt-1 inline-flex flex-wrap items-center gap-1.5 rounded-md bg-muted px-2 py-0.5 text-xs">
                    <span className="text-muted-foreground line-through">{e.from || "—"}</span>
                    <ArrowRight className="size-3 text-muted-foreground" aria-hidden="true" />
                    <span className="font-medium">{e.to || "—"}</span>
                  </p>
                )}
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {who(e)} · {format(parseISO(e.createdAt), "dd/MM/yyyy HH:mm", { locale: dateLocale })}
                </p>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
