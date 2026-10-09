/**
 * PSEUDO CODE — tab Tài liệu dùng chung LM + LAW (Nam review: "File Sharing
 * Storage", "tổ chức theo folder")
 * 1. File Sharing Storage (demo): mỗi file hiện đường dẫn
 *    <rootPath>\<folder>\<tên file>. Chưa nối storage thật; file seed tải
 *    xuống ra PDF mẫu (makeDemoPdf), file upload mới tải đúng file gốc.
 * 2. Folder = `folders` của bản ghi (có folder rỗng) + folder lạ trên file +
 *    nhóm "Chưa phân loại". Tạo folder do trang cha lưu (onCreateFolder);
 *    chuyển file = PUT /api/files/:id { folderPath }.
 * 3. Phần riêng từng module (LM: gắn file vào mốc; LAW: file đến từ tin
 *    nhắn/ý kiến nào) truyền qua `renderFileExtra` — component không biết LM/LAW.
 */
import { useRef, useState, type ReactNode } from "react";
import { format, parseISO } from "date-fns";
import { Download, FileText, Folder, FolderPlus, HardDrive, Trash2, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUploadFile, useDeleteFile, useMoveFileToFolder } from "@/hooks/mutations/useFileMutations";
import { useAuthStore } from "@/stores";
import { useL, useDateLocale } from "@/lib/i18n";
import { makeDemoPdf, isMockFileUrl } from "@/lib/demo-pdf";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { FileAttachment } from "@/types";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const UNFILED = "";
const INVALID_FOLDER_CHARS = /[\\/:*?"<>|]/;

export const documentSelectClass =
  "h-8 rounded-lg border border-input bg-transparent px-2 text-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 dark:bg-input/30";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export interface DocumentStorageProps {
  /** Thư mục của bản ghi trên storage, vd `\\fileshare\PhapChe\LM\LM-2026-001`. */
  rootPath: string;
  /** Mã bản ghi (LM-…/LAW-…), in vào PDF mẫu khi tải file seed. */
  recordCode: string;
  folders: string[];
  files: FileAttachment[];
  canEdit: boolean;
  /** File upload mới gắn vào bản ghi nào. */
  uploadTarget: { caseId?: string; requestId?: string };
  /** Lưu folder mới; gọi `done()` khi lưu xong để form đóng lại. */
  onCreateFolder: (name: string, done: () => void) => void;
  creatingFolder: boolean;
  /** Nội dung chèn giữa thanh công cụ và danh sách folder (vd link sang tab khác). */
  topSlot?: ReactNode;
  renderFileExtra?: (file: FileAttachment) => { badges?: ReactNode; actions?: ReactNode };
}

export function DocumentStorage(props: DocumentStorageProps) {
  const { rootPath, folders, files, canEdit, uploadTarget, onCreateFolder, creatingFolder, topSlot } = props;
  const L = useL();
  const { user } = useAuthStore();
  const upload = useUploadFile();

  const [targetFolder, setTargetFolder] = useState(folders[0] ?? UNFILED);
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [newFolder, setNewFolder] = useState("");
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Folder lạ trên file (không có trong danh sách của bản ghi) vẫn phải hiện, không để file "biến mất".
  const strayFolders = Array.from(
    new Set(files.map((f) => f.folderPath?.trim() ?? "").filter((p) => p && !folders.includes(p))),
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
        { file, ...uploadTarget, uploadedBy: user?.name, uploadedById: user?.id, folderPath: targetFolder || undefined },
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
    if (INVALID_FOLDER_CHARS.test(name)) {
      toast.error(L('Folder name cannot contain \\ / : * ? " < > |', 'Tên folder không được chứa \\ / : * ? " < > |'));
      return;
    }
    if (folders.includes(name)) {
      toast.error(L("Folder already exists", "Folder đã tồn tại"));
      return;
    }
    onCreateFolder(name, () => {
      setTargetFolder(name);
      setNewFolder("");
      setNewFolderOpen(false);
    });
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-muted/30 p-3">
        <div className="flex flex-wrap items-center gap-2 text-sm font-medium">
          <HardDrive className="size-4 text-primary" aria-hidden="true" />
          File Sharing Storage
          <span className="rounded-full bg-warning-bg px-2 py-0.5 text-[11px] font-medium text-warning">
            {L("Demo — not connected to real storage", "Demo — chưa nối storage thật")}
          </span>
        </div>
        <p className="mt-1 break-all font-mono text-xs text-muted-foreground">{rootPath}</p>
      </div>

      {canEdit && (
        <div className="space-y-2">
          <div className="flex flex-wrap items-end gap-2">
            <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
              {L("Save to folder", "Lưu vào folder")}
              <select
                value={targetFolder}
                onChange={(e) => setTargetFolder(e.target.value)}
                className={cn(documentSelectClass, "h-9 min-w-48 text-sm")}
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
              <Button type="submit" size="sm" disabled={!newFolder.trim() || creatingFolder}>
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
            <span className="font-medium text-foreground">{targetFolder || L("Unfiled", "Chưa phân loại")}</span>
          </div>
        </div>
      )}

      {topSlot}

      <div className="space-y-3">
        {sections.map((folder) => {
          const list = filesIn(folder);
          if (folder === UNFILED && list.length === 0) return null;
          return <FolderSection key={folder || "__unfiled"} {...props} name={folder} files={list} />;
        })}
      </div>
    </div>
  );
}

function FolderSection({ name, files, ...props }: DocumentStorageProps & { name: string }) {
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
            <FileRow
              key={f.id}
              file={f}
              path={`${props.rootPath}\\${name ? `${name}\\` : ""}${f.name}`}
              {...props}
            />
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
  recordCode,
  canEdit,
  renderFileExtra,
}: Omit<DocumentStorageProps, "files"> & { file: FileAttachment; path: string }) {
  const L = useL();
  const dateLocale = useDateLocale();
  const move = useMoveFileToFolder();
  const remove = useDeleteFile();
  const [confirming, setConfirming] = useState(false);
  const extra = renderFileExtra?.(file);

  const download = () => {
    const href = isMockFileUrl(file.url)
      ? URL.createObjectURL(
          makeDemoPdf([
            file.name,
            `Record: ${recordCode}`,
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
          {extra?.badges}
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
              className={documentSelectClass}
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
            {extra?.actions}
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
