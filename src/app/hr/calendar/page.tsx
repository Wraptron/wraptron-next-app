"use client";

import { useEffect } from "react";
import { usePageTitle } from "@/contexts/page-title-context";
import { HrCalendarSetup } from "@/components/hr-calendar-setup";

export default function HrCalendarPage() {
  const { setTitle } = usePageTitle();

  useEffect(() => {
    setTitle("Calendar & Holidays");
    return () => setTitle(null);
  }, [setTitle]);

  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-background text-foreground">
      <HrCalendarSetup />
    </div>
  );
}
