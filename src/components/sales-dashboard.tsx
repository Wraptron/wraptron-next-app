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
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
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
  ChartTooltipContent,
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
import { PageShell } from "@/components/page-shell";

const PERIOD_OPTIONS: { value: SalesDashboardPeriod; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "week", label: "This week" },
  { value: "month", label: "This month" },
  { value: "quarter", label: "This quarter" },
  { value: "year", label: "This year" },
];

const funnelChartConfig = {
  deal_count: {
    label: "Deals",
    color: "var(--sales-funnel-bar)",
  },
} satisfies ChartConfig;

const revenueChartConfig = {
  revenue: {
    label: "Revenue",
    color: "hsl(var(--chart-2, 150 55% 45%))",
  },
} satisfies ChartConfig;

function revenueTrendDescription(
  granularity: SalesDashboardData["revenue_trend_granularity"] | undefined,
): string {
  switch (granularity) {
    case "daily":
      return "Daily sales";
    case "weekly":
      return "Weekly sales";
    case "quarterly":
      return "Quarterly sales";
    case "yearly":
      return "Yearly sales";
    default:
      return "Closed-won revenue";
  }
}

function formatRevenueTrendLabel(
  bucket: string,
  period: SalesDashboardPeriod,
): string {
  const date = new Date(bucket);
  if (Number.isNaN(date.getTime())) return bucket;

  switch (period) {
    case "today":
      return date.toLocaleTimeString(undefined, {
        hour: "numeric",
        minute: "2-digit",
      });
    case "week":
      return date.toLocaleDateString(undefined, {
        weekday: "short",
        day: "numeric",
      });
    case "month":
      return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });
    case "quarter":
      return date.toLocaleDateString(undefined, {
        month: "short",
      });
    case "year": {
      const quarter = Math.floor(date.getMonth() / 3) + 1;
      return `Q${quarter}`;
    }
    default:
      return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });
  }
}

function formatStageLabel(stage: string) {
  return stage.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
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
      funnel.map((row) => [row.stage.toLowerCase(), row.deal_count]),
    );

    const orderedStages =
      stages.length > 0
        ? [...stages].sort((a, b) => a.sort_order - b.sort_order)
        : [];

    if (orderedStages.length > 0) {
      const fromStages = orderedStages.map((stage) => ({
        stage: stage.name,
        stageKey: stage.name.toLowerCase(),
        deal_count: funnelByStage.get(stage.name.toLowerCase()) ?? 0,
      }));

      const known = new Set(fromStages.map((row) => row.stageKey));
      const extras = funnel
        .filter((row) => !known.has(row.stage.toLowerCase()))
        .map((row) => ({
          stage: formatStageLabel(row.stage),
          stageKey: row.stage.toLowerCase(),
          deal_count: row.deal_count,
        }));

      return [...fromStages, ...extras];
    }

    return funnel.map((row) => ({
      stage: formatStageLabel(row.stage),
      stageKey: row.stage.toLowerCase(),
      deal_count: row.deal_count,
    }));
  }, [dashboard?.funnel, stages]);

  const maxFunnelCount = useMemo(
    () => Math.max(...funnelChartData.map((row) => row.deal_count), 1),
    [funnelChartData],
  );

  const revenueChartData = useMemo(() => {
    return (dashboard?.revenue_trend ?? []).map((point) => ({
      ...point,
      label: formatRevenueTrendLabel(point.bucket, period),
    }));
  }, [dashboard?.revenue_trend, period]);

  const revenueTrendSubtitle = revenueTrendDescription(
    dashboard?.revenue_trend_granularity,
  );

  return (
    <PageShell className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Sales dashboard
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Pipeline performance, funnel health, and recent sales activity.
          </p>
        </div>
        <Button asChild variant="outline" size="sm" className="shrink-0">
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
        aria-label="Sales metrics"
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      >
        <MetricCard
          title="Pipeline value"
          value={formatCurrency(dashboard?.pipeline_value ?? 0)}
          description={`Open deals updated ${periodLabel.toLowerCase()}`}
          icon={TrendingUp}
          loading={loading}
        />
        <MetricCard
          title="Closed deals value"
          value={formatCurrency(dashboard?.closed_deals_value ?? 0)}
          description={`Won deals closed ${periodLabel.toLowerCase()}`}
          icon={DollarSign}
          loading={loading}
        />
        <MetricCard
          title="Active deals"
          value={(dashboard?.active_deals ?? 0).toLocaleString()}
          description={`Deals updated ${periodLabel.toLowerCase()}`}
          icon={Target}
          loading={loading}
        />
      </section>

      <Card className="border-border/80">
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" aria-hidden />
            <div>
              <CardTitle className="text-base">Revenue trend</CardTitle>
              <CardDescription>
                {revenueTrendSubtitle} · {periodLabel.toLowerCase()}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-56 items-center justify-center text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading revenue trend…
            </div>
          ) : revenueChartData.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No closed-won revenue in this period.
            </p>
          ) : (
            <ChartContainer
              config={revenueChartConfig}
              className="h-[280px] w-full xl:h-[360px]"
            >
              <BarChart
                data={revenueChartData}
                margin={{ left: 8, right: 16, top: 8, bottom: 8 }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={24}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  width={72}
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
                    return (
                      <div className="grid min-w-[8rem] gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl">
                        <span className="font-medium">
                          {payload[0]?.payload?.label}
                        </span>
                        <span className="font-mono text-foreground">
                          {formatCurrency(Number(value))}
                        </span>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="revenue" fill="var(--color-revenue)" radius={6} />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-5 xl:grid-cols-3">
        <Card className="border-border/80 lg:col-span-3 xl:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" aria-hidden />
              <div>
                <CardTitle className="text-base">Sales funnel</CardTitle>
                <CardDescription>
                  Open deals by stage · {periodLabel.toLowerCase()}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex h-64 items-center justify-center text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading funnel…
              </div>
            ) : funnelChartData.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">
                No open deals in this period.
              </p>
            ) : (
              <div className="[--sales-funnel-bar:oklch(0.62_0.17_152)] dark:[--sales-funnel-bar:oklch(0.55_0.22_264)]">
                <ChartContainer
                  config={funnelChartConfig}
                  className="h-[320px] w-full xl:h-[400px]"
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
                      domain={[0, maxFunnelCount]}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="stage"
                      width={120}
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar
                      dataKey="deal_count"
                      fill="var(--color-deal_count)"
                      radius={[0, 6, 6, 0]}
                      barSize={24}
                    />
                  </BarChart>
                </ChartContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/80 lg:col-span-2 xl:col-span-1">
          <CardHeader className="flex flex-row items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" aria-hidden />
              <div>
                <CardTitle className="text-base">Recent activity</CardTitle>
                <CardDescription>{periodLabel}</CardDescription>
              </div>
            </div>
            <Button asChild variant="ghost" size="sm" className="shrink-0">
              <Link href="/sales/activities">All</Link>
            </Button>
          </CardHeader>
          <CardContent>
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
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              Quick links
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/sales/deals">Deals</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/sales/contacts">Contacts</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/sales/companies">Companies</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/sales/activities">Activities</Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </PageShell>
  );
}
