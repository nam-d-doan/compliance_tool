import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Responsive grid for chart cards with uniform row heights.
 *
 * The chart card components (PieChartCard/BarChartCard/AreaChartCard) accept a
 * `className` that is applied to their outer Card. Passing `h-full` makes each
 * card stretch to the tallest sibling in the row (CSS grid's default
 * `items-stretch`), eliminating the uneven-height chart row where differing
 * header/subtitle lengths left cards misaligned.
 *
 * Usage: render `<ChartGrid>` children with the `className="h-full"` prop
 * forwarded to each chart card.
 */
export function ChartGrid({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 items-stretch gap-4 md:grid-cols-2 xl:grid-cols-3",
        className,
      )}
    >
      {children}
    </div>
  );
}