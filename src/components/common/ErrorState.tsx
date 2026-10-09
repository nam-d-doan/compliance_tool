import { motion } from "motion/react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useCommonT } from "@/constants/i18n/common";

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title,
  message,
  onRetry,
  className,
}: ErrorStateProps) {
  const { t } = useCommonT();
  title ??= t("errorTitle");
  message ??= t("errorMessage");
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-destructive/30 bg-destructive/5 p-8 text-center dark:bg-destructive/10",
        className,
      )}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive dark:bg-destructive/20">
        <AlertTriangle className="size-6" aria-hidden="true" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-foreground">{title}</h3>
      {message && (
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">{message}</p>
      )}
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-5" onClick={onRetry}>
          <RotateCcw className="size-4" aria-hidden="true" />
          {t("retry")}
        </Button>
      )}
    </motion.div>
  );
}
