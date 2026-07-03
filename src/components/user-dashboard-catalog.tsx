"use client";

import React, { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2, Package, Sparkles } from "lucide-react";
import {
  productsApi,
  type CatalogProduct,
  type ProductCatalogResponse,
} from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

function formatPrice(value?: number | null) {
  if (value == null) return null;
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function ProductVisual({
  product,
  className,
  featured = false,
}: {
  product: CatalogProduct;
  className?: string;
  featured?: boolean;
}) {
  if (product.image_url) {
    return (
      <img
        src={product.image_url}
        alt=""
        className={cn("h-full w-full object-cover", className)}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/15 via-primary/5 to-background",
        className,
      )}
    >
      <Package
        className={cn(
          "text-primary/70",
          featured ? "h-16 w-16" : "h-10 w-10",
        )}
        aria-hidden
      />
    </div>
  );
}

function ProductCard({ product }: { product: CatalogProduct }) {
  const price = formatPrice(product.selling_price);

  return (
    <Card className="h-full overflow-hidden border-border/80 py-0 transition-colors hover:border-border hover:bg-accent/20">
      <div className="aspect-[4/3] overflow-hidden border-b border-border/60">
        <ProductVisual product={product} />
      </div>
      <CardHeader className="gap-2 px-4 pt-4 pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="line-clamp-2 text-base leading-snug">
            {product.part_name}
          </CardTitle>
          <Badge variant="secondary" className="shrink-0 font-mono text-[10px]">
            {product.part_code}
          </Badge>
        </div>
        {product.product_description ? (
          <CardDescription className="line-clamp-2 text-sm">
            {product.product_description}
          </CardDescription>
        ) : null}
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="text-muted-foreground">Price</span>
          <span className="font-semibold tabular-nums">
            {price != null ? (
              <>
                {price}
                {product.uom ? (
                  <span className="ml-1 text-xs font-normal text-muted-foreground">
                    / {product.uom}
                  </span>
                ) : null}
              </>
            ) : (
              "Contact us"
            )}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function FeaturedBanner({
  products,
}: {
  products: CatalogProduct[];
}) {
  const [index, setIndex] = useState(0);
  const count = products.length;

  useEffect(() => {
    if (index >= count) setIndex(0);
  }, [count, index]);

  if (count === 0) return null;

  const product = products[index];
  const price = formatPrice(product.selling_price);

  const goPrev = () => setIndex((current) => (current - 1 + count) % count);
  const goNext = () => setIndex((current) => (current + 1) % count);

  return (
    <section aria-label="Featured products" className="space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" aria-hidden />
        <h2 className="text-sm font-medium text-muted-foreground">
          Featured products
        </h2>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm">
        <div className="grid gap-0 md:grid-cols-[1.1fr_1fr]">
          <div className="relative min-h-[220px] md:min-h-[320px]">
            <ProductVisual product={product} featured />
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent md:bg-gradient-to-r md:from-black/50 md:via-black/10 md:to-transparent" />
          </div>

          <div className="flex flex-col justify-center gap-4 p-6 md:p-8">
            <div className="space-y-2">
              <Badge className="w-fit">Featured</Badge>
              <h3 className="text-2xl font-semibold tracking-tight">
                {product.part_name}
              </h3>
              <p className="font-mono text-xs text-muted-foreground">
                {product.part_code}
              </p>
              {product.product_description ? (
                <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
                  {product.product_description}
                </p>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs text-muted-foreground">Starting at</p>
                <p className="text-2xl font-semibold tabular-nums">
                  {price != null ? (
                    <>
                      {price}
                      {product.uom ? (
                        <span className="ml-1 text-sm font-normal text-muted-foreground">
                          / {product.uom}
                        </span>
                      ) : null}
                    </>
                  ) : (
                    "Contact us"
                  )}
                </p>
              </div>

              {count > 1 ? (
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={goPrev}
                    aria-label="Previous featured product"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="min-w-12 text-center text-xs text-muted-foreground tabular-nums">
                    {index + 1} / {count}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={goNext}
                    aria-label="Next featured product"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CategorySection({
  title,
  products,
}: {
  title: string;
  products: CatalogProduct[];
}) {
  if (products.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        <span className="text-sm text-muted-foreground">
          {products.length} product{products.length !== 1 ? "s" : ""}
        </span>
      </div>
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {products.map((product) => (
          <li key={product.id}>
            <ProductCard product={product} />
          </li>
        ))}
      </ul>
    </section>
  );
}

export function UserDashboardCatalog({ showFeatured = true }: { showFeatured?: boolean }) {
  const [catalog, setCatalog] = useState<ProductCatalogResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCatalog = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await productsApi.getCatalog();
      setCatalog(data);
    } catch {
      setError("Failed to load products.");
      setCatalog(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCatalog();
  }, [loadCatalog]);

  if (loading) {
    return (
      <div className="flex min-h-[240px] items-center justify-center rounded-xl border border-dashed border-border/80 bg-muted/20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div
        role="alert"
        className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
      >
        {error}
      </div>
    );
  }

  const featured = catalog?.featured ?? [];
  const categories = catalog?.categories ?? [];
  const activeProducts = catalog?.active_products ?? [];
  const listedProducts = activeProducts.filter((product) => !product.is_featured);
  const hasCatalog = activeProducts.length > 0;

  if (!hasCatalog) {
    return (
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-base">No active products yet</CardTitle>
          <CardDescription>
            Active products will appear here once your team publishes them.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const hasCategorySections = categories.some(
    (entry) => entry.products.length > 0,
  );

  return (
    <div className="space-y-8">
      {showFeatured ? <FeaturedBanner products={featured} /> : null}
      {hasCategorySections ? (
        categories.map((entry) =>
          entry.products.length > 0 ? (
            <CategorySection
              key={entry.category.id}
              title={entry.category.name}
              products={entry.products}
            />
          ) : null,
        )
      ) : listedProducts.length > 0 ? (
        <CategorySection title="Active products" products={listedProducts} />
      ) : null}
    </div>
  );
}
