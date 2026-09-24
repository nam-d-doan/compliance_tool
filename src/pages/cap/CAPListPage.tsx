import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { format, parseISO } from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  PlusCircle,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatusBadge } from "@/components/common/StatusBadge";
import { PriorityBadge } from "@/components/common/PriorityBadge";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { TableSkeleton } from "@/components/common/Skeletons";
import { PageHero, SummaryCardBar, ChartGrid } from "@/components/common";
import { PieChartCard } from "@/components/charts/PieChartCard";
import { BarChartCard } from "@/components/charts/BarChartCard";
import { AreaChartCard } from "@/components/charts/AreaChartCard";
import { statusLabel, priorityLabel } from "@/lib/chart-labels";
import { SortableTh, type SortDirection } from "@/components/common/SortableTh";
import { DueDateCell } from "@/components/common/DueDateCell";
import { useAuthStore } from "@/stores";
import { useCAPList, useRegulationList } from "@/hooks/queries";
import { useCAPsSummary } from "@/hooks/useTabSummaries";
import { useDeleteCAP } from "@/hooks/mutations";
import { hasPermission } from "@/constants/rbac";
import { ROUTES } from "@/constants/routes";
import {
  CAP_STATUSES,
  PRIORITY_LEVELS,
  type CAPStatus,
  type PriorityLevel,
} from "@/constants/status";
import { DUE_DATE_COLOR_GUIDE } from "@/lib/due-date";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { CAP, CAPFilter } from "@/types";

type SortField =
  | "capId"
  | "title"
  | "priority"
  | "status"
  | "ownerName"
  | "dueDate"
  | "createdAt";

const PAGE_SIZE = 10;

