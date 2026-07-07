import { useForm, Controller, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { motion } from "motion/react";
import { Sparkles, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useRegulationList } from "@/hooks/queries/useRegulationQueries";
import { useAdminUsers } from "@/hooks/queries/useAdminQueries";
import { AIService } from "@/services";
import { cn } from "@/lib/utils";
import type { Regulation, UserProfile } from "@/types";

const FREQUENCIES = [
  "once",
  "monthly",
  "quarterly",
  "biannually",
  "annually",
] as const;

const schema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  businessUnit: z.string().min(1, "Business unit is required"),
  department: z.string().min(1, "Department is required"),
  location: z.string().min(1, "Location is required"),
  regulationId: z.string().min(1, "Select a regulation"),
  ownerId: z.string().min(1, "Select an owner"),
  approverId: z.string().min(1, "Select an approver"),
  reviewerIds: z.array(z.string()).default([]),
  frequency: z.enum(FREQUENCIES),
  dueDate: z.string().min(1, "Due date is required"),
  criticality: z.enum(["low", "medium", "high", "critical"] as const),
  penalty: z.string().min(1, "Penalty is required"),
  tags: z.string().optional(),
});

export type ComplianceFormValues = z.infer<typeof schema>;

export interface ComplianceFormProps {
  defaultValues?: Partial<ComplianceFormValues>;
  onSubmit: (
    values: ComplianceFormValues,
    selected: {
      regulation?: Pick<Regulation, "id" | "title">;
      owner?: Pick<UserProfile, "id" | "name">;
      approver?: Pick<UserProfile, "id" | "name">;
    },
  ) => void;
  isSubmitting?: boolean;
  submitLabel?: string;
  draftLabel?: string;
  onDraft?: (
    values: ComplianceFormValues,
    selected: {
      regulation?: Pick<Regulation, "id" | "title">;
      owner?: Pick<UserProfile, "id" | "name">;
      approver?: Pick<UserProfile, "id" | "name">;
    },
  ) => void;
  onCancel?: () => void;
  className?: string;
}

const selectClass =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 dark:bg-input/30";

