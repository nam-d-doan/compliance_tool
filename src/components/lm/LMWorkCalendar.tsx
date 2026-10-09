/**
 * PSEUDO CODE (ngắn gọn) — tab "Lịch làm việc" (Nam review: bảng + calendar)
 * 1. Gộp LegalDeadline + LMTask thành 1 danh sách WorkItem, sort theo hạn.
 * 2. Chế độ Bảng: mỗi dòng 1 việc — loại, hạn, ưu tiên, cảnh báo, thao tác.
 *    Task có Sửa / Xoá (xoá phải bấm xác nhận lần 2, không dùng confirm()).
 * 3. Chế độ Lịch: lưới tháng, mỗi ngày hiện tối đa 2 chip màu theo cảnh
 *    báo + "+n". Bấm 1 ngày → danh sách việc của ngày đó bên dưới.
 * 4. Màu cảnh báo task do server tính (alertState theo DEMO_TODAY), deadline
 *    dùng severity server tính sẵn — FE không tự tính lại theo ngày máy.
 */
import { useMemo, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { vi as viLocale } from "date-fns/locale";
import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Table2,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PriorityBadge } from "@/components/common";
import { getDeadlineTypeLabel } from "@/constants/lm";
import { useLMT, type LMI18nKey } from "@/constants/lm-i18n";
import { cn } from "@/lib/utils";
import type { LegalDeadline, LMTask, LMTaskAlertState } from "@/types";

type WorkItem =
  | { kind: "deadline"; id: string; dueDate: string; deadline: LegalDeadline }
  | { kind: "task"; id: string; dueDate: string; task: LMTask };

const DEADLINE_STATUS_KEY: Record<LegalDeadline["status"], LMI18nKey> = {
  pending: "deadlineStatusPending",
  flagged: "deadlineStatusFlagged",
  acknowledged: "deadlineStatusAcknowledged",
  resolved: "deadlineStatusResolved",
};

const TASK_ALERT_KEY: Record<LMTaskAlertState, LMI18nKey> = {
  overdue: "alertOverdue",
  due_soon: "alertDueSoon",
  upcoming: "alertUpcoming",
  done: "alertDone",
};

const TONE_CLASS = {
  red: "bg-destructive/10 text-destructive",
  amber: "bg-warning-bg text-warning",
  muted: "bg-muted text-muted-foreground",
} as const;

type Tone = keyof typeof TONE_CLASS;

const DOT_CLASS: Record<Tone, string> = {
  red: "bg-destructive",
  amber: "bg-warning",
  muted: "bg-muted-foreground/40",
};

function itemTone(item: WorkItem): Tone {
  if (item.kind === "deadline") {
    const s = item.deadline.severity;
    return s === "red" ? "red" : s === "amber" ? "amber" : "muted";
  }
  const a = item.task.alertState;
  return a === "overdue" ? "red" : a === "due_soon" ? "amber" : "muted";
}

function isDone(item: WorkItem): boolean {
  return item.kind === "deadline"
    ? item.deadline.status === "resolved"
    : item.task.status === "done";
}

export interface LMWorkCalendarProps {
  deadlines: LegalDeadline[];
  tasks: LMTask[];
  canEdit: boolean;
  deadlineSaving: boolean;
  savingTaskId?: string;
  deletingTaskId?: string;
  onDeadlineAction: (id: string, action: "acknowledge" | "resolve") => void;
  onToggleTask: (task: LMTask) => void;
  onEditTask: (task: LMTask) => void;
  onDeleteTask: (task: LMTask) => void;
}

export function LMWorkCalendar(props: LMWorkCalendarProps) {
  const { t } = useLMT();
  const [view, setView] = useState<"table" | "calendar">("table");

  const items = useMemo<WorkItem[]>(
    () =>
      [
        ...props.deadlines.map((d) => ({
          kind: "deadline" as const,
          id: d.id,
          dueDate: d.dueDate,
          deadline: d,
        })),
        ...props.tasks.map((task) => ({
          kind: "task" as const,
          id: task.id,
          dueDate: task.dueDate,
          task,
        })),
      ].sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
    [props.deadlines, props.tasks],
  );

  return (
    <div className="space-y-4">
      <div className="inline-flex rounded-lg border border-border p-0.5" role="group">
        <Button
          size="sm"
          variant={view === "table" ? "secondary" : "ghost"}
          onClick={() => setView("table")}
          aria-pressed={view === "table"}
        >
          <Table2 className="size-4" aria-hidden="true" />
          {t("viewTable")}
        </Button>
        <Button
          size="sm"
          variant={view === "calendar" ? "secondary" : "ghost"}
          onClick={() => setView("calendar")}
          aria-pressed={view === "calendar"}
        >
          <CalendarDays className="size-4" aria-hidden="true" />
          {t("viewCalendar")}
        </Button>
      </div>

      {view === "table" ? (
        <WorkTable items={items} {...props} />
      ) : (
        <WorkMonth items={items} {...props} />
      )}
    </div>
  );
}

