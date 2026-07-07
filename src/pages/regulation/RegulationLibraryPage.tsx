import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type SortingState,
  type ColumnDef,
} from "@tanstack/react-table";
import { motion } from "motion/react";
import { format } from "date-fns";
import {
  Search,
  LayoutGrid,
  Table as TableIcon,
  Eye,
  Archive,
  MoreHorizontal,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RegulationCard } from "@/components/regulation/RegulationCard";
import { StatusBadge } from "@/components/common/StatusBadge";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { TableSkeleton, CardSkeleton } from "@/components/common/Skeletons";
import { PageHero } from "@/components/common";
import { useRegulationList } from "@/hooks/queries/useRegulationQueries";
import {
  useArchiveRegulation,
  useBulkArchiveRegulations,
} from "@/hooks/mutations/useRegulationMutations";
import { useAuthStore } from "@/stores";
import { hasMinimumRole } from "@/constants/rbac";
import { REGULATION_STATUSES } from "@/constants/status";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Regulation, RegulationFilter } from "@/types";

const REGULATORS = [
  "SEC",
  "FINRA",
  "FCA",
  "MAS",
  "HKMA",
  "ECB",
  "APRA",
  "Basel Committee",
  "GDPR Authority",
  "CCPA",
] as const;
const CATEGORIES = [
  "AML/KYC",
  "Data Privacy",
  "Consumer Protection",
  "Market Conduct",
  "Operational Risk",
  "Capital Adequacy",
  "Cybersecurity",
  "Financial Reporting",
] as const;
const JURISDICTIONS = [
  "US",
  "UK",
  "EU",
  "Singapore",
  "Hong Kong",
  "Japan",
  "Australia",
  "Global",
] as const;
const INDUSTRIES = [
  "Banking",
  "Insurance",
  "Investment Management",
  "Payments",
  "FinTech",
] as const;
const PAGE_SIZE = 12;

const selectClass =
  "h-8 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

