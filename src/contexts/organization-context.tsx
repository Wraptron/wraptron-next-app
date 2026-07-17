"use client";

/**
 * Organization (multi-tenancy) context.
 *
 * Loads the caller's memberships, keeps the active organization in
 * localStorage (sent as X-Organization-Id by lib/api), and exposes
 * role + permission data for the active org.
 */
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  getActiveOrgId,
  organizationsApi,
  setActiveOrgId,
  type OrganizationSummary,
  type OrgRoleType,
} from "@/lib/api";

interface OrganizationContextType {
  organizations: OrganizationSummary[];
  activeOrg: OrganizationSummary | null;
  /** Effective permissions for the active org membership. */
  permissions: string[];
  roleType: OrgRoleType | null;
  roleName: string | null;
  roleId: number | null;
  isOwner: boolean;
  isSuperAdmin: boolean;
  loading: boolean;
  /** True once memberships have been loaded for an authenticated user. */
  loaded: boolean;
  switchOrg: (orgId: number) => void;
  refreshOrganizations: () => Promise<void>;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(
  undefined,
);

export function OrganizationProvider({
  authenticated,
  authLoading = false,
  children,
}: {
  authenticated: boolean;
  /** While true, do not clear the persisted active org (avoids wipe on reload). */
  authLoading?: boolean;
  children: ReactNode;
}) {
  const [organizations, setOrganizations] = useState<OrganizationSummary[]>(
    [],
  );
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [activeOrg, setActiveOrg] = useState<OrganizationSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const applyOrgs = useCallback(
    (orgs: OrganizationSummary[], superAdmin: boolean) => {
      setOrganizations(orgs);
      setIsSuperAdmin(superAdmin);
      const persisted = getActiveOrgId();
      const valid =
        orgs.find((o) => Number(o.id) === persisted) ?? orgs[0] ?? null;
      setActiveOrg(valid);
      setActiveOrgId(valid?.id != null ? Number(valid.id) : null);
    },
    [],
  );

  const refreshOrganizations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await organizationsApi.getMine();
      applyOrgs(res.organizations, res.is_super_admin);
    } catch (err) {
      console.error("Failed to load organizations:", err);
      applyOrgs([], false);
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  }, [applyOrgs]);

  useEffect(() => {
    if (authLoading) return;

    if (authenticated) {
      void refreshOrganizations();
    } else {
      setOrganizations([]);
      setActiveOrg(null);
      setIsSuperAdmin(false);
      setLoaded(false);
      setActiveOrgId(null);
    }
  }, [authenticated, authLoading, refreshOrganizations]);

  const switchOrg = useCallback(
    (orgId: number) => {
      const id = Number(orgId);
      const target = organizations.find((o) => Number(o.id) === id);
      if (!target) return;
      setActiveOrgId(id);
      setActiveOrg(target);
      if (typeof window !== "undefined") {
        window.location.reload();
      }
    },
    [organizations],
  );

  const roleType = activeOrg?.role_type ?? null;
  const isOwner = isSuperAdmin || roleType === "owner";

  return (
    <OrganizationContext.Provider
      value={{
        organizations,
        activeOrg,
        permissions: activeOrg?.permissions ?? [],
        roleType,
        roleName: activeOrg?.role_name ?? null,
        roleId: activeOrg?.role_id ?? null,
        isOwner,
        isSuperAdmin,
        loading,
        loaded,
        switchOrg,
        refreshOrganizations,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error(
      "useOrganization must be used within an OrganizationProvider",
    );
  }
  return context;
}

/** Legacy effective role string for components not yet on permission checks. */
export function effectiveRole(
  isSuperAdmin: boolean,
  roleType: OrgRoleType | null,
  permissions: string[],
  globalRole?: string | null,
): string {
  if (isSuperAdmin || roleType === "owner") return "admin";
  if (permissions.some((p) => p.endsWith(".read"))) return "staff";
  return normalizeGlobalRole(globalRole);
}

function normalizeGlobalRole(role?: string | null): string {
  return (role ?? "user").toLowerCase();
}
