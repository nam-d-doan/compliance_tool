import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { format, parseISO, subMonths } from "date-fns";
import { Repeat, Sparkles, TrendingDown, TrendingUp } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AreaChartCard } from "@/components/charts/AreaChartCard";
import { BarChartCard } from "@/components/charts/BarChartCard";
import { ChartGrid } from "@/components/common";
import { PriorityBadge } from "@/components/common/PriorityBadge";
import { Callout, SourceBadge } from "@/components/cms";
import { ISSUE_SOURCE_SHORT, daysUntil } from "@/lib/cms-rules";
import { demoNow } from "@/stores";
import { cn } from "@/lib/utils";
import type { NonComplianceCase } from "@/types";

/** Short label for long category names in the heat map header. */
const shortCat = (c: string) =>
  c.split(/[/(&]/)[0].trim().replace("customer identification", "").trim();

export interface UnitProfile {
  unitId: string;
  unitName: string;
  score: number;
  open: number;
  overdue: number;
  high: number;
  fromIcis: number;
  repeats: number;
  last90: number;
  prev90: number;
}

/** Unit compliance risk profile (RFQ 3.2-ii): 0 = clean, 100 = worst. */
export function buildUnitProfiles(issues: NonComplianceCase[]): UnitProfile[] {
  const now = demoNow();
  const map = new Map<string, NonComplianceCase[]>();
  issues.forEach((i) =>
    map.set(i.ownerUnitId, [...(map.get(i.ownerUnitId) ?? []), i]),
  );
  return Array.from(map.entries())
    .map(([unitId, list]) => {
      const open = list.filter((i) => i.status === "Open");
      const overdue = open.filter((i) => daysUntil(i.dueDate, now) < 0).length;
      const high = open.filter((i) => i.risk.finalLevel === "high").length;
      const repeats = list.filter((i) => i.repeatCount >= 2).length;
      const age = (i: NonComplianceCase) =>
        (now.getTime() - parseISO(i.createdAt).getTime()) / 86400000;
      const last90 = list.filter((i) => age(i) <= 90).length;
      const prev90 = list.filter((i) => age(i) > 90 && age(i) <= 180).length;
      const avgOpenScore = open.length
        ? open.reduce((s, i) => s + i.risk.weightedScore, 0) / open.length
        : 0;
      const score = Math.min(
        100,
        Math.round(
          avgOpenScore * 10 +
            open.length * 6 +
            overdue * 8 +
            high * 10 +
            repeats * 5,
        ),
      );
      return {
        unitId,
        unitName: list[0].ownerUnitName,
        score,
        open: open.length,
        overdue,
        high,
        fromIcis: list.filter((i) => i.source === "icis").length,
        repeats,
        last90,
        prev90,
      };
    })
    .sort((a, b) => b.score - a.score);
}

export function IssueTrends({ issues }: { issues: NonComplianceCase[] }) {
  const profiles = useMemo(() => buildUnitProfiles(issues), [issues]);
  const [selected, setSelected] = useState<string | null>(null);
  const profile = profiles.find(
    (p) => p.unitId === (selected ?? profiles[0]?.unitId),
  );

  const categories = useMemo(
    () => Array.from(new Set(issues.map((i) => i.category))).sort(),
    [issues],
  );
  const units = profiles.map((p) => ({ id: p.unitId, name: p.unitName }));
  const cell = (u: string, c: string) =>
    issues.filter((i) => i.ownerUnitId === u && i.category === c).length;
  const maxCell = Math.max(
    1,
    ...units.flatMap((u) => categories.map((c) => cell(u.id, c))),
  );

  const monthly = useMemo(() => {
    const now = demoNow();
    return Array.from({ length: 8 }, (_, k) => {
      const m = subMonths(now, 7 - k);
      const key = format(m, "MM/yyyy");
      return {
        name: format(m, "MMM yy"),
        Opened: issues.filter(
          (i) => format(parseISO(i.createdAt), "MM/yyyy") === key,
        ).length,
        Closed: issues.filter(
          (i) => i.closedAt && format(parseISO(i.closedAt), "MM/yyyy") === key,
        ).length,
      };
    });
  }, [issues]);

  const bySource = useMemo(() => {
    const counts = new Map<
      string,
      { name: string; Open: number; Closed: number }
    >();
    issues.forEach((i) => {
      const k = ISSUE_SOURCE_SHORT[i.source];
      const row = counts.get(k) ?? { name: k, Open: 0, Closed: 0 };
      if (i.status === "Open") row.Open++;
      else row.Closed++;
      counts.set(k, row);
    });
    return Array.from(counts.values());
  }, [issues]);

  const repeats = issues
    .filter((i) => i.repeatCount >= 2)
    .sort((a, b) => b.repeatCount - a.repeatCount);

  const worstCat = categories
    .map((c) => ({
      c,
      n: issues.filter((i) => i.category === c && i.status === "Open").length,
    }))
    .sort((a, b) => b.n - a.n)[0];

  return (
    <div className="space-y-5">
      {profile && worstCat && (
        <Callout tone="ai" title="AI insight">
          {profile.unitName} has the highest compliance risk score (
          {profile.score}/100) with {profile.open} open issue(s)
          {profile.repeats ? `, ${profile.repeats} of them repeated` : ""}.
          Across the bank, “{worstCat.c}” is the most frequent open category (
          {worstCat.n}) — consider a focused review and a system control (chốt
          chặn) to prevent recurrence.
        </Callout>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Violation heat map — unit × category</CardTitle>
          <CardDescription>
            Issues in the last 12 months, all sources. Click a unit to see its
            risk profile.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-separate border-spacing-1 text-xs">
            <thead>
              <tr>
                <th className="w-44 text-left font-medium text-muted-foreground">
                  Unit
                </th>
                {categories.map((c) => (
                  <th
                    key={c}
                    className="px-1 text-center font-medium text-muted-foreground"
                    title={c}
                  >
                    <span className="line-clamp-2">{shortCat(c) || c}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {units.map((u) => (
                <tr key={u.id}>
                  <td>
                    <button
                      type="button"
                      onClick={() => setSelected(u.id)}
                      className={cn(
                        "w-full truncate rounded px-1.5 py-1 text-left hover:bg-muted",
                        profile?.unitId === u.id && "bg-muted font-semibold",
                      )}
                    >
                      {u.name}
                    </button>
                  </td>
                  {categories.map((c) => {
                    const n = cell(u.id, c);
                    const t = n / maxCell;
                    return (
                      <td key={c} className="text-center">
                        <div
                          className={cn(
                            "flex h-8 items-center justify-center rounded-md font-semibold",
                            n === 0 && "bg-muted/40 text-muted-foreground/40",
                          )}
                          style={
                            n
                              ? {
                                  background: `rgba(220, 38, 38, ${0.12 + t * 0.7})`,
                                  color: t > 0.5 ? "#fff" : undefined,
                                }
                              : undefined
                          }
                          title={`${u.name} · ${c}: ${n}`}
                        >
                          {n || "·"}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        {profile && (
          <Card>
            <CardHeader>
              <CardTitle>Unit compliance risk profile</CardTitle>
              <CardDescription>
                {profile.unitName} · updated from ICIS and other sources
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div
                  className="relative flex size-24 items-center justify-center rounded-full"
                  style={{
                    background: `conic-gradient(${profile.score >= 60 ? "#dc2626" : profile.score >= 35 ? "#d97706" : "#16a34a"} ${profile.score * 3.6}deg, var(--muted) 0deg)`,
                  }}
                >
                  <div className="flex size-[4.6rem] flex-col items-center justify-center rounded-full bg-card">
                    <span className="text-2xl font-black">{profile.score}</span>
                    <span className="text-[10px] text-muted-foreground">
                      / 100
                    </span>
                  </div>
                </div>
                <div className="space-y-1 text-sm">
                  <p className="flex items-center gap-1.5">
                    {profile.last90 > profile.prev90 ? (
                      <TrendingUp className="size-4 text-danger" />
                    ) : (
                      <TrendingDown className="size-4 text-success" />
                    )}
                    {profile.last90} new issue(s) in 90 days (prev.{" "}
                    {profile.prev90})
                  </p>
                  <p className="text-muted-foreground">
                    {profile.fromIcis} from ICIS findings
                  </p>
                </div>
              </div>
              <dl className="grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-lg border border-border p-2">
                  <dt className="text-xs text-muted-foreground">Open</dt>
                  <dd className="font-semibold">{profile.open}</dd>
                </div>
                <div className="rounded-lg border border-border p-2">
                  <dt className="text-xs text-muted-foreground">Overdue</dt>
                  <dd
                    className={cn(
                      "font-semibold",
                      profile.overdue && "text-danger",
                    )}
                  >
                    {profile.overdue}
                  </dd>
                </div>
                <div className="rounded-lg border border-border p-2">
                  <dt className="text-xs text-muted-foreground">
                    High risk open
                  </dt>
                  <dd
                    className={cn(
                      "font-semibold",
                      profile.high && "text-danger",
                    )}
                  >
                    {profile.high}
                  </dd>
                </div>
                <div className="rounded-lg border border-border p-2">
                  <dt className="text-xs text-muted-foreground">Repeated</dt>
                  <dd className="font-semibold">{profile.repeats}</dd>
                </div>
              </dl>
              <div className="space-y-1">
                {issues
                  .filter(
                    (i) =>
                      i.ownerUnitId === profile.unitId && i.status === "Open",
                  )
                  .slice(0, 4)
                  .map((i) => (
                    <Link
                      key={i.id}
                      to={`/ncc/${i.id}`}
                      className="flex items-center gap-2 rounded-md p-1.5 text-xs hover:bg-muted"
                    >
                      <PriorityBadge priority={i.risk.finalLevel} />
                      <span className="truncate">{i.title}</span>
                    </Link>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Repeat className="size-4" /> Repeat violations
            </CardTitle>
            <CardDescription>
              Same category in the same unit within 12 months — candidates for
              systemic fixes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {repeats.map((i) => (
              <Link
                key={i.id}
                to={`/ncc/${i.id}`}
                className="flex flex-wrap items-center gap-2 rounded-lg border border-border p-2.5 text-sm hover:bg-muted/50"
              >
                <span
                  className={cn(
                    "rounded-md px-2 py-0.5 text-xs font-bold",
                    i.repeatCount >= 3
                      ? "bg-danger-bg text-danger"
                      : "bg-warning-bg text-warning",
                  )}
                >
                  Repeated {i.repeatCount}×
                </span>
                <span className="min-w-0 flex-1 truncate">{i.title}</span>
                <span className="text-xs text-muted-foreground">
                  {i.ownerUnitName}
                </span>
                <SourceBadge source={i.source} />
              </Link>
            ))}
            {!repeats.length && (
              <p className="text-sm text-muted-foreground">
                No repeated violations.
              </p>
            )}
            <p className="flex items-center gap-1.5 pt-1 text-[11px] text-violet-600 dark:text-violet-300">
              <Sparkles className="size-3" /> Repeats raise the “Recurrence”
              score in the Risk Rating Matrix automatically.
            </p>
          </CardContent>
        </Card>
      </div>

      <ChartGrid className="xl:grid-cols-2">
        <AreaChartCard
          title="Opened vs closed"
          subtitle="Last 8 months"
          data={monthly}
          xKey="name"
          yKeys={[
            { key: "Opened", name: "Opened", color: "#ef4444" },
            { key: "Closed", name: "Closed", color: "#10b981" },
          ]}
          height={240}
          className="h-full"
        />
        <BarChartCard
          title="Issues by source"
          subtitle="Open and closed"
          data={bySource}
          xKey="name"
          yKeys={[
            { key: "Open", name: "Open", color: "#f59e0b" },
            { key: "Closed", name: "Closed", color: "#10b981" },
          ]}
          height={240}
          className="h-full"
        />
      </ChartGrid>
    </div>
  );
}
