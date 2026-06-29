"use client";

import { PageShell } from "@/components/page-shell";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePageTitle } from "@/contexts/page-title-context";
import {
  billsApi,
  zohoApi,
  type CreateBillInput,
  type ZohoVendor,
} from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  InvoiceLineItemsTable,
  type InvoiceItemDraft,
} from "@/components/invoice-line-items-table";

type BillDraft = {
  vendor_name: string;
  vendor_address: string;
  vendor_gst: string;
  payment_terms: string;
  place_of_supply: string;
  bill_date: string;
  due_date: string;
  zoho_vendor_id: string;
  items: InvoiceItemDraft[];
};

const emptyItem: InvoiceItemDraft = {
  item_description: "",
  hsn: "",
  quantity: "1",
  rate: "",
  gst_rate: "18",
};

const initialDraft: BillDraft = {
  vendor_name: "",
  vendor_address: "",
  vendor_gst: "",
  payment_terms: "Net 30",
  place_of_supply: "",
  bill_date: new Date().toISOString().slice(0, 10),
  due_date: "",
  zoho_vendor_id: "",
  items: [{ ...emptyItem }],
};

const money = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

export default function NewBillPage() {
  const router = useRouter();
  const { setTitle } = usePageTitle();
  const [draft, setDraft] = useState<BillDraft>(initialDraft);
  const [vendors, setVendors] = useState<ZohoVendor[]>([]);
  const [selectedVendorId, setSelectedVendorId] = useState<string>("");
  const [loadingVendors, setLoadingVendors] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setTitle("New expense bill");
    return () => setTitle(null);
  }, [setTitle]);

  useEffect(() => {
    const loadVendors = async () => {
      setLoadingVendors(true);
      try {
        const res = await zohoApi.getVendors();
        setVendors(res.data);
      } catch {
        setVendors([]);
      } finally {
        setLoadingVendors(false);
      }
    };
    void loadVendors();
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

  const onVendorSelect = (value: string) => {
    setSelectedVendorId(value);
    if (value === "__manual__") {
      setDraft((prev) => ({ ...prev, zoho_vendor_id: "" }));
      return;
    }
    const selected = vendors.find((vendor) => vendor.id === value);
    if (!selected) return;
    setDraft((prev) => ({
      ...prev,
      vendor_name: selected.name,
      vendor_address: selected.address || prev.vendor_address,
      vendor_gst: selected.gst_no || prev.vendor_gst,
      zoho_vendor_id: selected.id,
    }));
  };

  const onSave = async () => {
    if (!draft.vendor_name.trim()) {
      setError("Vendor name is required");
      return;
    }
    if (
      draft.items.length === 0 ||
      !draft.items.some((item) => item.item_description.trim())
    ) {
      setError("At least one bill item is required");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const payload: CreateBillInput = {
        vendor_name: draft.vendor_name.trim(),
        vendor_address: draft.vendor_address.trim(),
        vendor_gst: draft.vendor_gst.trim(),
        payment_terms: draft.payment_terms.trim(),
        place_of_supply: draft.place_of_supply.trim(),
        bill_date: draft.bill_date || undefined,
        due_date: draft.due_date || undefined,
        zoho_vendor_id: draft.zoho_vendor_id || undefined,
        items: draft.items
          .filter((item) => item.item_description.trim())
          .map((item) => ({
            item_description: item.item_description.trim(),
            hsn: item.hsn.trim(),
            quantity: Number(item.quantity || 0),
            rate: Number(item.rate || 0),
            gst_rate: Number(item.gst_rate || 0),
          })),
      };

      const result = await billsApi.create(payload);
      router.push(`/accounts/bills/${result.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create bill");
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageShell className="space-y-6 bg-background text-foreground">
      {error ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Create expense bill</CardTitle>
          <CardDescription>
            Saves in Wraptron and pushes to Zoho Books when an integration is
            connected.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label>Select vendor from Zoho Books</Label>
              <Select value={selectedVendorId} onValueChange={onVendorSelect}>
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      loadingVendors
                        ? "Loading vendors…"
                        : vendors.length > 0
                          ? "Select a Zoho vendor"
                          : "No Zoho vendors — enter manually"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {vendors.map((vendor) => (
                    <SelectItem key={vendor.id} value={vendor.id}>
                      {vendor.name}
                    </SelectItem>
                  ))}
                  <SelectItem value="__manual__">Manual entry</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Vendor name *</Label>
              <Input
                value={draft.vendor_name}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, vendor_name: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Vendor GST</Label>
              <Input
                value={draft.vendor_gst}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, vendor_gst: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Vendor address</Label>
              <Textarea
                rows={2}
                value={draft.vendor_address}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    vendor_address: e.target.value,
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Payment terms</Label>
              <Input
                value={draft.payment_terms}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    payment_terms: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Place of supply</Label>
              <Input
                value={draft.place_of_supply}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    place_of_supply: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Bill date</Label>
              <Input
                type="date"
                value={draft.bill_date}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, bill_date: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Due date</Label>
              <Input
                type="date"
                value={draft.due_date}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, due_date: e.target.value }))
                }
              />
            </div>
          </div>

          <InvoiceLineItemsTable
            items={draft.items}
            emptyItem={emptyItem}
            onItemsChange={(items) => setDraft((prev) => ({ ...prev, items }))}
          />

          <div className="flex justify-end">
            <div className="w-full max-w-xs rounded-md border bg-muted/40 p-3 text-sm space-y-1">
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

          <div className="flex justify-end gap-2">
            <Button variant="outline" asChild disabled={saving}>
              <Link href="/accounts/bills">Cancel</Link>
            </Button>
            <Button onClick={onSave} disabled={saving}>
              {saving ? "Creating…" : "Create & sync to Zoho"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </PageShell>
  );
}
