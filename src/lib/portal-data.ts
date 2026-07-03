export type ProjectStatus = "Live" | "In Progress" | "Review" | "Paused";
export type TicketType = "Bug" | "Change";
export type TicketStatus = "Open" | "In Progress" | "Resolved" | "Closed";
export type InvoiceStatus = "Paid" | "Due" | "Overdue";
export type NotificationKind = "build" | "ticket" | "invoice";

export interface ClientProject {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  progress: number;
  dueDate: string;
  lead: string;
}

export interface SupportTicket {
  id: string;
  subject: string;
  type: TicketType;
  status: TicketStatus;
  assignee: string;
  createdAt: string;
  updatedAt: string;
  description: string;
}

export interface PortalNotification {
  id: string;
  title: string;
  body: string;
  kind: NotificationKind;
  read: boolean;
  createdAt: string;
}

export interface ResourceDoc {
  id: string;
  title: string;
  description: string;
  type: "pdf" | "api" | "figma" | "notion" | "video";
  href: string;
}

export interface ClientInvoice {
  id: string;
  number: string;
  amount: number;
  currency: string;
  status: InvoiceStatus;
  issuedAt: string;
  dueAt: string;
}

export interface ActivityItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  href?: string;
}

export const MOCK_PROJECTS: ClientProject[] = [
  {
    id: "p1",
    name: "Acme Commerce Platform",
    description: "Headless storefront with admin dashboard and payment integration.",
    status: "In Progress",
    progress: 68,
    dueDate: "2026-08-15",
    lead: "Priya Sharma",
  },
  {
    id: "p2",
    name: "Mobile Field Service App",
    description: "iOS and Android app for technician scheduling and job tracking.",
    status: "Review",
    progress: 92,
    dueDate: "2026-07-01",
    lead: "Arjun Mehta",
  },
  {
    id: "p3",
    name: "Analytics Dashboard",
    description: "Real-time KPI dashboard with role-based access.",
    status: "Live",
    progress: 100,
    dueDate: "2026-05-20",
    lead: "Neha Kapoor",
  },
  {
    id: "p4",
    name: "AI Support Bot",
    description: "LLM-powered customer support assistant integrated with CRM.",
    status: "Paused",
    progress: 35,
    dueDate: "2026-10-01",
    lead: "Rahul Verma",
  },
];

export const MOCK_TICKETS: SupportTicket[] = [
  {
    id: "T-1042",
    subject: "Checkout page timeout on mobile Safari",
    type: "Bug",
    status: "In Progress",
    assignee: "Dev Team — Priya",
    createdAt: "2026-06-18T09:00:00Z",
    updatedAt: "2026-06-28T14:30:00Z",
    description: "Users report the payment step hangs after entering card details on iOS Safari 17.",
  },
  {
    id: "T-1038",
    subject: "Add export to CSV on reports page",
    type: "Change",
    status: "Open",
    assignee: "Unassigned",
    createdAt: "2026-06-22T11:15:00Z",
    updatedAt: "2026-06-22T11:15:00Z",
    description: "Need ability to download monthly sales report as CSV for accounting.",
  },
  {
    id: "T-1021",
    subject: "Login redirect loop after password reset",
    type: "Bug",
    status: "Resolved",
    assignee: "Dev Team — Arjun",
    createdAt: "2026-06-05T08:00:00Z",
    updatedAt: "2026-06-10T16:00:00Z",
    description: "After resetting password via email link, users were redirected back to login.",
  },
  {
    id: "T-1015",
    subject: "Update brand colors in admin panel",
    type: "Change",
    status: "Closed",
    assignee: "Design — Neha",
    createdAt: "2026-05-28T10:00:00Z",
    updatedAt: "2026-06-02T12:00:00Z",
    description: "Apply new brand palette (#1a56db primary) across all admin UI components.",
  },
];

