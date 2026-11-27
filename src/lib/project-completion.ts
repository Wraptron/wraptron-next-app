import type { Task } from "@/lib/api";

export function isTaskCompleted(status?: string): boolean {
  const normalized = status?.toLowerCase().trim();
  return normalized === "completed" || normalized === "done";
}

export type ProjectTaskCompletion = {
  total: number;
  completed: number;
  percent: number;
};

export type ProjectTaskCounts = {
  taskCount?: number | null;
  completedTaskCount?: number | null;
};

/** Computes total, completed, and completion percentage from tasks or summary counts. */
export function getProjectTaskCompletion(
  tasks?: Task[] | null,
  counts?: ProjectTaskCounts,
): ProjectTaskCompletion {
  if (Array.isArray(tasks)) {
    const total = tasks.length;
    const completed = tasks.filter((t) => isTaskCompleted(t.status)).length;
    const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
    return { total, completed, percent };
  }

  const total = Math.max(0, counts?.taskCount ?? 0);
  const completed = Math.min(total, Math.max(0, counts?.completedTaskCount ?? 0));
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
  return { total, completed, percent };
}
