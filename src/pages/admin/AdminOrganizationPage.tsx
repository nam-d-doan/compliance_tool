import { useEffect, useMemo } from "react";
import {
  useForm,
  useFieldArray,
  Controller,
  type Resolver,
  type UseFormRegister,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "motion/react";
import {
  Building2,
  Users,
  LayoutGrid,
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
  "Vietnam",
  "Laos",
  "Cambodia",
  "Singapore",
  "Malaysia",
  "Indonesia",
  "China",
  "Hong Kong",
  "Taiwan",
  "South Korea",
  "Japan",
] as const;

const orgSchema = z.object({
  name: z.string().min(2, "Organization name is required"),
  industry: z.string().min(1, "Industry is required"),
  jurisdictions: z.array(z.string()).min(1, "Select at least one jurisdiction"),
  hoDepartments: z
    .array(z.object({ id: z.string(), name: z.string().min(1, "Required") }))
    .min(1),
  branches: z
    .array(
      z.object({
        id: z.string(),
        name: z.string().min(1, "Required"),
        region: z.string().min(1, "Required"),
      }),
    )
    .min(1),
});

type OrgFormValues = z.infer<typeof orgSchema>;

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
      hoDepartments: [{ id: "", name: "" }],
      branches: [{ id: "", name: "", region: "" }],
    },
  });

  const hoDepartmentsArray = useFieldArray({ control, name: "hoDepartments" });
  const branchesArray = useFieldArray({ control, name: "branches" });

  useEffect(() => {
    if (settings) {
      reset({
        name: settings.name,
        industry: settings.industry,
        jurisdictions: settings.jurisdictions,
        hoDepartments: settings.hoDepartments.map((d) => ({
          id: d.id,
          name: d.name,
        })),
        branches: settings.branches.map((b) => ({
          id: b.id,
          name: b.name,
          region: b.region,
        })),
      });
    }
  }, [settings, reset]);

  const selectedJurisdictions = watch("jurisdictions");

  const orgStats = useMemo(() => {
    const hoCount = settings?.hoDepartments.length ?? 0;
    const branchCount = settings?.branches.length ?? 0;
    const regionCount = new Set(settings?.branches.map((b) => b.region)).size;
    return {
      totalUsers: usersData?.total ?? 0,
      totalUnits: organizations.length,
      hoDepartments: hoCount,
      branches: branchCount,
      regions: regionCount,
    };
  }, [usersData, organizations, settings]);

  const handleSave = (values: OrgFormValues) => {
    const payload: Partial<OrganizationSettings> = {
      name: values.name,
      industry: values.industry,
      jurisdictions: values.jurisdictions,
      hoDepartments: values.hoDepartments,
      branches: values.branches,
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
          label="HO Departments"
          value={orgStats.hoDepartments}
          icon={LayoutGrid}
          loading={isPending}
        />
        <KPICard
          label="Branches"
          value={orgStats.branches}
          icon={Building2}
          loading={isPending}
        />
        <KPICard
          label="Regions"
          value={orgStats.regions}
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

        <div className="grid gap-6 md:grid-cols-2">
          <HoDepartmentListCard
            fields={hoDepartmentsArray.fields}
            append={() =>
              hoDepartmentsArray.append({
                id: `dept-${crypto.randomUUID().slice(0, 8)}`,
                name: "",
              })
            }
            remove={(index) => hoDepartmentsArray.remove(index)}
            register={register}
            error={errors.hoDepartments?.message}
          />
          <BranchListCard
            fields={branchesArray.fields}
            append={() =>
              branchesArray.append({
                id: `branch-${crypto.randomUUID().slice(0, 8)}`,
                name: "",
                region: "",
              })
            }
            remove={(index) => branchesArray.remove(index)}
            register={register}
            error={errors.branches?.message}
          />
        </div>

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

function HoDepartmentListCard({
  fields,
  append,
  remove,
  register,
  error,
}: {
  fields: { id: string; name: string }[];
  append: () => void;
  remove: (index: number) => void;
  register: UseFormRegister<OrgFormValues>;
  error?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">HO Departments</CardTitle>
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
              {...register(`hoDepartments.${index}.name` as const)}
              placeholder="Enter department name"
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

function BranchListCard({
  fields,
  append,
  remove,
  register,
  error,
}: {
  fields: { id: string; name: string; region: string }[];
  append: () => void;
  remove: (index: number) => void;
  register: UseFormRegister<OrgFormValues>;
  error?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Branches</CardTitle>
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
              {...register(`branches.${index}.name` as const)}
              placeholder="Branch name"
              className="flex-1"
            />
            <Input
              {...register(`branches.${index}.region` as const)}
              placeholder="Region"
              className="w-32"
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
