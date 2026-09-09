"use client";

import React, { useEffect, useState } from "react";
import {
  productCategoriesApi,
  type ProductCategory,
} from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Store } from "lucide-react";
import { SortableSettingsTable } from "@/components/sortable-settings-table";

export function SettingsProductCategories() {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<ProductCategory | null>(null);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await productCategoriesApi.getAll();
      setCategories(res.data ?? []);
    } catch {
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleAdd = async () => {
    if (!name.trim()) return;
    setBusy(true);
    try {
      await productCategoriesApi.create({
        name: name.trim(),
        sort_order: categories.length,
      });
      setAddOpen(false);
      setName("");
      load();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed to add category");
    } finally {
      setBusy(false);
    }
  };

  const handleEdit = async () => {
    if (!selected || !name.trim()) return;
    setBusy(true);
    try {
      await productCategoriesApi.update(selected.id, { name: name.trim() });
      setEditOpen(false);
      setName("");
      setSelected(null);
      load();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed to update category");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setBusy(true);
    try {
      await productCategoriesApi.delete(selected.id);
      setDeleteOpen(false);
      setSelected(null);
      load();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed to delete category");
    } finally {
      setBusy(false);
    }
  };

  const handleReorder = async (reordered: ProductCategory[]) => {
    const previous = categories;
    setCategories(reordered);
    try {
      await Promise.all(
        reordered.map((category, index) =>
          productCategoriesApi.update(category.id, { sort_order: index }),
        ),
      );
    } catch (e: unknown) {
      setCategories(previous);
      alert(e instanceof Error ? e.message : "Failed to reorder categories");
      throw e;
    }
  };

  return (
    <>
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                Product categories
              </CardTitle>
              <CardDescription className="mt-2">
                Categories shown in the product form dropdown (e.g. Hardware,
                Software, Spare parts).
              </CardDescription>
            </div>
            <Button
              onClick={() => {
                setName("");
                setAddOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add category
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading categories...
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No categories yet. Add categories to use them on the product form.
            </div>
          ) : (
            <SortableSettingsTable
              items={categories}
              onReorder={handleReorder}
              onEdit={(item) => {
                setSelected(item);
                setName(item.name);
                setEditOpen(true);
              }}
              onDelete={(item) => {
                setSelected(item);
                setDeleteOpen(true);
              }}
            />
          )}
        </CardContent>
      </Card>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add product category</DialogTitle>
            <DialogDescription>
              e.g. Hardware, Consumables, Spare parts.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="product-category-name">Name</Label>
              <Input
                id="product-category-name"
                placeholder="e.g. Hardware"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAddOpen(false)}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button onClick={handleAdd} disabled={busy || !name.trim()}>
              {busy ? "Adding..." : "Add category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit product category</DialogTitle>
            <DialogDescription>
              Renaming updates the label on products that use this category.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="product-category-edit-name">Name</Label>
              <Input
                id="product-category-edit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditOpen(false);
                setSelected(null);
              }}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={busy || !name.trim()}>
              {busy ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete product category</DialogTitle>
            <DialogDescription>
              Remove &quot;{selected?.name}&quot;? Products in this category will
              keep their other details and become uncategorized.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={busy}>
              {busy ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
