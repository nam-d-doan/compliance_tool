import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { format, formatDistance, parseISO } from "date-fns";
import {
  CheckCircle2,
  CloudDownload,
  FileScan,
  Inbox,
  Loader2,
  RefreshCw,
  Rss,
  ScanText,
  Search,
  Sparkles,
  TimerReset,
  Upload,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { PageHero } from "@/components/common";
import { KPICard } from "@/components/common/KPICard";
import { PriorityBadge } from "@/components/common/PriorityBadge";
import { LoadingState } from "@/components/common/LoadingState";
import { EmptyState } from "@/components/common/EmptyState";
import {
  FileNamePicker,
  LEGAL_STATUS_TONE,
  PagePurpose,
  RfqChip,
  ToneBadge,
} from "@/components/cms";
import { useLegalUpdates } from "@/hooks/queries";
import { useOcrLegalDocument, useSyncLegalFeed } from "@/hooks/mutations";
import { useAuthStore, demoNow } from "@/stores";
import { hasPermission } from "@/constants/rbac";
import { LEGAL_STATUS_LABELS, daysUntil } from "@/lib/cms-rules";
import { cn } from "@/lib/utils";
import type { LegalUpdate } from "@/types";

type TabKey =
  | "inbox"
  | "review"
  | "in_progress"
  | "soon"
  | "completed"
  | "not_applicable"
  | "all";

const TABS: {
  key: TabKey;
  label: string;
  match: (l: LegalUpdate) => boolean;
}[] = [
  { key: "inbox", label: "New", match: (l) => l.status === "new" },
  {
    key: "review",
    label: "Under review",
    match: (l) => l.status === "under_review" || l.status === "applicable",
  },
  {
    key: "in_progress",
    label: "Mapped / assigned",
    match: (l) => l.status === "mapped" || l.status === "assigned",
  },
  {
    key: "soon",
    label: "Taking effect soon",
    match: (l) => {
      const d = daysUntil(l.effectiveDate);
      return d >= 0 && d <= 60 && l.status !== "not_applicable";
    },
  },
  {
    key: "completed",
    label: "Completed",
    match: (l) => l.status === "completed",
  },
  {
    key: "not_applicable",
    label: "Not applicable",
    match: (l) => l.status === "not_applicable",
  },
  { key: "all", label: "All", match: () => true },
];

const ISSUER_STYLE: Record<string, string> = {
  NHNN: "bg-[#0c3767] text-white",
  "Chính phủ": "bg-red-700 text-white",
  "Quốc hội": "bg-amber-600 text-white",
  "Bộ Tài chính": "bg-teal-700 text-white",
};

const SOURCES = ["vbpl.vn", "Công báo Chính phủ", "Cổng TTĐT NHNN", "VietLex"];

export default function LegalUpdatesPage() {
  const navigate = useNavigate();
  const { role } = useAuthStore();
  const canReview = hasPermission(role, "legal:review");
  const { data, isPending } = useLegalUpdates();
  const sync = useSyncLegalFeed();
  const [tab, setTab] = useState<TabKey>("inbox");
  const [search, setSearch] = useState("");
  const [lastSync, setLastSync] = useState(() => demoNow());
  const [highlight, setHighlight] = useState<string | null>(null);
  // "?ocr=1" (from the dashboard feature map) opens the upload straight away.
  const [params] = useSearchParams();
  const [ocrOpen, setOcrOpen] = useState(() => params.get("ocr") === "1");

  const items = useMemo(() => data ?? [], [data]);
  const counts = useMemo(
    () =>
      Object.fromEntries(
        TABS.map((t) => [t.key, items.filter(t.match).length]),
      ) as Record<TabKey, number>,
    [items],
  );
  const visible = items
    .filter(TABS.find((t) => t.key === tab)!.match)
    .filter(
      (l) =>
        !search ||
        `${l.docNumber} ${l.title} ${l.field} ${l.issuer}`
          .toLowerCase()
          .includes(search.toLowerCase()),
    );

  useEffect(() => {
    if (!highlight) return;
    const t = setTimeout(() => setHighlight(null), 6000);
    return () => clearTimeout(t);
  }, [highlight]);

  const runSync = () =>
    sync.mutate(undefined, {
      onSuccess: (res) => {
        setLastSync(demoNow());
        if (res.added.length) {
          setTab("inbox");
          setHighlight(res.added[0].id);
          toast.success(
            `${res.added.length} new document received: ${res.added[0].docNumber}`,
            {
              description: "AI classified it and alerted Khối Tuân thủ.",
            },
          );
        } else {
          toast.info("No new documents since the last sync.");
        }
      },
    });

  if (isPending) return <LoadingState message="Loading legal updates…" />;

  const soon = items.filter((l) => {
    const d = daysUntil(l.effectiveDate);
    return (
      d >= 0 && d <= 30 && !["not_applicable", "completed"].includes(l.status)
    );
  }).length;

  return (
    <div className="space-y-6">
      <PageHero
        title="Legal Updates"
        subtitle="Văn bản pháp luật mới — received automatically from NHNN, the Government, the National Assembly and ministries, classified by AI and routed to Compliance."
      >
        <div className="flex flex-wrap items-center gap-2">
          <RfqChip code="1.1" />
          {canReview && (
            <Button variant="outline" onClick={() => setOcrOpen(true)}>
              <ScanText className="size-4" /> Upload document (OCR)
            </Button>
          )}
        </div>
      </PageHero>
      <PagePurpose>
        Step 1 of the legal update workflow. Open a document to check whether it
        applies to Nam A Bank, see the AI impact summary, map it to internal
        regulations and assign the revision work.
      </PagePurpose>

      <Card className="overflow-hidden py-0">
        <CardContent className="flex flex-col gap-3 bg-gradient-to-r from-[#0c3767] via-[#185b95] to-[#147769] p-4 text-white md:flex-row md:items-center">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-white/15">
              <Rss className="size-5" />
            </span>
            <div>
              <p className="flex items-center gap-2 text-sm font-semibold">
                Automatic intake connected
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-300 opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-emerald-300" />
                </span>
              </p>
              <p className="text-xs text-white/75">
                Sources: {SOURCES.join(" · ")} · auto-sync every 30 min · last
                sync {format(lastSync, "HH:mm dd/MM")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 md:ml-auto">
            <span className="hidden text-xs text-white/75 lg:inline">
              AI classifies field, relevance and effective date on arrival
            </span>
            <Button
              onClick={runSync}
              disabled={sync.isPending}
              className="bg-white text-[#0c3767] hover:bg-white/90"
            >
              {sync.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <RefreshCw className="size-4" />
              )}
              {sync.isPending ? "Checking sources…" : "Sync now"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KPICard
          label="New / unread"
          value={items.filter((l) => !l.read).length}
          subtitle={`${counts.inbox} awaiting first review`}
          icon={Inbox}
          iconClassName="bg-info-bg text-info"
          onClick={() => setTab("inbox")}
        />
        <KPICard
          label="Under review"
          value={counts.review}
          subtitle="Applicability & impact"
          icon={Search}
          iconClassName="bg-warning-bg text-warning"
          onClick={() => setTab("review")}
        />
        <KPICard
          label="Taking effect ≤ 30 days"
          value={soon}
          subtitle="Văn bản sắp có hiệu lực"
          icon={TimerReset}
          iconClassName="bg-danger-bg text-danger"
          onClick={() => setTab("soon")}
        />
        <KPICard
          label="Mapped / assigned"
          value={counts.in_progress}
          subtitle={`${counts.completed} completed`}
          icon={CheckCircle2}
          iconClassName="bg-success-bg text-success"
          onClick={() => setTab("in_progress")}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex flex-wrap items-center gap-1 rounded-lg bg-muted p-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={cn(
                "flex h-8 items-center gap-1.5 rounded-md px-3 text-xs font-semibold",
                tab === t.key
                  ? "bg-background shadow-sm"
                  : "text-muted-foreground",
              )}
            >
              {t.label}
              <span className="rounded-full bg-muted-foreground/10 px-1.5 text-[10px]">
                {counts[t.key]}
              </span>
            </button>
          ))}
        </div>
        <div className="relative min-w-[14rem] flex-1">
          <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search number, title, field…"
            className="h-9 pl-9"
          />
        </div>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          title="Nothing in this list"
          description={
            tab === "inbox"
              ? "Click “Sync now” to check the sources for new documents."
              : "Try another tab."
          }
        />
      ) : (
        <div className="space-y-2.5">
          <AnimatePresence initial={false}>
            {visible.map((l) => (
              <LegalCard
                key={l.id}
                item={l}
                highlight={highlight === l.id}
                onOpen={() => navigate(`/legal-updates/${l.id}`)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      <OcrSheet
        open={ocrOpen}
        onOpenChange={setOcrOpen}
        onDone={(id) => {
          setOcrOpen(false);
          navigate(`/legal-updates/${id}`);
        }}
      />
    </div>
  );
}

function LegalCard({
  item: l,
  highlight,
  onOpen,
}: {
  item: LegalUpdate;
  highlight: boolean;
  onOpen: () => void;
}) {
  const now = demoNow();
  const days = daysUntil(l.effectiveDate, now);
  return (
    <motion.button
      layout
      initial={{ opacity: 0, y: -12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0 }}
      whileHover={{ y: -2 }}
      type="button"
      onClick={onOpen}
      className={cn(
        "flex w-full flex-col gap-3 rounded-xl border bg-card p-4 text-left shadow-sm transition-shadow hover:shadow-md md:flex-row md:items-center",
        highlight
          ? "border-primary ring-4 ring-chart-accent/60"
          : "border-border",
      )}
    >
      <div className="flex items-start gap-3 md:w-[60%]">
        <span className="relative mt-0.5 shrink-0">
          <span
            className={cn(
              "flex h-7 min-w-14 items-center justify-center rounded-md px-1.5 text-[10px] font-bold",
              ISSUER_STYLE[l.issuer] ?? "bg-muted",
            )}
          >
            {l.issuer}
          </span>
          {!l.read && (
            <span
              className="absolute -top-1 -right-1 size-2.5 rounded-full bg-danger ring-2 ring-card"
              aria-label="Unread"
            />
          )}
        </span>
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold">
              {l.docType} {l.docNumber}
            </span>
            <ToneBadge tone={LEGAL_STATUS_TONE[l.status]}>
              {LEGAL_STATUS_LABELS[l.status]}
            </ToneBadge>
            {highlight && (
              <ToneBadge tone="ai" icon={Sparkles}>
                Just received
              </ToneBadge>
            )}
          </p>
          <p
            className={cn(
              "mt-0.5 line-clamp-2 text-sm",
              !l.read && "font-medium",
            )}
          >
            {l.title}
          </p>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              {l.channel === "ocr" ? (
                <FileScan className="size-3" />
              ) : l.channel === "manual" ? (
                <Upload className="size-3" />
              ) : (
                <CloudDownload className="size-3" />
              )}
              {l.channel === "auto_feed"
                ? "Auto"
                : l.channel === "ocr"
                  ? "OCR"
                  : "Manual"}{" "}
              · {l.sourceName}
            </span>
            <span>
              · received{" "}
              {formatDistance(parseISO(l.receivedAt), now, { addSuffix: true })}
            </span>
          </p>
        </div>
      </div>
      <div className="flex flex-1 flex-wrap items-center gap-2 md:justify-end">
        <span className="inline-flex items-center gap-1 rounded-md bg-violet-500/10 px-2 py-1 text-[11px] font-medium text-violet-600 dark:text-violet-300">
          <Sparkles className="size-3" /> {l.field}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-[11px]">
          Relevance <PriorityBadge priority={l.relevance} />{" "}
          <span className="tabular-nums text-muted-foreground">
            {l.relevanceScore}
          </span>
        </span>
        <span
          className={cn(
            "inline-flex flex-col items-center rounded-md px-2.5 py-1 text-center text-[11px] leading-tight",
            l.status === "not_applicable" || l.status === "completed"
              ? "bg-muted text-muted-foreground"
              : days < 0
                ? "bg-danger-bg text-danger"
                : days <= 30
                  ? "bg-warning-bg text-warning"
                  : "bg-muted",
          )}
        >
          <span className="font-bold">
            {days < 0 ? "In force" : `${days} days`}
          </span>
          <span>
            {days < 0
              ? format(parseISO(l.effectiveDate), "dd/MM/yyyy")
              : `to ${format(parseISO(l.effectiveDate), "dd/MM/yyyy")}`}
          </span>
        </span>
      </div>
    </motion.button>
  );
}

const OCR_STEPS = [
  "Uploading file",
  "OCR — reading 3 pages (98% confidence)",
  "Extracting number, issuer, dates and articles",
  "AI: classifying field and relevance",
  "AI: summarising compliance impact for Nam A Bank",
  "AI: suggesting affected internal regulations",
];

function OcrSheet({
  open,
  onOpenChange,
  onDone,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onDone: (id: string) => void;
}) {
  const [files, setFiles] = useState<string[]>([]);
  const [step, setStep] = useState(-1);
  const ocr = useOcrLegalDocument();

  useEffect(() => {
    if (!open) {
      setFiles([]);
      setStep(-1);
    }
  }, [open]);

  const start = () => {
    setStep(0);
    const timer = setInterval(
      () => setStep((s) => Math.min(s + 1, OCR_STEPS.length - 1)),
      380,
    );
    ocr.mutate(files[0], {
      onSuccess: (doc) => {
        clearInterval(timer);
        setStep(OCR_STEPS.length);
        toast.success(`${doc.docNumber} extracted and added to Legal Updates`);
        setTimeout(() => onDone(doc.id), 600);
      },
      onError: () => {
        clearInterval(timer);
        setStep(-1);
      },
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ScanText className="size-5" /> Upload a legal document
          </SheetTitle>
          <SheetDescription>
            PDF or scanned image. OCR reads the text and AI extracts the key
            content and the compliance impact (RFQ 5.2).
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 space-y-4 overflow-y-auto px-4 pb-6">
          <FileNamePicker
            value={files}
            onChange={setFiles}
            multiple={false}
            sampleName="TT_35_2026_NHNN_ban_scan.pdf"
            disabled={step >= 0}
          />
          {step >= 0 && (
            <ol className="space-y-2">
              {OCR_STEPS.map((s, i) => (
                <li key={s} className="flex items-center gap-2 text-sm">
                  {i < step || step === OCR_STEPS.length ? (
                    <CheckCircle2 className="size-4 text-success" />
                  ) : i === step ? (
                    <Loader2 className="size-4 animate-spin text-primary" />
                  ) : (
                    <span className="size-4 rounded-full border border-border" />
                  )}
                  <span
                    className={cn(
                      i > step &&
                        step !== OCR_STEPS.length &&
                        "text-muted-foreground",
                    )}
                  >
                    {s}
                  </span>
                </li>
              ))}
            </ol>
          )}
          {ocr.isError && (
            <p className="flex items-center gap-1.5 text-sm text-danger">
              <XCircle className="size-4" /> Extraction failed — try again.
            </p>
          )}
          <Button
            className="w-full"
            disabled={!files.length || step >= 0}
            onClick={start}
          >
            <Sparkles className="size-4" /> Extract with OCR + AI
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
