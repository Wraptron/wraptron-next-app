"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState, useEffect, useMemo } from "react";
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
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  DragStartEvent,
  DragEndEvent,
  TouchSensor,
  closestCorners,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

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

const getStatusColor = (status?: string) => {
  const colors = {
    active: "bg-green-100 text-green-800",
    completed: "bg-blue-100 text-blue-800",
    pending: "bg-yellow-100 text-yellow-800",
    inactive: "bg-red-100 text-red-800",
  };
  return (
    colors[status?.toLowerCase() as keyof typeof colors] ||
    "bg-gray-100 text-gray-800"
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
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Tasks:</span>
            <span>{project.tasks?.length || 0}</span>
          </div>
          <div className="flex justify-between">
            <span>Start:</span>
            <span>{formatDate(project.start_date)}</span>
          </div>
          <div className="flex justify-between">
            <span>Target:</span>
            <span>{formatDate(project.target_date)}</span>
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
}: {
  project: Project;
  onEdit?: () => void;
  onDelete?: () => void;
}) => (
  <Card className="border-[0.5px] border-gray-200 shadow-none cursor-grab active:cursor-grabbing bg-white">
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
      <div className="text-xs text-gray-500">
        <div>Tasks: {project.tasks?.length || 0}</div>
        <div className="mt-1">Target: {formatDate(project.target_date)}</div>
      </div>
    </CardContent>
  </Card>
);

const SortableProjectCard = ({
  project,
  onEdit,
  onDelete,
}: {
  project: Project;
  onEdit: () => void;
  onDelete: (project: Project) => void;
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
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Link
        href={`/projects/${project.id}`}
        className="block no-underline text-inherit"
      >
        <ProjectKanbanCard
          project={project}
          onEdit={onEdit}
          onDelete={() => onDelete(project)}
        />
      </Link>
    </div>
  );
};

const KanbanColumn = ({
  id,
  label,
  projects,
  statusSubtext,
  onEdit,
  onDelete,
}: {
  id: string;
  label: string;
  projects: Project[];
  statusSubtext: string;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
}) => {
  const { setNodeRef } = useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      className="flex-shrink-0 w-72 border-[0.5px] border-gray-200 bg-white rounded-none h-full overflow-y-auto flex flex-col"
    >
      <div className="border-b border-gray-200 px-3 py-2 flex-shrink-0">
        <h3 className="font-medium text-sm text-gray-900">{label}</h3>
        <p className="text-xs text-gray-500 mt-0.5">{statusSubtext}</p>
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
              />
            ))}
            {projects.length === 0 && (
              <div className="text-sm text-gray-400 text-center py-6 italic border border-dashed border-gray-200">
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

  const getProjectsByStatus = () => {
    const grouped: Record<string, Project[]> = { other: [] };
    statusColumnKeys.forEach((k) => {
      grouped[k] = [];
    });

    projects.forEach((project) => {
      const status = project.status?.toLowerCase() || "other";
      if (grouped[status] !== undefined) {
        grouped[status].push(project);
      } else {
        grouped.other.push(project);
      }
    });

    const dealTime = (p: Project) =>
      new Date(p.updated_at ?? p.created_at).getTime();
    for (const key of Object.keys(grouped)) {
      grouped[key].sort((a, b) => dealTime(b) - dealTime(a));
    }

    return grouped;
  };

  const getStatusSubtext = (statusProjects: Project[]) => {
    const count = statusProjects.length;
    return `${count} project${count !== 1 ? "s" : ""}`;
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor),
  );

  const handleKanbanDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const project = projects.find((p) => p.id === active.id);
    if (project) setActiveDragProject(project);
  };

  const handleKanbanDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragProject(null);
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;
    const project = projects.find((p) => p.id === activeId);
    if (!project) return;

    const overStr = String(overId);
    if (overStr === "other") return;

    let newStatusCanonical: string | undefined;
    const col = statusesSorted.find((s) => s.name.toLowerCase() === overStr);
    if (col) {
      newStatusCanonical = col.name;
    } else {
      const overProject = projects.find((p) => p.id === overId);
      if (overProject) {
        newStatusCanonical = overProject.status;
      } else {
        return;
      }
    }

    if (!newStatusCanonical) return;
    if (
      newStatusCanonical.toLowerCase() ===
      (project.status?.toLowerCase() ?? "")
    ) {
      return;
    }

    const oldStatus = project.status;
    const updated = projects.map((p) =>
      p.id === project.id ? { ...p, status: newStatusCanonical } : p,
    );
    setProjects(updated);

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
  };

  const renderProjects = () => {
    if (viewMode === "list") {
      return (
        <div className="rounded-md border bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
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
                <TableHead>Tasks</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>Target Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No projects found.
                  </TableCell>
                </TableRow>
              ) : (
                projects.map((project) => (
                  <TableRow
                    key={project.id}
                    className={`cursor-pointer hover:bg-gray-50 ${
                      selectedProjects.includes(project.id) ? "bg-blue-50" : ""
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
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
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
                    <TableCell>{project.tasks?.length || 0}</TableCell>
                    <TableCell>{formatDate(project.start_date)}</TableCell>
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
      const grouped = getProjectsByStatus();
      const columns =
        statusesSorted.length > 0
          ? statusesSorted.map((s) => ({
              key: s.name.toLowerCase(),
              label: s.name,
            }))
          : FALLBACK_PROJECT_STATUS_COLUMNS;
      if ((grouped.other?.length ?? 0) > 0) {
        columns.push({ key: "other", label: "Other" });
      }

      return (
        <div className="h-[calc(100vh-200px)] border-[0.5px] border-gray-200 bg-white overflow-hidden flex flex-col">
          <div className="flex flex-1 min-h-0 overflow-x-auto border-t">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={handleKanbanDragStart}
              onDragEnd={handleKanbanDragEnd}
            >
              <div className="flex h-full py-0">
                {columns.map((column) => {
                  const statusProjects = grouped[column.key] || [];
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground ">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <p className="text-gray-600">{projects.length} projects</p>
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
          <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-md mb-6 flex items-center justify-between">
            <span className="text-sm font-medium">
              {selectedProjects.length} item
              {selectedProjects.length === 1 ? "" : "s"} selected
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={isDeleting}
                className="bg-white hover:bg-blue-50 text-red-600 border-red-200 hover:border-red-300"
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
              <p className="text-gray-600">Create your first project above.</p>
            </div>
          ) : (
            renderProjects()
          ))}
      </div>
    </div>
  );
};

export default Projects;
