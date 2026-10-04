import { create } from "zustand";
import { addDays, startOfDay } from "date-fns";

/**
 * Demo clock — lets the presenter move "today" forward so reminders, overdue
 * states and escalations can be shown live. Not persisted: a page reload
 * resets the mock database, so the clock resets with it.
 */
interface DemoClockStore {
  offsetDays: number;
  setOffsetDays: (days: number) => void;
}

export const useDemoClockStore = create<DemoClockStore>()((set) => ({
  offsetDays: 0,
  setOffsetDays: (offsetDays) => set({ offsetDays }),
}));

/** Current demo time: real now shifted by the demo clock offset. */
export function demoNow(): Date {
  return addDays(new Date(), useDemoClockStore.getState().offsetDays);
}

/** Start of the current demo day. */
export function demoToday(): Date {
  return startOfDay(demoNow());
}
