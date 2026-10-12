/**
 * PSEUDO CODE (ngắn gọn)
 * 1. 4 tab — Flow tư vấn (mặc định) / Thông tin & SLA / Tài liệu / Lịch sử.
 *    Tài liệu + Lịch sử dùng chung khung với LM (DocumentStorage, AuditTimeline).
 * 2. Review GĐ1 — trạng thái chỉ đổi qua flow 4 bước (components/law/
 *    LawWorkflow.tsx): đánh giá ưu tiên → trao đổi → nộp & duyệt ý kiến.
 *    Bỏ 2 nút đổi trạng thái thủ công cũ (Start Processing/Mark Completed).
 * 3. Phân công (GĐ2): sheet riêng, đọc useLawWorkload() (server đã sort
 *    tăng dần theo tải), chọn xong PUT request.ownerId qua
 *    useUpdateLawRequest. Đôn đốc: 1 nút gọi useRemindLawRequest.
 * 4. GĐ3 — cảnh báo đỏ: severity do server tính sẵn (DEMO_TODAY, xem
 *    lib/deadline-alerts.ts). Nút "Acknowledge"/"Resolve" gọi
 *    PUT /api/law/requests/:id/alert qua useUpdateLawAlert.
 */
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { motion } from "motion/react";
import { Eye, Lock, Pencil, Send, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  PageHero,
  DueDateCell,
  EmptyState,
  ErrorState,
  DetailSkeleton,
} from "@/components/common";
import { LawForm, type LawFormValues } from "@/components/law/LawForm";
import { LawWorkflow } from "@/components/law/LawWorkflow";
import { LawDocuments } from "@/components/law/LawDocuments";
import { LawHistory } from "@/components/law/LawHistory";
import { LawConfidentiality } from "@/components/law/LawConfidentiality";
import {
  useLawRequestDetail,
  useLawRequestEvents,
  useFilesByIds,
  useLawWorkload,
} from "@/hooks/queries";
import {
  useUpdateLawRequest,
  useRemindLawRequest,
  useUpdateLawAlert,
} from "@/hooks/mutations";
import { useAuthStore } from "@/stores";
import { hasPermission } from "@/constants/rbac";
import { ROUTES } from "@/constants/routes";
import { LAW_PRIORITY_STYLES, LAW_STATUS_LABELS } from "@/constants/law";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { UpdateAdviceRequestInput } from "@/types";
import { useL, useTerm, useDateLocale, type Bi } from "@/lib/i18n";
import type { Locale } from "date-fns";

function fmt(date: string | undefined, locale?: Locale): string {
  return date ? format(parseISO(date), "MMM d, yyyy", { locale }) : "—";
}

const ALERT_STATUS_LABEL: Record<string, Bi> = {
  pending: ["Not flagged", "Chưa gắn cờ"],
  flagged: ["Flagged", "Đã gắn cờ"],
  acknowledged: ["Acknowledged", "Đã tiếp nhận"],
  resolved: ["Resolved", "Đã xử lý"],
};

const SEVERITY_DOT: Record<string, string> = {
  red: "bg-destructive",
  amber: "bg-warning",
  none: "bg-muted-foreground/30",
};

