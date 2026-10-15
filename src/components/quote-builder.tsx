"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { usePageTitle } from "@/contexts/page-title-context";
import {
  companiesApi,
  hsnCodesApi,
  productCategoriesApi,
  productsApi,
  projectsApi,
  quotesApi,
  type QuoteDocument,
  type Company,
  type CreateQuoteInput,
  type HsnCode,
  type Product,
  type ProductCategory,
  type Project,
  type Quote,
  type QuoteStatus,
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
import { ChevronsUpDown, FileText, Plus, Trash2, Upload, X } from "lucide-react";
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
const TAX_RATES = ["0", "5", "12", "18", "28"];

type ItemDraft = {
  product_id: string;
  item_details: string;
  item_group: string;
  quantity: string;
  rate: string;
  discount_percent: string;
  tax_percent: string;
};

type QuoteDraft = {
  customer_id: string;
  company_id: string;
  customer_name: string;
  quote_number: string;
  reference_number: string;
  quote_date: string;
  expiry_date: string;
  project_id: string;
  subject: string;
  customer_notes: string;
  terms_and_conditions: string;
  adjustment_label: string;
  adjustment_amount: string;
  items: ItemDraft[];
};

const emptyItem = (): ItemDraft => ({
  product_id: "",
  item_details: "",
  item_group: "",
  quantity: "1",
  rate: "0",
  discount_percent: "0",
  tax_percent: "",
});

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      const comma = result.indexOf(",");
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function addDays(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.slice(0, 10).split("-").map(Number);
  if (!year || !month || !day) return "";
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function blankDraft(): QuoteDraft {
  return {
    customer_id: "",
    company_id: "",
    customer_name: "",
    quote_number: "",
    reference_number: "",
    quote_date: "",
    expiry_date: "",
    project_id: "",
    subject: "",
    customer_notes: "",
    terms_and_conditions: "",
    adjustment_label: "Adjustment",
    adjustment_amount: "0",
    items: [emptyItem()],
  };
}

function quoteToDraft(quote: Quote): QuoteDraft {
  return {
    customer_id: quote.customer_id ? String(quote.customer_id) : "",
    company_id: quote.company_id ? String(quote.company_id) : "",
    customer_name: quote.customer_name || "",
    quote_number: quote.quote_number || "",
    reference_number: quote.reference_number || "",
    quote_date: quote.quote_date?.slice(0, 10) || "",
    expiry_date:
      quote.expiry_date?.slice(0, 10) ||
      (quote.quote_date ? addDays(quote.quote_date, 30) : ""),
    project_id: quote.project_id ? String(quote.project_id) : "",
    subject: quote.subject || "",
    customer_notes: quote.customer_notes || "",
    terms_and_conditions: quote.terms_and_conditions || "",
    adjustment_label: quote.adjustment_label || "Adjustment",
    adjustment_amount: String(Number(quote.adjustment_amount ?? 0)),
    items:
      quote.items && quote.items.length > 0
        ? quote.items.map((item) => ({
            product_id: item.product_id ? String(item.product_id) : "",
            item_details: item.item_details || "",
            item_group: item.item_group || "",
            quantity: String(Number(item.quantity ?? 0)),
            rate: String(Number(item.rate ?? 0)),
            discount_percent: String(Number(item.discount_percent ?? 0)),
            tax_percent: String(Number(item.tax_percent ?? 0)),
          }))
        : [emptyItem()],
  };
}

const money = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

function companyLabel(company: Company) {
  return company.company_name || company.name || "Company";
}

function lineAmount(item: ItemDraft) {
  const qty = Number(item.quantity || 0);
  const rate = Number(item.rate || 0);
  const discount = Math.min(100, Math.max(0, Number(item.discount_percent || 0)));
  return qty * rate * (1 - discount / 100);
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

export function QuoteBuilder({ quoteId }: { quoteId?: number }) {
  const router = useRouter();
  const { setTitle } = usePageTitle();
  const [draft, setDraft] = useState<QuoteDraft>(() => blankDraft());
  const [companies, setCompanies] = useState<Company[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [hsnCodes, setHsnCodes] = useState<HsnCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<QuoteStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [savedDocuments, setSavedDocuments] = useState<QuoteDocument[]>([]);

  const isEdit = typeof quoteId === "number" && !Number.isNaN(quoteId);

  useEffect(() => {
    setTitle(isEdit ? "Edit Quote" : "New Quote");
    return () => setTitle(null);
  }, [isEdit, setTitle]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (typeof quoteId === "number" && Number.isNaN(quoteId)) {
        setError("Invalid quote ID");
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
              : quotesApi.getNextNumber().catch(() => null),
          ]);
        if (cancelled) return;
        setCompanies(companyRes.data);
        setProjects(projectRes.data);
        setProducts(productRes.data ?? []);
        setCategories(categoryRes.data ?? []);
        setHsnCodes(hsnRes.data ?? []);
        if (isEdit && quoteId) {
          const [quote, documents] = await Promise.all([
            quotesApi.getById(quoteId),
            quotesApi.listDocuments(quoteId),
          ]);
          if (cancelled) return;
          setDraft(quoteToDraft(quote));
          setSavedDocuments(documents.data);
        } else {
          const draft = blankDraft();
          if (nextNumber?.quote_number) {
            draft.quote_number = nextNumber.quote_number;
          }
          setDraft(draft);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load quote");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [isEdit, quoteId]);

  const summary = useMemo(() => {
    let subtotal = 0;
    let tax = 0;
    for (const item of draft.items) {
      const amount = lineAmount(item);
      const taxRate = Number(item.tax_percent || 0);
      subtotal += amount;
      tax += (amount * taxRate) / 100;
    }
    const adjustment = Number(draft.adjustment_amount || 0);
    return {
      subtotal,
      tax,
      adjustment,
      total: subtotal + tax + adjustment,
    };
  }, [draft.items, draft.adjustment_amount]);

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

  const selectProduct = (idx: number, productId: string) => {
    const product = products.find((item) => String(item.id) === productId);
    if (!product) return;
    const sellingPrice = Number(product.selling_price);
    updateItem(idx, {
      product_id: productId,
      item_details: product.part_name,
      item_group: categoryNameFor(product),
      rate: Number.isFinite(sellingPrice) ? String(sellingPrice) : "0",
      tax_percent: taxForProduct(product),
    });
  };

  const updateItem = (idx: number, patch: Partial<ItemDraft>) => {
    setDraft((prev) => ({
      ...prev,
      items: prev.items.map((item, i) => (i === idx ? { ...item, ...patch } : item)),
    }));
  };

  const onSave = async (status: QuoteStatus) => {
    const company = companies.find(
      (c) => String(c.company_id) === draft.company_id,
    );
    const customerId = draft.company_id
      ? null
      : draft.customer_id
        ? Number(draft.customer_id)
        : null;
    const companyId = draft.company_id
      ? (company?.company_id ?? Number(draft.company_id))
      : null;
    const customerName = company
      ? companyLabel(company)
      : draft.customer_name;
    if ((!customerId && !companyId) || !customerName) {
      setError("Customer name is required");
      return;
    }
    if (!draft.quote_number.trim()) {
      setError("Quote number is required");
      return;
    }
    if (!draft.quote_date) {
      setError("Quote date is required");
      return;
    }
    const items = draft.items.filter((item) => item.item_details.trim());
    if (items.length === 0) {
      setError("At least one item is required");
      return;
    }

    const payload: CreateQuoteInput = {
      customer_id: customerId,
      company_id: companyId,
      customer_name: customerName,
      quote_number: draft.quote_number.trim(),
      reference_number: draft.reference_number.trim(),
      quote_date: draft.quote_date,
      expiry_date: draft.expiry_date || addDays(draft.quote_date, 30) || null,
      project_id: draft.project_id ? Number(draft.project_id) : null,
      subject: draft.subject.trim(),
      customer_notes: draft.customer_notes.trim(),
      terms_and_conditions: draft.terms_and_conditions.trim(),
      status,
      deduction_rate: 0,
      adjustment_label: "Adjustment",
      adjustment_amount: Number(draft.adjustment_amount || 0),
      items: items.map((item) => ({
        product_id: item.product_id ? Number(item.product_id) : null,
        item_details: item.item_details.trim(),
        item_group: item.item_group.trim(),
        quantity: Number(item.quantity || 0),
        rate: Number(item.rate || 0),
        discount_percent: Number(item.discount_percent || 0),
        tax_percent: Number(item.tax_percent || 0),
      })),
    };

    setSaving(status);
    setError(null);
    try {
      const saved =
        isEdit && quoteId
          ? await quotesApi.update(quoteId, payload)
          : await quotesApi.create(payload);
      try {
        for (const file of pendingFiles) {
          if (file.size > 10 * 1024 * 1024) {
            throw new Error(`${file.name} must be 10MB or smaller`);
          }
          await quotesApi.addDocument(saved.id, {
            file_name: file.name,
            content_type: file.type || "application/octet-stream",
            data_base64: await fileToBase64(file),
          });
        }
      } catch (uploadError) {
        setPendingFiles([]);
        setError(
          uploadError instanceof Error
            ? `Quote saved, but a document failed to upload: ${uploadError.message}`
            : "Quote saved, but a document failed to upload",
        );
        if (!isEdit) router.replace(`/sales/quotes/${saved.id}`);
        return;
      }
      if (status === "sent") {
        try {
          await quotesApi.send(saved.id);
        } catch (sendError) {
          setError(
            sendError instanceof Error
              ? sendError.message
              : "Quote saved, but the email could not be sent",
          );
          if (!isEdit) router.replace(`/sales/quotes/${saved.id}`);
          return;
        }
        router.push(`/sales/quotes/${saved.id}/preview`);
      } else {
        router.push("/sales/quotes");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save quote");
    } finally {
      setSaving(null);
    }
  };

  const removeSavedDocument = async (documentId: number) => {
    if (!quoteId) return;
    setError(null);
    try {
      await quotesApi.deleteDocument(quoteId, documentId);
      setSavedDocuments((prev) => prev.filter((doc) => doc.id !== documentId));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to remove document");
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
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg tracking-tight">
                {isEdit ? "Edit Quote" : "New Quote"}
              </CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Project quotation
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={() => router.push("/sales/quotes")}
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-6 px-6 py-6">
          {loading ? (
            <div className="py-10 text-center text-muted-foreground">
              Loading quote...
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
                        customer_id: "",
                        customer_name: company
                          ? companyLabel(company)
                          : prev.customer_name,
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

                <FieldRow label="Quote" required>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Input
                      type="text"
                      value={draft.quote_number}
                      onChange={(e) =>
                        setDraft((prev) => ({
                          ...prev,
                          quote_number: e.target.value,
                        }))
                      }
                    />
                    <div className="grid grid-cols-[110px_minmax(0,1fr)] items-center gap-2">
                      <Label className="text-[13px] font-medium text-muted-foreground">
                        Reference
                      </Label>
                      <Input
                        type="text"
                        value={draft.reference_number}
                        onChange={(e) =>
                          setDraft((prev) => ({
                            ...prev,
                            reference_number: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                </FieldRow>

                <FieldRow label="Quote Date" required>
                  <div className="flex flex-wrap items-center gap-3">
                    <Input
                      type="date"
                      className="w-[11.5rem]"
                      value={draft.quote_date}
                      onChange={(e) =>
                        setDraft((prev) => ({
                          ...prev,
                          quote_date: e.target.value,
                          expiry_date: addDays(e.target.value, 30),
                        }))
                      }
                    />
                    <Label className="text-[13px] font-medium text-muted-foreground">
                      Expiry Date
                    </Label>
                    <Input
                      type="date"
                      className="w-[11.5rem]"
                      value={draft.expiry_date}
                      onChange={(e) =>
                        setDraft((prev) => ({
                          ...prev,
                          expiry_date: e.target.value,
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

                <FieldRow label="Subject">
                  <Input
                    value={draft.subject}
                    placeholder="Let your customer know what this Quote is for"
                    onChange={(e) =>
                      setDraft((prev) => ({ ...prev, subject: e.target.value }))
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
                        <TableHead className="min-w-[220px] text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Item details</TableHead>
                        <TableHead className="min-w-[140px] text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Item group</TableHead>
                        <TableHead className="w-[90px] text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Quantity</TableHead>
                        <TableHead className="w-[110px] text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Rate</TableHead>
                        <TableHead className="w-[100px] text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Discount</TableHead>
                        <TableHead className="w-[110px] text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Tax</TableHead>
                        <TableHead className="w-[110px] text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Amount</TableHead>
                        <TableHead className="w-[44px]" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {draft.items.map((item, idx) => {
                        const taxValue = TAX_RATES.includes(item.tax_percent)
                          ? item.tax_percent
                          : item.tax_percent || "0";
                        return (
                          <TableRow key={idx}>
                            <TableCell className="align-top">
                              <SearchPicker
                                valueLabel={
                                  products.find(
                                    (product) =>
                                      String(product.id) === item.product_id,
                                  )?.part_name || item.item_details
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
                              <div className="flex items-center gap-1">
                                <Input
                                  type="number"
                                  min="0"
                                  max="100"
                                  step="0.01"
                                  value={item.discount_percent}
                                  onChange={(e) =>
                                    updateItem(idx, {
                                      discount_percent: e.target.value,
                                    })
                                  }
                                />
                                <span className="text-xs text-muted-foreground">%</span>
                              </div>
                            </TableCell>
                            <TableCell className="align-top">
                              <Input
                                readOnly
                                value={
                                  item.tax_percent !== ""
                                    ? `${taxValue}%`
                                    : ""
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
                        );
                      })}
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
                    Customer Notes
                  </Label>
                  <Textarea
                    rows={5}
                    className="border-0 bg-background shadow-none"
                    value={draft.customer_notes}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        customer_notes: e.target.value,
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
                    <span className="tabular-nums">{money(summary.subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Tax</span>
                    <span className="tabular-nums">{money(summary.tax)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm">Adjustment</span>
                    <Input
                      className="h-8 w-28 text-right"
                      type="number"
                      step="0.01"
                      value={draft.adjustment_amount}
                      onChange={(e) =>
                        setDraft((prev) => ({
                          ...prev,
                          adjustment_amount: e.target.value,
                        }))
                      }
                    />
                    <span className="w-24 text-right tabular-nums">
                      {money(summary.adjustment)}
                    </span>
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
                <div className="space-y-3 rounded-xl border bg-muted/15 p-4">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Upload any document
                  </Label>
                  <label className="flex h-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed bg-background text-sm text-muted-foreground hover:border-primary/40 hover:text-foreground">
                    <Upload className="h-4 w-4" />
                    <span>Choose files</span>
                    <input
                      type="file"
                      multiple
                      className="sr-only"
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        const tooLarge = files.find(
                          (file) => file.size > 10 * 1024 * 1024,
                        );
                        if (tooLarge) {
                          setError(`${tooLarge.name} must be 10MB or smaller`);
                          e.target.value = "";
                          return;
                        }
                        setPendingFiles((prev) => [...prev, ...files]);
                        e.target.value = "";
                      }}
                    />
                  </label>
                  {(savedDocuments.length > 0 || pendingFiles.length > 0) && (
                    <ul className="space-y-1 text-sm">
                      {savedDocuments.map((doc) => (
                        <li
                          key={`saved-${doc.id}`}
                          className="flex items-center justify-between gap-2"
                        >
                          <span className="truncate">{doc.file_name}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => removeSavedDocument(doc.id)}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </li>
                      ))}
                      {pendingFiles.map((file, index) => (
                        <li
                          key={`pending-${file.name}-${index}`}
                          className="flex items-center justify-between gap-2"
                        >
                          <span className="truncate">{file.name}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() =>
                              setPendingFiles((prev) =>
                                prev.filter((_, i) => i !== index),
                              )
                            }
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-muted/20 px-3 py-3">
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
                  onClick={() => router.push("/sales/quotes")}
                >
                  Cancel
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </PageShell>
  );
}
