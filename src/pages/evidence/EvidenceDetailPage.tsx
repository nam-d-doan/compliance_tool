import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Archive,
  ArrowLeft,
  Calendar,
  Download,
  FileText,
  FolderOpen,
  HardDrive,
  Loader2,
  MessageSquare,
  RefreshCw,
  Sparkles,
  Tag,
  Trash2,
  UploadCloud,
  User,
} from "lucide-react";
import { motion } from "motion/react";
import { format } from "date-fns";
import { toast } from "sonner";
import { ActivityFeed } from "@/components/activity/ActivityFeed";
import { CommentThread } from "@/components/comments/CommentThread";
import { ConfidenceIndicator } from "@/components/ai/ConfidenceIndicator";
import { AIExplanation } from "@/components/ai/AIExplanation";
import { StatusBadge } from "@/components/common/StatusBadge";
import { PageHero } from "@/components/common";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { DetailSkeleton } from "@/components/common/Skeletons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuthStore } from "@/stores";
import {
  useEvidenceDetail,
  useEvidenceComments,
  useEvidenceTimeline,
  useComplianceDetail,
} from "@/hooks/queries";
import {
  useValidateEvidence,
  useAddEvidenceComment,
  useDeleteEvidence,
} from "@/hooks/mutations";
import { hasPermission } from "@/constants/rbac";
import { cn } from "@/lib/utils";
import type { EvidenceValidation } from "@/types";

function fileIcon(fileType: string) {
  const type = fileType.toLowerCase();
  if (type.includes("pdf") || type.includes("doc") || type.includes("txt"))
    return FileText;
  if (type.includes("xls") || type.includes("csv")) return FileText;
  if (type.includes("zip") || type.includes("tar") || type.includes("gz"))
    return Archive;
  return FolderOpen;
}

