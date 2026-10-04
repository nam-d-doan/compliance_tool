import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  Check,
  CircleDashed,
  Clock,
  Info,
  Lightbulb,
  RotateCcw,
  Siren,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ISSUE_SOURCE_SHORT,
  REVISION_HEALTH_LABELS,
  type RevisionHealth,
} from "@/lib/cms-rules";
import type { IssueSource, LegalUpdateStatus } from "@/types";

export type Tone = "success" | "warning" | "danger" | "info" | "neutral" | "ai";

export const TONE_CLASSES: Record<Tone, string> = {
  success: "bg-success-bg text-success",
  warning: "bg-warning-bg text-warning",
  danger: "bg-danger-bg text-danger",
  info: "bg-info-bg text-info",
  neutral: "bg-neutral-bg text-neutral",
  ai: "bg-violet-500/10 text-violet-600 dark:text-violet-300",
};

/** Small pill used for statuses that are not part of the global status map. */
export function ToneBadge({
  tone,
  icon: Icon,
  children,
  className,
}: {
  tone: Tone;
  icon?: LucideIcon;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-5 w-fit shrink-0 items-center gap-1 rounded-4xl px-2 text-xs font-medium whitespace-nowrap",
        TONE_CLASSES[tone],
        className,
      )}
    >
      {Icon && <Icon className="size-3" aria-hidden="true" />}
      {children}
    </span>
  );
}

export const LEGAL_STATUS_TONE: Record<LegalUpdateStatus, Tone> = {
  new: "info",
  under_review: "warning",
  applicable: "warning",
  not_applicable: "neutral",
  mapped: "ai",
  assigned: "ai",
  completed: "success",
};

const SOURCE_TONE: Record<IssueSource, Tone> = {
  icis: "ai",
  sbv_inspection: "danger",
  state_audit: "warning",
  independent_audit: "neutral",
  internal_audit: "info",
  self_check: "success",
  compliance_monitoring: "info",
  complaint: "warning",
};

export function SourceBadge({ source }: { source: IssueSource }) {
  return (
    <ToneBadge tone={SOURCE_TONE[source]}>
      {ISSUE_SOURCE_SHORT[source]}
    </ToneBadge>
  );
}

const HEALTH_TONE: Record<RevisionHealth, Tone> = {
  on_track: "success",
  late_risk: "warning",
  overdue: "danger",
  issued: "neutral",
};
const HEALTH_ICON: Record<RevisionHealth, LucideIcon> = {
  on_track: Check,
  late_risk: AlertTriangle,
  overdue: Siren,
  issued: Check,
};

export function RevisionHealthBadge({ health }: { health: RevisionHealth }) {
  return (
    <ToneBadge tone={HEALTH_TONE[health]} icon={HEALTH_ICON[health]}>
      {REVISION_HEALTH_LABELS[health]}
    </ToneBadge>
  );
}

export interface StepItem {
  key: string;
  label: string;
  hint?: string;
  state: "done" | "current" | "pending" | "returned";
}

/**
 * Horizontal step bar (design-language "stepper / journey"). Done = green,
 * current = blue, returned = amber, pending = grey.
 */
