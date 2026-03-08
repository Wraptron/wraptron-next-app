"use client";

import React, { useMemo } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import {
  Box,
  CreditCard,
  Settings,
  Shield,
  Briefcase,
  TrendingUp,
  Store,
  type LucideIcon,
} from "lucide-react";

interface App {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  href: string;
  color: string;
}

const ALL_APPS: App[] = [
  {
    id: "crm",
    name: "Sales",
    description: "Deals, contacts, and companies",
    icon: TrendingUp,
    href: "/sales",
    color: "bg-green-500",
  },
  {
    id: "projects",
    name: "Projects",
    description: "Manage your projects and tasks",
    icon: Box,
    href: "/projects",
    color: "bg-blue-500",
  },
  {
    id: "products",
    name: "Products",
    description: "Product catalog and inventory",
    icon: Store,
    href: "/products",
    color: "bg-teal-500",
  },
  {
    id: "finances",
    name: "Finances",
    description: "View payment history",
    icon: CreditCard,
    href: "/finances",
    color: "bg-yellow-500",
  },
  {
    id: "workspace",
    name: "Workspace",
    description: "Employee management",
    icon: Briefcase,
    href: "/workspace",
    color: "bg-purple-500",
  },
  {
    id: "admin",
    name: "Admin",
    description: "Administration and user management",
    icon: Shield,
    href: "/admin/users",
    color: "bg-red-500",
  },
  {
    id: "settings",
    name: "Settings",
    description: "Configure your preferences",
    icon: Settings,
    href: "/settings",
    color: "bg-gray-500",
  },
];

export function AppDrawer() {
  const router = useRouter();
  const { user } = useAuth();

  const apps = useMemo(
    () =>
      user?.role === "admin"
        ? ALL_APPS
        : ALL_APPS.filter((app) => app.id !== "admin"),
    [user?.role],
  );

  const handleAppClick = (href: string) => {
    router.push(href);
  };

  return (
    <div className="w-full h-full flex flex-col p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Apps</h1>
        <p className="text-gray-600">Choose an app to get started</p>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-8">
        {apps.map((app) => {
          const Icon = app.icon;
          return (
            <div
              key={app.id}
              className="group flex flex-col items-center gap-3 cursor-pointer"
              onClick={() => handleAppClick(app.href)}
            >
              <div
                className={cn(
                  "w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-sm transition-all duration-300",
                  "group-hover:scale-110 group-hover:shadow-xl",
                  app.color,
                )}
              >
                <Icon className="w-8 h-8" />
              </div>
              <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                {app.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