export function ComplianceForm({
  defaultValues,
  onSubmit,
  isSubmitting,
  submitLabel = "Create Compliance",
  draftLabel = "Save as Draft",
  onDraft,
  onCancel,
  className,
}: ComplianceFormProps) {
  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ComplianceFormValues>({
    resolver: zodResolver(schema as never) as Resolver<ComplianceFormValues>,
    defaultValues: {
      frequency: "annually",
      criticality: "medium",
      reviewerIds: [],
      ...defaultValues,
    },
  });

  const { data: regulationsData, isPending: regulationsLoading } =
    useRegulationList({ pageSize: 200 });
  const { data: ownersData, isPending: ownersLoading } = useAdminUsers(1, 200, {
    role: "owner",
    status: "Active",
  });
  const { data: approversData, isPending: approversLoading } = useAdminUsers(
    1,
    200,
    { status: "Active" },
  );
  const { data: reviewersData, isPending: reviewersLoading } = useAdminUsers(
    1,
    200,
    { role: "reviewer", status: "Active" },
  );

  const regulations = regulationsData?.items ?? [];
  const owners = ownersData?.items ?? [];
  const approvers =
    approversData?.items?.filter(
      (u) => u.role === "approver" || u.role === "admin",
    ) ?? [];
  const reviewers = reviewersData?.items ?? [];

  const regulationId = watch("regulationId");
  const selectedRegulation = regulations.find((r) => r.id === regulationId);

  const aiMutation = useMutation({
    mutationFn: async () => {
      const message = selectedRegulation
        ? `Generate a concise compliance obligation description for regulation "${selectedRegulation.title}".`
        : "Generate a concise compliance obligation description.";
      const response = await AIService.copilotMessage(
        message,
        undefined,
        "compliance",
      );
      return response.content;
    },
    onSuccess: (content) => {
      setValue("description", content, { shouldValidate: true });
    },
  });

  const submit = (values: ComplianceFormValues) => {
    onSubmit(values, {
      regulation: selectedRegulation,
      owner: owners.find((u) => u.id === values.ownerId),
      approver: approvers.find((u) => u.id === values.approverId),
    });
  };

  const draft = (values: ComplianceFormValues) => {
    onDraft?.(values, {
      regulation: selectedRegulation,
      owner: owners.find((u) => u.id === values.ownerId),
      approver: approvers.find((u) => u.id === values.approverId),
    });
  };

  const isLoadingOptions =
    regulationsLoading || ownersLoading || approversLoading || reviewersLoading;

  return (
    <form
      onSubmit={handleSubmit(submit)}
      className={cn("space-y-6", className)}
    >
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
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

        <div className="space-y-2 md:col-span-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="description">Description</Label>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={() => aiMutation.mutate()}
              disabled={aiMutation.isPending || !selectedRegulation}
              className="gap-1 text-primary"
            >
              {aiMutation.isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Sparkles className="size-3.5" />
              )}
              Generate from regulation
            </Button>
          </div>
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

        <div className="space-y-2">
          <Label htmlFor="regulationId">Regulation</Label>
          <Controller
            name="regulationId"
            control={control}
            render={({ field }) => (
              <select
                id="regulationId"
                {...field}
                disabled={isLoadingOptions}
                className={selectClass}
              >
                <option value="">Select regulation</option>
                {regulations.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.title}
                  </option>
                ))}
              </select>
            )}
          />
          {errors.regulationId && (
            <p className="text-xs text-destructive">
              {errors.regulationId.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
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

        <div className="space-y-2">
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

        <div className="space-y-2">
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

        <div className="space-y-2">
          <Label htmlFor="ownerId">Owner</Label>
          <Controller
            name="ownerId"
            control={control}
            render={({ field }) => (
              <select
                id="ownerId"
                {...field}
                disabled={isLoadingOptions}
                className={selectClass}
              >
                <option value="">Select owner</option>
                {owners.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.email})
                  </option>
                ))}
              </select>
            )}
          />
          {errors.ownerId && (
            <p className="text-xs text-destructive">{errors.ownerId.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="approverId">Approver</Label>
          <Controller
            name="approverId"
            control={control}
            render={({ field }) => (
              <select
                id="approverId"
                {...field}
                disabled={isLoadingOptions}
                className={selectClass}
              >
                <option value="">Select approver</option>
                {approvers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.email})
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

        <div className="space-y-2 md:col-span-2">
          <Label>Reviewers</Label>
          <Controller
            name="reviewerIds"
            control={control}
            render={({ field }) => (
              <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                {reviewers.map((u) => {
                  const checked = field.value.includes(u.id);
                  return (
                    <label
                      key={u.id}
                      className="flex items-center gap-2 rounded-md border border-border bg-card p-2 text-sm"
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(checkedState) => {
                          const next = checkedState
                            ? [...field.value, u.id]
                            : field.value.filter((id) => id !== u.id);
                          field.onChange(next);
                        }}
                      />
                      <span className="truncate">{u.name}</span>
                    </label>
                  );
                })}
              </div>
            )}
          />
          {errors.reviewerIds && (
            <p className="text-xs text-destructive">
              {errors.reviewerIds.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="frequency">Frequency</Label>
          <Controller
            name="frequency"
            control={control}
            render={({ field }) => (
              <select id="frequency" {...field} className={selectClass}>
                {FREQUENCIES.map((f) => (
                  <option key={f} value={f}>
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </option>
                ))}
              </select>
            )}
          />
        </div>

        <div className="space-y-2">
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

        <div className="space-y-2">
          <Label htmlFor="criticality">Criticality</Label>
          <Controller
            name="criticality"
            control={control}
            render={({ field }) => (
              <select id="criticality" {...field} className={selectClass}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            )}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="penalty">Penalty</Label>
          <Input
            id="penalty"
            {...register("penalty")}
            aria-invalid={errors.penalty ? "true" : "false"}
          />
          {errors.penalty && (
            <p className="text-xs text-destructive">{errors.penalty.message}</p>
          )}
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="tags">Tags (comma separated)</Label>
          <Input
            id="tags"
            {...register("tags")}
            placeholder="aml, kyc, privacy"
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
            onClick={handleSubmit(draft)}
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
