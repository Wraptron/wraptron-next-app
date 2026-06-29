"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Banknote,
  FileText,
  Loader2,
  Receipt,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  accountsApi,
  type AccountsDashboardData,
  type AccountsDashboardPeriod,
  type FinancialReportLine,
} from "@/lib/api";
import { useCurrency } from "@/contexts/currency-context";
import { cn } from "@/lib/utils";

const PERIOD_OPTIONS: { value: AccountsDashboardPeriod; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "week", label: "This week" },
  { value: "month", label: "This month" },
  { value: "quarter", label: "This quarter" },
  { value: "year", label: "This year" },
];

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

function flattenReportLines(
  lines: FinancialReportLine[],
  depth = 0,
): Array<FinancialReportLine & { depth: number }> {
  const rows: Array<FinancialReportLine & { depth: number }> = [];
  for (const line of lines) {
    rows.push({ ...line, depth });
    if (line.children?.length) {
      rows.push(...flattenReportLines(line.children, depth + 1));
    }
  }
  return rows;
}

function FinancialReportTable({
  title,
  description,
  lines,
  loading,
  formatMoney,
}: {
  title: string;
  description: string;
  lines: FinancialReportLine[];
  loading: boolean;
  formatMoney: (value: number) => string;
}) {
  const rows = useMemo(() => flattenReportLines(lines), [lines]);

  return (
    <Card className="border-border/80">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
            Loading report…
          </div>
        ) : (
          <div className="overflow-x-auto rounded-md border border-border/60">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60%]">Line item</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={2}
                      className="py-8 text-center text-muted-foreground"
                    >
                      No data for this period
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row) => (
                    <TableRow
                      key={row.id}
                      className={cn(
                        row.is_total && "bg-muted/40 font-semibold",
                        row.is_header && !row.is_total && "font-medium",
                      )}
                    >
                      <TableCell
                        className={cn(
                          row.is_total && "font-semibold",
                          row.depth > 0 && "text-muted-foreground",
                        )}
                        style={{ paddingLeft: `${16 + row.depth * 20}px` }}
                      >
                        {row.label}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "text-right tabular-nums",
                          row.is_total && "font-semibold",
                          row.amount < 0 && "text-destructive",
                        )}
                      >
                        {row.is_header && row.children?.length
                          ? "—"
                          : formatMoney(row.amount)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function AccountsDashboard() {
  const { currency } = useCurrency();
  const [period, setPeriod] = useState<AccountsDashboardPeriod>("month");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboard, setDashboard] = useState<AccountsDashboardData | null>(
    null,
  );

  const formatMoney = useCallback(
    (value: number) =>
      new Intl.NumberFormat(undefined, {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value),
    [currency],
  );

  const loadDashboard = useCallback(
    async (selectedPeriod: AccountsDashboardPeriod) => {
      setLoading(true);
      setError(null);
      try {
        const data = await accountsApi.getDashboard(selectedPeriod);
        setDashboard(data);
      } catch {
        setError("Failed to load accounts dashboard");
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

  return (
    <div className="w-full px-4 py-6 md:px-6 md:py-8 lg:px-8 xl:px-10 space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Accounts dashboard
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Profit and loss and cash flow statements from invoices and expense
            bills synced from Zoho Books.
          </p>
        </div>
        <Button asChild variant="outline" size="sm" className="shrink-0">
          <Link href="/accounts/invoices">
            View invoices
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </Link>
        </Button>
      </header>

      <Tabs
        value={period}
        onValueChange={(value) => setPeriod(value as AccountsDashboardPeriod)}
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
        aria-label="Accounts metrics"
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <MetricCard
          title="Revenue"
          value={formatMoney(dashboard?.revenue ?? 0)}
          description={`Invoiced · ${periodLabel.toLowerCase()}`}
          icon={TrendingUp}
          loading={loading}
        />
        <MetricCard
          title="Net income"
          value={formatMoney(dashboard?.net_income ?? 0)}
          description="Revenue minus expenses"
          icon={Receipt}
          loading={loading}
        />
        <MetricCard
          title="Cash collected"
          value={formatMoney(dashboard?.cash_collected ?? 0)}
          description="Customer payments received"
          icon={Banknote}
          loading={loading}
        />
        <MetricCard
          title="Outstanding receivables"
          value={formatMoney(dashboard?.outstanding_receivables ?? 0)}
          description="Unpaid invoice balances"
          icon={Wallet}
          loading={loading}
        />
      </section>

      <Tabs defaultValue="profit-loss" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profit-loss">
            <FileText className="mr-1.5 h-4 w-4" />
            Profit &amp; loss
          </TabsTrigger>
          <TabsTrigger value="cash-flow">
            <TrendingDown className="mr-1.5 h-4 w-4" />
            Cash flow statement
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profit-loss">
          <FinancialReportTable
            title="Profit and loss statement"
            description={`Accrual basis · ${periodLabel.toLowerCase()}`}
            lines={dashboard?.profit_and_loss ?? []}
            loading={loading}
            formatMoney={formatMoney}
          />
        </TabsContent>

        <TabsContent value="cash-flow">
          <FinancialReportTable
            title="Cash flow statement"
            description={`Cash basis · ${periodLabel.toLowerCase()}`}
            lines={dashboard?.cash_flow ?? []}
            loading={loading}
            formatMoney={formatMoney}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
