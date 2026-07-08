import { useState, useEffect, useMemo, useRef } from "react";
import { useForm, Controller, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "motion/react";
import { Loader2, X, ChevronDown, Check, Paperclip } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { PRIORITY_LEVELS } from "@/constants/status";
import {
  FileUploadComponent,
  type FileUploadComponentProps,
} from "@/components/cap/FileUploadComponent";
import type { FileAttachment } from "@/types";

const schema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  priority: z.enum(["low", "medium", "high", "critical"] as const),
  ownerId: z.string().min(1, "Select an owner"),
  approverId: z.string().min(1, "Select an approver"),
  department: z.string().min(1, "Department is required"),
  businessUnit: z.string().min(1, "Business unit is required"),
  location: z.string().min(1, "Location is required"),
  dueDate: z.string().min(1, "Due date is required"),
  obligationIds: z.array(z.string()).min(1, "Link at least one obligation"),
  rootCause: z.string().min(5, "Root cause is required"),
  estimatedCost: z.coerce.number().min(0, "Estimated cost must be 0 or more"),
  tags: z.string().optional(),
});

export type CAPFormValues = z.infer<typeof schema>;

export interface CAPFormProps {
  defaultValues?: Partial<CAPFormValues>;
  draftValues?: Partial<CAPFormValues>;
  highlightKey?: number;
  ownerOptions: { id: string; name: string; email?: string }[];
  approverOptions: { id: string; name: string; email?: string }[];
  obligationOptions: { id: string; title: string }[];
  optionsLoading?: boolean;
  onSubmit: (values: CAPFormValues) => void;
  isSubmitting?: boolean;
  submitLabel?: string;
  onCancel?: () => void;
  className?: string;
  /** Attachments. When `onFilesChange` is provided a file upload section is
   *  rendered. Omit both to hide the section (e.g. on the edit sheet, where
   *  files are managed from the detail page's Files tab). */
  files?: FileAttachment[];
  onFilesChange?: (files: FileAttachment[]) => void;
  capId?: string;
  uploadedBy?: string;
  uploadedById?: string;
  fileUploadProps?: Partial<
    Omit<FileUploadComponentProps, "files" | "onFilesChange" | "capId">
  >;
}

const selectClass =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 dark:bg-input/30";

