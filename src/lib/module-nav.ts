import {
  Activity,
  AlignHorizontalJustifyStart,
  BellRing,
  Book,
  BookOpen,
  Box,
  Briefcase,
  Building2,
  Calendar,
  ChartPie,
  CheckSquare,
  ClipboardCheck,
  ClipboardList,
  CreditCard,
  FileSpreadsheet,
  FileText,
  Globe,
  Grid3x3,
  Hash,
  Monitor,
  Receipt,
  Settings,
  Store,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";
import {
  canAccessInternalNav,
  canAccessMenuItem,
  canAccessPath,
  filterByNavAccess,
  type NavAccess,
} from "@/lib/nav-access";
import { CLIENT_PORTAL_MENU_ITEMS } from "@/lib/portal-nav";

export interface MenuItem {
  id: string;
  label: string;
  icon: LucideIcon;
  href: string;
  mobilePriority?: number;
  children?: MenuItem[];
}

export type ModuleKey =
  | "main"
  | "portal"
  | "projects"
  | "products"
  | "sales"
  | "accounts"
  | "hr"
  | "workspace"
  | "settings"
  | "domain";

export interface ModuleSwitcherItem {
  key: ModuleKey;
  menuId: string;
  label: string;
  icon: LucideIcon;
  href: string;
}

export const MAIN_MENU_ITEMS: MenuItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: ChartPie,
    href: "/dashboard",
    mobilePriority: 1,
  },
  {
    id: "customers",
    label: "Sales",
    icon: TrendingUp,
    href: "/sales/dashboard",
    mobilePriority: 2,
  },
  {
    id: "projects",
    label: "Projects",
    icon: Box,
    href: "/projects",
    mobilePriority: 3,
  },
  {
    id: "tasks",
    label: "Tasks",
    icon: CheckSquare,
    href: "/tasks",
  },
  {
    id: "products",
    label: "Products",
    icon: Store,
    href: "/products",
  },
  {
    id: "hiring",
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
    mobilePriority: 4,
  },
  {
    id: "human-resource",
    label: "Human resources",
    icon: Users,
    href: "/hr/dashboard",
  },
  {
    id: "domain",
    label: "Domain",
    icon: Globe,
    href: "/domain",
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    href: "/settings",
  },
];

export const DOMAIN_MENU_ITEMS: MenuItem[] = [
  {
    id: "domain",
    label: "Domain",
    icon: Globe,
    href: "/domain",
  },
];

export const SALES_MENU_ITEMS: MenuItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: ChartPie,
    href: "/sales/dashboard",
    mobilePriority: 1,
  },
  {
    id: "deals",
    label: "Deals",
    icon: AlignHorizontalJustifyStart,
    href: "/sales/deals",
    mobilePriority: 2,
  },
  {
    id: "quotes",
    label: "Quotes",
    icon: FileText,
    href: "/sales/quotes",
    mobilePriority: 3,
  },
  {
    id: "contacts",
    label: "Contacts",
    icon: Users,
    href: "/sales/contacts",
    mobilePriority: 4,
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

export const PROJECTS_MENU_ITEMS: MenuItem[] = [
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
    href: "/tasks",
  },
];

export const PRODUCTS_MENU_ITEMS: MenuItem[] = [
  {
    id: "products-list",
    label: "Products",
    icon: Store,
    href: "/products",
  },
];

export const WORKSPACE_MENU_ITEMS: MenuItem[] = [
  {
    id: "workspace-dashboard",
    label: "Dashboard",
    icon: ChartPie,
    href: "/workspace/dashboard",
    mobilePriority: 1,
  },
  {
    id: "attendance",
    label: "Attendance",
    icon: ClipboardCheck,
    href: "/workspace/attendance",
    mobilePriority: 2,
  },
  {
    id: "workspace-calendar",
    label: "Calendar",
    icon: Calendar,
    href: "/workspace/calendar",
  },
  {
    id: "workspace-tasks",
    label: "Tasks",
    icon: CheckSquare,
    href: "/workspace/tasks",
    mobilePriority: 3,
  },
  {
    id: "timesheet",
    label: "Timesheet",
    icon: FileSpreadsheet,
    href: "/workspace/timesheet",
    mobilePriority: 4,
  },
  // {
  //   id: "payslips",
  //   label: "Payslips",
  //   icon: FileText,
  //   href: "/workspace/payslips",
  // },
];

