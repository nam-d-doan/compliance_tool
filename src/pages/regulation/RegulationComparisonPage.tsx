import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { motion } from "motion/react";
import { format } from "date-fns";
import {
  ArrowLeft,
  Sparkles,
  FileDown,
  GitCompare,
  CheckCircle,
  XCircle,
  Minus,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/common/StatusBadge";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { DetailSkeleton } from "@/components/common/Skeletons";
import { PageHero } from "@/components/common";
import { TypewriterText } from "@/components/ai/TypewriterText";
import { AIExplanation } from "@/components/ai/AIExplanation";
import {
  useRegulationList,
  useRegulationComparison,
} from "@/hooks/queries/useRegulationQueries";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Regulation, AIExplanation as AIExplanationType } from "@/types";

const PAGE_SIZE = 100;

const ATTRIBUTES: {
  key: keyof Regulation | "requirementsCount";
  label: string;
  format?: (value: unknown) => React.ReactNode;
}[] = [
  { key: "reference", label: "Reference" },
  { key: "title", label: "Title" },
  { key: "regulator", label: "Regulator" },
  { key: "category", label: "Category" },
  { key: "jurisdiction", label: "Jurisdiction" },
  {
    key: "effectiveDate",
    label: "Effective Date",
    format: (v) => format(new Date(v as string), "MMM d, yyyy"),
  },
  {
    key: "status",
    label: "Status",
    format: (v) => <StatusBadge status={v as string} size="sm" />,
  },
  { key: "summary", label: "Summary" },
  { key: "requirementsCount", label: "Requirements" },
  {
    key: "affectedDepartments",
    label: "Affected Departments",
    format: (v) => (
      <div className="flex flex-wrap gap-1">
        {(v as string[]).map((d) => (
          <Badge key={d} variant="secondary" className="text-xs">
            {d}
          </Badge>
        ))}
      </div>
    ),
  },
  {
    key: "aiImpactScore",
    label: "AI Impact Score",
    format: (v) => (
      <span
        className={cn(
          "font-medium",
          (v as number) >= 80
            ? "text-red-600 dark:text-red-400"
            : (v as number) >= 50
              ? "text-amber-600 dark:text-amber-400"
              : "text-emerald-600 dark:text-emerald-400",
        )}
      >
        {v as number}
      </span>
    ),
  },
];

function DiffIcon({
  state,
}: {
  state: "same" | "different" | "added" | "removed";
}) {
  if (state === "same")
    return (
      <CheckCircle className="size-4 text-emerald-500" aria-hidden="true" />
    );
  if (state === "different")
    return <AlertCircle className="size-4 text-amber-500" aria-hidden="true" />;
  if (state === "added")
    return <GitCompare className="size-4 text-blue-500" aria-hidden="true" />;
  return <XCircle className="size-4 text-red-500" aria-hidden="true" />;
}

function getDiffState(
  a: unknown,
  b: unknown,
  key: keyof Regulation | "requirementsCount",
): "same" | "different" | "added" | "removed" {
  if (key === "affectedDepartments") {
    const aArr = Array.isArray(a) ? a : [];
    const bArr = Array.isArray(b) ? b : [];
    if (aArr.length === 0 && bArr.length > 0) return "removed";
    if (aArr.length > 0 && bArr.length === 0) return "added";
    if (JSON.stringify(aArr.sort()) === JSON.stringify(bArr.sort()))
      return "same";
    return "different";
  }
  if (JSON.stringify(a) === JSON.stringify(b)) return "same";
  return "different";
}

function getAttributeValue(
  item: Regulation,
  key: keyof Regulation | "requirementsCount",
): unknown {
  if (key === "requirementsCount") return item.requirements.length;
  return item[key];
}

