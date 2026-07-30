"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  employeesApi,
  taskStatusesApi,
  tasksApi,
  WORKFLOW_CATEGORY_LABELS,
  WORKFLOW_CATEGORY_ORDER,
  type Employee,
  type TaskDetail,
  type TaskStatus,
  type WorkflowCategory,
} from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { usePageTitle } from "@/contexts/page-title-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Calendar,
  Check,
  Copy,
  GitBranch,
  GitMerge,
  GitPullRequest,
  GitPullRequestClosed,
  Trash2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function formatDuration(seconds: number): string {
  if (seconds < 60) return "<1m";
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  return `${minutes}m`;
}

function formatDate(value: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleString();
}

function toDateInputValue(value?: string | null): string {
  if (!value) return "";
  return value.slice(0, 10);
}

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

const PR_STATE_ICON: Record<string, React.ReactNode> = {
  open: <GitPullRequest className="h-4 w-4 text-emerald-600" />,
  merged: <GitMerge className="h-4 w-4 text-purple-600" />,
  closed: <GitPullRequestClosed className="h-4 w-4 text-red-600" />,
};

const PRIORITY_OPTIONS = ["low", "medium", "high", "urgent"] as const;

function describeActivity(entry: TaskDetail["activity"][number]): string {
  const who = entry.changed_by?.trim() || "System";
  switch (entry.field_name) {
    case "status":
      return entry.change_type === "created"
        ? `${who} created the task in ${entry.new_value ?? "backlog"}`
        : `${who} moved ${entry.old_value ?? "?"} → ${entry.new_value ?? "?"}`;
    case "assigned_employee_id":
      if (!entry.new_value) {
        return `${who} unassigned the task`;
      }
      return `${who} assigned the task to ${
        entry.new_assignee_name?.trim() || `employee #${entry.new_value}`
      }`;
    case "end_date":
      return entry.old_value
        ? `${who} changed deadline from ${entry.old_value.slice(0, 10)} to ${
            entry.new_value ? entry.new_value.slice(0, 10) : "none"
          }`
        : `${who} set deadline to ${
            entry.new_value ? entry.new_value.slice(0, 10) : "none"
          }`;
    case "branch_name":
      return `${who} generated branch ${entry.new_value ?? ""}`;
    case "pull_request":
      return `Pull request ${entry.new_value ?? ""} linked`;
    default:
      return `${who} updated ${entry.field_name}`;
  }
}

export default function TaskDetailPage() {
  const params = useParams<{ key: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { setTitle } = usePageTitle();

  const [task, setTask] = useState<TaskDetail | null>(null);
  const [statuses, setStatuses] = useState<TaskStatus[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const [editingDescription, setEditingDescription] = useState(false);
  const [descriptionDraft, setDescriptionDraft] = useState("");
  const titleInputRef = useRef<HTMLInputElement>(null);
  const descriptionInputRef = useRef<HTMLTextAreaElement>(null);
  const skipTitleBlurSave = useRef(false);
  const skipDescriptionBlurSave = useRef(false);
  const taskRef = useRef<TaskDetail | null>(null);
  taskRef.current = task;

  const taskKey = decodeURIComponent(params.key ?? "");

  const load = useCallback(async () => {
    try {
      const [detail, statusesRes, employeesRes] = await Promise.all([
        tasksApi.getByKey(taskKey),
        taskStatusesApi.getAll(),
        employeesApi.getAll({ employment_status: "active", limit: 500 }),
      ]);
      setTask(detail);
      setStatuses(statusesRes.data);
      setEmployees(employeesRes.data);
      setError(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load task";
      if (taskRef.current) {
        setNotice(message);
      } else {
        setError(message);
      }
    }
  }, [taskKey]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setTitle(task ? `${task.display_key} · ${task.title}` : "Task");
    return () => setTitle(null);
  }, [setTitle, task]);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(t);
  }, [notice]);

  useEffect(() => {
    if (editingTitle) titleInputRef.current?.focus();
  }, [editingTitle]);

  useEffect(() => {
    if (editingDescription) descriptionInputRef.current?.focus();
  }, [editingDescription]);

  const orderedStatuses = useMemo(
    () =>
      [...statuses].sort(
        (a, b) =>
          WORKFLOW_CATEGORY_ORDER[a.category] -
            WORKFLOW_CATEGORY_ORDER[b.category] ||
          a.sort_order - b.sort_order,
      ),
    [statuses],
  );

  const handleTake = async () => {
    if (!task) return;
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
      setNotice(parts.join(" · "));
      void load();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Failed to copy branch");
    }
  };

  const handleStatusChange = async (statusName: string) => {
    if (!task) return;
    const toStatus = statuses.find((s) => s.name === statusName);
    if (!toStatus) return;
    const fromCategory = task.category ?? "backlog";
    const check = canMove(user?.role, fromCategory, toStatus.category);
    if (!check.allowed) {
      setNotice(check.reason ?? "Status change not allowed");
      return;
    }
    const previous = task;
    setTask((prev) =>
      prev
        ? {
            ...prev,
            status: toStatus.name,
            category: toStatus.category,
          }
        : prev,
    );
    try {
      await tasksApi.update(task.id, { status: statusName });
      void load();
    } catch (err) {
      setTask(previous);
      setNotice(err instanceof Error ? err.message : "Status change failed");
    }
  };

  const handleDeadlineChange = async (value: string) => {
    if (!task) return;
    const nextDeadline = value || null;
    const currentInputValue = toDateInputValue(task.end_date);
    if (nextDeadline === currentInputValue) return;

    const previousDeadline = task.end_date;
    setTask((prev) => (prev ? { ...prev, end_date: nextDeadline } : prev));
    try {
      await tasksApi.update(task.id, { end_date: nextDeadline });
      void load();
    } catch (err) {
      setTask((prev) =>
        prev ? { ...prev, end_date: previousDeadline } : prev,
      );
      setNotice(
        err instanceof Error ? err.message : "Failed to update deadline",
      );
    }
  };

  const startEditTitle = () => {
    if (!task) return;
    setTitleDraft(task.title);
    skipTitleBlurSave.current = false;
    setEditingTitle(true);
  };

  const cancelEditTitle = () => {
    skipTitleBlurSave.current = true;
    setEditingTitle(false);
    setTitleDraft(task?.title ?? "");
  };

  const saveTitle = async () => {
    if (!task) return;
    const next = titleDraft.trim();
    if (!next) {
      setNotice("Title cannot be empty");
      setTitleDraft(task.title);
      setEditingTitle(false);
      return;
    }
    if (next === task.title) {
      setEditingTitle(false);
      return;
    }
    setEditingTitle(false);
    try {
      await tasksApi.update(task.id, { title: next });
      setTask((prev) => (prev ? { ...prev, title: next } : prev));
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Failed to update title");
      void load();
    }
  };

  const startEditDescription = () => {
    if (!task) return;
    setDescriptionDraft(task.description ?? "");
    skipDescriptionBlurSave.current = false;
    setEditingDescription(true);
  };

  const cancelEditDescription = () => {
    skipDescriptionBlurSave.current = true;
    setEditingDescription(false);
    setDescriptionDraft(task?.description ?? "");
  };

  const saveDescription = async () => {
    if (!task) return;
    const next = descriptionDraft.trim() || null;
    const current = task.description?.trim() || null;
    if (next === current) {
      setEditingDescription(false);
      return;
    }
    setEditingDescription(false);
    try {
      await tasksApi.update(task.id, { description: next });
      setTask((prev) => (prev ? { ...prev, description: next } : prev));
    } catch (err) {
      setNotice(
        err instanceof Error ? err.message : "Failed to update description",
      );
      void load();
    }
  };

  const handleAssigneeChange = async (value: string) => {
    if (!task) return;
    const assigned_employee_id =
      value === "unassigned" ? null : parseInt(value, 10);
    if (value !== "unassigned" && Number.isNaN(assigned_employee_id)) return;
    if (assigned_employee_id === task.assigned_employee_id) return;
    try {
      await tasksApi.update(task.id, { assigned_employee_id });
      void load();
    } catch (err) {
      setNotice(
        err instanceof Error ? err.message : "Failed to update assignee",
      );
    }
  };

  const handlePriorityChange = async (priority: string) => {
    if (!task || priority === task.priority) return;
    try {
      await tasksApi.update(task.id, { priority });
      setTask((prev) => (prev ? { ...prev, priority } : prev));
    } catch (err) {
      setNotice(
        err instanceof Error ? err.message : "Failed to update priority",
      );
    }
  };

  const handleDelete = async () => {
    if (!task) return;
    setDeleting(true);
    try {
      await tasksApi.delete(task.id);
      router.push("/tasks");
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Failed to delete task");
      setDeleteOpen(false);
    } finally {
      setDeleting(false);
    }
  };

  const assigneeOptions = useMemo(() => {
    const options = employees.map((e) => ({
      id: e.id,
      label: `${e.first_name} ${e.last_name}`.trim(),
    }));
    if (
      task?.assigned_employee_id != null &&
      !employees.some((e) => e.id === task.assigned_employee_id)
    ) {
      options.unshift({
        id: task.assigned_employee_id,
        label: task.assignee_name?.trim() || `Employee #${task.assigned_employee_id}`,
      });
    }
    return options;
  }, [employees, task?.assigned_employee_id, task?.assignee_name]);

  if (error) {
    return (
      <div className="flex flex-col items-start gap-3 p-6">
        <p className="text-sm text-destructive">{error}</p>
        <Button variant="outline" onClick={() => router.push("/tasks")}>
          <ArrowLeft className="mr-1 h-4 w-4" /> Back to board
        </Button>
      </div>
    );
  }
  if (!task) {
    return <div className="p-6 text-sm text-muted-foreground">Loading…</div>;
  }

  const totalSeconds = task.time_in_status.reduce(
    (sum, t) => sum + t.seconds,
    0,
  );

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4 p-4">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm">
          <Link href="/tasks">
            <ArrowLeft className="mr-1 h-4 w-4" /> Tasks
          </Link>
        </Button>
        <span className="text-sm font-medium text-muted-foreground">
          {task.display_key}
        </span>
        <Badge variant="outline">{task.project_name}</Badge>
      </div>

      {notice && (
        <div className="rounded-md border border-border bg-muted px-3 py-2 text-sm">
          {notice}
        </div>
      )}

      <div className="flex flex-wrap items-start justify-between gap-3">
        {editingTitle ? (
          <Input
            ref={titleInputRef}
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={() => {
              if (skipTitleBlurSave.current) {
                skipTitleBlurSave.current = false;
                return;
              }
              void saveTitle();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void saveTitle();
              } else if (e.key === "Escape") {
                e.preventDefault();
                cancelEditTitle();
              }
            }}
            className="max-w-xl text-xl font-semibold h-auto py-1"
            aria-label="Task title"
          />
        ) : (
          <h1
            className="text-xl font-semibold cursor-text rounded-sm px-1 -mx-1 hover:bg-muted/60"
            onClick={startEditTitle}
            title="Click to edit title"
          >
            {task.title}
          </h1>
        )}
        <div className="flex items-center gap-2">
          <Select value={task.status} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-40 capitalize">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {orderedStatuses.map((s) => (
                <SelectItem key={s.id} value={s.name} className="capitalize">
                  {s.name.replace(/_/g, " ")}
                  <span className="ml-2 text-xs text-muted-foreground">
                    {WORKFLOW_CATEGORY_LABELS[s.category]}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleTake}>
            {copied ? (
              <Check className="mr-1 h-4 w-4" />
            ) : (
              <GitBranch className="mr-1 h-4 w-4" />
            )}
            {task.branch_name ? "Copy branch" : "Take task"}
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="text-destructive hover:text-destructive"
            onClick={() => setDeleteOpen(true)}
            title="Delete task"
            aria-label="Delete task"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <span>Assignee:</span>
          <Select
            value={
              task.assigned_employee_id != null
                ? String(task.assigned_employee_id)
                : "unassigned"
            }
            onValueChange={handleAssigneeChange}
          >
            <SelectTrigger className="w-44 h-8">
              <SelectValue placeholder="Unassigned" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {assigneeOptions.map((e) => (
                <SelectItem key={e.id} value={String(e.id)}>
                  {e.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <span>Deadline:</span>
          <Input
            type="date"
            className="h-8 w-36 text-xs"
            value={toDateInputValue(task.end_date)}
            onChange={(e) => void handleDeadlineChange(e.target.value)}
            aria-label="Task deadline"
          />
        </div>
        <div className="flex items-center gap-2">
          <span>Priority:</span>
          <Select
            value={task.priority ?? "medium"}
            onValueChange={handlePriorityChange}
          >
            <SelectTrigger className="w-32 h-8 capitalize">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRIORITY_OPTIONS.map((p) => (
                <SelectItem key={p} value={p} className="capitalize">
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {task.branch_name && (
          <button
            type="button"
            className="inline-flex items-center gap-1 font-mono text-xs hover:text-foreground"
            onClick={handleTake}
            title="Copy branch name"
          >
            <GitBranch className="h-3 w-3" />
            {task.branch_name}
            <Copy className="h-3 w-3" />
          </button>
        )}
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Description</CardTitle>
        </CardHeader>
        <CardContent>
          {editingDescription ? (
            <Textarea
              ref={descriptionInputRef}
              value={descriptionDraft}
              onChange={(e) => setDescriptionDraft(e.target.value)}
              onBlur={() => {
                if (skipDescriptionBlurSave.current) {
                  skipDescriptionBlurSave.current = false;
                  return;
                }
                void saveDescription();
              }}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  e.preventDefault();
                  cancelEditDescription();
                }
              }}
              rows={5}
              className="text-sm"
              aria-label="Task description"
            />
          ) : (
            <button
              type="button"
              onClick={startEditDescription}
              className="w-full text-left whitespace-pre-wrap text-sm rounded-sm px-1 -mx-1 py-1 hover:bg-muted/60 min-h-[2.5rem]"
              title="Click to edit description"
            >
              {task.description?.trim() ? (
                task.description
              ) : (
                <span className="text-muted-foreground">Add description…</span>
              )}
            </button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Time in status</CardTitle>
        </CardHeader>
        <CardContent>
          {task.time_in_status.length === 0 ? (
            <p className="text-sm text-muted-foreground">No history yet.</p>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
                {task.time_in_status.map((t) => (
                  <div
                    key={t.status}
                    className={
                      {
                        backlog: "bg-slate-400",
                        in_progress: "bg-blue-500",
                        review: "bg-amber-500",
                        done: "bg-emerald-500",
                      }[t.category]
                    }
                    style={{
                      width: `${
                        totalSeconds > 0
                          ? Math.max((t.seconds / totalSeconds) * 100, 2)
                          : 0
                      }%`,
                    }}
                    title={`${t.status}: ${formatDuration(t.seconds)}`}
                  />
                ))}
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                {task.time_in_status.map((t) => (
                  <span key={t.status} className="text-muted-foreground">
                    <span className="capitalize">
                      {t.status.replace(/_/g, " ")}
                    </span>
                    : <span className="font-medium text-foreground">
                      {formatDuration(t.seconds)}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">
            Pull requests ({task.pull_requests.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {task.pull_requests.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No pull requests linked. Open a PR from branch{" "}
              <span className="font-mono text-xs">
                {task.branch_name ?? "(take the task to generate one)"}
              </span>{" "}
              and it will appear here.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {task.pull_requests.map((pr) => (
                <li key={pr.id} className="flex items-center gap-2 text-sm">
                  {PR_STATE_ICON[pr.state]}
                  <a
                    href={pr.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="truncate font-medium hover:underline"
                  >
                    {pr.title ?? `#${pr.pr_number}`}
                  </a>
                  <span className="text-xs text-muted-foreground">
                    {pr.repo_owner}/{pr.repo_name}#{pr.pr_number}
                  </span>
                  <Badge variant="secondary" className="ml-auto capitalize">
                    {pr.state}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {task.activity.length === 0 ? (
            <p className="text-sm text-muted-foreground">No activity yet.</p>
          ) : (
            <ul className="flex flex-col">
              {task.activity.map((entry, idx) => (
                <li key={entry.id}>
                  {idx > 0 && <Separator className="my-2" />}
                  <div className="flex items-baseline justify-between gap-2 text-sm">
                    <span>{describeActivity(entry)}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatDate(entry.created_at)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete task</DialogTitle>
            <DialogDescription>
              Delete {task.display_key} “{task.title}”? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => void handleDelete()}
              disabled={deleting}
            >
              {deleting ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
