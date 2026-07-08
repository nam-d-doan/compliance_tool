import { useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "motion/react";
import { format, differenceInDays, parseISO } from "date-fns";
import {
  ArrowLeft,
  Calendar,
  Building2,
  MapPin,
  User,
  CheckCircle,
  AlertTriangle,
  Trash2,
  Pencil,
  ExternalLink,
  PlusCircle,
  Sparkles,
  Lightbulb,
  CheckSquare,
  Square,
  Briefcase,
  Paperclip,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/common/StatusBadge";
import { PriorityBadge } from "@/components/common/PriorityBadge";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { DetailSkeleton } from "@/components/common/Skeletons";
import { KPICard } from "@/components/common/KPICard";
import { ApprovalPanel } from "@/components/common/ApprovalPanel";
import { ActivityFeed } from "@/components/activity/ActivityFeed";
import {
  CommentThread,
  type CommentItem,
} from "@/components/comments/CommentThread";
import { AIRecommendationCard } from "@/components/ai/AIRecommendationCard";
import { AIExplanation } from "@/components/ai/AIExplanation";
import { ConfidenceIndicator } from "@/components/ai/ConfidenceIndicator";
import { CAPForm, type CAPFormValues } from "@/components/cap/CAPForm";
import { FileUploadComponent } from "@/components/cap/FileUploadComponent";
import {
  useCAPDetail,
  useCAPTimeline,
  useCAPComments,
} from "@/hooks/queries/useCAPQueries";
import { useFilesByIds } from "@/hooks/queries/useFileQueries";
import { useComplianceList } from "@/hooks/queries/useComplianceQueries";
import { useAdminUsers } from "@/hooks/queries/useAdminQueries";
import {
  useUpdateCAP,
  useDeleteCAP,
  useAddCAPComment,
} from "@/hooks/mutations/useCAPMutations";
import { useAuthStore } from "@/stores";
import { hasPermission } from "@/constants/rbac";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type {
  CAP,
  CAPAction,
  CAPAISuggestion,
  CAPTimelineEvent,
  ActivityFeedItem,
  AIRecommendation,
  AIExplanation as AIExplanationType,
} from "@/types";
import type { PriorityLevel } from "@/constants/status";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "actions", label: "Actions" },
  { id: "files", label: "Files" },
  { id: "timeline", label: "Timeline" },
  { id: "comments", label: "Comments" },
  { id: "approvals", label: "Approvals" },
] as const;

type TabId = (typeof TABS)[number]["id"];

const timelineTypeMap: Record<
  CAPTimelineEvent["type"],
  ActivityFeedItem["type"]
> = {
  created: "submission",
  assigned: "submission",
  updated: "upload",
  completed: "approval",
  approved: "approval",
  rejected: "rejection",
  commented: "comment",
};