export default function RegulationComparisonPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [aId, setAId] = useState(searchParams.get("a") ?? "");
  const [bId, setBId] = useState(searchParams.get("b") ?? "");
  const [explanationOpen, setExplanationOpen] = useState(false);

  useEffect(() => {
    setAId(searchParams.get("a") ?? "");
    setBId(searchParams.get("b") ?? "");
  }, [searchParams]);

  const regulations = useRegulationList({}, 1, PAGE_SIZE);
  const comparison = useRegulationComparison(aId, bId);

  const itemA = comparison.data?.regulationA;
  const itemB = comparison.data?.regulationB;

  const explanation: AIExplanationType | null = useMemo(
    () =>
      comparison.data
        ? {
            recommendation:
              "Review key differences before updating compliance mappings.",
            confidence: 0.88,
            reasoning: [
              `Compared ${comparison.data.regulationA.reference} and ${comparison.data.regulationB.reference}.`,
              `${comparison.data.added.length} requirements added, ${comparison.data.removed.length} removed, ${comparison.data.modified.length} modified.`,
              "AI summary highlights jurisdictional and scope differences.",
            ],
            references: [
              {
                title: comparison.data.regulationA.reference,
                url: `/regulation/${comparison.data.regulationA.id}`,
              },
              {
                title: comparison.data.regulationB.reference,
                url: `/regulation/${comparison.data.regulationB.id}`,
              },
            ],
            relatedDocuments: comparison.data.added.concat(
              comparison.data.removed,
            ),
            historicalSimilarity: 0.68,
            timestamp: new Date().toISOString(),
            modelVersion: "regulation-compare-v1",
          }
        : null,
    [comparison.data],
  );

  const handleSelect = (side: "a" | "b", id: string) => {
    const next = new URLSearchParams(searchParams);
    next.set(side, id);
    setSearchParams(next);
  };

  const handleExport = () => {
    toast.success("Comparison exported (demo)");
  };

  const hasSelection = Boolean(aId && bId);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <PageHero
        title="Compare Regulations"
        subtitle="Side-by-side comparison of two regulations with AI-generated difference summary."
      >
        <Button
          variant="ghost"
          size="sm"
          className="text-white/90 hover:bg-white/10 hover:text-white"
          onClick={() => navigate("/regulation")}
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to library
        </Button>
      </PageHero>

      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">
                Regulation A
              </label>
              <select
                value={aId}
                onChange={(e) => handleSelect("a", e.target.value)}
                className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
              >
                <option value="">Select regulation A</option>
                {regulations.data?.items.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.reference} — {r.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">
                Regulation B
              </label>
              <select
                value={bId}
                onChange={(e) => handleSelect("b", e.target.value)}
                className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
              >
                <option value="">Select regulation B</option>
                {regulations.data?.items.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.reference} — {r.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {!hasSelection ? (
        <EmptyState
          title="Select two regulations"
          description="Choose regulations from the dropdowns above to start comparing."
        />
      ) : comparison.isPending ? (
        <DetailSkeleton />
      ) : comparison.isError ? (
        <ErrorState onRetry={() => comparison.refetch()} />
      ) : !itemA || !itemB ? (
        <EmptyState
          title="Regulations not found"
          description="One or both selected regulations could not be loaded."
        />
      ) : (
        <div className="space-y-6">
          <Card className="border-primary/10 bg-gradient-to-br from-primary/5 via-card to-card dark:border-primary/20 dark:from-primary/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="size-4 text-primary" aria-hidden="true" />
                AI Comparison Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-muted/50 p-4 text-sm leading-relaxed">
                <TypewriterText text={comparison.data.aiSummary} speed={12} />
              </div>
              <div className="flex flex-wrap gap-2">
                {comparison.data.added.length > 0 && (
                  <Badge variant="secondary" className="gap-1">
                    <GitCompare className="size-3" aria-hidden="true" />
                    {comparison.data.added.length} added
                  </Badge>
                )}
                {comparison.data.removed.length > 0 && (
                  <Badge variant="secondary" className="gap-1">
                    <Minus className="size-3" aria-hidden="true" />
                    {comparison.data.removed.length} removed
                  </Badge>
                )}
                {comparison.data.modified.length > 0 && (
                  <Badge variant="secondary" className="gap-1">
                    <AlertCircle className="size-3" aria-hidden="true" />
                    {comparison.data.modified.length} modified
                  </Badge>
                )}
              </div>
              {explanation && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setExplanationOpen(true)}
                    className="gap-1"
                  >
                    <Sparkles className="size-3.5" aria-hidden="true" />
                    Explain differences
                  </Button>
                  <AIExplanation
                    explanation={explanation}
                    open={explanationOpen}
                    onOpenChange={setExplanationOpen}
                  />
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Comparison Table</CardTitle>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <FileDown className="size-4" aria-hidden="true" />
                Export
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium">
                        Attribute
                      </th>
                      <th className="px-4 py-3 text-left font-medium">
                        {itemA.reference}
                      </th>
                      <th className="px-4 py-3 text-left font-medium">
                        {itemB.reference}
                      </th>
                      <th className="px-4 py-3 text-left font-medium">Δ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ATTRIBUTES.map((attr) => {
                      const aValue = getAttributeValue(itemA, attr.key);
                      const bValue = getAttributeValue(itemB, attr.key);
                      const state = getDiffState(aValue, bValue, attr.key);
                      return (
                        <tr key={attr.key} className="border-b border-border">
                          <td className="px-4 py-3 font-medium text-foreground">
                            {attr.label}
                          </td>
                          <td className="max-w-xs px-4 py-3 text-muted-foreground">
                            {attr.format
                              ? attr.format(aValue)
                              : (aValue as React.ReactNode)}
                          </td>
                          <td className="max-w-xs px-4 py-3 text-muted-foreground">
                            {attr.format
                              ? attr.format(bValue)
                              : (bValue as React.ReactNode)}
                          </td>
                          <td className="px-4 py-3">
                            <DiffIcon state={state} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  Added in {itemA.reference}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {comparison.data.added.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No additions detected.
                  </p>
                ) : (
                  <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                    {comparison.data.added.map((text, i) => (
                      <li key={i}>{text}</li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  Removed from {itemB.reference}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {comparison.data.removed.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No removals detected.
                  </p>
                ) : (
                  <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                    {comparison.data.removed.map((text, i) => (
                      <li key={i}>{text}</li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-center">
            <Button asChild>
              <Link to={`/regulation/${itemA.id}`}>View {itemA.reference}</Link>
            </Button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
