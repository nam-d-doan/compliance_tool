import { useForm, Controller, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, addDays } from "date-fns";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useOrgUnits, useAdminUsers } from "@/hooks/queries/useAdminQueries";
import { PRIORITY_LEVELS } from "@/constants/status";
import {
  ISSUE_SOURCES,
  ISSUE_SOURCE_LABELS,
  VIOLATION_CATEGORIES,
} from "@/lib/cms-rules";

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
  source: z.string().min(1, "Source is required"),
  sourceRef: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  regulationRef: z.string().optional(),
});

export type NCCFormValues = z.infer<typeof nccSchema>;

export interface NCCFormProps {
  defaultValues?: Partial<NCCFormValues>;
  onSubmit: (values: NCCFormValues) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
  submitLabel?: string;
  /** When editing, disable the owner unit select (owner unit shouldn't change after creation). */
  lockOwnerUnit?: boolean;
  /** Extra content rendered above the buttons (e.g. the risk rating panel). */
  children?: React.ReactNode;
}

export function NCCForm({
  defaultValues,
  onSubmit,
  onCancel,
  isSubmitting,
  submitLabel = "Create Case",
  lockOwnerUnit = false,
  children,
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
      source: "compliance_monitoring",
      category: "",
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
          <Label htmlFor="ncc-source">Source</Label>
          <Controller
            name="source"
            control={control}
            render={({ field }) => (
              <select id="ncc-source" {...field} className={selectClass}>
                {ISSUE_SOURCES.map((src) => (
                  <option key={src} value={src}>
                    {ISSUE_SOURCE_LABELS[src]}
                  </option>
                ))}
              </select>
            )}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="ncc-sourceRef">Source reference</Label>
          <Input
            id="ncc-sourceRef"
            {...register("sourceRef")}
            placeholder="e.g. KL 145/KL-TTGSNH, BC KTNB 22/2026"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="ncc-category">Issue category</Label>
          <Controller
            name="category"
            control={control}
            render={({ field }) => (
              <select id="ncc-category" {...field} className={selectClass}>
                <option value="">Select from the violation catalog</option>
                {VIOLATION_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            )}
          />
          {errors.category && (
            <p className="text-xs text-destructive">
              {errors.category.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="ncc-regulationRef">Linked law / QĐNB article</Label>
          <Input
            id="ncc-regulationRef"
            {...register("regulationRef")}
            placeholder="e.g. QĐ 0950/2024/QĐ-TGĐ – Bước 2"
          />
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
            <p className="text-xs text-destructive">{errors.dueDate.message}</p>
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
            <p className="text-xs text-destructive">{errors.ownerId.message}</p>
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

      {children}

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
