export type RequirementsViewMode = "edit" | "split" | "preview-full";

/** Modes that may be persisted (never start in preview-full). */
export type RequirementsPersistedViewMode = "edit" | "split";

export const REQUIREMENTS_VIEW_MODE_KEY = "wraptron.requirements.viewMode";

export function isPersistedViewMode(
  value: unknown,
): value is RequirementsPersistedViewMode {
  return value === "edit" || value === "split";
}

export function readPersistedViewMode(
  storage?: Pick<Storage, "getItem"> | null,
): RequirementsPersistedViewMode {
  try {
    const raw = storage?.getItem(REQUIREMENTS_VIEW_MODE_KEY);
    if (isPersistedViewMode(raw)) return raw;
  } catch {
    // ignore
  }
  return "edit";
}

export function persistViewMode(
  mode: RequirementsViewMode,
  storage?: Pick<Storage, "setItem"> | null,
): void {
  if (mode === "preview-full") return;
  try {
    storage?.setItem(REQUIREMENTS_VIEW_MODE_KEY, mode);
  } catch {
    // ignore
  }
}

/** Toggle Preview button: edit ↔ split (preview-full exits to split). */
export function togglePreviewMode(
  mode: RequirementsViewMode,
): RequirementsPersistedViewMode {
  if (mode === "edit") return "split";
  return "edit";
}
