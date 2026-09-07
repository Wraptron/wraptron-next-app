"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { usePageTitle } from "@/contexts/page-title-context";
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
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw } from "lucide-react";
import { productsApi, type Product } from "@/lib/api";
import { statusBadgeClass, kanbanColumnHeaderClass } from "@/lib/status-colors";
import { PageShell } from "@/components/page-shell";
import { cn } from "@/lib/utils";
import { ProductFormSheet } from "@/components/product-form-sheet";
import { ProductFeaturedToggle } from "@/components/product-featured-toggle";

const KANBAN_COLUMNS: CollectionKanbanColumn[] = [
  {
    id: "draft",
    label: "Draft",
    headerClassName: kanbanColumnHeaderClass("draft"),
  },
  {
    id: "pending",
    label: "Pending",
    headerClassName: kanbanColumnHeaderClass("pending"),
  },
  {
    id: "active",
    label: "Active",
    headerClassName: kanbanColumnHeaderClass("active"),
  },
  {
    id: "completed",
    label: "Completed",
    headerClassName: kanbanColumnHeaderClass("completed"),
  },
  {
    id: "inactive",
    label: "Inactive",
    headerClassName: kanbanColumnHeaderClass("inactive"),
  },
  {
    id: "other",
    label: "Other",
    headerClassName: kanbanColumnHeaderClass("other"),
  },
];

const KANBAN_COLUMN_IDS = new Set(KANBAN_COLUMNS.map((c) => c.id));

const formatPrice = (value?: number | null) =>
  value != null ? value.toLocaleString() : "—";

function productKanbanColumnId(product: Product) {
  const key = product.status?.toLowerCase() ?? "other";
  return KANBAN_COLUMN_IDS.has(key) ? key : "other";
}

function productToCollectionItem(product: Product): CollectionItem {
  return {
    id: product.id,
    title: product.part_name,
    description: product.product_description?.trim() || undefined,
    meta: <span className="font-mono text-xs">{product.part_code}</span>,
  };
}

function buildProductTableColumns(
  products: Product[],
  onToggleFeatured: (productId: number, nextFeatured: boolean) => Promise<void>,
): CollectionColumn[] {
  const byId = new Map(products.map((p) => [p.id, p]));

  return [
    {
      id: "featured",
      header: "",
      headerClassName: "w-[44px]",
      className: "w-[44px]",
      sortable: false,
      cell: (item) => {
        const product = byId.get(Number(item.id));
        if (!product) return null;
        return (
          <ProductFeaturedToggle
            productId={product.id}
            isFeatured={Boolean(product.is_featured)}
            onToggle={onToggleFeatured}
          />
        );
      },
    },
    {
      id: "part_code",
      header: "Product code",
      headerClassName: "w-[120px]",
      sortValue: (item) => byId.get(Number(item.id))?.part_code ?? "",
      cell: (item) => {
        const product = byId.get(Number(item.id));
        return (
          <span className="font-mono text-sm text-foreground">
            {product?.part_code ?? "—"}
          </span>
        );
      },
    },
    {
      id: "hsn_code",
      header: "HSN code",
      headerClassName: "w-[110px]",
      sortValue: (item) => byId.get(Number(item.id))?.hsn_code ?? "",
      cell: (item) => {
        const product = byId.get(Number(item.id));
        return (
          <span className="font-mono text-xs text-muted-foreground">
            {product?.hsn_code ?? "—"}
          </span>
        );
      },
    },
    {
      id: "part_name",
      header: "Product name",
      headerClassName: "min-w-[140px]",
      sortValue: (item) => byId.get(Number(item.id))?.part_name ?? "",
      cell: (item) => {
        const product = byId.get(Number(item.id));
        return (
          <span className="text-foreground">{product?.part_name ?? "—"}</span>
        );
      },
    },
    {
      id: "description",
      header: "Description",
      headerClassName: "min-w-[200px] max-w-[320px]",
      sortValue: (item) =>
        byId.get(Number(item.id))?.product_description?.trim() ?? "",
      cell: (item) => {
        const product = byId.get(Number(item.id));
        const description = product?.product_description?.trim();
        if (!description) return "—";
        return (
          <span className="line-clamp-2 text-sm text-muted-foreground">
            {description}
          </span>
        );
      },
    },
    {
      id: "status",
      header: "Status",
      sortValue: (item) => byId.get(Number(item.id))?.status ?? "",
      cell: (item) => {
        const product = byId.get(Number(item.id));
        if (!product?.status) return "—";
        return (
          <Badge className={statusBadgeClass(product.status)}>
            {product.status}
          </Badge>
        );
      },
    },
    {
      id: "selling_price",
      header: "Selling price",
      headerClassName: "text-right",
      className: "text-right tabular-nums",
      sortValue: (item) => byId.get(Number(item.id))?.selling_price ?? "",
      cell: (item) => {
        const product = byId.get(Number(item.id));
        return (
          <span className="tabular-nums text-foreground">
            {formatPrice(product?.selling_price)}
          </span>
        );
      },
    },
    {
      id: "total_cost",
      header: "Buying price",
      headerClassName: "text-right",
      className: "text-right tabular-nums",
      sortValue: (item) => byId.get(Number(item.id))?.total_cost ?? "",
      cell: (item) => {
        const product = byId.get(Number(item.id));
        return (
          <span className="tabular-nums text-foreground">
            {formatPrice(product?.total_cost)}
          </span>
        );
      },
    },
  ];
}

