import { useMemo, useState } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  isToday,
  isAfter,
  isBefore,
  addDays,
} from "date-fns";
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Filter,
} from "lucide-react";
import { useReport } from "@/hooks/queries";
import { LoadingState } from "@/components/common/LoadingState";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/common";
import { ReportKPIs } from "./components/ReportKPIs";
import { cn } from "@/lib/utils";

type EventType = "compliance" | "cap";

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  type: EventType;
  status: string;
  entityId: string;
  owner?: string;
}

const EVENT_STYLES: Record<
  EventType,
  { dot: string; label: string; border: string; bg: string }
> = {
  compliance: {
    dot: "bg-blue-500",
    label: "Compliance",
    border: "border-blue-200 dark:border-blue-900/40",
    bg: "bg-blue-50/50 dark:bg-blue-900/10",
  },
  cap: {
    dot: "bg-purple-500",
    label: "CAP",
    border: "border-purple-200 dark:border-purple-900/40",
    bg: "bg-purple-50/50 dark:bg-purple-900/10",
  },
};

export default function ReportsCalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedType, setSelectedType] = useState<EventType | "all">("all");

  const filters = useMemo(
    () => ({
      dateRange: {
        start: format(startOfMonth(currentMonth), "yyyy-MM-dd"),
        end: format(endOfMonth(currentMonth), "yyyy-MM-dd"),
      },
    }),
    [currentMonth],
  );

  const {
    data: report,
    isPending,
    isError,
    error,
    refetch,
  } = useReport("calendar", filters);

  const events = useMemo<CalendarEvent[]>(() => {
    if (!report) return [];
    return report.tableData.map((row) => ({
      id: String(row.id),
      title: String(row.title),
      date: String(row.date),
      type: String(row.type) as EventType,
      status: String(row.status),
      entityId: String(row.entityId),
      owner: row.owner ? String(row.owner) : undefined,
    }));
  }, [report]);

  const filteredEvents = useMemo(() => {
    if (selectedType === "all") return events;
    return events.filter((e) => e.type === selectedType);
  }, [events, selectedType]);

  const upcomingEvents = useMemo(() => {
    const cutoff = addDays(new Date(), 30);
    return filteredEvents
      .filter((e) => {
        const d = new Date(e.date);
        return (
          (isAfter(d, new Date()) || isSameDay(d, new Date())) &&
          isBefore(d, cutoff)
        );
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 20);
  }, [filteredEvents]);

  const days = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const startWeek = new Date(start);
    startWeek.setDate(startWeek.getDate() - startWeek.getDay());
    const endWeek = new Date(end);
    endWeek.setDate(endWeek.getDate() + (6 - endWeek.getDay()));
    return eachDayOfInterval({ start: startWeek, end: endWeek });
  }, [currentMonth]);

  const dayEvents = (day: Date) =>
    filteredEvents.filter((e) => isSameDay(new Date(e.date), day));

  if (isPending) {
    return (
      <div className="space-y-6">
        <PageHero
          title="Calendar Report"
          subtitle="Compliance due dates and CAP deadlines in one view."
        />
        <LoadingState message="Loading calendar..." />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <PageHero
          title="Calendar Report"
          subtitle="Compliance due dates and CAP deadlines in one view."
        />
        <ErrorState
          title="Could not load calendar"
          message={error?.message}
          onRetry={refetch}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHero
        title="Calendar Report"
        subtitle="Compliance due dates and CAP deadlines in one view."
      />

      {report && <ReportKPIs kpis={report.kpis} columns={4} />}

      <div className="flex flex-col gap-4 lg:flex-row">
        <Card className="flex-1">
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon
                className="size-4 text-muted-foreground"
                aria-hidden="true"
              />
              {format(currentMonth, "MMMM yyyy")}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon-xs"
                onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
                aria-label="Previous month"
              >
                <ChevronLeft className="size-3.5" aria-hidden="true" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentMonth(new Date())}
              >
                Today
              </Button>
              <Button
                variant="outline"
                size="icon-xs"
                onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
                aria-label="Next month"
              >
                <ChevronRight className="size-3.5" aria-hidden="true" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Filter
                className="size-3.5 text-muted-foreground"
                aria-hidden="true"
              />
              {(["all", "compliance", "cap"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSelectedType(type)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                    selectedType === type
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background text-muted-foreground hover:bg-muted",
                  )}
                >
                  {type !== "all" && (
                    <span
                      className={cn(
                        "size-2 rounded-full",
                        EVENT_STYLES[type].dot,
                      )}
                      aria-hidden="true"
                    />
                  )}
                  {type === "all" ? "All events" : EVENT_STYLES[type].label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border bg-border">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <div
                  key={d}
                  className="bg-muted/50 px-2 py-1.5 text-center text-xs font-semibold text-muted-foreground"
                >
                  {d}
                </div>
              ))}
              {days.map((day) => {
                const dayItems = dayEvents(day);
                const inMonth = isSameMonth(day, currentMonth);
                return (
                  <motion.div
                    key={day.toISOString()}
                    initial={false}
                    className={cn(
                      "min-h-[5.5rem] bg-card p-1.5 transition-colors",
                      !inMonth && "bg-muted/30 text-muted-foreground",
                      isToday(day) && "bg-primary/5",
                    )}
                  >
                    <div
                      className={cn(
                        "mb-1 flex size-6 items-center justify-center rounded-full text-xs font-medium",
                        isToday(day)
                          ? "bg-primary text-primary-foreground"
                          : "text-foreground",
                      )}
                    >
                      {format(day, "d")}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {dayItems.slice(0, 4).map((event) => (
                        <div
                          key={event.id}
                          className={cn(
                            "h-1.5 w-1.5 rounded-full",
                            EVENT_STYLES[event.type].dot,
                          )}
                          title={`${event.title} (${EVENT_STYLES[event.type].label})`}
                        />
                      ))}
                      {dayItems.length > 4 && (
                        <span className="text-[9px] leading-none text-muted-foreground">
                          +{dayItems.length - 4}
                        </span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:w-96">
          <CardHeader>
            <CardTitle>Upcoming Deadlines (Next 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingEvents.length === 0 ? (
              <EmptyState
                title="No upcoming deadlines"
                description="There are no deadlines matching the selected filter in the next 30 days."
                className="border-0 bg-transparent"
              />
            ) : (
              <div className="space-y-2">
                <AnimatePresence>
                  {upcomingEvents.map((event) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      className={cn(
                        "rounded-lg border p-3 text-xs",
                        EVENT_STYLES[event.type].border,
                        EVENT_STYLES[event.type].bg,
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-1.5 font-semibold text-foreground">
                          <span
                            className={cn(
                              "size-2 rounded-full",
                              EVENT_STYLES[event.type].dot,
                            )}
                            aria-hidden="true"
                          />
                          {event.title}
                        </span>
                        <span className="shrink-0 text-muted-foreground">
                          {format(new Date(event.date), "MMM d")}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center justify-between text-muted-foreground">
                        <span>
                          {EVENT_STYLES[event.type].label} · {event.entityId}
                        </span>
                        {event.owner && <span>{event.owner}</span>}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
