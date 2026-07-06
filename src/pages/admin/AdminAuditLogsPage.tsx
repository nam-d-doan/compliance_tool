import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  format,
  parseISO,
  isWithinInterval,
  startOfDay,
  endOfDay,
} from "date-fns";
import {
  ScrollText,
  AlertTriangle,
  Users,
  BarChart3,
  Search,
  Calendar,
  X,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { KPICard } from "@/components/common/KPICard";
import { StatusBadge } from "@/components/common/StatusBadge";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { TableSkeleton } from "@/components/common/Skeletons";
import { LineChartCard, BarChartCard, PieChartCard } from "@/components/charts";
import { useAdminAuditLogs } from "@/hooks/queries/useAdminQueries";
import { useAdminUsers } from "@/hooks/queries/useAdminQueries";
import { cn } from "@/lib/utils";
import type { AuditLog } from "@/types";

const ACTIONS = [
  "login",
  "logout",
  "create",
  "update",
  "delete",
  "approve",
  "ai_usage",
  "export",
  "settings_change",
] as const;
const MODULES = [
  "compliance",
  "cap",
  "regulation",
  "report",
  "admin",
  "auth",
  "ai",
] as const;
const RESULTS = ["success", "failure"] as const;
const PAGE_SIZE = 10;
const selectClass =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 dark:bg-input/30";

export default function AdminAuditLogsPage() {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [user, setUser] = useState("");
  const [action, setAction] = useState("");
  const [module, setModule] = useState("");
  const [result, setResult] = useState("");
  const [page, setPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  useEffect(() => {
    setPage(1);
  }, [dateFrom, dateTo, user, action, module, result]);

  const serverFilters = useMemo(
    () => ({
      action: action || undefined,
      module: module || undefined,
      user: user || undefined,
    }),
    [action, module, user],
  );

  const { data, isPending, isError, refetch } = useAdminAuditLogs(
    page,
    PAGE_SIZE,
    serverFilters,
  );
  const { data: usersData } = useAdminUsers(1, 1000);

  const filteredItems = useMemo(() => {
    let items = data?.items ?? [];
    if (result) items = items.filter((l) => l.result === result);
    if (dateFrom || dateTo) {
      const from = dateFrom ? startOfDay(parseISO(dateFrom)) : new Date(0);
      const to = dateTo
        ? endOfDay(parseISO(dateTo))
        : new Date(8640000000000000);
      items = items.filter((l) => {
        const date = parseISO(l.timestamp);
        return isWithinInterval(date, { start: from, end: to });
      });
    }
    return items;
  }, [data, result, dateFrom, dateTo]);

  const kpis = useMemo(() => {
    const items = filteredItems;
    const today = new Date();
    return {
      totalToday: items.filter(
        (l) =>
          format(parseISO(l.timestamp), "yyyy-MM-dd") ===
          format(today, "yyyy-MM-dd"),
      ).length,
      failed: items.filter((l) => l.result === "failure").length,
      uniqueUsers: new Set(items.map((l) => l.userId)).size,
      mostActiveModule: (() => {
        const counts = new Map<string, number>();
        items.forEach((l) =>
          counts.set(l.module, (counts.get(l.module) ?? 0) + 1),
        );
        let maxModule = "—";
        let maxCount = 0;
        counts.forEach((count, mod) => {
          if (count > maxCount) {
            maxCount = count;
            maxModule = mod;
          }
        });
        return maxModule;
      })(),
    };
  }, [filteredItems]);

  const eventsOverTime = useMemo(() => {
    const counts = new Map<string, number>();
    filteredItems.forEach((l) => {
      const key = format(parseISO(l.timestamp), "MMM d");
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });
    return Array.from(counts.entries())
      .map(([date, events]) => ({ date, events }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [filteredItems]);

  const eventsByModule = useMemo(() => {
    const counts = new Map<string, number>();
    filteredItems.forEach((l) =>
      counts.set(l.module, (counts.get(l.module) ?? 0) + 1),
    );
    return Array.from(counts.entries()).map(([module, events]) => ({
      module,
      events,
    }));
  }, [filteredItems]);

  const eventsByResult = useMemo(() => {
    const counts = new Map<string, number>();
    filteredItems.forEach((l) =>
      counts.set(l.result, (counts.get(l.result) ?? 0) + 1),
    );
    return Array.from(counts.entries()).map(([result, events]) => ({
      result,
      events,
    }));
  }, [filteredItems]);

  const totalPages = data ? Math.ceil(data.total / data.pageSize) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="rounded-[20px] bg-gradient-to-br from-[#0c3767] via-[#185b95] to-[#147769] p-6 text-white shadow-lg sm:p-7">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Audit Logs
        </h1>
        <p className="mt-1 text-sm text-[#dcecff]">
          Track system activity, user actions, and configuration changes across
          all modules.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          label="Events Today"
          value={kpis.totalToday}
          icon={Calendar}
          loading={isPending}
        />
        <KPICard
          label="Failed Actions"
          value={kpis.failed}
          icon={AlertTriangle}
          loading={isPending}
        />
        <KPICard
          label="Unique Users"
          value={kpis.uniqueUsers}
          icon={Users}
          loading={isPending}
        />
        <KPICard
          label="Most Active Module"
          value={kpis.mostActiveModule}
          icon={BarChart3}
          loading={isPending}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
            <div className="space-y-1">
              <Label className="text-xs">From</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="h-8"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">To</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="h-8"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">User</Label>
              <select
                value={user}
                onChange={(e) => setUser(e.target.value)}
                className={selectClass}
              >
                <option value="">All users</option>
                {(usersData?.items ?? []).map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Action</Label>
              <select
                value={action}
                onChange={(e) => setAction(e.target.value)}
                className={selectClass}
              >
                <option value="">All actions</option>
                {ACTIONS.map((a) => (
                  <option key={a} value={a}>
                    {a.replace("_", " ")}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Module</Label>
              <select
                value={module}
                onChange={(e) => setModule(e.target.value)}
                className={selectClass}
              >
                <option value="">All modules</option>
                {MODULES.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Result</Label>
              <select
                value={result}
                onChange={(e) => setResult(e.target.value)}
                className={selectClass}
              >
                <option value="">All results</option>
                {RESULTS.map((r) => (
                  <option key={r} value={r}>
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <LineChartCard
          title="Events Over Time"
          data={eventsOverTime}
          xKey="date"
          yKeys={[{ key: "events", name: "Events" }]}
          loading={isPending}
          className="lg:col-span-2"
        />
        <BarChartCard
          title="Events By Module"
          data={eventsByModule}
          xKey="module"
          yKeys={[{ key: "events", name: "Events" }]}
          loading={isPending}
        />
        <PieChartCard
          title="Events By Result"
          data={eventsByResult}
          nameKey="result"
          valueKey="events"
          loading={isPending}
          className="lg:col-span-1"
        />
      </div>

      {isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (
        <Card>
          <CardContent className="p-0">
            {isPending ? (
              <div className="p-4">
                <TableSkeleton rows={PAGE_SIZE} columns={8} />
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  title="No audit events found"
                  description="Try adjusting your filters or date range."
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium">
                        Timestamp
                      </th>
                      <th className="px-4 py-3 text-left font-medium">
                        Event ID
                      </th>
                      <th className="px-4 py-3 text-left font-medium">User</th>
                      <th className="px-4 py-3 text-left font-medium">
                        Action
                      </th>
                      <th className="px-4 py-3 text-left font-medium">
                        Object
                      </th>
                      <th className="px-4 py-3 text-left font-medium">
                        Module
                      </th>
                      <th className="px-4 py-3 text-left font-medium">IP</th>
                      <th className="px-4 py-3 text-left font-medium">
                        Result
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map((log) => (
                      <tr
                        key={log.id}
                        className="cursor-pointer border-b border-border transition-colors hover:bg-muted/50"
                        onClick={() => setSelectedLog(log)}
                      >
                        <td className="px-4 py-3 whitespace-nowrap">
                          {format(parseISO(log.timestamp), "MMM d, yyyy HH:mm")}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs whitespace-nowrap">
                          {log.id}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {log.userName}
                        </td>
                        <td className="px-4 py-3 capitalize whitespace-nowrap">
                          {log.action.replace("_", " ")}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {log.object}
                        </td>
                        <td className="px-4 py-3 capitalize whitespace-nowrap">
                          {log.module}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs whitespace-nowrap">
                          {log.ip}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {log.result === "success" ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2
                                className="size-3.5"
                                aria-hidden="true"
                              />
                              Success
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400">
                              <XCircle
                                className="size-3.5"
                                aria-hidden="true"
                              />
                              Failure
                            </span>
                          )}
                        </td>
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

      <Sheet
        open={Boolean(selectedLog)}
        onOpenChange={(open) => !open && setSelectedLog(null)}
      >
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Audit Event Details</SheetTitle>
            <SheetDescription className="font-mono text-xs">
              {selectedLog?.id}
            </SheetDescription>
          </SheetHeader>
          {selectedLog && (
            <div className="space-y-5 px-4 pb-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <Fact
                  label="Timestamp"
                  value={format(
                    parseISO(selectedLog.timestamp),
                    "MMM d, yyyy HH:mm:ss",
                  )}
                />
                <Fact label="User" value={selectedLog.userName} />
                <Fact
                  label="Action"
                  value={selectedLog.action.replace("_", " ")}
                />
                <Fact label="Module" value={selectedLog.module} />
                <Fact label="Object" value={selectedLog.object} />
                <Fact label="IP Address" value={selectedLog.ip} />
                <Fact label="Result" value={selectedLog.result} />
                <Fact
                  label="Correlation ID"
                  value={`corr-${selectedLog.id.split("-")[1]}`}
                />
              </div>

              <div>
                <h4 className="mb-2 font-medium">Change Summary</h4>
                <p className="text-muted-foreground">{selectedLog.details}</p>
              </div>

              <div>
                <h4 className="mb-2 font-medium">Before / After</h4>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-lg border border-border bg-card p-3">
                    <p className="mb-1 text-xs font-medium text-muted-foreground">
                      Before
                    </p>
                    <pre className="overflow-x-auto rounded bg-muted/50 p-2 text-xs">
                      {JSON.stringify(
                        { status: "unchanged", module: selectedLog.module },
                        null,
                        2,
                      )}
                    </pre>
                  </div>
                  <div className="rounded-lg border border-border bg-card p-3">
                    <p className="mb-1 text-xs font-medium text-muted-foreground">
                      After
                    </p>
                    <pre className="overflow-x-auto rounded bg-muted/50 p-2 text-xs">
                      {JSON.stringify(
                        {
                          status: selectedLog.result,
                          module: selectedLog.module,
                          action: selectedLog.action,
                        },
                        null,
                        2,
                      )}
                    </pre>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="mb-2 font-medium">Event Payload</h4>
                <pre className="overflow-x-auto rounded-lg border border-border bg-muted/50 p-3 text-xs">
                  {JSON.stringify(
                    {
                      id: selectedLog.id,
                      timestamp: selectedLog.timestamp,
                      userId: selectedLog.userId,
                      userName: selectedLog.userName,
                      action: selectedLog.action,
                      object: selectedLog.object,
                      module: selectedLog.module,
                      ip: selectedLog.ip,
                      result: selectedLog.result,
                      details: selectedLog.details,
                      correlationId: `corr-${selectedLog.id.split("-")[1]}`,
                    },
                    null,
                    2,
                  )}
                </pre>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => setSelectedLog(null)}
              >
                <X className="size-4" aria-hidden="true" />
                Close
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </motion.div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-2.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
