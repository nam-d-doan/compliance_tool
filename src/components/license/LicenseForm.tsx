import { useState } from "react";
import { useForm, Controller, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "motion/react";
import { Loader2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAdminUsers } from "@/hooks/queries/useAdminQueries";
import { useRegulationList } from "@/hooks/queries/useRegulationQueries";
import { cn } from "@/lib/utils";
import type { Regulation, UserProfile } from "@/types";

const RENEWAL_CYCLES = [
  "Annual",
  "Biennial",
  "Triennial",
  "Quinquennial",
] as const;
const CRITICALITIES = ["low", "medium", "high", "critical"] as const;

const schema = z
  .object({
    licenseName: z
      .string()
      .min(2, "License name must be at least 2 characters"),
    licenseNumber: z.string().min(1, "License number is required"),
    issuingAuthority: z.string().min(1, "Issuing authority is required"),
    department: z.string().min(1, "Department is required"),
    businessUnit: z.string().min(1, "Business unit is required"),
    country: z.string().min(1, "Country is required"),
    location: z.string().min(1, "Location is required"),
    issueDate: z.string().min(1, "Issue date is required"),
    expiryDate: z.string().min(1, "Expiry date is required"),
    renewalCycle: z.enum(RENEWAL_CYCLES),
    ownerId: z.string().min(1, "Select an owner"),
    approverId: z.string().min(1, "Select an approver"),
    criticality: z.enum(CRITICALITIES),
    regulationId: z.string().min(1, "Select a regulation"),
    tags: z.array(z.string()).default([]),
  })
  .refine((data) => new Date(data.expiryDate) > new Date(data.issueDate), {
    message: "Expiry date must be after issue date",
    path: ["expiryDate"],
  });

export type LicenseFormValues = z.infer<typeof schema>;

export interface LicenseFormProps {
  defaultValues?: Partial<LicenseFormValues>;
  onSubmit: (
    values: LicenseFormValues,
    selected: {
      regulation?: Pick<Regulation, "id" | "title" | "reference">;
      owner?: Pick<UserProfile, "id" | "name">;
      approver?: Pick<UserProfile, "id" | "name">;
    },
  ) => void;
  onDraft?: (
    values: LicenseFormValues,
    selected: {
      regulation?: Pick<Regulation, "id" | "title" | "reference">;
      owner?: Pick<UserProfile, "id" | "name">;
      approver?: Pick<UserProfile, "id" | "name">;
    },
  ) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
  submitLabel?: string;
  draftLabel?: string;
  className?: string;
}

const selectClass =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 dark:bg-input/30";

export function LicenseForm({
  defaultValues,
  onSubmit,
  onDraft,
  onCancel,
  isSubmitting,
  submitLabel = "Create License",
  draftLabel = "Save as Draft",
  className,
}: LicenseFormProps) {
  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<LicenseFormValues>({
    resolver: zodResolver(schema as never) as Resolver<LicenseFormValues>,
    defaultValues: {
      renewalCycle: "Annual",
      criticality: "medium",
      tags: [],
      ...defaultValues,
    },
  });

  const { data: usersData, isPending: usersLoading } = useAdminUsers(1, 200, {
    status: "Active",
  });
  const { data: regulationsData, isPending: regulationsLoading } =
    useRegulationList({ status: "Published", pageSize: 200 });

  const users = usersData?.items ?? [];
  const regulations = regulationsData?.items ?? [];
  const owners = users.filter((u) => u.role === "owner" || u.role === "admin");
  const approvers = users.filter(
    (u) => u.role === "approver" || u.role === "admin",
  );

  const regulationId = watch("regulationId");
  const ownerId = watch("ownerId");
  const approverId = watch("approverId");
  const tags = watch("tags");

  const selectedRegulation = regulations.find((r) => r.id === regulationId);
  const selectedOwner = users.find((u) => u.id === ownerId);
  const selectedApprover = users.find((u) => u.id === approverId);

  const [tagInput, setTagInput] = useState("");

  const addTag = (raw: string) => {
    const value = raw.replace(/,/g, "").trim().toLowerCase();
    if (!value) return;
    if (!tags.includes(value)) {
      setValue("tags", [...tags, value], { shouldValidate: true });
    }
    setTagInput("");
  };

  const removeTag = (value: string) => {
    setValue(
      "tags",
      tags.filter((t) => t !== value),
      { shouldValidate: true },
    );
  };

  const submit = (values: LicenseFormValues) => {
    onSubmit(values, {
      regulation: selectedRegulation,
      owner: selectedOwner,
      approver: selectedApprover,
    });
  };

  const draft = (values: LicenseFormValues) => {
    onDraft?.(values, {
      regulation: selectedRegulation,
      owner: selectedOwner,
      approver: selectedApprover,
    });
  };

  return (
    <form
      onSubmit={handleSubmit(submit)}
      className={cn("space-y-6", className)}
    >
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="licenseName">License Name</Label>
          <Input
            id="licenseName"
            {...register("licenseName")}
            aria-invalid={errors.licenseName ? "true" : "false"}
          />
          {errors.licenseName && (
            <p className="text-xs text-destructive">
              {errors.licenseName.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="licenseNumber">License Number</Label>
          <Input
            id="licenseNumber"
            {...register("licenseNumber")}
            aria-invalid={errors.licenseNumber ? "true" : "false"}
          />
          {errors.licenseNumber && (
            <p className="text-xs text-destructive">
              {errors.licenseNumber.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="issuingAuthority">Issuing Authority</Label>
          <Input
            id="issuingAuthority"
            {...register("issuingAuthority")}
            aria-invalid={errors.issuingAuthority ? "true" : "false"}
          />
          {errors.issuingAuthority && (
            <p className="text-xs text-destructive">
              {errors.issuingAuthority.message}
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
          <Label htmlFor="country">Country</Label>
          <Input
            id="country"
            {...register("country")}
            aria-invalid={errors.country ? "true" : "false"}
          />
          {errors.country && (
            <p className="text-xs text-destructive">{errors.country.message}</p>
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
          <Label htmlFor="regulationId">Linked Regulation</Label>
          <Controller
            name="regulationId"
            control={control}
            render={({ field }) => (
              <select
                id="regulationId"
                {...field}
                disabled={regulationsLoading}
                className={selectClass}
              >
                <option value="">Select regulation</option>
                {regulations.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.reference} - {r.title}
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
          <Label htmlFor="ownerId">Owner</Label>
          <Controller
            name="ownerId"
            control={control}
            render={({ field }) => (
              <select
                id="ownerId"
                {...field}
                disabled={usersLoading}
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
                disabled={usersLoading}
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

        <div className="space-y-2">
          <Label htmlFor="issueDate">Issue Date</Label>
          <Input
            id="issueDate"
            type="date"
            {...register("issueDate")}
            aria-invalid={errors.issueDate ? "true" : "false"}
          />
          {errors.issueDate && (
            <p className="text-xs text-destructive">
              {errors.issueDate.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="expiryDate">Expiry Date</Label>
          <Input
            id="expiryDate"
            type="date"
            {...register("expiryDate")}
            aria-invalid={errors.expiryDate ? "true" : "false"}
          />
          {errors.expiryDate && (
            <p className="text-xs text-destructive">
              {errors.expiryDate.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="renewalCycle">Renewal Cycle</Label>
          <Controller
            name="renewalCycle"
            control={control}
            render={({ field }) => (
              <select id="renewalCycle" {...field} className={selectClass}>
                {RENEWAL_CYCLES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            )}
          />
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

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="tags">Tags</Label>
          <div className="space-y-2">
            <Input
              id="tags"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === ",") {
                  e.preventDefault();
                  addTag(tagInput);
                }
              }}
              placeholder="Type a tag and press Enter"
              disabled={isSubmitting}
            />
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs text-secondary-foreground"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="rounded-full p-0.5 hover:bg-secondary-foreground/10"
                    aria-label={`Remove ${tag}`}
                  >
                    <X className="size-3" aria-hidden="true" />
                  </button>
                </span>
              ))}
            </div>
          </div>
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
