"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  CheckSquare,
  DollarSign,
  Filter,
  Loader2,
  Phone,
  StickyNote,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import { Bar, BarChart, Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  dealsApi,
  salesStagesApi,
  type SalesDashboardActivity,
  type SalesDashboardData,
  type SalesDashboardPeriod,
  type SalesStage,
} from "@/lib/api";
import { useCurrency } from "@/contexts/currency-context";
import { statusBadgeClass } from "@/lib/status-colors";
import { cn } from "@/lib/utils";
import { buildContinuousRevenueTrend } from "@/lib/revenue-trend-series";
import { PageShell } from "@/components/page-shell";

const PERIOD_OPTIONS: {
  value: SalesDashboardPeriod;
  label: string;
  shortLabel: string;
}[] = [
  { value: "today", label: "Today", shortLabel: "Today" },
  { value: "week", label: "This week", shortLabel: "Week" },
  { value: "month", label: "This month", shortLabel: "Month" },
  { value: "quarter", label: "This quarter", shortLabel: "Quarter" },
  { value: "year", label: "This year", shortLabel: "Year" },
];

const funnelChartConfig = {
  total_value: {
    label: "Value",
    color: "var(--sales-funnel-bar)",
  },
} satisfies ChartConfig;

const revenueChartConfig = {
  revenue: {
    label: "Revenue",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

const REVENUE_AREA_GRADIENT_ID = "sales-revenue-area-gradient";

function revenueTrendDescription(
  period: SalesDashboardPeriod,
): string {
  switch (period) {
    case "today":
      return "Hourly sales";
    case "week":
      return "Daily sales";
    case "month":
      return "Weekly sales";
    case "quarter":
      return "Monthly sales";
    case "year":
      return "Quarterly sales";
    default:
      return "Closed-won revenue";
  }
}

function formatStageLabel(stage: string) {
  return stage.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function isExcludedFunnelStage(stage: string) {
  return stage.toLowerCase().includes("project delivered");
}

function formatActivityWhen(value: string) {
  try {
    return new Date(value).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return value;
  }
}

function activityTypeIcon(type: string) {
  switch (type) {
    case "task":
      return CheckSquare;
    case "call":
      return Phone;
    default:
      return StickyNote;
  }
}

function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  loading,
  className,
}: {
  title: string;
  value: string;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  loading?: boolean;
  className?: string;
}) {
  return (
    <Card className={cn("border-border/80", className)}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 p-4 pb-2 sm:p-6 sm:pb-2">
        <div className="min-w-0 space-y-1">
          <CardDescription className="text-xs sm:text-sm">{title}</CardDescription>
          <CardTitle className="text-lg font-semibold tabular-nums sm:text-2xl">
            {loading ? "—" : value}
          </CardTitle>
          {description ? (
            <p className="text-[11px] leading-snug text-muted-foreground sm:text-xs">
              {description}
            </p>
          ) : null}
        </div>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary sm:h-9 sm:w-9">
          <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden />
        </div>
      </CardHeader>
    </Card>
  );
}

function FunnelStageList({
  data,
  maxValue,
  formatCurrency,
}: {
  data: Array<{
    stage: string;
    stageKey: string;
    deal_count: number;
    total_value: number;
  }>;
  maxValue: number;
  formatCurrency: (value: number) => string;
}) {
  return (
    <ul className="space-y-3">
      {data.map((row) => {
        const widthPercent =
          maxValue > 0 ? Math.max((row.total_value / maxValue) * 100, 2) : 0;

        return (
          <li key={row.stageKey} className="space-y-1.5">
            <div className="flex items-start justify-between gap-3">
              <p className="min-w-0 text-sm font-medium leading-snug">
                {row.stage}
              </p>
              <p className="shrink-0 text-sm font-semibold tabular-nums">
                {formatCurrency(row.total_value)}
              </p>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-[var(--sales-funnel-bar)]"
                style={{ width: `${widthPercent}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {row.deal_count.toLocaleString()} deal
              {row.deal_count === 1 ? "" : "s"}
            </p>
          </li>
        );
      })}
    </ul>
  );
}

function RecentActivityItem({
  activity,
}: {
  activity: SalesDashboardActivity;
}) {
  const Icon = activityTypeIcon(activity.type);
  const context = [
    activity.deal_title,
    activity.contact_name,
    activity.company_name,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <li className="flex items-start gap-3 border-b border-border pb-3 last:border-b-0 last:pb-0">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" aria-hidden />
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium truncate">
            {activity.subject || "Untitled activity"}
          </p>
          <Badge variant="outline" className={statusBadgeClass(activity.type)}>
            {activity.type}
          </Badge>
        </div>
        {context ? (
          <p className="text-xs text-muted-foreground truncate">{context}</p>
        ) : null}
        {activity.description ? (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {activity.description}
          </p>
        ) : null}
        <p className="text-xs text-muted-foreground">
          {formatActivityWhen(activity.activity_date)}
        </p>
      </div>
    </li>
  );
}

export function SalesDashboard() {
  const { formatCurrency } = useCurrency();
  const [period, setPeriod] = useState<SalesDashboardPeriod>("month");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stages, setStages] = useState<SalesStage[]>([]);
  const [dashboard, setDashboard] = useState<Awaited<
    ReturnType<typeof dealsApi.getDashboard>
  > | null>(null);

  const loadDashboard = useCallback(
    async (selectedPeriod: SalesDashboardPeriod) => {
      setLoading(true);
      setError(null);
      try {
        const [data, stagesRes] = await Promise.all([
          dealsApi.getDashboard(selectedPeriod),
          salesStagesApi.getAll(),
        ]);
        setDashboard(data);
        setStages(stagesRes.data ?? []);
      } catch {
        setError("Failed to load sales dashboard");
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

  const funnelChartData = useMemo(() => {
    const funnel = dashboard?.funnel ?? [];
    const funnelByStage = new Map(
      funnel.map((row) => [row.stage.toLowerCase(), row]),
    );

    const orderedStages =
      stages.length > 0
        ? [...stages].sort((a, b) => a.sort_order - b.sort_order)
        : [];

    if (orderedStages.length > 0) {
      const fromStages = orderedStages
        .filter((stage) => !isExcludedFunnelStage(stage.name))
        .map((stage) => {
          const row = funnelByStage.get(stage.name.toLowerCase());
          return {
            stage: stage.name,
            stageKey: stage.name.toLowerCase(),
            deal_count: row?.deal_count ?? 0,
            total_value: row?.total_value ?? 0,
          };
        });

      const known = new Set(fromStages.map((row) => row.stageKey));
      const extras = funnel
        .filter(
          (row) =>
            !known.has(row.stage.toLowerCase()) &&
            !isExcludedFunnelStage(row.stage),
        )
        .map((row) => ({
          stage: formatStageLabel(row.stage),
          stageKey: row.stage.toLowerCase(),
          deal_count: row.deal_count,
          total_value: row.total_value,
        }));

      return [...fromStages, ...extras];
    }

    return funnel
      .filter((row) => !isExcludedFunnelStage(row.stage))
      .map((row) => ({
        stage: formatStageLabel(row.stage),
        stageKey: row.stage.toLowerCase(),
        deal_count: row.deal_count,
        total_value: row.total_value,
      }));
  }, [dashboard?.funnel, stages]);

  const maxFunnelValue = useMemo(
    () => Math.max(...funnelChartData.map((row) => row.total_value), 1),
    [funnelChartData],
  );

  const revenueChartData = useMemo(() => {
    return buildContinuousRevenueTrend(dashboard?.revenue_trend ?? [], period);
  }, [dashboard?.revenue_trend, period]);

  const revenueTrendSubtitle = revenueTrendDescription(period);
  const revenueAxisAngle = revenueChartData.length > 6 ? -40 : 0;

  return (
    <PageShell className="space-y-4 md:space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
            Sales dashboard
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Pipeline performance, funnel health, and recent sales activity.
          </p>
        </div>
        <Button
          asChild
          variant="outline"
          size="sm"
          className="w-full shrink-0 sm:w-auto"
        >
          <Link href="/sales/deals">
            View deals
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </Link>
        </Button>
      </header>

      <Tabs
        value={period}
        onValueChange={(value) => setPeriod(value as SalesDashboardPeriod)}
      >
        <div className="-mx-1 overflow-x-auto px-1 pb-1 touch-pan-x sm:mx-0 sm:px-0">
          <TabsList className="inline-flex h-auto w-max min-w-full flex-nowrap gap-1 p-1 sm:w-fit sm:flex-wrap">
            {PERIOD_OPTIONS.map((option) => (
              <TabsTrigger
                key={option.value}
                value={option.value}
                className="px-2.5 text-xs sm:px-3 sm:text-sm"
              >
                <span className="sm:hidden">{option.shortLabel}</span>
                <span className="hidden sm:inline">{option.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
      </Tabs>

      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <section
        aria-label="Sales metrics"
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3"
      >
        <MetricCard
          title="Pipeline value"
          value={formatCurrency(dashboard?.pipeline_value ?? 0)}
          description={`Open deals updated ${periodLabel.toLowerCase()}`}
          icon={TrendingUp}
          loading={loading}
        />
        <MetricCard
          title="Sales value"
          value={formatCurrency(dashboard?.closed_deals_value ?? 0)}
          description={`Closed-won deals ${periodLabel.toLowerCase()}`}
          icon={DollarSign}
          loading={loading}
        />
        <MetricCard
          title="Active deals"
          value={(dashboard?.active_deals ?? 0).toLocaleString()}
          description={`Deals updated ${periodLabel.toLowerCase()}`}
          icon={Target}
          loading={loading}
          className="sm:col-span-2 lg:col-span-1"
        />
      </section>

      <Card className="border-border/80">
        <CardHeader className="p-4 pb-2 sm:p-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            <div className="min-w-0">
              <CardTitle className="text-base">Revenue trend</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                {revenueTrendSubtitle} · {periodLabel.toLowerCase()}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
          {loading ? (
            <div className="flex h-48 items-center justify-center text-sm text-muted-foreground sm:h-56">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading revenue trend…
            </div>
          ) : (
            <div className="-mx-1 overflow-x-auto px-1 touch-pan-x sm:mx-0 sm:px-0">
              <ChartContainer
                config={revenueChartConfig}
                className={cn(
                  "aspect-auto h-[240px] w-full sm:h-[300px] xl:h-[380px]",
                  revenueChartData.length > 8 && "min-w-[36rem]",
                )}
              >
                <AreaChart
                  data={revenueChartData}
                  margin={{
                    left: 0,
                    right: 12,
                    top: 12,
                    bottom: revenueChartData.length > 5 ? 52 : 16,
                  }}
                >
                  <defs>
                    <linearGradient
                      id={REVENUE_AREA_GRADIENT_ID}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="var(--color-revenue)"
                        stopOpacity={0.38}
                      />
                      <stop
                        offset="55%"
                        stopColor="var(--color-revenue)"
                        stopOpacity={0.12}
                      />
                      <stop
                        offset="100%"
                        stopColor="var(--color-revenue)"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    vertical={false}
                    strokeDasharray="4 4"
                    className="stroke-border/50"
                  />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                    interval={0}
                    angle={revenueAxisAngle}
                    textAnchor={revenueAxisAngle ? "end" : "middle"}
                    height={revenueAxisAngle ? 60 : 36}
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={4}
                    width={52}
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    domain={[0, "auto"]}
                    tickFormatter={(value: number) => {
                      if (value >= 1_000_000) {
                        return `${(value / 1_000_000).toFixed(1)}M`;
                      }
                      if (value >= 1_000) {
                        return `${(value / 1_000).toFixed(0)}K`;
                      }
                      return value.toLocaleString();
                    }}
                  />
                <ChartTooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const value = payload[0]?.value;
                    const row = payload[0]?.payload as {
                      tooltipLabel?: string;
                      label?: string;
                    };
                    return (
                      <div className="grid min-w-[10rem] gap-1.5 rounded-lg border border-border/50 bg-background/95 px-3 py-2 text-xs shadow-xl backdrop-blur-sm">
                        <span className="font-medium text-foreground">
                          {row.tooltipLabel ?? row.label}
                        </span>
                        <span className="font-mono text-sm font-semibold text-foreground">
                          {formatCurrency(Number(value))}
                        </span>
                      </div>
                    );
                  }}
                />
                <Area
                  type="natural"
                  dataKey="revenue"
                  stroke="var(--color-revenue)"
                  strokeWidth={2.5}
                  fill={`url(#${REVENUE_AREA_GRADIENT_ID})`}
                  dot={
                    revenueChartData.length <= 16
                      ? {
                          r: 3.5,
                          fill: "hsl(var(--background))",
                          stroke: "var(--color-revenue)",
                          strokeWidth: 2,
                        }
                      : false
                  }
                  activeDot={{
                    r: 6,
                    fill: "var(--color-revenue)",
                    stroke: "hsl(var(--background))",
                    strokeWidth: 2,
                  }}
                />
              </AreaChart>
            </ChartContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-5 xl:grid-cols-3">
        <Card className="border-border/80 lg:col-span-3 xl:col-span-2">
          <CardHeader className="p-4 pb-2 sm:p-6">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              <div className="min-w-0">
                <CardTitle className="text-base">Sales funnel</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Open deals by stage (value) · {periodLabel.toLowerCase()}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
            {loading ? (
              <div className="flex h-48 items-center justify-center text-sm text-muted-foreground sm:h-64">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading funnel…
              </div>
            ) : funnelChartData.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground sm:py-12">
                No open deals in this period.
              </p>
            ) : (
              <>
                <div className="md:hidden [--sales-funnel-bar:var(--chart-1)]">
                  <FunnelStageList
                    data={funnelChartData}
                    maxValue={maxFunnelValue}
                    formatCurrency={formatCurrency}
                  />
                </div>
                <div className="hidden md:block [--sales-funnel-bar:var(--chart-1)]">
                  <ChartContainer
                    config={funnelChartConfig}
                    className="aspect-auto w-full"
                    style={{
                      height: Math.min(
                        480,
                        Math.max(280, funnelChartData.length * 40),
                      ),
                    }}
                  >
                  <BarChart
                    data={funnelChartData}
                    layout="vertical"
                    margin={{ left: 8, right: 16, top: 8, bottom: 8 }}
                  >
                    <CartesianGrid horizontal={false} />
                    <XAxis
                      type="number"
                      allowDecimals={false}
                      domain={[0, maxFunnelValue]}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value: number) => {
                        if (value >= 1_000_000) {
                          return `${(value / 1_000_000).toFixed(1)}M`;
                        }
                        if (value >= 1_000) {
                          return `${(value / 1_000).toFixed(0)}K`;
                        }
                        return value.toLocaleString();
                      }}
                    />
                    <YAxis
                      type="category"
                      dataKey="stage"
                      width={140}
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tick={{ fontSize: 12 }}
                    />
                    <ChartTooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const row = payload[0]?.payload as {
                          stage?: string;
                          deal_count?: number;
                          total_value?: number;
                        };
                        return (
                          <div className="grid min-w-[8rem] gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl">
                            <span className="font-medium">{row?.stage}</span>
                            <span className="text-muted-foreground">
                              {(row?.deal_count ?? 0).toLocaleString()} deal
                              {(row?.deal_count ?? 0) === 1 ? "" : "s"}
                            </span>
                            <span className="font-mono text-foreground">
                              {formatCurrency(row?.total_value ?? 0)}
                            </span>
                          </div>
                        );
                      }}
                    />
                    <Bar
                      dataKey="total_value"
                      fill="var(--color-total_value)"
                      radius={[0, 6, 6, 0]}
                      barSize={24}
                    />
                  </BarChart>
                </ChartContainer>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/80 lg:col-span-2 xl:col-span-1">
          <CardHeader className="flex flex-col gap-3 p-4 pb-2 sm:flex-row sm:items-start sm:justify-between sm:p-6 sm:pb-2">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              <div className="min-w-0">
                <CardTitle className="text-base">Recent activity</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  {periodLabel}
                </CardDescription>
              </div>
            </div>
            <Button asChild variant="ghost" size="sm" className="w-full shrink-0 sm:w-auto">
              <Link href="/sales/activities">All</Link>
            </Button>
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading activity…</p>
            ) : (dashboard?.recent_activities?.length ?? 0) === 0 ? (
              <p className="text-sm text-muted-foreground">
                No activity recorded for this period.
              </p>
            ) : (
              <ul className="space-y-3">
                {dashboard?.recent_activities.map((activity) => (
                  <RecentActivityItem key={activity.id} activity={activity} />
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <section aria-label="Quick links">
        <Card className="border-border/80">
          <CardHeader className="p-4 pb-2 sm:p-6">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              Quick links
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2 p-4 pt-0 sm:flex sm:flex-wrap sm:p-6 sm:pt-0">
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link href="/sales/deals">Deals</Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link href="/sales/contacts">Contacts</Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link href="/sales/companies">Companies</Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link href="/sales/activities">Activities</Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </PageShell>
  );
}
