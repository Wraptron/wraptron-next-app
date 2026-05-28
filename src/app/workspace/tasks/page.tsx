"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePageTitle } from "@/contexts/page-title-context";
import { useAuth } from "@/contexts/auth-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, RefreshCw, CheckSquare } from "lucide-react";
import { projectsApi, employeesApi, type Task, type Project } from "@/lib/api";

type TaskWithProject = Task & { project_name: string };

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

function formatDate(dateString?: string): string {
  if (!dateString) return "—";
  try {
    return new Date(dateString).toLocaleDateString();
  } catch {
    return "—";
  }
}

export default function WorkspaceTasksPage() {
  const router = useRouter();
  const { setTitle } = usePageTitle();
  const { user } = useAuth();
  const [tasks, setTasks] = useState<TaskWithProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAssignedTasks = useMemo(
    () => async () => {
      if (!user?.id) {
        setTasks([]);
        setError("You need to be logged in to view assigned tasks.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const [employeesRes, projectsRes] = await Promise.all([
          employeesApi.getAll({ employment_status: "active", limit: 500 }),
          projectsApi.getAll({ limit: 500 }),
        ]);

        const currentEmployee = employeesRes.data.find(
          (employee) => employee.user_id === user.id,
        );

        if (!currentEmployee) {
          setTasks([]);
          setError(
            "No linked employee record found for your account. Ask an admin to link your employee profile.",
          );
          return;
        }

        const flat: TaskWithProject[] = [];
        projectsRes.data.forEach((project: Project) => {
          (project.tasks || []).forEach((task: Task) => {
            if (task.assigned_employee_id === currentEmployee.id) {
              flat.push({
                ...task,
                project_name: project.project_name || `Project #${project.id}`,
              });
            }
          });
        });

        flat.sort((a, b) => {
          const aDate = a.end_date ? new Date(a.end_date).getTime() : Number.MAX_SAFE_INTEGER;
          const bDate = b.end_date ? new Date(b.end_date).getTime() : Number.MAX_SAFE_INTEGER;
          if (aDate !== bDate) return aDate - bDate;
          return (a.title || "").localeCompare(b.title || "");
        });

        setTasks(flat);
      } catch {
        setError("Failed to load assigned tasks.");
      } finally {
        setLoading(false);
      }
    },
    [user?.id],
  );

  useEffect(() => {
    setTitle("Tasks");
    return () => setTitle(null);
  }, [setTitle]);

  useEffect(() => {
    void loadAssignedTasks();
  }, [loadAssignedTasks]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-muted-foreground">
              {tasks.length} assigned task{tasks.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Button onClick={() => void loadAssignedTasks()} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

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
          <Card>
            <CardContent className="py-16 text-center">
              <CheckSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No assigned tasks</h3>
              <p className="text-muted-foreground">
                You currently do not have any tasks assigned in projects.
              </p>
            </CardContent>
          </Card>
        )}

        {!loading && !error && tasks.length > 0 && (
          <div className="rounded-md border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[320px]">Task</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Deadline</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map((task) => (
                  <TableRow
                    key={`${task.project_id}-${task.id}`}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() =>
                      router.push(`/projects/${task.project_id}/tasks/${task.id}`)
                    }
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
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
