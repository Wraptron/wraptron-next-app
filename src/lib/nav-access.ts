/**
 * Navigation and route access for role `user` vs `staff` / `admin`.
 * Regular users see the client portal sidebar; settings is in the top nav.
 */

export const STAFF_ONLY_MENU_IDS = new Set([
  "customers",
  "projects",
  "tasks",
  "products",
  "hiring",
  "accounts",
  "invoices",
  "workspace",
  "human-resource",
  "settings",
  "crm",
  "human-resources",
]);

const STAFF_ONLY_PATH_PREFIXES = [
  "/sales",
  "/customer-onboarding",
  "/projects",
  "/tasks",
  "/products",
  "/product",
  "/accounts",
  "/workspace",
  "/hr",
  "/hiring",
  "/invoices",
] as const;

/** Paths reserved for the client portal — allowed for role `user`. */
const CLIENT_PORTAL_PATH_PREFIXES = ["/portal"] as const;

export function isClientPortalPath(pathname: string): boolean {
  return (
    pathname === "/dashboard" ||
    CLIENT_PORTAL_PATH_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    )
  );
}

export function normalizeRole(role?: string | null): string {
  return (role ?? "user").toLowerCase();
}

export function canAccessStaffRoutes(role?: string | null): boolean {
  const normalized = normalizeRole(role);
  return normalized === "admin" || normalized === "staff";
}

/** Home page is the applications launcher — staff/admin only. */
export function isApplicationsHomePath(pathname: string): boolean {
  return pathname === "/";
}

export function isStaffOnlyPath(pathname: string): boolean {
  if (isApplicationsHomePath(pathname)) return true;
  if (isClientPortalPath(pathname)) return false;
  return STAFF_ONLY_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function filterByStaffAccess<T extends { id: string }>(
  items: T[],
  role?: string | null,
): T[] {
  if (canAccessStaffRoutes(role)) return items;
  return items.filter((item) => !STAFF_ONLY_MENU_IDS.has(item.id));
}

export function defaultPostLoginPath(role?: string | null): string {
  return canAccessStaffRoutes(role) ? "/" : "/dashboard";
}

const STAFF_ONLY_QUICK_LINK_HREFS = new Set([
  "/sales/deals",
  "/projects",
  "/products",
  "/accounts",
  "/workspace/attendance",
  "/invoices",
  "/settings",
]);

const STAFF_ONLY_QUICK_LINK_PREFIXES = ["/hr"] as const;

export function isStaffOnlyQuickLinkHref(href: string): boolean {
  if (STAFF_ONLY_QUICK_LINK_HREFS.has(href)) return true;
  return STAFF_ONLY_QUICK_LINK_PREFIXES.some(
    (prefix) => href === prefix || href.startsWith(`${prefix}/`),
  );
}

export function filterStaffOnlyQuickLinks<T extends { href: string }>(
  items: T[],
  role?: string | null,
): T[] {
  if (canAccessStaffRoutes(role)) return items;
  return items.filter((item) => !isStaffOnlyQuickLinkHref(item.href));
}

export function filterStaffOnlyModules<T extends { id: string }>(
  items: T[],
  role?: string | null,
): T[] {
  if (canAccessStaffRoutes(role)) return items;
  const staffOnlyModuleIds = new Set(["sales", "projects", "accounts"]);
  return items.filter((item) => !staffOnlyModuleIds.has(item.id));
}
