"use client";

import { useEffect } from "react";
import { usePageTitle } from "@/contexts/page-title-context";
import { HrDashboard } from "@/components/hr-dashboard";

export default function HrDashboardPage() {
  const { setTitle } = usePageTitle();

  useEffect(() => {
    setTitle("HR dashboard");
    return () => setTitle(null);
  }, [setTitle]);

  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-background text-foreground">
      <HrDashboard />
    </div>
  );
}
