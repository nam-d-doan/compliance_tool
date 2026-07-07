import { useCallback, useId, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  UploadCloud,
  File as FileIcon,
  X,
  Download,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useUploadFile, useDeleteFile } from "@/hooks/mutations/useFileMutations";
import type { FileAttachment } from "@/types";

const DEFAULT_MAX_FILES = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

/** Accepted extensions + MIME globs. Validation falls back to extension. */
const ACCEPT_ATTR =
  ".pdf,.doc,.docx,.png,.jpg,.jpeg,.gif,.webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*";
const ACCEPTED_EXT = /\.(pdf|doc|docx|png|jpe?g|gif|webp)$/i;

export interface FileUploadComponentProps {
  /** Committed attachments to display. Treated as the seed; the component
   *  tracks its own evolving copy and resyncs when this array reference changes. */
  files: FileAttachment[];
  /** Notified after every successful upload or removal with the full new list. */
  onFilesChange?: (files: FileAttachment[]) => void;
  /** Link uploads to this CAP when set. */
  capId?: string;
  /** Uploader attribution (from the auth store). */
  uploadedBy?: string;
  uploadedById?: string;
  maxFiles?: number;
  disabled?: boolean;
  /** Hide the dropzone; show only the file list. */
  listOnly?: boolean;
  className?: string;
}

interface PendingFile {
  id: string;
  name: string;
  size: number;
  progress: number;
  error?: boolean;
}

