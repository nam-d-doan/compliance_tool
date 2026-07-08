import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export type SortDirection = "asc" | "desc";

export interface SortableThProps {
  label: string;
  field: string;
  /** Current sort, or null when no column is sorted. */
  sort: { field: string; direction: SortDirection } | null;
  onSort: (field: string) => void;
  tooltip?: string;
  align?: "left" | "right" | "center";
  className?: string;
}

export function SortableTh({
  label,
  field,
  sort,
  onSort,
  tooltip,
  align = "left",
  className,
}: SortableThProps) {
  const isActive = sort?.field === field;
  const direction = isActive ? sort.direction : undefined;
  const Icon =
    direction === "asc"
      ? ArrowUp
      : direction === "desc"
        ? ArrowDown
        : ArrowUpDown;

  const button = (
    <button
      type="button"
      onClick={() => onSort(field)}
      className={cn(
        "flex items-center gap-1 outline-none focus-visible:underline",
        align === "right" && "ml-auto justify-end",
        align === "center" && "mx-auto justify-center",
      )}
    >
      {label}
      <Icon
        className={cn(
          "size-3 transition-colors",
          isActive ? "text-primary" : "text-muted-foreground/50",
        )}
        aria-hidden="true"
      />
    </button>
  );

  return (
    <th
      className={cn(
        "px-4 py-3 font-medium whitespace-nowrap",
        align === "right" && "text-right",
        align === "center" && "text-center",
        className,
      )}
    >
      {tooltip ? (
        <Tooltip>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent className="max-w-xs">{tooltip}</TooltipContent>
        </Tooltip>
      ) : (
        button
      )}
    </th>
  );
}
