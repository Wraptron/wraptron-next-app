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
import { productsApi, type CreateProductInput } from "@/lib/api";

const initialFormState = {
  part_name: "",
  product_description: "",
  selling_price: "",
  buying_price: "",
};

export interface ProductFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ProductFormSheet({
  open,
  onOpenChange,
  onSuccess,
}: ProductFormSheetProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    if (open) setFormData(initialFormState);
  }, [open]);

  const handleOpenChange = (next: boolean) => {
    if (!next) setFormData(initialFormState);
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
      handleOpenChange(false);
      onSuccess();
    } catch (err: unknown) {
      console.error("Failed to create product:", err);
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: string }).message)
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
          <SheetTitle>Add product</SheetTitle>
          <SheetDescription>
            Add a new product with name, description, and pricing.
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col flex-1 min-h-0 overflow-y-auto"
        >
          <div className="space-y-4 p-4">
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
                  setFormData({ ...formData, product_description: e.target.value })
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
            <Button type="submit" disabled={loading || !formData.part_name.trim()}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating…
                </>
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
