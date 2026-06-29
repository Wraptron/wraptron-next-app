"use client";

import { PageShell } from "@/components/page-shell";
import { cn } from "@/lib/utils";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { customersApi, type Customer } from "@/lib/api";
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
import { CollectionFilterControls } from "@/components/collection-filters";
import { useCollectionPageFilters } from "@/components/collection-page-filters";
import { useCollectionData } from "@/hooks/use-collection-data";
import { getCollectionFilterDefinitions } from "@/lib/collection-filter-definitions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, Plus } from "lucide-react";

const LIST_LIMIT = 2000;

const GST_LABELS: Record<string, string> = {
  regular: "Regular",
  composition: "Composition",
  unregistered: "Unregistered",
  overseas: "Overseas",
  sez: "SEZ",
  deemed_exports: "Deemed exports",
};

const KANBAN_COLUMNS: CollectionKanbanColumn[] = [
  { id: "regular", label: "Regular" },
  { id: "composition", label: "Composition" },
  { id: "unregistered", label: "Unregistered" },
  { id: "overseas", label: "Overseas" },
  { id: "sez", label: "SEZ" },
  { id: "deemed_exports", label: "Deemed exports" },
  { id: "other", label: "Other" },
];

const KANBAN_COLUMN_IDS = new Set(KANBAN_COLUMNS.map((c) => c.id));

function formatGstType(value?: string) {
  if (!value) return "—";
  return GST_LABELS[value] ?? value.replace(/_/g, " ");
}

function contactDisplayName(c: Customer) {
  if (c.primary_contact) {
    const { first_name, last_name } = c.primary_contact;
    return [first_name, last_name].filter(Boolean).join(" ").trim() || null;
  }
  return c.contact_person?.trim() || null;
}

function contactEmail(c: Customer) {
  return c.primary_contact?.email?.trim() || c.contact_email?.trim() || null;
}

function contactPhone(c: Customer) {
  return c.contact_phone?.trim() || null;
}

function customerContactDescription(c: Customer) {
  const parts: string[] = [];
  const name = contactDisplayName(c);
  const email = contactEmail(c);
  const phone = contactPhone(c);

  if (name) parts.push(name);
  if (email) parts.push(email);
  if (phone) parts.push(phone);

  return parts.length > 0 ? parts.join(" · ") : "No contact on file";
}

function customerToCollectionItem(c: Customer): CollectionItem {
  const contact = contactDisplayName(c) ?? contactEmail(c);
  return {
    id: c.id,
    title: c.name,
    description: (
      <>
        <div className="truncate">{contact ?? "No contact"}</div>
        {c.company?.name && (
          <div className="mt-1 truncate">{c.company.name}</div>
        )}
      </>
    ),
    meta: <span className="font-mono text-xs">{c.customer_code}</span>,
  };
}

function buildCustomerTableColumns(customers: Customer[]): CollectionColumn[] {
  const byId = new Map(customers.map((c) => [c.id, c]));

  return [
    {
      id: "code",
      header: "Code",
      headerClassName: "w-[120px]",
      sortValue: (item) => byId.get(Number(item.id))?.customer_code ?? "",
      cell: (item) => {
        const c = byId.get(Number(item.id));
        return (
          <span className="font-mono text-sm font-medium">
            {c?.customer_code ?? "—"}
          </span>
        );
      },
    },
    {
      id: "name",
      header: "Name",
      headerClassName: "w-[300px]",
      sortValue: (item) => byId.get(Number(item.id))?.name ?? "",
      cell: (item) => {
        const c = byId.get(Number(item.id));
        return c?.name ?? "—";
      },
    },
    {
      id: "contact",
      header: "Contact",
      sortValue: (item) => {
        const c = byId.get(Number(item.id));
        if (!c) return "";
        return contactDisplayName(c) ?? contactEmail(c) ?? "";
      },
      cell: (item) => {
        const c = byId.get(Number(item.id));
        if (!c) return "—";
        return contactDisplayName(c) ?? contactEmail(c) ?? "—";
      },
    },
    {
      id: "company",
      header: "Company",
      sortValue: (item) => byId.get(Number(item.id))?.company?.name ?? "",
      cell: (item) => {
        const c = byId.get(Number(item.id));
        return c?.company?.name ?? "—";
      },
    },
    {
      id: "gst_type",
      header: "GST type",
      sortValue: (item) =>
        byId.get(Number(item.id))?.gst_registration_type ?? "",
      cell: (item) => {
        const c = byId.get(Number(item.id));
        if (!c?.gst_registration_type) return "—";
        return (
          <Badge variant="outline">
            {formatGstType(c.gst_registration_type)}
          </Badge>
        );
      },
    },
    {
      id: "gstin",
      header: "GSTIN",
      sortValue: (item) => byId.get(Number(item.id))?.gstin ?? "",
      cell: (item) => {
        const c = byId.get(Number(item.id));
        return <span className="font-mono text-sm">{c?.gstin ?? "—"}</span>;
      },
    },
    {
      id: "city",
      header: "City",
      sortValue: (item) =>
        byId.get(Number(item.id))?.billing_address_city ?? "",
      cell: (item) => {
        const c = byId.get(Number(item.id));
        return c?.billing_address_city ?? "—";
      },
    },
  ];
}

