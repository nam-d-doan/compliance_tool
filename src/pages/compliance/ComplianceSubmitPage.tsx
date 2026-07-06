import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { motion } from "motion/react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHero } from "@/components/common";
import {
  ComplianceForm,
  type ComplianceFormValues,
} from "@/components/compliance/ComplianceForm";
import { useCreateCompliance } from "@/hooks/mutations/useComplianceMutations";
import { useAuthStore } from "@/stores";
import { hasPermission } from "@/constants/rbac";
import type { ComplianceObligation } from "@/types";

export default function ComplianceSubmitPage() {
  const navigate = useNavigate();
  const { role, user } = useAuthStore();
  const canCreate = hasPermission(role, "compliance:create");

  const create = useCreateCompliance();

  if (!canCreate) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card p-8 text-center">
        <h3 className="text-base font-semibold text-foreground">
          Unauthorized
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          You do not have permission to create compliance obligations.
        </p>
        <Button
          variant="outline"
          className="mt-5"
          onClick={() => navigate("/compliance")}
        >
          Back to list
        </Button>
      </div>
    );
  }

  const handleSubmit = (
    values: ComplianceFormValues,
    selected: {
      regulation?: { title: string; id: string };
      owner?: { name: string; id: string };
      approver?: { name: string; id: string };
    },
  ) => {
    const payload: Partial<ComplianceObligation> = {
      title: values.title,
      description: values.description,
      businessUnit: values.businessUnit,
      department: values.department,
      location: values.location,
      regulationId: values.regulationId,
      regulationName: selected.regulation?.title ?? "",
      ownerId: values.ownerId,
      ownerName: selected.owner?.name ?? "",
      approverId: values.approverId,
      approverName: selected.approver?.name ?? "",
      reviewerIds: values.reviewerIds,
      frequency: values.frequency,
      dueDate: new Date(values.dueDate).toISOString(),
      criticality: values.criticality,
      penalty: values.penalty,
      tags: values.tags
        ? values.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : [],
      status: "Pending Review",
      progress: 0,
    };

    create.mutate(payload, {
      onSuccess: (item) => {
        toast.success("Compliance obligation created");
        navigate(`/compliance/${item.id}`);
      },
      onError: () => {
        toast.error("Failed to create compliance obligation");
      },
    });
  };

  const handleDraft = (
    values: ComplianceFormValues,
    selected: {
      regulation?: { title: string; id: string };
      owner?: { name: string; id: string };
      approver?: { name: string; id: string };
    },
  ) => {
    const payload: Partial<ComplianceObligation> = {
      title: values.title,
      description: values.description,
      businessUnit: values.businessUnit,
      department: values.department,
      location: values.location,
      regulationId: values.regulationId,
      regulationName: selected.regulation?.title ?? "",
      ownerId: values.ownerId,
      ownerName: selected.owner?.name ?? "",
      approverId: values.approverId,
      approverName: selected.approver?.name ?? "",
      reviewerIds: values.reviewerIds,
      frequency: values.frequency,
      dueDate: values.dueDate
        ? new Date(values.dueDate).toISOString()
        : new Date().toISOString(),
      criticality: values.criticality,
      penalty: values.penalty,
      tags: values.tags
        ? values.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : [],
      status: "Draft",
      progress: 0,
    };

    create.mutate(payload, {
      onSuccess: (item) => {
        toast.success("Draft saved");
        navigate(`/compliance/${item.id}`);
      },
      onError: () => {
        toast.error("Failed to save draft");
      },
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mx-auto max-w-5xl space-y-6"
    >
      <Button variant="ghost" size="sm" onClick={() => navigate("/compliance")}>
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back
      </Button>

      <PageHero
        title="Submit New Compliance Obligation"
        subtitle="Define a new compliance requirement, assign owners and approvers, and set due dates."
        className="py-5"
      />

      <Card>
        <CardContent className="pt-6">
          {create.isPending ? (
            <div className="flex items-center justify-center py-12">
              <Loader2
                className="size-8 animate-spin text-primary"
                aria-hidden="true"
              />
            </div>
          ) : (
            <ComplianceForm
              onSubmit={handleSubmit}
              onDraft={handleDraft}
              onCancel={() => navigate("/compliance")}
              isSubmitting={create.isPending}
              defaultValues={{
                ownerId: user?.id ?? "",
              }}
            />
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
