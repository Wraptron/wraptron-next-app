"use client";

import React, { useCallback, useEffect, useState } from "react";
import { PageShell } from "@/components/page-shell";
import { usePageTitle } from "@/contexts/page-title-context";
import { useOrganization } from "@/contexts/organization-context";
import {
  organizationsApi,
  getApiErrorMessage,
  type OrganizationMember,
  type OrgRolePermissionEntry,
} from "@/lib/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const MEMBER_ROLES = ["admin", "staff", "customer"] as const;

export default function OrganizationSettingsPage() {
  const { activeOrg, orgRole, isSuperAdmin } = useOrganization();
  const { setTitle } = usePageTitle();
  useEffect(() => {
    setTitle("Organization");
    return () => setTitle(null);
  }, [setTitle]);
  const orgId = activeOrg?.id ?? null;
  const canManage = isSuperAdmin || orgRole === "admin";

  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [permissions, setPermissions] = useState<{
    staff: OrgRolePermissionEntry[];
    customer: OrgRolePermissionEntry[];
  } | null>(null);
  const [permRole, setPermRole] = useState<"staff" | "customer">("staff");
  const [error, setError] = useState<string | null>(null);
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<string>("staff");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!orgId) return;
    setError(null);
    try {
      const [m, p] = await Promise.all([
        organizationsApi.listMembers(orgId),
        organizationsApi.getPermissions(orgId),
      ]);
      setMembers(m.members);
      setPermissions(p.roles);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load organization settings"));
    }
  }, [orgId]);

  useEffect(() => {
    if (canManage) void load();
  }, [canManage, load]);

  if (!activeOrg) return null;
  if (!canManage) {
    return (
      <PageShell>
        <div className="p-8 text-center text-muted-foreground">
          Organization admin access required.
        </div>
      </PageShell>
    );
  }

  const addMember = async () => {
    if (!orgId || !newEmail.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await organizationsApi.addMember(orgId, {
        email: newEmail.trim(),
        role: newRole,
      });
      setNewEmail("");
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to add member"));
    } finally {
      setBusy(false);
    }
  };

  const changeMemberRole = async (member: OrganizationMember, role: string) => {
    if (!orgId) return;
    try {
      await organizationsApi.updateMember(orgId, member.id, { role });
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to update member"));
    }
  };

  const toggleMemberActive = async (member: OrganizationMember) => {
    if (!orgId) return;
    try {
      await organizationsApi.updateMember(orgId, member.id, {
        is_active: !member.is_active,
      });
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to update member"));
    }
  };

  const toggleOverride = async (entry: OrgRolePermissionEntry) => {
    if (!orgId) return;
    // Cycle: effective on -> revoke; effective off -> grant. Clearing back to
    // the default happens when the override matches the default again.
    const nextGranted = !entry.effective;
    const override = nextGranted === entry.default_granted ? null : nextGranted;
    try {
      await organizationsApi.setPermissions(orgId, {
        role: permRole,
        overrides: [{ permission_id: entry.id, granted: override }],
      });
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to update permissions"));
    }
  };

  const permEntries = permissions?.[permRole] ?? [];

  return (
    <PageShell>
      <div className="space-y-6 p-4">
        {error && (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Members</CardTitle>
            <CardDescription>
              Add existing users to {activeOrg.name} and set their role.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="user@example.com"
                className="max-w-xs"
              />
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MEMBER_ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                onClick={addMember}
                disabled={busy || !newEmail.trim()}
              >
                Add member
              </Button>
            </div>

            <div className="divide-y rounded-md border">
              {members.map((m) => (
                <div
                  key={m.id}
                  className="flex flex-wrap items-center justify-between gap-2 p-3"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">
                      {[m.first_name, m.last_name].filter(Boolean).join(" ") ||
                        m.email}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {m.email}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!m.is_active && <Badge variant="secondary">inactive</Badge>}
                    <Select
                      value={m.role}
                      onValueChange={(role) => changeMemberRole(m, role)}
                    >
                      <SelectTrigger className="w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MEMBER_ROLES.map((r) => (
                          <SelectItem key={r} value={r}>
                            {r}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => toggleMemberActive(m)}
                    >
                      {m.is_active ? "Deactivate" : "Reactivate"}
                    </Button>
                  </div>
                </div>
              ))}
              {members.length === 0 && (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No members yet.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Role permissions</CardTitle>
            <CardDescription>
              Adjust what {permRole} members can do in this organization.
              Admins always have full access. Checkboxes show the effective
              permission; changes create org-level overrides.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Select
              value={permRole}
              onValueChange={(v) => setPermRole(v as "staff" | "customer")}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="staff">staff</SelectItem>
                <SelectItem value="customer">customer</SelectItem>
              </SelectContent>
            </Select>

            <div className="divide-y rounded-md border">
              {permEntries.map((entry) => (
                <label
                  key={entry.id}
                  className="flex cursor-pointer items-center justify-between gap-3 p-3"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium">{entry.name}</div>
                    {entry.description && (
                      <div className="truncate text-xs text-muted-foreground">
                        {entry.description}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {entry.override !== null && (
                      <Badge variant="outline">override</Badge>
                    )}
                    <Checkbox
                      checked={entry.effective}
                      onCheckedChange={() => toggleOverride(entry)}
                    />
                  </div>
                </label>
              ))}
              {permEntries.length === 0 && (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No permissions defined.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
