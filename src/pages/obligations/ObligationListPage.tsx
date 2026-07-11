import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type SortingState,
  type ColumnDef,
  type RowSelectionState,
} from "@tanstack/react-table";
import { motion } from "motion/react";
import {
  Plus,
  Search,
  Eye,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ClipboardCheck,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatusBadge } from "@/components/common/StatusBadge";
import { PriorityBadge } from "@/components/common/PriorityBadge";
import { DueDateCell } from "@/components/common/DueDateCell";
import { PageHero } from "@/components/common";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { TableSkeleton } from "@/components/common/Skeletons";
import { useObligationList } from "@/hooks/queries/useObligationQueries";
import { useAdminUsers } from "@/hooks/queries/useAdminQueries";
import { useAuthStore } from "@/stores";
import { hasPermission } from "@/constants/rbac";
import { OBLIGATION_STATUSES, PRIORITY_LEVELS } from "@/constants/status";
import { cn } from "@/lib/utils";
import { DUE_DATE_COLOR_GUIDE } from "@/lib/due-date";
import { riskScoreTextClasses } from "@/lib/risk-score";
import type { Obligation, ObligationFilter } from "@/types";

const BUSINESS_UNITS = [
  "Retail Banking",
  "Corporate Banking",
  "Wealth Management",
  "Investment Banking",
  "Insurance",
  "Operations",
  "Technology",
];

const PAGE_SIZE = 10;

const selectClass =
  "h-9 rounded-lg border border-input bg-transparent px-3 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

const HEADER_TOOLTIPS: Record<string, string> = {
  code: "Unique obligation identifier",
  title: "Obligation title",
  businessUnit: "Owning business unit",
  ownerName: "Responsible owner",
  dueDate: DUE_DATE_COLOR_GUIDE,
  status: "Current workflow status",
  riskLevel: "Risk criticality",
  aiRiskScore: "AI-assigned risk score",
};

