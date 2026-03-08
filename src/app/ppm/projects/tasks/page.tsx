"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePageTitle } from "@/contexts/page-title-context";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CheckSquare,
  ArrowLeft,
  Loader2,
  Plus,
  RefreshCw,
  Menu,
  LayoutGrid,
  Columns3,
  Repeat,
} from "lucide-react";
import { projectsApi, type Task, type Project } from "@/lib/api";
import { TaskFormSheet } from "@/components/task-form-sheet";

type TaskWithProject = Task & { project_name: string };

type ViewMode = "list" | "card" | "kanban";

const statusColors: Record<string, string> = {
  pending: "bg-gray-100 text-gray-800",
  todo: "bg-gray-100 text-gray-800",
  in_progress: "bg-blue-100 text-blue-800",
  review: "bg-purple-100 text-purple-800",
  done: "bg-green-100 text-green-800",
  completed: "bg-green-100 text-green-800",
  blocked: "bg-red-100 text-red-800",
};

function getStatusColor(status?: string): string {
  if (!status) return "bg-gray-100 text-gray-800";
  const key = status.toLowerCase().replace(/\s/g, "_");
  return statusColors[key] ?? "bg-gray-100 text-gray-800";
}

const formatDate = (dateString?: string) => {
  if (!dateString) return "—";
  try {
    return new Date(dateString).toLocaleDateString();
  } catch {
    return "—";
  }
};

function loadData(
  setTasks: (t: TaskWithProject[]) => void,
  setProjects: (p: Project[]) => void,
  setLoading: (l: boolean) => void,
  setError: (e: string | null) => void,
) {
  setLoading(true);
  setError(null);
  projectsApi
    .getAll({ limit: 500 })
    .then((res) => {
      const data = res.data || [];
      setProjects(data);
      const flat: TaskWithProject[] = [];
      data.forEach((p: Project) => {
        (p.tasks || []).forEach((t: Task) => {
          flat.push({
            ...t,
            project_name: p.project_name || `Project #${p.id}`,
          });
        });
      });
      flat.sort((a, b) => {
        const pc = a.project_name.localeCompare(b.project_name);
        if (pc !== 0) return pc;
        return (a.title || "").localeCompare(b.title || "");
      });
      setTasks(flat);
    })
    .catch(() => setError("Failed to load tasks"))
    .finally(() => setLoading(false));
}

const TaskCard = ({
  task,
  onOpen,
}: {
  task: TaskWithProject;
  onOpen: () => void;
}) => (
  <Card
    className="hover:shadow-md transition-shadow cursor-pointer"
    onClick={onOpen}
  >
    <CardHeader className="pb-2">
      <div className="flex items-start justify-between gap-2">
        <CardTitle className="text-base">{task.title || "Untitled"}</CardTitle>
        <div className="flex items-center gap-1 shrink-0">
          {task.is_recurring && (
            <Badge variant="secondary" className="text-xs">
              <Repeat className="h-3 w-3 mr-0.5" />
              Recurring
            </Badge>
          )}
          <Badge className={getStatusColor(task.status)}>{task.status || "—"}</Badge>
        </div>
      </div>
    </CardHeader>
    <CardContent className="text-sm">
      <div className="space-y-1">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Project</span>
          <Link
            href={`/projects/${task.project_id}`}
            className="text-primary hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {task.project_name}
          </Link>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Deadline</span>
          <span>{formatDate(task.end_date)}</span>
        </div>
        {task.priority && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Priority</span>
            <span>{task.priority}</span>
          </div>
        )}
      </div>
      {task.description && (
        <p className="text-muted-foreground text-xs mt-2 line-clamp-2">
          {task.description}
        </p>
      )}
    </CardContent>
  </Card>
);

const TaskKanbanCard = ({
  task,
  onOpen,
}: {
  task: TaskWithProject;
  onOpen: () => void;
}) => (
  <Card
    className="hover:shadow transition-shadow cursor-pointer mb-3"
    onClick={onOpen}
  >
    <CardContent className="p-3">
      <div className="flex items-start justify-between gap-1 mb-1">
        <h4 className="font-medium text-sm flex-1 line-clamp-2">{task.title || "Untitled"}</h4>
        {task.is_recurring && (
          <Repeat className="h-3.5 w-3 text-muted-foreground shrink-0" />
        )}
      </div>
      <Badge className={getStatusColor(task.status)}>{task.status || "—"}</Badge>
      <p className="text-xs text-muted-foreground mt-1">{task.project_name}</p>
    </CardContent>
  </Card>
);

