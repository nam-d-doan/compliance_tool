import { useEffect } from "react";
import { useForm, Controller, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "motion/react";
import { format, parseISO, isSameMonth, isSameDay } from "date-fns";
import {
  Brain,
  Save,
  Loader2,
  MessageSquare,
  Clock,
  Activity,
  Info,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChartCard } from "@/components/charts";
import { LoadingState } from "@/components/common/LoadingState";
import { ErrorState } from "@/components/common/ErrorState";
import { useAdminAIConfig } from "@/hooks/queries/useAdminQueries";
import { useAdminAuditLogs } from "@/hooks/queries/useAdminQueries";
import { useUpdateAIConfig } from "@/hooks/mutations/useAdminMutations";
import { toast } from "sonner";

const MODELS = [
  "GPT-4o",
  "Claude 3.5 Sonnet",
  "Gemini 1.5 Pro",
  "Llama 3 70B",
] as const;
const SUGGESTION_LEVELS = [
  { value: "low", label: "Conservative" },
  { value: "medium", label: "Balanced" },
  { value: "high", label: "Aggressive" },
] as const;
const selectClass =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 dark:bg-input/30";

const aiConfigSchema = z.object({
  preferredModel: z.string().min(1, "Select a model"),
  confidenceThreshold: z.number().min(0).max(1),
  citationDisplay: z.boolean(),
  suggestionLevel: z.enum(["low", "medium", "high"] as const),
  autoRecommendation: z.boolean(),
  explainableAI: z.boolean(),
  conversationRetentionDays: z.number().min(1).max(365),
});

type AIConfigFormValues = z.infer<typeof aiConfigSchema>;

export default function AdminAIConfigPage() {
  const { data: config, isPending, isError, refetch } = useAdminAIConfig();
  const { data: auditData, isPending: auditPending } = useAdminAuditLogs(
    1,
    1000,
    { action: "ai_usage" },
  );
  const updateAIConfig = useUpdateAIConfig();

  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<AIConfigFormValues>({
    resolver: zodResolver(
      aiConfigSchema as never,
    ) as Resolver<AIConfigFormValues>,
    defaultValues: {
      preferredModel: "GPT-4o",
      confidenceThreshold: 0.75,
      citationDisplay: true,
      suggestionLevel: "medium",
      autoRecommendation: true,
      explainableAI: true,
      conversationRetentionDays: 90,
    },
  });

  useEffect(() => {
    if (config) {
      reset({
        preferredModel: config.preferredModel,
        confidenceThreshold: config.confidenceThreshold,
        citationDisplay: config.citationDisplay,
        suggestionLevel: config.suggestionLevel,
        autoRecommendation: config.autoRecommendation,
        explainableAI: config.explainableAI,
        conversationRetentionDays: config.conversationRetentionDays,
      });
    }
  }, [config, reset]);

  const threshold = watch("confidenceThreshold");

  const usageStats = (() => {
    const items = auditData?.items ?? [];
    const today = new Date();
    const queriesToday = items.filter((l) =>
      isSameDay(parseISO(l.timestamp), today),
    ).length;
    const queriesThisMonth = items.filter((l) =>
      isSameMonth(parseISO(l.timestamp), today),
    ).length;
    return {
      queriesToday,
      queriesThisMonth,
      avgResponseTime: "1.2s",
      topUseCases: [
        { useCase: "Compliance Risk Scoring", queries: 342 },
        { useCase: "CAP Suggestions", queries: 215 },
        { useCase: "Evidence Validation", queries: 189 },
        { useCase: "Regulation Summaries", queries: 156 },
        { useCase: "Executive Reports", queries: 98 },
      ],
    };
  })();

  const handleSave = (values: AIConfigFormValues) => {
    updateAIConfig.mutate(values, {
      onSuccess: () => toast.success("AI configuration saved"),
      onError: (err) => toast.error(err.message || "Failed to save AI config"),
    });
  };

  if (isError) {
    return <ErrorState onRetry={() => refetch()} />;
  }

  if (isPending) {
    return <LoadingState message="Loading AI configuration..." />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="rounded-[20px] bg-gradient-to-br from-[#0c3767] via-[#185b95] to-[#147769] p-6 text-white shadow-lg sm:p-7">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          AI Configuration
        </h1>
        <p className="mt-1 text-sm text-[#dcecff]">
          Control model selection, confidence thresholds, and explainability
          preferences.
        </p>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100">
        <div className="flex items-start gap-3">
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <p>
            This is a demo — AI configuration is illustrative and does not
            affect actual model behavior.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>AI Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(handleSave)} className="space-y-5">
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="preferredModel">Preferred Model</Label>
                  <Controller
                    name="preferredModel"
                    control={control}
                    render={({ field }) => (
                      <select
                        id="preferredModel"
                        {...field}
                        className={selectClass}
                      >
                        {MODELS.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="suggestionLevel">Suggestion Level</Label>
                  <Controller
                    name="suggestionLevel"
                    control={control}
                    render={({ field }) => (
                      <select
                        id="suggestionLevel"
                        {...field}
                        className={selectClass}
                      >
                        {SUGGESTION_LEVELS.map((s) => (
                          <option key={s.value} value={s.value}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="confidenceThreshold">
                    Confidence Threshold
                  </Label>
                  <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium">
                    {Math.round((threshold ?? 0.75) * 100)}%
                  </span>
                </div>
                <Controller
                  name="confidenceThreshold"
                  control={control}
                  render={({ field }) => (
                    <input
                      id="confidenceThreshold"
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={field.value}
                      onChange={(e) =>
                        field.onChange(parseFloat(e.target.value))
                      }
                      className="w-full accent-primary"
                    />
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="conversationRetentionDays">
                  Conversation Retention (days)
                </Label>
                <Input
                  id="conversationRetentionDays"
                  type="number"
                  min={1}
                  max={365}
                  {...register("conversationRetentionDays", {
                    valueAsNumber: true,
                  })}
                  aria-invalid={
                    errors.conversationRetentionDays ? "true" : "false"
                  }
                />
                {errors.conversationRetentionDays && (
                  <p className="text-xs text-destructive">
                    {errors.conversationRetentionDays.message}
                  </p>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <ToggleField
                  control={control}
                  name="citationDisplay"
                  label="Citation Display"
                  description="Show source references"
                />
                <ToggleField
                  control={control}
                  name="autoRecommendation"
                  label="Auto Recommendations"
                  description="Suggest next actions"
                />
                <ToggleField
                  control={control}
                  name="explainableAI"
                  label="Explainable AI"
                  description="Show reasoning steps"
                />
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={updateAIConfig.isPending}>
                  {updateAIConfig.isPending && (
                    <Loader2
                      className="size-4 animate-spin"
                      aria-hidden="true"
                    />
                  )}
                  <Save className="size-4" aria-hidden="true" />
                  Save Configuration
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Model Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                  <CheckCircle2 className="size-5" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Current Model</p>
                  <p className="font-semibold">{config?.preferredModel}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <Fact label="Version" value="2024-10" />
                <Fact label="Status" value="Active" />
                <Fact
                  label="Last Updated"
                  value={
                    config?.updatedAt
                      ? format(new Date(config.updatedAt), "MMM d, yyyy")
                      : "—"
                  }
                />
                <Fact label="Uptime" value="99.9%" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>AI Usage Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <MiniStat
                  label="Queries Today"
                  value={usageStats.queriesToday}
                  icon={MessageSquare}
                  loading={auditPending}
                />
                <MiniStat
                  label="Queries This Month"
                  value={usageStats.queriesThisMonth}
                  icon={Activity}
                  loading={auditPending}
                />
                <MiniStat
                  label="Avg Response"
                  value={usageStats.avgResponseTime}
                  icon={Clock}
                  loading={auditPending}
                />
                <MiniStat
                  label="Active Models"
                  value={MODELS.length}
                  icon={Brain}
                  loading={isPending}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <BarChartCard
        title="Top AI Use Cases"
        subtitle="Queries by use case"
        data={usageStats.topUseCases}
        xKey="useCase"
        yKeys={[{ key: "queries", name: "Queries" }]}
        loading={auditPending}
      />
    </motion.div>
  );
}

function ToggleField({
  control,
  name,
  label,
  description,
}: {
  control: ReturnType<typeof useForm<AIConfigFormValues>>["control"];
  name: "citationDisplay" | "autoRecommendation" | "explainableAI";
  label: string;
  description: string;
}) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-card p-3">
          <input
            type="checkbox"
            className="mt-0.5 size-4 rounded border-input"
            checked={field.value}
            onChange={(e) => field.onChange(e.target.checked)}
          />
          <div>
            <p className="text-sm font-medium">{label}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </label>
      )}
    />
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-2.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}

function MiniStat({
  label,
  value,
  icon: Icon,
  loading,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  loading?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
      <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-semibold">{loading ? "—" : value}</p>
      </div>
    </div>
  );
}
