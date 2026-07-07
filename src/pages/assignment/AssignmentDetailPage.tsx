import { useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "motion/react";
import { format, differenceInDays, parseISO } from "date-fns";
import {
  ArrowLeft,
  Building2,
  Calendar,
  ClipboardCheck,
  FileText,
  User,
  BookOpen,
  Pencil,
  Ban,
  ThumbsUp,
  ExternalLink,
  Loader2,
  Clock,
  Save,
  Inbox,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  PageHero,
  StatusBadge,
  PriorityBadge,
  ErrorState,
} from "@/components/common";
import { EmptyState } from "@/components/common/EmptyState";
import { DetailSkeleton } from "@/components/common/Skeletons";
import { KPICard } from "@/components/common/KPICard";
import { TimelineEvent } from "@/components/activity/TimelineEvent";
import {
  useAssignmentDetail,
  useAssignmentTimeline,
} from "@/hooks/queries";
import {
  useUpdateAssignment,
  useAcknowledgeAssignment,
  useCancelAssignment,
} from "@/hooks/mutations";
import { useAuthStore } from "@/stores";
import { hasPermission } from "@/constants/rbac";
import { ROUTES } from "@/constants/routes";
import { PRIORITY_LEVELS } from "@/constants/status";
import type { PriorityLevel } from "@/constants/status";
import { toast } from "sonner";
import type {
  Assignment,
  AssignmentTimelineEvent,
  ActivityFeedItem,
  UpdateAssignmentInput,
} from "@/types";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "obligations", label: "Obligations" },
  { id: "timeline", label: "Timeline" },
] as const;

type TabId = (typeof TABS)[number]["id"];

const selectClass =
  "h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

const timelineTypeMap: Record<
  AssignmentTimelineEvent["type"],
  ActivityFeedItem["type"]
> = {
  created: "submission",
  published: "regulation_published",
  acknowledged: "approval",
  in_progress: "upload",
  completed: "approval",
  cancelled: "rejection",
  updated: "upload",
};

function Fact({
  icon: Icon,
  label,
  value,
  danger,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <div
      className={[
        "space-y-1 rounded-lg border bg-card p-3",
        danger ? "border-red-300 dark:border-red-700" : "border-border",
      ].join(" ")}
    >
      <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="size-3.5" aria-hidden="true" />
        {label}
      </dt>
      <dd className="text-sm font-semibold text-foreground">{value}</dd>
    </div>
  );
}

