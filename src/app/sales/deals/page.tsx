"use client";

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
import { CollectionFilterControls } from "@/components/collection-filters";
import { useCollectionPageFilters } from "@/components/collection-page-filters";
import { useCollectionData } from "@/hooks/use-collection-data";
import {
  getCollectionFilterDefinitions,
  withFilterOptions,
} from "@/lib/collection-filter-definitions";
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
import { PageShell } from "@/components/page-shell";
import {
  dealStageBadgeClass,
  dealStatusBadgeClass,
} from "@/lib/status-colors";

const telHref = (phone: string) =>
  `tel:${phone.replace(/[^\d+]/g, "") || phone.trim()}`;

function dealDisplayTitle(deal: Deal) {
  return deal.title || deal.client_name || deal.client_company_name || "Deal";
}

function formatDealValue(
  deal: Deal,
  formatCurrency: (value?: number, currencyOverride?: string) => string,
): string {
  return deal.value != null ? formatCurrency(deal.value, deal.currency) : "—";
}

function dealToCollectionItem(
  deal: Deal,
  formatCurrency: (value?: number, currencyOverride?: string) => string,
): CollectionItem {
  return {
    id: deal.id,
    title: dealDisplayTitle(deal),
    description: deal.contact_name || "No contact",
    meta: formatDealValue(deal, formatCurrency),
    actions: deal.status ? (
      <Badge className={cn(dealStatusBadgeClass(deal.status), "text-[10px] px-1 py-0")}>
        {deal.status}
      </Badge>
    ) : undefined,
  };
}

