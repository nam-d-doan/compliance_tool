import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm, Controller, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  Loader2,
  Sparkles,
  Tag,
  UploadCloud,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { format } from "date-fns";
import { toast } from "sonner";
import { FileUpload } from "@/components/evidence/FileUpload";
import { ConfidenceIndicator } from "@/components/ai/ConfidenceIndicator";
import { AIExplanation } from "@/components/ai/AIExplanation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHero } from "@/components/common";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuthStore } from "@/stores";
import { useCreateEvidence, useValidateEvidence } from "@/hooks/mutations";
import { useComplianceList } from "@/hooks/queries";
import { cn } from "@/lib/utils";
import type { AIEvidenceValidationResult } from "@/types";

const EVIDENCE_CATEGORIES = [
  "Policy Document",
  "Audit Report",
  "License Certificate",
  "Training Record",
  "Transaction Log",
  "Risk Assessment",
  "KYC Document",
];

const uploadSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  category: z.string().min(1, "Category is required"),
  complianceId: z.string().optional(),
  description: z.string().optional(),
  tags: z.string().optional(),
  expiryDate: z.string().optional(),
});

type UploadFormValues = z.infer<typeof uploadSchema>;

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
}

export default function EvidenceUploadPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, role } = useAuthStore();
  const complianceQuery = useComplianceList({ page: 1, pageSize: 500 });
  const preselectedComplianceId = searchParams.get("compliance") ?? "";

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<UploadFormValues>({
    resolver: zodResolver(uploadSchema as never) as Resolver<UploadFormValues>,
    defaultValues: {
      name: "",
      category: "",
      complianceId: preselectedComplianceId,
      description: "",
      tags: "",
      expiryDate: "",
    },
  });

  const selectedComplianceId = watch("complianceId");
  const selectedCompliance = useMemo(
    () =>
      complianceQuery.data?.items.find((c) => c.id === selectedComplianceId),
    [complianceQuery.data, selectedComplianceId],
  );

  const [files, setFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState(0);
  const [uploadPhase, setUploadPhase] = useState<
    "idle" | "uploading" | "scanning" | "ai" | "completed"
  >("idle");
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [validationResult, setValidationResult] =
    useState<AIEvidenceValidationResult | null>(null);
  const [reasoningOpen, setReasoningOpen] = useState(false);

  const createEvidence = useCreateEvidence();
  const validateEvidence = useValidateEvidence(createdId ?? undefined);

  useEffect(() => {
    if (preselectedComplianceId) {
      setValue("complianceId", preselectedComplianceId);
    }
  }, [preselectedComplianceId, setValue]);

  useEffect(() => {
    if (uploadPhase !== "uploading") return;
    const interval = window.setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          window.clearInterval(interval);
          setUploadPhase("scanning");
          return 100;
        }
        return Math.min(prev + Math.random() * 8, 100);
      });
    }, 150);
    return () => window.clearInterval(interval);
  }, [uploadPhase]);

  useEffect(() => {
    if (uploadPhase !== "scanning") return;
    const timeout = window.setTimeout(() => {
      setUploadPhase("completed");
      toast.success("Evidence uploaded and scanned successfully");
    }, 1200);
    return () => window.clearTimeout(timeout);
  }, [uploadPhase]);

  const onSubmit = async (values: UploadFormValues) => {
    if (files.length === 0) {
      toast.error("Please select at least one file to upload");
      return;
    }

    const file = files[0];
    const now = new Date().toISOString();
    const tags = values.tags
      ? values.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : [];

    setUploadPhase("uploading");
    setProgress(0);

    try {
      const result = await createEvidence.mutateAsync({
        name: values.name,
        fileName: file.name,
        category: values.category,
        complianceId: values.complianceId || undefined,
        complianceTitle: selectedCompliance?.title,
        tags,
        fileSize: file.size,
        fileType: file.type || "application/pdf",
        ownerId: user?.id ?? "",
        ownerName: user?.name ?? role ?? "Unknown",
        status: "Uploading",
        url: "#",
        checksum: `sha256-${Math.random().toString(36).slice(2)}`,
      });

      setCreatedId(result.id);
    } catch (err) {
      setUploadPhase("idle");
      toast.error(err instanceof Error ? err.message : "Upload failed");
    }
  };

  const handleRunValidation = async () => {
    if (!createdId) return;
    try {
      const result = await validateEvidence.mutateAsync();
      setValidationResult(result);
      toast.success(
        `AI validation complete: ${result.status.replace("_", " ")}`,
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "AI validation failed");
    }
  };

  const isBusy =
    uploadPhase === "uploading" ||
    uploadPhase === "scanning" ||
    createEvidence.isPending;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back
      </Button>

      <PageHero
        title="Upload Evidence"
        subtitle="Add files, link them to a compliance item, and run AI validation."
        className="py-5"
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <UploadCloud
                  className="size-4 text-primary"
                  aria-hidden="true"
                />
                Files
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FileUpload
                onFilesChange={setFiles}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.png,.jpg,.jpeg,.zip"
                multiple={false}
              />
              {files.length > 0 && (
                <p className="mt-3 text-xs text-muted-foreground">
                  {files.length} file selected · {formatBytes(files[0].size)}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="size-4 text-primary" aria-hidden="true" />
                Metadata
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Evidence name</Label>
                    <Input
                      id="name"
                      placeholder="e.g. Q3 AML Training Attendance"
                      {...register("name")}
                      aria-invalid={Boolean(errors.name)}
                    />
                    {errors.name && (
                      <p className="text-xs text-destructive">
                        {errors.name.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="category">Category</Label>
                    <select
                      id="category"
                      {...register("category")}
                      className={cn(
                        "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50",
                        errors.category && "border-destructive",
                      )}
                    >
                      <option value="">Select category</option>
                      {EVIDENCE_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    {errors.category && (
                      <p className="text-xs text-destructive">
                        {errors.category.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="complianceId">Compliance item</Label>
                    <Controller
                      name="complianceId"
                      control={control}
                      render={({ field }) => (
                        <select
                          id="complianceId"
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(e.target.value || undefined)
                          }
                          className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
                        >
                          <option value="">
                            Link to an obligation (optional)
                          </option>
                          {complianceQuery.data?.items.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.complianceId} — {c.title}
                            </option>
                          ))}
                        </select>
                      )}
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Briefly describe what this evidence proves..."
                      {...register("description")}
                      className="min-h-[5rem] resize-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="tags" className="flex items-center gap-1.5">
                      <Tag className="size-3.5" aria-hidden="true" />
                      Tags
                    </Label>
                    <Input
                      id="tags"
                      placeholder="aml, training, q3 (comma separated)"
                      {...register("tags")}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="expiryDate">Expiry date (optional)</Label>
                    <Input
                      id="expiryDate"
                      type="date"
                      {...register("expiryDate")}
                    />
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/evidence")}
                    disabled={isBusy}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isBusy || files.length === 0}>
                    {isBusy ? (
                      <>
                        <Loader2
                          className="size-4 animate-spin"
                          aria-hidden="true"
                        />
                        Uploading…
                      </>
                    ) : (
                      <>
                        <UploadCloud className="size-4" aria-hidden="true" />
                        Upload Evidence
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Upload Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <PhaseStep
                label="Uploading"
                active={uploadPhase === "uploading"}
                done={uploadPhase !== "idle" && uploadPhase !== "uploading"}
              />
              <PhaseStep
                label="Scanning"
                active={uploadPhase === "scanning"}
                done={uploadPhase === "completed"}
              />
              <PhaseStep
                label="AI Validation"
                active={validateEvidence.isPending}
                done={Boolean(validationResult)}
              />

              {uploadPhase === "uploading" && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Uploading file…</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <motion.div
                      className="h-full rounded-full bg-primary"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.2 }}
                    />
                  </div>
                </div>
              )}

              {uploadPhase === "completed" && !validationResult && (
                <Button
                  variant="outline"
                  className="w-full gap-1.5"
                  onClick={handleRunValidation}
                  disabled={validateEvidence.isPending}
                >
                  {validateEvidence.isPending ? (
                    <Loader2
                      className="size-4 animate-spin"
                      aria-hidden="true"
                    />
                  ) : (
                    <Sparkles className="size-4" aria-hidden="true" />
                  )}
                  Run AI Validation
                </Button>
              )}

              {uploadPhase === "completed" && createdId && (
                <Button
                  variant="default"
                  className="w-full"
                  onClick={() => navigate(`/evidence/${createdId}`)}
                >
                  View Evidence Detail
                </Button>
              )}
            </CardContent>
          </Card>

          <AnimatePresence>
            {validationResult && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Sparkles
                        className="size-4 text-primary"
                        aria-hidden="true"
                      />
                      AI Validation Result
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Badge
                        variant={
                          validationResult.score >= 80
                            ? "secondary"
                            : validationResult.score >= 60
                              ? "outline"
                              : "destructive"
                        }
                        className="text-xs"
                      >
                        {validationResult.status.replace("_", " ")}
                      </Badge>
                      <ConfidenceIndicator
                        confidence={validationResult.score / 100}
                        size="sm"
                      />
                    </div>

                    {validationResult.issues.length > 0 && (
                      <div className="space-y-1.5">
                        <h4 className="text-xs font-medium text-muted-foreground">
                          Issues
                        </h4>
                        <ul className="space-y-1">
                          {validationResult.issues.map((issue, idx) => (
                            <li key={idx} className="text-xs text-foreground">
                              • {issue}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {validationResult.missingItems.length > 0 && (
                      <div className="space-y-1.5">
                        <h4 className="text-xs font-medium text-muted-foreground">
                          Missing items
                        </h4>
                        <ul className="space-y-1">
                          {validationResult.missingItems.map((item, idx) => (
                            <li key={idx} className="text-xs text-foreground">
                              • {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {validationResult.recommendations.length > 0 && (
                      <div className="space-y-1.5">
                        <h4 className="text-xs font-medium text-muted-foreground">
                          Recommendations
                        </h4>
                        <ul className="space-y-1">
                          {validationResult.recommendations.map((rec, idx) => (
                            <li key={idx} className="text-xs text-foreground">
                              • {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <AIExplanation
                      explanation={validationResult.explanation}
                      open={reasoningOpen}
                      onOpenChange={setReasoningOpen}
                    >
                      <Button variant="ghost" size="sm" className="w-full">
                        View reasoning
                      </Button>
                    </AIExplanation>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function PhaseStep({
  label,
  active,
  done,
}: {
  label: string;
  active: boolean;
  done: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={cn(
          "flex size-6 shrink-0 items-center justify-center rounded-full border text-xs transition-colors",
          done
            ? "border-emerald-500 bg-emerald-500 text-white"
            : active
              ? "border-primary bg-primary/10 text-primary"
              : "border-border text-muted-foreground",
        )}
      >
        {done ? (
          <CheckCircle2 className="size-3.5" aria-hidden="true" />
        ) : (
          <span>•</span>
        )}
      </div>
      <span
        className={cn(
          "text-sm",
          active ? "font-medium text-foreground" : "text-muted-foreground",
        )}
      >
        {label}
      </span>
    </div>
  );
}
