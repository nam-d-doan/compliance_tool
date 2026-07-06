import { useState, useEffect } from "react";
import { useForm, Controller, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "motion/react";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PRIORITY_LEVELS } from "@/constants/status";

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
  linkedComplianceId: z.string().optional(),
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
  complianceOptions: { id: string; title: string }[];
  optionsLoading?: boolean;
  onSubmit: (values: CAPFormValues) => void;
  onDraft?: (values: CAPFormValues) => void;
  isSubmitting?: boolean;
  submitLabel?: string;
  draftLabel?: string;
  onCancel?: () => void;
  className?: string;
}

const selectClass =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 dark:bg-input/30";

export function CAPForm({
  defaultValues,
  draftValues,
  highlightKey,
  ownerOptions,
  approverOptions,
  complianceOptions,
  optionsLoading,
  onSubmit,
  onDraft,
  isSubmitting,
  submitLabel = "Create CAP",
  draftLabel = "Save as Draft",
  onCancel,
  className,
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

        <div className={cn("space-y-2", highlightClass)}>
          <Label htmlFor="linkedComplianceId">Linked Compliance</Label>
          <Controller
            name="linkedComplianceId"
            control={control}
            render={({ field }) => (
              <select
                id="linkedComplianceId"
                {...field}
                disabled={optionsLoading}
                className={selectClass}
              >
                <option value="">None</option>
                {complianceOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            )}
          />
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
        {onDraft && (
          <Button
            type="button"
            variant="secondary"
            onClick={handleSubmit(onDraft)}
            disabled={isSubmitting}
          >
            {draftLabel}
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
