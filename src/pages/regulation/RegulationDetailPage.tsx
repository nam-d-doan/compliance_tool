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
  Loader2,
  Archive,
  Pencil,
  Link2,
  ArrowUpRight,
  ArrowDownLeft,
  ExternalLink,
  ClipboardList,
  ScrollText,
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
  useRegulationDependencies,
} from "@/hooks/queries/useRegulationQueries";
import { useComplianceList } from "@/hooks/queries/useComplianceQueries";
import { useRegulationImpact as useAIRegulationImpact } from "@/hooks/mutations/useAIMutations";
import {
  useAddRegulationComment,
  useArchiveRegulation,
} from "@/hooks/mutations/useRegulationMutations";
import { useAuthStore } from "@/stores";
import { hasMinimumRole } from "@/constants/rbac";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type {
  Regulation,
  AIInsight,
  AIExplanation as AIExplanationType,
  ActivityFeedItem,
  RegulationDependencyItem,
  Article,
} from "@/types";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "articles", label: "Articles" },
  { id: "dependencies", label: "Dependencies" },
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
  const score =
    item.status === "Expired" ? 30 : item.articles.length > 50 ? 80 : 60;
  return {
    id: `ai-${item.id}`,
    title: "AI Impact Summary",
    description: `This regulation contains ${item.articles.length} articles and may have broad operational impact.`,
    type: score >= 70 ? "risk" : score >= 40 ? "action" : "opportunity",
    confidence: Math.min(score / 100 + 0.05, 0.95),
    recommendation: `Prioritize review of ${item.title} and its ${item.articles.length} linked articles.`,
    reasoning: [
      `Regulation status ${item.status} indicates ${score >= 70 ? "high" : score >= 40 ? "moderate" : "low"} current relevance.`,
      `Cross-referenced with ${item.articles.length} articles and linked compliance obligations.`,
      "Estimated effort is based on similar regulatory changes in the knowledge base.",
    ],
    references: [],
    entityType: "regulation",
    entityId: item.id,
    createdAt: item.createdDate,
    updatedAt: item.updatedDate,
  };
}

const DEPENDENCY_TYPE_STYLES: Record<
  RegulationDependencyItem["type"],
  {
    variant: "default" | "secondary" | "destructive" | "outline";
    label: string;
  }
> = {
  amends: { variant: "secondary", label: "Amends" },
  repeals: { variant: "destructive", label: "Repeals" },
  supersedes: { variant: "default", label: "Supersedes" },
  references: { variant: "outline", label: "References" },
};

const ARTICLE_STATUS_STYLES: Record<
  NonNullable<Article["status"]>,
  {
    variant: "default" | "secondary" | "destructive" | "outline";
    label: string;
  }
