"use client";

import { PageShell } from "@/components/page-shell";
import React, { useEffect, useMemo, useState } from "react";
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
import {
  projectsApi,
  employeesApi,
  type Task,
  type Project,
  type Employee,
} from "@/lib/api";
import { TaskFormSheet } from "@/components/task-form-sheet";
import { CollectionFilterControls } from "@/components/collection-filters";
import { useCollectionPageFilters } from "@/hooks/use-collection-page-filters";
import {
  getCollectionFilterDefinitions,
  withFilterOptions,
} from "@/lib/collection-filter-definitions";
import {
  filterTasksClientSide,
  UNASSIGNED_ASSIGNEE_VALUE,
} from "@/lib/filter-tasks-client-side";

type TaskWithProject = Task & { project_name: string };

type ViewMode = "list" | "card" | "kanban";

const statusColors: Record<string, string> = {
  pending: "bg-muted text-muted-foreground",
  todo: "bg-muted text-muted-foreground",
  in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  review: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300",
  done: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  completed: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  blocked: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
};

function getStatusColor(status?: string): string {
  if (!status) return "bg-muted text-muted-foreground";
  const key = status.toLowerCase().replace(/\s/g, "_");
  return statusColors[key] ?? "bg-muted text-muted-foreground";
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
    className="mb-3 cursor-pointer border border-border bg-card shadow-none transition-shadow hover:shadow-md"
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
  const [employees, setEmployees] = useState<Employee[]>([]);
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

  const filterDefinitions = useMemo(
    () =>
      withFilterOptions(getCollectionFilterDefinitions("tasks"), {
        project_id: projects.map((project) => ({
          value: String(project.id),
          label: project.project_name || `Project #${project.id}`,
        })),
        assigned_employee_id: [
          { value: UNASSIGNED_ASSIGNEE_VALUE, label: "Unassigned" },
          ...employees.map((employee) => ({
            value: String(employee.id),
            label:
              [employee.first_name, employee.last_name]
                .filter(Boolean)
                .join(" ") || `Employee #${employee.id}`,
          })),
        ],
      }),
    [projects, employees],
  );

  const {
    search,
    setSearch,
    facets,
    setFacetValues,
    dates,
    setDateRange,
    filterState,
    clearFilters,
    isFiltering,
    getOptions,
    loadOptions,
    definitions,
  } = useCollectionPageFilters("tasks", filterDefinitions);

  const filteredTasks = useMemo(
    () => filterTasksClientSide(tasks, definitions, filterState),
    [tasks, definitions, filterState],
  );

  useEffect(() => {
    setTitle("Tasks");
    return () => setTitle(null);
  }, [setTitle]);

  useEffect(() => {
    loadData(setTasks, setProjects, setLoading, setError);
  }, []);

  useEffect(() => {
    employeesApi
      .getAll({ employment_status: "active", limit: 500 })
      .then((res) => setEmployees(res.data ?? []))
      .catch(() => setEmployees([]));
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

  const getTasksByStatus = (visibleTasks: TaskWithProject[]) => {
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
    visibleTasks.forEach((task) => {
      const key = statusMap[task.status?.toLowerCase()] || task.status?.toLowerCase() || "other";
      if (grouped[key]) grouped[key].push(task);
      else grouped.other.push(task);
    });
    return grouped;
  };

  const renderContent = (visibleTasks: TaskWithProject[]) => {
    if (viewMode === "list") {
      return (
        <div className="rounded-md border border-border bg-card">
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
              {visibleTasks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    {isFiltering ? "No tasks match your filters." : "No tasks yet."}
                  </TableCell>
                </TableRow>
              ) : (
                visibleTasks.map((task) => (
                  <TableRow
                    key={`${task.project_id}-${task.id}`}
                    className="cursor-pointer hover:bg-muted/50"
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
      const grouped = getTasksByStatus(visibleTasks);
      const columns = [
        { key: "pending", label: "Pending", color: "bg-yellow-500/10 dark:bg-yellow-500/20" },
        { key: "in_progress", label: "In Progress", color: "bg-blue-500/10 dark:bg-blue-500/20" },
        { key: "done", label: "Done", color: "bg-green-500/10 dark:bg-green-500/20" },
        { key: "other", label: "Other", color: "bg-muted/50" },
      ];
      return (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.map((col) => (
            <div
              key={col.key}
              className={`w-72 shrink-0 rounded-lg border border-border p-3 ${col.color}`}
            >
              <h3 className="mb-3 text-sm font-semibold uppercase text-foreground">
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

    if (visibleTasks.length === 0) {
      return (
        <div className="text-center py-16 rounded-md border border-border bg-card">
          <CheckSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">
            {isFiltering ? "No matching tasks" : "No tasks yet"}
          </h3>
          <p className="text-muted-foreground mb-4">
            {isFiltering
              ? "Try adjusting your filters or search."
              : "Create a task from a project or add one below."}
          </p>
          {isFiltering ? (
            <Button variant="outline" onClick={clearFilters}>
              Clear filters
            </Button>
          ) : (
            <Button onClick={() => setTaskSheetOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> New task
            </Button>
          )}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleTasks.map((task) => (
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
    <PageShell fill className="bg-background text-foreground">
        <Link href="/projects">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Projects
          </Button>
        </Link>

        <div className="flex justify-between items-center mb-4">
          <div>
            <p className="text-muted-foreground">
              {isFiltering
                ? `${filteredTasks.length} of ${tasks.length} task${tasks.length !== 1 ? "s" : ""}`
                : `${tasks.length} task${tasks.length !== 1 ? "s" : ""}`}
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

        {!loading && !error && tasks.length > 0 && (
          <CollectionFilterControls
            className="mb-6"
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search tasks…"
            isFiltering={isFiltering}
            onClearAll={clearFilters}
            definitions={definitions}
            facets={facets}
            onFacetChange={setFacetValues}
            dates={dates}
            onDateRangeChange={setDateRange}
            getOptions={getOptions}
            loadOptions={loadOptions}
          />
        )}

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
            {renderContent(filteredTasks)}
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
      </PageShell>
  );
}
