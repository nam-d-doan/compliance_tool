import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "motion/react";
import { format, formatDistance, parseISO } from "date-fns";
import {
  BellRing,
  BookMarked,
  CloudDownload,
  Loader2,
  Radio,
  RefreshCw,
  Scale,
  ScanText,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoadingState } from "@/components/common/LoadingState";
import { ToneBadge } from "@/components/cms";
import { useLegalUpdates, useQdnbList, useSmartSearch } from "@/hooks/queries";
import { useSyncLegalFeed } from "@/hooks/mutations";
import { useAuthStore, demoNow } from "@/stores";
import { hasPermission } from "@/constants/rbac";
import { RISK_LEVEL_VI, daysUntil } from "@/lib/cms-rules";
import { cn } from "@/lib/utils";
import type { InternalRegulation, LegalUpdate } from "@/types";
import { OcrSheet } from "@/pages/legal/LegalUpdatesPage";

type Kind = "law" | "qdnb";
type Validity = "all" | "in_force" | "upcoming";

interface LibDoc {
  id: string;
  kind: Kind;
  number: string;
  docType: string;
  title: string;
  issuer: string;
  field: string;
  issueDate: string;
  effectiveDate: string;
  summary: string;
  /** All searchable text (number, title, summary, article texts). */
  text: string;
  /** Passages a snippet can be cut from. */
  passages: string[];
  url: string;
  isNew: boolean;
  amends?: string;
  revising: boolean;
  version?: number;
  relevance?: LegalUpdate["relevance"];
}

function fromLaw(l: LegalUpdate): LibDoc {
  const amend = l.relations.find((r) =>
    ["amends", "replaces", "repeals"].includes(r.type),
  );
  const passages = [
    l.summary,
    ...l.articles.map((a) => `${a.number}. ${a.title}: ${a.content}`),
  ];
  return {
    id: l.id,
    kind: "law",
    number: l.docNumber,
    docType: l.docType,
    title: l.title,
    issuer: l.issuer,
    field: l.field,
    issueDate: l.issueDate,
    effectiveDate: l.effectiveDate,
    summary: l.summary,
    text: `${l.docType} ${l.docNumber} ${l.title} ${passages.join(" ")}`,
    passages,
    url: `/legal-updates/${l.id}`,
    isNew: !l.read || ["new", "under_review"].includes(l.status),
    amends: amend ? `${amend.docNumber}` : undefined,
    revising: false,
    relevance: l.relevance,
  };
}

function fromQdnb(q: InternalRegulation): LibDoc {
  const latest = q.versions[q.versions.length - 1];
  const passages = [
    latest.changeSummary,
    ...latest.articles.map((a) => `${a.number}. ${a.title}: ${a.content}`),
  ];
  return {
    id: q.id,
    kind: "qdnb",
    number: q.code,
    docType: q.docType,
    title: q.title,
    issuer: q.issuingLevel,
    field: q.field,
    issueDate: latest.issuedAt,
    effectiveDate: latest.effectiveAt,
    summary: `${q.ownerUnitName} · ${latest.changeSummary}`,
    text: `${q.docType} ${q.code} ${q.title} ${q.ownerUnitName} ${passages.join(" ")}`,
    passages,
    url: `/qdnb/${q.id}`,
    isNew: false,
    revising: !!q.activeRevisionId,
    version: q.currentVersion,
  };
}

/** Wraps every match of `q` in a <mark>. */
function Highlight({ text, q }: { text: string; q: string }) {
  const term = q.trim();
  if (!term) return <>{text}</>;
  const parts = text.split(
    new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"),
  );
  return (
    <>
      {parts.map((p, i) =>
        p.toLowerCase() === term.toLowerCase() ? (
          <mark
            key={i}
            className="rounded-sm bg-amber-200/70 px-0.5 text-foreground dark:bg-amber-400/30"
          >
            {p}
          </mark>
        ) : (
          p
        ),
      )}
    </>
  );
}

