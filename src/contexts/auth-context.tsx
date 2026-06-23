"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { authApi, setAuthToken, type User } from "@/lib/api";
import { useRouter } from "next/navigation";
import posthog from "posthog-js";

interface AuthContextType {
  user: User | null;
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
      const token = typeof window !== "undefined"
        ? localStorage.getItem("auth_token")
        : null;

      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      // Verify token and get user
      console.log("🔐 Checking authentication...");
      const response = await authApi.getMe();
      setUser(response.user);
      console.log("✅ Authentication successful:", response.user.email);
    } catch (error) {
      console.error("❌ Auth check failed:", error);
      // Only clear token if it's actually invalid (401), not for network errors
      if (error instanceof Error && error.message.includes("401")) {
        console.log("🔓 Invalid token - logging out");
        setUser(null);
        setAuthToken(null);
      } else {
        console.log("⚠️ Auth check failed but keeping existing session (network error)");
        // Keep the user logged in for network errors
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
      router.push("/");
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
      router.push("/");
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
    <AuthContext.Provider
      value={{
        user,
        loading,
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
