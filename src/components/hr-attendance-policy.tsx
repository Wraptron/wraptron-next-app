"use client";

import React, { useEffect, useState } from "react";
import { usePageTitle } from "@/contexts/page-title-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Clock,
  ArrowLeft,
  Mail,
  Bell,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Save,
  Globe,
  ShieldCheck,
} from "lucide-react";
import { TimePicker } from "@/components/ui/time-picker";
import Link from "next/link";
import { attendanceApi, type AttendanceSettings, getApiErrorMessage } from "@/lib/api";

const COMMON_TIMEZONES = [
  { value: "Asia/Kolkata", label: "Asia/Kolkata (IST, +05:30)" },
  { value: "Asia/Dubai", label: "Asia/Dubai (GST, +04:00)" },
  { value: "Asia/Singapore", label: "Asia/Singapore (SGT, +08:00)" },
  { value: "Europe/London", label: "Europe/London (GMT/BST)" },
  { value: "Europe/Berlin", label: "Europe/Berlin (CET, +01:00)" },
  { value: "America/New_York", label: "America/New_York (EST/EDT, -05:00)" },
  { value: "America/Chicago", label: "America/Chicago (CST/CDT, -06:00)" },
  { value: "America/Los_Angeles", label: "America/Los_Angeles (PST/PDT, -08:00)" },
  { value: "UTC", label: "UTC (Coordinated Universal Time)" },
];

