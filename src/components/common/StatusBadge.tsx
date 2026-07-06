import { badgeVariants } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  getStatusStyle,
  type StatusSize,
  type StatusVariant,
} from "@/constants/status";

export interface StatusBadgeProps {
  status: string;
  variant?: StatusVariant;
  size?: StatusSize;
  className?: string;
}

export function StatusBadge({
  status,
  variant = "default",
  size = "sm",
  className,
}: StatusBadgeProps) {
  const style = getStatusStyle(status);
  const Icon = style.icon;

  const baseClasses =
    "inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-4xl border border-transparent px-2 py-0.5 font-medium whitespace-nowrap transition-colors [&>svg]:pointer-events-none";
  const sizeClasses =
    size === "sm"
      ? "h-5 text-xs [&>svg]:size-3"
      : "h-6 text-sm [&>svg]:size-3.5";

  if (variant === "dot") {
    return (
      <span
        className={cn(
          baseClasses,
          sizeClasses,
          "border-transparent bg-transparent text-current",
          style.dot,
          className,
        )}
      >
        <span
          className={cn(
            "rounded-full bg-current",
            size === "sm" ? "size-1.5" : "size-2",
          )}
          aria-hidden="true"
        />
        {style.label}
      </span>
    );
  }

  const isOutline = variant === "outline";
  const variantClasses = isOutline
    ? cn(badgeVariants({ variant: "outline" }), style.outline)
    : cn(badgeVariants({ variant: "default" }), style.default);

  return (
    <span className={cn(baseClasses, sizeClasses, variantClasses, className)}>
      <Icon className="shrink-0" aria-hidden="true" />
      {style.label}
    </span>
  );
}
