"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Briefcase,
  Calendar as CalendarIcon,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Coffee,
  Info,
  Loader2,
  Plus,
  Save,
  Sun,
  Trash2,
  Users,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  holidaysApi,
  type OrganizationHoliday,
  type WeekendPolicy,
  type WorkingDaysBreakdown,
} from "@/lib/api";
import { HR_METRICS_PATH } from "@/lib/employee-routes";
import { useOrganization } from "@/contexts/organization-context";

const MONTHS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

const WEEKDAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function HrCalendarSetup() {
  const { activeOrg } = useOrganization();
  const [selectedMonth, setSelectedMonth] = useState<number>(7);
  const [selectedYear, setSelectedYear] = useState<number>(2026);

  const [weekendPolicy, setWeekendPolicy] =
    useState<WeekendPolicy>("sat_sun_off");
  const [workingHoursPerDay, setWorkingHoursPerDay] = useState<number>(8.0);
  const [savingPolicy, setSavingPolicy] = useState<boolean>(false);
  const [policySavedSuccess, setPolicySavedSuccess] = useState<boolean>(false);

  const [breakdown, setBreakdown] = useState<WorkingDaysBreakdown | null>(null);
  const [allHolidays, setAllHolidays] = useState<OrganizationHoliday[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Add holiday dialog state
  const [isAddHolidayOpen, setIsAddHolidayOpen] = useState<boolean>(false);
  const [newHolidayName, setNewHolidayName] = useState<string>("");
  const [newHolidayDate, setNewHolidayDate] = useState<string>("");
  const [newHolidayType, setNewHolidayType] = useState<string>("public");
  const [newHolidayDescription, setNewHolidayDescription] =
    useState<string>("");
  const [addingHoliday, setAddingHoliday] = useState<boolean>(false);
  const [holidayError, setHolidayError] = useState<string | null>(null);

  const yearOptions = [2024, 2025, 2026, 2027, 2028];

  const loadPolicyAndData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [policyRes, breakdownRes, holidaysRes] = await Promise.all([
        holidaysApi.getPolicy(),
        holidaysApi.getWorkingDays({
          month: selectedMonth,
          year: selectedYear,
        }),
        holidaysApi.getAll({ year: selectedYear }),
      ]);

      setWeekendPolicy(policyRes.weekend_policy || "sat_sun_off");
      setWorkingHoursPerDay(Number(policyRes.working_hours_per_day || 8.0));
      setBreakdown(breakdownRes);
      setAllHolidays(holidaysRes.holidays || []);
    } catch (err) {
      console.error("Failed to load holiday data:", err);
      setError("Failed to load calendar setup and working days calculation.");
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    void loadPolicyAndData();
  }, [loadPolicyAndData, activeOrg?.id]);

  const handleSavePolicy = async () => {
    setSavingPolicy(true);
    setPolicySavedSuccess(false);
    try {
      await holidaysApi.updatePolicy({
        weekend_policy: weekendPolicy,
        working_hours_per_day: workingHoursPerDay,
      });
      setPolicySavedSuccess(true);
      setTimeout(() => setPolicySavedSuccess(false), 3000);
      // Reload working days calculation with new policy
      const res = await holidaysApi.getWorkingDays({
        month: selectedMonth,
        year: selectedYear,
      });
      setBreakdown(res);
    } catch (err) {
      console.error("Failed to save policy:", err);
      setError("Failed to save weekend policy.");
    } finally {
      setSavingPolicy(false);
    }
  };

  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear((y) => y - 1);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear((y) => y + 1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  };

  const handleToday = () => {
    const now = new Date();
    setSelectedMonth(now.getMonth() + 1);
    setSelectedYear(now.getFullYear());
  };

  const handleOpenAddHoliday = (defaultDate?: string) => {
    const monthPadded = String(selectedMonth).padStart(2, "0");
    setNewHolidayDate(defaultDate || `${selectedYear}-${monthPadded}-01`);
    setNewHolidayName("");
    setNewHolidayType("public");
    setNewHolidayDescription("");
    setHolidayError(null);
    setIsAddHolidayOpen(true);
  };

  const handleAddHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHolidayName.trim() || !newHolidayDate) {
      setHolidayError("Holiday name and date are required.");
      return;
    }
    setAddingHoliday(true);
    setHolidayError(null);
    try {
      await holidaysApi.create({
        name: newHolidayName.trim(),
        date: newHolidayDate,
        type: newHolidayType,
        description: newHolidayDescription.trim() || undefined,
      });
      setIsAddHolidayOpen(false);
      await loadPolicyAndData();
    } catch (err) {
      console.error("Failed to add holiday:", err);
      setHolidayError("Failed to create holiday record.");
    } finally {
      setAddingHoliday(false);
    }
  };

  const handleDeleteHoliday = async (id: number) => {
    if (!confirm("Are you sure you want to delete this holiday?")) return;
    try {
      await holidaysApi.delete(id);
      await loadPolicyAndData();
    } catch (err) {
      console.error("Failed to delete holiday:", err);
      alert("Failed to delete holiday");
    }
  };

