import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { CheckCircle2, Clock, Siren, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/common";
import { KPICard } from "@/components/common/KPICard";
import { LoadingState } from "@/components/common/LoadingState";
import { PagePurpose, RfqChip, ToneBadge } from "@/components/cms";
import { useNCCList, useRevisions } from "@/hooks/queries";
import { useAcknowledgeEscalation } from "@/hooks/mutations";
import { useAuthStore } from "@/stores";
import { cn } from "@/lib/utils";
import type { EscalationRecord } from "@/types";

const REASON: Record<EscalationRecord["reason"], string> = {
  high_risk: "High risk level",
  overdue: "Overdue",
  late_issuance: "Late issuance",
  manual: "Manual",
};

/** All escalations in progress across issues and QĐNB revisions (RFQ 4.3). */
export default function EscalationsPage() {
  const { role } = useAuthStore();
  const issues = useNCCList({}, 1, 500);
  const revisions = useRevisions();
  const ack = useAcknowledgeEscalation();
  const [level, setLevel] = useState<0 | 1 | 2 | 3>(0);
  const [status, setStatus] = useState<"pending" | "all">("pending");

  const rows = useMemo(
    () =>
      [
        ...(issues.data?.items ?? []).flatMap((i) =>
          i.escalations.map((e) => ({
            e,
            type: "ncc" as const,
            entityId: i.id,
            label: i.nccId,
            title: i.title,
            unit: i.ownerUnitName,
            url: `/ncc/${i.id}`,
          })),
        ),
        ...(revisions.data ?? []).flatMap((r) =>
          r.escalations.map((e) => ({
            e,
            type: "revision" as const,
            entityId: r.id,
            label: r.qdnbCode,
            title: r.qdnbTitle,
            unit: r.leadUnitName,
            url: r.qdnbId ? `/qdnb/${r.qdnbId}` : "/qdnb",
          })),
        ),
      ].sort((a, b) => b.e.at.localeCompare(a.e.at)),
    [issues.data, revisions.data],
  );

  if (issues.isPending || revisions.isPending) {
    return <LoadingState message="Loading escalations…" />;
  }

  const visible = rows.filter(
    (r) =>
      (!level || r.e.level === level) &&
      (status === "all" || (r.e.level >= 2 && !r.e.acknowledgedAt)),
  );
  const canAck = (lvl: number) =>
    lvl === 3 ? role === "executive" || role === "admin" : role !== "approver";

  return (
    <div className="space-y-6">
      <PageHero
        title="Escalations"
        subtitle="Báo cáo vượt cấp — every issue and QĐNB revision escalated by risk level or by days overdue, and who still has to acknowledge it."
      >
        <RfqChip code="4.3" />
      </PageHero>
      <PagePurpose>
        Created automatically by the escalation rules. High-risk issues reach
        the Ban Điều hành & Ban Kiểm soát immediately.
      </PagePurpose>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KPICard
          label="Awaiting acknowledgement"
          value={
            rows.filter((r) => r.e.level >= 2 && !r.e.acknowledgedAt).length
          }
          icon={Clock}
          iconClassName="bg-danger-bg text-danger"
          onClick={() => setStatus("pending")}
        />
        <KPICard
          label="Level 3 — BĐH & BKS"
          value={rows.filter((r) => r.e.level === 3).length}
          icon={Siren}
          iconClassName="bg-danger-bg text-danger"
          onClick={() => {
            setLevel(3);
            setStatus("all");
          }}
        />
        <KPICard
          label="From high risk rating"
          value={rows.filter((r) => r.e.reason === "high_risk").length}
          icon={ShieldAlert}
          iconClassName="bg-warning-bg text-warning"
        />
        <KPICard
          label="Acknowledged"
          value={rows.filter((r) => r.e.acknowledgedAt).length}
          icon={CheckCircle2}
          iconClassName="bg-success-bg text-success"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex items-center gap-1 rounded-lg bg-muted p-1">
          {(["pending", "all"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              className={cn(
                "h-8 rounded-md px-3 text-xs font-semibold",
                status === s
                  ? "bg-background shadow-sm"
                  : "text-muted-foreground",
              )}
            >
              {s === "pending" ? "Awaiting acknowledgement" : "All escalations"}
            </button>
          ))}
        </div>
        <div className="inline-flex items-center gap-1 rounded-lg bg-muted p-1">
          {([0, 1, 2, 3] as const).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLevel(l)}
              className={cn(
                "h-8 rounded-md px-3 text-xs font-semibold",
                level === l
                  ? "bg-background shadow-sm"
                  : "text-muted-foreground",
              )}
            >
              {l === 0 ? "All levels" : `Level ${l}`}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Level</th>
                <th className="px-4 py-3 font-medium">Item</th>
                <th className="px-4 py-3 font-medium">Unit</th>
                <th className="px-4 py-3 font-medium">Reason</th>
                <th className="px-4 py-3 font-medium">Escalated to</th>
                <th className="px-4 py-3 font-medium">When</th>
                <th className="px-4 py-3 font-medium">Acknowledgement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {visible.map((r) => (
                <tr key={r.e.id} className="hover:bg-muted/40">
                  <td className="px-4 py-3">
                    <ToneBadge
                      tone={
                        r.e.level === 3
                          ? "danger"
                          : r.e.level === 2
                            ? "warning"
                            : "info"
                      }
                    >
                      L{r.e.level}
                    </ToneBadge>
                  </td>
                  <td className="px-4 py-3">
                    <Link to={r.url} className="hover:underline">
                      <span className="block font-mono text-xs font-semibold">
                        {r.label}
                      </span>
                      <span className="line-clamp-1 max-w-xs">{r.title}</span>
                    </Link>
                    <span className="text-[11px] text-muted-foreground">
                      {r.type === "ncc" ? "Compliance issue" : "QĐNB revision"}
                    </span>
                  </td>
                  <td className="px-4 py-3">{r.unit}</td>
                  <td className="px-4 py-3">
                    {REASON[r.e.reason]}
                    <span className="block text-xs text-muted-foreground">
                      {r.e.detail}
                    </span>
                  </td>
                  <td className="px-4 py-3">{r.e.to}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {format(parseISO(r.e.at), "dd/MM/yyyy HH:mm")}
                  </td>
                  <td className="px-4 py-3">
                    {r.e.acknowledgedAt ? (
                      <span className="text-xs text-success">
                        ✓ {r.e.acknowledgedBy} ·{" "}
                        {format(parseISO(r.e.acknowledgedAt), "dd/MM")}
                      </span>
                    ) : r.e.level < 2 ? (
                      <span className="text-xs text-muted-foreground">
                        Notification only
                      </span>
                    ) : canAck(r.e.level) ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7"
                        disabled={ack.isPending}
                        onClick={() =>
                          ack.mutate(
                            {
                              entityType: r.type,
                              entityId: r.entityId,
                              escalationId: r.e.id,
                            },
                            {
                              onSuccess: () =>
                                toast.success("Escalation acknowledged"),
                            },
                          )
                        }
                      >
                        Acknowledge
                      </Button>
                    ) : (
                      <span className="text-xs text-danger">
                        Pending ({r.e.level === 3 ? "Executive" : "Compliance"})
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {!visible.length && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    Nothing to show — all escalations acknowledged.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