export const HUMAN_RESOURCE_MENU_ITEMS: MenuItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: ChartPie,
    href: "/hr/dashboard",
    mobilePriority: 1,
  },
  {
    id: "employees",
    label: "Employees",
    icon: Users,
    href: "/hr/employees",
    mobilePriority: 2,
  },
  {
    id: "metrics-report",
    label: "Performance matrix",
    icon: FileSpreadsheet,
    href: "/hr/metrics",
  },
  {
    id: "calendar-holidays",
    label: "Calendar & holidays",
    icon: Calendar,
    href: "/hr/calendar",
    mobilePriority: 5,
  },
  {
    id: "leave-reports",
    label: "Leave reports",
    icon: FileText,
    href: "/hr/leave-reports",
    mobilePriority: 4,
  },
  {
    id: "attendance-reminders",
    label: "Attendance & reminders",
    icon: BellRing,
    href: "/hr/attendance",
    mobilePriority: 3,
  },
  {
    id: "skills-matrix",
    label: "Skill matrix",
    icon: Grid3x3,
    href: "/hr/skills",
  },
];

export const SETTINGS_MENU_ITEMS: MenuItem[] = [
  {
    id: "settings-organisation",
    label: "Organisation",
    icon: Building2,
    href: "/settings?section=organisation",
    mobilePriority: 2,
  },
  {
    id: "settings-general",
    label: "General",
    icon: Settings,
    href: "/settings?section=general",
    mobilePriority: 1,
  },
  {
    id: "settings-display-preferences",
    label: "Display Preferences",
    icon: Monitor,
    href: "/settings?section=display-preferences",
    mobilePriority: 3,
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
    mobilePriority: 4,
  },
];

export const CLIENT_SETTINGS_MENU_ITEMS: MenuItem[] = [
  {
    id: "settings-organisation",
    label: "Organisation",
    icon: Building2,
    href: "/settings?section=organisation",
    mobilePriority: 2,
  },
  {
    id: "settings-general",
    label: "General",
    icon: Settings,
    href: "/settings?section=general",
    mobilePriority: 1,
  },
  {
    id: "settings-display-preferences",
    label: "Display Preferences",
    icon: Monitor,
    href: "/settings?section=display-preferences",
    mobilePriority: 3,
  },
  {
    id: "settings-notifications",
    label: "Notifications",
    icon: Activity,
    href: "/settings?section=notifications",
    mobilePriority: 4,
  },
];

export const ORG_TEAM_SETTINGS_ITEM: MenuItem = {
  id: "settings-organization-team",
  label: "Organization",
  icon: Users,
  href: "/settings/organization",
};

/** Compact module switcher items shown in the mobile menu sheet. */
export const MODULE_SWITCHER_ITEMS: ModuleSwitcherItem[] = [
  {
    key: "main",
    menuId: "dashboard",
    label: "Dashboard",
    icon: ChartPie,
    href: "/dashboard",
  },
  {
    key: "projects",
    menuId: "projects",
    label: "Projects",
    icon: Box,
    href: "/projects",
  },
  {
    key: "projects",
    menuId: "tasks",
    label: "Tasks",
    icon: CheckSquare,
    href: "/tasks",
  },
  {
    key: "workspace",
    menuId: "workspace",
    label: "Workspace",
    icon: Briefcase,
    href: "/workspace",
  },
  {
    key: "sales",
    menuId: "sales",
    label: "Sales",
    icon: TrendingUp,
    href: "/sales/dashboard",
  },
  {
    key: "accounts",
    menuId: "accounts",
    label: "Accounts",
    icon: CreditCard,
    href: "/accounts",
  },
  {
    key: "hr",
    menuId: "human-resource",
    label: "HR",
    icon: Users,
    href: "/hr/dashboard",
  },
  {
    key: "settings",
    menuId: "settings",
    label: "Settings",
    icon: Settings,
    href: "/settings",
  },
];

