"use client";

import { useEffect } from "react";
import { usePageTitle } from "@/contexts/page-title-context";
import { HrLeaveReports } from "@/components/hr-leave-reports";

export default function HrLeaveReportsPage() {
  const { setTitle } = usePageTitle();

  useEffect(() => {
    setTitle("Leave reports");
    return () => setTitle(null);
  }, [setTitle]);

  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-background text-foreground">
      <HrLeaveReports />
    </div>
  );
}
