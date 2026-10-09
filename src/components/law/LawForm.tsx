/**
 * PSEUDO CODE (ngắn gọn) — form tạo/sửa yêu cầu tư vấn, khuôn theo LMForm.
 * 1. zod validate các field bắt buộc theo CreateAdviceRequestInput.
 * 2. requestingUnitId lấy từ useOrgUnits (hoDepartments) — giống LM.
 * 3. ownerId lọc role=owner, managerId lọc role=executive — tái dùng y
 *    hệt phân quyền đã chốt cho LM (xem docs/law/00-decisions.md mục 2).
 */
import { useForm, Controller, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useOrgUnits, useAdminUsers } from "@/hooks/queries/useAdminQueries";
import { LAW_PRIORITY_TIERS, LAW_PRIORITY_STYLES } from "@/constants/law";
import { useL, useTerm } from "@/lib/i18n";

const selectClass =
  "h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 dark:bg-input/30";

const lawSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  priorityTier: z.enum([...LAW_PRIORITY_TIERS] as [string, ...string[]]),
  requestingUnitId: z.string().min(1, "Requesting unit is required"),
  ownerId: z.string().min(1, "Assigned specialist is required"),
  managerId: z.string().min(1, "Manager is required"),
  tags: z.string().optional(),
});

export type LawFormValues = z.infer<typeof lawSchema>;

export interface LawFormProps {
  defaultValues?: Partial<LawFormValues>;
  onSubmit: (values: LawFormValues) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
  submitLabel?: string;
}

export function LawForm({
  defaultValues,
  onSubmit,
  onCancel,
  isSubmitting,
  submitLabel,
}: LawFormProps) {
  const L = useL();
  const term = useTerm();
  submitLabel ??= L("Create Request", "Tạo yêu cầu");
  const orgUnitsQuery = useOrgUnits();
  // Không lọc status: "Active" — xem comment cùng chỗ ở LMForm.tsx.
  const ownersQuery = useAdminUsers(1, 200, { role: "owner" });
  const managersQuery = useAdminUsers(1, 200, { role: "executive" });

  const hoDepartments = orgUnitsQuery.data?.hoDepartments ?? [];
  const owners = ownersQuery.data?.items ?? [];
  const managers = managersQuery.data?.items ?? [];

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LawFormValues>({
    resolver: zodResolver(lawSchema as never) as Resolver<LawFormValues>,
    defaultValues: {
      priorityTier: "internal",
      tags: "",
      ...defaultValues,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="law-title">{L("Title", "Tiêu đề")}</Label>
          <Input
            id="law-title"
            {...register("title")}
            aria-invalid={errors.title ? "true" : "false"}
          />
          {errors.title && (
            <p className="text-xs text-destructive">{term(errors.title.message ?? "")}</p>
          )}
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="law-description">{L("Description", "Mô tả")}</Label>
          <Textarea
            id="law-description"
            {...register("description")}
            className="min-h-[5rem]"
            placeholder={L("What legal advice is being requested?", "Cần tư vấn pháp lý về vấn đề gì?")}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="law-priorityTier">{L("Priority", "Mức ưu tiên")}</Label>
          <Controller
            name="priorityTier"
            control={control}
            render={({ field }) => (
              <select id="law-priorityTier" {...field} className={selectClass}>
                {LAW_PRIORITY_TIERS.map((t) => (
                  <option key={t} value={t}>
                    {term(LAW_PRIORITY_STYLES[t].label)}
                  </option>
                ))}
              </select>
            )}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="law-requestingUnitId">{L("Requesting Unit", "Đơn vị yêu cầu")}</Label>
          <Controller
            name="requestingUnitId"
            control={control}
            render={({ field }) => (
              <select
                id="law-requestingUnitId"
                {...field}
                disabled={orgUnitsQuery.isPending}
                className={selectClass}
              >
                <option value="">{L("Select unit", "Chọn đơn vị")}</option>
                {hoDepartments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            )}
          />
          {errors.requestingUnitId && (
            <p className="text-xs text-destructive">
              {term(errors.requestingUnitId.message ?? "")}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="law-ownerId">{L("Assigned Specialist", "Chuyên viên phụ trách")}</Label>
          <Controller
            name="ownerId"
            control={control}
            render={({ field }) => (
              <select
                id="law-ownerId"
                {...field}
                disabled={ownersQuery.isPending}
                className={selectClass}
              >
                <option value="">{L("Select specialist", "Chọn chuyên viên")}</option>
                {owners.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            )}
          />
          {errors.ownerId && (
            <p className="text-xs text-destructive">{term(errors.ownerId.message ?? "")}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="law-managerId">{L("Manager", "Quản lý")}</Label>
          <Controller
            name="managerId"
            control={control}
            render={({ field }) => (
              <select
                id="law-managerId"
                {...field}
                disabled={managersQuery.isPending}
                className={selectClass}
              >
                <option value="">{L("Select manager", "Chọn quản lý")}</option>
                {managers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            )}
          />
          {errors.managerId && (
            <p className="text-xs text-destructive">
              {term(errors.managerId.message ?? "")}
            </p>
          )}
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="law-tags">{L("Tags (comma separated)", "Thẻ (cách nhau bằng dấu phẩy)")}</Label>
          <Textarea id="law-tags" {...register("tags")} className="min-h-[3rem]" />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            {L("Cancel", "Huỷ")}
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
