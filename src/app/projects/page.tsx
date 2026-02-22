"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import { projectsApi, type Project } from "@/lib/api";
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

import {
  RefreshCw,
  Plus,
  Menu,
  LayoutGrid,
  Columns3,
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

const ProjectKanbanCard = ({ project }: { project: Project }) => (
  <Link
    href={`/projects/${project.id.toString()}`}
    className="group block no-underline"
  >
    <Card className="hover:shadow-md transition-shadow mb-3">
      <CardContent className="p-3">
        <h4 className="font-semibold text-sm mb-2">{project.project_name}</h4>
        <Badge className={getStatusColor(project.status)}>
          {project.status || "No status"}
        </Badge>
        <div className="mt-2 text-xs text-gray-600">
          <div>Tasks: {project.tasks?.length || 0}</div>
          <div className="mt-1">Target: {formatDate(project.target_date)}</div>
        </div>
      </CardContent>
    </Card>
  </Link>
);

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

  // Set page title in header
  useEffect(() => {
    setTitle("PPM");
    // Cleanup: clear title when component unmounts
    return () => setTitle(null);
  }, [setTitle]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("projects_view_mode", viewMode);
    }
  }, [viewMode]);

  // Group projects by status for kanban view
  const getProjectsByStatus = () => {
    const grouped: Record<string, Project[]> = {
      pending: [],
      active: [],
      completed: [],
      inactive: [],
      other: [],
    };

    projects.forEach((project) => {
      const status = project.status?.toLowerCase() || "other";
      if (grouped[status]) {
        grouped[status].push(project);
      } else {
        grouped.other.push(project);
      }
    });

    return grouped;
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
                    No PPM items found.
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
      const columns = [
        { key: "pending", label: "Pending", color: "bg-yellow-50" },
        { key: "active", label: "Active", color: "bg-green-50" },
        { key: "completed", label: "Completed", color: "bg-blue-50" },
        { key: "inactive", label: "Inactive", color: "bg-red-50" },
        { key: "other", label: "Other", color: "bg-gray-50" },
      ];

      return (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.map((column) => (
            <div
              key={column.key}
              className={`flex-shrink-0 w-72 ${column.color} rounded-lg p-3`}
            >
              <h3 className="font-semibold mb-3 text-sm uppercase">
                {column.label} ({grouped[column.key]?.length || 0})
              </h3>
              <div>
                {grouped[column.key]?.map((project) => (
                  <ProjectKanbanCard key={project.id} project={project} />
                ))}
                {(!grouped[column.key] || grouped[column.key].length === 0) && (
                  <div className="text-sm text-gray-500 text-center py-4">
                    No items
                  </div>
                )}
              </div>
            </div>
          ))}
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
    <div className="min-h-screen bg-gray-50 ">
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
            <Link href="/projects/new">
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-1" /> Add Item
              </Button>
            </Link>
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
              <DialogTitle>Delete PPM Items</DialogTitle>
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

        {loading && <div className="text-center py-8">Loading...</div>}
        {error && <div className="text-red-600 text-center py-8">{error}</div>}

        {!loading &&
          !error &&
          (projects.length === 0 ? (
            <div className="text-center py-16">
              <h3 className="text-xl mb-2">No PPM items yet</h3>
              <p className="text-gray-600">Create your first PPM item above.</p>
            </div>
          ) : (
            renderProjects()
          ))}
      </div>
    </div>
  );
};

export default Projects;
