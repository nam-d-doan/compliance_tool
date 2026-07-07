import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "motion/react";
import { format, isBefore, parseISO } from "date-fns";
import {
  PlusCircle,
  Pencil,
  BookOpen,
  Ban,
  ArrowRight,
  Filter,
  X,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  PageHero,
  StatusBadge,
  PriorityBadge,
  EmptyState,
  ListSkeleton,
} from "@/components/common";
import { useAssignmentList } from "@/hooks/queries";
import { useBulkUpdateAssignments } from "@/hooks/mutations";
import { useAuthStore } from "@/stores";
import { hasPermission } from "@/constants/rbac";
import { ROUTES } from "@/constants/routes";
import {
  VIETNAMESE_DEPARTMENTS,
  getOfficesForDepartment,
} from "@/constants/departments";
import { ASSIGNMENT_STATUSES, PRIORITY_LEVELS } from "@/constants/status";
import type { Assignment } from "@/types";
import type { AssignmentStatus, PriorityLevel } from "@/constants/status";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const selectClass =
  "h-9 rounded-lg border border-input bg-transparent px-3 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

const STATUS_OPTIONS = ASSIGNMENT_STATUSES as readonly AssignmentStatus[];

function isOverdue(a: Assignment): boolean {
  return (
    isBefore(new Date(a.dueDate), new Date()) &&
    !["completed", "cancelled"].includes(a.status)
  );
}