function buildDealTableColumns(
  deals: Deal[],
  formatCurrency: (value?: number, currencyOverride?: string) => string,
): CollectionColumn[] {
  const byId = new Map(deals.map((d) => [d.id, d]));

  return [
    {
      id: "name",
      header: "Deal name",
      headerClassName: "w-[300px]",
      sortValue: (item) => {
        const deal = byId.get(Number(item.id));
        return deal ? dealDisplayTitle(deal) : "";
      },
      cell: (item) =>
        byId.get(Number(item.id))
          ? dealDisplayTitle(byId.get(Number(item.id))!)
          : "—",
    },
    {
      id: "contact",
      header: "Contact",
      sortValue: (item) => byId.get(Number(item.id))?.contact_name ?? "",
      cell: (item) => byId.get(Number(item.id))?.contact_name || "—",
    },
    {
      id: "value",
      header: "Value",
      headerClassName: "text-right",
      className: "text-right tabular-nums font-medium",
      sortValue: (item) => byId.get(Number(item.id))?.value ?? 0,
      cell: (item) => {
        const deal = byId.get(Number(item.id));
        return deal ? formatDealValue(deal, formatCurrency) : "—";
      },
    },
    {
      id: "phone",
      header: "Phone",
      sortValue: (item) => byId.get(Number(item.id))?.contact_phone ?? "",
      cell: (item) => {
        const phone = byId.get(Number(item.id))?.contact_phone;
        if (!phone) return "—";
        return (
          <a
            href={telHref(phone)}
            className="hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {phone}
          </a>
        );
      },
    },
    {
      id: "stage",
      header: "Stage",
      sortValue: (item) => byId.get(Number(item.id))?.stage ?? "",
      cell: (item) => {
        const deal = byId.get(Number(item.id));
        if (!deal?.stage) return "—";
        return <Badge className={dealStageBadgeClass(deal.stage)}>{deal.stage}</Badge>;
      },
    },
    {
      id: "status",
      header: "Status",
      sortValue: (item) => byId.get(Number(item.id))?.status ?? "",
      cell: (item) => {
        const deal = byId.get(Number(item.id));
        if (!deal?.status) return "—";
        return <Badge className={dealStatusBadgeClass(deal.status)}>{deal.status}</Badge>;
      },
    },
    {
      id: "probability",
      header: "Probability",
      sortValue: (item) => byId.get(Number(item.id))?.probability ?? 0,
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
  formatCurrency,
  onEdit,
  onDelete,
  onCardClick,
}: {
  deal: Deal;
  formatCurrency: (value?: number, currencyOverride?: string) => string;
  onEdit?: () => void;
  onDelete?: () => void;
  onCardClick?: () => void;
}) => (
  <div className="group relative block">
    <Card
      className="cursor-pointer transition-shadow hover:shadow-md"
      onClick={onCardClick}
    >
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
          <Badge className={dealStageBadgeClass(deal.stage)}>
            {deal.stage || "No stage"}
          </Badge>
          <Badge className={dealStatusBadgeClass(deal.status)}>
            {deal.status || "No status"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Value:</span>
            <span className="font-medium tabular-nums">
              {formatDealValue(deal, formatCurrency)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Contact:</span>
            <span>{deal.contact_name || "N/A"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Phone:</span>
            {deal.contact_phone ? (
              <a
                href={telHref(deal.contact_phone)}
                className="hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {deal.contact_phone}
              </a>
            ) : (
              <span>N/A</span>
            )}
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Probability:</span>
            <span>{deal.probability}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
    <div className="absolute top-2 right-2 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
      {onEdit && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={(e) => {
            e.preventDefault();
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
            e.preventDefault();
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
  formatCurrency,
  onEdit,
  onDelete,
  onCardClick,
}: {
  deal: Deal;
  formatCurrency: (value?: number, currencyOverride?: string) => string;
  onEdit?: () => void;
  onDelete?: () => void;
  onCardClick?: () => void;
}) => (
  <Card
    className="cursor-grab border border-border bg-card shadow-none active:cursor-grabbing"
    onClick={onCardClick}
  >
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
                e.preventDefault();
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
                e.preventDefault();
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
        <Badge className={cn(dealStatusBadgeClass(deal.status), "text-[10px] px-1 py-0")}>
          {deal.status}
        </Badge>
        <span className="text-xs font-medium tabular-nums">
          {formatDealValue(deal, formatCurrency)}
        </span>
      </div>
      <div className="text-xs text-muted-foreground">
        <div className="truncate">{deal.contact_name || "No contact"}</div>
        {deal.contact_phone && (
          <div className="truncate mt-0.5">
            <a
              href={telHref(deal.contact_phone)}
              className="hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {deal.contact_phone}
            </a>
          </div>
        )}
        <div className="mt-1">{deal.probability}% probability</div>
      </div>
    </CardContent>
  </Card>
);

export default function DealsPage() {
  const router = useRouter();
  const { setTitle } = usePageTitle();
  const { formatCurrency } = useCurrency();
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

  const [viewMode, setViewMode] = useCollectionViewMode(
    "deals_view_mode",
    "card",
  );

  const stageOptions = useMemo(
    () =>
      stagesSorted.length > 0
        ? stagesSorted.map((s) => ({
            value: s.name.toLowerCase(),
            label: s.name,
          }))
        : stageNames.map((key) => ({
            value: key,
            label: sentenceCase(key),
          })),
    [stagesSorted, stageNames],
  );

  const filterDefinitions = useMemo(
    () =>
      withFilterOptions(getCollectionFilterDefinitions("deals"), {
        stage: stageOptions,
      }),
    [stageOptions],
  );

  const {
    search,
    setSearch,
    facets,
    setFacetValues,
    numbers,
    setNumberRange,
    dates,
    setDateRange,
    filterState,
    applyFilterState,
    clearFilters,
    apiParams,
    apiParamsKey,
    isFiltering,
    getOptions,
    loadOptions,
    definitions,
  } = useCollectionPageFilters("deals", filterDefinitions);

  const {
    items: deals,
    total,
    loading,
    error,
    reload: fetchDeals,
    setItems: setDeals,
  } = useCollectionData(dealsApi.getAll, apiParamsKey, apiParams, {
    limit: 2000,
  });

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

  const collectionItems = useMemo(
    () => deals.map((deal) => dealToCollectionItem(deal, formatCurrency)),
    [deals, formatCurrency],
  );

  const dealById = useMemo(() => new Map(deals.map((d) => [d.id, d])), [deals]);

  const dealTableColumns = useMemo(
    () => buildDealTableColumns(deals, formatCurrency),
    [deals, formatCurrency],
  );

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

  const handleDealKanbanMove = async (
    item: CollectionItem,
    toColumnId: string,
  ) => {
    const deal = dealById.get(Number(item.id));
    if (!deal) return;

    const newStage = toColumnId;
    if (newStage === deal.stage?.toLowerCase()) return;

    const oldStage = deal.stage;
    setDeals((prev) =>
      prev.map((d) => (d.id === deal.id ? { ...d, stage: newStage } : d)),
    );

    try {
      const updated = await dealsApi.update(Number(deal.id), {
        stage: newStage,
      });
      setDeals((prev) =>
        prev.map((d) => (d.id === deal.id ? { ...d, ...updated } : d)),
      );
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
          hasActiveFilters={isFiltering}
          filteredEmptyMessage="No deals match your filters."
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
          renderCard={(item) => {
            const deal = dealById.get(Number(item.id));
            if (!deal) return null;
            return (
              <DealKanbanCard
                deal={deal}
                formatCurrency={formatCurrency}
                onEdit={() => handleEdit(deal)}
                onDelete={() => handleDelete(deal)}
                onCardClick={() => router.push(`/sales/deals/${deal.id}`)}
              />
            );
          }}
          emptyMessage={
            isFiltering ? "No deals match your filters." : "No deals found."
          }
          loadingMessage="Loading deals…"
        />
      );
    }

    if (deals.length === 0) {
      return (
        <div className="flex h-48 items-center justify-center rounded-md border border-border bg-card text-sm text-muted-foreground">
          {isFiltering ? "No deals match your filters." : "No deals found."}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {deals.map((deal) => (
          <DealCard
            key={deal.id}
            deal={deal}
            formatCurrency={formatCurrency}
            onEdit={() => handleEdit(deal)}
            onDelete={() => handleDelete(deal)}
            onCardClick={() => router.push(`/sales/deals/${deal.id}`)}
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
    <PageShell fill className="bg-background text-foreground">
      <div className="mb-4 flex shrink-0 flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground">
              {loading
                ? "Loading…"
                : `${total} deal${total !== 1 ? "s" : ""}${
                    isFiltering ? " (filtered)" : ""
                  }`}
            </p>
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
            <Button
              onClick={fetchDeals}
              variant="outline"
              size="sm"
              disabled={loading}
            >
              <RefreshCw
                className={`size-4 ${loading ? "animate-spin" : ""}`}
              />
            </Button>
          </CollectionPageToolbar>
        </div>

        <CollectionFilterControls
          resource="deals"
          filterState={filterState}
          onApplySavedView={applyFilterState}
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search deals…"
          isFiltering={isFiltering}
          onClearAll={clearFilters}
          definitions={definitions}
          facets={facets}
          onFacetChange={setFacetValues}
          numbers={numbers}
          onNumberRangeChange={setNumberRange}
          dates={dates}
          onDateRangeChange={setDateRange}
          getOptions={getOptions}
          loadOptions={loadOptions}
        />
      </div>

      {selectedDeals.length > 0 && (
        <div className="mb-6 flex shrink-0 items-center justify-between rounded-md border border-primary/30 bg-primary/10 px-4 py-3 text-primary">
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
        <div className="shrink-0 py-8 text-center text-destructive">
          {error}
        </div>
      )}

      {!error && deals.length > 0 && (
        <div
          className={cn(
            "min-h-0",
            viewMode === "kanban" && "flex flex-1 flex-col",
          )}
        >
          {renderDeals(viewMode)}
        </div>
      )}

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
    </PageShell>
  );
}
