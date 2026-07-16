"use client";

/**
 * Organization (multi-tenancy) context.
 *
 * Loads the caller's memberships, keeps the active organization in
 * localStorage (sent as X-Organization-Id by lib/api), and exposes the
 * caller's role within the active org. AuthProvider consumes this to
 * present `user.role` as the effective org role, so existing role-gated
 * UI keeps working unchanged.
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
} from "@/lib/api";

export type OrgRole = "admin" | "staff" | "customer";

interface OrganizationContextType {
  organizations: OrganizationSummary[];
  activeOrg: OrganizationSummary | null;
  /** Role within the active org; null when the user has no membership. */
  orgRole: OrgRole | null;
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
    // Wait for auth to resolve. Clearing active_org_id while auth is still
    // loading would wipe a just-switched org on every full page reload.
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
      // Full reload: every fetched dataset is org-scoped, so a clean
      // slate beats invalidating every cache by hand.
      if (typeof window !== "undefined") {
        window.location.reload();
      }
    },
    [organizations],
  );

  const orgRole = (activeOrg?.role ?? null) as OrgRole | null;

  return (
    <OrganizationContext.Provider
      value={{
        organizations,
        activeOrg,
        orgRole,
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

/** Effective role for legacy role-gated UI: super admins act as org admins. */
export function effectiveRole(
  isSuperAdmin: boolean,
  orgRole: OrgRole | null,
): string {
  if (isSuperAdmin) return "admin";
  return orgRole ?? "user";
}
