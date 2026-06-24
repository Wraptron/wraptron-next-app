import type { SalesDashboardPeriod } from "@/lib/api";

export type RevenueTrendPoint = {
  bucket: string;
  revenue: number;
};

export type RevenueTrendChartPoint = RevenueTrendPoint & {
  label: string;
  tooltipLabel: string;
};

/** Mirror PostgreSQL date_trunc bucket boundaries (UTC). */
export function truncateToBucketUtc(
  date: Date,
  period: SalesDashboardPeriod,
): number {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth();
  const d = date.getUTCDate();
  const h = date.getUTCHours();

  switch (period) {
    case "today":
      return Date.UTC(y, m, d, h);
    case "week":
      return Date.UTC(y, m, d);
    case "month": {
      const day = date.getUTCDay();
      const mondayOffset = day === 0 ? -6 : 1 - day;
      return Date.UTC(y, m, d + mondayOffset);
    }
    case "quarter":
      return Date.UTC(y, m, 1);
    case "year":
      return Date.UTC(y, Math.floor(m / 3) * 3, 1);
  }
}

function periodStartUtc(period: SalesDashboardPeriod, now = new Date()): number {
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  const d = now.getUTCDate();

  switch (period) {
    case "today":
      return Date.UTC(y, m, d);
    case "week": {
      const day = now.getUTCDay();
      const mondayOffset = day === 0 ? -6 : 1 - day;
      return Date.UTC(y, m, d + mondayOffset);
    }
    case "month":
      return Date.UTC(y, m, 1);
    case "quarter":
      return Date.UTC(y, Math.floor(m / 3) * 3, 1);
    case "year":
      return Date.UTC(y, 0, 1);
  }
}

/** Last bucket in the selected period (full range on the chart). */
function periodEndUtc(period: SalesDashboardPeriod, now = new Date()): number {
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  const d = now.getUTCDate();

  switch (period) {
    case "today":
      return Date.UTC(y, m, d, 23);
    case "week": {
      const start = periodStartUtc(period, now);
      return start + 6 * 86_400_000;
    }
    case "month": {
      const lastDay = new Date(Date.UTC(y, m + 1, 0));
      return truncateToBucketUtc(lastDay, "month");
    }
    case "quarter": {
      const quarterEndMonth = Math.floor(m / 3) * 3 + 2;
      const lastDay = new Date(Date.UTC(y, quarterEndMonth + 1, 0));
      return truncateToBucketUtc(lastDay, "quarter");
    }
    case "year":
      return Date.UTC(y, 9, 1);
  }
}

function advanceBucket(ts: number, period: SalesDashboardPeriod): number {
  switch (period) {
    case "today":
      return ts + 3_600_000;
    case "week":
      return ts + 86_400_000;
    case "month":
      return ts + 7 * 86_400_000;
    case "quarter": {
      const next = new Date(ts);
      next.setUTCMonth(next.getUTCMonth() + 1);
      return next.getTime();
    }
    case "year": {
      const next = new Date(ts);
      next.setUTCMonth(next.getUTCMonth() + 3);
      return next.getTime();
    }
  }
}

function firstBucketUtc(period: SalesDashboardPeriod, now = new Date()): number {
  const start = periodStartUtc(period, now);
  if (period === "month" || period === "quarter" || period === "year") {
    return truncateToBucketUtc(new Date(start), period);
  }
  return start;
}

/** Full axis label for each bucket in the selected period. */
export function formatRevenueTrendAxisLabel(
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
        month: "short",
        day: "numeric",
      });
    case "month":
      return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });
    case "quarter":
      return date.toLocaleDateString(undefined, {
        month: "long",
      });
    case "year": {
      const quarter = Math.floor(date.getUTCMonth() / 3) + 1;
      return `Q${quarter} ${date.getUTCFullYear()}`;
    }
    default:
      return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });
  }
}

/** Richer tooltip label with full date/time context. */
export function formatRevenueTrendTooltipLabel(
  bucket: string,
  period: SalesDashboardPeriod,
): string {
  const date = new Date(bucket);
  if (Number.isNaN(date.getTime())) return bucket;

  switch (period) {
    case "today":
      return date.toLocaleString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    case "week":
      return date.toLocaleDateString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    case "month":
      return `Week of ${date.toLocaleDateString(undefined, {
        month: "long",
        day: "numeric",
        year: "numeric",
      })}`;
    case "quarter":
      return date.toLocaleDateString(undefined, {
        month: "long",
        year: "numeric",
      });
    case "year": {
      const quarter = Math.floor(date.getUTCMonth() / 3) + 1;
      return `Q${quarter} ${date.getUTCFullYear()}`;
    }
    default:
      return date.toLocaleDateString(undefined, {
        dateStyle: "medium",
      });
  }
}

/** Fill gaps with zero-valued buckets across the full selected period. */
export function buildContinuousRevenueTrend(
  points: RevenueTrendPoint[],
  period: SalesDashboardPeriod,
  now = new Date(),
): RevenueTrendChartPoint[] {
  const revenueByBucket = new Map<number, number>();
  for (const point of points) {
    const key = truncateToBucketUtc(new Date(point.bucket), period);
    revenueByBucket.set(key, (revenueByBucket.get(key) ?? 0) + point.revenue);
  }

  const end = periodEndUtc(period, now);
  const result: RevenueTrendChartPoint[] = [];

  for (
    let ts = firstBucketUtc(period, now);
    ts <= end;
    ts = advanceBucket(ts, period)
  ) {
    const bucket = new Date(ts).toISOString();
    result.push({
      bucket,
      revenue: revenueByBucket.get(ts) ?? 0,
      label: formatRevenueTrendAxisLabel(bucket, period),
      tooltipLabel: formatRevenueTrendTooltipLabel(bucket, period),
    });
  }

  return result;
}
