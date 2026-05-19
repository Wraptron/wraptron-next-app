"use client";

import Link from "next/link";
import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  dealsApi,
  salesStagesApi,
  type Deal,
  type SalesStage,
} from "@/lib/api";
import { usePageTitle } from "@/contexts/page-title-context";
import { useCurrency } from "@/contexts/currency-context";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DealFormSheet } from "@/components/deal-form-sheet";
import { DealImportSheet } from "@/components/deal-import-sheet";
import { RefreshCw, Edit, Trash2, FileDown } from "lucide-react";
import { cn } from "@/lib/utils";


function dealDisplayTitle(deal: Deal) {
  return (
    deal.title ||
    deal.client_name ||
    deal.client_company_name ||
    "Deal"
  );
}

function dealToCollectionItem(deal: Deal): CollectionItem {
  return {
    id: deal.id,
    title: dealDisplayTitle(deal),
    description: deal.contact_name || "No contact",
    meta: `${deal.probability ?? 0}% probability`,
    actions: deal.status ? (
      <Badge variant="outline" className="text-[10px] px-1 py-0">
        {deal.status}
      </Badge>
    ) : undefined,
  };
}

function buildDealTableColumns(deals: Deal[]): CollectionColumn[] {
  const byId = new Map(deals.map((d) => [d.id, d]));

  return [
    {
      id: "name",
      header: "Deal name",
      headerClassName: "w-[300px]",
      cell: (item) => byId.get(Number(item.id)) ? dealDisplayTitle(byId.get(Number(item.id))!) : "—",
    },
    {
      id: "contact",
      header: "Contact",
      cell: (item) => byId.get(Number(item.id))?.contact_name || "—",
    },
    {
      id: "stage",
      header: "Stage",
      cell: (item) => {
        const deal = byId.get(Number(item.id));
        if (!deal?.stage) return "—";
        return <Badge variant="outline">{deal.stage}</Badge>;
      },
    },
    {
      id: "status",
      header: "Status",
      cell: (item) => {
        const deal = byId.get(Number(item.id));
        if (!deal?.status) return "—";
        return <Badge variant="outline">{deal.status}</Badge>;
      },
    },
    {
      id: "probability",
      header: "Probability",
      cell: (item) => {
        const deal = byId.get(Number(item.id));
        return deal ? `${deal.probability ?? 0}%` : "—";
      },
    },
  ];
}

const sentenceCase = (s: string) =>
  s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : s;

