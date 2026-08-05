"use client";

import React, { useState, useEffect } from "react";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { ChevronsUpDown, Loader2 } from "lucide-react";
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

const ASSOCIATION_LIST_LIMIT = 2000;
const ASSOCIATION_LIST_PARAMS = {
  limit: ASSOCIATION_LIST_LIMIT,
  include_associations: false,
} as const;

function companyDisplayName(company: Company) {
  return (company.company_name || company.name || `Company #${company.company_id}`).trim();
}

function dealDisplayName(deal: Deal) {
  return (deal.title || `Deal #${deal.id}`).trim();
}

export function ContactForm({ contact, onSuccess, onCancel, hideActions, formId, onLoadingChange }: ContactFormProps) {
  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [companiesOpen, setCompaniesOpen] = useState(false);
  const [dealsOpen, setDealsOpen] = useState(false);
  const [errors, setErrors] = useState<{ first_name?: string; phone?: string }>({});
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
    let cancelled = false;
    const fetchOptions = async () => {
      setOptionsLoading(true);
      try {
        const [companiesRes, dealsRes] = await Promise.all([
          companiesApi.getAll(ASSOCIATION_LIST_PARAMS),
          dealsApi.getAll(ASSOCIATION_LIST_PARAMS),
        ]);
        if (cancelled) return;
        setCompanies(
          [...(companiesRes.data ?? [])].sort((a, b) =>
            companyDisplayName(a).localeCompare(companyDisplayName(b)),
          ),
        );
        setDeals(
          [...(dealsRes.data ?? [])].sort((a, b) =>
            dealDisplayName(a).localeCompare(dealDisplayName(b)),
          ),
        );
      } catch (error) {
        console.error("Error fetching options:", error);
      } finally {
        if (!cancelled) setOptionsLoading(false);
      }
    };
    fetchOptions();
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleCompany = (companyId: number) => {
    setFormData((prev) => {
      const current = prev.companies_associated || [];
      const exists = current.includes(companyId);
      return {
        ...prev,
        companies_associated: exists
          ? current.filter((id) => id !== companyId)
          : [...current, companyId],
      };
    });
  };

  const toggleDeal = (dealId: number) => {
    setFormData((prev) => {
      const current = prev.deals_associated || [];
      const exists = current.includes(dealId);
      return {
        ...prev,
        deals_associated: exists
          ? current.filter((id) => id !== dealId)
          : [...current, dealId],
      };
    });
  };

  const selectedCompanies = companies.filter((c) =>
    formData.companies_associated?.includes(c.company_id),
  );
  const selectedDeals = deals.filter((d) =>
    formData.deals_associated?.includes(d.id),
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const nextErrors: { first_name?: string; phone?: string } = {};
    if (!formData.first_name?.trim()) {
      nextErrors.first_name = "First name is required";
    }
    if (!formData.phone?.trim()) {
      nextErrors.phone = "Phone is required";
    }
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});

    setLoading(true);
    onLoadingChange?.(true);
    try {
      // Prepare data - convert empty strings to null/undefined appropriately
      const dataToSend: CreateContactInput = {
        first_name: formData.first_name.trim(),
        prefix: formData.prefix || undefined,
        last_name: formData.last_name || undefined,
        title: formData.title || undefined,
        email: formData.email || undefined,
        phone: formData.phone?.trim() || undefined,
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
      noValidate
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
            onChange={(e) => {
              setFormData({ ...formData, first_name: e.target.value });
              if (errors.first_name) {
                setErrors((prev) => ({ ...prev, first_name: undefined }));
              }
            }}
            aria-invalid={!!errors.first_name}
            aria-describedby={errors.first_name ? "first_name-error" : undefined}
            required
          />
          {errors.first_name && (
            <p id="first_name-error" className="mt-1 text-sm text-destructive" role="alert">
              {errors.first_name}
            </p>
          )}
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
          <Label htmlFor="phone">Phone *</Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone || ""}
            onChange={(e) => {
              setFormData({ ...formData, phone: e.target.value });
              if (errors.phone) {
                setErrors((prev) => ({ ...prev, phone: undefined }));
              }
            }}
            aria-invalid={!!errors.phone}
            aria-describedby={errors.phone ? "phone-error" : undefined}
            required
          />
          {errors.phone && (
            <p id="phone-error" className="mt-1 text-sm text-destructive" role="alert">
              {errors.phone}
            </p>
          )}
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

      <div className="space-y-2">
        <Label>Companies Associated</Label>
        <Popover open={companiesOpen} onOpenChange={setCompaniesOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="w-full justify-between font-normal text-left"
            >
              {optionsLoading
                ? "Loading companies..."
                : selectedCompanies.length > 0
                  ? `${selectedCompanies.length} compan${selectedCompanies.length === 1 ? "y" : "ies"} selected`
                  : companies.length > 0
                    ? `Select companies (${companies.length})`
                    : "No companies available"}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
            <Command>
              <CommandInput placeholder="Search companies..." />
              <CommandList className="max-h-[320px]">
                <CommandEmpty>
                  {optionsLoading ? "Loading..." : "No company found."}
                </CommandEmpty>
                <CommandGroup>
                  {companies.map((company) => {
                    const label = companyDisplayName(company);
                    const selected = formData.companies_associated?.includes(
                      company.company_id,
                    );
                    return (
                      <CommandItem
                        key={company.company_id}
                        value={`${label} ${company.company_id}`}
                        onSelect={() => toggleCompany(company.company_id)}
                      >
                        <span className="mr-2 w-4 shrink-0">{selected ? "✓" : ""}</span>
                        <span className="truncate">{label}</span>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        {selectedCompanies.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {selectedCompanies.map((company) => (
              <div
                key={company.company_id}
                className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm"
              >
                <span>{companyDisplayName(company)}</span>
                <button
                  type="button"
                  onClick={() => toggleCompany(company.company_id)}
                  className="ml-1 hover:text-blue-600"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <Label htmlFor="country">Destination</Label>
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

      <div className="space-y-2">
        <Label>Deals Associated</Label>
        <Popover open={dealsOpen} onOpenChange={setDealsOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="w-full justify-between font-normal text-left"
            >
              {optionsLoading
                ? "Loading deals..."
                : selectedDeals.length > 0
                  ? `${selectedDeals.length} deal${selectedDeals.length === 1 ? "" : "s"} selected`
                  : deals.length > 0
                    ? `Select deals (${deals.length})`
                    : "No deals available"}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
            <Command>
              <CommandInput placeholder="Search deals..." />
              <CommandList className="max-h-[320px]">
                <CommandEmpty>
                  {optionsLoading ? "Loading..." : "No deal found."}
                </CommandEmpty>
                <CommandGroup>
                  {deals.map((deal) => {
                    const label = dealDisplayName(deal);
                    const selected = formData.deals_associated?.includes(deal.id);
                    return (
                      <CommandItem
                        key={deal.id}
                        value={`${label} ${deal.id}`}
                        onSelect={() => toggleDeal(deal.id)}
                      >
                        <span className="mr-2 w-4 shrink-0">{selected ? "✓" : ""}</span>
                        <span className="truncate">{label}</span>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        {selectedDeals.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {selectedDeals.map((deal) => (
              <div
                key={deal.id}
                className="flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded text-sm"
              >
                <span>{dealDisplayName(deal)}</span>
                <button
                  type="button"
                  onClick={() => toggleDeal(deal.id)}
                  className="ml-1 hover:text-green-600"
                >
                  ×
                </button>
              </div>
            ))}
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
