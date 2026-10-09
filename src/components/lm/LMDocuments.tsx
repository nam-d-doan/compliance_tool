/**
 * PSEUDO CODE — tab "Tài liệu" của hồ sơ LM (Nam review mục Document)
 * 1. File Sharing Storage (demo): mỗi file hiện đường dẫn
 *    LM_FILE_SHARE_ROOT\<mã hồ sơ>\<folder>\<tên file>. Chưa nối storage
 *    thật; file seed tải xuống ra PDF mẫu (makeDemoPdf), file upload mới tải
 *    đúng file gốc (blob URL, mất khi F5).
 * 2. Folder: danh sách lấy từ LitigationCase.folders (có folder rỗng) + folder
 *    lạ trên file (nếu có) + nhóm "Chưa phân loại". Tạo folder = PUT case
 *    với folders mới; chuyển file = PUT /api/files/:id { folderPath }.
 * 3. Gắn vào mốc ngay tại đây: sửa CaseMilestone.linkedFileIds (cùng dữ liệu
 *    tab Hồ sơ sự vụ đang dùng), giữ link nhảy sang tab đó.
 * 4. Không tái dùng FileUploadComponent dùng chung để CAP/NCC không đổi.
 */
import { useRef, useState } from "react";
import { format, parseISO } from "date-fns";
import {
  ArrowRight,
  Download,
  FileText,
  Folder,
  FolderPlus,
  HardDrive,
  Link2,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUploadFile, useDeleteFile, useMoveFileToFolder } from "@/hooks/mutations/useFileMutations";
import { useUpdateLMCase, useUpdateLMMilestone } from "@/hooks/mutations";
import { useAuthStore, useLanguageStore } from "@/stores";
import { getStageLabel, LM_FILE_SHARE_ROOT } from "@/constants/lm";
import { useL, useDateLocale } from "@/lib/i18n";
import { makeDemoPdf, isMockFileUrl } from "@/lib/demo-pdf";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { CaseMilestone, FileAttachment, LitigationCase } from "@/types";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const UNFILED = "";

const selectClass =
  "h-8 rounded-lg border border-input bg-transparent px-2 text-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 dark:bg-input/30";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export interface LMDocumentsProps {
  lmCase: LitigationCase;
  files: FileAttachment[];
  milestones: CaseMilestone[];
  canEdit: boolean;
  onGoToProfile: () => void;
}

