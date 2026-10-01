/**
 * PSEUDO CODE (ngắn gọn)
 * 1. 5 tab: Tổng quan / Tiến trình / Hạn & cảnh báo / Tài liệu / Lịch sử.
 * 2. Tiến trình (GĐ2): mốc chưa xong có input đổi ngày kế hoạch + nút đánh
 *    dấu hoàn thành. Server tự chuyển stage / đóng hồ sơ khi hoàn thành
 *    đúng mốc đang là giai đoạn hiện tại (xem lm_handlers.ts).
 * 3. Hạn & cảnh báo (GĐ3): severity (đỏ/vàng/xám) do server tính sẵn
 *    (DEMO_TODAY, không dùng ngày thực của máy — xem lib/lm-alerts.ts).
 *    Nút "Đã tiếp nhận"/"Đã xử lý" gọi PUT /api/lm/deadlines/:id.
 * 4. Lịch sử dùng list riêng (không tái dùng ActivityFeed) vì
 *    ActivityFeed/TimelineEvent gắn cứng bộ type khác (submission/approval/
 *    ...), không khớp CaseEvent.type — tái dùng sẽ phải sửa component dùng
 *    chung, rủi ro hơn tự viết list riêng cho LM.
 * 5. Phân công (GĐ2): sheet riêng, đọc useLMWorkload() (server đã sort tăng
 *    dần theo tải), gợi ý người ít việc nhất, chọn xong PUT case.ownerId
 *    qua useUpdateLMCase co sẵn (không cần mutation riêng).
 * 6. Đôn đốc (GĐ2): 1 nút gọi useRemindLMCase — server tự tạo Notification
 *    + CaseEvent, FE chỉ cần invalidate + toast.
 */
import { useState } from "react";
import { useParams } from "react-router-dom";
import { format, parseISO, differenceInCalendarDays } from "date-fns";
import { motion } from "motion/react";
import { Pencil, Send, Users, Check } from "lucide-react";
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
  useLMWorkload,
} from "@/hooks/queries";
import { useLmCaseFiles } from "@/hooks/queries/useFileQueries";
import {
  useUpdateLMCase,
  useUpdateLMMilestone,
  useUpdateLMDeadline,
  useRemindLMCase,
} from "@/hooks/mutations";
import { useAuthStore } from "@/stores";
import { hasPermission } from "@/constants/rbac";
import {
  STAGE_STYLES,
  CASE_CATEGORY_LABELS,
  DEADLINE_TYPE_LABELS,
} from "@/constants/lm";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { UpdateLMCaseInput, CaseMilestone, LegalDeadline } from "@/types";

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
  pending: "Chưa tới hạn",
  flagged: "Đã bật cảnh báo",
  acknowledged: "Đã tiếp nhận",
  resolved: "Đã xử lý",
};

