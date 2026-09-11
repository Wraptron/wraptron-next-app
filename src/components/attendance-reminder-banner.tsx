"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Bell, BellOff, LogIn, LogOut, X } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useOrganization } from "@/contexts/organization-context";
import { buildNavAccess, canAccessInternalNav } from "@/lib/nav-access";
import {
  attendanceApi,
  type AttendanceSession,
  type AttendanceSettings,
} from "@/lib/api";
import {
  attendanceReminderStorageKey,
  getDueAttendanceReminder,
  getLocalTimeInfo,
  type AttendanceReminderKind,
} from "@/lib/attendance-reminder";
import { enablePushNotifications } from "@/lib/web-push-client";
import { Button } from "@/components/ui/button";

const ATTENDANCE_ACTION_HREF = "/workspace/dashboard";
const POLL_MS = 60_000;

function readFlag(key: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

function writeFlag(key: string): void {
  try {
    window.localStorage.setItem(key, "1");
  } catch {
    // ignore quota / private-mode failures
  }
}

export function AttendanceReminderBanner() {
  const { user, isAuthenticated } = useAuth();
  const { activeOrg, permissions, isOwner, isSuperAdmin } = useOrganization();
  const [settings, setSettings] = useState<AttendanceSettings | null>(null);
  const [session, setSession] = useState<AttendanceSession | null>(null);
  const [now, setNow] = useState(() => new Date());
  const [dismissedKind, setDismissedKind] = useState<AttendanceReminderKind | null>(
    null,
  );
  const [notificationPermission, setNotificationPermission] = useState<
    NotificationPermission | "unsupported"
  >("default");

  const isStaff = useMemo(
    () =>
      canAccessInternalNav(
        buildNavAccess({
          permissions,
          isOwner: isOwner || isSuperAdmin,
          globalRole: user?.global_role ?? user?.role,
        }),
      ),
    [permissions, isOwner, isSuperAdmin, user?.global_role, user?.role],
  );

  const orgId = activeOrg?.id != null ? Number(activeOrg.id) : 0;

  const refreshAttendance = useCallback(async () => {
    if (!isAuthenticated || !isStaff || !orgId) return;
    try {
      const [settingsRes, todayRes] = await Promise.all([
        attendanceApi.getSettings(),
        attendanceApi.getMyToday(),
      ]);
      setSettings(settingsRes.settings);
      setSession(todayRes.session);
    } catch {
      setSettings(null);
      setSession(null);
    }
  }, [isAuthenticated, isStaff, orgId]);

  useEffect(() => {
    if (typeof Notification === "undefined") {
      setNotificationPermission("unsupported");
      return;
    }
    setNotificationPermission(Notification.permission);
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !isStaff || !orgId) return;
    void refreshAttendance();
    const id = window.setInterval(() => {
      void refreshAttendance();
    }, POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        void refreshAttendance();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [isAuthenticated, isStaff, orgId, refreshAttendance]);

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const dueKind = useMemo(
    () => getDueAttendanceReminder({ settings, session, now }),
    [settings, session, now],
  );

  const dateKey = getLocalTimeInfo(settings?.timezone || "Asia/Kolkata", now)
    .localDateString;

  useEffect(() => {
    if (!dueKind || !orgId) {
      setDismissedKind(null);
      return;
    }
    const key = attendanceReminderStorageKey("dismissed", orgId, dateKey, dueKind);
    setDismissedKind(readFlag(key) ? dueKind : null);
  }, [dueKind, orgId, dateKey]);

  if (!isAuthenticated || !isStaff || !dueKind || dismissedKind === dueKind) {
    return null;
  }

  const isCheckIn = dueKind === "check_in";
  const title = isCheckIn
    ? "Please mark your check-in"
    : "Please mark your check-out";
  const description = isCheckIn
    ? "You have not logged in for today. Use the workspace dashboard to check in."
    : "Your reminder time has passed and you are still logged in.";

  const handleDismiss = () => {
    if (!orgId) return;
    writeFlag(attendanceReminderStorageKey("dismissed", orgId, dateKey, dueKind));
    setDismissedKind(dueKind);
  };

  const handleEnablePhoneAlerts = async () => {
    await enablePushNotifications();
    if (typeof Notification !== "undefined") {
      setNotificationPermission(Notification.permission);
    }
  };

  return (
    <div className="border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-50">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-start gap-2">
          {isCheckIn ? (
            <LogIn className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <LogOut className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-5">{title}</p>
            <p className="text-xs text-amber-900/80 dark:text-amber-100/80">
              {description}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {notificationPermission === "default" ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 border-amber-300 bg-white/80 text-amber-950 hover:bg-white dark:border-amber-800 dark:bg-amber-950 dark:text-amber-50"
              onClick={() => void handleEnablePhoneAlerts()}
            >
              <Bell className="h-3.5 w-3.5" />
              Enable phone alerts
            </Button>
          ) : notificationPermission === "denied" ? (
            <span className="inline-flex items-center gap-1 text-xs text-amber-900/80 dark:text-amber-100/80">
              <BellOff className="h-3.5 w-3.5" />
              Phone alerts blocked
            </span>
          ) : null}
          <Button asChild size="sm" className="h-8">
            <Link href={ATTENDANCE_ACTION_HREF}>
              {isCheckIn ? "Check in now" : "Check out now"}
            </Link>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="text-amber-900 hover:bg-amber-100 dark:text-amber-100 dark:hover:bg-amber-900/60"
            aria-label="Dismiss attendance reminder"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
