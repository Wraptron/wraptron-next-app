"use client";

import React, { useEffect } from "react";
import { usePageTitle } from "@/contexts/page-title-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileDown, Calendar, AlertCircle, Clock, UserCheck, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function AttendanceHRPage() {
  const { setTitle } = usePageTitle();

  useEffect(() => {
    setTitle("HR Attendance");
    return () => setTitle(null);
  }, [setTitle]);

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center gap-4">
          <Link href="/workspace/attendance">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" />
              My Attendance
            </Button>
          </Link>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">HR Attendance</h1>
        <p className="text-gray-600">Reports and exports (coming soon)</p>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileDown className="h-4 w-4" />
                Monthly export (CSV)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-3">Export attendance for a month as CSV.</p>
              <Button variant="outline" size="sm" disabled>
                Export CSV (coming soon)
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Late login report
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-3">View employees who logged in after the configured time.</p>
              <Button variant="outline" size="sm" disabled>
                View report (coming soon)
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Absentee report
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-3">View days with no check-in.</p>
              <Button variant="outline" size="sm" disabled>
                View report (coming soon)
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <UserCheck className="h-4 w-4" />
                Overtime report
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-3">View sessions over configured hours.</p>
              <Button variant="outline" size="sm" disabled>
                View report (coming soon)
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Leave integration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">Integrate with leave records to mark days on leave (planned).</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
