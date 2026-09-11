import type { AttendanceSession, AttendanceSettings } from "@/lib/api";

export type AttendanceReminderKind = "check_in" | "check_out";

export function normalizeTime(value: string | undefined | null): string {
  const parts = (value ?? "00:00:00").split(":");
  const hour = (parts[0] ?? "00").padStart(2, "0");
  const minute = (parts[1] ?? "00").padStart(2, "0");
  const second = (parts[2] ?? "00").padStart(2, "0");
  const normalizedHour = hour === "24" ? "00" : hour;
  return `${normalizedHour}:${minute}:${second}`;
}

export function getLocalTimeInfo(
  timeZone: string = "Asia/Kolkata",
  baseDate: Date = new Date(),
): { localTimeString: string; localDateString: string; weekday: string } {
  try {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      weekday: "short",
    }).formatToParts(baseDate);
    const get = (type: Intl.DateTimeFormatPartTypes) =>
      parts.find((part) => part.type === type)?.value ?? "";
    const hour = get("hour") === "24" ? "00" : get("hour");
    return {
      localTimeString: `${hour}:${get("minute")}:${get("second")}`,
      localDateString: `${get("year")}-${get("month")}-${get("day")}`,
      weekday: get("weekday"),
    };
  } catch {
    const iso = baseDate.toISOString();
    return {
      localTimeString: iso.slice(11, 19),
      localDateString: iso.slice(0, 10),
      weekday: baseDate.toLocaleDateString("en-GB", { weekday: "short" }),
    };
  }
}

function isWeekend(weekday: string): boolean {
  return weekday === "Sat" || weekday === "Sun";
}

export function getDueAttendanceReminder(opts: {
  settings: AttendanceSettings | null;
  session: AttendanceSession | null;
  now?: Date;
}): AttendanceReminderKind | null {
  const { settings, session, now = new Date() } = opts;
  if (!settings) return null;

  const { localTimeString, weekday } = getLocalTimeInfo(
    settings.timezone || "Asia/Kolkata",
    now,
  );

  if (settings.exclude_weekends && isWeekend(weekday)) {
    return null;
  }

  const time = normalizeTime(localTimeString);
  const notCheckedIn = !session;
  const stillLoggedIn =
    !!session && session.status === "logged_in" && !session.check_out_at;

  if (
    settings.enable_checkin_reminder &&
    notCheckedIn &&
    time >= normalizeTime(settings.checkin_reminder_time) &&
    time < "14:00:00"
  ) {
    return "check_in";
  }

  if (
    settings.enable_checkout_reminder &&
    stillLoggedIn &&
    time >= normalizeTime(settings.checkout_reminder_time)
  ) {
    return "check_out";
  }

  return null;
}

export function attendanceReminderStorageKey(
  prefix: "dismissed",
  orgId: number,
  date: string,
  kind: AttendanceReminderKind,
): string {
  return `wraptron.attendanceReminder.${prefix}.${orgId}.${date}.${kind}`;
}
