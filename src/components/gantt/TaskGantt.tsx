"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import {
  Gantt,
  ViewMode,
  type Task as GanttLibTask,
} from "gantt-task-react";
import "gantt-task-react/dist/index.css";
import "./task-gantt.css";
import { AlertTriangle, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  employeesApi,
  projectsApi,
  taskStatusesApi,
  WORKFLOW_CATEGORY_LABELS,
  type Employee,
  type Task,
  type TaskStatus,
  type WorkflowCategory,
} from "@/lib/api";
import { formatDateToIsoLocal, validateGanttSchedule } from "@/lib/gantt-validation";
import {
  ganttChartDateRange,
  seedGanttDates,
  todayColumnX,
} from "@/lib/gantt-timeline";
import {
  GANTT_CATEGORY_BAR,
  GANTT_OVERDUE_BAR,
  GANTT_TODAY_COLOR,
} from "@/lib/gantt-bar-colors";
import { ensureMinDisplayBarEnd } from "@/lib/gantt-min-bar";
import { countOverdueTasks } from "@/lib/is-task-overdue";
import { mapTasksToGanttRows } from "@/lib/map-task-to-gantt";
import { notifyError } from "@/lib/notify-error";
import { findPredecessorScheduleConflicts } from "@/lib/task-dependency-graph";
import { cn } from "@/lib/utils";
import { hasPermission } from "@/lib/nav-access";
import { useOrganization } from "@/contexts/organization-context";
import type { GanttRow } from "@/types/gantt";
import { TaskGanttDependenciesSheet } from "./TaskGanttDependenciesSheet";

const HEADER_HEIGHT = 50;
const ROW_HEIGHT = 44;
const GANTT_HEIGHT = 480;
const LIST_WIDTH_PX = 520;
const LIST_CELL_WIDTH = `${LIST_WIDTH_PX}px`;
const LIST_GRID_COLUMNS = "168px 88px 100px 96px 68px";
const LIST_FIXED_STYLE: CSSProperties = {
  width: LIST_WIDTH_PX,
  minWidth: LIST_WIDTH_PX,
  maxWidth: LIST_WIDTH_PX,
  flex: "none",
  boxSizing: "border-box",
};
const SAVE_DEBOUNCE_MS = 400;
const PRE_STEPS = 1;

const GANTT_FONT =
  'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

type TaskGanttProps = {
  tasks: Task[];
  projectId: number;
  onTaskUpdate: (taskUpdate?: Task) => void;
  className?: string;
};

type PendingSave = {
  start_date: string;
  end_date: string;
  progress: number;
};

type LibTaskExtra = GanttLibTask & {
  /** mirrored for list rendering */
  _overdue?: boolean;
  _status?: string;
};

