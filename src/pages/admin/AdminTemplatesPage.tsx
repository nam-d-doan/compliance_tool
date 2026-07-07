import { useEffect, useMemo, useState } from "react";
import { useForm, Controller, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "motion/react";
import { Search, Plus, Eye, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { StatusBadge } from "@/components/common/StatusBadge";
import { PriorityBadge } from "@/components/common/PriorityBadge";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { TableSkeleton } from "@/components/common/Skeletons";
import { PageHero } from "@/components/common";
import { useAdminTemplates } from "@/hooks/queries/useAdminQueries";
import { useAdminUsers } from "@/hooks/queries/useAdminQueries";
import { useRegulationList } from "@/hooks/queries/useRegulationQueries";
import { useCreateTemplate } from "@/hooks/mutations/useAdminMutations";
import { toast } from "sonner";
import type { Template } from "@/types";

const CATEGORIES = [
  "AML/KYC",
  "Data Privacy",
  "Consumer Protection",
  "Market Conduct",
  "Operational Risk",
  "Capital Adequacy",
  "Cybersecurity",
  "Financial Reporting",
];

const FREQUENCIES = [
  "once",
  "monthly",
  "quarterly",
  "biannually",
  "annually",
] as const;
const CRITICALITY = ["low", "medium", "high", "critical"] as const;
const STATUSES = ["draft", "published", "archived"] as const;
const PAGE_SIZE = 10;
const selectClass =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 dark:bg-input/30";

const templateSchema = z.object({
  title: z.string().min(3, "Title is required"),
  description: z.string().min(10, "Description is required"),
  category: z.string().min(1, "Category is required"),
  frequency: z.enum(FREQUENCIES),
  ownerId: z.string().min(1, "Owner is required"),
  approverId: z.string().min(1, "Approver is required"),
  criticality: z.enum(CRITICALITY),
  applicableRegulationIds: z.array(z.string()).default([]),
  status: z.enum(STATUSES),
});

type TemplateFormValues = z.infer<typeof templateSchema>;

function TemplateForm({
  onSubmit,
  isSubmitting,
  submitLabel,
  onCancel,
}: {
  onSubmit: (values: TemplateFormValues) => void;
  isSubmitting: boolean;
  submitLabel: string;
  onCancel: () => void;
}) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<TemplateFormValues>({
    resolver: zodResolver(
      templateSchema as never,
    ) as Resolver<TemplateFormValues>,
    defaultValues: {
      frequency: "annually",
      criticality: "medium",
      status: "draft",
      applicableRegulationIds: [],
    },
  });

  const { data: usersData, isPending: usersLoading } = useAdminUsers(1, 200, {
    status: "Active",
  });
  const { data: regulationsData, isPending: regulationsLoading } =
    useRegulationList({ status: ["Effective", "Superseded"], pageSize: 200 });

  const owners = useMemo(
    () => usersData?.items.filter((u) => u.role === "owner") ?? [],
    [usersData],
  );
  const approvers = useMemo(
    () =>
      usersData?.items.filter(
        (u) => u.role === "approver" || u.role === "admin",
      ) ?? [],
    [usersData],
  );
  const regulations = useMemo(
    () => regulationsData?.items ?? [],
    [regulationsData],
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          {...register("title")}
          aria-invalid={errors.title ? "true" : "false"}
        />
        {errors.title && (
          <p className="text-xs text-destructive">{errors.title.message}</p>
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
          <Label htmlFor="frequency">Frequency</Label>
          <Controller
            name="frequency"
            control={control}
            render={({ field }) => (
              <select id="frequency" {...field} className={selectClass}>
                {FREQUENCIES.map((f) => (
                  <option key={f} value={f}>
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </option>
                ))}
              </select>
            )}
          />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="ownerId">Owner</Label>
          <Controller
            name="ownerId"
            control={control}
            render={({ field }) => (
              <select
                id="ownerId"
                {...field}
                disabled={usersLoading}
                className={selectClass}
              >
                <option value="">Select owner</option>
                {owners.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            )}
          />
          {errors.ownerId && (
            <p className="text-xs text-destructive">{errors.ownerId.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="approverId">Approver</Label>
          <Controller
            name="approverId"
            control={control}
            render={({ field }) => (
              <select
                id="approverId"
                {...field}
                disabled={usersLoading}
                className={selectClass}
              >
                <option value="">Select approver</option>
                {approvers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            )}
          />
          {errors.approverId && (
            <p className="text-xs text-destructive">
              {errors.approverId.message}
            </p>
          )}
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="criticality">Criticality</Label>
          <Controller
            name="criticality"
            control={control}
            render={({ field }) => (
              <select id="criticality" {...field} className={selectClass}>
                {CRITICALITY.map((c) => (
                  <option key={c} value={c}>
                    {c.charAt(0).toUpperCase() + c.slice(1)}
                  </option>
                ))}
              </select>
            )}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <select id="status" {...field} className={selectClass}>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>
            )}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Applicable Regulations</Label>
        <Controller
          name="applicableRegulationIds"
          control={control}
          render={({ field }) => (
            <div className="grid gap-2 sm:grid-cols-2">
              {regulationsLoading ? (
                <p className="text-sm text-muted-foreground">
                  Loading regulations...
                </p>
              ) : (
                regulations.map((reg) => {
                  const checked = field.value.includes(reg.id);
                  return (
                    <label
                      key={reg.id}
                      className="flex items-center gap-2 rounded-lg border border-border bg-card p-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        className="size-4 rounded border-input"
                        checked={checked}
                        onChange={(e) => {
                          const next = e.target.checked
                            ? [...field.value, reg.id]
                            : field.value.filter((id) => id !== reg.id);
                          field.onChange(next);
                        }}
                      />
                      <span className="truncate">{reg.title}</span>
                    </label>
                  );
                })
              )}
            </div>
          )}
        />
      </div>
      <SheetFooter className="pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          )}
          {submitLabel}
        </Button>
      </SheetFooter>
    </form>
  );
}

export default function AdminTemplatesPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");
  const [frequency, setFrequency] = useState("");
  const [page, setPage] = useState(1);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(
    null,
  );

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status, category, frequency]);

  const filters = useMemo(
    () => ({
      search: debouncedSearch,
      status: status || undefined,
    }),
    [debouncedSearch, status],
  );

  const { data, isPending, isError, refetch } = useAdminTemplates(
    page,
    PAGE_SIZE,
    filters,
  );
  const createTemplate = useCreateTemplate();

  const filteredItems = useMemo(() => {
    let items = data?.items ?? [];
    if (category) items = items.filter((t) => t.category === category);
    if (frequency) items = items.filter((t) => t.frequency === frequency);
    return items;
  }, [data, category, frequency]);

  const handleCreate = (values: TemplateFormValues) => {
    const owner = data?.items.find((t) => t.ownerId === values.ownerId) ?? {
      ownerId: values.ownerId,
      ownerName: "Unknown",
    };
    const approver = data?.items.find(
      (t) => t.approverId === values.approverId,
    ) ?? { approverId: values.approverId, approverName: "Unknown" };
    createTemplate.mutate(
      {
        ...values,
        ownerName: owner.ownerName,
        approverName: approver.approverName,
      },
      {
        onSuccess: () => {
          toast.success(`Template "${values.title}" created`);
          setIsCreateOpen(false);
        },
        onError: (err) =>
          toast.error(err.message || "Failed to create template"),
      },
    );
  };

  const totalPages = data ? Math.ceil(data.total / data.pageSize) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <PageHero
        title="Compliance Templates"
        subtitle="Manage reusable compliance templates across the organization."
      >
        <Sheet open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <SheetTrigger asChild>
            <Button className="bg-white text-[#0c3767] hover:bg-white/90">
              <Plus className="size-4" aria-hidden="true" />
              Create Template
            </Button>
          </SheetTrigger>
          <SheetContent className="sm:max-w-lg overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Create Template</SheetTitle>
              <SheetDescription>
                Define a reusable compliance template.
              </SheetDescription>
            </SheetHeader>
            <div className="px-4 pb-4">
              <TemplateForm
                onSubmit={handleCreate}
                isSubmitting={createTemplate.isPending}
                submitLabel="Create Template"
                onCancel={() => setIsCreateOpen(false)}
              />
            </div>
          </SheetContent>
        </Sheet>
      </PageHero>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div className="relative">
              <Search
                className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                placeholder="Search templates..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className={selectClass}
            >
              <option value="">All statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={selectClass}
            >
              <option value="">All categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              className={selectClass}
            >
              <option value="">All frequencies</option>
              {FREQUENCIES.map((f) => (
                <option key={f} value={f}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (
        <Card>
          <CardContent className="p-0">
            {isPending ? (
              <div className="p-4">
                <TableSkeleton rows={PAGE_SIZE} columns={7} />
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  title="No templates found"
                  description="Try adjusting your filters or create a new template."
                  action={
                    <Button onClick={() => setIsCreateOpen(true)}>
                      <Plus className="size-4" aria-hidden="true" />
                      Create Template
                    </Button>
                  }
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium">Title</th>
                      <th className="px-4 py-3 text-left font-medium">
                        Category
                      </th>
                      <th className="px-4 py-3 text-left font-medium">
                        Frequency
                      </th>
                      <th className="px-4 py-3 text-left font-medium">Owner</th>
                      <th className="px-4 py-3 text-left font-medium">
                        Criticality
                      </th>
                      <th className="px-4 py-3 text-left font-medium">
                        Status
                      </th>
                      <th className="px-4 py-3 text-right font-medium">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map((template) => (
                      <tr
                        key={template.id}
                        className="border-b border-border transition-colors hover:bg-muted/50"
                      >
                        <td className="px-4 py-3 font-medium whitespace-nowrap">
                          {template.title}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {template.category}
                        </td>
                        <td className="px-4 py-3 capitalize whitespace-nowrap">
                          {template.frequency}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {template.ownerName}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <PriorityBadge
                            priority={
                              template.criticality as (typeof CRITICALITY)[number]
                            }
                            size="sm"
                          />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <StatusBadge status={template.status} size="sm" />
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => setSelectedTemplate(template)}
                          >
                            <Eye className="size-4" aria-hidden="true" />
                            <span className="sr-only">View</span>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {!isPending && data && data.total > 0 && (
              <div className="flex items-center justify-between border-t border-border px-4 py-3">
                <span className="text-xs text-muted-foreground">
                  Showing {(data.page - 1) * data.pageSize + 1} -{" "}
                  {Math.min(data.page * data.pageSize, data.total)} of{" "}
                  {data.total}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Sheet
        open={Boolean(selectedTemplate)}
        onOpenChange={(open) => !open && setSelectedTemplate(null)}
      >
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Template Details</SheetTitle>
            <SheetDescription>{selectedTemplate?.title}</SheetDescription>
          </SheetHeader>
          {selectedTemplate && (
            <div className="space-y-4 px-4 pb-4 text-sm">
              <p className="text-muted-foreground">
                {selectedTemplate.description}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Fact label="Category" value={selectedTemplate.category} />
                <Fact label="Frequency" value={selectedTemplate.frequency} />
                <Fact label="Owner" value={selectedTemplate.ownerName} />
                <Fact label="Approver" value={selectedTemplate.approverName} />
                <Fact
                  label="Criticality"
                  value={selectedTemplate.criticality}
                />
                <Fact label="Status" value={selectedTemplate.status} />
              </div>
              <div>
                <h4 className="mb-2 font-medium">Applicable Regulations</h4>
                <div className="flex flex-wrap gap-1">
                  {selectedTemplate.applicableRegulationIds.length === 0 ? (
                    <span className="text-muted-foreground">None selected</span>
                  ) : (
                    selectedTemplate.applicableRegulationIds.map((id) => (
                      <span
                        key={id}
                        className="rounded-full bg-muted px-2 py-0.5 text-xs"
                      >
                        {id}
                      </span>
                    ))
                  )}
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setSelectedTemplate(null)}
              >
                <X className="size-4" aria-hidden="true" />
                Close
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </motion.div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-2.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium capitalize">{value}</p>
    </div>
  );
}