export function StepBar({
  steps,
  onStepClick,
  className,
}: {
  steps: StepItem[];
  onStepClick?: (key: string) => void;
  className?: string;
}) {
  return (
    <ol
      className={cn(
        "flex w-full items-stretch gap-1.5 overflow-x-auto pb-1 [scrollbar-width:thin]",
        className,
      )}
    >
      {steps.map((s, i) => {
        const Icon =
          s.state === "done"
            ? Check
            : s.state === "returned"
              ? RotateCcw
              : s.state === "current"
                ? Clock
                : CircleDashed;
        return (
          <li
            key={s.key}
            className="flex min-w-[8.5rem] flex-1 items-center gap-1.5"
          >
            <button
              type="button"
              disabled={!onStepClick}
              onClick={() => onStepClick?.(s.key)}
              className={cn(
                "flex h-full w-full items-start gap-2 rounded-xl border px-3 py-2 text-left transition-colors",
                onStepClick && "hover:bg-muted/50",
                s.state === "done" && "border-success/30 bg-success-bg/60",
                s.state === "current" &&
                  "border-primary/40 bg-primary/[0.07] ring-2 ring-primary/15",
                s.state === "returned" && "border-warning/40 bg-warning-bg/60",
                s.state === "pending" && "border-border bg-card/60",
              )}
            >
              <span
                className={cn(
                  "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                  s.state === "done" && "bg-success text-white",
                  s.state === "current" && "bg-primary text-primary-foreground",
                  s.state === "returned" && "bg-warning text-white",
                  s.state === "pending" && "bg-muted text-muted-foreground",
                )}
              >
                {s.state === "pending" ? i + 1 : <Icon className="size-3" />}
              </span>
              <span className="min-w-0">
                <span
                  className={cn(
                    "block text-xs font-semibold leading-tight",
                    s.state === "pending" && "text-muted-foreground",
                  )}
                >
                  {s.label}
                </span>
                {s.hint && (
                  <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">
                    {s.hint}
                  </span>
                )}
              </span>
            </button>
            {i < steps.length - 1 && (
              <span
                className="shrink-0 text-muted-foreground/60"
                aria-hidden="true"
              >
                →
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}

/** Left-border callout (design-language "callouts"). */
export function Callout({
  tone = "info",
  title,
  children,
  icon,
  className,
  action,
}: {
  tone?: "info" | "warning" | "success" | "danger" | "ai";
  title?: string;
  children?: React.ReactNode;
  icon?: LucideIcon;
  className?: string;
  action?: React.ReactNode;
}) {
  const Icon =
    icon ??
    (tone === "warning" || tone === "danger"
      ? AlertTriangle
      : tone === "ai"
        ? Lightbulb
        : Info);
  const border: Record<string, string> = {
    info: "border-info bg-info-bg/60",
    warning: "border-warning bg-warning-bg/60",
    success: "border-success bg-success-bg/60",
    danger: "border-danger bg-danger-bg/60",
    ai: "border-violet-500 bg-violet-500/[0.07]",
  };
  const text: Record<string, string> = {
    info: "text-info",
    warning: "text-warning",
    success: "text-success",
    danger: "text-danger",
    ai: "text-violet-600 dark:text-violet-300",
  };
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-r-xl border-l-4 px-3.5 py-3",
        border[tone],
        className,
      )}
    >
      <Icon
        className={cn("mt-0.5 size-4 shrink-0", text[tone])}
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1 text-sm">
        {title && <p className="font-semibold text-foreground">{title}</p>}
        {children && (
          <div className={cn("text-muted-foreground", title && "mt-0.5")}>
            {children}
          </div>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/** Small fact box (design-language "fact grids"). */
export function Fact({
  label,
  value,
  icon: Icon,
  className,
  alert,
}: {
  label: string;
  value: React.ReactNode;
  icon?: LucideIcon;
  className?: string;
  alert?: boolean;
}) {
  return (
    <div
      className={cn(
        "space-y-1 rounded-lg border border-border bg-card p-3",
        alert && "border-danger/40 bg-danger-bg/40",
        className,
      )}
    >
      <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {Icon && <Icon className="size-3.5" aria-hidden="true" />}
        {label}
      </dt>
      <dd className="text-sm font-medium text-foreground">{value}</dd>
    </div>
  );
}

/** "What is this page for" line under a page title. */
export function PagePurpose({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
      <Info className="mt-px size-3.5 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}

/** RFQ traceability chip, e.g. "RFQ 2.1". */
export function RfqChip({ code }: { code: string }) {
  return (
    <span
      title="Requirement reference in RFQ 2698/2026/TB-NHNA-P.11, Phụ lục 1"
      className="inline-flex h-5 items-center rounded-md border border-dashed border-border px-1.5 font-mono text-[10px] text-muted-foreground"
    >
      RFQ {code}
    </span>
  );
}

/**
 * Evidence file picker for the demo: real file selection (names only — the
 * mock backend keeps no binaries) plus a one-click sample file so presenters
 * don't need documents at hand.
 */
export function FileNamePicker({
  value,
  onChange,
  sampleName,
  multiple = true,
  disabled,
}: {
  value: string[];
  onChange: (names: string[]) => void;
  sampleName: string;
  multiple?: boolean;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <label
          className={cn(
            "inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-dashed border-border px-3 text-xs font-medium hover:bg-muted/50",
            disabled && "pointer-events-none opacity-50",
          )}
        >
          <input
            type="file"
            multiple={multiple}
            className="sr-only"
            disabled={disabled}
            onChange={(e) => {
              const names = Array.from(e.target.files ?? []).map((f) => f.name);
              onChange(multiple ? [...value, ...names] : names.slice(0, 1));
              e.target.value = "";
            }}
          />
          Choose file{multiple ? "s" : ""}…
        </label>
        <button
          type="button"
          disabled={disabled}
          onClick={() =>
            onChange(multiple ? [...value, sampleName] : [sampleName])
          }
          className="text-xs font-medium text-primary underline-offset-2 hover:underline disabled:opacity-50"
        >
          Use sample file
        </button>
      </div>
      {value.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {value.map((n, i) => (
            <li
              key={`${n}-${i}`}
              className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs"
            >
              {n}
              {!disabled && (
                <button
                  type="button"
                  aria-label={`Remove ${n}`}
                  onClick={() => onChange(value.filter((_, j) => j !== i))}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ×
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
