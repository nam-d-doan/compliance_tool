import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { format, parseISO } from "date-fns";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Network,
  Scale,
  Sparkles,
  Table2,
  BookMarked,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHero } from "@/components/common";
import { KPICard } from "@/components/common/KPICard";
import { LoadingState } from "@/components/common/LoadingState";
import {
  Callout,
  LEGAL_STATUS_TONE,
  PagePurpose,
  RevisionHealthBadge,
  RfqChip,
  ToneBadge,
} from "@/components/cms";
import {
  useLegalUpdates,
  useOrgUnits,
  useQdnbList,
  useRevisions,
} from "@/hooks/queries";
import {
  LEGAL_STATUS_LABELS,
  MAPPING_ACTION_LABELS,
  MAPPING_ACTION_SHORT,
  getRevisionHealth,
  type RevisionHealth,
} from "@/lib/cms-rules";
import { cn } from "@/lib/utils";
import type { LegalMapping, LegalUpdate, MappingAction } from "@/types";

const ACTION_COLOR: Record<MappingAction, string> = {
  amend: "#d97706",
  supplement: "#2563eb",
  replace: "#dc2626",
  repeal: "#6b7280",
  new: "#16a34a",
};

const HEALTH_DOT: Record<RevisionHealth, string> = {
  on_track: "#16a34a",
  late_risk: "#d97706",
  overdue: "#dc2626",
  issued: "#64748b",
};

interface Edge {
  id: string;
  law: LegalUpdate;
  mapping: LegalMapping;
  qKey: string;
  unitId?: string;
}

type Sel = { kind: "law" | "qdnb" | "unit"; id: string } | null;

