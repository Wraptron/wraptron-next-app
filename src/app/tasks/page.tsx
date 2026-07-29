"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  employeesApi,
  projectsApi,
  taskStatusesApi,
  tasksApi,
  WORKFLOW_CATEGORY_LABELS,
  WORKFLOW_CATEGORY_ORDER,
  type BoardTask,
  type Employee,
  type Project,
  type TaskStatus,
  type WorkflowCategory,
} from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { usePageTitle } from "@/contexts/page-title-context";
import {
  CollectionKanbanView,
  type CollectionKanbanColumn,
} from "@/components/collection-kanban-view";
import {
  CollectionView,
  type CollectionColumn,
  type CollectionItem,
} from "@/components/collection-view";
import {
  CollectionPageToolbar,
  useCollectionViewMode,
  type CollectionViewMode,
} from "@/components/collection-page-toolbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  Check,
  Copy,
  GitMerge,
  GitPullRequest,
  GitPullRequestClosed,
} from "lucide-react";

/** Client-side mirror of the server's category transition rules (UX only —
 * the API enforces them regardless). */
function canMove(
  role: string | undefined,
  from: WorkflowCategory,
  to: WorkflowCategory,
): { allowed: boolean; reason?: string } {
  if (from === to) return { allowed: true };
  const r = (role ?? "").toLowerCase();
  if (r === "admin") return { allowed: true };
  if (r !== "staff") return { allowed: false, reason: "Staff access required" };
  if (from === "done" || to === "done") {
    return {
      allowed: false,
      reason: "Only admins can move tasks into or out of Done",
    };
  }
  if (
    Math.abs(WORKFLOW_CATEGORY_ORDER[to] - WORKFLOW_CATEGORY_ORDER[from]) !== 1
  ) {
    return {
      allowed: false,
      reason: "Staff can only move tasks one step at a time",
    };
  }
  return { allowed: true };
}

function toDateInputValue(value?: string | null): string {
  if (!value) return "";
  return value.slice(0, 10);
}

const PR_STATE_META: Record<
  string,
  { icon: React.ReactNode; className: string }
> = {
  open: {
    icon: <GitPullRequest className="h-3 w-3" />,
    className:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  },
  merged: {
    icon: <GitMerge className="h-3 w-3" />,
    className:
      "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
  },
  closed: {
    icon: <GitPullRequestClosed className="h-3 w-3" />,
    className: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
  },
};

