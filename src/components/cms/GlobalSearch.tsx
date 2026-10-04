import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  FileText,
  Loader2,
  Scale,
  Search,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { useSmartSearch } from "@/hooks/queries";
import { cn } from "@/lib/utils";
import type { SearchHit } from "@/services/cms_service";

const KIND_ICON: Record<SearchHit["kind"], typeof Search> = {
  law: Scale,
  qdnb: BookOpen,
  article: FileText,
  issue: ShieldAlert,
};
const KIND_LABEL: Record<SearchHit["kind"], string> = {
  law: "Law",
  qdnb: "QĐNB",
  article: "Article",
  issue: "Issue",
};

const EXAMPLES = [
  "tỷ lệ cho vay bất động sản",
  "sinh trắc học mở tài khoản",
  "báo cáo giao dịch đáng ngờ",
  "ba tuyến bảo vệ",
];

/**
 * Smart repository search (RFQ 5.1). Semantic mode expands the query with
 * banking synonyms and ranks passages; keyword mode is a plain match.
 * Opens with the search button or Ctrl/Cmd + K.
 */
export function GlobalSearch({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [mode, setMode] = useState<"semantic" | "keyword">("semantic");

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  const { data, isFetching } = useSmartSearch(debounced, mode);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="top"
        className="mx-auto w-full max-w-3xl rounded-b-2xl"
      >
        <SheetHeader className="pb-0">
          <SheetTitle className="flex items-center gap-2">
            <Search className="size-5" /> Search the compliance repository
          </SheetTitle>
          <SheetDescription>
            Laws, internal regulations (QĐNB), articles and compliance issues.
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-3 px-4 pb-5">
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Ask in plain words, e.g. “quy định về tỷ lệ LTV cho vay bất động sản”"
                className="h-10 pl-9"
              />
            </div>
            <div className="inline-flex h-10 shrink-0 items-center gap-1 rounded-lg bg-muted p-1">
              {(["semantic", "keyword"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={cn(
                    "flex h-8 items-center gap-1.5 rounded-md px-3 text-xs font-semibold",
                    mode === m
                      ? "bg-background shadow-sm"
                      : "text-muted-foreground",
                  )}
                >
                  {m === "semantic" && <Sparkles className="size-3.5" />}
                  {m === "semantic" ? "Semantic (AI)" : "Keyword"}
                </button>
              ))}
            </div>
          </div>

          {!debounced && (
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
              Try:
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => setQ(ex)}
                  className="rounded-full border border-border px-2 py-0.5 hover:bg-muted"
                >
                  {ex}
                </button>
              ))}
            </div>
          )}

          <div className="max-h-[55vh] space-y-1.5 overflow-y-auto">
            {isFetching && (
              <div className="flex items-center gap-2 p-3 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> Searching…
              </div>
            )}
            {!isFetching && debounced.length >= 2 && data?.length === 0 && (
              <p className="p-3 text-sm text-muted-foreground">
                No results.{" "}
                {mode === "keyword" &&
                  "Try Semantic mode — it also matches related terms."}
              </p>
            )}
            {data?.map((hit) => {
              const Icon = KIND_ICON[hit.kind];
              return (
                <button
                  key={hit.id}
                  type="button"
                  onClick={() => {
                    onOpenChange(false);
                    navigate(hit.url);
                  }}
                  className="flex w-full items-start gap-3 rounded-lg border border-border bg-card p-3 text-left transition-colors hover:bg-muted/50"
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <Icon className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-sm font-semibold">
                        {hit.title}
                      </span>
                      <span className="shrink-0 rounded bg-muted px-1.5 text-[10px] text-muted-foreground">
                        {KIND_LABEL[hit.kind]}
                      </span>
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {hit.subtitle}
                    </span>
                    <span className="mt-1 block text-xs text-foreground/80">
                      {hit.snippet}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block text-xs font-semibold tabular-nums">
                      {hit.relevance}%
                    </span>
                    <span className="block text-[10px] text-muted-foreground">
                      match
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