export default function LegalMappingPage() {
  const navigate = useNavigate();
  const legal = useLegalUpdates();
  const qdnbs = useQdnbList();
  const revisions = useRevisions();
  const units = useOrgUnits();
  const [view, setView] = useState<"map" | "matrix">("map");
  const [showConfirmed, setShowConfirmed] = useState(true);
  const [showSuggested, setShowSuggested] = useState(true);
  const [search, setSearch] = useState("");
  const [sel, setSel] = useState<Sel>(null);
  const [hover, setHover] = useState<Sel>(null);

  const unitName = useMemo(
    () =>
      Object.fromEntries(
        (units.data?.allUnits ?? []).map((u) => [u.id, u.name]),
      ) as Record<string, string>,
    [units.data],
  );

  const edges: Edge[] = useMemo(
    () =>
      (legal.data ?? []).flatMap((law) =>
        law.mappings
          .filter(
            (m) =>
              m.status !== "rejected" &&
              ((m.status === "accepted" && showConfirmed) ||
                (m.status === "suggested" && showSuggested)),
          )
          .filter(
            (m) =>
              !search ||
              `${law.docNumber} ${law.title} ${m.qdnbCode} ${m.qdnbTitle}`
                .toLowerCase()
                .includes(search.toLowerCase()),
          )
          .map((m) => ({
            id: `${law.id}-${m.id}`,
            law,
            mapping: m,
            qKey: m.qdnbId ?? m.qdnbCode,
            unitId: m.leadUnitId,
          })),
      ),
    [legal.data, showConfirmed, showSuggested, search],
  );

  if (legal.isPending || qdnbs.isPending || revisions.isPending) {
    return <LoadingState message="Building the legal map…" />;
  }

  const laws = Array.from(
    new Map(edges.map((e) => [e.law.id, e.law])).values(),
  ).sort((a, b) => b.effectiveDate.localeCompare(a.effectiveDate));
  const qKeys = Array.from(
    new Map(edges.map((e) => [e.qKey, e.mapping])).entries(),
  ).map(([key, m]) => ({
    key,
    code: m.qdnbCode,
    title: m.qdnbTitle,
    qdnbId: m.qdnbId,
  }));
  const unitIds = Array.from(
    new Set(edges.map((e) => e.unitId).filter(Boolean)),
  ) as string[];

  const allMappings = (legal.data ?? []).flatMap((l) =>
    l.mappings.map((m) => ({ l, m })),
  );
  const pending = allMappings.filter(({ m }) => m.status === "suggested");

  const healthFor = (qdnbId?: string): RevisionHealth | undefined => {
    if (!qdnbId) return undefined;
    const r =
      (revisions.data ?? []).find(
        (x) => x.qdnbId === qdnbId && x.status !== "issued",
      ) ?? (revisions.data ?? []).find((x) => x.qdnbId === qdnbId);
    return r ? getRevisionHealth(r) : undefined;
  };

  // Highlighting: everything connected to the selected / hovered node.
  const focus = hover ?? sel;
  const related = (e: Edge) =>
    !focus ||
    (focus.kind === "law" && e.law.id === focus.id) ||
    (focus.kind === "qdnb" && e.qKey === focus.id) ||
    (focus.kind === "unit" && e.unitId === focus.id);
  const nodeOn = (kind: "law" | "qdnb" | "unit", id: string) =>
    !focus ||
    edges.some(
      (e) =>
        related(e) &&
        ((kind === "law" && e.law.id === id) ||
          (kind === "qdnb" && e.qKey === id) ||
          (kind === "unit" && e.unitId === id)),
    );

  // Layout
  const W = 1040;
  const rowQ = 50;
  const H = Math.max(
    360,
    Math.max(qKeys.length, laws.length * 1.4, unitIds.length) * rowQ + 60,
  );
  const col = { law: 16, q: 440, unit: 860 };
  const box = { law: 250, q: 270, unit: 170 };
  const y = (i: number, n: number) =>
    50 + ((H - 70) / Math.max(n, 1)) * (i + 0.5);

  const lawY = Object.fromEntries(
    laws.map((l, i) => [l.id, y(i, laws.length)]),
  );
  const qY = Object.fromEntries(
    qKeys.map((q, i) => [q.key, y(i, qKeys.length)]),
  );
  const uY = Object.fromEntries(
    unitIds.map((u, i) => [u, y(i, unitIds.length)]),
  );

  return (
    <div className="space-y-6">
      <PageHero
        title="Legal Mapping — Bản đồ mối quan hệ"
        subtitle="Every new law linked to the internal regulations (QĐNB) it requires to amend, supplement or replace, and to the units responsible. AI proposes the links; Compliance confirms them."
      >
        <RfqChip code="1.2" />
      </PageHero>
      <PagePurpose>
        Click any law, regulation or unit to highlight its connections. Dashed
        lines are AI suggestions still waiting for Compliance to confirm.
      </PagePurpose>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KPICard
          label="Laws mapped"
          value={
            new Set(
              allMappings
                .filter(({ m }) => m.status !== "rejected")
                .map(({ l }) => l.id),
            ).size
          }
          icon={Scale}
          iconClassName="bg-info-bg text-info"
        />
        <KPICard
          label="Internal regulations affected"
          value={
            new Set(
              allMappings
                .filter(({ m }) => m.status === "accepted")
                .map(({ m }) => m.qdnbCode),
            ).size
          }
          subtitle="confirmed links"
          icon={BookMarked}
          iconClassName="bg-warning-bg text-warning"
        />
        <KPICard
          label="AI suggestions to review"
          value={pending.length}
          icon={Sparkles}
          iconClassName="bg-violet-500/10 text-violet-600"
        />
        <KPICard
          label="Units involved"
          value={
            new Set(allMappings.map(({ m }) => m.leadUnitId).filter(Boolean))
              .size
          }
          icon={Building2}
          iconClassName="bg-success-bg text-success"
        />
      </div>

      {pending.length > 0 && (
        <Callout
          tone="ai"
          title={`${pending.length} AI mapping suggestion(s) waiting for Compliance`}
        >
          <div className="mt-1 flex flex-wrap gap-1.5">
            {Array.from(
              new Map(pending.map(({ l }) => [l.id, l])).values(),
            ).map((l) => (
              <Link
                key={l.id}
                to={`/legal-updates/${l.id}`}
                className="inline-flex items-center gap-1 rounded-md border border-violet-500/30 bg-background px-2 py-0.5 text-xs font-medium hover:bg-muted"
              >
                {l.docNumber} <ArrowRight className="size-3" />
              </Link>
            ))}
          </div>
        </Callout>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex items-center gap-1 rounded-lg bg-muted p-1">
          {(
            [
              ["map", "Relationship map", Network],
              ["matrix", "Matrix", Table2],
            ] as const
          ).map(([v, label, Icon]) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={cn(
                "flex h-8 items-center gap-1.5 rounded-md px-3 text-xs font-semibold",
                view === v
                  ? "bg-background shadow-sm"
                  : "text-muted-foreground",
              )}
            >
              <Icon className="size-3.5" /> {label}
            </button>
          ))}
        </div>
        <label className="inline-flex h-9 items-center gap-2 rounded-lg border border-input px-3 text-sm">
          <input
            type="checkbox"
            checked={showConfirmed}
            onChange={(e) => setShowConfirmed(e.target.checked)}
            className="accent-primary"
          />
          Confirmed
        </label>
        <label className="inline-flex h-9 items-center gap-2 rounded-lg border border-input px-3 text-sm">
          <input
            type="checkbox"
            checked={showSuggested}
            onChange={(e) => setShowSuggested(e.target.checked)}
            className="accent-primary"
          />
          AI suggestions
        </label>
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter by law or QĐNB…"
          className="h-9 max-w-xs"
        />
        {sel && (
          <Button variant="ghost" size="sm" onClick={() => setSel(null)}>
            <X className="size-3.5" /> Clear selection
          </Button>
        )}
      </div>

      {view === "map" ? (
        <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
          <Card className="overflow-hidden py-0">
            <CardContent className="overflow-x-auto p-2">
              <svg
                viewBox={`0 0 ${W} ${H}`}
                className="h-auto w-full min-w-[860px] text-foreground"
                role="img"
                aria-label="Legal relationship map"
              >
                {[
                  ["NEW LAWS", col.law],
                  ["INTERNAL REGULATIONS (QĐNB)", col.q],
                  ["LEAD UNITS", col.unit],
                ].map(([t, x]) => (
                  <text
                    key={t as string}
                    x={x as number}
                    y={22}
                    fontSize={11}
                    fontWeight={700}
                    fill="currentColor"
                    opacity={0.5}
                  >
                    {t}
                  </text>
                ))}

                {/* law → QĐNB edges */}
                {edges.map((e) => {
                  const y1 = lawY[e.law.id];
                  const y2 = qY[e.qKey];
                  const on = related(e);
                  return (
                    <g key={e.id} opacity={on ? 1 : 0.12}>
                      <path
                        d={`M ${col.law + box.law} ${y1} C ${col.q - 80} ${y1}, ${col.law + box.law + 80} ${y2}, ${col.q} ${y2}`}
                        fill="none"
                        stroke={ACTION_COLOR[e.mapping.action]}
                        strokeWidth={
                          e.mapping.status === "accepted" ? 2.4 : 1.6
                        }
                        strokeDasharray={
                          e.mapping.status === "suggested" ? "6 5" : undefined
                        }
                      />
                      {focus && on && (
                        <text
                          x={(col.law + box.law + col.q) / 2}
                          y={(y1 + y2) / 2 - 4}
                          fontSize={10}
                          fontWeight={700}
                          fill={ACTION_COLOR[e.mapping.action]}
                          textAnchor="middle"
                        >
                          {MAPPING_ACTION_SHORT[e.mapping.action]}
                        </text>
                      )}
                    </g>
                  );
                })}

                {/* QĐNB → unit edges */}
                {edges
                  .filter((e) => e.unitId)
                  .map((e) => (
                    <path
                      key={`u-${e.id}`}
                      d={`M ${col.q + box.q} ${qY[e.qKey]} C ${col.unit - 50} ${qY[e.qKey]}, ${col.q + box.q + 50} ${uY[e.unitId!]}, ${col.unit} ${uY[e.unitId!]}`}
                      fill="none"
                      stroke="currentColor"
                      strokeOpacity={related(e) ? 0.35 : 0.06}
                    />
                  ))}

                {/* law nodes */}
                {laws.map((l) => {
                  const yy = lawY[l.id];
                  const active = sel?.kind === "law" && sel.id === l.id;
                  return (
                    <g
                      key={l.id}
                      className="cursor-pointer"
                      opacity={nodeOn("law", l.id) ? 1 : 0.25}
                      onClick={() =>
                        setSel(active ? null : { kind: "law", id: l.id })
                      }
                      onMouseEnter={() => setHover({ kind: "law", id: l.id })}
                      onMouseLeave={() => setHover(null)}
                    >
                      <rect
                        x={col.law}
                        y={yy - 24}
                        width={box.law}
                        height={48}
                        rx={10}
                        fill={active ? "#0c3767" : "#123f73"}
                        stroke={active ? "#ffe600" : "transparent"}
                        strokeWidth={2}
                      />
                      <text
                        x={col.law + 12}
                        y={yy - 5}
                        fontSize={12.5}
                        fontWeight={800}
                        fill="#fff"
                      >
                        {l.docType} {l.docNumber}
                      </text>
                      <text
                        x={col.law + 12}
                        y={yy + 12}
                        fontSize={9.5}
                        fill="#cfe2ff"
                      >
                        {l.issuer} · effective{" "}
                        {format(parseISO(l.effectiveDate), "dd/MM/yyyy")}
                      </text>
                    </g>
                  );
                })}

                {/* QĐNB nodes */}
                {qKeys.map((q) => {
                  const yy = qY[q.key];
                  const h = healthFor(q.qdnbId);
                  const active = sel?.kind === "qdnb" && sel.id === q.key;
                  return (
                    <g
                      key={q.key}
                      className="cursor-pointer"
                      opacity={nodeOn("qdnb", q.key) ? 1 : 0.25}
                      onClick={() =>
                        setSel(active ? null : { kind: "qdnb", id: q.key })
                      }
                      onMouseEnter={() => setHover({ kind: "qdnb", id: q.key })}
                      onMouseLeave={() => setHover(null)}
                    >
                      <rect
                        x={col.q}
                        y={yy - 20}
                        width={box.q}
                        height={40}
                        rx={9}
                        className="fill-card"
                        stroke={active ? "#d4a800" : "currentColor"}
                        strokeOpacity={active ? 1 : 0.2}
                        strokeWidth={active ? 2 : 1}
                      />
                      {h && (
                        <circle
                          cx={col.q + box.q - 12}
                          cy={yy - 8}
                          r={4.5}
                          fill={HEALTH_DOT[h]}
                        />
                      )}
                      <text
                        x={col.q + 10}
                        y={yy - 4}
                        fontSize={11}
                        fontWeight={700}
                        fill="currentColor"
                      >
                        {q.code}
                      </text>
                      <text
                        x={col.q + 10}
                        y={yy + 11}
                        fontSize={9.5}
                        fill="currentColor"
                        opacity={0.65}
                      >
                        {q.title.length > 44
                          ? `${q.title.slice(0, 44)}…`
                          : q.title}
                      </text>
                    </g>
                  );
                })}

                {/* unit nodes */}
                {unitIds.map((u) => {
                  const yy = uY[u];
                  const active = sel?.kind === "unit" && sel.id === u;
                  const name = unitName[u] ?? u;
                  return (
                    <g
                      key={u}
                      className="cursor-pointer"
                      opacity={nodeOn("unit", u) ? 1 : 0.25}
                      onClick={() =>
                        setSel(active ? null : { kind: "unit", id: u })
                      }
                      onMouseEnter={() => setHover({ kind: "unit", id: u })}
                      onMouseLeave={() => setHover(null)}
                    >
                      <rect
                        x={col.unit}
                        y={yy - 16}
                        width={box.unit}
                        height={32}
                        rx={16}
                        className="fill-muted"
                        stroke={active ? "#d4a800" : "transparent"}
                        strokeWidth={2}
                      />
                      <text
                        x={col.unit + box.unit / 2}
                        y={yy + 4}
                        fontSize={10}
                        fontWeight={600}
                        textAnchor="middle"
                        fill="currentColor"
                      >
                        {name.length > 26 ? `${name.slice(0, 26)}…` : name}
                      </text>
                    </g>
                  );
                })}
              </svg>
              <div className="flex flex-wrap items-center gap-3 px-2 pb-2 text-[11px] text-muted-foreground">
                {(Object.keys(ACTION_COLOR) as MappingAction[]).map((a) => (
                  <span key={a} className="inline-flex items-center gap-1">
                    <span
                      className="h-0.5 w-5"
                      style={{ background: ACTION_COLOR[a] }}
                    />
                    {MAPPING_ACTION_LABELS[a]}
                  </span>
                ))}
                <span className="inline-flex items-center gap-1">
                  <span className="w-5 border-t-2 border-dashed border-current" />{" "}
                  AI suggestion
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="size-2 rounded-full bg-[#dc2626]" /> revision
                  overdue
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="size-2 rounded-full bg-[#d97706]" /> late
                  risk
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="size-2 rounded-full bg-[#16a34a]" /> on track
                </span>
              </div>
            </CardContent>
          </Card>

          <SidePanel
            sel={sel}
            edges={edges}
            unitName={unitName}
            healthFor={healthFor}
            onOpen={(to) => navigate(to)}
          />
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Mapping matrix</CardTitle>
            <CardDescription>
              Laws (rows) × internal regulations (columns). Solid = confirmed,
              dashed = AI suggestion. Click a cell to open the law.
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="border-separate border-spacing-1 text-xs">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 min-w-56 bg-card text-left font-medium text-muted-foreground">
                    Law
                  </th>
                  {qKeys.map((q) => (
                    <th
                      key={q.key}
                      className="min-w-24 px-1 align-bottom font-medium text-muted-foreground"
                      title={q.title}
                    >
                      <span className="block font-mono text-[10px]">
                        {q.code.split(" ")[1]?.split("/")[0] ?? q.code}
                      </span>
                      <span className="line-clamp-2 block text-[10px] font-normal">
                        {q.title}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {laws.map((l) => (
                  <tr key={l.id}>
                    <td className="sticky left-0 z-10 bg-card pr-2">
                      <Link
                        to={`/legal-updates/${l.id}`}
                        className="block rounded-md p-1.5 hover:bg-muted"
                      >
                        <span className="block font-semibold">
                          {l.docNumber}
                        </span>
                        <ToneBadge tone={LEGAL_STATUS_TONE[l.status]}>
                          {LEGAL_STATUS_LABELS[l.status]}
                        </ToneBadge>
                      </Link>
                    </td>
                    {qKeys.map((q) => {
                      const e = edges.find(
                        (x) => x.law.id === l.id && x.qKey === q.key,
                      );
                      return (
                        <td key={q.key} className="text-center">
                          {e ? (
                            <button
                              type="button"
                              onClick={() => navigate(`/legal-updates/${l.id}`)}
                              className={cn(
                                "w-full rounded-md px-1.5 py-1.5 text-[10px] font-bold text-white",
                                e.mapping.status === "suggested" &&
                                  "border-2 border-dashed border-white/70 opacity-75",
                              )}
                              style={{
                                background: ACTION_COLOR[e.mapping.action],
                              }}
                              title={`${MAPPING_ACTION_LABELS[e.mapping.action]}${e.mapping.status === "suggested" ? ` — AI ${e.mapping.confidence}%` : " — confirmed"}`}
                            >
                              {MAPPING_ACTION_SHORT[e.mapping.action]}
                            </button>
                          ) : (
                            <span className="block h-7 rounded-md bg-muted/40" />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function SidePanel({
  sel,
  edges,
  unitName,
  healthFor,
  onOpen,
}: {
  sel: Sel;
  edges: Edge[];
  unitName: Record<string, string>;
  healthFor: (qdnbId?: string) => RevisionHealth | undefined;
  onOpen: (to: string) => void;
}) {
  if (!sel) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">How to read the map</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            <b className="text-foreground">Left:</b> new legal documents
            received by the CMS.
          </p>
          <p>
            <b className="text-foreground">Middle:</b> Nam A Bank internal
            regulations they affect, coloured by action (amend, supplement,
            replace…).
          </p>
          <p>
            <b className="text-foreground">Right:</b> units leading the
            revision.
          </p>
          <p>Click a node for details and a shortcut to the workflow.</p>
        </CardContent>
      </Card>
    );
  }
  const list = edges.filter(
    (e) =>
      (sel.kind === "law" && e.law.id === sel.id) ||
      (sel.kind === "qdnb" && e.qKey === sel.id) ||
      (sel.kind === "unit" && e.unitId === sel.id),
  );
  const first = list[0];
  if (!first) return null;
  return (
    <motion.div
      key={`${sel.kind}-${sel.id}`}
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">
            {sel.kind === "law"
              ? `${first.law.docType} ${first.law.docNumber}`
              : sel.kind === "qdnb"
                ? first.mapping.qdnbCode
                : (unitName[sel.id] ?? sel.id)}
          </CardTitle>
          <CardDescription>
            {sel.kind === "law"
              ? first.law.title
              : sel.kind === "qdnb"
                ? first.mapping.qdnbTitle
                : "Lead unit for these revisions"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {sel.kind === "law" && (
            <div className="flex flex-wrap gap-1.5 text-xs">
              <ToneBadge tone={LEGAL_STATUS_TONE[first.law.status]}>
                {LEGAL_STATUS_LABELS[first.law.status]}
              </ToneBadge>
              <span className="text-muted-foreground">
                effective{" "}
                {format(parseISO(first.law.effectiveDate), "dd/MM/yyyy")}
              </span>
            </div>
          )}
          {sel.kind === "qdnb" && healthFor(first.mapping.qdnbId) && (
            <RevisionHealthBadge health={healthFor(first.mapping.qdnbId)!} />
          )}
          <p className="pt-1 text-xs font-semibold text-muted-foreground uppercase">
            {list.length} link(s)
          </p>
          {list.map((e) => (
            <div
              key={e.id}
              className="rounded-lg border border-border p-2.5 text-xs"
            >
              <div className="flex items-center gap-1.5">
                <span
                  className="rounded px-1.5 py-0.5 font-bold text-white"
                  style={{ background: ACTION_COLOR[e.mapping.action] }}
                >
                  {MAPPING_ACTION_SHORT[e.mapping.action]}
                </span>
                {e.mapping.status === "accepted" ? (
                  <span className="inline-flex items-center gap-1 text-success">
                    <CheckCircle2 className="size-3" /> confirmed
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-violet-600 dark:text-violet-300">
                    <Sparkles className="size-3" /> AI {e.mapping.confidence}%
                  </span>
                )}
              </div>
              <p className="mt-1 font-medium">
                {sel.kind === "law"
                  ? `${e.mapping.qdnbCode} — ${e.mapping.qdnbTitle}`
                  : `${e.law.docNumber} — ${e.law.title}`}
              </p>
              <p className="text-muted-foreground">
                Law {e.mapping.lawArticles.join(", ")}
                {e.mapping.qdnbArticles ? ` → ${e.mapping.qdnbArticles}` : ""}
              </p>
              {e.mapping.reason && (
                <p className="mt-1 text-muted-foreground italic">
                  {e.mapping.reason}
                </p>
              )}
            </div>
          ))}
          <div className="flex flex-wrap gap-2 pt-1">
            {sel.kind === "law" && (
              <Button
                size="sm"
                onClick={() => onOpen(`/legal-updates/${first.law.id}`)}
              >
                Open legal update
              </Button>
            )}
            {sel.kind === "qdnb" && first.mapping.qdnbId && (
              <Button
                size="sm"
                onClick={() => onOpen(`/qdnb/${first.mapping.qdnbId}`)}
              >
                Open QĐNB
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
