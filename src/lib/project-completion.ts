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

export function getProjectTaskCompletion(
  tasks?: Task[] | null,
): ProjectTaskCompletion {
  const list = tasks ?? [];
  const total = list.length;
  const completed = list.filter((t) => isTaskCompleted(t.status)).length;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
  return { total, completed, percent };
}
