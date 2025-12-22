"use client";

import Link from "next/link";
import React, { useState, useEffect } from "react";
import { projectsApi, type Project } from "@/lib/api";
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

import { RefreshCw, Plus, Menu, LayoutGrid, Columns3 } from "lucide-react";

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
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("projects_view_mode");
      if (saved === "list" || saved === "card" || saved === "kanban") {
        return saved as ViewMode;
      }
    }
    return "card";
  });

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
                  <TableCell colSpan={5} className="h-24 text-center">
                    No projects found.
                  </TableCell>
                </TableRow>
              ) : (
                projects.map((project) => (
                  <TableRow
                    key={project.id}
                    className="cursor-pointer hover:bg-gray-50"
                  >
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
                    No projects
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
            <h2 className="text-2xl">Projects</h2>
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
                <Plus className="h-4 w-4 mr-1" /> Add Project
              </Button>
            </Link>
          </div>
        </div>

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
