import { useForm, Controller, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, addDays } from "date-fns";
import { Loader2, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileUploadComponent } from "@/components/cap/FileUploadComponent";
import { useOrgUnits, useAdminUsers } from "@/hooks/queries/useAdminQueries";
import { PRIORITY_LEVELS } from "@/constants/status";
import type { FileAttachment } from "@/types";

const selectClass =
  "h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 dark:bg-input/30";

const nccSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(1, "Description is required"),
  severity: z.enum([...PRIORITY_LEVELS] as [string, ...string[]]),
  ownerUnitId: z.string().min(1, "Owner unit is required"),
  ownerId: z.string().min(1, "Owner is required"),
  dueDate: z.string().min(1, "Due date is required"),
  linkedDocs: z.string().optional(),
  tags: z.string().optional(),
});

export type NCCFormValues = z.infer<typeof nccSchema>;

export interface NCCFormProps {
  defaultValues?: Partial<NCCFormValues>;
  onSubmit: (values: NCCFormValues) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
  submitLabel?: string;
  /** Files uploaded while filling out the form (orphan until the NCC exists). */
  files?: FileAttachment[];
  onFilesChange?: (files: FileAttachment[]) => void;
  uploadedBy?: string;
  uploadedById?: string;
  /** When editing, disable the owner unit select (owner unit shouldn't change after creation). */
  lockOwnerUnit?: boolean;
}

export function NCCForm({
  defaultValues,
  onSubmit,
  onCancel,
  isSubmitting,
  submitLabel = "Create Case",
  files,
  onFilesChange,
  uploadedBy,
  uploadedById,
  lockOwnerUnit = false,
}: NCCFormProps) {
  const orgUnitsQuery = useOrgUnits();
  const usersQuery = useAdminUsers(1, 200, { status: "Active" });

  const hoDepartments = orgUnitsQuery.data?.hoDepartments ?? [];
  const branches = orgUnitsQuery.data?.branches ?? [];
  const users = usersQuery.data?.items ?? [];

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<NCCFormValues>({
    resolver: zodResolver(nccSchema as never) as Resolver<NCCFormValues>,
    defaultValues: {
      severity: "medium",
      dueDate: format(addDays(new Date(), 30), "yyyy-MM-dd"),
      tags: "",
      linkedDocs: "",
      ...defaultValues,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="ncc-title">Title</Label>
          <Input
            id="ncc-title"
            {...register("title")}
            aria-invalid={errors.title ? "true" : "false"}
          />
          {errors.title && (
            <p className="text-xs text-destructive">{errors.title.message}</p>
          )}
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="ncc-description">Description</Label>
          <Textarea
            id="ncc-description"
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

        <div className="space-y-2">
          <Label htmlFor="ncc-severity">Severity</Label>
          <Controller
            name="severity"
            control={control}
            render={({ field }) => (
              <select id="ncc-severity" {...field} className={selectClass}>
                {PRIORITY_LEVELS.map((p) => (
                  <option key={p} value={p}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </option>
                ))}
              </select>
            )}
          />
          {errors.severity && (
            <p className="text-xs text-destructive">
              {errors.severity.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="ncc-dueDate">Due Date</Label>
          <Input
            id="ncc-dueDate"
            type="date"
            {...register("dueDate")}
            aria-invalid={errors.dueDate ? "true" : "false"}
          />
          {errors.dueDate && (
            <p className="text-xs text-destructive">
              {errors.dueDate.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="ncc-ownerUnitId">Owner Unit</Label>
          <Controller
            name="ownerUnitId"
            control={control}
            render={({ field }) => (
              <select
                id="ncc-ownerUnitId"
                {...field}
                disabled={lockOwnerUnit || orgUnitsQuery.isPending}
                className={selectClass}
              >
                <option value="">Select owner unit</option>
                {hoDepartments.length > 0 && (
                  <optgroup label="HO Departments">
                    {hoDepartments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </optgroup>
                )}
                {branches.length > 0 && (
                  <optgroup label="Branches">
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.region})
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            )}
          />
          {errors.ownerUnitId && (
            <p className="text-xs text-destructive">
              {errors.ownerUnitId.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="ncc-ownerId">Owner</Label>
          <Controller
            name="ownerId"
            control={control}
            render={({ field }) => (
              <select
                id="ncc-ownerId"
                {...field}
                disabled={usersQuery.isPending}
                className={selectClass}
              >
                <option value="">Select owner</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            )}
          />
          {errors.ownerId && (
            <p className="text-xs text-destructive">
              {errors.ownerId.message}
            </p>
          )}
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="ncc-linkedDocs">Linked Docs</Label>
          <Input
            id="ncc-linkedDocs"
            {...register("linkedDocs")}
            placeholder="URLs or descriptions of linked documents/reports"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="ncc-tags">Tags (comma separated)</Label>
          <Input
            id="ncc-tags"
            {...register("tags")}
            placeholder="Comma-separated tags"
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
            Files upload immediately. They will be linked to the case once it is
            created.
          </p>
          <FileUploadComponent
            files={files ?? []}
            onFilesChange={onFilesChange}
            uploadedBy={uploadedBy}
            uploadedById={uploadedById}
            disabled={isSubmitting}
          />
        </div>
      )}

      <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
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
      </div>
    </form>
  );
}
