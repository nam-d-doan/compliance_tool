import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { isOverdue } from "@/lib/obligation-helpers";
import { cn } from "@/lib/utils";
import type { Obligation } from "@/types";

const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

interface DeadlineCalendarProps {
  obligations: Obligation[];
}

/** Interactive month calendar of obligation due dates — click a day to see
 * what's due then. */
export function DeadlineCalendar({ obligations }: DeadlineCalendarProps) {
  const navigate = useNavigate();
  const [month, setMonth] = useState(() => new Date());
  const [selected, setSelected] = useState<Date | null>(() => new Date());

  const byDay = useMemo(() => {
    const map = new Map<string, Obligation[]>();
    for (const obg of obligations) {
      const key = format(parseISO(obg.dueDate), "yyyy-MM-dd");
      const arr = map.get(key) ?? [];
      arr.push(obg);
      map.set(key, arr);
    }
    return map;
  }, [obligations]);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month));
    const end = endOfWeek(endOfMonth(month));
    return eachDayOfInterval({ start, end });
  }, [month]);

  const selectedItems = selected
    ? (byDay.get(format(selected, "yyyy-MM-dd")) ?? [])
    : [];

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-sm">
          <CalendarDays className="size-4" aria-hidden="true" />
          {format(month, "MMMM yyyy")}
        </CardTitle>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setMonth((m) => subMonths(m, 1))}
            aria-label="Previous month"
          >
            <ChevronLeft className="size-3.5" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setMonth((m) => addMonths(m, 1))}
            aria-label="Next month"
          >
            <ChevronRight className="size-3.5" aria-hidden="true" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1 text-center">
          {WEEKDAY_LABELS.map((w, i) => (
            <div
              key={i}
              className="pb-1 text-[10px] font-semibold text-muted-foreground"
            >
              {w}
            </div>
          ))}
          {days.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const items = byDay.get(key) ?? [];
            const inMonth = isSameMonth(day, month);
            const hasOverdue = items.some((o) => isOverdue(o));
            const isSelected = selected && isSameDay(day, selected);

            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelected(day)}
                className={cn(
                  "relative flex aspect-square flex-col items-center justify-center rounded-lg text-xs transition-colors",
                  !inMonth && "text-muted-foreground/40",
                  inMonth && !isSelected && "hover:bg-muted/50",
                  isSelected && "bg-primary text-primary-foreground",
                  isToday(day) && !isSelected && "font-bold text-foreground",
                )}
              >
                {day.getDate()}
                {items.length > 0 && (
                  <span
                    className={cn(
                      "absolute bottom-1 size-1 rounded-full",
                      isSelected
                        ? "bg-primary-foreground"
                        : hasOverdue
                          ? "bg-danger"
                          : "bg-chart-accent",
                    )}
                    aria-hidden="true"
                  />
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-4 space-y-1.5 border-t border-border pt-4">
          <p className="text-xs font-semibold text-muted-foreground">
            {selected ? format(selected, "EEEE, MMM d") : "Select a day"}
          </p>
          {selectedItems.length === 0 ? (
            <p className="text-xs text-muted-foreground">Nothing due.</p>
          ) : (
            <ul className="space-y-1">
              {selectedItems.map((obg) => (
                <li key={obg.id}>
                  <button
                    type="button"
                    onClick={() => navigate(`/obligations/${obg.id}`)}
                    className="w-full truncate rounded-md px-2 py-1 text-left text-xs text-foreground transition-colors hover:bg-muted/50"
                  >
                    {obg.title}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
