"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { authApi, setAuthToken, type User } from "@/lib/api";
import { buildNavAccess, defaultPostLoginPath } from "@/lib/nav-access";
import {
  effectiveRole,
  OrganizationProvider,
  useOrganization,
} from "@/contexts/organization-context";
import { useRouter } from "next/navigation";
import posthog from "posthog-js";

/** User as consumed by the app: `role` is the EFFECTIVE role within the
 * active organization (super admins act as admin; no membership = user).
 * The global account role is kept in `global_role`. */
export interface EffectiveUser extends User {
  global_role: string;
}

interface AuthContextType {
  user: EffectiveUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (
    email: string,
    password: string,
    firstName?: string,
    lastName?: string,
    role?: string,
    phoneNumber?: string,
  ) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Check if user is authenticated on mount only
  useEffect(() => {
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAuth = async () => {
    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("auth_token")
          : null;

      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      const response = await authApi.getMe();
      setUser(response.user);
    } catch (error) {
      console.error("❌ Auth check failed:", error);
      // Only clear token if it's actually invalid (401), not for network errors
      if (error instanceof Error && error.message.includes("401")) {
        setUser(null);
        setAuthToken(null);
      }
      // Don't redirect here - let ProtectedRoute handle it
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await authApi.login({ email, password });
      setAuthToken(response.token);
      setUser(response.user);
      router.push(
        defaultPostLoginPath(
          buildNavAccess({ globalRole: response.user.role }),
        ),
      );
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  };

  const signup = async (
    email: string,
    password: string,
    firstName?: string,
    lastName?: string,
    role?: string,
    phoneNumber?: string,
  ) => {
    try {
      const response = await authApi.signup({
        email,
        password,
        first_name: firstName,
        last_name: lastName,
        phone_number: phoneNumber,
        role,
      });
      setAuthToken(response.token);
      setUser(response.user);
      router.push(
        defaultPostLoginPath(
          buildNavAccess({ globalRole: response.user.role }),
        ),
      );
    } catch (error) {
      console.error("Signup failed:", error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    if (process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN) {
      posthog.reset();
    }
    authApi.logout();
  };

  const refreshUser = async () => {
    try {
      const response = await authApi.getMe();
      setUser(response.user);
    } catch (error) {
      console.error("Failed to refresh user:", error);
      setUser(null);
      setAuthToken(null);
    }
  };

  return (
    <OrganizationProvider authenticated={!!user} authLoading={loading}>
      <EffectiveAuthProvider
        rawUser={user}
        loading={loading}
        login={login}
        signup={signup}
        logout={logout}
        refreshUser={refreshUser}
      >
        {children}
      </EffectiveAuthProvider>
    </OrganizationProvider>
  );
}

function EffectiveAuthProvider({
  rawUser,
  loading,
  login,
  signup,
  logout,
  refreshUser,
  children,
}: {
  rawUser: User | null;
  loading: boolean;
  login: AuthContextType["login"];
  signup: AuthContextType["signup"];
  logout: AuthContextType["logout"];
  refreshUser: AuthContextType["refreshUser"];
  children: ReactNode;
}) {
  const {
    isSuperAdmin,
    roleType,
    permissions,
    isOwner,
    loaded,
  } = useOrganization();

  const user: EffectiveUser | null = rawUser
    ? {
        ...rawUser,
        role: loaded
          ? effectiveRole(
              isSuperAdmin,
              roleType,
              permissions,
              rawUser.role,
            )
          : rawUser.role,
        global_role: rawUser.role,
      }
    : null;

  return (
    <AuthContext.Provider
      value={{
        user,
        // Auth is "loading" until both the token check and the org
        // memberships have resolved, so role gates don't flicker.
        loading: loading || (!!rawUser && !loaded),
        isAuthenticated: !!user,
        login,
        signup,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