export function CAPForm({
  defaultValues,
  draftValues,
  highlightKey,
  ownerOptions,
  approverOptions,
  obligationOptions,
  optionsLoading,
  onSubmit,
  isSubmitting,
  submitLabel = "Create CAP",
  onCancel,
  className,
  files,
  onFilesChange,
  capId,
  uploadedBy,
  uploadedById,
  fileUploadProps,
}: CAPFormProps) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CAPFormValues>({
    resolver: zodResolver(schema as never) as Resolver<CAPFormValues>,
    defaultValues: {
      priority: "medium",
      estimatedCost: 0,
      tags: "",
      obligationIds: [],
      ...defaultValues,
    },
  });

  const [highlighted, setHighlighted] = useState(false);

  useEffect(() => {
    if (draftValues) {
      reset((prev) => ({ ...prev, ...draftValues }));
    }
  }, [draftValues, reset]);

  useEffect(() => {
    if (highlightKey === undefined) return;
    setHighlighted(true);
    const timer = setTimeout(() => setHighlighted(false), 1200);
    return () => clearTimeout(timer);
  }, [highlightKey]);

  const highlightClass = highlighted
    ? "ring-2 ring-primary/40 rounded-lg transition-shadow"
    : "";

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={cn("space-y-5", className)}
    >
      <div className="grid gap-5 md:grid-cols-2">
        <div className={cn("space-y-2 md:col-span-2", highlightClass)}>
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            {...register("title")}
            aria-invalid={errors.title ? "true" : "false"}
          />
          {errors.title && (
            <p className="text-xs text-destructive">{errors.title.message}</p>
          )}
        </div>

        <div className={cn("space-y-2 md:col-span-2", highlightClass)}>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            {...register("description")}
            className="min-h-[6rem]"
            aria-invalid={errors.description ? "true" : "false"}
          />
          {errors.description && (
            <p className="text-xs text-destructive">
              {errors.description.message}
            </p>
          )}
        </div>

        <div className={cn("space-y-2", highlightClass)}>
          <Label htmlFor="priority">Priority</Label>
          <Controller
            name="priority"
            control={control}
            render={({ field }) => (
              <select id="priority" {...field} className={selectClass}>
                {PRIORITY_LEVELS.map((p) => (
                  <option key={p} value={p}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </option>
                ))}
              </select>
            )}
          />
          {errors.priority && (
            <p className="text-xs text-destructive">
              {errors.priority.message}
            </p>
          )}
        </div>

        <div className={cn("space-y-2", highlightClass)}>
          <Label htmlFor="dueDate">Due Date</Label>
          <Input
            id="dueDate"
            type="date"
            {...register("dueDate")}
            aria-invalid={errors.dueDate ? "true" : "false"}
          />
          {errors.dueDate && (
            <p className="text-xs text-destructive">{errors.dueDate.message}</p>
          )}
        </div>

        <div className={cn("space-y-2", highlightClass)}>
          <Label htmlFor="ownerId">Owner</Label>
          <Controller
            name="ownerId"
            control={control}
            render={({ field }) => (
              <select
                id="ownerId"
                {...field}
                disabled={optionsLoading}
                className={selectClass}
              >
                <option value="">Select owner</option>
                {ownerOptions.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} {u.email ? `(${u.email})` : ""}
                  </option>
                ))}
              </select>
            )}
          />
          {errors.ownerId && (
            <p className="text-xs text-destructive">{errors.ownerId.message}</p>
          )}
        </div>

        <div className={cn("space-y-2", highlightClass)}>
          <Label htmlFor="approverId">Approver</Label>
          <Controller
            name="approverId"
            control={control}
            render={({ field }) => (
              <select
                id="approverId"
                {...field}
                disabled={optionsLoading}
                className={selectClass}
              >
                <option value="">Select approver</option>
                {approverOptions.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} {u.email ? `(${u.email})` : ""}
                  </option>
                ))}
              </select>
            )}
          />
          {errors.approverId && (
            <p className="text-xs text-destructive">
              {errors.approverId.message}
            </p>
          )}
        </div>

        <div className={cn("space-y-2", highlightClass)}>
          <Label htmlFor="department">Department</Label>
          <Input
            id="department"
            {...register("department")}
            aria-invalid={errors.department ? "true" : "false"}
          />
          {errors.department && (
            <p className="text-xs text-destructive">
              {errors.department.message}
            </p>
          )}
        </div>

        <div className={cn("space-y-2", highlightClass)}>
          <Label htmlFor="businessUnit">Business Unit</Label>
          <Input
            id="businessUnit"
            {...register("businessUnit")}
            aria-invalid={errors.businessUnit ? "true" : "false"}
          />
          {errors.businessUnit && (
            <p className="text-xs text-destructive">
              {errors.businessUnit.message}
            </p>
          )}
        </div>

        <div className={cn("space-y-2", highlightClass)}>
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            {...register("location")}
            aria-invalid={errors.location ? "true" : "false"}
          />
          {errors.location && (
            <p className="text-xs text-destructive">
              {errors.location.message}
            </p>
          )}
        </div>

        <div className={cn("space-y-2 md:col-span-2", highlightClass)}>
          <Label htmlFor="obligationIds">
            Linked Obligations <span className="text-destructive">*</span>
          </Label>
          <Controller
            name="obligationIds"
            control={control}
            render={({ field }) => (
              <ObligationMultiSelect
                id="obligationIds"
                options={obligationOptions}
                selected={field.value ?? []}
                onChange={field.onChange}
                disabled={optionsLoading}
              />
            )}
          />
          {errors.obligationIds && (
            <p className="text-xs text-destructive">
              {typeof errors.obligationIds.message === "string"
                ? errors.obligationIds.message
                : "Link at least one obligation"}
            </p>
          )}
        </div>

        <div className={cn("space-y-2 md:col-span-2", highlightClass)}>
          <Label htmlFor="rootCause">Root Cause</Label>
          <Textarea
            id="rootCause"
            {...register("rootCause")}
            className="min-h-[5rem]"
            aria-invalid={errors.rootCause ? "true" : "false"}
          />
          {errors.rootCause && (
            <p className="text-xs text-destructive">
              {errors.rootCause.message}
            </p>
          )}
        </div>

        <div className={cn("space-y-2", highlightClass)}>
          <Label htmlFor="estimatedCost">Estimated Cost (USD)</Label>
          <Input
            id="estimatedCost"
            type="number"
            min={0}
            {...register("estimatedCost")}
            aria-invalid={errors.estimatedCost ? "true" : "false"}
          />
          {errors.estimatedCost && (
            <p className="text-xs text-destructive">
              {errors.estimatedCost.message}
            </p>
          )}
        </div>

        <div className={cn("space-y-2", highlightClass)}>
          <Label htmlFor="tags">Tags (comma separated)</Label>
          <Input
            id="tags"
            {...register("tags")}
            placeholder="aml, remediation, training"
          />
        </div>
      </div>

      {onFilesChange && (
        <div className="space-y-2">
          <Label className="flex items-center gap-1.5">
            <Paperclip className="size-3.5" aria-hidden="true" />
            Attachments
          </Label>
          <p className="text-xs text-muted-foreground">
            {capId
              ? "Upload supporting evidence or remediation documents."
              : "Files upload immediately. They will be linked to the CAP once it is created."}
          </p>
          <FileUploadComponent
            files={files ?? []}
            onFilesChange={onFilesChange}
            capId={capId}
            uploadedBy={uploadedBy}
            uploadedById={uploadedById}
            disabled={isSubmitting}
            {...fileUploadProps}
          />
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-center justify-end gap-2 pt-2"
      >
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          )}
          {submitLabel}
        </Button>
      </motion.div>
    </form>
  );
}

