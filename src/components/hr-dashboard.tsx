"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Clock, Loader2, UserCheck, Users } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  employeesApi,
  type HrDashboardData,
  type HrDashboardPeriod,
} from "@/lib/api";
import { EMPLOYEES_BASE_PATH } from "@/lib/employee-routes";

const PERIOD_OPTIONS: { value: HrDashboardPeriod; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "week", label: "This week" },
  { value: "month", label: "This month" },
  { value: "quarter", label: "This quarter" },
  { value: "year", label: "This year" },
];

const timeLoggedChartConfig = {
  hours_logged: {
    label: "Hours logged",
    color: "hsl(var(--chart-1, 220 70% 50%))",
  },
} satisfies ChartConfig;

function chartHeight(rowCount: number, min = 240, max = 560) {
  return Math.min(max, Math.max(min, rowCount * 36 + 48));
}

function formatHours(hours: number): string {
  if (hours >= 10) return `${hours.toFixed(1)}h`;
  if (hours >= 1) return `${hours.toFixed(1)}h`;
  return `${Math.round(hours * 60)}m`;
}

function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  loading,
}: {
  title: string;
  value: string;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  loading?: boolean;
}) {
  return (
    <Card className="border-border/80">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardDescription>{title}</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums">
            {loading ? "—" : value}
          </CardTitle>
          {description ? (
            <p className="text-xs text-muted-foreground">{description}</p>
          ) : null}
        </div>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-4 w-4" aria-hidden />
        </div>
      </CardHeader>
    </Card>
  );
}

export function HrDashboard() {
  const [period, setPeriod] = useState<HrDashboardPeriod>("month");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboard, setDashboard] = useState<HrDashboardData | null>(null);

  const loadDashboard = useCallback(async (selectedPeriod: HrDashboardPeriod) => {
    setLoading(true);
    setError(null);
    try {
      const data = await employeesApi.getDashboard(selectedPeriod);
      setDashboard(data);
    } catch {
      setError("Failed to load HR dashboard");
      setDashboard(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard(period);
  }, [period, loadDashboard]);

  const periodLabel =
    PERIOD_OPTIONS.find((option) => option.value === period)?.label ??
    "This month";

  const attendanceRows = useMemo(
    () => dashboard?.active_employees_by_attendance ?? [],
    [dashboard?.active_employees_by_attendance],
  );

  const timeLoggedData = useMemo(
    () => dashboard?.employees_by_time_logged ?? [],
    [dashboard?.employees_by_time_logged],
  );

  const maxHoursLogged = useMemo(
    () => Math.max(...timeLoggedData.map((row) => row.hours_logged), 1),
    [timeLoggedData],
  );

  const avgPresentValue = loading
    ? "—"
    : (dashboard?.avg_employees_present ?? 0).toLocaleString(undefined, {
        maximumFractionDigits: 1,
      });

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-8 space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            HR dashboard
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Headcount, attendance, and time logged across your active
            workforce.
          </p>
        </div>
        <Button asChild variant="outline" size="sm" className="shrink-0">
          <Link href={EMPLOYEES_BASE_PATH}>
            View employees
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </Link>
        </Button>
      </header>

      <Tabs
        value={period}
        onValueChange={(value) => setPeriod(value as HrDashboardPeriod)}
      >
        <TabsList className="h-auto flex-wrap">
          {PERIOD_OPTIONS.map((option) => (
            <TabsTrigger key={option.value} value={option.value}>
              {option.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <section
        aria-label="HR metrics"
        className="grid gap-4 sm:grid-cols-2"
      >
        <MetricCard
          title="Total active employees"
          value={(dashboard?.total_active_employees ?? 0).toLocaleString()}
          description="Currently active in the directory"
          icon={Users}
          loading={loading}
        />
        <MetricCard
          title="Avg employees present"
          value={avgPresentValue}
          description={`Average daily check-ins · ${periodLabel.toLowerCase()}`}
          icon={UserCheck}
          loading={loading}
        />
      </section>

      <Card className="border-border/80">
        <CardHeader>
          <CardTitle className="text-base">
            Active employees by attendance count
          </CardTitle>
          <CardDescription>
            Days with check-in · {periodLabel.toLowerCase()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-40 items-center justify-center text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading attendance…
            </div>
          ) : attendanceRows.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No active employees found.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead className="text-right">Attendance days</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendanceRows.map((row) => (
                  <TableRow key={row.employee_id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`${EMPLOYEES_BASE_PATH}/${row.employee_id}`}
                        className="hover:underline"
                      >
                        {row.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {row.emp_code}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {row.department || "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row.attendance_count.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/80">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" aria-hidden />
            <div>
              <CardTitle className="text-base">
                Employees by time logged
              </CardTitle>
              <CardDescription>
                Total hours from check-in/out · {periodLabel.toLowerCase()}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-56 items-center justify-center text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading chart…
            </div>
          ) : timeLoggedData.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No time logged in this period.
            </p>
          ) : (
            <ChartContainer
              config={timeLoggedChartConfig}
              className="w-full"
              style={{ height: chartHeight(timeLoggedData.length) }}
            >
              <BarChart
                data={timeLoggedData}
                layout="vertical"
                margin={{ left: 8, right: 16, top: 8, bottom: 8 }}
              >
                <CartesianGrid horizontal={false} />
                <XAxis
                  type="number"
                  domain={[0, maxHoursLogged]}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value: number) => formatHours(value)}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={120}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <ChartTooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const value = Number(payload[0]?.value ?? 0);
                    return (
                      <div className="grid min-w-[8rem] gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl">
                        <span className="font-medium">
                          {payload[0]?.payload?.name}
                        </span>
                        <span className="font-mono text-foreground">
                          {formatHours(value)}
                        </span>
                      </div>
                    );
                  }}
                />
                <Bar
                  dataKey="hours_logged"
                  fill="var(--color-hours_logged)"
                  radius={[0, 6, 6, 0]}
                  barSize={22}
                />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