const DealCard = ({
  deal,
  onEdit,
  onDelete,
}: {
  deal: Deal;
  onEdit?: () => void;
  onDelete?: () => void;
}) => (
  <div className="group block relative">
    <Link href={`/sales/deals/${deal.id}`} className="block no-underline">
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="min-w-0 flex-1">
              <CardTitle className="text-lg">
                {deal.title ||
                  deal.client_name ||
                  deal.client_company_name ||
                  "Deal"}
              </CardTitle>
              {deal.company_id &&
                (deal.client_company_name || deal.client_name) && (
                  <p className="text-sm text-muted-foreground mt-0.5 truncate">
                    Customer:{" "}
                    {[deal.client_company_name, deal.client_name]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                )}
            </div>
          </div>
          <div className="flex gap-2 mt-2">
            <Badge variant="outline">{deal.stage || "No stage"}</Badge>
            <Badge variant="outline">{deal.status || "No status"}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Contact:</span>
              <span>{deal.contact_name || "N/A"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Probability:</span>
              <span>{deal.probability}%</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
    <div className="absolute top-2 right-2 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
      {onEdit && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
        >
          <Edit className="h-4 w-4" />
        </Button>
      )}
      {onDelete && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-destructive"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  </div>
);

const DealKanbanCard = ({
  deal,
  onEdit,
  onDelete,
}: {
  deal: Deal;
  onEdit?: () => void;
  onDelete?: () => void;
}) => (
  <Card className="cursor-grab border border-border bg-card shadow-none active:cursor-grabbing">
    <CardContent className="p-3">
      <div className="flex justify-between items-start mb-2">
        <div className="min-w-0 flex-1">
          <h4 className="font-semibold text-sm line-clamp-2">
            {deal.title ||
              deal.client_name ||
              deal.client_company_name ||
              "Deal"}
          </h4>
          {deal.company_id &&
            (deal.client_company_name || deal.client_name) && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                Customer:{" "}
                {[deal.client_company_name, deal.client_name]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            )}
        </div>
        <div className="flex gap-1 ml-2 shrink-0">
          {onEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="h-6 w-6 p-0"
            >
              <Edit className="h-3 w-3" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="h-6 w-6 p-0"
            >
              <Trash2 className="h-3 w-3 text-destructive" />
            </Button>
          )}
        </div>
      </div>
      <div className="flex justify-between items-center mb-2">
        <Badge variant="outline" className="text-[10px] px-1 py-0">
          {deal.status}
        </Badge>
      </div>
      <div className="text-xs text-muted-foreground">
        <div className="truncate">{deal.contact_name || "No contact"}</div>
        <div className="mt-1">{deal.probability}% probability</div>
      </div>
    </CardContent>
  </Card>
);

export default function DealsPage() {
  const router = useRouter();
  const { setTitle } = usePageTitle();
  const { formatCurrency } = useCurrency();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [importSheetOpen, setImportSheetOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [dealToDelete, setDealToDelete] = useState<Deal | null>(null);
  const [stages, setStages] = useState<SalesStage[]>([]);
  const [selectedDeals, setSelectedDeals] = useState<number[]>([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const defaultStageNames = [
    "new lead",
    "qualified",
    "requirement gathered",
    "solution proposed",
    "negotiation/objection handling",
    "proposal accepted",
    "project implementation",
    "maintenance - project delivered",
  ];

  /** Pipeline order from Settings → Sales stages (API returns sort_order; we sort defensively). */
  const stagesSorted = useMemo(() => {
    return [...stages].sort((a, b) => {
      if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
      return a.id - b.id;
    });
  }, [stages]);

  const stageNames =
    stagesSorted.length > 0
      ? stagesSorted.map((s) => s.name.toLowerCase())
      : defaultStageNames;

  const [viewMode, setViewMode] = useCollectionViewMode("deals_view_mode", "card");

  const toggleDealSelection = (dealId: number) => {
    setSelectedDeals((prev) =>
      prev.includes(dealId)
        ? prev.filter((id) => id !== dealId)
        : [...prev, dealId],
    );
  };

  const handleBulkDelete = async () => {
    setIsBulkDeleting(true);
    try {
      await Promise.all(selectedDeals.map((id) => dealsApi.delete(id)));
      setDeals((prev) => prev.filter((d) => !selectedDeals.includes(d.id)));
      setSelectedDeals([]);
      setBulkDeleteOpen(false);
    } catch (err) {
      console.error("Failed to delete deals:", err);
      fetchDeals();
      alert("Failed to delete some deals. Please try again.");
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const fetchDeals = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await dealsApi.getAll();
      setDeals(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch deals");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeals();
  }, []);

  useEffect(() => {
    salesStagesApi
      .getAll()
      .then((res) => setStages(res.data ?? []))
      .catch(() => setStages([]));
  }, []);

  useEffect(() => {
    setTitle("Deals");
    return () => setTitle(null);
  }, [setTitle]);

  const getStageSubtext = (stageDeals: Deal[]) => {
    const count = stageDeals.length;
    const total = stageDeals.reduce((sum, d) => sum + (d.value ?? 0), 0);
    const currency = stageDeals[0]?.currency ?? "USD";
    const valueStr = formatCurrency(total, currency);
    return `${count} deal${count !== 1 ? "s" : ""} · ${valueStr}`;
  };

  const collectionItems = useMemo(() => deals.map(dealToCollectionItem), [deals]);

  const dealById = useMemo(() => new Map(deals.map((d) => [d.id, d])), [deals]);

  const dealTableColumns = useMemo(() => buildDealTableColumns(deals), [deals]);

  const dealKanbanColumns = useMemo((): CollectionKanbanColumn[] => {
    const cols =
      stagesSorted.length > 0
        ? stagesSorted.map((s) => ({
            id: s.name.toLowerCase(),
            label: s.name,
          }))
        : stageNames.map((key) => ({
            id: key,
            label: sentenceCase(key),
          }));
    return [...cols, { id: "other", label: "Other" }];
  }, [stagesSorted, stageNames]);

  const dealKanbanColumnIds = useMemo(
    () => new Set(dealKanbanColumns.map((c) => c.id)),
    [dealKanbanColumns],
  );

  const handleCreateNew = () => {
    setEditingDeal(undefined);
    setSheetOpen(true);
  };

  const handleEdit = (deal: Deal) => {
    setEditingDeal(deal);
    setSheetOpen(true);
  };

  const handleDelete = (deal: Deal) => {
    setDealToDelete(deal);
    setDeleteDialogOpen(true);
  };

  const handleDealKanbanMove = async (item: CollectionItem, toColumnId: string) => {
    const deal = dealById.get(Number(item.id));
    if (!deal) return;

    const newStage = toColumnId;
    if (newStage === deal.stage?.toLowerCase()) return;

    const oldStage = deal.stage;
    setDeals((prev) =>
      prev.map((d) => (d.id === deal.id ? { ...d, stage: newStage } : d)),
    );

    try {
      await dealsApi.update(Number(deal.id), { stage: newStage });
    } catch (err) {
      setDeals((prev) =>
        prev.map((d) => (d.id === deal.id ? { ...d, stage: oldStage } : d)),
      );
      console.error("Failed to update deal stage", err);
    }
  };

  const renderDeals = (mode: CollectionViewMode) => {
    if (mode === "list") {
      return (
        <CollectionView
          loading={loading}
          items={collectionItems}
          columns={dealTableColumns}
          primaryColumnId="name"
          selectable
          selectedIds={selectedDeals}
          onSelectedIdsChange={(ids) =>
            setSelectedDeals(ids.map((id) => Number(id)))
          }
          getRowHref={(item) => `/sales/deals/${item.id}`}
          onRowClick={(item) => router.push(`/sales/deals/${item.id}`)}
          emptyMessage="No deals found."
          loadingMessage="Loading deals…"
        />
      );
    }

    if (mode === "kanban") {
      return (
        <CollectionKanbanView
          loading={loading}
          items={collectionItems}
          columns={dealKanbanColumns}
          groupBy={(item) => {
            const deal = dealById.get(Number(item.id));
            const stage = deal?.stage?.toLowerCase() ?? "other";
            return dealKanbanColumnIds.has(stage) ? stage : "other";
          }}
          getColumnSubtext={(_columnId, columnItems) => {
            const stageDeals = columnItems
              .map((i) => dealById.get(Number(i.id)))
              .filter((d): d is Deal => Boolean(d));
            return getStageSubtext(stageDeals);
          }}
          onItemMove={handleDealKanbanMove}
          getRowHref={(item) => `/sales/deals/${item.id}`}
          renderCard={(item) => {
            const deal = dealById.get(Number(item.id));
            if (!deal) return null;
            return (
              <DealKanbanCard
                deal={deal}
                onEdit={() => router.push(`/sales/deals/${deal.id}`)}
                onDelete={() => handleDelete(deal)}
              />
            );
          }}
          emptyMessage="No deals found."
          loadingMessage="Loading deals…"
        />
      );
    }

    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {deals.map((deal) => (
          <DealCard
            key={deal.id}
            deal={deal}
            onEdit={() => handleEdit(deal)}
            onDelete={() => handleDelete(deal)}
          />
        ))}
      </div>
    );
  };

  const confirmDelete = async () => {
    if (!dealToDelete) return;
    try {
      await dealsApi.delete(dealToDelete.id);
      setDeals(deals.filter((d) => d.id !== dealToDelete.id));
      setDeleteDialogOpen(false);
      setDealToDelete(null);
    } catch (error) {
      console.error("Error deleting deal:", error);
      alert("Failed to delete deal. Please try again.");
    }
  };

  const handleFormSuccess = () => {
    setSheetOpen(false);
    setEditingDeal(undefined);
    fetchDeals();
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <p className="text-muted-foreground">{deals.length} deals</p>
          </div>
          <CollectionPageToolbar
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            newAction={{
              label: "New Deal",
              onClick: handleCreateNew,
              menuItems: [
                {
                  label: "Import",
                  onClick: () => setImportSheetOpen(true),
                  icon: <FileDown className="h-4 w-4" />,
                },
              ],
            }}
          >
            <Button onClick={fetchDeals} variant="outline" size="sm" disabled={loading}>
              <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </CollectionPageToolbar>
        </div>

        {selectedDeals.length > 0 && (
          <div className="mb-6 flex items-center justify-between rounded-md border border-primary/30 bg-primary/10 px-4 py-3 text-primary">
            <span className="text-sm font-medium">
              {selectedDeals.length} item{selectedDeals.length === 1 ? "" : "s"}{" "}
              selected
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={isBulkDeleting}
                className="border-destructive/30 bg-background text-destructive hover:bg-destructive/10 hover:border-destructive/50"
                onClick={() => setBulkDeleteOpen(true)}
              >
                Delete Selected
              </Button>
            </div>
          </div>
        )}

        <Dialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete deals</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete {selectedDeals.length} selected
                deal
                {selectedDeals.length === 1 ? "" : "s"}? This action cannot be
                undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setBulkDeleteOpen(false)}
                disabled={isBulkDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleBulkDelete}
                disabled={isBulkDeleting}
              >
                {isBulkDeleting ? "Deleting..." : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {error && (
          <div className="py-8 text-center text-destructive">{error}</div>
        )}

        {!error && deals.length > 0 && renderDeals(viewMode)}

        {!loading && !error && deals.length === 0 && (
            <div className="text-center py-16">
              <h3 className="text-xl mb-2">No deals yet</h3>
              <p className="text-muted-foreground">Create your first deal above.</p>
          </div>
        )}

        <DealFormSheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          onSuccess={handleFormSuccess}
          deal={editingDeal ?? null}
        />

        <DealImportSheet
          open={importSheetOpen}
          onOpenChange={setImportSheetOpen}
          onSuccess={handleFormSuccess}
        />

        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete deal</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this deal? This action cannot be
                undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmDelete}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
