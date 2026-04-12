"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const PUBLIC_ROUTES = ["/login", "/signup", "/customer-onboarding"];

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, loading } = useAuth();
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
    }
  }, [isAuthenticated, loading, pathname, router]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-50">
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
      <div className="h-screen w-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return <>{children}</>;
}