function snippet(doc: LibDoc, q: string): string {
  const term = q.trim().toLowerCase();
  if (!term) return doc.summary;
  const hit = doc.passages.find((p) => p.toLowerCase().includes(term));
  if (!hit) return doc.summary;
  const i = Math.max(0, hit.toLowerCase().indexOf(term) - 60);
  return (
    (i > 0 ? "…" : "") +
    hit.slice(i, i + 200) +
    (hit.length > i + 200 ? "…" : "")
  );
}

const EXAMPLES = [
  "cho vay bất động sản",
  "sinh trắc học",
  "giao dịch đáng ngờ",
  "kiểm soát nội bộ",
];

export default function LibraryPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { role } = useAuthStore();
  const canAdd = hasPermission(role, "legal:review");
  const lawsQuery = useLegalUpdates();
  const qdnbQuery = useQdnbList();
  const sync = useSyncLegalFeed();
  const [ocrOpen, setOcrOpen] = useState(false);

  const [q, setQ] = useState(params.get("q") ?? "");
  const [debounced, setDebounced] = useState(q);
  const [semantic, setSemantic] = useState(false);
  const kind = (params.get("type") as Kind | null) ?? "all";
  const [issuer, setIssuer] = useState("");
  const [field, setField] = useState("");
  const [validity, setValidity] = useState<Validity>("all");
  const [year, setYear] = useState("");
  const [sort, setSort] = useState<"newest" | "effective">("newest");

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q), 250);
    return () => clearTimeout(t);
  }, [q]);

  const setKind = (k: Kind | "all") => {
    if (k === "all") params.delete("type");
    else params.set("type", k);
    setParams(params, { replace: true });
  };

  const smart = useSmartSearch(semantic ? debounced : "", "semantic");

  const docs = useMemo(
    () => [
      ...(lawsQuery.data ?? []).map(fromLaw),
      ...(qdnbQuery.data ?? []).map(fromQdnb),
    ],
    [lawsQuery.data, qdnbQuery.data],
  );

  const now = demoNow();
  const issuers = Array.from(new Set(docs.map((d) => d.issuer))).sort();
  const fields = Array.from(new Set(docs.map((d) => d.field))).sort();
  const years = Array.from(
    new Set(docs.map((d) => parseISO(d.issueDate).getFullYear())),
  ).sort((a, b) => b - a);

  // Semantic mode: rank by the AI search, keeping only library documents.
  const semanticRank = useMemo(() => {
    const rank = new Map<string, { score: number; snippet: string }>();
    (smart.data ?? []).forEach((h) => {
      const m = h.url.match(/^\/(legal-updates|qdnb)\/([^/?#]+)/);
      if (!m) return;
      const prev = rank.get(m[2]);
      if (!prev || h.relevance > prev.score)
        rank.set(m[2], { score: h.relevance, snippet: h.snippet });
    });
    return rank;
  }, [smart.data]);

  const term = debounced.trim().toLowerCase();
  const results = docs
    .filter((d) => kind === "all" || d.kind === kind)
    .filter((d) => !issuer || d.issuer === issuer)
    .filter((d) => !field || d.field === field)
    .filter(
      (d) => !year || String(parseISO(d.issueDate).getFullYear()) === year,
    )
    .filter((d) => {
      if (validity === "all") return true;
      const eff = daysUntil(d.effectiveDate, now);
      return validity === "in_force" ? eff <= 0 : eff > 0;
    })
    .filter((d) =>
      !term
        ? true
        : semantic
          ? semanticRank.has(d.id) || d.text.toLowerCase().includes(term)
          : d.text.toLowerCase().includes(term),
    )
    .sort((a, b) => {
      if (term && semantic) {
        const diff =
          (semanticRank.get(b.id)?.score ?? 0) -
          (semanticRank.get(a.id)?.score ?? 0);
        if (diff) return diff;
      }
      return sort === "newest"
        ? b.issueDate.localeCompare(a.issueDate)
        : b.effectiveDate.localeCompare(a.effectiveDate);
    });

  const hasFilters = issuer || field || validity !== "all" || year;

  // Feed: newest laws received, plus QĐNB versions issued recently.
  const feed = useMemo(() => {
    const laws = (lawsQuery.data ?? []).map((l) => ({
      id: l.id,
      at: l.receivedAt,
      url: `/legal-updates/${l.id}`,
      kind: "law" as const,
      number: `${l.docType} ${l.docNumber}`,
      title: l.title,
      isNew: !l.read,
      amends: l.relations.find((r) =>
        ["amends", "replaces", "repeals"].includes(r.type),
      ),
      relevance: l.relevance,
      effectiveDate: l.effectiveDate,
    }));
    const issued = (qdnbQuery.data ?? [])
      .filter((x) => x.versions.length > 1)
      .map((x) => {
        const v = x.versions[x.versions.length - 1];
        return {
          id: x.id,
          at: v.issuedAt,
          url: `/qdnb/${x.id}`,
          kind: "qdnb" as const,
          number: v.decisionNo,
          title: x.title,
          isNew: false,
          amends: undefined,
          relevance: undefined,
          effectiveDate: v.effectiveAt,
          version: v.version,
        };
      });
    return [...laws, ...issued]
      .sort((a, b) => b.at.localeCompare(a.at))
      .slice(0, 9);
  }, [lawsQuery.data, qdnbQuery.data]);

  if (lawsQuery.isPending || qdnbQuery.isPending)
    return <LoadingState message="Loading the library…" />;

  const lawCount = docs.filter((d) => d.kind === "law").length;
  const qdnbCount = docs.length - lawCount;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="font-heading text-xl font-bold tracking-tight sm:text-2xl">
            Document Library
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Laws and regulations from the authorities together with Nam A Bank's
            internal regulations (QĐNB), in one place.
          </p>
        </div>
        {canAdd && (
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              disabled={sync.isPending}
              onClick={() =>
                sync.mutate(undefined, {
                  onSuccess: (r) =>
                    toast.success(
                      r.added.length
                        ? `${r.added.length} new document(s) received from the official feeds`
                        : "No new documents on the official feeds",
                    ),
                })
              }
            >
              {sync.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <RefreshCw className="size-4" />
              )}
              Check official feeds
            </Button>
            <Button onClick={() => setOcrOpen(true)}>
              <ScanText className="size-4" /> Add document (OCR)
            </Button>
          </div>
        )}
      </div>

      {/* Search first: one large box, filters right under it. */}
      <Card className="gap-3 py-4">
        <CardContent className="space-y-3">
          <div className="flex flex-col gap-2 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-muted-foreground" />
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by number, title or content — e.g. “cho vay bất động sản”"
                className="h-12 w-full rounded-xl border border-input bg-background pr-10 pl-11 text-[15px] outline-none focus-visible:ring-2 focus-visible:ring-ring/40 dark:bg-input/30"
              />
              {q && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => setQ("")}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => setSemantic((s) => !s)}
              title="Semantic search understands meaning and banking synonyms (RFQ 5.1)"
              className={cn(
                "flex h-12 shrink-0 items-center gap-2 rounded-xl border px-4 text-sm font-semibold transition-colors",
                semantic
                  ? "border-violet-500/40 bg-violet-500/10 text-violet-700 dark:text-violet-300"
                  : "border-input text-muted-foreground hover:bg-muted/50",
              )}
            >
              <Sparkles className="size-4" />
              AI semantic search {semantic ? "on" : "off"}
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1 rounded-lg bg-muted p-1">
              {(
                [
                  ["all", `All (${docs.length})`],
                  ["law", `Laws & regulations (${lawCount})`],
                  ["qdnb", `Internal regulations (${qdnbCount})`],
                ] as const
              ).map(([k, label]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setKind(k)}
                  className={cn(
                    "h-8 rounded-md px-3 text-xs font-semibold",
                    kind === k
                      ? "bg-background shadow-sm"
                      : "text-muted-foreground",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <FilterSelect
              value={issuer}
              onChange={setIssuer}
              placeholder="All issuers"
            >
              {issuers.map((x) => (
                <option key={x} value={x}>
                  {x}
                </option>
              ))}
            </FilterSelect>
            <FilterSelect
              value={field}
              onChange={setField}
              placeholder="All fields"
            >
              {fields.map((x) => (
                <option key={x} value={x}>
                  {x}
                </option>
              ))}
            </FilterSelect>
            <FilterSelect
              value={validity === "all" ? "" : validity}
              onChange={(v) => setValidity((v || "all") as Validity)}
              placeholder="Any validity"
            >
              <option value="in_force">In force</option>
              <option value="upcoming">Not yet in force</option>
            </FilterSelect>
            <FilterSelect
              value={year}
              onChange={setYear}
              placeholder="Any year"
            >
              {years.map((y) => (
                <option key={y} value={String(y)}>
                  {y}
                </option>
              ))}
            </FilterSelect>
            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIssuer("");
                  setField("");
                  setValidity("all");
                  setYear("");
                }}
              >
                <X className="size-3.5" /> Clear filters
              </Button>
            )}
          </div>

          {!q && (
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
              <span>Try:</span>
              {EXAMPLES.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setQ(e)}
                  className="rounded-full border border-border px-2.5 py-0.5 hover:bg-muted/50 hover:text-foreground"
                  data-no-translate
                >
                  {e}
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <div className="min-w-0 space-y-3">
          <div className="flex items-center justify-between gap-2 text-sm">
            <p className="text-muted-foreground">
              {semantic && smart.isFetching ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="size-3.5 animate-spin" /> AI is reading
                  the documents…
                </span>
              ) : (
                <>
                  <span className="font-semibold text-foreground">
                    {results.length}
                  </span>{" "}
                  document(s)
                  {term ? (
                    <>
                      {" "}
                      for “<span data-no-translate>{debounced}</span>”
                    </>
                  ) : null}
                </>
              )}
            </p>
            {!(term && semantic) && (
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as typeof sort)}
                className="h-8 rounded-lg border border-input bg-background px-2 text-xs dark:bg-input/30"
              >
                <option value="newest">Newest first</option>
                <option value="effective">By effective date</option>
              </select>
            )}
          </div>

          {results.length === 0 && (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                No document matches. Try other words or switch on AI semantic
                search.
              </CardContent>
            </Card>
          )}

          {results.map((d, i) => {
            const eff = daysUntil(d.effectiveDate, now);
            const snip =
              term && semantic && semanticRank.get(d.id)
                ? semanticRank.get(d.id)!.snippet
                : snippet(d, debounced);
            return (
              <motion.button
                key={d.id}
                type="button"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i, 10) * 0.02 }}
                onClick={() => navigate(d.url)}
                className="group block w-full rounded-xl border border-border bg-card p-4 text-left shadow-[var(--card-shadow)] transition-colors hover:border-primary/40"
              >
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {d.kind === "law" ? (
                    <ToneBadge tone="info" icon={Scale}>
                      Law / regulation
                    </ToneBadge>
                  ) : (
                    <ToneBadge tone="neutral" icon={BookMarked}>
                      Internal regulation
                    </ToneBadge>
                  )}
                  <span className="font-mono font-semibold" data-no-translate>
                    {d.docType} {d.number}
                  </span>
                  {d.version && (
                    <span className="text-muted-foreground">v{d.version}</span>
                  )}
                  {d.isNew && <ToneBadge tone="danger">New</ToneBadge>}
                  {d.amends && (
                    <ToneBadge tone="warning">Amends {d.amends}</ToneBadge>
                  )}
                  {d.revising && (
                    <ToneBadge tone="warning">Being revised</ToneBadge>
                  )}
                  {term && semantic && semanticRank.get(d.id) && (
                    <ToneBadge tone="ai" icon={Sparkles}>
                      {semanticRank.get(d.id)!.score}% match
                    </ToneBadge>
                  )}
                </div>
                <p className="mt-1.5 text-[15px] font-semibold leading-snug group-hover:text-primary">
                  <Highlight text={d.title} q={debounced} />
                </p>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                  <Highlight text={snip} q={debounced} />
                </p>
                <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span>{d.issuer}</span>
                  <span>{d.field}</span>
                  <span>
                    Issued {format(parseISO(d.issueDate), "dd/MM/yyyy")}
                  </span>
                  <span
                    className={cn(
                      eff > 0 && eff <= 60 && "font-semibold text-warning",
                    )}
                  >
                    {eff > 0
                      ? `Takes effect ${format(parseISO(d.effectiveDate), "dd/MM/yyyy")} (in ${eff} days)`
                      : `In force since ${format(parseISO(d.effectiveDate), "dd/MM/yyyy")}`}
                  </span>
                </p>
              </motion.button>
            );
          })}
        </div>

        <aside className="space-y-4">
          <Card className="xl:sticky xl:top-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BellRing className="size-4" /> New & amended documents
              </CardTitle>
              <CardDescription>
                Alerts from the official feeds (NHNN, Chính phủ, Quốc hội…) and
                newly issued QĐNB versions
              </CardDescription>
              <CardAction>
                <span className="flex items-center gap-1 text-xs font-semibold text-success">
                  <Radio className="size-3.5 animate-pulse" /> Live
                </span>
              </CardAction>
            </CardHeader>
            <CardContent className="space-y-1">
              {feed.map((f) => (
                <Link
                  key={`${f.kind}-${f.id}`}
                  to={f.url}
                  className="relative block rounded-lg border-l-2 py-2 pr-2 pl-3 hover:bg-muted/50"
                  style={{
                    borderLeftColor: f.isNew
                      ? "var(--danger)"
                      : f.kind === "qdnb"
                        ? "var(--success)"
                        : "var(--border)",
                  }}
                >
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                    <span className="text-muted-foreground">
                      {formatDistance(parseISO(f.at), now, { addSuffix: true })}
                    </span>
                    {f.isNew && <ToneBadge tone="danger">New</ToneBadge>}
                    {f.amends && (
                      <ToneBadge tone="warning">Amendment</ToneBadge>
                    )}
                    {f.kind === "qdnb" && (
                      <ToneBadge tone="success">QĐNB issued</ToneBadge>
                    )}
                    {f.relevance && (
                      <span
                        className={cn(
                          "font-semibold",
                          f.relevance === "high"
                            ? "text-danger"
                            : f.relevance === "medium"
                              ? "text-warning"
                              : "text-muted-foreground",
                        )}
                        title="AI relevance to Nam A Bank"
                      >
                        NAB: {RISK_LEVEL_VI[f.relevance]}
                      </span>
                    )}
                  </div>
                  <p
                    className="mt-0.5 font-mono text-xs font-semibold"
                    data-no-translate
                  >
                    {f.number}
                  </p>
                  <p className="line-clamp-2 text-xs">{f.title}</p>
                </Link>
              ))}
              <p className="flex items-center gap-1.5 pt-2 text-[11px] text-muted-foreground">
                <CloudDownload className="size-3.5" /> Sources: vbpl.vn, Công
                báo, NHNN, VietLex
              </p>
            </CardContent>
          </Card>
        </aside>
      </div>

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

function FilterSelect({
  value,
  onChange,
  placeholder,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  children: React.ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "h-9 rounded-lg border border-input bg-background px-2.5 text-sm dark:bg-input/30",
        value && "border-primary/50 font-medium",
      )}
    >
      <option value="">{placeholder}</option>
      {children}
    </select>
  );
}
