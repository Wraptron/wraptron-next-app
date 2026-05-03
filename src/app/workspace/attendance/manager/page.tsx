"use client";

import React, { useEffect, useState } from "react";
import { usePageTitle } from "@/contexts/page-title-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, UserX, Users, CheckCircle2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { attendanceApi } from "@/lib/api";

function formatTimeShort(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function formatWorkMode(mode: string): string {
  return mode.split("_").join(" ");
}

export default function AttendanceManagerPage() {
  const { setTitle } = usePageTitle();
  const [summary, setSummary] = useState<Array<{
    employee_id: number;
    name: string;
    email: string | null;
    checked_in: boolean;
    check_in_at: string | null;
    work_mode: string | null;
    status: string | null;
  }>>([]);
  const [notCheckedIn, setNotCheckedIn] = useState<Array<{ employee_id: number; name: string; email: string | null }>>([]);
  const [utilizationPercent, setUtilizationPercent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setTitle("Team Attendance");
    return () => setTitle(null);
  }, [setTitle]);

  useEffect(() => {
    attendanceApi
      .getTeam()
      .then((res) => {
        setSummary(res.summary);
        setNotCheckedIn(res.notCheckedIn);
        setUtilizationPercent(res.utilizationPercent);
      })
      .catch(() => setError("Failed to load team attendance"))
      .finally(() => setLoading(false));
  }, []);

  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
        <div className="max-w-4xl mx-auto">Loading team attendance…</div>
      </div>
    );
  }

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
        <h1 className="text-2xl font-bold text-gray-900">Team Attendance</h1>
        <p className="text-gray-600">{today}</p>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <Users className="h-5 w-5" />
                <span className="text-sm">Team size</span>
              </div>
              <p className="text-2xl font-bold">{summary.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-green-600 mb-1">
                <CheckCircle2 className="h-5 w-5" />
                <span className="text-sm">Checked in</span>
              </div>
              <p className="text-2xl font-bold text-green-700">{summary.filter((s) => s.checked_in).length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-blue-600 mb-1">
                <Clock className="h-5 w-5" />
                <span className="text-sm">Utilization</span>
              </div>
              <p className="text-2xl font-bold text-blue-700">{utilizationPercent}%</p>
            </CardContent>
          </Card>
        </div>

        {notCheckedIn.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <UserX className="h-4 w-4" />
                Not checked in today
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {notCheckedIn.map((e) => (
                  <li key={e.employee_id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                    <span className="font-medium">{e.name}</span>
                    <span className="text-sm text-gray-500">{e.email ?? "—"}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Team summary</CardTitle>
          </CardHeader>
          <CardContent>
            {summary.length === 0 ? (
              <p className="text-gray-500 text-sm">No direct reports. Team summary is for employees who report to you.</p>
            ) : (
              <ul className="space-y-2">
                {summary.map((s) => (
                  <li
                    key={s.employee_id}
                    className="flex flex-wrap items-center justify-between gap-2 py-3 border-b border-gray-100 last:border-0"
                  >
                    <div>
                      <span className="font-medium">{s.name}</span>
                      {s.email && <span className="text-sm text-gray-500 ml-2">({s.email})</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      {s.checked_in ? (
                        <>
                          <Badge className="bg-green-100 text-green-800">{s.status ?? "In"}</Badge>
                          <span className="text-sm text-gray-600">{formatTimeShort(s.check_in_at)}</span>
                          {s.work_mode && <span className="text-xs text-gray-500 capitalize">{formatWorkMode(s.work_mode)}</span>}
                        </>
                      ) : (
                        <Badge variant="secondary">Not in</Badge>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
            </CardContent>
          </Card>
      </div>
    </div>
  );
}
