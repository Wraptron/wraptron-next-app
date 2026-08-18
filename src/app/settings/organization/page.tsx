"use client";

import React, { useCallback, useEffect, useState } from "react";
import { PageShell } from "@/components/page-shell";
import { usePageTitle } from "@/contexts/page-title-context";
import { useOrganization } from "@/contexts/organization-context";
import {
  organizationsApi,
  getApiErrorMessage,
  type OrganizationInvite,
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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const MODULE_MATRIX: ReadonlyArray<{
  key: string;
  label: string;
  actions: readonly string[];
}> = [
  { key: "sales", label: "Sales", actions: ["read", "create", "update", "delete"] },
  { key: "projects", label: "Projects", actions: ["read", "create", "update", "delete"] },
  { key: "tasks", label: "Tasks", actions: ["read", "create", "update", "delete"] },
  { key: "products", label: "Products", actions: ["read", "create", "update", "delete"] },
  { key: "accounts", label: "Accounts", actions: ["read", "create", "update", "delete"] },
  { key: "invoices", label: "Invoices", actions: ["read", "create", "update", "delete"] },
  { key: "hr", label: "HR / Workspace", actions: ["read", "create", "update", "delete"] },
  { key: "customers", label: "Customers / CRM", actions: ["read", "create", "update", "delete"] },
  { key: "settings", label: "Settings", actions: ["read", "update"] },
];

const CRUD_ACTIONS = ["read", "create", "update", "delete"] as const;

function permName(resource: string, action: string) {
  return `${resource}.${action}`;
}

function memberDisplayName(member: OrganizationMember) {
  const name = [member.first_name, member.last_name].filter(Boolean).join(" ");
  return name || member.email;
}

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
  const [invites, setInvites] = useState<OrganizationInvite[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [newRoleName, setNewRoleName] = useState("");
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [editingRoleName, setEditingRoleName] = useState("");
  const [editingPerms, setEditingPerms] = useState<Set<string>>(new Set());
  const [permsLoading, setPermsLoading] = useState(false);

  const [newEmail, setNewEmail] = useState("");
  const [newRoleId, setNewRoleId] = useState<string>("");

  const [confirmRemoveMember, setConfirmRemoveMember] =
    useState<OrganizationMember | null>(null);
  const [confirmDeleteRole, setConfirmDeleteRole] =
    useState<OrganizationRole | null>(null);

  const selectedRole = roles.find((r) => r.id === selectedRoleId) ?? null;
  const assignableRoles = roles.filter((role) => role.role_type !== "owner");
  const pendingInvites = invites.filter((inv) => inv.status === "pending");

  const load = useCallback(async () => {
    if (!orgId) return;
    setError(null);
    try {
      const [m, r, i] = await Promise.all([
        organizationsApi.listMembers(orgId),
        organizationsApi.listRoles(orgId),
        organizationsApi.listInvites(orgId),
      ]);
      setMembers(m.members);
      setRoles(r.roles);
      setInvites(i.invites);
      setNewRoleId((prev) => {
        if (prev && r.roles.some((role) => String(role.id) === prev)) return prev;
        const defaultRole =
          r.roles.find((role) => role.role_type === "custom") ?? r.roles[0];
        return defaultRole ? String(defaultRole.id) : "";
      });
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load organization settings"));
    }
  }, [orgId]);

  useEffect(() => {
    if (canManage) void load();
  }, [canManage, load]);

  useEffect(() => {
    if (!orgId || !selectedRole || selectedRole.role_type === "owner") {
      setEditingPerms(new Set());
      setEditingRoleName(selectedRole?.name ?? "");
      return;
    }
    let cancelled = false;
    setPermsLoading(true);
    void (async () => {
      try {
        const res = await organizationsApi.getRolePermissions(
          orgId,
          selectedRole.id,
        );
        if (cancelled) return;
        setEditingPerms(new Set(res.permissions.map((p) => p.name)));
        setEditingRoleName(selectedRole.name);
      } catch (err) {
        if (!cancelled) {
          setError(getApiErrorMessage(err, "Failed to load role permissions"));
        }
      } finally {
        if (!cancelled) setPermsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orgId, selectedRole]);

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

  const createRole = async () => {
    if (!orgId || !newRoleName.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await organizationsApi.createRole(orgId, {
        name: newRoleName.trim(),
        permission_names: [],
      });
      setNewRoleName("");
      await load();
      setSelectedRoleId(res.role.id);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to create role"));
    } finally {
      setBusy(false);
    }
  };

  const saveRole = async () => {
    if (!orgId || !selectedRole || selectedRole.role_type === "owner") return;
    setBusy(true);
    setError(null);
    try {
      await organizationsApi.updateRole(orgId, selectedRole.id, {
        name: editingRoleName.trim(),
        permission_names: Array.from(editingPerms),
      });
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to save role"));
    } finally {
      setBusy(false);
    }
  };

  const deleteRole = async (role: OrganizationRole) => {
    if (!orgId) return;
    setBusy(true);
    setError(null);
    try {
      await organizationsApi.deleteRole(orgId, role.id);
      setConfirmDeleteRole(null);
      if (selectedRoleId === role.id) setSelectedRoleId(null);
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to delete role"));
    } finally {
      setBusy(false);
    }
  };

  const togglePerm = (name: string, checked: boolean) => {
    setEditingPerms((prev) => {
      const next = new Set(prev);
      if (checked) next.add(name);
      else next.delete(name);
      return next;
    });
  };

  const changeMemberRole = async (member: OrganizationMember, roleId: string) => {
    if (!orgId) return;
    setError(null);
    try {
      await organizationsApi.updateMember(orgId, member.user_id, {
        role_id: Number(roleId),
      });
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to update member"));
    }
  };

  const removeMember = async (member: OrganizationMember) => {
    if (!orgId) return;
    setBusy(true);
    setError(null);
    try {
      await organizationsApi.removeMember(orgId, member.user_id);
      setConfirmRemoveMember(null);
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to remove member"));
    } finally {
      setBusy(false);
    }
  };

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

  const resendInvite = async (invite: OrganizationInvite) => {
    if (!orgId) return;
    setError(null);
    try {
      await organizationsApi.resendInvite(orgId, invite.id);
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to resend invite"));
    }
  };

  const revokeInvite = async (invite: OrganizationInvite) => {
    if (!orgId) return;
    setError(null);
    try {
      await organizationsApi.revokeInvite(orgId, invite.id);
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to revoke invite"));
    }
  };

  return (
    <PageShell>
      <div className="space-y-6 p-4">
        {error && (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <Tabs defaultValue="roles">
          <TabsList>
            <TabsTrigger value="roles">Roles</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="invites">Invites</TabsTrigger>
          </TabsList>

          <TabsContent value="roles" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Roles</CardTitle>
                <CardDescription>
                  Create custom roles and set module permissions for {activeOrg.name}.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Input
                    value={newRoleName}
                    onChange={(e) => setNewRoleName(e.target.value)}
                    placeholder="New role name"
                    className="max-w-xs"
                  />
                  <Button
                    size="sm"
                    onClick={createRole}
                    disabled={busy || !newRoleName.trim()}
                  >
                    Create role
                  </Button>
                </div>

                <div className="divide-y rounded-md border">
                  {roles.map((role) => (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => setSelectedRoleId(role.id)}
                      className={`flex w-full items-center justify-between gap-2 p-3 text-left transition-colors hover:bg-muted/50 ${
                        selectedRoleId === role.id ? "bg-muted/60" : ""
                      }`}
                    >
                      <span className="text-sm font-medium">{role.name}</span>
                      {role.role_type === "owner" ? (
                        <Badge variant="secondary">Owner · locked</Badge>
                      ) : (
                        <Badge variant="outline">Custom</Badge>
                      )}
                    </button>
                  ))}
                  {roles.length === 0 && (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      No roles yet.
                    </div>
                  )}
                </div>

                {selectedRole && (
                  <div className="space-y-4 rounded-md border p-4">
                    {selectedRole.role_type === "owner" ? (
                      <p className="text-sm text-muted-foreground">
                        The Owner role has full access to all modules and cannot be
                        edited or deleted.
                      </p>
                    ) : (
                      <>
                        <div className="flex flex-wrap items-center gap-2">
                          <Label htmlFor="role-name" className="sr-only">
                            Role name
                          </Label>
                          <Input
                            id="role-name"
                            value={editingRoleName}
                            onChange={(e) => setEditingRoleName(e.target.value)}
                            className="max-w-xs"
                          />
                          <Button
                            size="sm"
                            onClick={saveRole}
                            disabled={
                              busy || permsLoading || !editingRoleName.trim()
                            }
                          >
                            Save role
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setConfirmDeleteRole(selectedRole)}
                            disabled={busy}
                          >
                            Delete
                          </Button>
                        </div>

                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Module</TableHead>
                                {CRUD_ACTIONS.map((action) => (
                                  <TableHead key={action} className="text-center capitalize">
                                    {action}
                                  </TableHead>
                                ))}
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {MODULE_MATRIX.map((mod) => (
                                <TableRow key={mod.key}>
                                  <TableCell className="font-medium">
                                    {mod.label}
                                  </TableCell>
                                  {CRUD_ACTIONS.map((action) => {
                                    const allowed = mod.actions.includes(action);
                                    const name = permName(mod.key, action);
                                    return (
                                      <TableCell key={action} className="text-center">
                                        {allowed ? (
                                          <Checkbox
                                            checked={editingPerms.has(name)}
                                            disabled={permsLoading}
                                            onCheckedChange={(checked) =>
                                              togglePerm(name, checked === true)
                                            }
                                            aria-label={`${mod.label} ${action}`}
                                          />
                                        ) : (
                                          <span className="text-muted-foreground">—</span>
                                        )}
                                      </TableCell>
                                    );
                                  })}
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </>
                    )}

                    {selectedRole.role_type === "owner" && (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Module</TableHead>
                              {CRUD_ACTIONS.map((action) => (
                                <TableHead key={action} className="text-center capitalize">
                                  {action}
                                </TableHead>
                              ))}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {MODULE_MATRIX.map((mod) => (
                              <TableRow key={mod.key}>
                                <TableCell className="font-medium">
                                  {mod.label}
                                </TableCell>
                                {CRUD_ACTIONS.map((action) => {
                                  const allowed = mod.actions.includes(action);
                                  return (
                                    <TableCell key={action} className="text-center">
                                      {allowed ? (
                                        <Checkbox checked disabled aria-hidden />
                                      ) : (
                                        <span className="text-muted-foreground">—</span>
                                      )}
                                    </TableCell>
                                  );
                                })}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="members">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Members</CardTitle>
                <CardDescription>
                  Manage who belongs to {activeOrg.name} and their assigned role.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="divide-y rounded-md border">
                  {members.map((m) => (
                    <div
                      key={m.id}
                      className="flex flex-wrap items-center justify-between gap-2 p-3"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">
                          {memberDisplayName(m)}
                        </div>
                        <div className="truncate text-xs text-muted-foreground">
                          {m.email}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!m.is_active && (
                          <Badge variant="secondary">inactive</Badge>
                        )}
                        <Select
                          value={String(m.role_id)}
                          onValueChange={(roleId) => changeMemberRole(m, roleId)}
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {roles.map((role) => (
                              <SelectItem key={role.id} value={String(role.id)}>
                                {role.name} {role.role_type === "owner" ? "(Owner)" : ""}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setConfirmRemoveMember(m)}
                        >
                          Remove
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
          </TabsContent>

          <TabsContent value="invites" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Invites</CardTitle>
                <CardDescription>
                  Invite users by email. Pending invites expire after 30 days.
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
                    <SelectTrigger className="w-44">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={String(role.id)}>
                          {role.name} {role.role_type === "owner" ? "(Owner)" : ""}
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
                  {pendingInvites.map((inv) => (
                    <div
                      key={inv.id}
                      className="flex flex-wrap items-center justify-between gap-2 p-3"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">{inv.email}</div>
                        <div className="truncate text-xs text-muted-foreground">
                          {inv.role_name ?? `Role #${inv.role_id}`} · expires{" "}
                          {new Date(inv.expires_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => resendInvite(inv)}
                        >
                          Resend
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => revokeInvite(inv)}
                        >
                          Revoke
                        </Button>
                      </div>
                    </div>
                  ))}
                  {pendingInvites.length === 0 && (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      No pending invites.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog
        open={confirmRemoveMember != null}
        onOpenChange={(open) => !open && setConfirmRemoveMember(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove member?</DialogTitle>
            <DialogDescription>
              {confirmRemoveMember
                ? `${memberDisplayName(confirmRemoveMember)} will lose access to ${activeOrg.name}.`
                : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmRemoveMember(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={busy}
              onClick={() =>
                confirmRemoveMember && void removeMember(confirmRemoveMember)
              }
            >
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={confirmDeleteRole != null}
        onOpenChange={(open) => !open && setConfirmDeleteRole(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete role?</DialogTitle>
            <DialogDescription>
              {confirmDeleteRole
                ? `The "${confirmDeleteRole.name}" role will be permanently deleted. Reassign any members first.`
                : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDeleteRole(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={busy}
              onClick={() => confirmDeleteRole && void deleteRole(confirmDeleteRole)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
