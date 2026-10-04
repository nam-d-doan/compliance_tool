import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { motion } from "motion/react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { PageHero } from "@/components/common";
import { NCCForm, type NCCFormValues } from "@/components/ncc/NCCForm";
import {
  RfqChip,
  RiskRatingPanel,
  isRatingValid,
  type RiskRatingValue,
} from "@/components/cms";
import { useCreateNCC } from "@/hooks/mutations";
import { useAdminUsers } from "@/hooks/queries/useAdminQueries";
import { useActiveRiskMatrix } from "@/hooks/queries";
import { useAuthStore, demoNow } from "@/stores";
import { hasPermission } from "@/constants/rbac";
import { computeWeightedScore, levelForScore } from "@/lib/cms-rules";
import { toast } from "sonner";
import type { CreateNCCInput, IssueSource } from "@/types";

export default function NCCCreatePage() {
  const navigate = useNavigate();
  const { role, user } = useAuthStore();
  const canCreate = hasPermission(role, "ncc:create");

  const create = useCreateNCC();
  const usersQuery = useAdminUsers(1, 200, { status: "Active" });
  const { data: matrix } = useActiveRiskMatrix();
  const [rating, setRating] = useState<RiskRatingValue>({
    scores: { fine: 2, reputation: 2, scope: 2, recurrence: 1 },
  });

  if (!canCreate) {
    return <Navigate to="/unauthorized" replace />;
  }

  const handleSubmit = (values: NCCFormValues) => {
    if (!matrix) return;
    if (!isRatingValid(matrix, rating)) {
      toast.error("Add a reason for overriding the suggested risk level.");
      return;
    }
    const owner = usersQuery.data?.items.find((u) => u.id === values.ownerId);
    const weightedScore = computeWeightedScore(rating.scores, matrix);
    const suggestedLevel = levelForScore(weightedScore, matrix.thresholds);
    const finalLevel = rating.overrideLevel ?? suggestedLevel;
    const payload: CreateNCCInput = {
      title: values.title,
      description: values.description,
      severity: finalLevel,
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
      source: values.source as IssueSource,
      sourceRef: values.sourceRef || undefined,
      category: values.category,
      regulationRef: values.regulationRef || undefined,
      risk: {
        scores: rating.scores,
        weightedScore,
        suggestedLevel,
        finalLevel,
        overridden: finalLevel !== suggestedLevel,
        overrideReason: rating.overrideReason,
        matrixVersion: matrix.version,
        ratedBy: user?.name ?? "",
        ratedAt: demoNow().toISOString(),
      },
    };
    create.mutate(payload, {
      onSuccess: (data) => {
        toast.success(
          finalLevel === "high"
            ? "Issue recorded — rated HIGH and escalated to BĐH & BKS"
            : "Compliance issue recorded",
        );
        navigate(`/ncc/${data.id}`);
      },
      onError: (err) => toast.error(err.message || "Failed to create issue"),
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
        title="Record Compliance Issue"
        subtitle="Log an issue from any source — inspection, audit, self-check or monitoring — and rate it with the bank's risk matrix."
      >
        <div className="flex gap-2">
          <RfqChip code="3.1" />
          <RfqChip code="4.2" />
        </div>
      </PageHero>

      <Card>
        <CardHeader>
          <CardTitle>Issue details</CardTitle>
          <CardDescription>
            Findings from ICIS arrive automatically in the ICIS Inbox — use this
            form for other sources.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NCCForm
            onSubmit={handleSubmit}
            isSubmitting={create.isPending}
            submitLabel="Record issue"
          >
            {matrix && (
              <div className="space-y-2 rounded-xl border border-border p-4">
                <p className="text-sm font-semibold">
                  Risk rating (Risk Rating Matrix v{matrix.version})
                </p>
                <p className="text-xs text-muted-foreground">
                  Score each criterion; the system suggests the level. You may
                  override it with a reason.
                </p>
                <RiskRatingPanel
                  matrix={matrix}
                  value={rating}
                  onChange={setRating}
                />
              </div>
            )}
          </NCCForm>
        </CardContent>
      </Card>
    </motion.div>
  );
}
