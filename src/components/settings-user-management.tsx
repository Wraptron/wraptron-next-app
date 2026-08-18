"use client";

import { useState, useEffect } from "react";
import {
  adminApi,
  organizationsApi,
  type AdminUser,
  type CreateAdminUserInput,
  type OrganizationRole,
} from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  RefreshCw,
  Loader2,
  Eye,
  EyeOff,
  UserPlus,
  Mail,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useOrganization } from "@/contexts/organization-context";


/** Global account roles only — org roles (admin/staff/customer) live on membership. */
const GLOBAL_ROLES = [
  { value: "user", label: "User" },
  { value: "super_admin", label: "Super admin" },
] as const;

const GLOBAL_ROLE_VALUES = new Set<string>(GLOBAL_ROLES.map((r) => r.value));

function toGlobalRole(role: string): "user" | "super_admin" {
  return role === "super_admin" ? "super_admin" : "user";
}

const formatDate = (dateString?: string | null) => {
  if (!dateString || dateString === null || dateString === "null") {
    return "Never";
  }
  if (typeof dateString === "string" && dateString.trim() === "") {
    return "Never";
  }
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return "Never";
    }
    return date.toLocaleString();
  } catch {
    return "Never";
  }
};

const getRoleColor = (role: string) => {
  const colors: Record<string, string> = {
    user: "bg-blue-100 text-blue-800",
    super_admin: "bg-purple-100 text-purple-800",
    // Legacy global roles still in DB until migrated to org membership
    staff: "bg-green-100 text-green-800",
    admin: "bg-violet-100 text-violet-800",
    customer: "bg-amber-100 text-amber-800",
  };
  return colors[role] || "bg-muted text-gray-800";
};

const getRoleLabel = (value: string) =>
  GLOBAL_ROLES.find((r) => r.value === value)?.label ?? value;

