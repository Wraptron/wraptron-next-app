"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  ArrowUpDown,
  Calendar as CalendarIcon,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  FileSpreadsheet,
  Filter,
  Loader2,
  Plane,
  RefreshCw,
  Search,
  ShieldAlert,
  UserCheck,
  Users,
  XCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  leavesApi,
  type LeaveRequest,
  type LeaveStatus,
  type LeaveType,
} from "@/lib/api";
import { useOrganization } from "@/contexts/organization-context";
import { useAuth } from "@/contexts/auth-context";
import { HR_CALENDAR_PATH } from "@/lib/employee-routes";

const MONTHS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

const LEAVE_TYPES: { value: string; label: string }[] = [
  { value: "all", label: "All leave types" },
  { value: "casual", label: "Casual leave" },
  { value: "sick", label: "Sick leave" },
  { value: "earned", label: "Earned / privilege" },
  { value: "unpaid", label: "Unpaid leave" },
  { value: "compensatory", label: "Compensatory off" },
];

type SortField =
  | "start_date"
  | "end_date"
  | "employee_name"
  | "days"
  | "status"
  | "leave_type"
  | "created_at";

type SortOrder = "asc" | "desc";

function normalizeIsoDate(value: string | undefined | null): string {
  if (!value) return "";
  const match = String(value).match(/^(\d{4}-\d{2}-\d{2})/);
  return match?.[1] ?? String(value).slice(0, 10);
}

