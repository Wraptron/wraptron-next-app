"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePageTitle } from "@/contexts/page-title-context";
import {
  invoicesApi,
  customersApi,
  type CreateInvoiceInput,
  type Customer,
} from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  InvoiceLineItemsTable,
  type InvoiceItemDraft,
} from "@/components/invoice-line-items-table";

type InvoiceDraft = {
  customer_name: string;
  customer_address: string;
  customer_gst: string;
  payment_terms: string;
  place_of_supply: string;
  invoice_date: string;
  due_date: string;
  terms_and_conditions: string;
  authorized_signature: string;
  items: InvoiceItemDraft[];
};

const emptyItem: InvoiceItemDraft = {
  item_description: "",
  hsn: "",
  quantity: "1",
  rate: "",
  gst_rate: "18",
};

const initialDraft: InvoiceDraft = {
  customer_name: "",
  customer_address: "",
  customer_gst: "",
  payment_terms: "Net 30",
  place_of_supply: "",
  invoice_date: new Date().toISOString().slice(0, 10),
  due_date: "",
  terms_and_conditions: "",
  authorized_signature: "",
  items: [{ ...emptyItem }],
};

const money = (value: number) =>
  new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
    value,
  );

function customerAddress(customer: Customer): string {
  return [
    customer.billing_address,
    customer.billing_address_city,
  ]
    .filter(Boolean)
    .join(", ");
}

export default function NewInvoicePage() {
  const router = useRouter();
  const { setTitle } = usePageTitle();
  const [draft, setDraft] = useState<InvoiceDraft>(initialDraft);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setTitle("New Invoice");
    return () => setTitle(null);
  }, [setTitle]);

  useEffect(() => {
    const loadCustomers = async () => {
      setLoadingCustomers(true);
      try {
        const res = await customersApi.getAll({ limit: 1000 });
        setCustomers(res.data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load customers");
      } finally {
        setLoadingCustomers(false);
      }
    };
    loadCustomers();
  }, []);

  const calcSummary = useMemo(() => {
    let subtotal = 0;
    let cgst = 0;
    let sgst = 0;
    for (const item of draft.items) {
      const qty = Number(item.quantity || 0);
      const rate = Number(item.rate || 0);
      const gstRate = Number(item.gst_rate || 0);
      const amount = qty * rate;
      const gstAmount = (amount * gstRate) / 100;
      subtotal += amount;
      cgst += gstAmount / 2;
      sgst += gstAmount / 2;
    }
    return { subtotal, cgst, sgst, total: subtotal + cgst + sgst };
  }, [draft.items]);

  const onCustomerSelect = (value: string) => {
    setSelectedCustomerId(value);
    if (value === "__manual__") return;
    const selected = customers.find((c) => String(c.id) === value);
    if (!selected) return;
    setDraft((prev) => ({
      ...prev,
      customer_name: selected.name || prev.customer_name,
      customer_address: customerAddress(selected) || prev.customer_address,
      customer_gst: selected.gstin || prev.customer_gst,
    }));
  };

  const onSave = async () => {
    if (!draft.customer_name.trim()) {
      setError("Customer name is required");
      return;
    }
    if (draft.items.length === 0 || !draft.items.some((i) => i.item_description.trim())) {
      setError("At least one invoice item is required");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload: CreateInvoiceInput = {
        customer_name: draft.customer_name.trim(),
        customer_address: draft.customer_address.trim(),
        customer_gst: draft.customer_gst.trim(),
        payment_terms: draft.payment_terms.trim(),
        place_of_supply: draft.place_of_supply.trim(),
        invoice_date: draft.invoice_date || undefined,
        due_date: draft.due_date || undefined,
        terms_and_conditions: draft.terms_and_conditions.trim(),
        authorized_signature: draft.authorized_signature.trim(),
        items: draft.items
          .filter((i) => i.item_description.trim())
          .map((i) => ({
            item_description: i.item_description.trim(),
            hsn: i.hsn.trim(),
            quantity: Number(i.quantity || 0),
            rate: Number(i.rate || 0),
            gst_rate: Number(i.gst_rate || 0),
          })),
      };
      await invoicesApi.create(payload);
      router.push("/invoices");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create invoice");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Create Invoice</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label>Select Customer</Label>
                <Select value={selectedCustomerId} onValueChange={onCustomerSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder={loadingCustomers ? "Loading customers..." : "Select from customer list"} />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={String(customer.id)}>
                        {customer.name}
                      </SelectItem>
                    ))}
                    <SelectItem value="__manual__">Manual entry</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Customer Name *</Label>
                <Input
                  value={draft.customer_name}
                  onChange={(e) => setDraft((p) => ({ ...p, customer_name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Customer GST</Label>
                <Input
                  value={draft.customer_gst}
                  onChange={(e) => setDraft((p) => ({ ...p, customer_gst: e.target.value }))}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Customer Address</Label>
                <Textarea
                  rows={2}
                  value={draft.customer_address}
                  onChange={(e) => setDraft((p) => ({ ...p, customer_address: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Payment Terms</Label>
                <Input
                  value={draft.payment_terms}
                  onChange={(e) => setDraft((p) => ({ ...p, payment_terms: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Place of Supply</Label>
                <Input
                  value={draft.place_of_supply}
                  onChange={(e) => setDraft((p) => ({ ...p, place_of_supply: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Invoice Date</Label>
                <Input
                  type="date"
                  value={draft.invoice_date}
                  onChange={(e) => setDraft((p) => ({ ...p, invoice_date: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={draft.due_date}
                  onChange={(e) => setDraft((p) => ({ ...p, due_date: e.target.value }))}
                />
              </div>
            </div>

            <InvoiceLineItemsTable
              items={draft.items}
              emptyItem={emptyItem}
              onItemsChange={(items) => setDraft((p) => ({ ...p, items }))}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Terms and Conditions</Label>
                <Textarea
                  rows={3}
                  value={draft.terms_and_conditions}
                  onChange={(e) =>
                    setDraft((p) => ({ ...p, terms_and_conditions: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Authorized Signature</Label>
                <Input
                  value={draft.authorized_signature}
                  onChange={(e) =>
                    setDraft((p) => ({ ...p, authorized_signature: e.target.value }))
                  }
                />
                <div className="rounded-md border bg-gray-50 p-3 text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{money(calcSummary.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>CGST</span>
                    <span>{money(calcSummary.cgst)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>SGST</span>
                    <span>{money(calcSummary.sgst)}</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span>{money(calcSummary.total)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => router.push("/invoices")} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={onSave} disabled={saving}>
                {saving ? "Creating..." : "Create Invoice"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
