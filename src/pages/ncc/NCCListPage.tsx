import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Inbox,
  LineChart,
  List,
  PlusCircle,
  Search,
  Siren,
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
import { SortableTh, type SortDirection } from "@/components/common/SortableTh";
import { DueDateCell } from "@/components/common/DueDateCell";
import { useAuthStore } from "@/stores";
import { useCmsOverview, useNCCList } from "@/hooks/queries";
import { IcisInbox } from "@/components/ncc/IcisInbox";
import { IssueTrends } from "@/components/ncc/IssueTrends";
import { PagePurpose, RfqChip, SourceBadge } from "@/components/cms";
import {
  ISSUE_SOURCES,
  ISSUE_SOURCE_LABELS,
  ISSUE_SOURCE_SHORT,
} from "@/lib/cms-rules";
import { useNCCsSummary } from "@/hooks/useTabSummaries";
import { useDeleteNCC } from "@/hooks/mutations";
import { useOrgUnits } from "@/hooks/queries/useAdminQueries";
import { hasPermission } from "@/constants/rbac";
import { ROUTES } from "@/constants/routes";
import {
  NCC_STATUSES,
  PRIORITY_LEVELS,
  type NCCStatus,
  type PriorityLevel,
} from "@/constants/status";
import { DUE_DATE_COLOR_GUIDE } from "@/lib/due-date";
import { priorityLabel } from "@/lib/chart-labels";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { NonComplianceCase, NCCFilter } from "@/types";

type SortField =
  | "nccId"
  | "title"
  | "severity"
  | "status"
  | "ownerUnitName"
  | "ownerName"
  | "dueDate"
  | "createdAt";

const PAGE_SIZE = 10;

function countBy<T>(items: T[], key: keyof T) {
  const map = new Map<string, number>();
  items.forEach((item) => {
    const value = String(item[key] ?? "Unknown");
    map.set(value, (map.get(value) ?? 0) + 1);
  });
  return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
}

function monthlyTrend<T>(items: T[], dateKey: keyof T) {
  const map = new Map<string, number>();
  items.forEach((item) => {
    const raw = item[dateKey];
    if (!raw || typeof raw !== "string") return;
    const label = format(parseISO(raw), "MMM yyyy");
    map.set(label, (map.get(label) ?? 0) + 1);
  });
  return Array.from(map.entries())
    .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
    .map(([name, value]) => ({ name, value }));
}

type IssueTab = "register" | "icis" | "trends";

