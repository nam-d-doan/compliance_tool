import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { dueDateCellClasses } from "@/lib/due-date";

export interface DueDateCellProps {
  dueDate: string;
  /** When true, never render the overdue style (item is in a terminal state). */
  completed?: boolean;
  formatStr?: string;
  className?: string;
}

export function DueDateCell({
  dueDate,
  completed,
  formatStr = "MMM d, yyyy",
  className,
}: DueDateCellProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-1.5 py-0.5 text-xs",
        dueDateCellClasses(dueDate, completed),
        className,
      )}
    >
      {format(parseISO(dueDate), formatStr)}
    </span>
  );
}