/**
 * Compact tag-style multi-select for linking CAPs to obligations.
 * Shows selected items as removable chips; a filterable dropdown lists the rest.
 */
function ObligationMultiSelect({
  id,
  options,
  selected,
  onChange,
  disabled,
}: {
  id: string;
  options: { id: string; title: string }[];
  selected: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const selectedItems = useMemo(
    () =>
      selected
        .map((sid) => options.find((o) => o.id === sid))
        .filter((o): o is { id: string; title: string } => Boolean(o)),
    [selected, options],
  );

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    const base = term
      ? options.filter((o) => o.title.toLowerCase().includes(term))
      : options;
    return base.slice(0, 100);
  }, [options, query]);

  const toggle = (oid: string) => {
    onChange(
      selectedSet.has(oid)
        ? selected.filter((s) => s !== oid)
        : [...selected, oid],
    );
  };

  return (
    <div ref={containerRef} className="relative">
      <div
        className={cn(
          "flex min-h-8 flex-wrap items-center gap-1 rounded-lg border border-input bg-transparent px-2 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 dark:bg-input/30",
        )}
      >
        {selectedItems.length === 0 && (
          <span className="text-muted-foreground">
            {disabled ? "Loading…" : "Select obligations…"}
          </span>
        )}
        {selectedItems.map((o) => (
          <Badge key={o.id} variant="secondary" className="gap-1 pr-1 text-xs">
            <span className="max-w-[16rem] truncate">{o.title}</span>
            <button
              type="button"
              onClick={() => toggle(o.id)}
              className="rounded-sm hover:bg-foreground/10"
              aria-label={`Remove ${o.title}`}
            >
              <X className="size-3" aria-hidden="true" />
            </button>
          </Badge>
        ))}
        <button
          type="button"
          id={id}
          onClick={() => setOpen((v) => !v)}
          disabled={disabled}
          className="ml-auto inline-flex items-center text-muted-foreground"
          aria-label="Toggle obligation list"
          aria-expanded={open}
        >
          <ChevronDown className="size-4" aria-hidden="true" />
        </button>
      </div>

      {open && (
        <div className="absolute z-30 mt-1 w-full rounded-lg border border-border bg-popover p-2 shadow-md">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search obligations…"
            className="h-8"
          />
          <div className="mt-1 max-h-52 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-2 py-3 text-center text-xs text-muted-foreground">
                No obligations found.
              </p>
            ) : (
              <ul className="space-y-0.5">
                {filtered.map((o) => {
                  const checked = selectedSet.has(o.id);
                  return (
                    <li key={o.id}>
                      <button
                        type="button"
                        onClick={() => toggle(o.id)}
                        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent"
                      >
                        <span
                          className={cn(
                            "flex size-4 shrink-0 items-center justify-center rounded border",
                            checked
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-input",
                          )}
                        >
                          {checked && (
                            <Check className="size-3" aria-hidden="true" />
                          )}
                        </span>
                        <span className="truncate">{o.title}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
