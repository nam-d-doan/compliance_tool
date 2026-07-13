import { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { format, differenceInDays, parseISO } from "date-fns";
import {
  ArrowLeft,
  Calendar,
  Building2,
  MapPin,
  User,
  CheckCircle,
  Clock,
  AlertTriangle,
  Trash2,
  Pencil,
  ExternalLink,
  Loader2,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { StatusBadge } from "@/components/common/StatusBadge";
import { PriorityBadge } from "@/components/common/PriorityBadge";
import { PageHero } from "@/components/common";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { DetailSkeleton } from "@/components/common/Skeletons";
import { KPICard } from "@/components/common/KPICard";
import { ApprovalPanel } from "@/components/common/ApprovalPanel";
import { TimelineEvent } from "@/components/activity/TimelineEvent";
import {
  CommentThread,
  type CommentItem,
} from "@/components/comments/CommentThread";
import { AIInsightCard } from "@/components/ai/AIInsightCard";
import {
  ComplianceForm,
  type ComplianceFormValues,
} from "@/components/compliance/ComplianceForm";
import {
  useObligationDetail,
  useObligationTimeline,
  useObligationComments,
} from "@/hooks/queries/useObligationQueries";
import { useCAPList } from "@/hooks/queries/useCAPQueries";
import {
  useUpdateObligation,
  useDeleteObligation,
  useAddObligationComment,
} from "@/hooks/mutations/useObligationMutations";
import { useAuthStore } from "@/stores";
import { hasPermission } from "@/constants/rbac";
import { toast } from "sonner";
import type {
  Obligation,
  ObligationTimelineEvent,
  ActivityFeedItem,
  AIInsight,
} from "@/types";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "timeline", label: "Timeline" },
  { id: "comments", label: "Comments" },
  { id: "approvals", label: "Approvals" },
] as const;

type TabId = (typeof TABS)[number]["id"];

const timelineTypeMap: Record<
  ObligationTimelineEvent["type"],
  ActivityFeedItem["type"]
> = {
  created: "submission",
  updated: "upload",
  submitted: "submission",
  review_required: "submission",
  cap_in_progress: "cap_created",
  completed: "approval",
  status_changed: "upload",
  approved: "approval",
  rejected: "rejection",
  cap_created: "cap_created",
  closed: "approval",
  commented: "comment",
};

