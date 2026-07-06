import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { format, parseISO } from "date-fns";
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  PlusCircle,
  Search,
  Trash2,
} from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/common/StatusBadge";
import { PriorityBadge } from "@/components/common/PriorityBadge";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { TableSkeleton } from "@/components/common/Skeletons";
import { PageHero } from "@/components/common";
import { useAuthStore } from "@/stores";
import { useCAPList } from "@/hooks/queries";
import { useDeleteCAP } from "@/hooks/mutations";
import { hasPermission } from "@/constants/rbac";
import { ROUTES } from "@/constants/routes";
import {
  CAP_STATUSES,
  PRIORITY_LEVELS,
  type PriorityLevel,
} from "@/constants/status";
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
  | "progress";

interface SortConfig {
  field: SortField;
  direction: "asc" | "desc";
}

const PAGE_SIZE = 10;

export default function CAPListPage() {
  const navigate = useNavigate();
  const { role } = useAuthStore();
  const canCreate = hasPermission(role, "cap:create");
  const canDelete = hasPermission(role, "cap:delete");

  const [filters, setFilters] = useState<CAPFilter>({});
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<SortConfig>({
    field: "dueDate",
    direction: "asc",
  });

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

  const sortedCaps = useMemo(() => {
    const list = [...filteredCaps];
    list.sort((a, b) => {
      const dir = sort.direction === "asc" ? 1 : -1;
      switch (sort.field) {
        case "dueDate":
          return (
            dir *
            (new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
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
        case "progress":
          return dir * (a.progress - b.progress);
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

  const handleSort = (field: SortField) => {
    setSort((prev) => ({
      field,
      direction:
        prev.field === field && prev.direction === "asc" ? "desc" : "asc",
    }));
    setPage(1);
  };

  const updateFilter = (patch: Partial<CAPFilter>) => {
    setFilters((prev) => ({ ...prev, ...patch, page: 1 }));
    setPage(1);
  };

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

      <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap">
        <div className="relative flex-1 lg:min-w-[16rem]">
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
            className="pl-9"
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
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={filters.dueDateFrom ?? ""}
            onChange={(e) =>
              updateFilter({ dueDateFrom: e.target.value || undefined })
            }
            className="w-auto"
          />
          <span className="text-sm text-muted-foreground">to</span>
          <Input
            type="date"
            value={filters.dueDateTo ?? ""}
            onChange={(e) =>
              updateFilter({ dueDateTo: e.target.value || undefined })
            }
            className="w-auto"
          />
        </div>
      </div>

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
                  <SortHeader
                    field="capId"
                    label="CAP ID"
                    sort={sort}
                    onSort={handleSort}
                  />
                  <SortHeader
                    field="title"
                    label="Title"
                    sort={sort}
                    onSort={handleSort}
                  />
                  <SortHeader
                    field="priority"
                    label="Priority"
                    sort={sort}
                    onSort={handleSort}
                  />
                  <SortHeader
                    field="status"
                    label="Status"
                    sort={sort}
                    onSort={handleSort}
                  />
                  <SortHeader
                    field="ownerName"
                    label="Owner"
                    sort={sort}
                    onSort={handleSort}
                  />
                  <SortHeader
                    field="dueDate"
                    label="Due Date"
                    sort={sort}
                    onSort={handleSort}
                  />
                  <th className="px-4 py-3 font-medium">Progress</th>
                  <th className="px-4 py-3 font-medium">Linked Compliance</th>
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
                      {format(parseISO(cap.dueDate), "MMM d, yyyy")}
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
                      {cap.complianceTitle ? (
                        <span className="line-clamp-1 text-muted-foreground">
                          {cap.complianceTitle}
                        </span>
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
        "h-8 rounded-lg border border-input bg-background px-2.5 py-1 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30",
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

function SortHeader({
  field,
  label,
  sort,
  onSort,
}: {
  field: SortField;
  label: string;
  sort: SortConfig;
  onSort: (field: SortField) => void;
}) {
  return (
    <th className="px-4 py-3 font-medium">
      <button
        type="button"
        onClick={() => onSort(field)}
        className="flex items-center gap-1 outline-none focus-visible:underline"
      >
        {label}
        <ArrowUpDown
          className={cn(
            "size-3 transition-colors",
            sort.field === field ? "text-primary" : "text-muted-foreground/50",
          )}
          aria-hidden="true"
        />
      </button>
    </th>
  );
}
