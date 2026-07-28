"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  projectsApi,
  projectStatusesApi,
  type Project,
  type ProjectStatus,
} from "@/lib/api";
import { usePageTitle } from "@/contexts/page-title-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ProjectFormSheet } from "@/components/project-form-sheet";
import { ProjectTaskCompletion } from "@/components/project-task-completion";
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  useDroppable,
  PointerSensor,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  TouchSensor,
  closestCorners,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { PageShell } from "@/components/page-shell";
import { cn } from "@/lib/utils";

import {
  RefreshCw,
  Plus,
  Menu,
  LayoutGrid,
  Columns3,
  Edit,
  Trash2,
} from "lucide-react";

const formatDate = (dateString?: string) => {
  if (!dateString) return "Not set";
  try {
    return new Date(dateString).toLocaleDateString();
  } catch {
    return "Invalid date";
  }
};

const formatProjectManager = (project: Project) => {
  const staffName = [project.manager_first_name, project.manager_last_name]
    .filter(Boolean)
    .join(" ");
  if (staffName) return staffName;

  const employeeName = [
    project.manager_employee_first_name,
    project.manager_employee_last_name,
  ]
    .filter(Boolean)
    .join(" ");
  if (employeeName) return employeeName;

  return "Unassigned";
};

const getStatusColor = (status?: string) => {
  const colors = {
    active: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
    completed: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
    pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300",
    inactive: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  };
  return (
    colors[status?.toLowerCase() as keyof typeof colors] ||
    "bg-muted text-muted-foreground"
  );
};

type ViewMode = "list" | "card" | "kanban";

const ProjectCard = ({ project }: { project: Project }) => (
  <Link
    href={`/projects/${project.id.toString()}`}
    className={`group block no-underline`}
  >
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <CardTitle className="text-lg">{project.project_name}</CardTitle>
        <Badge className={getStatusColor(project.status)}>
          {project.status || "No status"}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 text-sm">
          <ProjectTaskCompletion tasks={project.tasks} variant="compact" />
          <div className="space-y-2">
          <div className="flex justify-between">
            <span>Tasks:</span>
            <span>{project.tasks?.length || 0}</span>
          </div>
          <div className="flex justify-between">
            <span>Manager:</span>
            <span>{formatProjectManager(project)}</span>
          </div>
          <div className="flex justify-between">
            <span>Created:</span>
            <span>{formatDate(project.created_at)}</span>
          </div>
          <div className="flex justify-between">
            <span>Target:</span>
            <span>{formatDate(project.target_date)}</span>
          </div>
        </div>
        </div>
      </CardContent>
    </Card>
  </Link>
);

/** When /api/project-statuses is empty */
const FALLBACK_PROJECT_STATUS_COLUMNS: { key: string; label: string }[] = [
  { key: "draft", label: "Draft" },
  { key: "active", label: "Active" },
  { key: "completed", label: "Completed" },
  { key: "archived", label: "Archived" },
];

const ProjectKanbanCard = ({
  project,
  onEdit,
  onDelete,
  onCardClick,
}: {
  project: Project;
  onEdit?: () => void;
  onDelete?: () => void;
  onCardClick?: () => void;
}) => (
  <Card
    className="cursor-grab border border-border bg-card shadow-none active:cursor-grabbing"
    onClick={onCardClick}
  >
    <CardContent className="p-3">
      <div className="flex justify-between items-start mb-2">
        <div className="min-w-0 flex-1">
          <h4 className="font-semibold text-sm line-clamp-2">
            {project.project_name || "Project"}
          </h4>
        </div>
        <div className="flex gap-1 ml-2 shrink-0">
          {onEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onEdit();
              }}
              className="h-6 w-6 p-0"
            >
              <Edit className="h-3 w-3" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelete();
              }}
              className="h-6 w-6 p-0 text-red-600"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
      <div className="flex justify-between items-center mb-2">
        <Badge className={getStatusColor(project.status)}>
          {project.status || "No status"}
        </Badge>
      </div>
      <div className="text-xs text-muted-foreground space-y-1">
        <ProjectTaskCompletion tasks={project.tasks} variant="compact" />
        <div>Target: {formatDate(project.target_date)}</div>
      </div>
    </CardContent>
  </Card>
);