export const ACCOUNTS_MENU_ITEMS: MenuItem[] = [
  {
    id: "accounts-dashboard",
    label: "Dashboard",
    icon: ChartPie,
    href: "/accounts/dashboard",
    mobilePriority: 1,
  },
  {
    id: "sales-invoices",
    label: "Sales Invoices",
    icon: FileText,
    href: "/accounts/invoices",
    mobilePriority: 2,
  },
  {
    id: "expense-bills",
    label: "Expense Bills",
    icon: Receipt,
    href: "/accounts/bills",
    mobilePriority: 3,
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
    mobilePriority: 4,
  },
  {
    id: "hsn-codes",
    label: "HSN Codes",
    icon: Hash,
    href: "/accounts/hsn-codes",
  },
];

export const MODULE_LABELS: Record<ModuleKey, string> = {
  main: "Menu",
  portal: "Client Portal",
  projects: "Projects",
  products: "Products",
  sales: "Sales",
  accounts: "Accounts",
  hr: "Human Resources",
  workspace: "Workspace",
  settings: "Settings",
  domain: "Domain",
};

export function getSettingsMenuItems(access: NavAccess): MenuItem[] {
  const base = canAccessInternalNav(access)
    ? SETTINGS_MENU_ITEMS
    : CLIENT_SETTINGS_MENU_ITEMS;
  if (access.isOwner) {
    return [ORG_TEAM_SETTINGS_ITEM, ...base];
  }
  return base;
}

export interface ModuleContextFlags {
  moduleKey: ModuleKey;
  moduleLabel: string;
  isProjectsPage: boolean;
  isProductNavContext: boolean;
  isSalesPage: boolean;
  isAccountsPage: boolean;
  isEmployeeManagementSection: boolean;
  isWorkspacePage: boolean;
  isSettingsPage: boolean;
  isDomainPage: boolean;
  isHumanResourcePage: boolean;
}

export function detectModuleContext(
  pathname: string | null | undefined,
  navAccess: NavAccess,
): ModuleContextFlags {
  const isProjectsPage = Boolean(
    pathname?.startsWith("/projects") || pathname?.startsWith("/tasks"),
  );
  const isProductNavContext = Boolean(
    pathname === "/product" || pathname?.startsWith("/products"),
  );
  const isSalesPage = Boolean(
    pathname?.startsWith("/sales") ||
      pathname?.startsWith("/customer-onboarding"),
  );
  const isAccountsPage = Boolean(pathname?.startsWith("/accounts"));
  const isEmployeeManagementSection = Boolean(
    pathname?.startsWith("/hr") || pathname?.startsWith("/workspace/employees"),
  );
  const isWorkspacePage = Boolean(
    pathname?.startsWith("/workspace") && !isEmployeeManagementSection,
  );
  const isSettingsPage = Boolean(pathname?.startsWith("/settings"));
  const isDomainPage = Boolean(pathname?.startsWith("/domain"));
  const isHumanResourcePage = Boolean(pathname?.startsWith("/hr"));

  let moduleKey: ModuleKey;
  if (!canAccessInternalNav(navAccess) && !isSettingsPage) {
    moduleKey = "portal";
  } else if (isProjectsPage) {
    moduleKey = "projects";
  } else if (isProductNavContext) {
    moduleKey = "products";
  } else if (isSalesPage) {
    moduleKey = "sales";
  } else if (isAccountsPage) {
    moduleKey = "accounts";
  } else if (isEmployeeManagementSection) {
    moduleKey = "hr";
  } else if (isWorkspacePage) {
    moduleKey = "workspace";
  } else if (isSettingsPage) {
    moduleKey = "settings";
  } else if (isDomainPage) {
    moduleKey = "domain";
  } else if (!canAccessInternalNav(navAccess)) {
    moduleKey = "portal";
  } else {
    moduleKey = "main";
  }

  return {
    moduleKey,
    moduleLabel: MODULE_LABELS[moduleKey],
    isProjectsPage,
    isProductNavContext,
    isSalesPage,
    isAccountsPage,
    isEmployeeManagementSection,
    isWorkspacePage,
    isSettingsPage,
    isDomainPage,
    isHumanResourcePage,
  };
}