> = {
  active: { variant: "secondary", label: "Active" },
  amended: { variant: "default", label: "Amended" },
  repealed: { variant: "destructive", label: "Repealed" },
};

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
  const { user, role } = useAuthStore();
  const canArchive = hasMinimumRole(role, "executive");
  const archive = useArchiveRegulation();
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [explanationOpen, setExplanationOpen] = useState(false);

  const handleArchive = () => {
    if (!id || !item) return;
    const isExpired = item.status === "Expired";
    archive.mutate(id, {
      onSuccess: () => {
        toast.success(
          isExpired
            ? "Regulation marked effective"
            : "Regulation marked expired",
        );
      },
      onError: (err) => {
        toast.error(
          err instanceof Error
            ? err.message
            : "Failed to update regulation status",
        );
      },
    });
  };

  const detail = useRegulationDetail(id);
  const timeline = useRegulationTimeline(id);
  const comments = useRegulationComments(id);
  const dependencies = useRegulationDependencies(id);
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
              { title: `${item.regulatoryBody} Official Guidance`, url: "#" },
              { title: "Internal Policy Mapping", url: "#" },
            ],
            relatedDocuments: item.articles.slice(0, 3).map((a) => a.title),
            historicalSimilarity: 0.72,
            timestamp: item.updatedDate,
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
        subtitle={`${item.regulatoryBody} · Effective ${format(new Date(item.effectiveDate), "MMM d, yyyy")}`}
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
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Badge
              variant="outline"
              className="border-white/30 bg-white/10 text-white"
            >
              {item.source === "external" ? (
                <Globe className="size-3" aria-hidden="true" />
              ) : (
                <Building2 className="size-3" aria-hidden="true" />
              )}
              {item.source === "external" ? "External" : "Internal"}
            </Badge>
            {canArchive && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleArchive}
                disabled={archive.isPending}
                className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white"
              >
                {archive.isPending ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Archive className="size-4" aria-hidden="true" />
                )}
                {item.status === "Expired" ? "Mark Effective" : "Mark Expired"}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/regulation/${item.id}/edit`)}
              className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white"
            >
              <Pencil className="size-4" aria-hidden="true" />
              Edit
            </Button>
          </div>
          <StatusBadge status={item.status} size="md" />
        </div>
      </PageHero>

      {item.expirationDate &&
        item.status !== "Expired" &&
        new Date(item.expirationDate) < new Date() && (
          <Card className="border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/40">
            <CardContent className="flex items-center gap-3 py-4">
              <AlertTriangle className="size-5 text-amber-600 dark:text-amber-400" />
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                This regulation expired on{" "}
                {format(new Date(item.expirationDate), "PPP")} and may no longer
                be in effect.
              </p>
            </CardContent>
          </Card>
        )}

      {item.status === "Expired" && (
        <Card className="border-slate-300 bg-slate-100 dark:border-slate-700 dark:bg-slate-900/40">
          <CardContent className="flex items-center gap-3 py-4">
            <Archive className="size-5 text-slate-600 dark:text-slate-400" />
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              This regulation is expired and is no longer active.
            </p>
          </CardContent>
        </Card>
      )}

      {item.status === "Superseded" && (
        <Card className="border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/40">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertTriangle className="size-5 text-amber-600 dark:text-amber-400" />
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
              This regulation has been superseded by a newer regulation.
            </p>
          </CardContent>
        </Card>
      )}

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
                          {item.description}
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
                        label="Regulatory Body"
                        value={item.regulatoryBody}
                      />
                      <Fact
                        icon={Calendar}
                        label="Effective Date"
                        value={format(new Date(item.effectiveDate), "PPP")}
                      />
                      <Fact
                        icon={Calendar}
                        label="Created Date"
                        value={format(new Date(item.createdDate), "PPP")}
                      />
                      <Fact icon={Tag} label="Category" value={item.category} />
                      <Fact icon={Tag} label="Source" value={item.source} />
                      <Fact
                        icon={Tag}
                        label="Articles"
                        value={`${item.articles.length}`}
                      />
                      {item.expirationDate && (
                        <Fact
                          icon={Calendar}
                          label="Expiration Date"
                          value={format(new Date(item.expirationDate), "PPP")}
                        />
                      )}
                    </dl>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Articles</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {item.articles.slice(0, 5).map((article) => (
                      <div key={article.id} className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{article.number}</Badge>
                          <span className="text-sm font-medium">
                            {article.title}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {article.summary}
                        </p>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {insight && explanation && (
                  <div id="ai-summary">
                    <AIInsightCard
                      insight={insight}
                      explanation={{
                        ...explanation,
                        recommendation: insight.recommendation,
                        confidence: insight.confidence,
                        reasoning: insight.reasoning,
                      }}
                    />
                  </div>
                )}
              </motion.div>
            </TabsContent>

            <TabsContent value="articles" className="mt-6">
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Articles</CardTitle>
                      <p className="text-xs text-muted-foreground">
                        {item.articles.length} article
                        {item.articles.length === 1 ? "" : "s"} in this
                        regulation.
                      </p>
                    </div>
                    <Badge variant="secondary">
                      <FileText className="size-3" aria-hidden="true" />
                      {item.articles.length}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    {item.articles.length === 0 ? (
                      <p className="py-6 text-center text-sm text-muted-foreground">
                        No articles defined for this regulation.
                      </p>
                    ) : (
                      <div className="overflow-x-auto rounded-lg border border-border">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                            <tr>
                              <th className="w-16 px-3 py-2 font-medium">
                                No.
                              </th>
                              <th className="px-3 py-2 font-medium">Title</th>
                              <th className="px-3 py-2 font-medium">Summary</th>
                              <th className="px-3 py-2 font-medium">
                                Effective
                              </th>
                              <th className="px-3 py-2 font-medium">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {item.articles.map((article) => {
                              const status = article.status ?? "active";
                              const statusStyle =
                                ARTICLE_STATUS_STYLES[status] ??
                                ARTICLE_STATUS_STYLES.active;
                              return (
                                <tr
                                  key={article.id}
                                  className="align-top transition-colors hover:bg-muted/40"
                                >
                                  <td className="px-3 py-3">
                                    <span className="inline-flex size-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                                      {article.number}
                                    </span>
                                  </td>
                                  <td className="px-3 py-3 font-medium text-foreground">
                                    {article.title}
                                  </td>
                                  <td className="max-w-md px-3 py-3 text-muted-foreground">
                                    <p className="line-clamp-3">
                                      {article.summary}
                                    </p>
                                  </td>
                                  <td className="whitespace-nowrap px-3 py-3 text-xs text-muted-foreground">
                                    {article.effectiveDate
                                      ? format(
                                          new Date(article.effectiveDate),
                                          "MMM d, yyyy",
                                        )
                                      : "—"}
                                  </td>
                                  <td className="px-3 py-3">
                                    <Badge variant={statusStyle.variant}>
                                      {statusStyle.label}
                                    </Badge>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            <TabsContent value="dependencies" className="mt-6">
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-5"
              >
                <DependenciesSection
                  title="References this regulation makes"
                  description="Outgoing links to other regulations."
                  icon={ArrowUpRight}
                  items={
                    dependencies.data?.filter(
                      (d) => d.direction === "outgoing",
                    ) ?? []
                  }
                  isLoading={dependencies.isPending}
                  navigate={navigate}
                />
                <DependenciesSection
                  title="References to this regulation"
                  description="Incoming links from other regulations."
                  icon={ArrowDownLeft}
                  items={
                    dependencies.data?.filter(
                      (d) => d.direction === "incoming",
                    ) ?? []
                  }
                  isLoading={dependencies.isPending}
                  navigate={navigate}
                />
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
                            <ConfidenceIndicator
                              confidence={impactResult.explanation.confidence}
                              size="md"
                            />
                          </div>
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
            label="Articles"
            value={item.articles.length}
            icon={CheckCircle}
          />
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() =>
                  document
                    .getElementById("ai-summary")
                    ?.scrollIntoView({ behavior: "smooth", block: "start" })
                }
              >
                <ScrollText className="size-4" aria-hidden="true" />
                AI Summary
              </Button>
              <Button variant="outline" size="sm" className="w-full" asChild>
                <Link to={`/compliance/submit?regulationId=${item.id}`}>
                  <ClipboardList className="size-4" aria-hidden="true" />
                  Create Obligations
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

          {item.expirationDate && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  Auto-Expire
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {item.status === "Expired" ? (
                  <p className="text-muted-foreground">
                    This regulation was auto-expired based on its expiration
                    date.
                  </p>
                ) : (
                  <p className="text-muted-foreground">
                    Status will be evaluated against the expiration date.
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Expires {format(new Date(item.expirationDate), "PPP")}
                </p>
              </CardContent>
            </Card>
          )}
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

function DependenciesSection({
  title,
  description,
  icon: Icon,
  items,
  isLoading,
  navigate,
}: {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  items: RegulationDependencyItem[];
  isLoading: boolean;
  navigate: (path: string) => void;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-start gap-3">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="size-4" aria-hidden="true" />
          </div>
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </div>
        <Badge variant="secondary">{items.length}</Badge>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2
              className="size-5 animate-spin text-primary"
              aria-hidden="true"
            />
          </div>
        ) : items.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No dependencies in this direction.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">Related Regulation</th>
                  <th className="px-3 py-2 font-medium">Type</th>
                  <th className="px-3 py-2 font-medium">Description</th>
                  <th className="px-3 py-2 font-medium">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((dep) => {
                  const typeStyle = DEPENDENCY_TYPE_STYLES[dep.type];
                  return (
                    <tr
                      key={dep.id}
                      className="align-top transition-colors hover:bg-muted/40"
                    >
                      <td className="px-3 py-3">
                        <button
                          onClick={() =>
                            navigate(`/regulation/${dep.relatedRegulationId}`)
                          }
                          className="group inline-flex max-w-xs items-start gap-1.5 text-left font-medium text-primary hover:underline"
                        >
                          <Link2
                            className="mt-0.5 size-3.5 shrink-0 text-muted-foreground group-hover:text-primary"
                            aria-hidden="true"
                          />
                          <span className="flex flex-col">
                            <span className="truncate">
                              {dep.relatedRegulationTitle ||
                                dep.relatedRegulationId}
                            </span>
                            {dep.relatedRegulationTitle && (
                              <span className="text-xs font-normal text-muted-foreground">
                                {dep.relatedRegulationId}
                              </span>
                            )}
                          </span>
                          <ExternalLink
                            className="mt-0.5 size-3 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                            aria-hidden="true"
                          />
                        </button>
                      </td>
                      <td className="px-3 py-3">
                        <Badge variant={typeStyle.variant}>
                          {typeStyle.label}
                        </Badge>
                      </td>
                      <td className="max-w-sm px-3 py-3 text-muted-foreground">
                        <p className="line-clamp-2">{dep.description}</p>
                      </td>
                      <td className="max-w-xs px-3 py-3 text-xs text-muted-foreground">
                        {dep.notes ? (
                          <p className="line-clamp-2">{dep.notes}</p>
                        ) : (
                          <span className="text-muted-foreground/50">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
