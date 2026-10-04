import { useState } from "react";
import {
  addDays,
  differenceInCalendarDays,
  format,
  startOfDay,
} from "date-fns";
import {
  AlarmClock,
  CalendarClock,
  FastForward,
  RotateCcw,
  Siren,
  Bell,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDemoClockStore } from "@/stores";
import { useRunScheduler } from "@/hooks/mutations";
import { cn } from "@/lib/utils";
import type { SchedulerEvent } from "@/types";

const EVENT_ICON: Record<SchedulerEvent["kind"], typeof Bell> = {
  reminder: Bell,
  overdue: AlarmClock,
  escalation: Siren,
  late_risk: AlertTriangle,
};

const EVENT_TONE: Record<SchedulerEvent["kind"], string> = {
  reminder: "text-info",
  overdue: "text-danger",
  escalation: "text-danger",
  late_risk: "text-warning",
};

/**
 * Demo controls: move "today" forward so the presenter can show reminders,
 * overdue states and automatic escalation happening live.
 */
export function DemoClock() {
  const [open, setOpen] = useState(false);
  const { offsetDays, setOffsetDays } = useDemoClockStore();
  const run = useRunScheduler();
  const [events, setEvents] = useState<SchedulerEvent[] | null>(null);
  const realToday = startOfDay(new Date());
  const demoDay = addDays(realToday, offsetDays);

  const moveTo = (nextOffset: number) => {
    if (nextOffset < offsetDays) {
      toast.info(
        "The demo clock only moves forward. Use Reset demo to go back.",
      );
      return;
    }
    setOffsetDays(nextOffset);
    run.mutate(nextOffset, {
      onSuccess: (res) => {
        setEvents(res.events);
        toast.success(
          `Demo date: ${format(addDays(realToday, nextOffset), "dd/MM/yyyy")} — ${res.events.length} automatic event(s)`,
        );
      },
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Demo controls"
        title="Demo controls (demo clock)"
        className={cn(
          "relative flex h-[38px] shrink-0 items-center gap-1.5 rounded-[19px] border px-3 shadow-[var(--card-shadow)] backdrop-blur-xl [border-color:var(--nav-border)]",
          offsetDays > 0
            ? "bg-chart-accent/85 font-bold text-black"
            : "bg-[var(--nav-bg)]",
        )}
      >
        <CalendarClock className="size-[15px]" />
        <span className="hidden text-[11px] font-semibold whitespace-nowrap 2xl:inline">
          {offsetDays > 0 ? `+${offsetDays}d` : "Demo"}
        </span>
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <CalendarClock className="size-5" /> Demo controls
            </SheetTitle>
            <SheetDescription>
              Move the demo date forward to trigger reminders, overdue alerts
              and automatic escalation — exactly as the scheduler would in
              production.
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 space-y-5 overflow-y-auto px-4 pb-6">
            <div className="rounded-xl bg-gradient-to-br from-[#0c3767] via-[#185b95] to-[#147769] p-4 text-white">
              <p className="text-[11px] tracking-wide text-white/70 uppercase">
                Demo date
              </p>
              <p className="text-2xl font-black">
                {format(demoDay, "EEEE, dd/MM/yyyy")}
              </p>
              <p className="text-xs text-white/75">
                {offsetDays === 0
                  ? "Real date"
                  : `${offsetDays} day(s) after the real date`}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[1, 7, 30].map((n) => (
                <Button
                  key={n}
                  variant="outline"
                  disabled={run.isPending}
                  onClick={() => moveTo(offsetDays + n)}
                >
                  <FastForward className="size-4" />+{n} day{n > 1 ? "s" : ""}
                </Button>
              ))}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium" htmlFor="demo-jump">
                Jump to a date
              </label>
              <div className="flex gap-2">
                <Input
                  id="demo-jump"
                  type="date"
                  min={format(demoDay, "yyyy-MM-dd")}
                  onChange={(e) => {
                    if (!e.target.value) return;
                    const target = startOfDay(new Date(e.target.value));
                    moveTo(differenceInCalendarDays(target, realToday));
                  }}
                />
              </div>
            </div>

            {events && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground">
                  What the scheduler did
                </p>
                {events.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-border p-3 text-sm text-muted-foreground">
                    Nothing due on this date.
                  </p>
                ) : (
                  <ul className="space-y-1.5">
                    {events.map((e, i) => {
                      const Icon = EVENT_ICON[e.kind];
                      return (
                        <li
                          key={`${e.entityId}-${i}`}
                          className="flex items-start gap-2 rounded-lg border border-border bg-card p-2.5 text-sm"
                        >
                          <Icon
                            className={cn(
                              "mt-0.5 size-4 shrink-0",
                              EVENT_TONE[e.kind],
                            )}
                          />
                          <span>{e.message}</span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}

            <div className="border-t border-border pt-4">
              <Button
                variant="ghost"
                className="text-muted-foreground"
                onClick={() => window.location.reload()}
              >
                <RotateCcw className="size-4" /> Reset demo (restore sample
                data)
              </Button>
              <p className="mt-2 text-[11px] text-muted-foreground">
                All records are illustrative sample data for the Nam A Bank RFQ
                demo.
              </p>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
