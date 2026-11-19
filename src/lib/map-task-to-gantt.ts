import type { Task } from "@/lib/api";
import type { GanttRow } from "@/types/gantt";
import { isTaskOverdue } from "@/lib/is-task-overdue";

type DateLike =
  | Date
  | string
  | number
  | { toDate?: () => Date; seconds?: number; _seconds?: number }
  | null
  | undefined;

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date.getTime());
  next.setDate(next.getDate() + days);
  return next;
}

/**
 * Parse API date strings (YYYY-MM-DD or ISO), Date, epoch, or Firestore-like stamps
 * into a local calendar Date at midnight. Returns null if unusable.
 */
export function parseTaskDate(value: DateLike): Date | null {
  if (value == null || value === "") return null;

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return startOfLocalDay(value);
  }

  if (typeof value === "number") {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return null;
    return startOfLocalDay(d);
  }

  if (typeof value === "object") {
    if (typeof value.toDate === "function") {
      try {
        const d = value.toDate();
        if (d instanceof Date && !Number.isNaN(d.getTime())) {
          return startOfLocalDay(d);
        }
      } catch {
        return null;
      }
    }
    const seconds =
      typeof value.seconds === "number"
        ? value.seconds
        : typeof value._seconds === "number"
          ? value._seconds
          : null;
    if (seconds != null) {
      const d = new Date(seconds * 1000);
      if (!Number.isNaN(d.getTime())) return startOfLocalDay(d);
    }
    return null;
  }

  const raw = value.trim();
  if (!raw) return null;

  const isoDate = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw);
  if (isoDate) {
    const y = Number(isoDate[1]);
    const m = Number(isoDate[2]);
    const d = Number(isoDate[3]);
    const local = new Date(y, m - 1, d);
    if (
      local.getFullYear() === y &&
      local.getMonth() === m - 1 &&
      local.getDate() === d
    ) {
      return local;
    }
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;
  return startOfLocalDay(parsed);
}

function clampProgress(value: unknown): number {
  const n =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : NaN;
  if (!Number.isFinite(n)) return 0;
  return Math.min(100, Math.max(0, Math.round(n)));
}

export type MapTaskToGanttOptions = {
  assigneeName?: string | null;
  /** Ids present in the current project list — dangling deps are dropped. */
  knownTaskIds?: Set<number>;
};

/**
 * Maps an app Task to a Gantt row. Missing dates use display-only fallbacks
 * (created_at → start; start + 1 day → end) and set usedFallbackDates.
 */
export function mapTaskToGanttRow(
  task: Task,
  options: MapTaskToGanttOptions = {},
): GanttRow {
  const hasStoredStart = Boolean(task.start_date);
  const hasStoredEnd = Boolean(task.end_date);

  let start =
    parseTaskDate(task.start_date) ??
    parseTaskDate(task.created_at) ??
    startOfLocalDay(new Date());
  let end = parseTaskDate(task.end_date) ?? addDays(start, 1);

  if (end < start) {
    end = new Date(start.getTime());
  }

  const assignee = options.assigneeName?.trim() || "Unassigned";
  const known = options.knownTaskIds;
  const dependencies = (task.dependencies ?? [])
    .filter((id) => {
      if (id === task.id) return false;
      if (known && !known.has(id)) return false;
      return true;
    })
    .map(String);

  return {
    id: String(task.id),
    name: task.title || "Untitled task",
    start,
    end,
    progress: clampProgress(task.progress),
    assigneeName: assignee,
    usedFallbackDates: !hasStoredStart || !hasStoredEnd,
    dependencies,
    overdue: isTaskOverdue(task),
    status: task.status ?? "",
  };
}

export function mapTasksToGanttRows(
  tasks: Task[],
  assigneeNameByEmployeeId?: Map<number, string>,
): GanttRow[] {
  const known = new Set(tasks.map((t) => t.id));
  return tasks.map((task) => {
    const name =
      task.assigned_employee_id != null
        ? assigneeNameByEmployeeId?.get(task.assigned_employee_id)
        : null;
    return mapTaskToGanttRow(task, {
      assigneeName: name?.trim() ? name : "Unassigned",
      knownTaskIds: known,
    });
  });
}