export const MOCK_NOTIFICATIONS: PortalNotification[] = [
  {
    id: "n1",
    title: "Build v2.4.1 deployed to staging",
    body: "Acme Commerce Platform — staging environment updated with cart fixes.",
    kind: "build",
    read: false,
    createdAt: "2026-06-29T18:00:00Z",
  },
  {
    id: "n2",
    title: "Ticket T-1042 assigned",
    body: "Your bug report has been assigned to Priya Sharma.",
    kind: "ticket",
    read: false,
    createdAt: "2026-06-28T14:35:00Z",
  },
  {
    id: "n3",
    title: "Invoice INV-2026-042 due in 5 days",
    body: "₹1,25,000 due on July 5, 2026. Pay now to avoid late fees.",
    kind: "invoice",
    read: true,
    createdAt: "2026-06-25T09:00:00Z",
  },
  {
    id: "n4",
    title: "Build v2.4.0 released to production",
    body: "Analytics Dashboard — production deployment completed successfully.",
    kind: "build",
    read: true,
    createdAt: "2026-06-20T11:00:00Z",
  },
];

export const RESOURCE_DOCS: ResourceDoc[] = [
  {
    id: "r1",
    title: "Project onboarding guide",
    description: "Step-by-step guide for kickoff, milestones, and communication cadence.",
    type: "pdf",
    href: "#",
  },
  {
    id: "r2",
    title: "API reference",
    description: "REST API documentation for your integrated services and webhooks.",
    type: "api",
    href: "#",
  },
  {
    id: "r3",
    title: "Design system",
    description: "Figma library with components, tokens, and brand guidelines.",
    type: "figma",
    href: "#",
  },
  {
    id: "r4",
    title: "Launch checklist",
    description: "Notion template for pre-launch QA, security review, and go-live steps.",
    type: "notion",
    href: "#",
  },
  {
    id: "r5",
    title: "Platform walkthrough",
    description: "15-minute video tour of your admin portal and key workflows.",
    type: "video",
    href: "#",
  },
];

export const MOCK_INVOICES: ClientInvoice[] = [
  {
    id: "inv1",
    number: "INV-2026-042",
    amount: 125000,
    currency: "INR",
    status: "Due",
    issuedAt: "2026-06-01",
    dueAt: "2026-07-05",
  },
  {
    id: "inv2",
    number: "INV-2026-038",
    amount: 85000,
    currency: "INR",
    status: "Paid",
    issuedAt: "2026-05-01",
    dueAt: "2026-05-31",
  },
  {
    id: "inv3",
    number: "INV-2026-031",
    amount: 150000,
    currency: "INR",
    status: "Paid",
    issuedAt: "2026-04-01",
    dueAt: "2026-04-30",
  },
  {
    id: "inv4",
    number: "INV-2026-024",
    amount: 95000,
    currency: "INR",
    status: "Overdue",
    issuedAt: "2026-03-01",
    dueAt: "2026-03-31",
  },
];

export const MOCK_ACTIVITY: ActivityItem[] = [
  {
    id: "a1",
    title: "Staging build deployed",
    description: "Acme Commerce v2.4.1 is live on staging.",
    timestamp: "2026-06-29T18:00:00Z",
    href: "/portal/projects",
  },
  {
    id: "a2",
    title: "Ticket updated",
    description: "T-1042 — Priya added a fix and moved to In Progress.",
    timestamp: "2026-06-28T14:30:00Z",
    href: "/portal/tickets",
  },
  {
    id: "a3",
    title: "Invoice issued",
    description: "INV-2026-042 for ₹1,25,000 is due July 5.",
    timestamp: "2026-06-25T09:00:00Z",
    href: "/portal/billing",
  },
  {
    id: "a4",
    title: "Milestone completed",
    description: "Mobile Field Service App — UAT phase signed off.",
    timestamp: "2026-06-20T11:00:00Z",
    href: "/portal/projects",
  },
];

export function getOutstandingBalance(invoices: ClientInvoice[]): number {
  return invoices
    .filter((inv) => inv.status === "Due" || inv.status === "Overdue")
    .reduce((sum, inv) => sum + inv.amount, 0);
}

export function formatCurrency(amount: number, currency = "INR"): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatRelativeDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
