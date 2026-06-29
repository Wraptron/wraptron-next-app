"use client";

import { PageShell } from "@/components/page-shell";
import { cn } from "@/lib/utils";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePageTitle } from "@/contexts/page-title-context";
import { billsApi, type Bill } from "@/lib/api";
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
import { CollectionFilterControls } from "@/components/collection-filters";
import { useCollectionPageFilters } from "@/components/collection-page-filters";
import { useCollectionData } from "@/hooks/use-collection-data";
import { getCollectionFilterDefinitions } from "@/lib/collection-filter-definitions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Eye, RefreshCw, Trash2 } from "lucide-react";

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

function billStatusKey(bill: Bill): string | null {
  const status = bill.status?.trim().toLowerCase();
  return status || null;
}

function billDueBucket(bill: Bill): string {
  const status = billStatusKey(bill);
  if (status === "draft") return "draft";
  if (status && CLOSED_STATUSES.has(status)) return "paid";

  const dueDate = parseDateOnly(bill.due_date);
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

function dueBadge(bill: Bill) {
  const status = billStatusKey(bill);
  if (status === "paid") {
    return (
      <Badge className="bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
        Paid
      </Badge>
    );
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
  if (
    status === "open" ||
    status === "unpaid" ||
    status === "sent" ||
    status === "viewed"
  ) {
    const bucket = billDueBucket(bill);
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

  const bucket = billDueBucket(bill);
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

function billToCollectionItem(bill: Bill): CollectionItem {
  return {
    id: bill.id,
    title: bill.bill_number,
    description: bill.vendor_name,
    meta: money(Number(bill.total || 0)),
  };
}

function buildBillColumns(
  bills: Bill[],
  onView: (bill: Bill) => void,
  onDelete: (bill: Bill) => void,
): CollectionColumn[] {
  const byId = new Map(bills.map((bill) => [bill.id, bill]));

  return [
    {
      id: "bill_number",
      header: "Bill #",
      headerClassName: "w-[140px]",
      sortValue: (item) => byId.get(Number(item.id))?.bill_number ?? "",
      cell: (item) => {
        const bill = byId.get(Number(item.id));
        return (
          <span className="font-mono text-sm font-medium">
            {bill?.bill_number ?? "—"}
          </span>
        );
      },
    },
    {
      id: "vendor_name",
      header: "Vendor",
      headerClassName: "w-[220px]",
      sortValue: (item) => byId.get(Number(item.id))?.vendor_name ?? "",
      cell: (item) => byId.get(Number(item.id))?.vendor_name ?? "—",
    },
    {
      id: "bill_date",
      header: "Bill date",
      sortValue: (item) => {
        const date = byId.get(Number(item.id))?.bill_date;
        return date ? new Date(date) : "";
      },
      cell: (item) => formatDate(byId.get(Number(item.id))?.bill_date),
    },
    {
      id: "status",
      header: "Status",
      sortValue: (item) => {
        const bill = byId.get(Number(item.id));
        return bill ? (billStatusKey(bill) ?? "") : "";
      },
      cell: (item) => {
        const bill = byId.get(Number(item.id));
        return bill ? dueBadge(bill) : "—";
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
        const bill = byId.get(Number(item.id));
        return bill ? money(Number(bill.total || 0)) : "—";
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
        const bill = byId.get(Number(item.id));
        if (!bill) return null;
        return (
          <div
            className="flex justify-end gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              variant="outline"
              size="sm"
              onClick={() => onView(bill)}
              aria-label={`View ${bill.bill_number}`}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => onDelete(bill)}
              aria-label={`Delete ${bill.bill_number}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];
}

function BillCard({
  bill,
  onView,
  onDelete,
}: {
  bill: Bill;
  onView: () => void;
  onDelete: () => void;
}) {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="truncate font-mono text-base">
              {bill.bill_number}
            </CardTitle>
            <p className="mt-1 truncate text-sm text-muted-foreground">
              {bill.vendor_name}
            </p>
          </div>
          {dueBadge(bill)}
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Total</span>
          <span className="font-semibold">
            {money(Number(bill.total || 0))}
          </span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>Bill date</span>
          <span>{formatDate(bill.bill_date)}</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>Due date</span>
          <span>{formatDate(bill.due_date)}</span>
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

export default function AccountsBillsPage() {
  const router = useRouter();
  const { setTitle } = usePageTitle();
  const [viewMode, setViewMode] = useCollectionViewMode(
    "accounts_bills_view_mode",
    "list",
  );
  const collectionFilters = useCollectionPageFilters(
    "bills",
    getCollectionFilterDefinitions("bills"),
  );
  const {
    items: bills,
    total,
    loading,
    error,
    reload: fetchBills,
  } = useCollectionData(
    billsApi.getAll,
    collectionFilters.apiParamsKey,
    collectionFilters.apiParams,
    { limit: LIST_LIMIT },
  );
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<Bill | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    setTitle("Expense bills");
    return () => setTitle(null);
  }, [setTitle]);

  useEffect(() => {
    setSelectedIds([]);
  }, [collectionFilters.apiParamsKey]);

  const collectionItems = useMemo(
    () => bills.map(billToCollectionItem),
    [bills],
  );

  const billById = useMemo(
    () => new Map(bills.map((bill) => [bill.id, bill])),
    [bills],
  );

  const openView = useCallback(
    (bill: Bill) => {
      router.push(`/accounts/bills/${bill.id}`);
    },
    [router],
  );

  const openDelete = (bill: Bill) => {
    setSelected(bill);
    setDeleteOpen(true);
  };

  const onDelete = async () => {
    if (!selected) return;
    setActionLoading(true);
    try {
      await billsApi.delete(selected.id);
      setDeleteOpen(false);
      setSelected(null);
      await fetchBills();
    } catch (err) {
      console.error("Failed to delete bill:", err);
      alert(err instanceof Error ? err.message : "Failed to delete bill");
    } finally {
      setActionLoading(false);
    }
  };

  const billTableColumns = useMemo(
    () => buildBillColumns(bills, openView, openDelete),
    [bills, openView],
  );

  const listDescription = loading
    ? "Loading…"
    : `${total} bill${total === 1 ? "" : "s"}${
        collectionFilters.isFiltering ? " (filtered)" : ""
      }`;

  const renderBills = (mode: CollectionViewMode) => {
    if (mode === "list") {
      return (
        <CollectionView
          loading={loading}
          items={collectionItems}
          columns={billTableColumns}
          primaryColumnId="bill_number"
          selectable
          selectedIds={selectedIds}
          onSelectedIdsChange={(ids) =>
            setSelectedIds(ids.map((id) => Number(id)))
          }
          onRowClick={(item) => {
            const bill = billById.get(Number(item.id));
            if (bill) openView(bill);
          }}
          emptyTitle="No expense bills yet"
          emptyDescription="Create a bill or sync from Zoho Books in Settings → Integrations."
          emptyMessage="No bills found."
          loadingMessage="Loading bills…"
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
            const bill = billById.get(Number(item.id));
            return bill ? billDueBucket(bill) : "no_due";
          }}
          getColumnSubtext={(_columnId, columnItems) => {
            const count = columnItems.length;
            return `${count} bill${count !== 1 ? "s" : ""}`;
          }}
          renderCard={(item) => {
            const bill = billById.get(Number(item.id));
            if (!bill) return null;
            return (
              <Card
                className="cursor-pointer border border-border bg-card shadow-none transition-shadow hover:shadow-md"
                onClick={() => openView(bill)}
              >
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-mono text-sm font-semibold">
                      {bill.bill_number}
                    </h4>
                    {dueBadge(bill)}
                  </div>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {bill.vendor_name}
                  </p>
                  <p className="mt-2 text-sm font-medium">
                    {money(Number(bill.total || 0))}
                  </p>
                </CardContent>
              </Card>
            );
          }}
          emptyMessage="No bills found."
          loadingMessage="Loading bills…"
        />
      );
    }

    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {bills.map((bill) => (
          <BillCard
            key={bill.id}
            bill={bill}
            onView={() => openView(bill)}
            onDelete={() => openDelete(bill)}
          />
        ))}
      </div>
    );
  };

  const showEmpty = !loading && !error && bills.length === 0;

  return (
    <PageShell fill className="bg-background text-foreground">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Expense bills</h1>
          <p className="mt-1 text-muted-foreground">{listDescription}</p>
        </div>

        <CollectionPageToolbar
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          newAction={{
            label: "New bill",
            href: "/accounts/bills/new",
            ariaLabel: "Create new expense bill",
          }}
          className="w-full lg:w-auto"
        >
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fetchBills()}
            disabled={loading}
            aria-label="Refresh bills"
          >
            <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </CollectionPageToolbar>
      </div>

      <CollectionFilterControls
        className="mb-4"
        definitions={collectionFilters.definitions}
        search={collectionFilters.search}
        onSearchChange={collectionFilters.setSearch}
        searchPlaceholder="Search bill # or vendor…"
        facets={collectionFilters.facets}
        onFacetChange={collectionFilters.setFacetValues}
        numbers={collectionFilters.numbers}
        onNumberRangeChange={collectionFilters.setNumberRange}
        dates={collectionFilters.dates}
        onDateRangeChange={collectionFilters.setDateRange}
        resource={collectionFilters.resource}
        filterState={collectionFilters.filterState}
        onApplySavedView={collectionFilters.applyFilterState}
        onClearAll={collectionFilters.clearFilters}
        isFiltering={collectionFilters.isFiltering}
        getOptions={collectionFilters.getOptions}
        loadOptions={collectionFilters.loadOptions}
      />

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
          {renderBills(viewMode)}
        </div>
      )}

      {showEmpty && viewMode !== "list" && (
        <div className="mt-8 text-center text-muted-foreground">
          <p>No expense bills yet.</p>
          <div className="mt-4 flex justify-center gap-2">
            <Button asChild variant="outline">
              <Link href="/accounts/bills/new">Create bill</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/settings?section=integrations">
                Sync from Zoho Books
              </Link>
            </Button>
          </div>
        </div>
      )}

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete bill</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selected?.bill_number}? This
              removes the local copy only; the bill remains in Zoho Books.
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
