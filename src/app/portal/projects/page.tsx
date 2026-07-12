"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PortalPage } from "@/components/portal/portal-page";
import {
  ProgressBar,
  ProjectStatusBadge,
} from "@/components/portal/portal-badges";
import { usePageTitle } from "@/contexts/page-title-context";
import { projectsApi } from "@/lib/api";
import { projectToClientProject } from "@/lib/portal-projects";

export default function PortalProjectsPage() {
  const { setTitle } = usePageTitle();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState(
    [] as ReturnType<typeof projectToClientProject>[],
  );

  useEffect(() => {
    setTitle("Projects");
    return () => setTitle(null);
  }, [setTitle]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await projectsApi.getAll({ limit: 100 });
        if (!cancelled) {
          setProjects(response.data.map(projectToClientProject));
        }
      } catch {
        if (!cancelled) {
          setError("Could not load your projects. Please try again.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <PortalPage
      title="Your projects"
      description="Track delivery progress, status, and timelines for all Wraptron engagements you have access to."
    >
      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden />
          Loading projects…
        </div>
      ) : error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <p className="text-muted-foreground">
            No projects are assigned to your account yet.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Your Wraptron contact can grant access when a project is ready.
          </p>
        </div>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {projects.map((project) => (
            <li key={project.id}>
              <Card className="h-full">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg">
                      <Link
                        href={`/portal/projects/${project.id}`}
                        className="hover:underline"
                      >
                        {project.name}
                      </Link>
                    </CardTitle>
                    <ProjectStatusBadge status={project.status} />
                  </div>
                  <CardDescription>{project.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium tabular-nums">
                        {project.progress}%
                      </span>
                    </div>
                    <ProgressBar value={project.progress} />
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
                    <span>Project Manager: {project.lead}</span>
                    <span>
                      Due:{" "}
                      {new Date(project.dueDate).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/portal/projects/${project.id}`}>
                      View details
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </PortalPage>
  );
}