export function SettingsUserManagement() {
  const { user: currentUser } = useAuth();
  const { activeOrg } = useOrganization();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [orgRoles, setOrgRoles] = useState<OrganizationRole[]>([]);
  const [selectedOrgRoleId, setSelectedOrgRoleId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [inviting, setInviting] = useState(false);
  const [formData, setFormData] = useState<
    CreateAdminUserInput & { is_active?: boolean }
  >({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    phone_number: "",
    role: "user",
    is_active: true,
  });

  useEffect(() => {
    if (!activeOrg?.id) return;
    organizationsApi
      .listRoles(activeOrg.id)
      .then((res) => {
        setOrgRoles(res.roles);
        const defaultRole =
          res.roles.find((r) => r.role_type === "custom") ?? res.roles[0];
        if (defaultRole) {
          setSelectedOrgRoleId(String(defaultRole.id));
        }
      })
      .catch(() => {});
  }, [activeOrg?.id]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminApi.getUsers({
        search: search || undefined,
        role: roleFilter !== "all" ? roleFilter : undefined,
        is_active: statusFilter !== "all" ? statusFilter === "active" : undefined,
        limit,
        offset: page * limit,
      });
      setUsers(response.users);
      setTotal(response.total);
    } catch (err: any) {
      setError(err?.message || "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.role !== "admin") return;
    fetchUsers();
  }, [page, roleFilter, statusFilter, currentUser?.role]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (page === 0) {
        fetchUsers();
      } else {
        setPage(0);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  const handleInvite = async () => {
    if (!formData.email) return;
    try {
      setInviting(true);
      setError(null);
      setSuccessMessage(null);
      await adminApi.inviteUser({
        email: formData.email,
        first_name: formData.first_name || undefined,
        last_name: formData.last_name || undefined,
        phone_number: formData.phone_number || undefined,
        role: "user",
        org_role_id: selectedOrgRoleId ? Number(selectedOrgRoleId) : undefined,
      });
      setCreateDialogOpen(false);
      const invitedEmail = formData.email;
      resetForm();
      setSuccessMessage(
        `Invitation email sent to ${invitedEmail}. A link to set password has been triggered.`
      );
      fetchUsers();
    } catch (err: any) {
      setError(err?.message || "Failed to invite user");
    } finally {
      setInviting(false);
    }
  };


  const handleEdit = async () => {
    if (!selectedUser) return;
    try {
      setError(null);
      await adminApi.updateUser(selectedUser.id, {
        email: formData.email,
        password: formData.password || undefined,
        first_name: formData.first_name || undefined,
        last_name: formData.last_name || undefined,
        phone_number: formData.phone_number || undefined,
        role: toGlobalRole(formData.role ?? "user"),
        is_active: formData.is_active,
      });
      setEditDialogOpen(false);
      resetForm();
      setSelectedUser(null);
      fetchUsers();
    } catch (err: any) {
      setError(err?.message || "Failed to update user");
    }
  };

  const handleDelete = async (userId: number) => {
    if (!confirm("Are you sure you want to deactivate this user?")) return;
    try {
      setError(null);
      await adminApi.deleteUser(userId);
      fetchUsers();
    } catch (err: any) {
      setError(err?.message || "Failed to delete user");
    }
  };

  const openEditDialog = (user: AdminUser) => {
    setSelectedUser(user);
    setFormData({
      email: user.email,
      password: "",
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      phone_number: user.phone_number || "",
      // Coerce legacy org-style global roles so the select + API stay valid
      role: toGlobalRole(user.role),
      is_active: user.is_active,
    });
    setEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      email: "",
      password: "",
      first_name: "",
      last_name: "",
      phone_number: "",
      role: "user",
      is_active: true,
    });
    const defaultRole =
      orgRoles.find((r) => r.role_type === "custom") ?? orgRoles[0];
    if (defaultRole) {
      setSelectedOrgRoleId(String(defaultRole.id));
    }
    setShowPassword(false);
  };

  const totalPages = Math.ceil(total / limit);

  if (currentUser != null && currentUser.role !== "admin") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Only admins can manage users.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">User Management</h2>
          <p className="text-muted-foreground mt-1">
            Manage accounts and global roles (user / super admin). Assign
            admin, staff, or customer roles under Settings → Organization.
          </p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <UserPlus className="h-4 w-4 mr-2" />
              Invite User
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-blue-600" />
                Invite User
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 text-blue-800 p-3 rounded-md text-sm">
                An invitation email will be sent to this email ID with a secure link to set their password.
              </div>
              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="user@example.com"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name">First Name</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) =>
                      setFormData({ ...formData, first_name: e.target.value })
                    }
                    placeholder="John"
                  />
                </div>
                <div>
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) =>
                      setFormData({ ...formData, last_name: e.target.value })
                    }
                    placeholder="Doe"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="phone_number">Phone Number</Label>
                <Input
                  id="phone_number"
                  value={formData.phone_number}
                  onChange={(e) =>
                    setFormData({ ...formData, phone_number: e.target.value })
                  }
                  placeholder="+1234567890"
                />
              </div>
              <div>
                <Label htmlFor="org-role">Role *</Label>
                <Select
                  value={selectedOrgRoleId}
                  onValueChange={setSelectedOrgRoleId}
                >
                  <SelectTrigger id="org-role">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {orgRoles.map((r) => (
                      <SelectItem key={r.id} value={String(r.id)}>
                        {r.name} {r.role_type === "owner" ? "(Owner)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Assign the role and permissions for this organization workspace.
                </p>
              </div>
              {error && <div className="text-red-600 text-sm">{error}</div>}
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleInvite} disabled={!formData.email || inviting}>
                  {inviting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Send Invite
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {GLOBAL_ROLES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={fetchUsers}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {successMessage && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setSuccessMessage(null)}>
            Dismiss
          </Button>
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          {error}
        </div>
      )}


      <Card>
        <CardHeader>
          <CardTitle>Users ({total})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No users found</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.email}</TableCell>
                        <TableCell>
                          {user.first_name || user.last_name
                            ? `${user.first_name || ""} ${user.last_name || ""}`.trim()
                            : "-"}
                        </TableCell>
                        <TableCell>
                          <Badge className={getRoleColor(user.role)}>
                            {getRoleLabel(user.role)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              user.is_active
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }
                          >
                            {user.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(user.last_login)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(user.created_at)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(user)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            {currentUser?.id !== user.id && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(user.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {page * limit + 1} to{" "}
                    {Math.min((page + 1) * limit, total)} of {total} users
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 0}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page >= totalPages - 1}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-email">Email *</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="user@example.com"
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-password">
                Password (leave blank to keep current)
              </Label>
              <div className="relative">
                <Input
                  id="edit-password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Enter new password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-first_name">First Name</Label>
                <Input
                  id="edit-first_name"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  placeholder="John"
                />
              </div>
              <div>
                <Label htmlFor="edit-last_name">Last Name</Label>
                <Input
                  id="edit-last_name"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  placeholder="Doe"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-phone_number">Phone Number</Label>
              <Input
                id="edit-phone_number"
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                placeholder="+1234567890"
              />
            </div>
            <div>
              <Label htmlFor="edit-role">Global role *</Label>
              <Select
                value={
                  GLOBAL_ROLE_VALUES.has(formData.role ?? "")
                    ? formData.role
                    : "user"
                }
                onValueChange={(value) =>
                  setFormData({ ...formData, role: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GLOBAL_ROLES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Org roles (admin / staff / customer) are set on organization
                membership.
              </p>
            </div>
            <div>
              <Label htmlFor="edit-is_active">Status</Label>
              <Select
                value={formData.is_active ? "active" : "inactive"}
                onValueChange={(value) =>
                  setFormData({ ...formData, is_active: value === "active" })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {error && <div className="text-red-600 text-sm">{error}</div>}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEdit} disabled={!formData.email}>
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
