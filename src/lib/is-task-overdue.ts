import { isTaskCompleted } from "@/lib/project-completion";
import { parseTaskDate } from "@/lib/map-task-to-gantt";

export type OverdueTaskInput = {
  end_date?: string | null;
  start_date?: string | null;
  status?: string;
};

/**
 * A task is overdue when it has real stored dates (both start and end),
 * its end date is before the start of today in the local timezone, and
 * its status is not Done/completed.
 *
 * Pure / unit-testable — pass `now` to freeze time in tests.
 */
export function isTaskOverdue(
  task: OverdueTaskInput,
  now: Date = new Date(),
): boolean {
  if (!task.start_date || !task.end_date) return false;
  if (isTaskCompleted(task.status)) return false;

  const end = parseTaskDate(task.end_date);
  if (!end) return false;

  const todayStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  // End of the end_date calendar day is still "on time"; overdue only after that day.
  // Compare by date only: end day < today.
  return end.getTime() < todayStart.getTime();
}

export function countOverdueTasks(
  tasks: OverdueTaskInput[],
  now: Date = new Date(),
): number {
  return tasks.filter((t) => isTaskOverdue(t, now)).length;
}
