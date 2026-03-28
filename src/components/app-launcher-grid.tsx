"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Box,
  Briefcase,
  CreditCard,
  Globe,
  Plus,
  Settings,
  Shield,
  Store,
  Trash2,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import { userAppsApi, type UserApp } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface BuiltinApp {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  href: string;
  color: string;
}

const BUILTIN_APPS: BuiltinApp[] = [
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

function UserFavicon({
  src,
  sizeClass,
  iconClass,
  roundedClass,
}: {
  src: string | null;
  sizeClass: string;
  iconClass: string;
  roundedClass: string;
}) {
  const [broken, setBroken] = useState(!src);
  if (broken || !src) {
    return (
      <div
        className={cn(
          sizeClass,
          roundedClass,
          "bg-slate-100 flex items-center justify-center text-slate-500 border border-slate-200/80",
        )}
      >
        <Globe className={iconClass} />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt=""
      className={cn(
        sizeClass,
        roundedClass,
        "object-contain bg-white border border-slate-200/80 p-1.5 shadow-sm",
      )}
      onError={() => setBroken(true)}
    />
  );
}

export interface AppLauncherGridProps {
  variant: "full" | "compact";
  /** Called after navigating (e.g. close header Apps dropdown). */
  onNavigate?: () => void;
}

export function AppLauncherGrid({ variant, onNavigate }: AppLauncherGridProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const [userApps, setUserApps] = useState<UserApp[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const isCompact = variant === "compact";
  const tileRounded = isCompact ? "rounded-xl" : "rounded-2xl";
  const tileIconWrap = isCompact ? "w-12 h-12" : "w-16 h-16";
  const lucideIconClass = isCompact ? "w-6 h-6" : "w-8 h-8";
  const userFaviconIconClass = isCompact ? "w-6 h-6" : "w-7 h-7";

  const builtinApps = useMemo(
    () =>
      user?.role === "admin"
        ? BUILTIN_APPS
        : BUILTIN_APPS.filter((app) => app.id !== "admin"),
    [user?.role],
  );

  const loadUserApps = useCallback(async () => {
    if (!user) {
      setUserApps([]);
      return;
    }
    try {
      const res = await userAppsApi.list();
      setUserApps(res.data);
    } catch {
      setUserApps([]);
    }
  }, [user]);

  useEffect(() => {
    void loadUserApps();
  }, [loadUserApps]);

  const openAddDialog = () => {
    onNavigate?.();
    setFormError(null);
    setUrlInput("");
    setDialogOpen(true);
  };

  const handleSaveUrl = async () => {
    setFormError(null);
    setSaving(true);
    try {
      await userAppsApi.create({ url: urlInput });
      setDialogOpen(false);
      setUrlInput("");
      await loadUserApps();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Could not add app";
      setFormError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUserApp = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      await userAppsApi.delete(id);
      await loadUserApps();
    } catch {
      /* ignore */
    }
  };

  const gridClass = isCompact
    ? "grid grid-cols-3 gap-2"
    : "grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-8";

  const builtinTilePadding = isCompact ? "p-3 gap-2" : "gap-3";
  const labelClass = isCompact
    ? "text-xs font-medium text-gray-700 text-center line-clamp-2"
    : "text-sm font-medium text-gray-700 group-hover:text-gray-900 text-center line-clamp-2 max-w-[5.5rem]";

  return (
    <>
      <div className={gridClass}>
        {builtinApps.map((app) => {
          const Icon = app.icon;
          const isActive = pathname?.startsWith(app.href);
          return (
            <div
              key={app.id}
              className={cn(
                "group flex flex-col items-center cursor-pointer",
                builtinTilePadding,
                isCompact && "rounded-lg transition-colors hover:bg-gray-100",
                isCompact && isActive && "bg-gray-100",
              )}
              onClick={() => {
                router.push(app.href);
                onNavigate?.();
              }}
            >
              <div
                className={cn(
                  tileIconWrap,
                  tileRounded,
                  "flex items-center justify-center text-white shadow-sm transition-all duration-300",
                  !isCompact && "group-hover:scale-110 group-hover:shadow-xl",
                  app.color,
                )}
              >
                <Icon className={lucideIconClass} />
              </div>
              <span className={labelClass}>{app.name}</span>
            </div>
          );
        })}

        {user &&
          userApps.map((app) => (
            <div
              key={`u-${app.id}`}
              className={cn(
                "group relative flex flex-col items-center cursor-pointer",
                builtinTilePadding,
                isCompact && "rounded-lg transition-colors hover:bg-gray-100",
              )}
              onClick={() => {
                window.open(app.url, "_blank", "noopener,noreferrer");
                onNavigate?.();
              }}
            >
              <button
                type="button"
                className="absolute -top-0.5 -right-0.5 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-white/95 text-gray-500 shadow-sm opacity-0 transition-opacity hover:text-red-600 group-hover:opacity-100"
                aria-label={`Remove ${app.title}`}
                onClick={(e) => void handleDeleteUserApp(e, app.id)}
              >
                <Trash2 className="h-3 w-3" />
              </button>
              <UserFavicon
                src={app.icon_url}
                sizeClass={tileIconWrap}
                roundedClass={tileRounded}
                iconClass={userFaviconIconClass}
              />
              <span className={labelClass} title={app.title}>
                {app.title}
              </span>
            </div>
          ))}

        {user && (
          <div
            className={cn(
              "group flex flex-col items-center cursor-pointer",
              builtinTilePadding,
              isCompact && "rounded-lg transition-colors hover:bg-gray-100",
            )}
            onClick={openAddDialog}
          >
            <div
              className={cn(
                tileIconWrap,
                tileRounded,
                "flex items-center justify-center border-2 border-dashed border-gray-300 bg-gray-50 text-gray-500 transition-all",
                "group-hover:border-gray-400 group-hover:bg-gray-100 group-hover:text-gray-700",
              )}
            >
              <Plus className={lucideIconClass} />
            </div>
            <span className={labelClass}>Add link</span>
          </div>
        )}
      </div>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setFormError(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add app shortcut</DialogTitle>
            <DialogDescription>
              We will fetch the page title and favicon from the URL you enter.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 py-2">
            <Label htmlFor="user-app-url">URL</Label>
            <Input
              id="user-app-url"
              type="url"
              placeholder="https://example.com"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void handleSaveUrl();
              }}
            />
            {formError && (
              <p className="text-sm text-red-600" role="alert">
                {formError}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={saving || !urlInput.trim()}
              onClick={() => void handleSaveUrl()}
            >
              {saving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
