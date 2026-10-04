import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { format, parseISO } from "date-fns";
import {
  ArrowRight,
  BookMarked,
  Inbox,
  Newspaper,
  ShieldAlert,
  Siren,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useCmsOverview, useNCCList, useRevisions } from "@/hooks/queries";
import { cn } from "@/lib/utils";

/**
 * CMS flow at a glance for the dashboards: Legal updates → QĐNB revisions →
 * Compliance issues → Escalations, each with live counts and a link.
 */
export function CmsSummaryStrip({ delay = 0 }: { delay?: number }) {
  const { data } = useCmsOverview();
  if (!data) return null;
  const steps = [
    {
      to: "/legal-updates",
      icon: Newspaper,
      label: "Legal updates",
      value: data.legalUpdates.awaitingReview,
      caption: `${data.legalUpdates.unread} unread · awaiting review`,
      alert: data.legalUpdates.unread > 0,
    },
    {
      to: "/qdnb",
      icon: BookMarked,
      label: "QĐNB revisions",
      value:
        data.revisions.notStarted +
        data.revisions.inRevision +
        data.revisions.pendingApproval,
      caption: `${data.revisions.overdue} overdue · ${data.revisions.lateRisk} late risk`,
      alert: data.revisions.overdue > 0,
    },
    {
      to: "/ncc/list",
      icon: ShieldAlert,
      label: "Open issues",
      value: data.issues.open,
      caption: `${data.issues.high} high · ${data.issues.medium} medium · ${data.issues.low} low`,
      alert: data.issues.high > 0,
    },
    {
      to: "/ncc/list?tab=icis",
      icon: Inbox,
      label: "ICIS findings",
      value: data.icis.pending,
      caption: "waiting for intake",
      alert: data.icis.pending > 0,
    },
    {
      to: "/ncc/escalations",
      icon: Siren,
      label: "Escalations",
      value: data.issues.escalationsAwaitingAck,
      caption: "awaiting acknowledgement",
      alert: data.issues.escalationsAwaitingAck > 0,
    },
  ];
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="rounded-2xl bg-gradient-to-r from-[#0c3767] via-[#185b95] to-[#147769] p-4 text-white shadow-lg"
    >
      <p className="mb-3 text-xs font-semibold tracking-wide text-white/75 uppercase">
        Compliance Management System — live flow
      </p>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        {steps.map((s, i) => (
          <Link
            key={s.label}
            to={s.to}
            className="group relative flex items-center gap-3 rounded-xl bg-white/10 p-3 transition-colors hover:bg-white/20"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/15">
              <s.icon className="size-4" />
            </span>
            <span className="min-w-0">
              <span className="flex items-baseline gap-2">
                <span className="text-2xl font-black tabular-nums">
                  {s.value}
                </span>
                <span className="truncate text-xs font-semibold">
                  {s.label}
                </span>
              </span>
              <span
                className={cn(
                  "block truncate text-[11px]",
                  s.alert ? "text-amber-200" : "text-white/70",
                )}
              >
                {s.caption}
              </span>
            </span>
            {i < steps.length - 1 && (
              <ArrowRight className="absolute top-1/2 -right-2.5 z-10 hidden size-4 -translate-y-1/2 text-white/60 lg:block" />
            )}
          </Link>
        ))}
      </div>
    </motion.div>
  );
}

/** Executive box: escalations sent to the Ban Điều hành & Ban Kiểm soát. */
export function EscalationsAwaitingAck({ delay = 0 }: { delay?: number }) {
  const issues = useNCCList({}, 1, 500);
  const revisions = useRevisions();
  const items = [
    ...(issues.data?.items ?? []).flatMap((i) =>
      i.escalations
        .filter((e) => e.level >= 2 && !e.acknowledgedAt)
        .map((e) => ({
          e,
          label: i.nccId,
          title: i.title,
          url: `/ncc/${i.id}`,
        })),
    ),
    ...(revisions.data ?? []).flatMap((r) =>
      r.escalations
        .filter((e) => e.level >= 2 && !e.acknowledgedAt)
        .map((e) => ({
          e,
          label: r.qdnbCode,
          title: r.qdnbTitle,
          url: r.qdnbId ? `/qdnb/${r.qdnbId}` : "/qdnb",
        })),
    ),
  ].sort((a, b) => b.e.level - a.e.level || b.e.at.localeCompare(a.e.at));

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="h-full"
    >
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Siren className="size-4 text-danger" /> Escalations awaiting
            acknowledgement
          </CardTitle>
          <CardDescription>
            High-risk and long-overdue items escalated by the CMS
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-1.5">
          {items.slice(0, 6).map(({ e, label, title, url }) => (
            <Link
              key={e.id}
              to={url}
              className="flex items-center gap-2 rounded-lg border border-border p-2 text-sm hover:bg-muted/50"
            >
              <span
                className={cn(
                  "rounded px-1.5 py-0.5 text-[10px] font-bold",
                  e.level === 3
                    ? "bg-danger-bg text-danger"
                    : "bg-warning-bg text-warning",
                )}
              >
                L{e.level}
              </span>
              <span className="w-28 shrink-0 truncate font-mono text-[11px]">
                {label}
              </span>
              <span className="min-w-0 flex-1 truncate">{title}</span>
              <span className="shrink-0 text-[11px] text-muted-foreground">
                {format(parseISO(e.at), "dd/MM")}
              </span>
            </Link>
          ))}
          {!items.length && (
            <p className="text-sm text-muted-foreground">
              Nothing waiting — all escalations acknowledged.
            </p>
          )}
          {items.length > 6 && (
            <p className="text-xs text-muted-foreground">
              +{items.length - 6} more
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
