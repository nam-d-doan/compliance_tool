import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, Navigate, useSearchParams } from "react-router-dom";
import { motion } from "motion/react";
import {
  Sparkles,
  Loader2,
  Wand2,
  Lightbulb,
  RefreshCw,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AIExplanation } from "@/components/ai/AIExplanation";
import { ConfidenceIndicator } from "@/components/ai/ConfidenceIndicator";
import { TypewriterText } from "@/components/ai/TypewriterText";
import { PriorityBadge } from "@/components/common/PriorityBadge";
import { PageHero } from "@/components/common";
import { CAPForm, type CAPFormValues } from "@/components/cap/CAPForm";
import { useGenerateCAP } from "@/hooks/queries/useAIQueries";
import { useAdminUsers } from "@/hooks/queries/useAdminQueries";
import { useObligationList } from "@/hooks/queries/useObligationQueries";
import { useCreateCAP } from "@/hooks/mutations/useCAPMutations";
import { useAuthStore } from "@/stores";
import { hasPermission } from "@/constants/rbac";
import { toast } from "sonner";
import { format, addDays } from "date-fns";
import type { CAPAction, FileAttachment } from "@/types";

export default function CAPCreatePage() {
  const navigate = useNavigate();
  const { role, user } = useAuthStore();
  const canCreate = hasPermission(role, "cap:create");

  const [searchParams] = useSearchParams();

  const formRef = useRef<HTMLDivElement>(null);
  const [description, setDescription] = useState("");
  const [complianceId, setComplianceId] = useState("");
  const [draft, setDraft] = useState<Partial<CAPFormValues> | undefined>(
    undefined,
  );
  const [highlightKey, setHighlightKey] = useState(0);
  const [aiExplainOpen, setAiExplainOpen] = useState(false);
  /** Files uploaded while filling out the form (orphan until the CAP exists).
   *  Linked to the new CAP via `fileIds` in the create payload. */
  const [uploadedFiles, setUploadedFiles] = useState<FileAttachment[]>([]);

  // Pre-fill obligations from query params. Supports `?obligations=id1,id2`
  // (new) and legacy `?complianceId=id` / `?compliance=id` (single).
  const prefilledObligationIds = useMemo(() => {
    const list = searchParams.get("obligations");
    if (list)
      return list
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    const legacy =
      searchParams.get("complianceId") ?? searchParams.get("compliance");
    return legacy ? [legacy] : [];
  }, [searchParams]);

  const generate = useGenerateCAP();
  const create = useCreateCAP();

  const usersQuery = useAdminUsers(1, 200, { status: "Active" });
  const complianceQuery = useObligationList({}, 1, 200);

  const owners = useMemo(
    () => usersQuery.data?.items.filter((u) => u.role === "owner") ?? [],
    [usersQuery.data],
  );
  const approvers = useMemo(
    () =>
      usersQuery.data?.items.filter(
        (u) => u.role === "approver" || u.role === "admin",
      ) ?? [],
    [usersQuery.data],
  );
  const complianceItems = useMemo(
    () => complianceQuery.data?.items ?? [],
    [complianceQuery.data],
  );

  const selectedCompliance = useMemo(
    () => complianceItems.find((c) => c.id === complianceId),
    [complianceItems, complianceId],
  );

  useEffect(() => {
    if (selectedCompliance) {
      setDescription(selectedCompliance.description);
    }
  }, [selectedCompliance]);

  const suggestion = generate.data;

  const handleGenerate = () => {
    if (!description && !complianceId) {
      toast.error("Enter a description or select a linked compliance item");
      return;
    }
    generate.mutate({
      complianceId: complianceId || undefined,
      description: description || undefined,
    });
  };

  const handleUseDraft = () => {
    if (!suggestion) return;
    const owner = owners[0];
    const approver = approvers[0];
    const compliance = selectedCompliance ?? complianceItems[0];
    const dueDate = format(addDays(new Date(), 42), "yyyy-MM-dd");

    const nextDraft: Partial<CAPFormValues> = {
      title: suggestion.title,
      description: suggestion.description,
      priority: suggestion.priority,
      rootCause: suggestion.rootCause,
      estimatedCost: suggestion.estimatedCost,
      ownerId: owner?.id,
      approverId: approver?.id,
      department: compliance?.department,
      businessUnit: compliance?.businessUnit,
      location: compliance?.location,
      dueDate,
      obligationIds:
        prefilledObligationIds.length > 0
          ? prefilledObligationIds
          : compliance
            ? [compliance.id]
            : [],
      tags: "ai-generated, remediation",
    };
    setDraft(nextDraft);
    setHighlightKey((k) => k + 1);
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  const handleRegenerate = () => {
    handleGenerate();
  };

  const buildPayload = (values: CAPFormValues) => {
    const owner = owners.find((u) => u.id === values.ownerId);
    const approver = approvers.find((u) => u.id === values.approverId);
    const firstObligation = complianceItems.find((c) =>
      values.obligationIds.includes(c.id),
    );

    return {
      title: values.title,
      description: values.description,
      priority: values.priority,
      risk: values.priority,
      ownerId: values.ownerId,
      ownerName: owner?.name ?? "",
      approverId: values.approverId,
      approverName: approver?.name ?? "",
      department: values.department,
      businessUnit: values.businessUnit,
      location: values.location,
      dueDate: new Date(values.dueDate).toISOString(),
      status: "Open" as const,
      rootCause: values.rootCause,
      estimatedCost: values.estimatedCost,
      actualCost: 0,
      obligationIds: values.obligationIds,
      complianceTitle: firstObligation?.title,
      progress: 0,
      tags: values.tags
        ? values.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : [],
      actions: (suggestion?.recommendedActions.map((text, index) => ({
        id: `act-${crypto.randomUUID()}`,
        capId: "",
        title: text,
        ownerId: owner?.id ?? "",
        ownerName: owner?.name ?? "",
        deadline:
          format(
            addDays(new Date(values.dueDate), (index + 1) * 7),
            "yyyy-MM-dd",
          ) + "T00:00:00.000Z",
        status: "Open" as const,
        progress: 0,
        attachments: [],
        comments: [],
        order: index,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })) ?? []) as CAPAction[],
      fileIds: uploadedFiles.map((f) => f.id),
    };
  };

  const handleSubmit = (values: CAPFormValues) => {
    create.mutate(buildPayload(values), {
      onSuccess: (data) => {
        toast.success("CAP created");
        navigate(`/cap/${data.id}`);
      },
      onError: (err) => toast.error(err.message || "Failed to create CAP"),
    });
  };

  if (!canCreate) {
    return <Navigate to="/unauthorized" replace />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <PageHero
        title="Create Corrective Action Plan"
        subtitle="Describe the issue and let AI draft a remediation plan."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="order-1 space-y-5">
          <Card className="border-primary/10 bg-gradient-to-br from-primary/[0.04] to-card dark:border-primary/20">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Sparkles className="size-4" aria-hidden="true" />
                </div>
                <CardTitle>AI CAP Generator</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="linked-compliance">
                  Linked compliance item (optional)
                </Label>
                <select
                  id="linked-compliance"
                  value={complianceId}
                  onChange={(e) => setComplianceId(e.target.value)}
                  disabled={complianceQuery.isPending}
                  className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 dark:bg-input/30"
                >
                  <option value="">Select a compliance obligation</option>
                  {complianceItems.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} - {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="issue-description">
                  Describe the issue or non-compliance
                </Label>
                <Textarea
                  id="issue-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. AML training records were incomplete for 12 staff members in Q2..."
                  className="min-h-[6rem]"
                />
              </div>

              <Button
                type="button"
                onClick={handleGenerate}
                disabled={generate.isPending || (!description && !complianceId)}
                className="w-full"
              >
                {generate.isPending ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Wand2 className="size-4" aria-hidden="true" />
                )}
                Generate with AI
              </Button>

              {generate.isPending && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-3 rounded-lg border border-primary/10 bg-primary/5 p-3 text-sm text-primary"
                >
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  AI is analysing the issue and drafting remediation actions...
                </motion.div>
              )}

              {suggestion && !generate.isPending && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4 rounded-lg border border-border bg-card p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-base font-semibold text-foreground">
                      {suggestion.title}
                    </h3>
                    <PriorityBadge priority={suggestion.priority} size="sm" />
                  </div>

                  <div className="space-y-1">
                    <span className="text-xs font-medium text-muted-foreground">
                      Description
                    </span>
                    <p className="text-sm leading-relaxed text-foreground">
                      <TypewriterText
                        text={suggestion.description}
                        speed={15}
                      />
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-xs font-medium text-muted-foreground">
                      Suggested Root Cause
                    </span>
                    <p className="text-sm text-foreground">
                      {suggestion.rootCause}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      Suggested Actions
                    </span>
                    <ul className="space-y-1.5">
                      {suggestion.recommendedActions.map((action, index) => (
                        <li
                          key={index}
                          className="flex items-start gap-2 text-sm text-foreground"
                        >
                          <CheckCircle
                            className="mt-0.5 size-3.5 shrink-0 text-primary"
                            aria-hidden="true"
                          />
                          {action}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-md bg-muted/50 p-2">
                      <span className="text-xs text-muted-foreground">
                        Timeline
                      </span>
                      <p className="font-medium">{suggestion.timeline}</p>
                    </div>
                    <div className="rounded-md bg-muted/50 p-2">
                      <span className="text-xs text-muted-foreground">
                        Estimated Cost
                      </span>
                      <p className="font-medium">
                        ${suggestion.estimatedCost.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t pt-3">
                    <ConfidenceIndicator
                      confidence={suggestion.explanation.confidence}
                      size="sm"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      onClick={() => setAiExplainOpen(true)}
                      className="gap-1 text-primary"
                    >
                      <Lightbulb className="size-3.5" aria-hidden="true" />
                      View reasoning
                    </Button>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleRegenerate}
                      disabled={generate.isPending}
                    >
                      <RefreshCw className="size-3.5" aria-hidden="true" />
                      Regenerate
                    </Button>
                    <Button type="button" size="sm" onClick={handleUseDraft}>
                      Use this draft
                    </Button>
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>

          {suggestion && (
            <AIExplanation
              explanation={suggestion.explanation}
              open={aiExplainOpen}
              onOpenChange={setAiExplainOpen}
            />
          )}
        </div>

        <div ref={formRef} className="order-2">
          <Card>
            <CardHeader>
              <CardTitle>CAP Details</CardTitle>
            </CardHeader>
            <CardContent>
              <CAPForm
                draftValues={draft}
                highlightKey={highlightKey}
                ownerOptions={owners}
                approverOptions={approvers}
                obligationOptions={complianceItems.map((c) => ({
                  id: c.id,
                  title: `${c.code} - ${c.title}`,
                }))}
                optionsLoading={
                  usersQuery.isPending || complianceQuery.isPending
                }
                onSubmit={handleSubmit}
                isSubmitting={create.isPending}
                submitLabel="Create CAP"
                defaultValues={
                  prefilledObligationIds.length > 0
                    ? { obligationIds: prefilledObligationIds }
                    : undefined
                }
                files={uploadedFiles}
                onFilesChange={setUploadedFiles}
                uploadedBy={user?.name}
                uploadedById={user?.id}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