function toAIRecommendation(
  suggestion: CAPAISuggestion,
  index: number,
): AIRecommendation {
  const explanation: AIExplanationType = {
    recommendation: suggestion.rationale,
    confidence: suggestion.confidence,
    reasoning: [suggestion.rationale, ...suggestion.recommendedActions],
    references: [],
    relatedDocuments: [],
    timestamp: new Date().toISOString(),
    modelVersion: "cap-ai-v1",
  };
  return {
    id: `cap-ai-${index}`,
    type: "CAP Recommendation",
    entityType: "cap",
    entityId: `cap-ai-${index}`,
    recommendation: suggestion.rationale,
    reason: suggestion.rationale,
    confidence: suggestion.confidence,
    historicalSimilarity: 0.75,
    explanation,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function computeRiskScore(item: CAP): { score: number; reasoning: string[] } {
  const priorityWeight: Record<PriorityLevel, number> = {
    low: 10,
    medium: 25,
    high: 45,
    critical: 65,
  };
  const daysToDue = differenceInDays(parseISO(item.dueDate), new Date());
  let score =
    priorityWeight[item.priority] + Math.min(100, item.progress * 0.2);
  if (daysToDue < 0) score += 25;
  else if (daysToDue <= 7) score += 15;
  else if (daysToDue <= 30) score += 5;
  score = Math.min(100, Math.round(score));
  return {
    score,
    reasoning: [
      `Priority level ${item.priority} contributes ${priorityWeight[item.priority]} risk points.`,
      daysToDue < 0
        ? `CAP is ${Math.abs(daysToDue)} days overdue, adding significant delay risk.`
        : `Due date is ${daysToDue === 0 ? "today" : `${daysToDue} days away`}.`,
      `Current progress of ${item.progress}% moderates the residual risk estimate.`,
      `Historical pattern analysis for similar ${item.department} CAPs supports this score.`,
    ],
  };
}

export default function CAPDetailPage() {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { role, user } = useAuthStore();
  const canEdit = hasPermission(role, "cap:update");
  const canDelete = hasPermission(role, "cap:delete");
  const canApprove = hasPermission(role, "cap:approve");

  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [editOpen, setEditOpen] = useState(false);
  const [aiExplainOpen, setAiExplainOpen] = useState(false);

  const detail = useCAPDetail(id);
  const timeline = useCAPTimeline(id);
  const comments = useCAPComments(id);
  const update = useUpdateCAP(id);
  const remove = useDeleteCAP();
  const addComment = useAddCAPComment(id);

  const usersQuery = useAdminUsers(1, 200, { status: "Active" });
  const complianceQuery = useComplianceList({}, 1, 200);

  const item = detail.data;

  // Files linked to this CAP. Fetched by ID list (robust to files uploaded
  // before the CAP existed, which carry no `capId`).
  const filesQuery = useFilesByIds(item?.fileIds ?? []);

  const daysToDue = item
    ? differenceInDays(parseISO(item.dueDate), new Date())
    : 0;

  const timelineItems: ActivityFeedItem[] = useMemo(() => {
    if (!timeline.data) return [];
    return timeline.data.map((event) => ({
      ...event,
      type: timelineTypeMap[event.type],
      entityType: "cap",
      entityId: event.capId,
      createdAt: event.timestamp,
      updatedAt: event.timestamp,
    }));
  }, [timeline.data]);

  const commentItems: CommentItem[] = useMemo(() => {
    return (
      comments.data?.items.map((c) => ({
        id: c.id,
        userId: c.userId,
        userName: c.userName,
        content: c.content,
        timestamp: c.timestamp,
      })) ?? []
    );
  }, [comments.data]);

  const approvers = useMemo(() => {
    if (!item) return [];
    const status: "approved" | "pending" =
      item.status === "Closed" ? "approved" : "pending";
    return [
      {
        user: { id: item.approverId, name: item.approverName },
        status,
      },
    ];
  }, [item]);

  // Resolve full obligation details for every linked ID. Falls back to a
  // {id, title} stub when an obligation can't be found (e.g. deleted).
  const linkedObligations = useMemo(() => {
    if (!item) return [];
    const byId = new Map(
      (complianceQuery.data?.items ?? []).map((c) => [c.id, c]),
    );
    return item.obligationIds.map((id) => {
      const found = byId.get(id);
      return {
        id,
        title: found?.title ?? item.complianceTitle ?? id,
        status: found?.status,
        dueDate: found?.dueDate,
        found: Boolean(found),
      };
    });
  }, [item, complianceQuery.data]);

  const handleApprove = () => {
    update.mutate(
      { status: "Closed", progress: 100 },
      { onSuccess: () => toast.success("CAP approved and closed") },
    );
  };

  const handleReject = () => {
    update.mutate(
      { status: "Open" },
      { onSuccess: () => toast.success("CAP returned for revision") },
    );
  };

  const handleDelete = () => {
    if (!item) return;
    if (
      !window.confirm(
        "Are you sure you want to delete this corrective action plan?",
      )
    )
      return;
    remove.mutate(item.id, {
      onSuccess: () => {
        toast.success("CAP deleted");
        navigate("/cap/list");
      },
    });
  };

  const handleEditSubmit = (values: CAPFormValues) => {
    if (!item) return;
    const owner = usersQuery.data?.items.find((u) => u.id === values.ownerId);
    const approver = usersQuery.data?.items.find(
      (u) => u.id === values.approverId,
    );
    const firstObligation = complianceQuery.data?.items.find((c) =>
      values.obligationIds.includes(c.id),
    );

    update.mutate(
      {
        title: values.title,
        description: values.description,
        priority: values.priority,
        ownerId: values.ownerId,
        ownerName: owner?.name ?? item.ownerName,
        approverId: values.approverId,
        approverName: approver?.name ?? item.approverName,
        department: values.department,
        businessUnit: values.businessUnit,
        location: values.location,
        dueDate: new Date(values.dueDate).toISOString(),
        obligationIds: values.obligationIds,
        complianceTitle: firstObligation?.title ?? item.complianceTitle,
        rootCause: values.rootCause,
        estimatedCost: values.estimatedCost,
        tags: values.tags
          ? values.tags
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean)
          : [],
      },
      {
        onSuccess: () => {
          toast.success("CAP updated");
          setEditOpen(false);
        },
      },
    );
  };

  const handleAddComment = (text: string) => {
    addComment.mutate({
      content: text,
      userId: user?.id,
      userName: user?.name,
    });
  };

  const handleToggleAction = (actionId: string) => {
    if (!item) return;
    const nextActions = item.actions.map((a) =>
      a.id === actionId
        ? {
            ...a,
            status:
              a.status === "Closed" ? "Open" : ("Closed" as CAP["status"]),
            progress: a.status === "Closed" ? 0 : 100,
          }
        : a,
    );
    update.mutate({ actions: nextActions });
  };

  const handleAddAction = (newAction: CAPAction) => {
    if (!item) return;
    update.mutate(
      { actions: [...item.actions, newAction] },
      { onSuccess: () => toast.success("Action added") },
    );
  };

  if (detail.isPending) {
    return <DetailSkeleton />;
  }

  if (detail.isError || !item) {
    return <ErrorState onRetry={() => detail.refetch()} />;
  }

  const risk = computeRiskScore(item);
  const riskExplanation: AIExplanationType = {
    recommendation: `AI risk score for this CAP is ${risk.score}/100.`,
    confidence: 0.85,
    reasoning: risk.reasoning,
    references: [],
    relatedDocuments: [],
    timestamp: new Date().toISOString(),
    modelVersion: "cap-risk-v1",
  };

  const editDefaults: Partial<CAPFormValues> = {
    title: item.title,
    description: item.description,
    priority: item.priority,
    ownerId: item.ownerId,
    approverId: item.approverId,
    department: item.department,
    businessUnit: item.businessUnit,
    location: item.location ?? "",
    dueDate: item.dueDate.slice(0, 10),
    obligationIds: item.obligationIds,
    rootCause: item.rootCause,
    estimatedCost: item.estimatedCost,
    tags: item.tags.join(", "),
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <Card className="relative overflow-hidden border-0 text-white shadow-lg">
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, #0c3767 0%, #185b95 58%, #147769 100%)",
          }}
        />
        <div className="relative p-6 lg:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/cap/list")}
                className="-ml-2 text-blue-100 hover:bg-white/10 hover:text-white"
              >
                <ArrowLeft className="size-4" aria-hidden="true" />
                Back to CAPs
              </Button>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-tight lg:text-3xl">
                  {item.title}
                </h1>
                <StatusBadge status={item.status} size="md" />
                <PriorityBadge priority={item.priority} size="md" />
              </div>
              <p className="text-sm text-blue-100">{item.capId}</p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-blue-50">
                <span className="inline-flex items-center gap-1.5">
                  <User className="size-4" aria-hidden="true" />
                  {item.ownerName}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="size-4" aria-hidden="true" />
                  {format(parseISO(item.dueDate), "PPP")}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {canEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditOpen(true)}
                  className="border-white/30 text-white hover:bg-white/10 hover:text-white"
                >
                  <Pencil className="size-4" aria-hidden="true" />
                  Edit
                </Button>
              )}
              {canDelete && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDelete}
                  className="border-white/30 text-white hover:bg-red-500/20 hover:text-white"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                  Delete
                </Button>
              )}
            </div>
          </div>

          <div className="mt-6 space-y-2">
            <div className="flex items-center justify-between text-sm text-blue-50">
              <span>Progress</span>
              <span className="font-medium">{item.progress}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/20">
              <motion.div
                className="h-full rounded-full bg-white"
                initial={{ width: 0 }}
                animate={{ width: `${item.progress}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
          </div>
        </div>
      </Card>

      <Tabs
        defaultValue={activeTab}
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as TabId)}
      >
        <TabsList className="mb-2">
          {TABS.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <TabsContent value="overview" className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {item.description}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      <Fact icon={User} label="Owner" value={item.ownerName} />
                      <Fact
                        icon={CheckCircle}
                        label="Approver"
                        value={item.approverName}
                      />
                      <Fact
                        icon={Building2}
                        label="Department"
                        value={item.department}
                      />
                      <Fact
                        icon={Briefcase}
                        label="Business Unit"
                        value={item.businessUnit}
                      />
                      <Fact
                        icon={MapPin}
                        label="Location"
                        value={item.location ?? "—"}
                      />
                      <Fact
                        icon={Calendar}
                        label="Due Date"
                        value={format(parseISO(item.dueDate), "PPP")}
                      />
                      <Fact
                        icon={AlertTriangle}
                        label="Risk"
                        value={item.risk}
                      />
                      <Fact
                        icon={AlertTriangle}
                        label="Estimated Cost"
                        value={`$${item.estimatedCost.toLocaleString()}`}
                      />
                      <Fact
                        icon={AlertTriangle}
                        label="Actual Cost"
                        value={`$${item.actualCost.toLocaleString()}`}
                      />
                      <Fact
                        icon={CheckCircle}
                        label="Root Cause"
                        value={item.rootCause}
                        className="sm:col-span-2 lg:col-span-3"
                      />
                      {linkedObligations.length > 0 && (
                        <div className="rounded-lg border border-border bg-card p-3 sm:col-span-2 lg:col-span-3">
                          <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <ExternalLink
                              className="size-3.5"
                              aria-hidden="true"
                            />
                            Linked Obligations
                            <Badge variant="secondary" className="ml-1">
                              {linkedObligations.length}
                            </Badge>
                          </dt>
                          <dd className="mt-1">
                            <ul className="flex flex-wrap gap-1.5">
                              {linkedObligations.map((o) => (
                                <li key={o.id}>
                                  {o.found ? (
                                    <Link
                                      to={`/obligations/${o.id}`}
                                      className="inline-block rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-primary hover:underline"
                                    >
                                      {o.title}
                                    </Link>
                                  ) : (
                                    <span className="inline-block rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                                      {o.title}
                                    </span>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </dd>
                        </div>
                      )}
                    </dl>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Progress</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Completion</span>
                      <span className="font-medium">{item.progress}%</span>
                    </div>
                    <Progress value={item.progress} />
                  </CardContent>
                </Card>

                {item.aiSuggestions.length > 0 && (
                  <Card className="border-primary/10 bg-gradient-to-br from-primary/[0.03] to-card dark:border-primary/20">
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <Sparkles
                          className="size-4 text-primary"
                          aria-hidden="true"
                        />
                        <CardTitle>AI Suggestions</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {item.aiSuggestions.map((suggestion, index) => (
                        <AIRecommendationCard
                          key={index}
                          recommendation={toAIRecommendation(suggestion, index)}
                          priority={suggestion.priority}
                        />
                      ))}
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            </TabsContent>

            <TabsContent value="actions" className="space-y-4">
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {item.actions.length === 0 ? (
                      <EmptyState
                        title="No actions"
                        description="Add the first corrective action for this CAP."
                      />
                    ) : (
                      <div className="space-y-2">
                        {item.actions.map((action) => (
                          <ActionRow
                            key={action.id}
                            action={action}
                            onToggle={() => handleToggleAction(action.id)}
                          />
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <AddActionForm
                  capId={item.id}
                  users={usersQuery.data?.items ?? []}
                  onAdd={handleAddAction}
                />
              </motion.div>
            </TabsContent>

            <TabsContent value="files" className="space-y-4">
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Paperclip className="size-4" aria-hidden="true" />
                      Attachments
                      {item.fileIds.length > 0 && (
                        <Badge variant="secondary">{item.fileIds.length}</Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FileUploadComponent
                      files={filesQuery.data?.items ?? []}
                      capId={item.id}
                      uploadedBy={user?.name}
                      uploadedById={user?.id}
                      disabled={item.status === "Closed"}
                      listOnly={item.status === "Closed"}
                    />
                    {item.status === "Closed" && (
                      <p className="mt-3 text-xs text-muted-foreground">
                        This CAP is closed — file attachments are read-only.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            <TabsContent value="timeline" className="space-y-4">
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <ActivityFeed
                  events={timelineItems}
                  loading={timeline.isPending}
                  emptyMessage="Activity for this CAP will appear here."
                />
              </motion.div>
            </TabsContent>

            <TabsContent value="comments" className="space-y-4">
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

            <TabsContent value="approvals" className="space-y-4">
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <ApprovalPanel
                  approvers={approvers}
                  currentUserId={user?.id}
                  canApprove={
                    canApprove &&
                    item.approverId === user?.id &&
                    item.status === "Pending Approval"
                  }
                  onApprove={handleApprove}
                  onReject={handleReject}
                />
              </motion.div>
            </TabsContent>
          </div>

          <div className="space-y-4">
            <KPICard
              label="Days to due"
              value={daysToDue}
              subtitle={
                daysToDue < 0
                  ? `${Math.abs(daysToDue)} days overdue`
                  : daysToDue === 0
                    ? "Due today"
                    : "days remaining"
              }
              icon={Calendar}
              trend={{
                direction: daysToDue < 0 ? "down" : "flat",
                percent: Math.abs(daysToDue),
                positive: daysToDue >= 0,
              }}
            />
            <KPICard
              label="Progress"
              value={`${item.progress}%`}
              icon={CheckCircle}
            />
            <KPICard
              label="AI Risk Score"
              value={risk.score}
              icon={AlertTriangle}
              trend={{
                direction: risk.score >= 70 ? "up" : "down",
                percent: risk.score,
                positive: risk.score < 70,
              }}
            />

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                  Linked Obligations
                  {linkedObligations.length > 0 && (
                    <Badge variant="secondary">
                      {linkedObligations.length}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {linkedObligations.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No obligations linked.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {linkedObligations.map((o) => (
                      <div
                        key={o.id}
                        className="rounded-md border border-border bg-card p-2 text-sm"
                      >
                        <div className="flex items-start justify-between gap-2">
                          {o.found ? (
                            <Link
                              to={`/obligations/${o.id}`}
                              className="min-w-0 flex-1 truncate font-medium text-primary hover:underline"
                            >
                              {o.title}
                            </Link>
                          ) : (
                            <span className="min-w-0 flex-1 truncate text-muted-foreground">
                              {o.title}
                            </span>
                          )}
                          {o.status && (
                            <StatusBadge status={o.status} size="sm" />
                          )}
                        </div>
                        {o.dueDate && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            Due {format(parseISO(o.dueDate), "MMM d, yyyy")}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-primary/10 bg-gradient-to-br from-primary/[0.03] to-card dark:border-primary/20">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Sparkles
                    className="size-4 text-primary"
                    aria-hidden="true"
                  />
                  <CardTitle className="text-sm font-medium">
                    AI Risk Score
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-semibold tracking-tight">
                    {risk.score}
                  </span>
                  <ConfidenceIndicator confidence={0.85} size="md" />
                </div>
                <p className="text-xs text-muted-foreground">
                  Derived from priority, due-date proximity, and current
                  progress.
                </p>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => setAiExplainOpen(true)}
                  className="gap-1 text-primary"
                >
                  <Lightbulb className="size-3.5" aria-hidden="true" />
                  View reasoning
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </Tabs>

      <Sheet open={editOpen} onOpenChange={setEditOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Edit Corrective Action Plan</SheetTitle>
            <SheetDescription>
              Update the details for {item.capId}.
            </SheetDescription>
          </SheetHeader>
          <div className="py-4">
            <CAPForm
              defaultValues={editDefaults}
              ownerOptions={usersQuery.data?.items ?? []}
              approverOptions={
                usersQuery.data?.items.filter(
                  (u) => u.role === "approver" || u.role === "admin",
                ) ?? []
              }
              obligationOptions={(complianceQuery.data?.items ?? []).map(
                (c) => ({
                  id: c.id,
                  title: `${c.complianceId} - ${c.title}`,
                }),
              )}
              optionsLoading={usersQuery.isPending || complianceQuery.isPending}
              onSubmit={handleEditSubmit}
              onCancel={() => setEditOpen(false)}
              isSubmitting={update.isPending}
              submitLabel="Save Changes"
            />
          </div>
        </SheetContent>
      </Sheet>

      <AIExplanation
        explanation={riskExplanation}
        open={aiExplainOpen}
        onOpenChange={setAiExplainOpen}
      />
    </motion.div>
  );
}

function Fact({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon: typeof User;
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "space-y-1 rounded-lg border border-border bg-card p-3",
        className,
      )}
    >
      <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="size-3.5" aria-hidden="true" />
        {label}
      </dt>
      <dd className="text-sm font-medium text-foreground capitalize">
        {value}
      </dd>
    </div>
  );
}

function ActionRow({
  action,
  onToggle,
}: {
  action: CAPAction;
  onToggle: () => void;
}) {
  const closed = action.status === "Closed";
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-3">
      <button
        type="button"
        onClick={onToggle}
        className="mt-0.5 text-primary transition-colors hover:text-primary/80"
        aria-label={closed ? "Mark action open" : "Mark action closed"}
      >
        {closed ? (
          <CheckSquare className="size-5" aria-hidden="true" />
        ) : (
          <Square className="size-5" aria-hidden="true" />
        )}
      </button>
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-sm font-medium text-foreground",
            closed && "line-through text-muted-foreground",
          )}
        >
          {action.title}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <User className="size-3" aria-hidden="true" />
            {action.ownerName}
          </span>
          <span className="inline-flex items-center gap-1">
            <Calendar className="size-3" aria-hidden="true" />
            {format(parseISO(action.deadline), "MMM d, yyyy")}
          </span>
          <StatusBadge status={action.status} size="sm" />
        </div>
      </div>
    </div>
  );
}

function AddActionForm({
  capId,
  users,
  onAdd,
}: {
  capId: string;
  users: { id: string; name: string }[];
  onAdd: (action: CAPAction) => void;
}) {
  const [title, setTitle] = useState("");
  const [ownerId, setOwnerId] = useState("");
  const [dueDate, setDueDate] = useState("");

  const ownerName = users.find((u) => u.id === ownerId)?.name ?? "";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !ownerId || !dueDate) return;
    const newAction: CAPAction = {
      id: `act-${crypto.randomUUID()}`,
      capId,
      title,
      ownerId,
      ownerName,
      deadline: new Date(dueDate).toISOString(),
      status: "Open",
      progress: 0,
      attachments: [],
      comments: [],
      order: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    onAdd(newAction);
    setTitle("");
    setOwnerId("");
    setDueDate("");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <PlusCircle className="size-4" aria-hidden="true" />
          Add Action
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-4">
          <div className="sm:col-span-2">
            <Label htmlFor="action-title" className="text-xs">
              Description
            </Label>
            <Input
              id="action-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Action description"
            />
          </div>
          <div>
            <Label htmlFor="action-owner" className="text-xs">
              Owner
            </Label>
            <select
              id="action-owner"
              value={ownerId}
              onChange={(e) => setOwnerId(e.target.value)}
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
            >
              <option value="">Select</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="action-due" className="text-xs">
              Due
            </Label>
            <Input
              id="action-due"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
          <div className="sm:col-span-4 flex justify-end">
            <Button
              type="submit"
              size="sm"
              disabled={!title || !ownerId || !dueDate}
            >
              Add Action
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
