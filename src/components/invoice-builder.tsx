"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { usePageTitle } from "@/contexts/page-title-context";
import {
  companiesApi,
  hsnCodesApi,
  invoicesApi,
  productCategoriesApi,
  productsApi,
  projectsApi,
  type Company,
  type CreateInvoiceInput,
  type HsnCode,
  type Invoice,
  type InvoiceStatus,
  type Product,
  type ProductCategory,
  type Project,
} from "@/lib/api";
import { PageShell } from "@/components/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChevronsUpDown,
  Plus,
  Receipt,
  Trash2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
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

type ItemDraft = {
  product_id: string;
  item_description: string;
  item_group: string;
  hsn: string;
  quantity: string;
  rate: string;
  gst_rate: string;
};

type InvoiceDraft = {
  company_id: string;
  customer_name: string;
  customer_address: string;
  customer_gst: string;
  place_of_supply: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  project_id: string;
  terms_and_conditions: string;
  customer_notes: string;
  quote_id: number | null;
  items: ItemDraft[];
};

const emptyItem = (): ItemDraft => ({
  product_id: "",
  item_description: "",
  item_group: "",
  hsn: "",
  quantity: "1",
  rate: "0",
  gst_rate: "18",
});

function addDays(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.slice(0, 10).split("-").map(Number);
  if (!year || !month || !day) return "";
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function blankDraft(): InvoiceDraft {
  return {
    company_id: "",
    customer_name: "",
    customer_address: "",
    customer_gst: "",
    place_of_supply: "",
    invoice_number: "",
    invoice_date: new Date().toISOString().slice(0, 10),
    due_date: addDays(new Date().toISOString().slice(0, 10), 30),
    project_id: "",
    terms_and_conditions: "",
    customer_notes: "",
    quote_id: null,
    items: [emptyItem()],
  };
}

function companyLabel(company: Company) {
  return company.company_name || company.name || "Company";
}

function companyAddress(company: Company) {
  return [company.address, company.city, company.state, company.country, company.postal_code]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(", ");
}

function invoiceToDraft(invoice: Invoice): InvoiceDraft {
  return {
    company_id: "",
    customer_name: invoice.customer_name || "",
    customer_address: invoice.customer_address || "",
    customer_gst: invoice.customer_gst || "",
    place_of_supply: invoice.place_of_supply || "",
    invoice_number: invoice.invoice_number || "",
    invoice_date: invoice.invoice_date?.slice(0, 10) || "",
    due_date:
      invoice.due_date?.slice(0, 10) ||
      (invoice.invoice_date ? addDays(invoice.invoice_date, 30) : ""),
    project_id: invoice.project_id ? String(invoice.project_id) : "",
    terms_and_conditions: invoice.terms_and_conditions || "",
    customer_notes: "",
    quote_id: invoice.quote_id ?? null,
    items:
      invoice.items && invoice.items.length > 0
        ? invoice.items.map((item) => ({
            product_id: "",
            item_description: item.item_description || "",
            item_group: "",
            hsn: item.hsn || "",
            quantity: String(Number(item.quantity ?? 0)),
            rate: String(Number(item.rate ?? 0)),
            gst_rate: String(Number(item.gst_rate ?? 0)),
          }))
        : [emptyItem()],
  };
}

const money = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

function lineAmount(item: ItemDraft) {
  return Number(item.quantity || 0) * Number(item.rate || 0);
}

function SearchPicker({
  valueLabel,
  placeholder,
  searchPlaceholder,
  emptyText,
  options,
  onSelect,
  className,
}: {
  valueLabel: string;
  placeholder: string;
  searchPlaceholder: string;
  emptyText: string;
  options: { value: string; label: string; hint?: string }[];
  onSelect: (value: string) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "h-9 w-full justify-between px-3 font-normal",
            !valueLabel && "text-muted-foreground",
            className,
          )}
        >
          <span className="truncate">{valueLabel || placeholder}</span>
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
      >
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={`${option.label} ${option.hint ?? ""} ${option.value}`}
                  onSelect={() => {
                    onSelect(option.value);
                    setOpen(false);
                  }}
                >
                  <span className="truncate">{option.label}</span>
                  {option.hint ? (
                    <span className="ml-auto text-xs text-muted-foreground">
                      {option.hint}
                    </span>
                  ) : null}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function FieldRow({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 items-center gap-1.5 md:grid-cols-[148px_minmax(0,1fr)] md:gap-4">
      <Label className="text-[13px] font-medium text-muted-foreground">
        {label}
        {required ? <span className="ml-0.5 text-destructive">*</span> : null}
      </Label>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export function InvoiceBuilder({ invoiceId }: { invoiceId?: number }) {
  const router = useRouter();
  const { setTitle } = usePageTitle();
  const [draft, setDraft] = useState<InvoiceDraft>(() => blankDraft());
  const [companies, setCompanies] = useState<Company[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [hsnCodes, setHsnCodes] = useState<HsnCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<InvoiceStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isEdit = typeof invoiceId === "number" && !Number.isNaN(invoiceId);
  const listHref = "/sales/quotes?tab=invoices";

  useEffect(() => {
    setTitle(isEdit ? "Edit Invoice" : "New Invoice");
    return () => setTitle(null);
  }, [isEdit, setTitle]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (typeof invoiceId === "number" && Number.isNaN(invoiceId)) {
        setError("Invalid invoice ID");
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const [companyRes, projectRes, productRes, categoryRes, hsnRes, nextNumber] =
          await Promise.all([
            companiesApi.getAll({ limit: 1000 }),
            projectsApi.getAll({ limit: 1000 }),
            productsApi.getAll({ limit: 1000 }),
            productCategoriesApi.getAll(),
            hsnCodesApi.getAll().catch(() => ({ data: [] as HsnCode[] })),
            isEdit
              ? Promise.resolve(null)
              : invoicesApi.getNextNumber().catch(() => null),
          ]);
        if (cancelled) return;
        setCompanies(companyRes.data);
        setProjects(projectRes.data);
        setProducts(productRes.data ?? []);
        setCategories(categoryRes.data ?? []);
        setHsnCodes(hsnRes.data ?? []);

        if (isEdit && invoiceId) {
          const invoice = await invoicesApi.getById(invoiceId);
          if (cancelled) return;
          const next = invoiceToDraft(invoice);
          const matched = companyRes.data.find(
            (company) =>
              companyLabel(company).trim().toLowerCase() ===
              next.customer_name.trim().toLowerCase(),
          );
          if (matched) next.company_id = String(matched.company_id);
          setDraft(next);
        } else {
          const next = blankDraft();
          if (nextNumber?.invoice_number) {
            next.invoice_number = nextNumber.invoice_number;
          }
          setDraft(next);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load invoice");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [isEdit, invoiceId]);

  const summary = useMemo(() => {
    let subtotal = 0;
    let cgst = 0;
    let sgst = 0;
    for (const item of draft.items) {
      const amount = lineAmount(item);
      const gstAmount = (amount * Number(item.gst_rate || 0)) / 100;
      subtotal += amount;
      cgst += gstAmount / 2;
      sgst += gstAmount / 2;
    }
    return {
      subtotal,
      cgst,
      sgst,
      tax: cgst + sgst,
      total: subtotal + cgst + sgst,
    };
  }, [draft.items]);

  const categoryNameFor = (product: Product) =>
    product.category_name?.trim() ||
    categories.find((category) => category.id === product.category_id)?.name ||
    "";

  const taxForProduct = (product: Product) => {
    const code = product.hsn_code?.trim();
    if (!code) return "";
    const hsn = hsnCodes.find((row) => row.code === code);
    if (!hsn) return "";
    const tax = Number(hsn.tax_percent);
    return Number.isFinite(tax) ? String(tax) : "";
  };

  const updateItem = (idx: number, patch: Partial<ItemDraft>) => {
    setDraft((prev) => ({
      ...prev,
      items: prev.items.map((item, i) => (i === idx ? { ...item, ...patch } : item)),
    }));
  };

  const selectProduct = (idx: number, productId: string) => {
    const product = products.find((item) => String(item.id) === productId);
    if (!product) return;
    const sellingPrice = Number(product.selling_price);
    const prodHsn = product.hsn_code?.trim() || "";
    updateItem(idx, {
      product_id: productId,
      item_description: product.part_name,
      item_group: categoryNameFor(product),
      hsn: prodHsn || "998314",
      rate: Number.isFinite(sellingPrice) ? String(sellingPrice) : "0",
      gst_rate: taxForProduct(product) || "18",
    });
  };

  const onSave = async (status: InvoiceStatus) => {
    const company = companies.find(
      (c) => String(c.company_id) === draft.company_id,
    );
    const customerName = company
      ? companyLabel(company)
      : draft.customer_name.trim();
    if (!customerName) {
      setError("Customer name is required");
      return;
    }
    if (!draft.invoice_date) {
      setError("Invoice date is required");
      return;
    }
    const items = draft.items.filter((item) => item.item_description.trim());
    if (items.length === 0) {
      setError("At least one item is required");
      return;
    }

    const payload: CreateInvoiceInput = {
      customer_name: customerName,
      customer_address:
        draft.customer_address.trim() ||
        (company ? companyAddress(company) : ""),
      customer_gst:
        draft.customer_gst.trim() || company?.tax_id?.trim() || "",
      payment_terms: "Net 30",
      place_of_supply: draft.place_of_supply.trim(),
      invoice_date: draft.invoice_date || undefined,
      due_date: draft.due_date || undefined,
      project_id: draft.project_id ? Number(draft.project_id) : null,
      terms_and_conditions: draft.terms_and_conditions.trim(),
      authorized_signature: "",
      items: items.map((item) => ({
        item_description: item.item_description.trim(),
        hsn: item.hsn.trim(),
        quantity: Number(item.quantity || 0),
        rate: Number(item.rate || 0),
        gst_rate: Number(item.gst_rate || 0),
      })),
    };

    setSaving(status);
    setError(null);
    try {
      const saved =
        isEdit && invoiceId
          ? await invoicesApi.update(invoiceId, payload)
          : await invoicesApi.create(payload);

      if (status === "sent") {
        try {
          await invoicesApi.send(saved.id);
        } catch (sendError) {
          setError(
            sendError instanceof Error
              ? sendError.message
              : "Invoice saved, but the email could not be sent",
          );
          if (!isEdit) router.replace(`/invoices/${saved.id}/edit`);
          return;
        }
      } else if (isEdit && invoiceId) {
        await invoicesApi.updateStatus(saved.id, "draft").catch(() => null);
      }

      router.push(listHref);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save invoice");
    } finally {
      setSaving(null);
    }
  };

  return (
    <PageShell className="space-y-4 bg-background text-foreground">
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <Card className="gap-0 overflow-hidden py-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b bg-muted/30 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg tracking-tight">
                {isEdit ? "Edit Invoice" : "New Invoice"}
              </CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Customer invoice
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={() => router.push(listHref)}
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 px-6 py-6">
          {loading ? (
            <div className="py-10 text-center text-muted-foreground">
              Loading invoice...
            </div>
          ) : (
            <>
              <section className="space-y-4 rounded-xl border bg-muted/15 p-4 md:p-5">
                <FieldRow label="Company Name" required>
                  <Select
                    value={draft.company_id || undefined}
                    onValueChange={(value) => {
                      const company = companies.find(
                        (item) => String(item.company_id) === value,
                      );
                      setDraft((prev) => ({
                        ...prev,
                        company_id: value,
                        customer_name: company
                          ? companyLabel(company)
                          : prev.customer_name,
                        customer_address: company
                          ? companyAddress(company)
                          : prev.customer_address,
                        customer_gst: company?.tax_id?.trim() || prev.customer_gst,
                      }));
                    }}
                  >
                    <SelectTrigger className="h-9 w-full">
                      <SelectValue placeholder="Select a company" />
                    </SelectTrigger>
                    <SelectContent>
                      {[...companies]
                        .sort((a, b) =>
                          companyLabel(a).localeCompare(companyLabel(b)),
                        )
                        .map((company) => (
                          <SelectItem
                            key={company.company_id}
                            value={String(company.company_id)}
                          >
                            {companyLabel(company)}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </FieldRow>

                <FieldRow label="Invoice #" required>
                  <Input
                    type="text"
                    value={draft.invoice_number}
                    readOnly
                    className="bg-muted"
                  />
                </FieldRow>

                <FieldRow label="Invoice Date" required>
                  <div className="flex flex-wrap items-center gap-3">
                    <Input
                      type="date"
                      className="w-[11.5rem]"
                      value={draft.invoice_date}
                      onChange={(e) =>
                        setDraft((prev) => ({
                          ...prev,
                          invoice_date: e.target.value,
                          due_date: addDays(e.target.value, 30),
                        }))
                      }
                    />
                    <Label className="text-[13px] font-medium text-muted-foreground">
                      Due Date
                    </Label>
                    <Input
                      type="date"
                      className="w-[11.5rem]"
                      value={draft.due_date}
                      onChange={(e) =>
                        setDraft((prev) => ({
                          ...prev,
                          due_date: e.target.value,
                        }))
                      }
                    />
                  </div>
                </FieldRow>

                <div className="py-1.5">
                  <FieldRow label="Project Name">
                    <SearchPicker
                      className="h-10 w-1/2"
                      valueLabel={
                        projects.find(
                          (project) => String(project.id) === draft.project_id,
                        )?.project_name || ""
                      }
                      placeholder="Search a project"
                      searchPlaceholder="Search projects"
                      emptyText="No projects found."
                      options={projects.map((project) => ({
                        value: String(project.id),
                        label: project.project_name,
                      }))}
                      onSelect={(value) =>
                        setDraft((prev) => ({ ...prev, project_id: value }))
                      }
                    />
                  </FieldRow>
                </div>

                <FieldRow label="Place of Supply">
                  <Input
                    value={draft.place_of_supply}
                    placeholder="Tamil Nadu (33)"
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        place_of_supply: e.target.value,
                      }))
                    }
                  />
                </FieldRow>

                <FieldRow label="Customer GST">
                  <Input
                    value={draft.customer_gst}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        customer_gst: e.target.value,
                      }))
                    }
                  />
                </FieldRow>
              </section>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold tracking-tight">Items</h3>
                </div>
                <div className="overflow-x-auto rounded-xl border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50 hover:bg-muted/50">
                        <TableHead className="min-w-[220px] text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          Item details
                        </TableHead>
                        <TableHead className="min-w-[140px] text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          Item group
                        </TableHead>
                        <TableHead className="w-[100px] text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          HSN/SAC
                        </TableHead>
                        <TableHead className="w-[90px] text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          Quantity
                        </TableHead>
                        <TableHead className="w-[110px] text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          Rate
                        </TableHead>
                        <TableHead className="w-[110px] text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          Tax
                        </TableHead>
                        <TableHead className="w-[110px] text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          Amount
                        </TableHead>
                        <TableHead className="w-[44px]" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {draft.items.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="align-top">
                            <SearchPicker
                              valueLabel={
                                products.find(
                                  (product) =>
                                    String(product.id) === item.product_id,
                                )?.part_name || item.item_description
                              }
                              placeholder="Select a product"
                              searchPlaceholder="Search products"
                              emptyText="No products found."
                              options={products.map((product) => ({
                                value: String(product.id),
                                label: product.part_name,
                                hint:
                                  product.category_name?.trim() ||
                                  product.part_code,
                              }))}
                              onSelect={(value) => selectProduct(idx, value)}
                            />
                          </TableCell>
                          <TableCell className="align-top">
                            <Input
                              readOnly
                              value={item.item_group}
                              placeholder="Product category"
                              className="bg-muted"
                            />
                          </TableCell>
                          <TableCell className="align-top">
                            <Input
                              value={item.hsn}
                              placeholder="HSN/SAC"
                              onChange={(e) =>
                                updateItem(idx, { hsn: e.target.value })
                              }
                            />
                          </TableCell>
                          <TableCell className="align-top">
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.quantity}
                              onChange={(e) =>
                                updateItem(idx, { quantity: e.target.value })
                              }
                            />
                          </TableCell>
                          <TableCell className="align-top">
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.rate}
                              onChange={(e) =>
                                updateItem(idx, { rate: e.target.value })
                              }
                            />
                          </TableCell>
                          <TableCell className="align-top">
                            <Input
                              readOnly
                              value={
                                item.gst_rate !== "" ? `${item.gst_rate}%` : ""
                              }
                              placeholder="HSN tax"
                              className="bg-muted"
                            />
                          </TableCell>
                          <TableCell className="pt-3 text-right align-top text-sm font-medium tabular-nums">
                            {money(lineAmount(item))}
                          </TableCell>
                          <TableCell className="align-top">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              disabled={draft.items.length === 1}
                              onClick={() =>
                                setDraft((prev) => ({
                                  ...prev,
                                  items: prev.items.filter((_, i) => i !== idx),
                                }))
                              }
                              aria-label="Remove item"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setDraft((prev) => ({
                      ...prev,
                      items: [...prev.items, emptyItem()],
                    }))
                  }
                >
                  <Plus className="h-4 w-4" />
                  Add New Row
                </Button>
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="space-y-2 rounded-xl border bg-muted/15 p-4">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Customer Address
                  </Label>
                  <Textarea
                    rows={5}
                    className="border-0 bg-background shadow-none"
                    value={draft.customer_address}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        customer_address: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="overflow-hidden rounded-xl border bg-card text-sm shadow-sm">
                  <div className="border-b bg-muted/40 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Summary
                  </div>
                  <div className="space-y-3 p-4">
                    <div className="flex items-center justify-between">
                      <span>Sub Total</span>
                      <span className="tabular-nums">
                        {money(summary.subtotal)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>CGST</span>
                      <span className="tabular-nums">{money(summary.cgst)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>SGST</span>
                      <span className="tabular-nums">{money(summary.sgst)}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between bg-primary px-4 py-3 text-base font-semibold text-primary-foreground">
                    <span>Total (₹)</span>
                    <span className="tabular-nums">{money(summary.total)}</span>
                  </div>
                </div>
                <div className="space-y-2 rounded-xl border bg-muted/15 p-4">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Terms & Conditions
                  </Label>
                  <Textarea
                    className="border-0 bg-background shadow-none"
                    rows={4}
                    value={draft.terms_and_conditions}
                    placeholder="https://wraptron.com/terms"
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        terms_and_conditions: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-muted/20 px-3 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={saving !== null}
                    onClick={() => onSave("draft")}
                  >
                    {saving === "draft" ? "Saving..." : "Save as Draft"}
                  </Button>
                  <Button
                    type="button"
                    disabled={saving !== null}
                    onClick={() => onSave("sent")}
                  >
                    {saving === "sent" ? "Sending..." : "Save and Send"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={saving !== null}
                    onClick={() => router.push(listHref)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </PageShell>
  );
}
