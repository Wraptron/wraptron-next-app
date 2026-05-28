"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePageTitle } from "@/contexts/page-title-context";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  MapPin,
  Monitor,
  Wifi,
  Building2,
  LogIn,
  LogOut,
  CalendarClock,
} from "lucide-react";
import {
  attendanceApi,
  employeesApi,
  projectsApi,
  type Task,
  type Project,
  type AttendanceSession,
  type WorkMode,
} from "@/lib/api";
import { cn } from "@/lib/utils";
import { WorkspaceDashboardMetrics } from "@/components/workspace-dashboard-metrics";

const WORK_MODES: {
  value: WorkMode;
  label: string;
  icon: React.ElementType;
}[] = [
  { value: "office", label: "Office", icon: Building2 },
  { value: "remote", label: "Remote", icon: Wifi },
  { value: "client_site", label: "Client Site", icon: MapPin },
];

function formatTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function getDeviceInfo(): Record<string, unknown> {
  if (typeof navigator === "undefined") return {};
  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    screen: `${window.screen?.width ?? 0}x${window.screen?.height ?? 0}`,
  };
}

type TaskWithProject = Task & { project_name: string };

function getTaskStatusGroup(status?: string): "completed" | "planned" {
  const normalized = (status ?? "").trim().toLowerCase().replace(/\s/g, "_");
  return normalized === "done" || normalized === "completed"
    ? "completed"
    : "planned";
}

