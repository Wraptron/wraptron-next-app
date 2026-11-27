"use client";

import { useMemo } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { useOrganization } from "@/contexts/organization-context";
import { buildNavAccess, canAccessInternalNav } from "@/lib/nav-access";
import {
  detectModuleContext,
  getAccessibleModuleSwitcherItems,
  getMobileBarItems,
  getModuleMenuItems,
  resolveActiveNavItem,
} from "@/lib/module-nav";

/**
 * Resolves the active module, permission-filtered sidebar items, top 4 mobile
 * bottom bar items, and active item ID for the given (or current) pathname.
 */
export function useModuleNav(pathnameOverride?: string | null) {
  const currentPathname = usePathname();
  const searchParams = useSearchParams();
  const pathname =
    pathnameOverride !== undefined ? pathnameOverride : currentPathname;

  const { user } = useAuth();
  const { permissions, isOwner, isSuperAdmin, roleType, roleName } =
    useOrganization();

  const isAdminUser =
    isOwner ||
    isSuperAdmin ||
    roleType === "owner" ||
    roleName?.toLowerCase() === "admin" ||
    user?.role?.toLowerCase() === "admin" ||
    user?.global_role?.toLowerCase() === "super_admin";

  const navAccess = useMemo(
    () =>
      buildNavAccess({
        permissions,
        isOwner,
        globalRole: user?.global_role,
      }),
    [permissions, isOwner, user?.global_role],
  );

  const isClientPortalUser = !canAccessInternalNav(navAccess);

  const context = useMemo(
    () => detectModuleContext(pathname, navAccess),
    [pathname, navAccess],
  );

  const menuItems = useMemo(
    () => getModuleMenuItems(context, navAccess, isAdminUser),
    [context, navAccess, isAdminUser],
  );

  const mobileBarItems = useMemo(
    () => getMobileBarItems(menuItems),
    [menuItems],
  );

  const moduleSwitcherItems = useMemo(
    () => getAccessibleModuleSwitcherItems(navAccess),
    [navAccess],
  );

  const searchSection = searchParams?.get("section") ?? null;

  const { activeItemId, expandedParentId } = useMemo(
    () => resolveActiveNavItem(pathname, searchSection, context, menuItems),
    [pathname, searchSection, context, menuItems],
  );

  return {
    pathname,
    navAccess,
    isAdminUser,
    isClientPortalUser,
    ...context,
    menuItems,
    mobileBarItems,
    moduleSwitcherItems,
    activeItemId,
    expandedParentId,
  };
}