function isoToday(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(isoDateStr: string): string {
  if (!isoDateStr) return "—";
  const [y, m, d] = isoDateStr.split("-").map((v) => parseInt(v, 10));
  if (!y || !m || !d) return isoDateStr;
  const dateObj = new Date(y, m - 1, d);
  return dateObj.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getInitials(name: string): string {
  if (!name) return "EM";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function statusBadgeClass(status: LeaveStatus): string {
  if (status === "approved") {
    return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30";
  }
  if (status === "pending") {
    return "bg-violet-500/15 text-violet-700 dark:text-violet-400 border-violet-500/30";
  }
  if (status === "rejected") {
    return "bg-destructive/10 text-destructive border-destructive/20";
  }
  return "bg-muted text-muted-foreground border-border";
}

function leaveTypeBadgeClass(type: string): string {
  switch (type.toLowerCase()) {
    case "casual":
      return "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30";
    case "sick":
      return "bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30";
    case "earned":
      return "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30";
    case "unpaid":
      return "bg-slate-500/15 text-slate-700 dark:text-slate-400 border-slate-500/30";
    case "compensatory":
      return "bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border-indigo-500/30";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

function leaveCoversDate(leave: LeaveRequest, targetDate: string): boolean {
  const start = normalizeIsoDate(leave.start_date);
  const end = normalizeIsoDate(leave.end_date);
  return start <= targetDate && end >= targetDate;
}

export function HrLeaveReports() {
  const { activeOrg, isOwner, isSuperAdmin, roleName } = useOrganization();
  const { user, loading: authLoading } = useAuth();
  const isAdmin =
    isOwner ||
    isSuperAdmin ||
    roleName?.toLowerCase() === "admin" ||
    user?.role?.toLowerCase() === "admin" ||
    user?.global_role?.toLowerCase() === "super_admin";

  const now = useMemo(() => new Date(), []);
  const [selectedYear, setSelectedYear] = useState<string>(
    now.getFullYear().toString(),
  );
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Inspector selected date
  const [inspectDate, setInspectDate] = useState<string>(isoToday());

  // Sorting
  const [sortField, setSortField] = useState<SortField>("start_date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  // Data
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const yearOptions = useMemo(() => {
    const cur = now.getFullYear();
    return [
      { value: "all", label: "All years" },
      { value: (cur - 1).toString(), label: `${cur - 1}` },
      { value: cur.toString(), label: `${cur} (Current)` },
      { value: (cur + 1).toString(), label: `${cur + 1}` },
      { value: (cur + 2).toString(), label: `${cur + 2}` },
    ];
  }, [now]);

  const loadLeaves = useCallback(async () => {
    if (!isAdmin) return;
    setLoading(true);
    setError(null);
    try {
      const yearNum =
        selectedYear !== "all" ? parseInt(selectedYear, 10) : undefined;
      const monthNum =
        selectedMonth !== "all" ? parseInt(selectedMonth, 10) : undefined;
      const res = await leavesApi.list({
        year: yearNum,
        month: monthNum,
      });
      setLeaves(res.leaves || []);
    } catch (err) {
      console.error("Failed to load leaves:", err);
      setError("Failed to load leave requests report.");
      setLeaves([]);
    } finally {
      setLoading(false);
    }
  }, [selectedYear, selectedMonth, isAdmin]);

  useEffect(() => {
    if (isAdmin) {
      void loadLeaves();
    }
  }, [loadLeaves, isAdmin]);

  // Date inspector navigation
  const handlePrevDay = () => {
    const [y, m, d] = inspectDate.split("-").map((v) => parseInt(v, 10));
    const dateObj = new Date(y, m - 1, d);
    dateObj.setDate(dateObj.getDate() - 1);
    const nextY = dateObj.getFullYear();
    const nextM = String(dateObj.getMonth() + 1).padStart(2, "0");
    const nextD = String(dateObj.getDate()).padStart(2, "0");
    setInspectDate(`${nextY}-${nextM}-${nextD}`);
  };

  const handleNextDay = () => {
    const [y, m, d] = inspectDate.split("-").map((v) => parseInt(v, 10));
    const dateObj = new Date(y, m - 1, d);
    dateObj.setDate(dateObj.getDate() + 1);
    const nextY = dateObj.getFullYear();
    const nextM = String(dateObj.getMonth() + 1).padStart(2, "0");
    const nextD = String(dateObj.getDate()).padStart(2, "0");
    setInspectDate(`${nextY}-${nextM}-${nextD}`);
  };

  const handleToday = () => {
    setInspectDate(isoToday());
  };

  // Leaves on the specific inspected date
  const employeesOnDate = useMemo(() => {
    return leaves.filter(
      (leave) =>
        leaveCoversDate(leave, inspectDate) &&
        (leave.status === "approved" || leave.status === "pending"),
    );
  }, [leaves, inspectDate]);

  const approvedOnDate = useMemo(
    () => employeesOnDate.filter((l) => l.status === "approved"),
    [employeesOnDate],
  );

  const pendingOnDate = useMemo(
    () => employeesOnDate.filter((l) => l.status === "pending"),
    [employeesOnDate],
  );

  // Filtered leaves for the main table report
  const filteredLeaves = useMemo(() => {
    let result = [...leaves];

    if (statusFilter !== "all") {
      result = result.filter((l) => l.status === statusFilter);
    }

    if (typeFilter !== "all") {
      result = result.filter(
        (l) => l.leave_type?.toLowerCase() === typeFilter.toLowerCase(),
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (l) =>
          l.employee_name?.toLowerCase().includes(q) ||
          l.employee_email?.toLowerCase().includes(q) ||
          l.reason?.toLowerCase().includes(q) ||
          l.reviewer_name?.toLowerCase().includes(q) ||
          l.review_comment?.toLowerCase().includes(q),
      );
    }

    // Sort
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "start_date":
          cmp =
            normalizeIsoDate(a.start_date).localeCompare(
              normalizeIsoDate(b.start_date),
            );
          break;
        case "end_date":
          cmp =
            normalizeIsoDate(a.end_date).localeCompare(
              normalizeIsoDate(b.end_date),
            );
          break;
        case "employee_name":
          cmp = (a.employee_name || "").localeCompare(b.employee_name || "");
          break;
        case "days":
          cmp = Number(a.days || 0) - Number(b.days || 0);
          break;
        case "status":
          cmp = (a.status || "").localeCompare(b.status || "");
          break;
        case "leave_type":
          cmp = (a.leave_type || "").localeCompare(b.leave_type || "");
          break;
        case "created_at":
          cmp = (a.created_at || "").localeCompare(b.created_at || "");
          break;
        default:
          cmp = 0;
      }
      return sortOrder === "asc" ? cmp : -cmp;
    });

    return result;
  }, [leaves, statusFilter, typeFilter, searchQuery, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder(field === "employee_name" ? "asc" : "desc");
    }
  };

  // KPIs
  const todayStr = isoToday();
  const onLeaveTodayCount = useMemo(() => {
    return leaves.filter(
      (l) => leaveCoversDate(l, todayStr) && l.status === "approved",
    ).length;
  }, [leaves, todayStr]);

  const totalApprovedDays = useMemo(() => {
    return leaves
      .filter((l) => l.status === "approved")
      .reduce((acc, cur) => acc + (cur.days || 0), 0);
  }, [leaves]);

  const pendingRequestsCount = useMemo(() => {
    return leaves.filter((l) => l.status === "pending").length;
  }, [leaves]);

  // Export CSV
  const handleExportCsv = () => {
    if (filteredLeaves.length === 0) {
      alert("No leave records to export.");
      return;
    }

    const headers = [
      "ID",
      "Employee Name",
      "Employee Email",
      "Leave Type",
      "Start Date",
      "End Date",
      "Days",
      "Status",
      "Reason",
      "Reviewer",
      "Review Comment",
      "Created At",
    ];

    const rows = filteredLeaves.map((l) => [
      l.id,
      `"${(l.employee_name || "").replace(/"/g, '""')}"`,
      `"${(l.employee_email || "").replace(/"/g, '""')}"`,
      `"${l.leave_type || ""}"`,
      normalizeIsoDate(l.start_date),
      normalizeIsoDate(l.end_date),
      l.days || 0,
      l.status || "",
      `"${(l.reason || "").replace(/"/g, '""')}"`,
      `"${(l.reviewer_name || "").replace(/"/g, '""')}"`,
      `"${(l.review_comment || "").replace(/"/g, '""')}"`,
      l.created_at || "",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `leave_report_${activeOrg?.slug || "org"}_${selectedYear}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (authLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-[65vh] flex-col items-center justify-center px-4 py-12 text-center">
        <div className="h-16 w-16 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center border border-destructive/20 mb-4 shadow-sm">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Admin Access Required
        </h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground leading-relaxed">
          Employee leave reports, date-wise absence inspector, and department rosters are restricted to organization administrators.
        </p>
        <div className="mt-6 flex flex-wrap gap-3 justify-center">
          <Button asChild variant="outline" size="sm">
            <Link href="/workspace/calendar">
              <CalendarDays className="h-4 w-4 mr-1.5" />
              Go to Calendar
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/workspace/dashboard">
              Back to Workspace
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 px-4 py-6 md:px-6 md:py-8 lg:px-8 xl:px-10">
      {/* Top Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="h-8 -ml-2 px-2 text-muted-foreground hover:text-foreground"
            >
              <Link href={HR_CALENDAR_PATH}>
                <ArrowLeft className="h-4 w-4 mr-1" />
                Calendar & holidays
              </Link>
            </Button>
            <span className="text-muted-foreground/50">/</span>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl flex items-center gap-2">
              <FileSpreadsheet className="h-6 w-6 text-primary" />
              Leave reports & date inspector
            </h1>
            {activeOrg?.name ? (
              <Badge variant="secondary" className="text-xs">
                Org: {activeOrg.name}
              </Badge>
            ) : null}
          </div>
          <p className="max-w-3xl text-sm text-muted-foreground">
            Search and inspect employee leaves by specific date, view who is on
            leave with custom sorting, and export complete reports.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadLeaves}
            disabled={loading}
            className="gap-1.5 shadow-sm text-xs h-8"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={handleExportCsv}
            disabled={filteredLeaves.length === 0}
            className="gap-1.5 shadow-sm text-xs h-8"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </Button>
        </div>
      </header>

      {error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <Card className="border-border/80 shadow-sm p-4 flex flex-col justify-between">
          <span className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1.5">
            <Plane className="h-3.5 w-3.5 text-primary" />
            On Leave Today
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-foreground">
              {loading ? "…" : onLeaveTodayCount}
            </span>
            <span className="text-xs text-muted-foreground">employees</span>
          </div>
        </Card>

        <Card className="border-border/80 shadow-sm p-4 flex flex-col justify-between">
          <span className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-violet-600" />
            Pending Approvals
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-violet-600 dark:text-violet-400">
              {loading ? "…" : pendingRequestsCount}
            </span>
            <span className="text-xs text-muted-foreground">requests</span>
          </div>
        </Card>

        <Card className="border-border/80 shadow-sm p-4 flex flex-col justify-between">
          <span className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            Approved Days
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {loading ? "…" : totalApprovedDays}
            </span>
            <span className="text-xs text-muted-foreground">days approved</span>
          </div>
        </Card>

        <Card className="border-border/80 shadow-sm p-4 flex flex-col justify-between">
          <span className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-amber-600" />
            Total Requests
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-foreground">
              {loading ? "…" : leaves.length}
            </span>
            <span className="text-xs text-muted-foreground">records</span>
          </div>
        </Card>
      </div>

      {/* SECTION 1: SPECIFIC DATE INSPECTOR */}
      <Card className="border-border/80 shadow-sm overflow-hidden">
        <CardHeader className="border-b border-border/60 bg-muted/20 px-4 sm:px-6 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-primary" />
                Date-Wise Leave Inspector
              </CardTitle>
              <CardDescription className="text-xs">
                Pick any calendar date to check which employees are on leave on
                that specific day.
              </CardDescription>
            </div>

            {/* Date Selector Controls */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center rounded-lg border border-border bg-background p-0.5 shadow-2xs">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={handlePrevDay}
                  title="Previous Day"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
                  onClick={handleToday}
                >
                  Today
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={handleNextDay}
                  title="Next Day"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <Input
                type="date"
                value={inspectDate}
                onChange={(e) => setInspectDate(e.target.value)}
                className="h-9 w-[150px] font-mono text-xs bg-background shadow-2xs"
              />

              <Badge
                variant="outline"
                className="h-8 px-3 font-semibold text-xs bg-primary/10 text-primary border-primary/20"
              >
                {formatDisplayDate(inspectDate)}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6">
          {loading ? (
            <div className="flex h-28 items-center justify-center text-muted-foreground gap-2 text-sm">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              Checking leave records…
            </div>
          ) : employeesOnDate.length === 0 ? (
            /* NO LEAVE ON THIS DAY DISPLAY */
            <div className="flex flex-col items-center justify-center py-10 text-center space-y-3 rounded-xl border border-dashed border-border/80 bg-muted/15 p-6">
              <div className="h-12 w-12 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                <UserCheck className="h-6 w-6" />
              </div>
              <div className="space-y-1 max-w-md">
                <h3 className="font-semibold text-foreground text-base">
                  No employees on leave on {formatDisplayDate(inspectDate)}
                </h3>
                <p className="text-xs text-muted-foreground">
                  All team members are scheduled to be present on this day.
                  There are no approved or pending leave requests covering this
                  date.
                </p>
              </div>
              <div className="flex gap-2 pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextDay}
                  className="text-xs h-7 gap-1"
                >
                  Check tomorrow →
                </Button>
              </div>
            </div>
          ) : (
            /* EMPLOYEES ON LEAVE ON THIS DAY */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-foreground">
                  <span className="font-bold text-primary">
                    {employeesOnDate.length}
                  </span>{" "}
                  employee{employeesOnDate.length > 1 ? "s" : ""} on leave on{" "}
                  <span className="font-semibold">
                    {formatDisplayDate(inspectDate)}
                  </span>
                  :
                </span>

                <div className="flex items-center gap-2">
                  {approvedOnDate.length > 0 ? (
                    <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-[11px]">
                      {approvedOnDate.length} Approved
                    </Badge>
                  ) : null}
                  {pendingOnDate.length > 0 ? (
                    <Badge className="bg-violet-500/15 text-violet-700 dark:text-violet-400 border border-violet-500/30 text-[11px]">
                      {pendingOnDate.length} Pending
                    </Badge>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {employeesOnDate.map((leave) => (
                  <div
                    key={leave.id}
                    className="p-3.5 rounded-lg border border-border bg-card hover:shadow-xs transition-all flex flex-col justify-between space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <Avatar className="h-8 w-8 text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                          <AvatarFallback>
                            {getInitials(leave.employee_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-xs font-semibold text-foreground leading-snug">
                            {leave.employee_name}
                          </p>
                          {leave.employee_email ? (
                            <p className="text-[10px] text-muted-foreground truncate max-w-[140px]">
                              {leave.employee_email}
                            </p>
                          ) : null}
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-[9px] uppercase tracking-wide shrink-0 ${statusBadgeClass(
                          leave.status,
                        )}`}
                      >
                        {leave.status}
                      </Badge>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-muted-foreground">Type:</span>
                        <Badge
                          variant="outline"
                          className={`text-[10px] capitalize font-medium ${leaveTypeBadgeClass(
                            leave.leave_type,
                          )}`}
                        >
                          {leave.leave_type}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-muted-foreground">Duration:</span>
                        <span className="font-mono font-medium text-foreground">
                          {leave.days} {leave.days === 1 ? "day" : "days"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-muted-foreground">Dates:</span>
                        <span className="font-mono text-[10px] text-foreground">
                          {leave.start_date === leave.end_date
                            ? leave.start_date
                            : `${leave.start_date} → ${leave.end_date}`}
                        </span>
                      </div>

                      {leave.reason ? (
                        <div className="pt-1 text-[11px] text-muted-foreground border-t border-border/40">
                          <span className="italic line-clamp-2">
                            "{leave.reason}"
                          </span>
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* SECTION 2: COMPLETE LEAVE REPORT WITH ADVANCED SORTING & FILTERS */}
      <Card className="border-border/80 shadow-sm overflow-hidden">
        <CardHeader className="border-b border-border/60 bg-muted/20 px-4 sm:px-6 py-4 space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Filter className="h-4 w-4 text-primary" />
                All Leave Requests & Roster
              </CardTitle>
              <CardDescription className="text-xs">
                Filter by period, type, status, or search employee name. Click
                table columns to sort ascending / descending.
              </CardDescription>
            </div>

            {/* Quick Record Counter */}
            <span className="font-mono text-xs text-muted-foreground">
              Showing{" "}
              <strong className="text-foreground">
                {filteredLeaves.length}
              </strong>{" "}
              of {leaves.length} records
            </span>
          </div>

          {/* Filter Toolbar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2.5 pt-1">
            {/* Search Filter */}
            <div className="relative sm:col-span-2 lg:col-span-2">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search employee, email, reason…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-8 text-xs bg-background"
              />
            </div>

            {/* Year Selector */}
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="h-8 text-xs bg-background">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map((y) => (
                  <SelectItem key={y.value} value={y.value}>
                    {y.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Month Selector */}
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="h-8 text-xs bg-background">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All months</SelectItem>
                {MONTHS.map((m) => (
                  <SelectItem key={m.value} value={m.value.toString()}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-8 text-xs bg-background">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            {/* Leave Type Filter */}
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="h-8 text-xs bg-background sm:col-span-2 md:col-span-1">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                {LEAVE_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="flex h-36 items-center justify-center text-muted-foreground gap-2 text-sm">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              Loading leave records…
            </div>
          ) : filteredLeaves.length === 0 ? (
            <div className="py-14 text-center text-sm text-muted-foreground space-y-2">
              <Plane className="mx-auto h-8 w-8 text-muted-foreground/30" />
              <p className="font-semibold text-foreground">
                No leave records match the filters
              </p>
              <p className="text-xs">
                Try resetting filters or adjusting search parameters.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  {/* Employee Name Header with Sort */}
                  <TableHead
                    className="font-semibold text-foreground cursor-pointer select-none"
                    onClick={() => handleSort("employee_name")}
                  >
                    <div className="flex items-center gap-1.5">
                      Employee
                      {sortField === "employee_name" ? (
                        sortOrder === "asc" ? (
                          <ArrowUp className="h-3 w-3 text-primary" />
                        ) : (
                          <ArrowDown className="h-3 w-3 text-primary" />
                        )
                      ) : (
                        <ArrowUpDown className="h-3 w-3 opacity-30" />
                      )}
                    </div>
                  </TableHead>

                  {/* Leave Type Header with Sort */}
                  <TableHead
                    className="font-semibold text-foreground cursor-pointer select-none"
                    onClick={() => handleSort("leave_type")}
                  >
                    <div className="flex items-center gap-1.5">
                      Type
                      {sortField === "leave_type" ? (
                        sortOrder === "asc" ? (
                          <ArrowUp className="h-3 w-3 text-primary" />
                        ) : (
                          <ArrowDown className="h-3 w-3 text-primary" />
                        )
                      ) : (
                        <ArrowUpDown className="h-3 w-3 opacity-30" />
                      )}
                    </div>
                  </TableHead>

                  {/* Start Date Header with Sort */}
                  <TableHead
                    className="font-semibold text-foreground cursor-pointer select-none"
                    onClick={() => handleSort("start_date")}
                  >
                    <div className="flex items-center gap-1.5">
                      Leave Dates
                      {sortField === "start_date" ? (
                        sortOrder === "asc" ? (
                          <ArrowUp className="h-3 w-3 text-primary" />
                        ) : (
                          <ArrowDown className="h-3 w-3 text-primary" />
                        )
                      ) : (
                        <ArrowUpDown className="h-3 w-3 opacity-30" />
                      )}
                    </div>
                  </TableHead>

                  {/* Days Header with Sort */}
                  <TableHead
                    className="font-semibold text-foreground cursor-pointer select-none"
                    onClick={() => handleSort("days")}
                  >
                    <div className="flex items-center gap-1.5">
                      Days
                      {sortField === "days" ? (
                        sortOrder === "asc" ? (
                          <ArrowUp className="h-3 w-3 text-primary" />
                        ) : (
                          <ArrowDown className="h-3 w-3 text-primary" />
                        )
                      ) : (
                        <ArrowUpDown className="h-3 w-3 opacity-30" />
                      )}
                    </div>
                  </TableHead>

                  <TableHead className="font-semibold text-foreground">
                    Reason & Notes
                  </TableHead>

                  {/* Status Header with Sort */}
                  <TableHead
                    className="font-semibold text-foreground cursor-pointer select-none"
                    onClick={() => handleSort("status")}
                  >
                    <div className="flex items-center gap-1.5">
                      Status
                      {sortField === "status" ? (
                        sortOrder === "asc" ? (
                          <ArrowUp className="h-3 w-3 text-primary" />
                        ) : (
                          <ArrowDown className="h-3 w-3 text-primary" />
                        )
                      ) : (
                        <ArrowUpDown className="h-3 w-3 opacity-30" />
                      )}
                    </div>
                  </TableHead>

                  {/* Applied Date Header with Sort */}
                  <TableHead
                    className="font-semibold text-foreground cursor-pointer select-none text-right"
                    onClick={() => handleSort("created_at")}
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      Applied Date
                      {sortField === "created_at" ? (
                        sortOrder === "asc" ? (
                          <ArrowUp className="h-3 w-3 text-primary" />
                        ) : (
                          <ArrowDown className="h-3 w-3 text-primary" />
                        )
                      ) : (
                        <ArrowUpDown className="h-3 w-3 opacity-30" />
                      )}
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeaves.map((leave) => (
                  <TableRow key={leave.id} className="hover:bg-muted/30">
                    {/* Employee info */}
                    <TableCell className="font-semibold text-foreground">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7 text-[10px] font-bold bg-muted text-foreground border border-border">
                          <AvatarFallback>
                            {getInitials(leave.employee_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-xs font-semibold leading-tight">
                            {leave.employee_name}
                          </p>
                          {leave.employee_email ? (
                            <p className="text-[10px] font-normal text-muted-foreground">
                              {leave.employee_email}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </TableCell>

                    {/* Leave Type */}
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-[10px] uppercase tracking-wide capitalize font-medium ${leaveTypeBadgeClass(
                          leave.leave_type,
                        )}`}
                      >
                        {leave.leave_type}
                      </Badge>
                    </TableCell>

                    {/* Dates */}
                    <TableCell className="font-mono text-xs whitespace-nowrap">
                      {leave.start_date === leave.end_date
                        ? leave.start_date
                        : `${leave.start_date} → ${leave.end_date}`}
                    </TableCell>

                    {/* Days */}
                    <TableCell className="font-mono text-xs font-semibold">
                      {leave.days}
                    </TableCell>

                    {/* Reason & Review notes */}
                    <TableCell className="text-xs text-muted-foreground max-w-[240px]">
                      <span className="line-clamp-2">
                        {leave.reason || "—"}
                      </span>
                      {leave.review_comment ? (
                        <p className="mt-0.5 text-[10px] text-muted-foreground/80">
                          Note: {leave.review_comment}
                        </p>
                      ) : null}
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-[10px] uppercase tracking-wide ${statusBadgeClass(
                          leave.status,
                        )}`}
                      >
                        {leave.status}
                      </Badge>
                    </TableCell>

                    {/* Created Date */}
                    <TableCell className="text-right font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                      {normalizeIsoDate(leave.created_at) || "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
