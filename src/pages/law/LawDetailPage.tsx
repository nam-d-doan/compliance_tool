/**
 * PSEUDO CODE (ngắn gọn)
 * 1. GĐ1: 2 tab — Tổng quan / Lịch sử. Tab "Ý kiến tư vấn" và cảnh báo đỏ
 *    thêm ở GĐ2-3 theo đúng kế hoạch (docs/law/00-decisions.md).
 * 2. Đổi trạng thái (new→in_progress→completed) để ở GĐ2 cùng với SLA —
 *    GĐ1 chỉ có Sửa hồ sơ (đổi thông tin chung), chưa có nút đổi trạng
 *    thái riêng.
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
  EmptyState,
  ErrorState,
  DetailSkeleton,
} from "@/components/common";
import { LawForm, type LawFormValues } from "@/components/law/LawForm";
import {
  useLawRequestDetail,
  useLawRequestEvents,
} from "@/hooks/queries";
import { useUpdateLawRequest } from "@/hooks/mutations";
import { useAuthStore } from "@/stores";
import { hasPermission } from "@/constants/rbac";
import { LAW_PRIORITY_STYLES, LAW_STATUS_LABELS } from "@/constants/law";
import { toast } from "sonner";
import type { UpdateAdviceRequestInput } from "@/types";

function fmt(date?: string): string {
  return date ? format(parseISO(date), "MMM d, yyyy") : "—";
}

export default function LawDetailPage() {
  const { id = "" } = useParams<{ id: string }>();
  const { role } = useAuthStore();
  const canUpdate = hasPermission(role, "law:update");

  const [editOpen, setEditOpen] = useState(false);

  const detail = useLawRequestDetail(id);
  const events = useLawRequestEvents(id);
  const update = useUpdateLawRequest(id);

  const item = detail.data;

  if (detail.isPending) return <DetailSkeleton />;
  if (detail.isError || !item) {
    return <ErrorState onRetry={() => detail.refetch()} />;
  }

  const handleEditSubmit = (values: LawFormValues) => {
    const payload: UpdateAdviceRequestInput = {
      title: values.title,
      description: values.description || undefined,
      priorityTier: values.priorityTier as UpdateAdviceRequestInput["priorityTier"],
      requestingUnitId: values.requestingUnitId,
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
        toast.success("Request updated");
        setEditOpen(false);
      },
      onError: (err) => toast.error(err.message || "Update failed"),
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
            Edit Request
          </Button>
        )}
      </PageHero>

      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
          {LAW_STATUS_LABELS[item.status]}
        </span>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
          {LAW_PRIORITY_STYLES[item.priorityTier].label}
        </span>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Request Information</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Field label="Description" value={item.description || "—"} />
              <Field label="Requesting Unit" value={item.requestingUnitName} />
              <Field label="Assigned Specialist" value={item.ownerName} />
              <Field label="Manager" value={item.managerName || "—"} />
              <Field label="Submitted" value={fmt(item.submittedAt)} />
              <Field label="Completed" value={fmt(item.completedAt)} />
              <Field label="Last Updated" value={fmt(item.updatedAt)} />
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
            <SheetTitle>Edit Request {item.code}</SheetTitle>
          </SheetHeader>
          <div className="px-4 pb-4">
            <LawForm
              defaultValues={{
                title: item.title,
                description: item.description,
                priorityTier: item.priorityTier,
                requestingUnitId: item.requestingUnitId,
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
