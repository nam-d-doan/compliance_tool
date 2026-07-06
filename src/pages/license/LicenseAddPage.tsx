import { useEffect } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { motion } from "motion/react";
import { differenceInDays, parseISO } from "date-fns";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHero } from "@/components/common";
import {
  LicenseForm,
  type LicenseFormValues,
} from "@/components/license/LicenseForm";
import { useCreateLicense } from "@/hooks/mutations/useLicenseMutations";
import { useAuthStore } from "@/stores";
import { hasMinimumRole } from "@/constants/rbac";
import type { PriorityLevel } from "@/constants/status";

export default function LicenseAddPage() {
  const navigate = useNavigate();
  const { role } = useAuthStore();
  const create = useCreateLicense();

  useEffect(() => {
    if (create.isSuccess && create.data) {
      navigate(`/license/${create.data.id}`);
    }
  }, [create.isSuccess, create.data, navigate]);

  if (!hasMinimumRole(role, "owner")) {
    return <Navigate to="/unauthorized" replace />;
  }

  const buildPayload = (
    values: LicenseFormValues,
    status: "Active" | "Draft",
  ) => {
    const today = new Date();
    const expiry = parseISO(values.expiryDate);
    const remainingDays = differenceInDays(expiry, today);
    return {
      ...values,
      status,
      remainingDays,
      renewalPriority: (remainingDays < 30
        ? "critical"
        : remainingDays < 60
          ? "high"
          : remainingDays < 120
            ? "medium"
            : "low") as PriorityLevel,
      ownerName: "",
      approverName: "",
      regulationName: "",
    };
  };

  type Selected = {
    regulation?: { id: string; title: string; reference: string };
    owner?: { id: string; name: string };
    approver?: { id: string; name: string };
  };

  const submit = (
    values: LicenseFormValues,
    selected: Selected,
    status: "Active" | "Draft",
  ) => {
    const payload = buildPayload(values, status);
    if (selected.owner) payload.ownerName = selected.owner.name;
    if (selected.approver) payload.approverName = selected.approver.name;
    if (selected.regulation) payload.regulationName = selected.regulation.title;

    create.mutate(payload, {
      onSuccess: (data) => {
        const message = status === "Active" ? "License created" : "Draft saved";
        const description =
          status === "Active"
            ? `Created ${data.licenseName}.`
            : `Saved ${data.licenseName} as draft.`;
        toast.success(message, { description });
      },
      onError: () => {
        toast.error(
          status === "Active"
            ? "Could not create license"
            : "Could not save draft",
        );
      },
    });
  };

  const handleSubmit = (values: LicenseFormValues, selected: Selected) =>
    submit(values, selected, "Active");
  const handleDraft = (values: LicenseFormValues, selected: Selected) =>
    submit(values, selected, "Draft");

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mx-auto max-w-4xl space-y-6"
    >
      <PageHero
        title="Add License"
        subtitle="Register a new license, permit, or regulatory authorization."
      />

      <Card>
        <CardHeader>
          <CardTitle>License Details</CardTitle>
        </CardHeader>
        <CardContent>
          <LicenseForm
            onSubmit={handleSubmit}
            onDraft={handleDraft}
            isSubmitting={create.isPending}
            submitLabel="Create License"
            draftLabel="Save as Draft"
          />
        </CardContent>
      </Card>
    </motion.div>
  );
}
