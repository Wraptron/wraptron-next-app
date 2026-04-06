"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useSheetPush } from "@/contexts/sheet-push-context";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2, ChevronsUpDown, Plus, X } from "lucide-react";
import { dealsApi, contactsApi, clientsApi, salesStagesApi, type Deal, type CreateDealInput, type CreateContactInput, type CreateClientInput, type Contact, type Client, type SalesStage } from "@/lib/api";
import { useCurrency } from "@/contexts/currency-context";

const DEFAULT_DEAL_STAGES = [
  "New Lead",
  "Qualified",
  "Requirement gathered",
  "Solution proposed",
  "Negotiation/Objection handling",
  "Proposal Accepted",
  "Project Implementation",
  "Maintenance - Project Delivered",
];

const MAIN_CONTENT_PORTAL_ID = "main-content-portal";
const DEAL_FORM_ID = "deal-form-sheet-form";

export interface DealFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  deal?: Deal | null;
}

const initialFormState = {
  title: "" as string,
  stage: "New Lead" as string,
  contact_ids: [] as number[],
  client_id: null as number | null,
  value: "" as string,
  expected_close_date: "" as string,
  description: "" as string,
};

export function DealFormSheet({
  open,
  onOpenChange,
  onSuccess,
  deal,
}: DealFormSheetProps) {
  const { currency: defaultCurrency } = useCurrency();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(initialFormState);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [companies, setCompanies] = useState<Client[]>([]);
  const [container, setContainer] = useState<HTMLElement | null>(null);
  const [contactOpen, setContactOpen] = useState(false);
  const [companyOpen, setCompanyOpen] = useState(false);
  const [createContactOpen, setCreateContactOpen] = useState(false);
  const [createCompanyOpen, setCreateCompanyOpen] = useState(false);
  const [createContactLoading, setCreateContactLoading] = useState(false);
  const [createCompanyLoading, setCreateCompanyLoading] = useState(false);
  const [newContact, setNewContact] = useState({ first_name: "", last_name: "", email: "" });
  const [newCompany, setNewCompany] = useState({ name: "", company_name: "" });
  const [stages, setStages] = useState<SalesStage[]>([]);
  const setSheetOpen = useSheetPush()?.setSheetOpen;

  const stagesSorted = useMemo(() => {
    return [...stages].sort((a, b) => {
      if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
      return a.id - b.id;
    });
  }, [stages]);

  const stageNames =
    stagesSorted.length > 0
      ? stagesSorted.map((s) => s.name)
      : DEFAULT_DEAL_STAGES;

  const stageSelectOptions = useMemo(() => {
    if (formData.stage && !stageNames.includes(formData.stage)) {
      return [...stageNames, formData.stage];
    }
    return stageNames;
  }, [stageNames, formData.stage]);

  useEffect(() => {
    setContainer(document.getElementById(MAIN_CONTENT_PORTAL_ID));
  }, []);

  useEffect(() => {
    if (!open) {
      setSheetOpen?.(false);
      return;
    }
    const portal = document.getElementById(MAIN_CONTENT_PORTAL_ID);
    const sheetEl = portal?.querySelector("[data-slot='sheet-content']");
    if (!sheetEl) {
      const t = setTimeout(() => {
        const el = portal?.querySelector("[data-slot='sheet-content']");
        if (el) setSheetOpen?.(true, Math.ceil((el as HTMLElement).getBoundingClientRect().width));
      }, 350);
      return () => {
        clearTimeout(t);
        setSheetOpen?.(false);
      };
    }
    const updateWidth = () => setSheetOpen?.(true, Math.ceil((sheetEl as HTMLElement).getBoundingClientRect().width));
    updateWidth();
    const ro = new ResizeObserver(updateWidth);
    ro.observe(sheetEl);
    return () => {
      ro.disconnect();
      setSheetOpen?.(false);
    };
  }, [open, setSheetOpen]);

  useEffect(() => {
    if (!open) return;
    Promise.all([
      contactsApi.getAll({ limit: 1000 }),
      clientsApi.getAll({ limit: 1000 }),
      salesStagesApi.getAll(),
    ]).then(([contactsRes, companiesRes, stagesRes]) => {
      setContacts(contactsRes.data);
      setCompanies(companiesRes.data ?? []);
      setStages(stagesRes.data ?? []);
    });
  }, [open]);

  /** New deals: default stage = first configured sales stage (when API returns stages). */
  useEffect(() => {
    if (!open || deal) return;
    if (stagesSorted.length === 0) return;
    const first = stagesSorted[0].name;
    setFormData((prev) => {
      if (prev.stage !== "New Lead" && prev.stage !== DEFAULT_DEAL_STAGES[0]) {
        return prev;
      }
      return { ...prev, stage: first };
    });
  }, [open, deal, stagesSorted]);

  useEffect(() => {
    if (open && deal) {
      setFormData({
        title: deal.title ?? "",
        stage: deal.stage || "New Lead",
        contact_ids: deal.contacts_associated?.length
          ? deal.contacts_associated
          : deal.contact_id
            ? [deal.contact_id]
            : [],
        client_id: deal.client_id ?? deal.companies_associated?.[0] ?? null,
        value: deal.value != null ? String(deal.value) : "",
        expected_close_date: deal.expected_close_date ?? "",
        description: deal.description ?? "",
      });
    } else if (open && !deal) {
      setFormData(initialFormState);
    }
  }, [open, deal]);

  const resetForm = () => {
    setFormData(initialFormState);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) resetForm();
    onOpenChange(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const primaryContactId = formData.contact_ids[0];
      const payload: CreateDealInput = {
        title: formData.title.trim() || "Deal",
        stage: formData.stage || "New Lead",
        currency: defaultCurrency,
        contact_id: primaryContactId ?? undefined,
        client_id: formData.client_id ?? undefined,
        contacts_associated: formData.contact_ids,
        companies_associated: formData.client_id ? [formData.client_id] : [],
        value: formData.value ? Number(formData.value) : undefined,
        expected_close_date: formData.expected_close_date || undefined,
        description: formData.description.trim() || undefined,
      };
      if (deal) {
        await dealsApi.update(deal.id, payload);
      } else {
        await dealsApi.create(payload);
      }
      handleOpenChange(false);
      onSuccess();
    } catch (err) {
      console.error("Failed to save deal:", err);
      alert("Failed to save deal. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const toggleContact = (contactId: number) => {
    setFormData((prev) => {
      const exists = prev.contact_ids.includes(contactId);
      return {
        ...prev,
        contact_ids: exists
          ? prev.contact_ids.filter((id) => id !== contactId)
          : [...prev.contact_ids, contactId],
      };
    });
  };

  const setCompany = (companyId: number | null) => {
    setFormData((prev) => ({ ...prev, client_id: companyId }));
    setCompanyOpen(false);
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
      setFormData((prev) => ({
        ...prev,
        contact_ids: prev.contact_ids.includes(created.id)
          ? prev.contact_ids
          : [...prev.contact_ids, created.id],
      }));
      setContactOpen(false);
      setNewContact({ first_name: "", last_name: "", email: "" });
      setCreateContactOpen(false);
    } catch (err) {
      console.error("Failed to create contact:", err);
      alert("Failed to create contact. Please try again.");
    } finally {
      setCreateContactLoading(false);
    }
  };

  const handleCreateCompany = async () => {
    const name = newCompany.name.trim();
    if (!name) {
      alert("Name is required.");
      return;
    }
    setCreateCompanyLoading(true);
    try {
      const payload: CreateClientInput = {
        name,
        company_name: newCompany.company_name.trim() || undefined,
      };
      const created = await clientsApi.create(payload);
      setCompanies((prev) => [created, ...prev]);
      setCompany(created.id);
      setNewCompany({ name: "", company_name: "" });
      setCreateCompanyOpen(false);
    } catch (err) {
      console.error("Failed to create company:", err);
      alert("Failed to create company. Please try again.");
    } finally {
      setCreateCompanyLoading(false);
    }
  };

  const selectedContacts = contacts.filter((c) =>
    formData.contact_ids.includes(c.id),
  );
  const selectedCompany = companies.find((c) => c.id === formData.client_id);

  return (
    <Sheet open={open} onOpenChange={handleOpenChange} container={container}>
      <SheetContent
        side="right"
        className="flex flex-col w-[33.333vw] min-w-[280px] max-w-[100vw] overflow-hidden"
      >
        <SheetHeader>
          <SheetTitle>{deal ? "Edit Deal" : "New Deal"}</SheetTitle>
          <SheetDescription>
            {deal ? "Update stage and associations." : "Add a deal with stage and contacts or companies."}
          </SheetDescription>
        </SheetHeader>

        <form
          id={DEAL_FORM_ID}
          onSubmit={handleSubmit}
          className="flex flex-col flex-1 min-h-0 overflow-y-auto"
        >
          <div className="space-y-4 p-4">
            <div className="space-y-2">
              <Label>Deal name</Label>
              <Input
                placeholder="Enter deal name"
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Contact</Label>
              <div className="flex gap-1">
                <Popover open={contactOpen} onOpenChange={setContactOpen}>
                  <PopoverTrigger asChild>
                    <Button type="button" variant="outline" className="flex-1 justify-between font-normal text-left">
                      {selectedContacts.length > 0
                        ? `${selectedContacts.length} contact${selectedContacts.length === 1 ? "" : "s"} selected`
                        : "Select contact(s)"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search contacts..." />
                      <CommandList>
                        <CommandEmpty>No contact found.</CommandEmpty>
                        <CommandGroup>
                          {contacts.map((c) => {
                            const label = [c.first_name, c.last_name].filter(Boolean).join(" ") + (c.email ? ` ${c.email}` : "");
                            return (
                              <CommandItem
                                key={c.id}
                                value={label}
                                onSelect={() => toggleContact(c.id)}
                              >
                                <span className="mr-2">
                                  {formData.contact_ids.includes(c.id) ? "✓" : ""}
                                </span>
                                {[c.first_name, c.last_name].filter(Boolean).join(" ")}
                                {c.email ? ` (${c.email})` : ""}
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                        <CommandGroup>
                          <CommandItem
                            onSelect={() => {
                              setContactOpen(false);
                              setCreateContactOpen(true);
                            }}
                            className="text-primary"
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Create new contact
                          </CommandItem>
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Create contact"
                  onClick={() => setCreateContactOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
                {formData.contact_ids.length > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label="Clear contacts"
                    onClick={() => setFormData((prev) => ({ ...prev, contact_ids: [] }))}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {selectedContacts.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedContacts.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm"
                    >
                      <span>
                        {[c.first_name, c.last_name].filter(Boolean).join(" ") || c.email || "Contact"}
                      </span>
                      <button
                        type="button"
                        className="ml-1 hover:text-blue-600"
                        onClick={() => toggleContact(c.id)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Company</Label>
              <div className="flex gap-1">
                <Popover open={companyOpen} onOpenChange={setCompanyOpen}>
                  <PopoverTrigger asChild>
                    <Button type="button" variant="outline" className="flex-1 justify-between font-normal text-left">
                      {selectedCompany ? (selectedCompany.company_name || selectedCompany.name) : "Select company"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search companies..." />
                      <CommandList>
                        <CommandEmpty>No company found.</CommandEmpty>
                        <CommandGroup>
                          {companies.map((c) => {
                            const label = [c.company_name, c.name].filter(Boolean).join(" ");
                            return (
                              <CommandItem key={c.id} value={label} onSelect={() => setCompany(c.id)}>
                                {c.company_name || c.name}
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                        <CommandGroup>
                          <CommandItem
                            onSelect={() => {
                              setCompanyOpen(false);
                              setCreateCompanyOpen(true);
                            }}
                            className="text-primary"
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Create new company
                          </CommandItem>
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {formData.client_id && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label="Clear company"
                    onClick={() => setCompany(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Deal notes or description"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label>Deal value</Label>
              <Input
                type="number"
                min={0}
                step="any"
                placeholder="0.00"
                value={formData.value}
                onChange={(e) => setFormData((prev) => ({ ...prev, value: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Closing date</Label>
              <Input
                type="date"
                value={formData.expected_close_date}
                onChange={(e) => setFormData((prev) => ({ ...prev, expected_close_date: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Stage</Label>
              <Select
                value={formData.stage}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, stage: value }))}
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
                      onChange={(e) => setNewContact((p) => ({ ...p, first_name: e.target.value }))}
                      placeholder="First name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-contact-last">Last name</Label>
                    <Input
                      id="new-contact-last"
                      value={newContact.last_name}
                      onChange={(e) => setNewContact((p) => ({ ...p, last_name: e.target.value }))}
                      placeholder="Last name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-contact-email">Email</Label>
                    <Input
                      id="new-contact-email"
                      type="email"
                      value={newContact.email}
                      onChange={(e) => setNewContact((p) => ({ ...p, email: e.target.value }))}
                      placeholder="email@example.com"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setCreateContactOpen(false)} disabled={createContactLoading}>
                    Cancel
                  </Button>
                  <Button type="button" onClick={handleCreateContact} disabled={createContactLoading}>
                    {createContactLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={createCompanyOpen} onOpenChange={setCreateCompanyOpen}>
              <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                  <DialogTitle>New company</DialogTitle>
                  <DialogDescription>Add a company. Name is required.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-company-name">Name *</Label>
                    <Input
                      id="new-company-name"
                      value={newCompany.name}
                      onChange={(e) => setNewCompany((p) => ({ ...p, name: e.target.value }))}
                      placeholder="Company or contact name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-company-company_name">Company name</Label>
                    <Input
                      id="new-company-company_name"
                      value={newCompany.company_name}
                      onChange={(e) => setNewCompany((p) => ({ ...p, company_name: e.target.value }))}
                      placeholder="Legal or display name"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setCreateCompanyOpen(false)} disabled={createCompanyLoading}>
                    Cancel
                  </Button>
                  <Button type="button" onClick={handleCreateCompany} disabled={createCompanyLoading}>
                    {createCompanyLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <SheetFooter className="mt-auto border-t p-4 shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" form={DEAL_FORM_ID} disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : deal ? (
                "Update"
              ) : (
                "Create Deal"
              )}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
