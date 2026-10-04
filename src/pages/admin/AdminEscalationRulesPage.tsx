import { useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { format, parseISO } from "date-fns";
import { ArrowRight, Clock, Siren } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHero } from "@/components/common";
import { PriorityBadge } from "@/components/common/PriorityBadge";
import { LoadingState } from "@/components/common/LoadingState";
import { AdminSubNav } from "@/components/admin/AdminSubNav";
import { PagePurpose, RfqChip, ToneBadge } from "@/components/cms";
import { useEscalationRules, useNCCList, useRevisions } from "@/hooks/queries";
import { useUpdateEscalationRule } from "@/hooks/mutations";
import { CHANNEL_LABELS } from "@/lib/cms-rules";
import { cn } from "@/lib/utils";
import type { EscalationRule, NotifyChannel } from "@/types";

const CHANNELS: NotifyChannel[] = ["in_app", "email", "teams", "sms"];
const LEVEL_TONE = { 1: "info", 2: "warning", 3: "danger" } as const;

export default function AdminEscalationRulesPage() {
  const rulesQuery = useEscalationRules();
  const update = useUpdateEscalationRule();
  const issues = useNCCList({}, 1, 500);
  const revisions = useRevisions();

  const rules = rulesQuery.data ?? [];
  const riskRules = rules.filter((r) => r.trigger === "risk_level");
  const overdueRules = rules
    .filter((r) => r.trigger === "overdue")
    .sort((a, b) => (a.overdueDays ?? 0) - (b.overdueDays ?? 0));

  const recent = useMemo(() => {
    const fromIssues = (issues.data?.items ?? []).flatMap((i) =>
      i.escalations.map((e) => ({
        e,
        label: i.nccId,
        title: i.title,
        url: `/ncc/${i.id}`,
      })),
    );
    const fromRevs = (revisions.data ?? []).flatMap((r) =>
      r.escalations.map((e) => ({
        e,
        label: r.qdnbCode,
        title: r.qdnbTitle,
        url: r.qdnbId ? `/qdnb/${r.qdnbId}` : "/qdnb",
      })),
    );
    return [...fromIssues, ...fromRevs]
      .sort((a, b) => b.e.at.localeCompare(a.e.at))
      .slice(0, 8);
  }, [issues.data, revisions.data]);

  const patch = (rule: EscalationRule, p: Partial<EscalationRule>) =>
    update.mutate(
      { id: rule.id, patch: p },
      { onSuccess: () => toast.success("Escalation rule updated") },
    );

  if (rulesQuery.isPending) {
    return (
      <div className="space-y-6">
        <AdminSubNav />
        <LoadingState message="Loading escalation rules…" />
      </div>
    );
  }

  const renderRow = (rule: EscalationRule) => (
    <tr key={rule.id} className={cn("align-top", !rule.active && "opacity-50")}>
      <td className="px-3 py-3">
        <div className="flex items-center gap-2">
          {rule.trigger === "risk_level" && rule.riskLevel ? (
            <PriorityBadge priority={rule.riskLevel} />
          ) : (
            <ToneBadge tone="warning" icon={Clock}>
              +{rule.overdueDays}d overdue
            </ToneBadge>
          )}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Applies to:{" "}
          {rule.appliesTo
            .map((a) => (a === "issue" ? "Issues" : "QĐNB revisions"))
            .join(", ")}
        </p>
      </td>
      <td className="px-3 py-3">
        <ToneBadge tone={LEVEL_TONE[rule.level]}>Level {rule.level}</ToneBadge>
        <p className="mt-1 text-sm font-medium">{rule.escalateTo}</p>
      </td>
      <td className="px-3 py-3">
        <div className="flex flex-wrap gap-1">
          {CHANNELS.map((c) => {
            const on = rule.channels.includes(c);
            return (
              <button
                key={c}
                type="button"
                onClick={() =>
                  patch(rule, {
                    channels: on
                      ? rule.channels.filter((x) => x !== c)
                      : [...rule.channels, c],
                  })
                }
                className={cn(
                  "rounded-md border px-2 py-0.5 text-xs",
                  on
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground",
                )}
              >
                {CHANNEL_LABELS[c]}
              </button>
            );
          })}
        </div>
      </td>
      <td className="px-3 py-3">
        <div className="flex items-center gap-1">
          <Input
            type="number"
            min={1}
            defaultValue={rule.slaHours}
            onBlur={(e) => {
              const v = Number(e.target.value);
              if (v > 0 && v !== rule.slaHours) patch(rule, { slaHours: v });
            }}
            className="h-8 w-16 text-right"
            aria-label="SLA hours"
          />
          <span className="text-xs text-muted-foreground">h</span>
        </div>
      </td>
      <td className="px-3 py-3">
        <label className="inline-flex cursor-pointer items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={rule.requireAck}
            onChange={(e) => patch(rule, { requireAck: e.target.checked })}
            className="accent-primary"
          />
          Require acknowledgement
        </label>
      </td>
      <td className="px-3 py-3">
        <label className="inline-flex cursor-pointer items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={rule.active}
            onChange={(e) => patch(rule, { active: e.target.checked })}
            className="accent-primary"
          />
          Active
        </label>
      </td>
    </tr>
  );

  const renderTable = (items: EscalationRule[]) => (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-left text-sm">
        <thead className="bg-muted/50 text-xs text-muted-foreground">
          <tr>
            <th className="px-3 py-2 font-medium">Trigger</th>
            <th className="px-3 py-2 font-medium">Escalate to</th>
            <th className="px-3 py-2 font-medium">Channels</th>
            <th className="px-3 py-2 font-medium">Inform within</th>
            <th className="px-3 py-2 font-medium">Acknowledgement</th>
            <th className="px-3 py-2 font-medium">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">{items.map(renderRow)}</tbody>
      </table>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <AdminSubNav />
      <PageHero
        title="Escalation Rules"
        subtitle="Quy trình leo thang — who is informed, how fast and on which channel, by risk level and by days overdue."
      >
        <div className="flex items-center gap-2">
          <RfqChip code="4.3" />
          <RfqChip code="3.3" />
        </div>
      </PageHero>
      <PagePurpose>
        The CMS applies these rules automatically. High-risk issues go straight
        to the Ban Điều hành and Ban Kiểm soát; overdue items climb one level at
        a time.
      </PagePurpose>

      <Card>
        <CardHeader>
          <CardTitle>The escalation ladder at a glance</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-border p-4">
            <p className="mb-3 text-xs font-semibold text-muted-foreground uppercase">
              By risk level (immediately when rated)
            </p>
            <div className="space-y-2">
              {riskRules.map((r) => (
                <div key={r.id} className="flex items-center gap-2 text-sm">
                  {r.riskLevel && <PriorityBadge priority={r.riskLevel} />}
                  <ArrowRight className="size-3.5 text-muted-foreground" />
                  <span className="font-medium">{r.escalateTo}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    ≤ {r.slaHours}h
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-border p-4">
            <p className="mb-3 text-xs font-semibold text-muted-foreground uppercase">
              By days overdue
            </p>
            <div className="flex items-stretch gap-1.5">
              {overdueRules.map((r, i) => (
                <div key={r.id} className="flex flex-1 items-center gap-1.5">
                  <div
                    className={cn(
                      "flex-1 rounded-lg border p-2 text-center",
                      r.level === 3
                        ? "border-danger/40 bg-danger-bg/50"
                        : r.level === 2
                          ? "border-warning/40 bg-warning-bg/50"
                          : "border-info/30 bg-info-bg/50",
                    )}
                  >
                    <p className="text-lg font-black">+{r.overdueDays}d</p>
                    <p className="text-[11px] leading-tight">{r.escalateTo}</p>
                  </div>
                  {i < overdueRules.length - 1 && (
                    <ArrowRight className="size-3.5 shrink-0 text-muted-foreground" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Rules by risk level</CardTitle>
          <CardDescription>
            Applied when an issue is rated or re-rated.
          </CardDescription>
        </CardHeader>
        <CardContent>{renderTable(riskRules)}</CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Rules for overdue items</CardTitle>
          <CardDescription>
            Checked by the daily scheduler for issues and QĐNB revisions.
          </CardDescription>
        </CardHeader>
        <CardContent>{renderTable(overdueRules)}</CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Siren className="size-4" /> Recent escalations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5">
          {recent.map(({ e, label, title, url }) => (
            <Link
              key={e.id}
              to={url}
              className="flex items-center gap-3 rounded-lg border border-border p-2.5 text-sm transition-colors hover:bg-muted/50"
            >
              <ToneBadge tone={LEVEL_TONE[e.level]}>L{e.level}</ToneBadge>
              <span className="w-28 shrink-0 font-mono text-xs">{label}</span>
              <span className="min-w-0 flex-1 truncate">{title}</span>
              <span className="hidden shrink-0 text-xs text-muted-foreground md:inline">
                {e.to}
              </span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {format(parseISO(e.at), "dd/MM HH:mm")}
              </span>
              {e.level >= 2 && (
                <ToneBadge tone={e.acknowledgedAt ? "success" : "danger"}>
                  {e.acknowledgedAt ? "Ack" : "Pending"}
                </ToneBadge>
              )}
            </Link>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
}