type BlankCalendarCell = {
  isBlank: true;
  key: string;
};

type DayCalendarCell = {
  isBlank: false;
  key: string;
  date: string;
  dayNum: number;
  isWeekend: boolean;
  isHoliday: boolean;
  holidayName?: string;
  isWorkingDay: boolean;
  isToday: boolean;
};

type CalendarCell = BlankCalendarCell | DayCalendarCell;

  // Build full month calendar cells with leading blanks for day of week alignment
  const calendarCells = useMemo<CalendarCell[]>(() => {
    if (!breakdown?.day_breakdown) return [];
    const firstDayOfWeek =
      breakdown.day_breakdown.length > 0
        ? breakdown.day_breakdown[0].day_of_week
        : 0;

    const blanks: BlankCalendarCell[] = Array.from({ length: firstDayOfWeek }).map((_, i) => ({
      isBlank: true,
      key: `blank-${i}`,
    }));

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    const days: DayCalendarCell[] = breakdown.day_breakdown.map((d) => ({
      isBlank: false,
      key: d.date,
      date: d.date,
      dayNum: parseInt(d.date.slice(8), 10),
      isWeekend: d.is_weekend,
      isHoliday: d.is_holiday,
      holidayName: d.holiday_name,
      isWorkingDay: d.is_working_day,
      isToday: d.date === todayStr,
    }));

    return [...blanks, ...days];
  }, [breakdown?.day_breakdown]);

  return (
    <div className="w-full space-y-6 px-4 py-6 md:px-6 md:py-8 lg:px-8 xl:px-10">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              Calendar & Holiday Setup
            </h1>
            {activeOrg?.name ? (
              <Badge variant="secondary" className="text-xs">
                Org: {activeOrg.name}
              </Badge>
            ) : null}
          </div>
          <p className="max-w-3xl text-sm text-muted-foreground">
            Configure Saturday & Sunday weekend policies and public holidays.
            The total working days calculated here automatically powers the
            Performance Matrix report.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="gap-1.5 shadow-sm"
          >
            <Link href={HR_METRICS_PATH}>
              Performance Matrix
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button
            size="sm"
            onClick={() => handleOpenAddHoliday()}
            className="gap-1.5 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Add Holiday
          </Button>
        </div>
      </header>

      {error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {/* Top Grid: Weekend Policy & Working Days Breakdown */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* 1. Weekend Policy Card */}
        <Card className="border-border/80 shadow-sm flex flex-col justify-between">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Sun className="h-4 w-4 text-amber-500" />
              Weekend Policy (Weekly Offs)
            </CardTitle>
            <CardDescription className="text-xs">
              Select standard off-days across your organization.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2.5">
              {/* Option 1: Sat & Sun off */}
              <label
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                  weekendPolicy === "sat_sun_off"
                    ? "border-primary bg-primary/5 shadow-xs"
                    : "border-border/60 hover:bg-muted/40"
                }`}
              >
                <input
                  type="radio"
                  name="weekend_policy"
                  value="sat_sun_off"
                  checked={weekendPolicy === "sat_sun_off"}
                  onChange={() => setWeekendPolicy("sat_sun_off")}
                  className="mt-1 accent-primary"
                />
                <div className="space-y-0.5">
                  <span className="text-sm font-semibold text-foreground">
                    5-Day Work Week (Saturday & Sunday Off)
                  </span>
                  <p className="text-xs text-muted-foreground">
                    Standard work week with every Saturday and Sunday counted as
                    holidays.
                  </p>
                </div>
              </label>

              {/* Option 2: Sun only off */}
              <label
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                  weekendPolicy === "sun_only_off"
                    ? "border-primary bg-primary/5 shadow-xs"
                    : "border-border/60 hover:bg-muted/40"
                }`}
              >
                <input
                  type="radio"
                  name="weekend_policy"
                  value="sun_only_off"
                  checked={weekendPolicy === "sun_only_off"}
                  onChange={() => setWeekendPolicy("sun_only_off")}
                  className="mt-1 accent-primary"
                />
                <div className="space-y-0.5">
                  <span className="text-sm font-semibold text-foreground">
                    6-Day Work Week (Sunday Only Off)
                  </span>
                  <p className="text-xs text-muted-foreground">
                    Only Sundays are holidays; Saturdays are counted as working
                    days.
                  </p>
                </div>
              </label>

              {/* Option 3: Alternate Saturdays */}
              <label
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                  weekendPolicy === "alt_sat_sun_off"
                    ? "border-primary bg-primary/5 shadow-xs"
                    : "border-border/60 hover:bg-muted/40"
                }`}
              >
                <input
                  type="radio"
                  name="weekend_policy"
                  value="alt_sat_sun_off"
                  checked={weekendPolicy === "alt_sat_sun_off"}
                  onChange={() => setWeekendPolicy("alt_sat_sun_off")}
                  className="mt-1 accent-primary"
                />
                <div className="space-y-0.5">
                  <span className="text-sm font-semibold text-foreground">
                    Alternate Saturdays (2nd & 4th Sat + Sundays Off)
                  </span>
                  <p className="text-xs text-muted-foreground">
                    Sundays, 2nd Saturday, and 4th Saturday of each month are
                    holidays.
                  </p>
                </div>
              </label>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border/50">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-medium text-foreground">
                  Working hours / day:
                </span>
                <Input
                  type="number"
                  step="0.5"
                  min="4"
                  max="12"
                  value={workingHoursPerDay}
                  onChange={(e) =>
                    setWorkingHoursPerDay(parseFloat(e.target.value) || 8.0)
                  }
                  className="h-8 w-20 font-mono text-xs"
                />
              </div>

              <div className="flex items-center gap-2">
                {policySavedSuccess ? (
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Saved!
                  </span>
                ) : null}
                <Button
                  size="sm"
                  onClick={handleSavePolicy}
                  disabled={savingPolicy}
                  className="gap-1.5 shadow-sm h-8 text-xs"
                >
                  {savingPolicy ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Save className="h-3.5 w-3.5" />
                  )}
                  Save Policy
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 2. Monthly Working Days Dynamic Breakdown */}
        <Card className="border-border/80 shadow-sm flex flex-col justify-between">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-primary" />
                  Monthly Working Days Calculation
                </CardTitle>
                <CardDescription className="text-xs">
                  Dynamic breakdown for selected month based on your policy and
                  holidays.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Month / Year Selectors */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Month
                </label>
                <Select
                  value={selectedMonth.toString()}
                  onValueChange={(val) => setSelectedMonth(parseInt(val, 10))}
                >
                  <SelectTrigger className="h-8 text-xs bg-background">
                    <SelectValue placeholder="Month" />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((m) => (
                      <SelectItem key={m.value} value={m.value.toString()}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Year
                </label>
                <Select
                  value={selectedYear.toString()}
                  onValueChange={(val) => setSelectedYear(parseInt(val, 10))}
                >
                  <SelectTrigger className="h-8 text-xs bg-background">
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {yearOptions.map((y) => (
                      <SelectItem key={y} value={y.toString()}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Breakdown KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
              <div className="p-3 rounded-lg bg-muted/40 border border-border/50 text-center space-y-1">
                <span className="text-[11px] text-muted-foreground uppercase font-medium">
                  Calendar
                </span>
                <p className="text-xl font-bold font-mono text-foreground">
                  {loading ? "…" : breakdown?.total_calendar_days ?? 0}
                </p>
                <span className="text-[10px] text-muted-foreground">days</span>
              </div>

              <div className="p-3 rounded-lg bg-muted/40 border border-border/50 text-center space-y-1">
                <span className="text-[11px] text-muted-foreground uppercase font-medium">
                  Weekends
                </span>
                <p className="text-xl font-bold font-mono text-foreground">
                  {loading ? "…" : breakdown?.weekend_days ?? 0}
                </p>
                <span className="text-[10px] text-muted-foreground">off-days</span>
              </div>

              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-center space-y-1">
                <span className="text-[11px] text-amber-700 dark:text-amber-400 uppercase font-medium">
                  Holidays
                </span>
                <p className="text-xl font-bold font-mono text-amber-700 dark:text-amber-400">
                  {loading ? "…" : breakdown?.holiday_days ?? 0}
                </p>
                <span className="text-[10px] text-muted-foreground">public</span>
              </div>

              <div className="p-3 rounded-lg bg-primary/10 border border-primary/30 text-center space-y-1 shadow-xs">
                <span className="text-[11px] text-primary uppercase font-bold">
                  Working Days
                </span>
                <p className="text-2xl font-extrabold font-mono text-primary">
                  {loading ? "…" : breakdown?.total_working_days ?? 0}
                </p>
                <span className="text-[10px] text-primary font-medium">
                  Net Days
                </span>
              </div>
            </div>

            <div className="rounded-lg bg-muted/30 p-2.5 text-xs text-muted-foreground flex items-center justify-between gap-2 border border-border/50">
              <span className="flex items-center gap-1.5">
                <Info className="h-3.5 w-3.5 text-primary shrink-0" />
                Formula: {breakdown?.total_calendar_days ?? 0} total −{" "}
                {breakdown?.weekend_days ?? 0} weekends −{" "}
                {breakdown?.holiday_days ?? 0} holidays ={" "}
                <span className="font-bold text-foreground">
                  {breakdown?.total_working_days ?? 0} working days
                </span>
              </span>
              <Button asChild variant="link" size="sm" className="h-auto p-0 text-xs">
                <Link href={HR_METRICS_PATH}>Open Report →</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Visual Month Calendar View */}
      <Card className="border-border/80 shadow-sm overflow-hidden">
        <CardHeader className="border-b border-border/60 bg-muted/20 px-4 sm:px-6 py-4 space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            {/* Navigation & Month/Year Selectors */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {/* Prev / Today / Next Controls */}
              <div className="flex items-center rounded-lg border border-border bg-background p-0.5 shadow-2xs">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={handlePrevMonth}
                  title="Previous Month"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
                  onClick={handleToday}
                >
                  Today
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={handleNextMonth}
                  title="Next Month"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Month Dropdown */}
              <Select
                value={selectedMonth.toString()}
                onValueChange={(val) => setSelectedMonth(parseInt(val, 10))}
              >
                <SelectTrigger className="h-9 w-[130px] font-semibold text-xs bg-background shadow-2xs">
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m) => (
                    <SelectItem key={m.value} value={m.value.toString()}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Year Dropdown */}
              <Select
                value={selectedYear.toString()}
                onValueChange={(val) => setSelectedYear(parseInt(val, 10))}
              >
                <SelectTrigger className="h-9 w-[90px] font-semibold text-xs bg-background shadow-2xs">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((y) => (
                    <SelectItem key={y} value={y.toString()}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Current Active Label Badge */}
              <Badge
                variant="secondary"
                className="h-8 px-3 font-mono font-bold text-xs bg-primary/10 text-primary border border-primary/20"
              >
                {MONTHS.find((m) => m.value === selectedMonth)?.label} {selectedYear}
              </Badge>
            </div>

            {/* Legend & Quick Actions */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary/10 border border-primary/20 text-primary font-semibold">
                <span className="h-2 w-2 rounded-full bg-primary" />
                Working ({breakdown?.total_working_days ?? 0})
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/60 border border-border text-muted-foreground font-semibold">
                <span className="h-2 w-2 rounded-full bg-muted-foreground" />
                Weekend ({breakdown?.weekend_days ?? 0})
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 font-semibold">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                Holiday ({breakdown?.holiday_days ?? 0})
              </span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => handleOpenAddHoliday()}
                className="h-8 gap-1.5 text-xs font-semibold shadow-2xs ml-auto lg:ml-0"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Holiday
              </Button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-xs text-muted-foreground pt-1 border-t border-border/40">
            <p>Click any working day cell to quickly register a public or company holiday for that date.</p>
            <span className="font-mono text-[11px] text-foreground font-medium">
              Net {breakdown?.total_working_days ?? 0} working days in {MONTHS.find((m) => m.value === selectedMonth)?.label} {selectedYear}
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          {loading ? (
            <div className="flex h-48 items-center justify-center text-muted-foreground gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              Loading calendar view…
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-2">
              {/* Day Headers */}
              {WEEKDAY_NAMES.map((d, i) => (
                <div
                  key={d}
                  className={`text-center font-bold text-xs py-1.5 uppercase tracking-wider ${
                    i === 0 || (i === 6 && weekendPolicy === "sat_sun_off")
                      ? "text-muted-foreground/70"
                      : "text-foreground"
                  }`}
                >
                  {d}
                </div>
              ))}

              {/* Day Cells */}
              {calendarCells.map((cell, idx) => {
                if (cell.isBlank) {
                  return (
                    <div
                      key={`blank-${idx}`}
                      className="min-h-[72px] rounded-lg bg-muted/10 border border-transparent"
                    />
                  );
                }

                if (cell.isHoliday) {
                  return (
                    <div
                      key={cell.key}
                      className={`min-h-[76px] p-2.5 rounded-lg bg-amber-500/10 border flex flex-col justify-between transition-all hover:shadow-xs ${
                        cell.isToday
                          ? "border-primary ring-2 ring-primary/30"
                          : "border-amber-500/30"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm font-mono text-amber-700 dark:text-amber-400 flex items-center gap-1">
                          {cell.dayNum}
                          {cell.isToday ? (
                            <span className="text-[9px] font-sans px-1 py-0.2 rounded bg-primary text-primary-foreground font-semibold">
                              Today
                            </span>
                          ) : null}
                        </span>
                        <Badge
                          variant="outline"
                          className="text-[9px] px-1 py-0 bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40"
                        >
                          Holiday
                        </Badge>
                      </div>
                      <span className="text-[11px] font-semibold text-amber-800 dark:text-amber-300 truncate mt-1" title={cell.holidayName}>
                        {cell.holidayName || "Public Holiday"}
                      </span>
                    </div>
                  );
                }

                if (cell.isWeekend) {
                  return (
                    <div
                      key={cell.key}
                      className={`min-h-[76px] p-2.5 rounded-lg bg-muted/30 border flex flex-col justify-between opacity-80 ${
                        cell.isToday
                          ? "border-primary ring-2 ring-primary/30"
                          : "border-border/40"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm font-mono text-muted-foreground flex items-center gap-1">
                          {cell.dayNum}
                          {cell.isToday ? (
                            <span className="text-[9px] font-sans px-1 py-0.2 rounded bg-primary text-primary-foreground font-semibold">
                              Today
                            </span>
                          ) : null}
                        </span>
                        <Coffee className="h-3 w-3 text-muted-foreground/60" />
                      </div>
                      <span className="text-[10px] text-muted-foreground uppercase font-medium">
                        Weekend Off
                      </span>
                    </div>
                  );
                }

                return (
                  <button
                    type="button"
                    key={cell.key}
                    onClick={() => handleOpenAddHoliday(cell.date)}
                    className={`min-h-[76px] p-2.5 rounded-lg bg-background border hover:border-primary hover:bg-primary/5 transition-all text-left flex flex-col justify-between group shadow-2xs ${
                      cell.isToday
                        ? "border-primary ring-2 ring-primary/30"
                        : "border-border"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-bold text-sm font-mono text-foreground group-hover:text-primary flex items-center gap-1">
                        {cell.dayNum}
                        {cell.isToday ? (
                          <span className="text-[9px] font-sans px-1 py-0.2 rounded bg-primary text-primary-foreground font-semibold">
                            Today
                          </span>
                        ) : null}
                      </span>
                      <Briefcase className="h-3 w-3 text-muted-foreground group-hover:text-primary opacity-40 group-hover:opacity-100" />
                    </div>
                    <span className="text-[10px] text-muted-foreground group-hover:text-primary transition-colors">
                      Working Day
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Organization Holidays Table for Year */}
      <Card className="border-border/80 shadow-sm overflow-hidden">
        <CardHeader className="border-b border-border/60 bg-muted/20 px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle className="text-base font-semibold">
                Public & Company Holidays ({selectedYear})
              </CardTitle>
              <CardDescription className="text-xs">
                List of registered holidays for {selectedYear} across{" "}
                {activeOrg?.name || "your organization"}.
              </CardDescription>
            </div>
            <Button
              size="sm"
              onClick={() => handleOpenAddHoliday()}
              className="gap-1.5 shadow-sm h-8 text-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Holiday
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {allHolidays.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground space-y-2">
              <CalendarIcon className="mx-auto h-8 w-8 text-muted-foreground/40" />
              <p className="font-medium text-foreground">No holidays added for {selectedYear}</p>
              <p className="text-xs">
                Click "Add Holiday" to configure public and festival holidays.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="font-semibold text-foreground">
                    Holiday Name
                  </TableHead>
                  <TableHead className="font-semibold text-foreground">
                    Date
                  </TableHead>
                  <TableHead className="font-semibold text-foreground">
                    Day of Week
                  </TableHead>
                  <TableHead className="font-semibold text-foreground">
                    Type
                  </TableHead>
                  <TableHead className="font-semibold text-foreground">
                    Description
                  </TableHead>
                  <TableHead className="text-right font-semibold text-foreground">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allHolidays.map((h) => {
                  const d = new Date(h.date);
                  const dayOfWeek = WEEKDAY_NAMES[d.getUTCDay()];
                  return (
                    <TableRow key={h.id} className="hover:bg-muted/30">
                      <TableCell className="font-semibold text-foreground">
                        {h.name}
                      </TableCell>
                      <TableCell className="font-mono text-sm text-foreground">
                        {h.date}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {dayOfWeek}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs uppercase capitalize font-medium">
                          {h.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {h.description || "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteHoliday(h.id)}
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Holiday Dialog Modal */}
      <Dialog open={isAddHolidayOpen} onOpenChange={setIsAddHolidayOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>Add Public Holiday</DialogTitle>
            <DialogDescription>
              Register a public or company holiday for your organization.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddHoliday} className="space-y-4 pt-2">
            {holidayError ? (
              <div className="p-3 text-xs bg-destructive/10 text-destructive rounded-lg border border-destructive/20">
                {holidayError}
              </div>
            ) : null}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-muted-foreground">
                Holiday Name *
              </label>
              <Input
                type="text"
                placeholder="e.g. Independence Day, Diwali, Christmas"
                value={newHolidayName}
                onChange={(e) => setNewHolidayName(e.target.value)}
                required
                className="bg-background"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-muted-foreground">
                Date (YYYY-MM-DD) *
              </label>
              <Input
                type="date"
                value={newHolidayDate}
                onChange={(e) => setNewHolidayDate(e.target.value)}
                required
                className="bg-background font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-muted-foreground">
                Holiday Type
              </label>
              <Select value={newHolidayType} onValueChange={setNewHolidayType}>
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public Holiday</SelectItem>
                  <SelectItem value="national">National Holiday</SelectItem>
                  <SelectItem value="festival">Festival</SelectItem>
                  <SelectItem value="company_off">Company Off</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-muted-foreground">
                Description (Optional)
              </label>
              <Input
                type="text"
                placeholder="Optional notes or details"
                value={newHolidayDescription}
                onChange={(e) => setNewHolidayDescription(e.target.value)}
                className="bg-background"
              />
            </div>

            <DialogFooter className="pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddHolidayOpen(false)}
                disabled={addingHoliday}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={addingHoliday} className="gap-1.5">
                {addingHoliday ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Add Holiday
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
