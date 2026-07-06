import { useEffect, useMemo } from "react";
import {
  useForm,
  useFieldArray,
  Controller,
  type Resolver,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "motion/react";
import {
  Building2,
  Users,
  LayoutGrid,
  Briefcase,
  MapPin,
  Plus,
  Trash2,
  Loader2,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KPICard } from "@/components/common/KPICard";
import { ErrorState } from "@/components/common/ErrorState";
import { LoadingState } from "@/components/common/LoadingState";
import {
  useAdminOrganization,
  useAdminUsers,
} from "@/hooks/queries/useAdminQueries";
import { useUpdateOrganization } from "@/hooks/mutations/useAdminMutations";
import { toast } from "sonner";
import type { OrganizationSettings } from "@/types";

const JURISDICTIONS = [
  "United States",
  "United Kingdom",
  "Singapore",
  "Hong Kong",
  "European Union",
  "Japan",
  "Australia",
  "Canada",
  "UAE",
  "Switzerland",
] as const;

const FREQUENCIES = [
  "once",
  "monthly",
  "quarterly",
  "biannually",
  "annually",
] as const;
const CRITICALITY_OPTIONS = ["low", "medium", "high", "critical"] as const;

const penaltySchema = z.object({
  label: z.string().min(1, "Label is required"),
  value: z.number().min(0, "Value must be positive"),
});

const orgSchema = z.object({
  name: z.string().min(2, "Organization name is required"),
  industry: z.string().min(1, "Industry is required"),
  jurisdictions: z.array(z.string()).min(1, "Select at least one jurisdiction"),
  businessUnits: z
    .array(z.object({ value: z.string().min(1, "Required") }))
    .min(1),
  departments: z
    .array(z.object({ value: z.string().min(1, "Required") }))
    .min(1),
  locations: z.array(z.object({ value: z.string().min(1, "Required") })).min(1),
  defaultFrequency: z.enum(FREQUENCIES),
  criticalityLevels: z.array(z.string()).min(1, "Select at least one level"),
  penaltyThresholds: z.array(penaltySchema).min(1),
});

type OrgFormValues = z.infer<typeof orgSchema>;

function stringArrayToFields(values: string[]) {
  return values.map((value) => ({ value }));
}

function fieldsToStringArray(fields: { value: string }[]) {
  return fields.map((f) => f.value);
}

export default function AdminOrganizationPage() {
  const { data, isPending, isError, refetch } = useAdminOrganization();
  const { data: usersData, isPending: usersPending } = useAdminUsers(1, 1);
  const updateOrganization = useUpdateOrganization();

  const settings = data?.settings;
  const organizations = data?.organizations ?? [];

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<OrgFormValues>({
    resolver: zodResolver(orgSchema as never) as Resolver<OrgFormValues>,
    defaultValues: {
      name: "",
      industry: "",
      jurisdictions: [],
      businessUnits: [{ value: "" }],
      departments: [{ value: "" }],
      locations: [{ value: "" }],
      defaultFrequency: "quarterly",
      criticalityLevels: [],
      penaltyThresholds: [{ label: "", value: 0 }],
    },
  });

  const businessUnitsArray = useFieldArray({ control, name: "businessUnits" });
  const departmentsArray = useFieldArray({ control, name: "departments" });
  const locationsArray = useFieldArray({ control, name: "locations" });
  const penaltiesArray = useFieldArray({ control, name: "penaltyThresholds" });

  useEffect(() => {
    if (settings) {
      reset({
        name: settings.name,
        industry: settings.industry,
        jurisdictions: settings.jurisdictions,
        businessUnits: stringArrayToFields(settings.businessUnits),
        departments: stringArrayToFields(settings.departments),
        locations: stringArrayToFields(settings.locations),
        defaultFrequency:
          settings.defaultFrequency as OrgFormValues["defaultFrequency"],
        criticalityLevels: settings.criticalityLevels,
        penaltyThresholds: settings.penaltyThresholds,
      });
    }
  }, [settings, reset]);

  const selectedJurisdictions = watch("jurisdictions");
  const selectedCriticality = watch("criticalityLevels");

  const orgStats = useMemo(() => {
    return {
      totalUsers: usersData?.total ?? 0,
      totalUnits: organizations.length,
      departments: organizations.filter((o) => o.type === "department").length,
      businessUnits: organizations.filter((o) => o.type === "business_unit")
        .length,
      locations: organizations.filter((o) => o.type === "location").length,
    };
  }, [usersData, organizations]);

  const handleSave = (values: OrgFormValues) => {
    const payload: Partial<OrganizationSettings> = {
      name: values.name,
      industry: values.industry,
      jurisdictions: values.jurisdictions,
      businessUnits: fieldsToStringArray(values.businessUnits),
      departments: fieldsToStringArray(values.departments),
      locations: fieldsToStringArray(values.locations),
      defaultFrequency: values.defaultFrequency,
      criticalityLevels: values.criticalityLevels,
      penaltyThresholds: values.penaltyThresholds,
    };
    updateOrganization.mutate(payload, {
      onSuccess: () => toast.success("Organization settings saved"),
      onError: (err) => toast.error(err.message || "Failed to save settings"),
    });
  };

  if (isError) {
    return <ErrorState onRetry={() => refetch()} />;
  }

  if (isPending) {
    return <LoadingState message="Loading organization settings..." />;
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
          Organization Settings
        </h1>
        <p className="mt-1 text-sm text-[#dcecff]">
          Manage entity structure, jurisdictions, and default compliance
          parameters.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <KPICard
          label="Total Users"
          value={orgStats.totalUsers}
          icon={Users}
          loading={usersPending}
        />
        <KPICard
          label="Org Units"
          value={orgStats.totalUnits}
          icon={Building2}
          loading={isPending}
        />
        <KPICard
          label="Departments"
          value={orgStats.departments}
          icon={LayoutGrid}
          loading={isPending}
        />
        <KPICard
          label="Business Units"
          value={orgStats.businessUnits}
          icon={Briefcase}
          loading={isPending}
        />
        <KPICard
          label="Locations"
          value={orgStats.locations}
          icon={MapPin}
          loading={isPending}
        />
      </div>

      <form onSubmit={handleSubmit(handleSave)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Organization Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Organization Name</Label>
                <Input
                  id="name"
                  {...register("name")}
                  aria-invalid={errors.name ? "true" : "false"}
                />
                {errors.name && (
                  <p className="text-xs text-destructive">
                    {errors.name.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="industry">Industry</Label>
                <Input
                  id="industry"
                  {...register("industry")}
                  aria-invalid={errors.industry ? "true" : "false"}
                />
                {errors.industry && (
                  <p className="text-xs text-destructive">
                    {errors.industry.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Jurisdictions</Label>
              <Controller
                name="jurisdictions"
                control={control}
                render={({ field }) => (
                  <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                    {JURISDICTIONS.map((jurisdiction) => {
                      const checked = field.value.includes(jurisdiction);
                      return (
                        <label
                          key={jurisdiction}
                          className="flex items-center gap-2 rounded-lg border border-border bg-card p-2 text-sm"
                        >
                          <input
                            type="checkbox"
                            className="size-4 rounded border-input"
                            checked={checked}
                            onChange={(e) => {
                              const next = e.target.checked
                                ? [...field.value, jurisdiction]
                                : field.value.filter((j) => j !== jurisdiction);
                              field.onChange(next);
                            }}
                          />
                          <span className="truncate">{jurisdiction}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              />
              {errors.jurisdictions && (
                <p className="text-xs text-destructive">
                  {errors.jurisdictions.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-3">
          <ListCard
            title="Business Units"
            fields={businessUnitsArray.fields}
            append={() => businessUnitsArray.append({ value: "" })}
            remove={(index) => businessUnitsArray.remove(index)}
            register={register}
            name="businessUnits"
            error={errors.businessUnits?.message}
          />
          <ListCard
            title="Departments"
            fields={departmentsArray.fields}
            append={() => departmentsArray.append({ value: "" })}
            remove={(index) => departmentsArray.remove(index)}
            register={register}
            name="departments"
            error={errors.departments?.message}
          />
          <ListCard
            title="Locations"
            fields={locationsArray.fields}
            append={() => locationsArray.append({ value: "" })}
            remove={(index) => locationsArray.remove(index)}
            register={register}
            name="locations"
            error={errors.locations?.message}
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Compliance Defaults</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="defaultFrequency">Default Frequency</Label>
                <Controller
                  name="defaultFrequency"
                  control={control}
                  render={({ field }) => (
                    <select
                      id="defaultFrequency"
                      {...field}
                      className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                    >
                      {FREQUENCIES.map((f) => (
                        <option key={f} value={f}>
                          {f.charAt(0).toUpperCase() + f.slice(1)}
                        </option>
                      ))}
                    </select>
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label>Criticality Levels</Label>
                <Controller
                  name="criticalityLevels"
                  control={control}
                  render={({ field }) => (
                    <div className="flex flex-wrap gap-2">
                      {CRITICALITY_OPTIONS.map((level) => {
                        const checked = field.value.includes(level);
                        return (
                          <label
                            key={level}
                            className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-sm"
                          >
                            <input
                              type="checkbox"
                              className="size-4 rounded border-input"
                              checked={checked}
                              onChange={(e) => {
                                const next = e.target.checked
                                  ? [...field.value, level]
                                  : field.value.filter((l) => l !== level);
                                field.onChange(next);
                              }}
                            />
                            <span className="capitalize">{level}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                />
                {errors.criticalityLevels && (
                  <p className="text-xs text-destructive">
                    {errors.criticalityLevels.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Penalty Thresholds</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={() => penaltiesArray.append({ label: "", value: 0 })}
                >
                  <Plus className="size-3.5" aria-hidden="true" />
                  Add Threshold
                </Button>
              </div>
              <div className="space-y-2">
                {penaltiesArray.fields.map((field, index) => (
                  <div key={field.id} className="flex items-center gap-2">
                    <Input
                      placeholder="Label"
                      {...register(`penaltyThresholds.${index}.label` as const)}
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      placeholder="Amount"
                      {...register(
                        `penaltyThresholds.${index}.value` as const,
                        { valueAsNumber: true },
                      )}
                      className="w-32"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => penaltiesArray.remove(index)}
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </Button>
                  </div>
                ))}
              </div>
              {errors.penaltyThresholds && (
                <p className="text-xs text-destructive">
                  {errors.penaltyThresholds.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={updateOrganization.isPending}>
            {updateOrganization.isPending && (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            )}
            <Save className="size-4" aria-hidden="true" />
            Save Settings
          </Button>
        </div>
      </form>
    </motion.div>
  );
}

function ListCard({
  title,
  fields,
  append,
  remove,
  register,
  name,
  error,
}: {
  title: string;
  fields: { id: string; value: string }[];
  append: () => void;
  remove: (index: number) => void;
  register: ReturnType<typeof useForm<OrgFormValues>>["register"];
  name: "businessUnits" | "departments" | "locations";
  error?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Button type="button" variant="outline" size="xs" onClick={append}>
            <Plus className="size-3.5" aria-hidden="true" />
            Add
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {fields.map((field, index) => (
          <div key={field.id} className="flex items-center gap-2">
            <Input
              {...register(`${name}.${index}.value` as const)}
              placeholder={`Enter ${title.toLowerCase()}`}
              className="flex-1"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={() => remove(index)}
            >
              <Trash2 className="size-4" aria-hidden="true" />
            </Button>
          </div>
        ))}
        {fields.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No items. Click Add to create one.
          </p>
        )}
        {error && <p className="text-xs text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}
