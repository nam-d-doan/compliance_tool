import { format, parseISO } from "date-fns";
import { CheckCircle2, Siren } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAcknowledgeEscalation } from "@/hooks/mutations";
import { useAuthStore } from "@/stores";
import { cn } from "@/lib/utils";
import type { EscalationRecord } from "@/types";

const LEVEL_STYLE: Record<1 | 2 | 3, string> = {
  1: "border-info/30 bg-info-bg/50",
  2: "border-warning/40 bg-warning-bg/50",
  3: "border-danger/40 bg-danger-bg/50",
};

const REASON_LABEL: Record<EscalationRecord["reason"], string> = {
  high_risk: "Risk level",
  overdue: "Overdue",
  late_issuance: "Late issuance",
  manual: "Manual",
};

/**
 * Escalation ladder for an issue or QĐNB revision (RFQ 3.3 / 4.3). Level 2+
 * escalations ask the recipient to acknowledge; executives and admins can
 * acknowledge level 3, compliance (owner) level 2.
 */
export function EscalationPanel({
  escalations,
  entityType,
  entityId,
}: {
  escalations: EscalationRecord[];
  entityType: "ncc" | "revision";
  entityId: string;
}) {
  const { role } = useAuthStore();
  const ack = useAcknowledgeEscalation();
  const sorted = [...escalations].sort((a, b) => b.at.localeCompare(a.at));

  const canAck = (e: EscalationRecord) =>
    e.level === 3
      ? role === "executive" || role === "admin"
      : role !== "approver" || e.level === 1;

  if (!sorted.length) {
    return (
      <p className="flex items-center gap-2 rounded-lg border border-dashed border-border p-3 text-sm text-muted-foreground">
        <CheckCircle2 className="size-4 text-success" aria-hidden="true" />
        No escalation — handled within the unit.
      </p>
    );
  }

  return (
    <ol className="space-y-2">
      {sorted.map((e) => (
        <li
          key={e.id}
          className={cn("rounded-lg border p-3", LEVEL_STYLE[e.level])}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Siren
                className={cn(
                  "size-4",
                  e.level === 3
                    ? "text-danger"
                    : e.level === 2
                      ? "text-warning"
                      : "text-info",
                )}
                aria-hidden="true"
              />
              <span className="text-sm font-semibold">
                Level {e.level} → {e.to}
              </span>
            </div>
            <span className="text-xs text-muted-foreground">
              {format(parseISO(e.at), "dd/MM/yyyy HH:mm")}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {REASON_LABEL[e.reason]}: {e.detail}
          </p>
          <div className="mt-2 flex items-center justify-between gap-2">
            {e.acknowledgedAt ? (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
                <CheckCircle2 className="size-3.5" aria-hidden="true" />
                Acknowledged by {e.acknowledgedBy} ·{" "}
                {format(parseISO(e.acknowledgedAt), "dd/MM HH:mm")}
              </span>
            ) : e.level >= 2 ? (
              <span className="text-xs font-medium text-danger">
                Awaiting acknowledgement
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">
                Notification only
              </span>
            )}
            {!e.acknowledgedAt && e.level >= 2 && canAck(e) && (
              <Button
                size="sm"
                variant="outline"
                className="h-7"
                disabled={ack.isPending}
                onClick={() =>
                  ack.mutate(
                    { entityType, entityId, escalationId: e.id },
                    {
                      onSuccess: () => toast.success("Escalation acknowledged"),
                    },
                  )
                }
              >
                Acknowledge
              </Button>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
