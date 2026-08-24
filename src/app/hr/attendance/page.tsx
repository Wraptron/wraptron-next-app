"use client";

import { HrAttendancePolicy } from "@/components/hr-attendance-policy";

export default function HrAttendancePage() {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-background text-foreground">
      <HrAttendancePolicy />
    </div>
  );
}
