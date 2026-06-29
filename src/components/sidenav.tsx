"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import {
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Box,
  Headset,
  ChartPie,
  Users,
  ClipboardCheck,
  Building2,
  Briefcase,
  TrendingUp,
  Settings,
  AlignHorizontalJustifyStart,
  User,
  CheckSquare,
  FileText,
  FileSpreadsheet,
  Receipt,
  BookOpen,
  Book,
  Store,
  ClipboardList,
  Monitor,
  Sparkles,
  Layers,
  Flag,
  Grid3x3,
  Info,
  Bug,
  Activity,
  type LucideIcon,
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
import { useAuth } from "@/contexts/auth-context";
import { filterByStaffAccess } from "@/lib/nav-access";

interface MenuItem {
  id: string;
  label: string;
  icon: LucideIcon;
  href: string;
  children?: MenuItem[];
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
    label: "Sales",
    icon: TrendingUp,
    href: "/sales/dashboard",
  },
  {
    id: "projects",
    label: "Projects",
    icon: Box,
    href: "/projects",
  },
  {
    id: "products",
    label: "Products",
    icon: Store,
    href: "/products",
  },
  {
    id: "hiring", // Keeping this as is, maybe redundant with workspace but user didn't ask to remove
    label: "Hiring",
    icon: Users,
    href: "/hiring",
  },
  {
    id: "accounts",
    label: "Accounts",
    icon: CreditCard,
    href: "/accounts",
  },
  {
    id: "invoices",
    label: "Invoices",
    icon: Receipt,
    href: "/invoices",
  },
  {
    id: "workspace",
    label: "Workspace",
    icon: Briefcase,
    href: "/workspace",
  },
  {
    id: "human-resource",
    label: "Human resources",
    icon: Users,
    href: "/hr/dashboard",
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    href: "/settings",
  },
];

const SALES_MENU_ITEMS: MenuItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: ChartPie,
    href: "/sales/dashboard",
  },
  {
    id: "deals",
    label: "Deals",
    icon: AlignHorizontalJustifyStart,
    href: "/sales/deals",
  },
  {
    id: "contacts",
    label: "Contacts",
    icon: Users,
    href: "/sales/contacts",
  },
  {
    id: "companies",
    label: "Companies",
    icon: Building2,
    href: "/sales/companies",
  },
  {
    id: "customer-onboarding",
    label: "KYC",
    icon: ClipboardList,
    href: "/sales/customers",
  },
  {
    id: "tasks",
    label: "Tasks",
    icon: CheckSquare,
    href: "/sales/tasks",
  },
  {
    id: "activities",
    label: "Activities",
    icon: Activity,
    href: "/sales/activities",
  },
];

const PROJECTS_MENU_ITEMS: MenuItem[] = [
  {
    id: "projects-dashboard",
    label: "Dashboard",
    icon: ChartPie,
    href: "/projects/dashboard",
  },
  {
    id: "projects-list",
    label: "Projects",
    icon: Box,
    href: "/projects",
  },
  {
    id: "projects-tasks",
    label: "Tasks",
    icon: CheckSquare,
    href: "/projects/tasks",
  },
];

const PRODUCTS_MENU_ITEMS: MenuItem[] = [
  {
    id: "products-list",
    label: "Products",
    icon: Store,
    href: "/products",
  },
];

/** Standalone pages under `/product/...` */
const PRODUCT_PAGE_SECTION_ITEMS_TEMPLATE: Omit<MenuItem, "href">[] = [
  { id: "product-interface", label: "Interface", icon: Monitor },
  { id: "product-features", label: "Features", icon: Sparkles },
  { id: "product-tech-stack", label: "Tech Stack", icon: Layers },
  { id: "product-milestone", label: "Milestone", icon: Flag },
];

const PRODUCT_SECTION_HREF: Record<string, string> = {
  "product-interface": "/product/interfaces",
  "product-features": "/product/features",
  "product-tech-stack": "/product/tech-stack",
  "product-milestone": "/product/milestone",
};

const WORKSPACE_MENU_ITEMS: MenuItem[] = [
  {
    id: "workspace-dashboard",
    label: "Dashboard",
    icon: ChartPie,
    href: "/workspace/dashboard",
  },
  {
    id: "attendance",
    label: "Attendance",
    icon: ClipboardCheck,
    href: "/workspace/attendance",
  },
  {
    id: "workspace-tasks",
    label: "Tasks",
    icon: CheckSquare,
    href: "/workspace/tasks",
  },
  {
    id: "timesheet",
    label: "Timesheet",
    icon: FileSpreadsheet,
    href: "/workspace/timesheet",
  },
  {
    id: "payslips",
    label: "Payslips",
    icon: FileText,
    href: "/workspace/payslips",
  },
];