function CopyBranchButton({
  task,
  onTaken,
}: {
  task: BoardTask;
  onTaken: (message: string) => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const result = await tasksApi.take(task.id);
      if (result.branch_name) {
        await navigator.clipboard.writeText(result.branch_name);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      const parts = [`Copied ${result.branch_name}`];
      if (result.assigned) parts.push("assigned to you");
      if (result.moved) parts.push("moved to In Progress");
      onTaken(parts.join(" · "));
    } catch (err) {
      onTaken(err instanceof Error ? err.message : "Failed to copy branch");
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-6 w-6 shrink-0 text-muted-foreground hover:text-foreground"
      onClick={handleCopy}
      title="Copy branch name (takes the task)"
    >
      {copied ? (
        <Check className="h-3.5 w-3.5" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </Button>
  );
}

function TaskBoardCard({
  task,
  onTaken,
  interactive = "drag",
  onClick,
}: {
  task: BoardTask;
  onTaken: (message: string) => void;
  interactive?: "drag" | "click";
  onClick?: () => void;
}) {
  const prMeta = task.latest_pr_state
    ? PR_STATE_META[task.latest_pr_state]
    : null;

  return (
    <div
      role={interactive === "click" ? "button" : undefined}
      tabIndex={interactive === "click" ? 0 : undefined}
      onClick={interactive === "click" ? onClick : undefined}
      onKeyDown={
        interactive === "click"
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
      className={cn(
        "rounded-lg border border-border bg-card p-3 shadow-none",
        interactive === "drag" &&
          "cursor-grab active:cursor-grabbing",
        interactive === "click" &&
          "cursor-pointer transition-colors hover:bg-muted/40",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground">
          {task.display_key}
        </span>
        <CopyBranchButton task={task} onTaken={onTaken} />
      </div>
      <h4 className="mt-1 line-clamp-2 text-sm font-semibold text-foreground">
        {task.title}
      </h4>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <Badge variant="outline" className="text-[10px]">
          {task.project_name}
        </Badge>
        {task.priority && (
          <Badge variant="secondary" className="text-[10px] capitalize">
            {task.priority}
          </Badge>
        )}
        {interactive === "click" && (
          <Badge variant="outline" className="text-[10px] capitalize">
            {task.status.replace(/_/g, " ")}
          </Badge>
        )}
        {prMeta && task.pr_count > 0 && (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${prMeta.className}`}
          >
            {prMeta.icon}
            {task.pr_count > 1 ? task.pr_count : task.latest_pr_state}
          </span>
        )}
        {task.assignee_name && (
          <span className="ml-auto truncate text-[10px] text-muted-foreground">
            {task.assignee_name}
          </span>
        )}
      </div>
    </div>
  );
}

export default function TasksBoardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { setTitle } = usePageTitle();
  const [viewMode, setViewMode] = useCollectionViewMode(
    "tasks_view_mode",
    "kanban",
  );

  const [tasks, setTasks] = useState<BoardTask[]>([]);
  const [statuses, setStatuses] = useState<TaskStatus[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);

  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [myTasksOnly, setMyTasksOnly] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newProject, setNewProject] = useState<string>("");
  const [newDescription, setNewDescription] = useState("");
  const [newAssignee, setNewAssignee] = useState<string>("unassigned");
  const [newPriority, setNewPriority] = useState("medium");
  const [updatingTaskIds, setUpdatingTaskIds] = useState<Record<number, boolean>>(
    {},
  );

  useEffect(() => {
    setTitle("Tasks");
    return () => setTitle(null);
  }, [setTitle]);

  const myEmployeeId = useMemo(() => {
    if (!user) return null;
    const me = employees.find(
      (e) => e.email?.toLowerCase() === user.email.toLowerCase(),
    );
    return me?.id ?? null;
  }, [employees, user]);

  const loadTasks = useCallback(async () => {
    try {
      const filters: Parameters<typeof tasksApi.board>[0] = {};
      if (projectFilter !== "all") filters.project_id = parseInt(projectFilter);
      if (assigneeFilter !== "all") {
        filters.assigned_employee_id = parseInt(assigneeFilter);
      }
      if (search.trim()) filters.q = search.trim();
      const res = await tasksApi.board(filters);
      setTasks(res.data);
    } catch (err) {
      console.error("Failed to load tasks:", err);
      setNotice(err instanceof Error ? err.message : "Failed to load tasks");
    }
  }, [projectFilter, assigneeFilter, search]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [statusesRes, projectsRes, employeesRes] = await Promise.all([
          taskStatusesApi.getAll(),
          projectsApi.getAll({ limit: 500 }),
          employeesApi.getAll({ employment_status: "active", limit: 500 }),
        ]);
        if (cancelled) return;
        setStatuses(statusesRes.data);
        setProjects(projectsRes.data);
        setEmployees(employeesRes.data);
      } catch (err) {
        console.error("Failed to load board data:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    void loadTasks();
  }, [loadTasks]);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(t);
  }, [notice]);

  const orderedStatuses = useMemo(
    () =>
      [...statuses].sort(
        (a, b) =>
          WORKFLOW_CATEGORY_ORDER[a.category] -
            WORKFLOW_CATEGORY_ORDER[b.category] ||
          a.sort_order - b.sort_order ||
          a.id - b.id,
      ),
    [statuses],
  );

  const visibleTasks = useMemo(() => {
    if (!myTasksOnly || myEmployeeId == null) return tasks;
    return tasks.filter((t) => t.assigned_employee_id === myEmployeeId);
  }, [tasks, myTasksOnly, myEmployeeId]);

  const tasksById = useMemo(() => {
    const map = new Map<number, BoardTask>();
    for (const t of visibleTasks) map.set(t.id, t);
    return map;
  }, [visibleTasks]);

  const kanbanColumns: CollectionKanbanColumn[] = useMemo(
    () =>
      orderedStatuses.map((s) => ({
        id: s.name,
        label: (
          <span className="flex items-center gap-2 capitalize">
            {s.name.replace(/_/g, " ")}
            <span className="text-xs font-normal text-muted-foreground">
              {WORKFLOW_CATEGORY_LABELS[s.category]}
            </span>
          </span>
        ),
      })),
    [orderedStatuses],
  );

  const items: CollectionItem[] = useMemo(
    () =>
      visibleTasks.map((t) => ({
        id: t.id,
        title: t.title,
        description: null,
        meta: null,
      })),
    [visibleTasks],
  );

  const statusByName = useMemo(() => {
    const map = new Map<string, TaskStatus>();
    for (const s of statuses) map.set(s.name.toLowerCase(), s);
    return map;
  }, [statuses]);

  const assigneeOptionsByTaskId = useMemo(() => {
    const employeeLabelById = new Map<number, string>();
    for (const employee of employees) {
      employeeLabelById.set(
        employee.id,
        `${employee.first_name} ${employee.last_name}`.trim(),
      );
    }
    const map = new Map<number, Array<{ id: number; label: string }>>();
    for (const task of visibleTasks) {
      const options = employees.map((employee) => ({
        id: employee.id,
        label: `${employee.first_name} ${employee.last_name}`.trim(),
      }));
      if (
        task.assigned_employee_id != null &&
        !employeeLabelById.has(task.assigned_employee_id)
      ) {
        options.unshift({
          id: task.assigned_employee_id,
          label:
            task.assignee_name?.trim() ||
            `Employee #${task.assigned_employee_id}`,
        });
      }
      map.set(task.id, options);
    }
    return map;
  }, [employees, visibleTasks]);

  const taskHref = useCallback(
    (item: CollectionItem) => {
      const task = tasksById.get(Number(item.id));
      return task ? `/tasks/${task.display_key}` : undefined;
    },
    [tasksById],
  );

  const onTaken = useCallback(
    (message: string) => {
      setNotice(message);
      void loadTasks();
    },
    [loadTasks],
  );

  const patchTask = useCallback(
    async (
      task: BoardTask,
      changes: Partial<Pick<BoardTask, "status" | "category" | "assigned_employee_id" | "assignee_name" | "end_date">>,
      payload: { status?: string; assigned_employee_id?: number | null; end_date?: string | null },
      errorMessage: string,
    ) => {
      const previous = task;
      setUpdatingTaskIds((prev) => ({ ...prev, [task.id]: true }));
      setTasks((prev) =>
        prev.map((current) =>
          current.id === task.id ? { ...current, ...changes } : current,
        ),
      );
      try {
        const updated = await tasksApi.update(task.id, payload);
        setTasks((prev) =>
          prev.map((current) => (current.id === task.id ? updated : current)),
        );
      } catch (err) {
        setTasks((prev) =>
          prev.map((current) => (current.id === previous.id ? previous : current)),
        );
        setNotice(err instanceof Error ? err.message : errorMessage);
      } finally {
        setUpdatingTaskIds((prev) => {
          const next = { ...prev };
          delete next[task.id];
          return next;
        });
      }
    },
    [],
  );

  const handleInlineStatusChange = useCallback(
    async (task: BoardTask, statusName: string) => {
      if (statusName === task.status) return;
      const toStatus = statusByName.get(statusName.toLowerCase());
      if (!toStatus) return;
      const fromCategory = task.category ?? "backlog";
      const check = canMove(user?.role, fromCategory, toStatus.category);
      if (!check.allowed) {
        setNotice(check.reason ?? "Status change not allowed");
        return;
      }
      await patchTask(
        task,
        { status: toStatus.name, category: toStatus.category },
        { status: toStatus.name },
        "Status change failed",
      );
    },
    [patchTask, setNotice, statusByName, user?.role],
  );

  const handleInlineAssigneeChange = useCallback(
    async (task: BoardTask, value: string) => {
      const assignedEmployeeId = value === "unassigned" ? null : parseInt(value, 10);
      if (value !== "unassigned" && Number.isNaN(assignedEmployeeId)) return;
      if (assignedEmployeeId === task.assigned_employee_id) return;
      const nextAssigneeName =
        assignedEmployeeId == null
          ? null
          : assigneeOptionsByTaskId
              .get(task.id)
              ?.find((option) => option.id === assignedEmployeeId)?.label ?? null;
      await patchTask(
        task,
        { assigned_employee_id: assignedEmployeeId, assignee_name: nextAssigneeName },
        { assigned_employee_id: assignedEmployeeId },
        "Failed to update assignee",
      );
    },
    [assigneeOptionsByTaskId, patchTask],
  );

  const handleInlineDeadlineChange = useCallback(
    async (task: BoardTask, value: string) => {
      const nextDeadline = value || null;
      const currentValue = toDateInputValue(task.end_date);
      if (nextDeadline === currentValue) return;
      await patchTask(
        task,
        { end_date: nextDeadline },
        { end_date: nextDeadline },
        "Failed to update deadline",
      );
    },
    [patchTask],
  );

  const groupBy = useCallback(
    (item: CollectionItem) => {
      const task = tasksById.get(Number(item.id));
      return task?.status ?? orderedStatuses[0]?.name ?? "backlog";
    },
    [tasksById, orderedStatuses],
  );

  const renderKanbanCard = useCallback(
    (item: CollectionItem) => {
      const task = tasksById.get(Number(item.id));
      if (!task) return null;
      return (
        <TaskBoardCard task={task} onTaken={onTaken} interactive="drag" />
      );
    },
    [tasksById, onTaken],
  );

  const listColumns: CollectionColumn[] = useMemo(
    () => [
      {
        id: "key",
        header: "Key",
        className: "w-[110px]",
        sortValue: (item) => tasksById.get(Number(item.id))?.display_key ?? "",
        cell: (item) => {
          const task = tasksById.get(Number(item.id));
          return (
            <span className="font-mono text-xs text-muted-foreground">
              {task?.display_key ?? "—"}
            </span>
          );
        },
      },
      {
        id: "title",
        header: "Title",
        sortValue: (item) => tasksById.get(Number(item.id))?.title ?? "",
        cell: (item) => {
          const task = tasksById.get(Number(item.id));
          return (
            <span className="font-medium text-foreground">
              {task?.title ?? "—"}
            </span>
          );
        },
      },
      {
        id: "status",
        header: "Status",
        className: "w-[220px]",
        sortValue: (item) => tasksById.get(Number(item.id))?.status ?? "",
        cell: (item) => {
          const task = tasksById.get(Number(item.id));
          if (!task) return "—";
          const isUpdating = !!updatingTaskIds[task.id];
          return (
            <div onClick={(e) => e.stopPropagation()}>
              <Select
                value={task.status}
                onValueChange={(value) => void handleInlineStatusChange(task, value)}
                disabled={isUpdating}
              >
                <SelectTrigger className="h-8 w-[200px] capitalize text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {orderedStatuses.map((status) => (
                    <SelectItem
                      key={status.id}
                      value={status.name}
                      className="capitalize"
                    >
                      {status.name.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          );
        },
      },
      {
        id: "project",
        header: "Project",
        sortValue: (item) =>
          tasksById.get(Number(item.id))?.project_name ?? "",
        cell: (item) => tasksById.get(Number(item.id))?.project_name ?? "—",
      },
      {
        id: "assignee",
        header: "Assignee",
        sortValue: (item) =>
          tasksById.get(Number(item.id))?.assignee_name ?? "",
        className: "w-[230px]",
        cell: (item) => {
          const task = tasksById.get(Number(item.id));
          if (!task) return "—";
          const isUpdating = !!updatingTaskIds[task.id];
          const options = assigneeOptionsByTaskId.get(task.id) ?? [];
          return (
            <div onClick={(e) => e.stopPropagation()}>
              <Select
                value={
                  task.assigned_employee_id != null
                    ? String(task.assigned_employee_id)
                    : "unassigned"
                }
                onValueChange={(value) => void handleInlineAssigneeChange(task, value)}
                disabled={isUpdating}
              >
                <SelectTrigger className="h-8 w-[210px] text-xs">
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {options.map((option) => (
                    <SelectItem key={option.id} value={String(option.id)}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          );
        },
      },
      {
        id: "deadline",
        header: "Deadline",
        className: "w-[190px]",
        sortValue: (item) => tasksById.get(Number(item.id))?.end_date ?? "",
        cell: (item) => {
          const task = tasksById.get(Number(item.id));
          if (!task) return "—";
          const isUpdating = !!updatingTaskIds[task.id];
          return (
            <div
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-2"
            >
              <Input
                type="date"
                value={toDateInputValue(task.end_date)}
                onChange={(e) =>
                  void handleInlineDeadlineChange(task, e.target.value)
                }
                disabled={isUpdating}
                className="h-8 w-[150px] text-xs"
                aria-label={`Deadline for ${task.display_key}`}
              />
              {!task.end_date && (
                <span className="text-xs text-muted-foreground">None</span>
              )}
            </div>
          );
        },
      },
      {
        id: "priority",
        header: "Priority",
        className: "w-[100px]",
        sortValue: (item) => tasksById.get(Number(item.id))?.priority ?? "",
        cell: (item) => {
          const priority = tasksById.get(Number(item.id))?.priority;
          return priority ? (
            <span className="capitalize">{priority}</span>
          ) : (
            "—"
          );
        },
      },
      {
        id: "prs",
        header: "PRs",
        className: "w-[90px]",
        sortValue: (item) => tasksById.get(Number(item.id))?.pr_count ?? 0,
        cell: (item) => {
          const task = tasksById.get(Number(item.id));
          if (!task || task.pr_count === 0) {
            return <span className="text-muted-foreground">—</span>;
          }
          const prMeta = task.latest_pr_state
            ? PR_STATE_META[task.latest_pr_state]
            : null;
          return (
            <span
              className={cn(
                "inline-flex items-center gap-1 text-xs font-medium",
                prMeta?.className,
              )}
            >
              {prMeta?.icon}
              {task.pr_count}
            </span>
          );
        },
      },
    ],
    [
      assigneeOptionsByTaskId,
      handleInlineAssigneeChange,
      handleInlineDeadlineChange,
      handleInlineStatusChange,
      orderedStatuses,
      tasksById,
      updatingTaskIds,
    ],
  );

  const handleItemMove = useCallback(
    async (item: CollectionItem, toColumnId: string) => {
      const task = tasksById.get(Number(item.id));
      const toStatus = statusByName.get(toColumnId.toLowerCase());
      if (!task || !toStatus) return;
      const fromCategory = task.category ?? "backlog";
      const check = canMove(user?.role, fromCategory, toStatus.category);
      if (!check.allowed) {
        setNotice(check.reason ?? "Move not allowed");
        return;
      }
      const previous = task;
      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id
            ? { ...t, status: toStatus.name, category: toStatus.category }
            : t,
        ),
      );
      try {
        await tasksApi.update(task.id, { status: toStatus.name });
      } catch (err) {
        setTasks((prev) =>
          prev.map((t) => (t.id === previous.id ? previous : t)),
        );
        setNotice(err instanceof Error ? err.message : "Move failed");
      }
    },
    [tasksById, statusByName, user?.role],
  );

  const handleCreate = async () => {
    if (!newTitle.trim() || !newProject) return;
    setCreating(true);
    try {
      await tasksApi.create({
        project_id: parseInt(newProject),
        title: newTitle.trim(),
        description: newDescription.trim() || undefined,
        assigned_employee_id:
          newAssignee !== "unassigned" ? parseInt(newAssignee) : null,
        priority: newPriority,
      });
      setCreateOpen(false);
      setNewTitle("");
      setNewDescription("");
      setNewAssignee("unassigned");
      setNewPriority("medium");
      void loadTasks();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Failed to create task");
    } finally {
      setCreating(false);
    }
  };

  const emptyMessage = "No tasks found. Create one to get started.";

  const renderTasks = (mode: CollectionViewMode) => {
    if (mode === "list") {
      return (
        <CollectionView
          loading={loading}
          items={items}
          columns={listColumns}
          primaryColumnId="title"
          getRowHref={taskHref}
          onRowClick={(item) => {
            const href = taskHref(item);
            if (href) router.push(href);
          }}
          emptyMessage={emptyMessage}
          loadingMessage="Loading tasks…"
        />
      );
    }

    if (mode === "kanban") {
      return (
        <CollectionKanbanView
          items={items}
          columns={kanbanColumns}
          groupBy={groupBy}
          renderCard={renderKanbanCard}
          getRowHref={taskHref}
          onItemMove={handleItemMove}
          loading={loading}
          emptyMessage={emptyMessage}
          loadingMessage="Loading tasks…"
          className="flex-1"
        />
      );
    }

    if (visibleTasks.length === 0) {
      return (
        <div className="flex h-48 items-center justify-center rounded-md border border-border bg-card text-sm text-muted-foreground">
          {loading ? "Loading tasks…" : emptyMessage}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {visibleTasks.map((task) => (
          <TaskBoardCard
            key={task.id}
            task={task}
            onTaken={onTaken}
            interactive="click"
            onClick={() => router.push(`/tasks/${task.display_key}`)}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search tasks or keys (e.g. ACME-12)…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-56"
        />
        <Select value={projectFilter} onValueChange={setProjectFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Project" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All projects</SelectItem>
            {projects.map((p) => (
              <SelectItem key={p.id} value={String(p.id)}>
                {p.key ? `${p.key} · ` : ""}
                {p.project_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Assignee" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All assignees</SelectItem>
            {employees.map((e) => (
              <SelectItem key={e.id} value={String(e.id)}>
                {e.first_name} {e.last_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <Switch
            id="my-tasks"
            checked={myTasksOnly}
            onCheckedChange={setMyTasksOnly}
          />
          <Label htmlFor="my-tasks" className="text-sm">
            My tasks
          </Label>
        </div>
        <CollectionPageToolbar
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          newAction={{
            label: "New task",
            onClick: () => setCreateOpen(true),
            ariaLabel: "Create new task",
          }}
          className="ml-auto"
        />
      </div>

      {notice && (
        <div className="rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground">
          {notice}
        </div>
      )}

      <div
        className={cn(
          "min-h-0 flex-1",
          viewMode === "kanban" && "flex flex-col",
        )}
      >
        {renderTasks(viewMode)}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New task</DialogTitle>
            <DialogDescription>
              New tasks start in the backlog.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="task-title">Title</Label>
              <Input
                id="task-title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Fix login button"
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Project</Label>
              <Select value={newProject} onValueChange={setNewProject}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.key ? `${p.key} · ` : ""}
                      {p.project_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="task-description">Description</Label>
              <Textarea
                id="task-description"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>Assignee</Label>
                <Select value={newAssignee} onValueChange={setNewAssignee}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {employees.map((e) => (
                      <SelectItem key={e.id} value={String(e.id)}>
                        {e.first_name} {e.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>Priority</Label>
                <Select value={newPriority} onValueChange={setNewPriority}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={creating || !newTitle.trim() || !newProject}
            >
              {creating ? "Creating…" : "Create task"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
