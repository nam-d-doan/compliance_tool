import {
  differenceInCalendarDays,
  isBefore,
  isSameDay,
  parseISO,
  startOfDay,
} from "date-fns";

/** True when the due date's calendar day is strictly before today. */
export function isOverdueDueDate(dueDate: string, completed = false): boolean {
  if (completed) return false;
  try {
    return isBefore(startOfDay(parseISO(dueDate)), startOfDay(new Date()));
  } catch {
    return false;
  }
}

/** True when the due date falls on today's calendar day. */
export function isDueToday(dueDate: string): boolean {
  try {
    return isSameDay(parseISO(dueDate), new Date());
  } catch {
    return false;
  }
}

export type DueDateTone = "overdue" | "soon" | "default";

/** A due date within this many calendar days (inclusive of today) is "soon". */
export const DUE_DATE_SOON_DAYS = 7;

export function getDueDateTone(
  dueDate: string,
  completed = false,
): DueDateTone {
  if (isOverdueDueDate(dueDate, completed)) return "overdue";
  try {
    const days = differenceInCalendarDays(
      startOfDay(parseISO(dueDate)),
      startOfDay(new Date()),
    );
    if (days >= 0 && days <= DUE_DATE_SOON_DAYS) return "soon";
  } catch {
    /* fall through to default */
  }
  return "default";
}

/** Tailwind classes for a due-date cell, by tone. */
export function dueDateCellClasses(dueDate: string, completed = false): string {
  switch (getDueDateTone(dueDate, completed)) {
    case "overdue":
      return "font-semibold text-danger bg-danger-bg";
    case "soon":
      return "font-medium text-warning bg-warning-bg";
    default:
      return "text-muted-foreground";
  }
}

/** Color-guide text shown in the Due Date column header tooltip. */
export const DUE_DATE_COLOR_GUIDE =
  "Red = overdue (past due date). Amber = due within 7 days.";
