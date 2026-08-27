"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CheckSquare,
  FolderKanban,
  Loader2,
  Users,
} from "lucide-react";
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
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  projectsApi,
  type ProjectDashboardData,
  type ProjectDashboardPeriod,
} from "@/lib/api";

const PERIOD_OPTIONS: { value: ProjectDashboardPeriod; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "week", label: "This week" },
  { value: "month", label: "This month" },
  { value: "quarter", label: "This quarter" },
  { value: "year", label: "This year" },
];

const projectsByMemberChartConfig = {
  project_count: {
    label: "Projects",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

const memberTasksChartConfig = {
  tasks_done: {
    label: "Completed",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

const activeProjectsChartConfig = {
  project_count: {
    label: "Projects",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

const workloadChartConfig = {
  open_tasks: {
    label: "Open tasks",
    color: "var(--chart-4)",
  },
} satisfies ChartConfig;

function formatStatusLabel(status: string) {
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function chartHeight(rowCount: number, min = 240, max = 480) {
  return Math.min(max, Math.max(min, rowCount * 36 + 48));
}

function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  loading,
  href,
}: {
  title: string;
  value: string;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  loading?: boolean;
  href?: string;
}) {
  const content = (
    <Card
      className={
        href
          ? "border-border/80 transition-colors hover:border-primary/40 hover:bg-muted/30"
          : "border-border/80"
      }
    >
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

  if (!href) return content;

  return (
    <Link href={href} className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      {content}
    </Link>
  );
}

function HorizontalBarChartCard({
  title,
  description,
  loading,
  emptyMessage,
  dataLength,
  config,
  children,
}: {
  title: string;
  description: string;
  loading: boolean;
  emptyMessage: string;
  dataLength: number;
  config: ChartConfig;
  children: React.ReactNode;
}) {
  return (
    <Card className="border-border/80">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex h-56 items-center justify-center text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading chart…
          </div>
        ) : dataLength === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            {emptyMessage}
          </p>
        ) : (
          <ChartContainer
            config={config}
            className="w-full"
            style={{ height: chartHeight(dataLength) }}
          >
            {children}
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}

export function ProjectDashboard() {
  const [period, setPeriod] = useState<ProjectDashboardPeriod>("month");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboard, setDashboard] = useState<ProjectDashboardData | null>(null);

  const loadDashboard = useCallback(
    async (selectedPeriod: ProjectDashboardPeriod) => {
      setLoading(true);
      setError(null);
      try {
        const data = await projectsApi.getDashboard(selectedPeriod);
        setDashboard(data);
      } catch {
        setError("Failed to load project dashboard");
        setDashboard(null);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    void loadDashboard(period);
  }, [period, loadDashboard]);

  const periodLabel =
    PERIOD_OPTIONS.find((option) => option.value === period)?.label ??
    "This month";

  const projectsByMemberData = useMemo(
    () => dashboard?.projects_by_member ?? [],
    [dashboard?.projects_by_member],
  );

  const memberTasksData = useMemo(() => {
    const rows = dashboard?.member_tasks ?? [];
    return rows
      .filter((row) => row.tasks_done > 0)
      .sort(
        (a, b) =>
          b.tasks_done - a.tasks_done || a.name.localeCompare(b.name),
      );
  }, [dashboard?.member_tasks]);

  const activeProjectsByStatusData = useMemo(
    () =>
      (dashboard?.active_projects_by_status ?? []).map((row) => ({
        ...row,
        statusLabel: formatStatusLabel(row.status),
      })),
    [dashboard?.active_projects_by_status],
  );

  const teamWorkloadData = useMemo(
    () => dashboard?.team_workload ?? [],
    [dashboard?.team_workload],
  );

  const maxProjectsByMember = useMemo(
    () => Math.max(...projectsByMemberData.map((row) => row.project_count), 1),
    [projectsByMemberData],
  );

  const maxMemberTasks = useMemo(
    () => Math.max(...memberTasksData.map((row) => row.tasks_done), 1),
    [memberTasksData],
  );

  const maxActiveProjects = useMemo(
    () =>
      Math.max(
        ...activeProjectsByStatusData.map((row) => row.project_count),
        1,
      ),
    [activeProjectsByStatusData],
  );

  const maxWorkload = useMemo(
    () => Math.max(...teamWorkloadData.map((row) => row.open_tasks), 1),
    [teamWorkloadData],
  );

  const completedTasksValue = loading
    ? "—"
    : `${(dashboard?.completed_tasks ?? 0).toLocaleString()} / ${(dashboard?.total_tasks ?? 0).toLocaleString()}`;

  return (
    <div className="w-full px-4 py-6 md:px-6 md:py-8 lg:px-8 xl:px-10 space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Project dashboard
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Delivery metrics, team workload, and project activity for the
            selected period.
          </p>
        </div>
        <Button asChild variant="outline" size="sm" className="shrink-0">
          <Link href="/projects">
            View projects
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </Link>
        </Button>
      </header>

      <Tabs
        value={period}
        onValueChange={(value) => setPeriod(value as ProjectDashboardPeriod)}
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
        aria-label="Project metrics"
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      >
        <MetricCard
          title="Active projects"
          value={(dashboard?.active_projects ?? 0).toLocaleString()}
          description={`Projects updated ${periodLabel.toLowerCase()}`}
          icon={FolderKanban}
          loading={loading}
        />
        <MetricCard
          title="Completed tasks"
          value={completedTasksValue}
          description={`Done / total tasks · ${periodLabel.toLowerCase()}`}
          icon={CheckSquare}
          loading={loading}
        />
        <MetricCard
          title="Overdue tasks"
          value={(dashboard?.overdue_tasks ?? 0).toLocaleString()}
          description="Open tasks past due date"
          icon={AlertTriangle}
          loading={loading}
          href="/tasks?overdue=true"
        />
      </section>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <HorizontalBarChartCard
          title="Tasks by team member"
          description={`Completed tasks · ${periodLabel.toLowerCase()}`}
          loading={loading}
          emptyMessage="No completed tasks for this period."
          dataLength={memberTasksData.length}
          config={memberTasksChartConfig}
        >
          <BarChart
            data={memberTasksData}
            layout="vertical"
            margin={{ left: 8, right: 16, top: 8, bottom: 8 }}
          >
            <CartesianGrid horizontal={false} />
            <XAxis
              type="number"
              allowDecimals={false}
              domain={[0, maxMemberTasks]}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={120}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar
              dataKey="tasks_done"
              fill="var(--color-tasks_done)"
              radius={[0, 6, 6, 0]}
              barSize={22}
            />
          </BarChart>
        </HorizontalBarChartCard>

        <HorizontalBarChartCard
          title="Team workload by employee"
          description="Open tasks currently assigned"
          loading={loading}
          emptyMessage="No open tasks assigned to team members."
          dataLength={teamWorkloadData.length}
          config={workloadChartConfig}
        >
          <BarChart
            data={teamWorkloadData}
            layout="vertical"
            margin={{ left: 8, right: 16, top: 8, bottom: 8 }}
          >
            <CartesianGrid horizontal={false} />
            <XAxis
              type="number"
              allowDecimals={false}
              domain={[0, maxWorkload]}
              tickLine={false}
              axisLine={false}
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
                const row = payload[0]?.payload as {
                  name?: string;
                  open_tasks?: number;
                  estimate_hours?: number;
                };
                return (
                  <div className="grid min-w-[8rem] gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl">
                    <span className="font-medium">{row.name}</span>
                    <span className="font-mono text-foreground">
                      {Number(row.open_tasks ?? 0).toLocaleString()} open tasks
                    </span>
                    <span className="text-muted-foreground">
                      {Number(row.estimate_hours ?? 0).toLocaleString()} est.
                      hours
                    </span>
                  </div>
                );
              }}
            />
            <Bar
              dataKey="open_tasks"
              fill="var(--color-open_tasks)"
              radius={[0, 6, 6, 0]}
              barSize={22}
            />
          </BarChart>
        </HorizontalBarChartCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <HorizontalBarChartCard
          title="Active projects by status"
          description={`Projects updated ${periodLabel.toLowerCase()} · grouped by status`}
          loading={loading}
          emptyMessage="No projects updated in this period."
          dataLength={activeProjectsByStatusData.length}
          config={activeProjectsChartConfig}
        >
          <BarChart
            data={activeProjectsByStatusData}
            layout="vertical"
            margin={{ left: 8, right: 16, top: 8, bottom: 8 }}
          >
            <CartesianGrid horizontal={false} />
            <XAxis
              type="number"
              allowDecimals={false}
              domain={[0, maxActiveProjects]}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              type="category"
              dataKey="statusLabel"
              width={120}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar
              dataKey="project_count"
              fill="var(--color-project_count)"
              radius={[0, 6, 6, 0]}
              barSize={22}
            />
          </BarChart>
        </HorizontalBarChartCard>

        <HorizontalBarChartCard
          title="Projects by team member"
          description="Number of projects per team member"
          loading={loading}
          emptyMessage="No team members linked to projects yet."
          dataLength={projectsByMemberData.length}
          config={projectsByMemberChartConfig}
        >
          <BarChart
            data={projectsByMemberData}
            layout="vertical"
            margin={{ left: 8, right: 16, top: 8, bottom: 8 }}
          >
            <CartesianGrid horizontal={false} />
            <XAxis
              type="number"
              allowDecimals={false}
              domain={[0, maxProjectsByMember]}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={120}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar
              dataKey="project_count"
              fill="var(--color-project_count)"
              radius={[0, 6, 6, 0]}
              barSize={22}
            />
          </BarChart>
        </HorizontalBarChartCard>
      </div>

      <section aria-label="Quick links">
        <Card className="border-border/80">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              Quick links
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/projects">Projects</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/projects/tasks">Tasks</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/projects/new">New project</Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
