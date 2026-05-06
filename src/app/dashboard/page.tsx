"use client";

import { useEffect } from "react";
import { usePageTitle } from "@/contexts/page-title-context";
import { Dashboard } from "@/components/dashboard";

export default function DashboardPage() {
  const { setTitle } = usePageTitle();

  useEffect(() => {
    setTitle("Dashboard");
    return () => setTitle(null);
  }, [setTitle]);

  return (
    <Dashboard
      title="Welcome back"
      description="Jump into a module below or use the command palette to search."
    />
  );
}
