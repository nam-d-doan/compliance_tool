/**
 * PSEUDO CODE (ngắn gọn) — form tạo/sửa hồ sơ LM, khuôn theo NCCForm.
 * 1. zod validate các field bắt buộc theo CreateLMCaseInput.
 * 2. ownerUnitId lấy từ useOrgUnits (chỉ hoDepartments — LM chưa gán cho
 *    chi nhánh ở GĐ1, xem docs/lm/00-decisions.md).
 * 3. ownerId lọc role=owner (chuyên viên), managerId lọc role=executive
 *    (cấp quản lý) — đúng phân quyền đã chốt.
 * 4. UI text + validation message tiếng Anh cho khớp phần còn lại của app.
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
import { PRIORITY_LEVELS } from "@/constants/status";
import { CASE_CATEGORIES, getCaseCategoryLabel } from "@/constants/lm";
import { useL, useTerm } from "@/lib/i18n";
import { useLanguageStore } from "@/stores";

const selectClass =
  "h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 dark:bg-input/30";

const lmSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  category: z.enum([...CASE_CATEGORIES] as [string, ...string[]]),
  customerCif: z.string().min(1, "Customer CIF is required"),
  customerName: z.string().min(1, "Customer name is required"),
  outstandingDebt: z.coerce.number().min(0, "Invalid outstanding debt"),
  collateralDescription: z.string().optional(),
  courtOrEnforcementAgency: z.string().min(1, "Court/enforcement agency is required"),
  judgeName: z.string().optional(),
  priority: z.enum([...PRIORITY_LEVELS] as [string, ...string[]]),
  ownerUnitId: z.string().min(1, "Owner unit is required"),
  ownerId: z.string().min(1, "Case owner is required"),
  managerId: z.string().min(1, "Manager is required"),
  tags: z.string().optional(),
});

export type LMFormValues = z.infer<typeof lmSchema>;

export interface LMFormProps {
  defaultValues?: Partial<LMFormValues>;
  onSubmit: (values: LMFormValues) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
  submitLabel?: string;
}

export function LMForm({
  defaultValues,
  onSubmit,
  onCancel,
  isSubmitting,
  submitLabel,
}: LMFormProps) {
  const L = useL();
  const term = useTerm();
  const lang = useLanguageStore((s) => s.lang);
  submitLabel ??= L("Create Case", "Tạo hồ sơ");
  const orgUnitsQuery = useOrgUnits();
  // Không lọc status: "Active" — demo có vài chuyên viên seed sẵn với
  // status khác Active (Deactivated/Invited); lọc theo status sẽ làm select
  // không hiện được lựa chọn hiện tại khi sửa hồ sơ của những người đó.
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
  } = useForm<LMFormValues>({
    resolver: zodResolver(lmSchema as never) as Resolver<LMFormValues>,
    defaultValues: {
      category: "khac",
      priority: "medium",
      outstandingDebt: 0,
      tags: "",
      ...defaultValues,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="lm-title">{L("Title", "Tiêu đề")}</Label>
          <Input
            id="lm-title"
            {...register("title")}
            aria-invalid={errors.title ? "true" : "false"}
          />
          {errors.title && (
            <p className="text-xs text-destructive">{term(errors.title.message ?? "")}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="lm-category">{L("Case Category", "Nhóm vụ việc")}</Label>
          <Controller
            name="category"
            control={control}
            render={({ field }) => (
              <select id="lm-category" {...field} className={selectClass}>
                {CASE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {getCaseCategoryLabel(c, lang)}
                  </option>
                ))}
              </select>
            )}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="lm-priority">{L("Priority", "Mức ưu tiên")}</Label>
          <Controller
            name="priority"
            control={control}
            render={({ field }) => (
              <select id="lm-priority" {...field} className={selectClass}>
                {PRIORITY_LEVELS.map((p) => (
                  <option key={p} value={p}>
                    {term(p.charAt(0).toUpperCase() + p.slice(1))}
                  </option>
                ))}
              </select>
            )}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="lm-customerCif">{L("Customer CIF", "CIF khách hàng")}</Label>
          <Input
            id="lm-customerCif"
            {...register("customerCif")}
            aria-invalid={errors.customerCif ? "true" : "false"}
          />
          {errors.customerCif && (
            <p className="text-xs text-destructive">
              {term(errors.customerCif.message ?? "")}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="lm-customerName">{L("Customer Name", "Tên khách hàng")}</Label>
          <Input
            id="lm-customerName"
            {...register("customerName")}
            aria-invalid={errors.customerName ? "true" : "false"}
          />
          {errors.customerName && (
            <p className="text-xs text-destructive">
              {term(errors.customerName.message ?? "")}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="lm-outstandingDebt">{L("Outstanding Debt (VND)", "Dư nợ (VND)")}</Label>
          <Input
            id="lm-outstandingDebt"
            type="number"
            min={0}
            {...register("outstandingDebt")}
            aria-invalid={errors.outstandingDebt ? "true" : "false"}
          />
          {errors.outstandingDebt && (
            <p className="text-xs text-destructive">
              {term(errors.outstandingDebt.message ?? "")}
            </p>
          )}
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="lm-collateralDescription">{L("Collateral", "Tài sản bảo đảm")}</Label>
          <Input
            id="lm-collateralDescription"
            {...register("collateralDescription")}
            placeholder={L("Describe the collateral (if any)", "Mô tả tài sản bảo đảm (nếu có)")}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="lm-court">{L("Court / Enforcement Agency", "Tòa án / Cơ quan thi hành án")}</Label>
          <Input
            id="lm-court"
            {...register("courtOrEnforcementAgency")}
            aria-invalid={errors.courtOrEnforcementAgency ? "true" : "false"}
          />
          {errors.courtOrEnforcementAgency && (
            <p className="text-xs text-destructive">
              {term(errors.courtOrEnforcementAgency.message ?? "")}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="lm-judgeName">{L("Judge", "Thẩm phán")}</Label>
          <Input id="lm-judgeName" {...register("judgeName")} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="lm-ownerUnitId">{L("Owner Unit", "Đơn vị phụ trách")}</Label>
          <Controller
            name="ownerUnitId"
            control={control}
            render={({ field }) => (
              <select
                id="lm-ownerUnitId"
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
          {errors.ownerUnitId && (
            <p className="text-xs text-destructive">
              {term(errors.ownerUnitId.message ?? "")}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="lm-ownerId">{L("Case Owner", "Chuyên viên thụ lý")}</Label>
          <Controller
            name="ownerId"
            control={control}
            render={({ field }) => (
              <select
                id="lm-ownerId"
                {...field}
                disabled={ownersQuery.isPending}
                className={selectClass}
              >
                <option value="">{L("Select owner", "Chọn chuyên viên")}</option>
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
          <Label htmlFor="lm-managerId">{L("Manager", "Quản lý")}</Label>
          <Controller
            name="managerId"
            control={control}
            render={({ field }) => (
              <select
                id="lm-managerId"
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
          <Label htmlFor="lm-tags">{L("Tags (comma separated)", "Thẻ (cách nhau bằng dấu phẩy)")}</Label>
          <Textarea id="lm-tags" {...register("tags")} className="min-h-[3rem]" />
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
