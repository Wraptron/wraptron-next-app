"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { usePageTitle } from "@/contexts/page-title-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Building2,
  User,
  Briefcase,
  Trash2,
  GraduationCap,
  ClipboardCheck,
  CheckSquare,
  FileText,
  Calendar as CalendarIcon,
  CalendarDays,
  List,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  attendanceApi,
  employeesApi,
  employeeSkillsApi,
  type AttendanceSession,
  type Employee,
  type EmployeeSkillAssignment,
} from "@/lib/api";
import { workspaceSkillLevelDescription } from "@/lib/workspace-skill-levels";
import { EMPLOYEES_BASE_PATH, HR_SKILL_MATRIX_PATH } from "@/lib/employee-routes";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";

function displayName(e: Employee) {
  const parts = [e.first_name, e.middle_name, e.last_name].filter(Boolean);
  return parts.join(" ") || "—";
}

function statusLabel(status?: string) {
  const s = (status ?? "").toLowerCase();
  const map: Record<string, string> = {
    candidate: "Candidate",
    offered: "Offered",
    pre_onboarding: "Pre-Onboarding",
    active: "Active",
    notice_period: "Notice Period",
    exited: "Exited",
  };
  return map[s] ?? status ?? "—";
}

function statusClass(status?: string) {
  const s = (status ?? "").toLowerCase();
  if (s === "active") return "bg-green-100 text-green-800";
  if (s === "candidate" || s === "offered") return "bg-blue-100 text-blue-800";
  if (s === "pre_onboarding") return "bg-indigo-100 text-indigo-800";
  if (s === "notice_period") return "bg-amber-100 text-amber-800";
  if (s === "exited") return "bg-red-100 text-red-800";
  return "bg-muted text-muted-foreground";
}

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  if (value == null || value === "") return null;
  return (
    <div className="flex justify-between gap-4 py-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground text-right">{value}</span>
    </div>
  );
}

function formatAttendanceTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

