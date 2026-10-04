import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface DiffArticle {
  number: string;
  title: string;
  content: string;
}

type Token = { text: string; kind: "same" | "add" | "del" };

/** Word-level diff (LCS) — small inputs only, fine for article texts. */
function diffWords(a: string, b: string): Token[] {
  const x = a.split(/(\s+)/);
  const y = b.split(/(\s+)/);
  const n = x.length;
  const m = y.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () =>
    new Array<number>(m + 1).fill(0),
  );
  for (let i = n - 1; i >= 0; i--)
    for (let j = m - 1; j >= 0; j--)
      dp[i][j] =
        x[i] === y[j]
          ? dp[i + 1][j + 1] + 1
          : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const out: Token[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (x[i] === y[j]) {
      out.push({ text: x[i], kind: "same" });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      out.push({ text: x[i++], kind: "del" });
    } else {
      out.push({ text: y[j++], kind: "add" });
    }
  }
  while (i < n) out.push({ text: x[i++], kind: "del" });
  while (j < m) out.push({ text: y[j++], kind: "add" });
  return out;
}

export interface DiffSummary {
  added: number;
  removed: number;
  modified: number;
}

/**
 * Side-by-side diff of two document versions (RFQ 5.1 — "so sánh tự động
 * điểm mới/cũ"). Articles are matched by number.
 */
export function DiffView({
  before,
  after,
  beforeLabel,
  afterLabel,
}: {
  before: DiffArticle[];
  after: DiffArticle[];
  beforeLabel: string;
  afterLabel: string;
}) {
  const rows = useMemo(() => {
    const numbers = Array.from(
      new Set([...before.map((a) => a.number), ...after.map((a) => a.number)]),
    );
    return numbers.map((num) => {
      const a = before.find((x) => x.number === num);
      const b = after.find((x) => x.number === num);
      const status: "same" | "added" | "removed" | "modified" = !a
        ? "added"
        : !b
          ? "removed"
          : a.content === b.content && a.title === b.title
            ? "same"
            : "modified";
      return {
        num,
        a,
        b,
        status,
        tokens: a && b ? diffWords(a.content, b.content) : [],
      };
    });
  }, [before, after]);

  const summary: DiffSummary = {
    added: rows.filter((r) => r.status === "added").length,
    removed: rows.filter((r) => r.status === "removed").length,
    modified: rows.filter((r) => r.status === "modified").length,
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 text-xs">
        <span className="rounded-full bg-success-bg px-2 py-0.5 font-medium text-success">
          +{summary.added} added
        </span>
        <span className="rounded-full bg-warning-bg px-2 py-0.5 font-medium text-warning">
          ~{summary.modified} changed
        </span>
        <span className="rounded-full bg-danger-bg px-2 py-0.5 font-medium text-danger">
          −{summary.removed} removed
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-muted-foreground">
        <span>{beforeLabel}</span>
        <span>{afterLabel}</span>
      </div>
      <div className="space-y-2">
        {rows.map((r) => (
          <div
            key={r.num}
            className={cn(
              "grid grid-cols-2 gap-2 rounded-lg border p-2",
              r.status === "same" && "border-border opacity-70",
              r.status === "modified" && "border-warning/40",
              r.status === "added" && "border-success/40",
              r.status === "removed" && "border-danger/40",
            )}
          >
            <div
              className={cn(
                "rounded-md p-2 text-sm",
                r.status === "removed" && "bg-danger-bg/60",
                !r.a && "bg-muted/30",
              )}
            >
              {r.a ? (
                <>
                  <p className="text-xs font-semibold">
                    {r.a.number}. {r.a.title}
                  </p>
                  <p className="mt-1 leading-relaxed">
                    {r.status === "modified"
                      ? r.tokens
                          .filter((t) => t.kind !== "add")
                          .map((t, i) => (
                            <span
                              key={i}
                              className={cn(
                                t.kind === "del" &&
                                  "rounded bg-danger-bg text-danger line-through",
                              )}
                            >
                              {t.text}
                            </span>
                          ))
                      : r.a.content}
                  </p>
                </>
              ) : (
                <p className="text-xs text-muted-foreground italic">
                  — not present —
                </p>
              )}
            </div>
            <div
              className={cn(
                "rounded-md p-2 text-sm",
                r.status === "added" && "bg-success-bg/60",
                !r.b && "bg-muted/30",
              )}
            >
              {r.b ? (
                <>
                  <p className="text-xs font-semibold">
                    {r.b.number}. {r.b.title}
                  </p>
                  <p className="mt-1 leading-relaxed">
                    {r.status === "modified"
                      ? r.tokens
                          .filter((t) => t.kind !== "del")
                          .map((t, i) => (
                            <span
                              key={i}
                              className={cn(
                                t.kind === "add" &&
                                  "rounded bg-success-bg font-medium text-success",
                              )}
                            >
                              {t.text}
                            </span>
                          ))
                      : r.b.content}
                  </p>
                </>
              ) : (
                <p className="text-xs text-muted-foreground italic">
                  — removed —
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function summarizeDiff(
  before: DiffArticle[],
  after: DiffArticle[],
): DiffSummary {
  const nums = new Set([
    ...before.map((a) => a.number),
    ...after.map((a) => a.number),
  ]);
  let added = 0;
  let removed = 0;
  let modified = 0;
  nums.forEach((n) => {
    const a = before.find((x) => x.number === n);
    const b = after.find((x) => x.number === n);
    if (!a) added++;
    else if (!b) removed++;
    else if (a.content !== b.content || a.title !== b.title) modified++;
  });
  return { added, removed, modified };
}
