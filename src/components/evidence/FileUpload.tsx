import { useCallback, useEffect, useRef, useState } from "react";
import { File, UploadCloud, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface FileUploadProps {
  onFilesChange?: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  maxSize?: number;
  className?: string;
}

interface FileUploadItem {
  file: File;
  id: string;
  progress: number;
  status: "uploading" | "completed" | "error";
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
}

function fileIcon(fileType: string) {
  const type = fileType.toLowerCase();
  if (type.includes("pdf") || type.includes("doc")) return File;
  if (type.includes("xls") || type.includes("csv")) return File;
  return File;
}

export function FileUpload({
  onFilesChange,
  accept,
  multiple = true,
  maxSize = 50 * 1024 * 1024,
  className,
}: FileUploadProps) {
  const [items, setItems] = useState<FileUploadItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const notifyChange = useCallback(
    (next: FileUploadItem[]) => {
      onFilesChange?.(next.map((i) => i.file));
    },
    [onFilesChange],
  );

  const addFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return;
      const accepted = Array.from(files).filter((f) => f.size <= maxSize);
      const next: FileUploadItem[] = accepted.map((file) => ({
        file,
        id: `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        progress: 0,
        status: "uploading",
      }));
      setItems((prev) => {
        const combined = multiple ? [...prev, ...next] : next;
        notifyChange(combined);
        return combined;
      });
    },
    [maxSize, multiple, notifyChange],
  );

  useEffect(() => {
    const timers: number[] = [];
    items.forEach((item) => {
      if (item.status !== "uploading") return;
      const interval = window.setInterval(() => {
        setItems((prev) => {
          const target = prev.find((i) => i.id === item.id);
          if (!target || target.status !== "uploading") return prev;
          const nextProgress = Math.min(
            target.progress + Math.random() * 12,
            100,
          );
          const next = prev.map((i) =>
            i.id === item.id
              ? ({
                  ...i,
                  progress: nextProgress,
                  status: nextProgress >= 100 ? "completed" : "uploading",
                } satisfies FileUploadItem)
              : i,
          );
          notifyChange(next);
          return next;
        });
      }, 200);
      timers.push(interval);
    });
    return () => {
      timers.forEach((t) => window.clearInterval(t));
    };
  }, [items, notifyChange]);

  const removeItem = (id: string) => {
    setItems((prev) => {
      const next = prev.filter((i) => i.id !== id);
      notifyChange(next);
      return next;
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    addFiles(e.target.files);
    e.target.value = "";
  };

  return (
    <div className={cn("space-y-3", className)}>
      <motion.div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        animate={{
          scale: isDragging ? 1.02 : 1,
          borderColor: isDragging ? "var(--primary)" : "var(--border)",
          backgroundColor: isDragging ? "var(--primary) / 0.05" : "transparent",
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border p-8 text-center transition-colors",
          isDragging && "border-primary bg-primary/5",
        )}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            inputRef.current?.click();
          }
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="sr-only"
          onChange={handleInputChange}
        />
        <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <UploadCloud className="size-6" aria-hidden="true" />
        </div>
        <p className="mt-3 text-sm font-medium text-foreground">
          Click or drag files to upload
        </p>
        <p className="text-xs text-muted-foreground">
          {multiple ? "Multiple files supported" : "Single file only"} · Max{" "}
          {formatBytes(maxSize)}
        </p>
      </motion.div>

      <AnimatePresence>
        {items.map((item) => {
          const Icon = fileIcon(item.file.type);
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
            >
              <div className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <Icon className="size-5" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium text-foreground">
                    {item.file.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                    aria-label={`Remove ${item.file.name}`}
                  >
                    <X className="size-4" aria-hidden="true" />
                  </button>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{formatBytes(item.file.size)}</span>
                  <span>·</span>
                  <span className="capitalize">
                    {item.status.replace("_", " ")}
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <motion.div
                    className={cn(
                      "h-full rounded-full",
                      item.status === "error"
                        ? "bg-red-500"
                        : item.status === "completed"
                          ? "bg-emerald-500"
                          : "bg-primary",
                    )}
                    initial={{ width: 0 }}
                    animate={{ width: `${item.progress}%` }}
                    transition={{ duration: 0.2 }}
                  />
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {items.length > 0 && (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="xs"
            onClick={() => {
              setItems([]);
              notifyChange([]);
            }}
          >
            Clear all
          </Button>
        </div>
      )}
    </div>
  );
}
