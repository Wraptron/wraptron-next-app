"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PortalPage } from "@/components/portal/portal-page";
import {
  ProgressBar,
  ProjectStatusBadge,
} from "@/components/portal/portal-badges";
import { usePageTitle } from "@/contexts/page-title-context";
import { projectsApi, type Project } from "@/lib/api";
import { mapProjectStatus } from "@/lib/portal-projects";
import { getProjectTaskCompletion } from "@/lib/project-completion";

export default function PortalProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { setTitle } = usePageTitle();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const { id } = await params;
        const projectId = parseInt(id, 10);
        if (Number.isNaN(projectId)) {
          if (!cancelled) setError("Invalid project.");
          return;
        }

        const data = await projectsApi.getById(projectId);
        if (!cancelled) {
          setProject(data);
          setTitle(data.project_name);
        }
      } catch {
        if (!cancelled) {
          setError("This project is unavailable or you do not have access.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
      setTitle(null);
    };
  }, [params, setTitle]);

  if (loading) {
    return (
      <PortalPage title="Project">
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden />
          Loading project…
        </div>
      </PortalPage>
    );
  }

  if (error || !project) {
    return (
      <PortalPage title="Project">
        <div className="space-y-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/portal/projects">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to projects
            </Link>
          </Button>
          <p className="text-sm text-destructive">{error ?? "Not found."}</p>
        </div>
      </PortalPage>
    );
  }

  const { percent, completed, total } = getProjectTaskCompletion(project.tasks);
  const status = mapProjectStatus(project.status);
  const lead = [
    project.manager_employee_first_name,
    project.manager_employee_last_name,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return (
    <PortalPage
      title={project.project_name}
      description="Delivery status and milestones for your engagement."
    >
      <div className="space-y-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/portal/projects">
            <ArrowLeft className="mr-2 h-4 w-4" />
            All projects
          </Link>
        </Button>

        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <CardTitle className="text-2xl">{project.project_name}</CardTitle>
                <CardDescription>
                  {project.functional_requirements ||
                    project.target_audience ||
                    "Project overview"}
                </CardDescription>
              </div>
              <ProjectStatusBadge status={status} />
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Task progress</span>
                <span className="font-medium tabular-nums">
                  {completed}/{total} ({percent}%)
                </span>
              </div>
              <ProgressBar value={percent} />
            </div>

            <dl className="grid gap-4 sm:grid-cols-2 text-sm">
              {lead ? (
                <div>
                  <dt className="text-muted-foreground">Project lead</dt>
                  <dd className="font-medium">{lead}</dd>
                </div>
              ) : null}
              {project.target_date ? (
                <div>
                  <dt className="text-muted-foreground">Target date</dt>
                  <dd className="font-medium">
                    {new Date(project.target_date).toLocaleDateString(undefined, {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </dd>
                </div>
              ) : null}
              {project.services_offered?.length ? (
                <div className="sm:col-span-2">
                  <dt className="text-muted-foreground">Services</dt>
                  <dd className="font-medium">
                    {project.services_offered.join(", ")}
                  </dd>
                </div>
              ) : null}
            </dl>
          </CardContent>
        </Card>

        {project.tasks && project.tasks.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tasks</CardTitle>
              <CardDescription>
                High-level delivery items tracked by the Wraptron team.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="divide-y">
                {project.tasks.map((task) => (
                  <li
                    key={task.id}
                    className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                  >
                    <span className="text-sm font-medium">{task.title}</span>
                    <span className="text-xs capitalize text-muted-foreground">
                      {(task.status || "pending").replace(/_/g, " ")}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </PortalPage>
  );
}