export default function ObligationListPage() {
  const navigate = useNavigate();
  const { role } = useAuthStore();
  const canCreate = hasPermission(role, "compliance:create");

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [businessUnit, setBusinessUnit] = useState("");
  const [owner, setOwner] = useState("");
  const [page, setPage] = useState(1);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status, priority, businessUnit, owner]);

  const hasActiveFilters = Boolean(
    search || status || priority || businessUnit || owner,
  );
  const clearFilters = () => {
    setSearch("");
    setStatus("");
    setPriority("");
    setBusinessUnit("");
    setOwner("");
  };

  // Row selection is index-based; clear it whenever the page or filters shift
  // so selections never silently rebind to different rows.
  useEffect(() => {
    setRowSelection({});
  }, [debouncedSearch, status, priority, businessUnit, owner, page]);

  const sortField = sorting[0]?.id ?? "createdAt";
  const sortDirection = sorting[0]
    ? sorting[0].desc
      ? "desc"
      : "asc"
    : "desc";

  const filters = useMemo(
    () => ({
      search: debouncedSearch,
      status: status || undefined,
      riskLevel: priority || undefined,
      businessUnit: businessUnit || undefined,
      owner: owner || undefined,
      sortField,
      sortDirection,
    }),
    [
      debouncedSearch,
      status,
      priority,
      businessUnit,
      owner,
      sortField,
      sortDirection,
    ],
  );

  const { data, isPending, isError, refetch } = useObligationList(
    filters as ObligationFilter,
    page,
    PAGE_SIZE,
  );
  const { data: ownersData } = useAdminUsers(1, 200, {
    role: "owner",
    status: "Active",
  });

  const columns = useMemo<ColumnDef<Obligation>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <input
            type="checkbox"
            aria-label="Select all visible obligations"
            className="size-4 cursor-pointer accent-primary"
            checked={table.getIsAllPageRowsSelected()}
            ref={(el) => {
              if (el) el.indeterminate = table.getIsSomePageRowsSelected();
            }}
            onChange={table.getToggleAllPageRowsSelectedHandler()}
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            aria-label={`Select ${row.original.title}`}
            className="size-4 cursor-pointer accent-primary"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
            onClick={(e) => e.stopPropagation()}
          />
        ),
        size: 40,
        enableSorting: false,
      },
      {
        accessorKey: "code",
        header: "Obligation ID",
        size: 140,
      },
      {
        accessorKey: "title",
        header: "Title",
        size: 260,
      },
      {
        accessorKey: "businessUnit",
        header: "Business Unit",
        size: 160,
      },
      {
        accessorKey: "ownerName",
        header: "Owner",
        size: 160,
      },
      {
        accessorKey: "dueDate",
        header: "Due Date",
        size: 130,
        cell: ({ row }) => (
          <DueDateCell
            dueDate={row.original.dueDate}
            completed={["completed", "approved"].includes(row.original.status)}
          />
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        size: 140,
        cell: ({ getValue }) => (
          <StatusBadge status={getValue<string>()} size="sm" />
        ),
      },
      {
        accessorKey: "riskLevel",
        header: "Priority",
        size: 120,
        cell: ({ getValue }) => (
          <PriorityBadge
            priority={getValue<"low" | "medium" | "high" | "critical">()}
            size="sm"
          />
        ),
      },
      {
        accessorKey: "aiRiskScore",
        header: "AI Risk",
        size: 100,
        cell: ({ getValue }) => {
          const score = getValue<number>();
          return (
            <span
              className={cn("text-xs font-medium", riskScoreTextClasses(score))}
            >
              {score}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: "",
        size: 80,
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/obligations/${row.original.id}`);
            }}
          >
            <Eye className="size-4" aria-hidden="true" />
            <span className="sr-only">View</span>
          </Button>
        ),
      },
    ],
    [navigate],
  );

  const table = useReactTable({
    data: data?.items ?? [],
    columns,
    state: { sorting, rowSelection },
    onSortingChange: setSorting,
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualSorting: true,
  });

  const totalPages = data ? Math.ceil(data.total / data.pageSize) : 0;

  // Selected rows reference rows on the current page; resolve to obligation IDs.
  const selectedIds = useMemo(
    () => Object.keys(rowSelection).map((idx) => data?.items[Number(idx)]?.id),
    [rowSelection, data],
  );
  const selectedCount = selectedIds.filter(Boolean).length;

  const handleCreateCAPFromSelected = () => {
    const ids = selectedIds.filter(Boolean);
    if (ids.length === 0) return;
    navigate(`/cap/create?obligations=${ids.join(",")}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <PageHero
        title="Obligations"
        subtitle="Track, manage, and submit obligations across the organization."
      >
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            onClick={handleCreateCAPFromSelected}
            disabled={selectedCount === 0}
            className={
              selectedCount > 0
                ? "border-white/30 bg-white/20 text-white hover:bg-white/30 hover:text-white"
                : ""
            }
          >
            <ClipboardCheck className="size-4" aria-hidden="true" />
            Create CAP
            {selectedCount > 0 ? ` (${selectedCount})` : ""}
          </Button>
          {canCreate && (
            <Button
              variant="outline"
              onClick={() => navigate("/obligations/create")}
              className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white"
            >
              <Plus className="size-4" aria-hidden="true" />
              Create New
            </Button>
          )}
        </div>
      </PageHero>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Filters</CardTitle>
          {hasActiveFilters && (
            <CardAction>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={clearFilters}
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
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 pl-9"
              />
            </div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className={cn(selectClass, "min-w-[10rem]")}
            >
              <option value="">All statuses</option>
              {OBLIGATION_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.replace(/_/g, " ")}
                </option>
              ))}
            </select>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className={cn(selectClass, "min-w-[10rem]")}
            >
              <option value="">All priorities</option>
              {PRIORITY_LEVELS.map((p) => (
                <option key={p} value={p}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </option>
              ))}
            </select>
            <select
              value={businessUnit}
              onChange={(e) => setBusinessUnit(e.target.value)}
              className={cn(selectClass, "min-w-[10rem]")}
            >
              <option value="">All business units</option>
              {BUSINESS_UNITS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
            <select
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              className={cn(selectClass, "min-w-[10rem]")}
            >
              <option value="">All owners</option>
              {ownersData?.items.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
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
                <TableSkeleton rows={PAGE_SIZE} columns={columns.length} />
              </div>
            ) : data?.items.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  title="No obligations found"
                  description="Try adjusting your filters or create a new obligation."
                  action={
                    canCreate ? (
                      <Button onClick={() => navigate("/obligations/create")}>
                        <Plus className="size-4" aria-hidden="true" />
                        Create New
                      </Button>
                    ) : undefined
                  }
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-muted-foreground">
                    {table.getHeaderGroups().map((headerGroup) => (
                      <tr key={headerGroup.id}>
                        {headerGroup.headers.map((header) => {
                          const canSort = header.column.getCanSort();
                          const sorted = header.column.getIsSorted();
                          const tooltip = HEADER_TOOLTIPS[header.column.id];
                          const headerContent = (
                            <div className="flex items-center gap-1">
                              {flexRender(
                                header.column.columnDef.header,
                                header.getContext(),
                              )}
                              {canSort &&
                                (sorted === "asc" ? (
                                  <ArrowUp
                                    className="size-3.5"
                                    aria-hidden="true"
                                  />
                                ) : sorted === "desc" ? (
                                  <ArrowDown
                                    className="size-3.5"
                                    aria-hidden="true"
                                  />
                                ) : (
                                  <ArrowUpDown
                                    className="size-3.5 opacity-50"
                                    aria-hidden="true"
                                  />
                                ))}
                            </div>
                          );
                          return (
                            <th
                              key={header.id}
                              className={cn(
                                "px-4 py-3 text-left font-medium whitespace-nowrap",
                                canSort && "cursor-pointer select-none",
                              )}
                              style={{ width: header.getSize() }}
                              onClick={
                                canSort
                                  ? header.column.getToggleSortingHandler()
                                  : undefined
                              }
                            >
                              {canSort && tooltip ? (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    {headerContent}
                                  </TooltipTrigger>
                                  <TooltipContent>{tooltip}</TooltipContent>
                                </Tooltip>
                              ) : (
                                headerContent
                              )}
                            </th>
                          );
                        })}
                      </tr>
                    ))}
                  </thead>
                  <tbody>
                    {table.getRowModel().rows.map((row) => (
                      <tr
                        key={row.id}
                        className="cursor-pointer border-b border-border transition-colors hover:bg-muted/50"
                        onClick={() =>
                          navigate(`/obligations/${row.original.id}`)
                        }
                      >
                        {row.getVisibleCells().map((cell) => (
                          <td
                            key={cell.id}
                            className="px-4 py-3 whitespace-nowrap"
                          >
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext(),
                            )}
                          </td>
                        ))}
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
    </motion.div>
  );
}
