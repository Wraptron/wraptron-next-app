"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Box,
  Briefcase,
  CreditCard,
  Grid3x3,
  Receipt,
  Settings,
  Store,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import {
  filterStaffOnlyModules,
  filterStaffOnlyQuickLinks,
} from "@/lib/nav-access";
import {
  EMPLOYEES_BASE_PATH,
  HR_SKILL_MATRIX_PATH,
} from "@/lib/employee-routes";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

export type DashboardQuickLink = {
  href: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
};

const DEFAULT_QUICK_LINKS: DashboardQuickLink[] = [
  {
    href: "/sales/deals",
    title: "Sales",
    description: "Deals, contacts, and pipeline",
    icon: TrendingUp,
  },
  {
    href: "/projects",
    title: "Projects",
    description: "Projects and delivery tasks",
    icon: Box,
  },
  {
    href: "/products",
    title: "Products",
    description: "Catalog and inventory",
    icon: Store,
  },
  {
    href: EMPLOYEES_BASE_PATH,
    title: "Employees",
    description: "Directory and profiles",
    icon: Users,
  },
  {
    href: HR_SKILL_MATRIX_PATH,
    title: "Skill matrix",
    description: "Team skills and levels",
    icon: Grid3x3,
  },
  {
    href: "/workspace/attendance",
    title: "Attendance",
    description: "Timesheets and attendance",
    icon: Briefcase,
  },
  {
    href: "/accounts",
    title: "Accounts",
    description: "Transactions and ledger",
    icon: CreditCard,
  },
  {
    href: "/invoices",
    title: "Invoices",
    description: "Billing and invoices",
    icon: Receipt,
  },
  {
    href: "/settings",
    title: "Settings",
    description: "Workspace and preferences",
    icon: Settings,
  },
];

export interface DashboardProps {
  /** Main heading inside the page (navbar title is set separately). */
  title?: string;
  description?: string;
  /** Optional header actions (e.g. buttons). */
  actions?: React.ReactNode;
  /** Replaces the default quick-link grid when provided. */
  children?: React.ReactNode;
  /** Override default shortcuts. */
  quickLinks?: DashboardQuickLink[];
  /** Module cards with chart data to render below quick links. */
  modules?: DashboardModule[];
  className?: string;
}

export type DashboardModuleChartPoint = {
  label: string;
  [metricKey: string]: string | number;
};

export interface DashboardModule {
  id: string;
  title: string;
  description?: string;
  href?: string;
  metricKey: string;
  metricLabel?: string;
  metricValue: number;
  chartTitle?: string;
  chartDescription?: string;
  chartData: DashboardModuleChartPoint[];
  chartConfig: ChartConfig;
}

const FALLBACK_MODULES: DashboardModule[] = [
  {
    id: "sales",
    title: "Sales",
    description: "Deals created and pipeline trend",
    href: "/sales/deals",
    metricKey: "deals",
    metricLabel: "Open deals",
    metricValue: 42,
    chartTitle: "Deals over 6 weeks",
    chartDescription: "Weekly count of new deals",
    chartData: [
      { label: "W1", deals: 4 },
      { label: "W2", deals: 6 },
      { label: "W3", deals: 8 },
      { label: "W4", deals: 5 },
      { label: "W5", deals: 9 },
      { label: "W6", deals: 10 },
    ],
    chartConfig: {
      deals: {
        label: "Deals",
        color: "var(--chart-1)",
      },
    },
  },
  {
    id: "projects",
    title: "Projects",
    description: "Delivery and execution velocity",
    href: "/projects",
    metricKey: "tasks",
    metricLabel: "Completed tasks",
    metricValue: 128,
    chartTitle: "Completed tasks",
    chartDescription: "Last 6 weeks",
    chartData: [
      { label: "W1", tasks: 12 },
      { label: "W2", tasks: 17 },
      { label: "W3", tasks: 19 },
      { label: "W4", tasks: 20 },
      { label: "W5", tasks: 28 },
      { label: "W6", tasks: 32 },
    ],
    chartConfig: {
      tasks: {
        label: "Tasks",
        color: "var(--chart-2)",
      },
    },
  },
  {
    id: "accounts",
    title: "Accounts",
    description: "Revenue performance snapshot",
    href: "/accounts",
    metricKey: "revenue",
    metricLabel: "Monthly revenue",
    metricValue: 94000,
    chartTitle: "Revenue trend",
    chartDescription: "Last 6 weeks",
    chartData: [
      { label: "W1", revenue: 12000 },
      { label: "W2", revenue: 14600 },
      { label: "W3", revenue: 13400 },
      { label: "W4", revenue: 16100 },
      { label: "W5", revenue: 17400 },
      { label: "W6", revenue: 20500 },
    ],
    chartConfig: {
      revenue: {
        label: "Revenue",
        color: "var(--chart-3)",
      },
    },
  },
];

