"use client";

import React, { useState } from "react";
import { Bell, User, Settings, LogOut, Grip } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { usePageTitle } from "@/contexts/page-title-context";
import { GlobalSearch } from "@/components/global-search";
import {
  Box,
  Users,
  CreditCard,
  Shield,
  Briefcase,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface App {
  id: string;
  name: string;
  icon: LucideIcon;
  href: string;
  color: string;
}

const APPS: App[] = [
  {
    id: "crm",
    name: "CRM",
    icon: Users,
    href: "/crm",
    color: "bg-green-500",
  },
  {
    id: "projects",
    name: "PPM",
    icon: Box,
    href: "/ppm",
    color: "bg-blue-500",
  },
  {
    id: "finances",
    name: "Finances",
    icon: CreditCard,
    href: "/finances",
    color: "bg-yellow-500",
  },
  {
    id: "workspace",
    name: "Workspace",
    icon: Briefcase,
    href: "/workspace",
    color: "bg-purple-500",
  },
  {
    id: "admin",
    name: "Admin",
    icon: Shield,
    href: "/admin/users",
    color: "bg-red-500",
  },
  {
    id: "settings",
    name: "Settings",
    icon: Settings,
    href: "/settings",
    color: "bg-gray-500",
  },
];

export default function TopNavbar() {
  const { user, logout } = useAuth();
  const { title, subtitle } = usePageTitle();
  const router = useRouter();
  const pathname = usePathname();
  const [notificationCount, setNotificationCount] = useState(3);

  const handleNotificationClick = () => {
    setNotificationCount(0);
  };

  const handleLogout = () => {
    logout();
  };

  const getUserInitials = () => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return "U";
  };

  const getUserDisplayName = () => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    if (user?.first_name) {
      return user.first_name;
    }
    return user?.email || "User";
  };

  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-40">
      <div className="flex items-center justify-between w-full">
        {/* Left side - Page title */}
        <div className="flex items-center space-x-4">
          {title && (
            <div className="flex items-center space-x-3">
              <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
              {subtitle && (
                <>
                  <span className="text-gray-300">/</span>
                  <h2 className="text-lg font-medium text-gray-600">
                    {subtitle}
                  </h2>
                </>
              )}
            </div>
          )}
        </div>

        {/* Right side - Command, Notifications and Profile */}
        <div className="flex items-center space-x-4">
          {/* Global Search */}
          <GlobalSearch />

          {/* Notifications */}
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              className="relative"
              onClick={handleNotificationClick}
            >
              <Bell className="h-5 w-5" />
              {notificationCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs p-0"
                >
                  {notificationCount}
                </Badge>
              )}
            </Button>
          </div>
          <div>
            <Link href="/settings">
              <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                <Settings className="h-5 w-5" />
              </Button>
            </Link>
          </div>
          {/* App Drawer */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                <Grip className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 p-3">
              <DropdownMenuLabel className="px-2 py-1.5 text-sm font-semibold">
                Apps
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="my-2" />
              <div className="grid grid-cols-3 gap-2">
                {APPS.map((app) => {
                  const Icon = app.icon;
                  const isActive = pathname?.startsWith(app.href);
                  return (
                    <div
                      key={app.id}
                      className={cn(
                        "flex flex-col items-center gap-2 p-3 rounded-lg cursor-pointer transition-colors",
                        "hover:bg-gray-100",
                        isActive && "bg-gray-100",
                      )}
                      onClick={() => {
                        router.push(app.href);
                      }}
                    >
                      <div
                        className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-sm",
                          app.color,
                        )}
                      >
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-medium text-gray-700 text-center">
                        {app.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
          {/* Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/api/placeholder/32/32" alt="Profile" />
                  <AvatarFallback>{getUserInitials()}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {getUserDisplayName()}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email || "No email"}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer" asChild>
                <Link href="/settings">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}