export default function LawDetailPage() {
  const { id = "" } = useParams<{ id: string }>();
  const { role, user } = useAuthStore();
  const canUpdate = hasPermission(role, "law:update");
  const canApprove = hasPermission(role, "law:approve");
  const L = useL();
  const term = useTerm();
  const dateLocale = useDateLocale();
  const fmtD = (date?: string) => fmt(date, dateLocale);

  const [editOpen, setEditOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);

  const detail = useLawRequestDetail(id);
  const events = useLawRequestEvents(id);
  const files = useFilesByIds(detail.data?.fileIds ?? []);
  const update = useUpdateLawRequest(id);
  const remind = useRemindLawRequest(id);
  const updateAlert = useUpdateLawAlert(id);

  const item = detail.data;

  if (detail.isPending) return <DetailSkeleton />;
  if (detail.isError || !item) {
    const isForbidden = (detail.error as { status?: number } | null)?.status === 403;
    if (isForbidden) {
      const isConfidential = detail.error?.message.startsWith("CONFIDENTIAL") ?? false;
      return (
        <div className="space-y-4">
          <ErrorState
            title={
              isConfidential
                ? L("Confidential request", "Yêu cầu Mật")
                : L("Not your request", "Yêu cầu không thuộc quyền xem")
            }
            message={
              isConfidential
                ? L(
                    "This request is restricted to the assigned specialist and managers.",
                    "Yêu cầu này chỉ chuyên viên phụ trách và Manager được xem.",
                  )
                : L(
                    "Advisory specialists can only open open requests assigned to them. Closed requests are available under \"Closed — for reference\".",
                    "Chuyên viên chỉ mở được yêu cầu đang xử lý do mình phụ trách. Yêu cầu đã đóng xem ở mục \"Đã đóng — tham khảo\".",
                  )
            }
          />
          <div className="flex justify-center">
            <Button variant="outline" asChild>
              <Link to={ROUTES.LAW.LIST}>{L("Back to my requests", "Về yêu cầu của tôi")}</Link>
            </Button>
          </div>
        </div>
      );
    }
    return <ErrorState onRetry={() => detail.refetch()} />;
  }

  // Review GĐ5 — chuyên viên khác mở yêu cầu đã đóng (không Mật) để tham khảo: chỉ đọc.
  const isReference = role === "owner" && item.ownerId !== user?.id;
  const canEdit = canUpdate && !isReference;

  const handleEditSubmit = (values: LawFormValues) => {
    const payload: UpdateAdviceRequestInput = {
      title: values.title,
      description: values.description || undefined,
      requestingUnitId: values.requestingUnitId,
      tags:
        values.tags
          ?.split(",")
          .map((t) => t.trim())
          .filter(Boolean) ?? [],
    };
    update.mutate(payload, {
      onSuccess: () => {
        toast.success(L("Request updated", "Đã cập nhật yêu cầu"));
        setEditOpen(false);
      },
      onError: (err) => toast.error(err.message || L("Update failed", "Cập nhật thất bại")),
    });
  };

  const handleRemind = () => {
    remind.mutate(
      { fromUserId: user?.id, fromUserName: user?.name },
      {
        onSuccess: () => toast.success(L("Reminder sent", "Đã gửi nhắc nhở")),
        onError: (err) => toast.error(err.message || L("Failed to send reminder", "Gửi nhắc nhở thất bại")),
      },
    );
  };

  const handleAlertAction = (action: "acknowledge" | "resolve") => {
    updateAlert.mutate(
      { action, actorId: user?.id, actorName: user?.name },
      {
        onSuccess: () =>
          toast.success(
            action === "acknowledge"
              ? L("Alert acknowledged", "Đã tiếp nhận cảnh báo")
              : L("Alert resolved", "Đã xử lý cảnh báo"),
          ),
        onError: (err) => toast.error(err.message || L("Action failed", "Thao tác thất bại")),
      },
    );
  };

  const handleAssign = (ownerId: string, ownerName: string) => {
    update.mutate(
      { ownerId },
      {
        onSuccess: () => {
          toast.success(L(`Assigned to ${ownerName}`, `Đã phân công cho ${ownerName}`));
          setAssignOpen(false);
        },
        onError: (err) => toast.error(err.message || L("Assignment failed", "Phân công thất bại")),
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
              {L("Remind", "Đôn đốc")}
            </Button>
          )}
          {canApprove && (
            <Button variant="outline" onClick={() => setAssignOpen(true)}>
              <Users className="size-4" aria-hidden="true" />
              {L("Assign", "Phân công")}
            </Button>
          )}
          {canEdit && (
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              <Pencil className="size-4" aria-hidden="true" />
              {L("Edit Request", "Sửa yêu cầu")}
            </Button>
          )}
        </div>
      </PageHero>

      {isReference && (
        <p className="flex items-center gap-2 rounded-lg bg-info-bg px-3 py-2 text-sm text-info">
          <Eye className="size-4 shrink-0" aria-hidden="true" />
          {L(
            `Read-only — closed request of ${item.ownerName}, shown for reference.`,
            `Chỉ đọc — yêu cầu đã đóng của ${item.ownerName}, hiển thị để tham khảo.`,
          )}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {item.confidential && (
          <span className="inline-flex items-center gap-1 rounded-full bg-danger-bg px-2 py-0.5 text-xs font-medium text-danger">
            <Lock className="size-3" aria-hidden="true" />
            {L("Confidential", "Mật")}
          </span>
        )}
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
          {term(LAW_STATUS_LABELS[item.status])}
        </span>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
          {term(LAW_PRIORITY_STYLES[item.priorityTier].label)}
        </span>
      </div>

      <Tabs defaultValue="flow">
        <TabsList>
          <TabsTrigger value="flow">{L("Advisory Flow", "Flow tư vấn")}</TabsTrigger>
          <TabsTrigger value="overview">{L("Details & SLA", "Thông tin & SLA")}</TabsTrigger>
          <TabsTrigger value="files">{L("Documents", "Tài liệu")}</TabsTrigger>
          <TabsTrigger value="history">{L("History", "Lịch sử")}</TabsTrigger>
        </TabsList>

        <TabsContent value="flow">
          <LawWorkflow request={item} />
        </TabsContent>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>{L("Request Information", "Thông tin yêu cầu")}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Field label={L("Description", "Mô tả")} value={item.description || "—"} />
              <Field label={L("Requesting Unit", "Đơn vị yêu cầu")} value={item.requestingUnitName} />
              <Field label={L("Assigned Specialist", "Chuyên viên phụ trách")} value={item.ownerName || L("Not assigned yet", "Chưa phân công")} />
              <Field label={L("Manager", "Quản lý")} value={item.managerName || L("Not assigned yet", "Chưa phân công")} />
              <Field label={L("Submitted", "Ngày gửi")} value={fmtD(item.submittedAt)} />
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  {L("SLA Due Date", "Hạn SLA")}
                </p>
                <DueDateCell
                  dueDate={item.dueDate}
                  completed={item.status === "completed"}
                />
              </div>
              <Field label={L("Completed", "Ngày hoàn thành")} value={fmtD(item.completedAt)} />
              <Field
                label={L("SLA paused (waiting for info)", "SLA đã dừng (chờ bổ sung)")}
                value={L(`${item.slaPausedDays} day(s)`, `${item.slaPausedDays} ngày`)}
              />
              <Field label={L("Last Updated", "Cập nhật lần cuối")} value={fmtD(item.updatedAt)} />
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle>{L("SLA Alert", "Cảnh báo SLA")}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-sm">
                <span
                  className={cn(
                    "size-2 shrink-0 rounded-full",
                    SEVERITY_DOT[item.severity ?? "none"],
                  )}
                  aria-hidden="true"
                />
                {ALERT_STATUS_LABEL[item.alertStatus]
                  ? L(...ALERT_STATUS_LABEL[item.alertStatus])
                  : item.alertStatus}
              </span>
              {canEdit && (
                <div className="flex gap-2">
                  {item.alertStatus === "flagged" && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={updateAlert.isPending}
                      onClick={() => handleAlertAction("acknowledge")}
                    >
                      {L("Acknowledge", "Tiếp nhận")}
                    </Button>
                  )}
                  {(item.alertStatus === "flagged" ||
                    item.alertStatus === "acknowledged") && (
                    <Button
                      size="sm"
                      disabled={updateAlert.isPending}
                      onClick={() => handleAlertAction("resolve")}
                    >
                      {L("Resolve", "Đã xử lý")}
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {!isReference && <LawConfidentiality request={item} />}
        </TabsContent>

        <TabsContent value="files">
          <Card>
            <CardHeader>
              <CardTitle>{L("Documents", "Tài liệu")}</CardTitle>
            </CardHeader>
            <CardContent>
              <LawDocuments request={item} files={files.data?.items ?? []} canEdit={canEdit} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>{L("Activity History", "Lịch sử thao tác")}</CardTitle>
            </CardHeader>
            <CardContent>
              {events.isPending ? (
                <DetailSkeleton />
              ) : (events.data ?? []).length === 0 ? (
                <EmptyState title={L("No history yet", "Chưa có lịch sử")} />
              ) : (
                <LawHistory events={events.data ?? []} />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Sheet open={editOpen} onOpenChange={setEditOpen}>
        <SheetContent className="overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>
              {L("Edit Request", "Sửa yêu cầu")} {item.code}
            </SheetTitle>
          </SheetHeader>
          <div className="px-4 pb-4">
            <LawForm
              defaultValues={{
                title: item.title,
                description: item.description,
                priorityTier: item.priorityTier,
                requestingUnitId: item.requestingUnitId,
                tags: item.tags.join(", "),
              }}
              mode="edit"
              onSubmit={handleEditSubmit}
              onCancel={() => setEditOpen(false)}
              isSubmitting={update.isPending}
              submitLabel={L("Save Changes", "Lưu thay đổi")}
            />
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={assignOpen} onOpenChange={setAssignOpen}>
        <SheetContent className="overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>
              {L("Reassign", "Phân công lại")} {item.code}
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
  const workload = useLawWorkload();
  const L = useL();

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
                    {L("Suggested — lowest load", "Gợi ý — tải thấp nhất")}
                  </span>
                )}
                {isCurrent && (
                  <span className="rounded-full bg-muted-foreground/10 px-2 py-0.5 text-xs text-muted-foreground">
                    {L("Current owner", "Đang phụ trách")}
                  </span>
                )}
              </span>
              <span className="text-muted-foreground">
                {L(
                  `${w.openRequestCount} open requests · load ${w.weightedLoad}`,
                  `${w.openRequestCount} yêu cầu đang mở · tải ${w.weightedLoad}`,
                )}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
