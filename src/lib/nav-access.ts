/**
 * Navigation and route access driven by org-scoped permissions.
 * Owner (and super admin acting as owner) bypasses all module checks.
 */

export interface NavAccess {
  permissions: string[];
  isOwner: boolean;
  /** Global account role (`user`, `super_admin`, etc.). */
  globalRole?: string | null;
}

/** Sidebar / launcher menu id → required permission (usually resource.read). */
export const MENU_PERMISSION: Record<string, string | null> = {
  dashboard: null,
  sales: "sales.read",
  crm: "sales.read",
  customers: "customers.read",
  projects: "projects.read",
  tasks: "tasks.read",
  products: "products.read",
  hiring: "hr.read",
  accounts: "accounts.read",
  invoices: "invoices.read",
  workspace: "hr.read",
  "human-resource": "hr.read",
  "human-resources": "hr.read",
  settings: "settings.read",
};

const PATH_PERMISSION_RULES: ReadonlyArray<readonly [string, string]> = [
  ["/sales", "sales.read"],
  ["/customer-onboarding", "sales.read"],
  ["/projects", "projects.read"],
  ["/tasks", "tasks.read"],
  ["/products", "products.read"],
  ["/product", "products.read"],
  ["/accounts", "accounts.read"],
  ["/workspace", "hr.read"],
  ["/hr", "hr.read"],
  ["/hiring", "hr.read"],
  ["/invoices", "invoices.read"],
  ["/settings", "settings.read"],
];

const CLIENT_PORTAL_PATH_PREFIXES = ["/portal"] as const;

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

export function hasPermission(
  permissions: string[] | undefined,
  name: string,
): boolean {
  return (permissions ?? []).includes(name);
}

export function normalizeRole(role?: string | null): string {
  return (role ?? "user").toLowerCase();
}

export function buildNavAccess(input: {
  permissions?: string[];
  isOwner?: boolean;
  globalRole?: string | null;
}): NavAccess {
  return {
    permissions: input.permissions ?? [],
    isOwner: input.isOwner ?? false,
    globalRole: input.globalRole ?? null,
  };
}

/** True when the user can see internal (non-portal) navigation at all. */
export function canAccessInternalNav(access: NavAccess): boolean {
  if (access.isOwner) return true;
  if (normalizeRole(access.globalRole) === "super_admin") return true;
  return access.permissions.some((p) => p.endsWith(".read"));
}

export function canAccessMenuItem(menuId: string, access: NavAccess): boolean {
  if (access.isOwner) return true;
  const required = MENU_PERMISSION[menuId];
  if (required === null || required === undefined) {
    return canAccessInternalNav(access);
  }
  return hasPermission(access.permissions, required);
}

export function isClientPortalPath(pathname: string): boolean {
  return (
    pathname === "/dashboard" ||
    CLIENT_PORTAL_PATH_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    )
  );
}

export function isApplicationsHomePath(pathname: string): boolean {
  return pathname === "/";
}

function pathRequiredPermission(pathname: string): string | null {
  for (const [prefix, permission] of PATH_PERMISSION_RULES) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      return permission;
    }
  }
  return null;
}

export function canAccessPath(pathname: string, access: NavAccess): boolean {
  if (access.isOwner || normalizeRole(access.globalRole) === "super_admin") {
    return true;
  }

  if (isClientPortalPath(pathname)) {
    return (
      normalizeRole(access.globalRole) === "user" ||
      hasPermission(access.permissions, "projects.read")
    );
  }

  if (isApplicationsHomePath(pathname)) {
    return canAccessInternalNav(access);
  }

  const required = pathRequiredPermission(pathname);
  if (required === null) {
    return canAccessInternalNav(access);
  }
  return hasPermission(access.permissions, required);
}

export function isStaffOnlyPath(pathname: string, access?: NavAccess): boolean {
  if (isApplicationsHomePath(pathname)) return true;
  if (isClientPortalPath(pathname)) return false;
  if (access) {
    return !canAccessPath(pathname, access);
  }
  return PATH_PERMISSION_RULES.some(
    ([prefix]) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/** @deprecated Prefer `canAccessInternalNav(buildNavAccess(...))`. */
export function canAccessStaffRoutes(role?: string | null): boolean {
  const normalized = normalizeRole(role);
  return normalized === "admin" || normalized === "staff";
}

export function filterByNavAccess<T extends { id: string }>(
  items: T[],
  access: NavAccess,
): T[] {
  if (access.isOwner || normalizeRole(access.globalRole) === "super_admin") {
    return items;
  }
  return items.filter((item) => canAccessMenuItem(item.id, access));
}

/** @deprecated Prefer `filterByNavAccess` with org permissions. */
export function filterByStaffAccess<T extends { id: string }>(
  items: T[],
  role?: string | null,
): T[] {
  if (canAccessStaffRoutes(role)) return items;
  const staffOnlyIds = new Set(
    Object.entries(MENU_PERMISSION)
      .filter(([, perm]) => perm !== null)
      .map(([id]) => id),
  );
  return items.filter((item) => !staffOnlyIds.has(item.id));
}

export function defaultPostLoginPath(_access?: NavAccess): string {
  return "/dashboard";
}

export function isStaffOnlyQuickLinkHref(href: string): boolean {
  if (STAFF_ONLY_QUICK_LINK_HREFS.has(href)) return true;
  return STAFF_ONLY_QUICK_LINK_PREFIXES.some(
    (prefix) => href === prefix || href.startsWith(`${prefix}/`),
  );
}

export function filterStaffOnlyQuickLinks<T extends { href: string }>(
  items: T[],
  access: NavAccess,
): T[] {
  if (access.isOwner || canAccessInternalNav(access)) {
    if (access.isOwner) return items;
    return items.filter((item) => {
      const required = pathRequiredPermission(item.href.split("?")[0] ?? "");
      if (!required) return true;
      return hasPermission(access.permissions, required);
    });
  }
  return items.filter((item) => !isStaffOnlyQuickLinkHref(item.href));
}

export function filterStaffOnlyModules<T extends { id: string }>(
  items: T[],
  access: NavAccess,
): T[] {
  return filterByNavAccess(items, access);
}
