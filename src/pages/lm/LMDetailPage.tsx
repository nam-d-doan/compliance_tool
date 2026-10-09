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
 *    "Mark Done"/"Reopen"/Sửa (task) gọi PUT /api/lm/tasks/:id, Xoá gọi
 *    DELETE. Task có `remindDaysBefore` (tự đặt cảnh báo). UI bảng/lịch
 *    tách ra components/lm/LMWorkCalendar.tsx.
 * 4. Documents — component riêng components/lm/LMDocuments.tsx (storage
 *    path, folder, chuyển folder, gắn file vào mốc ngay tại tab).
 * 5. History — components/lm/LMHistory.tsx (timeline song ngữ, lọc theo
 *    loại/người, khối trước→sau). Không tái dùng ActivityFeed vì
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
import { Link, useParams } from "react-router-dom";
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
  EmptyState,
  ErrorState,
  DetailSkeleton,
} from "@/components/common";
import { LMDocuments } from "@/components/lm/LMDocuments";
import { LMHistory } from "@/components/lm/LMHistory";
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
  useDeleteLMTask,
  useRemindLMCase,
} from "@/hooks/mutations";
import { PRIORITY_LEVELS, type PriorityLevel } from "@/constants/status";
import { useAuthStore } from "@/stores";
import { hasPermission } from "@/constants/rbac";
import { ROUTES } from "@/constants/routes";
import { getStageLabel, getCaseCategoryLabel } from "@/constants/lm";
import { useLMT, getPriorityOptionLabel } from "@/constants/lm-i18n";
import { LMWorkCalendar } from "@/components/lm/LMWorkCalendar";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type {
  UpdateLMCaseInput,
  CaseMilestone,
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

export default function LMDetailPage() {
  const { id = "" } = useParams<{ id: string }>();
  const { role, user } = useAuthStore();
  const { t, lang } = useLMT();
  const canUpdate = hasPermission(role, "lm:update");
  const canApprove = hasPermission(role, "lm:approve");

  const [editOpen, setEditOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<LMTask | null>(null);
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
  const deleteTask = useDeleteLMTask(id);
  const remind = useRemindLMCase(id);

  const item = detail.data;

  if (detail.isPending) return <DetailSkeleton />;
  if (detail.isError || !item) {
    const isForbidden = (detail.error as { status?: number } | null)?.status === 403;
    return (
      <div className="space-y-4">
        <ErrorState
          title={isForbidden ? t("forbiddenTitle") : undefined}
          message={isForbidden ? t("forbiddenMessage") : undefined}
          onRetry={isForbidden ? undefined : () => detail.refetch()}
        />
        {isForbidden && (
          <div className="flex justify-center">
            <Button variant="outline" asChild>
              <Link to={ROUTES.LM.LIST}>{t("backToMyCases")}</Link>
            </Button>
          </div>
        )}
      </div>
    );
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
        toast.success(t("caseUpdated"));
        setEditOpen(false);
      },
      onError: (err) => toast.error(err.message || t("updateFailed")),
    });
  };

  const handleRemind = () => {
    remind.mutate(
      { fromUserId: user?.id, fromUserName: user?.name },
      {
        onSuccess: () => toast.success(t("reminderSent")),
        onError: (err) => toast.error(err.message || t("reminderFailed")),
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
            action === "acknowledge" ? t("alertAcknowledged") : t("alertResolved"),
          ),
        onError: (err) => toast.error(err.message || t("actionFailed")),
      },
    );
  };

  const handleCreateTask = (values: TaskFormValues) => {
    const dueIso = toValidDateIso(values.dueDate);
    if (!dueIso) {
      toast.error(t("invalidDueDate"));
      return;
    }
    createTask.mutate(
      {
        caseId: item.id,
        title: values.title,
        description: values.description || undefined,
        dueDate: dueIso,
        priority: values.priority,
        remindDaysBefore: values.remindDaysBefore,
        actorId: user?.id,
        actorName: user?.name,
      },
      {
        onSuccess: () => {
          toast.success(t("taskCreated"));
          setTaskOpen(false);
        },
        onError: (err) => toast.error(err.message || t("taskCreateFailed")),
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
        onError: (err) => toast.error(err.message || t("taskUpdateFailed")),
      },
    );
  };

  const handleEditTask = (values: TaskFormValues) => {
    if (!editingTask) return;
    const dueIso = toValidDateIso(values.dueDate);
    if (!dueIso) {
      toast.error(t("invalidDueDate"));
      return;
    }
    updateTask.mutate(
      {
        id: editingTask.id,
        data: {
          title: values.title,
          description: values.description || undefined,
          dueDate: dueIso,
          priority: values.priority,
          remindDaysBefore: values.remindDaysBefore,
          actorId: user?.id,
          actorName: user?.name,
        },
      },
      {
        onSuccess: () => {
          toast.success(t("taskUpdated"));
          setEditingTask(null);
        },
        onError: (err) => toast.error(err.message || t("taskUpdateFailed")),
      },
    );
  };

  const handleDeleteTask = (task: LMTask) => {
    deleteTask.mutate(
      { id: task.id, actorId: user?.id, actorName: user?.name },
      {
        onSuccess: () => toast.success(t("taskDeleted")),
        onError: (err) => toast.error(err.message || t("taskDeleteFailed")),
      },
    );
  };

  const handleAssign = (ownerId: string, ownerName: string) => {
    update.mutate(
      { ownerId },
      {
        onSuccess: () => {
          toast.success(
            lang === "vi" ? `Đã phân công cho ${ownerName}` : `Assigned to ${ownerName}`,
          );
          setAssignOpen(false);
        },
        onError: (err) => toast.error(err.message || t("assignmentFailed")),
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
              {t("remind")}
            </Button>
          )}
          {canApprove && (
            <Button variant="outline" onClick={() => setAssignOpen(true)}>
              <Users className="size-4" aria-hidden="true" />
              {t("assign")}
            </Button>
          )}
          {canUpdate && (
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              <Pencil className="size-4" aria-hidden="true" />
              {t("editCase")}
            </Button>
          )}
        </div>
      </PageHero>

      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={item.status} />
        <PriorityBadge priority={item.priority} />
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
          {getStageLabel(item.stage, lang)}
        </span>
      </div>

      <Tabs defaultValue="profile" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="profile">{t("tabProfile")}</TabsTrigger>
          <TabsTrigger value="deadlines">{t("tabCalendar")}</TabsTrigger>
          <TabsTrigger value="files">{t("tabDocuments")}</TabsTrigger>
          <TabsTrigger value="history">{t("tabHistory")}</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("caseInformation")}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Field
                label={t("fieldCategory")}
                value={getCaseCategoryLabel(item.category, lang)}
              />
              <Field label={t("fieldCustomer")} value={`${item.customerName} (${item.customerCif})`} />
              <Field label={t("fieldDebt")} value={formatVnd(item.outstandingDebt)} />
              <Field
                label={t("fieldCollateral")}
                value={item.collateralDescription ?? "—"}
              />
              <Field
                label={t("fieldCourt")}
                value={item.courtOrEnforcementAgency}
              />
              <Field label={t("fieldJudge")} value={item.judgeName ?? "—"} />
              <Field label={t("fieldOwnerUnit")} value={item.ownerUnitName} />
              <Field label={t("fieldCaseOwner")} value={item.ownerName} />
              <Field label={t("fieldManager")} value={item.managerName || "—"} />
              <Field label={t("fieldLastUpdated")} value={fmt(item.updatedAt)} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("milestoneProgress")}</CardTitle>
            </CardHeader>
            <CardContent>
              {milestones.isPending ? (
                <DetailSkeleton />
              ) : (milestones.data ?? []).length === 0 ? (
                <EmptyState title={t("noMilestones")} />
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
                            onSuccess: () => toast.success(t("plannedRescheduled")),
                            onError: (err) =>
                              toast.error(err.message || t("rescheduleFailed")),
                          },
                        )
                      }
                      onComplete={(dateIso) =>
                        updateMilestone.mutate(
                          { id: m.id, data: { actualDate: dateIso } },
                          {
                            onSuccess: () => {
                              const label = getStageLabel(m.stage, lang);
                              toast.success(
                                lang === "vi"
                                  ? `Mốc "${label}" đã hoàn thành`
                                  : `Milestone "${label}" completed`,
                              );
                            },
                            onError: (err) =>
                              toast.error(err.message || t("updateFailed")),
                          },
                        )
                      }
                      onLinkFiles={(fileIds) =>
                        updateMilestone.mutate(
                          { id: m.id, data: { linkedFileIds: fileIds } },
                          {
                            onError: (err) =>
                              toast.error(err.message || t("linkFilesFailed")),
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
              <CardTitle>{t("tabCalendar")}</CardTitle>
              {canUpdate && (
                <Button size="sm" variant="outline" onClick={() => setTaskOpen(true)}>
                  <PlusCircle className="size-4" aria-hidden="true" />
                  {t("newTask")}
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {deadlines.isPending || tasks.isPending ? (
                <DetailSkeleton />
              ) : (deadlines.data ?? []).length === 0 && (tasks.data ?? []).length === 0 ? (
                <EmptyState title={t("nothingOnCalendar")} />
              ) : (
                <LMWorkCalendar
                  deadlines={deadlines.data ?? []}
                  tasks={tasks.data ?? []}
                  canEdit={canUpdate}
                  deadlineSaving={updateDeadline.isPending}
                  savingTaskId={updateTask.isPending ? updateTask.variables?.id : undefined}
                  deletingTaskId={deleteTask.isPending ? deleteTask.variables?.id : undefined}
                  onDeadlineAction={handleDeadlineAction}
                  onToggleTask={handleToggleTask}
                  onEditTask={setEditingTask}
                  onDeleteTask={handleDeleteTask}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="files">
          <Card>
            <CardHeader>
              <CardTitle>{t("attachedDocuments")}</CardTitle>
            </CardHeader>
            <CardContent>
              <LMDocuments
                lmCase={item}
                files={filesQuery.data?.items ?? []}
                milestones={milestones.data ?? []}
                canEdit={canUpdate}
                onGoToProfile={() => setActiveTab("profile")}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>{t("activityHistory")}</CardTitle>
            </CardHeader>
            <CardContent>
              {events.isPending ? (
                <DetailSkeleton />
              ) : (events.data ?? []).length === 0 ? (
                <EmptyState title={t("noHistory")} />
              ) : (
                <LMHistory events={events.data ?? []} />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Sheet open={editOpen} onOpenChange={setEditOpen}>
        <SheetContent className="overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>
              {lang === "vi" ? `Sửa hồ sơ ${item.code}` : `Edit Case ${item.code}`}
            </SheetTitle>
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
              submitLabel={t("saveChanges")}
            />
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={assignOpen} onOpenChange={setAssignOpen}>
        <SheetContent className="overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>
              {lang === "vi" ? `Phân công lại ${item.code}` : `Reassign ${item.code}`}
            </SheetTitle>
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
            <SheetTitle>
              {lang === "vi" ? `Tạo việc mới — ${item.code}` : `New Task — ${item.code}`}
            </SheetTitle>
          </SheetHeader>
          <div className="px-4 pb-4">
            <TaskForm onSubmit={handleCreateTask} isSubmitting={createTask.isPending} />
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={editingTask !== null} onOpenChange={(open) => !open && setEditingTask(null)}>
        <SheetContent className="overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>
              {t("editTask")} — {editingTask?.title}
            </SheetTitle>
          </SheetHeader>
          <div className="px-4 pb-4">
            {editingTask && (
              <TaskForm
                key={editingTask.id}
                initial={editingTask}
                onSubmit={handleEditTask}
                isSubmitting={updateTask.isPending}
              />
            )}
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
  const { t, lang } = useLMT();
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
        <span className="font-medium">{getStageLabel(m.stage, lang)}</span>
        <span className="text-sm text-muted-foreground">
          {t("originalPlan")} {fmt(m.originalPlannedDate)}
          {deltaDays !== 0 && (
            <>
              {` → ${t("currentLabel")} `}
              {fmt(m.currentPlannedDate)}{" "}
              <span
                className={cn(
                  "font-medium",
                  deltaDays > 0 ? "text-warning" : "text-success",
                )}
              >
                ({deltaDays > 0 ? "+" : ""}
                {deltaDays} {t("daysLabel")})
              </span>
            </>
          )}
        </span>
        <span className="text-sm">
          {m.actualDate ? (
            <span className="text-success">
              {t("completedLabel")} {fmt(m.actualDate)}
            </span>
          ) : (
            t("notCompleted")
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
                toast.error(t("invalidPlannedDate"));
                return;
              }
              onReschedule(iso);
            }}
          >
            {t("reschedule")}
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
                toast.error(t("invalidCompletionDate"));
                return;
              }
              onComplete(iso);
            }}
          >
            <Check className="size-4" aria-hidden="true" />
            {t("markComplete")}
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
          <span className="text-xs text-muted-foreground">{t("noLinkedDocs")}</span>
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
            <option value="">{t("linkAFile")}</option>
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
  const { t, lang } = useLMT();
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
                    {t("suggestedLowestLoad")}
                  </span>
                )}
                {isCurrent && (
                  <span className="rounded-full bg-muted-foreground/10 px-2 py-0.5 text-xs text-muted-foreground">
                    {t("currentOwner")}
                  </span>
                )}
              </span>
              <span className="text-muted-foreground">
                {lang === "vi"
                  ? `${w.openCaseCount} hồ sơ đang mở · tải ${w.weightedLoad}`
                  : `${w.openCaseCount} open cases · load ${w.weightedLoad}`}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Nam review R3 — form nhẹ tạo/sửa task tự do. Không dùng react-hook-form
 * +zod như LMForm vì chỉ 5 field đơn giản, validate tay là đủ cho demo.
 * Có `initial` = chế độ sửa (điền sẵn giá trị task hiện tại).
 */
interface TaskFormValues {
  title: string;
  description: string;
  dueDate: string;
  priority: PriorityLevel;
  remindDaysBefore: number;
}

function TaskForm({
  initial,
  onSubmit,
  isSubmitting,
}: {
  initial?: LMTask;
  onSubmit: (values: TaskFormValues) => void;
  isSubmitting: boolean;
}) {
  const { t, lang } = useLMT();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [dueDate, setDueDate] = useState(
    initial ? format(parseISO(initial.dueDate), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
  );
  const [priority, setPriority] = useState<PriorityLevel>(initial?.priority ?? "medium");
  const [remindDays, setRemindDays] = useState(String(initial?.remindDaysBefore ?? 3));

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!title.trim() || !dueDate) {
          toast.error(t("titleDueRequired"));
          return;
        }
        const remindDaysBefore = Number(remindDays);
        if (!Number.isInteger(remindDaysBefore) || remindDaysBefore < 0 || remindDaysBefore > 90) {
          toast.error(t("invalidRemindDays"));
          return;
        }
        onSubmit({ title: title.trim(), description, dueDate, priority, remindDaysBefore });
      }}
    >
      <div>
        <label htmlFor="task-title" className="text-sm font-medium">
          {t("taskTitleLabel")}
        </label>
        <Input
          id="task-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t("taskTitlePlaceholder")}
          className="mt-1"
        />
      </div>
      <div>
        <label htmlFor="task-description" className="text-sm font-medium">
          {t("taskDescLabel")}
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
            {t("taskDueLabel")}
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
            {t("taskPriorityLabel")}
          </label>
          <select
            id="task-priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as PriorityLevel)}
            className={cn(selectClass, "mt-1")}
          >
            {PRIORITY_LEVELS.map((p) => (
              <option key={p} value={p}>
                {getPriorityOptionLabel(p, lang)}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label htmlFor="task-remind" className="text-sm font-medium">
          {t("taskRemindLabel")}
        </label>
        <Input
          id="task-remind"
          type="number"
          min={0}
          max={90}
          value={remindDays}
          onChange={(e) => setRemindDays(e.target.value)}
          className="mt-1"
        />
        <p className="mt-1 text-xs text-muted-foreground">{t("taskRemindHint")}</p>
      </div>
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {initial
          ? isSubmitting
            ? t("saving")
            : t("saveChanges")
          : isSubmitting
            ? t("creating")
            : t("createTask")}
      </Button>
    </form>
  );
}