function WorkTable({ items, ...props }: { items: WorkItem[] } & LMWorkCalendarProps) {
  const { t } = useLMT();
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-[720px] text-sm">
        <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
          <tr>
            <th className="px-3 py-2 font-medium">{t("colItem")}</th>
            <th className="px-3 py-2 font-medium">{t("colType")}</th>
            <th className="px-3 py-2 font-medium">{t("colDue")}</th>
            <th className="px-3 py-2 font-medium">{t("colPriority")}</th>
            <th className="px-3 py-2 font-medium">{t("colAlert")}</th>
            <th className="px-3 py-2 font-medium">{t("colActions")}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <WorkRow key={item.id} item={item} {...props} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function WorkRow({ item, ...props }: { item: WorkItem } & LMWorkCalendarProps) {
  const { t, lang } = useLMT();
  const tone = itemTone(item);
  const done = isDone(item);

  return (
    <tr className="border-t border-border align-top">
      <td className="px-3 py-2">
        <span
          className={cn(
            "flex items-center gap-2 font-medium",
            done && "text-muted-foreground line-through",
          )}
        >
          <span className={cn("size-2 shrink-0 rounded-full", DOT_CLASS[tone])} aria-hidden="true" />
          {item.kind === "deadline"
            ? getDeadlineTypeLabel(item.deadline.type, lang)
            : item.task.title}
        </span>
        {item.kind === "task" && item.task.description && (
          <p className="mt-0.5 pl-4 text-xs text-muted-foreground">{item.task.description}</p>
        )}
      </td>
      <td className="px-3 py-2 text-xs text-muted-foreground">
        {item.kind === "deadline" ? t("legalDeadline") : t("taskLabel")}
      </td>
      <td className="whitespace-nowrap px-3 py-2">
        {format(parseISO(item.dueDate), "dd/MM/yyyy")}
        {item.kind === "task" && item.task.remindDaysBefore > 0 && (
          <p className="text-xs text-muted-foreground">
            {t("remindBefore")} {item.task.remindDaysBefore} {t("daysLabel")}
          </p>
        )}
      </td>
      <td className="px-3 py-2">
        {item.kind === "task" ? <PriorityBadge priority={item.task.priority} /> : "—"}
      </td>
      <td className="px-3 py-2">
        <span className={cn("rounded-md px-1.5 py-0.5 text-xs font-medium", TONE_CLASS[tone])}>
          {item.kind === "deadline"
            ? t(DEADLINE_STATUS_KEY[item.deadline.status])
            : t(TASK_ALERT_KEY[item.task.alertState ?? "upcoming"])}
        </span>
      </td>
      <td className="px-3 py-2">
        <ItemActions item={item} {...props} />
      </td>
    </tr>
  );
}

function ItemActions({ item, ...props }: { item: WorkItem } & LMWorkCalendarProps) {
  const { t } = useLMT();
  const [confirming, setConfirming] = useState(false);
  if (!props.canEdit) return null;

  if (item.kind === "deadline") {
    const d = item.deadline;
    return (
      <div className="flex gap-2">
        {d.status === "flagged" && (
          <Button
            size="sm"
            variant="outline"
            disabled={props.deadlineSaving}
            onClick={() => props.onDeadlineAction(d.id, "acknowledge")}
          >
            {t("acknowledge")}
          </Button>
        )}
        {(d.status === "flagged" || d.status === "acknowledged") && (
          <Button
            size="sm"
            disabled={props.deadlineSaving}
            onClick={() => props.onDeadlineAction(d.id, "resolve")}
          >
            {t("resolve")}
          </Button>
        )}
      </div>
    );
  }

  const task = item.task;
  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-destructive">{t("confirmDelete")}</span>
        <Button
          size="sm"
          variant="destructive"
          disabled={props.deletingTaskId === task.id}
          onClick={() => props.onDeleteTask(task)}
        >
          {t("deleteTask")}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setConfirming(false)}>
          {t("cancel")}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-1">
      <Button
        size="sm"
        variant="outline"
        disabled={props.savingTaskId === task.id}
        onClick={() => props.onToggleTask(task)}
      >
        <Check className="size-4" aria-hidden="true" />
        {t(task.status === "done" ? "reopen" : "markDone")}
      </Button>
      <Button
        size="icon-sm"
        variant="ghost"
        onClick={() => props.onEditTask(task)}
        aria-label={t("editTask")}
        title={t("editTask")}
      >
        <Pencil className="size-4" aria-hidden="true" />
      </Button>
      <Button
        size="icon-sm"
        variant="ghost"
        onClick={() => setConfirming(true)}
        aria-label={t("deleteTask")}
        title={t("deleteTask")}
      >
        <Trash2 className="size-4" aria-hidden="true" />
      </Button>
    </div>
  );
}

