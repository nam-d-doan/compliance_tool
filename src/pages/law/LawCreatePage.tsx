import { useNavigate, Navigate } from "react-router-dom";
import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHero } from "@/components/common";
import { LawForm, type LawFormValues } from "@/components/law/LawForm";
import { useCreateLawRequest } from "@/hooks/mutations";
import { useAuthStore } from "@/stores";
import { hasPermission } from "@/constants/rbac";
import { toast } from "sonner";
import type { CreateAdviceRequestInput } from "@/types";

export default function LawCreatePage() {
  const navigate = useNavigate();
  const { role } = useAuthStore();
  const canCreate = hasPermission(role, "law:create");

  const create = useCreateLawRequest();

  if (!canCreate) {
    return <Navigate to="/unauthorized" replace />;
  }

  const handleSubmit = (values: LawFormValues) => {
    const payload: CreateAdviceRequestInput = {
      title: values.title,
      description: values.description || undefined,
      priorityTier: values.priorityTier as CreateAdviceRequestInput["priorityTier"],
      requestingUnitId: values.requestingUnitId,
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
        toast.success(`Request ${data.code} created`);
        navigate(`/law/${data.id}`);
      },
      onError: (err) => toast.error(err.message || "Failed to create request"),
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
        title="New Advisory Request"
        subtitle="Submit a new legal advisory request."
      />

      <Card>
        <CardHeader>
          <CardTitle>Request Information</CardTitle>
        </CardHeader>
        <CardContent>
          <LawForm
            onSubmit={handleSubmit}
            isSubmitting={create.isPending}
            submitLabel="Create Request"
          />
        </CardContent>
      </Card>
    </motion.div>
  );
}
