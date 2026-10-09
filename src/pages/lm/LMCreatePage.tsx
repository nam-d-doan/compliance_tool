import { useNavigate, Navigate } from "react-router-dom";
import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHero } from "@/components/common";
import { LMForm, type LMFormValues } from "@/components/lm/LMForm";
import { useCreateLMCase } from "@/hooks/mutations";
import { useAuthStore } from "@/stores";
import { hasPermission } from "@/constants/rbac";
import { toast } from "sonner";
import type { CreateLMCaseInput } from "@/types";
import { useL } from "@/lib/i18n";

export default function LMCreatePage() {
  const navigate = useNavigate();
  const { role } = useAuthStore();
  const canCreate = hasPermission(role, "lm:create");

  const create = useCreateLMCase();
  const L = useL();

  if (!canCreate) {
    return <Navigate to="/unauthorized" replace />;
  }

  const handleSubmit = (values: LMFormValues) => {
    const payload: CreateLMCaseInput = {
      title: values.title,
      category: values.category as CreateLMCaseInput["category"],
      customerCif: values.customerCif,
      customerName: values.customerName,
      outstandingDebt: Number(values.outstandingDebt),
      collateralDescription: values.collateralDescription || undefined,
      courtOrEnforcementAgency: values.courtOrEnforcementAgency,
      judgeName: values.judgeName || undefined,
      priority: values.priority as CreateLMCaseInput["priority"],
      ownerUnitId: values.ownerUnitId,
      ownerId: values.ownerId,
      managerId: values.managerId,
      tags:
        values.tags
          ?.split(",")
          .map((t) => t.trim())
          .filter(Boolean) ?? [],
    };
    create.mutate(payload, {
      onSuccess: (data) => {
        toast.success(L(`Case ${data.code} created`, `Đã tạo hồ sơ ${data.code}`));
        navigate(`/lm/${data.id}`);
      },
      onError: (err) => toast.error(err.message || L("Failed to create case", "Tạo hồ sơ thất bại")),
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <PageHero
        title={L("Create Litigation Case", "Tạo hồ sơ tố tụng")}
        subtitle={L("Open a new litigation / enforcement case.", "Mở hồ sơ tố tụng / thi hành án mới.")}
      />

      <Card>
        <CardHeader>
          <CardTitle>{L("Case Information", "Thông tin hồ sơ")}</CardTitle>
        </CardHeader>
        <CardContent>
          <LMForm
            onSubmit={handleSubmit}
            isSubmitting={create.isPending}
            submitLabel={L("Create Case", "Tạo hồ sơ")}
          />
        </CardContent>
      </Card>
    </motion.div>
  );
}
