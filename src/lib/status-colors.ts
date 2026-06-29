const badgeBase = "border-transparent";

/** Theme-aware status badge classes for list/collection views. */
export function statusBadgeClass(status?: string | null): string {
  const key = status?.toLowerCase().trim() ?? "";

  const colors: Record<string, string> = {
    active: `${badgeBase} bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300`,
    completed: `${badgeBase} bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300`,
    pending: `${badgeBase} bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300`,
    inactive: `${badgeBase} bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300`,
    archived: `${badgeBase} bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300`,
    prospect: `${badgeBase} bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300`,
    customer: `${badgeBase} bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300`,
    draft: `${badgeBase} bg-muted text-muted-foreground`,
    task: `${badgeBase} bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300`,
    call: `${badgeBase} bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300`,
    note: `${badgeBase} bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300`,
    meeting: `${badgeBase} bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300`,
    whatsapp: `${badgeBase} bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300`,
  };

  return colors[key] ?? `${badgeBase} bg-muted text-muted-foreground`;
}

/** Theme-aware deal pipeline stage badge classes. */
export function dealStageBadgeClass(stage?: string | null): string {
  const key = stage?.toLowerCase().trim() ?? "";

  const colors: Record<string, string> = {
    "new lead": `${badgeBase} bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200`,
    qualified: `${badgeBase} bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300`,
    "requirement gathered": `${badgeBase} bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200`,
    "solution proposed": `${badgeBase} bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300`,
    "negotiation/objection handling": `${badgeBase} bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300`,
    "proposal accepted": `${badgeBase} bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300`,
    "project implementation": `${badgeBase} bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300`,
    "next step - project implementation": `${badgeBase} bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300`,
    "maintenance - project delivered": `${badgeBase} bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300`,
  };

  return colors[key] ?? `${badgeBase} bg-muted text-muted-foreground`;
}

/** Theme-aware deal status badge classes. */
export function dealStatusBadgeClass(status?: string | null): string {
  const key = status?.toLowerCase().trim() ?? "";

  const colors: Record<string, string> = {
    open: `${badgeBase} bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300`,
    won: `${badgeBase} bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300`,
    lost: `${badgeBase} bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300`,
    closed: `${badgeBase} bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200`,
  };

  return colors[key] ?? `${badgeBase} bg-muted text-muted-foreground`;
}

/** Dark-mode-safe header tint for kanban columns keyed by status id. */
export function kanbanColumnHeaderClass(columnId: string): string {
  const colors: Record<string, string> = {
    draft: "bg-muted/60",
    pending: "bg-yellow-500/10 dark:bg-yellow-500/20",
    active: "bg-green-500/10 dark:bg-green-500/20",
    completed: "bg-blue-500/10 dark:bg-blue-500/20",
    inactive: "bg-red-500/10 dark:bg-red-500/20",
    other: "bg-muted/60",
  };

  return colors[columnId] ?? "bg-muted/60";
}
