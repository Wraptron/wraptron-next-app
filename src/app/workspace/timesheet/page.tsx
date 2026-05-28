"use client";

import React, { useEffect } from "react";
import { usePageTitle } from "@/contexts/page-title-context";

export default function TimesheetPage() {
  const { setTitle } = usePageTitle();

  useEffect(() => {
    setTitle("Timesheet");
    return () => setTitle(null);
  }, [setTitle]);

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-foreground">Timesheet</h1>
        <p className="text-muted-foreground mt-2">Log and manage your timesheet entries (coming soon).</p>
      </div>
    </div>
  );
}
