import {
  ChartPie,
  CreditCard,
  Headset,
  Layers,
  MessageSquarePlus,
  type LucideIcon,
} from "lucide-react";

export interface PortalMenuItem {
  id: string;
  label: string;
  icon: LucideIcon;
  href: string;
}

export const PORTAL_NOTIFICATIONS_HREF = "/portal/notifications";
export const PORTAL_RESOURCES_HREF = "/portal/resources";

/** Sidebar navigation for role `user` — the client portal. */
export const CLIENT_PORTAL_MENU_ITEMS: PortalMenuItem[] = [
  { id: "dashboard", label: "Dashboard", icon: ChartPie, href: "/dashboard" },
  {
    id: "portal-projects",
    label: "Projects",
    icon: Layers,
    href: "/portal/projects",
  },
  {
    id: "portal-tickets",
    label: "Raise a ticket",
    icon: MessageSquarePlus,
    href: "/portal/tickets",
  },
  {
    id: "portal-billing",
    label: "Billing",
    icon: CreditCard,
    href: "/portal/billing",
  },
  {
    id: "portal-support",
    label: "Support",
    icon: Headset,
    href: "/portal/support",
  },
];

const PORTAL_PATH_PREFIXES = ["/portal"] as const;

export function isPortalPath(pathname: string): boolean {
  return (
    pathname === "/dashboard" ||
    PORTAL_PATH_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    )
  );
}
