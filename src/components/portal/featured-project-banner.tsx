"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight, Layers, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import {
  ProgressBar,
  ProjectStatusBadge,
} from "@/components/portal/portal-badges";
import { projectsApi } from "@/lib/api";
import { projectToClientProject } from "@/lib/portal-projects";
import type { ClientProject } from "@/lib/portal-data";

function pickFeaturedProjects(projects: ClientProject[]): ClientProject[] {
  const priority = ["In Progress", "Review", "Live", "Paused"] as const;
  const sorted = [...projects].sort(
    (a, b) => priority.indexOf(a.status) - priority.indexOf(b.status),
  );
  return sorted.length > 0 ? sorted : projects;
}

export function FeaturedProjectBanner() {
  const [featured, setFeatured] = useState<ClientProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const count = featured.length;

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await projectsApi.getAll({ limit: 20 });
        if (!cancelled) {
          setFeatured(pickFeaturedProjects(response.data.map(projectToClientProject)));
        }
      } catch {
        if (!cancelled) setFeatured([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (index >= count) setIndex(0);
  }, [count, index]);

  if (loading) {
    return (
      <section aria-label="Featured project" className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </section>
    );
  }

  if (count === 0) return null;

  const project = featured[index];
  const goPrev = () => setIndex((current) => (current - 1 + count) % count);
  const goNext = () => setIndex((current) => (current + 1) % count);

  return (
    <section aria-label="Featured project" className="space-y-3">
      <div className="flex items-center gap-2">
        <Layers className="h-4 w-4 text-primary" aria-hidden />
        <h2 className="text-sm font-medium text-muted-foreground">
          Featured project
        </h2>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm">
        <div className="grid gap-0 md:grid-cols-[1.1fr_1fr]">
          <div className="relative min-h-[220px] md:min-h-[280px] flex items-center justify-center bg-gradient-to-br from-primary/20 via-primary/5 to-background">
            <Layers className="h-20 w-20 text-primary/40" aria-hidden />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent md:bg-gradient-to-r md:from-black/30 md:via-transparent md:to-transparent" />
            <div className="absolute bottom-4 left-4 md:bottom-6 md:left-6">
              <ProjectStatusBadge status={project.status} />
            </div>
          </div>

          <div className="flex flex-col justify-center gap-4 p-6 md:p-8">
            <div className="space-y-2">
              <Badge className="w-fit">Featured</Badge>
              <h3 className="text-2xl font-semibold tracking-tight">
                {project.name}
              </h3>
              <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
                {project.description}
              </p>
            </div>

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
              <span>Lead: {project.lead}</span>
              <span>
                Due{" "}
                {new Date(project.dueDate).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/portal/projects/${project.id}`}>View details</Link>
              </Button>
              {count > 1 ? (
                <div className="flex items-center gap-2 ml-auto">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={goPrev}
                    aria-label="Previous featured project"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="min-w-12 text-center text-xs text-muted-foreground tabular-nums">
                    {index + 1} / {count}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={goNext}
                    aria-label="Next featured project"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
