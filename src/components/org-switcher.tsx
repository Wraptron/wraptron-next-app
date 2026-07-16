"use client";

import { Building2, Check, ChevronsUpDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useOrganization } from "@/contexts/organization-context";
import Link from "next/link";

/**
 * Active-organization switcher. Hidden for members of a single org
 * (nothing to switch); super admins always see it plus a link to the
 * organizations admin area.
 */
export function OrgSwitcher() {
  const { organizations, activeOrg, isSuperAdmin, switchOrg } =
    useOrganization();

  if (!activeOrg && !isSuperAdmin) return null;
  if (organizations.length <= 1 && !isSuperAdmin) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 max-w-56"
          aria-label="Switch organization"
        >
          <Building2 className="h-4 w-4 shrink-0" />
          <span className="truncate">
            {activeOrg?.name ?? "Select organization"}
          </span>
          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>Organizations</DropdownMenuLabel>
        {organizations.map((org) => (
          <DropdownMenuItem
            key={org.id}
            onClick={() => {
              if (org.id !== activeOrg?.id) switchOrg(org.id);
            }}
            className="flex items-center justify-between"
          >
            <span className="truncate">{org.name}</span>
            {org.id === activeOrg?.id && <Check className="h-4 w-4" />}
          </DropdownMenuItem>
        ))}
        {isSuperAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/admin/organizations">Manage organizations</Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Full-page notice for authenticated users with no org membership. */
export function NoOrganizationScreen() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 p-8 text-center">
      <Building2 className="h-10 w-10 opacity-40" />
      <h1 className="text-xl font-semibold">No organization yet</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        Your account is not a member of any organization. Ask an
        organization admin to add you, then reload this page.
      </p>
    </div>
  );
}
