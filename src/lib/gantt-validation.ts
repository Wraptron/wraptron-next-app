/** Manual Gantt schedule validation (no Zod). Mirrors backend rules. */

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export type GanttScheduleValue = {
  start_date: string;
  end_date: string;
  progress: number;
};

export function isIsoDateString(value: unknown): value is string {
  if (typeof value !== "string" || !ISO_DATE_RE.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === m - 1 &&
    dt.getUTCDate() === d
  );
}

export function formatDateToIsoLocal(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseProgress(value: unknown): number | null {
  if (typeof value === "number" && Number.isInteger(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    if (Number.isInteger(n)) return n;
  }
  return null;
}

export function validateGanttSchedule(input: {
  start_date: unknown;
  end_date: unknown;
  progress: unknown;
}): { ok: true; value: GanttScheduleValue } | { ok: false; error: string } {
  if (!isIsoDateString(input.start_date)) {
    return { ok: false, error: "start_date must be a valid YYYY-MM-DD date" };
  }
  if (!isIsoDateString(input.end_date)) {
    return { ok: false, error: "end_date must be a valid YYYY-MM-DD date" };
  }
  if (input.end_date < input.start_date) {
    return { ok: false, error: "end_date must be on or after start_date" };
  }
  const progress = parseProgress(input.progress);
  if (progress === null || progress < 0 || progress > 100) {
    return { ok: false, error: "progress must be an integer between 0 and 100" };
  }
  return {
    ok: true,
    value: {
      start_date: input.start_date,
      end_date: input.end_date,
      progress,
    },
  };
}
