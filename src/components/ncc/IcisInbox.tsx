import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { addDays, format, formatDistance, parseISO } from "date-fns";
import {
  CheckCircle2,
  GitMerge,
  Inbox,
  Loader2,
  PlugZap,
  RefreshCw,
  Sparkles,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { PriorityBadge } from "@/components/common/PriorityBadge";
import { KPICard } from "@/components/common/KPICard";
import { EmptyState } from "@/components/common/EmptyState";
import {
  Callout,
  RiskRatingPanel,
  ToneBadge,
  isRatingValid,
  type RiskRatingValue,
} from "@/components/cms";
import {
  useActiveRiskMatrix,
  useAdminUsers,
  useIcisFindings,
  useIcisSuggestion,
} from "@/hooks/queries";
import {
  useAcceptIcis,
  useMergeIcis,
  useRejectIcis,
  useSyncIcis,
} from "@/hooks/mutations";
import { useAuthStore, demoNow } from "@/stores";
import { hasPermission } from "@/constants/rbac";
import { formatVnd } from "@/lib/cms-rules";
import { cn } from "@/lib/utils";
import type { IcisFinding } from "@/types";

/**
 * ICIS Inbox (RFQ 3.2-i): findings and recommendations from P.KTKSNB arrive
 * from the ICIS system; Compliance accepts them as issues, merges repeats or
 * rejects them with a reason.
 */
export function IcisInbox() {
  const { role } = useAuthStore();
  const canIntake = hasPermission(role, "icis:intake");
  const { data, isPending } = useIcisFindings();
  const sync = useSyncIcis();
  const [lastSync, setLastSync] = useState(() => demoNow());
  const [accepting, setAccepting] = useState<IcisFinding | null>(null);
  const [rejecting, setRejecting] = useState<IcisFinding | null>(null);
  const [fresh, setFresh] = useState<string[]>([]);

  const items = data ?? [];
  const pending = items.filter((f) => f.status === "pending");
  const processed = items.filter((f) => f.status !== "pending");

  return (
    <div className="space-y-5">
      <Card className="overflow-hidden py-0">
        <CardContent className="flex flex-col gap-3 bg-gradient-to-r from-[#3b2a6b] via-[#5b3fa3] to-[#185b95] p-4 text-white md:flex-row md:items-center">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-white/15">
              <PlugZap className="size-5" />
            </span>
            <div>
              <p className="text-sm font-semibold">
                ICIS (P.KTKSNB) connected — Single Source of Truth
              </p>
              <p className="text-xs text-white/75">
                Findings, recommendations and remediation status flow from ICIS
                to CMS automatically · last sync{" "}
                {format(lastSync, "HH:mm dd/MM")}
              </p>
            </div>
          </div>
          <Button
            className="bg-white text-[#3b2a6b] hover:bg-white/90 md:ml-auto"
            disabled={sync.isPending}
            onClick={() =>
              sync.mutate(undefined, {
                onSuccess: (res) => {
                  setLastSync(demoNow());
                  setFresh(res.added.map((a) => a.id));
                  if (res.added.length)
                    toast.success(
                      `${res.added.length} new finding(s) received from ICIS`,
                    );
                  else toast.info("ICIS is up to date — no new findings.");
                },
              })
            }
          >
            {sync.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" />
            )}
            {sync.isPending ? "Syncing with ICIS…" : "Sync now"}
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KPICard
          label="Waiting for intake"
          value={pending.length}
          icon={Inbox}
          iconClassName="bg-info-bg text-info"
        />
        <KPICard
          label="Accepted as issues"
          value={items.filter((f) => f.status === "accepted").length}
          icon={CheckCircle2}
          iconClassName="bg-success-bg text-success"
        />
        <KPICard
          label="Merged (repeats)"
          value={items.filter((f) => f.status === "merged").length}
          icon={GitMerge}
          iconClassName="bg-violet-500/10 text-violet-600"
        />
        <KPICard
          label="Rejected"
          value={items.filter((f) => f.status === "rejected").length}
          icon={XCircle}
          iconClassName="bg-neutral-bg text-neutral"
        />
      </div>

      {isPending ? null : pending.length === 0 ? (
        <EmptyState
          title="Inbox is empty"
          description="All ICIS findings have been processed. Use “Sync now” to check for new ones."
        />
      ) : (
        <div className="space-y-2.5">
          <p className="text-sm font-semibold">
            Waiting for intake ({pending.length})
          </p>
          <AnimatePresence initial={false}>
            {pending.map((f) => (
              <FindingCard
                key={f.id}
                f={f}
                fresh={fresh.includes(f.id)}
                actions={
                  canIntake ? (
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" onClick={() => setAccepting(f)}>
                        <CheckCircle2 className="size-4" /> Accept / merge…
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setRejecting(f)}
                      >
                        <XCircle className="size-4" /> Reject
                      </Button>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      Compliance (Owner role) processes findings.
                    </span>
                  )
                }
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {processed.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-semibold">Processed</p>
          <div className="overflow-x-auto rounded-xl border border-border bg-card">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 font-medium">Finding</th>
                  <th className="px-4 py-2 font-medium">Unit</th>
                  <th className="px-4 py-2 font-medium">Category</th>
                  <th className="px-4 py-2 font-medium">Outcome</th>
                  <th className="px-4 py-2 font-medium">Issue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {processed.map((f) => (
                  <tr key={f.id}>
                    <td className="px-4 py-2 font-mono text-xs">{f.code}</td>
                    <td className="px-4 py-2">{f.unitName}</td>
                    <td className="px-4 py-2">{f.category}</td>
                    <td className="px-4 py-2">
                      <ToneBadge
                        tone={
                          f.status === "accepted"
                            ? "success"
                            : f.status === "merged"
                              ? "ai"
                              : "neutral"
                        }
                      >
                        {f.status === "accepted"
                          ? "Accepted"
                          : f.status === "merged"
                            ? "Merged"
                            : "Rejected"}
                      </ToneBadge>
                      {f.resolutionNote && (
                        <p className="mt-0.5 max-w-xs text-xs text-muted-foreground">
                          {f.resolutionNote}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      {f.issueId ? (
                        <Link
                          to={`/ncc/${f.issueId}`}
                          className="text-xs font-medium text-primary hover:underline"
                        >
                          Open issue
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <AcceptSheet finding={accepting} onClose={() => setAccepting(null)} />
      <RejectSheet finding={rejecting} onClose={() => setRejecting(null)} />
    </div>
  );
}

function FindingCard({
  f,
  actions,
  fresh,
}: {
  f: IcisFinding;
  actions: React.ReactNode;
  fresh?: boolean;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 40 }}
      className={cn(
        "rounded-xl border bg-card p-4 shadow-sm",
        fresh ? "border-primary ring-4 ring-chart-accent/50" : "border-border",
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-xs font-semibold">{f.code}</span>
        <PriorityBadge priority={f.severityHint} />
        <span className="rounded-md bg-muted px-2 py-0.5 text-xs">
          {f.category}
        </span>
        {fresh && (
          <ToneBadge tone="ai" icon={Sparkles}>
            Just received
          </ToneBadge>
        )}
        <span className="ml-auto text-xs text-muted-foreground">
          received{" "}
          {formatDistance(parseISO(f.receivedAt), demoNow(), {
            addSuffix: true,
          })}
        </span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {f.auditRound} · {f.unitName}
        {f.region ? ` (${f.region})` : ""} · {f.inspector}
      </p>
      <p className="mt-2 text-sm">{f.description}</p>
      <p className="mt-1 text-sm text-muted-foreground">
        <b className="text-foreground">Recommendation:</b> {f.recommendation}
      </p>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">
          {f.finePotential
            ? `Potential fine: ${formatVnd(f.finePotential)}`
            : "No fine expected"}
        </span>
        {actions}
      </div>
    </motion.div>
  );
}

function AcceptSheet({
  finding,
  onClose,
}: {
  finding: IcisFinding | null;
  onClose: () => void;
}) {
  const suggestion = useIcisSuggestion(finding?.id ?? null);
  const { data: matrix } = useActiveRiskMatrix();
  const usersQuery = useAdminUsers(1, 200, { status: "Active" });
  const accept = useAcceptIcis();
  const merge = useMergeIcis();
  const [rating, setRating] = useState<RiskRatingValue | null>(null);
  const [ownerId, setOwnerId] = useState("");
  const [due, setDue] = useState("");

  useEffect(() => {
    if (suggestion.data) setRating({ scores: suggestion.data.scores });
  }, [suggestion.data]);
  useEffect(() => {
    if (finding) {
      setDue(
        format(
          addDays(demoNow(), finding.severityHint === "high" ? 15 : 30),
          "yyyy-MM-dd",
        ),
      );
      setOwnerId("");
      setRating(null);
    }
  }, [finding]);

  const users = usersQuery.data?.items ?? [];
  const owner = users.find((u) => u.id === ownerId);
  const repeat = suggestion.data?.repeatCount ?? 1;

  return (
    <Sheet open={Boolean(finding)} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>Accept ICIS finding as a compliance issue</SheetTitle>
          <SheetDescription>
            {finding?.code} · {finding?.unitName}
          </SheetDescription>
        </SheetHeader>
        {finding && (
          <div className="flex-1 space-y-4 overflow-y-auto px-4 pb-6">
            <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm">
              <p className="font-medium">{finding.category}</p>
              <p className="mt-1 text-muted-foreground">
                {finding.description}
              </p>
            </div>

            {suggestion.data && suggestion.data.similar.length > 0 && (
              <Callout
                tone="warning"
                icon={GitMerge}
                title={`Similar open issue at ${finding.unitName}`}
              >
                <p>
                  This looks like a repeat. You can merge it instead of opening
                  a new issue:
                </p>
                <div className="mt-2 space-y-1.5">
                  {suggestion.data.similar.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between gap-2 rounded-md bg-background p-2"
                    >
                      <span className="text-xs">
                        <b>{s.nccId}</b> — {s.title}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7"
                        disabled={merge.isPending}
                        onClick={() =>
                          merge.mutate(
                            { id: finding.id, issueId: s.id },
                            {
                              onSuccess: () => {
                                toast.success(
                                  `Merged into ${s.nccId} — repeat count updated`,
                                );
                                onClose();
                              },
                            },
                          )
                        }
                      >
                        <GitMerge className="size-3.5" /> Merge
                      </Button>
                    </div>
                  ))}
                </div>
              </Callout>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Responsible officer *</Label>
                <select
                  value={ownerId}
                  onChange={(e) => setOwnerId(e.target.value)}
                  className="h-9 w-full rounded-lg border border-input bg-background px-2 text-sm dark:bg-input/30"
                >
                  <option value="">Choose…</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Remediation due date *</Label>
                <Input
                  type="date"
                  value={due}
                  onChange={(e) => setDue(e.target.value)}
                  className="h-9"
                />
              </div>
            </div>

            {matrix && rating ? (
              <div className="space-y-2">
                <p className="text-sm font-semibold">Suggested risk rating</p>
                <RiskRatingPanel
                  matrix={matrix}
                  value={rating}
                  onChange={setRating}
                  hints={{
                    fine: finding.finePotential
                      ? `From the potential fine in ICIS: ${formatVnd(finding.finePotential)}`
                      : "No fine reported by ICIS",
                    recurrence:
                      repeat > 1
                        ? `${repeat}${repeat === 2 ? "nd" : repeat === 3 ? "rd" : "th"} occurrence of this category at ${finding.unitName} in 12 months`
                        : "First occurrence in 12 months",
                    reputation: `ICIS severity hint: ${finding.severityHint.toUpperCase()}`,
                    scope: finding.scopeHint
                      ? "Inspector reports a bank-wide cause (system configuration)"
                      : finding.unitId.startsWith("branch")
                        ? "Single branch"
                        : "Head-office department",
                  }}
                />
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> Calculating
                suggested rating…
              </div>
            )}

            <div className="flex justify-end gap-2 border-t border-border pt-4">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                disabled={
                  !owner ||
                  !due ||
                  !rating ||
                  !matrix ||
                  !isRatingValid(matrix, rating) ||
                  accept.isPending
                }
                onClick={() =>
                  rating &&
                  owner &&
                  accept.mutate(
                    {
                      id: finding.id,
                      ownerId: owner.id,
                      ownerName: owner.name,
                      dueDate: new Date(due).toISOString(),
                      scores: rating.scores,
                      overrideLevel: rating.overrideLevel,
                      overrideReason: rating.overrideReason,
                    },
                    {
                      onSuccess: (res) => {
                        toast.success(
                          res.issue.risk.finalLevel === "high"
                            ? `${res.issue.nccId} created — HIGH risk, escalated to BĐH & BKS automatically`
                            : `${res.issue.nccId} created and assigned to ${owner.name}`,
                        );
                        onClose();
                      },
                    },
                  )
                }
              >
                <CheckCircle2 className="size-4" /> Accept as new issue
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function RejectSheet({
  finding,
  onClose,
}: {
  finding: IcisFinding | null;
  onClose: () => void;
}) {
  const reject = useRejectIcis();
  const [reason, setReason] = useState("");
  useEffect(() => setReason(""), [finding]);
  return (
    <Sheet open={Boolean(finding)} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Reject finding</SheetTitle>
          <SheetDescription>
            {finding?.code} — the reason is sent back to P.KTKSNB and kept in
            the audit trail.
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-3 px-4">
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Why is this not a compliance issue?"
            className="min-h-24"
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              disabled={!reason.trim() || reject.isPending}
              onClick={() =>
                finding &&
                reject.mutate(
                  { id: finding.id, reason: reason.trim() },
                  {
                    onSuccess: () => {
                      toast.success("Finding rejected");
                      onClose();
                    },
                  },
                )
              }
            >
              Reject finding
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
