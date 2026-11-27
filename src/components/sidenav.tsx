"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Info,
  Bug,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/contexts/sidebar-context";
import { useModuleNav } from "@/hooks/use-module-nav";
import type { MenuItem } from "@/lib/module-nav";
import { PORTAL_RESOURCES_HREF } from "@/lib/portal-nav";

const FEEDBACK_MAILTO = `mailto:dev@wraptron.com?subject=${encodeURIComponent("Wraptron feedback")}`;

export default function SideNav() {
  const router = useRouter();
  const pathname = usePathname();
  const {
    menuItems,
    activeItemId,
    expandedParentId,
    isClientPortalUser,
  } = useModuleNav(pathname);
  const { isCollapsed, toggleSidebar } = useSidebar();
  const [activeItem, setActiveItem] = useState<string>("");
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [aboutOpen, setAboutOpen] = useState(false);
  const [aboutVersion, setAboutVersion] = useState<string | null>(null);
  const [aboutEntries, setAboutEntries] = useState<
    { heading: string; items: string[] }[]
  >([]);
  const [aboutNotesLoading, setAboutNotesLoading] = useState(false);

  useEffect(() => {
    if (!aboutOpen) return;
    let cancelled = false;
    setAboutNotesLoading(true);
    void (async () => {
      try {
        const res = await fetch("/api/changenotes?limit=3");
        const data = (await res.json()) as {
          appVersion?: string;
          entries?: { heading: string; items: string[] }[];
        };
        if (!cancelled) {
          setAboutVersion(data.appVersion ?? null);
          setAboutEntries(Array.isArray(data.entries) ? data.entries : []);
        }
      } catch {
        if (!cancelled) {
          setAboutVersion(null);
          setAboutEntries([]);
        }
      } finally {
        if (!cancelled) setAboutNotesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [aboutOpen]);

  useEffect(() => {
    setActiveItem(activeItemId);
    if (expandedParentId) {
      setExpandedItems((prev) => new Set(prev).add(expandedParentId));
    }
  }, [activeItemId, expandedParentId]);

  const handleItemClick = (
    itemId: string,
    href: string,
    hasChildren?: boolean,
  ) => {
    if (hasChildren && !isCollapsed) {
      // Toggle expansion
      setExpandedItems((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(itemId)) {
          newSet.delete(itemId);
        } else {
          newSet.add(itemId);
        }
        return newSet;
      });
    } else {
      setActiveItem(itemId);
      router.push(href);
      // Close sidebar on mobile after navigation
      if (
        typeof window !== "undefined" &&
        window.matchMedia("(max-width: 767px)").matches
      ) {
        toggleSidebar();
      }
    }
  };

  const renderMenuItem = (
    item: MenuItem,
    level: number = 0,
    isLast: boolean = false,
  ) => {
    const Icon = item.icon;
    const isActive = activeItem === item.id;
    const isExpanded = expandedItems.has(item.id);
    const hasChildren = item.children && item.children.length > 0;

    return (
      <li key={item.id} className="relative">
        <Button
          variant={isActive ? "secondary" : "ghost"}
          className={cn(
            "w-full justify-start h-10 px-3 relative",
            isActive &&
              "bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent/90",
            isCollapsed && "justify-center px-0 w-10",
            level > 0 && !isCollapsed && "pl-12",
          )}
          onClick={() => handleItemClick(item.id, item.href, hasChildren)}
        >
          {(level === 0 || isCollapsed) && (
            <Icon
              className={cn(
                "h-5 w-5 flex-shrink-0 relative z-10",
                isActive && "text-sidebar-accent-foreground",
                !isCollapsed && "mr-3",
              )}
            />
          )}
          {!isCollapsed && (
            <>
              <span className="text-sm font-normal relative z-10">
                {item.label}
              </span>
              {hasChildren && (
                <ChevronRight
                  className={cn(
                    "h-4 w-4 ml-auto transition-transform relative z-10",
                    isExpanded && "transform rotate-90",
                  )}
                />
              )}
            </>
          )}
        </Button>
        {hasChildren && isExpanded && !isCollapsed && (
          <ul className="mt-1 space-y-1 relative pl-3">
            {item.children!.map((child, index) =>
              renderMenuItem(
                child,
                level + 1,
                index === item.children!.length - 1,
              ),
            )}
          </ul>
        )}
      </li>
    );
  };

  return (
    <>
      <div
        className={cn(
          "fixed top-0 left-0 bg-sidebar text-sidebar-foreground border-r border-sidebar-border z-50 h-screen transition-all duration-300 ease-in-out hidden md:flex flex-col print:hidden",
          isCollapsed ? "w-16" : "w-64",
        )}
      >
        {/* Header: when expanded show title + collapse; when collapsed show logo (web) */}
        <div
          className={cn(
            "border-b border-sidebar-border flex-shrink-0",
            isCollapsed ? "px-0 py-2 flex justify-center" : "px-4 py-3",
          )}
        >
          <div className="flex items-center justify-between w-full">
            {isCollapsed ? (
              <button
                type="button"
                onClick={() => router.push("/")}
                className="flex items-center justify-center w-full min-h-[40px] focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sidebar-ring rounded"
                aria-label="Wraptron home"
              >
                <Image
                  src="/icon-192.png"
                  alt="Wraptron"
                  width={40}
                  height={40}
                  className="object-contain shrink-0"
                />
              </button>
            ) : (
              <>
                <h2
                  className="text-xl font-semibold text-sidebar-foreground cursor-pointer hover:text-primary transition-colors"
                  onClick={() => router.push("/")}
                >
                  Wraptron
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleSidebar}
                  className="h-8 w-8 p-0"
                  aria-label="Collapse sidebar"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Menu Items - Scrollable */}
        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <React.Fragment key={item.id}>
                {renderMenuItem(item)}
              </React.Fragment>
            ))}
          </ul>
        </nav>

        <div
          className={cn(
            "border-t border-sidebar-border flex-shrink-0",
            isCollapsed ? "py-2 px-0" : "py-2 px-2",
          )}
        >
          <div
            className={cn(
              "flex gap-0.5",
              isCollapsed
                ? "flex-col items-center"
                : "flex-row items-center justify-center",
            )}
          >
            {isClientPortalUser ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-9 w-9 text-sidebar-foreground",
                      pathname?.startsWith(PORTAL_RESOURCES_HREF) &&
                        "bg-sidebar-accent text-sidebar-accent-foreground",
                    )}
                    aria-label="Resources"
                    onClick={() => router.push(PORTAL_RESOURCES_HREF)}
                  >
                    <BookOpen className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={8}>
                  Resources
                </TooltipContent>
              </Tooltip>
            ) : null}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-sidebar-foreground"
                  aria-label="About the app"
                  onClick={() => setAboutOpen(true)}
                >
                  <Info className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>
                About the app
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-sidebar-foreground"
                  asChild
                >
                  <a href={FEEDBACK_MAILTO} aria-label="Submit feedback">
                    <Bug className="h-4 w-4" />
                  </a>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>
                Submit feedback
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        <Dialog open={aboutOpen} onOpenChange={setAboutOpen}>
          <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>About Wraptron</DialogTitle>
              <DialogDescription className="text-pretty">
                Wraptron helps you run day-to-day business operations—sales,
                projects, products, workspace, and accounts—in one place.
              </DialogDescription>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              {aboutNotesLoading && !aboutVersion
                ? "Loading version…"
                : aboutVersion
                  ? `Version ${aboutVersion}`
                  : "Version —"}
            </p>
            <div className="mt-4 border-t border-border pt-4">
              <h3 className="text-sm font-semibold text-foreground mb-2">
                Latest changes
              </h3>
              {aboutNotesLoading && aboutEntries.length === 0 ? (
                <p className="text-sm text-muted-foreground">Loading notes…</p>
              ) : aboutEntries.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No change notes available.
                </p>
              ) : (
                <ul className="space-y-4">
                  {aboutEntries.map((entry, ei) => (
                    <li key={`${entry.heading}-${ei}`}>
                      <p className="text-xs font-medium text-foreground">
                        {entry.heading}
                      </p>
                      {entry.items.length > 0 ? (
                        <ul className="mt-1.5 list-disc space-y-1 pl-4 text-sm text-muted-foreground">
                          {entry.items.map((item, ii) => (
                            <li key={`${ei}-${ii}`}>{item}</li>
                          ))}
                        </ul>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