function filterModuleItemsByAccess(
  items: MenuItem[],
  navAccess: NavAccess,
): MenuItem[] {
  const result: MenuItem[] = [];
  for (const item of items) {
    const baseHref = item.href.split("?")[0] ?? item.href;
    if (!canAccessPath(baseHref, navAccess)) {
      continue;
    }
    if (item.children?.length) {
      const filteredChildren = filterModuleItemsByAccess(
        item.children,
        navAccess,
      );
      result.push({ ...item, children: filteredChildren });
    } else {
      result.push(item);
    }
  }
  return result;
}

export function getModuleMenuItems(
  context: ModuleContextFlags,
  navAccess: NavAccess,
  isAdminUser: boolean,
): MenuItem[] {
  if (context.moduleKey === "portal") {
    return CLIENT_PORTAL_MENU_ITEMS;
  }

  if (context.moduleKey === "projects") {
    return filterModuleItemsByAccess(PROJECTS_MENU_ITEMS, navAccess);
  }
  if (context.moduleKey === "products") {
    return filterModuleItemsByAccess(PRODUCTS_MENU_ITEMS, navAccess);
  }
  if (context.moduleKey === "sales") {
    return filterModuleItemsByAccess(SALES_MENU_ITEMS, navAccess);
  }
  if (context.moduleKey === "accounts") {
    return filterModuleItemsByAccess(ACCOUNTS_MENU_ITEMS, navAccess);
  }
  if (context.moduleKey === "hr") {
    const hrBase = isAdminUser
      ? HUMAN_RESOURCE_MENU_ITEMS
      : HUMAN_RESOURCE_MENU_ITEMS.filter((item) => item.id !== "leave-reports");
    return filterModuleItemsByAccess(hrBase, navAccess);
  }
  if (context.moduleKey === "workspace") {
    return filterModuleItemsByAccess(WORKSPACE_MENU_ITEMS, navAccess);
  }
  if (context.moduleKey === "settings") {
    const settingsBase = getSettingsMenuItems(navAccess);
    if (!canAccessInternalNav(navAccess)) {
      return settingsBase;
    }
    return filterModuleItemsByAccess(settingsBase, navAccess);
  }
  if (context.moduleKey === "domain") {
    return filterModuleItemsByAccess(DOMAIN_MENU_ITEMS, navAccess);
  }

  return filterByNavAccess(MAIN_MENU_ITEMS, navAccess);
}

/**
 * Picks up to 4 items for the mobile bottom bar:
 * - If 4 or fewer items exist, returns them all in sidebar order.
 * - If any item defines `mobilePriority`, returns the top 4 sorted by `mobilePriority`
 *   ascending (ties preserve sidebar order).
 * - Otherwise returns the first 4 items in sidebar order.
 */
export function getMobileBarItems(menuItems: MenuItem[]): MenuItem[] {
  if (menuItems.length <= 4) {
    return menuItems;
  }
  const hasPriority = menuItems.some(
    (item) => typeof item.mobilePriority === "number",
  );
  if (!hasPriority) {
    return menuItems.slice(0, 4);
  }
  return menuItems
    .map((item, index) => ({ item, index }))
    .sort((a, b) => {
      const pa = a.item.mobilePriority ?? Number.MAX_SAFE_INTEGER;
      const pb = b.item.mobilePriority ?? Number.MAX_SAFE_INTEGER;
      if (pa !== pb) return pa - pb;
      return a.index - b.index;
    })
    .slice(0, 4)
    .map(({ item }) => item);
}

