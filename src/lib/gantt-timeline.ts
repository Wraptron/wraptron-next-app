import { ViewMode } from "gantt-task-react";
import type { Task as GanttLibTask } from "gantt-task-react";

/** Mirrors gantt-task-react date stepping enough for today-line positioning. */

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d.getTime());
  x.setDate(x.getDate() + n);
  return x;
}

function addMonths(d: Date, n: number): Date {
  const x = new Date(d.getTime());
  x.setMonth(x.getMonth() + n);
  return x;
}

function getMonday(d: Date): Date {
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  return addDays(startOfDay(d), diff);
}

export function ganttChartDateRange(
  tasks: Pick<GanttLibTask, "start" | "end">[],
  viewMode: ViewMode,
  preStepsCount = 1,
): [Date, Date] {
  if (tasks.length === 0) {
    const today = startOfDay(new Date());
    return [today, addDays(today, 14)];
  }
  let start = tasks[0].start;
  let end = tasks[0].end;
  for (const t of tasks) {
    if (t.start < start) start = t.start;
    if (t.end > end) end = t.end;
  }

  if (viewMode === ViewMode.Month) {
    start = startOfMonth(addMonths(start, -preStepsCount));
    end = startOfMonth(addMonths(end, 12));
  } else if (viewMode === ViewMode.Week) {
    start = addDays(getMonday(startOfDay(start)), -7 * preStepsCount);
    end = addMonths(startOfDay(end), 1);
    end = addDays(end, 15);
  } else {
    // Day (and default)
    start = addDays(startOfDay(start), -preStepsCount);
    end = addDays(startOfDay(end), 19);
  }
  return [start, end];
}

export function seedGanttDates(
  startDate: Date,
  endDate: Date,
  viewMode: ViewMode,
): Date[] {
  const dates: Date[] = [new Date(startDate.getTime())];
  let current = new Date(startDate.getTime());
  while (current < endDate) {
    if (viewMode === ViewMode.Month) {
      current = addMonths(current, 1);
    } else if (viewMode === ViewMode.Week) {
      current = addDays(current, 7);
    } else {
      current = addDays(current, 1);
    }
    dates.push(new Date(current.getTime()));
  }
  return dates;
}

/** Pixel X of the start of the column that contains `now`, or null if out of range. */
export function todayColumnX(
  dates: Date[],
  columnWidth: number,
  now: Date = new Date(),
): number | null {
  const t = now.getTime();
  for (let i = 0; i < dates.length; i++) {
    const cur = dates[i].getTime();
    const next =
      i + 1 < dates.length
        ? dates[i + 1].getTime()
        : cur + columnWidth; // fallback span
    if (i + 1 !== dates.length && cur <= t && t < dates[i + 1].getTime()) {
      return i * columnWidth;
    }
    if (i + 1 === dates.length && cur <= t) {
      // last column — only highlight if within one column-step after last tick
      const step =
        i > 0 ? dates[i].getTime() - dates[i - 1].getTime() : 86400000;
      if (t < cur + step) return i * columnWidth;
    }
    void next;
  }
  return null;
}
