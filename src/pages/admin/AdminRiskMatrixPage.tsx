import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { format, parseISO } from "date-fns";
import {
  CheckCircle2,
  Grid3x3,
  History,
  RotateCcw,
  Save,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHero } from "@/components/common";
import { PriorityBadge } from "@/components/common/PriorityBadge";
import { LoadingState } from "@/components/common/LoadingState";
import { AdminSubNav } from "@/components/admin/AdminSubNav";
import { Callout, PagePurpose, RfqChip, ToneBadge } from "@/components/cms";
import { useNCCList, useRiskMatrices } from "@/hooks/queries";
import { useSaveRiskMatrix } from "@/hooks/mutations";
import {
  computeWeightedScore,
  levelForScore,
  RISK_LEVEL_VI,
} from "@/lib/cms-rules";
import { cn } from "@/lib/utils";
import type { RiskLevel, RiskMatrix } from "@/types";

const LEVELS: RiskLevel[] = ["low", "medium", "high"];
const BAND: Record<RiskLevel, string> = {
  low: "bg-success",
  medium: "bg-warning",
  high: "bg-danger",
};

export default function AdminRiskMatrixPage() {
  const matricesQuery = useRiskMatrices();
  const issuesQuery = useNCCList({}, 1, 500);
  const save = useSaveRiskMatrix();

  const matrices = matricesQuery.data ?? [];
  const active = matrices.find((m) => m.status === "active");
  const draft = matrices.find((m) => m.status === "draft");

  const [criteria, setCriteria] = useState<RiskMatrix["criteria"]>([]);
  const [thresholds, setThresholds] = useState<RiskMatrix["thresholds"]>({
    medium: 2.2,
    high: 3.4,
  });
  const [note, setNote] = useState("");

  const base = draft ?? active;
  useEffect(() => {
    if (base) {
      setCriteria(
        base.criteria.map((c) => ({
          ...c,
          scale: c.scale.map((s) => ({ ...s })),
        })),
      );
      setThresholds({ ...base.thresholds });
    }
  }, [base?.id, base?.updatedAt]); // eslint-disable-line react-hooks/exhaustive-deps

  const totalWeight = criteria.reduce((s, c) => s + c.weight, 0);
  const edited: Pick<RiskMatrix, "criteria" | "thresholds"> = {
    criteria,
    thresholds,
  };
  const isDirty =
    Boolean(active) &&
    JSON.stringify({ criteria, thresholds }) !==
      JSON.stringify({
        criteria: active!.criteria,
        thresholds: active!.thresholds,
      });

  // Live preview: how open issues would be rated under the edited matrix.
  const preview = useMemo(() => {
    const items = (issuesQuery.data?.items ?? []).filter(
      (i) => i.status === "Open",
    );
    if (!active || !criteria.length) return null;
    const rows = items.map((i) => {
      const nextScore = computeWeightedScore(i.risk.scores, edited);
      const nextLevel = levelForScore(nextScore, thresholds);
      return { issue: i, current: i.risk.suggestedLevel, nextLevel, nextScore };
    });
    const count = (lvl: RiskLevel, key: "current" | "nextLevel") =>
      rows.filter((r) => r[key] === lvl).length;
    return {
      rows,
      changed: rows.filter((r) => r.current !== r.nextLevel),
      before: LEVELS.map((l) => ({ level: l, n: count(l, "current") })),
      after: LEVELS.map((l) => ({ level: l, n: count(l, "nextLevel") })),
      total: rows.length,
    };
  }, [issuesQuery.data, criteria, thresholds, active]); // eslint-disable-line react-hooks/exhaustive-deps

  if (matricesQuery.isPending || !active) {
    return (
      <div className="space-y-6">
        <AdminSubNav />
        <LoadingState message="Loading risk matrix…" />
      </div>
    );
  }

  const valid =
    totalWeight === 100 &&
    thresholds.medium > 1 &&
    thresholds.high > thresholds.medium &&
    thresholds.high <= 5;

  const submit = (activate: boolean) => {
    if (!valid) {
      toast.error("Weights must total 100% and High must be above Medium.");
      return;
    }
    if (activate && !note.trim()) {
      toast.error("Add a short note explaining the change before activating.");
      return;
    }
    save.mutate(
      { criteria, thresholds, note: note.trim() || undefined, activate },
      {
        onSuccess: (m) => {
          toast.success(
            activate
              ? `Matrix v${m.version} approved and active — new ratings use it from now on`
              : `Draft v${m.version} saved`,
          );
          setNote("");
        },
      },
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <AdminSubNav />
      <PageHero
        title="Risk Rating Matrix"
        subtitle="Ma trận phân loại Rủi ro Tuân thủ — 3 levels (Thấp · Trung bình · Cao) calculated from 4 weighted criteria."
      >
        <div className="flex items-center gap-2">
          <RfqChip code="4.1" />
          <RfqChip code="4.2" />
        </div>
      </PageHero>
      <PagePurpose>
        Compliance sets the rules here once; every issue then gets a suggested
        level automatically. Changes create a new version that must be approved,
        so the bank can show which method applied at any date.
      </PagePurpose>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="size-4" /> Active: version{" "}
              {active.version}
            </CardTitle>
            <CardDescription>
              In force since{" "}
              {format(parseISO(active.effectiveFrom), "dd/MM/yyyy")} · approved
              by {active.approvedBy}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {active.note && (
              <p className="text-sm text-muted-foreground">“{active.note}”</p>
            )}
            <div className="mt-4 flex h-9 w-full overflow-hidden rounded-lg text-xs font-semibold text-white">
              {LEVELS.map((lvl) => {
                const start =
                  lvl === "low"
                    ? 1
                    : lvl === "medium"
                      ? thresholds.medium
                      : thresholds.high;
                const end =
                  lvl === "low"
                    ? thresholds.medium
                    : lvl === "medium"
                      ? thresholds.high
                      : 5;
                return (
                  <div
                    key={lvl}
                    className={cn(
                      "flex items-center justify-center",
                      BAND[lvl],
                    )}
                    style={{ width: `${((end - start) / 4) * 100}%` }}
                  >
                    {lvl.charAt(0).toUpperCase() + lvl.slice(1)} (
                    {RISK_LEVEL_VI[lvl]})
                  </div>
                );
              })}
            </div>
            <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
              <span>1.0</span>
              <span>weighted score</span>
              <span>5.0</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="size-4" /> Versions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {matrices.map((m) => (
              <div
                key={m.id}
                className="flex items-start justify-between gap-2 rounded-lg border border-border p-2.5"
              >
                <div>
                  <p className="text-sm font-semibold">Version {m.version}</p>
                  <p className="text-xs text-muted-foreground">
                    {m.status === "draft"
                      ? "Draft — not yet approved"
                      : `From ${format(parseISO(m.effectiveFrom), "dd/MM/yyyy")}`}
                  </p>
                </div>
                <ToneBadge
                  tone={
                    m.status === "active"
                      ? "success"
                      : m.status === "draft"
                        ? "info"
                        : "neutral"
                  }
                >
                  {m.status === "active"
                    ? "Active"
                    : m.status === "draft"
                      ? "Draft"
                      : "Retired"}
                </ToneBadge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Grid3x3 className="size-4" /> Criteria & weights
          </CardTitle>
          <CardDescription>
            Methodology set by Nam A Bank: each criterion is scored 1–5; the
            weighted average decides the level.
          </CardDescription>
          <CardAction>
            <span
              className={cn(
                "text-sm font-semibold tabular-nums",
                totalWeight === 100 ? "text-success" : "text-danger",
              )}
            >
              Total {totalWeight}%
            </span>
          </CardAction>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {criteria.map((c, idx) => (
            <div
              key={c.key}
              className="rounded-xl border border-border bg-card p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold">{c.label}</p>
                  <p className="text-xs text-muted-foreground">{c.labelVi}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={c.weight}
                    onChange={(e) => {
                      const w = Math.max(
                        0,
                        Math.min(100, Number(e.target.value) || 0),
                      );
                      setCriteria((prev) =>
                        prev.map((x, i) =>
                          i === idx ? { ...x, weight: w } : x,
                        ),
                      );
                    }}
                    className="h-8 w-16 text-right"
                    aria-label={`${c.label} weight`}
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
              </div>
              <input
                type="range"
                min={0}
                max={60}
                step={5}
                value={c.weight}
                onChange={(e) =>
                  setCriteria((prev) =>
                    prev.map((x, i) =>
                      i === idx ? { ...x, weight: Number(e.target.value) } : x,
                    ),
                  )
                }
                className="mt-2 w-full accent-primary"
                aria-label={`${c.label} weight slider`}
              />
              <ol className="mt-3 space-y-1.5">
                {c.scale.map((step, sIdx) => (
                  <li key={step.score} className="flex items-center gap-2">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-bold">
                      {step.score}
                    </span>
                    <Input
                      value={step.label}
                      onChange={(e) =>
                        setCriteria((prev) =>
                          prev.map((x, i) =>
                            i === idx
                              ? {
                                  ...x,
                                  scale: x.scale.map((s, j) =>
                                    j === sIdx
                                      ? { ...s, label: e.target.value }
                                      : s,
                                  ),
                                }
                              : x,
                          ),
                        )
                      }
                      className="h-7 w-36 shrink-0 text-xs"
                      aria-label={`Score ${step.score} label`}
                    />
                    <span
                      className="truncate text-xs text-muted-foreground"
                      title={step.description}
                    >
                      {step.description}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Level thresholds</CardTitle>
            <CardDescription>
              Weighted score at which a level starts.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {(["medium", "high"] as const).map((k) => (
              <div key={k} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <PriorityBadge priority={k} />
                  <span className="text-sm font-semibold tabular-nums">
                    ≥ {thresholds[k].toFixed(1)}
                  </span>
                </div>
                <input
                  type="range"
                  min={1.2}
                  max={4.8}
                  step={0.1}
                  value={thresholds[k]}
                  onChange={(e) =>
                    setThresholds((t) => ({
                      ...t,
                      [k]: Number(e.target.value),
                    }))
                  }
                  className="w-full accent-primary"
                  aria-label={`${k} threshold`}
                />
              </div>
            ))}
            {thresholds.high <= thresholds.medium && (
              <p className="text-xs text-danger">High must be above Medium.</p>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Live preview on open issues</CardTitle>
            <CardDescription>
              How the {preview?.total ?? 0} open issues would be rated with the
              settings above.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {preview && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  {(["before", "after"] as const).map((k) => (
                    <div
                      key={k}
                      className="rounded-lg border border-border p-3"
                    >
                      <p className="mb-2 text-xs font-semibold text-muted-foreground">
                        {k === "before"
                          ? `Current (v${active.version})`
                          : "With your changes"}
                      </p>
                      <div className="flex h-6 overflow-hidden rounded-md">
                        {preview[k].map((x) =>
                          x.n ? (
                            <div
                              key={x.level}
                              className={cn(
                                "flex items-center justify-center text-[11px] font-bold text-white",
                                BAND[x.level],
                              )}
                              style={{
                                width: `${(x.n / Math.max(1, preview.total)) * 100}%`,
                              }}
                            >
                              {x.n}
                            </div>
                          ) : null,
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {preview.changed.length === 0 ? (
                  <Callout
                    tone="success"
                    icon={CheckCircle2}
                    title="No issue changes level"
                  >
                    {isDirty
                      ? "Your edits keep every open issue at the same level."
                      : "Edit a weight or threshold to see the impact."}
                  </Callout>
                ) : (
                  <div className="space-y-1.5">
                    <p className="text-xs font-semibold text-muted-foreground">
                      {preview.changed.length} issue(s) would change level
                    </p>
                    {preview.changed.slice(0, 6).map((r) => (
                      <div
                        key={r.issue.id}
                        className="flex items-center gap-2 rounded-lg border border-border p-2 text-sm"
                      >
                        <span className="w-24 shrink-0 font-mono text-xs">
                          {r.issue.nccId}
                        </span>
                        <span className="min-w-0 flex-1 truncate">
                          {r.issue.title}
                        </span>
                        <PriorityBadge priority={r.current} />
                        <span className="text-muted-foreground">→</span>
                        <PriorityBadge priority={r.nextLevel} />
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Approve a new version</CardTitle>
          <CardDescription>
            Activating creates version{" "}
            {Math.max(...matrices.map((m) => m.version)) + (draft ? 0 : 1)}.
            Existing ratings keep their version; new ratings use the new matrix.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Reason for the change, e.g. “Align fine bands with Nghị định 52/2026/NĐ-CP”"
            className="min-h-16"
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={() => submit(true)}
              disabled={!valid || !isDirty || save.isPending}
            >
              <CheckCircle2 className="size-4" /> Approve & activate
            </Button>
            <Button
              variant="outline"
              onClick={() => submit(false)}
              disabled={!valid || !isDirty || save.isPending}
            >
              <Save className="size-4" /> Save draft
            </Button>
            <Button
              variant="ghost"
              disabled={!isDirty}
              onClick={() => {
                setCriteria(
                  active.criteria.map((c) => ({
                    ...c,
                    scale: c.scale.map((s) => ({ ...s })),
                  })),
                );
                setThresholds({ ...active.thresholds });
              }}
            >
              <RotateCcw className="size-4" /> Discard changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