export function LMDocuments({ lmCase, files, milestones, canEdit, onGoToProfile }: LMDocumentsProps) {
  const L = useL();
  const { user } = useAuthStore();
  const caseRoot = `${LM_FILE_SHARE_ROOT}\\${lmCase.code}`;
  const folders = lmCase.folders ?? [];

  const upload = useUploadFile();
  const updateCase = useUpdateLMCase(lmCase.id);

  const [targetFolder, setTargetFolder] = useState(folders[0] ?? UNFILED);
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [newFolder, setNewFolder] = useState("");
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Folder lạ trên file (không có trong danh sách hồ sơ) vẫn phải hiện, không để file "biến mất".
  const strayFolders = Array.from(
    new Set(
      files
        .map((f) => f.folderPath?.trim() ?? "")
        .filter((p) => p && !folders.includes(p)),
    ),
  );
  const sections = [...folders, ...strayFolders, UNFILED];
  const filesIn = (folder: string) =>
    files
      .filter((f) => (f.folderPath?.trim() ?? "") === folder)
      .sort((a, b) => a.name.localeCompare(b.name));

  const uploadFiles = (list: FileList | null) => {
    if (!list || !canEdit) return;
    Array.from(list).forEach((file) => {
      if (file.size > MAX_FILE_SIZE) {
        toast.error(L(`${file.name} exceeds 10 MB`, `${file.name} vượt quá 10 MB`));
        return;
      }
      upload.mutate(
        {
          file,
          caseId: lmCase.id,
          uploadedBy: user?.name,
          uploadedById: user?.id,
          folderPath: targetFolder || undefined,
        },
        {
          onSuccess: () => toast.success(L(`Uploaded ${file.name}`, `Đã tải lên ${file.name}`)),
          onError: (e) => toast.error(e.message || L("Upload failed", "Tải lên thất bại")),
        },
      );
    });
  };

  const createFolder = () => {
    const name = newFolder.trim();
    if (!name) return;
    if (/[\\/:*?"<>|]/.test(name)) {
      toast.error(L('Folder name cannot contain \\ / : * ? " < > |', 'Tên folder không được chứa \\ / : * ? " < > |'));
      return;
    }
    if (folders.includes(name)) {
      toast.error(L("Folder already exists", "Folder đã tồn tại"));
      return;
    }
    updateCase.mutate(
      { folders: [...folders, name] },
      {
        onSuccess: () => {
          toast.success(L(`Created folder ${name}`, `Đã tạo folder ${name}`));
          setTargetFolder(name);
          setNewFolder("");
          setNewFolderOpen(false);
        },
        onError: (e) => toast.error(e.message || L("Failed to create folder", "Tạo folder thất bại")),
      },
    );
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-muted/30 p-3">
        <div className="flex flex-wrap items-center gap-2 text-sm font-medium">
          <HardDrive className="size-4 text-primary" aria-hidden="true" />
          {L("File Sharing Storage", "File Sharing Storage")}
          <span className="rounded-full bg-warning-bg px-2 py-0.5 text-[11px] font-medium text-warning">
            {L("Demo — not connected to real storage", "Demo — chưa nối storage thật")}
          </span>
        </div>
        <p className="mt-1 break-all font-mono text-xs text-muted-foreground">{caseRoot}</p>
      </div>

      {canEdit && (
        <div className="space-y-2">
          <div className="flex flex-wrap items-end gap-2">
            <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
              {L("Save to folder", "Lưu vào folder")}
              <select
                value={targetFolder}
                onChange={(e) => setTargetFolder(e.target.value)}
                className={cn(selectClass, "h-9 min-w-48 text-sm")}
              >
                {folders.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
                <option value={UNFILED}>{L("Unfiled", "Chưa phân loại")}</option>
              </select>
            </label>
            <Button onClick={() => inputRef.current?.click()} disabled={upload.isPending}>
              <UploadCloud className="size-4" aria-hidden="true" />
              {upload.isPending ? L("Uploading…", "Đang tải lên…") : L("Upload files", "Tải tài liệu lên")}
            </Button>
            <Button variant="outline" onClick={() => setNewFolderOpen((o) => !o)}>
              <FolderPlus className="size-4" aria-hidden="true" />
              {L("New folder", "Tạo folder")}
            </Button>
            <input
              ref={inputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => {
                uploadFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </div>

          {newFolderOpen && (
            <form
              className="flex flex-wrap items-center gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                createFolder();
              }}
            >
              <Input
                autoFocus
                value={newFolder}
                onChange={(e) => setNewFolder(e.target.value)}
                placeholder={L("e.g. 05. Correspondence", "VD: 05. Thư từ trao đổi")}
                className="h-9 max-w-xs"
              />
              <Button type="submit" size="sm" disabled={!newFolder.trim() || updateCase.isPending}>
                {L("Create", "Tạo")}
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setNewFolderOpen(false)}>
                {L("Cancel", "Huỷ")}
              </Button>
            </form>
          )}

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              uploadFiles(e.dataTransfer.files);
            }}
            className={cn(
              "rounded-lg border border-dashed p-3 text-center text-xs text-muted-foreground transition-colors",
              dragging ? "border-primary bg-primary/5" : "border-border",
            )}
          >
            {L("Or drag & drop files here (max 10 MB each) → saved to", "Hoặc kéo thả file vào đây (tối đa 10 MB/file) → lưu vào")}{" "}
            <span className="font-medium text-foreground">
              {targetFolder || L("Unfiled", "Chưa phân loại")}
            </span>
          </div>
        </div>
      )}

      <button type="button" onClick={onGoToProfile} className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
        <Link2 className="size-3.5" aria-hidden="true" />
        {L("View documents linked to each workflow step → Case Profile", "Xem tài liệu theo từng mốc xử lý → Hồ sơ sự vụ")}
        <ArrowRight className="size-3.5" aria-hidden="true" />
      </button>

      <div className="space-y-3">
        {sections.map((folder) => {
          const list = filesIn(folder);
          if (folder === UNFILED && list.length === 0) return null;
          return (
            <FolderSection
              key={folder || "__unfiled"}
              name={folder}
              caseRoot={caseRoot}
              files={list}
              folders={folders}
              milestones={milestones}
              caseId={lmCase.id}
              caseCode={lmCase.code}
              canEdit={canEdit}
            />
          );
        })}
      </div>
    </div>
  );
}

function FolderSection({
  name,
  caseRoot,
  files,
  ...rest
}: {
  name: string;
  caseRoot: string;
  files: FileAttachment[];
  folders: string[];
  milestones: CaseMilestone[];
  caseId: string;
  caseCode: string;
  canEdit: boolean;
}) {
  const L = useL();
  return (
    <section className="rounded-lg border border-border">
      <header className="flex items-center justify-between gap-2 border-b border-border bg-muted/40 px-3 py-2">
        <span className="flex items-center gap-2 text-sm font-medium">
          <Folder className="size-4 text-warning" aria-hidden="true" />
          {name || L("Unfiled", "Chưa phân loại")}
        </span>
        <span className="text-xs text-muted-foreground">
          {files.length} {L(files.length === 1 ? "file" : "files", "tài liệu")}
        </span>
      </header>
      {files.length === 0 ? (
        <p className="px-3 py-3 text-xs text-muted-foreground">{L("Empty folder", "Folder trống")}</p>
      ) : (
        <ul className="divide-y divide-border">
          {files.map((f) => (
            <FileRow key={f.id} file={f} path={`${caseRoot}\\${name ? `${name}\\` : ""}${f.name}`} {...rest} />
          ))}
        </ul>
      )}
    </section>
  );
}

