"use client";

import React, { useState, useEffect } from "react";
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
import { dealsApi, contactsApi, clientsApi, type Deal, type CreateDealInput, type CreateContactInput, type CreateClientInput, type Contact, type Client } from "@/lib/api";
import { useCurrency } from "@/contexts/currency-context";

const DEAL_STAGES = ["lead", "qualified", "proposal", "negotiation", "won", "lost"];

const MAIN_CONTENT_PORTAL_ID = "main-content-portal";
const DEAL_FORM_ID = "deal-form-sheet-form";

export interface DealFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  deal?: Deal | null;
}

const initialFormState = {
  stage: "lead" as string,
  contact_id: null as number | null,
  client_id: null as number | null,
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
  const setSheetOpen = useSheetPush()?.setSheetOpen;

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
    ]).then(([contactsRes, companiesRes]) => {
      setContacts(contactsRes.data);
      setCompanies(companiesRes.data ?? []);
    });
  }, [open]);

  useEffect(() => {
    if (open && deal) {
      setFormData({
        stage: deal.stage || "lead",
        contact_id: deal.contact_id ?? deal.contacts_associated?.[0] ?? null,
        client_id: deal.client_id ?? deal.companies_associated?.[0] ?? null,
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
      const payload: CreateDealInput = {
        title: deal?.title ?? "Deal",
        stage: formData.stage || "lead",
        currency: defaultCurrency,
        contact_id: formData.contact_id ?? undefined,
        client_id: formData.client_id ?? undefined,
        contacts_associated: formData.contact_id ? [formData.contact_id] : [],
        companies_associated: formData.client_id ? [formData.client_id] : [],
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

  const setContact = (contactId: number | null) => {
    setFormData((prev) => ({ ...prev, contact_id: contactId }));
    setContactOpen(false);
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
      setContact(created.id);
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
      setCompanies((prev) => [{ id: created.id, name: created.name, company_name: created.company_name }, ...prev]);
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

  const selectedContact = contacts.find((c) => c.id === formData.contact_id);
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
              <Label>Stage</Label>
              <Select
                value={formData.stage}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, stage: value }))}
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

            <div className="space-y-2">
              <Label>Contact</Label>
              <div className="flex gap-1">
                <Popover open={contactOpen} onOpenChange={setContactOpen}>
                  <PopoverTrigger asChild>
                    <Button type="button" variant="outline" className="flex-1 justify-between font-normal text-left">
                      {selectedContact
                        ? [selectedContact.first_name, selectedContact.last_name].filter(Boolean).join(" ") || selectedContact.email || "Contact"
                        : "Select contact"}
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
                                onSelect={() => setContact(c.id)}
                              >
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
                {formData.contact_id && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label="Clear contact"
                    onClick={() => setContact(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
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
