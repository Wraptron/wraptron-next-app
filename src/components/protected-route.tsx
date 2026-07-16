"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { useOrganization } from "@/contexts/organization-context";
import { NoOrganizationScreen } from "@/components/org-switcher";
import {
  canAccessStaffRoutes,
  isStaffOnlyPath,
} from "@/lib/nav-access";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const PUBLIC_ROUTES = ["/login", "/signup", "/customer-onboarding"];

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isAuthenticated, loading } = useAuth();
  const { activeOrg, isSuperAdmin, loaded: orgsLoaded } = useOrganization();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      const isPublicRoute = PUBLIC_ROUTES.some((route) =>
        pathname?.startsWith(route)
      );

      if (!isPublicRoute) {
        router.push("/login");
      }
      return;
    }

    if (
      !loading &&
      isAuthenticated &&
      pathname &&
      !canAccessStaffRoutes(user?.role) &&
      isStaffOnlyPath(pathname)
    ) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, loading, pathname, router, user?.role]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // If not authenticated and trying to access protected route, don't render children
  // (redirect will happen in useEffect)
  const isPublicRoute = PUBLIC_ROUTES.some((route) =>
    pathname?.startsWith(route)
  );

  if (!isAuthenticated && !isPublicRoute) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (
    isAuthenticated &&
    pathname &&
    !canAccessStaffRoutes(user?.role) &&
    isStaffOnlyPath(pathname)
  ) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Authenticated users without any org membership can't load org-scoped
  // data — show a clear notice instead of a wall of failed requests.
  const isPublic = PUBLIC_ROUTES.some((route) => pathname?.startsWith(route));
  if (
    isAuthenticated &&
    orgsLoaded &&
    !activeOrg &&
    !isSuperAdmin &&
    !isPublic
  ) {
    return <NoOrganizationScreen />;
  }

  return <>{children}</>;
}

