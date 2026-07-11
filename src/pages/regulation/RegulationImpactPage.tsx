import { useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "motion/react";
import {
  ArrowLeft,
  Sparkles,
  Building2,
  Shield,
  Loader2,
  Lightbulb,
  AlertTriangle,
  CheckCircle,
  ShieldAlert,
  Plus,
  Target,
  Users,
  ListChecks,
  GitBranch,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ErrorState } from "@/components/common/ErrorState";
import { DetailSkeleton, ListSkeleton } from "@/components/common/Skeletons";
import { PageHero } from "@/components/common";
import { TypewriterText } from "@/components/ai/TypewriterText";
import { AIExplanation } from "@/components/ai/AIExplanation";
import { ConfidenceIndicator } from "@/components/ai/ConfidenceIndicator";
import { useRegulationDetail } from "@/hooks/queries/useRegulationQueries";
import { useObligationList } from "@/hooks/queries/useObligationQueries";
import { useRegulationImpact as useAIRegulationImpact } from "@/hooks/mutations/useAIMutations";
import { cn } from "@/lib/utils";
import { riskScoreStrokeClasses } from "@/lib/risk-score";
import { toast } from "sonner";
import type { AIExplanation as AIExplanationType } from "@/types";

const RECOMMENDED_ACTIONS = [
  {
    action: "Map new requirements to existing compliance obligations.",
    priority: "high",
    owner: "Compliance Owner",
    dueOffset: "2 weeks",
  },
  {
    action: "Assess regulatory implications with Legal and Operations.",
    priority: "medium",
    owner: "Legal Counsel",
    dueOffset: "4 weeks",
  },
  {
    action: "Update affected policies and communicate changes.",
    priority: "high",
    owner: "Policy Manager",
    dueOffset: "3 weeks",
  },
  {
    action: "Validate control design and operating effectiveness.",
    priority: "medium",
    owner: "Internal Audit",
    dueOffset: "6 weeks",
  },
] as const;

function ImpactGauge({ value, size = 120 }: { value: number; size?: number }) {
  const percent = Math.max(0, Math.min(100, value));
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - percent / 100);
  const color = riskScoreStrokeClasses(percent);

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className="fill-none stroke-muted"
          strokeWidth={10}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className={cn("fill-none", color)}
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </svg>
      <span className="absolute text-2xl font-bold">{percent}</span>
    </div>
  );
}

function DependencyGraph({
  regulation,
  obligations,
  departments,
}: {
  regulation: string;
  obligations: string[];
  departments: string[];
}) {
  const nodeHeight = 36;
  const colGap = 180;
  const rowGap = 48;
  const padding = 24;
  const maxRows = Math.max(obligations.length, departments.length, 1);
  const height = padding * 2 + maxRows * rowGap + nodeHeight;
  const width = padding * 2 + colGap * 3;

  const colX = [padding + 80, padding + colGap + 80, padding + colGap * 2 + 80];
  const rootY = height / 2;

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card p-4">
      <svg width={width} height={height} className="min-w-[640px]">
        {obligations.slice(0, 4).map((_, i) => {
          const y = padding + i * rowGap + nodeHeight / 2;
          return (
            <line
              key={`root-obl-${i}`}
              x1={colX[0] + 60}
              y1={rootY}
              x2={colX[1] - 60}
              y2={y}
              className="stroke-border"
              strokeWidth={2}
            />
          );
        })}
        {departments.slice(0, 4).map((_, i) => {
          const y = padding + i * rowGap + nodeHeight / 2;
          return (
            <line
              key={`root-dept-${i}`}
              x1={colX[0] + 60}
              y1={rootY}
              x2={colX[2] - 60}
              y2={y}
              className="stroke-border"
              strokeWidth={2}
            />
          );
        })}
        <g transform={`translate(${colX[0] - 80}, ${rootY - nodeHeight / 2})`}>
          <rect
            width={160}
            height={nodeHeight}
            rx={18}
            className="fill-primary stroke-primary"
          />
          <text
            x={80}
            y={nodeHeight / 2 + 5}
            textAnchor="middle"
            className="fill-primary-foreground text-xs font-medium"
          >
            {regulation}
          </text>
        </g>

        {obligations.slice(0, 4).map((label, i) => (
          <g
            key={`obl-${i}`}
            transform={`translate(${colX[1] - 80}, ${padding + i * rowGap})`}
          >
            <rect
              width={160}
              height={nodeHeight}
              rx={18}
              className="fill-blue-100 stroke-blue-300 dark:fill-blue-900/30 dark:stroke-blue-700"
            />
            <text
              x={80}
              y={nodeHeight / 2 + 5}
              textAnchor="middle"
              className="fill-blue-800 text-xs font-medium dark:fill-blue-300"
            >
              {label.slice(0, 18)}
              {label.length > 18 ? "…" : ""}
            </text>
          </g>
        ))}

        {departments.slice(0, 4).map((label, i) => (
          <g
            key={`dept-${i}`}
            transform={`translate(${colX[2] - 80}, ${padding + i * rowGap})`}
          >
            <rect
              width={160}
              height={nodeHeight}
              rx={18}
              className="fill-emerald-100 stroke-emerald-300 dark:fill-emerald-900/30 dark:stroke-emerald-700"
            />
            <text
              x={80}
              y={nodeHeight / 2 + 5}
              textAnchor="middle"
              className="fill-emerald-800 text-xs font-medium dark:fill-emerald-300"
            >
              {label.slice(0, 18)}
              {label.length > 18 ? "…" : ""}
            </text>
          </g>
        ))}
      </svg>
      <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-3 rounded-full bg-primary" />
          Regulation
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-3 rounded-full bg-blue-500" />
          Obligation
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-3 rounded-full bg-emerald-500" />
          Department
        </span>
      </div>
    </div>
  );
}