export default function AssignmentDetailPage() {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { role, user } = useAuthStore();

  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [editOpen, setEditOpen] = useState(false);

  const detail = useAssignmentDetail(id);
  const timeline = useAssignmentTimeline(id);
  const update = useUpdateAssignment(id);
  const acknowledge = useAcknowledgeAssignment(id);
  const cancel = useCancelAssignment(id);

  const canUpdate = hasPermission(role, "assignment:update");

  const item = detail.data;

  const timelineItems: ActivityFeedItem[] = useMemo(() => {
    if (!timeline.data) return [];
    return timeline.data.map((event) => ({
      ...event,
      type: timelineTypeMap[event.type],
      entityType: "compliance" as const,
      entityId: event.assignmentId,
      createdAt: event.timestamp,
      updatedAt: event.timestamp,
    }));
  }, [timeline.data]);

  if (detail.isPending) {
    return (
      <div className="space-y-6">
        <PageHero title="Assignment" subtitle="Loading..." />
        <DetailSkeleton />
      </div>
    );
  }

  if (detail.isError || !item) {
    return (
      <div className="space-y-6">
        <PageHero title="Assignment" />
        <ErrorState
          title="Assignment not found"
          message="This assignment may have been deleted or the link is invalid."
          onRetry={() => navigate(ROUTES.ASSIGNMENTS.LIST)}
        />
      </div>
    );
  }

  const a = item as Assignment;
  const isOverdue =
    new Date(a.dueDate) < new Date() &&
    !["completed", "cancelled"].includes(a.status);
  const daysToDue = differenceInDays(parseISO(a.dueDate), new Date());

  const isCreator = a.assignorId === user?.id;
  const canEdit = canUpdate && isCreator;
  const canCancel =
    canUpdate && !["completed", "cancelled"].includes(a.status);
  const canAcknowledge =
    a.status === "published" && a.assignorId !== user?.id;

  const handleAcknowledge = () => {
    acknowledge.mutate(undefined, {
      onSuccess: () => toast.success("Assignment acknowledged"),
      onError: (err) => toast.error(err.message || "Failed to acknowledge"),
    });
  };

  const handleCancel = () => {
    if (!window.confirm("Cancel this assignment? This cannot be undone."))
      return;
    cancel.mutate(undefined, {
      onSuccess: () => toast.success("Assignment cancelled"),
      onError: (err) => toast.error(err.message || "Failed to cancel"),
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <PageHero
        title={a.title}
        subtitle={`Assigned to ${a.assignedDepartmentName ?? a.assignedDepartmentId}${a.assignedOfficeName ? ` · ${a.assignedOfficeName}` : ""}`}
      >
        <div className="flex flex-col items-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-white/90 hover:bg-white/10 hover:text-white"
            onClick={() => navigate(ROUTES.ASSIGNMENTS.LIST)}
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back to assignments
          </Button>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={a.status} size="md" />
            <PriorityBadge priority={a.priority} size="md" />
          </div>
        </div>
      </PageHero>

      {isOverdue && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 dark:border-amber-700 dark:bg-amber-950/40"
        >
          <Calendar className="size-5 shrink-0 text-amber-600 dark:text-amber-400" />
          <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
            This assignment was due on{" "}
            {format(new Date(a.dueDate), "PPP")} and is now overdue.
          </p>
        </motion.div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Action bar */}
          {(canEdit || canCancel || canAcknowledge) && (
            <div className="flex flex-wrap items-center gap-2">
              {canEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditOpen(true)}
                >
                  <Pencil className="size-4" aria-hidden="true" />
                  Edit Assignment
                </Button>
              )}
              {canAcknowledge && (
                <Button
                  size="sm"
                  onClick={handleAcknowledge}
                  disabled={acknowledge.isPending}
                >
                  {acknowledge.isPending ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <ThumbsUp className="size-4" aria-hidden="true" />
                  )}
                  Acknowledge
                </Button>
              )}
              {canCancel && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                  disabled={cancel.isPending}
                  className="text-destructive hover:text-destructive"
                >
                  <Ban className="size-4" aria-hidden="true" />
                  Cancel Assignment
                </Button>
              )}
            </div>
          )}

          {/* Tabs */}
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
                    layoutId="assignment-tab"
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
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {a.description || "No description provided."}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <Fact
                      icon={BookOpen}
                      label="Regulation"
                      value={a.regulationTitle ?? a.regulationId}
                    />
                    <Fact
                      icon={User}
                      label="Assignor"
                      value={a.assignorName ?? a.assignorId}
                    />
                    <Fact
                      icon={Building2}
                      label="Department"
                      value={a.assignedDepartmentName ?? a.assignedDepartmentId}
                    />
                    {a.assignedOfficeName && (
                      <Fact
                        icon={Building2}
                        label="Office"
                        value={a.assignedOfficeName}
                      />
                    )}
                    <Fact
                      icon={Calendar}
                      label="Due Date"
                      value={format(new Date(a.dueDate), "PPP")}
                      danger={isOverdue}
                    />
                    <Fact
                      icon={ClipboardCheck}
                      label="Created"
                      value={format(new Date(a.createdDate), "PPP")}
                    />
                  </dl>
                </CardContent>
              </Card>

              {a.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle>Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-foreground">{a.notes}</p>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          )}

          {activeTab === "obligations" && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <EmptyState
                icon={<Inbox className="size-6" aria-hidden="true" />}
                title="No obligations yet"
                description="Obligations will appear here once submitted by the assigned department."
              />
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
                  description="Activity for this assignment will appear here."
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
        </div>

        {/* Right rail */}
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

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Linked Regulation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm font-medium text-foreground">
                {a.regulationTitle ?? a.regulationId}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => navigate(`/regulation/${a.regulationId}`)}
              >
                <ExternalLink className="size-4" aria-hidden="true" />
                View regulation
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Quick Facts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="size-3.5" aria-hidden="true" />
                  Last updated
                </span>
                <span className="font-medium">
                  {format(new Date(a.updatedDate), "MMM d, yyyy")}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <ClipboardCheck className="size-3.5" aria-hidden="true" />
                  Status
                </span>
                <StatusBadge status={a.status} size="sm" />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <FileText className="size-3.5" aria-hidden="true" />
                  Priority
                </span>
                <PriorityBadge priority={a.priority} size="sm" />
              </div>
            </CardContent>
          </Card>

          <Button
            variant="outline"
            size="sm"
            className="w-full"
            asChild
          >
            <Link to={ROUTES.ASSIGNMENTS.LIST}>
              <ClipboardCheck className="size-4" aria-hidden="true" />
              All Assignments
            </Link>
          </Button>
        </div>
      </div>

      <Sheet open={editOpen} onOpenChange={setEditOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Edit Assignment</SheetTitle>
            <SheetDescription>
              Update the scope, priority, and due date for this assignment.
            </SheetDescription>
          </SheetHeader>
          <EditForm
            assignment={a}
            submitting={update.isPending}
            onSubmit={(values) => {
              update.mutate(values, {
                onSuccess: () => {
                  toast.success("Assignment updated");
                  setEditOpen(false);
                },
                onError: (err) =>
                  toast.error(err.message || "Failed to update"),
              });
            }}
            onCancel={() => setEditOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </motion.div>
  );
}

function EditForm({
  assignment,
  submitting,
  onSubmit,
  onCancel,
}: {
  assignment: Assignment;
  submitting: boolean;
  onSubmit: (values: UpdateAssignmentInput) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(assignment.title);
  const [description, setDescription] = useState(assignment.description);
  const [priority, setPriority] = useState<PriorityLevel>(assignment.priority);
  const [dueDate, setDueDate] = useState(
    assignment.dueDate.slice(0, 10),
  );
  const [notes, setNotes] = useState(assignment.notes ?? "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      title,
      description,
      priority,
      dueDate: new Date(dueDate).toISOString(),
      notes: notes || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="edit-title">Title</Label>
        <Input
          id="edit-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="edit-description">Description</Label>
        <Textarea
          id="edit-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="min-h-[5rem]"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="edit-priority">Priority</Label>
          <select
            id="edit-priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as PriorityLevel)}
            className={selectClass}
          >
            {PRIORITY_LEVELS.map((p) => (
              <option key={p} value={p}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-dueDate">Due Date</Label>
          <Input
            id="edit-dueDate"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            required
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="edit-notes">Notes</Label>
        <Textarea
          id="edit-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="min-h-[4rem]"
        />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Save className="size-4" aria-hidden="true" />
          )}
          Save Changes
        </Button>
      </div>
    </form>
  );
}
