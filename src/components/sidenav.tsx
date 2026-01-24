"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Box,
  Headset,
  ChartPie,
  Shield,
  Users,
  Building2,
  TrendingUp,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/contexts/sidebar-context";
import { useAuth } from "@/contexts/auth-context";

interface MenuItem {
  id: string;
  label: string;
  icon: LucideIcon;
  href: string;
}

const MAIN_MENU_ITEMS: MenuItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: ChartPie,
    href: "/dashboard",
  },
  {
    id: "customers",
    label: "Customers",
    icon: Users,
    href: "/customers",
  },

  {
    id: "projects",
    label: "Projects",
    icon: Box,
    href: "/projects",
  },
  {
    id: "hiring",
    label: "Hiring",
    icon: Users,
    href: "/hiring",
  },
  {
    id: "transactions",
    label: "Transactions",
    icon: CreditCard,
    href: "/transactions",
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    href: "/settings",
  },
];

const ADMIN_MENU_ITEMS: MenuItem[] = [
  {
    id: "admin-users",
    label: "User Management",
    icon: Shield,
    href: "/admin/users",
  },
];

export default function SideNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { isCollapsed, toggleSidebar } = useSidebar();
  const { user } = useAuth();
  const [activeItem, setActiveItem] = useState<string>("");

  const isAdmin = user?.role === "admin";
  const menuItems = isAdmin
    ? [...MAIN_MENU_ITEMS, ...ADMIN_MENU_ITEMS]
    : MAIN_MENU_ITEMS;

  // Determine active item based on pathname
  useEffect(() => {
    if (!pathname) return;

    const mainItem = menuItems.find((item) => pathname.startsWith(item.href));
    if (mainItem) setActiveItem(mainItem.id);
  }, [pathname, menuItems]);

  const handleItemClick = (itemId: string, href: string) => {
    setActiveItem(itemId);
    router.push(href);
  };

  const renderMenuItem = (item: MenuItem) => {
    const Icon = item.icon;
    const isActive = activeItem === item.id;

    return (
      <li key={item.id}>
        <Button
          variant={isActive ? "secondary" : "ghost"}
          className={cn(
            "w-full justify-start h-10 px-3",
            isActive && "bg-blue-50 text-blue-700 hover:bg-blue-100",
            isCollapsed && "justify-center px-0 w-10"
          )}
          onClick={() => handleItemClick(item.id, item.href)}
        >
          <Icon
            className={cn(
              "h-5 w-5 flex-shrink-0",
              isActive && "text-blue-700",
              !isCollapsed && "mr-3"
            )}
          />
          {!isCollapsed && (
            <span className="text-sm font-normal">{item.label}</span>
          )}
        </Button>
      </li>
    );
  };

  return (
    <div
      className={cn(
        "fixed top-0 left-0 bg-white border-r border-gray-200 z-50 h-screen transition-all duration-300 ease-in-out flex flex-col",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <h2 className="text-xl font-semibold text-gray-900">Wraptron</h2>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className="h-8 w-8 p-0"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Menu Items - Scrollable */}
      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-2">
          {MAIN_MENU_ITEMS.map(renderMenuItem)}
          {isAdmin && (
            <>
              <li className="pt-4 pb-2">
                {!isCollapsed && (
                  <div className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Administration
                  </div>
                )}
              </li>
              {ADMIN_MENU_ITEMS.map(renderMenuItem)}
            </>
          )}
        </ul>
      </nav>
    </div>
  );
}


