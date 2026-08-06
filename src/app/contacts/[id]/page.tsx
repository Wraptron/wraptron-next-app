"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { contactsApi, type Contact } from "@/lib/api";
import { usePageTitle } from "@/contexts/page-title-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ContactActivities } from "@/components/contact-activities";
import { ContactFormSheet } from "@/components/contact-form-sheet";
import { ArrowLeft, Edit, Loader2, Mail, Phone } from "lucide-react";

const getStatusColor = (status?: string) => {
  const colors: Record<string, string> = {
    active: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
    inactive: "bg-muted text-muted-foreground",
    archived: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  };
  return (
    colors[status?.toLowerCase() || ""] || "bg-muted text-muted-foreground"
  );
};

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

function contactCompanyId(contact: Contact): number | null {
  return contact.company_id ?? contact.companies_associated?.[0] ?? null;
}

function contactCompanyName(contact: Contact): string | null {
  const name = contact.client_company_name || contact.company;
  return name?.trim() || null;
}

function CompanyLink({ contact }: { contact: Contact }) {
  const companyId = contactCompanyId(contact);
  const companyName = contactCompanyName(contact);
  if (!companyName) return null;

  if (companyId) {
    return (
      <Link
        href={`/sales/companies/${companyId}`}
        className="text-primary hover:underline"
      >
        {companyName}
      </Link>
    );
  }

  return <span>{companyName}</span>;
}

const telHref = (phone: string) =>
  `tel:${phone.replace(/[^\d+]/g, "") || phone.trim()}`;

export default function ContactDetailPage() {
  const params = useParams();
  const { setTitle } = usePageTitle();
  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editSheetOpen, setEditSheetOpen] = useState(false);

  const id = typeof params.id === "string" ? parseInt(params.id, 10) : NaN;

  const fetchContact = useCallback(() => {
    if (isNaN(id)) {
      setError("Invalid contact ID");
      setLoading(false);
      return;
    }
    contactsApi
      .getById(id)
      .then(setContact)
      .catch(() => setError("Failed to load contact"))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    fetchContact();
  }, [fetchContact]);

  useEffect(() => {
    if (contact) {
      const name = [contact.prefix, contact.first_name, contact.last_name]
        .filter(Boolean)
        .join(" ");
      setTitle(name || "Contact");
    }
    return () => setTitle(null);
  }, [contact, setTitle]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !contact) {
    return (
      <div className="min-h-screen bg-background p-4 text-foreground md:p-8">
        <div className="mx-auto max-w-2xl">
          <p className="text-destructive">{error || "Contact not found"}</p>
          <Button variant="outline" className="mt-4" asChild>
            <Link href="/sales/contacts">Back to Contacts</Link>
          </Button>
        </div>
      </div>
    );
  }

  const displayName =
    [contact.prefix, contact.first_name, contact.last_name]
      .filter(Boolean)
      .join(" ") || "Unnamed";
  const dial = (contact.mobile || contact.phone || "").trim();
  const mail = contact.email?.trim();

  return (
    <div className="min-h-screen bg-background p-4 text-foreground md:p-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/sales/contacts">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Contacts
            </Link>
          </Button>
          <div className="flex flex-wrap gap-2">
            {dial ? (
              <Button variant="outline" size="sm" asChild>
                <a href={telHref(dial)}>
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
              onClick={() => setEditSheetOpen(true)}
            >
              <Edit className="mr-1 h-4 w-4" />
              Edit
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="text-xl">{displayName}</CardTitle>
              <div className="flex items-center gap-2">
                <Badge className={getStatusColor(contact.status)}>
                  {contact.status || "N/A"}
                </Badge>
                {contact.is_primary && (
                  <Badge className="bg-primary/15 text-primary">Primary</Badge>
                )}
              </div>
            </div>
            {(contact.title || contact.job_title || contactCompanyName(contact)) && (
              <p className="mt-1 text-sm text-muted-foreground">
                {contact.title || contact.job_title ? (
                  <>
                    {contact.title || contact.job_title}
                    {contactCompanyName(contact) ? (
                      <>
                        {" · "}
                        <CompanyLink contact={contact} />
                      </>
                    ) : null}
                  </>
                ) : (
                  <CompanyLink contact={contact} />
                )}
              </p>
            )}
          </CardHeader>
          <CardContent className="space-y-1">
            <DetailRow label="Email" value={contact.email} />
            <DetailRow label="Phone" value={contact.phone} />
            <DetailRow label="Mobile" value={contact.mobile} />
            {contactCompanyName(contact) ? (
              <div className="flex justify-between gap-4 border-b border-border py-2 last:border-0">
                <span className="text-sm text-muted-foreground">Company</span>
                <span className="max-w-[60%] text-right text-sm font-medium">
                  <CompanyLink contact={contact} />
                </span>
              </div>
            ) : null}
            <DetailRow label="Address" value={contact.address} />
            <DetailRow label="City" value={contact.city} />
            <DetailRow label="State" value={contact.state} />
            <DetailRow label="Country" value={contact.country} />
            <DetailRow label="Postal code" value={contact.postal_code} />
            <DetailRow label="LinkedIn" value={contact.linkedin_url} />
            <DetailRow label="Timezone" value={contact.timezone} />
            <DetailRow label="Birthday" value={contact.birthday} />
            <DetailRow label="Anniversary" value={contact.anniversary_date} />
            <DetailRow label="Notes" value={contact.notes} />
          </CardContent>
        </Card>

        <ContactActivities contact={contact} />

        <ContactFormSheet
          open={editSheetOpen}
          onOpenChange={setEditSheetOpen}
          onSuccess={() => {
            setEditSheetOpen(false);
            fetchContact();
          }}
          contact={contact}
        />
      </div>
    </div>
  );
}
