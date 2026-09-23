/** Canonical task table headers shared by every task list view. */
export const TASK_TABLE_COLUMN_LABELS = {
  key: "Key",
  title: "Title",
  status: "Status",
  project: "Project",
  assignee: "Assignee",
  approver: "Approver",
  priority: "Priority",
  complexity: "Complexity",
  startDate: "Start Date",
  deadline: "Deadline",
  created: "Created",
  prs: "PRs",
} as const;

export function formatTaskTableDate(
  value?: string | null,
): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString();
}