export default function NCCListPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const tab = (params.get("tab") as IssueTab) ?? "register";
  const setTab = (t: IssueTab) => {
    if (t === "register") params.delete("tab");
    else params.set("tab", t);
    setParams(params, { replace: true });
  };
  const { data: cms } = useCmsOverview();
  const { role } = useAuthStore();
  const canCreate = hasPermission(role, "ncc:create");
  const canDelete = hasPermission(role, "ncc:delete");
  const summaryCards = useNCCsSummary();

  const [filters, setFilters] = useState<NCCFilter>({});
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<{
    field: SortField;
    direction: SortDirection;
  } | null>(null);

  const allNccQuery = useNCCList({}, 1, 500);
  const allNcc = useMemo(
    () => allNccQuery.data?.items ?? [],
    [allNccQuery.data],
  );

  const filteredNccQuery = useNCCList(filters, 1, 500);
  const filteredNcc = useMemo(
    () => filteredNccQuery.data?.items ?? [],
    [filteredNccQuery.data],
  );

  const deleteNcc = useDeleteNCC(filters);
  const orgUnitsQuery = useOrgUnits();

  const ownerUnitOptions = useMemo(
    () =>
      (orgUnitsQuery.data?.allUnits ?? []).map((u) => ({
        label: u.type === "branch" ? `${u.name} (${u.region})` : u.name,
        value: u.id,
      })),
    [orgUnitsQuery.data],
  );

  const sortedNcc = useMemo(() => {
    const list = [...filteredNcc];
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
        case "severity": {
          const order: Record<PriorityLevel, number> = {
            low: 1,
            medium: 2,
            high: 3,
          };
          return dir * (order[a.severity] - order[b.severity]);
        }
        case "status": {
          const order: Record<NCCStatus, number> = {
            Open: 1,
            Closed: 2,
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
  }, [filteredNcc, sort]);

  const totalPages = Math.max(1, Math.ceil(sortedNcc.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = sortedNcc.slice(
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

  const updateFilter = (patch: Partial<NCCFilter>) => {
    setFilters((prev) => ({ ...prev, ...patch, page: 1 }));
    setPage(1);
  };

  const hasActiveFilters = Boolean(
    filters.search ||
    filters.status ||
    filters.severity ||
    filters.ownerUnitId ||
    filters.dueDateFrom ||
    filters.dueDateTo ||
    filters.source ||
    filters.escalated,
  );

  const handleDelete = (ncc: NonComplianceCase) => {
    if (!window.confirm(`Delete ${ncc.nccId}?`)) return;
    deleteNcc.mutate(ncc.id, {
      onSuccess: () => toast.success("Compliance issue deleted"),
      onError: (err) => toast.error(err.message || "Failed to delete case"),
    });
  };

  const isLoading = allNccQuery.isPending || filteredNccQuery.isPending;
  const error = allNccQuery.error ?? filteredNccQuery.error;

  if (error) {
    return (
      <div className="space-y-6">
        <PageHero
          title="Compliance Issues (NCC)"
          subtitle="Central register of compliance issues from every source."
        />
        <ErrorState
          title="Could not load cases"
          message={error.message}
          onRetry={() => {
            allNccQuery.refetch();
            filteredNccQuery.refetch();
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHero
        title="Compliance Issues (NCC)"
        subtitle="Kho lưu trữ vấn đề tuân thủ tập trung — issues from ICIS (P.KTKSNB), SBV inspections, audits, self-checks and monitoring, rated with the bank's risk matrix."
      >
        <div className="flex flex-wrap items-center gap-2">
          <RfqChip code="3.1" />
          <RfqChip code="3.2" />
          <RfqChip code="3.3" />
          {canCreate && (
            <Button asChild>
              <Link to={ROUTES.NCC.CREATE}>
                <PlusCircle className="size-4" aria-hidden="true" />
                Record issue
              </Link>
            </Button>
          )}
        </div>
      </PageHero>
      <PagePurpose>
        Every issue follows the same path: check → submit evidence → Compliance
        review → approve closure. High-risk and overdue issues escalate
        automatically.
      </PagePurpose>

      <div className="inline-flex flex-wrap items-center gap-1 rounded-lg bg-muted p-1">
        {(
          [
            ["register", "Issue register", List, allNcc.length],
            ["icis", "ICIS Inbox", Inbox, cms?.icis.pending ?? 0],
            ["trends", "Trends & unit profile", LineChart, null],
          ] as const
        ).map(([key, label, Icon, n]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={cn(
              "flex h-8 items-center gap-1.5 rounded-md px-3 text-xs font-semibold",
              tab === key ? "bg-background shadow-sm" : "text-muted-foreground",
            )}
          >
            <Icon className="size-3.5" /> {label}
            {n !== null && (
              <span
                className={cn(
                  "rounded-full px-1.5 text-[10px]",
                  key === "icis" && n > 0
                    ? "bg-danger text-white"
                    : "bg-muted-foreground/10",
                )}
              >
                {n}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === "icis" && <IcisInbox />}
      {tab === "trends" && <IssueTrends issues={allNcc} />}

      {tab === "register" && (
        <>
          <SummaryCardBar cards={summaryCards} />

          <ChartGrid>
            <PieChartCard
              title="By Source"
              data={countBy(allNcc, "source").map((d) => ({
                name:
                  ISSUE_SOURCE_SHORT[
                    d.name as keyof typeof ISSUE_SOURCE_SHORT
                  ] ?? d.name,
                value: d.value,
              }))}
              nameKey="name"
              valueKey="value"
              loading={allNccQuery.isPending}
              height={240}
              className="h-full"
            />
            <BarChartCard
              title="By Risk Level"
              subtitle="Thấp · Trung bình · Cao"
              data={countBy(allNcc, "severity").map((d) => ({
                name: priorityLabel(d.name),
                value: d.value,
              }))}
              xKey="name"
              yKeys={[{ key: "value", name: "Cases" }]}
              loading={allNccQuery.isPending}
              height={240}
              className="h-full"
            />
            <AreaChartCard
              title="Over Time"
              subtitle="Opened by month"
              data={monthlyTrend(allNcc, "createdAt")}
              xKey="name"
              yKeys={[{ key: "value", name: "Opened" }]}
              loading={allNccQuery.isPending}
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
                    placeholder="Search cases..."
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
                    updateFilter({
                      status: (v as NonComplianceCase["status"]) || undefined,
                    })
                  }
                  options={[...NCC_STATUSES]}
                  placeholder="All statuses"
                />
                <FilterSelect
                  value={(filters.severity as string) ?? ""}
                  onChange={(v) =>
                    updateFilter({
                      severity:
                        (v.toLowerCase() as NonComplianceCase["severity"]) ||
                        undefined,
                    })
                  }
                  options={PRIORITY_LEVELS.map(
                    (p) => p.charAt(0).toUpperCase() + p.slice(1),
                  )}
                  placeholder="All risk levels"
                />
                <FilterSelect
                  value={(filters.source as string) ?? ""}
                  onChange={(v) =>
                    updateFilter({
                      source: (v as NonComplianceCase["source"]) || undefined,
                    })
                  }
                  options={ISSUE_SOURCES.map((src) => ({
                    label: ISSUE_SOURCE_LABELS[src],
                    value: src,
                  }))}
                  placeholder="All sources"
                />
                <label className="inline-flex h-9 items-center gap-2 rounded-lg border border-input px-3 text-sm">
                  <input
                    type="checkbox"
                    checked={Boolean(filters.escalated)}
                    onChange={(e) =>
                      updateFilter({ escalated: e.target.checked || undefined })
                    }
                    className="accent-primary"
                  />
                  Escalated only
                </label>
                <FilterSelect
                  value={filters.ownerUnitId ?? ""}
                  onChange={(v) =>
                    updateFilter({ ownerUnitId: v || undefined })
                  }
                  options={ownerUnitOptions}
                  placeholder="All owner units"
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
              title="No compliance issues found"
              description="Try adjusting your filters or create a new case."
              action={
                canCreate ? (
                  <Button asChild>
                    <Link to={ROUTES.NCC.CREATE}>Record issue</Link>
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
                        label="NCC ID"
                        field="nccId"
                        sort={sort}
                        onSort={handleSort}
                        tooltip="Sort by case identifier"
                      />
                      <SortableTh
                        label="Title"
                        field="title"
                        sort={sort}
                        onSort={handleSort}
                        tooltip="Sort by title (A→Z)"
                      />
                      <th className="px-4 py-3 font-medium">Source</th>
                      <SortableTh
                        label="Risk"
                        field="severity"
                        sort={sort}
                        onSort={handleSort}
                        tooltip="Sort by risk level (low → high)"
                      />
                      <SortableTh
                        label="Status"
                        field="status"
                        sort={sort}
                        onSort={handleSort}
                        tooltip="Sort by status"
                      />
                      <SortableTh
                        label="Owner Unit"
                        field="ownerUnitName"
                        sort={sort}
                        onSort={handleSort}
                        tooltip="Sort by owner unit (A→Z)"
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
                      <th className="px-4 py-3 font-medium">Tags</th>
                      <th className="px-4 py-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {pageItems.map((ncc) => (
                      <tr
                        key={ncc.id}
                        onClick={() => navigate(`/ncc/${ncc.id}`)}
                        className="cursor-pointer transition-colors hover:bg-muted/50"
                      >
                        <td className="whitespace-nowrap px-4 py-3 font-medium">
                          {ncc.nccId}
                        </td>
                        <td className="max-w-xs px-4 py-3">
                          <span className="line-clamp-1">{ncc.title}</span>
                          <span className="line-clamp-1 text-xs text-muted-foreground">
                            {ncc.category}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <SourceBadge source={ncc.source} />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <PriorityBadge priority={ncc.severity} size="sm" />
                            <span className="text-xs tabular-nums text-muted-foreground">
                              {ncc.risk.weightedScore.toFixed(1)}
                            </span>
                            {ncc.escalations.some(
                              (e) => e.level >= 2 && !e.acknowledgedAt,
                            ) && (
                              <Siren
                                className="size-3.5 text-danger"
                                aria-label="Escalated, awaiting acknowledgement"
                              />
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge
                            status={ncc.status}
                            kind="ncc"
                            size="sm"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="line-clamp-1">
                              {ncc.ownerUnitName}
                            </span>
                            {ncc.ownerUnitType === "branch" &&
                              ncc.ownerUnitRegion && (
                                <span className="text-xs text-muted-foreground">
                                  {ncc.ownerUnitRegion}
                                </span>
                              )}
                          </div>
                        </td>
                        <td className="px-4 py-3">{ncc.ownerName}</td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <DueDateCell
                            dueDate={ncc.dueDate}
                            completed={ncc.status === "Closed"}
                          />
                        </td>
                        <td className="max-w-xs px-4 py-3">
                          {ncc.tags.length > 0 ? (
                            <div className="flex items-center gap-1.5">
                              <span className="line-clamp-1 text-muted-foreground">
                                {ncc.tags[0]}
                              </span>
                              {ncc.tags.length > 1 && (
                                <span className="inline-flex shrink-0 items-center rounded-full bg-muted px-1.5 text-xs font-medium text-muted-foreground">
                                  +{ncc.tags.length - 1}
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
                                navigate(`/ncc/${ncc.id}`);
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
                                  handleDelete(ncc);
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
                  Showing {pageItems.length} of {sortedNcc.length} issues
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
        </>
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
