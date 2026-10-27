"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePageTitle } from "@/contexts/page-title-context";
import { quotesApi, type Quote } from "@/lib/api";
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
import { Eye, FileText, Pencil, Plus, Trash2 } from "lucide-react";
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

export default function QuotesPage() {
  const router = useRouter();
  const { setTitle } = usePageTitle();
  const [rows, setRows] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Quote | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setTitle("Quotes");
    return () => setTitle(null);
  }, [setTitle]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await quotesApi.getAll({ limit: 200 });
      setRows(list.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load quotes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onDelete = async () => {
    if (!selected) return;
    setDeleting(true);
    try {
      await quotesApi.delete(selected.id);
      setDeleteOpen(false);
      setSelected(null);
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete quote");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <PageShell className="space-y-6 bg-background text-foreground">
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <Card className="gap-0 overflow-hidden py-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/30 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg tracking-tight">Quotes</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Drafts and sent project quotations
              </p>
            </div>
          </div>
          <Button onClick={() => router.push("/sales/quotes/new")}>
            <Plus className="h-4 w-4" />
            New Quote
          </Button>
        </CardHeader>
        <CardContent className="px-6 py-6">
          {loading ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Loading quotes...
            </div>
          ) : rows.length === 0 ? (
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
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Quote</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Customer</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Date</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Expiry</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Status</TableHead>
                    <TableHead className="text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Total</TableHead>
                    <TableHead className="w-[140px] text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.id} className="hover:bg-muted/30">
                      <TableCell className="font-medium tracking-tight">
                        {row.quote_number}
                      </TableCell>
                      <TableCell>{row.customer_name}</TableCell>
                      <TableCell>{formatDate(row.quote_date)}</TableCell>
                      <TableCell>
                        {formatDate(row.expiry_date || expiryFromQuoteDate(row.quote_date))}
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
                              router.push(`/sales/quotes/${row.id}/preview`)
                            }
                            aria-label="Preview and print quote"
                            title="Preview and print quote"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/sales/quotes/${row.id}`)}
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
                              setSelected(row);
                              setDeleteOpen(true);
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
        </CardContent>
      </Card>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete quote</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selected?.quote_number}? This
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
            <Button variant="destructive" onClick={onDelete} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
