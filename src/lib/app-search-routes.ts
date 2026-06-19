/**
 * Navigable app routes for global search (pages + sections).
 * Keep in sync with sidebar and major `app/` routes.
 */
export interface AppSearchRoute {
  href: string;
  label: string;
  /** Extra tokens matched against the query (lowercased). */
  keywords?: string;
  section?: string;
  adminOnly?: boolean;
}

export const APP_SEARCH_ROUTES: AppSearchRoute[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    keywords: "home overview",
    section: "Main",
  },
  {
    href: "/sales/dashboard",
    label: "Sales dashboard",
    keywords: "crm pipeline metrics funnel revenue",
    section: "Sales",
  },
  {
    href: "/sales/deals",
    label: "Deals",
    keywords: "opportunities pipeline",
    section: "Sales",
  },
  {
    href: "/sales/contacts",
    label: "Contacts",
    keywords: "people leads",
    section: "Sales",
  },
  {
    href: "/sales/companies",
    label: "Companies",
    keywords: "accounts organizations",
    section: "Sales",
  },
  {
    href: "/sales/customers",
    label: "Customers (CRM)",
    keywords: "kyc onboarding finance clients gst",
    section: "Sales",
  },
  {
    href: "/sales/tasks",
    label: "Sales tasks",
    keywords: "crm todos",
    section: "Sales",
  },
  {
    href: "/projects/dashboard",
    label: "Project dashboard",
    keywords: "ppm metrics delivery",
    section: "Projects",
  },
  {
    href: "/projects",
    label: "Projects",
    keywords: "ppm delivery",
    section: "Projects",
  },
  {
    href: "/projects/new",
    label: "New project",
    keywords: "create",
    section: "Projects",
  },
  {
    href: "/projects/tasks",
    label: "Project tasks",
    keywords: "ppm todos",
    section: "Projects",
  },
  {
    href: "/products",
    label: "Products",
    keywords: "catalog parts inventory",
    section: "Products",
  },
  {
    href: "/product",
    label: "Product (marketing)",
    keywords: "marketing wraptron",
    section: "Product",
  },
  {
    href: "/product/interfaces",
    label: "Product — Interface",
    section: "Product",
  },
  {
    href: "/product/features",
    label: "Product — Features",
    section: "Product",
  },
  {
    href: "/product/tech-stack",
    label: "Product — Tech stack",
    section: "Product",
  },
  {
    href: "/product/milestone",
    label: "Product — Milestone",
    section: "Product",
  },
  {
    href: "/hiring",
    label: "Hiring",
    keywords: "recruitment jobs",
    section: "Main",
  },
  {
    href: "/transactions",
    label: "Accounts — Transactions",
    keywords: "payments ledger",
    section: "Accounts",
  },
  {
    href: "/accounts/invoices",
    label: "Invoices",
    keywords: "billing",
    section: "Accounts",
  },
  { href: "/invoices/new", label: "New invoice", section: "Accounts" },
  {
    href: "/accounts",
    label: "Accounts",
    keywords: "accounting books",
    section: "Accounts",
  },
  {
    href: "/accounts/receive/orders",
    label: "Sales orders",
    section: "Accounts — Receive",
  },
  {
    href: "/accounts/receive/payments-received",
    label: "Payments received",
    section: "Accounts — Receive",
  },
  {
    href: "/accounts/receive/customers",
    label: "Receive — Customers",
    section: "Accounts — Receive",
  },
  {
    href: "/accounts/purchases/expenses",
    label: "Expenses",
    section: "Accounts — Purchases",
  },
  {
    href: "/accounts/purchases/orders",
    label: "Purchase orders",
    section: "Accounts — Purchases",
  },
  {
    href: "/accounts/purchases/payments-sent",
    label: "Payments sent",
    section: "Accounts — Purchases",
  },
  {
    href: "/accounts/purchases/vendors",
    label: "Vendors",
    section: "Accounts — Purchases",
  },
  {
    href: "/accounts/chart-of-accounts",
    label: "Chart of accounts",
    section: "Accounts",
  },
  { href: "/accounts/journals", label: "Journals", section: "Accounts" },
  {
    href: "/workspace",
    label: "Workspace",
    keywords: "skills attendance",
    section: "Workspace",
  },
  {
    href: "/hr/dashboard",
    label: "HR dashboard",
    keywords: "employees people staff attendance headcount",
    section: "Human resources",
  },
  {
    href: "/hr",
    label: "Human resources",
    keywords: "employees people staff",
    section: "Human resources",
  },
  {
    href: "/hr/employees",
    label: "Employees",
    keywords: "staff team directory",
    section: "Human resources",
  },
  {
    href: "/hr/employees/new",
    label: "New employee",
    section: "Human resources",
  },
  {
    href: "/hr/skills",
    label: "Skill matrix",
    keywords: "skills competency matrix",
    section: "Human resources",
  },
  { href: "/workspace/attendance", label: "Attendance", section: "Workspace" },
  {
    href: "/workspace/attendance/timesheet",
    label: "Attendance — Timesheet",
    section: "Workspace",
  },
  {
    href: "/workspace/attendance/hr",
    label: "Attendance — HR",
    section: "Workspace",
  },
  {
    href: "/workspace/attendance/manager",
    label: "Attendance — Manager",
    section: "Workspace",
  },
  { href: "/workspace/timesheet", label: "Timesheet", section: "Workspace" },
  { href: "/workspace/payslips", label: "Payslips", section: "Workspace" },
  {
    href: "/workspace/departments",
    label: "Departments",
    section: "Workspace",
  },
  { href: "/ppm", label: "PPM", keywords: "portfolio", section: "PPM" },
  { href: "/ppm/projects", label: "PPM projects", section: "PPM" },
  { href: "/ppm/projects/new", label: "PPM — New project", section: "PPM" },
  { href: "/ppm/projects/tasks", label: "PPM — Tasks", section: "PPM" },
  {
    href: "/settings",
    label: "Settings",
    keywords: "preferences profile invoice",
    section: "Main",
  },
  { href: "/support", label: "Support", keywords: "help", section: "Main" },
  { href: "/payments", label: "Payments", section: "Main" },
  { href: "/content", label: "Content", section: "Main" },
  { href: "/library", label: "Library", section: "Main" },
  { href: "/studio", label: "Studio", section: "Main" },
  {
    href: "/admin/users",
    label: "User management",
    keywords: "administration roles",
    section: "Administration",
    adminOnly: true,
  },
];

const SUGGESTED_LIMIT = 16;

export function filterAppSearchRoutes(
  query: string,
  options: { isAdmin: boolean },
): AppSearchRoute[] {
  const visible = APP_SEARCH_ROUTES.filter(
    (r) => !r.adminOnly || options.isAdmin,
  );
  const q = query.trim().toLowerCase();
  if (!q) {
    return visible.slice(0, SUGGESTED_LIMIT);
  }
  return visible.filter((r) => {
    const hay =
      `${r.label} ${r.keywords ?? ""} ${r.href} ${r.section ?? ""}`.toLowerCase();
    return hay.includes(q);
  });
}