function CustomerCard({ customer }: { customer: Customer }) {
  const gstType = customer.gst_registration_type;

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="truncate text-lg">{customer.name}</CardTitle>
            <p className="mt-1 font-mono text-xs text-muted-foreground">
              {customer.customer_code}
            </p>
          </div>
          {gstType && (
            <Badge variant="secondary" className="shrink-0 font-normal">
              {formatGstType(gstType)}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Contact
          </p>
          <p className="mt-1">{customerContactDescription(customer)}</p>
        </div>
        {(customer.company?.name ||
          customer.gstin ||
          customer.billing_address_city) && (
          <div className="space-y-1 text-muted-foreground">
            {customer.company?.name && (
              <p>
                <span className="text-foreground/70">Company:</span>{" "}
                {customer.company.name}
              </p>
            )}
            {customer.gstin && (
              <p>
                <span className="text-foreground/70">GSTIN:</span>{" "}
                <span className="font-mono">{customer.gstin}</span>
              </p>
            )}
            {customer.billing_address_city && (
              <p>
                <span className="text-foreground/70">City:</span>{" "}
                {customer.billing_address_city}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function customerKanbanColumnId(c: Customer) {
  const key = c.gst_registration_type?.toLowerCase() ?? "other";
  return KANBAN_COLUMN_IDS.has(key) ? key : "other";
}

export default function SalesCustomersPage() {
  const { setTitle } = usePageTitle();
  const [viewMode, setViewMode] = useCollectionViewMode(
    "kyc_view_mode",
    "list",
  );
  const collectionFilters = useCollectionPageFilters(
    "customers",
    getCollectionFilterDefinitions("customers"),
  );
  const {
    items: customers,
    total,
    loading,
    error,
    reload: fetchCustomers,
    setItems: setCustomers,
  } = useCollectionData(
    customersApi.getAll,
    collectionFilters.apiParamsKey,
    collectionFilters.apiParams,
    { limit: LIST_LIMIT },
  );
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<number[]>([]);

  useEffect(() => {
    setSelectedCustomerIds([]);
  }, [collectionFilters.apiParamsKey]);

  useEffect(() => {
    setTitle("KYC");
    return () => setTitle(null);
  }, [setTitle]);

  const collectionItems = useMemo(
    () => customers.map(customerToCollectionItem),
    [customers],
  );

  const customerTableColumns = useMemo(
    () => buildCustomerTableColumns(customers),
    [customers],
  );

  const customerById = useMemo(
    () => new Map(customers.map((c) => [c.id, c])),
    [customers],
  );

  const handleCustomerKanbanMove = async (
    item: CollectionItem,
    toColumnId: string,
  ) => {
    const id = Number(item.id);
    const customer = customerById.get(id);
    if (!customer) return;

    const previousGst = customer.gst_registration_type;
    setCustomers((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, gst_registration_type: toColumnId } : c,
      ),
    );

    try {
      await customersApi.update(id, { gst_registration_type: toColumnId });
    } catch (err) {
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === id ? { ...c, gst_registration_type: previousGst } : c,
        ),
      );
      console.error("Failed to update customer GST type:", err);
    }
  };

  const listDescription = loading
    ? "Loading…"
    : `${total} customer${total === 1 ? "" : "s"}${
        collectionFilters.isFiltering ? " (filtered)" : ""
      }`;

  const renderCustomers = (mode: CollectionViewMode) => {
    if (mode === "list") {
      return (
        <CollectionView
          loading={loading}
          items={collectionItems}
          columns={customerTableColumns}
          primaryColumnId="name"
          selectable
          selectedIds={selectedCustomerIds}
          onSelectedIdsChange={(ids) =>
            setSelectedCustomerIds(ids.map((id) => Number(id)))
          }
          emptyMessage="No customers found."
          loadingMessage="Loading customers…"
        />
      );
    }

    if (mode === "kanban") {
      return (
        <CollectionKanbanView
          loading={loading}
          items={collectionItems}
          columns={KANBAN_COLUMNS}
          groupBy={(item) => {
            const customer = customerById.get(Number(item.id));
            return customer ? customerKanbanColumnId(customer) : "other";
          }}
          getColumnSubtext={(_columnId, columnItems) => {
            const count = columnItems.length;
            return `${count} customer${count !== 1 ? "s" : ""}`;
          }}
          onItemMove={handleCustomerKanbanMove}
          loadingMessage="Loading customers…"
          emptyMessage="No customers found."
        />
      );
    }

    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {customers.map((customer) => (
          <CustomerCard key={customer.id} customer={customer} />
        ))}
      </div>
    );
  };

  const showEmpty = !loading && !error && customers.length === 0;

  return (
    <PageShell fill className="bg-background text-foreground">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold">KYC</h1>
          <p className="mt-1 text-muted-foreground">{listDescription}</p>
        </div>

        <CollectionPageToolbar
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          newAction={{
            label: "New KYC",
            href: "/customer-onboarding",
            ariaLabel: "Start new KYC onboarding",
          }}
          className="w-full lg:w-auto"
        >
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fetchCustomers()}
            disabled={loading}
            aria-label="Refresh customers"
          >
            <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </CollectionPageToolbar>
      </div>

      <CollectionFilterControls
        className="mb-4"
        definitions={collectionFilters.definitions}
        search={collectionFilters.search}
        onSearchChange={collectionFilters.setSearch}
        searchPlaceholder="Search name, code, GSTIN, email…"
        facets={collectionFilters.facets}
        onFacetChange={collectionFilters.setFacetValues}
        numbers={collectionFilters.numbers}
        onNumberRangeChange={collectionFilters.setNumberRange}
        dates={collectionFilters.dates}
        onDateRangeChange={collectionFilters.setDateRange}
        resource={collectionFilters.resource}
        filterState={collectionFilters.filterState}
        onApplySavedView={collectionFilters.applyFilterState}
        onClearAll={collectionFilters.clearFilters}
        isFiltering={collectionFilters.isFiltering}
        getOptions={collectionFilters.getOptions}
        loadOptions={collectionFilters.loadOptions}
      />

      {error && (
        <div
          role="alert"
          className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      {viewMode === "list" && !error && renderCustomers("list")}

      {viewMode === "kanban" && !error && (
        <div className="flex min-h-0 flex-1 flex-col">
          {renderCustomers("kanban")}
        </div>
      )}

      {viewMode === "card" && loading && customers.length === 0 && (
        <div className="py-10 text-center text-sm text-muted-foreground">
          Loading customers…
        </div>
      )}

      {viewMode === "card" && showEmpty && (
        <div className="rounded-lg border border-dashed bg-card py-16 text-center">
          <h3 className="text-xl font-medium">No customers found</h3>
          <p className="mt-2 text-muted-foreground">
            Try adjusting your search or start a new KYC onboarding.
          </p>
          <Button variant="default" className="mt-6" asChild>
            <Link href="/customer-onboarding">
              <Plus className="mr-2 size-4" />
              Start KYC onboarding
            </Link>
          </Button>
        </div>
      )}

      {viewMode === "card" &&
        !showEmpty &&
        !error &&
        customers.length > 0 &&
        renderCustomers("card")}
    </PageShell>
  );
}
