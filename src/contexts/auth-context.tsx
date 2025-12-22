"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { authApi, setAuthToken, type User } from "@/lib/api";
import { useRouter, usePathname } from "next/navigation";

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
  const pathname = usePathname();

  // Check if user is authenticated on mount and when pathname changes
  useEffect(() => {
    checkAuth();
  }, [pathname]);

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
      const response = await authApi.getMe();
      setUser(response.user);
    } catch (error) {
      console.error("Auth check failed:", error);
      setUser(null);
      setAuthToken(null);
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
