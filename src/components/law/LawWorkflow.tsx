/**
 * PSEUDO CODE — tab "Flow tư vấn" (Nam review LAW: 4 bước)
 * 1. Tiếp nhận: ai gửi, khi nào, mức ưu tiên đề xuất, mô tả.
 * 2. Đánh giá ưu tiên: đã xong → mức đề xuất → mức chốt + ghi chú + hạn SLA;
 *    chưa xong → Manager (law:approve) chọn mức + ghi chú rồi xác nhận.
 * 3. Trao đổi: luồng tin nhắn 2 bên, đính kèm file. Ô soạn chọn "gửi với tư
 *    cách" Pháp chế hoặc Đơn vị yêu cầu (MÔ PHỎNG — chưa có vai trò đơn vị).
 * 4. Đóng: các phiên bản ý kiến tư vấn (mới nhất trên). Chuyên viên phụ
 *    trách soạn & nộp; Manager duyệt (đóng yêu cầu) hoặc trả lại kèm lý do.
 * Mỗi bước có trạng thái: xong (✓) / đang làm (số + viền màu) / chưa tới.
 * Quyền ở UI chỉ để ẩn nút — server kiểm lại theo người đăng nhập.
 */
import { useRef, useState, type ReactNode } from "react";
import { format, parseISO } from "date-fns";
import {
  ArrowRight,
  Check,
  Download,
  FileText,
  Paperclip,
  RotateCcw,
  Send,
  ShieldCheck,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { DetailSkeleton } from "@/components/common";
import { useLawMessages, useLawOpinions, useFilesByIds } from "@/hooks/queries";
import {
  useAssessLawRequest,
  usePostLawMessage,
  useSubmitLawOpinion,
  useReviewLawOpinion,
} from "@/hooks/mutations";
import { useUploadFile } from "@/hooks/mutations/useFileMutations";
import { useAuthStore } from "@/stores";
import { hasPermission } from "@/constants/rbac";
import { LAW_PRIORITY_TIERS, LAW_PRIORITY_STYLES, type LawPriorityTier } from "@/constants/law";
import { useL, useTerm, useDateLocale } from "@/lib/i18n";
import { makeDemoPdf, isMockFileUrl } from "@/lib/demo-pdf";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { AdviceRequest, AdvisoryOpinion, FileAttachment, LawMessage } from "@/types";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const selectClass =
  "h-9 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 dark:bg-input/30";

type StepState = "done" | "active" | "upcoming";

function stepStates(status: AdviceRequest["status"]): [StepState, StepState, StepState, StepState] {
  switch (status) {
    case "new":
      return ["done", "active", "upcoming", "upcoming"];
    case "in_progress":
      return ["done", "done", "active", "upcoming"];
    case "pending_approval":
      return ["done", "done", "done", "active"];
    case "completed":
      return ["done", "done", "done", "done"];
  }
}

function downloadFile(file: FileAttachment, requestCode: string) {
  const href = isMockFileUrl(file.url)
    ? URL.createObjectURL(
        makeDemoPdf([
          file.name,
          `Request: ${requestCode}`,
          "Demo document - placeholder content, not a real legal record.",
        ]),
      )
    : file.url;
  const a = document.createElement("a");
  a.href = href;
  a.download = file.name;
  a.click();
  if (href !== file.url) setTimeout(() => URL.revokeObjectURL(href), 1000);
}

export function LawWorkflow({ request }: { request: AdviceRequest }) {
  const L = useL();
  const [s1, s2, s3, s4] = stepStates(request.status);
  return (
    <ol className="space-y-4">
      <Step n={1} state={s1} title={L("Request received", "Tiếp nhận yêu cầu")}>
        <IntakeStep request={request} />
      </Step>
      <Step n={2} state={s2} title={L("Priority assessment", "Đánh giá mức độ ưu tiên")}>
        <AssessmentStep request={request} />
      </Step>
      <Step n={3} state={s3} title={L("Discussion & document exchange", "Thảo luận & trao đổi tài liệu")}>
        <DiscussionStep request={request} active={s3 === "active" || request.status === "pending_approval"} />
      </Step>
      <Step n={4} state={s4} title={L("Advisory opinion & closure", "Ý kiến tư vấn & đóng yêu cầu")}>
        <ClosureStep request={request} />
      </Step>
    </ol>
  );
}

function Step({ n, state, title, children }: { n: number; state: StepState; title: string; children: ReactNode }) {
  const L = useL();
  return (
    <li
      className={cn(
        "rounded-xl border p-4",
        state === "active" ? "border-primary/60 bg-primary/[0.03] ring-1 ring-primary/20" : "border-border",
      )}
    >
      <div className="mb-3 flex items-center gap-3">
        <span
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
            state === "done" && "bg-success-bg text-success",
            state === "active" && "bg-primary text-primary-foreground",
            state === "upcoming" && "bg-muted text-muted-foreground",
          )}
          aria-hidden="true"
        >
          {state === "done" ? <Check className="size-4" /> : n}
        </span>
        <h3 className={cn("text-sm font-semibold", state === "upcoming" && "text-muted-foreground")}>{title}</h3>
        <span className="ml-auto text-xs text-muted-foreground">
          {state === "done" ? L("Done", "Đã xong") : state === "active" ? L("In progress", "Đang thực hiện") : L("Not started", "Chưa tới")}
        </span>
      </div>
      {state === "upcoming" ? null : <div className="pl-10">{children}</div>}
    </li>
  );
}

