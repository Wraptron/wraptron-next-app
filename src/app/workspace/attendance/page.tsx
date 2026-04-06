"use client";

import React, { useEffect, useState, useCallback } from "react";
import { usePageTitle } from "@/contexts/page-title-context";
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
  Calendar as CalendarIcon,
  CalendarDays,
  List,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { attendanceApi, type AttendanceSession, type WorkMode } from "@/lib/api";
import { cn } from "@/lib/utils";

const WORK_MODES: { value: WorkMode; label: string; icon: React.ElementType }[] = [
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

function getMonthGrid(month: Date): { leadingEmptyDays: number; daysInMonth: number } {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const leadingEmptyDays = firstDay.getDay();
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  return { leadingEmptyDays, daysInMonth };
}

type AttendanceView = "list" | "calendar";

function getDeviceInfo(): Record<string, unknown> {
  if (typeof navigator === "undefined") return {};
  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    screen: `${window.screen?.width ?? 0}x${window.screen?.height ?? 0}`,
  };
}

export default function AttendancePage() {
  const { setTitle } = usePageTitle();
  const [session, setSession] = useState<AttendanceSession | null>(null);
  const [today, setToday] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [workMode, setWorkMode] = useState<WorkMode | null>(null);
  const [liveSeconds, setLiveSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [view, setView] = useState<AttendanceView>("list");
  const [calendarMonth, setCalendarMonth] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const fetchToday = useCallback(async () => {
    try {
      const res = await attendanceApi.getMyToday();
      setSession(res.session);
      setToday(res.today);
    } catch (err) {
      setError("Failed to load attendance");
      setSession(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setTitle("Attendance");
    return () => setTitle(null);
  }, [setTitle]);

  useEffect(() => {
    fetchToday();
  }, [fetchToday]);

  const fetchSessions = useCallback(async () => {
    try {
      const res = await attendanceApi.getMySessions({ limit: 30 });
      setSessions(res.sessions);
    } catch {
      setSessions([]);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Live timer: session duration
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
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
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
      const msg = err && typeof err === "object" && "message" in err ? String((err as { message: string }).message) : "Check-in failed";
      const code = err && typeof err === "object" && "data" in err && typeof (err as { data?: { code?: string } }).data?.code === "string"
        ? (err as { data: { code: string } }).data.code
        : "";
      setError(code === "ALREADY_CHECKED_IN" ? "You have already checked in today." : msg);
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
  const currentDateStr = now.toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const currentTimeStr = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });

  const statusLabel =
    !session ? "Not Logged In" : session.status === "logged_out" ? "Logged Out" : "Logged In";
  const statusColor =
    !session ? "bg-gray-100 text-gray-800" : session.status === "logged_out" ? "bg-slate-100 text-slate-800" : "bg-green-100 text-green-800";

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading attendance...</div>
      </div>
    );
  }

  const currentWorkModeLabel = session?.work_mode
    ? WORK_MODES.find((m) => m.value === session.work_mode)?.label ?? session.work_mode.replace("_", " ")
    : null;

  const sessionsByDate = sessions.reduce<Record<string, AttendanceSession[]>>((acc, s) => {
    acc[s.date] = [...(acc[s.date] ?? []), s];
    return acc;
  }, {});
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const { leadingEmptyDays, daysInMonth } = getMonthGrid(calendarMonth);
  const calendarCells = Array.from({ length: leadingEmptyDays + daysInMonth }, (_, idx) => idx);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
            <p className="text-gray-600 mt-1">Check in, track your session and view history</p>
          </div>
        </div>

        <div className="space-y-6">
        {/* Single bar: time (left) + status + work mode when logged in + login/logout controls (right) */}
        <Card>
          <CardContent className="py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-xs text-gray-500">{currentDateStr}</p>
                  <p className="text-xl font-semibold text-gray-900 tabular-nums" suppressHydrationWarning>
                    {currentTimeStr}
                  </p>
                </div>
                <Badge className={cn("text-sm px-3 py-1.5 shrink-0", statusColor)}>{statusLabel}</Badge>
                {session && session.status !== "logged_out" && currentWorkModeLabel && (
                  <span className="flex items-center gap-1.5 text-sm text-gray-600 shrink-0">
                    <Monitor className="h-4 w-4 text-gray-400" />
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
                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                            title={mode.label}
                          >
                            <Icon className="h-4 w-4" />
                          </button>
                        );
                      })}
                    </div>
                    <Button onClick={handleCheckIn} disabled={actionLoading} size="sm" className="shrink-0">
                      <LogIn className="h-4 w-4 mr-1.5" />
                      {actionLoading ? "…" : "Log In"}
                    </Button>
                  </>
                ) : session.status === "logged_out" ? (
                  <span className="text-sm text-gray-500">Logged out for today</span>
                ) : (
                  <Button size="sm" className="bg-slate-600 hover:bg-slate-700 shrink-0" onClick={handleCheckOut} disabled={actionLoading}>
                    <LogOut className="h-4 w-4 mr-1.5" />
                    Log Out
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {/* Live timer section */}
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
                  <p className="text-gray-500">Login time</p>
                  <p className="font-medium">{formatTime(session.check_in_at)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Work mode</p>
                  <p className="font-medium capitalize">{session.work_mode.replace("_", " ")}</p>
                </div>
                <div>
                  <p className="text-gray-500">Session duration</p>
                  <p className="font-medium text-green-700">{formatDuration(liveSeconds)}</p>
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
                  <p className="text-gray-500">Login time</p>
                  <p className="font-medium">{formatTime(session.check_in_at)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Logout time</p>
                  <p className="font-medium">{formatTime(session.check_out_at)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* List of attendances */}
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
              Attendance history
              </CardTitle>
              <div className="inline-flex items-center rounded-md border border-input bg-muted p-1">
                <Button
                  type="button"
                  variant={view === "list" ? "secondary" : "ghost"}
                  size="sm"
                  className="h-7 px-2"
                  onClick={() => setView("list")}
                >
                  <List className="h-3.5 w-3.5 mr-1.5" />
                  List
                </Button>
                <Button
                  type="button"
                  variant={view === "calendar" ? "secondary" : "ghost"}
                  size="sm"
                  className="h-7 px-2"
                  onClick={() => setView("calendar")}
                >
                  <CalendarDays className="h-3.5 w-3.5 mr-1.5" />
                  Calendar
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {sessions.length === 0 ? (
              <p className="text-sm text-gray-500">No attendance records yet.</p>
            ) : view === "list" ? (
              <ul className="space-y-3">
                {sessions.map((s) => {
                  const dateLabel = new Date(s.date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
                  const duration = s.check_out_at
                    ? Math.floor((new Date(s.check_out_at).getTime() - new Date(s.check_in_at).getTime()) / 1000)
                    : null;
                  return (
                    <li
                      key={s.id}
                      className="flex flex-wrap items-center justify-between gap-2 py-2 border-b border-gray-100 last:border-0 text-sm"
                    >
                      <div>
                        <span className="font-medium text-gray-900">{dateLabel}</span>
                        <span className="text-gray-500 ml-2 capitalize">{s.work_mode.replace("_", " ")}</span>
                      </div>
                      <div className="flex items-center gap-4 tabular-nums">
                        <span className="text-gray-600">{formatTime(s.check_in_at)} – {s.check_out_at ? formatTime(s.check_out_at) : "—"}</span>
                        {duration != null && duration >= 0 && (
                          <span className="text-green-700 font-medium">{formatDuration(duration)}</span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCalendarMonth(
                        (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
                      )
                    }
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Prev
                  </Button>
                  <p className="text-sm font-medium text-gray-900">
                    {calendarMonth.toLocaleDateString("en-IN", {
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCalendarMonth(
                        (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
                      )
                    }
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
                <div className="grid grid-cols-7 gap-2 text-xs">
                  {weekDays.map((day) => (
                    <div key={day} className="px-2 py-1 text-center font-medium text-gray-500">
                      {day}
                    </div>
                  ))}
                  {calendarCells.map((cell) => {
                    if (cell < leadingEmptyDays) {
                      return <div key={`empty-${cell}`} className="min-h-24 rounded-lg border border-transparent" />;
                    }
                    const day = cell - leadingEmptyDays + 1;
                    const dateObj = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);
                    const dateKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                    const daySessions = sessionsByDate[dateKey] ?? [];
                    return (
                      <div
                        key={dateKey}
                        className={cn(
                          "min-h-24 rounded-lg border p-2",
                          daySessions.length > 0 ? "border-green-200 bg-green-50/60" : "border-gray-100 bg-white"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-900">{day}</span>
                          {daySessions.length > 0 && (
                            <span className="rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-medium text-green-700">
                              {daySessions.length}
                            </span>
                          )}
                        </div>
                        <div className="mt-1 space-y-1">
                          {daySessions.slice(0, 2).map((s) => {
                            const duration = s.check_out_at
                              ? Math.floor(
                                  (new Date(s.check_out_at).getTime() -
                                    new Date(s.check_in_at).getTime()) /
                                    1000
                                )
                              : null;
                            return (
                              <div key={s.id} className="rounded bg-white/80 px-1.5 py-1 text-[10px]">
                                <p className="truncate text-gray-700 capitalize">{s.work_mode.replace("_", " ")}</p>
                                <p className="truncate text-gray-600">
                                  {formatTime(s.check_in_at)} -{" "}
                                  {s.check_out_at ? formatTime(s.check_out_at) : "—"}
                                </p>
                                {duration != null && duration >= 0 && (
                                  <p className="text-green-700">{formatDuration(duration)}</p>
                                )}
                              </div>
                            );
                          })}
                          {daySessions.length > 2 && (
                            <p className="text-[10px] text-gray-500">+{daySessions.length - 2} more</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
}
