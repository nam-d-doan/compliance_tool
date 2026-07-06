import { useEffect, useMemo, useState } from "react";
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
  Plus,
  Search,
  Eye,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/common/StatusBadge";
import { PriorityBadge } from "@/components/common/PriorityBadge";
import { PageHero } from "@/components/common";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { TableSkeleton } from "@/components/common/Skeletons";
import { useComplianceList } from "@/hooks/queries/useComplianceQueries";
import { useAdminUsers } from "@/hooks/queries/useAdminQueries";
import { useAuthStore } from "@/stores";
import { hasPermission } from "@/constants/rbac";
import { COMPLIANCE_STATUSES, PRIORITY_LEVELS } from "@/constants/status";
import { cn } from "@/lib/utils";
import type { ComplianceObligation, ComplianceFilter } from "@/types";

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
  "h-8 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

export default function ComplianceListPage() {
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
  const [sorting, setSorting] = useState<SortingState>([
    { id: "dueDate", desc: false },
  ]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status, priority, businessUnit, owner]);

  const sortField = sorting[0]?.id ?? "dueDate";
  const sortDirection = sorting[0]?.desc ? "desc" : "asc";

  const filters = useMemo(
    () => ({
      search: debouncedSearch,
      status: status || undefined,
      priority: priority || undefined,
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

  const { data, isPending, isError, refetch } = useComplianceList(
    filters as ComplianceFilter,
    page,
    PAGE_SIZE,
  );
  const { data: ownersData } = useAdminUsers(1, 200, {
    role: "owner",
    status: "Active",
  });

  const columns = useMemo<ColumnDef<ComplianceObligation>[]>(
    () => [
      {
        accessorKey: "complianceId",
        header: "Compliance ID",
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
        cell: ({ getValue }) =>
          format(new Date(getValue<string>()), "MMM d, yyyy"),
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
        accessorKey: "criticality",
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
        id: "actions",
        header: "",
        size: 80,
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/compliance/${row.original.id}`);
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
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualSorting: true,
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
        title="Compliance Obligations"
        subtitle="Track, manage, and submit compliance obligations across the organization."
      >
        {canCreate && (
          <Button
            variant="outline"
            onClick={() => navigate("/compliance/submit")}
            className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white"
          >
            <Plus className="size-4" aria-hidden="true" />
            Submit New
          </Button>
        )}
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
                placeholder="Search..."
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
              {COMPLIANCE_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className={selectClass}
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
              className={selectClass}
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
              className={selectClass}
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
                  title="No compliance obligations found"
                  description="Try adjusting your filters or create a new compliance obligation."
                  action={
                    canCreate ? (
                      <Button onClick={() => navigate("/compliance/submit")}>
                        <Plus className="size-4" aria-hidden="true" />
                        Submit New
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
                          navigate(`/compliance/${row.original.id}`)
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
