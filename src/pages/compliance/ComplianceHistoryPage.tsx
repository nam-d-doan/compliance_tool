import { useEffect, useMemo, useState } from "react";
import { format, parseISO, startOfMonth, format as formatDate } from "date-fns";
import { motion } from "motion/react";
import { Calendar, Filter } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/common/StatusBadge";
import { PageHero } from "@/components/common";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { TableSkeleton } from "@/components/common/Skeletons";
import { LineChartCard } from "@/components/charts/LineChartCard";
import { PieChartCard } from "@/components/charts/PieChartCard";
import {
  useComplianceSubmissions,
  useComplianceSubmissionHistory,
} from "@/hooks/queries/useComplianceQueries";
import { COMPLIANCE_SUBMISSION_STATUSES } from "@/constants/status";
import type { ComplianceSubmission, ComplianceFilter } from "@/types";

const PAGE_SIZE = 10;

const selectClass =
  "h-8 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

export default function ComplianceHistoryPage() {
  const [outcome, setOutcome] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [outcome, dateFrom, dateTo]);

  const filters = useMemo(
    () => ({
      status: outcome || undefined,
      dueDateFrom: dateFrom || undefined,
      dueDateTo: dateTo || undefined,
    }),
    [outcome, dateFrom, dateTo],
  );

  const { data, isPending, isError, refetch } = useComplianceSubmissions(
    filters as ComplianceFilter,
    page,
    PAGE_SIZE,
  );
  const { data: historyData, isPending: historyPending } =
    useComplianceSubmissionHistory(filters as ComplianceFilter);

  const chartData = useMemo(() => {
    if (!historyData) return { line: [], pie: [] };

    const byMonth = new Map<string, { label: string; count: number }>();
    const byOutcome = new Map<string, number>();

    historyData.forEach((sub) => {
      const start = startOfMonth(parseISO(sub.performedDate));
      const key = start.toISOString();
      const existing = byMonth.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        byMonth.set(key, { label: formatDate(start, "MMM yyyy"), count: 1 });
      }
      byOutcome.set(sub.status, (byOutcome.get(sub.status) || 0) + 1);
    });

    const line = Array.from(byMonth.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([, value]) => value);

    const pie = Array.from(byOutcome.entries()).map(([name, value]) => ({
      name,
      value,
    }));

    return { line, pie };
  }, [historyData]);

  const totalPages = data ? Math.ceil(data.total / data.pageSize) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <PageHero
        title="Compliance History"
        subtitle="Review submission outcomes and trends over time."
        className="py-5"
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Outcome</label>
              <select
                value={outcome}
                onChange={(e) => setOutcome(e.target.value)}
                className={selectClass}
              >
                <option value="">All outcomes</option>
                {COMPLIANCE_SUBMISSION_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">From</label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">To</label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <LineChartCard
          title="Submissions Over Time"
          subtitle="Number of submissions grouped by month"
          data={chartData.line}
          xKey="label"
          yKeys={[{ key: "count", name: "Submissions" }]}
          loading={historyPending}
        />
        <PieChartCard
          title="Outcome Breakdown"
          subtitle="Distribution of submission outcomes"
          data={chartData.pie}
          nameKey="name"
          valueKey="value"
          loading={historyPending}
        />
      </div>

      {isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Submission History</CardTitle>
            <CardDescription>
              Individual compliance submissions and their outcomes.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isPending ? (
              <div className="p-4">
                <TableSkeleton rows={PAGE_SIZE} columns={5} />
              </div>
            ) : data?.items.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  title="No submissions found"
                  description="Try adjusting your date range or outcome filter."
                  icon={<Filter className="size-6" aria-hidden="true" />}
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium">
                        Compliance Item
                      </th>
                      <th className="px-4 py-3 text-left font-medium">
                        Submitted
                      </th>
                      <th className="px-4 py-3 text-left font-medium">
                        Outcome
                      </th>
                      <th className="px-4 py-3 text-left font-medium">
                        Submitted By
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.items.map((sub: ComplianceSubmission) => (
                      <tr
                        key={sub.id}
                        className="border-b border-border transition-colors hover:bg-muted/50"
                      >
                        <td className="px-4 py-3">
                          <p className="font-medium text-foreground">
                            {sub.complianceTitle}
                          </p>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 text-muted-foreground">
                            <Calendar className="size-3.5" aria-hidden="true" />
                            {format(parseISO(sub.performedDate), "MMM d, yyyy")}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={sub.status} size="sm" />
                        </td>
                        <td className="px-4 py-3">{sub.ownerName}</td>
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
