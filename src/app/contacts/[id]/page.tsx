"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { contactsApi, type Contact } from "@/lib/api";
import { usePageTitle } from "@/contexts/page-title-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, Loader2 } from "lucide-react";

const getStatusColor = (status?: string) => {
  const colors: Record<string, string> = {
    active: "bg-green-100 text-green-800",
    inactive: "bg-gray-100 text-gray-800",
    archived: "bg-red-100 text-red-800",
  };
  return colors[status?.toLowerCase() || ""] || "bg-gray-100 text-gray-800";
};

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  if (value == null || value === "") return null;
  return (
    <div className="flex justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-gray-500 text-sm">{label}</span>
      <span className="text-sm font-medium text-right max-w-[60%]">{value}</span>
    </div>
  );
}

export default function ContactDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { setTitle } = usePageTitle();
  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const id = typeof params.id === "string" ? parseInt(params.id, 10) : NaN;

  useEffect(() => {
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
    if (contact) {
      const name = [contact.prefix, contact.first_name, contact.last_name].filter(Boolean).join(" ");
      setTitle(name || "Contact");
    }
    return () => setTitle(null);
  }, [contact, setTitle]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error || !contact) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          <p className="text-red-600">{error || "Contact not found"}</p>
          <Button variant="outline" className="mt-4" asChild>
            <Link href="/contacts">Back to Contacts</Link>
          </Button>
        </div>
      </div>
    );
  }

  const displayName = [contact.prefix, contact.first_name, contact.last_name].filter(Boolean).join(" ") || "Unnamed";

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link href="/contacts">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Contacts
            </Button>
          </Link>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/contacts?edit=${contact.id}`}>
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="text-xl">
                {displayName}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge className={getStatusColor(contact.status)}>
                  {contact.status || "N/A"}
                </Badge>
                {contact.is_primary && (
                  <Badge className="bg-blue-100 text-blue-800">Primary</Badge>
                )}
              </div>
            </div>
            {(contact.job_title || contact.company) && (
              <p className="text-sm text-gray-600 mt-1">
                {[contact.job_title, contact.company].filter(Boolean).join(" · ")}
              </p>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <DetailRow label="Email" value={contact.email} />
            <DetailRow label="Phone" value={contact.phone} />
            <DetailRow label="Mobile" value={contact.mobile} />
            <DetailRow label="Company" value={contact.company || contact.client_company_name} />
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
      </div>
    </div>
  );
}
