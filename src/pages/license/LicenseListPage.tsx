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
import { format, parseISO } from "date-fns";
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
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { TableSkeleton } from "@/components/common/Skeletons";
import { PageHero } from "@/components/common";
import { useLicenseList } from "@/hooks/queries/useLicenseQueries";
import { useAdminUsers } from "@/hooks/queries/useAdminQueries";
import { useAuthStore } from "@/stores";
import { hasPermission } from "@/constants/rbac";
import { LICENSE_STATUSES } from "@/constants/status";
import { cn } from "@/lib/utils";
import type { License, LicenseFilter } from "@/types";

const DEPARTMENTS = [
  "Risk & Compliance",
  "Legal",
  "Operations",
  "Finance",
  "Treasury",
  "Retail Banking",
  "Corporate Banking",
  "IT Security",
  "Human Resources",
  "Internal Audit",
];

const BUSINESS_UNITS = [
  "Retail Banking",
  "Corporate Banking",
  "Wealth Management",
  "Investment Banking",
  "Insurance",
  "Operations",
  "Technology",
];

const COUNTRIES = [
  "United States",
  "United Kingdom",
  "Singapore",
  "Hong Kong",
  "Japan",
  "Australia",
  "Germany",
  "France",
  "Canada",
  "Switzerland",
];

const PAGE_SIZE = 10;

const selectClass =
  "h-8 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

function remainingDaysColor(days: number) {
  if (days < 0) return "text-red-600 dark:text-red-400";
  if (days <= 30) return "text-amber-600 dark:text-amber-400";
  return "text-emerald-600 dark:text-emerald-400";
}

export default function LicenseListPage() {
  const navigate = useNavigate();
  const { role } = useAuthStore();
  const canCreate = hasPermission(role, "license:create");

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState("");
  const [department, setDepartment] = useState("");
  const [businessUnit, setBusinessUnit] = useState("");
  const [country, setCountry] = useState("");
  const [owner, setOwner] = useState("");
  const [expiryDateFrom, setExpiryDateFrom] = useState("");
  const [expiryDateTo, setExpiryDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [sorting, setSorting] = useState<SortingState>([
    { id: "expiryDate", desc: false },
  ]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [
    debouncedSearch,
    status,
    department,
    businessUnit,
    country,
    owner,
    expiryDateFrom,
    expiryDateTo,
  ]);

  const sortField = sorting[0]?.id ?? "expiryDate";
  const sortDirection = sorting[0]?.desc ? "desc" : "asc";

  const filters = useMemo(
    () => ({
      search: debouncedSearch,
      status: status || undefined,
      department: department || undefined,
      businessUnit: businessUnit || undefined,
      country: country || undefined,
      owner: owner || undefined,
      expiryDateFrom: expiryDateFrom || undefined,
      expiryDateTo: expiryDateTo || undefined,
      sortField,
      sortDirection,
    }),
    [
      debouncedSearch,
      status,
      department,
      businessUnit,
      country,
      owner,
      expiryDateFrom,
      expiryDateTo,
      sortField,
      sortDirection,
    ],
  );

  const { data, isPending, isError, refetch } = useLicenseList(
    filters as LicenseFilter,
    page,
    PAGE_SIZE,
  );
  const { data: ownersData } = useAdminUsers(1, 200, {
    role: "owner",
    status: "Active",
  });

  const columns = useMemo<ColumnDef<License>[]>(
    () => [
      {
        accessorKey: "licenseNumber",
        header: "License Number",
        size: 150,
      },
      {
        accessorKey: "licenseName",
        header: "Name",
        size: 240,
      },
      {
        accessorKey: "issuingAuthority",
        header: "Issuing Authority",
        size: 150,
      },
      {
        accessorKey: "department",
        header: "Department",
        size: 160,
      },
      {
        accessorKey: "ownerName",
        header: "Owner",
        size: 160,
      },
      {
        accessorKey: "expiryDate",
        header: "Expiry Date",
        size: 130,
        cell: ({ getValue }) =>
          format(parseISO(getValue<string>()), "MMM d, yyyy"),
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
        accessorKey: "remainingDays",
        header: "Remaining Days",
        size: 140,
        cell: ({ getValue }) => {
          const days = getValue<number>();
          return (
            <span
              className={cn(
                "font-medium tabular-nums",
                remainingDaysColor(days),
              )}
            >
              {days < 0 ? `${Math.abs(days)} overdue` : `${days} left`}
            </span>
          );
        },
      },
      {
        accessorKey: "criticality",
        header: "Criticality",
        size: 120,
        cell: ({ getValue }) => (
          <PriorityBadge
            priority={getValue<"low" | "medium" | "high" | "critical">()}
            size="sm"
          />
        ),
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
              navigate(`/license/${row.original.id}`);
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
        title="Licenses"
        subtitle="Manage regulatory licenses, track expiries, and coordinate renewals."
      >
        {canCreate && (
          <Button
            className="bg-white text-[#0c3767] hover:bg-white/90"
            onClick={() => navigate("/license/add")}
          >
            <Plus className="size-4" aria-hidden="true" />
            Add License
          </Button>
        )}
      </PageHero>

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
                placeholder="Search licenses..."
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
              {LICENSE_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className={selectClass}
            >
              <option value="">All departments</option>
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {d}
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
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className={selectClass}
            >
              <option value="">All countries</option>
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>
                  {c}
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
            <div className="flex items-center gap-2">
              <Input
                type="date"
                placeholder="Expiry from"
                value={expiryDateFrom}
                onChange={(e) => setExpiryDateFrom(e.target.value)}
                className="text-xs"
              />
              <Input
                type="date"
                placeholder="Expiry to"
                value={expiryDateTo}
                onChange={(e) => setExpiryDateTo(e.target.value)}
                className="text-xs"
              />
            </div>
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
                  title="No licenses found"
                  description="Try adjusting your filters or add a new license."
                  action={
                    canCreate ? (
                      <Button onClick={() => navigate("/license/add")}>
                        <Plus className="size-4" aria-hidden="true" />
                        Add License
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
                        onClick={() => navigate(`/license/${row.original.id}`)}
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
