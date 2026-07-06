import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Calendar,
  CheckCircle2,
  Filter,
  Grid3X3,
  LayoutList,
  Plus,
  Search,
  UploadCloud,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { format } from "date-fns";
import { EvidenceCard } from "@/components/evidence/EvidenceCard";
import { StatusBadge } from "@/components/common/StatusBadge";
import { PageHero } from "@/components/common";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { CardSkeleton, TableSkeleton } from "@/components/common/Skeletons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/stores";
import { useEvidenceList } from "@/hooks/queries";
import { useComplianceList } from "@/hooks/queries";
import { hasPermission } from "@/constants/rbac";
import { EVIDENCE_STATUSES, type EvidenceStatus } from "@/constants/status";
import { cn } from "@/lib/utils";
import type { Evidence } from "@/types";

const EVIDENCE_CATEGORIES = [
  "Policy Document",
  "Audit Report",
  "License Certificate",
  "Training Record",
  "Transaction Log",
  "Risk Assessment",
  "KYC Document",
];

const PAGE_SIZE = 12;

export default function EvidenceLibraryPage() {
  const navigate = useNavigate();
  const { role } = useAuthStore();
  const canCreate = hasPermission(role, "evidence:create");

  const [view, setView] = useState<"grid" | "table">("grid");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState<EvidenceStatus | "">("");
  const [compliance, setCompliance] = useState("");
  const [owner, setOwner] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const filters = useMemo(
    () => ({
      search: search || undefined,
      category: category || undefined,
      status: status || undefined,
      compliance: compliance || undefined,
      owner: owner || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    }),
    [search, category, status, compliance, owner, dateFrom, dateTo],
  );

  const { data, isPending, isError, error, refetch } = useEvidenceList(
    filters,
    page,
    PAGE_SIZE,
  );
  const complianceList = useComplianceList({ page: 1, pageSize: 500 });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const activeFilterCount = [
    category,
    status,
    compliance,
    owner,
    dateFrom,
    dateTo,
  ].filter(Boolean).length;

  const clearFilters = () => {
    setSearch("");
    setCategory("");
    setStatus("");
    setCompliance("");
    setOwner("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  };

  const handlePageChange = (next: number) => {
    if (next < 1 || next > totalPages) return;
    setPage(next);
  };

  return (
    <div className="space-y-5">
      <PageHero
        title="Evidence Library"
        subtitle="Manage and review all compliance evidence in one place."
      >
        {canCreate && (
          <Button
            asChild
            variant="outline"
            className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white"
          >
            <Link to="/evidence/upload">
              <UploadCloud className="size-4" aria-hidden="true" />
              Upload Evidence
            </Link>
          </Button>
        )}
      </PageHero>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative flex-1">
          <Search
            className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            placeholder="Search by name, file, category, owner, or status..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="size-3.5" aria-hidden="true" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters((s) => !s)}
            className="gap-1.5"
          >
            <Filter className="size-3.5" aria-hidden="true" />
            Filters
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="h-4 px-1 text-[10px]">
                {activeFilterCount}
              </Badge>
            )}
          </Button>

          <div className="flex items-center rounded-lg border border-border p-0.5">
            <button
              type="button"
              onClick={() => setView("grid")}
              className={cn(
                "rounded-md p-1.5 transition-colors",
                view === "grid"
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
              aria-label="Grid view"
              aria-pressed={view === "grid"}
            >
              <Grid3X3 className="size-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => setView("table")}
              className={cn(
                "rounded-md p-1.5 transition-colors",
                view === "table"
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
              aria-label="Table view"
              aria-pressed={view === "table"}
            >
              <LayoutList className="size-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value);
                    setPage(1);
                  }}
                  className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
                >
                  <option value="">All categories</option>
                  {EVIDENCE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value as EvidenceStatus | "");
                    setPage(1);
                  }}
                  className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
                >
                  <option value="">All statuses</option>
                  {EVIDENCE_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Compliance item
                </label>
                <select
                  value={compliance}
                  onChange={(e) => {
                    setCompliance(e.target.value);
                    setPage(1);
                  }}
                  className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
                >
                  <option value="">All items</option>
                  {complianceList.data?.items.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.complianceId} — {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Owner
                </label>
                <Input
                  placeholder="Filter by owner"
                  value={owner}
                  onChange={(e) => {
                    setOwner(e.target.value);
                    setPage(1);
                  }}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Date from
                </label>
                <div className="relative">
                  <Calendar
                    className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => {
                      setDateFrom(e.target.value);
                      setPage(1);
                    }}
                    className="pl-8"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Date to
                </label>
                <div className="relative">
                  <Calendar
                    className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => {
                      setDateTo(e.target.value);
                      setPage(1);
                    }}
                    className="pl-8"
                  />
                </div>
              </div>

              <div className="flex items-end sm:col-span-2 lg:col-span-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  disabled={activeFilterCount === 0 && !search}
                  className="gap-1.5"
                >
                  <X className="size-3.5" aria-hidden="true" />
                  Clear filters
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isError && (
        <ErrorState
          title="Could not load evidence"
          message={error?.message ?? "Please try again."}
          onRetry={() => refetch()}
        />
      )}

      {!isError && isPending && (
        <>
          {view === "grid" ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <TableSkeleton rows={PAGE_SIZE} columns={7} />
          )}
        </>
      )}

      {!isError && !isPending && items.length === 0 && (
        <EmptyState
          icon={<CheckCircle2 className="size-6" aria-hidden="true" />}
          title="No evidence found"
          description={
            activeFilterCount || search
              ? "Try adjusting your filters or search query."
              : "Upload your first evidence file to get started."
          }
          action={
            canCreate && (
              <Button asChild>
                <Link to="/evidence/upload">
                  <Plus className="size-4" aria-hidden="true" />
                  Upload Evidence
                </Link>
              </Button>
            )
          }
        />
      )}

      {!isError && !isPending && items.length > 0 && (
        <>
          {view === "grid" ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {items.map((item: Evidence) => (
                <EvidenceCard
                  key={item.id}
                  item={item}
                  onClick={() => navigate(`/evidence/${item.id}`)}
                />
              ))}
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-border bg-card">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50 text-left text-xs text-muted-foreground">
                      <th className="px-4 py-3 font-medium">Name</th>
                      <th className="px-4 py-3 font-medium">Category</th>
                      <th className="px-4 py-3 font-medium">Compliance Item</th>
                      <th className="px-4 py-3 font-medium">Owner</th>
                      <th className="px-4 py-3 font-medium">Upload Date</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">AI Validation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {items.map((item: Evidence) => (
                      <tr
                        key={item.id}
                        onClick={() => navigate(`/evidence/${item.id}`)}
                        className="cursor-pointer transition-colors hover:bg-muted/40"
                      >
                        <td className="px-4 py-3 font-medium text-foreground">
                          {item.name}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {item.category}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {item.complianceTitle ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {item.ownerName}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {format(new Date(item.uploadDate), "MMM d, yyyy")}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={item.status} size="sm" />
                        </td>
                        <td className="px-4 py-3">
                          <AIBadge validation={item.aiValidation} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground">
                Showing{" "}
                <span className="font-medium">
                  {(page - 1) * PAGE_SIZE + 1}
                </span>{" "}
                –{" "}
                <span className="font-medium">
                  {Math.min(page * PAGE_SIZE, total)}
                </span>{" "}
                of <span className="font-medium">{total}</span> results
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(
                    (p) =>
                      p === 1 || p === totalPages || Math.abs(p - page) <= 1,
                  )
                  .map((p, idx, arr) => (
                    <React.Fragment key={p}>
                      {idx > 0 && arr[idx - 1] !== p - 1 && (
                        <span className="px-1 text-muted-foreground">…</span>
                      )}
                      <Button
                        variant={p === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(p)}
                      >
                        {p}
                      </Button>
                    </React.Fragment>
                  ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function AIBadge({ validation }: { validation: Evidence["aiValidation"] }) {
  const done =
    validation.status === "completed" ||
    validation.status === "suitable" ||
    validation.status === "questionable" ||
    validation.status === "insufficient" ||
    validation.status === "wrong_document";
  if (!done)
    return <span className="text-xs text-muted-foreground">Pending</span>;
  return (
    <Badge
      variant={
        validation.score >= 80
          ? "secondary"
          : validation.score >= 60
            ? "outline"
            : "destructive"
      }
      className="h-5 text-xs"
    >
      {validation.status.replace("_", " ")} · {validation.score}%
    </Badge>
  );
}