function ProductKanbanCard({
  product,
  onToggleFeatured,
}: {
  product: Product;
  onToggleFeatured: (productId: number, nextFeatured: boolean) => Promise<void>;
}) {
  return (
    <Card className="mb-0 gap-0 rounded-lg border border-border bg-card py-0 text-card-foreground shadow-none transition-colors hover:bg-accent/30">
      <CardContent className="p-3">
        <div className="mb-2 flex items-start justify-between gap-2">
          <h4 className="text-sm font-semibold text-foreground">
            {product.part_name}
          </h4>
          <ProductFeaturedToggle
            productId={product.id}
            isFeatured={Boolean(product.is_featured)}
            onToggle={onToggleFeatured}
            size="sm"
          />
        </div>
        <Badge className={statusBadgeClass(product.status)}>
          {product.status || "No status"}
        </Badge>
        <div className="mt-2 space-y-1.5 text-xs text-muted-foreground">
          <div className="font-mono text-foreground/80">
            {product.part_code}
          </div>
          {product.product_description?.trim() ? (
            <p className="line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">
              {product.product_description}
            </p>
          ) : null}
          <div className="space-y-0.5 border-t border-border/50 pt-1">
            <div className="flex justify-between gap-2">
              <span>Sell</span>
              <span className="font-medium text-foreground">
                {formatPrice(product.selling_price)}
              </span>
            </div>
            <div className="flex justify-between gap-2">
              <span>Buy</span>
              <span className="font-medium text-foreground">
                {formatPrice(product.total_cost)}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ProductsPage() {
  const router = useRouter();
  const { setTitle } = usePageTitle();
  const [viewMode, setViewMode] = useCollectionViewMode(
    "products_view_mode",
    "list",
  );
  const collectionFilters = useCollectionPageFilters(
    "products",
    getCollectionFilterDefinitions("products"),
  );
  const {
    items: products,
    total,
    loading,
    error,
    reload: fetchProducts,
  } = useCollectionData(
    productsApi.getAll,
    collectionFilters.apiParamsKey,
    collectionFilters.apiParams,
    { limit: 500 },
  );
  const [productSheetOpen, setProductSheetOpen] = useState(false);

  const handleToggleFeatured = useCallback(
    async (productId: number, nextFeatured: boolean) => {
      await productsApi.update(productId, { is_featured: nextFeatured });
      await fetchProducts();
    },
    [fetchProducts],
  );

  useEffect(() => {
    setTitle("Products");
    return () => setTitle(null);
  }, [setTitle]);

  useEffect(() => {
    const scrollToHash = () => {
      const id = window.location.hash.replace(/^#/, "");
      if (!id) return;
      requestAnimationFrame(() => {
        document
          .getElementById(id)
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    };
    scrollToHash();
    window.addEventListener("hashchange", scrollToHash);
    return () => window.removeEventListener("hashchange", scrollToHash);
  }, []);

  const collectionItems = useMemo(
    () => products.map(productToCollectionItem),
    [products],
  );

  const productTableColumns = useMemo(
    () => buildProductTableColumns(products, handleToggleFeatured),
    [products, handleToggleFeatured],
  );

  const productById = useMemo(
    () => new Map(products.map((p) => [p.id, p])),
    [products],
  );

  const getProductHref = (item: CollectionItem) => `/products/${item.id}`;

  const listDescription = loading
    ? "Loading…"
    : `${total} product${total !== 1 ? "s" : ""}${
        collectionFilters.isFiltering ? " (filtered)" : ""
      }`;

  const renderProducts = (mode: CollectionViewMode) => {
    if (mode === "kanban") {
      return (
        <CollectionKanbanView
          loading={loading}
          items={collectionItems}
          columns={KANBAN_COLUMNS}
          groupBy={(item) => {
            const product = productById.get(Number(item.id));
            return product ? productKanbanColumnId(product) : "other";
          }}
          getColumnSubtext={(_columnId, columnItems) => {
            const count = columnItems.length;
            return `${count} product${count !== 1 ? "s" : ""}`;
          }}
          getRowHref={getProductHref}
          renderCard={(item) => {
            const product = productById.get(Number(item.id));
            return product ? (
              <ProductKanbanCard
                product={product}
                onToggleFeatured={handleToggleFeatured}
              />
            ) : null;
          }}
          loadingMessage="Loading products…"
          emptyMessage="No products found."
        />
      );
    }

    return (
      <CollectionView
        loading={loading}
        items={collectionItems}
        columns={productTableColumns}
        primaryColumnId="part_name"
        getRowHref={getProductHref}
        onRowClick={(item) => router.push(getProductHref(item))}
        emptyTitle="No products yet"
        emptyDescription={
          collectionFilters.isFiltering
            ? "No products match your filters."
            : "Create your first product to get started."
        }
        hasActiveFilters={collectionFilters.isFiltering}
        filteredEmptyMessage="No products match your filters."
        emptyMessage="No products found."
        loadingMessage="Loading products…"
      />
    );
  };

  return (
    <PageShell fill className="bg-background text-foreground">
      <section
        id="interface"
        className="scroll-mt-24 flex min-h-0 flex-1 flex-col space-y-6"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Products</h1>
            <p className="mt-1 text-muted-foreground">{listDescription}</p>
          </div>

          <CollectionPageToolbar
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            newAction={{
              label: "New product",
              onClick: () => setProductSheetOpen(true),
              ariaLabel: "Create new product",
            }}
            className="w-full lg:w-auto"
          >
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fetchProducts()}
              disabled={loading}
              aria-label="Refresh products"
            >
              <RefreshCw
                className={`size-4 ${loading ? "animate-spin" : ""}`}
              />
            </Button>
          </CollectionPageToolbar>
        </div>

        <CollectionFilterControls
          definitions={collectionFilters.definitions}
          search={collectionFilters.search}
          onSearchChange={collectionFilters.setSearch}
          searchPlaceholder="Search products…"
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
            className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
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
            {renderProducts(viewMode)}
          </div>
        )}
      </section>

      <ProductFormSheet
        open={productSheetOpen}
        onOpenChange={setProductSheetOpen}
        onSuccess={fetchProducts}
      />
    </PageShell>
  );
}
