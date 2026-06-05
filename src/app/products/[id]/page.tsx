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

  // Scroll to #section when opening from sidenav or deep link
  useEffect(() => {
    if (loading || !product) return;
    const hash = typeof window !== "undefined" ? window.location.hash : "";
    if (!hash) return;
    const sectionId = hash.slice(1);
    requestAnimationFrame(() => {
      document
        .getElementById(sectionId)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [loading, product, id]);

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
          <section
            id="interface"
            className="scroll-mt-24 rounded-lg border bg-card text-card-foreground shadow-sm"
          >
            <div className="border-b px-4 py-3 sm:px-6">
              <h2 className="text-base font-semibold">Interface</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Packaging, labeling, and customer-facing specifications
              </p>
            </div>
            <div className="p-4 sm:p-6 space-y-0">
              <DetailRow label="Packaging type" value={product.packaging_type} />
              <DetailRow label="Pieces per box" value={product.pieces_per_box} />
              <DetailRow label="Barcode specs" value={product.barcode_specs} />
              <DetailRow
                label="Customer packaging specs"
                value={product.customer_packaging_specs}
              />
              <DetailRow
                label="Customer dispatch requirements"
                value={product.customer_dispatch_requirements}
              />
            </div>
          </section>

          <section
            id="features"
            className="scroll-mt-24 rounded-lg border bg-card text-card-foreground shadow-sm"
          >
            <div className="border-b px-4 py-3 sm:px-6">
              <h2 className="text-base font-semibold">Features</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Description, quality, and compliance
              </p>
            </div>
            <div className="p-4 sm:p-6 space-y-4">
              {product.product_description ? (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">
                    Description
                  </h4>
                  <p className="text-sm">{product.product_description}</p>
                </div>
              ) : null}
              <div className="space-y-0">
                <DetailRow
                  label="Quality inspection plan"
                  value={product.quality_inspection_plan}
                />
                <DetailRow label="Control plan" value={product.control_plan} />
                <DetailRow label="PDI checklist" value={product.pdi_checklist} />
                <DetailRow
                  label="Customer standards"
                  value={product.customer_standards}
                />
              </div>
            </div>
          </section>

          <section
            id="tech-stack"
            className="scroll-mt-24 rounded-lg border bg-card text-card-foreground shadow-sm"
          >
            <div className="border-b px-4 py-3 sm:px-6">
              <h2 className="text-base font-semibold">Tech Stack</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Materials, tooling, and production parameters
              </p>
            </div>
            <div className="p-4 sm:p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-0">
                  <DetailRow
                    label="Material type"
                    value={product.raw_material_type}
                  />
                  <DetailRow
                    label="Material grade"
                    value={product.material_grade}
                  />
                  <DetailRow
                    label="Material supplier"
                    value={product.material_supplier}
                  />
                  <DetailRow
                    label="Material color"
                    value={product.material_color}
                  />
                  <DetailRow
                    label="UV / fire rating"
                    value={product.uv_fire_rating}
                  />
                  <DetailRow label="MFI" value={product.mfi} />
                </div>
                <div className="space-y-0">
                  <DetailRow
                    label="Mould number"
                    value={product.mould_number}
                  />
                  <DetailRow
                    label="Cavity details"
                    value={product.cavity_details}
                  />
                  <DetailRow
                    label="Machine tonnage"
                    value={product.machine_tonnage}
                  />
                  <DetailRow label="Cycle time" value={product.cycle_time} />
                  <DetailRow
                    label="Cooling requirement"
                    value={product.cooling_requirement}
                  />
                  <DetailRow
                    label="Drawing number"
                    value={product.drawing_number}
                  />
                  <DetailRow
                    label="Drawing revision"
                    value={product.drawing_revision}
                  />
                </div>
              </div>
            </div>
          </section>

          <section
            id="milestone"
            className="scroll-mt-24 rounded-lg border bg-card text-card-foreground shadow-sm"
          >
            <div className="border-b px-4 py-3 sm:px-6">
              <h2 className="text-base font-semibold">Milestone</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Phases, revisions, and traceability
              </p>
            </div>
            <div className="p-4 sm:p-6 space-y-0">
              <DetailRow label="APQP phase" value={product.apqp_phase} />
              <DetailRow label="PPAP level" value={product.ppap_level} />
              <DetailRow
                label="Product revision change log"
                value={product.product_revision_change_log}
              />
              <DetailRow
                label="IMDS submission ID"
                value={product.imds_submission_id}
              />
              <DetailRow
                label="Lot / batch traceability"
                value={product.lot_batch_traceability_rules}
              />
              <DetailRow
                label="Serialisation rules"
                value={product.serialisation_rules}
              />
              <DetailRow label="Shelf life" value={product.shelf_life} />
            </div>
          </section>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Commercial & logistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-0">
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
