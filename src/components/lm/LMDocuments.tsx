/**
 * PSEUDO CODE — tab "Tài liệu" của hồ sơ LM (Nam review mục Document)
 * 1. Khung storage/folder/upload/chuyển/xoá dùng chung: components/common/
 *    DocumentStorage.tsx (LAW cũng dùng).
 * 2. Phần riêng LM: gắn file vào mốc ngay tại đây — sửa
 *    CaseMilestone.linkedFileIds (cùng dữ liệu tab Hồ sơ sự vụ đang dùng),
 *    giữ link nhảy sang tab đó. Folder mới lưu vào LitigationCase.folders.
 */
import { ArrowRight, Link2, X } from "lucide-react";
import { DocumentStorage, documentSelectClass } from "@/components/common/DocumentStorage";
import { useUpdateLMCase, useUpdateLMMilestone } from "@/hooks/mutations";
import { useLanguageStore } from "@/stores";
import { getStageLabel, LM_FILE_SHARE_ROOT } from "@/constants/lm";
import { useL } from "@/lib/i18n";
import { toast } from "sonner";
import type { CaseMilestone, FileAttachment, LitigationCase } from "@/types";

export interface LMDocumentsProps {
  lmCase: LitigationCase;
  files: FileAttachment[];
  milestones: CaseMilestone[];
  canEdit: boolean;
  onGoToProfile: () => void;
}

export function LMDocuments({ lmCase, files, milestones, canEdit, onGoToProfile }: LMDocumentsProps) {
  const L = useL();
  const lang = useLanguageStore((s) => s.lang);
  const updateCase = useUpdateLMCase(lmCase.id);
  const updateMilestone = useUpdateLMMilestone(lmCase.id);
  const folders = lmCase.folders ?? [];

  const setLink = (m: CaseMilestone, fileId: string, linked: boolean) => {
    const current = m.linkedFileIds ?? [];
    updateMilestone.mutate(
      {
        id: m.id,
        data: { linkedFileIds: linked ? [...current, fileId] : current.filter((id) => id !== fileId) },
      },
      {
        onSuccess: () =>
          toast.success(
            linked
              ? L(`Linked to ${getStageLabel(m.stage, "en")}`, `Đã gắn vào mốc ${getStageLabel(m.stage, "vi")}`)
              : L("Link removed", "Đã gỡ liên kết"),
          ),
        onError: (e) => toast.error(e.message || L("Failed to update link", "Cập nhật liên kết thất bại")),
      },
    );
  };

  return (
    <DocumentStorage
      rootPath={`${LM_FILE_SHARE_ROOT}\\${lmCase.code}`}
      recordCode={lmCase.code}
      folders={folders}
      files={files}
      canEdit={canEdit}
      uploadTarget={{ caseId: lmCase.id }}
      creatingFolder={updateCase.isPending}
      onCreateFolder={(name, done) =>
        updateCase.mutate(
          { folders: [...folders, name] },
          {
            onSuccess: () => {
              toast.success(L(`Created folder ${name}`, `Đã tạo folder ${name}`));
              done();
            },
            onError: (e) => toast.error(e.message || L("Failed to create folder", "Tạo folder thất bại")),
          },
        )
      }
      topSlot={
        <button
          type="button"
          onClick={onGoToProfile}
          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
        >
          <Link2 className="size-3.5" aria-hidden="true" />
          {L("View documents linked to each workflow step → Case Profile", "Xem tài liệu theo từng mốc xử lý → Hồ sơ sự vụ")}
          <ArrowRight className="size-3.5" aria-hidden="true" />
        </button>
      }
      renderFileExtra={(file) => {
        const linkedTo = milestones.filter((m) => m.linkedFileIds?.includes(file.id));
        const linkable = milestones.filter((m) => !m.linkedFileIds?.includes(file.id));
        return {
          badges:
            linkedTo.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {linkedTo.map((m) => (
                  <span
                    key={m.id}
                    className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] text-primary"
                  >
                    <Link2 className="size-3" aria-hidden="true" />
                    {getStageLabel(m.stage, lang)}
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => setLink(m, file.id, false)}
                        aria-label={L("Remove link", "Gỡ liên kết")}
                        className="hover:text-destructive"
                      >
                        <X className="size-3" aria-hidden="true" />
                      </button>
                    )}
                  </span>
                ))}
              </div>
            ) : null,
          actions:
            linkable.length > 0 ? (
              <select
                value=""
                aria-label={L("Link to workflow step", "Gắn vào mốc")}
                disabled={updateMilestone.isPending}
                onChange={(e) => {
                  const m = milestones.find((x) => x.id === e.target.value);
                  if (m) setLink(m, file.id, true);
                }}
                className={documentSelectClass}
              >
                <option value="">{L("Link to step…", "Gắn vào mốc…")}</option>
                {linkable.map((m) => (
                  <option key={m.id} value={m.id}>
                    {getStageLabel(m.stage, lang)}
                  </option>
                ))}
              </select>
            ) : null,
        };
      }}
    />
  );
}
