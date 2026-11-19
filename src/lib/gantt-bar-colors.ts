import type { WorkflowCategory } from "@/lib/api";

/** Shared Gantt bar / legend colours by workflow category. */
export const GANTT_CATEGORY_BAR: Record<
  WorkflowCategory,
  { background: string; progress: string }
> = {
  backlog: { background: "#64748b", progress: "#94a3b8" },
  in_progress: { background: "#3b82f6", progress: "#93c5fd" },
  review: { background: "#f59e0b", progress: "#fcd34d" },
  done: { background: "#22c55e", progress: "#86efac" },
};

export const GANTT_OVERDUE_BAR = {
  background: "#ef4444",
  progress: "#fca5a5",
} as const;

export const GANTT_TODAY_COLOR = "rgba(59, 130, 246, 0.15)";

/** Minimum on-screen bar width in every view mode (display-only). */
export const GANTT_MIN_BAR_PX = 14;
