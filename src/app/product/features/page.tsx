"use client";

import { PageShell } from "@/components/page-shell";
import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePageTitle } from "@/contexts/page-title-context";
import { useCurrency } from "@/contexts/currency-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Search, ArrowLeft, Loader2, Settings } from "lucide-react";
import {
  catalogFeaturesApi,
  featureTypesApi,
  type CatalogFeature,
  type FeatureType,
} from "@/lib/api";
import { CatalogFeatureSheet } from "@/components/catalog-feature-sheet";

function parseCost(cost: string | null): number | undefined {
  if (cost == null || cost === "") return undefined;
  const n = parseFloat(cost);
  return Number.isNaN(n) ? undefined : n;
}

function formatCostCell(
  cost: string | null,
  currency: string,
  formatCurrency: (value?: number, override?: string) => string,
) {
  const p = parseCost(cost);
  if (p === undefined) return "—";
  if (p === 0) {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(0);
  }
  return formatCurrency(p);
}

export default function ProductFeaturesPage() {
  const { setTitle } = usePageTitle();
  const { currency, formatCurrency } = useCurrency();
  const [items, setItems] = useState<CatalogFeature[]>([]);
  const [types, setTypes] = useState<FeatureType[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<CatalogFeature | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CatalogFeature | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [tRes, iRes] = await Promise.all([
        featureTypesApi.getAll(),
        catalogFeaturesApi.getAll({
          search: search.trim() || undefined,
        }),
      ]);
      setTypes(tRes.data ?? []);
      setItems(iRes.data ?? []);
    } catch {
      setItems([]);
      setTypes([]);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    setTitle("Features");
    return () => setTitle(null);
  }, [setTitle]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    load();
  };

  const openCreate = () => {
    setEditing(null);
    setSheetOpen(true);
  };

  const openEdit = (row: CatalogFeature) => {
    setEditing(row);
    setSheetOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await catalogFeaturesApi.delete(deleteTarget.id);
      setDeleteTarget(null);
      load();
    } catch (err: unknown) {
      alert(
        err && typeof err === "object" && "message" in err
          ? String((err as Error).message)
          : "Delete failed",
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <PageShell fill className="bg-background text-foreground">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/products">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Products
              </Link>
            </Button>
            <h1 className="text-2xl font-semibold">Features</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/settings">
                <Settings className="h-4 w-4 mr-1.5" />
                Types
              </Link>
            </Button>
            <Button type="button" size="sm" onClick={openCreate}>
              <Plus className="h-4 w-4 mr-1" />
              New feature
            </Button>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          Catalog of product features: name, type (UI, Analytics, SEO, …), and cost.
          Types are managed in Settings.
        </p>

        <form onSubmit={handleSearch} className="flex gap-2 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          <Button type="submit" variant="secondary">
            Search
          </Button>
        </form>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-lg border bg-card p-12 text-center space-y-4">
            <p className="text-muted-foreground">
              No features yet. Add types in Settings if needed, then create your first
              feature.
            </p>
            <Button type="button" onClick={openCreate}>
              <Plus className="h-4 w-4 mr-2" />
              New feature
            </Button>
          </div>
        ) : (
          <div className="rounded-md border bg-card overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Feature type</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                  <TableHead className="w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell>
                      <span className="inline-flex rounded-md bg-muted px-2 py-0.5 text-xs font-medium">
                        {row.feature_type_name ?? "—"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCostCell(row.cost, currency, formatCurrency)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEdit(row)}
                          aria-label="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => setDeleteTarget(row)}
                          aria-label="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <CatalogFeatureSheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          featureTypes={types}
          editing={editing}
          onSuccess={load}
        />

        <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete feature?</DialogTitle>
              <DialogDescription>
                This will remove &quot;{deleteTarget?.name}&quot; from the catalog.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteTarget(null)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmDelete} disabled={deleting}>
                {deleting ? "Deleting…" : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageShell>
  );
}
