"use client";

import { PageShell } from "@/components/page-shell";
import { cn } from "@/lib/utils";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { usePageTitle } from "@/contexts/page-title-context";
import { invoicesApi, type Invoice } from "@/lib/api";
import {
  CollectionView,
  type CollectionColumn,
  type CollectionItem,
} from "@/components/collection-view";
import {
  CollectionKanbanView,
  type CollectionKanbanColumn,
} from "@/components/collection-kanban-view";
import {
  CollectionPageToolbar,
  useCollectionViewMode,
  type CollectionViewMode,
} from "@/components/collection-page-toolbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Eye, RefreshCw, Search, Trash2 } from "lucide-react";

const LIST_LIMIT = 500;

const KANBAN_COLUMNS: CollectionKanbanColumn[] = [
  { id: "paid", label: "Paid" },
  { id: "draft", label: "Draft" },
  { id: "overdue", label: "Overdue" },
  { id: "due_soon", label: "Due soon" },
  { id: "upcoming", label: "Upcoming" },
  { id: "no_due", label: "No due date" },
];

const CLOSED_STATUSES = new Set(["paid", "void"]);

function todayDateString(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateOnly(value?: string | null): string | null {
  if (!value?.trim()) return null;
  const match = value.trim().match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : null;
}

function daysBetween(from: string, to: string): number {
  const [fromYear, fromMonth, fromDay] = from.split("-").map(Number);
  const [toYear, toMonth, toDay] = to.split("-").map(Number);
  const fromUtc = Date.UTC(fromYear, fromMonth - 1, fromDay);
  const toUtc = Date.UTC(toYear, toMonth - 1, toDay);
  return Math.round((toUtc - fromUtc) / (1000 * 60 * 60 * 24));
}

const money = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

function formatDate(value?: string) {
  if (!value) return "—";
  return value.slice(0, 10);
}

function invoiceStatusKey(invoice: Invoice): string | null {
  const status = invoice.status?.trim().toLowerCase();
  return status || null;
}

function invoiceDueBucket(invoice: Invoice): string {
  const status = invoiceStatusKey(invoice);
  if (status === "draft") return "draft";
  if (status && CLOSED_STATUSES.has(status)) return "paid";

  const dueDate = parseDateOnly(invoice.due_date);
  if (!dueDate) return "no_due";

  const today = todayDateString();
  if (status === "overdue" || dueDate < today) {
    return "overdue";
  }

  const diffDays = daysBetween(today, dueDate);
  if (diffDays <= 7) return "due_soon";
  return "upcoming";
}

function statusBadgeLabel(status: string): string {
  return status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function dueBadge(invoice: Invoice) {
  const status = invoiceStatusKey(invoice);
  if (status === "paid") {
    return <Badge className="bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">Paid</Badge>;
  }
  if (status === "void") {
    return <Badge variant="outline">Void</Badge>;
  }
  if (status === "draft") {
    return <Badge variant="outline">Draft</Badge>;
  }
  if (status === "partially_paid") {
    return (
      <Badge className="bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-200">
        Partially paid
      </Badge>
    );
  }
  if (status === "overdue") {
    return <Badge variant="destructive">Overdue</Badge>;
  }
  if (status === "sent" || status === "viewed" || status === "unpaid") {
    const bucket = invoiceDueBucket(invoice);
    if (bucket === "overdue") {
      return <Badge variant="destructive">Overdue</Badge>;
    }
    if (bucket === "due_soon") {
      return (
        <Badge className="bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200">
          Due soon
        </Badge>
      );
    }
    return <Badge variant="secondary">{statusBadgeLabel(status)}</Badge>;
  }

  const bucket = invoiceDueBucket(invoice);
  if (bucket === "overdue") {
    return <Badge variant="destructive">Overdue</Badge>;
  }
  if (bucket === "due_soon") {
    return (
      <Badge className="bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200">
        Due soon
      </Badge>
    );
  }
  if (bucket === "no_due") {
    return <Badge variant="outline">No due date</Badge>;
  }
  return <Badge variant="secondary">Upcoming</Badge>;
}

function invoiceToCollectionItem(invoice: Invoice): CollectionItem {
  return {
    id: invoice.id,
    title: invoice.invoice_number,
    description: invoice.customer_name,
    meta: money(Number(invoice.total || 0)),
  };
}

function buildInvoiceColumns(
  invoices: Invoice[],
  onView: (invoice: Invoice) => void,
  onDelete: (invoice: Invoice) => void,
): CollectionColumn[] {
  const byId = new Map(invoices.map((inv) => [inv.id, inv]));

  return [
    {
      id: "invoice_number",
      header: "Invoice #",
      headerClassName: "w-[140px]",
      sortValue: (item) => byId.get(Number(item.id))?.invoice_number ?? "",
      cell: (item) => {
        const inv = byId.get(Number(item.id));
        return (
          <span className="font-mono text-sm font-medium">
            {inv?.invoice_number ?? "—"}
          </span>
        );
      },
    },
    {
      id: "customer_name",
      header: "Customer",
      headerClassName: "w-[220px]",
      sortValue: (item) => byId.get(Number(item.id))?.customer_name ?? "",
      cell: (item) => byId.get(Number(item.id))?.customer_name ?? "—",
    },
    {
      id: "invoice_date",
      header: "Invoice date",
      sortValue: (item) => {
        const date = byId.get(Number(item.id))?.invoice_date;
        return date ? new Date(date) : "";
      },
      cell: (item) => formatDate(byId.get(Number(item.id))?.invoice_date),
    },
    {
      id: "status",
      header: "Status",
      sortValue: (item) => {
        const inv = byId.get(Number(item.id));
        return inv ? (invoiceStatusKey(inv) ?? "") : "";
      },
      cell: (item) => {
        const inv = byId.get(Number(item.id));
        return inv ? dueBadge(inv) : "—";
      },
    },
    {
      id: "due_date",
      header: "Due date",
      sortValue: (item) => {
        const date = byId.get(Number(item.id))?.due_date;
        return date ? new Date(date) : "";
      },
      cell: (item) => formatDate(byId.get(Number(item.id))?.due_date),
    },
    {
      id: "total",
      header: "Total",
      sortValue: (item) => Number(byId.get(Number(item.id))?.total || 0),
      cell: (item) => {
        const inv = byId.get(Number(item.id));
        return inv ? money(Number(inv.total || 0)) : "—";
      },
    },
    {
      id: "payment_terms",
      header: "Terms",
      sortValue: (item) => byId.get(Number(item.id))?.payment_terms ?? "",
      cell: (item) => byId.get(Number(item.id))?.payment_terms ?? "—",
    },
    {
      id: "actions",
      header: "",
      className: "text-right",
      headerClassName: "text-right w-[100px]",
      sortable: false,
      cell: (item) => {
        const inv = byId.get(Number(item.id));
        if (!inv) return null;
        return (
          <div
            className="flex justify-end gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              variant="outline"
              size="sm"
              onClick={() => onView(inv)}
              aria-label={`View ${inv.invoice_number}`}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => onDelete(inv)}
              aria-label={`Delete ${inv.invoice_number}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];
}

function InvoiceCard({
  invoice,
  onView,
  onDelete,
}: {
  invoice: Invoice;
  onView: () => void;
  onDelete: () => void;
}) {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="truncate font-mono text-base">
              {invoice.invoice_number}
            </CardTitle>
            <p className="mt-1 truncate text-sm text-muted-foreground">
              {invoice.customer_name}
            </p>
          </div>
          {dueBadge(invoice)}
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Total</span>
          <span className="font-semibold">{money(Number(invoice.total || 0))}</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>Invoice date</span>
          <span>{formatDate(invoice.invoice_date)}</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>Due date</span>
          <span>{formatDate(invoice.due_date)}</span>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="outline" size="sm" onClick={onView}>
            <Eye className="mr-1 h-4 w-4" />
            View
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AccountsInvoicesPage() {
  const router = useRouter();
  const { setTitle } = usePageTitle();
  const [viewMode, setViewMode] = useCollectionViewMode(
    "accounts_invoices_view_mode",
    "list",
  );
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<Invoice | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    setTitle("Invoices");
    return () => setTitle(null);
  }, [setTitle]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await invoicesApi.getAll({
        search: debouncedSearch || undefined,
        limit: LIST_LIMIT,
      });
      setInvoices(list.data);
      setTotal(list.total);
      setSelectedIds([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load invoices");
      setInvoices([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const collectionItems = useMemo(
    () => invoices.map(invoiceToCollectionItem),
    [invoices],
  );

  const invoiceById = useMemo(
    () => new Map(invoices.map((inv) => [inv.id, inv])),
    [invoices],
  );

  const openView = (invoice: Invoice) => {
    router.push(`/accounts/invoices/${invoice.id}`);
  };

  const openDelete = (invoice: Invoice) => {
    setSelected(invoice);
    setDeleteOpen(true);
  };

  const onDelete = async () => {
    if (!selected) return;
    setActionLoading(true);
    try {
      await invoicesApi.delete(selected.id);
      setDeleteOpen(false);
      setSelected(null);
      await fetchInvoices();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete invoice");
    } finally {
      setActionLoading(false);
    }
  };

  const invoiceTableColumns = useMemo(
    () => buildInvoiceColumns(invoices, openView, openDelete),
    [invoices],
  );

  const listDescription = loading
    ? "Loading…"
    : `${invoices.length} shown${total > invoices.length ? ` of ${total}` : ""}`;

  const renderInvoices = (mode: CollectionViewMode) => {
    if (mode === "list") {
      return (
        <CollectionView
          loading={loading}
          items={collectionItems}
          columns={invoiceTableColumns}
          primaryColumnId="invoice_number"
          selectable
          selectedIds={selectedIds}
          onSelectedIdsChange={(ids) =>
            setSelectedIds(ids.map((id) => Number(id)))
          }
          onRowClick={(item) => {
            const inv = invoiceById.get(Number(item.id));
            if (inv) openView(inv);
          }}
          emptyTitle="No invoices yet"
          emptyDescription="Create an invoice or sync from Zoho Books."
          emptyMessage="No invoices found."
          loadingMessage="Loading invoices…"
        />
      );
    }

    if (mode === "kanban") {
      return (
        <CollectionKanbanView
          loading={loading}
          items={collectionItems}
          columns={KANBAN_COLUMNS}
          groupBy={(item) => {
            const inv = invoiceById.get(Number(item.id));
            return inv ? invoiceDueBucket(inv) : "no_due";
          }}
          getColumnSubtext={(_columnId, columnItems) => {
            const count = columnItems.length;
            return `${count} invoice${count !== 1 ? "s" : ""}`;
          }}
          renderCard={(item) => {
            const inv = invoiceById.get(Number(item.id));
            if (!inv) return null;
            return (
              <Card
                className="cursor-pointer border border-border bg-card shadow-none transition-shadow hover:shadow-md"
                onClick={() => openView(inv)}
              >
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-mono text-sm font-semibold">
                      {inv.invoice_number}
                    </h4>
                    {dueBadge(inv)}
                  </div>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {inv.customer_name}
                  </p>
                  <p className="mt-2 text-sm font-medium">
                    {money(Number(inv.total || 0))}
                  </p>
                </CardContent>
              </Card>
            );
          }}
          emptyMessage="No invoices found."
          loadingMessage="Loading invoices…"
        />
      );
    }

    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {invoices.map((invoice) => (
          <InvoiceCard
            key={invoice.id}
            invoice={invoice}
            onView={() => openView(invoice)}
            onDelete={() => openDelete(invoice)}
          />
        ))}
      </div>
    );
  };

  const showEmpty = !loading && !error && invoices.length === 0;

  return (
    <PageShell fill className="bg-background text-foreground">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Invoices</h1>
            <p className="mt-1 text-muted-foreground">{listDescription}</p>
          </div>

          <CollectionPageToolbar
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            newAction={{
              label: "New Invoice",
              href: "/invoices/new",
              ariaLabel: "Create new invoice",
            }}
            className="w-full lg:w-auto"
          >
            <div className="relative min-w-0 flex-1 sm:w-72">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search invoice # or customer…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
                aria-label="Search invoices"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fetchInvoices()}
              disabled={loading}
              aria-label="Refresh invoices"
            >
              <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </CollectionPageToolbar>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            {error}
          </div>
        )}

        {!error && (
          <div
            className={cn(
              "min-h-0",
              viewMode === "kanban" && "flex flex-1 flex-col",
            )}
          >
            {renderInvoices(viewMode)}
          </div>
        )}

        {showEmpty && viewMode !== "list" && (
          <div className="mt-8 text-center text-muted-foreground">
            <p>No invoices yet.</p>
            <Button
              className="mt-4"
              variant="outline"
              onClick={() => router.push("/invoices/new")}
            >
              Create your first invoice
            </Button>
          </div>
        )}

        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete invoice</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete {selected?.invoice_number}? This
                action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteOpen(false)}
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={onDelete}
                disabled={actionLoading}
              >
                {actionLoading ? "Deleting…" : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageShell>
  );
}