const HUMAN_RESOURCE_MENU_ITEMS: MenuItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: ChartPie,
    href: "/hr/dashboard",
  },
  {
    id: "employees",
    label: "Employees",
    icon: Users,
    href: "/hr/employees",
  },
  {
    id: "skills-matrix",
    label: "Skill matrix",
    icon: Grid3x3,
    href: "/hr/skills",
  },
];

const SETTINGS_MENU_ITEMS: MenuItem[] = [
  {
    id: "settings-general",
    label: "General",
    icon: Settings,
    href: "/settings?section=general",
  },
  {
    id: "settings-display-preferences",
    label: "Display Preferences",
    icon: Monitor,
    href: "/settings?section=display-preferences",
  },
  {
    id: "settings-user-management",
    label: "User Management",
    icon: Users,
    href: "/settings?section=user-management",
  },
  {
    id: "settings-integrations",
    label: "Integrations",
    icon: Briefcase,
    href: "/settings?section=integrations",
  },
  {
    id: "settings-apps",
    label: "Apps",
    icon: Store,
    href: "/settings?section=apps",
  },
  {
    id: "settings-notifications",
    label: "Notifications",
    icon: Activity,
    href: "/settings?section=notifications",
  },
];

const ACCOUNTS_MENU_ITEMS: MenuItem[] = [
  {
    id: "accounts-dashboard",
    label: "Dashboard",
    icon: ChartPie,
    href: "/accounts/dashboard",
  },
  {
    id: "sales-invoices",
    label: "Sales Invoices",
    icon: FileText,
    href: "/accounts/invoices",
  },
  {
    id: "expense-bills",
    label: "Expense Bills",
    icon: Receipt,
    href: "/accounts/bills",
  },
  {
    id: "chart-of-accounts",
    label: "Chart of Accounts",
    icon: BookOpen,
    href: "/accounts/chart-of-accounts",
  },
  {
    id: "journals",
    label: "Journals",
    icon: Book,
    href: "/accounts/journals",
  },
];

const FEEDBACK_MAILTO = `mailto:dev@wraptron.com?subject=${encodeURIComponent("Wraptron feedback")}`;

