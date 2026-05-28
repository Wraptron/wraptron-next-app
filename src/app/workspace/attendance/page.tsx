"use client";

import React, { useEffect, useState, useCallback } from "react";
import { usePageTitle } from "@/contexts/page-title-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Calendar as CalendarIcon,
  CalendarDays,
  List,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  attendanceApi,
  type AttendanceSession,
} from "@/lib/api";
import { cn } from "@/lib/utils";

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

function getMonthGrid(month: Date): {
  leadingEmptyDays: number;
  daysInMonth: number;
} {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const leadingEmptyDays = firstDay.getDay();
  const daysInMonth = new Date(
    month.getFullYear(),
    month.getMonth() + 1,
    0,
  ).getDate();
  return { leadingEmptyDays, daysInMonth };
}

type AttendanceView = "list" | "calendar";

export default function AttendancePage() {
  const { setTitle } = usePageTitle();
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [view, setView] = useState<AttendanceView>("list");
  const [calendarMonth, setCalendarMonth] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  useEffect(() => {
    setTitle("Attendance");
    return () => setTitle(null);
  }, [setTitle]);

  const fetchSessions = useCallback(async () => {
    try {
      const res = await attendanceApi.getMySessions({ limit: 30 });
      setSessions(res.sessions);
    } catch {
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-muted-foreground">Loading attendance...</div>
      </div>
    );
  }

  const sessionsByDate = sessions.reduce<Record<string, AttendanceSession[]>>(
    (acc, s) => {
      acc[s.date] = [...(acc[s.date] ?? []), s];
      return acc;
    },
    {},
  );
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const { leadingEmptyDays, daysInMonth } = getMonthGrid(calendarMonth);
  const calendarCells = Array.from(
    { length: leadingEmptyDays + daysInMonth },
    (_, idx) => idx,
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Attendance</h1>
            <p className="text-muted-foreground mt-1">
              View your attendance history
            </p>
          </div>
        </div>

        <div className="space-y-6">
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
                <p className="text-sm text-muted-foreground">
                  No attendance records yet.
                </p>
              ) : view === "list" ? (
                <ul className="space-y-3">
                  {sessions.map((s) => {
                    const dateLabel = new Date(s.date).toLocaleDateString(
                      "en-IN",
                      {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      },
                    );
                    const duration = s.check_out_at
                      ? Math.floor(
                          (new Date(s.check_out_at).getTime() -
                            new Date(s.check_in_at).getTime()) /
                            1000,
                        )
                      : null;
                    return (
                      <li
                        key={s.id}
                        className="flex flex-wrap items-center justify-between gap-2 border-b border-border py-2 text-sm last:border-0"
                      >
                        <div>
                          <span className="font-medium text-foreground">
                            {dateLabel}
                          </span>
                          <span className="text-muted-foreground ml-2 capitalize">
                            {s.work_mode.replace("_", " ")}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 tabular-nums">
                          <span className="text-muted-foreground">
                            {formatTime(s.check_in_at)} –{" "}
                            {s.check_out_at ? formatTime(s.check_out_at) : "—"}
                          </span>
                          {duration != null && duration >= 0 && (
                            <span className="font-medium text-green-700 dark:text-green-400">
                              {formatDuration(duration)}
                            </span>
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
                          (prev) =>
                            new Date(
                              prev.getFullYear(),
                              prev.getMonth() - 1,
                              1,
                            ),
                        )
                      }
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Prev
                    </Button>
                    <p className="text-sm font-medium text-foreground">
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
                          (prev) =>
                            new Date(
                              prev.getFullYear(),
                              prev.getMonth() + 1,
                              1,
                            ),
                        )
                      }
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-7 gap-2 text-xs">
                    {weekDays.map((day) => (
                      <div
                        key={day}
                        className="px-2 py-1 text-center font-medium text-muted-foreground"
                      >
                        {day}
                      </div>
                    ))}
                    {calendarCells.map((cell) => {
                      if (cell < leadingEmptyDays) {
                        return (
                          <div
                            key={`empty-${cell}`}
                            className="min-h-24 rounded-lg border border-transparent"
                          />
                        );
                      }
                      const day = cell - leadingEmptyDays + 1;
                      const dateObj = new Date(
                        calendarMonth.getFullYear(),
                        calendarMonth.getMonth(),
                        day,
                      );
                      const dateKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                      const daySessions = sessionsByDate[dateKey] ?? [];
                      return (
                        <div
                          key={dateKey}
                          className={cn(
                            "min-h-24 rounded-lg border p-2",
                            daySessions.length > 0
                              ? "border-green-200 bg-green-500/10 dark:border-green-900 dark:bg-green-950/40"
                              : "border-border bg-card",
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-foreground">
                              {day}
                            </span>
                            {daySessions.length > 0 && (
                              <span className="rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-medium text-green-700 dark:bg-green-950 dark:text-green-300">
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
                                      1000,
                                  )
                                : null;
                              return (
                                <div
                                  key={s.id}
                                  className="rounded border border-border bg-card/90 px-1.5 py-1 text-[10px]"
                                >
                                  <p className="truncate text-foreground capitalize">
                                    {s.work_mode.replace("_", " ")}
                                  </p>
                                  <p className="truncate text-muted-foreground">
                                    {formatTime(s.check_in_at)} -{" "}
                                    {s.check_out_at
                                      ? formatTime(s.check_out_at)
                                      : "—"}
                                  </p>
                                  {duration != null && duration >= 0 && (
                                    <p className="text-green-700 dark:text-green-400">
                                      {formatDuration(duration)}
                                    </p>
                                  )}
                                </div>
                              );
                            })}
                            {daySessions.length > 2 && (
                              <p className="text-[10px] text-muted-foreground">
                                +{daySessions.length - 2} more
                              </p>
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
