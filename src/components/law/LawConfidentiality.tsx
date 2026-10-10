/**
 * PSEUDO CODE — thẻ "Bảo mật" của yêu cầu tư vấn (Nam review LAW: Confidentiality)
 * 1. Hiện trạng thái: Thường / Mật (+ lý do, ai gắn, khi nào) và quy tắc ai
 *    xem được — để người dùng hiểu vì sao người khác không thấy yêu cầu.
 * 2. Gắn cờ: chuyên viên phụ trách hoặc Manager, bắt buộc lý do.
 *    Gỡ cờ: chỉ Manager. Server kiểm lại quyền (UI chỉ ẩn nút).
 */
import { useState } from "react";
import { format, parseISO } from "date-fns";
import { Lock, LockOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSetLawConfidentiality } from "@/hooks/mutations";
import { useAuthStore } from "@/stores";
import { hasPermission } from "@/constants/rbac";
import { useL, useDateLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { AdviceRequest } from "@/types";

export function LawConfidentiality({ request }: { request: AdviceRequest }) {
  const L = useL();
  const dateLocale = useDateLocale();
  const { role, user } = useAuthStore();
  const setConf = useSetLawConfidentiality(request.id);
  const [marking, setMarking] = useState(false);
  const [reason, setReason] = useState("");

  const isManager = hasPermission(role, "law:approve");
  const canMark = !request.confidential && (isManager || user?.id === request.ownerId);
  const canLift = request.confidential && isManager;

  const submit = (confidential: boolean) =>
    setConf.mutate(
      { confidential, reason: reason.trim() || undefined },
      {
        onSuccess: () => {
          toast.success(
            confidential ? L("Marked as confidential", "Đã gắn cờ Mật") : L("Confidentiality lifted", "Đã gỡ cờ Mật"),
          );
          setMarking(false);
          setReason("");
        },
        onError: (err) => toast.error(err.message || L("Action failed", "Thao tác thất bại")),
      },
    );

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {request.confidential ? (
            <Lock className="size-4 text-destructive" aria-hidden="true" />
          ) : (
            <LockOpen className="size-4 text-muted-foreground" aria-hidden="true" />
          )}
          {L("Confidentiality", "Bảo mật")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div
          className={cn(
            "rounded-md px-3 py-2",
            request.confidential ? "bg-danger-bg text-danger" : "bg-muted text-muted-foreground",
          )}
        >
          <p className="font-medium">
            {request.confidential ? L("Confidential", "Mật") : L("Standard", "Thường")}
          </p>
          <p className="text-xs">
            {request.confidential
              ? L(
                  "Only the assigned specialist and managers can open it — also after it is closed. It cannot be saved as a template.",
                  "Chỉ chuyên viên phụ trách và Manager mở được — kể cả sau khi đóng. Không lưu được thành mẫu.",
                )
              : L(
                  "While open: assigned specialist and managers. After closing: every legal specialist can read it for reference.",
                  "Khi đang mở: chuyên viên phụ trách và Manager. Sau khi đóng: mọi chuyên viên pháp chế đọc được để tham khảo.",
                )}
          </p>
        </div>

        {request.confidential && request.confidentialReason && (
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{L("Reason:", "Lý do:")}</span> {request.confidentialReason}
            {request.confidentialSetAt && (
              <>
                {" "}
                · {request.confidentialSetByName} ·{" "}
                {format(parseISO(request.confidentialSetAt), "dd/MM/yyyy HH:mm", { locale: dateLocale })}
              </>
            )}
          </p>
        )}

        {canMark &&
          (marking ? (
            <div className="space-y-2">
              <Textarea
                autoFocus
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={L("Why must access be restricted? (required)", "Vì sao cần hạn chế truy cập? (bắt buộc)")}
                className="min-h-16"
              />
              <div className="flex gap-2">
                <Button size="sm" variant="destructive" disabled={setConf.isPending || !reason.trim()} onClick={() => submit(true)}>
                  <Lock className="size-3.5" aria-hidden="true" />
                  {L("Mark confidential", "Gắn cờ Mật")}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setMarking(false)}>
                  {L("Cancel", "Huỷ")}
                </Button>
              </div>
            </div>
          ) : (
            <Button size="sm" variant="outline" onClick={() => setMarking(true)}>
              <Lock className="size-3.5" aria-hidden="true" />
              {L("Mark as confidential", "Gắn cờ Mật")}
            </Button>
          ))}

        {canLift && (
          <Button size="sm" variant="outline" disabled={setConf.isPending} onClick={() => submit(false)}>
            <LockOpen className="size-3.5" aria-hidden="true" />
            {L("Lift confidentiality", "Gỡ cờ Mật")}
          </Button>
        )}
        {request.confidential && !isManager && (
          <p className="text-xs text-muted-foreground">
            {L("Only a manager can lift confidentiality.", "Chỉ Manager gỡ được cờ Mật.")}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
