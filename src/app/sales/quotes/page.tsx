"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { usePageTitle } from "@/contexts/page-title-context";
import {
  invoicesApi,
  quotesApi,
  type Invoice,
  type Quote,
} from "@/lib/api";
import { PageShell } from "@/components/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Eye,
  FileText,
  Mail,
  Pencil,
  Plus,
  Receipt,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const money = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

function formatDate(value?: string | null) {
  if (!value) return "—";
  return value.slice(0, 10);
}

function expiryFromQuoteDate(value?: string | null) {
  if (!value) return null;
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  if (!year || !month || !day) return null;
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + 30);
  return date.toISOString().slice(0, 10);
}

function normalizeInvoiceStatus(status?: string | null): "draft" | "sent" {
  const value = String(status || "").trim().toLowerCase();
  if (!value || value === "draft") return "draft";
  return "sent";
}

export default function QuotesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setTitle } = usePageTitle();
  const initialTab =
    searchParams.get("tab") === "invoices" ? "invoices" : "quotes";
  const [tab, setTab] = useState<"quotes" | "invoices">(initialTab);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loadingQuotes, setLoadingQuotes] = useState(true);
  const [loadingInvoices, setLoadingInvoices] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [deleteQuoteOpen, setDeleteQuoteOpen] = useState(false);
  const [deleteInvoiceOpen, setDeleteInvoiceOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [sendingInvoiceId, setSendingInvoiceId] = useState<number | null>(null);

  useEffect(() => {
    setTitle(tab === "invoices" ? "Invoices" : "Quotes");
    return () => setTitle(null);
  }, [setTitle, tab]);

  const loadQuotes = useCallback(async () => {
    setLoadingQuotes(true);
    try {
      const list = await quotesApi.getAll({ limit: 200 });
      setQuotes(list.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load quotes");
    } finally {
      setLoadingQuotes(false);
    }
  }, []);

  const loadInvoices = useCallback(async () => {
    setLoadingInvoices(true);
    try {
      const list = await invoicesApi.getAll({ limit: 200 });
      setInvoices(list.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load invoices");
    } finally {
      setLoadingInvoices(false);
    }
  }, []);

  useEffect(() => {
    loadQuotes();
    loadInvoices();
  }, [loadQuotes, loadInvoices]);

  useEffect(() => {
    const next = searchParams.get("tab") === "invoices" ? "invoices" : "quotes";
    setTab(next);
  }, [searchParams]);

  const onTabChange = (value: string) => {
    const next = value === "invoices" ? "invoices" : "quotes";
    setTab(next);
    const url =
      next === "invoices" ? "/sales/quotes?tab=invoices" : "/sales/quotes";
    router.replace(url);
  };

  const onDeleteQuote = async () => {
    if (!selectedQuote) return;
    setDeleting(true);
    try {
      await quotesApi.delete(selectedQuote.id);
      setDeleteQuoteOpen(false);
      setSelectedQuote(null);
      await loadQuotes();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete quote");
    } finally {
      setDeleting(false);
    }
  };

  const onDeleteInvoice = async () => {
    if (!selectedInvoice) return;
    setDeleting(true);
    try {
      await invoicesApi.delete(selectedInvoice.id);
      setDeleteInvoiceOpen(false);
      setSelectedInvoice(null);
      await Promise.all([loadInvoices(), loadQuotes()]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete invoice");
    } finally {
      setDeleting(false);
    }
  };

  const onSendInvoice = async (invoice: Invoice) => {
    setSendingInvoiceId(invoice.id);
    setError(null);
    setMessage(null);
    try {
      const result = await invoicesApi.send(invoice.id);
      setMessage(`Invoice emailed to ${result.sent_to}`);
      await loadInvoices();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send invoice");
    } finally {
      setSendingInvoiceId(null);
    }
  };

  const openInvoicePreview = (invoice: Invoice) => {
    if (invoice.quote_id) {
      router.push(`/sales/quotes/${invoice.quote_id}/preview`);
      return;
    }
    router.push(`/accounts/invoices/${invoice.id}`);
  };

  return (
    <PageShell className="space-y-6 bg-background text-foreground">
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}
      {message && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
          {message}
        </div>
      )}

      <Card className="gap-0 overflow-hidden py-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/30 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              {tab === "invoices" ? (
                <Receipt className="h-5 w-5" />
              ) : (
                <FileText className="h-5 w-5" />
              )}
            </div>
            <div>
              <CardTitle className="text-lg tracking-tight">
                Quotes & Invoices
              </CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Manage quotations and converted invoices in one place
              </p>
            </div>
          </div>
          {tab === "quotes" ? (
            <Button onClick={() => router.push("/sales/quotes/new")}>
              <Plus className="h-4 w-4" />
              New Quote
            </Button>
          ) : null}
        </CardHeader>
        <CardContent className="px-6 py-6">
          <Tabs value={tab} onValueChange={onTabChange}>
            <TabsList className="mb-4">
              <TabsTrigger value="quotes">Quotes</TabsTrigger>
              <TabsTrigger value="invoices">Invoices</TabsTrigger>
            </TabsList>

            <TabsContent value="quotes" className="mt-0">
              {loadingQuotes ? (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  Loading quotes...
                </div>
              ) : quotes.length === 0 ? (
                <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-14 text-center">
                  <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">No quotes yet</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Create a project quotation for a customer.
                    </p>
                  </div>
                  <Button
                    className="mt-1"
                    onClick={() => router.push("/sales/quotes/new")}
                  >
                    <Plus className="h-4 w-4" />
                    New Quote
                  </Button>
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50 hover:bg-muted/50">
                        <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          Quote
                        </TableHead>
                        <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          Customer
                        </TableHead>
                        <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          Date
                        </TableHead>
                        <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          Expiry
                        </TableHead>
                        <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          Status
                        </TableHead>
                        <TableHead className="text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          Total
                        </TableHead>
                        <TableHead className="w-[140px] text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {quotes.map((row) => (
                        <TableRow key={row.id} className="hover:bg-muted/30">
                          <TableCell className="font-medium tracking-tight">
                            {row.quote_number}
                          </TableCell>
                          <TableCell>{row.customer_name}</TableCell>
                          <TableCell>{formatDate(row.quote_date)}</TableCell>
                          <TableCell>
                            {formatDate(
                              row.expiry_date ||
                                expiryFromQuoteDate(row.quote_date),
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={cn(
                                row.status === "sent"
                                  ? "border-blue-200 bg-blue-50 text-blue-800"
                                  : "border-border bg-muted text-muted-foreground",
                              )}
                            >
                              {row.status === "sent" ? "Sent" : "Draft"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium tabular-nums">
                            {money(
                              Number(row.subtotal || 0) +
                                Number(row.tax_total || 0) +
                                Number(row.adjustment_amount || 0),
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  router.push(
                                    `/sales/quotes/${row.id}/preview`,
                                  )
                                }
                                aria-label="Preview and print quote"
                                title="Preview and print quote"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  router.push(`/sales/quotes/${row.id}`)
                                }
                                aria-label="Edit quote"
                                title="Edit quote"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:text-red-700"
                                onClick={() => {
                                  setSelectedQuote(row);
                                  setDeleteQuoteOpen(true);
                                }}
                                aria-label="Delete quote"
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
            </TabsContent>

            <TabsContent value="invoices" className="mt-0">
              {loadingInvoices ? (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  Loading invoices...
                </div>
              ) : invoices.length === 0 ? (
                <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-14 text-center">
                  <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <Receipt className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">No invoices yet</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Convert a quote to move it here as an invoice.
                    </p>
                  </div>
                  <Button
                    className="mt-1"
                    variant="outline"
                    onClick={() => onTabChange("quotes")}
                  >
                    Go to quotes
                  </Button>
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50 hover:bg-muted/50">
                        <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          Invoice
                        </TableHead>
                        <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          Customer
                        </TableHead>
                        <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          Date
                        </TableHead>
                        <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          Due
                        </TableHead>
                        <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          Status
                        </TableHead>
                        <TableHead className="text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          Total
                        </TableHead>
                        <TableHead className="w-[180px] text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoices.map((row) => {
                        const status = normalizeInvoiceStatus(row.status);
                        return (
                          <TableRow key={row.id} className="hover:bg-muted/30">
                            <TableCell className="font-medium tracking-tight">
                              {row.invoice_number}
                            </TableCell>
                            <TableCell>{row.customer_name}</TableCell>
                            <TableCell>
                              {formatDate(row.invoice_date)}
                            </TableCell>
                            <TableCell>{formatDate(row.due_date)}</TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={cn(
                                  status === "sent"
                                    ? "border-blue-200 bg-blue-50 text-blue-800"
                                    : "border-border bg-muted text-muted-foreground",
                                )}
                              >
                                {status === "sent" ? "Sent" : "Draft"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-medium tabular-nums">
                              {money(Number(row.total || 0))}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openInvoicePreview(row)}
                                  aria-label="Preview invoice"
                                  title="Preview invoice"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    router.push(`/invoices/${row.id}/edit`)
                                  }
                                  aria-label="Edit invoice"
                                  title="Edit invoice"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={sendingInvoiceId === row.id}
                                  onClick={() => onSendInvoice(row)}
                                  aria-label="Send invoice email"
                                  title="Send invoice email"
                                >
                                  <Mail className="h-4 w-4 text-blue-600" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700"
                                  onClick={() => {
                                    setSelectedInvoice(row);
                                    setDeleteInvoiceOpen(true);
                                  }}
                                  aria-label="Delete invoice"
                                  title="Delete invoice"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={deleteQuoteOpen} onOpenChange={setDeleteQuoteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete quote</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedQuote?.quote_number}?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteQuoteOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={onDeleteQuote}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteInvoiceOpen} onOpenChange={setDeleteInvoiceOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete invoice</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedInvoice?.invoice_number}?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteInvoiceOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={onDeleteInvoice}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
