import { format, parseISO } from "date-fns";
import { Lock, History } from "lucide-react";
import { useEntityHistory } from "@/hooks/queries";
import { cn } from "@/lib/utils";
import { ListSkeleton } from "@/components/common/Skeletons";
import type { AuditLog } from "@/types";

const ACTION_DOT: Partial<Record<AuditLog["action"], string>> = {
  create: "bg-info",
  update: "bg-neutral",
  approve: "bg-success",
  submit: "bg-info",
  return: "bg-warning",
  escalate: "bg-danger",
  acknowledge: "bg-success",
  sync: "bg-violet-500",
  assign: "bg-info",
  override: "bg-warning",
  ai_usage: "bg-violet-500",
  export: "bg-neutral",
  settings_change: "bg-warning",
};

const ACTION_LABEL: Partial<Record<AuditLog["action"], string>> = {
  create: "Created",
  update: "Updated",
  approve: "Approved",
  submit: "Submitted",
  return: "Returned",
  escalate: "Escalated",
  acknowledge: "Acknowledged",
  sync: "Received",
  assign: "Assigned",
  override: "Overridden",
  ai_usage: "AI",
  export: "Exported",
  settings_change: "Settings",
};

/**
 * Per-record audit trail (RFQ 5.4 — "ghi vết vĩnh viễn"). Reads the live
 * audit log filtered to one entity; entries are append-only.
 */
export function EntityHistory({
  entityId,
  emptyText = "No recorded actions yet.",
}: {
  entityId: string;
  emptyText?: string;
}) {
  const { data, isPending } = useEntityHistory(entityId);
  const items = data?.items ?? [];

  if (isPending) return <ListSkeleton items={4} />;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Lock className="size-3.5" aria-hidden="true" />
        Immutable audit trail — entries cannot be edited or deleted.
      </div>
      {items.length === 0 ? (
        <div className="flex items-center gap-2 rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
          <History className="size-4" aria-hidden="true" />
          {emptyText}
        </div>
      ) : (
        <ol className="relative space-y-3 border-l border-border pl-5">
          {items.map((log) => (
            <li key={log.id} className="relative">
              <span
                className={cn(
                  "absolute -left-[1.6rem] top-1.5 size-2.5 rounded-full ring-4 ring-background",
                  ACTION_DOT[log.action] ?? "bg-neutral",
                )}
                aria-hidden="true"
              />
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <span className="text-xs font-semibold">
                  {ACTION_LABEL[log.action] ?? log.action}
                </span>
                <span className="text-xs text-muted-foreground">
                  {format(parseISO(log.timestamp), "dd/MM/yyyy HH:mm")} ·{" "}
                  {log.userName}
                </span>
              </div>
              {log.details && (
                <p className="mt-0.5 text-sm text-foreground/90">
                  {log.details}
                </p>
              )}
              {log.changes && log.changes.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {log.changes.map((c) => (
                    <span
                      key={c.field}
                      className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground"
                    >
                      {c.field}: {c.before || "∅"} → {c.after || "∅"}
                    </span>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
