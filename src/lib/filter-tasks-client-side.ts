import type { Task } from "@/lib/api";
import type {
  CollectionFilterDefinition,
  CollectionFilterState,
  DateRangeValue,
} from "@/lib/collection-filter-definitions";

export const UNASSIGNED_ASSIGNEE_VALUE = "__unassigned__";

const STATUS_ALIASES: Record<string, string> = {
  backlog: "pending",
  todo: "pending",
  pending: "pending",
  in_progress: "in_progress",
  review: "in_progress",
  completed: "done",
  done: "done",
  blocked: "blocked",
};

export function normalizeTaskStatus(status?: string | null): string {
  if (!status?.trim()) return "";
  const key = status.toLowerCase().replace(/\s/g, "_");
  return STATUS_ALIASES[key] ?? key;
}

function isTaskCompleted(status?: string | null): boolean {
  if (!status?.trim()) return false;
  const key = status.toLowerCase().replace(/\s/g, "_");
  return key === "done" || key === "completed";
}

function parseDateOnly(value?: string | null): Date | null {
  if (!value?.trim()) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function isTaskOverdue(task: Task): boolean {
  if (isTaskCompleted(task.status)) return false;
  const endDate = parseDateOnly(task.end_date);
  if (!endDate) return false;
  return endDate.getTime() < Date.now();
}

function isDateInRange(
  value: string | null | undefined,
  range: DateRangeValue,
): boolean {
  const date = parseDateOnly(value);
  if (!date) return false;

  const from = range.from?.trim();
  const to = range.to?.trim();
  if (from) {
    const fromDate = parseDateOnly(from);
    if (fromDate && date < fromDate) return false;
  }
  if (to) {
    const toDate = parseDateOnly(to);
    if (toDate && date > toDate) return false;
  }
  return true;
}

function matchesSearch(
  task: Task & { project_name?: string },
  query: string,
): boolean {
  const haystack = [
    task.title,
    task.description,
    task.project_name,
    task.notes,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(query);
}

function matchesFacet(
  task: Task & { project_name?: string },
  definition: CollectionFilterDefinition,
  values: string[],
): boolean {
  if (definition.id === "status") {
    const normalized = normalizeTaskStatus(task.status);
    return values.some((value) => normalized === value);
  }

  if (definition.id === "project_id") {
    const projectId = task.project_id != null ? String(task.project_id) : "";
    return values.includes(projectId);
  }

  if (definition.id === "assigned_employee_id") {
    const matchesUnassigned =
      values.includes(UNASSIGNED_ASSIGNEE_VALUE) &&
      (task.assigned_employee_id == null || task.assigned_employee_id === 0);
    const matchesAssignee =
      task.assigned_employee_id != null &&
      values.includes(String(task.assigned_employee_id));
    return matchesUnassigned || matchesAssignee;
  }

  if (definition.id === "priority") {
    const priority = task.priority?.toLowerCase() ?? "";
    return values.some((value) => priority === value.toLowerCase());
  }

  if (definition.id === "is_recurring") {
    const selected = values[0];
    if (selected === "true") return task.is_recurring === true;
    if (selected === "false") return !task.is_recurring;
    return true;
  }

  if (definition.id === "overdue") {
    const selected = values[0];
    const overdue = isTaskOverdue(task);
    if (selected === "true") return overdue;
    if (selected === "false") return !overdue;
    return true;
  }

  if (definition.id === "billable") {
    const billable = task.billable?.toLowerCase() ?? "";
    return values.some((value) => billable === value.toLowerCase());
  }

  const raw = String(
    (task as unknown as Record<string, unknown>)[definition.id] ?? "",
  ).toLowerCase();
  return values.some((value) => raw === value.toLowerCase());
}

export function filterTasksClientSide<T extends Task & { project_name?: string }>(
  tasks: T[],
  definitions: CollectionFilterDefinition[],
  state: CollectionFilterState,
): T[] {
  const search = state.search.trim().toLowerCase();

  return tasks.filter((task) => {
    if (search && !matchesSearch(task, search)) return false;

    for (const definition of definitions) {
      if (definition.type === "date") {
        const range = state.dates[definition.id];
        if (!range?.from?.trim() && !range?.to?.trim()) continue;
        if (!isDateInRange(task.end_date, range)) return false;
        continue;
      }

      if (definition.type === "number") continue;

      const values = state.facets[definition.id];
      if (!values?.length) continue;
      if (!matchesFacet(task, definition, values)) return false;
    }

    return true;
  });
}