export default function WorkspaceDashboardPage() {
  const { user } = useAuth();
  const { setTitle } = usePageTitle();
  const [session, setSession] = useState<AttendanceSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [workMode, setWorkMode] = useState<WorkMode | null>(null);
  const [liveSeconds, setLiveSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [taskError, setTaskError] = useState<string | null>(null);
  const [plannedTasks, setPlannedTasks] = useState<TaskWithProject[]>([]);
  const [assignedTasksCount, setAssignedTasksCount] = useState(0);
  const [completedTasksCount, setCompletedTasksCount] = useState(0);
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);

  const fetchToday = useCallback(async () => {
    try {
      const res = await attendanceApi.getMyToday();
      setSession(res.session);
    } catch {
      setError("Failed to load attendance");
      setSession(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setTitle("Dashboard");
    return () => setTitle(null);
  }, [setTitle]);

  useEffect(() => {
    fetchToday();
  }, [fetchToday]);

  const fetchAssignedTasks = useCallback(async () => {
    if (!user?.id) {
      setTasksLoading(false);
      setPlannedTasks([]);
      setAssignedTasksCount(0);
      setCompletedTasksCount(0);
      return;
    }

    setTasksLoading(true);
    setTaskError(null);
    try {
      const [employeesRes, projectsRes] = await Promise.all([
        employeesApi.getAll({ limit: 500 }),
        projectsApi.getAll({ limit: 500 }),
      ]);

      const currentEmployee = employeesRes.data.find(
        (employee) => employee.user_id === user.id,
      );

      if (!currentEmployee) {
        setPlannedTasks([]);
        setAssignedTasksCount(0);
        setCompletedTasksCount(0);
        setTaskError("Employee profile is not linked to your account.");
        return;
      }

      const assigned: TaskWithProject[] = [];
      projectsRes.data.forEach((project: Project) => {
        (project.tasks || []).forEach((task: Task) => {
          if (task.assigned_employee_id === currentEmployee.id) {
            assigned.push({
              ...task,
              project_name: project.project_name || `Project #${project.id}`,
            });
          }
        });
      });

      const planned = assigned
        .filter((task) => getTaskStatusGroup(task.status) !== "completed")
        .sort((a, b) => {
          const aDate = a.end_date
            ? new Date(a.end_date).getTime()
            : Number.MAX_SAFE_INTEGER;
          const bDate = b.end_date
            ? new Date(b.end_date).getTime()
            : Number.MAX_SAFE_INTEGER;
          if (aDate !== bDate) return aDate - bDate;
          return (a.title || "").localeCompare(b.title || "");
        });

      const completedCount = assigned.filter(
        (task) => getTaskStatusGroup(task.status) === "completed",
      ).length;

      setPlannedTasks(planned);
      setAssignedTasksCount(assigned.length);
      setCompletedTasksCount(completedCount);
    } catch {
      setTaskError("Failed to load assigned tasks.");
      setPlannedTasks([]);
      setAssignedTasksCount(0);
      setCompletedTasksCount(0);
    } finally {
      setTasksLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchAssignedTasks();
  }, [fetchAssignedTasks]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await attendanceApi.getMySessions({ limit: 30 });
        if (!cancelled) setSessions(res.sessions ?? []);
      } catch {
        if (!cancelled) setSessions([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!session || session.status === "logged_out") return;
    const start = new Date(session.check_in_at).getTime();
    const tick = () => setLiveSeconds(Math.floor((Date.now() - start) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [session?.id, session?.check_in_at, session?.status]);

  const handleCheckIn = async () => {
    if (!workMode) {
      setError("Please select work mode (Office, Remote, or Client Site)");
      return;
    }
    setError(null);
    setActionLoading(true);
    try {
      let lat: number | undefined;
      let lng: number | undefined;
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 5000,
          });
        });
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      } catch {
        // location optional
      }
      const res = await attendanceApi.checkIn({
        work_mode: workMode,
        location_lat: lat,
        location_lng: lng,
        device_info: getDeviceInfo(),
      });
      setSession(res.session);
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: string }).message)
          : "Check-in failed";
      const code =
        err &&
        typeof err === "object" &&
        "data" in err &&
        typeof (err as { data?: { code?: string } }).data?.code === "string"
          ? (err as { data: { code: string } }).data.code
          : "";
      setError(
        code === "ALREADY_CHECKED_IN"
          ? "You have already checked in today."
          : msg,
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setError(null);
    setActionLoading(true);
    try {
      const res = await attendanceApi.checkOut();
      setSession(res.session);
    } catch {
      setError("Check-out failed");
    } finally {
      setActionLoading(false);
    }
  };

  const now = new Date();
  const currentDateStr = now.toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const currentTimeStr = now.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  const statusLabel = !session
    ? "Not Logged In"
    : session.status === "logged_out"
      ? "Logged Out"
      : "Logged In";
  const statusColor = !session
    ? "bg-muted text-muted-foreground"
    : session.status === "logged_out"
      ? "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200"
      : "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300";

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-muted-foreground">Loading dashboard...</div>
      </div>
    );
  }

  const currentWorkModeLabel = session?.work_mode
    ? (WORK_MODES.find((m) => m.value === session.work_mode)?.label ??
      session.work_mode.replace("_", " "))
    : null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <Card>
          <CardContent className="py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">{currentDateStr}</p>
                  <p
                    className="text-xl font-semibold text-foreground tabular-nums"
                    suppressHydrationWarning
                  >
                    {currentTimeStr}
                  </p>
                </div>
                <Badge className={cn("text-sm px-3 py-1.5 shrink-0", statusColor)}>
                  {statusLabel}
                </Badge>
                {session &&
                  session.status !== "logged_out" &&
                  currentWorkModeLabel && (
                    <span className="flex items-center gap-1.5 text-sm text-muted-foreground shrink-0">
                      <Monitor className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{currentWorkModeLabel}</span>
                    </span>
                  )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {!session ? (
                  <>
                    <div className="flex rounded-md border border-input bg-background p-1 gap-0.5">
                      {WORK_MODES.map((mode) => {
                        const Icon = mode.icon;
                        return (
                          <button
                            key={mode.value}
                            type="button"
                            onClick={() => setWorkMode(mode.value)}
                            className={cn(
                              "rounded p-1.5 transition-colors",
                              workMode === mode.value
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground",
                            )}
                            title={mode.label}
                          >
                            <Icon className="h-4 w-4" />
                          </button>
                        );
                      })}
                    </div>
                    <Button
                      onClick={handleCheckIn}
                      disabled={actionLoading}
                      size="sm"
                      className="shrink-0"
                    >
                      <LogIn className="h-4 w-4 mr-1.5" />
                      {actionLoading ? "…" : "Log In"}
                    </Button>
                  </>
                ) : session.status === "logged_out" ? (
                  <span className="text-sm text-muted-foreground">
                    Logged out for today
                  </span>
                ) : (
                  <Button
                    size="sm"
                    className="bg-slate-600 hover:bg-slate-700 shrink-0"
                    onClick={handleCheckOut}
                    disabled={actionLoading}
                  >
                    <LogOut className="h-4 w-4 mr-1.5" />
                    Log Out
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {session && session.status !== "logged_out" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Today&apos;s Session
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Login time</p>
                  <p className="font-medium">{formatTime(session.check_in_at)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Work mode</p>
                  <p className="font-medium capitalize">
                    {session.work_mode.replace("_", " ")}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Session duration</p>
                  <p className="font-medium text-green-700 dark:text-green-400">
                    {formatDuration(liveSeconds)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {session && session.check_out_at && (
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Login time</p>
                  <p className="font-medium">{formatTime(session.check_in_at)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Logout time</p>
                  <p className="font-medium">{formatTime(session.check_out_at)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <WorkspaceDashboardMetrics
          assignedTasksCount={assignedTasksCount}
          completedTasksCount={completedTasksCount}
          sessions={sessions}
        />

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Planned tasks</CardTitle>
            <Button asChild variant="outline" size="sm">
              <Link href="/workspace/tasks">View all tasks</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {tasksLoading ? (
              <p className="text-sm text-muted-foreground">Loading planned tasks...</p>
            ) : taskError ? (
              <p className="text-sm text-destructive">{taskError}</p>
            ) : assignedTasksCount === 0 ? (
              <p className="text-sm text-muted-foreground">No tasks assigned.</p>
            ) : plannedTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No planned tasks right now.
              </p>
            ) : (
              <ul className="space-y-3">
                {plannedTasks.map((task) => (
                  <li
                    key={`${task.project_id}-${task.id}`}
                    className="flex items-start justify-between gap-3 border-b border-border pb-3 last:border-b-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="font-medium truncate">{task.title || "Untitled"}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {task.project_name}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-muted-foreground">
                        {task.end_date
                          ? new Date(task.end_date).toLocaleDateString()
                          : "No deadline"}
                      </p>
                      <Badge variant="secondary" className="mt-1">
                        {task.status || "pending"}
                      </Badge>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarClock className="h-4 w-4" />
              Quick links
            </CardTitle>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/workspace/attendance">Attendance history</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/workspace/tasks">Tasks</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
