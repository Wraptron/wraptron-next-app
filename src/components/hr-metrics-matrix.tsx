"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Calendar,
  CheckCircle2,
  Clock,
  Download,
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
import { EMPLOYEES_BASE_PATH, HR_CALENDAR_PATH } from "@/lib/employee-routes";
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

interface CustomChartTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    name: string;
    dataKey: string;
    payload: {
      fullName: string;
      empCode?: string;
      department?: string | null;
      load: number;
      performance: number;
      attendance: number;
    };
  }>;
  label?: string;
}

function CustomChartTooltip({ active, payload }: CustomChartTooltipProps) {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0]?.payload;
  if (!data) return null;

  return (
    <div className="rounded-xl border border-border/80 bg-popover/95 p-3.5 shadow-2xl backdrop-blur-md text-xs space-y-2.5 min-w-[240px]">
      <div className="border-b border-border/60 pb-1.5">
        <p className="font-bold text-popover-foreground text-sm leading-tight">
          {data.fullName}
        </p>
        <p className="text-[11px] text-muted-foreground mt-0.5 font-mono">
          {data.empCode || "—"} {data.department ? `· ${data.department}` : ""}
        </p>
      </div>

      <div className="space-y-1.5">
        {/* Workload Share */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <span className="h-2.5 w-2.5 rounded-xs bg-indigo-500 shrink-0 shadow-2xs" />
            <span className="font-medium">Workload Share (Load %):</span>
          </div>
          <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
            {data.load.toFixed(2)}%
          </span>
        </div>

        {/* Task Completion */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <span className="h-2.5 w-2.5 rounded-xs bg-emerald-500 shrink-0 shadow-2xs" />
            <span className="font-medium">Task Completion (Perf %):</span>
          </div>
          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
            {data.performance.toFixed(2)}%
          </span>
        </div>

        {/* Attendance */}
        <div className="flex items-center justify-between gap-3 pt-1.5 border-t border-border/40 text-[11px]">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-blue-500/70 shrink-0" />
            <span>Attendance Rate:</span>
          </div>
          <span className="font-mono font-semibold text-foreground/80">
            {data.attendance.toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
}

export function HrMetricsMatrix() {
  const { activeOrg, switchOrg, organizations } = useOrganization();

  // Default to current month and year
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] =
    useState<EmployeeMetricsReportResponse | null>(null);

  // Available year options (surrounding current year)
  const currentYear = now.getFullYear();
  const yearOptions = [
    currentYear - 2,
    currentYear - 1,
    currentYear,
    currentYear + 1,
    currentYear + 2,
  ];

  const loadReport = useCallback(
    async (month: number, year: number) => {
      setLoading(true);
      setError(null);
      try {
        const res = await employeesApi.getMetricsReport({
          month,
          year,
        });
        setReportData(res);
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
    void loadReport(selectedMonth, selectedYear);
  }, [selectedMonth, selectedYear, activeOrg?.id, loadReport]);

  const handleSelectPreset = (month: number, year: number) => {
    setSelectedMonth(month);
    setSelectedYear(year);
  };

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
      empCode: r.emp_code,
      department: r.department,
      load: Number(r.load_percent.toFixed(2)),
      performance: Number(r.performance_percent.toFixed(2)),
      attendance: Number(r.attendance_percent.toFixed(2)),
    }));
  }, [filteredRows]);

  // CSV Export functionality
  const handleExportCSV = () => {
    if (!filteredRows.length) return;

    const headers = [
      "Employee Name",
      "Employee Code",
      "Department",
      "Working Days (Calendar)",
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
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              Performance & Attendance Report
            </h1>
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
            className="h-8 gap-1.5 shadow-2xs text-xs"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </Button>
          <Button
            asChild
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 shadow-2xs text-xs"
          >
            <Link href={HR_CALENDAR_PATH}>
              <Calendar className="h-3.5 w-3.5" />
              Calendar & Holidays
            </Link>
          </Button>
          <Button
            asChild
            variant="default"
            size="sm"
            className="h-8 gap-1.5 shadow-2xs text-xs"
          >
            <Link href={EMPLOYEES_BASE_PATH}>
              <Users className="h-3.5 w-3.5" />
              Employee Directory
            </Link>
          </Button>
        </div>
      </header>

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
        <CardHeader className="border-b border-border/60 bg-muted/20 px-6 py-4 space-y-3">
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
            {/* Left: Title + Month/Year Selectors + Working Days Badge */}
            <div className="flex flex-wrap items-center gap-2.5">
              <CardTitle className="text-base font-semibold whitespace-nowrap">
                Employee Report:
              </CardTitle>

              {/* Month Picker */}
              <Select
                value={selectedMonth.toString()}
                onValueChange={(val) => setSelectedMonth(parseInt(val, 10))}
              >
                <SelectTrigger className="h-8 w-[125px] font-semibold text-xs bg-background shadow-2xs">
                  <Calendar className="h-3.5 w-3.5 text-primary mr-1 shrink-0" />
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m) => (
                    <SelectItem key={m.value} value={m.value.toString()}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Year Picker */}
              <Select
                value={selectedYear.toString()}
                onValueChange={(val) => setSelectedYear(parseInt(val, 10))}
              >
                <SelectTrigger className="h-8 w-[85px] font-semibold text-xs bg-background shadow-2xs">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((y) => (
                    <SelectItem key={y} value={y.toString()}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Working Days Badge */}
              <Badge
                variant="outline"
                className="font-mono text-xs font-semibold px-2.5 py-1 bg-primary/10 text-primary border-primary/20 gap-1.5 shadow-2xs"
              >
                <Calendar className="h-3.5 w-3.5" />
                {reportData?.total_working_days ?? 22} Working Days
                <Link
                  href={HR_CALENDAR_PATH}
                  className="text-[10px] text-muted-foreground hover:text-primary hover:underline ml-1"
                  title="Configure calendar & holidays"
                >
                  (Setup)
                </Link>
              </Badge>
            </div>

            {/* Right: Search Box & Legend */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              {/* Search Box */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Filter name, code, dept…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 pl-8 pr-8 bg-background text-xs shadow-2xs"
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

              {/* Legend */}
              <div className="flex items-center gap-2.5 text-xs text-muted-foreground shrink-0">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  ≥ 80%
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-blue-500" />
                  60%–79%
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  &lt; 60%
                </span>
              </div>
            </div>
          </div>

          <div className="text-xs text-muted-foreground">
            Showing {filteredRows.length} active employee
            {filteredRows.length === 1 ? "" : "s"} for {reportData?.period_label || "selected period"} · Standard working days derived automatically from Calendar Setup.
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
                      Working Days
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
        <Card className="border-border/80 shadow-sm overflow-hidden">
          <CardHeader className="border-b border-border/60 bg-muted/20 px-6 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle className="text-base font-semibold">
                  Workload (Load %) vs Task Completion (Performance %)
                </CardTitle>
                <CardDescription className="text-xs">
                  Visual comparison across active employees for{" "}
                  {reportData?.period_label || "selected period"}
                </CardDescription>
              </div>
              <div className="flex items-center gap-4 text-xs font-medium">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-xs bg-indigo-500 shadow-2xs" />
                  Workload Share (Load %)
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-xs bg-emerald-500 shadow-2xs" />
                  Task Completion (Performance %)
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 15, right: 20, left: -5, bottom: 25 }}
                  barGap={6}
                >
                  <defs>
                    <linearGradient id="loadBarGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity={0.95} />
                      <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.75} />
                    </linearGradient>
                    <linearGradient id="perfBarGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.95} />
                      <stop offset="100%" stopColor="#059669" stopOpacity={0.75} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff" opacity={0.12} />
                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    axisLine={{ stroke: "#ffffff", opacity: 0.25 }}
                    tick={{ fontSize: 12, fill: "#ffffff", fontWeight: 500 }}
                    interval={0}
                    dy={10}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12, fill: "#ffffff", fontWeight: 500 }}
                    unit="%"
                    domain={[0, 100]}
                    ticks={[0, 25, 50, 75, 100]}
                    dx={-2}
                  />
                  <RechartsTooltip
                    content={<CustomChartTooltip />}
                    cursor={{ fill: "hsl(var(--muted))", opacity: 0.25, radius: 6 }}
                  />
                  <Bar
                    dataKey="load"
                    name="Workload Share (Load %)"
                    fill="url(#loadBarGradient)"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={38}
                  />
                  <Bar
                    dataKey="performance"
                    name="Task Completion (Performance %)"
                    fill="url(#perfBarGradient)"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={38}
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
