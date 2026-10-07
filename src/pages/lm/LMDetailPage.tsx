/**
 * PSEUDO CODE (ngắn gọn) — cập nhật sau Nam review (docs/lm/02-review-changes.md)
 * 1. 4 tab: Case Profile / Work Calendar / Documents / History. GĐ2 gốc có
 *    5 tab (Overview + Progress tách riêng); R2 merge 2 tab đó thành "Case
 *    Profile" (header info + workflow 5-mốc trong cùng 1 tab).
 * 2. Case Profile — mốc chưa xong có input đổi ngày kế hoạch + nút đánh
 *    dấu hoàn thành. Server tự chuyển stage / đóng hồ sơ khi hoàn thành
 *    đúng mốc đang là giai đoạn hiện tại (xem lm_handlers.ts). R2 thêm
 *    `CaseMilestone.linkedFileIds` — mỗi mốc hiển thị + link/unlink tài
 *    liệu đã upload ở tab Documents (native <select>, không có Select
 *    component trong ui/ của repo này).
 * 3. Work Calendar (R3, trước là "Deadlines & Alerts") — gộp LegalDeadline
 *    (severity đỏ/vàng/xám do server tính sẵn, DEMO_TODAY — xem
 *    lib/deadline-alerts.ts) VÀ `LMTask` mới (việc tự do, không có
 *    severity, chỉ toggle open/done) trong 1 list sort theo dueDate. Nút
 *    "Acknowledge"/"Resolve" (deadline) gọi PUT /api/lm/deadlines/:id;
 *    "Mark Done"/"Reopen" (task) gọi PUT /api/lm/tasks/:id. Calendar-view
 *    toggle (R3b) cố ý cắt — chỉ có table view.
 * 4. Documents — R4 thêm `showFolders` (opt-in, không ảnh hưởng CAP/NCC
 *    dùng chung FileUploadComponent) để nhóm file theo folder. Link "đi
 *    tới Case Profile" thay vì làm lại UI link-file lần 2 (xem Ruling
 *    trong .superpowers/sdd/lm-nam-review/progress.md).
 * 5. History dùng list riêng (không tái dùng ActivityFeed) vì
 *    ActivityFeed/TimelineEvent gắn cứng bộ type khác (submission/approval/
 *    ...), không khớp CaseEvent.type — tái dùng sẽ phải sửa component dùng
 *    chung, rủi ro hơn tự viết list riêng cho LM.
 * 6. Phân công (GĐ2): sheet riêng, đọc useLMWorkload() (server đã sort tăng
 *    dần theo tải), gợi ý người ít việc nhất, chọn xong PUT case.ownerId
 *    qua useUpdateLMCase co sẵn (không cần mutation riêng).
 * 7. Đôn đốc (GĐ2): 1 nút gọi useRemindLMCase — server tự tạo Notification
 *    + CaseEvent, FE chỉ cần invalidate + toast.
 * 8. UI text tiếng Anh cho khớp phần còn lại của app (user yêu cầu) — chỉ
 *    đổi copy hiển thị, pseudo-code comment vẫn giữ tiếng Việt.
 */
import { useState } from "react";
import { useParams } from "react-router-dom";
import { format, parseISO, differenceInCalendarDays } from "date-fns";
import { motion } from "motion/react";
import { Pencil, Send, Users, Check, Paperclip, X, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  PageHero,
  StatusBadge,
  PriorityBadge,
  DueDateCell,
  EmptyState,
  ErrorState,
  DetailSkeleton,
} from "@/components/common";
import { FileUploadComponent } from "@/components/cap/FileUploadComponent";
import { LMForm, type LMFormValues } from "@/components/lm/LMForm";
import {
  useLMCaseDetail,
  useLMCaseMilestones,
  useLMCaseDeadlines,
  useLMCaseEvents,
  useLMCaseTasks,
  useLMWorkload,
} from "@/hooks/queries";
import { useLmCaseFiles } from "@/hooks/queries/useFileQueries";
import {
  useUpdateLMCase,
  useUpdateLMMilestone,
  useUpdateLMDeadline,
  useCreateLMTask,
  useUpdateLMTask,
  useRemindLMCase,
} from "@/hooks/mutations";
import { PRIORITY_LEVELS, type PriorityLevel } from "@/constants/status";
import { useAuthStore } from "@/stores";
import { hasPermission } from "@/constants/rbac";
import {
  STAGE_STYLES,
  CASE_CATEGORY_LABELS,
  DEADLINE_TYPE_LABELS,
} from "@/constants/lm";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type {
  UpdateLMCaseInput,
  CaseMilestone,
  LegalDeadline,
  FileAttachment,
  LMTask,
} from "@/types";