export default function SideNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
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

  const allMenuItems = useMemo(
    () => filterByStaffAccess(MAIN_MENU_ITEMS, user?.role),
    [user?.role],
  );

  // When on /projects, show Projects and Tasks in sidebar
  const isProjectsPage = pathname?.startsWith("/projects");
  // When on /products or /product/..., show Products submenu (catalog + section pages)
  const isProductNavContext =
    pathname === "/product" ||
    pathname?.startsWith("/products") ||
    pathname?.startsWith("/product/");
  // When on /sales or customer onboarding, show Sales submenu (includes onboarding form link)
  const isSalesPage =
    pathname?.startsWith("/sales") ||
    pathname?.startsWith("/customer-onboarding");
  // When on /accounts, show only accounts menu items
  const isAccountsPage = pathname?.startsWith("/accounts");
  /** Employee CRUD under `/hr/employees`; `/workspace/employees/*` redirects here for old links. */
  const isEmployeeManagementSection =
    pathname?.startsWith("/hr") || pathname?.startsWith("/workspace/employees");
  // When on /workspace (except employee pages), show workspace menu items
  const isWorkspacePage =
    pathname?.startsWith("/workspace") && !isEmployeeManagementSection;
  const isSettingsPage = pathname?.startsWith("/settings");
  // When on /hr only — used for layout tweaks (e.g. admin block), not employee pages
  const isHumanResourcePage = pathname?.startsWith("/hr");

  const productsMenuItems = useMemo((): MenuItem[] => {
    return [
      ...PRODUCTS_MENU_ITEMS,
      ...PRODUCT_PAGE_SECTION_ITEMS_TEMPLATE.map((item) => ({
        ...item,
        href: PRODUCT_SECTION_HREF[item.id],
      })),
    ];
  }, []);

  let menuItems: MenuItem[];
  if (isProjectsPage) {
    menuItems = PROJECTS_MENU_ITEMS;
  } else if (isProductNavContext) {
    menuItems = productsMenuItems;
  } else if (isSalesPage) {
    menuItems = SALES_MENU_ITEMS;
  } else if (isAccountsPage) {
    menuItems = ACCOUNTS_MENU_ITEMS;
  } else if (isEmployeeManagementSection) {
    menuItems = HUMAN_RESOURCE_MENU_ITEMS;
  } else if (isWorkspacePage) {
    menuItems = WORKSPACE_MENU_ITEMS;
  } else if (isSettingsPage) {
    menuItems = SETTINGS_MENU_ITEMS;
  } else {
    menuItems = allMenuItems;
  }

  // Determine active item based on pathname
  useEffect(() => {
    if (!pathname) return;

    // For projects page
    if (isProjectsPage) {
      const projectsItem = [...PROJECTS_MENU_ITEMS]
        .sort((a, b) => b.href.length - a.href.length)
        .find((item) => pathname.startsWith(item.href));
      if (projectsItem) {
        setActiveItem(projectsItem.id);
        return;
      }
      setActiveItem("projects-dashboard");
      return;
    }

    // Products catalog + /product/{interfaces|features|tech-stack|milestone}
    if (isProductNavContext) {
      const pathToSection: Record<string, string> = {
        "/product/interfaces": "product-interface",
        "/product/features": "product-features",
        "/product/tech-stack": "product-tech-stack",
        "/product/milestone": "product-milestone",
      };
      if (pathname && pathToSection[pathname]) {
        setActiveItem(pathToSection[pathname]);
        return;
      }
      setActiveItem("products-list");
      return;
    }

    // For Sales page, check Sales menu items (longest href first so /sales/deals beats /sales)
    if (isSalesPage) {
      const salesItem = [...SALES_MENU_ITEMS]
        .sort((a, b) => b.href.length - a.href.length)
        .find((item) => pathname.startsWith(item.href));
      if (salesItem) {
        setActiveItem(salesItem.id);
        return;
      }
      // If on /sales but no specific sub-route, default to dashboard
      if (pathname === "/sales" || pathname === "/sales/dashboard") {
        setActiveItem(SALES_MENU_ITEMS[0]?.id || "");
      }
      return;
    }

    // For workspace page
    if (isWorkspacePage) {
      const workspaceItem = WORKSPACE_MENU_ITEMS.find((item) =>
        pathname.startsWith(item.href),
      );
      if (workspaceItem) {
        setActiveItem(workspaceItem.id);
        return;
      }
      if (pathname === "/workspace") {
        setActiveItem(WORKSPACE_MENU_ITEMS[0]?.id || "");
      }
      return;
    }

    // For human resources / employee management (/hr/* or legacy /workspace/employees/*)
    if (isEmployeeManagementSection) {
      const hrItem = HUMAN_RESOURCE_MENU_ITEMS.find((item) =>
        pathname.startsWith(item.href),
      );
      if (hrItem) {
        setActiveItem(hrItem.id);
        return;
      }
      if (pathname === "/hr" || pathname?.startsWith("/hr/")) {
        setActiveItem(HUMAN_RESOURCE_MENU_ITEMS[0]?.id || "");
      }
      return;
    }

    // For accounts page, check accounts menu items and their children
    if (isAccountsPage) {
      for (const parentItem of ACCOUNTS_MENU_ITEMS) {
        // Check if pathname matches parent
        if (pathname.startsWith(parentItem.href)) {
          // Check children
          if (parentItem.children) {
            const childItem = parentItem.children.find((child) =>
              pathname.startsWith(child.href),
            );
            if (childItem) {
              setActiveItem(childItem.id);
              // Ensure parent is expanded
              setExpandedItems((prev) => new Set(prev).add(parentItem.id));
              return;
            }
          }
          // If on parent but no specific child, set parent as active
          setActiveItem(parentItem.id);
          return;
        }
        // Check children directly
        if (parentItem.children) {
          const childItem = parentItem.children.find((child) =>
            pathname.startsWith(child.href),
          );
          if (childItem) {
            setActiveItem(childItem.id);
            // Ensure parent is expanded
            setExpandedItems((prev) => new Set(prev).add(parentItem.id));
            return;
          }
        }
      }
      // If on /accounts but no specific sub-route, default to dashboard
      if (pathname === "/accounts") {
        setActiveItem(ACCOUNTS_MENU_ITEMS[0]?.id || "");
      }
      return;
    }

    if (isSettingsPage) {
      setActiveItem((prev) => prev || SETTINGS_MENU_ITEMS[0]?.id || "");
      return;
    }

    const mainItem = menuItems.find((item) => pathname.startsWith(item.href));
    if (mainItem) setActiveItem(mainItem.id);
  }, [
    pathname,
    menuItems,
    isSalesPage,
    isAccountsPage,
    isProjectsPage,
    isProductNavContext,
    isHumanResourcePage,
    isEmployeeManagementSection,
    isWorkspacePage,
    isSettingsPage,
  ]);

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
      {/* Backdrop on mobile when sidebar is open */}
      {!isCollapsed && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={toggleSidebar}
          aria-hidden
        />
      )}
      <div
        className={cn(
          "fixed top-0 left-0 bg-sidebar text-sidebar-foreground border-r border-sidebar-border z-50 h-screen transition-all duration-300 ease-in-out flex flex-col",
          isCollapsed ? "hidden md:flex" : "flex",
          isCollapsed ? "w-16" : "w-full md:w-64",
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
            {menuItems.map((item) => renderMenuItem(item))}
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