function FileRow({
  file,
  path,
  folders,
  milestones,
  caseId,
  caseCode,
  canEdit,
}: {
  file: FileAttachment;
  path: string;
  folders: string[];
  milestones: CaseMilestone[];
  caseId: string;
  caseCode: string;
  canEdit: boolean;
}) {
  const L = useL();
  const lang = useLanguageStore((s) => s.lang);
  const dateLocale = useDateLocale();
  const move = useMoveFileToFolder();
  const remove = useDeleteFile();
  const updateMilestone = useUpdateLMMilestone(caseId);
  const [confirming, setConfirming] = useState(false);

  const linkedTo = milestones.filter((m) => m.linkedFileIds?.includes(file.id));
  const linkable = milestones.filter((m) => !m.linkedFileIds?.includes(file.id));

  const setLink = (m: CaseMilestone, linked: boolean) => {
    const current = m.linkedFileIds ?? [];
    updateMilestone.mutate(
      {
        id: m.id,
        data: {
          linkedFileIds: linked ? [...current, file.id] : current.filter((id) => id !== file.id),
        },
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

  const download = () => {
    const href = isMockFileUrl(file.url)
      ? URL.createObjectURL(
          makeDemoPdf([
            file.name,
            `Case: ${caseCode}`,
            `Storage path: ${path}`,
            "Demo document - placeholder content, not a real legal record.",
          ]),
        )
      : file.url;
    const a = document.createElement("a");
    a.href = href;
    a.download = file.name;
    a.click();
    if (href !== file.url) setTimeout(() => URL.revokeObjectURL(href), 1000);
  };

  return (
    <li className="flex flex-wrap items-start justify-between gap-3 px-3 py-2.5">
      <div className="flex min-w-0 flex-1 gap-2">
        <FileText className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <div className="min-w-0 space-y-1">
          <p className="truncate text-sm font-medium">{file.name}</p>
          <p className="text-xs text-muted-foreground">
            {formatSize(file.size)} · {file.uploadedBy} ·{" "}
            {format(parseISO(file.uploadedAt), "dd/MM/yyyy", { locale: dateLocale })}
          </p>
          <p className="break-all font-mono text-[11px] text-muted-foreground/80">{path}</p>
          {linkedTo.length > 0 && (
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
                      onClick={() => setLink(m, false)}
                      aria-label={L("Remove link", "Gỡ liên kết")}
                      className="hover:text-destructive"
                    >
                      <X className="size-3" aria-hidden="true" />
                    </button>
                  )}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <Button size="sm" variant="outline" onClick={download}>
          <Download className="size-3.5" aria-hidden="true" />
          {L("Download", "Tải xuống")}
        </Button>
        {canEdit && (
          <>
            <select
              value=""
              aria-label={L("Move to folder", "Chuyển folder")}
              disabled={move.isPending}
              onChange={(e) => {
                const target = e.target.value === "__unfiled" ? null : e.target.value;
                move.mutate(
                  { id: file.id, folderPath: target },
                  {
                    onSuccess: () => toast.success(L("File moved", "Đã chuyển file")),
                    onError: (err) => toast.error(err.message || L("Move failed", "Chuyển thất bại")),
                  },
                );
              }}
              className={selectClass}
            >
              <option value="">{L("Move to…", "Chuyển tới…")}</option>
              {folders
                .filter((f) => f !== (file.folderPath?.trim() ?? ""))
                .map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              {file.folderPath && <option value="__unfiled">{L("Unfiled", "Chưa phân loại")}</option>}
            </select>
            {linkable.length > 0 && (
              <select
                value=""
                aria-label={L("Link to workflow step", "Gắn vào mốc")}
                disabled={updateMilestone.isPending}
                onChange={(e) => {
                  const m = milestones.find((x) => x.id === e.target.value);
                  if (m) setLink(m, true);
                }}
                className={selectClass}
              >
                <option value="">{L("Link to step…", "Gắn vào mốc…")}</option>
                {linkable.map((m) => (
                  <option key={m.id} value={m.id}>
                    {getStageLabel(m.stage, lang)}
                  </option>
                ))}
              </select>
            )}
            {confirming ? (
              <>
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={remove.isPending}
                  onClick={() =>
                    remove.mutate(file.id, {
                      onSuccess: () => toast.success(L("File deleted", "Đã xoá file")),
                      onError: (err) => toast.error(err.message || L("Delete failed", "Xoá thất bại")),
                    })
                  }
                >
                  {L("Delete", "Xoá")}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setConfirming(false)}>
                  {L("Cancel", "Huỷ")}
                </Button>
              </>
            ) : (
              <Button
                size="icon-sm"
                variant="ghost"
                onClick={() => setConfirming(true)}
                aria-label={L("Delete file", "Xoá file")}
                title={L("Delete file", "Xoá file")}
              >
                <Trash2 className="size-4" aria-hidden="true" />
              </Button>
            )}
          </>
        )}
      </div>
    </li>
  );
}
