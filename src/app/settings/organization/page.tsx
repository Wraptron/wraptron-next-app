"use client";

import React, { useCallback, useEffect, useState } from "react";
import { PageShell } from "@/components/page-shell";
import { usePageTitle } from "@/contexts/page-title-context";
import { useOrganization } from "@/contexts/organization-context";
import {
  organizationsApi,
  getApiErrorMessage,
  type OrganizationMember,
  type OrganizationRole,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function OrganizationSettingsPage() {
  const { activeOrg, isOwner, isSuperAdmin } = useOrganization();
  const { setTitle } = usePageTitle();
  useEffect(() => {
    setTitle("Organization");
    return () => setTitle(null);
  }, [setTitle]);
  const orgId = activeOrg?.id ?? null;
  const canManage = isSuperAdmin || isOwner;

  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [roles, setRoles] = useState<OrganizationRole[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [newEmail, setNewEmail] = useState("");
  const [newRoleId, setNewRoleId] = useState<string>("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!orgId) return;
    setError(null);
    try {
      const [m, r] = await Promise.all([
        organizationsApi.listMembers(orgId),
        organizationsApi.listRoles(orgId),
      ]);
      setMembers(m.members);
      setRoles(r.roles);
      if (!newRoleId && r.roles.length > 0) {
        const defaultRole =
          r.roles.find((role) => role.role_type === "custom") ?? r.roles[0];
        setNewRoleId(String(defaultRole.id));
      }
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
          Organization owner access required.
        </div>
      </PageShell>
    );
  }

  const inviteMember = async () => {
    if (!orgId || !newEmail.trim() || !newRoleId) return;
    setBusy(true);
    setError(null);
    try {
      await organizationsApi.createInvite(orgId, {
        email: newEmail.trim(),
        role_id: Number(newRoleId),
      });
      setNewEmail("");
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to send invite"));
    } finally {
      setBusy(false);
    }
  };

  const changeMemberRole = async (member: OrganizationMember, roleId: string) => {
    if (!orgId) return;
    try {
      await organizationsApi.updateMember(orgId, member.user_id, {
        role_id: Number(roleId),
      });
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to update member"));
    }
  };

  const toggleMemberActive = async (member: OrganizationMember) => {
    if (!orgId) return;
    try {
      await organizationsApi.updateMember(orgId, member.user_id, {
        is_active: !member.is_active,
      });
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to update member"));
    }
  };

  const assignableRoles = roles.filter((role) => role.role_type !== "owner");

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
              Invite users to {activeOrg.name} and assign a role.
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
              <Select value={newRoleId} onValueChange={setNewRoleId}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  {assignableRoles.map((role) => (
                    <SelectItem key={role.id} value={String(role.id)}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                onClick={inviteMember}
                disabled={busy || !newEmail.trim() || !newRoleId}
              >
                Send invite
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
                    {m.role_type === "owner" ? (
                      <Badge>{m.role_name}</Badge>
                    ) : (
                      <Select
                        value={String(m.role_id)}
                        onValueChange={(roleId) => changeMemberRole(m, roleId)}
                      >
                        <SelectTrigger className="w-36">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {assignableRoles.map((role) => (
                            <SelectItem key={role.id} value={String(role.id)}>
                              {role.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
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
      </div>
    </PageShell>
  );
}
