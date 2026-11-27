"use client";

import React, { useState } from "react";
import Link from "next/link";
import { BookOpen, Bug, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";
import { useModuleNav } from "@/hooks/use-module-nav";
import type { MenuItem } from "@/lib/module-nav";
import { PORTAL_RESOURCES_HREF } from "@/lib/portal-nav";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

const FEEDBACK_MAILTO = `mailto:dev@wraptron.com?subject=${encodeURIComponent("Wraptron feedback")}`;

export default function BottomNav() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const {
    moduleLabel,
    menuItems,
    mobileBarItems,
    activeItemId,
    isClientPortalUser,
  } = useModuleNav();

  const leftItems = mobileBarItems.slice(0, 2);
  const rightItems = mobileBarItems.slice(2, 4);

  const renderTab = (item: MenuItem | undefined, slotKey: string) => {
    if (!item) {
      return <div key={slotKey} aria-hidden="true" />;
    }
    const Icon = item.icon;
    const isActive = activeItemId === item.id;

    return (
      <Link
        key={item.id}
        href={item.href}
        aria-current={isActive ? "page" : undefined}
        className={cn(
          "flex h-full min-w-0 flex-col items-center justify-center gap-0.5 rounded-md px-1 py-1 text-center",
          "transition-colors motion-reduce:transition-none",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          isActive
            ? "text-primary-foreground dark:text-secondary-foreground"
            : "text-primary-foreground/60 hover:text-primary-foreground/90 dark:text-secondary-foreground/60 dark:hover:text-secondary-foreground/90",
        )}
      >
        <Icon
          className={cn(
            "h-[18px] w-[18px] shrink-0",
            isActive ? "fill-current/25 stroke-[2.25]" : "stroke-[1.75]",
          )}
          aria-hidden="true"
        />
        <span className="w-full truncate text-xs leading-none font-medium">
          {item.label}
        </span>
      </Link>
    );
  };

  const renderSheetItem = (item: MenuItem, level = 0) => {
    const Icon = item.icon;
    const isActive = activeItemId === item.id;
    const hasChildren = Boolean(item.children?.length);

    return (
      <li key={item.id}>
        <Link
          href={item.href}
          onClick={() => setSheetOpen(false)}
          aria-current={isActive ? "page" : undefined}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors motion-reduce:transition-none",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            level > 0 && "pl-9",
            isActive
              ? "bg-accent text-accent-foreground font-medium"
              : "text-foreground hover:bg-accent/60",
          )}
        >
          <Icon
            className={cn(
              "h-4 w-4 shrink-0",
              isActive ? "text-accent-foreground" : "text-muted-foreground",
            )}
            aria-hidden="true"
          />
          <span className="truncate">{item.label}</span>
        </Link>
        {hasChildren ? (
          <ul className="mt-1 space-y-1">
            {item.children!.map((child) => renderSheetItem(child, level + 1))}
          </ul>
        ) : null}
      </li>
    );
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 pointer-events-none md:hidden print:hidden">
      <nav aria-label="Primary" className="relative pointer-events-none">
        <div className="drop-shadow-[0_-4px_12px_rgb(0_0_0/0.12)] dark:drop-shadow-[0_-4px_14px_rgb(0_0_0/0.35)]">
          <div
            className={cn(
              "bottom-nav-mask pointer-events-auto",
              "bg-primary text-primary-foreground dark:bg-secondary dark:text-secondary-foreground",
              "pb-[env(safe-area-inset-bottom,0px)]",
            )}
          >
            <div className="grid h-[var(--bottom-nav-height)] grid-cols-5 items-center px-1">
              {renderTab(leftItems[0], "left-empty-0")}
              {renderTab(leftItems[1], "left-empty-1")}
              <div aria-hidden="true" />
              {renderTab(rightItems[0], "right-empty-0")}
              {renderTab(rightItems[1], "right-empty-1")}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          aria-label="Open module menu"
          aria-expanded={sheetOpen}
          aria-haspopup="dialog"
          className={cn(
            "pointer-events-auto absolute left-1/2 -translate-x-1/2",
            "-top-[calc(var(--bottom-nav-button-size)/2)]",
            "flex h-[var(--bottom-nav-button-size)] w-[var(--bottom-nav-button-size)] items-center justify-center",
            "rounded-full bg-chart-1 text-white shadow-lg dark:bg-sidebar-primary",
            "transition-transform motion-safe:active:scale-95 motion-reduce:transition-none",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          )}
        >
          <LayoutGrid className="h-5 w-5" aria-hidden="true" />
        </button>
      </nav>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          side="bottom"
          className="max-h-[85dvh] gap-0 rounded-t-2xl px-0 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] motion-reduce:animate-none motion-reduce:transition-none"
        >
          <SheetHeader className="border-b border-border px-4 pt-4 pb-3 pr-10">
            <SheetTitle className="text-base">{moduleLabel}</SheetTitle>
            <SheetDescription className="sr-only">
              Navigate within {moduleLabel}.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-4 pt-3">
            <ul className="space-y-1">
              {menuItems.map((item) => renderSheetItem(item))}
            </ul>

            <div className="mt-4 flex items-center gap-2 border-t border-border pt-3">
              {isClientPortalUser ? (
                <Link
                  href={PORTAL_RESOURCES_HREF}
                  onClick={() => setSheetOpen(false)}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground",
                    "transition-colors hover:bg-accent motion-reduce:transition-none",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  )}
                >
                  <BookOpen className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>Resources</span>
                </Link>
              ) : null}
              <a
                href={FEEDBACK_MAILTO}
                onClick={() => setSheetOpen(false)}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground",
                  "transition-colors hover:bg-accent motion-reduce:transition-none",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                )}
              >
                <Bug className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>Submit feedback</span>
              </a>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
