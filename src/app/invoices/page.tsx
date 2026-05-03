"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { usePageTitle } from "@/contexts/page-title-context";
import {
  invoicesApi,
  invoiceSettingsApi,
  type Invoice,
  type InvoiceItem,
  type CreateInvoiceInput,
  type InvoiceSettings,
} from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Eye, Plus, Trash2, Pencil } from "lucide-react";

type InvoiceItemDraft = {
  item_description: string;
  hsn: string;
  quantity: string;
  rate: string;
  gst_rate: string;
};

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

const emptyDraft: InvoiceDraft = {
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

export default function InvoicesPage() {
  const router = useRouter();
  const { setTitle } = usePageTitle();
  const [rows, setRows] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<InvoiceSettings | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Invoice | null>(null);
  const [selected, setSelected] = useState<Invoice | null>(null);
  const [draft, setDraft] = useState<InvoiceDraft>(emptyDraft);

  useEffect(() => {
    setTitle("Invoices");
    return () => setTitle(null);
  }, [setTitle]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [list, invoiceSettings] = await Promise.all([
        invoicesApi.getAll({ limit: 200 }),
        invoiceSettingsApi.get(),
      ]);
      setRows(list.data);
      setSettings(invoiceSettings);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load invoices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
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

  const openCreate = () => {
    router.push("/invoices/new");
  };

  const openEdit = async (invoice: Invoice) => {
    try {
      const full = await invoicesApi.getById(invoice.id);
      setEditing(full);
      setDraft({
        customer_name: full.customer_name || "",
        customer_address: full.customer_address || "",
        customer_gst: full.customer_gst || "",
        payment_terms: full.payment_terms || "Net 30",
        place_of_supply: full.place_of_supply || "",
        invoice_date: full.invoice_date?.slice(0, 10) || new Date().toISOString().slice(0, 10),
        due_date: full.due_date?.slice(0, 10) || "",
        terms_and_conditions: full.terms_and_conditions || "",
        authorized_signature: full.authorized_signature || "",
        items:
          full.items?.map((i: InvoiceItem) => ({
            item_description: i.item_description || "",
            hsn: i.hsn || "",
            quantity: String(i.quantity ?? 1),
            rate: String(i.rate ?? 0),
            gst_rate: String(i.gst_rate ?? 18),
          })) || [{ ...emptyItem }],
      });
      setFormOpen(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load invoice");
    }
  };

  const openView = async (invoice: Invoice) => {
    try {
      const full = await invoicesApi.getById(invoice.id);
      setSelected(full);
      setViewOpen(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to open invoice");
    }
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
      if (editing) {
        await invoicesApi.update(editing.id, payload);
      } else {
        await invoicesApi.create(payload);
      }
      setFormOpen(false);
      setEditing(null);
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save invoice");
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await invoicesApi.delete(selected.id);
      setDeleteOpen(false);
      setSelected(null);
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete invoice");
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
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Invoices</CardTitle>
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4 mr-2" />
              New Invoice
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-8 text-center">Loading invoices...</div>
            ) : rows.length === 0 ? (
              <div className="py-8 text-center text-gray-600">No invoices created yet.</div>
            ) : (
              <div className="rounded-md border bg-white">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead className="w-[180px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="font-medium">{row.invoice_number}</TableCell>
                        <TableCell>{row.customer_name}</TableCell>
                        <TableCell>{row.invoice_date?.slice(0, 10)}</TableCell>
                        <TableCell>{money(Number(row.total || 0))}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => openView(row)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => openEdit(row)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => {
                                setSelected(row);
                                setDeleteOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={formOpen} onOpenChange={setFormOpen}>
          <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? "Update Invoice" : "Create Invoice"}</DialogTitle>
              <DialogDescription>
                Enter customer details, invoice items, GST breakup and terms.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
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

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base">Items</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setDraft((p) => ({ ...p, items: [...p.items, { ...emptyItem }] }))
                  }
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Item
                </Button>
              </div>
              {draft.items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-12 md:col-span-4">
                    <Label>Item</Label>
                    <Input
                      value={item.item_description}
                      onChange={(e) =>
                        setDraft((p) => ({
                          ...p,
                          items: p.items.map((it, i) =>
                            i === idx ? { ...it, item_description: e.target.value } : it,
                          ),
                        }))
                      }
                    />
                  </div>
                  <div className="col-span-6 md:col-span-2">
                    <Label>HSN</Label>
                    <Input
                      value={item.hsn}
                      onChange={(e) =>
                        setDraft((p) => ({
                          ...p,
                          items: p.items.map((it, i) => (i === idx ? { ...it, hsn: e.target.value } : it)),
                        }))
                      }
                    />
                  </div>
                  <div className="col-span-6 md:col-span-1">
                    <Label>Qty</Label>
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) =>
                        setDraft((p) => ({
                          ...p,
                          items: p.items.map((it, i) =>
                            i === idx ? { ...it, quantity: e.target.value } : it,
                          ),
                        }))
                      }
                    />
                  </div>
                  <div className="col-span-6 md:col-span-2">
                    <Label>Rate</Label>
                    <Input
                      type="number"
                      value={item.rate}
                      onChange={(e) =>
                        setDraft((p) => ({
                          ...p,
                          items: p.items.map((it, i) => (i === idx ? { ...it, rate: e.target.value } : it)),
                        }))
                      }
                    />
                  </div>
                  <div className="col-span-4 md:col-span-1">
                    <Label>GST %</Label>
                    <Input
                      type="number"
                      value={item.gst_rate}
                      onChange={(e) =>
                        setDraft((p) => ({
                          ...p,
                          items: p.items.map((it, i) =>
                            i === idx ? { ...it, gst_rate: e.target.value } : it,
                          ),
                        }))
                      }
                    />
                  </div>
                  <div className="col-span-8 md:col-span-1">
                    <Label>Amount</Label>
                    <Input
                      readOnly
                      value={money(Number(item.quantity || 0) * Number(item.rate || 0))}
                    />
                  </div>
                  <div className="col-span-12 md:col-span-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      disabled={draft.items.length === 1}
                      onClick={() =>
                        setDraft((p) => ({
                          ...p,
                          items: p.items.filter((_, i) => i !== idx),
                        }))
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

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

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setFormOpen(false);
                  setEditing(null);
                }}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button onClick={onSave} disabled={saving}>
                {saving ? "Saving..." : editing ? "Update Invoice" : "Create Invoice"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={viewOpen} onOpenChange={setViewOpen}>
          <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Invoice {selected?.invoice_number}</DialogTitle>
              <DialogDescription>Invoice preview</DialogDescription>
            </DialogHeader>
            {selected && (
              <div className="space-y-4 text-sm">
                <div className="flex justify-between">
                  <div>
                    <div className="font-semibold text-base">{settings?.company_name || "Company"}</div>
                    <div className="whitespace-pre-line">{settings?.company_address || "-"}</div>
                    <div>GSTIN: {settings?.company_gst || "-"}</div>
                    {settings?.company_logo_url && (
                      <img
                        src={settings.company_logo_url}
                        alt="Company logo"
                        className="h-10 mt-2 object-contain"
                      />
                    )}
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-lg">TAX INVOICE</div>
                    <div>#{selected.invoice_number}</div>
                    <div>Invoice Date: {selected.invoice_date?.slice(0, 10)}</div>
                    <div>Due Date: {selected.due_date?.slice(0, 10) || "-"}</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="font-semibold">Bill To</div>
                    <div>{selected.customer_name}</div>
                    <div className="whitespace-pre-line">{selected.customer_address || "-"}</div>
                    <div>GSTIN: {selected.customer_gst || "-"}</div>
                  </div>
                  <div>
                    <div>Payment terms: {selected.payment_terms || "-"}</div>
                    <div>Place of supply: {selected.place_of_supply || "-"}</div>
                  </div>
                </div>

                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>HSN</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Rate</TableHead>
                        <TableHead>Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selected.items?.map((it, idx) => (
                        <TableRow key={it.id ?? idx}>
                          <TableCell>{it.item_description}</TableCell>
                          <TableCell>{it.hsn}</TableCell>
                          <TableCell>{it.quantity}</TableCell>
                          <TableCell>{money(Number(it.rate || 0))}</TableCell>
                          <TableCell>{money(Number(it.amount || 0))}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="ml-auto max-w-xs rounded-md border bg-gray-50 p-3 space-y-1">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{money(Number(selected.subtotal || 0))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>CGST</span>
                    <span>{money(Number(selected.cgst_total || 0))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>SGST</span>
                    <span>{money(Number(selected.sgst_total || 0))}</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span>{money(Number(selected.total || 0))}</span>
                  </div>
                </div>

                <div>
                  <div className="font-semibold">Terms and Conditions</div>
                  <div className="whitespace-pre-line">{selected.terms_and_conditions || "-"}</div>
                </div>
                <div>
                  <div className="font-semibold">Authorized Signature</div>
                  <div>{selected.authorized_signature || "-"}</div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete invoice</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete {selected?.invoice_number}? This action cannot be
                undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={saving}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={onDelete} disabled={saving}>
                {saving ? "Deleting..." : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