export default function ProjectsTasksPage() {
  const router = useRouter();
  const { setTitle } = usePageTitle();
  const [tasks, setTasks] = useState<TaskWithProject[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [taskSheetOpen, setTaskSheetOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("tasks_page_view_mode");
      if (saved === "list" || saved === "card" || saved === "kanban") {
        return saved as ViewMode;
      }
    }
    return "card";
  });

  useEffect(() => {
    setTitle("Tasks");
    return () => setTitle(null);
  }, [setTitle]);

  useEffect(() => {
    loadData(setTasks, setProjects, setLoading, setError);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("tasks_page_view_mode", viewMode);
    }
  }, [viewMode]);

  const refreshTasks = () => {
    loadData(setTasks, setProjects, setLoading, setError);
  };

  const openTask = (task: TaskWithProject) => {
    router.push(`/projects/${task.project_id}/tasks/${task.id}`);
  };

  const getTasksByStatus = () => {
    const grouped: Record<string, TaskWithProject[]> = {
      pending: [],
      in_progress: [],
      done: [],
      other: [],
    };
    const statusMap: Record<string, string> = {
      backlog: "pending",
      todo: "pending",
      in_progress: "in_progress",
      review: "in_progress",
      completed: "done",
      done: "done",
    };
    tasks.forEach((task) => {
      const key = statusMap[task.status?.toLowerCase()] || task.status?.toLowerCase() || "other";
      if (grouped[key]) grouped[key].push(task);
      else grouped.other.push(task);
    });
    return grouped;
  };

  const renderContent = () => {
    if (viewMode === "list") {
      return (
        <div className="rounded-md border bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px]">Task</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Deadline</TableHead>
                <TableHead className="w-[80px]">Recurring</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No tasks yet.
                  </TableCell>
                </TableRow>
              ) : (
                tasks.map((task) => (
                  <TableRow
                    key={`${task.project_id}-${task.id}`}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => openTask(task)}
                  >
                    <TableCell className="font-medium">
                      {task.title || "Untitled"}
                      {task.description && (
                        <p className="text-xs text-muted-foreground truncate max-w-xs mt-0.5">
                          {task.description}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/projects/${task.project_id}`}
                        className="text-primary hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {task.project_name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(task.status)}>
                        {task.status || "—"}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(task.end_date)}</TableCell>
                    <TableCell>
                      {task.is_recurring ? (
                        <Badge variant="secondary">Recurring</Badge>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      );
    }

    if (viewMode === "kanban") {
      const grouped = getTasksByStatus();
      const columns = [
        { key: "pending", label: "Pending", color: "bg-yellow-50" },
        { key: "in_progress", label: "In Progress", color: "bg-blue-50" },
        { key: "done", label: "Done", color: "bg-green-50" },
        { key: "other", label: "Other", color: "bg-gray-50" },
      ];
      return (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.map((col) => (
            <div
              key={col.key}
              className={`flex-shrink-0 w-72 ${col.color} rounded-lg p-3`}
            >
              <h3 className="font-semibold mb-3 text-sm uppercase">
                {col.label} ({grouped[col.key]?.length ?? 0})
              </h3>
              <div>
                {(grouped[col.key] ?? []).map((task) => (
                  <TaskKanbanCard
                    key={`${task.project_id}-${task.id}`}
                    task={task}
                    onOpen={() => openTask(task)}
                  />
                ))}
                {(!grouped[col.key] || grouped[col.key].length === 0) && (
                  <div className="text-sm text-muted-foreground text-center py-4">
                    No items
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tasks.map((task) => (
          <TaskCard
            key={`${task.project_id}-${task.id}`}
            task={task}
            onOpen={() => openTask(task)}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Link href="/projects">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Projects
          </Button>
        </Link>

        <div className="flex justify-between items-center mb-6">
          <div>
            <p className="text-muted-foreground">
              {tasks.length} task{tasks.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ButtonGroup orientation="horizontal">
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("list")}
                aria-label="List view"
              >
                <Menu className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "card" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("card")}
                aria-label="Card view"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "kanban" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("kanban")}
                aria-label="Kanban view"
              >
                <Columns3 className="h-4 w-4" />
              </Button>
            </ButtonGroup>
            <Button onClick={refreshTasks} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTaskSheetOpen(true)}
            >
              <Plus className="h-4 w-4 mr-1" /> New task
            </Button>
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive mb-4">
            {error}
          </div>
        )}

        {loading && (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {!loading && !error && tasks.length === 0 && (
          <div className="text-center py-16">
            <CheckSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No tasks yet</h3>
            <p className="text-muted-foreground mb-4">
              Create a task from a project or add one below.
            </p>
            <Button onClick={() => setTaskSheetOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> New task
            </Button>
          </div>
        )}

        {!loading && !error && tasks.length > 0 && (
          <>
            {renderContent()}
            <Button asChild variant="outline" className="mt-6">
              <Link href="/projects">View Projects</Link>
            </Button>
          </>
        )}

        <TaskFormSheet
          open={taskSheetOpen}
          onOpenChange={setTaskSheetOpen}
          onSuccess={refreshTasks}
          projects={projects}
        />
      </div>
    </div>
  );
}
