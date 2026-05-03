"use client";

import React, { useEffect } from "react";
import { usePageTitle } from "@/contexts/page-title-context";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function TimesheetPage() {
  const { setTitle } = usePageTitle();

  useEffect(() => {
    setTitle("Add Timesheet");
    return () => setTitle(null);
  }, [setTitle]);

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
      <div className="max-w-lg mx-auto">
        <Link href="/workspace/attendance">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Attendance
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Add timesheet</h1>
        <p className="text-gray-600 mt-2">Timesheet entry form (coming soon).</p>
      </div>
    </div>
  );
}