function WorkMonth({ items, ...props }: { items: WorkItem[] } & LMWorkCalendarProps) {
  const { t, lang } = useLMT();
  const locale = lang === "vi" ? viLocale : undefined;

  // Dữ liệu demo xoay quanh DEMO_TODAY (không phải ngày máy) — mở lịch ở
  // tháng có việc chưa xong gần nhất để không rơi vào tháng trống.
  const anchor = useMemo(() => {
    const firstOpen = items.find((i) => !isDone(i)) ?? items[0];
    return firstOpen ? parseISO(firstOpen.dueDate) : new Date();
  }, [items]);
  const [month, setMonth] = useState(() => startOfMonth(anchor));
  const [selected, setSelected] = useState<Date>(anchor);

  const byDay = useMemo(() => {
    const map = new Map<string, WorkItem[]>();
    for (const item of items) {
      const key = format(parseISO(item.dueDate), "yyyy-MM-dd");
      map.set(key, [...(map.get(key) ?? []), item]);
    }
    return map;
  }, [items]);

  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(month), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(month), { weekStartsOn: 1 }),
  });
  const weekdayLabels = days
    .slice(0, 7)
    .map((d) => format(d, "EEEEEE", { locale }));
  const selectedItems = byDay.get(format(selected, "yyyy-MM-dd")) ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium capitalize">
          {format(month, "MMMM yyyy", { locale })}
        </p>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setMonth((m) => subMonths(m, 1))}
            aria-label="Previous month"
          >
            <ChevronLeft className="size-3.5" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setMonth((m) => addMonths(m, 1))}
            aria-label="Next month"
          >
            <ChevronRight className="size-3.5" aria-hidden="true" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {weekdayLabels.map((w) => (
          <div key={w} className="pb-1 text-center text-[11px] font-semibold text-muted-foreground">
            {w}
          </div>
        ))}
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const dayItems = byDay.get(key) ?? [];
          const isSelected = isSameDay(day, selected);
          return (
            <button
              key={key}
              type="button"
              onClick={() => setSelected(day)}
              className={cn(
                "flex min-h-20 flex-col gap-0.5 rounded-lg border p-1 text-left text-xs transition-colors",
                isSameMonth(day, month) ? "border-border" : "border-transparent text-muted-foreground/40",
                isSelected ? "border-primary ring-1 ring-primary" : "hover:bg-muted/50",
              )}
            >
              <span className="font-medium">{day.getDate()}</span>
              {dayItems.slice(0, 2).map((item) => (
                <span
                  key={item.id}
                  className={cn(
                    "truncate rounded px-1 py-0.5 text-[10px]",
                    TONE_CLASS[itemTone(item)],
                    isDone(item) && "line-through opacity-60",
                  )}
                >
                  {item.kind === "deadline"
                    ? getDeadlineTypeLabel(item.deadline.type, lang)
                    : item.task.title}
                </span>
              ))}
              {dayItems.length > 2 && (
                <span className="text-[10px] text-muted-foreground">+{dayItems.length - 2}</span>
              )}
            </button>
          );
        })}
      </div>

      <div className="border-t border-border pt-4">
        <p className="mb-2 text-xs font-semibold text-muted-foreground">
          {format(selected, "EEEE, dd/MM/yyyy", { locale })}
        </p>
        {selectedItems.length === 0 ? (
          <p className="text-xs text-muted-foreground">{t("nothingThisDay")}</p>
        ) : (
          <WorkTable items={selectedItems} {...props} />
        )}
      </div>
    </div>
  );
}
