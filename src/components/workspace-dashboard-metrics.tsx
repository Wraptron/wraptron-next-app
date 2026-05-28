"use client";

import * as React from "react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { AttendanceSession } from "@/lib/api";

type WorkspaceDashboardMetricsProps = {
  assignedTasksCount: number;
  completedTasksCount: number;
  sessions: AttendanceSession[];
};

type ChartKey = "assigned" | "completed";

const chartConfig = {
  hours: {
    label: "Checked-in hours",
  },
  assigned: {
    label: "Assigned tasks",
    color: "var(--chart-1)",
  },
  completed: {
    label: "Completed tasks",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

export function WorkspaceDashboardMetrics({
  assignedTasksCount,
  completedTasksCount,
  sessions,
}: WorkspaceDashboardMetricsProps) {
  const [activeMetric, setActiveMetric] = React.useState<ChartKey>("assigned");

  const chartData = React.useMemo(() => {
    return sessions
      .map((item) => {
        const date = new Date(item.date);
        if (!item.check_out_at) {
          return {
            date: item.date,
            label: date.toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
            }),
            hours: 0,
          };
        }
        const durationMs =
          new Date(item.check_out_at).getTime() -
          new Date(item.check_in_at).getTime();
        const hours =
          durationMs > 0 ? Number((durationMs / (1000 * 60 * 60)).toFixed(2)) : 0;
        return {
          date: item.date,
          label: date.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
          }),
          hours,
        };
      })
      .slice()
      .reverse();
  }, [sessions]);

  return (
    <Card className="py-0">
      <CardHeader className="flex flex-col items-stretch border-b p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 pt-4 pb-3 sm:py-0">
          <CardTitle>Work summary</CardTitle>
          <CardDescription>Day-wise checked-in time (last 30 sessions)</CardDescription>
        </div>
        <div className="flex">
          {(
            [
              { key: "assigned", value: assignedTasksCount },
              { key: "completed", value: completedTasksCount },
            ] as const
          ).map((item) => {
            const metric = item.key;
            return (
              <button
                key={metric}
                type="button"
                data-active={activeMetric === metric}
                className="relative z-10 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l data-[active=true]:bg-muted/50 sm:border-t-0 sm:border-l sm:px-8 sm:py-6"
                onClick={() => setActiveMetric(metric)}
              >
                <span className="text-xs text-muted-foreground">
                  {chartConfig[metric].label}
                </span>
                <span className="text-lg leading-none font-bold sm:text-3xl">
                  {item.value.toLocaleString()}
                </span>
              </button>
            );
          })}
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:p-6">
        {chartData.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted-foreground">
            No attendance records yet.
          </p>
        ) : (
          <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
            <BarChart
              accessibilityLayer
              data={chartData}
              margin={{ left: 12, right: 12 }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleDateString("en-IN", {
                    month: "short",
                    day: "numeric",
                  });
                }}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    className="w-[170px]"
                    labelFormatter={(value) =>
                      new Date(value).toLocaleDateString("en-IN", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    }
                  />
                }
              />
              <Bar dataKey="hours" fill={`var(--color-${activeMetric})`} radius={6} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
