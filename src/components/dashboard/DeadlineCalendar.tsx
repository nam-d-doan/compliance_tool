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
import { cn } from "@/lib/utils";
import type { Obligation } from "@/types";
import { useL, useDateLocale } from "@/lib/i18n";
import { useLanguageStore } from "@/stores";

const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];
const WEEKDAY_LABELS_VI = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

interface DeadlineCalendarProps {
  obligations: Obligation[];
}

/** Interactive month calendar of obligation due dates — click a day to see
 * what's due then. */
export function DeadlineCalendar({ obligations }: DeadlineCalendarProps) {
  const navigate = useNavigate();
  const L = useL();
  const lang = useLanguageStore((s) => s.lang);
  const dateLocale = useDateLocale();
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
    <Card className="flex h-full min-h-0 flex-col overflow-hidden">
      <CardHeader className="flex shrink-0 flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-sm">
          <CalendarDays className="size-4" aria-hidden="true" />
          {format(month, "MMMM yyyy", { locale: dateLocale })}
        </CardTitle>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setMonth((m) => subMonths(m, 1))}
            aria-label={L("Previous month", "Tháng trước")}
          >
            <ChevronLeft className="size-3.5" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setMonth((m) => addMonths(m, 1))}
            aria-label={L("Next month", "Tháng sau")}
          >
            <ChevronRight className="size-3.5" aria-hidden="true" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col">
        <div className="grid flex-1 grid-cols-7 grid-rows-6 gap-1 text-center">
          {(lang === "vi" ? WEEKDAY_LABELS_VI : WEEKDAY_LABELS).map((w, i) => (
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
            const isSelected = selected && isSameDay(day, selected);

            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelected(day)}
                className={cn(
                  "relative flex flex-col items-center justify-center rounded-lg text-xs transition-colors",
                  !inMonth && "text-muted-foreground/40",
                  inMonth && !isSelected && "hover:bg-muted/50",
                  isSelected &&
                    !isToday(day) &&
                    "bg-primary text-primary-foreground",
                )}
              >
                {isToday(day) ? (
                  <span className="flex size-6 items-center justify-center rounded-full bg-danger font-bold text-white">
                    {day.getDate()}
                  </span>
                ) : (
                  day.getDate()
                )}
                {items.length > 0 && (
                  <span
                    className={cn(
                      "absolute bottom-0.5 size-1 rounded-full bg-danger ring-1 ring-card",
                      isSelected && !isToday(day) && "ring-primary",
                    )}
                    aria-hidden="true"
                  />
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex shrink-0 flex-col space-y-1.5 border-t border-border pt-4">
          <p className="shrink-0 text-xs font-semibold text-muted-foreground">
            {selected
              ? format(selected, "EEEE, MMM d", { locale: dateLocale })
              : L("Select a day", "Chọn một ngày")}
          </p>
          {selectedItems.length === 0 ? (
            <div className="flex min-h-[3rem] items-center">
              <p className="text-xs text-muted-foreground">
                {L("Nothing due.", "Không có việc đến hạn.")}
              </p>
            </div>
          ) : (
            <ul
              className="space-y-1 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
              style={{ maxHeight: "3rem", minHeight: "3rem" }}
            >
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