export function getAccessibleModuleSwitcherItems(
  navAccess: NavAccess,
): ModuleSwitcherItem[] {
  if (!canAccessInternalNav(navAccess)) {
    return [];
  }
  return MODULE_SWITCHER_ITEMS.filter((item) =>
    canAccessMenuItem(item.menuId, navAccess),
  );
}

function matchByLongestHref(
  pathname: string,
  items: MenuItem[],
): MenuItem | undefined {
  return [...items]
    .sort((a, b) => b.href.length - a.href.length)
    .find((item) => {
      const baseHref = item.href.split("?")[0] ?? item.href;
      return pathname === baseHref || pathname.startsWith(`${baseHref}/`);
    });
}

export interface ActiveNavResolution {
  activeItemId: string;
  expandedParentId: string | null;
}

export function resolveActiveNavItem(
  pathname: string | null | undefined,
  searchSection: string | null,
  context: ModuleContextFlags,
  menuItems: MenuItem[],
): ActiveNavResolution {
  if (!pathname) {
    return { activeItemId: "", expandedParentId: null };
  }

  if (context.isProjectsPage) {
    const found = matchByLongestHref(pathname, menuItems);
    return {
      activeItemId: found?.id ?? "projects-dashboard",
      expandedParentId: null,
    };
  }

  if (context.isProductNavContext) {
    return { activeItemId: "products-list", expandedParentId: null };
  }

  if (context.isSalesPage) {
    const found = matchByLongestHref(pathname, menuItems);
    if (found) {
      return { activeItemId: found.id, expandedParentId: null };
    }
    if (pathname === "/sales" || pathname === "/sales/dashboard") {
      return { activeItemId: menuItems[0]?.id ?? "", expandedParentId: null };
    }
    return { activeItemId: "", expandedParentId: null };
  }

  if (context.isWorkspacePage) {
    const found = matchByLongestHref(pathname, menuItems);
    if (found) {
      return { activeItemId: found.id, expandedParentId: null };
    }
    if (pathname === "/workspace") {
      return { activeItemId: menuItems[0]?.id ?? "", expandedParentId: null };
    }
    return { activeItemId: "", expandedParentId: null };
  }

  if (context.isEmployeeManagementSection) {
    const found = matchByLongestHref(pathname, menuItems);
    if (found) {
      return { activeItemId: found.id, expandedParentId: null };
    }
    if (pathname === "/hr" || pathname.startsWith("/hr/")) {
      return { activeItemId: menuItems[0]?.id ?? "", expandedParentId: null };
    }
    return { activeItemId: "", expandedParentId: null };
  }

  if (context.isAccountsPage) {
    for (const parentItem of menuItems) {
      if (parentItem.children?.length) {
        const childItem = matchByLongestHref(pathname, parentItem.children);
        if (childItem) {
          return {
            activeItemId: childItem.id,
            expandedParentId: parentItem.id,
          };
        }
      }
      if (
        pathname === parentItem.href ||
        pathname.startsWith(`${parentItem.href}/`)
      ) {
        return { activeItemId: parentItem.id, expandedParentId: null };
      }
    }
    if (pathname === "/accounts") {
      return { activeItemId: menuItems[0]?.id ?? "", expandedParentId: null };
    }
    return { activeItemId: "", expandedParentId: null };
  }

  if (context.isSettingsPage) {
    if (pathname.startsWith("/settings/organization")) {
      const orgItem = menuItems.find(
        (item) => item.href === "/settings/organization",
      );
      return {
        activeItemId: orgItem?.id ?? menuItems[0]?.id ?? "",
        expandedParentId: null,
      };
    }
    const section = searchSection || "general";
    const settingsItem = menuItems.find((item) =>
      item.href.includes(`section=${section}`),
    );
    return {
      activeItemId: settingsItem?.id ?? menuItems[0]?.id ?? "",
      expandedParentId: null,
    };
  }

  if (context.isDomainPage) {
    return {
      activeItemId: menuItems[0]?.id ?? "domain",
      expandedParentId: null,
    };
  }

  const found = matchByLongestHref(pathname, menuItems);
  return { activeItemId: found?.id ?? "", expandedParentId: null };
}
