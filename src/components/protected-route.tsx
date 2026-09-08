"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { useOrganization } from "@/contexts/organization-context";
import { NoOrganizationScreen } from "@/components/org-switcher";
import {
  buildNavAccess,
  canAccessPath,
  isClientPortalPath,
} from "@/lib/nav-access";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const PUBLIC_ROUTES = [
  "/login",
  "/signup",
  "/customer-onboarding",
  "/invite",
  "/forgot-password",
  "/reset-password",
];

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isAuthenticated, loading } = useAuth();
  const {
    activeOrg,
    isSuperAdmin,
    loaded: orgsLoaded,
    permissions,
    isOwner,
  } = useOrganization();
  const router = useRouter();
  const pathname = usePathname();

  const navAccess = buildNavAccess({
    permissions,
    isOwner,
    globalRole: user?.global_role,
  });

  const pathAllowed =
    !pathname ||
    isClientPortalPath(pathname) ||
    canAccessPath(pathname, navAccess);

  const isPublicRoute = PUBLIC_ROUTES.some((route) =>
    pathname?.startsWith(route),
  );

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      if (!isPublicRoute) {
        router.push("/login");
      }
      return;
    }

    if (!loading && isAuthenticated && pathname && !pathAllowed) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, loading, pathname, pathAllowed, router, isPublicRoute]);

  if (loading && !isPublicRoute) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!isAuthenticated && !isPublicRoute) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (isAuthenticated && pathname && !pathAllowed) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (
    isAuthenticated &&
    orgsLoaded &&
    !activeOrg &&
    !isSuperAdmin &&
    !isPublicRoute
  ) {
    return <NoOrganizationScreen />;
  }

  return <>{children}</>;
}
