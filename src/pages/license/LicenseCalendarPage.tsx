import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  parseISO,
  isToday,
  differenceInDays,
} from "date-fns";
import { ChevronLeft, ChevronRight, CalendarDays, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { Spinner } from "@/components/common/Spinner";
import { PageHero } from "@/components/common";
import { useLicenseCalendar } from "@/hooks/queries/useLicenseQueries";
import { cn } from "@/lib/utils";
import type { LicenseCalendarEvent } from "@/types";

function urgencyClass(event: LicenseCalendarEvent): string {
  if (event.type === "issue") return "bg-blue-500";
  const days = differenceInDays(parseISO(event.date), new Date());
  if (days < 30) return "bg-red-500";
  if (days < 60) return "bg-amber-500";
  return "bg-emerald-500";
}

function eventBorderClass(event: LicenseCalendarEvent): string {
  if (event.type === "issue")
    return "border-blue-400 bg-blue-50 dark:bg-blue-950/30";
  const days = differenceInDays(parseISO(event.date), new Date());
  if (days < 30) return "border-red-400 bg-red-50 dark:bg-red-950/30";
  if (days < 60) return "border-amber-400 bg-amber-50 dark:bg-amber-950/30";
  return "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30";
}

export default function LicenseCalendarPage() {
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const calendarQuery = useLicenseCalendar(
    { dateFrom: "2024-01-01", dateTo: "2027-12-31" },
    1,
    500,
  );
  const allEvents = useMemo(
    () => calendarQuery.data?.items ?? [],
    [calendarQuery.data?.items],
  );

  const { monthStart, days, eventsByDay, upcomingEvents } = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(start);
    const calendarStart = startOfWeek(start);
    const calendarEnd = endOfWeek(monthEnd);
    const dayList = eachDayOfInterval({
      start: calendarStart,
      end: calendarEnd,
    });

    const map = new Map<string, LicenseCalendarEvent[]>();
    for (const event of allEvents) {
      const key = format(parseISO(event.date), "yyyy-MM-dd");
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(event);
    }

    const today = new Date();
    const cutoff = addMonths(today, 1);
    const upcoming = allEvents
      .filter((e) => {
        const d = parseISO(e.date);
        return (isSameDay(d, today) || d > today) && d <= cutoff;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 20);

    return {
      monthStart: start,
      days: dayList,
      eventsByDay: map,
      upcomingEvents: upcoming,
    };
  }, [currentMonth, allEvents]);

  if (calendarQuery.isPending) {
    return (
      <div className="flex min-h-[24rem] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (calendarQuery.isError) {
    return <ErrorState onRetry={() => calendarQuery.refetch()} />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <PageHero
        title="License Calendar"
        subtitle="Expiry, renewal, issue, and approval dates."
      >
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="border-white/30 text-white hover:bg-white/10 hover:text-white"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-white/30 text-white hover:bg-white/10 hover:text-white"
            onClick={() => setCurrentMonth(new Date())}
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-white/30 text-white hover:bg-white/10 hover:text-white"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          >
            <ChevronRight className="size-4" aria-hidden="true" />
          </Button>
        </div>
      </PageHero>

      <div className="flex items-center gap-2 text-lg font-semibold text-foreground">
        <CalendarDays className="size-5 text-primary" aria-hidden="true" />
        {format(currentMonth, "MMMM yyyy")}
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="grid grid-cols-7 border-b bg-muted/40 text-center text-xs font-semibold text-muted-foreground">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="py-2">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {days.map((day) => {
              const key = format(day, "yyyy-MM-dd");
              const dayEvents = eventsByDay.get(key) ?? [];
              const inMonth = isSameMonth(day, monthStart);
              return (
                <div
                  key={key}
                  className={cn(
                    "min-h-[6.5rem] border-b border-r p-2 transition-colors",
                    !inMonth && "bg-muted/20 text-muted-foreground",
                    isToday(day) && "bg-primary/5",
                  )}
                >
                  <div className="mb-1 flex items-center justify-between">
                    <span
                      className={cn(
                        "flex size-6 items-center justify-center rounded-full text-xs font-medium",
                        isToday(day) && "bg-primary text-primary-foreground",
                      )}
                    >
                      {format(day, "d")}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    {dayEvents.slice(0, 3).map((event) => (
                      <button
                        key={event.id}
                        onClick={() => navigate(`/license/${event.entityId}`)}
                        className={cn(
                          "truncate rounded border px-1.5 py-0.5 text-left text-xs transition-colors hover:opacity-90",
                          eventBorderClass(event),
                        )}
                        title={event.title}
                      >
                        <span
                          className={cn(
                            "mr-1 inline-block size-1.5 rounded-full",
                            urgencyClass(event),
                          )}
                        />
                        {event.title}
                      </button>
                    ))}
                    {dayEvents.length > 3 && (
                      <span className="text-xs text-muted-foreground">
                        +{dayEvents.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-4 rounded-lg border bg-card p-3 text-xs">
        <span className="font-semibold text-foreground">Legend:</span>
        <span className="inline-flex items-center gap-1">
          <Circle
            className="size-3 fill-red-500 text-red-500"
            aria-hidden="true"
          />
          &lt; 30 days
        </span>
        <span className="inline-flex items-center gap-1">
          <Circle
            className="size-3 fill-amber-500 text-amber-500"
            aria-hidden="true"
          />
          30–60 days
        </span>
        <span className="inline-flex items-center gap-1">
          <Circle
            className="size-3 fill-emerald-500 text-emerald-500"
            aria-hidden="true"
          />
          &gt; 60 days
        </span>
        <span className="inline-flex items-center gap-1">
          <Circle
            className="size-3 fill-blue-500 text-blue-500"
            aria-hidden="true"
          />
          Issue date
        </span>
      </div>

      <div className="space-y-3">
        <h2 className="text-base font-semibold text-foreground">
          Upcoming (next 30 days)
        </h2>
        {upcomingEvents.length === 0 ? (
          <EmptyState
            title="No upcoming events"
            description="There are no license events in the next 30 days."
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {upcomingEvents.map((event) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -2 }}
              >
                <Card
                  className="cursor-pointer transition-shadow hover:shadow-md"
                  onClick={() => navigate(`/license/${event.entityId}`)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="line-clamp-2 text-sm font-medium">
                        {event.title}
                      </CardTitle>
                      <Badge
                        variant="secondary"
                        className="shrink-0 text-xs capitalize"
                      >
                        {event.type}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                      {format(parseISO(event.date), "PPP")}
                    </p>
                    <p className="line-clamp-2 text-xs text-muted-foreground">
                      {event.description}
                    </p>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "size-2 rounded-full",
                          urgencyClass(event),
                        )}
                      />
                      <span className="text-xs text-muted-foreground">
                        {differenceInDays(parseISO(event.date), new Date())}{" "}
                        days away
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
