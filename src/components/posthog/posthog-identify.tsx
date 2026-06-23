"use client";

import { useEffect } from "react";
import posthog from "posthog-js";
import { useAuth } from "@/contexts/auth-context";

export function PostHogIdentify() {
  const { user, loading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN || loading) return;

    if (isAuthenticated && user) {
      posthog.identify(String(user.id), {
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
      });
    }
  }, [user, loading, isAuthenticated]);

  return null;
}
