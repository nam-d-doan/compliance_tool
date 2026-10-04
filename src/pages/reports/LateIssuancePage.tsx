import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { format, parseISO, differenceInCalendarDays } from "date-fns";
import {
  AlarmClock,
  AlertTriangle,
  Download,
  Siren,
  Timer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHero, ChartGrid } from "@/components/common";
import { KPICard } from "@/components/common/KPICard";
import { LoadingState } from "@/components/common/LoadingState";
import { BarChartCard } from "@/components/charts/BarChartCard";
import {
  Callout,
  PagePurpose,
  RevisionHealthBadge,
  RfqChip,
} from "@/components/cms";
import { useRevisions } from "@/hooks/queries";
import { useClientAudit } from "@/hooks/mutations";
import { demoNow } from "@/stores";
import {
  MAPPING_ACTION_SHORT,
  REVISION_STATUS_LABELS,
  daysUntil,
  getRevisionHealth,
} from "@/lib/cms-rules";
import { downloadCsv } from "@/lib/export";
import { cn } from "@/lib/utils";

/**
 * Late-issuance risk report (RFQ 2.3 — báo cáo cảnh báo rủi ro vi phạm tiến
 * độ/chậm trễ ban hành so với thời gian hiệu lực của pháp luật).
 */
export default function LateIssuancePage() {
  const navigate = useNavigate();
  const { data, isPending } = useRevisions();
  const audit = useClientAudit();
  const now = demoNow();

  const rows = useMemo(
    () =>
      (data ?? []).map((r) => {
        const health = getRevisionHealth(r, now);
        const lateVsLaw =
          r.status === "issued" && r.issuedAt
            ? differenceInCalendarDays(
                parseISO(r.issuedAt),
                parseISO(r.lawEffectiveDate),
              )
            : differenceInCalendarDays(
                parseISO(r.expectedIssueDate),
                parseISO(r.lawEffectiveDate),
              );
        return { ...r, health, lateVsLaw };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, now.toDateString()],
  );

  if (isPending) return <LoadingState message="Loading revisions…" />;

  const atRisk = rows
    .filter((r) => r.health === "overdue" || r.health === "late_risk")
    .sort((a, b) =>
      a.health === b.health
        ? a.committedDate.localeCompare(b.committedDate)
        : a.health === "overdue"
          ? -1
          : 1,
    );
  const issuedLate = rows.filter(
    (r) => r.status === "issued" && r.lateVsLaw > 0,
  );
  const overdue = rows.filter((r) => r.health === "overdue");
  const exposed = rows.filter(
    (r) => r.status !== "issued" && daysUntil(r.lawEffectiveDate, now) < 0,
  );
  const avgLate = overdue.length
    ? Math.round(
        overdue.reduce((s, r) => s - daysUntil(r.committedDate, now), 0) /
          overdue.length,
      )
    : 0;

  const byUnit = Array.from(
    atRisk
      .reduce((m, r) => {
        const row = m.get(r.leadUnitName) ?? {
          name: r.leadUnitName.replace("Khối ", ""),
          Overdue: 0,
          "Late risk": 0,
        };
        if (r.health === "overdue") row.Overdue++;
        else row["Late risk"]++;
        return m.set(r.leadUnitName, row);
      }, new Map<string, { name: string; Overdue: number; "Late risk": number }>())
      .values(),
  );

  const exportCsv = () => {
    downloadCsv(`Bao_cao_canh_bao_cham_ban_hanh_${format(now, "yyyyMMdd")}`, [
      [
        "QĐNB",
        "Title",
        "Action",
        "Law",
        "Lead unit",
        "Status",
        "Alert",
        "Committed date",
        "Forecast issue",
        "Law effective",
        "Days late vs law (forecast)",
      ],
      ...atRisk.map((r) => [
        r.qdnbCode,
        r.qdnbTitle,
        MAPPING_ACTION_SHORT[r.action],
        r.sources.map((s) => s.docNumber).join("; "),
        r.leadUnitName,
        REVISION_STATUS_LABELS[r.status],
        r.health === "overdue" ? "Overdue" : "Late risk",
        format(parseISO(r.committedDate), "dd/MM/yyyy"),
        format(parseISO(r.expectedIssueDate), "dd/MM/yyyy"),
        format(parseISO(r.lawEffectiveDate), "dd/MM/yyyy"),
        r.lateVsLaw,
      ]),
    ]);
    audit.mutate({
      action: "export",
      module: "report",
      object: "Late issuance alert report",
      details: `${atRisk.length} rows exported to Excel (CSV)`,
    });
  };

  return (
    <div className="space-y-6">
      <PageHero
        title="Late Issuance Alerts"
        subtitle="Báo cáo cảnh báo chậm ban hành — internal regulations at risk of being issued after the law takes effect or after the committed date."
      >
        <div className="flex items-center gap-2">
          <RfqChip code="2.3" />
          <Button variant="outline" onClick={exportCsv}>
            <Download className="size-4" /> Export Excel
          </Button>
        </div>
      </PageHero>
      <PagePurpose>
        Generated automatically every day by the scheduler. Overdue items are
        also escalated according to the escalation rules and appear in the Early
        Warning System.
      </PagePurpose>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KPICard
          label="Overdue revisions"
          value={overdue.length}
          subtitle={`avg ${avgLate} day(s) late`}
          icon={Siren}
          iconClassName="bg-danger-bg text-danger"
        />
        <KPICard
          label="Late-issuance risk"
          value={atRisk.length - overdue.length}
          subtitle="forecast after deadline"
          icon={AlertTriangle}
          iconClassName="bg-warning-bg text-warning"
        />
        <KPICard
          label="Law in force, QĐNB not issued"
          value={exposed.length}
          subtitle="regulatory exposure now"
          icon={AlarmClock}
          iconClassName="bg-danger-bg text-danger"
        />
        <KPICard
          label="Issued late (history)"
          value={issuedLate.length}
          subtitle="after the effective date"
          icon={Timer}
          iconClassName="bg-neutral-bg text-neutral"
        />
      </div>

      {exposed.length > 0 && (
        <Callout
          tone="danger"
          title={`${exposed.length} law(s) already in force without an updated internal regulation`}
        >
          {exposed
            .map((r) => `${r.qdnbCode} (${r.sources[0]?.docNumber})`)
            .join(" · ")}
        </Callout>
      )}

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Alert</th>
                <th className="px-4 py-3 font-medium">QĐNB</th>
                <th className="px-4 py-3 font-medium">Because of</th>
                <th className="px-4 py-3 font-medium">Lead unit</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Committed</th>
                <th className="px-4 py-3 font-medium">Forecast</th>
                <th className="px-4 py-3 font-medium">Law effective</th>
                <th className="px-4 py-3 font-medium">Gap vs law</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {atRisk.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => r.qdnbId && navigate(`/qdnb/${r.qdnbId}`)}
                  className="cursor-pointer hover:bg-muted/50"
                >
                  <td className="px-4 py-3">
                    <RevisionHealthBadge health={r.health} />
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-mono text-xs font-semibold">
                      {r.qdnbCode}
                    </p>
                    <p className="line-clamp-1 max-w-xs">{r.qdnbTitle}</p>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {r.sources.map((s) => s.docNumber).join(", ")}
                  </td>
                  <td className="px-4 py-3">{r.leadUnitName}</td>
                  <td className="px-4 py-3">
                    {REVISION_STATUS_LABELS[r.status]} · {r.progress}%
                  </td>
                  <td
                    className={cn(
                      "px-4 py-3 whitespace-nowrap",
                      r.health === "overdue" && "font-semibold text-danger",
                    )}
                  >
                    {format(parseISO(r.committedDate), "dd/MM/yyyy")}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {format(parseISO(r.expectedIssueDate), "dd/MM/yyyy")}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {format(parseISO(r.lawEffectiveDate), "dd/MM/yyyy")}
                  </td>
                  <td
                    className={cn(
                      "px-4 py-3 whitespace-nowrap font-semibold",
                      r.lateVsLaw > 0 ? "text-danger" : "text-success",
                    )}
                  >
                    {r.lateVsLaw > 0
                      ? `+${r.lateVsLaw}d late`
                      : `${-r.lateVsLaw}d early`}
                  </td>
                </tr>
              ))}
              {!atRisk.length && (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    No revision at risk — all internal regulations are on track.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ChartGrid className="xl:grid-cols-2">
        <BarChartCard
          title="At-risk revisions by lead unit"
          data={byUnit}
          xKey="name"
          yKeys={[
            { key: "Overdue", name: "Overdue", color: "#ef4444" },
            { key: "Late risk", name: "Late risk", color: "#f59e0b" },
          ]}
          height={240}
          className="h-full"
        />
        <BarChartCard
          title="Issued revisions — days vs law effective date"
          subtitle="Negative = issued before the law took effect"
          data={rows
            .filter((r) => r.status === "issued")
            .map((r) => ({
              name: r.qdnbCode.split(" ")[1]?.split("/")[0] ?? r.code,
              Days: r.lateVsLaw,
            }))}
          xKey="name"
          yKeys={[
            { key: "Days", name: "Days vs effective date", color: "#6366f1" },
          ]}
          height={240}
          className="h-full"
        />
      </ChartGrid>
    </div>
  );
}
