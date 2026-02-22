"use client";

import React, { useEffect } from "react";
import { usePageTitle } from "@/contexts/page-title-context";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, CheckCircle2, XCircle, AlertCircle } from "lucide-react";

export default function AttendancePage() {
  const { setTitle } = usePageTitle();
  const [date, setDate] = React.useState<Date | undefined>(new Date());

  useEffect(() => {
    setTitle("Attendance");
    return () => setTitle(null);
  }, [setTitle]);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
            <p className="text-gray-600 mt-1">Track employee time and attendance</p>
          </div>
          <Button variant="outline">
            Export Report
          </Button>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Select Date</CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md border"
              />
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Overview for {date?.toLocaleDateString()}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <span className="font-semibold text-green-900">Present</span>
                  </div>
                  <p className="text-2xl font-bold text-green-700">12</p>
                </div>
                <div className="p-4 bg-red-50 rounded-lg border border-red-100">
                  <div className="flex items-center gap-2 mb-2">
                    <XCircle className="w-5 h-5 text-red-600" />
                    <span className="font-semibold text-red-900">Absent</span>
                  </div>
                  <p className="text-2xl font-bold text-red-700">1</p>
                </div>
                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-5 h-5 text-yellow-600" />
                    <span className="font-semibold text-yellow-900">Late</span>
                  </div>
                  <p className="text-2xl font-bold text-yellow-700">2</p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">Recent Activity</h3>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-medium">
                        JD
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">John Doe</p>
                        <p className="text-xs text-gray-500">Software Engineer</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-green-600">Checked In</p>
                      <p className="text-xs text-gray-500">09:00 AM</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