function buildInsight(item: Obligation): AIInsight {
  return {
    id: `ai-${item.id}`,
    title: "AI Risk Assessment",
    description: `This obligation has an AI risk score of ${item.aiRiskScore}/100 based on criticality, due date proximity, and historical patterns.`,
    type: "risk",
    confidence: Math.min(item.aiRiskScore / 100, 0.98),
    recommendation:
      item.aiRecommendation ??
      "Review this obligation before the due date and ensure all required documentation is collected.",
    reasoning: [
      `Risk score of ${item.aiRiskScore} derived from obligation criticality (${item.riskLevel}) and due date proximity.`,
      "Cross-referenced with similar historical obligations and submission outcomes.",
      item.aiRecommendation
        ? "AI recommendation was generated from the obligation context."
        : "No specific AI recommendation was provided for this item.",
    ],
    references: [],
    entityType: "compliance",
    entityId: item.id,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

export default function ObligationDetailPage() {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { role, user } = useAuthStore();
  const canEdit = hasPermission(role, "compliance:update");
  const canDelete = hasPermission(role, "compliance:delete");
  const canApprove = hasPermission(role, "compliance:approve");

  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [editOpen, setEditOpen] = useState(false);

  const detail = useObligationDetail(id);
  const timeline = useObligationTimeline(id);
  const comments = useObligationComments(id);
  const caps = useCAPList({ compliance: id }, 1, 20);
  const update = useUpdateObligation(id);
  const remove = useDeleteObligation();
  const addComment = useAddObligationComment(id);

  const item = detail.data;

  const daysToDue = item
    ? differenceInDays(parseISO(item.dueDate), new Date())
    : 0;

  const insight = useMemo(() => (item ? buildInsight(item) : null), [item]);

  const timelineItems: ActivityFeedItem[] = useMemo(() => {
    if (!timeline.data) return [];
    return timeline.data.map((event) => ({
      ...event,
      type: timelineTypeMap[event.type],
      entityType: "compliance",
      entityId: event.obligationId,
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
    const status: "approved" | "rejected" | "pending" =
      item.status === "approved"
        ? "approved"
        : item.status === "rejected"
          ? "rejected"
          : "pending";
    return [
      {
        user: { id: item.approverId, name: item.approverName },
        status,
      },
    ];
  }, [item]);

  const handleApprove = () => {
    update.mutate(
      { status: "approved", progress: 100 },
      { onSuccess: () => toast.success("Obligation approved") },
    );
  };

  const handleReject = () => {
    update.mutate(
      { status: "rejected" },
      { onSuccess: () => toast.success("Obligation rejected") },
    );
  };

  const handleDelete = () => {
    if (!item) return;
    if (!window.confirm("Are you sure you want to delete this obligation?"))
      return;
    remove.mutate(item.id, {
      onSuccess: () => {
        toast.success("Obligation deleted");
        navigate("/obligations");
      },
    });
  };

  const handleEditSubmit = (
    values: ComplianceFormValues,
    selected: {
      regulation?: { title: string; id: string };
      owner?: { name: string; id: string };
      approver?: { name: string; id: string };
    },
  ) => {
    if (!item) return;
    update.mutate(
      {
        title: values.title,
        description: values.description,
        businessUnit: values.businessUnit,
        department: values.department,
        location: values.location,
        regulationId: values.regulationId,
        regulationName: selected.regulation?.title ?? item.regulationName,
        ownerId: values.ownerId,
        ownerName: selected.owner?.name ?? item.ownerName,
        approverId: values.approverId,
        approverName: selected.approver?.name ?? item.approverName,
        frequency: values.frequency,
        dueDate: new Date(values.dueDate).toISOString(),
        riskLevel: values.criticality,
        penalty: values.penalty,
        tags: values.tags
          ? values.tags
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean)
          : [],
      },
      {
        onSuccess: () => {
          toast.success("Obligation updated");
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

  if (detail.isPending) {
    return <DetailSkeleton />;
  }

  if (detail.isError || !item) {
    return <ErrorState onRetry={() => detail.refetch()} />;
  }

  const editDefaults: Partial<ComplianceFormValues> = {
    title: item.title,
    description: item.description,
    businessUnit: item.businessUnit,
    department: item.department,
    location: item.location,
    regulationId: item.regulationId,
    ownerId: item.ownerId,
    approverId: item.approverId,
    frequency: item.frequency,
    dueDate: item.dueDate.slice(0, 10),
    criticality: item.riskLevel,
    penalty: item.penalty,
    tags: item.tags.join(", "),
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate("/obligations")}
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to obligations
      </Button>

      <PageHero title={item.title} subtitle={item.code}>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={() => navigate(`/cap/create?obligations=${item.id}`)}
          >
            <Plus className="size-4" aria-hidden="true" />
            Create CAP
          </Button>
          {canEdit && (
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
              <Pencil className="size-4" aria-hidden="true" />
              Edit
            </Button>
          )}
          {canDelete && (
            <Button variant="destructive" size="sm" onClick={handleDelete}>
              <Trash2 className="size-4" aria-hidden="true" />
              Delete
            </Button>
          )}
        </div>
      </PageHero>

      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={item.status} size="md" />
        <PriorityBadge priority={item.riskLevel} size="md" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="flex flex-wrap gap-2 border-b border-border pb-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="relative px-3 py-2 text-sm font-medium transition-colors"
              >
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="obligation-tab"
                    className="absolute right-0 bottom-0 left-0 h-0.5 bg-primary"
                  />
                )}
              </button>
            ))}
          </div>

          {activeTab === "overview" && (
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
                  <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="space-y-1 rounded-lg border bg-card p-3">
                      <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <User className="size-3.5" aria-hidden="true" />
                        Owner
                      </dt>
                      <dd className="text-sm font-semibold text-foreground">
                        {item.ownerName}
                      </dd>
                    </div>
                    <div className="space-y-1 rounded-lg border bg-card p-3">
                      <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <CheckCircle className="size-3.5" aria-hidden="true" />
                        Approver
                      </dt>
                      <dd className="text-sm font-semibold text-foreground">
                        {item.approverName}
                      </dd>
                    </div>
                    <div className="space-y-1 rounded-lg border bg-card p-3">
                      <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Building2 className="size-3.5" aria-hidden="true" />
                        Business Unit
                      </dt>
                      <dd className="text-sm font-semibold text-foreground">
                        {item.businessUnit}
                      </dd>
                    </div>
                    <div className="space-y-1 rounded-lg border bg-card p-3">
                      <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Building2 className="size-3.5" aria-hidden="true" />
                        Department
                      </dt>
                      <dd className="text-sm font-semibold text-foreground">
                        {item.department}
                      </dd>
                    </div>
                    <div className="space-y-1 rounded-lg border bg-card p-3">
                      <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="size-3.5" aria-hidden="true" />
                        Location
                      </dt>
                      <dd className="text-sm font-semibold text-foreground">
                        {item.location}
                      </dd>
                    </div>
                    <div className="space-y-1 rounded-lg border bg-card p-3">
                      <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="size-3.5" aria-hidden="true" />
                        Frequency
                      </dt>
                      <dd className="text-sm font-semibold text-foreground capitalize">
                        {item.frequency}
                      </dd>
                    </div>
                    <div className="space-y-1 rounded-lg border bg-card p-3">
                      <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="size-3.5" aria-hidden="true" />
                        Due Date
                      </dt>
                      <dd className="text-sm font-semibold text-foreground">
                        {format(parseISO(item.dueDate), "PPP")}
                      </dd>
                    </div>
                    <div className="space-y-1 rounded-lg border bg-card p-3">
                      <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <AlertTriangle
                          className="size-3.5"
                          aria-hidden="true"
                        />
                        Penalty
                      </dt>
                      <dd className="text-sm font-semibold text-foreground">
                        {item.penalty}
                      </dd>
                    </div>
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

              {insight && (
                <AIInsightCard
                  insight={insight}
                  explanation={{
                    recommendation: insight.recommendation,
                    confidence: insight.confidence,
                    reasoning: insight.reasoning,
                    references: [],
                    relatedDocuments: [],
                    timestamp: insight.createdAt,
                    modelVersion: "compliance-ai-v1",
                  }}
                />
              )}
            </motion.div>
          )}

          {activeTab === "timeline" && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {timeline.isPending ? (
                <div className="flex justify-center py-8">
                  <Loader2
                    className="size-8 animate-spin text-primary"
                    aria-hidden="true"
                  />
                </div>
              ) : timeline.isError ? (
                <ErrorState onRetry={() => timeline.refetch()} />
              ) : timelineItems.length === 0 ? (
                <EmptyState
                  title="No timeline events"
                  description="Activity for this obligation will appear here."
                />
              ) : (
                <Card>
                  <CardContent className="space-y-1 py-6">
                    {timelineItems.map((event, index) => (
                      <TimelineEvent
                        key={event.id}
                        event={event}
                        isLast={index === timelineItems.length - 1}
                      />
                    ))}
                  </CardContent>
                </Card>
              )}
            </motion.div>
          )}

          {activeTab === "comments" && (
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
          )}

          {activeTab === "approvals" && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <ApprovalPanel
                approvers={approvers}
                currentUserId={user?.id}
                canApprove={canApprove && item.approverId === user?.id}
                onApprove={handleApprove}
                onReject={handleReject}
              />
            </motion.div>
          )}
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
            label="AI risk score"
            value={item.aiRiskScore}
            icon={AlertTriangle}
            trend={{
              direction: item.aiRiskScore >= 70 ? "up" : "down",
              percent: item.aiRiskScore,
              positive: item.aiRiskScore < 70,
            }}
          />
          <KPICard
            label="Progress"
            value={`${item.progress}%`}
            icon={CheckCircle}
          />

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Linked Regulation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm font-medium text-foreground">
                {item.regulationName}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => navigate(`/regulation/${item.regulationId}`)}
              >
                <ExternalLink className="size-4" aria-hidden="true" />
                View regulation
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Linked Corrective Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {caps.isPending ? (
                <Loader2
                  className="size-5 animate-spin text-primary"
                  aria-hidden="true"
                />
              ) : caps.data?.items.length === 0 ? (
                <p className="text-sm text-muted-foreground">No CAPs linked.</p>
              ) : (
                <div className="space-y-2">
                  {caps.data?.items.map((cap) => (
                    <button
                      key={cap.id}
                      onClick={() => navigate(`/cap/${cap.id}`)}
                      className="flex w-full items-center justify-between rounded-md border border-border bg-card p-2 text-left text-sm transition-colors hover:bg-muted/50"
                    >
                      <span className="truncate font-medium">{cap.capId}</span>
                      <StatusBadge status={cap.status} size="sm" />
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

      <Sheet open={editOpen} onOpenChange={setEditOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Edit Obligation</SheetTitle>
            <SheetDescription>
              Update the details for {item.code}.
            </SheetDescription>
          </SheetHeader>
          <div className="py-4">
            <ComplianceForm
              defaultValues={editDefaults}
              onSubmit={handleEditSubmit}
              onCancel={() => setEditOpen(false)}
              isSubmitting={update.isPending}
              submitLabel="Save Changes"
            />
          </div>
        </SheetContent>
      </Sheet>
    </motion.div>
  );
}
