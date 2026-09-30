/**
 * PSEUDO CODE (ngắn gọn)
 * 1. 5 tab: Tổng quan / Tiến trình / Hạn & cảnh báo / Tài liệu / Lịch sử.
 * 2. Tiến trình + Hạn & cảnh báo: CHỈ ĐỌC ở GĐ1 — sửa mốc/xử lý cảnh báo
 *    là việc của GĐ2/GĐ3, chưa làm ở đây.
 * 3. Lịch sử dùng list riêng (không tái dùng ActivityFeed) vì
 *    ActivityFeed/TimelineEvent gắn cứng bộ type khác (submission/approval/
 *    ...), không khớp CaseEvent.type — tái dùng sẽ phải sửa component dùng
 *    chung, rủi ro hơn tự viết list riêng cho LM.
 */
import { useState } from "react";
import { useParams } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { motion } from "motion/react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
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
} from "@/hooks/queries";
import { useLmCaseFiles } from "@/hooks/queries/useFileQueries";
import { useUpdateLMCase } from "@/hooks/mutations";
import { useAuthStore } from "@/stores";
import { hasPermission } from "@/constants/rbac";
import { STAGE_STYLES, CASE_CATEGORY_LABELS } from "@/constants/lm";
import { toast } from "sonner";
import type { UpdateLMCaseInput } from "@/types";

function formatVnd(amount: number): string {
  return new Intl.NumberFormat("vi-VN").format(amount) + " ₫";
}

function fmt(date?: string): string {
  return date ? format(parseISO(date), "MMM d, yyyy") : "—";
}

const DEADLINE_STATUS_LABEL: Record<string, string> = {
  pending: "Chưa tới hạn",
  flagged: "🔴 Đã bật cảnh báo",
  acknowledged: "Đã tiếp nhận",
  resolved: "Đã xử lý",
};

export default function LMDetailPage() {
  const { id = "" } = useParams<{ id: string }>();
  const { role } = useAuthStore();
  const canUpdate = hasPermission(role, "lm:update");

  const [editOpen, setEditOpen] = useState(false);

  const detail = useLMCaseDetail(id);
  const milestones = useLMCaseMilestones(id);
  const deadlines = useLMCaseDeadlines(id);
  const events = useLMCaseEvents(id);
  const filesQuery = useLmCaseFiles(id);
  const update = useUpdateLMCase(id);

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <PageHero title={item.code} subtitle={item.title}>
        {canUpdate && (
          <Button variant="outline" onClick={() => setEditOpen(true)}>
            <Pencil className="size-4" aria-hidden="true" />
            Sửa hồ sơ
          </Button>
        )}
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
                    <li
                      key={m.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3"
                    >
                      <span className="font-medium">
                        {STAGE_STYLES[m.stage].label}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        Kế hoạch gốc: {fmt(m.originalPlannedDate)}
                        {m.currentPlannedDate !== m.originalPlannedDate && (
                          <> → Hiện tại: {fmt(m.currentPlannedDate)}</>
                        )}
                      </span>
                      <span className="text-sm">
                        {m.actualDate
                          ? `Hoàn thành: ${fmt(m.actualDate)}`
                          : "Chưa hoàn thành"}
                      </span>
                    </li>
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
                <EmptyState
                  title="Không có hạn pháp lý nào đang mở"
                  description="Thêm hạn mới sẽ có ở GĐ3."
                />
              ) : (
                <ul className="space-y-3">
                  {(deadlines.data ?? []).map((d) => (
                    <li
                      key={d.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3"
                    >
                      <span className="font-medium">{d.type}</span>
                      <DueDateCell
                        dueDate={d.dueDate}
                        completed={d.status === "resolved"}
                      />
                      <span className="text-sm">
                        {DEADLINE_STATUS_LABEL[d.status] ?? d.status}
                      </span>
                    </li>
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