function formatAttendanceDuration(seconds: number): string {
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

export default function EmployeeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string | undefined;
  const { user } = useAuth();
  const isAdmin = user?.role?.toLowerCase() === "admin";
  const { setTitle } = usePageTitle();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [skillAssignments, setSkillAssignments] = useState<EmployeeSkillAssignment[]>([]);
  const [skillsLoading, setSkillsLoading] = useState(true);
  const [attendanceSessions, setAttendanceSessions] = useState<AttendanceSession[]>([]);
  const [attendanceLoading, setAttendanceLoading] = useState(true);
  const [attendanceError, setAttendanceError] = useState<string | null>(null);
  const [attendanceView, setAttendanceView] = useState<AttendanceView>("list");
  const [calendarMonth, setCalendarMonth] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  useEffect(() => {
    if (!id) return;
    const numId = parseInt(id, 10);
    if (isNaN(numId)) {
      setError("Invalid employee ID");
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const data = await employeesApi.getById(numId);
        if (!cancelled) setEmployee(data);
      } catch (err) {
        if (!cancelled) setError("Failed to load employee");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const fetchAttendanceSessions = useCallback(async () => {
    if (!id) return;
    const numId = parseInt(id, 10);
    if (isNaN(numId)) return;
    try {
      setAttendanceLoading(true);
      setAttendanceError(null);
      const res = await attendanceApi.getEmployeeSessions(numId, { limit: 90 });
      setAttendanceSessions(res.sessions ?? []);
    } catch {
      setAttendanceSessions([]);
      setAttendanceError("Failed to load attendance records.");
    } finally {
      setAttendanceLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchAttendanceSessions();
  }, [fetchAttendanceSessions]);

  useEffect(() => {
    if (!id) return;
    const numId = parseInt(id, 10);
    if (isNaN(numId)) return;
    let cancelled = false;
    setSkillsLoading(true);
    (async () => {
      try {
        const res = await employeeSkillsApi.getForEmployee(numId);
        if (!cancelled) setSkillAssignments(res.assignments ?? []);
      } catch {
        if (!cancelled) setSkillAssignments([]);
      } finally {
        if (!cancelled) setSkillsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (employee) setTitle(displayName(employee));
    return () => setTitle(null);
  }, [employee, setTitle]);

  const handleDelete = async () => {
    if (!employee) return;
    if (
      !confirm(
        `Remove ${displayName(employee)} from the directory? They will be hidden from all employee lists.`,
      )
    ) {
      return;
    }
    try {
      await employeesApi.delete(employee.id);
      router.push(EMPLOYEES_BASE_PATH);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete employee";
      alert(message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground p-8 flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="min-h-screen bg-background text-foreground p-8">
        <div className="max-w-3xl mx-auto">
          <p className="text-red-600">{error ?? "Employee not found."}</p>
          <Button variant="outline" className="mt-4" asChild>
            <Link href={EMPLOYEES_BASE_PATH}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Employees
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const attendanceByDate = attendanceSessions.reduce<Record<string, AttendanceSession[]>>(
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
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <Button variant="ghost" size="sm" asChild>
            <Link href={EMPLOYEES_BASE_PATH}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Employees
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Button
                variant="outline"
                className="text-destructive border-destructive/60 hover:bg-destructive/10"
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}
            <Button asChild>
              <Link href={`${EMPLOYEES_BASE_PATH}/${employee.id}/edit`}>
              Edit
              </Link>
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-start gap-6">
              <Avatar className="h-20 w-20">
                <AvatarImage
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(displayName(employee))}&background=random`}
                />
                <AvatarFallback className="text-xl">
                  {employee.first_name?.charAt(0) ?? "?"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold text-foreground">
                  {displayName(employee)}
                </h1>
                <p className="text-muted-foreground mt-0.5">
                  {employee.designation || employee.role || "—"}
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {employee.department && (
                    <span className="inline-flex items-center gap-1 text-sm px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                      <Building2 className="h-3.5 w-3.5" />
                      {employee.department}
                    </span>
                  )}
                  <span
                    className={`inline-flex items-center text-sm px-2.5 py-0.5 rounded-full ${statusClass(employee.employment_status)}`}
                  >
                    {statusLabel(employee.employment_status)}
                  </span>
                  {employee.emp_code && (
                    <span className="text-sm text-muted-foreground">
                      Code: {employee.emp_code}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="payslips">Payslips</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6 space-y-6">
            <Card>
              <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  Skills
                </CardTitle>
                <Button variant="outline" size="sm" asChild>
                  <Link href={HR_SKILL_MATRIX_PATH}>Skill matrix</Link>
                </Button>
              </CardHeader>
              <CardContent>
                {skillsLoading ? (
                  <p className="text-sm text-muted-foreground">Loading skills...</p>
                ) : skillAssignments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No skill levels recorded. Assign skills on the{" "}
                    <Link href={HR_SKILL_MATRIX_PATH} className="text-blue-600 underline">
                      skill matrix
                    </Link>
                    .
                  </p>
                ) : (
                  <ul className="divide-y divide-border rounded-md border border-border bg-card">
                    {skillAssignments.map((a) => (
                      <li
                        key={a.skill_id}
                        className="flex flex-wrap justify-between gap-2 px-3 py-2 text-sm"
                      >
                        <span className="font-medium text-foreground">{a.skill_name}</span>
                        <span className="text-muted-foreground">{workspaceSkillLevelDescription(a.level)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Contact
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  <DetailRow label="Email" value={employee.email} />
                  <DetailRow label="Personal email" value={employee.personal_email} />
                  <DetailRow label="Phone" value={employee.phone} />
                  <DetailRow label="Work phone" value={employee.work_phone} />
                  <DetailRow label="GitHub" value={employee.github_username} />
                  <DetailRow label="Location" value={employee.location} />
                  {!employee.email && !employee.phone && !employee.personal_email && !employee.work_phone && !employee.location && (
                    <p className="text-sm text-muted-foreground py-2">No contact details</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    Employment
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  <DetailRow label="Status" value={statusLabel(employee.employment_status)} />
                  <DetailRow
                    label="Type"
                    value={
                      employee.employment_type
                        ? employee.employment_type.replace("_", " ")
                        : undefined
                    }
                  />
                  <DetailRow
                    label="Join date"
                    value={employee.join_date ? new Date(employee.join_date).toLocaleDateString() : undefined}
                  />
                  {(employee.employment_status === "notice_period" ||
                    employee.employment_status === "exited") && (
                    <DetailRow
                      label="Exit date"
                      value={employee.exit_date ? new Date(employee.exit_date).toLocaleDateString() : undefined}
                    />
                  )}
                  <DetailRow label="Department" value={employee.department} />
                  <DetailRow label="Designation" value={employee.designation} />
                  <DetailRow label="Role" value={employee.role} />
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Personal & other</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <DetailRow
                    label="Date of birth"
                    value={
                      employee.date_of_birth
                        ? new Date(employee.date_of_birth).toLocaleDateString()
                        : undefined
                    }
                  />
                  <DetailRow label="Gender" value={employee.gender} />
                  <DetailRow label="Blood group" value={employee.bloodgroup} />
                  <DetailRow label="Marital status" value={employee.marital_status} />
                  <DetailRow label="Father name" value={employee.father_name} />
                </div>
                {(employee.present_address || employee.permanent_address) && (
                  <div className="space-y-1 pt-2 border-t">
                    <DetailRow label="Present address" value={employee.present_address} />
                    <DetailRow label="Permanent address" value={employee.permanent_address} />
                  </div>
                )}
                {(employee.e_contact || employee.qualification) && (
                  <div className="space-y-1 pt-2 border-t">
                    <DetailRow label="Emergency contact" value={employee.e_contact} />
                    <DetailRow label="Qualification" value={employee.qualification} />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="attendance" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <ClipboardCheck className="h-4 w-4" />
                    Attendance
                  </CardTitle>
                  <div className="inline-flex items-center rounded-md border border-input bg-muted p-1">
                    <Button
                      type="button"
                      variant={attendanceView === "list" ? "secondary" : "ghost"}
                      size="sm"
                      className="h-7 px-2"
                      onClick={() => setAttendanceView("list")}
                    >
                      <List className="h-3.5 w-3.5 mr-1.5" />
                      List
                    </Button>
                    <Button
                      type="button"
                      variant={attendanceView === "calendar" ? "secondary" : "ghost"}
                      size="sm"
                      className="h-7 px-2"
                      onClick={() => setAttendanceView("calendar")}
                    >
                      <CalendarDays className="h-3.5 w-3.5 mr-1.5" />
                      Calendar
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {attendanceLoading ? (
                  <p className="text-sm text-muted-foreground">Loading attendance records...</p>
                ) : attendanceError ? (
                  <div className="space-y-3">
                    <p className="text-sm text-red-600">{attendanceError}</p>
                    <Button variant="outline" size="sm" onClick={fetchAttendanceSessions}>
                      Retry
                    </Button>
                  </div>
                ) : attendanceSessions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No attendance records yet.</p>
                ) : attendanceView === "list" ? (
                  <ul className="space-y-3">
                    {attendanceSessions.map((s) => {
                      const dateLabel = new Date(s.date).toLocaleDateString("en-IN", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      });
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
                            <span className="font-medium text-foreground">{dateLabel}</span>
                            <span className="text-muted-foreground ml-2 capitalize">
                              {s.work_mode.replace("_", " ")}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 tabular-nums">
                            <span className="text-muted-foreground">
                              {formatAttendanceTime(s.check_in_at)} -{" "}
                              {s.check_out_at ? formatAttendanceTime(s.check_out_at) : "—"}
                            </span>
                            {duration != null && duration >= 0 && (
                              <span className="text-green-700 font-medium">
                                {formatAttendanceDuration(duration)}
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
                            (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1),
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
                            (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1),
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
                        const daySessions = attendanceByDate[dateKey] ?? [];
                        return (
                          <div
                            key={dateKey}
                            className={cn(
                              "min-h-24 rounded-lg border p-2",
                              daySessions.length > 0
                                ? "border-green-200 bg-green-50/60"
                                : "border-border bg-card",
                            )}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-foreground">{day}</span>
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
                                        1000,
                                    )
                                  : null;
                                return (
                                  <div
                                    key={s.id}
                                    className="rounded border border-border bg-card/90 px-1.5 py-1 text-[10px]"
                                  >
                                    <p className="truncate capitalize text-foreground">
                                      {s.work_mode.replace("_", " ")}
                                    </p>
                                    <p className="truncate text-muted-foreground">
                                      {formatAttendanceTime(s.check_in_at)} -{" "}
                                      {s.check_out_at
                                        ? formatAttendanceTime(s.check_out_at)
                                        : "—"}
                                    </p>
                                    {duration != null && duration >= 0 && (
                                      <p className="text-green-700">
                                        {formatAttendanceDuration(duration)}
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
          </TabsContent>

          <TabsContent value="tasks" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckSquare className="h-4 w-4" />
                  Tasks
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Track assigned work items and completion status from the project tasks module.
                </p>
                <Button variant="outline" asChild>
                  <Link href="/projects/tasks">Open tasks</Link>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payslips" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Payslips
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Access salary statements and payroll history from the payslips workspace module.
                </p>
                <Button variant="outline" asChild>
                  <Link href="/workspace/payslips">Open payslips</Link>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

    </div>
  );
}
