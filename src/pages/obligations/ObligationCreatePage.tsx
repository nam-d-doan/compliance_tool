import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { motion } from "motion/react";
import { format, parseISO, addDays } from "date-fns";
import {
  ArrowLeft,
  Building2,
  Calendar,
  CalendarClock,
  ClipboardList,
  Eraser,
  Loader2,
  Save,
  Send,
  Sparkles,
  Trash2,
  XCircle,
  AlertTriangle,
  FileText,
  GripVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  PageHero,
  PriorityBadge,
  StatusBadge,
  ErrorState,
} from "@/components/common";
import { DetailSkeleton } from "@/components/common/Skeletons";
import {
  useAssignmentDetail,
  useRegulationDetail,
  useOrgUnits,
} from "@/hooks/queries";
import { useBulkCreateObligations } from "@/hooks/mutations";
import { useAuthStore } from "@/stores";
import { hasPermission } from "@/constants/rbac";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";
import type {
  BulkObligationInputItem,
  ObligationRiskLevel,
  Article,
} from "@/types";

const RISK_LEVELS: ObligationRiskLevel[] = [
  "low",
  "medium",
  "high",
  "critical",
];

const selectClass =
  "h-9 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 dark:bg-input/30";

const inputClass =
  "h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

const textareaClass =
  "w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

interface ObligationRow {
  rowId: string;
  articleRef: string;
  title: string;
  description: string;
  ownerDepartmentId: string;
  dueDate: string; // yyyy-MM-dd
  riskLevel: ObligationRiskLevel;
}

interface RowErrors {
  articleRef?: string;
  title?: string;
}

let rowCounter = 0;
function makeRowId(): string {
  rowCounter += 1;
  return `row-${rowCounter}`;
}

function blankRow(defaultDept: string, defaultDueDate: string): ObligationRow {
  return {
    rowId: makeRowId(),
    articleRef: "",
    title: "",
    description: "",
    ownerDepartmentId: defaultDept,
    dueDate: defaultDueDate,
    riskLevel: "medium",
  };
}

function toInputDate(iso: string): string {
  try {
    return format(parseISO(iso), "yyyy-MM-dd");
  } catch {
    return format(addDays(new Date(), 30), "yyyy-MM-dd");
  }
}

