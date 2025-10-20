"use client";

import Link from "next/link";
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { RefreshCw, Plus, Loader2 } from "lucide-react";

interface Project {
  id: string;
  project_name: string;
  status?: string;
  start_date?: string;
  target_date?: string;
  scope?: string;
  tasks?: any[];
}

const PROJECTS_QUERY = `
  query GetProjects {
    projects {
      id
      project_name
      status
      start_date
      target_date
      scope
      tasks
    }
  }
`;

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

const ProjectCard = ({ project }: { project: Project }) => (
  <Link href={`/projects/${project.id}`} className={`group block no-underline`}>
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

const Projects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("https://admin.wraptron.com/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: PROJECTS_QUERY }),
      });

      const data = await response.json();
      if (data.errors) throw new Error(data.errors[0]?.message);
      setProjects(data.data?.projects || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 ">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl">Projects</h2>
            <p className="text-gray-600">{projects.length} projects</p>
          </div>
          <div className="">
            <Button onClick={fetchProjects} variant="outline">
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="outline" className="ml-2">
              <Plus className="h-4 w-4 mr-1" /> Add Project
            </Button>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          ))}
      </div>
    </div>
  );
};

export default Projects;
