"use client";

import { useEffect } from "react";
import { usePageTitle } from "@/contexts/page-title-context";
import { HrMetricsMatrix } from "@/components/hr-metrics-matrix";

export default function HrMetricsPage() {
  const { setTitle } = usePageTitle();

  useEffect(() => {
    setTitle("Performance matrix");
    return () => setTitle(null);
  }, [setTitle]);

  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-background text-foreground">
      <HrMetricsMatrix />
    </div>
  );
}