export default function ObligationCreatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const assignmentId = searchParams.get("assignmentId") ?? undefined;
  const regulationIdParam = searchParams.get("regulationId") ?? undefined;
  const { role } = useAuthStore();
  const canCreate = hasPermission(role, "compliance:create");

  const bulkCreate = useBulkCreateObligations();

  const assignmentQuery = useAssignmentDetail(assignmentId ?? "");
  const assignment = assignmentQuery.data;
  const { data: orgUnitsData } = useOrgUnits();

  // Resolve the regulation: from the assignment's regulationId, or the query param.
  const effectiveRegulationId =
    assignment?.regulationId ?? regulationIdParam ?? "";
  const regulationQuery = useRegulationDetail(effectiveRegulationId);
  const regulation = regulationQuery.data;

  const isOverdue = assignment
    ? new Date(assignment.dueDate) < new Date() &&
      !["completed", "cancelled"].includes(assignment.status)
    : false;

  // Defaults derived from context.
  const defaultDept = assignment?.assignedDepartmentIds?.[0] ?? "";
  const defaultDueDate = assignment
    ? toInputDate(assignment.dueDate)
    : format(addDays(new Date(), 30), "yyyy-MM-dd");

  // Row state — start with 1 blank placeholder row. Initialized once after context loads
  // so the defaults propagate from the assignment.
  const [rows, setRows] = useState<ObligationRow[]>(() => [
    blankRow(
      assignment?.assignedDepartmentIds?.[0] ?? "",
      assignment ? toInputDate(assignment.dueDate) : defaultDueDate,
    ),
  ]);
  const [errors, setErrors] = useState<Record<string, RowErrors>>({});
  const [commonDueDate, setCommonDueDate] = useState("");

  // When the assignment finishes loading, refresh defaults on blank rows.
  // Only applies to rows the user hasn't touched (articleRef + title empty).
  const applyContextDefaults = useCallback(() => {
    if (!assignment) return;
    setRows((prev) =>
      prev.map((r) => {
        if (r.articleRef.trim() || r.title.trim()) return r;
        return {
          ...r,
          ownerDepartmentId: r.ownerDepartmentId || defaultDept,
          dueDate: r.dueDate || defaultDueDate,
        };
      }),
    );
  }, [assignment, defaultDept, defaultDueDate]);

  // Run once when assignment data arrives.
  useEffect(() => {
    if (assignmentQuery.isSuccess) applyContextDefaults();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignmentQuery.isSuccess]);

  const totalObligations = Math.max(0, rows.length - 1);

  // --- Row operations -------------------------------------------------------
  const removeRow = (rowId: string) => {
    setRows((prev) => {
      const filtered = prev.filter((r) => r.rowId !== rowId);
      // Preserve invariant: always end with a blank placeholder row.
      const last = filtered[filtered.length - 1];
      const needsPlaceholder =
        !last ||
        Boolean(last.articleRef.trim()) ||
        Boolean(last.title.trim()) ||
        Boolean(last.description.trim());
      if (needsPlaceholder) {
        filtered.push(blankRow(defaultDept, defaultDueDate));
      }
      return filtered;
    });
    setErrors((prev) => {
      const next = { ...prev };
      delete next[rowId];
      return next;
    });
  };

  const updateRow = (rowId: string, patch: Partial<ObligationRow>) => {
    setRows((prev) => {
      const updated = prev.map((r) =>
        r.rowId === rowId ? { ...r, ...patch } : r,
      );
      // Invariant: keep exactly one trailing blank placeholder row.
      // When the current last row gains content, append a fresh placeholder.
      const last = updated[updated.length - 1];
      const lastHasContent =
        Boolean(last.articleRef.trim()) ||
        Boolean(last.title.trim()) ||
        Boolean(last.description.trim());
      if (lastHasContent) {
        return [...updated, blankRow(defaultDept, defaultDueDate)];
      }
      return updated;
    });

    // Clear field errors on edit.
    setErrors((prev) => {
      if (!prev[rowId]) return prev;
      const next = { ...prev };
      const cleared: RowErrors = { ...next[rowId] };
      if (patch.articleRef !== undefined) delete cleared.articleRef;
      if (patch.title !== undefined) delete cleared.title;
      next[rowId] = cleared;
      if (!cleared.articleRef && !cleared.title) delete next[rowId];
      return next;
    });
  };

  const clearAll = () => {
    setRows([blankRow(defaultDept, defaultDueDate)]);
    setErrors({});
    toast.info("Cleared all rows");
  };

  // Drag-and-drop reorder: hold the source index in a ref, move once on drop.
  const dragRowIdx = useRef<number | null>(null);

  const reorderRows = (from: number, to: number) => {
    setRows((prev) => {
      // The trailing placeholder (last index) is never a reorder endpoint.
      const lastIdx = prev.length - 1;
      if (from === lastIdx || to === lastIdx || from === to) return prev;
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  };

  const applyCommonDueDate = () => {
    if (!commonDueDate) {
      toast.error("Pick a date first");
      return;
    }
    setRows((prev) => prev.map((r) => ({ ...r, dueDate: commonDueDate })));
    toast.success(
      `Applied due date to all ${totalObligations} obligation${totalObligations === 1 ? "" : "s"}`,
    );
  };

  // --- AI-populate stub -----------------------------------------------------
  const suggestFromRegulation = () => {
    if (!regulation || regulation.articles.length === 0) {
      toast.error("No articles available to suggest from");
      return;
    }
    const articles = regulation.articles;
    // Pick 3–5 articles spread across the regulation.
    const count = Math.min(
      articles.length,
      Math.max(3, Math.min(5, Math.floor(articles.length / 10) + 3)),
    );
    const step = Math.max(1, Math.floor(articles.length / count));
    const picked: Article[] = [];
    for (let i = 0; i < articles.length && picked.length < count; i += step) {
      picked.push(articles[i]);
    }
    const suggested = picked.map((art) => ({
      rowId: makeRowId(),
      articleRef: art.number,
      title: art.title,
      description: art.summary,
      ownerDepartmentId: defaultDept,
      dueDate: defaultDueDate,
      riskLevel: "medium" as ObligationRiskLevel,
    }));
    setRows([...suggested, blankRow(defaultDept, defaultDueDate)]);
    setErrors({});
    toast.success(
      `AI-populated ${suggested.length} obligation suggestions from regulation`,
    );
  };

  // --- Validation -----------------------------------------------------------
  const validateRows = (requireAll: boolean): ObligationRow[] => {
    const newErrors: Record<string, RowErrors> = {};
    const valid: ObligationRow[] = [];

    rows.forEach((r, index) => {
      // Skip the last placeholder row (it's always blank)
      const isPlaceholder =
        index === rows.length - 1 &&
        !r.articleRef.trim() &&
        !r.title.trim() &&
        !r.description.trim();
      if (isPlaceholder) return;

      const isEmpty = !r.articleRef.trim() && !r.title.trim();
      if (isEmpty && !requireAll) return; // skip blank rows for draft

      const rowErr: RowErrors = {};
      if (!r.articleRef.trim()) rowErr.articleRef = "Article Ref is required";
      if (!r.title.trim()) rowErr.title = "Title is required";
      if (Object.keys(rowErr).length) {
        newErrors[r.rowId] = rowErr;
      } else {
        valid.push(r);
      }
    });

    setErrors(newErrors);

    if (Object.keys(newErrors).length) {
      const invalidCount = Object.keys(newErrors).length;
      toast.error(
        `${invalidCount} row${invalidCount > 1 ? "s" : ""} need attention`,
      );
      return [];
    }
    return valid;
  };

  // --- Submit ---------------------------------------------------------------
  const buildPayload = (
    validRows: ObligationRow[],
    status: "draft" | "submitted",
  ) => {
    const obligations: BulkObligationInputItem[] = validRows.map((r) => {
      const dept = (orgUnitsData?.hoDepartments ?? []).find(
        (d) => d.id === r.ownerDepartmentId,
      );
      return {
        assignmentId: assignmentId,
        regulationId: effectiveRegulationId || undefined,
        articleRef: r.articleRef.trim(),
        title: r.title.trim(),
        description: r.description.trim(),
        ownerDepartmentId: r.ownerDepartmentId,
        ownerDepartmentName: dept?.name ?? r.ownerDepartmentId,
        dueDate: new Date(r.dueDate).toISOString(),
        riskLevel: r.riskLevel,
      };
    });
    return { obligations, status };
  };

  const handleSubmit = (status: "draft" | "submitted") => {
    const requireAll = status === "submitted";
    const valid = validateRows(requireAll);
    if (valid.length === 0) {
      if (requireAll) {
        toast.error("All rows must be valid before submitting");
      } else {
        toast.error("Add at least one valid obligation to save");
      }
      return;
    }
    const payload = buildPayload(valid, status);
    bulkCreate.mutate(payload, {
      onSuccess: (data) => {
        toast.success(
          status === "submitted"
            ? `Submitted ${data.created} obligation${data.created > 1 ? "s" : ""}`
            : `Saved ${data.created} draft obligation${data.created > 1 ? "s" : ""}`,
        );
        navigate(ROUTES.OBLIGATIONS.LIST);
      },
      onError: (err) => {
        toast.error(err.message || "Failed to save obligations");
      },
    });
  };

  // --- Guards & loading -----------------------------------------------------
  if (!canCreate) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card p-8 text-center">
        <h3 className="text-base font-semibold text-foreground">
          Unauthorized
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          You do not have permission to create obligations.
        </p>
        <Button
          variant="outline"
          className="mt-5"
          onClick={() => navigate("/obligations")}
        >
          Back to list
        </Button>
      </div>
    );
  }

  const loadingContext =
    (assignmentId && assignmentQuery.isLoading) ||
    (effectiveRegulationId && regulationQuery.isLoading);

  if (loadingContext) {
    return (
      <div className="space-y-6">
        <PageHero title="Create Obligations" subtitle="Loading context..." />
        <DetailSkeleton />
      </div>
    );
  }

  if (assignmentId && assignmentQuery.isError) {
    return (
      <div className="space-y-6">
        <PageHero title="Create Obligations" />
        <ErrorState
          title="Assignment not found"
          message="The assignment referenced in the link could not be loaded."
          onRetry={() => navigate(ROUTES.ASSIGNMENTS.LIST)}
        />
      </div>
    );
  }

  // --- Header context -------------------------------------------------------
  const headerTitle = assignment
    ? assignment.title
    : regulation
      ? regulation.title
      : "Create Obligations";

  const headerSubtitle = assignment
    ? `Batch obligation submission for ${assignment.assignedDepartmentNames?.[0] ?? assignment.assignedDepartmentIds[0]}`
    : regulation
      ? "Batch obligation submission from regulation articles"
      : "Define multiple obligations in one submission.";

  const submitting = bulkCreate.isPending;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mx-auto max-w-7xl space-y-6"
    >
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate(-1)}
        disabled={submitting}
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back
      </Button>

      <PageHero title={headerTitle} subtitle={headerSubtitle}>
        <div className="flex flex-col items-end gap-2">
          <Badge
            variant="outline"
            className="gap-1.5 border-white/30 bg-white/10 text-white"
          >
            <ClipboardList className="size-3.5" aria-hidden="true" />
            {totalObligations} obligation{totalObligations !== 1 ? "s" : ""}
          </Badge>
          {assignment && (
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={assignment.status} size="md" />
              <PriorityBadge priority={assignment.priority} size="md" />
            </div>
          )}
        </div>
      </PageHero>

      {/* Overdue warning */}
      {isOverdue && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 dark:border-amber-700 dark:bg-amber-950/40"
        >
          <AlertTriangle
            className="size-5 shrink-0 text-amber-600 dark:text-amber-400"
            aria-hidden="true"
          />
          <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
            This assignment was due{" "}
            {format(parseISO(assignment!.dueDate), "PPP")} and is now overdue.
            Submit obligations as soon as possible.
          </p>
        </motion.div>
      )}

      {/* Context summary card */}
      {(assignment || regulation) && (
        <Card>
          <CardContent className="pt-6">
            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {assignment && (
                <>
                  <ContextFact
                    icon={Building2}
                    label="Department"
                    value={
                      assignment.assignedDepartmentNames?.[0] ??
                      assignment.assignedDepartmentIds[0]
                    }
                  />
                  <ContextFact
                    icon={Calendar}
                    label="Due Date"
                    value={format(parseISO(assignment.dueDate), "PPP")}
                    danger={isOverdue}
                  />
                </>
              )}
              {regulation && (
                <>
                  <ContextFact
                    icon={FileText}
                    label="Regulation"
                    value={
                      regulation.title.length > 40
                        ? `${regulation.title.slice(0, 40)}…`
                        : regulation.title
                    }
                  />
                  <ContextFact
                    icon={ClipboardList}
                    label="Articles Available"
                    value={`${regulation.articles.length}`}
                  />
                </>
              )}
              {!assignment && regulation && (
                <ContextFact
                  icon={Calendar}
                  label="Default Due"
                  value={format(addDays(new Date(), 30), "PPP")}
                />
              )}
            </dl>
          </CardContent>
        </Card>
      )}

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={suggestFromRegulation}
            disabled={!regulation || submitting}
          >
            <Sparkles className="size-4" aria-hidden="true" />
            Suggest from Regulation
          </Button>
        </div>

        {/* Bulk operations */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5">
            <Input
              type="date"
              value={commonDueDate}
              onChange={(e) => setCommonDueDate(e.target.value)}
              className="h-8 w-auto text-xs"
              aria-label="Common due date"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={applyCommonDueDate}
              disabled={submitting || rows.length === 0}
            >
              <CalendarClock className="size-3.5" aria-hidden="true" />
              Apply to all
            </Button>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearAll}
            disabled={submitting || rows.length === 0}
            className="text-muted-foreground"
          >
            <Eraser className="size-3.5" aria-hidden="true" />
            Clear all
          </Button>
        </div>
      </div>

      {/* Table — desktop */}
      <Card className="hidden overflow-hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left">
                <th className="w-10 px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <span className="sr-only">Drag</span>
                </th>
                <th className="w-28 px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Article Ref <span className="text-destructive">*</span>
                </th>
                <th className="min-w-[12rem] px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Title <span className="text-destructive">*</span>
                </th>
                <th className="min-w-[16rem] px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Description
                </th>
                <th className="w-44 px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Owner (Dept)
                </th>
                <th className="w-40 px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Due Date
                </th>
                <th className="w-32 px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Risk Level
                </th>
                <th className="w-12 px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => {
                const rowErr = errors[row.rowId];
                const hasError = Boolean(rowErr);
                const isPlaceholder =
                  idx === rows.length - 1 &&
                  !row.articleRef.trim() &&
                  !row.title.trim() &&
                  !row.description.trim();
                const isDraggable = !isPlaceholder && totalObligations > 1;

                return (
                  <tr
                    key={row.rowId}
                    draggable={isDraggable}
                    onDragStart={() => {
                      if (isDraggable) dragRowIdx.current = idx;
                    }}
                    onDragOver={(e) => {
                      // Allow drop; never mutate state here (avoids re-render thrash).
                      if (isDraggable) e.preventDefault();
                    }}
                    onDrop={() => {
                      if (!isDraggable) return;
                      const from = dragRowIdx.current;
                      dragRowIdx.current = null;
                      if (from === null) return;
                      reorderRows(from, idx);
                    }}
                    onDragEnd={() => {
                      dragRowIdx.current = null;
                    }}
                    className={cn(
                      "border-b border-border/60 transition-colors",
                      hasError
                        ? "bg-red-50/60 dark:bg-red-950/20"
                        : idx % 2 === 0
                          ? "bg-card"
                          : "bg-muted/20",
                      isDraggable && "cursor-move hover:bg-muted/40",
                    )}
                  >
                    <td className="px-3 py-2 align-top">
                      {isDraggable ? (
                        <GripVertical className="size-4 text-muted-foreground cursor-grab active:cursor-grabbing" />
                      ) : (
                        <span className="size-4" />
                      )}
                    </td>
                    <td className="px-3 py-2 align-top">
                      <input
                        type="text"
                        value={row.articleRef}
                        onChange={(e) =>
                          updateRow(row.rowId, { articleRef: e.target.value })
                        }
                        placeholder="Điều 1"
                        className={cn(
                          inputClass,
                          rowErr?.articleRef && "border-destructive",
                        )}
                      />
                      {rowErr?.articleRef && (
                        <p className="mt-1 text-xs text-destructive">
                          {rowErr.articleRef}
                        </p>
                      )}
                    </td>
                    <td className="px-3 py-2 align-top">
                      <input
                        type="text"
                        value={row.title}
                        onChange={(e) =>
                          updateRow(row.rowId, { title: e.target.value })
                        }
                        placeholder="Obligation title"
                        className={cn(
                          inputClass,
                          rowErr?.title && "border-destructive",
                        )}
                      />
                      {rowErr?.title && (
                        <p className="mt-1 text-xs text-destructive">
                          {rowErr.title}
                        </p>
                      )}
                    </td>
                    <td className="px-3 py-2 align-top">
                      <textarea
                        value={row.description}
                        onChange={(e) =>
                          updateRow(row.rowId, { description: e.target.value })
                        }
                        placeholder="Brief description of the obligation..."
                        rows={2}
                        className={textareaClass}
                      />
                    </td>
                    <td className="px-3 py-2 align-top">
                      <select
                        value={row.ownerDepartmentId}
                        onChange={(e) =>
                          updateRow(row.rowId, {
                            ownerDepartmentId: e.target.value,
                          })
                        }
                        className={selectClass}
                      >
                        <option value="">Select dept</option>
                        {(orgUnitsData?.hoDepartments ?? []).map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2 align-top">
                      <input
                        type="date"
                        value={row.dueDate}
                        onChange={(e) =>
                          updateRow(row.rowId, { dueDate: e.target.value })
                        }
                        className={inputClass}
                      />
                    </td>
                    <td className="px-3 py-2 align-top">
                      <select
                        value={row.riskLevel}
                        onChange={(e) =>
                          updateRow(row.rowId, {
                            riskLevel: e.target.value as ObligationRiskLevel,
                          })
                        }
                        className={selectClass}
                      >
                        {RISK_LEVELS.map((r) => (
                          <option key={r} value={r}>
                            {r.charAt(0).toUpperCase() + r.slice(1)}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2 align-top">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => removeRow(row.rowId)}
                        disabled={submitting}
                        aria-label="Remove row"
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Card view — mobile */}
      <div className="space-y-3 md:hidden">
        {rows.map((row, idx) => {
          const rowErr = errors[row.rowId];
          const hasError = Boolean(rowErr);
          return (
            <Card
              key={row.rowId}
              className={cn(
                hasError &&
                  "border-destructive/60 bg-red-50/60 dark:bg-red-950/20",
              )}
            >
              <CardContent className="space-y-3 pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Row {idx + 1}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => removeRow(row.rowId)}
                    disabled={submitting}
                    aria-label="Remove row"
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </Button>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">
                    Article Ref <span className="text-destructive">*</span>
                  </Label>
                  <input
                    type="text"
                    value={row.articleRef}
                    onChange={(e) =>
                      updateRow(row.rowId, { articleRef: e.target.value })
                    }
                    placeholder="Điều 1"
                    className={cn(
                      inputClass,
                      rowErr?.articleRef && "border-destructive",
                    )}
                  />
                  {rowErr?.articleRef && (
                    <p className="text-xs text-destructive">
                      {rowErr.articleRef}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">
                    Title <span className="text-destructive">*</span>
                  </Label>
                  <input
                    type="text"
                    value={row.title}
                    onChange={(e) =>
                      updateRow(row.rowId, { title: e.target.value })
                    }
                    placeholder="Obligation title"
                    className={cn(
                      inputClass,
                      rowErr?.title && "border-destructive",
                    )}
                  />
                  {rowErr?.title && (
                    <p className="text-xs text-destructive">{rowErr.title}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Description</Label>
                  <textarea
                    value={row.description}
                    onChange={(e) =>
                      updateRow(row.rowId, { description: e.target.value })
                    }
                    placeholder="Brief description..."
                    rows={2}
                    className={textareaClass}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Owner (Dept)</Label>
                    <select
                      value={row.ownerDepartmentId}
                      onChange={(e) =>
                        updateRow(row.rowId, {
                          ownerDepartmentId: e.target.value,
                        })
                      }
                      className={selectClass}
                    >
                      <option value="">Select dept</option>
                      {(orgUnitsData?.hoDepartments ?? []).map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Due Date</Label>
                    <input
                      type="date"
                      value={row.dueDate}
                      onChange={(e) =>
                        updateRow(row.rowId, { dueDate: e.target.value })
                      }
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Risk Level</Label>
                  <select
                    value={row.riskLevel}
                    onChange={(e) =>
                      updateRow(row.rowId, {
                        riskLevel: e.target.value as ObligationRiskLevel,
                      })
                    }
                    className={selectClass}
                  >
                    {RISK_LEVELS.map((r) => (
                      <option key={r} value={r}>
                        {r.charAt(0).toUpperCase() + r.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Action bar */}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end border-t border-border pt-4">
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
          onClick={() => handleSubmit("draft")}
          disabled={submitting || rows.length === 0}
        >
          {submitting ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Save className="size-4" aria-hidden="true" />
          )}
          Save Draft
        </Button>
        <Button
          type="button"
          onClick={() => handleSubmit("submitted")}
          disabled={submitting || rows.length === 0}
        >
          {submitting ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Send className="size-4" aria-hidden="true" />
          )}
          Submit All
        </Button>
      </div>
    </motion.div>
  );
}

function ContextFact({
  icon: Icon,
  label,
  value,
  danger,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <div
      className={cn(
        "space-y-1 rounded-lg border bg-card p-3",
        danger ? "border-red-300 dark:border-red-700" : "border-border",
      )}
    >
      <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="size-3.5" aria-hidden="true" />
        {label}
      </dt>
      <dd className="text-sm font-semibold text-foreground">{value}</dd>
    </div>
  );
}
