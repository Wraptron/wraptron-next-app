"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { usePageTitle } from "@/contexts/page-title-context";
import {
  invoicesApi,
  invoiceSettingsApi,
  type Invoice,
  type InvoiceSettings,
} from "@/lib/api";
import { InvoicePreview } from "@/components/invoice-preview";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowLeft, Loader2, Trash2 } from "lucide-react";

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { setTitle } = usePageTitle();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [settings, setSettings] = useState<InvoiceSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const id = typeof params.id === "string" ? parseInt(params.id, 10) : NaN;

  useEffect(() => {
    if (Number.isNaN(id)) {
      setError("Invalid invoice ID");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    Promise.all([invoicesApi.getById(id), invoiceSettingsApi.get()])
      .then(([invoiceData, invoiceSettings]) => {
        setInvoice(invoiceData);
        setSettings(invoiceSettings);
      })
      .catch(() => setError("Failed to load invoice"))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (invoice) {
      setTitle(`Invoice ${invoice.invoice_number}`);
    } else {
      setTitle(null);
    }
    return () => setTitle(null);
  }, [invoice, setTitle]);

  const handleDelete = async () => {
    if (!invoice) return;
    setDeleting(true);
    try {
      await invoicesApi.delete(invoice.id);
      router.push("/accounts/invoices");
    } catch {
      setError("Failed to delete invoice");
      setDeleteOpen(false);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <p className="mb-4 text-destructive">{error || "Invoice not found"}</p>
            <Link href="/accounts/invoices">
              <Button variant="outline">Back to invoices</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6">
          <Link href="/accounts/invoices">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to invoices
            </Button>
          </Link>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">{invoice.invoice_number}</h1>
              <p className="mt-1 text-muted-foreground">{invoice.customer_name}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            <InvoicePreview invoice={invoice} settings={settings} />
          </CardContent>
        </Card>

        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete invoice</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete {invoice.invoice_number}? This
                action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteOpen(false)}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? "Deleting…" : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
