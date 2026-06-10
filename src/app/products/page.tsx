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
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { RefreshCw, Search } from "lucide-react";
import { productsApi, type Product } from "@/lib/api";
import { statusBadgeClass, kanbanColumnHeaderClass } from "@/lib/status-colors";
import { ProductFormSheet } from "@/components/product-form-sheet";

const KANBAN_COLUMNS: CollectionKanbanColumn[] = [
  { id: "draft", label: "Draft", headerClassName: kanbanColumnHeaderClass("draft") },
  { id: "pending", label: "Pending", headerClassName: kanbanColumnHeaderClass("pending") },
  { id: "active", label: "Active", headerClassName: kanbanColumnHeaderClass("active") },
  { id: "completed", label: "Completed", headerClassName: kanbanColumnHeaderClass("completed") },
  { id: "inactive", label: "Inactive", headerClassName: kanbanColumnHeaderClass("inactive") },
  { id: "other", label: "Other", headerClassName: kanbanColumnHeaderClass("other") },
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
    meta: (
      <span className="font-mono text-xs">{product.part_code}</span>
    ),
  };
}

function buildProductTableColumns(products: Product[]): CollectionColumn[] {
  const byId = new Map(products.map((p) => [p.id, p]));

  return [
    {
      id: "part_code",
      header: "Part code",
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
      id: "part_name",
      header: "Product name",
      headerClassName: "min-w-[140px]",
      sortValue: (item) => byId.get(Number(item.id))?.part_name ?? "",
      cell: (item) => {
        const product = byId.get(Number(item.id));
        return (
          <span className="text-foreground">
            {product?.part_name ?? "—"}
          </span>
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

function ProductKanbanCard({ product }: { product: Product }) {
  return (
    <Card className="mb-0 gap-0 rounded-lg border border-border bg-card py-0 text-card-foreground shadow-none transition-colors hover:bg-accent/30">
      <CardContent className="p-3">
        <h4 className="mb-2 text-sm font-semibold text-foreground">
          {product.part_name}
        </h4>
        <Badge className={statusBadgeClass(product.status)}>
          {product.status || "No status"}
        </Badge>
        <div className="mt-2 space-y-1.5 text-xs text-muted-foreground">
          <div className="font-mono text-foreground/80">{product.part_code}</div>
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
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [productSheetOpen, setProductSheetOpen] = useState(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await productsApi.getAll({
        limit: 200,
        ...(search.trim() ? { search: search.trim() } : {}),
      });
      setProducts(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    setTitle("Products");
    return () => setTitle(null);
  }, [setTitle]);

  useEffect(() => {
    productsApi
      .getAll({ limit: 200 })
      .then((res) => setProducts(res.data))
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to fetch"),
      )
      .finally(() => setLoading(false));
  }, []);

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
    () => buildProductTableColumns(products),
    [products],
  );

  const productById = useMemo(
    () => new Map(products.map((p) => [p.id, p])),
    [products],
  );

  const getProductHref = (item: CollectionItem) =>
    `/products/${item.id}`;

  const listDescription = loading
    ? "Loading…"
    : `${products.length} product${products.length !== 1 ? "s" : ""}`;

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
            return product ? <ProductKanbanCard product={product} /> : null;
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
          search.trim()
            ? "No products match your search."
            : "Create your first product to get started."
        }
        emptyMessage="No products found."
        loadingMessage="Loading products…"
      />
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <section id="interface" className="scroll-mt-24 space-y-6">
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
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  fetchProducts();
                }}
                className="relative min-w-0 flex-1 sm:w-72"
              >
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                  aria-label="Search products"
                />
              </form>
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

          {error && (
            <div
              role="alert"
              className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            >
              {error}
            </div>
          )}

          {!error && renderProducts(viewMode)}
        </section>

        <ProductFormSheet
          open={productSheetOpen}
          onOpenChange={setProductSheetOpen}
          onSuccess={fetchProducts}
        />
      </div>
    </div>
  );
}
