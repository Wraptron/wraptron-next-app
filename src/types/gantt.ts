/** Shared Gantt row used by mapper + UI (before library Task conversion). */
export type GanttRow = {
  id: string;
  name: string;
  start: Date;
  end: Date;
  progress: number;
  assigneeName: string;
  /** True when start and/or end were inferred for display only. */
  usedFallbackDates: boolean;
  /** Predecessor task ids as strings (library format). */
  dependencies: string[];
  overdue: boolean;
  status: string;
};
