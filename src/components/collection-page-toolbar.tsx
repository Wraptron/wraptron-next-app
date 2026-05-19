"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Columns3, ChevronDown, LayoutGrid, Menu, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export type CollectionViewMode = "list" | "card" | "kanban";

const VIEW_MODES: CollectionViewMode[] = ["list", "card", "kanban"];

export function isCollectionViewMode(value: string): value is CollectionViewMode {
  return VIEW_MODES.includes(value as CollectionViewMode);
}

export function useCollectionViewMode(
  storageKey: string,
  defaultMode: CollectionViewMode = "list",
) {
  const [viewMode, setViewMode] = React.useState<CollectionViewMode>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(storageKey);
      if (saved && isCollectionViewMode(saved)) {
        return saved;
      }
    }
    return defaultMode;
  });

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(storageKey, viewMode);
    }
  }, [storageKey, viewMode]);

  return [viewMode, setViewMode] as const;
}

export type CollectionNewMenuItem = {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
};

export type CollectionNewAction = {
  label: string;
  onClick?: () => void;
  href?: string;
  ariaLabel?: string;
  menuItems?: CollectionNewMenuItem[];
};

export type CollectionPageToolbarProps = {
  viewMode: CollectionViewMode;
  onViewModeChange: (mode: CollectionViewMode) => void;
  newAction?: CollectionNewAction;
  children?: React.ReactNode;
  className?: string;
  showViewSwitcher?: boolean;
};

function CollectionNewButton({ action }: { action: CollectionNewAction }) {
  const label = action.label;
  const ariaLabel = action.ariaLabel ?? label;
  const hasMenu = (action.menuItems?.length ?? 0) > 0;

  const primaryButton = action.href ? (
    <Button
      variant="outline"
      size="sm"
      className={cn(hasMenu && "rounded-r-none px-2.5 md:px-3")}
      asChild
    >
      <Link href={action.href} aria-label={ariaLabel}>
        <Plus className="h-4 w-4 md:mr-1" />
        <span className="hidden md:inline">{label}</span>
      </Link>
    </Button>
  ) : (
    <Button
      variant="outline"
      size="sm"
      onClick={action.onClick}
      className={cn(hasMenu && "rounded-r-none px-2.5 md:px-3")}
      aria-label={ariaLabel}
    >
      <Plus className="h-4 w-4 md:mr-1" />
      <span className="hidden md:inline">{label}</span>
    </Button>
  );

  if (!hasMenu) {
    return primaryButton;
  }

  return (
    <div className="inline-flex">
      {primaryButton}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="rounded-l-none border-l-0 p-1"
            aria-label={`More ${label.toLowerCase()} actions`}
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {action.menuItems?.map((item) => (
            <DropdownMenuItem key={item.label} onClick={item.onClick}>
              {item.icon ? (
                <span className="mr-2 inline-flex [&_svg]:size-4">{item.icon}</span>
              ) : null}
              {item.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function CollectionPageToolbar({
  viewMode,
  onViewModeChange,
  newAction,
  children,
  className,
  showViewSwitcher = true,
}: CollectionPageToolbarProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 justify-end",
        className,
      )}
    >
      {children}
      {showViewSwitcher && (
        <ButtonGroup orientation="horizontal" className="hidden sm:flex">
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => onViewModeChange("list")}
            aria-label="List view"
          >
            <Menu className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "card" ? "default" : "outline"}
            size="sm"
            onClick={() => onViewModeChange("card")}
            aria-label="Card view"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "kanban" ? "default" : "outline"}
            size="sm"
            onClick={() => onViewModeChange("kanban")}
            aria-label="Kanban view"
          >
            <Columns3 className="h-4 w-4" />
          </Button>
        </ButtonGroup>
      )}
      {newAction && <CollectionNewButton action={newAction} />}
    </div>
  );
}