function Meta({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="text-sm">{children}</div>
    </div>
  );
}

function IntakeStep({ request }: { request: AdviceRequest }) {
  const L = useL();
  const term = useTerm();
  const dateLocale = useDateLocale();
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <Meta label={L("Requesting unit", "Đơn vị yêu cầu")}>{request.requestingUnitName}</Meta>
      <Meta label={L("Received", "Ngày tiếp nhận")}>
        {format(parseISO(request.submittedAt), "dd/MM/yyyy HH:mm", { locale: dateLocale })}
      </Meta>
      <Meta label={L("Proposed priority", "Mức ưu tiên đề xuất")}>
        {term(LAW_PRIORITY_STYLES[request.initialPriorityTier].label)}
      </Meta>
      {request.description && (
        <div className="sm:col-span-3">
          <Meta label={L("Description", "Mô tả")}>{request.description}</Meta>
        </div>
      )}
    </div>
  );
}

function AssessmentStep({ request }: { request: AdviceRequest }) {
  const L = useL();
  const term = useTerm();
  const dateLocale = useDateLocale();
  const { role } = useAuthStore();
  const assess = useAssessLawRequest(request.id);
  const [tier, setTier] = useState<LawPriorityTier>(request.priorityTier);
  const [note, setNote] = useState("");
  const tierLabel = (t: LawPriorityTier) => term(LAW_PRIORITY_STYLES[t].label);

  if (request.assessedAt) {
    const changed = request.initialPriorityTier !== request.priorityTier;
    return (
      <div className="grid gap-3 sm:grid-cols-3">
        <Meta label={L("Confirmed priority", "Mức ưu tiên đã chốt")}>
          {changed ? (
            <span className="inline-flex flex-wrap items-center gap-1.5">
              <span className="text-muted-foreground line-through">{tierLabel(request.initialPriorityTier)}</span>
              <ArrowRight className="size-3.5 text-muted-foreground" aria-hidden="true" />
              <span className="font-medium">{tierLabel(request.priorityTier)}</span>
            </span>
          ) : (
            tierLabel(request.priorityTier)
          )}
        </Meta>
        <Meta label={L("Assessed by", "Người đánh giá")}>
          {request.assessedByName} ·{" "}
          {format(parseISO(request.assessedAt), "dd/MM/yyyy HH:mm", { locale: dateLocale })}
        </Meta>
        <Meta label={L("SLA due date", "Hạn SLA")}>
          {format(parseISO(request.dueDate), "dd/MM/yyyy", { locale: dateLocale })}
        </Meta>
        {request.assessmentNote && (
          <div className="sm:col-span-3">
            <Meta label={L("Note", "Ghi chú")}>{request.assessmentNote}</Meta>
          </div>
        )}
      </div>
    );
  }

  if (!hasPermission(role, "law:approve")) {
    return (
      <p className="text-sm text-muted-foreground">
        {L(
          "Waiting for a manager to confirm the priority. The SLA due date is provisional until then.",
          "Đang chờ Manager chốt mức ưu tiên. Hạn SLA hiện là hạn tạm.",
        )}
      </p>
    );
  }

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        assess.mutate(
          { priorityTier: tier, note: note.trim() || undefined },
          {
            onSuccess: () => toast.success(L("Priority confirmed — discussion is open", "Đã chốt mức ưu tiên — mở bước trao đổi")),
            onError: (err) => toast.error(err.message || L("Assessment failed", "Đánh giá thất bại")),
          },
        );
      }}
    >
      <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
        {L("Priority", "Mức ưu tiên")}
        <select value={tier} onChange={(e) => setTier(e.target.value as LawPriorityTier)} className={cn(selectClass, "max-w-sm")}>
          {LAW_PRIORITY_TIERS.map((t) => (
            <option key={t} value={t}>
              {tierLabel(t)}
              {t === request.initialPriorityTier ? L(" (proposed)", " (đề xuất)") : ""}
            </option>
          ))}
        </select>
      </label>
      <Textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder={L("Reason / note (optional)", "Lý do / ghi chú (không bắt buộc)")}
        className="min-h-16"
      />
      <p className="text-xs text-muted-foreground">
        {L("The SLA due date is recalculated from the received date using the confirmed priority.", "Hạn SLA sẽ tính lại từ ngày tiếp nhận theo mức ưu tiên đã chốt.")}
      </p>
      <Button type="submit" disabled={assess.isPending}>
        <ShieldCheck className="size-4" aria-hidden="true" />
        {L("Confirm assessment", "Xác nhận đánh giá")}
      </Button>
    </form>
  );
}