const selectClass =
  "h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 dark:bg-input/30";

function formatVnd(amount: number): string {
  return new Intl.NumberFormat("vi-VN").format(amount) + " ₫";
}

function fmt(date?: string): string {
  return date ? format(parseISO(date), "MMM d, yyyy") : "—";
}

/**
 * Chặn ngày vô lý trước khi gửi lên server — input type="date" của trình
 * duyệt vẫn có thể ra giá trị hỏng (gõ nhanh/dán đè làm lệch từng đoạn
 * ngày/tháng/năm), server không tự validate lại. Giới hạn 2000-2100 đủ
 * rộng cho hồ sơ thật, chặn được giá trị rác kiểu "252026".
 */
function toValidDateIso(input: string): string | null {
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return null;
  const year = d.getFullYear();
  if (year < 2000 || year > 2100) return null;
  return d.toISOString();
}

const DEADLINE_STATUS_LABEL: Record<string, string> = {
  pending: "Not due yet",
  flagged: "Flagged",
  acknowledged: "Acknowledged",
  resolved: "Resolved",
};

export default function LMDetailPage() {
  const { id = "" } = useParams<{ id: string }>();
  const { role, user } = useAuthStore();
  const canUpdate = hasPermission(role, "lm:update");
  const canApprove = hasPermission(role, "lm:approve");

  const [editOpen, setEditOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");

  const detail = useLMCaseDetail(id);
  const milestones = useLMCaseMilestones(id);
  const deadlines = useLMCaseDeadlines(id);
  const events = useLMCaseEvents(id);
  const tasks = useLMCaseTasks(id);
  const filesQuery = useLmCaseFiles(id);
  const update = useUpdateLMCase(id);
  const updateMilestone = useUpdateLMMilestone(id);
  const updateDeadline = useUpdateLMDeadline(id);
  const createTask = useCreateLMTask(id);
  const updateTask = useUpdateLMTask(id);
  const remind = useRemindLMCase(id);

  const item = detail.data;

  if (detail.isPending) return <DetailSkeleton />;
  if (detail.isError || !item) {
    return <ErrorState onRetry={() => detail.refetch()} />;
  }

  const handleEditSubmit = (values: LMFormValues) => {
    const payload: UpdateLMCaseInput = {
      title: values.title,
      category: values.category as UpdateLMCaseInput["category"],
      customerCif: values.customerCif,
      customerName: values.customerName,
      outstandingDebt: Number(values.outstandingDebt),
      collateralDescription: values.collateralDescription || undefined,
      courtOrEnforcementAgency: values.courtOrEnforcementAgency,
      judgeName: values.judgeName || undefined,
      priority: values.priority as UpdateLMCaseInput["priority"],
      ownerUnitId: values.ownerUnitId,
      ownerId: values.ownerId,
      managerId: values.managerId,
      tags:
        values.tags
          ?.split(",")
          .map((t) => t.trim())
          .filter(Boolean) ?? [],
    };
    update.mutate(payload, {
      onSuccess: () => {
        toast.success("Case updated");
        setEditOpen(false);
      },
      onError: (err) => toast.error(err.message || "Update failed"),
    });
  };

  const handleRemind = () => {
    remind.mutate(
      { fromUserId: user?.id, fromUserName: user?.name },
      {
        onSuccess: () => toast.success("Reminder sent"),
        onError: (err) => toast.error(err.message || "Failed to send reminder"),
      },
    );
  };

  const handleDeadlineAction = (
    deadlineId: string,
    action: "acknowledge" | "resolve",
  ) => {
    updateDeadline.mutate(
      {
        id: deadlineId,
        data: { action, actorId: user?.id, actorName: user?.name },
      },
      {
        onSuccess: () =>
          toast.success(
            action === "acknowledge" ? "Alert acknowledged" : "Alert resolved",
          ),
        onError: (err) => toast.error(err.message || "Action failed"),
      },
    );
  };

  const handleCreateTask = (values: {
    title: string;
    description: string;
    dueDate: string;
    priority: PriorityLevel;
  }) => {
    const dueIso = toValidDateIso(values.dueDate);
    if (!dueIso) {
      toast.error("Invalid due date");
      return;
    }
    createTask.mutate(
      {
        caseId: item.id,
        title: values.title,
        description: values.description || undefined,
        dueDate: dueIso,
        priority: values.priority,
        actorId: user?.id,
        actorName: user?.name,
      },
      {
        onSuccess: () => {
          toast.success("Task created");
          setTaskOpen(false);
        },
        onError: (err) => toast.error(err.message || "Failed to create task"),
      },
    );
  };

  const handleToggleTask = (task: LMTask) => {
    updateTask.mutate(
      {
        id: task.id,
        data: {
          status: task.status === "open" ? "done" : "open",
          actorId: user?.id,
          actorName: user?.name,
        },
      },
      {
        onError: (err) => toast.error(err.message || "Failed to update task"),
      },
    );
  };

  const handleAssign = (ownerId: string, ownerName: string) => {
    update.mutate(
      { ownerId },
      {
        onSuccess: () => {
          toast.success(`Assigned to ${ownerName}`);
          setAssignOpen(false);
        },
        onError: (err) => toast.error(err.message || "Assignment failed"),
      },
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <PageHero title={item.code} subtitle={item.title}>
        <div className="flex flex-wrap items-center gap-2">
          {canApprove && (
            <Button
              variant="outline"
              onClick={handleRemind}
              disabled={remind.isPending}
            >
              <Send className="size-4" aria-hidden="true" />
              Remind
            </Button>
          )}
          {canApprove && (
            <Button variant="outline" onClick={() => setAssignOpen(true)}>
              <Users className="size-4" aria-hidden="true" />
              Assign
            </Button>
          )}
          {canUpdate && (
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              <Pencil className="size-4" aria-hidden="true" />
              Edit Case
            </Button>
          )}
        </div>
      </PageHero>

      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={item.status} />
        <PriorityBadge priority={item.priority} />
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
          {STAGE_STYLES[item.stage].label}
        </span>
      </div>

      <Tabs defaultValue="profile" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="profile">Case Profile</TabsTrigger>
          <TabsTrigger value="deadlines">Work Calendar</TabsTrigger>
          <TabsTrigger value="files">Documents</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Case Information</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Field label="Case Category" value={CASE_CATEGORY_LABELS[item.category]} />
              <Field label="Customer" value={`${item.customerName} (${item.customerCif})`} />
              <Field label="Outstanding Debt" value={formatVnd(item.outstandingDebt)} />
              <Field
                label="Collateral"
                value={item.collateralDescription ?? "—"}
              />
              <Field
                label="Court / Enforcement Agency"
                value={item.courtOrEnforcementAgency}
              />
              <Field label="Judge" value={item.judgeName ?? "—"} />
              <Field label="Owner Unit" value={item.ownerUnitName} />
              <Field label="Case Owner" value={item.ownerName} />
              <Field label="Manager" value={item.managerName || "—"} />
              <Field label="Last Updated" value={fmt(item.updatedAt)} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>5-Milestone Progress</CardTitle>
            </CardHeader>
            <CardContent>
              {milestones.isPending ? (
                <DetailSkeleton />
              ) : (milestones.data ?? []).length === 0 ? (
                <EmptyState title="No milestones yet" />
              ) : (
                <ol className="space-y-3">
                  {(milestones.data ?? []).map((m) => (
                    <MilestoneRow
                      key={m.id}
                      milestone={m}
                      canEdit={canUpdate}
                      isSaving={
                        updateMilestone.isPending &&
                        updateMilestone.variables?.id === m.id
                      }
                      caseFiles={filesQuery.data?.items ?? []}
                      onReschedule={(dateIso) =>
                        updateMilestone.mutate(
                          { id: m.id, data: { currentPlannedDate: dateIso } },
                          {
                            onSuccess: () => toast.success("Planned date rescheduled"),
                            onError: (err) =>
                              toast.error(err.message || "Reschedule failed"),
                          },
                        )
                      }
                      onComplete={(dateIso) =>
                        updateMilestone.mutate(
                          { id: m.id, data: { actualDate: dateIso } },
                          {
                            onSuccess: () =>
                              toast.success(
                                `Milestone "${STAGE_STYLES[m.stage].label}" completed`,
                              ),
                            onError: (err) =>
                              toast.error(err.message || "Update failed"),
                          },
                        )
                      }
                      onLinkFiles={(fileIds) =>
                        updateMilestone.mutate(
                          { id: m.id, data: { linkedFileIds: fileIds } },
                          {
                            onError: (err) =>
                              toast.error(err.message || "Failed to update linked files"),
                          },
                        )
                      }
                    />
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deadlines">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Work Calendar</CardTitle>
              {canUpdate && (
                <Button size="sm" variant="outline" onClick={() => setTaskOpen(true)}>
                  <PlusCircle className="size-4" aria-hidden="true" />
                  New Task
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {deadlines.isPending || tasks.isPending ? (
                <DetailSkeleton />
              ) : (deadlines.data ?? []).length === 0 && (tasks.data ?? []).length === 0 ? (
                <EmptyState title="Nothing on the calendar" />
              ) : (
                <ul className="space-y-3">
                  {[
                    ...(deadlines.data ?? []).map((d) => ({
                      kind: "deadline" as const,
                      dueDate: d.dueDate,
                      deadline: d,
                    })),
                    ...(tasks.data ?? []).map((t) => ({
                      kind: "task" as const,
                      dueDate: t.dueDate,
                      task: t,
                    })),
                  ]
                    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
                    .map((w) =>
                      w.kind === "deadline" ? (
                        <DeadlineRow
                          key={w.deadline.id}
                          deadline={w.deadline}
                          canEdit={canUpdate}
                          isSaving={updateDeadline.isPending}
                          onAction={handleDeadlineAction}
                        />
                      ) : (
                        <TaskRow
                          key={w.task.id}
                          task={w.task}
                          canEdit={canUpdate}
                          isSaving={
                            updateTask.isPending && updateTask.variables?.id === w.task.id
                          }
                          onToggleDone={() => handleToggleTask(w.task)}
                        />
                      ),
                    )}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="files">
          <Card>
            <CardHeader>
              <CardTitle>Attached Documents</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Nam review R4 (docs/lm/02-review-changes.md mục 5) — "link
                  to add documents into the Case Profile sub-tab": jumps to
                  the tab where per-milestone linking already lives (built
                  in R2), instead of duplicating that picker here. */}
              <button
                type="button"
                onClick={() => setActiveTab("profile")}
                className="text-sm text-primary hover:underline"
              >
                Attach a document to a specific workflow step → Case Profile
              </button>
              <FileUploadComponent
                files={filesQuery.data?.items ?? []}
                caseId={item.id}
                disabled={!canUpdate}
                showFolders
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Activity History</CardTitle>
            </CardHeader>
            <CardContent>
              {events.isPending ? (
                <DetailSkeleton />
              ) : (events.data ?? []).length === 0 ? (
                <EmptyState title="No history yet" />
              ) : (
                <ul className="space-y-3">
                  {(events.data ?? []).map((e) => (
                    <li key={e.id} className="border-l-2 border-border pl-3">
                      <p className="text-sm">{e.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {e.userName} · {fmt(e.createdAt)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Sheet open={editOpen} onOpenChange={setEditOpen}>
        <SheetContent className="overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Edit Case {item.code}</SheetTitle>
          </SheetHeader>
          <div className="px-4 pb-4">
            <LMForm
              defaultValues={{
                title: item.title,
                category: item.category,
                customerCif: item.customerCif,
                customerName: item.customerName,
                outstandingDebt: item.outstandingDebt,
                collateralDescription: item.collateralDescription,
                courtOrEnforcementAgency: item.courtOrEnforcementAgency,
                judgeName: item.judgeName,
                priority: item.priority,
                ownerUnitId: item.ownerUnitId,
                ownerId: item.ownerId,
                managerId: item.managerId,
                tags: item.tags.join(", "),
              }}
              onSubmit={handleEditSubmit}
              onCancel={() => setEditOpen(false)}
              isSubmitting={update.isPending}
              submitLabel="Save Changes"
            />
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={assignOpen} onOpenChange={setAssignOpen}>
        <SheetContent className="overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Reassign {item.code}</SheetTitle>
          </SheetHeader>
          <div className="px-4 pb-4">
            <AssignList
              currentOwnerId={item.ownerId}
              isSaving={update.isPending}
              onPick={handleAssign}
            />
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={taskOpen} onOpenChange={setTaskOpen}>
        <SheetContent className="overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>New Task — {item.code}</SheetTitle>
          </SheetHeader>
          <div className="px-4 pb-4">
            <TaskForm onSubmit={handleCreateTask} isSubmitting={createTask.isPending} />
          </div>
        </SheetContent>
      </Sheet>
    </motion.div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-sm">{value}</p>
    </div>
  );
}

/**
 * 1 dòng mốc tiến trình. Mốc đã xong (actualDate có giá trị) chỉ hiển thị,
 * không cho sửa nữa. Mốc chưa xong: ô ngày để dời kế hoạch + nút đánh dấu
 * hoàn thành (mặc định hôm nay, sửa được trước khi bấm).
 */
function MilestoneRow({
  milestone: m,
  canEdit,
  isSaving,
  caseFiles,
  onReschedule,
  onComplete,
  onLinkFiles,
}: {
  milestone: CaseMilestone;
  canEdit: boolean;
  isSaving: boolean;
  /** All files already uploaded to this case (Documents tab), to resolve
   * `linkedFileIds` into names/URLs and to offer as link candidates. */
  caseFiles: FileAttachment[];
  onReschedule: (dateIso: string) => void;
  onComplete: (dateIso: string) => void;
  /** Nam review R2 — sends the FULL new `linkedFileIds` list (add or remove one). */
  onLinkFiles: (fileIds: string[]) => void;
}) {
  const [plannedInput, setPlannedInput] = useState(
    m.currentPlannedDate.slice(0, 10),
  );
  const [completeInput, setCompleteInput] = useState(
    new Date().toISOString().slice(0, 10),
  );

  const deltaDays = differenceInCalendarDays(
    parseISO(m.currentPlannedDate),
    parseISO(m.originalPlannedDate),
  );

  const linkedIds = new Set(m.linkedFileIds ?? []);
  const linkedFiles = caseFiles.filter((f) => linkedIds.has(f.id));
  const unlinkedFiles = caseFiles.filter((f) => !linkedIds.has(f.id));

  return (
    <li className="flex flex-col gap-2 rounded-lg border border-border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-medium">{STAGE_STYLES[m.stage].label}</span>
        <span className="text-sm text-muted-foreground">
          Original plan: {fmt(m.originalPlannedDate)}
          {deltaDays !== 0 && (
            <>
              {" → Current: "}
              {fmt(m.currentPlannedDate)}{" "}
              <span
                className={cn(
                  "font-medium",
                  deltaDays > 0 ? "text-warning" : "text-success",
                )}
              >
                ({deltaDays > 0 ? "+" : ""}
                {deltaDays} days)
              </span>
            </>
          )}
        </span>
        <span className="text-sm">
          {m.actualDate ? (
            <span className="text-success">
              Completed: {fmt(m.actualDate)}
            </span>
          ) : (
            "Not completed"
          )}
        </span>
      </div>

      {canEdit && !m.actualDate && (
        <div className="flex flex-wrap items-center gap-2 border-t border-border pt-2">
          <Input
            type="date"
            value={plannedInput}
            onChange={(e) => setPlannedInput(e.target.value)}
            className="h-8 w-auto"
          />
          <Button
            size="sm"
            variant="outline"
            disabled={isSaving || !plannedInput}
            onClick={() => {
              const iso = toValidDateIso(plannedInput);
              if (!iso) {
                toast.error("Invalid planned date");
                return;
              }
              onReschedule(iso);
            }}
          >
            Reschedule
          </Button>
          <span className="text-muted-foreground">·</span>
          <Input
            type="date"
            value={completeInput}
            onChange={(e) => setCompleteInput(e.target.value)}
            className="h-8 w-auto"
          />
          <Button
            size="sm"
            disabled={isSaving || !completeInput}
            onClick={() => {
              const iso = toValidDateIso(completeInput);
              if (!iso) {
                toast.error("Invalid completion date");
                return;
              }
              onComplete(iso);
            }}
          >
            <Check className="size-4" aria-hidden="true" />
            Mark Complete
          </Button>
        </div>
      )}

      {/* Nam review R2 (docs/lm/02-review-changes.md mục 2) — each workflow
          step shows the documents linked to it, with a way to link/unlink
          from the files already uploaded in the Documents tab. */}
      <div className="flex flex-wrap items-center gap-2 border-t border-border pt-2">
        <Paperclip
          className="size-3.5 shrink-0 text-muted-foreground"
          aria-hidden="true"
        />
        {linkedFiles.length === 0 ? (
          <span className="text-xs text-muted-foreground">No linked documents</span>
        ) : (
          linkedFiles.map((f) => (
            <span
              key={f.id}
              className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs"
            >
              <a href={f.url} target="_blank" rel="noreferrer" className="hover:underline">
                {f.name}
              </a>
              {canEdit && (
                <button
                  type="button"
                  aria-label={`Unlink ${f.name}`}
                  onClick={() =>
                    onLinkFiles(Array.from(linkedIds).filter((id) => id !== f.id))
                  }
                >
                  <X className="size-3" aria-hidden="true" />
                </button>
              )}
            </span>
          ))
        )}
        {canEdit && unlinkedFiles.length > 0 && (
          <select
            value=""
            className={cn(selectClass, "h-7 w-auto text-xs")}
            onChange={(e) => {
              if (e.target.value) {
                onLinkFiles([...Array.from(linkedIds), e.target.value]);
              }
            }}
          >
            <option value="">+ Link a file...</option>
            {unlinkedFiles.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        )}
      </div>
    </li>
  );
}

const SEVERITY_DOT: Record<string, string> = {
  red: "bg-destructive",
  amber: "bg-warning",
  none: "bg-muted-foreground/30",
};

/**
 * 1 dòng hạn pháp lý. `severity` do server tính sẵn (GĐ3) — đỏ/vàng/xám.
 * Nút hành động chỉ hiện khi còn việc để làm: "Acknowledge" lúc đang
 * flagged, "Resolve" lúc flagged hoặc đã tiếp nhận.
 */
function DeadlineRow({
  deadline: d,
  canEdit,
  isSaving,
  onAction,
}: {
  deadline: LegalDeadline;
  canEdit: boolean;
  isSaving: boolean;
  onAction: (id: string, action: "acknowledge" | "resolve") => void;
}) {
  const canAcknowledge = canEdit && d.status === "flagged";
  const canResolve = canEdit && (d.status === "flagged" || d.status === "acknowledged");

  return (
    <li className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3">
      <span className="flex items-center gap-2 font-medium">
        <span
          className={cn("size-2 shrink-0 rounded-full", SEVERITY_DOT[d.severity ?? "none"])}
          aria-hidden="true"
        />
        {DEADLINE_TYPE_LABELS[d.type]}
      </span>
      <DueDateCell dueDate={d.dueDate} completed={d.status === "resolved"} />
      <span className="text-sm">{DEADLINE_STATUS_LABEL[d.status] ?? d.status}</span>
      {(canAcknowledge || canResolve) && (
        <div className="flex gap-2">
          {canAcknowledge && (
            <Button
              size="sm"
              variant="outline"
              disabled={isSaving}
              onClick={() => onAction(d.id, "acknowledge")}
            >
              Acknowledge
            </Button>
          )}
          {canResolve && (
            <Button
              size="sm"
              disabled={isSaving}
              onClick={() => onAction(d.id, "resolve")}
            >
              Resolve
            </Button>
          )}
        </div>
      )}
    </li>
  );
}

/**
 * 1 dòng task tự do (Nam review R3) trong "Work Calendar", chung danh sách
 * với DeadlineRow, sort theo hạn. Khác LegalDeadline — không có severity
 * đỏ/vàng do server tính, chỉ 1 nút toggle open/done.
 */
function TaskRow({
  task: t,
  canEdit,
  isSaving,
  onToggleDone,
}: {
  task: LMTask;
  canEdit: boolean;
  isSaving: boolean;
  onToggleDone: () => void;
}) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3">
      <span className="flex min-w-0 flex-col">
        <span
          className={cn(
            "flex items-center gap-2 font-medium",
            t.status === "done" && "text-muted-foreground line-through",
          )}
        >
          <span
            className="size-2 shrink-0 rounded-full bg-primary/40"
            aria-hidden="true"
          />
          {t.title}
        </span>
        {t.description && (
          <span className="text-xs text-muted-foreground">{t.description}</span>
        )}
      </span>
      <PriorityBadge priority={t.priority} />
      <DueDateCell dueDate={t.dueDate} completed={t.status === "done"} />
      {canEdit && (
        <Button size="sm" variant="outline" disabled={isSaving} onClick={onToggleDone}>
          <Check className="size-4" aria-hidden="true" />
          {t.status === "done" ? "Reopen" : "Mark Done"}
        </Button>
      )}
    </li>
  );
}

/** Danh sách chuyên viên theo tải công việc — người đầu tiên (tải thấp nhất) là gợi ý. */
function AssignList({
  currentOwnerId,
  isSaving,
  onPick,
}: {
  currentOwnerId: string;
  isSaving: boolean;
  onPick: (ownerId: string, ownerName: string) => void;
}) {
  const workload = useLMWorkload();

  if (workload.isPending) return <DetailSkeleton />;
  if (workload.isError || !workload.data) {
    return <ErrorState onRetry={() => workload.refetch()} />;
  }

  return (
    <ul className="space-y-2">
      {workload.data.map((w, i) => {
        const isCurrent = w.userId === currentOwnerId;
        return (
          <li key={w.userId}>
            <button
              type="button"
              disabled={isSaving || isCurrent}
              onClick={() => onPick(w.userId, w.userName)}
              className={cn(
                "flex w-full items-center justify-between rounded-lg border border-border p-3 text-left text-sm transition-colors",
                isCurrent
                  ? "cursor-default bg-muted"
                  : "hover:border-primary hover:bg-muted/50",
              )}
            >
              <span className="flex items-center gap-2">
                <span className="font-medium">{w.userName}</span>
                {i === 0 && !isCurrent && (
                  <span className="rounded-full bg-success-bg px-2 py-0.5 text-xs text-success">
                    Suggested — lowest load
                  </span>
                )}
                {isCurrent && (
                  <span className="rounded-full bg-muted-foreground/10 px-2 py-0.5 text-xs text-muted-foreground">
                    Current owner
                  </span>
                )}
              </span>
              <span className="text-muted-foreground">
                {w.openCaseCount} open cases · load {w.weightedLoad}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Nam review R3 — form nhẹ tạo task tự do (title/description/dueDate/
 * priority). Không dùng react-hook-form+zod như LMForm vì chỉ 4 field đơn
 * giản, validate tay (title + dueDate bắt buộc) là đủ cho demo.
 */
function TaskForm({
  onSubmit,
  isSubmitting,
}: {
  onSubmit: (values: {
    title: string;
    description: string;
    dueDate: string;
    priority: PriorityLevel;
  }) => void;
  isSubmitting: boolean;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState(new Date().toISOString().slice(0, 10));
  const [priority, setPriority] = useState<PriorityLevel>("medium");

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!title.trim() || !dueDate) {
          toast.error("Title and due date are required");
          return;
        }
        onSubmit({ title: title.trim(), description, dueDate, priority });
      }}
    >
      <div>
        <label htmlFor="task-title" className="text-sm font-medium">
          Title
        </label>
        <Input
          id="task-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Follow up with court clerk"
          className="mt-1"
        />
      </div>
      <div>
        <label htmlFor="task-description" className="text-sm font-medium">
          Description
        </label>
        <textarea
          id="task-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="mt-1 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="task-due" className="text-sm font-medium">
            Due Date
          </label>
          <Input
            id="task-due"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <label htmlFor="task-priority" className="text-sm font-medium">
            Priority
          </label>
          <select
            id="task-priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as PriorityLevel)}
            className={cn(selectClass, "mt-1")}
          >
            {PRIORITY_LEVELS.map((p) => (
              <option key={p} value={p}>
                {p[0].toUpperCase() + p.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Creating…" : "Create Task"}
      </Button>
    </form>
  );
}