function formatListDate(date: Date): string {
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function employeeDisplayName(emp: Employee): string {
  return (
    [emp.first_name, emp.last_name].filter(Boolean).join(" ") ||
    emp.email ||
    "Unassigned"
  );
}

function categoryForStatus(
  statusName: string,
  statuses: TaskStatus[],
): WorkflowCategory {
  const hit = statuses.find(
    (s) => s.name.toLowerCase() === statusName.toLowerCase(),
  );
  if (hit) return hit.category;
  const n = statusName.toLowerCase().replace(/\s+/g, "_");
  if (n === "done" || n === "completed") return "done";
  if (n.includes("review")) return "review";
  if (n.includes("progress") || n === "todo" || n === "in_progress") {
    return "in_progress";
  }
  return "backlog";
}

function rowsToLibTasks(
  rows: GanttRow[],
  canEdit: boolean,
  statuses: TaskStatus[],
  viewMode: ViewMode,
  columnWidth: number,
): LibTaskExtra[] {
  return rows.map((row) => {
    const cat = categoryForStatus(row.status, statuses);
    const colors = row.overdue
      ? GANTT_OVERDUE_BAR
      : GANTT_CATEGORY_BAR[cat];
    const displayEnd = ensureMinDisplayBarEnd(
      row.start,
      row.end,
      viewMode,
      columnWidth,
    );
    return {
      id: row.id,
      name: row.name,
      start: row.start,
      end: displayEnd,
      progress: row.progress,
      type: "task" as const,
      isDisabled: !canEdit,
      displayOrder: Number(row.id) || 0,
      dependencies: row.dependencies,
      styles: {
        backgroundColor: colors.background,
        backgroundSelectedColor: colors.background,
        progressColor: colors.progress,
        progressSelectedColor: colors.progress,
      },
      _overdue: row.overdue,
      _status: row.status,
    };
  });
}

export function TaskGantt({
  tasks,
  projectId,
  onTaskUpdate,
  className,
}: TaskGanttProps) {
  const { permissions, isOwner } = useOrganization();
  const canEdit = isOwner || hasPermission(permissions, "tasks.update");

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [statuses, setStatuses] = useState<TaskStatus[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Week);
  const [optimisticTasks, setOptimisticTasks] = useState<LibTaskExtra[] | null>(
    null,
  );
  /** Controls which date viewDate scrolls to (first task vs today). */
  const [scrollTarget, setScrollTarget] = useState<"first" | "today">("first");
  const [viewDateToken, setViewDateToken] = useState(0);
  const [depsTaskId, setDepsTaskId] = useState<number | null>(null);
  const [scrollLeft, setScrollLeft] = useState(0);

  const chartWrapRef = useRef<HTMLDivElement>(null);
  const snapshotRef = useRef<LibTaskExtra[]>([]);
  const saveTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );
  const pendingRef = useRef<Map<string, PendingSave>>(new Map());
  const tasksSignatureRef = useRef<string>("");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [empRes, statusRes] = await Promise.all([
          employeesApi.getAll({ employment_status: "active", limit: 500 }),
          taskStatusesApi.getAll(),
        ]);
        if (!cancelled) {
          setEmployees(empRes.data);
          setStatuses(statusRes.data ?? []);
        }
      } catch {
        if (!cancelled) {
          setEmployees([]);
          setStatuses([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const assigneeNameByEmployeeId = useMemo(() => {
    const map = new Map<number, string>();
    for (const emp of employees) {
      map.set(emp.id, employeeDisplayName(emp));
    }
    return map;
  }, [employees]);

  const mappedRows = useMemo(
    () => mapTasksToGanttRows(tasks, assigneeNameByEmployeeId),
    [tasks, assigneeNameByEmployeeId],
  );

  const columnWidth =
    viewMode === ViewMode.Month ? 360 : viewMode === ViewMode.Week ? 180 : 65;

  const derivedTasks = useMemo(
    () =>
      rowsToLibTasks(mappedRows, canEdit, statuses, viewMode, columnWidth),
    [mappedRows, canEdit, statuses, viewMode, columnWidth],
  );

  const rowById = useMemo(() => {
    const map = new Map<string, GanttRow>();
    for (const row of mappedRows) map.set(row.id, row);
    return map;
  }, [mappedRows]);

  const tasksById = useMemo(() => {
    const map = new Map<number, Task>();
    for (const t of tasks) map.set(t.id, t);
    return map;
  }, [tasks]);

  const fallbackCount = useMemo(
    () => mappedRows.filter((r) => r.usedFallbackDates).length,
    [mappedRows],
  );

  const overdueCount = useMemo(() => countOverdueTasks(tasks), [tasks]);

  const tasksSignature = useMemo(
    () =>
      tasks
        .map(
          (t) =>
            `${t.id}:${t.start_date ?? ""}:${t.end_date ?? ""}:${t.progress ?? 0}:${t.title}:${(t.dependencies ?? []).join(",")}:${t.status}`,
        )
        .join("|"),
    [tasks],
  );

  useEffect(() => {
    if (tasksSignatureRef.current !== tasksSignature) {
      tasksSignatureRef.current = tasksSignature;
      setOptimisticTasks(null);
    }
  }, [tasksSignature]);

  const ganttTasks = optimisticTasks ?? derivedTasks;

  const timelineDates = useMemo(() => {
    const [start, end] = ganttChartDateRange(ganttTasks, viewMode, PRE_STEPS);
    return seedGanttDates(start, end, viewMode);
  }, [ganttTasks, viewMode]);

  const todayX = useMemo(
    () => todayColumnX(timelineDates, columnWidth),
    [timelineDates, columnWidth],
  );

  const earliestStart = useMemo(() => {
    if (ganttTasks.length === 0) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      return d;
    }
    let earliest = ganttTasks[0].start;
    for (const t of ganttTasks) {
      if (t.start < earliest) earliest = t.start;
    }
    return earliest;
  }, [ganttTasks]);

  /** On load / view-mode change: earliest task. Jump buttons override via scrollTarget. */
  const jumpViewDate = useMemo(() => {
    void viewDateToken;
    if (scrollTarget === "today") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return today;
    }
    return earliestStart;
  }, [earliestStart, scrollTarget, viewDateToken]);

  useEffect(() => {
    snapshotRef.current = ganttTasks;
  }, [ganttTasks]);

  useEffect(() => {
    const timers = saveTimersRef.current;
    return () => {
      for (const t of timers.values()) clearTimeout(t);
      timers.clear();
    };
  }, []);

  // Sync overlay with the library's internal horizontal scroller.
  useEffect(() => {
    const root = chartWrapRef.current;
    if (!root) return;

    const findScroller = () =>
      root.querySelector<HTMLElement>("div[class*='_2k9Ys'], .task-gantt-scroll-host div");

    let scroller: HTMLElement | null = null;
    let raf = 0;

    const onScroll = () => {
      if (!scroller) return;
      setScrollLeft(scroller.scrollLeft);
    };

    const attach = () => {
      scroller = findScroller();
      if (!scroller) {
        raf = window.requestAnimationFrame(attach);
        return;
      }
      scroller.addEventListener("scroll", onScroll, { passive: true });
      setScrollLeft(scroller.scrollLeft);
    };
    attach();

    return () => {
      window.cancelAnimationFrame(raf);
      scroller?.removeEventListener("scroll", onScroll);
    };
  }, [viewMode, ganttTasks.length]);

  const persistSchedule = useCallback(
    async (taskId: string, payload: PendingSave, previous: LibTaskExtra[]) => {
      const checked = validateGanttSchedule(payload);
      if (!checked.ok) {
        setOptimisticTasks(previous);
        snapshotRef.current = previous;
        notifyError(checked.error);
        return false;
      }

      try {
        const updated = await projectsApi.updateTask(projectId, Number(taskId), {
          start_date: checked.value.start_date,
          end_date: checked.value.end_date,
          progress: checked.value.progress,
        });
        onTaskUpdate(updated);
        return true;
      } catch (err) {
        setOptimisticTasks(previous);
        snapshotRef.current = previous;
        const status =
          err && typeof err === "object" && "status" in err
            ? Number((err as { status: unknown }).status)
            : undefined;
        const message =
          status === 403
            ? "You do not have permission to update tasks."
            : err instanceof Error
              ? err.message
              : "Failed to save task schedule.";
        notifyError(message);
        return false;
      }
    },
    [onTaskUpdate, projectId],
  );

  const queueSave = useCallback(
    (task: GanttLibTask, previous: LibTaskExtra[]) => {
      if (!canEdit) {
        setOptimisticTasks(previous);
        snapshotRef.current = previous;
        return;
      }

      const payload: PendingSave = {
        start_date: formatDateToIsoLocal(task.start),
        end_date: formatDateToIsoLocal(task.end),
        progress: Math.round(task.progress),
      };
      pendingRef.current.set(task.id, payload);

      const existing = saveTimersRef.current.get(task.id);
      if (existing) clearTimeout(existing);

      const timer = setTimeout(() => {
        saveTimersRef.current.delete(task.id);
        const pending = pendingRef.current.get(task.id);
        pendingRef.current.delete(task.id);
        if (!pending) return;
        void persistSchedule(task.id, pending, previous);
      }, SAVE_DEBOUNCE_MS);

      saveTimersRef.current.set(task.id, timer);
    },
    [canEdit, persistSchedule],
  );

  const handleDateChange = useCallback(
    async (task: GanttLibTask): Promise<boolean> => {
      const previous = snapshotRef.current;
      let start = task.start;
      let end = task.end;
      if (end < start) end = new Date(start.getTime());
      const nextTask = { ...task, start, end } as LibTaskExtra;
      const next = previous.map((t) => (t.id === task.id ? nextTask : t));
      setOptimisticTasks(next);
      snapshotRef.current = next;
      queueSave(nextTask, previous);
      return true;
    },
    [queueSave],
  );

  const handleProgressChange = useCallback(
    async (task: GanttLibTask): Promise<boolean> => {
      const previous = snapshotRef.current;
      const progress = Math.min(100, Math.max(0, Math.round(task.progress)));
      const nextTask = { ...task, progress } as LibTaskExtra;
      const next = previous.map((t) => (t.id === task.id ? nextTask : t));
      setOptimisticTasks(next);
      snapshotRef.current = next;
      // Persist logical dates (not min-width display end).
      const logical = mappedRows.find((r) => r.id === task.id);
      const saveTask: GanttLibTask = logical
        ? { ...nextTask, start: logical.start, end: logical.end }
        : nextTask;
      queueSave(saveTask, previous);
      return true;
    },
    [mappedRows, queueSave],
  );

  const jumpToToday = () => {
    setScrollTarget("today");
    setViewDateToken((n) => n + 1);
  };

  const jumpToFirstTask = () => {
    setScrollTarget("first");
    setViewDateToken((n) => n + 1);
  };

  const setViewModeAndAnchor = (mode: ViewMode) => {
    setViewMode(mode);
    setScrollTarget("first");
    setViewDateToken((n) => n + 1);
    setOptimisticTasks(null);
  };

  const TaskListHeader = useCallback(
    ({
      headerHeight,
      fontFamily,
      fontSize,
    }: {
      headerHeight: number;
      rowWidth: string;
      fontFamily: string;
      fontSize: string;
    }) => (
      <div
        className="grid items-center border-b border-border bg-muted text-xs font-medium uppercase tracking-wide text-muted-foreground"
        style={{
          ...LIST_FIXED_STYLE,
          height: headerHeight,
          gridTemplateColumns: LIST_GRID_COLUMNS,
          fontFamily,
          fontSize,
        }}
      >
        <div className="truncate px-2">Task</div>
        <div className="truncate px-1">Start</div>
        <div className="truncate px-1">End</div>
        <div className="truncate px-1">Assignee</div>
        <div className="truncate px-1">Links</div>
      </div>
    ),
    [],
  );

  const TaskListTable = useCallback(
    ({
      rowHeight,
      fontFamily,
      fontSize,
      tasks: listTasks,
      selectedTaskId,
      setSelectedTask,
    }: {
      rowHeight: number;
      rowWidth: string;
      fontFamily: string;
      fontSize: string;
      locale: string;
      tasks: GanttLibTask[];
      selectedTaskId: string;
      setSelectedTask: (taskId: string) => void;
      onExpanderClick: (task: GanttLibTask) => void;
    }) => (
      <div style={{ ...LIST_FIXED_STYLE, fontFamily, fontSize }}>
        {listTasks.map((t) => {
          const row = rowById.get(t.id);
          const overdue = row?.overdue ?? false;
          const conflicts = findPredecessorScheduleConflicts({
            taskId: t.id,
            start: t.start,
            dependencyIds: row?.dependencies ?? t.dependencies ?? [],
            tasksById: new Map(
              mappedRows.map((r) => [
                r.id,
                { id: r.id, name: r.name, start: r.start, end: r.end },
              ]),
            ),
          });
          const selected = selectedTaskId === t.id;
          return (
            <div
              key={t.id}
              className={cn(
                "grid cursor-pointer items-center border-b border-border text-sm",
                selected ? "bg-accent/60" : "hover:bg-muted/40",
              )}
              style={{
                height: rowHeight,
                width: LIST_WIDTH_PX,
                minWidth: LIST_WIDTH_PX,
                maxWidth: LIST_WIDTH_PX,
                gridTemplateColumns: LIST_GRID_COLUMNS,
                flex: "none",
                boxSizing: "border-box",
              }}
              onClick={() => setSelectedTask(t.id)}
            >
              <div className="flex min-w-0 items-center gap-1 px-2">
                {conflicts.length > 0 ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span
                        className="inline-flex shrink-0 text-amber-500"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <AlertTriangle className="h-3.5 w-3.5" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs text-xs">
                      Starts before &quot;{conflicts[0].predecessorName}&quot;
                      finishes
                      {conflicts.length > 1
                        ? ` (+${conflicts.length - 1} more)`
                        : ""}
                    </TooltipContent>
                  </Tooltip>
                ) : null}
                <span className="truncate font-medium" title={t.name}>
                  {t.name}
                </span>
              </div>
              <div className="truncate px-1 text-muted-foreground">
                {formatListDate(t.start)}
              </div>
              <div
                className={cn(
                  "flex min-w-0 items-center gap-1 truncate px-1",
                  overdue ? "font-medium text-red-500" : "text-muted-foreground",
                )}
              >
                <span className="truncate">{formatListDate(t.end)}</span>
                {overdue ? (
                  <span className="shrink-0 rounded bg-red-500/15 px-1 py-0.5 text-[10px] font-semibold uppercase text-red-500">
                    Overdue
                  </span>
                ) : null}
              </div>
              <div
                className="truncate px-1 text-muted-foreground"
                title={row?.assigneeName ?? "Unassigned"}
              >
                {row?.assigneeName ?? "Unassigned"}
              </div>
              <div className="flex items-center px-1">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0"
                  title="Edit dependencies"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDepsTaskId(Number(t.id));
                  }}
                >
                  <Link2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    ),
    [mappedRows, rowById],
  );

  if (tasks.length === 0 || ganttTasks.length === 0) {
    return (
      <div
        className={cn(
          "flex min-h-[240px] flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 px-6 py-12 text-center",
          className,
        )}
      >
        <p className="text-sm font-medium">No tasks yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Add tasks to this project to see them on the Gantt chart.
        </p>
      </div>
    );
  }

  const todayLineLeft =
    todayX != null ? LIST_WIDTH_PX + todayX - scrollLeft : null;

  return (
    <div className={cn("task-gantt-theme space-y-3", className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg border p-1">
            {(
              [
                { mode: ViewMode.Day, label: "Day" },
                { mode: ViewMode.Week, label: "Week" },
                { mode: ViewMode.Month, label: "Month" },
              ] as const
            ).map(({ mode, label }) => (
              <Button
                key={label}
                type="button"
                size="sm"
                variant={viewMode === mode ? "default" : "ghost"}
                className="h-8"
                onClick={() => setViewModeAndAnchor(mode)}
              >
                {label}
              </Button>
            ))}
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8"
            onClick={jumpToFirstTask}
          >
            Jump to first task
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8"
            onClick={jumpToToday}
          >
            Jump to today
          </Button>
        </div>
        {!canEdit ? (
          <p className="text-xs text-muted-foreground">
            Read-only — you need tasks.update to edit the schedule.
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
        {(
          Object.keys(WORKFLOW_CATEGORY_LABELS) as WorkflowCategory[]
        ).map((cat) => (
          <span key={cat} className="inline-flex items-center gap-1.5">
            <span
              className="inline-block h-2.5 w-2.5 rounded-sm"
              style={{ background: GANTT_CATEGORY_BAR[cat].background }}
            />
            {WORKFLOW_CATEGORY_LABELS[cat]}
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5 text-red-500">
          <span
            className="inline-block h-2.5 w-2.5 rounded-sm"
            style={{ background: GANTT_OVERDUE_BAR.background }}
          />
          Overdue ({overdueCount})
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Link2 className="h-3 w-3" />
          arrow = depends on
        </span>
      </div>

      {fallbackCount > 0 ? (
        <p className="text-xs text-muted-foreground">
          {fallbackCount} task{fallbackCount === 1 ? "" : "s"} missing stored
          dates — showing display-only fallbacks (created date / +1 day). Dates
          are saved only after you drag or resize a bar. Dependency arrows still
          use those display dates when present.
        </p>
      ) : null}

      <div
        ref={chartWrapRef}
        className="task-gantt-chart"
      >
        <Gantt
          key={`gantt-${viewMode}-${viewDateToken}`}
          tasks={ganttTasks}
          viewMode={viewMode}
          viewDate={jumpViewDate}
          preStepsCount={PRE_STEPS}
          onDateChange={handleDateChange}
          onProgressChange={handleProgressChange}
          listCellWidth={LIST_CELL_WIDTH}
          columnWidth={columnWidth}
          rowHeight={ROW_HEIGHT}
          headerHeight={HEADER_HEIGHT}
          ganttHeight={GANTT_HEIGHT}
          barCornerRadius={4}
          barFill={60}
          handleWidth={8}
          fontSize="12px"
          fontFamily={GANTT_FONT}
          barBackgroundColor={GANTT_CATEGORY_BAR.backlog.background}
          barBackgroundSelectedColor={GANTT_CATEGORY_BAR.backlog.background}
          barProgressColor={GANTT_CATEGORY_BAR.backlog.progress}
          barProgressSelectedColor={GANTT_CATEGORY_BAR.backlog.progress}
          todayColor={GANTT_TODAY_COLOR}
          arrowColor="var(--muted-foreground)"
          TaskListHeader={TaskListHeader}
          TaskListTable={TaskListTable}
        />

        {/* Thin today line + label (Day/Week/Month). pointer-events:none so bars stay draggable. */}
        {todayLineLeft != null && todayLineLeft >= LIST_WIDTH_PX - 2 ? (
          <div
            className="pointer-events-none absolute top-0 z-20"
            style={{
              left: todayLineLeft,
              height: "100%",
              width: 0,
            }}
            aria-hidden
          >
            <div className="absolute left-0 top-0 -translate-x-1/2 rounded-b bg-primary px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground shadow">
              Today
            </div>
            <div
              className="absolute left-0 top-5 bottom-0 w-0.5 -translate-x-1/2 bg-primary"
              style={{ opacity: 0.85 }}
            />
          </div>
        ) : null}
      </div>

      <TaskGanttDependenciesSheet
        open={depsTaskId != null}
        onOpenChange={(open) => {
          if (!open) setDepsTaskId(null);
        }}
        projectId={projectId}
        task={depsTaskId != null ? tasksById.get(depsTaskId) ?? null : null}
        allTasks={tasks}
        canEdit={canEdit}
        onSaved={(updated) => onTaskUpdate(updated)}
      />
    </div>
  );
}
