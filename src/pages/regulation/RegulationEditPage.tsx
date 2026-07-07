import { useEffect } from "react";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import { useForm, Controller, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "motion/react";
import { ArrowLeft, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHero } from "@/components/common";
import { PriorityBadge } from "@/components/common/PriorityBadge";
import { ErrorState } from "@/components/common/ErrorState";
import { DetailSkeleton } from "@/components/common/Skeletons";
import { useRegulationDetail } from "@/hooks/queries/useRegulationQueries";
import { useUpdateRegulation } from "@/hooks/mutations/useRegulationMutations";
import { useAuthStore } from "@/stores";
import { hasPermission } from "@/constants/rbac";
import { REGULATION_STATUSES } from "@/constants/status";
import { toast } from "sonner";
import type { Regulation } from "@/types";

const CATEGORIES = [
  "AML/KYC",
  "Data Privacy",
  "Consumer Protection",
  "Market Conduct",
  "Operational Risk",
  "Capital Adequacy",
  "Cybersecurity",
  "Financial Reporting",
] as const;

const REGULATORS = [
  "Ngân hàng Nhà nước Việt Nam (SBV)",
  "Ủy ban Chứng khoán Nhà nước (UBCKNN)",
  "Basel Committee on Banking Supervision",
] as const;

const PRIORITIES = ["low", "medium", "high", "critical"] as const;

const selectClass =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 dark:bg-input/30";

const formSchema = z.object({
  title: z.string().min(3, "Title is required"),
  description: z.string().min(10, "Description is required"),
  category: z.string().min(1, "Category is required"),
  regulatoryBody: z.string().min(1, "Regulatory body is required"),
  effectiveDate: z.string().min(1, "Effective date is required"),
  expirationDate: z.string().optional(),
  status: z.enum(["Effective", "Expired", "Superseded"]),
  priority: z.enum(PRIORITIES),
});

type FormValues = z.infer<typeof formSchema>;

export default function RegulationEditPage() {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { role } = useAuthStore();
  const canEdit = hasPermission(role, "regulation:update");

  const detail = useRegulationDetail(id);
  const update = useUpdateRegulation(id);

  const item = detail.data;

  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema as never) as Resolver<FormValues>,
    defaultValues: {
      title: "",
      description: "",
      category: "",
      regulatoryBody: "",
      effectiveDate: "",
      expirationDate: "",
      status: "Effective",
      priority: "medium",
    },
  });

  useEffect(() => {
    if (item) {
      reset({
        title: item.title,
        description: item.description,
        category: item.category,
        regulatoryBody: item.regulatoryBody,
        effectiveDate: item.effectiveDate.slice(0, 10),
        expirationDate: item.expirationDate?.slice(0, 10) ?? "",
        status: item.status,
        priority: item.priority,
      });
    }
  }, [item, reset]);

  const status = watch("status");
  const expirationDate = watch("expirationDate");

  const isPastExpiration = Boolean(
    expirationDate &&
      new Date(expirationDate) <
        new Date(new Date().setHours(0, 0, 0, 0)),
  );

  if (!canEdit) {
    return <Navigate to="/unauthorized" replace />;
  }

  if (detail.isPending) {
    return <DetailSkeleton />;
  }

  if (detail.isError || !item) {
    return <ErrorState onRetry={() => detail.refetch()} />;
  }

  const onSubmit = (values: FormValues) => {
    const payload: Partial<Regulation> = {
      title: values.title,
      description: values.description,
      category: values.category,
      regulatoryBody: values.regulatoryBody,
      effectiveDate: values.effectiveDate,
      expirationDate: values.expirationDate || undefined,
      status: isPastExpiration ? "Expired" : values.status,
      priority: values.priority,
    };

    update.mutate(payload, {
      onSuccess: () => {
        toast.success("Regulation updated");
        navigate(`/regulation/${id}`);
      },
      onError: (err) => {
        toast.error(err.message || "Failed to update regulation");
      },
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back
      </Button>

      <PageHero
        title="Edit Regulation"
        subtitle={`Update ${item.title}`}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Regulation Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                {...register("title")}
                aria-invalid={errors.title ? "true" : "false"}
              />
              {errors.title && (
                <p className="text-xs text-destructive">
                  {errors.title.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...register("description")}
                aria-invalid={errors.description ? "true" : "false"}
              />
              {errors.description && (
                <p className="text-xs text-destructive">
                  {errors.description.message}
                </p>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Controller
                  name="category"
                  control={control}
                  render={({ field }) => (
                    <select id="category" {...field} className={selectClass}>
                      <option value="">Select category</option>
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  )}
                />
                {errors.category && (
                  <p className="text-xs text-destructive">
                    {errors.category.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="regulatoryBody">Regulatory Body</Label>
                <Controller
                  name="regulatoryBody"
                  control={control}
                  render={({ field }) => (
                    <select
                      id="regulatoryBody"
                      {...field}
                      className={selectClass}
                    >
                      <option value="">Select regulatory body</option>
                      {REGULATORS.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  )}
                />
                {errors.regulatoryBody && (
                  <p className="text-xs text-destructive">
                    {errors.regulatoryBody.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="effectiveDate">Effective Date</Label>
                <Input
                  id="effectiveDate"
                  type="date"
                  {...register("effectiveDate")}
                  aria-invalid={errors.effectiveDate ? "true" : "false"}
                />
                {errors.effectiveDate && (
                  <p className="text-xs text-destructive">
                    {errors.effectiveDate.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="expirationDate">
                  Expiration Date{" "}
                  <span className="text-muted-foreground">(optional)</span>
                </Label>
                <Input
                  id="expirationDate"
                  type="date"
                  {...register("expirationDate")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Controller
                  name="priority"
                  control={control}
                  render={({ field }) => (
                    <select id="priority" {...field} className={selectClass}>
                      {PRIORITIES.map((p) => (
                        <option key={p} value={p}>
                          {p.charAt(0).toUpperCase() + p.slice(1)}
                        </option>
                      ))}
                    </select>
                  )}
                />
                {errors.priority && (
                  <p className="text-xs text-destructive">
                    {errors.priority.message}
                  </p>
                )}
              </div>

              <div className="flex items-end">
                <Controller
                  name="priority"
                  control={control}
                  render={({ field }) => (
                    <PriorityBadge priority={field.value} size="sm" />
                  )}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="status">Status</Label>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <select id="status" {...field} className={selectClass}>
                      {REGULATION_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  )}
                />
                {errors.status && (
                  <p className="text-xs text-destructive">
                    {errors.status.message}
                  </p>
                )}
                {isPastExpiration && status !== "Expired" && (
                  <p className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="size-3.5" aria-hidden="true" />
                    Expiration date is in the past. The regulation will be saved
                    as Expired.
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Articles</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              This regulation has {item.articles.length} article
              {item.articles.length === 1 ? "" : "s"}. Article editing is not
              supported in this view.
            </p>
          </CardContent>
        </Card>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(-1)}
            disabled={update.isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={update.isPending}>
            {update.isPending && (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            )}
            Save Changes
          </Button>
        </div>
      </form>
    </motion.div>
  );
}
