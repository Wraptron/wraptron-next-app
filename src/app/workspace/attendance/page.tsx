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
  Coffee,
  FileSpreadsheet,
  Users,
  FileBarChart,
} from "lucide-react";
import Link from "next/link";
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
  const [breakSeconds, setBreakSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);

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

  // Live timer: session duration and break duration
  useEffect(() => {
    if (!session || session.status === "logged_out") return;
    const start = new Date(session.check_in_at).getTime();
    const totalBreak = session.total_break_seconds || 0;
    const tick = () => {
      const now = Date.now();
      setLiveSeconds(Math.floor((now - start) / 1000));
      if (session.status === "break" && session.break_start_at) {
        const breakStart = new Date(session.break_start_at).getTime();
        setBreakSeconds(totalBreak + Math.floor((now - breakStart) / 1000));
      } else {
        setBreakSeconds(totalBreak);
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [session?.id, session?.check_in_at, session?.status, session?.break_start_at, session?.total_break_seconds]);

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

  const handleBreakStart = async () => {
    setError(null);
    setActionLoading(true);
    try {
      const res = await attendanceApi.breakStart();
      setSession(res.session);
    } catch {
      setError("Failed to start break");
    } finally {
      setActionLoading(false);
    }
  };

  const handleBreakEnd = async () => {
    setError(null);
    setActionLoading(true);
    try {
      const res = await attendanceApi.breakEnd();
      setSession(res.session);
    } catch {
      setError("Failed to end break");
    } finally {
      setActionLoading(false);
    }
  };

  const now = new Date();
  const currentDateStr = now.toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const currentTimeStr = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });

  const statusLabel =
    !session ? "Not Logged In" : session.status === "logged_out" ? "Logged Out" : session.status === "break" ? "Break" : "Logged In";
  const statusColor =
    !session ? "bg-gray-100 text-gray-800" : session.status === "logged_out" ? "bg-slate-100 text-slate-800" : session.status === "break" ? "bg-amber-100 text-amber-800" : "bg-green-100 text-green-800";

  const netWorkingSeconds = session ? Math.max(0, liveSeconds - (session.status === "break" && session.break_start_at ? breakSeconds : (session.total_break_seconds || 0))) : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8 flex items-center justify-center">
        <div className="text-gray-500">Loading attendance...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-lg mx-auto space-y-6">
        <div className="flex flex-wrap gap-2 justify-center">
          <Link href="/workspace/attendance/manager">
            <Button variant="outline" size="sm">
              <Users className="h-4 w-4 mr-1" />
              Manager view
            </Button>
          </Link>
          <Link href="/workspace/attendance/hr">
            <Button variant="outline" size="sm">
              <FileBarChart className="h-4 w-4 mr-1" />
              HR view
            </Button>
          </Link>
        </div>
        {/* Date & time (left) and status (right) */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm text-gray-500">{currentDateStr}</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1" suppressHydrationWarning>
                  {currentTimeStr}
                </p>
              </div>
              <Badge className={cn("text-sm px-4 py-2 shrink-0", statusColor)}>{statusLabel}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Work mode (only when not logged in) */}
        {!session && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Monitor className="h-4 w-4" />
                Work Mode
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-3">Select work mode (required to check in)</p>
              <div className="grid grid-cols-3 gap-2">
                {WORK_MODES.map((mode) => {
                  const Icon = mode.icon;
                  return (
                    <Button
                      key={mode.value}
                      type="button"
                      variant={workMode === mode.value ? "default" : "outline"}
                      className="flex flex-col h-auto py-3 gap-1"
                      onClick={() => setWorkMode(mode.value)}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="text-xs">{mode.label}</span>
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {/* Big center button */}
        <Card>
          <CardContent className="pt-6 pb-6 flex flex-col items-center gap-4">
            {!session ? (
              <Button
                size="lg"
                className="w-full max-w-xs h-14 text-lg"
                onClick={handleCheckIn}
                disabled={actionLoading}
              >
                <LogIn className="h-5 w-5 mr-2" />
                {actionLoading ? "Checking in…" : "Log In"}
              </Button>
            ) : session.status === "logged_out" ? (
              <p className="text-gray-500 text-sm">You are logged out for today.</p>
            ) : session.status === "break" ? (
              <Button
                size="lg"
                className="w-full max-w-xs h-14 text-lg bg-amber-600 hover:bg-amber-700"
                onClick={handleBreakEnd}
                disabled={actionLoading}
              >
                <Coffee className="h-5 w-5 mr-2" />
                {actionLoading ? "Ending break…" : "End Break"}
              </Button>
            ) : (
              <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
                <Button
                  size="lg"
                  variant="outline"
                  className="flex-1 h-14"
                  onClick={handleBreakStart}
                  disabled={actionLoading}
                >
                  <Coffee className="h-5 w-5 mr-2" />
                  Start Break
                </Button>
                <Button
                  size="lg"
                  className="flex-1 h-14 bg-slate-600 hover:bg-slate-700"
                  onClick={handleCheckOut}
                  disabled={actionLoading}
                >
                  <LogOut className="h-5 w-5 mr-2" />
                  Log Out
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

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
                <div>
                  <p className="text-gray-500">Break duration</p>
                  <p className="font-medium text-amber-700">
                    {formatDuration(session.status === "break" ? breakSeconds : session.total_break_seconds || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Net working hours</p>
                  <p className="font-medium">{formatDuration(netWorkingSeconds)}</p>
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
                <div>
                  <p className="text-gray-500">Total break</p>
                  <p className="font-medium">{formatDuration(session.total_break_seconds || 0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Add timesheet */}
        <div className="flex justify-center">
          <Button variant="outline" asChild>
            <a href="/workspace/attendance/timesheet">
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Add timesheet
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