export default function RegulationLibraryPage() {
  const navigate = useNavigate();
  const { role } = useAuthStore();
  const canArchive = hasMinimumRole(role, "executive");

  const archive = useArchiveRegulation();
  const bulkArchive = useBulkArchiveRegulations();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [regulator, setRegulator] = useState("");
  const [category, setCategory] = useState("");
  const [jurisdiction, setJurisdiction] = useState("");
  const [industry, setIndustry] = useState("");
  const [status, setStatus] = useState("");
  const [effectiveDateFrom, setEffectiveDateFrom] = useState("");
  const [effectiveDateTo, setEffectiveDateTo] = useState("");
  const [view, setView] = useState<"grid" | "table">("grid");
  const [page, setPage] = useState(1);
  const [sorting, setSorting] = useState<SortingState>([
    { id: "effectiveDate", desc: false },
  ]);
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [
    debouncedSearch,
    regulator,
    category,
    jurisdiction,
    industry,
    status,
    effectiveDateFrom,
    effectiveDateTo,
  ]);

  const sortField = sorting[0]?.id ?? "effectiveDate";
  const sortDirection = sorting[0]?.desc ? "desc" : "asc";

  const effectiveStatus = useMemo(() => {
    return status ? [status] : undefined;
  }, [status]);

  const filters = useMemo(
    () => ({
      search: debouncedSearch,
      regulator: regulator || undefined,
      category: category || undefined,
      country: jurisdiction || undefined,
      industry: industry || undefined,
      status: effectiveStatus,
      effectiveDateFrom: effectiveDateFrom || undefined,
      effectiveDateTo: effectiveDateTo || undefined,
      sortField,
      sortDirection,
    }),
    [
      debouncedSearch,
      regulator,
      category,
      jurisdiction,
      industry,
      effectiveStatus,
      effectiveDateFrom,
      effectiveDateTo,
      sortField,
      sortDirection,
    ],
  );

  const { data, isPending, isError, refetch } = useRegulationList(
    filters as RegulationFilter,
    page,
    PAGE_SIZE,
  );

  const handleArchiveToggle = useCallback(
    (item: Regulation) => {
      const isExpired = item.status === "Expired";
      archive.mutate(item.id, {
        onSuccess: () => {
          toast.success(
            isExpired
              ? "Regulation marked effective"
              : "Regulation marked expired",
          );
        },
        onError: (err) => {
          toast.error(
            err instanceof Error
              ? err.message
              : "Failed to update regulation status",
          );
        },
      });
    },
    [archive],
  );

  const handleBulkArchive = () => {
    const ids = table.getSelectedRowModel().rows.map((r) => r.original.id);
    if (ids.length === 0) return;
    if (
      !window.confirm(
        `Archive ${ids.length} selected regulation${ids.length === 1 ? "" : "s"}?`,
      )
    ) {
      return;
    }
    bulkArchive.mutate(ids, {
      onSuccess: (res) => {
        toast.success(
          `${res.archived} regulation${res.archived === 1 ? "" : "s"} archived`,
        );
        setRowSelection({});
      },
      onError: (err) => {
        toast.error(
          err instanceof Error ? err.message : "Failed to archive regulations",
        );
      },
    });
  };

  const columns = useMemo<ColumnDef<Regulation>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllRowsSelected()}
            indeterminate={table.getIsSomeRowsSelected()}
            onCheckedChange={(checked) =>
              table.toggleAllRowsSelected(Boolean(checked))
            }
            onClick={(e) => e.stopPropagation()}
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(checked) => row.toggleSelected(Boolean(checked))}
            onClick={(e) => e.stopPropagation()}
            aria-label="Select row"
          />
        ),
        size: 40,
        enableSorting: false,
      },
      {
        accessorKey: "reference",
        header: "Reference",
        size: 140,
      },
      {
        accessorKey: "title",
        header: "Title",
        size: 280,
      },
      {
        accessorKey: "regulator",
        header: "Regulator",
        size: 120,
      },
      {
        accessorKey: "category",
        header: "Category",
        size: 140,
      },
      {
        accessorKey: "jurisdiction",
        header: "Jurisdiction",
        size: 120,
      },
      {
        accessorKey: "status",
        header: "Status",
        size: 120,
        cell: ({ getValue }) => (
          <StatusBadge status={getValue<string>()} size="sm" />
        ),
      },
      {
        accessorKey: "effectiveDate",
        header: "Effective Date",
        size: 130,
        cell: ({ getValue }) =>
          format(new Date(getValue<string>()), "MMM d, yyyy"),
      },
      {
        accessorKey: "aiImpactScore",
        header: "AI Impact",
        size: 100,
        cell: ({ getValue }) => {
          const score = getValue<number>();
          return (
            <span
              className={cn(
                "text-xs font-medium",
                score >= 80
                  ? "text-red-600 dark:text-red-400"
                  : score >= 50
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-emerald-600 dark:text-emerald-400",
              )}
            >
              {score}
            </span>
          );
        },
      },
      {
        accessorKey: "affectedDepartments",
        header: "Affected Departments",
        size: 200,
        cell: ({ getValue }) => (
          <div className="flex flex-wrap gap-1">
            {(getValue<string[]>() ?? []).slice(0, 2).map((d) => (
              <Badge key={d} variant="secondary" className="text-xs">
                {d}
              </Badge>
            ))}
            {(getValue<string[]>() ?? []).length > 2 && (
              <Badge variant="secondary" className="text-xs">
                +{(getValue<string[]>() ?? []).length - 2}
              </Badge>
            )}
          </div>
        ),
      },
      {
        id: "actions",
        header: "",
        size: 80,
        cell: ({ row }) => {
          const item = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={(e) => e.stopPropagation()}
                  aria-label="Actions"
                >
                  <MoreHorizontal className="size-4" aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/regulation/${item.id}`);
                  }}
                >
                  <Eye className="size-4" aria-hidden="true" />
                  View
                </DropdownMenuItem>
                {canArchive && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      handleArchiveToggle(item);
                    }}
                    disabled={archive.isPending}
                  >
                    <Archive className="size-4" aria-hidden="true" />
                    {item.status === "Expired"
                      ? "Mark Effective"
                      : "Mark Expired"}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [navigate, canArchive, archive.isPending, handleArchiveToggle],
  );

  const table = useReactTable({
    data: data?.items ?? [],
    columns,
    state: { sorting, rowSelection },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualSorting: true,
    enableRowSelection: true,
    getRowId: (row) => row.id,
  });

  const totalPages = data ? Math.ceil(data.total / data.pageSize) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <PageHero
        title="Regulatory Intelligence"
        subtitle="Monitor, compare, and analyze regulations across jurisdictions. Understand AI-predicted impact on your compliance program."
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="relative">
              <Search
                className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                placeholder="Search regulations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
            <select
              value={regulator}
              onChange={(e) => setRegulator(e.target.value)}
              className={selectClass}
            >
              <option value="">All regulators</option>
              {REGULATORS.map((r) => (
                <option key={r} value={r}>
                  {r}
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
              value={jurisdiction}
              onChange={(e) => setJurisdiction(e.target.value)}
              className={selectClass}
            >
              <option value="">All jurisdictions</option>
              {JURISDICTIONS.map((j) => (
                <option key={j} value={j}>
                  {j}
                </option>
              ))}
            </select>
            <select
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className={selectClass}
            >
              <option value="">All industries</option>
              {INDUSTRIES.map((i) => (
                <option key={i} value={i}>
                  {i}
                </option>
              ))}
            </select>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className={selectClass}
            >
              <option value="">All statuses</option>
              {REGULATION_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <Input
              type="date"
              placeholder="Effective from"
              value={effectiveDateFrom}
              onChange={(e) => setEffectiveDateFrom(e.target.value)}
              className="h-8"
            />
            <Input
              type="date"
              placeholder="Effective to"
              value={effectiveDateTo}
              onChange={(e) => setEffectiveDateTo(e.target.value)}
              className="h-8"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <p className="text-sm text-muted-foreground">
            {isPending
              ? "Loading..."
              : `${data?.total ?? 0} regulation${(data?.total ?? 0) === 1 ? "" : "s"} found`}
          </p>
          {canArchive && table.getSelectedRowModel().rows.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {table.getSelectedRowModel().rows.length} selected
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={bulkArchive.isPending}
                  >
                    Actions
                    <ChevronDown className="size-3.5" aria-hidden="true" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={handleBulkArchive}
                    disabled={bulkArchive.isPending}
                  >
                    <Archive className="size-4" aria-hidden="true" />
                    Mark Selected Expired
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRowSelection({})}
              >
                <X className="size-4" aria-hidden="true" />
                Clear
              </Button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1">
          <Button
            variant={view === "grid" ? "secondary" : "ghost"}
            size="icon-xs"
            onClick={() => setView("grid")}
            aria-label="Grid view"
          >
            <LayoutGrid className="size-4" aria-hidden="true" />
          </Button>
          <Button
            variant={view === "table" ? "secondary" : "ghost"}
            size="icon-xs"
            onClick={() => setView("table")}
            aria-label="Table view"
          >
            <TableIcon className="size-4" aria-hidden="true" />
          </Button>
        </div>
      </div>

      {isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : view === "grid" ? (
        <>
          {isPending ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          ) : data?.items.length === 0 ? (
            <EmptyState
              title="No regulations found"
              description="Try adjusting your filters to discover relevant regulations."
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {data?.items.map((item) => (
                <RegulationCard
                  key={item.id}
                  item={item}
                  onClick={() => navigate(`/regulation/${item.id}`)}
                />
              ))}
            </div>
          )}
        </>
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
                  title="No regulations found"
                  description="Try adjusting your filters to discover relevant regulations."
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
                          navigate(`/regulation/${row.original.id}`)
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
          </CardContent>
        </Card>
      )}

      {!isPending && data && data.total > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Showing {(data.page - 1) * data.pageSize + 1} -{" "}
            {Math.min(data.page * data.pageSize, data.total)} of {data.total}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              Next
              <ChevronRight className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
