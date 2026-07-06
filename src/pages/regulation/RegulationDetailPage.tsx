import { useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "motion/react";
import { format } from "date-fns";
import {
  ArrowLeft,
  Building2,
  Calendar,
  Globe,
  Tag,
  FileText,
  Sparkles,
  Lightbulb,
  BarChart3,
  CheckCircle,
  AlertTriangle,
  ShieldAlert,
  GitCompare,
  Zap,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/common/StatusBadge";
import { ErrorState } from "@/components/common/ErrorState";
import { DetailSkeleton } from "@/components/common/Skeletons";
import { KPICard } from "@/components/common/KPICard";
import { PageHero } from "@/components/common";
import { ActivityFeed } from "@/components/activity/ActivityFeed";
import {
  CommentThread,
  type CommentItem,
} from "@/components/comments/CommentThread";
import { AIInsightCard } from "@/components/ai/AIInsightCard";
import { AIExplanation } from "@/components/ai/AIExplanation";
import { TypewriterText } from "@/components/ai/TypewriterText";
import { ConfidenceIndicator } from "@/components/ai/ConfidenceIndicator";
import {
  useRegulationDetail,
  useRegulationTimeline,
  useRegulationComments,
} from "@/hooks/queries/useRegulationQueries";
import { useComplianceList } from "@/hooks/queries/useComplianceQueries";
import { useRegulationImpact as useAIRegulationImpact } from "@/hooks/mutations/useAIMutations";
import { useAddRegulationComment } from "@/hooks/mutations/useRegulationMutations";
import { useAuthStore } from "@/stores";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type {
  Regulation,
  AIInsight,
  AIExplanation as AIExplanationType,
  ActivityFeedItem,
} from "@/types";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "requirements", label: "Requirements" },
  { id: "impact", label: "Impact" },
  { id: "timeline", label: "Timeline" },
  { id: "comments", label: "Comments" },
] as const;

type TabId = (typeof TABS)[number]["id"];

const IMPACT_AREAS = [
  { key: "affectedDepartments", label: "Departments", weight: 0.25 },
  { key: "affectedBusinessUnits", label: "Business Units", weight: 0.2 },
  {
    key: "affectedComplianceIds",
    label: "Compliance Obligations",
    weight: 0.3,
  },
  { key: "affectedControls", label: "Controls", weight: 0.1 },
] as const;

function buildInsight(item: Regulation): AIInsight {
  const score = item.aiImpactScore;
  return {
    id: `ai-${item.id}`,
    title: "AI Impact Summary",
    description: `This regulation has an AI impact score of ${score}/100, affecting ${item.affectedDepartments.length} departments and ${item.affectedBusinessUnits.length} business units.`,
    type: score >= 70 ? "risk" : score >= 40 ? "action" : "opportunity",
    confidence: Math.min(score / 100 + 0.05, 0.95),
    recommendation: `Prioritize review of ${item.title} due to its ${score >= 70 ? "high" : score >= 40 ? "moderate" : "low"} predicted impact on operations.`,
    reasoning: [
      `Impact score of ${score} derived from affected departments, business units, and historical change patterns.`,
      `Cross-referenced with ${item.requirements.length} requirements and linked compliance obligations.`,
      "Estimated effort is based on similar regulatory changes in the knowledge base.",
    ],
    references: [],
    entityType: "regulation",
    entityId: item.id,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

function ImpactGauge({ value, size = 80 }: { value: number; size?: number }) {
  const percent = Math.max(0, Math.min(100, value));
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - percent / 100);
  const color =
    percent >= 80
      ? "text-red-500 dark:text-red-400"
      : percent >= 50
        ? "text-amber-500 dark:text-amber-400"
        : "text-emerald-500 dark:text-emerald-400";

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
          strokeWidth={8}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className={cn("fill-none", color)}
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </svg>
      <span className="absolute text-sm font-semibold">{percent}</span>
    </div>
  );
}

