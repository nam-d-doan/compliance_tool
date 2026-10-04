import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import {
  CheckCircle2,
  ClipboardCheck,
  Download,
  Inbox,
  Siren,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PageHero, ChartGrid } from "@/components/common";
import { KPICard } from "@/components/common/KPICard";
import { PriorityBadge } from "@/components/common/PriorityBadge";
import { LoadingState } from "@/components/common/LoadingState";
import { BarChartCard } from "@/components/charts/BarChartCard";
import { PieChartCard } from "@/components/charts/PieChartCard";
import { Callout, PagePurpose, RfqChip } from "@/components/cms";
import { buildUnitProfiles } from "@/components/ncc/IssueTrends";
import { useIcisFindings, useNCCList } from "@/hooks/queries";
import { useClientAudit } from "@/hooks/mutations";
import { demoNow } from "@/stores";
import { daysUntil, ISSUE_STAGE_LABELS } from "@/lib/cms-rules";
import { downloadCsv } from "@/lib/export";
import { cn } from "@/lib/utils";

/**
 * Dashboard of compliance issues from the internal control department
 * (RFQ 5.3-ii): issues raised by P.KTKSNB through ICIS, remediation progress
 * per unit and region.
 */
export default function InternalControlDashboardPage() {
  const issuesQuery = useNCCList({}, 1, 500);
  const icisQuery = useIcisFindings();
  const audit = useClientAudit();
  const [scope, setScope] = useState<"icis" | "all">("icis");
  const now = demoNow();

  const issues = useMemo(() => {
    const all = issuesQuery.data?.items ?? [];
    return scope === "icis" ? all.filter((i) => i.source === "icis") : all;
  }, [issuesQuery.data, scope]);

  if (issuesQuery.isPending || icisQuery.isPending) {
    return <LoadingState message="Loading internal control dashboard…" />;
  }

  const open = issues.filter((i) => i.status === "Open");
  const closed = issues.filter((i) => i.status === "Closed");
  const overdue = open.filter((i) => daysUntil(i.dueDate, now) < 0);
  const completion = issues.length
    ? Math.round((closed.length / issues.length) * 100)
    : 0;
  const findings = icisQuery.data ?? [];

  const byRegion = ["Miền Bắc", "Miền Trung", "Miền Nam", "Hội sở"].map(
    (region) => {
      const list = issues.filter(
        (i) => (i.ownerUnitRegion ?? "Hội sở") === region,
      );
      return {
        name: region,
        Open: list.filter((i) => i.status === "Open").length,
        Closed: list.filter((i) => i.status === "Closed").length,
      };
    },
  );

  const units = buildUnitProfiles(issues);
  const unitRows = units.map((u) => {
    const list = issues.filter((i) => i.ownerUnitId === u.unitId);
    const done = list.filter((i) => i.status === "Closed").length;
    return {
      ...u,
      total: list.length,
      done,
      rate: list.length ? Math.round((done / list.length) * 100) : 0,
    };
  });

  const byStage = (["check", "evidence", "review", "approval"] as const).map(
    (s) => ({
      name: ISSUE_STAGE_LABELS[s],
      Issues: open.filter((i) => i.workflow.stage === s).length,
    }),
  );

  const exportCsv = () => {
    downloadCsv(`Dashboard_van_de_KTKSNB_${format(now, "yyyyMMdd")}`, [
      [
        "Unit",
        "Total issues",
        "Open",
        "Overdue",
        "High risk open",
        "Closed",
        "Completion %",
        "Risk score",
      ],
      ...unitRows.map((u) => [
        u.unitName,
        u.total,
        u.open,
        u.overdue,
        u.high,
        u.done,
        u.rate,
        u.score,
      ]),
    ]);
    audit.mutate({
      action: "export",
      module: "report",
      object: "Internal control issues dashboard",
      details: `${unitRows.length} units exported to Excel (CSV)`,
    });
  };

  return (
    <div className="space-y-6">
      <PageHero
        title="Internal Control Issues Dashboard"
        subtitle="Dashboard theo dõi các vấn đề tuân thủ hình thành từ kết quả kiểm tra, giám sát của P.KTKSNB — compliance status and remediation progress of every unit."
      >
        <div className="flex flex-wrap items-center gap-2">
          <RfqChip code="5.3-ii" />
          <div className="inline-flex items-center gap-1 rounded-lg bg-muted p-1">
            {(["icis", "all"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setScope(s)}
                className={cn(
                  "h-8 rounded-md px-3 text-xs font-semibold",
                  scope === s
                    ? "bg-background shadow-sm"
                    : "text-muted-foreground",
                )}
              >
                {s === "icis" ? "From P.KTKSNB (ICIS)" : "All sources"}
              </button>
            ))}
          </div>
          <Button variant="outline" onClick={exportCsv}>
            <Download className="size-4" /> Export Excel
          </Button>
        </div>
      </PageHero>
      <PagePurpose>
        Shared view for the departments and senior management. Data comes from
        ICIS automatically; completion rates update as units close their issues.
      </PagePurpose>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KPICard
          label="ICIS findings received"
          value={findings.length}
          subtitle={`${findings.filter((f) => f.status === "pending").length} waiting for intake`}
          icon={Inbox}
          iconClassName="bg-violet-500/10 text-violet-600"
        />
        <KPICard
          label="Issues"
          value={issues.length}
          subtitle={`${open.length} open`}
          icon={ClipboardCheck}
          iconClassName="bg-info-bg text-info"
        />
        <KPICard
          label="Remediation completion"
          value={`${completion}%`}
          subtitle={`${closed.length} closed`}
          icon={CheckCircle2}
          iconClassName="bg-success-bg text-success"
        />
        <KPICard
          label="Overdue"
          value={overdue.length}
          subtitle="past due date"
          icon={Siren}
          iconClassName="bg-danger-bg text-danger"
        />
        <KPICard
          label="High risk open"
          value={open.filter((i) => i.risk.finalLevel === "high").length}
          subtitle="escalated to BĐH & BKS"
          icon={TrendingUp}
          iconClassName="bg-danger-bg text-danger"
        />
      </div>

      {units[0] && (
        <Callout tone="ai" title="AI summary">
          Completion stands at {completion}% across {unitRows.length} units.{" "}
          {units[0].unitName} needs attention: risk score {units[0].score}/100,{" "}
          {units[0].open} open issue(s), {units[0].overdue} overdue.{" "}
          {overdue.length
            ? `${overdue.length} issue(s) are past due and follow the escalation ladder.`
            : "No issue is overdue."}
        </Callout>
      )}

      <ChartGrid>
        <BarChartCard
          title="By region"
          subtitle="Open vs closed"
          data={byRegion}
          xKey="name"
          yKeys={[
            { key: "Open", name: "Open", color: "#f59e0b" },
            { key: "Closed", name: "Closed", color: "#10b981" },
          ]}
          height={240}
          className="h-full"
        />
        <PieChartCard
          title="Open issues by risk level"
          data={(["high", "medium", "low"] as const).map((l) => ({
            name: l.charAt(0).toUpperCase() + l.slice(1),
            value: open.filter((i) => i.risk.finalLevel === l).length,
          }))}
          nameKey="name"
          valueKey="value"
          colors={["#ef4444", "#f59e0b", "#10b981"]}
          height={240}
          className="h-full"
        />
        <BarChartCard
          title="Open issues by stage"
          subtitle="Where remediation is waiting"
          data={byStage}
          xKey="name"
          yKeys={[{ key: "Issues", name: "Issues", color: "#6366f1" }]}
          height={240}
          className="h-full"
        />
      </ChartGrid>

      <Card>
        <CardHeader>
          <CardTitle>Remediation by unit</CardTitle>
          <CardDescription>
            Sorted by compliance risk score (worst first)
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-muted-foreground">
              <tr>
                <th className="py-2 pr-4 font-medium">Unit</th>
                <th className="py-2 pr-4 font-medium">Issues</th>
                <th className="py-2 pr-4 font-medium">Open</th>
                <th className="py-2 pr-4 font-medium">Overdue</th>
                <th className="py-2 pr-4 font-medium">High</th>
                <th className="w-48 py-2 pr-4 font-medium">Completion</th>
                <th className="py-2 font-medium">Risk score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {unitRows.map((u) => (
                <tr key={u.unitId}>
                  <td className="py-2 pr-4 font-medium">{u.unitName}</td>
                  <td className="py-2 pr-4">{u.total}</td>
                  <td className="py-2 pr-4">{u.open}</td>
                  <td
                    className={cn(
                      "py-2 pr-4",
                      u.overdue && "font-semibold text-danger",
                    )}
                  >
                    {u.overdue}
                  </td>
                  <td className="py-2 pr-4">
                    {u.high ? <PriorityBadge priority="high" /> : "—"}
                  </td>
                  <td className="py-2 pr-4">
                    <div className="flex items-center gap-2">
                      <Progress value={u.rate} className="h-1.5" />
                      <span className="text-xs tabular-nums">{u.rate}%</span>
                    </div>
                  </td>
                  <td className="py-2">
                    <span
                      className={cn(
                        "rounded-md px-2 py-0.5 text-xs font-bold",
                        u.score >= 60
                          ? "bg-danger-bg text-danger"
                          : u.score >= 35
                            ? "bg-warning-bg text-warning"
                            : "bg-success-bg text-success",
                      )}
                    >
                      {u.score}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Open issues needing attention</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5">
          {open
            .sort((a, b) => b.risk.weightedScore - a.risk.weightedScore)
            .slice(0, 8)
            .map((i) => {
              const d = daysUntil(i.dueDate, now);
              return (
                <Link
                  key={i.id}
                  to={`/ncc/${i.id}`}
                  className="flex flex-wrap items-center gap-2 rounded-lg border border-border p-2.5 text-sm hover:bg-muted/50"
                >
                  <PriorityBadge priority={i.risk.finalLevel} />
                  <span className="font-mono text-xs">{i.nccId}</span>
                  <span className="min-w-0 flex-1 truncate">{i.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {i.ownerUnitName}
                  </span>
                  <span className="text-xs">
                    {ISSUE_STAGE_LABELS[i.workflow.stage]}
                  </span>
                  <span
                    className={cn(
                      "text-xs",
                      d < 0 && "font-semibold text-danger",
                    )}
                  >
                    {d < 0 ? `${-d}d overdue` : `${d}d left`}
                  </span>
                </Link>
              );
            })}
        </CardContent>
      </Card>
    </div>
  );
}
