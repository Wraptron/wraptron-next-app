"use client";

/**
 * Legacy task URL resolver: /projects/:id/tasks/:taskId (numeric ids, used
 * by the project detail page and old bookmarks) → canonical /tasks/:key
 * (e.g. /tasks/ACME-12).
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { tasksApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function LegacyTaskRedirectPage() {
  const params = useParams<{ id: string; taskId: string }>();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const projectId = parseInt(params.id ?? "");
    const taskId = parseInt(params.taskId ?? "");
    if (Number.isNaN(projectId) || Number.isNaN(taskId)) {
      setError("Invalid task link");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await tasksApi.board({ project_id: projectId });
        if (cancelled) return;
        const task = res.data.find((t) => t.id === taskId);
        if (task) {
          router.replace(`/tasks/${task.display_key}`);
        } else {
          setError("Task not found in this project");
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load task");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [params.id, params.taskId, router]);

  if (error) {
    return (
      <div className="flex flex-col items-start gap-3 p-6">
        <p className="text-sm text-destructive">{error}</p>
        <Button asChild variant="outline">
          <Link href={`/projects/${params.id}`}>
            <ArrowLeft className="mr-1 h-4 w-4" /> Back to project
          </Link>
        </Button>
      </div>
    );
  }
  return <div className="p-6 text-sm text-muted-foreground">Loading…</div>;
}
