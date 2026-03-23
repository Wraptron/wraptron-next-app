"use client";

import React, { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import {
  productsApi,
  type CreateProductInput,
  type Product,
} from "@/lib/api";

const emptyFormState = {
  part_code: "",
  part_name: "",
  product_description: "",
  selling_price: "",
  buying_price: "",
};

function productToFormState(p: Product) {
  return {
    part_code: p.part_code ?? "",
    part_name: p.part_name ?? "",
    product_description: p.product_description ?? "",
    selling_price:
      p.selling_price != null && !Number.isNaN(p.selling_price)
        ? String(p.selling_price)
        : "",
    buying_price:
      p.total_cost != null && !Number.isNaN(p.total_cost)
        ? String(p.total_cost)
        : "",
  };
}

export interface ProductFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  /** When set, updates this product instead of creating */
  product?: Product | null;
}

export function ProductFormSheet({
  open,
  onOpenChange,
  onSuccess,
  product,
}: ProductFormSheetProps) {
  const isEdit = Boolean(product?.id);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(emptyFormState);

  useEffect(() => {
    if (!open) return;
    if (product) {
      setFormData(productToFormState(product));
    } else {
      setFormData(emptyFormState);
    }
  }, [open, product]);

  const handleOpenChange = (next: boolean) => {
    if (!next) setFormData(emptyFormState);
    onOpenChange(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = formData.part_name.trim();
    if (!name) {
      return;
    }
    setLoading(true);
    try {
      if (isEdit && product) {
        const code = formData.part_code.trim();
        if (!code) {
          alert("Part code is required.");
          setLoading(false);
          return;
        }
        const payload: Partial<CreateProductInput> = {
          part_code: code,
          part_name: name,
          product_description: formData.product_description.trim() || undefined,
          selling_price: formData.selling_price
            ? parseFloat(formData.selling_price)
            : undefined,
          total_cost: formData.buying_price
            ? parseFloat(formData.buying_price)
            : undefined,
        };
        await productsApi.update(product.id, payload);
      } else {
        const payload: CreateProductInput = {
          part_code: `PRD-${Date.now()}`,
          part_name: name,
          product_description: formData.product_description.trim() || undefined,
          selling_price: formData.selling_price
            ? parseFloat(formData.selling_price)
            : undefined,
          total_cost: formData.buying_price
            ? parseFloat(formData.buying_price)
            : undefined,
          status: "active",
        };
        await productsApi.create(payload);
      }
      handleOpenChange(false);
      onSuccess();
    } catch (err: unknown) {
      console.error(
        isEdit ? "Failed to update product:" : "Failed to create product:",
        err,
      );
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: string }).message)
          : isEdit
            ? "Failed to update product. Please try again."
            : "Failed to create product. Please try again.";
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        className="flex flex-col w-full sm:max-w-md overflow-hidden"
      >
        <SheetHeader>
          <SheetTitle>{isEdit ? "Edit product" : "Add product"}</SheetTitle>
          <SheetDescription>
            {isEdit
              ? "Update part code, name, description, and pricing."
              : "Add a new product with name, description, and pricing."}
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col flex-1 min-h-0 overflow-y-auto"
        >
          <div className="space-y-4 p-4">
            {isEdit && (
              <div className="space-y-2">
                <Label htmlFor="product-part-code">Part code *</Label>
                <Input
                  id="product-part-code"
                  value={formData.part_code}
                  onChange={(e) =>
                    setFormData({ ...formData, part_code: e.target.value })
                  }
                  placeholder="e.g. PRD-001"
                  required
                  className="font-mono"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="product-name">Product name *</Label>
              <Input
                id="product-name"
                value={formData.part_name}
                onChange={(e) =>
                  setFormData({ ...formData, part_name: e.target.value })
                }
                placeholder="e.g. Widget A"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="product-description">Description</Label>
              <Textarea
                id="product-description"
                value={formData.product_description}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    product_description: e.target.value,
                  })
                }
                placeholder="Product description"
                rows={3}
                className="resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="product-selling-price">Selling price</Label>
              <Input
                id="product-selling-price"
                type="number"
                min={0}
                step={0.01}
                value={formData.selling_price}
                onChange={(e) =>
                  setFormData({ ...formData, selling_price: e.target.value })
                }
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="product-buying-price">Buying price</Label>
              <Input
                id="product-buying-price"
                type="number"
                min={0}
                step={0.01}
                value={formData.buying_price}
                onChange={(e) =>
                  setFormData({ ...formData, buying_price: e.target.value })
                }
                placeholder="0.00"
              />
            </div>
          </div>

          <SheetFooter className="p-4 pt-0 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                loading ||
                !formData.part_name.trim() ||
                (isEdit && !formData.part_code.trim())
              }
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEdit ? "Saving…" : "Creating…"}
                </>
              ) : isEdit ? (
                "Save changes"
              ) : (
                "Create product"
              )}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