export default function RegulationDetailPage() {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [explanationOpen, setExplanationOpen] = useState(false);

  const detail = useRegulationDetail(id);
  const timeline = useRegulationTimeline(id);
  const comments = useRegulationComments(id);
  const obligations = useComplianceList({ regulation: id }, 1, 50);
  const aiImpact = useAIRegulationImpact();
  const addComment = useAddRegulationComment(id);

  const item = detail.data;

  const insight = useMemo(() => (item ? buildInsight(item) : null), [item]);

  const explanation: AIExplanationType | null = useMemo(
    () =>
      item
        ? {
            recommendation:
              insight?.recommendation ?? "Review this regulation.",
            confidence: insight?.confidence ?? 0.75,
            reasoning: insight?.reasoning ?? [],
            references: [
              { title: `${item.regulator} Official Guidance`, url: "#" },
              { title: "Internal Policy Mapping", url: "#" },
            ],
            relatedDocuments: item.requirements.slice(0, 3),
            historicalSimilarity: 0.72,
            timestamp: item.updatedAt,
            modelVersion: "regulation-ai-v1",
          }
        : null,
    [item, insight],
  );

  const timelineItems: ActivityFeedItem[] = useMemo(
    () => timeline.data ?? [],
    [timeline.data],
  );

  const commentItems: CommentItem[] = useMemo(
    () => comments.data?.items ?? [],
    [comments.data],
  );

  const handleRunImpact = () => {
    if (!id) return;
    aiImpact.mutate(id, {
      onSuccess: () => {
        toast.success("Impact analysis complete");
      },
    });
  };

  const handleAddComment = (text: string) => {
    addComment.mutate({
      content: text,
      userId: user?.id,
      userName: user?.name,
    });
  };

  if (detail.isPending) {
    return <DetailSkeleton />;
  }

  if (detail.isError || !item) {
    return <ErrorState onRetry={() => detail.refetch()} />;
  }

  const impactResult = aiImpact.data;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <PageHero
        title={item.title}
        subtitle={`${item.reference} · ${item.regulator} · Effective ${format(new Date(item.effectiveDate), "MMM d, yyyy")} · ${item.version}`}
      >
        <div className="flex flex-col items-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-white/90 hover:bg-white/10 hover:text-white"
            onClick={() => navigate("/regulation")}
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back to library
          </Button>
          <StatusBadge status={item.status} size="md" />
        </div>
      </PageHero>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Tabs
            defaultValue={activeTab}
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as TabId)}
          >
            <TabsList className="w-full justify-start rounded-xl bg-muted p-1">
              {TABS.map((tab) => (
                <TabsTrigger key={tab.id} value={tab.id}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <Card className="border-primary/10 bg-gradient-to-br from-primary/5 via-card to-card dark:border-primary/20 dark:from-primary/10">
                  <CardContent className="space-y-3 pt-6">
                    <div className="flex items-start gap-3">
                      <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Sparkles className="size-4" aria-hidden="true" />
                      </div>
                      <div>
                        <h3 className="text-sm font-medium">
                          Executive Summary
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {item.summary}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Metadata</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      <Fact
                        icon={Building2}
                        label="Regulator"
                        value={item.regulator}
                      />
                      <Fact
                        icon={Calendar}
                        label="Publication Date"
                        value={format(new Date(item.publicationDate), "PPP")}
                      />
                      <Fact
                        icon={Calendar}
                        label="Effective Date"
                        value={format(new Date(item.effectiveDate), "PPP")}
                      />
                      <Fact icon={Tag} label="Category" value={item.category} />
                      <Fact
                        icon={Globe}
                        label="Jurisdiction"
                        value={item.jurisdiction}
                      />
                      <Fact
                        icon={Building2}
                        label="Industry"
                        value={item.industry}
                      />
                      <Fact icon={Tag} label="Version" value={item.version} />
                      <Fact
                        icon={FileText}
                        label="Supersedes"
                        value={item.supersedes ?? "—"}
                      />
                      <Fact
                        icon={Tag}
                        label="Requirements"
                        value={`${item.requirements.length}`}
                      />
                    </dl>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Affected Scope</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="mb-2 text-xs font-medium text-muted-foreground">
                        Departments
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {item.affectedDepartments.map((d) => (
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
                        {item.affectedBusinessUnits.map((b) => (
                          <Badge key={b} variant="outline">
                            {b}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {insight && explanation && (
                  <AIInsightCard
                    insight={insight}
                    explanation={{
                      ...explanation,
                      recommendation: insight.recommendation,
                      confidence: insight.confidence,
                      reasoning: insight.reasoning,
                    }}
                  />
                )}
              </motion.div>
            </TabsContent>

            <TabsContent value="requirements" className="mt-6">
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {item.requirements.map((req, index) => (
                  <Card key={index}>
                    <CardContent className="flex gap-4 pt-6">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                        {index + 1}
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-foreground">
                          {req}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {item.affectedDepartments.slice(0, 2).map((d) => (
                            <Badge
                              key={d}
                              variant="secondary"
                              className="text-xs"
                            >
                              {d}
                            </Badge>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Linked to {item.id} compliance mapping
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </motion.div>
            </TabsContent>

            <TabsContent value="impact" className="mt-6">
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <Card className="border-primary/10 bg-gradient-to-br from-primary/5 via-card to-card dark:border-primary/20 dark:from-primary/10">
                  <CardContent className="space-y-4 pt-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <BarChart3 className="size-5" aria-hidden="true" />
                        </div>
                        <div>
                          <h3 className="text-base font-medium">
                            AI Impact Analysis
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            Discover how this regulation affects your compliance
                            program.
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={handleRunImpact}
                        disabled={aiImpact.isPending}
                      >
                        {aiImpact.isPending ? (
                          <Loader2
                            className="size-4 animate-spin"
                            aria-hidden="true"
                          />
                        ) : (
                          <Sparkles className="size-4" aria-hidden="true" />
                        )}
                        Run Impact Analysis
                      </Button>
                    </div>

                    {impactResult && (
                      <div className="space-y-5">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                          <div className="flex items-center gap-4">
                            <ImpactGauge value={item.aiImpactScore} />
                            <div>
                              <p className="text-sm font-medium">
                                Overall Impact Score
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {item.aiImpactScore}/100
                              </p>
                            </div>
                          </div>
                          <ConfidenceIndicator
                            confidence={impactResult.explanation.confidence}
                            size="md"
                          />
                        </div>

                        <div className="space-y-3">
                          <h4 className="text-sm font-semibold">
                            Impact Breakdown
                          </h4>
                          <div className="space-y-3">
                            {IMPACT_AREAS.map((area) => {
                              const values = impactResult.impact[
                                area.key as keyof typeof impactResult.impact
                              ] as string[];
                              const count = values?.length ?? 0;
                              const contribution = Math.min(
                                100,
                                count * 15 * area.weight * 10,
                              );
                              return (
                                <div key={area.key} className="space-y-1">
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="text-muted-foreground">
                                      {area.label}
                                    </span>
                                    <span className="font-medium">{count}</span>
                                  </div>
                                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                                    <motion.div
                                      className={cn(
                                        "h-full rounded-full",
                                        contribution >= 60
                                          ? "bg-red-500"
                                          : contribution >= 35
                                            ? "bg-amber-500"
                                            : "bg-emerald-500",
                                      )}
                                      initial={{ width: 0 }}
                                      animate={{ width: `${contribution}%` }}
                                      transition={{ duration: 0.5 }}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <div className="rounded-lg bg-muted/50 p-3 text-sm">
                          <TypewriterText
                            text={impactResult.impact.aiSummary}
                            speed={12}
                          />
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setExplanationOpen(true)}
                          className="gap-1"
                        >
                          <Lightbulb className="size-3.5" aria-hidden="true" />
                          Why this score?
                        </Button>

                        <AIExplanation
                          explanation={impactResult.explanation}
                          open={explanationOpen}
                          onOpenChange={setExplanationOpen}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            <TabsContent value="timeline" className="mt-6">
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Activity Timeline</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ActivityFeed
                      events={timelineItems}
                      loading={timeline.isPending}
                      emptyMessage="No activity recorded for this regulation."
                    />
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            <TabsContent value="comments" className="mt-6">
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <CommentThread
                  comments={commentItems}
                  loading={comments.isPending}
                  onAdd={handleAddComment}
                  currentUserId={user?.id}
                />
              </motion.div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-4">
          <KPICard
            label="AI Impact Score"
            value={item.aiImpactScore}
            icon={BarChart3}
            trend={{
              direction: item.aiImpactScore >= 70 ? "up" : "down",
              percent: item.aiImpactScore,
              positive: item.aiImpactScore < 70,
            }}
          />
          <KPICard
            label="Requirements"
            value={item.requirements.length}
            icon={CheckCircle}
          />
          <KPICard
            label="Risk Level"
            value={
              item.aiImpactScore >= 70
                ? "High"
                : item.aiImpactScore >= 40
                  ? "Medium"
                  : "Low"
            }
            icon={
              item.aiImpactScore >= 70
                ? ShieldAlert
                : item.aiImpactScore >= 40
                  ? AlertTriangle
                  : CheckCircle
            }
          />

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" size="sm" className="w-full" asChild>
                <Link to={`/regulation/compare?a=${item.id}`}>
                  <GitCompare className="size-4" aria-hidden="true" />
                  Compare with another
                </Link>
              </Button>
              <Button variant="outline" size="sm" className="w-full" asChild>
                <Link to={`/regulation/${item.id}/impact`}>
                  <Zap className="size-4" aria-hidden="true" />
                  Deep impact analysis
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Linked Compliance Obligations
              </CardTitle>
            </CardHeader>
            <CardContent>
              {obligations.isPending ? (
                <Loader2
                  className="size-5 animate-spin text-primary"
                  aria-hidden="true"
                />
              ) : obligations.data?.items.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No obligations linked.
                </p>
              ) : (
                <div className="space-y-2">
                  {obligations.data?.items.map((obligation) => (
                    <button
                      key={obligation.id}
                      onClick={() => navigate(`/compliance/${obligation.id}`)}
                      className="flex w-full items-center justify-between rounded-md border border-border bg-card p-2 text-left text-sm transition-colors hover:bg-muted/50"
                    >
                      <span className="truncate font-medium">
                        {obligation.complianceId}
                      </span>
                      <StatusBadge status={obligation.status} size="sm" />
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Tags</CardTitle>
            </CardHeader>
            <CardContent>
              {item.tags.length === 0 ? (
                <p className="text-sm text-muted-foreground">No tags.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {item.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}

function Fact({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="space-y-1">
      <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="size-3.5" aria-hidden="true" />
        {label}
      </dt>
      <dd className="text-sm font-medium text-foreground">{value}</dd>
    </div>
  );
}
