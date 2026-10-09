/**
 * PSEUDO CODE — tab "Tài liệu" của yêu cầu tư vấn (Nam review LAW: Document Storage)
 * 1. Khung storage/folder/upload/chuyển/xoá dùng chung với LM
 *    (components/common/DocumentStorage.tsx). Folder mặc định bám flow:
 *    01. Yêu cầu · 02. Trao đổi · 03. Ý kiến tư vấn.
 * 2. Phần riêng LAW: mỗi file cho biết nó đến từ đâu trong flow — tin nhắn
 *    của ai (ngày nào) hoặc ý kiến tư vấn bản mấy — để tài liệu không bị tách
 *    khỏi ngữ cảnh trao đổi.
 */
import { format, parseISO } from "date-fns";
import { MessageSquare, ScrollText } from "lucide-react";
import { DocumentStorage } from "@/components/common/DocumentStorage";
import { useUpdateLawRequest } from "@/hooks/mutations";
import { useLawMessages, useLawOpinions } from "@/hooks/queries";
import { LAW_FILE_SHARE_ROOT } from "@/constants/law";
import { useL, useDateLocale } from "@/lib/i18n";
import { toast } from "sonner";
import type { AdviceRequest, FileAttachment } from "@/types";

export function LawDocuments({
  request,
  files,
  canEdit,
}: {
  request: AdviceRequest;
  files: FileAttachment[];
  canEdit: boolean;
}) {
  const L = useL();
  const dateLocale = useDateLocale();
  const update = useUpdateLawRequest(request.id);
  const messages = useLawMessages(request.id);
  const opinions = useLawOpinions(request.id);
  const folders = request.folders ?? [];

  const originOf = (fileId: string) => {
    const msg = messages.data?.find((m) => m.fileIds.includes(fileId));
    if (msg) {
      return {
        icon: MessageSquare,
        text: L(
          `Attached to a message from ${msg.authorName} · ${format(parseISO(msg.createdAt), "dd/MM/yyyy", { locale: dateLocale })}`,
          `Đính kèm tin nhắn của ${msg.authorName} · ${format(parseISO(msg.createdAt), "dd/MM/yyyy", { locale: dateLocale })}`,
        ),
      };
    }
    const op = opinions.data?.find((o) => o.fileIds.includes(fileId));
    if (op) {
      return {
        icon: ScrollText,
        text: L(`Advisory opinion v${op.version}`, `Ý kiến tư vấn bản v${op.version}`),
      };
    }
    return null;
  };

  return (
    <DocumentStorage
      rootPath={`${LAW_FILE_SHARE_ROOT}\\${request.code}`}
      recordCode={request.code}
      folders={folders}
      files={files}
      canEdit={canEdit}
      uploadTarget={{ requestId: request.id }}
      creatingFolder={update.isPending}
      onCreateFolder={(name, done) =>
        update.mutate(
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
      renderFileExtra={(file) => {
        const origin = originOf(file.id);
        if (!origin) return {};
        const Icon = origin.icon;
        return {
          badges: (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] text-primary">
              <Icon className="size-3" aria-hidden="true" />
              {origin.text}
            </span>
          ),
        };
      }}
    />
  );
}
