"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowRight,
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
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { EMPLOYEES_BASE_PATH, HR_SKILL_MATRIX_PATH } from "@/lib/employee-routes";

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
    href: "/transactions",
    title: "Finance",
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
  className?: string;
}

export function Dashboard({
  title = "Dashboard",
  description = "Open a module or use search to go anywhere.",
  actions,
  children,
  quickLinks = DEFAULT_QUICK_LINKS,
  className,
}: DashboardProps) {
  return (
    <div
      className={cn(
        "min-h-0 flex-1 overflow-y-auto bg-background text-foreground",
        className,
      )}
    >
      <div className="mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            {description ? (
              <p className="text-sm text-muted-foreground max-w-2xl">{description}</p>
            ) : null}
          </div>
          {actions ? <div className="shrink-0 flex flex-wrap gap-2">{actions}</div> : null}
        </header>

        <div className="mt-8">
          {children ?? (
            <section aria-label="Shortcuts">
              <h2 className="sr-only">Shortcuts</h2>
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {quickLinks.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link href={item.href} className="group block h-full rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
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
          )}
        </div>
      </div>
    </div>
  );
}
