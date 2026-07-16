"use client";

import React, { useCallback, useEffect, useState } from "react";
import { PageShell } from "@/components/page-shell";
import { usePageTitle } from "@/contexts/page-title-context";
import { useAuth } from "@/contexts/auth-context";
import { useOrganization } from "@/contexts/organization-context";
import {
  organizationsApi,
  getApiErrorMessage,
  type OrganizationSummary,
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
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Building2, LogIn, Plus } from "lucide-react";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export default function AdminOrganizationsPage() {
  const { user } = useAuth();
  const { setTitle } = usePageTitle();
  useEffect(() => {
    setTitle("Organizations");
    return () => setTitle(null);
  }, [setTitle]);
  const { isSuperAdmin, switchOrg, refreshOrganizations } = useOrganization();
  const [orgs, setOrgs] = useState<OrganizationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [firstAdminEmail, setFirstAdminEmail] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await organizationsApi.list();
      setOrgs(res.organizations);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load organizations"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isSuperAdmin) void load();
  }, [isSuperAdmin, load]);

  if (!user) return null;
  if (!isSuperAdmin) {
    return (
      <PageShell>
        <div className="p-8 text-center text-muted-foreground">
          Super admin access required.
        </div>
      </PageShell>
    );
  }

  const handleCreate = async () => {
    setSaving(true);
    setError(null);
    try {
      await organizationsApi.create({
        name: name.trim(),
        slug: slug.trim() || slugify(name),
        first_admin_email: firstAdminEmail.trim() || undefined,
      });
      setCreateOpen(false);
      setName("");
      setSlug("");
      setFirstAdminEmail("");
      await load();
      await refreshOrganizations();
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to create organization"));
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (org: OrganizationSummary) => {
    try {
      await organizationsApi.update(org.id, { is_active: !org.is_active });
      await load();
      await refreshOrganizations();
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to update organization"));
    }
  };

  return (
    <PageShell>
      <div className="space-y-4 p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Provision tenants, assign their first admin, and enter any
            organization&apos;s workspace.
          </p>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" /> New organization
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create organization</DialogTitle>
                <DialogDescription>
                  The new organization is seeded with default statuses,
                  stages, and pricing configuration.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="org-name">Name</Label>
                  <Input
                    id="org-name"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setSlug(slugify(e.target.value));
                    }}
                    placeholder="Acme Corp"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="org-slug">Slug</Label>
                  <Input
                    id="org-slug"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="acme-corp"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="org-admin-email">
                    First admin email (optional, existing user)
                  </Label>
                  <Input
                    id="org-admin-email"
                    type="email"
                    value={firstAdminEmail}
                    onChange={(e) => setFirstAdminEmail(e.target.value)}
                    placeholder="admin@acme.com"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={handleCreate}
                  disabled={saving || !name.trim()}
                >
                  {saving ? "Creating…" : "Create organization"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {error && (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {loading ? (
          <div className="p-8 text-center text-muted-foreground">
            Loading organizations…
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {orgs.map((org) => (
              <Card key={org.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Building2 className="h-4 w-4 opacity-60" />
                    <span className="truncate">{org.name}</span>
                    {!org.is_active && (
                      <Badge variant="secondary">inactive</Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    {org.slug}
                    {org.member_count != null &&
                      ` · ${org.member_count} member${
                        org.member_count === 1 ? "" : "s"
                      }`}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5"
                    onClick={() => switchOrg(org.id)}
                    disabled={!org.is_active}
                  >
                    <LogIn className="h-3.5 w-3.5" /> Enter
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleToggleActive(org)}
                  >
                    {org.is_active ? "Deactivate" : "Reactivate"}
                  </Button>
                </CardContent>
              </Card>
            ))}
            {orgs.length === 0 && (
              <div className="col-span-full p-8 text-center text-muted-foreground">
                No organizations yet.
              </div>
            )}
          </div>
        )}
      </div>
    </PageShell>
  );
}
