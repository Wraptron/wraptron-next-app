"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Filter,
  Layers,
  Loader2,
  RefreshCw,
  Search,
  TrendingUp,
  UserCheck,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  employeesApi,
  type EmployeeMetricRow,
  type EmployeeMetricsReportResponse,
} from "@/lib/api";
import { EMPLOYEES_BASE_PATH } from "@/lib/employee-routes";
import { useOrganization } from "@/contexts/organization-context";

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

function getInitials(name: string): string {
  if (!name) return "EM";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatHours(hours: number): string {
  if (hours <= 0) return "0.0h";
  return `${hours.toFixed(1)}h`;
}

function getAttendanceBadgeClass(percent: number): string {
  if (percent >= 90) {
    return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20";
  }
  if (percent >= 75) {
    return "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20";
  }
  return "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20";
}

function getPerformanceBadgeClass(percent: number): string {
  if (percent >= 80) {
    return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20";
  }
  if (percent >= 60) {
    return "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20";
  }
  if (percent > 0) {
    return "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20";
  }
  return "bg-muted text-muted-foreground border-border";
}

function MetricSummaryCard({
  title,
  value,
  subvalue,
  description,
  icon: Icon,
  loading,
}: {
  title: string;
  value: string;
  subvalue?: string;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  loading?: boolean;
}) {
  return (
    <Card className="border-border/80 shadow-sm transition-all hover:shadow-md">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardDescription className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {title}
          </CardDescription>
          <div className="flex items-baseline gap-2">
            <CardTitle className="text-2xl font-bold tracking-tight tabular-nums">
              {loading ? "—" : value}
            </CardTitle>
            {subvalue && !loading ? (
              <span className="text-xs font-medium text-muted-foreground">
                {subvalue}
              </span>
            ) : null}
          </div>
          {description ? (
            <p className="text-xs text-muted-foreground/80">{description}</p>
          ) : null}
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
      </CardHeader>
    </Card>
  );
}

export function HrMetricsMatrix() {
  const { activeOrg, switchOrg, organizations } = useOrganization();

  // Default to July 2026 to match the user's report data, or current date if in 2026+
  const [selectedMonth, setSelectedMonth] = useState<number>(7);
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [customDays, setCustomDays] = useState<string>("22");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] =
    useState<EmployeeMetricsReportResponse | null>(null);

  // Available year options
  const yearOptions = [2024, 2025, 2026, 2027, 2028];

  const loadReport = useCallback(
    async (
      month: number,
      year: number,
      totalDays?: number,
      department?: string,
    ) => {
      setLoading(true);
      setError(null);
      try {
        const res = await employeesApi.getMetricsReport({
          month,
          year,
          total_days: totalDays && totalDays > 0 ? totalDays : undefined,
          department:
            department && department !== "all" ? department : undefined,
        });
        setReportData(res);
        setCustomDays(res.total_working_days.toString());
      } catch (err) {
        console.error("Failed to load metrics report:", err);
        setError("Unable to load performance and attendance metrics.");
        setReportData(null);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    void loadReport(
      selectedMonth,
      selectedYear,
      undefined,
      departmentFilter,
    );
  }, [selectedMonth, selectedYear, departmentFilter, activeOrg?.id, loadReport]);

  const handleApplyCustomDays = () => {
    const daysNum = parseInt(customDays, 10);
    void loadReport(
      selectedMonth,
      selectedYear,
      !isNaN(daysNum) && daysNum > 0 ? daysNum : undefined,
      departmentFilter,
    );
  };

  const handleResetDays = () => {
    void loadReport(
      selectedMonth,
      selectedYear,
      undefined,
      departmentFilter,
    );
  };

  const handleSelectPreset = (month: number, year: number) => {
    setSelectedMonth(month);
    setSelectedYear(year);
  };

  // Distinct departments from data
  const availableDepartments = useMemo(() => {
    if (!reportData?.rows) return [];
    const depts = new Set<string>();
    for (const r of reportData.rows) {
      if (r.department) depts.add(r.department);
    }
    return Array.from(depts).sort();
  }, [reportData?.rows]);

  // Filtered rows by search query
  const filteredRows = useMemo(() => {
    if (!reportData?.rows) return [];
    if (!searchQuery.trim()) return reportData.rows;
    const q = searchQuery.toLowerCase().trim();
    return reportData.rows.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.emp_code.toLowerCase().includes(q) ||
        (r.department && r.department.toLowerCase().includes(q)) ||
        (r.email && r.email.toLowerCase().includes(q)),
    );
  }, [reportData?.rows, searchQuery]);

  // Summary footer calculations
  const totals = useMemo(() => {
    if (!filteredRows.length) {
      return {
        totalDays: reportData?.total_working_days ?? 0,
        avgDaysPresent: 0,
        totalHours: 0,
        avgDailyHours: 0,
        totalTasksAssigned: 0,
        totalTasksCompleted: 0,
        avgAttendancePercent: 0,
        totalLoadPercent: 0,
        overallPerformancePercent: 0,
      };
    }
    const sumDaysPresent = filteredRows.reduce(
      (acc, r) => acc + r.days_present,
      0,
    );
    const sumHours = filteredRows.reduce(
      (acc, r) => acc + r.total_working_hours,
      0,
    );
    const sumAssigned = filteredRows.reduce(
      (acc, r) => acc + r.tasks_assigned,
      0,
    );
    const sumCompleted = filteredRows.reduce(
      (acc, r) => acc + r.tasks_completed,
      0,
    );
    const avgAttendance =
      filteredRows.reduce((acc, r) => acc + r.attendance_percent, 0) /
      filteredRows.length;
    const sumLoad = filteredRows.reduce(
      (acc, r) => acc + r.load_percent,
      0,
    );
    const perf =
      sumAssigned > 0 ? (sumCompleted / sumAssigned) * 100 : 0;

    return {
      totalDays: reportData?.total_working_days ?? 0,
      avgDaysPresent: Math.round((sumDaysPresent / filteredRows.length) * 10) / 10,
      totalHours: Math.round(sumHours * 10) / 10,
      avgDailyHours:
        sumDaysPresent > 0
          ? Math.round((sumHours / sumDaysPresent) * 10) / 10
          : 0,
      totalTasksAssigned: sumAssigned,
      totalTasksCompleted: sumCompleted,
      avgAttendancePercent: Math.round(avgAttendance * 100) / 100,
      totalLoadPercent: Math.round(sumLoad * 100) / 100,
      overallPerformancePercent: Math.round(perf * 100) / 100,
    };
  }, [filteredRows, reportData?.total_working_days]);

  // Chart data for Load % vs Performance %
  const chartData = useMemo(() => {
    return filteredRows.map((r) => ({
      name: r.name.split(" ")[0], // First name for chart readability
      fullName: r.name,
      load: r.load_percent,
      performance: r.performance_percent,
      attendance: r.attendance_percent,
    }));
  }, [filteredRows]);

  // CSV Export functionality
  const handleExportCSV = () => {
    if (!filteredRows.length) return;

    const headers = [
      "Employee Name",
      "Employee Code",
      "Department",
      "Total Days",
      "Days Present",
      "Total Working Hours",
      "Avg Daily Hours",
      "Tasks Assigned",
      "Tasks Complete",
      "Attendance %",
      "Load %",
      "Performance %",
    ];

    const rowsData = filteredRows.map((r) => [
      `"${r.name.replace(/"/g, '""')}"`,
      `"${r.emp_code}"`,
      `"${(r.department || "—").replace(/"/g, '""')}"`,
      r.total_days,
      r.days_present,
      r.total_working_hours.toFixed(2),
      r.avg_daily_hours.toFixed(2),
      r.tasks_assigned,
      r.tasks_completed,
      `${r.attendance_percent.toFixed(2)}%`,
      `${r.load_percent.toFixed(2)}%`,
      `${r.performance_percent.toFixed(2)}%`,
    ]);

    const totalsRow = [
      `"Total / Average (${filteredRows.length} Employees)"`,
      `"—"`,
      `"—"`,
      totals.totalDays,
      totals.avgDaysPresent,
      totals.totalHours.toFixed(2),
      totals.avgDailyHours.toFixed(2),
      totals.totalTasksAssigned,
      totals.totalTasksCompleted,
      `${totals.avgAttendancePercent.toFixed(2)}%`,
      `${totals.totalLoadPercent.toFixed(2)}%`,
      `${totals.overallPerformancePercent.toFixed(2)}%`,
    ];

    const csvContent = [
      `# Employee Performance & Attendance Report - ${reportData?.period_label ?? ""}`,
      headers.join(","),
      ...rowsData.map((row) => row.join(",")),
      totalsRow.join(","),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `Employee_Report_${reportData?.period_label?.replace(/\s+/g, "_") || "month"}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full space-y-6 px-4 py-6 md:px-6 md:py-8 lg:px-8 xl:px-10">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              Performance & Attendance Report
            </h1>
            <Badge variant="outline" className="font-mono text-xs">
              {reportData?.period_label || "Monthly"}
            </Badge>
            {activeOrg?.name ? (
              <Badge variant="secondary" className="text-xs font-normal">
                Org: {activeOrg.name}
              </Badge>
            ) : null}
          </div>
          <p className="max-w-3xl text-sm text-muted-foreground">
            Monthly workload distribution (Load %), attendance rates, working
            hours, and task completion performance matrix.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            disabled={loading || !filteredRows.length}
            className="gap-1.5 shadow-sm"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button
            asChild
            variant="default"
            size="sm"
            className="gap-1.5 shadow-sm"
          >
            <Link href={EMPLOYEES_BASE_PATH}>
              <Users className="h-4 w-4" />
              Employee Directory
            </Link>
          </Button>
        </div>
      </header>

      {/* Control / Filters Bar */}
      <Card className="border-border/80 bg-card/60 shadow-sm backdrop-blur-sm">
        <CardContent className="p-4 sm:p-5 space-y-4">
          {/* Quick presets */}
          <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-border/50 text-xs">
            <span className="font-semibold text-muted-foreground mr-1">Quick Presets:</span>
            <button
              type="button"
              onClick={() => handleSelectPreset(7, 2026)}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                selectedMonth === 7 && selectedYear === 2026
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted hover:bg-muted/80 text-foreground"
              }`}
            >
              July 2026 (Demo Sheet)
            </button>
            <button
              type="button"
              onClick={() => handleSelectPreset(8, 2026)}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                selectedMonth === 8 && selectedYear === 2026
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted hover:bg-muted/80 text-foreground"
              }`}
            >
              August 2026
            </button>
            <button
              type="button"
              onClick={() => handleSelectPreset(6, 2026)}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                selectedMonth === 6 && selectedYear === 2026
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted hover:bg-muted/80 text-foreground"
              }`}
            >
              June 2026
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 items-end">
            {/* Month Picker */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-primary" />
                Month
              </label>
              <Select
                value={selectedMonth.toString()}
                onValueChange={(val) => setSelectedMonth(parseInt(val, 10))}
              >
                <SelectTrigger className="h-9 bg-background">
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m) => (
                    <SelectItem key={m.value} value={m.value.toString()}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Year Picker */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Year
              </label>
              <Select
                value={selectedYear.toString()}
                onValueChange={(val) => setSelectedYear(parseInt(val, 10))}
              >
                <SelectTrigger className="h-9 bg-background">
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((y) => (
                    <SelectItem key={y} value={y.toString()}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Total Working Days (Editable) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Total Working Days
                </label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={handleResetDays}
                      className="text-[11px] text-primary hover:underline"
                    >
                      Auto
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    Reset to standard business days (Mon-Fri) in month
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="flex gap-1.5">
                <Input
                  type="number"
                  min="1"
                  max="31"
                  value={customDays}
                  onChange={(e) => setCustomDays(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleApplyCustomDays();
                  }}
                  placeholder="e.g. 22"
                  className="h-9 bg-background font-mono tabular-nums"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleApplyCustomDays}
                  className="h-9 px-2.5 shrink-0"
                >
                  Apply
                </Button>
              </div>
            </div>

            {/* Department Filter */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Filter className="h-3.5 w-3.5 text-primary" />
                Department
              </label>
              <Select
                value={departmentFilter}
                onValueChange={setDepartmentFilter}
              >
                <SelectTrigger className="h-9 bg-background">
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {availableDepartments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Search Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Search className="h-3.5 w-3.5 text-primary" />
                Search
              </label>
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Filter name or code…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 bg-background pr-8"
                />
                {searchQuery ? (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
                  >
                    ×
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Banner */}
      {error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive flex items-center gap-3">
          <span className="font-semibold">Error:</span> {error}
        </div>
      ) : null}

      {/* KPI Stat Cards */}
      <section
        aria-label="Summary KPIs"
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <MetricSummaryCard
          title="Active Workforce"
          value={reportData?.total_employees?.toString() ?? "0"}
          subvalue="employees"
          description="Active in selected period"
          icon={Users}
          loading={loading}
        />
        <MetricSummaryCard
          title="Average Attendance"
          value={`${totals.avgAttendancePercent.toFixed(1)}%`}
          subvalue={`avg ${totals.avgDaysPresent} of ${totals.totalDays} days`}
          description="Workforce presence rate"
          icon={UserCheck}
          loading={loading}
        />
        <MetricSummaryCard
          title="Total Working Hours"
          value={formatHours(totals.totalHours)}
          subvalue={`avg ${totals.avgDailyHours}h / day`}
          description="Aggregated from attendance check-ins"
          icon={Clock}
          loading={loading}
        />
        <MetricSummaryCard
          title="Task Completion Rate"
          value={`${totals.overallPerformancePercent.toFixed(1)}%`}
          subvalue={`${totals.totalTasksCompleted} / ${totals.totalTasksAssigned} tasks`}
          description="Overall organization performance"
          icon={TrendingUp}
          loading={loading}
        />
      </section>

      {/* Main Metrics Matrix Table */}
      <Card className="border-border/80 shadow-sm overflow-hidden">
        <CardHeader className="border-b border-border/60 bg-muted/20 px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle className="text-base font-semibold">
                Employee Report: {reportData?.period_label || "Selected Period"}
              </CardTitle>
              <CardDescription className="text-xs">
                Showing {filteredRows.length} active employee
                {filteredRows.length === 1 ? "" : "s"} · Standard working days:{" "}
                <span className="font-mono font-medium text-foreground">
                  {reportData?.total_working_days ?? 22} days
                </span>
              </CardDescription>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Performance ≥ 80%
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-blue-500" />
                60% – 79%
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                &lt; 60%
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex h-64 flex-col items-center justify-center gap-3 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-sm">Calculating performance & attendance matrix…</p>
            </div>
          ) : filteredRows.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground space-y-3 px-4">
              <Users className="mx-auto h-10 w-10 text-muted-foreground/40" />
              <p className="font-semibold text-foreground text-base">
                No active employee records found in {activeOrg?.name || "this organization"}
              </p>
              <p className="text-xs max-w-md mx-auto">
                {organizations.length > 1
                  ? `You are currently viewing "${activeOrg?.name || "this organization"}". If your employee records belong to another organization, select it below:`
                  : "No active employees were found for this period. You can add employees in the Employee Directory."}
              </p>
              {organizations.length > 1 ? (
                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                  {organizations.map((org) => (
                    <Button
                      key={org.id}
                      variant={org.id === activeOrg?.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => switchOrg(org.id)}
                      className="text-xs"
                    >
                      {org.id === activeOrg?.id ? `✓ ${org.name}` : `Switch to ${org.name}`}
                    </Button>
                  ))}
                </div>
              ) : null}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40 border-b border-border/80">
                    <TableHead className="w-[240px] font-semibold text-foreground">
                      Name
                    </TableHead>
                    <TableHead className="text-center font-semibold text-foreground">
                      Total Days
                    </TableHead>
                    <TableHead className="text-center font-semibold text-foreground">
                      Days Present
                    </TableHead>
                    <TableHead className="text-center font-semibold text-foreground">
                      Working Hours
                    </TableHead>
                    <TableHead className="text-center font-semibold text-foreground">
                      Tasks Assigned
                    </TableHead>
                    <TableHead className="text-center font-semibold text-foreground">
                      Tasks Complete
                    </TableHead>
                    <TableHead className="text-right font-semibold text-foreground">
                      Attendance
                    </TableHead>
                    <TableHead className="text-right font-semibold text-foreground">
                      Load
                    </TableHead>
                    <TableHead className="text-right font-semibold text-foreground">
                      Performance
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRows.map((row) => (
                    <TableRow
                      key={row.employee_id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      {/* Employee Name & Details */}
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 text-xs font-semibold ring-1 ring-border">
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {getInitials(row.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col min-w-0">
                            <Link
                              href={`${EMPLOYEES_BASE_PATH}/${row.employee_id}`}
                              className="truncate hover:underline font-semibold text-foreground hover:text-primary transition-colors"
                            >
                              {row.name}
                            </Link>
                            <span className="text-[11px] text-muted-foreground font-mono">
                              {row.emp_code}
                              {row.department ? ` · ${row.department}` : ""}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      {/* Total Days */}
                      <TableCell className="text-center tabular-nums text-muted-foreground font-mono">
                        {row.total_days}
                      </TableCell>

                      {/* Days Present */}
                      <TableCell className="text-center tabular-nums font-semibold font-mono text-foreground">
                        {row.days_present}
                      </TableCell>

                      {/* Total Working Hours */}
                      <TableCell className="text-center tabular-nums">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="inline-flex items-center gap-1 font-mono font-medium text-foreground cursor-help">
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              {formatHours(row.total_working_hours)}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="text-xs space-y-1">
                              <p className="font-semibold">{row.name}</p>
                              <p>Total logged: {row.total_working_hours.toFixed(2)} hours</p>
                              <p>Daily average: {row.avg_daily_hours.toFixed(2)} hours / day</p>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>

                      {/* Tasks Assigned */}
                      <TableCell className="text-center tabular-nums font-mono font-medium">
                        {row.tasks_assigned > 0 ? (
                          row.tasks_assigned
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>

                      {/* Tasks Complete */}
                      <TableCell className="text-center tabular-nums font-mono font-medium">
                        {row.tasks_assigned > 0 ? (
                          <span
                            className={
                              row.tasks_completed === row.tasks_assigned &&
                              row.tasks_assigned > 0
                                ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                                : ""
                            }
                          >
                            {row.tasks_completed}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>

                      {/* Attendance % */}
                      <TableCell className="text-right">
                        <Badge
                          variant="outline"
                          className={`font-mono text-xs tabular-nums px-2 py-0.5 font-medium border ${getAttendanceBadgeClass(
                            row.attendance_percent,
                          )}`}
                        >
                          {row.attendance_percent.toFixed(2)}%
                        </Badge>
                      </TableCell>

                      {/* Load % */}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className="font-mono text-xs font-semibold tabular-nums text-foreground">
                            {row.load_percent.toFixed(2)}%
                          </span>
                          <div
                            className="h-1.5 w-12 bg-muted rounded-full overflow-hidden shrink-0"
                            title={`${row.load_percent.toFixed(1)}% of total team workload`}
                          >
                            <div
                              className="h-full bg-primary rounded-full"
                              style={{
                                width: `${Math.min(100, Math.max(0, row.load_percent * 2))}%`,
                              }}
                            />
                          </div>
                        </div>
                      </TableCell>

                      {/* Performance % */}
                      <TableCell className="text-right">
                        <Badge
                          variant="outline"
                          className={`font-mono text-xs tabular-nums px-2.5 py-0.5 font-semibold border ${getPerformanceBadgeClass(
                            row.performance_percent,
                          )}`}
                        >
                          {row.tasks_assigned > 0
                            ? `${row.performance_percent.toFixed(3)}%`
                            : "—"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>

                {/* Totals / Averages Footer Row */}
                <TableFooter className="bg-muted/60 border-t-2 border-border font-semibold">
                  <TableRow className="hover:bg-muted/80">
                    <TableCell className="text-foreground font-bold">
                      Total / Org Average ({filteredRows.length})
                    </TableCell>
                    <TableCell className="text-center font-mono tabular-nums text-foreground">
                      {totals.totalDays}
                    </TableCell>
                    <TableCell className="text-center font-mono tabular-nums text-foreground font-bold">
                      {totals.avgDaysPresent}
                    </TableCell>
                    <TableCell className="text-center font-mono tabular-nums text-foreground font-bold">
                      {formatHours(totals.totalHours)}
                    </TableCell>
                    <TableCell className="text-center font-mono tabular-nums text-foreground font-bold">
                      {totals.totalTasksAssigned}
                    </TableCell>
                    <TableCell className="text-center font-mono tabular-nums text-foreground font-bold">
                      {totals.totalTasksCompleted}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums text-foreground font-bold">
                      {totals.avgAttendancePercent.toFixed(2)}%
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums text-foreground font-bold">
                      {totals.totalLoadPercent.toFixed(2)}%
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums text-foreground font-bold">
                      {totals.overallPerformancePercent.toFixed(3)}%
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Visual Analytics Section: Workload Share & Performance Chart */}
      {filteredRows.length > 0 && !loading ? (
        <Card className="border-border/80 shadow-sm">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
              <div>
                <CardTitle className="text-base font-semibold">
                  Workload (Load %) vs Task Completion (Performance %)
                </CardTitle>
                <CardDescription className="text-xs">
                  Visual comparison across active employees for{" "}
                  {reportData?.period_label}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 10, right: 20, left: -10, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    interval={0}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    unit="%"
                    domain={[0, 100]}
                  />
                  <RechartsTooltip
                    formatter={(val: number, name: string) => [
                      `${val.toFixed(2)}%`,
                      name === "load"
                        ? "Workload Share (Load %)"
                        : "Task Completion (Performance %)",
                    ]}
                    labelFormatter={(label, payload) => {
                      const item = payload?.[0]?.payload as { fullName?: string };
                      return item?.fullName || label;
                    }}
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      borderColor: "hsl(var(--border))",
                      borderRadius: "0.5rem",
                      fontSize: "12px",
                      color: "hsl(var(--foreground))",
                    }}
                  />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    wrapperStyle={{ paddingBottom: "10px", fontSize: "12px" }}
                  />
                  <Bar
                    dataKey="load"
                    name="Workload Share (Load %)"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={45}
                  />
                  <Bar
                    dataKey="performance"
                    name="Completion (Performance %)"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={45}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
