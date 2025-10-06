"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  MessageSquare,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  House,
  Folder,
  Box,
  Headset,
  Sparkle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function SideNav() {
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeItem, setActiveItem] = useState<string>("projects");

  const menuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: House,
      href: "/dashboard",
    },
    {
      id: "ai",
      label: "AI",
      icon: Sparkle,
      href: "/ai",
    },
    {
      id: "projects",
      label: "Projects",
      icon: Box,
      href: "/projects",
    },
    {
      id: "files",
      label: "Library",
      icon: Folder,
      href: "/library",
    },
    // {
    //   id: "pages",
    //   label: "Pages",
    //   icon: Monitor,
    //   href: "/studio",
    // },
    // {
    //   id: "process",
    //   label: "Integrations",
    //   icon: Plug,
    //   href: "/process",
    // },
    // {
    //   id: "model",`
    //   label: "Models",
    //   icon: Database,
    //   href: "/model",
    // },

    {
      id: "support",
      label: "Support",
      icon: Headset,
      href: "/support",
    },
    {
      id: "payments",
      label: "Payments",
      icon: CreditCard,
      href: "/payments",
    },
  ];

  const handleItemClick = (itemId: string, href: string) => {
    setActiveItem(itemId);
    router.push(href);
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div
      className={cn(
        "bg-white border-r border-gray-200 h-screen transition-all duration-300 ease-in-out  z-50",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <h2 className="text-xl font-semibold text-gray-900">Wraptron</h2>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleCollapse}
            className="h-8 w-8 p-0"
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Menu Items */}
      <nav className="p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeItem === item.id;

            return (
              <li key={item.id}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start h-10 px-3",
                    isActive && "bg-blue-50 text-blue-700 hover:bg-blue-100",
                    isCollapsed && "justify-center px-0"
                  )}
                  onClick={() => handleItemClick(item.id, item.href)}
                >
                  <Icon
                    className={cn(
                      "h-5 w-5",
                      isActive && "text-blue-700",
                      !isCollapsed && "mr-3"
                    )}
                  />
                  {!isCollapsed && (
                    <span className="text-sm font-medium">{item.label}</span>
                  )}
                </Button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      {!isCollapsed && (
        <div className="absolute bottom-4 left-4 right-4">
          <div className="text-xs text-gray-500 text-center">
            © 2024 Wraptron Studio
          </div>
        </div>
      )}
    </div>
  );
}
