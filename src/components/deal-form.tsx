"use client";

import React, { useState, useEffect, useMemo } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Plus } from "lucide-react";
import {
  dealsApi,
  contactsApi,
  clientsApi,
  salesStagesApi,
  type Deal,
  type CreateDealInput,
  type CreateContactInput,
  type Contact,
  type Client,
  type SalesStage,
} from "@/lib/api";
import { useCurrency } from "@/contexts/currency-context";

interface DealFormProps {
  deal?: Deal;
  onSuccess: () => void;
  onCancel: () => void;
}

/** Fallback when /api/sales-stages is empty or fails (matches deal-form-sheet defaults). */
const FALLBACK_STAGE_NAMES = [
  "New Lead",
  "Qualified",
  "Requirement gathered",
  "Solution proposed",
  "Negotiation/Objection handling",
  "Proposal Accepted",
  "Project Implementation",
  "Maintenance - Project Delivered",
];

const CURRENCIES = ["USD", "EUR", "GBP", "INR", "JPY", "CAD", "AUD"];
const CREATE_NEW_CONTACT_VALUE = "__create_new_contact__";

export function DealForm({ deal, onSuccess, onCancel }: DealFormProps) {
  const { currency: defaultCurrency } = useCurrency();
  const [loading, setLoading] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [companies, setCompanies] = useState<Client[]>([]);
  const [salesStages, setSalesStages] = useState<SalesStage[]>([]);
  const [createContactOpen, setCreateContactOpen] = useState(false);
  const [createContactLoading, setCreateContactLoading] = useState(false);
  const [newContact, setNewContact] = useState({
    first_name: "",
    last_name: "",
    email: "",
  });

  const stagesSorted = useMemo(() => {
    return [...salesStages].sort((a, b) => {
      if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
      return a.id - b.id;
    });
  }, [salesStages]);

  const stageNames =
    stagesSorted.length > 0
      ? stagesSorted.map((s) => s.name)
      : FALLBACK_STAGE_NAMES;

  const [formData, setFormData] = useState<CreateDealInput>({
    title: deal?.title || "",
    stage: deal?.stage || FALLBACK_STAGE_NAMES[0],
    expected_close_date: deal?.expected_close_date || "",
    value: deal?.value || undefined,
    currency: deal?.currency || defaultCurrency,
    contacts_associated: deal?.contacts_associated || [],
    companies_associated: deal?.companies_associated || [],
  });

  const defaultStage = stagesSorted[0]?.name ?? FALLBACK_STAGE_NAMES[0];

  const stageSelectOptions = useMemo(() => {
    const s = formData.stage;
    if (s && !stageNames.includes(s)) {
      return [...stageNames, s];
    }
    return stageNames;
  }, [stageNames, formData.stage]);

  useEffect(() => {
    if (deal) {
      setFormData({
        title: deal.title || "",
        stage: deal.stage || FALLBACK_STAGE_NAMES[0],
        expected_close_date: deal.expected_close_date || "",
        value: deal.value || undefined,
        currency: deal.currency || defaultCurrency,
        contacts_associated: deal.contacts_associated || [],
        companies_associated: deal.companies_associated || [],
      });
    }
  }, [deal, defaultCurrency]);

  useEffect(() => {
    if (deal) return;
    if (stagesSorted.length === 0) return;
    const first = stagesSorted[0].name;
    setFormData((prev) => {
      const s = prev.stage ?? "";
      const onlyGenericDefault =
        s === "" || s === "lead" || s === FALLBACK_STAGE_NAMES[0];
      if (!onlyGenericDefault) return prev;
      return { ...prev, stage: first };
    });
  }, [deal, stagesSorted]);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [contactsRes, companiesRes, stagesRes] = await Promise.all([
          contactsApi.getAll({ limit: 1000 }),
          clientsApi.getAll({ limit: 1000 }),
          salesStagesApi.getAll(),
        ]);
        setContacts(contactsRes.data);
        setCompanies(companiesRes.data);
        setSalesStages(stagesRes.data ?? []);
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
        stage: formData.stage || defaultStage,
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

  const handleCreateContact = async () => {
    const first = newContact.first_name.trim();
    if (!first) {
      alert("First name is required.");
      return;
    }
    setCreateContactLoading(true);
    try {
      const payload: CreateContactInput = {
        first_name: first,
        last_name: newContact.last_name.trim() || undefined,
        email: newContact.email.trim() || undefined,
      };
      const created = await contactsApi.create(payload);
      setContacts((prev) => [created, ...prev]);
      if (!formData.contacts_associated?.includes(created.id)) {
        setFormData((prev) => ({
          ...prev,
          contacts_associated: [...(prev.contacts_associated || []), created.id],
        }));
      }
      setNewContact({ first_name: "", last_name: "", email: "" });
      setCreateContactOpen(false);
    } catch (error) {
      console.error("Error creating contact:", error);
      alert("Failed to create contact. Please try again.");
    } finally {
      setCreateContactLoading(false);
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
            value={formData.stage || defaultStage}
            onValueChange={(value) => setFormData({ ...formData, stage: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {stageSelectOptions.map((stage) => (
                <SelectItem key={stage} value={stage}>
                  {stage}
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
            if (value === CREATE_NEW_CONTACT_VALUE) {
              setCreateContactOpen(true);
              return;
            }
            const contactId = parseInt(value);
            if (Number.isNaN(contactId)) return;
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
            <SelectItem value={CREATE_NEW_CONTACT_VALUE}>
              <span className="flex items-center gap-2 text-primary">
                <Plus className="h-4 w-4" />
                Create new contact
              </span>
            </SelectItem>
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

      <Dialog open={createContactOpen} onOpenChange={setCreateContactOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>New contact</DialogTitle>
            <DialogDescription>Add a contact. First name is required.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-contact-first">First name *</Label>
              <Input
                id="new-contact-first"
                value={newContact.first_name}
                onChange={(e) => setNewContact((prev) => ({ ...prev, first_name: e.target.value }))}
                placeholder="First name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-contact-last">Last name</Label>
              <Input
                id="new-contact-last"
                value={newContact.last_name}
                onChange={(e) => setNewContact((prev) => ({ ...prev, last_name: e.target.value }))}
                placeholder="Last name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-contact-email">Email</Label>
              <Input
                id="new-contact-email"
                type="email"
                value={newContact.email}
                onChange={(e) => setNewContact((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="email@example.com"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setCreateContactOpen(false)}
              disabled={createContactLoading}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleCreateContact} disabled={createContactLoading}>
              {createContactLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
