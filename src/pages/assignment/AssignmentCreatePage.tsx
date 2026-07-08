import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate, Navigate, Link, useSearchParams } from "react-router-dom";
import { useForm, Controller, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "motion/react";
import { format, addDays } from "date-fns";
import {
  BookOpen,
  Building2,
  Calendar,
  CheckCircle2,
  FileText,
  Loader2,
  Lock,
  Save,
  Search,
  Send,
  Tag,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb as BreadcrumbRoot,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  PageHero,
  PriorityBadge,
  StatusBadge,
  ErrorState,
} from "@/components/common";
import { DetailSkeleton } from "@/components/common/Skeletons";
import {
  useRegulationList,
  useRegulationDetail,
  useOrgUnits,
} from "@/hooks/queries";
import { useCreateAssignment } from "@/hooks/mutations";
import { useAuthStore } from "@/stores";
import { hasPermission } from "@/constants/rbac";
import { ROUTES } from "@/constants/routes";
import { PRIORITY_LEVELS } from "@/constants/status";
import { toast } from "sonner";
import type { CreateAssignmentInput, Regulation } from "@/types";

const PRIORITIES = PRIORITY_LEVELS;

const selectClass =
  "h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 dark:bg-input/30";

const formSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  priority: z.enum(PRIORITIES),
  dueDate: z.string().min(1, "Due date is required"),
  assignedDepartmentIds: z
    .array(z.string())
    .min(1, "At least one department is required"),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const defaultDueDate = format(addDays(new Date(), 30), "yyyy-MM-dd");

function Fact({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
        <Icon className="size-3.5" aria-hidden="true" />
      </div>
      <div className="min-w-0 space-y-0.5">
        <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
        <dd className="truncate text-sm font-medium text-foreground">
          {value}
        </dd>
      </div>
    </div>
  );
}

function RegulationCard({
  regulation,
  locked,
}: {
  regulation: Regulation;
  locked?: boolean;
}) {
  return (
    <Card className="overflow-hidden border-primary/15 bg-gradient-to-br from-primary/[0.04] to-card dark:border-primary/20 dark:from-primary/10">
      <CardHeader className="gap-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                <BookOpen className="size-3" aria-hidden="true" />
                Regulation
              </Badge>
              {locked && (
                <Badge
                  variant="outline"
                  className="gap-1 text-xs text-muted-foreground"
                >
                  <Lock className="size-3" aria-hidden="true" />
                  Locked
                </Badge>
              )}
            </div>
            <CardTitle className="text-base leading-snug">
              {regulation.title}
            </CardTitle>
            <CardDescription className="line-clamp-2">
              {regulation.description}
            </CardDescription>
          </div>
          <StatusBadge status={regulation.status} size="sm" />
        </div>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-4 sm:grid-cols-2">
          <Fact
            icon={Building2}
            label="Regulatory Body"
            value={regulation.regulatoryBody}
          />
          <Fact
            icon={Calendar}
            label="Effective Date"
            value={format(new Date(regulation.effectiveDate), "PPP")}
          />
          <Fact icon={Tag} label="Category" value={regulation.category} />
          <Fact
            icon={FileText}
            label="Articles"
            value={`${regulation.articles.length}`}
          />
        </dl>
      </CardContent>
    </Card>
  );
}

function RegulationPicker({
  regulations,
  loading,
  selectedId,
  onSelect,
}: {
  regulations: Regulation[];
  loading: boolean;
  selectedId: string | null;
  onSelect: (regulation: Regulation) => void;
}) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return regulations;
    return regulations.filter(
      (r) =>
        r.title.toLowerCase().includes(term) ||
        r.regulatoryBody.toLowerCase().includes(term) ||
        r.category.toLowerCase().includes(term),
    );
  }, [regulations, search]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Select a Regulation</CardTitle>
        <CardDescription>
          Choose an Effective or Superseded regulation to assign for review.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="relative">
          <Search
            className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            placeholder="Search by title, regulator, or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No regulations match your search.
          </p>
        ) : (
          <div className="max-h-[22rem] space-y-2 overflow-y-auto pr-1">
            {filtered.map((r) => {
              const isSelected = r.id === selectedId;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => onSelect(r)}
                  className={[
                    "flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors",
                    isSelected
                      ? "border-primary/40 bg-primary/5 ring-1 ring-primary/20"
                      : "border-border bg-card hover:border-primary/30 hover:bg-muted/40",
                  ].join(" ")}
                >
                  <div
                    className={[
                      "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border",
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-muted-foreground/30",
                    ].join(" ")}
                  >
                    {isSelected && (
                      <CheckCircle2 className="size-3.5" aria-hidden="true" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-sm font-medium">
                        {r.title}
                      </span>
                      <StatusBadge status={r.status} size="sm" />
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {r.regulatoryBody} ·{" "}
                      {format(new Date(r.effectiveDate), "MMM d, yyyy")}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function isSubsequence(query: string, target: string): boolean {
  let i = 0;
  for (let j = 0; j < target.length && i < query.length; j++) {
    if (query[i] === target[j]) i++;
  }
  return i === query.length;
}

function DepartmentTagInput({
  value,
  onChange,
  invalid,
}: {
  value: string[];
  onChange: (ids: string[]) => void;
  invalid?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [popupPos, setPopupPos] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const { data: orgUnitsData } = useOrgUnits();
  const departments = orgUnitsData?.hoDepartments ?? [];

  // Position the portal dropdown relative to the wrapper's bounding rect.
  useLayoutEffect(() => {
    if (!open) return;
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setPopupPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
  }, [open]);

  // Close on scroll (so the fixed popup never drifts) and recompute on resize.
  useEffect(() => {
    if (!open) return;
    const onScroll = () => setOpen(false);
    const onResize = () => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setPopupPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    };
    window.addEventListener("scroll", onScroll);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, [open]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return departments.filter((d) => {
      if (value.includes(d.id)) return false;
      if (!term) return true;
      return isSubsequence(term, d.name.toLowerCase());
    });
  }, [query, value, departments]);

  const add = (id: string) => {
    if (value.includes(id)) return;
    onChange([...value, id]);
    setQuery("");
  };

  const remove = (id: string) => {
    onChange(value.filter((v) => v !== id));
  };

  return (
    <div className="space-y-2">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((id) => {
            const name = orgUnitsData?.getUnitById(id)?.name ?? id;
            return (
              <Badge key={id} variant="secondary" className="gap-1 pr-1">
                {name}
                <button
                  type="button"
                  onClick={() => remove(id)}
                  className="rounded-full p-0.5 hover:bg-muted-foreground/20"
                  aria-label={`Remove ${name}`}
                >
                  <XCircle className="size-3" aria-hidden="true" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}
      <div className="relative" ref={containerRef}>
        <Search
          className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          placeholder="Search departments to assign..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          className="pl-8"
          aria-invalid={invalid ? "true" : "false"}
        />
        {open &&
          popupPos &&
          createPortal(
            <div
              style={{
                position: "fixed",
                top: popupPos.top,
                left: popupPos.left,
                width: popupPos.width,
                zIndex: 50,
              }}
              className="max-h-56 overflow-y-auto rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-md"
            >
              {filtered.length === 0 ? (
                <p className="px-2 py-1.5 text-sm text-muted-foreground">
                  No matching departments.
                </p>
              ) : (
                filtered.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      add(d.id);
                    }}
                    className="flex w-full items-center rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
                  >
                    {d.name}
                  </button>
                ))
              )}
            </div>,
            document.body,
          )}
      </div>
    </div>
  );
}

export default function AssignmentCreatePage() {
  const navigate = useNavigate();
  const { role } = useAuthStore();
  const canCreate = hasPermission(role, "assignment:create");

  const [searchParams] = useSearchParams();
  const regulationIdParam = searchParams.get("regulationId");

  const [pickedRegulationId, setPickedRegulationId] = useState<string | null>(
    null,
  );

  // Regulation detail (when regulationId query param is present)
  const regulationDetailQuery = useRegulationDetail(regulationIdParam ?? "");

  // Regulation list for the picker (Effective + Superseded only)
  const regulationsQuery = useRegulationList(
    { status: ["Effective", "Superseded"] },
    1,
    200,
  );

  const { data: orgUnitsData } = useOrgUnits();

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema as never) as Resolver<FormValues>,
    defaultValues: {
      title: "",
      description: "",
      priority: "medium",
      dueDate: defaultDueDate,
      assignedDepartmentIds: [],
      notes: "",
    },
  });

  // Resolve the selected regulation from either the param or the picker.
  const pickedRegulation = useMemo(
    () => regulationsQuery.data?.items.find((r) => r.id === pickedRegulationId),
    [regulationsQuery.data, pickedRegulationId],
  );

  const selectedRegulation: Regulation | undefined = regulationIdParam
    ? regulationDetailQuery.data
    : pickedRegulation;

  const isRegulationLocked = Boolean(regulationIdParam);

  // Pre-fill the title once a regulation is selected.
  useEffect(() => {
    if (selectedRegulation) {
      setValue("title", `Review Assignment - ${selectedRegulation.title}`, {
        shouldValidate: true,
      });
    }
  }, [selectedRegulation, setValue]);

  const createAssignment = useCreateAssignment();

  if (!canCreate) {
    return <Navigate to="/unauthorized" replace />;
  }

  const buildPayload = (
    values: FormValues,
    status: "draft" | "published",
  ): CreateAssignmentInput | null => {
    if (!selectedRegulation) {
      toast.error("Please select a regulation first");
      return null;
    }
    return {
      title: values.title,
      description: values.description ?? "",
      regulationId: selectedRegulation.id,
      regulationTitle: selectedRegulation.title,
      assignedDepartmentIds: values.assignedDepartmentIds,
      assignedDepartmentNames: values.assignedDepartmentIds
        .map((id) => orgUnitsData?.getUnitById(id)?.name)
        .filter((n): n is string => Boolean(n)),
      priority: values.priority,
      dueDate: new Date(values.dueDate).toISOString(),
      status,
      notes: values.notes || undefined,
    };
  };

  const submit = (status: "draft" | "published") => {
    handleSubmit((values) => {
      const payload = buildPayload(values, status);
      if (!payload) return;
      createAssignment.mutate(payload, {
        onSuccess: (data) => {
          toast.success(
            status === "published"
              ? "Assignment published and sent to department"
              : "Assignment saved as draft",
          );
          navigate(`/assignment/${data.id}`);
        },
        onError: (err) =>
          toast.error(err.message || "Failed to create assignment"),
      });
    })();
  };

  // Loading + error states for the locked regulation (query param mode).
  if (isRegulationLocked && regulationDetailQuery.isLoading) {
    return (
      <div className="space-y-6">
        <PageHero
          title="Create Review Assignment"
          subtitle="Loading regulation details..."
        />
        <DetailSkeleton />
      </div>
    );
  }

  if (isRegulationLocked && regulationDetailQuery.isError) {
    return (
      <div className="space-y-6">
        <PageHero
          title="Create Review Assignment"
          subtitle="The selected regulation could not be loaded."
        />
        <ErrorState
          title="Regulation not found"
          message="The regulation referenced in the link no longer exists or may have been archived."
          onRetry={() => navigate(ROUTES.REGULATION.LIBRARY)}
        />
      </div>
    );
  }

  const submitting = createAssignment.isPending;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <PageHero
        title="Create Review Assignment"
        subtitle="Route a regulation to the responsible department for compliance review."
      />

      {/* Contextual breadcrumb: Regulations → [selected regulation] → Create Assignment */}
      <BreadcrumbRoot>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link to={ROUTES.REGULATION.LIBRARY} />}>
              Regulations
            </BreadcrumbLink>
            <BreadcrumbSeparator />
          </BreadcrumbItem>
          {selectedRegulation ? (
            <BreadcrumbItem>
              <BreadcrumbLink
                render={<Link to={`/regulation/${selectedRegulation.id}`} />}
              >
                {selectedRegulation.title.length > 40
                  ? `${selectedRegulation.title.slice(0, 40)}…`
                  : selectedRegulation.title}
              </BreadcrumbLink>
              <BreadcrumbSeparator />
            </BreadcrumbItem>
          ) : (
            <BreadcrumbItem>
              <BreadcrumbPage>Select Regulation</BreadcrumbPage>
              <BreadcrumbSeparator />
            </BreadcrumbItem>
          )}
          <BreadcrumbItem>
            <BreadcrumbPage>Create Assignment</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </BreadcrumbRoot>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Left column — regulation metadata / picker */}
        <div className="space-y-6 lg:col-span-2">
          {selectedRegulation ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              <RegulationCard
                regulation={selectedRegulation}
                locked={isRegulationLocked}
              />
            </motion.div>
          ) : (
            <RegulationPicker
              regulations={regulationsQuery.data?.items ?? []}
              loading={regulationsQuery.isLoading}
              selectedId={pickedRegulationId}
              onSelect={(r) => setPickedRegulationId(r.id)}
            />
          )}
        </div>

        {/* Right column — assignment form */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Assignment Details</CardTitle>
              <CardDescription>
                Set the scope, priority, and destination for this review.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="title">
                  Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  {...register("title")}
                  placeholder="Review Assignment - ..."
                  aria-invalid={errors.title ? "true" : "false"}
                />
                {errors.title && (
                  <p className="text-xs text-destructive">
                    {errors.title.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">
                  Description{" "}
                  <span className="text-muted-foreground">(optional)</span>
                </Label>
                <Textarea
                  id="description"
                  {...register("description")}
                  placeholder="Summarize the scope and objectives of this review assignment..."
                  className="min-h-[5rem]"
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="priority">
                    Priority <span className="text-destructive">*</span>
                  </Label>
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
                  <div className="flex items-center gap-2 pt-0.5">
                    <PriorityBadge priority={watch("priority")} size="sm" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dueDate">
                    Due Date <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="dueDate"
                    type="date"
                    {...register("dueDate")}
                    aria-invalid={errors.dueDate ? "true" : "false"}
                  />
                  {errors.dueDate && (
                    <p className="text-xs text-destructive">
                      {errors.dueDate.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="assignedDepartmentIds">
                  Assign Departments <span className="text-destructive">*</span>
                </Label>
                <Controller
                  name="assignedDepartmentIds"
                  control={control}
                  render={({ field, fieldState }) => (
                    <DepartmentTagInput
                      value={field.value ?? []}
                      onChange={field.onChange}
                      invalid={Boolean(fieldState.error)}
                    />
                  )}
                />
                {errors.assignedDepartmentIds && (
                  <p className="text-xs text-destructive">
                    {errors.assignedDepartmentIds.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">
                  Notes{" "}
                  <span className="text-muted-foreground">(optional)</span>
                </Label>
                <Textarea
                  id="notes"
                  {...register("notes")}
                  placeholder="Add context, instructions, or references for the assigned department..."
                  className="min-h-[4rem]"
                />
              </div>
            </CardContent>
          </Card>

          {/* Action bar */}
          <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
              disabled={submitting}
            >
              <XCircle className="size-4" aria-hidden="true" />
              Cancel
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => submit("draft")}
              disabled={submitting || !selectedRegulation}
            >
              {submitting ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Save className="size-4" aria-hidden="true" />
              )}
              Save as Draft
            </Button>
            <Button
              type="button"
              onClick={() => submit("published")}
              disabled={submitting || !selectedRegulation}
            >
              {submitting ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Send className="size-4" aria-hidden="true" />
              )}
              Publish Assignment
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
