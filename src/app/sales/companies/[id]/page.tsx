"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { companiesApi, contactsApi, type Company, type Contact } from "@/lib/api";
import { usePageTitle } from "@/contexts/page-title-context";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CompanyForm } from "@/components/company-form";
import { ArrowLeft, Edit, Loader2, Mail, Phone } from "lucide-react";
import { statusBadgeClass } from "@/lib/status-colors";

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  if (value == null || value === "") return null;
  return (
    <div className="flex justify-between gap-4 border-b border-border py-2 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="max-w-[60%] text-right text-sm font-medium">
        {value}
      </span>
    </div>
  );
}

const telHref = (phone: string) =>
  `tel:${phone.replace(/[^\d+]/g, "") || phone.trim()}`;

const contactDisplayName = (contact: Contact) =>
  [contact.prefix, contact.first_name, contact.last_name]
    .filter(Boolean)
    .join(" ")
    .trim() || contact.email || "Unnamed contact";

async function fetchLinkedContacts(company: Company): Promise<Contact[]> {
  const associatedIds = company.contacts_associated ?? [];
  const [byCompanyRes, ...fromIds] = await Promise.all([
    contactsApi.getAll({ company_id: company.company_id, limit: 500 }),
    ...associatedIds.map((contactId) =>
      contactsApi.getById(contactId).catch(() => null),
    ),
  ]);

  const byId = new Map<number, Contact>();
  for (const contact of byCompanyRes.data) {
    byId.set(contact.id, contact);
  }
  for (const contact of fromIds) {
    if (contact) byId.set(contact.id, contact);
  }

  return Array.from(byId.values()).sort((a, b) =>
    contactDisplayName(a).localeCompare(contactDisplayName(b)),
  );
}

export default function CompanyDetailPage() {
  const params = useParams();
  const { setTitle } = usePageTitle();
  const [company, setCompany] = useState<Company | null>(null);
  const [linkedContacts, setLinkedContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const id =
    typeof params.id === "string" ? parseInt(params.id, 10) : NaN;

  const fetchCompany = useCallback(() => {
    if (isNaN(id)) {
      setError("Invalid company ID");
      setLoading(false);
      return;
    }
    companiesApi
      .getById(id)
      .then(setCompany)
      .catch(() => setError("Failed to load company"))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    fetchCompany();
  }, [fetchCompany]);

  useEffect(() => {
    if (!company) return;

    let cancelled = false;
    setContactsLoading(true);
    fetchLinkedContacts(company)
      .then((contacts) => {
        if (!cancelled) setLinkedContacts(contacts);
      })
      .catch(() => {
        if (!cancelled) setLinkedContacts([]);
      })
      .finally(() => {
        if (!cancelled) setContactsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [company]);

  useEffect(() => {
    if (company) {
      setTitle(company.name || company.company_name || "Company");
    }
    return () => setTitle(null);
  }, [company, setTitle]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="min-h-screen bg-background p-4 text-foreground md:p-8">
        <div className="mx-auto max-w-2xl">
          <p className="text-destructive">{error || "Company not found"}</p>
          <Button variant="outline" className="mt-4" asChild>
            <Link href="/sales/companies">Back to Companies</Link>
          </Button>
        </div>
      </div>
    );
  }

  const displayName = company.name || company.company_name || "Unnamed";
  const phone = company.phone?.trim();
  const mail = company.email?.trim();

  return (
    <div className="min-h-screen bg-background p-4 text-foreground md:p-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/sales/companies">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Companies
            </Link>
          </Button>
          <div className="flex flex-wrap gap-2">
            {phone ? (
              <Button variant="outline" size="sm" asChild>
                <a href={telHref(phone)}>
                  <Phone className="mr-1 h-4 w-4" />
                  Call
                </a>
              </Button>
            ) : null}
            {mail ? (
              <Button variant="outline" size="sm" asChild>
                <a href={`mailto:${mail}`}>
                  <Mail className="mr-1 h-4 w-4" />
                  Email
                </a>
              </Button>
            ) : null}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditDialogOpen(true)}
            >
              <Edit className="mr-1 h-4 w-4" />
              Edit
            </Button>
          </div>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-4"
        >
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="contacts">
              Contacts
              {linkedContacts.length > 0 ? (
                <span className="ml-1.5 text-xs text-muted-foreground">
                  ({linkedContacts.length})
                </span>
              ) : null}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle className="text-xl">{displayName}</CardTitle>
                  <Badge className={statusBadgeClass(company.status)}>
                    {company.status || "N/A"}
                  </Badge>
                </div>
                {company.industry && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {company.industry}
                  </p>
                )}
              </CardHeader>
              <CardContent className="space-y-1">
                <DetailRow label="Display name" value={company.name} />
                <DetailRow label="Legal name" value={company.company_name} />
                <DetailRow label="Email" value={company.email} />
                <DetailRow label="Phone" value={company.phone} />
                <DetailRow label="Website" value={company.website} />
                <DetailRow label="Industry" value={company.industry} />
                <DetailRow label="Company size" value={company.company_size} />
                <DetailRow label="Address" value={company.address} />
                <DetailRow label="City" value={company.city} />
                <DetailRow label="State" value={company.state} />
                <DetailRow label="Country" value={company.country} />
                <DetailRow label="Postal code" value={company.postal_code} />
                <DetailRow label="Notes" value={company.notes} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contacts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Linked contacts</CardTitle>
              </CardHeader>
              <CardContent>
                {contactsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : linkedContacts.length === 0 ? (
                  <p className="py-4 text-sm text-muted-foreground">
                    No contacts linked to this company yet.
                  </p>
                ) : (
                  <ul className="divide-y divide-border">
                    {linkedContacts.map((contact) => (
                      <li key={contact.id}>
                        <Link
                          href={`/contacts/${contact.id}`}
                          className="flex flex-wrap items-center justify-between gap-3 py-3 transition-colors hover:bg-muted/40 -mx-2 px-2 rounded-md"
                        >
                          <div className="min-w-0">
                            <p className="font-medium text-foreground">
                              {contactDisplayName(contact)}
                            </p>
                            {contact.title || contact.job_title ? (
                              <p className="text-sm text-muted-foreground">
                                {contact.title || contact.job_title}
                              </p>
                            ) : null}
                          </div>
                          <div className="text-right text-sm text-muted-foreground">
                            {contact.email ? (
                              <p>{contact.email}</p>
                            ) : null}
                            {contact.phone || contact.mobile ? (
                              <p>{contact.phone || contact.mobile}</p>
                            ) : null}
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Company</DialogTitle>
            </DialogHeader>
            <CompanyForm
              company={company}
              onSuccess={() => {
                setEditDialogOpen(false);
                fetchCompany();
              }}
              onCancel={() => setEditDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
