"use client";

import { useEffect, useMemo } from "react";
import { Dashboard, type DashboardModule } from "@/components/dashboard";
import { ClientPortalHome } from "@/components/portal/client-portal-home";
import { useAuth } from "@/contexts/auth-context";
import { useOrganization } from "@/contexts/organization-context";
import { usePageTitle } from "@/contexts/page-title-context";
import { buildNavAccess, canAccessInternalNav } from "@/lib/nav-access";

const DASHBOARD_MODULES: DashboardModule[] = [
  {
    id: "sales",
    title: "Sales",
    description: "Pipeline activity from the Sales module",
    href: "/sales/deals",
    metricKey: "deals",
    metricLabel: "Open deals",
    metricValue: 54,
    chartTitle: "Deals created",
    chartDescription: "Last 6 weeks",
    chartData: [
      { label: "W1", deals: 6 },
      { label: "W2", deals: 9 },
      { label: "W3", deals: 11 },
      { label: "W4", deals: 8 },
      { label: "W5", deals: 10 },
      { label: "W6", deals: 12 },
    ],
    chartConfig: {
      deals: { label: "Deals", color: "var(--chart-1)" },
    },
  },
  {
    id: "projects",
    title: "Projects",
    description: "Execution data from the Projects module",
    href: "/projects",
    metricKey: "completed",
    metricLabel: "Completed tasks",
    metricValue: 163,
    chartTitle: "Tasks completed",
    chartDescription: "Last 6 weeks",
    chartData: [
      { label: "W1", completed: 18 },
      { label: "W2", completed: 21 },
      { label: "W3", completed: 19 },
      { label: "W4", completed: 27 },
      { label: "W5", completed: 35 },
      { label: "W6", completed: 43 },
    ],
    chartConfig: {
      completed: { label: "Completed", color: "var(--chart-2)" },
    },
  },
  {
    id: "accounts",
    title: "Accounts",
    description: "Revenue trend from the Accounts module",
    href: "/accounts",
    metricKey: "revenue",
    metricLabel: "Monthly revenue",
    metricValue: 108900,
    chartTitle: "Revenue",
    chartDescription: "Last 6 weeks",
    chartData: [
      { label: "W1", revenue: 13100 },
      { label: "W2", revenue: 15400 },
      { label: "W3", revenue: 14200 },
      { label: "W4", revenue: 18900 },
      { label: "W5", revenue: 22400 },
      { label: "W6", revenue: 24900 },
    ],
    chartConfig: {
      revenue: { label: "Revenue", color: "var(--chart-3)" },
    },
  },
];

export default function DashboardPage() {
  const { setTitle } = usePageTitle();
  const { user } = useAuth();
  const { isOwner, isSuperAdmin, permissions } = useOrganization();

  const navAccess = useMemo(
    () =>
      buildNavAccess({
        permissions,
        isOwner: isOwner || isSuperAdmin,
        globalRole: user?.global_role ?? user?.role,
      }),
    [permissions, isOwner, isSuperAdmin, user?.global_role, user?.role],
  );

  const isStaff = canAccessInternalNav(navAccess);

  useEffect(() => {
    setTitle("Dashboard");
    return () => setTitle(null);
  }, [setTitle, isStaff]);

  if (!isStaff) {
    return (
      <Dashboard title="Welcome back" description="">
        <ClientPortalHome />
      </Dashboard>
    );
  }

  return (
    <Dashboard
      title="Welcome back"
      description="Jump into a module below or use the command palette to search."
      modules={DASHBOARD_MODULES}
    />
  );
}