export default function RegulationImpactPage() {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [explanationOpen, setExplanationOpen] = useState(false);

  const detail = useRegulationDetail(id);
  const obligations = useObligationList({ regulationId: id }, 1, 50);
  const aiImpact = useAIRegulationImpact();

  const item = detail.data;
  const impactResult = aiImpact.data;
  const impactScore = item
    ? item.priority === "critical"
      ? 95
      : item.priority === "high"
        ? 75
        : item.priority === "medium"
          ? 50
          : 25
    : 0;

  const explanation: AIExplanationType | null = useMemo(
    () =>
      impactResult
        ? {
            ...impactResult.explanation,
            relatedDocuments: impactResult.impact.affectedPolicies,
          }
        : null,
    [impactResult],
  );

  const handleRunImpact = () => {
    if (!id) return;
    aiImpact.mutate(id, {
      onSuccess: () => {
        toast.success("Impact analysis complete");
      },
    });
  };

  if (detail.isPending) {
    return <DetailSkeleton />;
  }

  if (detail.isError || !item) {
    return <ErrorState onRetry={() => detail.refetch()} />;
  }

  const obligationItems = obligations.data?.items ?? [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <PageHero
        title="Impact Analysis"
        subtitle={`Deep-dive AI impact assessment for ${item.title}`}
      >
        <Button
          variant="ghost"
          size="sm"
          className="text-white/90 hover:bg-white/10 hover:text-white"
          onClick={() => navigate(`/regulation/${id}`)}
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to regulation
        </Button>
      </PageHero>

      <Card className="border-primary/10 bg-gradient-to-br from-primary/5 via-card to-card dark:border-primary/20 dark:from-primary/10">
        <CardContent className="space-y-6 pt-6">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Sparkles className="size-5" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-base font-medium">AI Impact Analysis</h3>
                <p className="text-xs text-muted-foreground">
                  Run the model to estimate scope, effort, and risk.
                </p>
              </div>
            </div>
            <Button onClick={handleRunImpact} disabled={aiImpact.isPending}>
              {aiImpact.isPending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Sparkles className="size-4" aria-hidden="true" />
              )}
              Run Impact Analysis
            </Button>
          </div>

          {impactResult && (
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="flex flex-col items-center justify-center gap-3 rounded-xl bg-card p-6 ring-1 ring-border">
                <ImpactGauge value={impactScore} />
                <div className="text-center">
                  <p className="text-sm font-medium">Overall Impact Score</p>
                  <p className="text-xs text-muted-foreground">
                    {impactScore}/100
                  </p>
                </div>
                <ConfidenceIndicator
                  confidence={impactResult.explanation.confidence}
                  size="md"
                />
              </div>

              <div className="lg:col-span-2 space-y-4">
                <div className="rounded-lg bg-muted/50 p-4 text-sm leading-relaxed">
                  <TypewriterText
                    text={impactResult.impact.aiSummary}
                    speed={12}
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">
                      Estimated Effort
                    </span>
                    <p className="text-sm font-medium">
                      {impactResult.impact.estimatedEffort}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">
                      Risk Level
                    </span>
                    <p className="text-sm font-medium">
                      {item.priority === "critical"
                        ? "High"
                        : item.priority === "high"
                          ? "Medium"
                          : "Low"}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setExplanationOpen(true)}
                  className="gap-1"
                >
                  <Lightbulb className="size-3.5" aria-hidden="true" />
                  Explain reasoning
                </Button>
                {explanation && (
                  <AIExplanation
                    explanation={explanation}
                    open={explanationOpen}
                    onOpenChange={setExplanationOpen}
                  />
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {impactResult && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <ListChecks className="size-4" aria-hidden="true" />
                Affected Compliance Obligations
              </CardTitle>
            </CardHeader>
            <CardContent>
              {obligations.isPending ? (
                <ListSkeleton items={3} />
              ) : obligationItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No linked compliance obligations.
                </p>
              ) : (
                <div className="space-y-2">
                  {obligationItems.map((obligation) => (
                    <Link
                      key={obligation.id}
                      to={`/obligations/${obligation.id}`}
                      className="flex items-center justify-between rounded-md border border-border bg-card p-2 text-sm transition-colors hover:bg-muted/50"
                    >
                      <span className="truncate font-medium">
                        {obligation.code}
                      </span>
                      <span
                        className={cn(
                          "text-xs font-medium",
                          obligation.aiRiskScore >= 70
                            ? "text-red-600 dark:text-red-400"
                            : "text-muted-foreground",
                        )}
                      >
                        Risk {obligation.aiRiskScore}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Building2 className="size-4" aria-hidden="true" />
                Affected Departments & Business Units
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="mb-2 text-xs font-medium text-muted-foreground">
                  Departments
                </h4>
                <div className="flex flex-wrap gap-2">
                  {impactResult.impact.affectedDepartments.map((d) => (
                    <Badge key={d} variant="secondary">
                      {d}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="mb-2 text-xs font-medium text-muted-foreground">
                  Business Units
                </h4>
                <div className="flex flex-wrap gap-2">
                  {impactResult.impact.affectedBusinessUnits.map((b) => (
                    <Badge key={b} variant="outline">
                      {b}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Shield className="size-4" aria-hidden="true" />
                Recommended Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                {RECOMMENDED_ACTIONS.map((rec, index) => (
                  <div
                    key={index}
                    className="rounded-lg border border-border bg-card p-4"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium">{rec.action}</p>
                      <PriorityIcon priority={rec.priority} />
                    </div>
                    <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Users className="size-3" aria-hidden="true" />
                        {rec.owner}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Target className="size-3" aria-hidden="true" />
                        Due in {rec.dueOffset}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <GitBranch className="size-4" aria-hidden="true" />
                Dependency Graph
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DependencyGraph
                regulation={item.title}
                obligations={obligationItems.map((o) => o.code)}
                departments={impactResult.impact.affectedDepartments}
              />
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="outline" asChild>
          <Link to={`/regulation/compare?a=${id}`}>
            <GitBranch className="size-4" aria-hidden="true" />
            Compare
          </Link>
        </Button>
        <Button asChild>
          <Link to={`/cap/create?regulation=${id}`}>
            <Plus className="size-4" aria-hidden="true" />
            Generate CAPs
          </Link>
        </Button>
      </div>
    </motion.div>
  );
}

function PriorityIcon({ priority }: { priority: string }) {
  if (priority === "high" || priority === "critical")
    return <ShieldAlert className="size-4 text-red-500" aria-hidden="true" />;
  if (priority === "medium")
    return (
      <AlertTriangle className="size-4 text-amber-500" aria-hidden="true" />
    );
  return <CheckCircle className="size-4 text-emerald-500" aria-hidden="true" />;
}