export default function EvidenceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, role } = useAuthStore();
  const canDelete = hasPermission(role, "evidence:delete");
  const canUpdate = hasPermission(role, "evidence:update");

  const evidenceId = id ?? "";
  const detail = useEvidenceDetail(evidenceId);
  const comments = useEvidenceComments(evidenceId);
  const timeline = useEvidenceTimeline(evidenceId);
  const compliance = useComplianceDetail(detail.data?.complianceId ?? "");
  const validate = useValidateEvidence(evidenceId);
  const addComment = useAddEvidenceComment(evidenceId);
  const deleteEvidence = useDeleteEvidence();
  const [reasoningOpen, setReasoningOpen] = useState(false);

  const item = detail.data;

  const handleRevalidate = async () => {
    try {
      await validate.mutateAsync();
      toast.success("AI validation re-run completed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Validation failed");
    }
  };

  const handleDelete = async () => {
    if (!item) return;
    if (
      !window.confirm(`Delete evidence "${item.name}"? This cannot be undone.`)
    )
      return;
    try {
      await deleteEvidence.mutateAsync(item.id);
      toast.success("Evidence deleted");
      navigate("/evidence");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  };

  const handleAddComment = (content: string) => {
    addComment.mutate(
      {
        content,
        userId: user?.id,
        userName: user?.name,
      },
      {
        onSuccess: () => toast.success("Comment added"),
        onError: (err) =>
          toast.error(
            err instanceof Error ? err.message : "Failed to add comment",
          ),
      },
    );
  };

  if (detail.isPending) {
    return <DetailSkeleton />;
  }

  if (detail.isError || !item) {
    return (
      <ErrorState
        title="Could not load evidence"
        message={detail.error?.message ?? "Evidence not found."}
        onRetry={() => detail.refetch()}
      />
    );
  }

  const Icon = fileIcon(item.fileType);
  const aiDone = item.aiValidation.status !== "pending";

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate("/evidence")}>
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to library
      </Button>

      <PageHero
        title={item.name}
        subtitle={`${item.category} · Version ${item.version}`}
      >
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white"
          >
            <Download className="size-4" aria-hidden="true" />
            Download
          </Button>
          {canUpdate && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white"
              onClick={handleRevalidate}
              disabled={validate.isPending}
            >
              {validate.isPending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <RefreshCw className="size-4" aria-hidden="true" />
              )}
              Re-validate
            </Button>
          )}
          {canDelete && (
            <Button
              variant="destructive"
              size="sm"
              className="gap-1.5"
              onClick={handleDelete}
              disabled={deleteEvidence.isPending}
            >
              <Trash2 className="size-4" aria-hidden="true" />
              Delete
            </Button>
          )}
        </div>
      </PageHero>

      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={item.status} size="md" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border bg-muted/30 py-12 text-center">
                <div className="flex size-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                  <Icon className="size-8" aria-hidden="true" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{item.fileName}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.fileType || "Unknown type"} ·{" "}
                    {formatBytes(item.fileSize)}
                  </p>
                </div>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Download className="size-4" aria-hidden="true" />
                  Download File
                </Button>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <MetadataItem
                  label="Size"
                  value={formatBytes(item.fileSize)}
                  icon={<HardDrive className="size-3.5" />}
                />
                <MetadataItem
                  label="Type"
                  value={item.fileType || "—"}
                  icon={<FileText className="size-3.5" />}
                />
                <MetadataItem
                  label="Checksum"
                  value={item.checksum ? `${item.checksum.slice(0, 12)}…` : "—"}
                  icon={<div className="font-mono text-[10px]">#</div>}
                />
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="details">
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="ai">AI Validation</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="comments">Comments</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="pt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Metadata</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <DetailField boxed label="Name" value={item.name} />
                    <DetailField boxed label="Category" value={item.category} />
                    <DetailField
                      boxed
                      label="Owner"
                      value={item.ownerName}
                      icon={<User className="size-3.5" />}
                    />
                    <DetailField
                      boxed
                      label="Upload date"
                      value={format(new Date(item.uploadDate), "PPP")}
                      icon={<Calendar className="size-3.5" />}
                    />
                    <DetailField
                      boxed
                      label="Version"
                      value={`${item.version}`}
                    />
                    <DetailField
                      boxed
                      label="Compliance item"
                      value={
                        item.complianceId ? (
                          compliance.data ? (
                            <Link
                              to={`/compliance/${item.complianceId}`}
                              className="text-primary hover:underline"
                            >
                              {compliance.data.complianceId} —{" "}
                              {compliance.data.title}
                            </Link>
                          ) : (
                            (item.complianceTitle ?? item.complianceId)
                          )
                        ) : (
                          "Not linked"
                        )
                      }
                    />
                  </div>

                  {item.tags.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="mb-2 flex items-center gap-1.5 text-sm font-medium text-foreground">
                          <Tag className="size-3.5" aria-hidden="true" />
                          Tags
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {item.tags.map((tag) => (
                            <Badge
                              key={tag}
                              variant="secondary"
                              className="text-xs"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="ai" className="pt-4">
              <AIValidationCard
                validation={item.aiValidation}
                onRevalidate={canUpdate ? handleRevalidate : undefined}
                isRevalidating={validate.isPending}
                reasoningOpen={reasoningOpen}
                onReasoningOpenChange={setReasoningOpen}
              />
            </TabsContent>

            <TabsContent value="timeline" className="pt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Activity Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <ActivityFeed
                    events={
                      (timeline.data ?? []) as Parameters<
                        typeof ActivityFeed
                      >[0]["events"]
                    }
                    loading={timeline.isPending}
                    emptyMessage="No timeline events for this evidence."
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="comments" className="pt-4">
              <CommentThread
                comments={
                  (comments.data?.items ?? []) as Parameters<
                    typeof CommentThread
                  >[0]["comments"]
                }
                loading={comments.isPending}
                onAdd={handleAddComment}
                currentUserId={user?.id}
                title="Comments"
              />
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2"
              >
                <Download className="size-4" aria-hidden="true" />
                Download file
              </Button>
              {canUpdate && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start gap-2"
                  onClick={handleRevalidate}
                  disabled={validate.isPending}
                >
                  {validate.isPending ? (
                    <Loader2
                      className="size-4 animate-spin"
                      aria-hidden="true"
                    />
                  ) : (
                    <Sparkles className="size-4" aria-hidden="true" />
                  )}
                  Re-run AI validation
                </Button>
              )}
              {canUpdate && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start gap-2"
                >
                  <UploadCloud className="size-4" aria-hidden="true" />
                  Upload new version
                </Button>
              )}
              {canDelete && (
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full justify-start gap-2"
                  onClick={handleDelete}
                  disabled={deleteEvidence.isPending}
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                  Delete evidence
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Compliance Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {item.complianceId && compliance.data ? (
                <>
                  <DetailField
                    label="ID"
                    value={compliance.data.complianceId}
                  />
                  <DetailField label="Title" value={compliance.data.title} />
                  <DetailField
                    label="Regulation"
                    value={compliance.data.regulationName}
                  />
                  <DetailField
                    label="Owner"
                    value={compliance.data.ownerName}
                  />
                  <DetailField
                    label="Due"
                    value={format(new Date(compliance.data.dueDate), "PPP")}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 w-full"
                    asChild
                  >
                    <Link to={`/compliance/${item.complianceId}`}>
                      View obligation
                    </Link>
                  </Button>
                </>
              ) : item.complianceId ? (
                <DetailField
                  label="Linked item"
                  value={item.complianceTitle ?? item.complianceId}
                />
              ) : (
                <EmptyState
                  title="Not linked"
                  description="This evidence is not associated with a compliance obligation."
                  className="border-0 bg-transparent py-4"
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function DetailField({
  label,
  value,
  icon,
  boxed,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  boxed?: boolean;
}) {
  return (
    <div className={cn("space-y-1", boxed && "rounded-lg border bg-card p-3")}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <div
        className={cn(
          "flex items-center gap-1.5 text-sm",
          boxed
            ? "font-semibold text-foreground"
            : "font-medium text-foreground",
        )}
      >
        {icon && <span className="text-muted-foreground">{icon}</span>}
        <span className="break-words">{value}</span>
      </div>
    </div>
  );
}

function MetadataItem({
  label,
  value,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-3">
      <div className="mt-0.5 text-muted-foreground">{icon}</div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold text-foreground">{value}</p>
      </div>
    </div>
  );
}

function AIValidationCard({
  validation,
  onRevalidate,
  isRevalidating,
  reasoningOpen,
  onReasoningOpenChange,
}: {
  validation: EvidenceValidation;
  onRevalidate?: () => void;
  isRevalidating: boolean;
  reasoningOpen: boolean;
  onReasoningOpenChange: (open: boolean) => void;
}) {
  const hasExtracted =
    validation.extractedMetadata &&
    Object.keys(validation.extractedMetadata).length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="size-4 text-primary" aria-hidden="true" />
          AI Validation Result
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Validation status</p>
            <StatusBadge status={validation.status} size="md" />
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Quality score</p>
            <ConfidenceIndicator
              confidence={validation.score / 100}
              size="md"
            />
          </div>
        </div>

        {validation.issues.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-foreground">
              Issues identified
            </h4>
            <ul className="space-y-1.5">
              {validation.issues.map((issue, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2 text-sm text-muted-foreground"
                >
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-destructive" />
                  {issue}
                </li>
              ))}
            </ul>
          </div>
        )}

        {validation.missingItems.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-foreground">
              Missing items
            </h4>
            <ul className="space-y-1.5">
              {validation.missingItems.map((item, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2 text-sm text-muted-foreground"
                >
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-amber-500" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {validation.recommendations.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-foreground">
              Recommendations
            </h4>
            <ul className="space-y-1.5">
              {validation.recommendations.map((rec, idx) => (
                <motion.li
                  key={idx}
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex items-start gap-2 text-sm text-muted-foreground"
                >
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-emerald-500" />
                  {rec}
                </motion.li>
              ))}
            </ul>
          </div>
        )}

        {hasExtracted && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-foreground">
              Extracted metadata
            </h4>
            <div className="grid gap-2 sm:grid-cols-2">
              {Object.entries(validation.extractedMetadata!).map(
                ([key, value]) => (
                  <div
                    key={key}
                    className="rounded-lg border border-border bg-muted/30 p-2"
                  >
                    <p className="text-xs text-muted-foreground">{key}</p>
                    <p className="text-sm font-medium text-foreground">
                      {value}
                    </p>
                  </div>
                ),
              )}
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 pt-2">
          {onRevalidate && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRevalidate}
              disabled={isRevalidating}
              className="gap-1.5"
            >
              {isRevalidating ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <RefreshCw className="size-4" aria-hidden="true" />
              )}
              Re-run validation
            </Button>
          )}
          <AIExplanation
            explanation={{
              recommendation: `AI validation result: ${validation.status.replace("_", " ")}`,
              confidence: validation.confidence / 100,
              reasoning: validation.issues.length
                ? validation.issues
                : ["No issues detected by the AI validation model."],
              references: [],
              relatedDocuments: [],
              timestamp: new Date().toISOString(),
              modelVersion: "gpt-4o-mock-v1",
            }}
            open={reasoningOpen}
            onOpenChange={onReasoningOpenChange}
          >
            <Button variant="ghost" size="sm" className="gap-1.5">
              <MessageSquare className="size-4" aria-hidden="true" />
              View reasoning
            </Button>
          </AIExplanation>
        </div>
      </CardContent>
    </Card>
  );
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
}
