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
import { dealsApi, contactsApi, clientsApi, type Deal, type CreateDealInput, type Contact, type Client } from "@/lib/api";
import { useCurrency } from "@/contexts/currency-context";

interface DealFormProps {
  deal?: Deal;
  onSuccess: () => void;
  onCancel: () => void;
}

const DEAL_STAGES = [
  "lead",
  "qualified",
  "proposal",
  "negotiation",
  "won",
  "lost",
];

const CURRENCIES = ["USD", "EUR", "GBP", "INR", "JPY", "CAD", "AUD"];

export function DealForm({ deal, onSuccess, onCancel }: DealFormProps) {
  const { currency: defaultCurrency } = useCurrency();
  const [loading, setLoading] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [companies, setCompanies] = useState<Client[]>([]);
  const [formData, setFormData] = useState<CreateDealInput>({
    title: deal?.title || "",
    stage: deal?.stage || "lead",
    expected_close_date: deal?.expected_close_date || "",
    value: deal?.value || undefined,
    currency: deal?.currency || defaultCurrency,
    contacts_associated: deal?.contacts_associated || [],
    companies_associated: deal?.companies_associated || [],
  });

  useEffect(() => {
    if (deal) {
      setFormData({
        title: deal.title || "",
        stage: deal.stage || "lead",
        expected_close_date: deal.expected_close_date || "",
        value: deal.value || undefined,
        currency: deal.currency || defaultCurrency,
        contacts_associated: deal.contacts_associated || [],
        companies_associated: deal.companies_associated || [],
      });
    }
  }, [deal, defaultCurrency]);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [contactsRes, companiesRes] = await Promise.all([
          contactsApi.getAll({ limit: 1000 }),
          clientsApi.getAll({ limit: 1000 }),
        ]);
        setContacts(contactsRes.data);
        setCompanies(companiesRes.data);
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
      const dataToSend: CreateDealInput = {
        title: formData.title,
        stage: formData.stage || "lead",
        currency: formData.currency || defaultCurrency,
        expected_close_date: formData.expected_close_date || undefined,
        value: formData.value || undefined,
        contacts_associated: formData.contacts_associated || [],
        companies_associated: formData.companies_associated || [],
      };
      
      // Remove undefined fields when creating (not updating)
      if (!deal) {
        Object.keys(dataToSend).forEach(key => {
          if (dataToSend[key as keyof CreateDealInput] === undefined) {
            delete dataToSend[key as keyof CreateDealInput];
          }
        });
      }

      if (deal) {
        await dealsApi.update(deal.id, dataToSend);
      } else {
        await dealsApi.create(dataToSend);
      }
      onSuccess();
    } catch (error) {
      console.error("Error saving deal:", error);
      alert("Failed to save deal. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto">
      <div>
        <Label htmlFor="title">Deal Name *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="stage">Deal Stage</Label>
          <Select
            value={formData.stage || "lead"}
            onValueChange={(value) => setFormData({ ...formData, stage: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DEAL_STAGES.map((stage) => (
                <SelectItem key={stage} value={stage}>
                  {stage.charAt(0).toUpperCase() + stage.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="close_date">Close Date</Label>
          <Input
            id="close_date"
            type="date"
            value={formData.expected_close_date || ""}
            onChange={(e) => setFormData({ ...formData, expected_close_date: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="amount">Amount</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            value={formData.value || ""}
            onChange={(e) =>
              setFormData({ ...formData, value: e.target.value ? parseFloat(e.target.value) : undefined })
            }
          />
        </div>
        <div>
          <Label htmlFor="currency">Currency</Label>
          <Select
            value={formData.currency || "USD"}
            onValueChange={(value) => setFormData({ ...formData, currency: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((currency) => (
                <SelectItem key={currency} value={currency}>
                  {currency}
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
              <SelectItem key={company.id} value={company.id.toString()}>
                {company.company_name || company.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {formData.companies_associated && formData.companies_associated.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {formData.companies_associated.map((companyId) => {
              const company = companies.find((c) => c.id === companyId);
              return (
                <div
                  key={companyId}
                  className="flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded text-sm"
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
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : deal ? "Update" : "Create"}
        </Button>
      </div>
    </form>
  );
}