const SortableProjectCard = ({
  project,
  onEdit,
  onDelete,
  onCardClick,
}: {
  project: Project;
  onEdit: () => void;
  onDelete: (project: Project) => void;
  onCardClick: (project: Project) => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: project.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="touch-none"
      {...attributes}
      {...listeners}
    >
      <ProjectKanbanCard
        project={project}
        onEdit={onEdit}
        onDelete={() => onDelete(project)}
        onCardClick={() => {
          if (!isDragging) onCardClick(project);
        }}
      />
    </div>
  );
};

type ProjectBoardState = Record<string, Project[]>;

function buildProjectBoard(
  projects: Project[],
  columnKeys: string[],
): ProjectBoardState {
  const grouped: ProjectBoardState = { other: [] };
  for (const key of columnKeys) grouped[key] = [];

  for (const project of projects) {
    const status = project.status?.toLowerCase() || "other";
    if (grouped[status] !== undefined) {
      grouped[status].push(project);
    } else {
      grouped.other.push(project);
    }
  }

  const dealTime = (p: Project) =>
    new Date(p.updated_at ?? p.created_at).getTime();
  for (const key of Object.keys(grouped)) {
    grouped[key].sort((a, b) => dealTime(b) - dealTime(a));
  }

  return grouped;
}

function findProjectColumn(
  id: UniqueIdentifier,
  board: ProjectBoardState,
  columnIds: string[],
): string | undefined {
  const sid = String(id);
  if (columnIds.includes(sid)) return sid;
  for (const [columnId, columnProjects] of Object.entries(board)) {
    if (columnProjects.some((p) => String(p.id) === sid)) return columnId;
  }
  return undefined;
}