export function HrAttendancePolicy() {
  const { setTitle } = usePageTitle();

  const [loadingSettings, setLoadingSettings] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [settings, setSettings] = useState<AttendanceSettings>({
    organization_id: 0,
    enable_checkin_reminder: false,
    checkin_reminder_time: "09:20",
    enable_checkout_reminder: false,
    checkout_reminder_time: "18:00",
    timezone: "Asia/Kolkata",
    exclude_weekends: true,
    exclude_holidays: true,
  });

  useEffect(() => {
    setTitle("Attendance & Reminders");
    return () => setTitle(null);
  }, [setTitle]);

  useEffect(() => {
    async function loadSettings() {
      try {
        setLoadingSettings(true);
        setErrorMessage(null);
        const res = await attendanceApi.getSettings();
        if (res.settings) {
          setSettings({
            ...res.settings,
            checkin_reminder_time: res.settings.checkin_reminder_time?.slice(0, 5) || "09:20",
            checkout_reminder_time: res.settings.checkout_reminder_time?.slice(0, 5) || "18:00",
          });
        }
      } catch (err) {
        console.error("Failed to load attendance settings:", err);
        setErrorMessage(getApiErrorMessage(err, "Failed to load attendance reminder settings."));
      } finally {
        setLoadingSettings(false);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingSettings(true);
      setErrorMessage(null);
      setSaveSuccessMessage(null);

      const payload = {
        ...settings,
        checkin_reminder_time:
          settings.checkin_reminder_time.length === 5
            ? `${settings.checkin_reminder_time}:00`
            : settings.checkin_reminder_time,
        checkout_reminder_time:
          settings.checkout_reminder_time.length === 5
            ? `${settings.checkout_reminder_time}:00`
            : settings.checkout_reminder_time,
      };

      const res = await attendanceApi.updateSettings(payload);
      if (res.settings) {
        setSettings({
          ...res.settings,
          checkin_reminder_time: res.settings.checkin_reminder_time?.slice(0, 5) || "09:20",
          checkout_reminder_time: res.settings.checkout_reminder_time?.slice(0, 5) || "18:00",
        });
      }
      setSaveSuccessMessage("Attendance reminder settings updated successfully!");
      setTimeout(() => setSaveSuccessMessage(null), 4000);
    } catch (err) {
      console.error("Failed to save settings:", err);
      setErrorMessage(getApiErrorMessage(err, "Failed to save attendance settings."));
    } finally {
      setSavingSettings(false);
    }
  };

  const isAnyReminderActive = settings.enable_checkin_reminder || settings.enable_checkout_reminder;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
            <Link href="/hr" className="hover:underline flex items-center gap-1">
              <ArrowLeft className="h-3 w-3" />
              HR Portal
            </Link>
            <span>/</span>
            <span className="text-foreground font-medium">Attendance & Reminders</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Attendance Reminder Policy</h1>
          <p className="text-sm text-muted-foreground">
            Configure automated check-in and check-out email notification schedules for your team.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={isAnyReminderActive ? "default" : "outline"} className="px-3 py-1 text-xs">
            {isAnyReminderActive ? "Reminders Active" : "Reminders Disabled"}
          </Badge>
          <Link href="/hr/attendance">
            <Button variant="outline" size="sm" className="gap-1 text-xs">
              View Logged Attendance
            </Button>
          </Link>
        </div>
      </div>

      {/* Feedback alerts */}
      {saveSuccessMessage && (
        <div className="flex items-center gap-2 p-3 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg dark:bg-green-950/40 dark:text-green-300 dark:border-green-800">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{saveSuccessMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Automated Reminders Configuration Card */}
      <Card className="border-primary/20 shadow-sm">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                Automated Email Reminders
              </CardTitle>
              <CardDescription>
                Set up automated emails to remind employees if they miss morning check-in or evening check-out.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loadingSettings ? (
            <div className="py-8 flex flex-col items-center justify-center text-muted-foreground gap-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="text-sm">Loading attendance settings...</span>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-6">
              {/* 1. Morning Check-In Reminder */}
              <div className="p-4 rounded-lg border bg-muted/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-semibold flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-500" />
                      Morning Check-In Reminder
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Sends an automated reminder email if an employee has not checked in by this scheduled time.
                    </p>
                  </div>
                  <Switch
                    checked={settings.enable_checkin_reminder}
                    onCheckedChange={(checked) =>
                      setSettings((s) => ({ ...s, enable_checkin_reminder: checked }))
                    }
                  />
                </div>

                {settings.enable_checkin_reminder && (
                  <div className="pt-2 flex items-center gap-3">
                    <Label htmlFor="checkin_time" className="text-xs font-medium min-w-[130px]">
                      Send Reminder After:
                    </Label>
                    <TimePicker
                      value={settings.checkin_reminder_time}
                      onChange={(val) =>
                        setSettings((s) => ({ ...s, checkin_reminder_time: val }))
                      }
                    />
                    <span className="text-xs text-muted-foreground">
                      (e.g., 09:20 AM)
                    </span>
                  </div>
                )}
              </div>

              {/* 2. Evening Check-Out Reminder */}
              <div className="p-4 rounded-lg border bg-muted/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-semibold flex items-center gap-2">
                      <Bell className="h-4 w-4 text-amber-500" />
                      Evening Check-Out Reminder
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Sends an automated reminder email if an employee is still marked logged in after scheduled workday hours.
                    </p>
                  </div>
                  <Switch
                    checked={settings.enable_checkout_reminder}
                    onCheckedChange={(checked) =>
                      setSettings((s) => ({ ...s, enable_checkout_reminder: checked }))
                    }
                  />
                </div>

                {settings.enable_checkout_reminder && (
                  <div className="pt-2 flex items-center gap-3">
                    <Label htmlFor="checkout_time" className="text-xs font-medium min-w-[130px]">
                      Send Reminder After:
                    </Label>
                    <TimePicker
                      value={settings.checkout_reminder_time}
                      onChange={(val) =>
                        setSettings((s) => ({ ...s, checkout_reminder_time: val }))
                      }
                    />
                    <span className="text-xs text-muted-foreground">
                      (e.g., 06:00 PM)
                    </span>
                  </div>
                )}
              </div>

              {/* 3. Organization Timezone & Exclusions */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                    Company Timezone
                  </Label>
                  <Select
                    value={settings.timezone}
                    onValueChange={(val) => setSettings((s) => ({ ...s, timezone: val }))}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      {COMMON_TIMEZONES.map((tz) => (
                        <SelectItem key={tz.value} value={tz.value}>
                          {tz.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[11px] text-muted-foreground">
                    Reminders are scheduled and dispatched based on local time in this timezone.
                  </p>
                </div>

                <div className="space-y-3 p-3 rounded-lg border bg-muted/20">
                  <Label className="text-xs font-semibold flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground" />
                    Smart Exclusion Rules
                  </Label>
                  <div className="flex items-center justify-between text-xs">
                    <span>Exclude Weekends</span>
                    <Switch
                      checked={settings.exclude_weekends}
                      onCheckedChange={(checked) =>
                        setSettings((s) => ({ ...s, exclude_weekends: checked }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span>Exclude Public & Company Holidays</span>
                    <Switch
                      checked={settings.exclude_holidays}
                      onCheckedChange={(checked) =>
                        setSettings((s) => ({ ...s, exclude_holidays: checked }))
                      }
                    />
                  </div>
                </div>
              </div>

              {/* 4. Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2 border-t">
                <Button
                  type="submit"
                  size="sm"
                  disabled={savingSettings}
                  className="flex items-center gap-1.5"
                >
                  {savingSettings ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save Reminder Settings
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
