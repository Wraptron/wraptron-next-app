"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { usePageTitle } from "@/contexts/page-title-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, Pencil } from "lucide-react";
import { productsApi, type Product } from "@/lib/api";
import { ProductFormSheet } from "@/components/product-form-sheet";

function DetailRow({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  if (value == null || value === "") return null;
  return (
    <div className="flex justify-between gap-4 py-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">
        {typeof value === "number" ? value.toLocaleString() : String(value)}
      </span>
    </div>
  );
}

export default function ProductDetailPage() {
  const params = useParams();
  const id = params?.id as string | undefined;
  const { setTitle } = usePageTitle();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editSheetOpen, setEditSheetOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    const numId = parseInt(id, 10);
    if (isNaN(numId)) {
      setError("Invalid product ID");
      setLoading(false);
      return;
    }
    let cancelled = false;
    productsApi
      .getById(numId)
      .then((data) => {
        if (!cancelled) {
          setProduct(data);
          setTitle(data.part_name || "Product");
        }
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load product");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
      setTitle(null);
    };
  }, [id, setTitle]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-background text-foreground p-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="pt-6">
              <p className="text-destructive mb-4">
                {error || "Product not found"}
              </p>
              <Button asChild variant="outline">
                <Link href="/products">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Products
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-8">
      <div className="max-w-3xl mx-auto">
        <Link href="/products">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Products
          </Button>
        </Link>

        <Card className="mb-6">
          <CardHeader className="pb-2">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="font-mono text-sm text-muted-foreground">
                  {product.part_code}
                </p>
                <CardTitle className="text-xl mt-1">
                  {product.part_name}
                </CardTitle>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {product.category_name ? (
                  <Badge variant="outline">{product.category_name}</Badge>
                ) : null}
                <Badge variant="secondary">{product.status || "—"}</Badge>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditSheetOpen(true)}
                >
                  <Pencil className="h-4 w-4 mr-1.5" />
                  Edit product
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        <ProductFormSheet
          open={editSheetOpen}
          onOpenChange={setEditSheetOpen}
          product={product}
          onSuccess={async () => {
            try {
              const data = await productsApi.getById(product.id);
              setProduct(data);
              setTitle(data.part_name || "Product");
            } catch {
              setError("Failed to refresh product");
            }
          }}
        />

        <div className="space-y-8">
          {product.product_description ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{product.product_description}</p>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Commercial & logistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-0">
                  <DetailRow
                    label="Category"
                    value={product.category_name}
                  />
                  <DetailRow
                    label="Customer part number"
                    value={product.customer_part_number}
                  />
                  <DetailRow label="UOM" value={product.uom} />
                  <DetailRow
                    label="Selling price"
                    value={product.selling_price}
                  />
                  <DetailRow label="SKU code" value={product.sku_code} />
                  <DetailRow label="Vendor code" value={product.vendor_code} />
                </div>
                <div className="space-y-0">
                  <DetailRow
                    label="Storage location"
                    value={product.storage_location}
                  />
                  <DetailRow
                    label="Bin / warehouse"
                    value={product.bin_warehouse}
                  />
                  <DetailRow label="Total cost" value={product.total_cost} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