export default function AssignmentListPage() {
  const { role, user } = useAuthStore();
  const canCreate = hasPermission(role, "assignment:create");
  const canUpdate = hasPermission(role, "assignment:update");

  const [searchParams, setSearchParams] = useSearchParams();

  // Initialize filters from URL query params (for dashboard prefiltering)
  const [statuses, setStatuses] = useState<AssignmentStatus[]>(() => {
    const raw = searchParams.get("status");
    if (!raw) return [];
    return raw
      .split(",")
      .filter((s): s is AssignmentStatus =>
        (STATUS_OPTIONS as readonly string[]).includes(s),
      );
  });
  const [priority, setPriority] = useState<PriorityLevel | "">(
    (searchParams.get("priority") as PriorityLevel) ?? "",
  );
  const [department, setDepartment] = useState(
    searchParams.get("department") ?? "",
  );
  const [office, setOffice] = useState(searchParams.get("office") ?? "");
  const [dueDateFrom, setDueDateFrom] = useState(
    searchParams.get("dueDateFrom") ?? "",
  );
  const [dueDateTo, setDueDateTo] = useState(
    searchParams.get("dueDateTo") ?? "",
  );
  const [search, setSearch] = useState(searchParams.get("q") ?? "");

  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Office options depend on the chosen department
  const officeOptions = getOfficesForDepartment(department);

  // Clear office when department changes
  useEffect(() => {
    if (office && !officeOptions.some((o) => o.id === office)) {
      setOffice("");
    }
  }, [officeOptions, office]);

  // Sync filters back to URL (so links can be shared)
  useEffect(() => {
    const params = new URLSearchParams();
    if (statuses.length) params.set("status", statuses.join(","));
    if (priority) params.set("priority", priority);
    if (department) params.set("department", department);
    if (office) params.set("office", office);
    if (dueDateFrom) params.set("dueDateFrom", dueDateFrom);
    if (dueDateTo) params.set("dueDateTo", dueDateTo);
    if (search) params.set("q", search);
    setSearchParams(params, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statuses, priority, department, office, dueDateFrom, dueDateTo, search]);

  const filters = useMemo(
    () => ({
      status: statuses.length ? statuses : undefined,
      priority: priority || undefined,
      department: department || undefined,
      office: office || undefined,
      dueDateFrom: dueDateFrom || undefined,
      dueDateTo: dueDateTo || undefined,
      search: search || undefined,
    }),
    [statuses, priority, department, office, dueDateFrom, dueDateTo, search],
  );

  const { data, isLoading, isFetching } = useAssignmentList(filters, 1, 100);
  const assignments = data?.items ?? [];

  const bulk = useBulkUpdateAssignments(filters);

  const hasActiveFilters =
    statuses.length > 0 ||
    priority !== "" ||
    department !== "" ||
    office !== "" ||
    dueDateFrom !== "" ||
    dueDateTo !== "" ||
    search !== "";

  const clearFilters = () => {
    setStatuses([]);
    setPriority("");
    setDepartment("");
    setOffice("");
    setDueDateFrom("");
    setDueDateTo("");
    setSearch("");
  };

  const toggleStatus = (s: AssignmentStatus) => {
    setStatuses((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    );
  };

  const toggleSelected = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelected((prev) => {
      if (prev.size === assignments.length) return new Set();
      return new Set(assignments.map((a) => a.id));
    });
  };

  const selectedIds = useMemo(() => Array.from(selected), [selected]);

  const handleBulkCancel = () => {
    if (selectedIds.length === 0) return;
    if (
      !window.confirm(
        `Cancel ${selectedIds.length} selected assignment(s)? This cannot be undone.`,
      )
    )
      return;
    bulk.mutate(
      { ids: selectedIds, action: "cancel" },
      {
        onSuccess: (res) => {
          toast.success(`Cancelled ${res.updated} assignment(s)`);
          setSelected(new Set());
        },
        onError: (err) => toast.error(err.message || "Bulk cancel failed"),
      },
    );
  };

  const handleBulkPriority = (p: PriorityLevel) => {
    if (selectedIds.length === 0) return;
    bulk.mutate(
      { ids: selectedIds, action: "setPriority", priority: p },
      {
        onSuccess: (res) => {
          toast.success(`Updated priority for ${res.updated} assignment(s)`);
          setSelected(new Set());
        },
        onError: (err) => toast.error(err.message || "Bulk update failed"),
      },
    );
  };

  const allSelected =
    assignments.length > 0 && selected.size === assignments.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <PageHero
        title="Review Assignments"
        subtitle="Track regulations routed to departments for compliance review."
      >
        {canCreate && (
          <Button
            variant="outline"
            size="sm"
            className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white"
            asChild
          >
            <Link to={ROUTES.ASSIGNMENTS.CREATE}>
              <PlusCircle className="size-4" aria-hidden="true" />
              Create Assignment
            </Link>
          </Button>
        )}
      </PageHero>

      <Card>
        <CardContent className="space-y-4 pt-6">
          {/* Filter bar */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Filter
                className="size-4 text-muted-foreground"
                aria-hidden="true"
              />
              <span className="text-sm font-medium text-muted-foreground">
                Filters
              </span>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={clearFilters}
                >
                  <X className="size-3" aria-hidden="true" />
                  Clear all
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {/* Status multiselect */}
              <DropdownMenu>
                <DropdownMenuTrigger
                  className={cn(
                    selectClass,
                    "flex w-full items-center justify-between",
                  )}
                >
                  <span className="truncate">
                    {statuses.length === 0
                      ? "All statuses"
                      : statuses.length === 1
                        ? statuses[0]
                        : `${statuses.length} statuses`}
                  </span>
                  <ChevronDown
                    className="size-4 opacity-60"
                    aria-hidden="true"
                  />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuLabel>Filter by status</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {STATUS_OPTIONS.map((s) => (
                    <DropdownMenuItem
                      key={s}
                      onClick={() => toggleStatus(s)}
                      className="gap-2 capitalize"
                    >
                      <Checkbox checked={statuses.includes(s)} />
                      {s.replace(/_/g, " ")}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Priority */}
              <select
                value={priority}
                onChange={(e) =>
                  setPriority(e.target.value as PriorityLevel | "")
                }
                className={cn(selectClass, "w-full")}
              >
                <option value="">All priorities</option>
                {PRIORITY_LEVELS.map((p) => (
                  <option key={p} value={p}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </option>
                ))}
              </select>

              {/* Department */}
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className={cn(selectClass, "w-full")}
              >
                <option value="">All departments</option>
                {VIETNAMESE_DEPARTMENTS.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>

              {/* Office */}
              <select
                value={office}
                onChange={(e) => setOffice(e.target.value)}
                disabled={officeOptions.length === 0}
                className={cn(selectClass, "w-full")}
              >
                <option value="">
                  {officeOptions.length === 0
                    ? "No sub-offices"
                    : "All offices"}
                </option>
                {officeOptions.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Due from
                </label>
                <input
                  type="date"
                  value={dueDateFrom}
                  onChange={(e) => setDueDateFrom(e.target.value)}
                  className={cn(selectClass, "w-full")}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Due to
                </label>
                <input
                  type="date"
                  value={dueDateTo}
                  onChange={(e) => setDueDateTo(e.target.value)}
                  className={cn(selectClass, "w-full")}
                />
              </div>
              <input
                type="text"
                placeholder="Search assignments..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={cn(selectClass, "w-full")}
              />
            </div>
          </div>

          {/* Bulk action bar */}
          {canUpdate && selected.size > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-wrap items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2"
            >
              <span className="text-sm font-medium">
                {selected.size} selected
              </span>
              <div className="ml-auto flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkCancel}
                  disabled={bulk.isPending}
                  className="text-destructive hover:text-destructive"
                >
                  <Ban className="size-3.5" aria-hidden="true" />
                  Cancel selected
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={bulk.isPending}
                    >
                      {bulk.isPending ? (
                        <Loader2
                          className="size-3.5 animate-spin"
                          aria-hidden="true"
                        />
                      ) : null}
                      Change priority
                      <ChevronDown className="size-3.5" aria-hidden="true" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Set priority</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {PRIORITY_LEVELS.map((p) => (
                      <DropdownMenuItem
                        key={p}
                        onClick={() => handleBulkPriority(p)}
                        className="gap-2 capitalize"
                      >
                        <PriorityBadge priority={p} size="sm" />
                        {p}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelected(new Set())}
                >
                  Clear
                </Button>
              </div>
            </motion.div>
          )}

          {/* Table */}
          {isLoading || isFetching ? (
            <ListSkeleton />
          ) : assignments.length === 0 ? (
            <EmptyState
              title="No assignments"
              description={
                hasActiveFilters
                  ? "No assignments match your filters. Try clearing them."
                  : "Create a review assignment to route a regulation to a department."
              }
              action={
                hasActiveFilters ? (
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    Clear filters
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
                    {canUpdate && (
                      <th className="w-10 px-3 py-2.5">
                        <Checkbox
                          checked={allSelected}
                          onCheckedChange={toggleSelectAll}
                        />
                      </th>
                    )}
                    <th className="px-3 py-2.5 font-medium">Title</th>
                    <th className="hidden px-3 py-2.5 font-medium md:table-cell">
                      Regulation
                    </th>
                    <th className="hidden px-3 py-2.5 font-medium lg:table-cell">
                      Department / Office
                    </th>
                    <th className="px-3 py-2.5 font-medium">Status</th>
                    <th className="hidden px-3 py-2.5 font-medium sm:table-cell">
                      Priority
                    </th>
                    <th className="px-3 py-2.5 font-medium">Due Date</th>
                    <th className="hidden px-3 py-2.5 font-medium xl:table-cell">
                      Assignor
                    </th>
                    <th className="w-10 px-3 py-2.5 text-right font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map((a) => {
                    const overdue = isOverdue(a);
                    const isCreator = a.assignorId === user?.id;
                    const rowSelected = selected.has(a.id);
                    return (
                      <tr
                        key={a.id}
                        className={cn(
                          "border-b border-border transition-colors last:border-b-0 hover:bg-muted/30",
                          rowSelected && "bg-primary/5",
                        )}
                      >
                        {canUpdate && (
                          <td className="px-3 py-3">
                            <Checkbox
                              checked={rowSelected}
                              onCheckedChange={() => toggleSelected(a.id)}
                            />
                          </td>
                        )}
                        <td className="px-3 py-3">
                          <Link
                            to={`/assignment/${a.id}`}
                            className="group flex items-center gap-2"
                          >
                            <span className="truncate font-medium text-foreground group-hover:text-primary">
                              {a.title}
                            </span>
                            {overdue && (
                              <Badge
                                variant="destructive"
                                className="shrink-0 text-xs"
                              >
                                Overdue
                              </Badge>
                            )}
                          </Link>
                        </td>
                        <td className="hidden max-w-[14rem] min-w-0 px-3 py-3 md:table-cell">
                          <Link
                            to={`/regulation/${a.regulationId}`}
                            className="block truncate text-muted-foreground hover:text-primary"
                            title={a.regulationTitle}
                          >
                            {a.regulationTitle ?? a.regulationId}
                          </Link>
                        </td>
                        <td className="hidden px-3 py-3 lg:table-cell">
                          <div className="text-xs">
                            <div className="font-medium text-foreground">
                              {a.assignedDepartmentName ??
                                a.assignedDepartmentId}
                            </div>
                            {a.assignedOfficeName && (
                              <div className="text-muted-foreground">
                                {a.assignedOfficeName}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <StatusBadge status={a.status} size="sm" />
                        </td>
                        <td className="hidden px-3 py-3 sm:table-cell">
                          <PriorityBadge priority={a.priority} size="sm" />
                        </td>
                        <td className="px-3 py-3">
                          <span
                            className={cn(
                              "text-xs",
                              overdue
                                ? "font-semibold text-red-600 dark:text-red-400"
                                : "text-muted-foreground",
                            )}
                          >
                            {format(parseISO(a.dueDate), "MMM d, yyyy")}
                          </span>
                        </td>
                        <td className="hidden px-3 py-3 text-xs text-muted-foreground xl:table-cell">
                          {a.assignorName ?? a.assignorId}
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center justify-end gap-1">
                            {canUpdate && isCreator && (
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                asChild
                                className="text-muted-foreground hover:text-foreground"
                              >
                                <Link to={`/assignment/${a.id}`}>
                                  <Pencil
                                    className="size-3.5"
                                    aria-hidden="true"
                                  />
                                </Link>
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              asChild
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <Link to={`/regulation/${a.regulationId}`}>
                                <BookOpen
                                  className="size-3.5"
                                  aria-hidden="true"
                                />
                              </Link>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              asChild
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <Link to={`/assignment/${a.id}`}>
                                <ArrowRight
                                  className="size-3.5"
                                  aria-hidden="true"
                                />
                              </Link>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {assignments.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Showing {assignments.length} assignment
              {assignments.length === 1 ? "" : "s"}
              {hasActiveFilters ? " (filtered)" : ""}
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
