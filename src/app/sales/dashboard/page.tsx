"use client";

import { useEffect } from "react";
import { usePageTitle } from "@/contexts/page-title-context";
import { SalesDashboard } from "@/components/sales-dashboard";

export default function SalesDashboardPage() {
  const { setTitle } = usePageTitle();

  useEffect(() => {
    setTitle("Sales dashboard");
    return () => setTitle(null);
  }, [setTitle]);

  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-background text-foreground">
      <SalesDashboard />
    </div>
  );
}
