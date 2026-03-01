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
  ClipboardCheck,
  Building2,
  Briefcase,
  TrendingUp,
  Settings,
  AlignHorizontalJustifyStart,
  User,
  CheckSquare,
  FileText,
  ShoppingCart,
  Receipt,
  DollarSign,
  TrendingDown,
  Store,
  BookOpen,
  Book,
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
    label: "CRM",
    icon: Users,
    href: "/crm",
  },
  {
    id: "projects",
    label: "Projects",
    icon: Box,
    href: "/ppm/projects",
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

const CRM_MENU_ITEMS: MenuItem[] = [
  {
    id: "deals",
    label: "Deals",
    icon: AlignHorizontalJustifyStart,
    href: "/crm/deals",
  },
  {
    id: "contacts",
    label: "Contacts",
    icon: User,
    href: "/crm/contacts",
  },
  {
    id: "companies",
    label: "Companies",
    icon: Building2,
    href: "/crm/companies",
  },
  {
    id: "tasks",
    label: "Tasks",
    icon: CheckSquare,
    href: "/crm/tasks",
  },
];

const WORKSPACE_MENU_ITEMS: MenuItem[] = [
  {
    id: "employees",
    label: "Employees",
    icon: Users,
    href: "/workspace/employees",
  },
  {
    id: "attendance",
    label: "Attendance",
    icon: ClipboardCheck,
    href: "/workspace/attendance",
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

  // When on /ppm, show only projects in sidebar
  const isProjectsPage = pathname?.startsWith("/ppm");
  // When on /crm, show only CRM menu items (Deals, Contacts, Companies, Tasks)
  const isCrmPage = pathname?.startsWith("/crm");
  // When on /finances, show only finance menu items
  const isFinancePage = pathname?.startsWith("/finances");
  // When on /workspace, show workspace menu items
  const isWorkspacePage = pathname?.startsWith("/workspace");

  let menuItems: MenuItem[];
  if (isProjectsPage) {
    menuItems = MAIN_MENU_ITEMS.filter((item) => item.id === "projects");
  } else if (isCrmPage) {
    menuItems = CRM_MENU_ITEMS;
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

    // For CRM page, check CRM menu items first
    if (isCrmPage) {
      const crmItem = CRM_MENU_ITEMS.find((item) =>
        pathname.startsWith(item.href),
      );
      if (crmItem) {
        setActiveItem(crmItem.id);
        return;
      }
      // If on /crm but no specific sub-route, default to first item
      if (pathname === "/crm") {
        setActiveItem(CRM_MENU_ITEMS[0]?.id || "");
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
  }, [pathname, menuItems, isCrmPage, isFinancePage]);

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
    <div
      className={cn(
        "fixed top-0 left-0 bg-white border-r border-gray-200 z-50 h-screen transition-all duration-300 ease-in-out flex flex-col",
        "hidden md:flex",
        isCollapsed ? "w-16" : "w-64",
      )}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <h2
              className="text-xl font-semibold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors"
              onClick={() => router.push("/")}
            >
              Wraptron
            </h2>
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
          {menuItems.map((item) => renderMenuItem(item))}
          {isAdmin &&
            !isProjectsPage &&
            !isCrmPage &&
            !isFinancePage && (
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
  );
}