const KanbanColumn = ({
  id,
  label,
  projects,
  statusSubtext,
  onEdit,
  onDelete,
  onCardClick,
}: {
  id: string;
  label: string;
  projects: Project[];
  statusSubtext: string;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
  onCardClick: (project: Project) => void;
}) => {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex h-full w-72 shrink-0 flex-col overflow-y-auto rounded-none border border-border bg-card md:w-80 xl:min-w-[18rem] xl:flex-1 xl:max-w-sm",
        isOver && "border-primary/50 bg-primary/5",
      )}
    >
      <div className="shrink-0 border-b border-border px-3 py-2">
        <h3 className="text-sm font-medium text-foreground">{label}</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">{statusSubtext}</p>
      </div>
      <div className="flex-1 p-2 min-h-0 overflow-y-auto">
        <SortableContext
          id={id}
          items={projects.map((p) => p.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2 min-h-[80px]">
            {projects.map((project) => (
              <SortableProjectCard
                key={project.id}
                project={project}
                onEdit={() => onEdit(project)}
                onDelete={onDelete}
                onCardClick={onCardClick}
              />
            ))}
            {projects.length === 0 && (
              <div className="border border-dashed border-border py-6 text-center text-sm italic text-muted-foreground">
                Drop here
              </div>
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  );
};

const Projects = () => {
  const router = useRouter();
  const { setTitle } = usePageTitle();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProjects, setSelectedProjects] = useState<number[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("projects_view_mode");
      if (saved === "list" || saved === "card" || saved === "kanban") {
        return saved as ViewMode;
      }
    }
    return "card";
  });

  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [createSheetOpen, setCreateSheetOpen] = useState(false);
  const [activeDragProject, setActiveDragProject] = useState<Project | null>(null);
  const [projectStatuses, setProjectStatuses] = useState<ProjectStatus[]>([]);

  const statusesSorted = useMemo(() => {
    return [...projectStatuses].sort((a, b) => {
      if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
      return a.id - b.id;
    });
  }, [projectStatuses]);

  const toggleProjectSelection = (projectId: number) => {
    setSelectedProjects((prev) =>
      prev.includes(projectId)
        ? prev.filter((id) => id !== projectId)
        : [...prev, projectId],
    );
  };

  const toggleAll = () => {
    if (selectedProjects.length === projects.length) {
      setSelectedProjects([]);
    } else {
      setSelectedProjects(projects.map((p) => p.id));
    }
  };

  const handleBulkDelete = async () => {
    setIsDeleting(true);
    try {
      await Promise.all(selectedProjects.map((id) => projectsApi.delete(id)));

      // Remove deleted projects from list
      setProjects((prev) =>
        prev.filter((p) => !selectedProjects.includes(p.id)),
      );
      setSelectedProjects([]);
      setDeleteDialogOpen(false);
    } catch (err) {
      console.error("Failed to delete projects:", err);
      // Re-fetch to ensure UI sync
      fetchProjects();
      alert("Failed to delete some projects. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const fetchProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await projectsApi.getAll();
      setProjects(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    projectStatusesApi
      .getAll()
      .then((res) => setProjectStatuses(res.data ?? []))
      .catch(() => setProjectStatuses([]));
  }, []);

  // Set page title in header
  useEffect(() => {
    setTitle("Projects");
    // Cleanup: clear title when component unmounts
    return () => setTitle(null);
  }, [setTitle]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("projects_view_mode", viewMode);
    }
  }, [viewMode]);

  const statusColumnKeys = useMemo(() => {
    if (statusesSorted.length > 0) {
      return statusesSorted.map((s) => s.name.toLowerCase());
    }
    return FALLBACK_PROJECT_STATUS_COLUMNS.map((c) => c.key);
  }, [statusesSorted]);

  const kanbanColumns = useMemo(() => {
    const columns =
      statusesSorted.length > 0
        ? statusesSorted.map((s) => ({
            key: s.name.toLowerCase(),
            label: s.name,
          }))
        : [...FALLBACK_PROJECT_STATUS_COLUMNS];

    const hasOther = projects.some((project) => {
      const status = project.status?.toLowerCase() || "other";
      return !statusColumnKeys.includes(status);
    });
    if (hasOther) {
      columns.push({ key: "other", label: "Other" });
    }
    return columns;
  }, [statusesSorted, projects, statusColumnKeys]);

  const columnIds = useMemo(
    () => kanbanColumns.map((c) => c.key),
    [kanbanColumns],
  );

  const [board, setBoard] = useState<ProjectBoardState>(() =>
    buildProjectBoard(projects, statusColumnKeys),
  );
  const boardRef = useRef(board);
  boardRef.current = board;
  const originColumnRef = useRef<string | null>(null);

  useEffect(() => {
    if (activeDragProject != null) return;
    setBoard(buildProjectBoard(projects, statusColumnKeys));
  }, [projects, statusColumnKeys, activeDragProject]);

  const getStatusSubtext = (statusProjects: Project[]) => {
    const count = statusProjects.length;
    return `${count} project${count !== 1 ? "s" : ""}`;
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 8 },
    }),
  );

  const resolveCanonicalStatus = useCallback(
    (columnKey: string) => {
      const col = statusesSorted.find(
        (s) => s.name.toLowerCase() === columnKey.toLowerCase(),
      );
      return col?.name ?? columnKey;
    },
    [statusesSorted],
  );

  const handleKanbanDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const project = projects.find((p) => p.id === active.id);
    if (!project) return;
    setActiveDragProject(project);
    originColumnRef.current =
      findProjectColumn(active.id, boardRef.current, columnIds) ??
      (project.status?.toLowerCase() || "other");
  };

  const handleKanbanDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    setBoard((prev) => {
      const activeCol = findProjectColumn(active.id, prev, columnIds);
      const overCol = findProjectColumn(over.id, prev, columnIds);
      if (!activeCol || !overCol || activeCol === overCol) return prev;
      if (overCol === "other") return prev;

      const activeItems = [...(prev[activeCol] ?? [])];
      const overItems = [...(prev[overCol] ?? [])];
      const activeIndex = activeItems.findIndex(
        (p) => String(p.id) === String(active.id),
      );
      if (activeIndex < 0) return prev;

      const [moved] = activeItems.splice(activeIndex, 1);
      const overIsColumn = columnIds.includes(String(over.id));
      let newIndex = overIsColumn
        ? overItems.length
        : overItems.findIndex((p) => String(p.id) === String(over.id));
      if (newIndex < 0) newIndex = overItems.length;
      overItems.splice(newIndex, 0, moved);

      return { ...prev, [activeCol]: activeItems, [overCol]: overItems };
    });
  };

  const handleKanbanDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    const fromColumn = originColumnRef.current;
    originColumnRef.current = null;

    if (!over || !fromColumn) {
      setActiveDragProject(null);
      return;
    }

    const currentBoard = boardRef.current;
    let toColumn = findProjectColumn(active.id, currentBoard, columnIds);

    if (toColumn === fromColumn && !columnIds.includes(String(over.id))) {
      const list = currentBoard[fromColumn] ?? [];
      const activeIndex = list.findIndex(
        (p) => String(p.id) === String(active.id),
      );
      const overIndex = list.findIndex((p) => String(p.id) === String(over.id));
      if (activeIndex >= 0 && overIndex >= 0 && activeIndex !== overIndex) {
        setBoard((prev) => ({
          ...prev,
          [fromColumn]: arrayMove(
            prev[fromColumn] ?? [],
            activeIndex,
            overIndex,
          ),
        }));
      }
      setActiveDragProject(null);
      return;
    }

    if (!toColumn) {
      toColumn = findProjectColumn(over.id, currentBoard, columnIds);
    }

    setActiveDragProject(null);
    if (!toColumn || toColumn === fromColumn || toColumn === "other") {
      if (toColumn === "other") {
        setBoard(buildProjectBoard(projects, statusColumnKeys));
      }
      return;
    }

    const project =
      projects.find((p) => String(p.id) === String(active.id)) ??
      currentBoard[toColumn]?.find((p) => String(p.id) === String(active.id));
    if (!project) return;

    const newStatusCanonical = resolveCanonicalStatus(toColumn);
    if (
      newStatusCanonical.toLowerCase() ===
      (project.status?.toLowerCase() ?? "")
    ) {
      return;
    }

    const oldStatus = project.status;
    setProjects((prev) =>
      prev.map((p) =>
        p.id === project.id ? { ...p, status: newStatusCanonical } : p,
      ),
    );

    void (async () => {
      try {
        await projectsApi.update(Number(project.id), {
          status: newStatusCanonical,
        });
      } catch (err) {
        setProjects((prev) =>
          prev.map((p) =>
            p.id === project.id ? { ...p, status: oldStatus } : p,
          ),
        );
        console.error("Failed to update project status", err);
      }
    })();
  };

  const handleKanbanDragCancel = () => {
    originColumnRef.current = null;
    setActiveDragProject(null);
    setBoard(buildProjectBoard(projects, statusColumnKeys));
  };

  const renderProjects = () => {
    if (viewMode === "list") {
      return (
        <div className="rounded-md border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <input
                    type="checkbox"
                    className="h-4 w-4 cursor-pointer rounded border-input text-primary focus:ring-ring"
                    checked={
                      projects.length > 0 &&
                      selectedProjects.length === projects.length
                    }
                    onChange={toggleAll}
                    onClick={(e) => e.stopPropagation()}
                  />
                </TableHead>
                <TableHead className="w-[300px]">Project Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Tasks</TableHead>
                <TableHead>Project Manager</TableHead>
                <TableHead>Created Date</TableHead>
                <TableHead>Target Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    No projects found.
                  </TableCell>
                </TableRow>
              ) : (
                projects.map((project) => (
                  <TableRow
                    key={project.id}
                    className={`cursor-pointer hover:bg-muted/50 ${
                      selectedProjects.includes(project.id) ? "bg-primary/10" : ""
                    }`}
                    onClick={() => router.push(`/projects/${project.id}`)}
                  >
                    <TableCell
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleProjectSelection(project.id);
                      }}
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4 cursor-pointer rounded border-input text-primary focus:ring-ring"
                        checked={selectedProjects.includes(project.id)}
                        onChange={() => {}} // Handle change in parent click for better hit area
                        onClick={(e) => e.stopPropagation()}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      <Link
                        href={`/projects/${project.id.toString()}`}
                        className="hover:underline"
                      >
                        {project.project_name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(project.status)}>
                        {project.status || "No status"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <ProjectTaskCompletion
                        tasks={project.tasks}
                        variant="compact"
                      />
                    </TableCell>
                    <TableCell>{project.tasks?.length || 0}</TableCell>
                    <TableCell>{formatProjectManager(project)}</TableCell>
                    <TableCell>{formatDate(project.created_at)}</TableCell>
                    <TableCell>{formatDate(project.target_date)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      );
    }

    if (viewMode === "kanban") {
      return (
        <div className="flex h-full min-h-[320px] flex-col overflow-hidden rounded-md border border-border bg-card">
          <div className="flex flex-1 min-h-0 overflow-x-auto border-t">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={handleKanbanDragStart}
              onDragOver={handleKanbanDragOver}
              onDragEnd={handleKanbanDragEnd}
              onDragCancel={handleKanbanDragCancel}
            >
              <div className="flex h-full py-0">
                {kanbanColumns.map((column) => {
                  const statusProjects = board[column.key] || [];
                  return (
                    <KanbanColumn
                      key={column.key}
                      id={column.key}
                      label={column.label}
                      projects={statusProjects}
                      statusSubtext={getStatusSubtext(statusProjects)}
                      onEdit={(project) =>
                        router.push(`/projects/${project.id}`)}
                      onDelete={(project) => {
                        setSelectedProjects([project.id]);
                        setDeleteDialogOpen(true);
                      }}
                      onCardClick={(project) =>
                        router.push(`/projects/${project.id}`)}
                    />
                  );
                })}
              </div>
              <DragOverlay>
                {activeDragProject ? (
                  <ProjectKanbanCard project={activeDragProject} />
                ) : null}
              </DragOverlay>
            </DndContext>
          </div>
        </div>
      );
    }

    // Card view (default)
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    );
  };

  return (
    <PageShell fill className="bg-background text-foreground">
        <div className="mb-6 flex shrink-0 items-center justify-between">
          <div>
            <p className="text-muted-foreground">{projects.length} projects</p>
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
            <Button onClick={fetchProjects} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCreateSheetOpen(true)}
            >
              <Plus className="h-4 w-4 mr-1" /> New Project
            </Button>
          </div>
        </div>

        {selectedProjects.length > 0 && (
          <div className="mb-6 flex items-center justify-between rounded-md border border-primary/30 bg-primary/10 px-4 py-3 text-primary">
            <span className="text-sm font-medium">
              {selectedProjects.length} item
              {selectedProjects.length === 1 ? "" : "s"} selected
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={isDeleting}
                className="border-destructive/30 bg-card text-destructive hover:border-destructive/50 hover:bg-destructive/10"
                onClick={() => setDeleteDialogOpen(true)}
              >
                Delete Selected
              </Button>
            </div>
          </div>
        )}

        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete projects</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete {selectedProjects.length}{" "}
                selected items? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleBulkDelete}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <ProjectFormSheet
          open={createSheetOpen}
          onOpenChange={setCreateSheetOpen}
          onSuccess={fetchProjects}
        />

        {loading && <div className="text-center py-8">Loading...</div>}
        {error && <div className="text-red-600 text-center py-8">{error}</div>}

        {!loading &&
          !error &&
          (projects.length === 0 ? (
            <div className="text-center py-16">
              <h3 className="text-xl mb-2">No projects yet</h3>
              <p className="text-muted-foreground">Create your first project above.</p>
            </div>
          ) : (
            <div
              className={cn(
                "min-h-0",
                viewMode === "kanban" && "flex flex-1 flex-col",
              )}
            >
              {renderProjects()}
            </div>
          ))}
    </PageShell>
  );
};

export default Projects;