export function FileUploadComponent({
  files,
  onFilesChange,
  capId,
  uploadedBy,
  uploadedById,
  maxFiles = DEFAULT_MAX_FILES,
  disabled = false,
  listOnly = false,
  className,
}: FileUploadComponentProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [pending, setPending] = useState<PendingFile[]>([]);

  // Source-of-truth list for the session. Resyncs when the parent passes a
  // new `files` reference (e.g. after a server refetch). Between prop changes
  // this evolves locally so rapid sequential uploads don't lose entries.
  const [committed, setCommitted] = useState<FileAttachment[]>(files);
  const [prevFilesRef, setPrevFilesRef] = useState(files);
  if (files !== prevFilesRef) {
    setPrevFilesRef(files);
    setCommitted(files);
  }
  // Ref mirror so async callbacks always read the freshest committed list.
  const committedRef = useRef(committed);
  committedRef.current = committed;

  const upload = useUploadFile();
  const remove = useDeleteFile();

  const total = committed.length + pending.length;

  const validate = useCallback((file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return `"${file.name}" exceeds the 10 MB limit`;
    }
    if (!ACCEPTED_EXT.test(file.name)) {
      return `"${file.name}" is not an accepted type (PDF, DOC, DOCX, or image)`;
    }
    return null;
  }, []);

  const commit = useCallback(
    (next: FileAttachment[]) => {
      committedRef.current = next;
      setCommitted(next);
      onFilesChange?.(next);
    },
    [onFilesChange],
  );

  const handleFiles = useCallback(
    (fileList: FileList | File[]) => {
      if (disabled) return;
      const incoming = Array.from(fileList);

      const room = Math.max(
        0,
        maxFiles - committedRef.current.length - pending.length,
      );
      if (room < incoming.length) {
        toast.error(
          `You can attach at most ${maxFiles} files (${
            committedRef.current.length + pending.length
          } already queued)`,
        );
      }
      const batch = incoming.slice(0, room);

      for (const file of batch) {
        const err = validate(file);
        if (err) {
          toast.error(err);
          continue;
        }
        const pendingId = `pending-${crypto.randomUUID()}`;
        setPending((prev) => [
          ...prev,
          { id: pendingId, name: file.name, size: file.size, progress: 5 },
        ]);
        const interval = window.setInterval(() => {
          setPending((prev) =>
            prev.map((p) => {
              if (p.id !== pendingId || p.error) return p;
              const next = Math.min(90, p.progress + Math.random() * 25 + 5);
              return { ...p, progress: next };
            }),
          );
        }, 180);

        upload.mutate(
          { file, capId, uploadedBy, uploadedById },
          {
            onSuccess: (attachment) => {
              clearInterval(interval);
              setPending((prev) =>
                prev.map((p) =>
                  p.id === pendingId ? { ...p, progress: 100 } : p,
                ),
              );
              window.setTimeout(() => {
                setPending((prev) => prev.filter((p) => p.id !== pendingId));
              }, 250);
              commit([...committedRef.current, attachment]);
            },
            onError: (e) => {
              clearInterval(interval);
              setPending((prev) =>
                prev.map((p) =>
                  p.id === pendingId ? { ...p, error: true } : p,
                ),
              );
              window.setTimeout(() => {
                setPending((prev) => prev.filter((p) => p.id !== pendingId));
              }, 2200);
              toast.error(e.message || `Failed to upload ${file.name}`);
            },
          },
        );
      }
    },
    [
      disabled,
      maxFiles,
      pending.length,
      validate,
      upload,
      capId,
      uploadedBy,
      uploadedById,
      commit,
    ],
  );

  const handleRemove = useCallback(
    (fileId: string) => {
      commit(committedRef.current.filter((f) => f.id !== fileId));
      remove.mutate(fileId, {
        onError: (e) => toast.error(e.message || "Failed to remove file"),
      });
    },
    [commit, remove],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      if (disabled) return;
      if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
    },
    [disabled, handleFiles],
  );

  const atLimit = total >= maxFiles;

  return (
    <div className={cn("space-y-3", className)}>
      {!listOnly && (
        <div
          role="button"
          tabIndex={0}
          aria-disabled={disabled || atLimit}
          onClick={() => !disabled && !atLimit && inputRef.current?.click()}
          onKeyDown={(e) => {
            if ((e.key === "Enter" || e.key === " ") && !disabled && !atLimit) {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          onDragOver={(e) => {
            e.preventDefault();
            if (!disabled && !atLimit) setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-card px-4 py-6 text-center transition-colors",
            "hover:border-primary/50 hover:bg-muted/40",
            (disabled || atLimit) &&
              "cursor-not-allowed opacity-60 hover:border-border hover:bg-card",
            dragging && "border-primary bg-primary/5",
          )}
        >
          <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <UploadCloud className="size-5" aria-hidden="true" />
          </div>
          <div className="text-sm">
            <span className="font-medium text-foreground">
              {dragging ? "Drop files to upload" : "Drag & drop files here"}
            </span>{" "}
            <span className="text-muted-foreground">or click to browse</span>
          </div>
          <p className="text-xs text-muted-foreground">
            PDF, DOC, DOCX, or images · up to {maxFiles} files · 10 MB each
          </p>
          <input
            id={inputId}
            ref={inputRef}
            type="file"
            multiple
            accept={ACCEPT_ATTR}
            className="sr-only"
            disabled={disabled || atLimit}
            onChange={(e) => {
              if (e.target.files?.length) handleFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </div>
      )}

      <div className="space-y-2">
        <AnimatePresence initial={false}>
          {pending.map((p) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="rounded-lg border border-border bg-card p-2.5"
            >
              <div className="flex items-center gap-2.5">
                <FileIcon
                  className="size-4 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium text-foreground">
                      {p.name}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {p.error ? (
                        <span className="inline-flex items-center gap-1 text-destructive">
                          <AlertCircle className="size-3" aria-hidden="true" />
                          Failed
                        </span>
                      ) : p.progress >= 100 ? (
                        <Loader2
                          className="size-3 animate-spin"
                          aria-hidden="true"
                        />
                      ) : (
                        `${Math.round(p.progress)}%`
                      )}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        "h-full rounded-full transition-[width] duration-200",
                        p.error ? "bg-destructive" : "bg-primary",
                      )}
                      style={{ width: `${p.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {committed.map((file) => (
          <FileRow
            key={file.id}
            file={file}
            onRemove={disabled ? undefined : handleRemove}
            removing={remove.isPending}
          />
        ))}

        {listOnly && committed.length === 0 && pending.length === 0 && (
          <p className="py-2 text-center text-sm text-muted-foreground">
            No files attached.
          </p>
        )}
      </div>
    </div>
  );
}

function FileRow({
  file,
  onRemove,
  removing,
}: {
  file: FileAttachment;
  onRemove?: (id: string) => void;
  removing?: boolean;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      className="flex items-center gap-2.5 rounded-lg border border-border bg-card p-2.5"
    >
      <FileIcon
        className="size-4 shrink-0 text-muted-foreground"
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1">
        <a
          href={file.url}
          download={file.name}
          target="_blank"
          rel="noreferrer"
          className="block truncate text-sm font-medium text-foreground hover:underline"
          title={file.name}
        >
          {file.name}
        </a>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
          <span>{formatFileSize(file.size)}</span>
          <span aria-hidden="true">·</span>
          <span>{format(parseISO(file.uploadedAt), "MMM d, yyyy")}</span>
          <span aria-hidden="true">·</span>
          <span className="truncate">{file.uploadedBy}</span>
        </div>
      </div>
      <a
        href={file.url}
        download={file.name}
        target="_blank"
        rel="noreferrer"
        className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label={`Download ${file.name}`}
      >
        <Download className="size-3.5" aria-hidden="true" />
      </a>
      {onRemove && (
        <button
          type="button"
          onClick={() => onRemove(file.id)}
          disabled={removing}
          className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
          aria-label={`Remove ${file.name}`}
        >
          {removing ? (
            <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
          ) : (
            <X className="size-3.5" aria-hidden="true" />
          )}
        </button>
      )}
    </motion.div>
  );
}

/** Format bytes into a human-readable string (e.g. "1.2 MB"). */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[unit]}`;
}
