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
  Shield,
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
  ShoppingCart,
  Receipt,
  DollarSign,
  TrendingDown,
  Store,
  BookOpen,
  Book,
  Monitor,
  Sparkles,
  Layers,
  Flag,
  Grid3x3,
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
    href: "/sales",
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
    id: "transactions",
    label: "Finance",
    icon: CreditCard,
    href: "/transactions",
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
    id: "settings",
    label: "Settings",
    icon: Settings,
    href: "/settings",
  },
];

const SALES_MENU_ITEMS: MenuItem[] = [
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
    id: "tasks",
    label: "Tasks",
    icon: CheckSquare,
    href: "/sales/tasks",
  },
];

const PROJECTS_MENU_ITEMS: MenuItem[] = [
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
    id: "employees",
    label: "Employees",
    icon: Users,
    href: "/workspace/employees",
  },
  {
    id: "skills-matrix",
    label: "Skill matrix",
    icon: Grid3x3,
    href: "/workspace/skills",
  },
  {
    id: "attendance",
    label: "Attendance",
    icon: ClipboardCheck,
    href: "/workspace/attendance",
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
  {
    id: "departments",
    label: "Departments",
    icon: Building2,
    href: "/workspace/departments",
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

const FINANCE_MENU_ITEMS: MenuItem[] = [
  {
    id: "crm",
    label: "Receive",
    icon: TrendingUp,
    href: "/finances/receive",
    children: [
      {
        id: "sales-orders",
        label: "Sales Orders",
        icon: ShoppingCart,
        href: "/finances/receive/orders",
      },
      {
        id: "payments-received",
        label: "Payments Received",
        icon: DollarSign,
        href: "/finances/receive/payments-received",
      },
      {
        id: "customers",
        label: "Customers",
        icon: Users,
        href: "/finances/receive/customers",
      },
    ],
  },
  {
    id: "purchases",
    label: "Purchases",
    icon: TrendingDown,
    href: "/finances/purchases",
    children: [
      {
        id: "expenses",
        label: "Expenses",
        icon: Receipt,
        href: "/finances/purchases/expenses",
      },
      {
        id: "purchase-orders",
        label: "Purchase Orders",
        icon: ShoppingCart,
        href: "/finances/purchases/orders",
      },
      {
        id: "payments-sent",
        label: "Payments Sent",
        icon: CreditCard,
        href: "/finances/purchases/payments-sent",
      },
      {
        id: "vendors",
        label: "Vendors",
        icon: Store,
        href: "/finances/purchases/vendors",
      },
    ],
  },
  {
    id: "accounts",
    label: "Accounts",
    icon: BookOpen,
    href: "/finances/accounts",
    children: [
      {
        id: "chart-of-accounts",
        label: "Chart of Accounts",
        icon: BookOpen,
        href: "/finances/accounts/chart-of-accounts",
      },
      {
        id: "journals",
        label: "Journals",
        icon: Book,
        href: "/finances/accounts/journals",
      },
    ],
  },
];

export default function SideNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { isCollapsed, toggleSidebar } = useSidebar();
  const { user } = useAuth();
  const [activeItem, setActiveItem] = useState<string>("");
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const isAdmin = user?.role === "admin";
  const allMenuItems = isAdmin
    ? [...MAIN_MENU_ITEMS, ...ADMIN_MENU_ITEMS]
    : MAIN_MENU_ITEMS;

  // When on /projects, show Projects and Tasks in sidebar
  const isProjectsPage = pathname?.startsWith("/projects");
  // When on /products or /product/..., show Products submenu (catalog + section pages)
  const isProductNavContext =
    pathname === "/product" ||
    pathname?.startsWith("/products") ||
    pathname?.startsWith("/product/");
  // When on /sales, show Sales menu items (Deals, Leads, Companies, Tasks)
  const isSalesPage = pathname?.startsWith("/sales");
  // When on /finances, show only finance menu items
  const isFinancePage = pathname?.startsWith("/finances");
  // When on /workspace, show workspace menu items
  const isWorkspacePage = pathname?.startsWith("/workspace");

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
  } else if (isFinancePage) {
    menuItems = FINANCE_MENU_ITEMS;
  } else if (isWorkspacePage) {
    menuItems = WORKSPACE_MENU_ITEMS;
  } else {
    menuItems = allMenuItems;
  }

  // Determine active item based on pathname
  useEffect(() => {
    if (!pathname) return;

    // For projects page
    if (isProjectsPage) {
      const projectsItem = PROJECTS_MENU_ITEMS.find((item) =>
        pathname.startsWith(item.href),
      );
      if (projectsItem) {
        setActiveItem(projectsItem.id);
        return;
      }
      setActiveItem("projects-list");
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

    // For Sales page, check Sales menu items
    if (isSalesPage) {
      const salesItem = SALES_MENU_ITEMS.find((item) =>
        pathname.startsWith(item.href),
      );
      if (salesItem) {
        setActiveItem(salesItem.id);
        return;
      }
      // If on /sales but no specific sub-route, default to first item
      if (pathname === "/sales") {
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

    // For finance page, check finance menu items and their children
    if (isFinancePage) {
      for (const parentItem of FINANCE_MENU_ITEMS) {
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
      // If on /finances but no specific sub-route, default to first item
      if (pathname === "/finances") {
        const firstItem = FINANCE_MENU_ITEMS[0];
        if (firstItem?.children?.[0]) {
          setActiveItem(firstItem.children[0].id);
          setExpandedItems((prev) => new Set(prev).add(firstItem.id));
        } else if (firstItem) {
          setActiveItem(firstItem.id);
        }
      }
      return;
    }

    const mainItem = menuItems.find((item) => pathname.startsWith(item.href));
    if (mainItem) setActiveItem(mainItem.id);
  }, [
    pathname,
    menuItems,
    isSalesPage,
    isFinancePage,
    isProjectsPage,
    isProductNavContext,
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
            isActive && "bg-blue-50 text-blue-700 hover:bg-blue-100",
            isCollapsed && "justify-center px-0 w-10",
            level > 0 && !isCollapsed && "pl-12",
          )}
          onClick={() => handleItemClick(item.id, item.href, hasChildren)}
        >
          {(level === 0 || isCollapsed) && (
            <Icon
              className={cn(
                "h-5 w-5 flex-shrink-0 relative z-10",
                isActive && "text-blue-700",
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
          "fixed top-0 left-0 bg-white border-r border-gray-200 z-50 h-screen transition-all duration-300 ease-in-out flex flex-col",
          isCollapsed ? "hidden md:flex" : "flex",
          isCollapsed ? "w-16" : "w-full md:w-64",
        )}
      >
        {/* Header: when expanded show title + collapse; when collapsed show logo (web) */}
        <div
          className={cn(
            "border-b border-gray-200 flex-shrink-0",
            isCollapsed ? "px-0 py-3 flex justify-center" : "px-4 py-3",
          )}
        >
          <div className="flex items-center justify-between w-full">
            {isCollapsed ? (
              <button
                type="button"
                onClick={() => router.push("/")}
                className="flex items-center justify-center w-full min-h-[40px] focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gray-400 rounded"
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
                  className="text-xl font-semibold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors"
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
            {isAdmin &&
            !isProjectsPage &&
            !isSalesPage &&
            !isFinancePage &&
            !isProductNavContext && (
              <>
                <li className="pt-4 pb-2">
                  {!isCollapsed && (
                    <div className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Administration
                    </div>
                  )}
                </li>
                {ADMIN_MENU_ITEMS.map((item) => renderMenuItem(item))}
              </>
            )}
          </ul>
        </nav>
      </div>
    </>
  );
}
