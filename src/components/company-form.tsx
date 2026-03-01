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
import { clientsApi, contactsApi, dealsApi, type Client, type CreateClientInput, type Contact, type Deal } from "@/lib/api";

interface CompanyFormProps {
  company?: Client;
  onSuccess: () => void;
  onCancel: () => void;
}

const INDUSTRY_OPTIONS = [
  "Technology",
  "Healthcare",
  "Finance",
  "Retail",
  "Manufacturing",
  "Education",
  "Real Estate",
  "Consulting",
  "Other",
];

const COMPANY_SIZE_OPTIONS = [
  "1-10",
  "11-50",
  "51-200",
  "201-500",
  "501-1000",
  "1000+",
];

export function CompanyForm({ company, onSuccess, onCancel }: CompanyFormProps) {
  const [loading, setLoading] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [formData, setFormData] = useState<CreateClientInput>({
    name: company?.name || "",
    company_name: company?.company_name || "",
    phone: company?.phone || "",
    website: company?.website || "",
    industry: company?.industry || "",
    company_size: company?.company_size || "",
    contacts_associated: company?.contacts_associated || [],
    deals_associated: company?.deals_associated || [],
  });

  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name || "",
        company_name: company.company_name || "",
        phone: company.phone || "",
        website: company.website || "",
        industry: company.industry || "",
        company_size: company.company_size || "",
        contacts_associated: company.contacts_associated || [],
        deals_associated: company.deals_associated || [],
      });
    }
  }, [company]);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [contactsRes, dealsRes] = await Promise.all([
          contactsApi.getAll({ limit: 1000 }),
          dealsApi.getAll({ limit: 1000 }),
        ]);
        setContacts(contactsRes.data);
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
    try {
      // Ensure name is set (backend requires it, use company_name if name is empty)
      const dataToSend: CreateClientInput = {
        name: formData.name || formData.company_name || "Company",
        company_name: formData.company_name || undefined,
        phone: formData.phone || undefined,
        website: formData.website || undefined,
        industry: formData.industry || undefined,
        company_size: formData.company_size || undefined,
        contacts_associated: formData.contacts_associated || [],
        deals_associated: formData.deals_associated || [],
      };
      
      // Remove undefined fields when creating (not updating)
      if (!company) {
        Object.keys(dataToSend).forEach(key => {
          if (dataToSend[key as keyof CreateClientInput] === undefined) {
            delete dataToSend[key as keyof CreateClientInput];
          }
        });
      }

      if (company) {
        await clientsApi.update(company.id, dataToSend);
      } else {
        await clientsApi.create(dataToSend);
      }
      onSuccess();
    } catch (error) {
      console.error("Error saving company:", error);
      alert("Failed to save company. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto">
      <div>
        <Label htmlFor="company_name">Company Name *</Label>
        <Input
          id="company_name"
          value={formData.company_name || ""}
          onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
          required
        />
      </div>

      <div>
        <Label htmlFor="name">Contact Name</Label>
        <Input
          id="name"
          value={formData.name || ""}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
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
          <Label htmlFor="website">Website</Label>
          <Input
            id="website"
            type="url"
            value={formData.website || ""}
            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
            placeholder="https://example.com"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="industry">Industry</Label>
          <Select
            value={formData.industry || ""}
            onValueChange={(value) => setFormData({ ...formData, industry: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select industry" />
            </SelectTrigger>
            <SelectContent>
              {INDUSTRY_OPTIONS.map((industry) => (
                <SelectItem key={industry} value={industry}>
                  {industry}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="company_size">Company Size</Label>
          <Select
            value={formData.company_size || ""}
            onValueChange={(value) => setFormData({ ...formData, company_size: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select size" />
            </SelectTrigger>
            <SelectContent>
              {COMPANY_SIZE_OPTIONS.map((size) => (
                <SelectItem key={size} value={size}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="contacts">Contacts Associated</Label>
        <Select
          value=""
          onValueChange={(value) => {
            const contactId = parseInt(value);
            if (!formData.contacts_associated?.includes(contactId)) {
              setFormData({
                ...formData,
                contacts_associated: [...(formData.contacts_associated || []), contactId],
              });
            }
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select contacts" />
          </SelectTrigger>
          <SelectContent>
            {contacts.map((contact) => (
              <SelectItem key={contact.id} value={contact.id.toString()}>
                {contact.first_name} {contact.last_name || ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {formData.contacts_associated && formData.contacts_associated.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {formData.contacts_associated.map((contactId) => {
              const contact = contacts.find((c) => c.id === contactId);
              return (
                <div
                  key={contactId}
                  className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm"
                >
                  <span>
                    {contact?.first_name} {contact?.last_name || ""}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        contacts_associated: formData.contacts_associated?.filter(
                          (id) => id !== contactId
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

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : company ? "Update" : "Create"}
        </Button>
      </div>
    </form>
  );
}