export default function CAPListPage() {
  const navigate = useNavigate();
  const { role } = useAuthStore();
  const canCreate = hasPermission(role, "cap:create");
  const canDelete = hasPermission(role, "cap:delete");
  const summaryCards = useCAPsSummary();

  const [filters, setFilters] = useState<CAPFilter>({});
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<{
    field: SortField;
    direction: SortDirection;
  } | null>(null);

  const allCapsQuery = useCAPList({}, 1, 500);
  const allCaps = useMemo(
    () => allCapsQuery.data?.items ?? [],
    [allCapsQuery.data],
  );

  const filteredCapsQuery = useCAPList(filters, 1, 500);
  const filteredCaps = useMemo(
    () => filteredCapsQuery.data?.items ?? [],
    [filteredCapsQuery.data],
  );

  const deleteCap = useDeleteCAP(filters);

  const ownerOptions = useMemo(
    () =>
      Array.from(
        new Map(allCaps.map((c) => [c.ownerId, c.ownerName])).entries(),
      ).sort((a, b) => a[1].localeCompare(b[1])),
    [allCaps],
  );
  const departmentOptions = useMemo(
    () => Array.from(new Set(allCaps.map((c) => c.department))).sort(),
    [allCaps],
  );

  // Chart aggregations from the unfiltered set (parity with other tabs +
  // the former dashboard).
  const PRIORITY_ORDER: Record<PriorityLevel, number> = {
    low: 1,
    medium: 2,
    high: 3,
    critical: 4,
  };
  const chartCountBy = (key: keyof CAP) => {
    const m = new Map<string, number>();
    allCaps.forEach((c) => {
      const v = String(c[key] ?? "Unknown");
      m.set(v, (m.get(v) ?? 0) + 1);
    });
    return Array.from(m.entries()).map(([name, value]) => ({ name, value }));
  };
  const statusChart = useMemo(
    () =>
      chartCountBy("status").map((d) => ({
        name: statusLabel(d.name),
        value: d.value,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allCaps],
  );
  const priorityChart = useMemo(
    () =>
      chartCountBy("priority")
        .sort(
          (a, b) =>
            PRIORITY_ORDER[a.name as PriorityLevel] -
            PRIORITY_ORDER[b.name as PriorityLevel],
        )
        .map((d) => ({ name: priorityLabel(d.name), value: d.value })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allCaps],
  );
  const trendChart = useMemo(() => {
    const m = new Map<string, number>();
    allCaps.forEach((c) => {
      if (!c.createdAt) return;
      const label = format(parseISO(c.createdAt), "MMM yyyy");
      m.set(label, (m.get(label) ?? 0) + 1);
    });
    return Array.from(m.entries())
      .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
      .map(([name, value]) => ({ name, value }));
  }, [allCaps]);
  const deptChart = useMemo(() => {
    const m = new Map<string, number>();
    allCaps.forEach((c) => {
      const v = c.department || "Unknown";
      m.set(v, (m.get(v) ?? 0) + 1);
    });
    return Array.from(m.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, value]) => ({ name, value }));
  }, [allCaps]);
  const { data: regulationsData } = useRegulationList({}, 1, 200);

  const sortedCaps = useMemo(() => {
    const list = [...filteredCaps];
    list.sort((a, b) => {
      // Default ordering: newest first by createdAt.
      if (!sort) {
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }
      const dir = sort.direction === "asc" ? 1 : -1;
      switch (sort.field) {
        case "dueDate":
          return (
            dir *
            (new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
          );
        case "createdAt":
          return (
            dir *
            (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
          );
        case "priority": {
          const order: Record<PriorityLevel, number> = {
            low: 1,
            medium: 2,
            high: 3,
            critical: 4,
          };
          return dir * (order[a.priority] - order[b.priority]);
        }
        case "status": {
          const order: Record<CAPStatus, number> = {
            Open: 1,
            "Pending Approval": 2,
            Closed: 3,
          };
          return dir * (order[a.status] - order[b.status]);
        }
        default:
          return (
            dir * String(a[sort.field]).localeCompare(String(b[sort.field]))
          );
      }
    });
    return list;
  }, [filteredCaps, sort]);

  const totalPages = Math.max(1, Math.ceil(sortedCaps.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = sortedCaps.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const handleSort = (field: string) => {
    setSort((prev) => {
      if (prev?.field !== field)
        return { field: field as SortField, direction: "asc" };
      if (prev.direction === "asc")
        return { field: field as SortField, direction: "desc" };
      return null; // was desc → clear → revert to default ordering
    });
    setPage(1);
  };

  const updateFilter = (patch: Partial<CAPFilter>) => {
    setFilters((prev) => ({ ...prev, ...patch, page: 1 }));
    setPage(1);
  };

  const hasActiveFilters = Boolean(
    filters.search ||
    filters.status ||
    filters.priority ||
    filters.owner ||
    filters.department ||
    filters.dueDateFrom ||
    filters.dueDateTo ||
    filters.regulation,
  );

  const handleDelete = (cap: CAP) => {
    if (!window.confirm(`Delete ${cap.capId}?`)) return;
    deleteCap.mutate(cap.id, {
      onSuccess: () => toast.success("CAP deleted"),
      onError: (err) => toast.error(err.message || "Failed to delete CAP"),
    });
  };

  const isLoading = allCapsQuery.isPending || filteredCapsQuery.isPending;
  const error = allCapsQuery.error ?? filteredCapsQuery.error;

  if (error) {
    return (
      <div className="space-y-6">
        <PageHero
          title="All CAPs"
          subtitle="Browse and manage corrective action plans."
        />
        <ErrorState
          title="Could not load CAPs"
          message={error.message}
          onRetry={() => {
            allCapsQuery.refetch();
            filteredCapsQuery.refetch();
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHero
        title="All CAPs"
        subtitle="Browse and manage corrective action plans."
      >
        {canCreate && (
          <Button asChild>
            <Link to={ROUTES.CAP.CREATE}>
              <PlusCircle className="size-4" aria-hidden="true" />
              Create CAP
            </Link>
          </Button>
        )}
      </PageHero>

      <SummaryCardBar cards={summaryCards} />

      <ChartGrid className="xl:grid-cols-4">
        <PieChartCard
          title="CAPs by Status"
          data={statusChart}
          nameKey="name"
          valueKey="value"
          loading={allCapsQuery.isPending}
          height={240}
          className="h-full"
        />
        <BarChartCard
          title="By Priority"
          data={priorityChart}
          xKey="name"
          yKeys={[{ key: "value", name: "CAPs" }]}
          loading={allCapsQuery.isPending}
          height={240}
          className="h-full"
        />
        <AreaChartCard
          title="Over Time"
          subtitle="Created by month"
          data={trendChart}
          xKey="name"
          yKeys={[{ key: "value", name: "Created" }]}
          loading={allCapsQuery.isPending}
          height={240}
          className="h-full"
        />
        <BarChartCard
          title="By Department"
          data={deptChart}
          xKey="name"
          yKeys={[{ key: "value", name: "CAPs" }]}
          loading={allCapsQuery.isPending}
          height={240}
          className="h-full"
        />
      </ChartGrid>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Filters</CardTitle>
          {hasActiveFilters && (
            <CardAction>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => setFilters({})}
              >
                <X className="size-3" aria-hidden="true" />
                Clear all
              </Button>
            </CardAction>
          )}
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[12rem] flex-1">
              <Search
                className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                placeholder="Search CAPs..."
                value={filters.search ?? ""}
                onChange={(e) =>
                  updateFilter({ search: e.target.value || undefined })
                }
                className="h-9 pl-9"
              />
            </div>
            <FilterSelect
              value={(filters.status as string) ?? ""}
              onChange={(v) =>
                updateFilter({ status: (v as CAP["status"]) || undefined })
              }
              options={[...CAP_STATUSES]}
              placeholder="All statuses"
            />
            <FilterSelect
              value={(filters.priority as string) ?? ""}
              onChange={(v) =>
                updateFilter({
                  priority: (v.toLowerCase() as CAP["priority"]) || undefined,
                })
              }
              options={PRIORITY_LEVELS.map(
                (p) => p.charAt(0).toUpperCase() + p.slice(1),
              )}
              placeholder="All priorities"
            />
            <FilterSelect
              value={filters.owner ?? ""}
              onChange={(v) => updateFilter({ owner: v || undefined })}
              options={ownerOptions.map(([id, name]) => ({
                label: name,
                value: id,
              }))}
              placeholder="All owners"
            />
            <FilterSelect
              value={filters.department ?? ""}
              onChange={(v) => updateFilter({ department: v || undefined })}
              options={departmentOptions}
              placeholder="All departments"
            />
            <FilterSelect
              value={filters.regulation ?? ""}
              onChange={(v) => updateFilter({ regulation: v || undefined })}
              options={(regulationsData?.items ?? []).map((r) => ({
                label: r.title,
                value: r.id,
              }))}
              placeholder="All regulations"
            />
            <div className="flex items-center gap-1.5">
              <Input
                type="date"
                value={filters.dueDateFrom ?? ""}
                onChange={(e) =>
                  updateFilter({ dueDateFrom: e.target.value || undefined })
                }
                className="h-9 w-auto"
                aria-label="Due from"
              />
              <span className="text-xs text-muted-foreground">to</span>
              <Input
                type="date"
                value={filters.dueDateTo ?? ""}
                onChange={(e) =>
                  updateFilter({ dueDateTo: e.target.value || undefined })
                }
                className="h-9 w-auto"
                aria-label="Due to"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <TableSkeleton rows={PAGE_SIZE} columns={9} />
      ) : pageItems.length === 0 ? (
        <EmptyState
          title="No CAPs found"
          description="Try adjusting your filters or create a new CAP."
          action={
            canCreate ? (
              <Button asChild>
                <Link to={ROUTES.CAP.CREATE}>Create CAP</Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-xl border border-border bg-card"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <SortableTh
                    label="CAP ID"
                    field="capId"
                    sort={sort}
                    onSort={handleSort}
                    tooltip="Sort by CAP identifier"
                  />
                  <SortableTh
                    label="Title"
                    field="title"
                    sort={sort}
                    onSort={handleSort}
                    tooltip="Sort by title (A→Z)"
                  />
                  <SortableTh
                    label="Priority"
                    field="priority"
                    sort={sort}
                    onSort={handleSort}
                    tooltip="Sort by priority (low → critical)"
                  />
                  <SortableTh
                    label="Status"
                    field="status"
                    sort={sort}
                    onSort={handleSort}
                    tooltip="Sort by workflow status"
                  />
                  <SortableTh
                    label="Owner"
                    field="ownerName"
                    sort={sort}
                    onSort={handleSort}
                    tooltip="Sort by owner name (A→Z)"
                  />
                  <SortableTh
                    label="Due Date"
                    field="dueDate"
                    sort={sort}
                    onSort={handleSort}
                    tooltip={DUE_DATE_COLOR_GUIDE}
                  />
                  <th className="px-4 py-3 font-medium">Progress</th>
                  <th className="px-4 py-3 font-medium">Linked Obligations</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pageItems.map((cap) => (
                  <tr
                    key={cap.id}
                    onClick={() => navigate(`/cap/${cap.id}`)}
                    className="cursor-pointer transition-colors hover:bg-muted/50"
                  >
                    <td className="whitespace-nowrap px-4 py-3 font-medium">
                      {cap.capId}
                    </td>
                    <td className="max-w-xs px-4 py-3">
                      <span className="line-clamp-1">{cap.title}</span>
                    </td>
                    <td className="px-4 py-3">
                      <PriorityBadge priority={cap.priority} size="sm" />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={cap.status} size="sm" />
                    </td>
                    <td className="px-4 py-3">{cap.ownerName}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <DueDateCell
                        dueDate={cap.dueDate}
                        completed={cap.status === "Closed"}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${cap.progress}%` }}
                          />
                        </div>
                        <span className="text-xs tabular-nums">
                          {cap.progress}%
                        </span>
                      </div>
                    </td>
                    <td className="max-w-xs px-4 py-3">
                      {cap.obligationIds.length > 0 ? (
                        <div className="flex items-center gap-1.5">
                          <span className="line-clamp-1 text-muted-foreground">
                            {cap.complianceTitle ?? cap.obligationIds[0]}
                          </span>
                          {cap.obligationIds.length > 1 && (
                            <span className="inline-flex shrink-0 items-center rounded-full bg-muted px-1.5 text-xs font-medium text-muted-foreground">
                              +{cap.obligationIds.length - 1}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/cap/${cap.id}`);
                          }}
                        >
                          <Eye className="size-3.5" aria-hidden="true" />
                        </Button>
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(cap);
                            }}
                          >
                            <Trash2
                              className="size-3.5 text-destructive"
                              aria-hidden="true"
                            />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <span className="text-xs text-muted-foreground">
              Showing {pageItems.length} of {sortedCaps.length} CAPs
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="size-4" aria-hidden="true" />
                Previous
              </Button>
              <span className="text-xs text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="size-4" aria-hidden="true" />
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function FilterSelect({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  options: string[] | { label: string; value: string }[];
  placeholder: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "h-9 min-w-[10rem] rounded-lg border border-input bg-background px-3 py-1 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30",
      )}
    >
      <option value="">{placeholder}</option>
      {options.map((opt) => {
        const label = typeof opt === "string" ? opt : opt.label;
        const val = typeof opt === "string" ? opt : opt.value;
        return (
          <option key={val} value={val}>
            {label}
          </option>
        );
      })}
    </select>
  );
}
