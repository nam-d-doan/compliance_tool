import { isBefore, isSameDay, parseISO, startOfDay } from "date-fns";

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

export type DueDateTone = "overdue" | "today" | "default";

export function getDueDateTone(
  dueDate: string,
  completed = false,
): DueDateTone {
  if (isOverdueDueDate(dueDate, completed)) return "overdue";
  if (isDueToday(dueDate)) return "today";
  return "default";
}

/** Tailwind classes for a due-date cell, by tone. */
export function dueDateCellClasses(dueDate: string, completed = false): string {
  switch (getDueDateTone(dueDate, completed)) {
    case "overdue":
      return "font-semibold text-red-700 dark:text-red-400 bg-red-500/10";
    case "today":
      return "font-medium text-amber-700 dark:text-amber-400 bg-amber-500/15";
    default:
      return "text-muted-foreground";
  }
}

/** Color-guide text shown in the Due Date column header tooltip. */
export const DUE_DATE_COLOR_GUIDE =
  "Red = overdue (past due date). Amber = due today.";
