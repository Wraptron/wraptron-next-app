"use client";

import React, { useState } from "react";
import {
  Bell,
  User,
  Settings,
  LogOut,
  Grip,
  ChevronRight,
  Palette,
  Languages,
  Globe2,
} from "lucide-react";
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
import { useAuth } from "@/contexts/auth-context";
import { usePageTitle } from "@/contexts/page-title-context";
import { useSidebar } from "@/contexts/sidebar-context";
import { GlobalSearch } from "@/components/global-search";
import { AppLauncherGrid } from "@/components/app-launcher-grid";

export default function TopNavbar() {
  const { user, logout } = useAuth();
  const { title, subtitle } = usePageTitle();
  const { isCollapsed, toggleSidebar } = useSidebar();
  const [notificationCount, setNotificationCount] = useState(3);
  const [appsMenuOpen, setAppsMenuOpen] = useState(false);

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
    <nav className="bg-background border-b border-border pl-2 pr-4 md:px-4 py-3 sticky top-0 z-40">
      <div className="flex items-center justify-between w-full">
        {/* Left side - Expand sidebar: top-left on mobile (always), when collapsed on desktop */}
        <div className="flex items-center gap-2 md:gap-4 min-w-0">
          {/* Visible on mobile only - always at top left */}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 shrink-0 md:hidden"
            onClick={toggleSidebar}
            aria-label="Expand sidebar"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          {/* Visible on desktop only when sidebar is collapsed */}
          {isCollapsed && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 shrink-0 hidden md:inline-flex"
              onClick={toggleSidebar}
              aria-label="Expand sidebar"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
          {title && (
            <div className="flex items-center space-x-3">
              <h1 className="text-xl font-semibold text-foreground">{title}</h1>
              {subtitle && (
                <>
                  <span className="text-muted-foreground/50">/</span>
                  <h2 className="text-lg font-medium text-muted-foreground">
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
          {/* App launcher */}
          <DropdownMenu open={appsMenuOpen} onOpenChange={setAppsMenuOpen}>
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
              <AppLauncherGrid
                variant="compact"
                onNavigate={() => setAppsMenuOpen(false)}
              />
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
              <DropdownMenuItem className="cursor-pointer" asChild>
                <Link href="/settings#appearance">
                  <Palette className="mr-2 h-4 w-4" />
                  <span>Appearance</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer" asChild>
                <Link href="/settings#language">
                  <Languages className="mr-2 h-4 w-4" />
                  <span>Language</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer" asChild>
                <Link href="/settings#timezone">
                  <Globe2 className="mr-2 h-4 w-4" />
                  <span>Timezone</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
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
