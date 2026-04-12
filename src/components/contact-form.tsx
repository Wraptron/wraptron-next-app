"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { contactsApi, companiesApi, dealsApi, type Contact, type CreateContactInput, type Company, type Deal } from "@/lib/api";

interface ContactFormProps {
  contact?: Contact;
  onSuccess: () => void;
  onCancel: () => void;
  /** When true, do not render Cancel/Submit (e.g. when used inside a sheet with its own footer) */
  hideActions?: boolean;
  /** Form id for external submit button (e.g. sheet footer) */
  formId?: string;
  /** Called when loading state changes (for sheet footer spinner) */
  onLoadingChange?: (loading: boolean) => void;
}

const PREFIX_OPTIONS = ["Mr.", "Mrs.", "Ms.", "Dr.", "Prof."];
const TIMEZONE_OPTIONS = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Australia/Sydney",
];

export function ContactForm({ contact, onSuccess, onCancel, hideActions, formId, onLoadingChange }: ContactFormProps) {
  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [formData, setFormData] = useState<CreateContactInput>({
    prefix: contact?.prefix || "",
    first_name: contact?.first_name || "",
    last_name: contact?.last_name || "",
    title: contact?.title || "",
    email: contact?.email || "",
    phone: contact?.phone || "",
    country: contact?.country || "",
    linkedin_url: contact?.linkedin_url || "",
    instagram: contact?.instagram || "",
    timezone: contact?.timezone || "",
    birthday: contact?.birthday || "",
    anniversary_date: contact?.anniversary_date || "",
    companies_associated: contact?.companies_associated || [],
    deals_associated: contact?.deals_associated || [],
  });

  useEffect(() => {
    if (contact) {
      setFormData({
        prefix: contact.prefix || "",
        first_name: contact.first_name || "",
        last_name: contact.last_name || "",
        title: contact.title || "",
        email: contact.email || "",
        phone: contact.phone || "",
        country: contact.country || "",
        linkedin_url: contact.linkedin_url || "",
        instagram: contact.instagram || "",
        timezone: contact.timezone || "",
        birthday: contact.birthday || "",
        anniversary_date: contact.anniversary_date || "",
        companies_associated: contact.companies_associated || [],
        deals_associated: contact.deals_associated || [],
      });
    }
  }, [contact]);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [companiesRes, dealsRes] = await Promise.all([
          companiesApi.getAll({ limit: 1000 }),
          dealsApi.getAll({ limit: 1000 }),
        ]);
        setCompanies(companiesRes.data);
        setDeals(dealsRes.data);
      } catch (error) {
        console.error("Error fetching options:", error);
      }
    };
    fetchOptions();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    onLoadingChange?.(true);
    try {
      // Prepare data - convert empty strings to null/undefined appropriately
      const dataToSend: CreateContactInput = {
        first_name: formData.first_name,
        prefix: formData.prefix || undefined,
        last_name: formData.last_name || undefined,
        title: formData.title || undefined,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        country: formData.country || undefined,
        linkedin_url: formData.linkedin_url || undefined,
        instagram: formData.instagram || undefined,
        timezone: formData.timezone || undefined,
        birthday: formData.birthday || undefined,
        anniversary_date: formData.anniversary_date || undefined,
        companies_associated: formData.companies_associated || [],
        deals_associated: formData.deals_associated || [],
      };
      
      // Remove undefined fields when creating (not updating)
      if (!contact) {
        Object.keys(dataToSend).forEach(key => {
          if (dataToSend[key as keyof CreateContactInput] === undefined) {
            delete dataToSend[key as keyof CreateContactInput];
          }
        });
      }

      if (contact) {
        await contactsApi.update(contact.id, dataToSend);
      } else {
        await contactsApi.create(dataToSend);
      }
      onSuccess();
    } catch (error) {
      console.error("Error saving contact:", error);
      alert("Failed to save contact. Please try again.");
    } finally {
      setLoading(false);
      onLoadingChange?.(false);
    }
  };

  return (
    <form
      id={formId}
      onSubmit={handleSubmit}
      className={hideActions ? "space-y-4" : "space-y-4 max-h-[80vh] overflow-y-auto"}
    >
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="prefix">Prefix</Label>
          <Select
            value={formData.prefix || ""}
            onValueChange={(value) => setFormData({ ...formData, prefix: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select prefix" />
            </SelectTrigger>
            <SelectContent>
              {PREFIX_OPTIONS.map((prefix) => (
                <SelectItem key={prefix} value={prefix}>
                  {prefix}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="first_name">First Name *</Label>
          <Input
            id="first_name"
            value={formData.first_name}
            onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="last_name">Last Name</Label>
          <Input
            id="last_name"
            value={formData.last_name || ""}
            onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={formData.title || ""}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone || ""}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email || ""}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="companies">Companies Associated</Label>
        <Select
          value=""
          onValueChange={(value) => {
            const companyId = parseInt(value);
            if (!formData.companies_associated?.includes(companyId)) {
              setFormData({
                ...formData,
                companies_associated: [...(formData.companies_associated || []), companyId],
              });
            }
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select companies" />
          </SelectTrigger>
          <SelectContent>
            {companies.map((company) => (
              <SelectItem key={company.company_id} value={company.company_id.toString()}>
                {company.company_name || company.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {formData.companies_associated && formData.companies_associated.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {formData.companies_associated.map((companyId) => {
              const company = companies.find((c) => c.company_id === companyId);
              return (
                <div
                  key={companyId}
                  className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm"
                >
                  <span>{company?.company_name || company?.name}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        companies_associated: formData.companies_associated?.filter(
                          (id) => id !== companyId
                        ),
                      });
                    }}
                    className="ml-1 hover:text-blue-600"
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <Label htmlFor="country">Country</Label>
        <Input
          id="country"
          value={formData.country || ""}
          onChange={(e) => setFormData({ ...formData, country: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="linkedin">LinkedIn</Label>
          <Input
            id="linkedin"
            value={formData.linkedin_url || ""}
            onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
            placeholder="https://linkedin.com/in/..."
          />
        </div>
        <div>
          <Label htmlFor="instagram">Instagram</Label>
          <Input
            id="instagram"
            value={formData.instagram || ""}
            onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
            placeholder="@username"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="timezone">Timezone</Label>
        <Select
          value={formData.timezone || ""}
          onValueChange={(value) => setFormData({ ...formData, timezone: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select timezone" />
          </SelectTrigger>
          <SelectContent>
            {TIMEZONE_OPTIONS.map((tz) => (
              <SelectItem key={tz} value={tz}>
                {tz}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="birthday">Date of Birth</Label>
          <Input
            id="birthday"
            type="date"
            value={formData.birthday || ""}
            onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="anniversary">Date of Anniversary</Label>
          <Input
            id="anniversary"
            type="date"
            value={formData.anniversary_date || ""}
            onChange={(e) => setFormData({ ...formData, anniversary_date: e.target.value })}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="deals">Deals Associated</Label>
        <Select
          value=""
          onValueChange={(value) => {
            const dealId = parseInt(value);
            if (!formData.deals_associated?.includes(dealId)) {
              setFormData({
                ...formData,
                deals_associated: [...(formData.deals_associated || []), dealId],
              });
            }
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select deals" />
          </SelectTrigger>
          <SelectContent>
            {deals.map((deal) => (
              <SelectItem key={deal.id} value={deal.id.toString()}>
                {deal.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {formData.deals_associated && formData.deals_associated.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {formData.deals_associated.map((dealId) => {
              const deal = deals.find((d) => d.id === dealId);
              return (
                <div
                  key={dealId}
                  className="flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded text-sm"
                >
                  <span>{deal?.title}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        deals_associated: formData.deals_associated?.filter((id) => id !== dealId),
                      });
                    }}
                    className="ml-1 hover:text-green-600"
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {!hideActions && (
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : contact ? "Update" : "Create"}
          </Button>
        </div>
      )}
    </form>
  );
}