function AttachmentChips({ ids, files, requestCode }: { ids: string[]; files: FileAttachment[]; requestCode: string }) {
  const L = useL();
  const list = ids.map((id) => files.find((f) => f.id === id)).filter(Boolean) as FileAttachment[];
  if (list.length === 0) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {list.map((f) => (
        <button
          key={f.id}
          type="button"
          onClick={() => downloadFile(f, requestCode)}
          className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-0.5 text-xs hover:border-primary"
          title={L("Download", "Tải xuống")}
        >
          <FileText className="size-3.5" aria-hidden="true" />
          {f.name}
          <Download className="size-3 text-muted-foreground" aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}

/** Ô chọn file + danh sách file đã upload xong (trả về id để gửi kèm). */
function useAttachments(requestId: string, folder: string) {
  const L = useL();
  const { user } = useAuthStore();
  const upload = useUploadFile();
  const [attached, setAttached] = useState<FileAttachment[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const pick = (list: FileList | null) => {
    Array.from(list ?? []).forEach((file) => {
      if (file.size > MAX_FILE_SIZE) {
        toast.error(L(`${file.name} exceeds 10 MB`, `${file.name} vượt quá 10 MB`));
        return;
      }
      upload.mutate(
        { file, requestId, uploadedBy: user?.name, uploadedById: user?.id, folderPath: folder },
        {
          onSuccess: (f) => setAttached((prev) => [...prev, f]),
          onError: (e) => toast.error(e.message || L("Upload failed", "Tải lên thất bại")),
        },
      );
    });
  };

  const control = (
    <>
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          pick(e.target.files);
          e.target.value = "";
        }}
      />
      <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()} disabled={upload.isPending}>
        <Paperclip className="size-3.5" aria-hidden="true" />
        {upload.isPending ? L("Uploading…", "Đang tải lên…") : L("Attach", "Đính kèm")}
      </Button>
    </>
  );

  const chips =
    attached.length > 0 ? (
      <div className="flex flex-wrap gap-1.5">
        {attached.map((f) => (
          <span key={f.id} className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs">
            <FileText className="size-3.5" aria-hidden="true" />
            {f.name}
            <button
              type="button"
              aria-label={L("Remove attachment", "Bỏ đính kèm")}
              onClick={() => setAttached((prev) => prev.filter((x) => x.id !== f.id))}
            >
              <X className="size-3" aria-hidden="true" />
            </button>
          </span>
        ))}
      </div>
    ) : null;

  return { control, chips, ids: attached.map((f) => f.id), reset: () => setAttached([]) };
}

function DiscussionStep({ request, active }: { request: AdviceRequest; active: boolean }) {
  const L = useL();
  const dateLocale = useDateLocale();
  const { role } = useAuthStore();
  const messages = useLawMessages(request.id);
  const files = useFilesByIds(request.fileIds);
  const post = usePostLawMessage(request.id);
  const [content, setContent] = useState("");
  const [side, setSide] = useState<LawMessage["side"]>("legal");
  const att = useAttachments(request.id, "02. Trao đổi");
  const canPost = active && hasPermission(role, "law:read");

  if (messages.isPending) return <DetailSkeleton />;
  const list = messages.data ?? [];
  const fileList = files.data?.items ?? [];

  return (
    <div className="space-y-3">
      {list.length === 0 ? (
        <p className="text-sm text-muted-foreground">{L("No messages yet.", "Chưa có tin nhắn.")}</p>
      ) : (
        <ul className="space-y-2.5">
          {list.map((m) => {
            const isLegal = m.side === "legal";
            return (
              <li key={m.id} className={cn("flex", isLegal ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[85%] rounded-xl px-3 py-2 text-sm",
                    isLegal ? "bg-primary/10" : "bg-muted",
                  )}
                >
                  <p className="mb-0.5 text-xs font-medium text-muted-foreground">
                    {m.authorName} · {isLegal ? L("Legal", "Pháp chế") : L("Requesting unit", "Đơn vị yêu cầu")} ·{" "}
                    {format(parseISO(m.createdAt), "dd/MM HH:mm", { locale: dateLocale })}
                  </p>
                  {m.content && <p className="whitespace-pre-wrap">{m.content}</p>}
                  <AttachmentChips ids={m.fileIds} files={fileList} requestCode={request.code} />
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {canPost ? (
        <form
          className="space-y-2 rounded-lg border border-border p-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!content.trim() && att.ids.length === 0) return;
            post.mutate(
              { side, content: content.trim(), fileIds: att.ids },
              {
                onSuccess: () => {
                  setContent("");
                  att.reset();
                },
                onError: (err) => toast.error(err.message || L("Failed to send", "Gửi thất bại")),
              },
            );
          }}
        >
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={L("Write a message…", "Nhập tin nhắn…")}
            className="min-h-16"
          />
          {att.chips}
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              {L("Send as", "Gửi với tư cách")}
              <select value={side} onChange={(e) => setSide(e.target.value as LawMessage["side"])} className={cn(selectClass, "h-8 text-xs")}>
                <option value="legal">{L("Legal (me)", "Pháp chế (tôi)")}</option>
                <option value="requester">{L("Requesting unit (simulated)", "Đơn vị yêu cầu (mô phỏng)")}</option>
              </select>
            </label>
            {att.control}
            <Button type="submit" size="sm" className="ml-auto" disabled={post.isPending || (!content.trim() && att.ids.length === 0)}>
              <Send className="size-3.5" aria-hidden="true" />
              {L("Send", "Gửi")}
            </Button>
          </div>
        </form>
      ) : (
        request.status === "completed" && (
          <p className="text-xs text-muted-foreground">{L("Discussion closed.", "Đã đóng trao đổi.")}</p>
        )
      )}
    </div>
  );
}

function ClosureStep({ request }: { request: AdviceRequest }) {
  const L = useL();
  const { role, user } = useAuthStore();
  const opinions = useLawOpinions(request.id);
  const files = useFilesByIds(request.fileIds);
  const submit = useSubmitLawOpinion(request.id);
  const [draft, setDraft] = useState("");
  const att = useAttachments(request.id, "03. Ý kiến tư vấn");

  const isOwner = user?.id === request.ownerId || role === "admin";
  const canSubmit = request.status === "in_progress" && isOwner;
  const canReview = request.status === "pending_approval" && hasPermission(role, "law:approve");

  if (opinions.isPending) return <DetailSkeleton />;
  const list = opinions.data ?? [];
  const fileList = files.data?.items ?? [];

  return (
    <div className="space-y-3">
      {list.map((op) => (
        <OpinionCard
          key={op.id}
          opinion={op}
          files={fileList}
          requestCode={request.code}
          canReview={canReview && op.status === "submitted"}
          requestId={request.id}
        />
      ))}

      {request.status === "in_progress" && !canSubmit && (
        <p className="text-sm text-muted-foreground">
          {L(
            `Waiting for ${request.ownerName} to submit the advisory opinion.`,
            `Đang chờ ${request.ownerName} soạn và nộp ý kiến tư vấn.`,
          )}
        </p>
      )}
      {request.status === "pending_approval" && !canReview && (
        <p className="text-sm text-muted-foreground">
          {L("Waiting for manager approval.", "Đang chờ Manager phê duyệt.")}
        </p>
      )}

      {canSubmit && (
        <form
          className="space-y-2 rounded-lg border border-border p-3"
          onSubmit={(e) => {
            e.preventDefault();
            submit.mutate(
              { content: draft.trim(), fileIds: att.ids },
              {
                onSuccess: () => {
                  toast.success(L("Opinion submitted for approval", "Đã nộp ý kiến chờ phê duyệt"));
                  setDraft("");
                  att.reset();
                },
                onError: (err) => toast.error(err.message || L("Submit failed", "Nộp thất bại")),
              },
            );
          }}
        >
          <p className="text-sm font-medium">
            {list.length > 0
              ? L(`Draft opinion v${list[0].version + 1}`, `Soạn ý kiến bản v${list[0].version + 1}`)
              : L("Draft the advisory opinion", "Soạn ý kiến tư vấn")}
          </p>
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={L("Conclusion, legal basis, recommendations…", "Kết luận, căn cứ pháp lý, khuyến nghị…")}
            className="min-h-28"
          />
          {att.chips}
          <div className="flex items-center gap-2">
            {att.control}
            <Button type="submit" size="sm" className="ml-auto" disabled={submit.isPending || !draft.trim()}>
              <Send className="size-3.5" aria-hidden="true" />
              {L("Submit for approval", "Nộp để phê duyệt")}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

const OPINION_STATUS: Record<AdvisoryOpinion["status"], { label: [string, string]; className: string }> = {
  submitted: { label: ["Pending approval", "Chờ phê duyệt"], className: "bg-warning-bg text-warning" },
  approved: { label: ["Approved", "Đã duyệt"], className: "bg-success-bg text-success" },
  returned: { label: ["Returned for revision", "Trả lại để sửa"], className: "bg-danger-bg text-danger" },
};

function OpinionCard({
  opinion,
  files,
  requestCode,
  canReview,
  requestId,
}: {
  opinion: AdvisoryOpinion;
  files: FileAttachment[];
  requestCode: string;
  canReview: boolean;
  requestId: string;
}) {
  const L = useL();
  const dateLocale = useDateLocale();
  const review = useReviewLawOpinion(requestId);
  const [returning, setReturning] = useState(false);
  const [note, setNote] = useState("");
  const st = OPINION_STATUS[opinion.status];

  const act = (action: "approve" | "return") =>
    review.mutate(
      { opinionId: opinion.id, data: { action, note: note.trim() || undefined } },
      {
        onSuccess: () =>
          toast.success(
            action === "approve"
              ? L("Opinion approved — request closed", "Đã duyệt ý kiến — đóng yêu cầu")
              : L("Opinion returned for revision", "Đã trả lại ý kiến để sửa"),
          ),
        onError: (err) => toast.error(err.message || L("Action failed", "Thao tác thất bại")),
      },
    );

  return (
    <div className={cn("rounded-lg border p-3", opinion.status === "approved" ? "border-success/40" : "border-border")}>
      <div className="mb-1 flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold">v{opinion.version}</span>
        <span className={cn("rounded-md px-1.5 py-0.5 text-xs font-medium", st.className)}>{L(...st.label)}</span>
        <span className="text-xs text-muted-foreground">
          {opinion.issuedByName} · {format(parseISO(opinion.issuedAt), "dd/MM/yyyy HH:mm", { locale: dateLocale })}
        </span>
      </div>
      <p className="whitespace-pre-wrap text-sm">{opinion.content}</p>
      <AttachmentChips ids={opinion.fileIds} files={files} requestCode={requestCode} />

      {opinion.reviewedAt && (
        <p className="mt-2 rounded-md bg-muted px-2 py-1 text-xs">
          <span className="font-medium">
            {opinion.status === "returned" ? L("Returned by", "Trả lại bởi") : L("Approved by", "Duyệt bởi")}{" "}
            {opinion.reviewedByName}
          </span>{" "}
          · {format(parseISO(opinion.reviewedAt), "dd/MM/yyyy HH:mm", { locale: dateLocale })}
          {opinion.reviewNote && <> — {opinion.reviewNote}</>}
        </p>
      )}

      {canReview && (
        <div className="mt-3 space-y-2 border-t border-border pt-3">
          {returning && (
            <Textarea
              autoFocus
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={L("What needs to be revised? (required)", "Cần sửa những gì? (bắt buộc)")}
              className="min-h-16"
            />
          )}
          <div className="flex flex-wrap gap-2">
            {!returning ? (
              <>
                <Button size="sm" disabled={review.isPending} onClick={() => act("approve")}>
                  <Check className="size-3.5" aria-hidden="true" />
                  {L("Approve & close request", "Duyệt & đóng yêu cầu")}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setReturning(true)}>
                  <RotateCcw className="size-3.5" aria-hidden="true" />
                  {L("Return for revision", "Trả lại để sửa")}
                </Button>
              </>
            ) : (
              <>
                <Button size="sm" variant="destructive" disabled={review.isPending || !note.trim()} onClick={() => act("return")}>
                  {L("Confirm return", "Xác nhận trả lại")}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setReturning(false)}>
                  {L("Cancel", "Huỷ")}
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
