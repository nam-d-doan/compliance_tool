import { useNavigate, Navigate } from "react-router-dom";
import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHero } from "@/components/common";
import { NCCForm, type NCCFormValues } from "@/components/ncc/NCCForm";
import { useCreateNCC } from "@/hooks/mutations";
import { useAdminUsers } from "@/hooks/queries/useAdminQueries";
import { useAuthStore } from "@/stores";
import { hasPermission } from "@/constants/rbac";
import { toast } from "sonner";
import type { CreateNCCInput } from "@/types";

export default function NCCCreatePage() {
  const navigate = useNavigate();
  const { role } = useAuthStore();
  const canCreate = hasPermission(role, "ncc:create");

  const create = useCreateNCC();
  const usersQuery = useAdminUsers(1, 200, { status: "Active" });

  if (!canCreate) {
    return <Navigate to="/unauthorized" replace />;
  }

  const handleSubmit = (values: NCCFormValues) => {
    const owner = usersQuery.data?.items.find((u) => u.id === values.ownerId);
    const payload: CreateNCCInput = {
      title: values.title,
      description: values.description,
      severity: values.severity as CreateNCCInput["severity"],
      ownerUnitId: values.ownerUnitId,
      ownerId: values.ownerId,
      ownerName: owner?.name ?? "",
      dueDate: new Date(values.dueDate).toISOString(),
      linkedDocs: values.linkedDocs || undefined,
      tags:
        values.tags
          ?.split(",")
          .map((t) => t.trim())
          .filter(Boolean) ?? [],
    };
    create.mutate(payload, {
      onSuccess: (data) => {
        toast.success("Non-compliance case created");
        navigate(`/ncc/${data.id}`);
      },
      onError: (err) => toast.error(err.message || "Failed to create case"),
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
        title="Create Non-Compliance Case"
        subtitle="Document a non-compliance issue and assign corrective action."
      />

      <Card>
        <CardHeader>
          <CardTitle>Case Details</CardTitle>
        </CardHeader>
        <CardContent>
          <NCCForm
            onSubmit={handleSubmit}
            isSubmitting={create.isPending}
            submitLabel="Create Case"
          />
        </CardContent>
      </Card>
    </motion.div>
  );
}