export function Dashboard({
  title = "Dashboard",
  description = "Open a module or use search to go anywhere.",
  actions,
  children,
  quickLinks = DEFAULT_QUICK_LINKS,
  modules = FALLBACK_MODULES,
  className,
}: DashboardProps) {
  const { user } = useAuth();
  const visibleQuickLinks = React.useMemo(
    () => filterStaffOnlyQuickLinks(quickLinks, user?.role),
    [quickLinks, user?.role],
  );
  const visibleModules = React.useMemo(
    () => filterStaffOnlyModules(modules, user?.role),
    [modules, user?.role],
  );

  return (
    <div
      className={cn(
        "min-h-0 flex-1 overflow-y-auto bg-background text-foreground",
        className,
      )}
    >
      <div className="w-full px-4 py-6 md:px-6 md:py-8 lg:px-8 xl:px-10">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            {description ? (
              <p className="text-sm text-muted-foreground max-w-2xl">
                {description}
              </p>
            ) : null}
          </div>
          {actions ? (
            <div className="shrink-0 flex flex-wrap gap-2">{actions}</div>
          ) : null}
        </header>

        <div className="mt-8 space-y-6">
          {children ?? (
            <>
              <section aria-label="Shortcuts">
                <h2 className="sr-only">Shortcuts</h2>
                <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {visibleQuickLinks.map((item) => {
                    const Icon = item.icon;
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className="group block h-full rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                          <Card className="h-full border-border/80 transition-colors hover:bg-accent/40 hover:border-border">
                            <CardHeader className="gap-3">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                  <Icon className="h-5 w-5" aria-hidden />
                                </div>
                                <ArrowRight
                                  className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
                                  aria-hidden
                                />
                              </div>
                              <div className="space-y-1">
                                <CardTitle className="text-base font-medium leading-snug">
                                  {item.title}
                                </CardTitle>
                                <CardDescription className="text-sm leading-relaxed">
                                  {item.description}
                                </CardDescription>
                              </div>
                            </CardHeader>
                          </Card>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>

              <section aria-label="Module analytics" className="space-y-3">
                <div className="flex items-center gap-2">
                  <BarChart3
                    className="h-4 w-4 text-muted-foreground"
                    aria-hidden
                  />
                  <h2 className="text-sm font-medium text-muted-foreground">
                    Module analytics
                  </h2>
                </div>
                <ul className="grid gap-4 xl:grid-cols-3">
                  {visibleModules.map((module) => (
                    <li key={module.id}>
                      <Card className="h-full border-border/80">
                        <CardHeader className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <CardTitle className="text-base">
                                {module.title}
                              </CardTitle>
                              {module.description ? (
                                <CardDescription>
                                  {module.description}
                                </CardDescription>
                              ) : null}
                            </div>
                            {module.href ? (
                              <Link
                                href={module.href}
                                className="text-xs text-primary hover:underline"
                              >
                                Open
                              </Link>
                            ) : null}
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">
                              {module.metricLabel ?? module.metricKey}
                            </p>
                            <p className="text-2xl font-semibold tracking-tight">
                              {module.metricValue.toLocaleString()}
                            </p>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="space-y-1">
                            <p className="text-sm font-medium">
                              {module.chartTitle ?? "Trend"}
                            </p>
                            {module.chartDescription ? (
                              <p className="text-xs text-muted-foreground">
                                {module.chartDescription}
                              </p>
                            ) : null}
                          </div>
                          <ChartContainer
                            config={module.chartConfig}
                            className="h-44 w-full"
                          >
                            <BarChart data={module.chartData}>
                              <CartesianGrid vertical={false} />
                              <XAxis
                                dataKey="label"
                                tickLine={false}
                                axisLine={false}
                                tickMargin={8}
                              />
                              <ChartTooltip content={<ChartTooltipContent />} />
                              <ChartLegend content={<ChartLegendContent />} />
                              <Bar
                                dataKey={module.metricKey}
                                fill={`var(--color-${module.metricKey})`}
                                radius={6}
                              />
                            </BarChart>
                          </ChartContainer>
                        </CardContent>
                      </Card>
                    </li>
                  ))}
                </ul>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
