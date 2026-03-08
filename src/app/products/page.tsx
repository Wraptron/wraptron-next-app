"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePageTitle } from "@/contexts/page-title-context";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Loader2, Store, Search, RefreshCw, Menu, LayoutGrid, Columns3 } from "lucide-react";
import { productsApi, type Product } from "@/lib/api";
import { ProductFormSheet } from "@/components/product-form-sheet";

type ViewMode = "list" | "card" | "kanban";

const getStatusColor = (status?: string) => {
  const colors: Record<string, string> = {
    active: "bg-green-100 text-green-800",
    completed: "bg-blue-100 text-blue-800",
    pending: "bg-yellow-100 text-yellow-800",
    draft: "bg-gray-100 text-gray-800",
    inactive: "bg-red-100 text-red-800",
  };
  return (
    colors[status?.toLowerCase() ?? ""] || "bg-gray-100 text-gray-800"
  );
};

const formatPrice = (value?: number | null) =>
  value != null ? value.toLocaleString() : "—";

const ProductCard = ({ product }: { product: Product }) => (
  <Link href={`/products/${product.id}`} className="group block no-underline">
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <CardTitle className="text-lg">{product.part_name}</CardTitle>
        <Badge className={getStatusColor(product.status)}>
          {product.status || "No status"}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Part code:</span>
            <span className="font-mono">{product.part_code}</span>
          </div>
          <div className="flex justify-between">
            <span>Selling price:</span>
            <span>{formatPrice(product.selling_price)}</span>
          </div>
          <div className="flex justify-between">
            <span>Buying price:</span>
            <span>{formatPrice(product.total_cost)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  </Link>
);

const ProductKanbanCard = ({ product }: { product: Product }) => (
  <Link href={`/products/${product.id}`} className="group block no-underline">
    <Card className="hover:shadow transition-shadow mb-3">
      <CardContent className="p-3">
        <h4 className="font-semibold text-sm mb-2">{product.part_name}</h4>
        <Badge className={getStatusColor(product.status)}>
          {product.status || "No status"}
        </Badge>
        <div className="mt-2 text-xs text-muted-foreground">
          <div>{product.part_code}</div>
          <div className="mt-1">Sell: {formatPrice(product.selling_price)}</div>
        </div>
      </CardContent>
    </Card>
  </Link>
);

export default function ProductsPage() {
  const router = useRouter();
  const { setTitle } = usePageTitle();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [productSheetOpen, setProductSheetOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("products_view_mode");
      if (saved === "list" || saved === "card" || saved === "kanban") {
        return saved as ViewMode;
      }
    }
    return "card";
  });

  const fetchProducts = async () => {
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
  };

  useEffect(() => {
    setTitle("Products");
    return () => setTitle(null);
  }, [setTitle]);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("products_view_mode", viewMode);
    }
  }, [viewMode]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts();
  };

  const getProductsByStatus = () => {
    const grouped: Record<string, Product[]> = {
      draft: [],
      pending: [],
      active: [],
      completed: [],
      inactive: [],
      other: [],
    };
    products.forEach((product) => {
      const status = product.status?.toLowerCase() || "other";
      if (grouped[status]) {
        grouped[status].push(product);
      } else {
        grouped.other.push(product);
      }
    });
    return grouped;
  };

  const renderContent = () => {
    if (viewMode === "list") {
      return (
        <div className="rounded-md border bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Part code</TableHead>
                <TableHead className="w-[300px]">Product name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Selling price</TableHead>
                <TableHead>Buying price</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No products found.
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product) => (
                  <TableRow
                    key={product.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => router.push(`/products/${product.id}`)}
                  >
                    <TableCell className="font-mono text-sm">
                      {product.part_code}
                    </TableCell>
                    <TableCell className="font-medium">
                      <Link
                        href={`/products/${product.id}`}
                        className="hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {product.part_name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(product.status)}>
                        {product.status || "—"}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatPrice(product.selling_price)}</TableCell>
                    <TableCell>{formatPrice(product.total_cost)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      );
    }

    if (viewMode === "kanban") {
      const grouped = getProductsByStatus();
      const columns = [
        { key: "draft", label: "Draft", color: "bg-gray-50" },
        { key: "pending", label: "Pending", color: "bg-yellow-50" },
        { key: "active", label: "Active", color: "bg-green-50" },
        { key: "completed", label: "Completed", color: "bg-blue-50" },
        { key: "inactive", label: "Inactive", color: "bg-red-50" },
        { key: "other", label: "Other", color: "bg-slate-50" },
      ];
      return (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.map((column) => (
            <div
              key={column.key}
              className={`flex-shrink-0 w-72 ${column.color} rounded-lg p-3`}
            >
              <h3 className="font-semibold mb-3 text-sm uppercase">
                {column.label} ({grouped[column.key]?.length || 0})
              </h3>
              <div>
                {(grouped[column.key] ?? []).map((product) => (
                  <ProductKanbanCard key={product.id} product={product} />
                ))}
                {(!grouped[column.key] || grouped[column.key].length === 0) && (
                  <div className="text-sm text-muted-foreground text-center py-4">
                    No items
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <p className="text-muted-foreground">
              {products.length} product{products.length !== 1 ? "s" : ""}
            </p>
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 h-9 w-40"
                />
              </div>
              <Button type="submit" variant="secondary" size="sm">
                Search
              </Button>
            </form>
          </div>
          <div className="flex items-center gap-2">
            <ButtonGroup orientation="horizontal">
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("list")}
                aria-label="List view"
              >
                <Menu className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "card" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("card")}
                aria-label="Card view"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "kanban" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("kanban")}
                aria-label="Kanban view"
              >
                <Columns3 className="h-4 w-4" />
              </Button>
            </ButtonGroup>
            <Button onClick={fetchProducts} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setProductSheetOpen(true)}
            >
              <Plus className="h-4 w-4 mr-1" /> New product
            </Button>
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive mb-4">
            {error}
          </div>
        )}

        {loading && (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {!loading && !error && products.length === 0 && (
          <div className="text-center py-16">
            <Store className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No products yet</h3>
            <p className="text-muted-foreground mb-4">
              {search.trim()
                ? "No products match your search."
                : "Create your first product above."}
            </p>
            {!search.trim() && (
              <Button onClick={() => setProductSheetOpen(true)}>
                <Plus className="h-4 w-4 mr-2" /> New product
              </Button>
            )}
          </div>
        )}

        {!loading && !error && products.length > 0 && renderContent()}

        <ProductFormSheet
          open={productSheetOpen}
          onOpenChange={setProductSheetOpen}
          onSuccess={fetchProducts}
        />
      </div>
    </div>
  );
}
