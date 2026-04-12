"use client";

import React, { useState, useEffect, useCallback } from "react";
import { customersApi, type Customer } from "@/lib/api";
import { usePageTitle } from "@/contexts/page-title-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RefreshCw, Search } from "lucide-react";

const LIST_LIMIT = 2000;

const GST_LABELS: Record<string, string> = {
  regular: "Regular",
  composition: "Composition",
  unregistered: "Unregistered",
  overseas: "Overseas",
  sez: "SEZ",
  deemed_exports: "Deemed exports",
};

function formatGstType(value?: string) {
  if (!value) return "—";
  return GST_LABELS[value] ?? value.replace(/_/g, " ");
}

function primaryContactLabel(c: Customer) {
  if (c.primary_contact) {
    const { first_name, last_name } = c.primary_contact;
    return [first_name, last_name].filter(Boolean).join(" ").trim() || "—";
  }
  return c.contact_person?.trim() || "—";
}

export default function SalesCustomersPage() {
  const { setTitle } = usePageTitle();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await customersApi.getAll({
        search: debouncedSearch || undefined,
        limit: LIST_LIMIT,
        offset: 0,
      });
      setCustomers(response.data);
      setTotal(response.total);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load customers",
      );
      setCustomers([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  useEffect(() => {
    setTitle("Customers");
    return () => setTitle(null);
  }, [setTitle]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
            <p className="mt-1 text-gray-600">
              {loading
                ? "Loading…"
                : `${customers.length} shown${total > customers.length ? ` of ${total}` : ""}`}
            </p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <div className="relative flex-1 sm:w-72">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search name, code, GSTIN, email…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
                aria-label="Search customers"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fetchCustomers()}
              disabled={loading}
            >
              <RefreshCw
                className={`mr-1 size-4 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          >
            {error}
          </div>
        )}

        <div className="overflow-hidden rounded-md border bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Primary contact</TableHead>
                <TableHead>GST type</TableHead>
                <TableHead>GSTIN</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Email</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && customers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    Loading customers…
                  </TableCell>
                </TableRow>
              ) : customers.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="h-24 text-center text-gray-500"
                  >
                    No customers found.
                  </TableCell>
                </TableRow>
              ) : (
                customers.map((c) => (
                  <TableRow key={c.id} className="hover:bg-gray-50">
                    <TableCell className="font-mono text-sm font-medium">
                      {c.customer_code}
                    </TableCell>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="text-sm text-gray-700">
                      {c.company?.name ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {primaryContactLabel(c)}
                    </TableCell>
                    <TableCell>
                      {c.gst_registration_type ? (
                        <Badge variant="secondary" className="font-normal">
                          {formatGstType(c.gst_registration_type)}
                        </Badge>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {c.gstin ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {c.billing_address_city ?? "—"}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm text-gray-700">
                      {c.primary_contact?.email?.trim() ||
                        c.contact_email?.trim() ||
                        "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
