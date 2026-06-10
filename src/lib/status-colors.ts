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