export default function LMDetailPage() {
  const { id = "" } = useParams<{ id: string }>();
  const { role, user } = useAuthStore();
  const canUpdate = hasPermission(role, "lm:update");
  const canApprove = hasPermission(role, "lm:approve");

  const [editOpen, setEditOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);

  const detail = useLMCaseDetail(id);
  const milestones = useLMCaseMilestones(id);
  const deadlines = useLMCaseDeadlines(id);
  const events = useLMCaseEvents(id);
  const filesQuery = useLmCaseFiles(id);
  const update = useUpdateLMCase(id);
  const updateMilestone = useUpdateLMMilestone(id);
  const updateDeadline = useUpdateLMDeadline(id);
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
        toast.success("Đã cập nhật hồ sơ");
        setEditOpen(false);
      },
      onError: (err) => toast.error(err.message || "Cập nhật thất bại"),
    });
  };

  const handleRemind = () => {
    remind.mutate(
      { fromUserId: user?.id, fromUserName: user?.name },
      {
        onSuccess: () => toast.success("Đã gửi thông báo đôn đốc"),
        onError: (err) => toast.error(err.message || "Gửi đôn đốc thất bại"),
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
            action === "acknowledge" ? "Đã tiếp nhận cảnh báo" : "Đã xử lý xong",
          ),
        onError: (err) => toast.error(err.message || "Thao tác thất bại"),
      },
    );
  };

  const handleAssign = (ownerId: string, ownerName: string) => {
    update.mutate(
      { ownerId },
      {
        onSuccess: () => {
          toast.success(`Đã phân công cho ${ownerName}`);
          setAssignOpen(false);
        },
        onError: (err) => toast.error(err.message || "Phân công thất bại"),
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
              Đôn đốc
            </Button>
          )}
          {canApprove && (
            <Button variant="outline" onClick={() => setAssignOpen(true)}>
              <Users className="size-4" aria-hidden="true" />
              Phân công
            </Button>
          )}
          {canUpdate && (
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              <Pencil className="size-4" aria-hidden="true" />
              Sửa hồ sơ
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

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="progress">Tiến trình</TabsTrigger>
          <TabsTrigger value="deadlines">Hạn & cảnh báo</TabsTrigger>
          <TabsTrigger value="files">Tài liệu</TabsTrigger>
          <TabsTrigger value="history">Lịch sử</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin hồ sơ</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Field label="Nhóm vụ việc" value={CASE_CATEGORY_LABELS[item.category]} />
              <Field label="Khách hàng" value={`${item.customerName} (${item.customerCif})`} />
              <Field label="Dư nợ" value={formatVnd(item.outstandingDebt)} />
              <Field
                label="Tài sản bảo đảm"
                value={item.collateralDescription ?? "—"}
              />
              <Field
                label="Tòa án / Cơ quan thi hành án"
                value={item.courtOrEnforcementAgency}
              />
              <Field label="Thẩm phán" value={item.judgeName ?? "—"} />
              <Field label="Đơn vị sở hữu" value={item.ownerUnitName} />
              <Field label="Chuyên viên thụ lý" value={item.ownerName} />
              <Field label="Cấp quản lý" value={item.managerName || "—"} />
              <Field label="Cập nhật lần cuối" value={fmt(item.updatedAt)} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progress">
          <Card>
            <CardHeader>
              <CardTitle>Tiến trình 5 mốc</CardTitle>
            </CardHeader>
            <CardContent>
              {milestones.isPending ? (
                <DetailSkeleton />
              ) : (milestones.data ?? []).length === 0 ? (
                <EmptyState title="Chưa có mốc nào" />
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
                      onReschedule={(dateIso) =>
                        updateMilestone.mutate(
                          { id: m.id, data: { currentPlannedDate: dateIso } },
                          {
                            onSuccess: () => toast.success("Đã dời ngày kế hoạch"),
                            onError: (err) =>
                              toast.error(err.message || "Dời ngày thất bại"),
                          },
                        )
                      }
                      onComplete={(dateIso) =>
                        updateMilestone.mutate(
                          { id: m.id, data: { actualDate: dateIso } },
                          {
                            onSuccess: () =>
                              toast.success(
                                `Đã hoàn thành mốc "${STAGE_STYLES[m.stage].label}"`,
                              ),
                            onError: (err) =>
                              toast.error(err.message || "Cập nhật thất bại"),
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
            <CardHeader>
              <CardTitle>Hạn pháp lý & cảnh báo</CardTitle>
            </CardHeader>
            <CardContent>
              {deadlines.isPending ? (
                <DetailSkeleton />
              ) : (deadlines.data ?? []).length === 0 ? (
                <EmptyState title="Không có hạn pháp lý nào đang mở" />
              ) : (
                <ul className="space-y-3">
                  {(deadlines.data ?? []).map((d) => (
                    <DeadlineRow
                      key={d.id}
                      deadline={d}
                      canEdit={canUpdate}
                      isSaving={updateDeadline.isPending}
                      onAction={handleDeadlineAction}
                    />
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="files">
          <Card>
            <CardHeader>
              <CardTitle>Tài liệu đính kèm</CardTitle>
            </CardHeader>
            <CardContent>
              <FileUploadComponent
                files={filesQuery.data?.items ?? []}
                caseId={item.id}
                disabled={!canUpdate}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Lịch sử thao tác</CardTitle>
            </CardHeader>
            <CardContent>
              {events.isPending ? (
                <DetailSkeleton />
              ) : (events.data ?? []).length === 0 ? (
                <EmptyState title="Chưa có lịch sử" />
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
            <SheetTitle>Sửa hồ sơ {item.code}</SheetTitle>
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
              submitLabel="Lưu thay đổi"
            />
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={assignOpen} onOpenChange={setAssignOpen}>
        <SheetContent className="overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Phân công lại {item.code}</SheetTitle>
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
  onReschedule,
  onComplete,
}: {
  milestone: CaseMilestone;
  canEdit: boolean;
  isSaving: boolean;
  onReschedule: (dateIso: string) => void;
  onComplete: (dateIso: string) => void;
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

  return (
    <li className="flex flex-col gap-2 rounded-lg border border-border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-medium">{STAGE_STYLES[m.stage].label}</span>
        <span className="text-sm text-muted-foreground">
          Kế hoạch gốc: {fmt(m.originalPlannedDate)}
          {deltaDays !== 0 && (
            <>
              {" → Hiện tại: "}
              {fmt(m.currentPlannedDate)}{" "}
              <span
                className={cn(
                  "font-medium",
                  deltaDays > 0 ? "text-warning" : "text-success",
                )}
              >
                ({deltaDays > 0 ? "+" : ""}
                {deltaDays} ngày)
              </span>
            </>
          )}
        </span>
        <span className="text-sm">
          {m.actualDate ? (
            <span className="text-success">
              Hoàn thành: {fmt(m.actualDate)}
            </span>
          ) : (
            "Chưa hoàn thành"
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
                toast.error("Ngày kế hoạch không hợp lệ");
                return;
              }
              onReschedule(iso);
            }}
          >
            Dời ngày kế hoạch
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
                toast.error("Ngày hoàn thành không hợp lệ");
                return;
              }
              onComplete(iso);
            }}
          >
            <Check className="size-4" aria-hidden="true" />
            Đánh dấu hoàn thành
          </Button>
        </div>
      )}
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
 * Nút hành động chỉ hiện khi còn việc để làm: "Đã tiếp nhận" lúc đang
 * flagged, "Đã xử lý" lúc flagged hoặc đã tiếp nhận.
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
              Đã tiếp nhận
            </Button>
          )}
          {canResolve && (
            <Button
              size="sm"
              disabled={isSaving}
              onClick={() => onAction(d.id, "resolve")}
            >
              Đã xử lý
            </Button>
          )}
        </div>
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
                    Gợi ý — ít việc nhất
                  </span>
                )}
                {isCurrent && (
                  <span className="rounded-full bg-muted-foreground/10 px-2 py-0.5 text-xs text-muted-foreground">
                    Đang thụ lý
                  </span>
                )}
              </span>
              <span className="text-muted-foreground">
                {w.openCaseCount} hồ sơ mở · tải {w.weightedLoad}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
