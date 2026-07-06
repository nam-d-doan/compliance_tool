import { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { format, differenceInDays, parseISO, isValid } from "date-fns";
import {
  ArrowLeft,
  Calendar,
  Building2,
  MapPin,
  User,
  CheckCircle,
  FileText,
  ExternalLink,
  Trash2,
  Pencil,
  RefreshCw,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
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
import { AIInsightCard } from "@/components/ai/AIInsightCard";
import {
  LicenseForm,
  type LicenseFormValues,
} from "@/components/license/LicenseForm";
import {
  useLicenseDetail,
  useLicenseComments,
} from "@/hooks/queries/useLicenseQueries";
import {
  useUpdateLicense,
  useDeleteLicense,
  useAddLicenseComment,
} from "@/hooks/mutations/useLicenseMutations";
import { useAuthStore } from "@/stores";
import { hasPermission } from "@/constants/rbac";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { ActivityFeedItem, AIInsight, License } from "@/types";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "timeline", label: "Timeline" },
  { id: "comments", label: "Comments" },
  { id: "approvals", label: "Approvals" },
] as const;

type TabId = (typeof TABS)[number]["id"];

function buildInsight(item: License): AIInsight {
  const days = item.remainingDays;
  return {
    id: `ai-${item.id}`,
    title: "AI Risk Assessment",
    description: `This license has an AI risk score of ${item.aiRiskScore}/100 based on remaining validity (${days} days), business criticality (${item.criticality}), and regulatory importance.`,
    type: "risk",
    confidence: Math.min(item.aiRiskScore / 100, 0.98),
    recommendation:
      days < 30
        ? "Prioritise renewal immediately — validity is critically short."
        : days < 60
          ? "Begin renewal preparation now to avoid last-minute risk."
          : "Monitor expiry date and plan renewal in the current cycle.",
    reasoning: [
      `Remaining validity of ${days} days contributes significantly to the score.`,
      `Criticality level is ${item.criticality}.`,
      `Renewal cycle is ${item.renewalCycle}.`,
      `Historical patterns for similar ${item.businessUnit} licenses were considered.`,
    ],
    references: [],
    entityType: "license",
    entityId: item.id,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

export default function LicenseDetailPage() {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { role, user } = useAuthStore();
  const canEdit = hasPermission(role, "license:update");
  const canDelete = hasPermission(role, "license:delete");
  const canApprove = hasPermission(role, "license:approve");

  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [editOpen, setEditOpen] = useState(false);

  const detail = useLicenseDetail(id);
  const comments = useLicenseComments(id);
  const update = useUpdateLicense(id);
  const remove = useDeleteLicense();
  const addComment = useAddLicenseComment(id);

  const item = detail.data;

  const insight = useMemo(() => (item ? buildInsight(item) : null), [item]);

  const timelineItems: ActivityFeedItem[] = useMemo(() => {
    if (!item) return [];
    const events: ActivityFeedItem[] = [
      {
        id: `${item.id}-created`,
        type: "license_updated",
        title: "License created",
        description: `${item.licenseName} was registered in the system.`,
        userId: item.ownerId,
        userName: item.ownerName,
        entityType: "license",
        entityId: item.id,
        timestamp: item.createdAt,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      },
      {
        id: `${item.id}-issued`,
        type: "license_updated",
        title: "License issued",
        description: `Issued by ${item.issuingAuthority}.`,
        userId: item.ownerId,
        userName: item.ownerName,
        entityType: "license",
        entityId: item.id,
        timestamp: item.issueDate,
        createdAt: item.issueDate,
        updatedAt: item.issueDate,
      },
      {
        id: `${item.id}-expiry`,
        type: "ai_insight",
        title: "License expires",
        description: `Valid until ${format(parseISO(item.expiryDate), "PPP")}.`,
        userId: item.ownerId,
        userName: item.ownerName,
        entityType: "license",
        entityId: item.id,
        timestamp: item.expiryDate,
        createdAt: item.expiryDate,
        updatedAt: item.expiryDate,
      },
    ];

    if (item.status === "Renewed") {
      events.push({
        id: `${item.id}-renewed`,
        type: "approval",
        title: "License renewed",
        description: "Renewal was approved and recorded.",
        userId: item.approverId,
        userName: item.approverName,
        entityType: "license",
        entityId: item.id,
        timestamp: item.updatedAt,
        createdAt: item.updatedAt,
        updatedAt: item.updatedAt,
      });
    } else if (item.status === "Expired") {
      events.push({
        id: `${item.id}-expired`,
        type: "rejection",
        title: "License expired",
        description: "The license has passed its expiry date.",
        userId: item.approverId,
        userName: item.approverName,
        entityType: "license",
        entityId: item.id,
        timestamp: item.expiryDate,
        createdAt: item.expiryDate,
        updatedAt: item.expiryDate,
      });
    }

    return events.sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );
  }, [item]);

  const commentItems: CommentItem[] = useMemo(() => {
    return (
      comments.data?.map((c) => ({
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
    const approverStatus: "approved" | "rejected" | "pending" =
      item.status === "Renewed"
        ? "approved"
        : item.status === "Expired" || item.status === "Suspended"
          ? "rejected"
          : "pending";
    return [
      {
        user: { id: item.ownerId, name: item.ownerName },
        status: "approved" as const,
      },
      {
        user: { id: item.approverId, name: item.approverName },
        status: approverStatus,
      },
    ];
  }, [item]);

  const remainingDaysColor =
    !item || item.remainingDays < 0
      ? "text-red-600 dark:text-red-400"
      : item.remainingDays <= 30
        ? "text-amber-600 dark:text-amber-400"
        : "text-emerald-600 dark:text-emerald-400";

  const handleRenew = () => {
    if (!item) return;
    update.mutate(
      { status: "Renewed" },
      {
        onSuccess: () => {
          toast.success("License renewed");
        },
      },
    );
  };

  const handleApprove = () => {
    if (!item) return;
    const nextStatus =
      item.status === "Active" || item.status === "Expiring Soon"
        ? "Renewed"
        : "Active";
    update.mutate(
      { status: nextStatus },
      {
        onSuccess: () => {
          toast.success("Renewal approved");
        },
      },
    );
  };

  const handleReject = () => {
    if (!item) return;
    update.mutate(
      { status: "Suspended" },
      {
        onSuccess: () => {
          toast.success("Renewal rejected");
        },
      },
    );
  };

  const handleDelete = () => {
    if (!item) return;
    if (!window.confirm("Are you sure you want to delete this license?"))
      return;
    remove.mutate(item.id, {
      onSuccess: () => {
        toast.success("License deleted");
        navigate("/license");
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

  const handleEditSubmit = (
    values: LicenseFormValues,
    selected: {
      regulation?: { id: string; title: string; reference: string };
      owner?: { id: string; name: string };
      approver?: { id: string; name: string };
    },
  ) => {
    if (!item) return;
    const today = new Date();
    const expiry = parseISO(values.expiryDate);
    const remainingDays = differenceInDays(expiry, today);
    update.mutate(
      {
        licenseName: values.licenseName,
        licenseNumber: values.licenseNumber,
        issuingAuthority: values.issuingAuthority,
        department: values.department,
        businessUnit: values.businessUnit,
        country: values.country,
        location: values.location,
        issueDate: values.issueDate,
        expiryDate: values.expiryDate,
        renewalCycle: values.renewalCycle,
        ownerId: values.ownerId,
        ownerName: selected.owner?.name ?? item.ownerName,
        approverId: values.approverId,
        approverName: selected.approver?.name ?? item.approverName,
        criticality: values.criticality,
        regulationId: values.regulationId,
        regulationName: selected.regulation?.title ?? item.regulationName,
        tags: values.tags,
        remainingDays,
        renewalPriority:
          remainingDays < 30
            ? "critical"
            : remainingDays < 60
              ? "high"
              : remainingDays < 120
                ? "medium"
                : "low",
      },
      {
        onSuccess: () => {
          toast.success("License updated");
          setEditOpen(false);
        },
      },
    );
  };

  if (detail.isPending) {
    return <DetailSkeleton />;
  }

  if (detail.isError || !item) {
    return <ErrorState onRetry={() => detail.refetch()} />;
  }

  const formatDate = (value: string) => {
    const parsed = parseISO(value);
    return isValid(parsed) ? format(parsed, "PPP") : value;
  };

  const journeySteps = [
    { id: "issue", label: "Issued", date: item.issueDate },
    { id: "active", label: "Active", date: item.issueDate },
    { id: "expiring", label: "Expiring", date: item.expiryDate },
    {
      id: "renewed",
      label: item.status === "Expired" ? "Expired" : "Renewed",
      date: item.expiryDate,
    },
  ];

  const currentJourneyIndex =
    item.status === "Renewed"
      ? 3
      : item.status === "Expired"
        ? 3
        : item.status === "Suspended"
          ? 2
          : item.remainingDays <= 60
            ? 2
            : 1;

  const editDefaults: Partial<LicenseFormValues> = {
    licenseName: item.licenseName,
    licenseNumber: item.licenseNumber,
    issuingAuthority: item.issuingAuthority,
    department: item.department,
    businessUnit: item.businessUnit,
    country: item.country,
    location: item.location,
    issueDate: item.issueDate.slice(0, 10),
    expiryDate: item.expiryDate.slice(0, 10),
    renewalCycle: (item.renewalCycle === "Five-Year"
      ? "Quinquennial"
      : item.renewalCycle) as LicenseFormValues["renewalCycle"],
    ownerId: item.ownerId,
    approverId: item.approverId,
    criticality: item.criticality,
    regulationId: item.regulationId,
    tags: item.tags,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <Button variant="ghost" size="sm" onClick={() => navigate("/license")}>
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to licenses
      </Button>

      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0c3767] via-[#185b95] to-[#147769] p-6 text-white shadow-lg sm:p-8">
        <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                {item.licenseName}
              </h1>
              <StatusBadge status={item.status} size="md" />
              <PriorityBadge priority={item.criticality} size="md" />
            </div>
            <p className="text-sm text-blue-100">{item.licenseNumber}</p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-blue-50">
              <span className="inline-flex items-center gap-1.5">
                <User className="size-4" aria-hidden="true" />
                {item.ownerName}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="size-4" aria-hidden="true" />
                Expires {formatDate(item.expiryDate)}
              </span>
            </div>
          </div>

          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <div className="rounded-xl bg-white/10 p-4 backdrop-blur-sm">
              <div
                className={cn(
                  "text-3xl font-bold tabular-nums",
                  remainingDaysColor,
                )}
              >
                {item.remainingDays < 0
                  ? Math.abs(item.remainingDays)
                  : item.remainingDays}
              </div>
              <div className="text-xs text-blue-100">
                {item.remainingDays < 0 ? "days overdue" : "days remaining"}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {canEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditOpen(true)}
                  className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                >
                  <Pencil className="size-4" aria-hidden="true" />
                  Edit
                </Button>
              )}
              {canEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRenew}
                  className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                >
                  <RefreshCw className="size-4" aria-hidden="true" />
                  Renew
                </Button>
              )}
              {canDelete && (
                <Button variant="destructive" size="sm" onClick={handleDelete}>
                  <Trash2 className="size-4" aria-hidden="true" />
                  Delete
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="flex flex-wrap gap-2 border-b border-border pb-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "relative px-3 py-2 text-sm font-medium transition-colors",
                  activeTab === tab.id
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="license-tab"
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
                  <CardTitle>License Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {[
                      {
                        label: "Issuing Authority",
                        value: item.issuingAuthority,
                        icon: Building2,
                      },
                      {
                        label: "Department",
                        value: item.department,
                        icon: Building2,
                      },
                      {
                        label: "Business Unit",
                        value: item.businessUnit,
                        icon: Building2,
                      },
                      { label: "Country", value: item.country, icon: MapPin },
                      { label: "Location", value: item.location, icon: MapPin },
                      {
                        label: "Issue Date",
                        value: formatDate(item.issueDate),
                        icon: Calendar,
                      },
                      {
                        label: "Expiry Date",
                        value: formatDate(item.expiryDate),
                        icon: Calendar,
                      },
                      {
                        label: "Renewal Cycle",
                        value: item.renewalCycle,
                        icon: RefreshCw,
                      },
                      { label: "Owner", value: item.ownerName, icon: User },
                      {
                        label: "Approver",
                        value: item.approverName,
                        icon: CheckCircle,
                      },
                      {
                        label: "Criticality",
                        value: (
                          <PriorityBadge
                            priority={item.criticality}
                            size="sm"
                          />
                        ),
                        icon: CheckCircle,
                      },
                      {
                        label: "Remaining Days",
                        value: (
                          <span
                            className={cn("font-semibold", remainingDaysColor)}
                          >
                            {item.remainingDays < 0
                              ? `${Math.abs(item.remainingDays)} overdue`
                              : `${item.remainingDays} left`}
                          </span>
                        ),
                        icon: Calendar,
                      },
                    ].map((fact) => (
                      <div
                        key={fact.label}
                        className={cn(
                          "space-y-1 rounded-lg border p-3",
                          fact.label === "Remaining Days" &&
                            item.remainingDays < 30 &&
                            "border-red-200 bg-red-50 dark:border-red-900/40 dark:bg-red-950/20",
                        )}
                      >
                        <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <fact.icon className="size-3.5" aria-hidden="true" />
                          {fact.label}
                        </dt>
                        <dd className="text-sm font-medium text-foreground">
                          {fact.value}
                        </dd>
                      </div>
                    ))}
                    <div className="space-y-1 rounded-lg border p-3 sm:col-span-2 lg:col-span-3">
                      <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <ExternalLink className="size-3.5" aria-hidden="true" />
                        Linked Regulation
                      </dt>
                      <dd className="flex items-center gap-2 text-sm font-medium text-foreground">
                        {item.regulationName}
                        {item.regulationId && (
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() =>
                              navigate(`/regulation/${item.regulationId}`)
                            }
                            className="gap-1 text-primary"
                          >
                            View
                            <ExternalLink
                              className="size-3"
                              aria-hidden="true"
                            />
                          </Button>
                        )}
                      </dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Renewal Journey</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap items-center gap-2">
                    {journeySteps.map((step, index) => {
                      const isDone = index <= currentJourneyIndex;
                      const isCurrent = index === currentJourneyIndex;
                      return (
                        <div key={step.id} className="flex items-center gap-2">
                          <div
                            className={cn(
                              "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm",
                              isDone
                                ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300"
                                : "border-border bg-muted/40 text-muted-foreground",
                              isCurrent && "ring-2 ring-primary/30",
                            )}
                          >
                            <span
                              className={cn(
                                "flex size-5 items-center justify-center rounded-full text-xs font-bold",
                                isDone
                                  ? "bg-emerald-500 text-white"
                                  : "bg-muted-foreground/20 text-muted-foreground",
                              )}
                            >
                              {index + 1}
                            </span>
                            <span className="font-medium">{step.label}</span>
                          </div>
                          {index < journeySteps.length - 1 && (
                            <ChevronRight
                              className="size-4 text-muted-foreground"
                              aria-hidden="true"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
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
                    modelVersion: "license-ai-v1",
                  }}
                />
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Supporting Documents</CardTitle>
                </CardHeader>
                <CardContent>
                  {item.supportingDocumentIds.length === 0 ? (
                    <EmptyState
                      title="No documents uploaded"
                      description="Upload certificates, permits, or supporting evidence for this license."
                    />
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {item.supportingDocumentIds.map((docId, index) => (
                        <div
                          key={docId}
                          className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
                        >
                          <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <FileText className="size-4" aria-hidden="true" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-foreground">
                              Document {index + 1}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {docId}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {activeTab === "timeline" && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {timelineItems.length === 0 ? (
                <EmptyState
                  title="No timeline events"
                  description="Activity for this license will appear here."
                />
              ) : (
                <Card>
                  <CardContent className="py-6">
                    <ActivityFeed events={timelineItems} />
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

        <div className="space-y-4 lg:sticky lg:top-4 lg:self-start">
          <KPICard
            label="Days remaining"
            value={
              item.remainingDays < 0
                ? Math.abs(item.remainingDays)
                : item.remainingDays
            }
            subtitle={
              item.remainingDays < 0
                ? "days overdue"
                : item.remainingDays === 0
                  ? "Due today"
                  : "days left"
            }
            icon={Calendar}
            trend={{
              direction: item.remainingDays < 0 ? "down" : "flat",
              percent: Math.abs(item.remainingDays),
              positive: item.remainingDays >= 0,
            }}
          />
          <KPICard
            label="AI risk score"
            value={item.aiRiskScore}
            icon={CheckCircle}
            trend={{
              direction: item.aiRiskScore >= 70 ? "up" : "down",
              percent: item.aiRiskScore,
              positive: item.aiRiskScore < 70,
            }}
          />
          <KPICard label="Status" value={item.status} icon={CheckCircle} />

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Linked Regulation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm font-medium text-foreground">
                {item.regulationName}
              </p>
              {item.regulationId && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => navigate(`/regulation/${item.regulationId}`)}
                >
                  <ExternalLink className="size-4" aria-hidden="true" />
                  View regulation
                </Button>
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
            <SheetTitle>Edit License</SheetTitle>
            <SheetDescription>
              Update the details for {item.licenseNumber}.
            </SheetDescription>
          </SheetHeader>
          <div className="py-4">
            <LicenseForm
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
