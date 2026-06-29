"use client";

import { PageShell } from "@/components/page-shell";
import React, { useEffect, useMemo, useState } from "react";
import { usePageTitle } from "@/contexts/page-title-context";
import { activitiesApi, type SalesActivity } from "@/lib/api";
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
} from "@/components/collection-page-toolbar";
import { CollectionFilterControls } from "@/components/collection-filters";
import { useCollectionPageFilters } from "@/components/collection-page-filters";
import { useCollectionData } from "@/hooks/use-collection-data";
import { getCollectionFilterDefinitions } from "@/lib/collection-filter-definitions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Activity,
  CheckSquare,
  Phone,
  RefreshCw,
  StickyNote,
} from "lucide-react";
import { statusBadgeClass } from "@/lib/status-colors";

const KANBAN_COLUMNS: CollectionKanbanColumn[] = [
  { id: "scheduled", label: "Scheduled" },
  { id: "completed", label: "Completed" },
  { id: "cancelled", label: "Cancelled" },
  { id: "other", label: "Other" },
];

const KANBAN_COLUMN_IDS = new Set(KANBAN_COLUMNS.map((c) => c.id));

function formatDateTime(value?: string) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function activityToItem(a: SalesActivity): CollectionItem {
  return {
    id: a.id,
    title: a.subject || "Untitled activity",
    description: a.description || a.outcome || "—",
    meta: (
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className={statusBadgeClass(a.type)}>
          {a.type}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {formatDateTime(a.activity_date)}
        </span>
      </div>
    ),
  };
}

function activityColumnId(a: SalesActivity) {
  const key = a.status?.toLowerCase() || "other";
  return KANBAN_COLUMN_IDS.has(key) ? key : "other";
}

function buildColumns(activities: SalesActivity[]): CollectionColumn[] {
  const byId = new Map(activities.map((a) => [a.id, a]));
  return [
    {
      id: "subject",
      header: "Subject",
      headerClassName: "w-[300px]",
      sortValue: (item) => byId.get(Number(item.id))?.subject ?? "",
      cell: (item) => byId.get(Number(item.id))?.subject || "—",
    },
    {
      id: "type",
      header: "Type",
      sortValue: (item) => byId.get(Number(item.id))?.type ?? "",
      cell: (item) => {
        const a = byId.get(Number(item.id));
        if (!a) return "—";
        return <Badge className={statusBadgeClass(a.type)}>{a.type}</Badge>;
      },
    },
    {
      id: "status",
      header: "Status",
      sortValue: (item) => byId.get(Number(item.id))?.status ?? "",
      cell: (item) => byId.get(Number(item.id))?.status || "—",
    },
    {
      id: "company",
      header: "Company",
      sortValue: (item) => byId.get(Number(item.id))?.company_name ?? "",
      cell: (item) => byId.get(Number(item.id))?.company_name || "—",
    },
    {
      id: "contact",
      header: "Contact",
      sortValue: (item) => byId.get(Number(item.id))?.contact_name ?? "",
      cell: (item) => byId.get(Number(item.id))?.contact_name || "—",
    },
    {
      id: "deal",
      header: "Deal",
      sortValue: (item) => byId.get(Number(item.id))?.deal_title ?? "",
      cell: (item) => byId.get(Number(item.id))?.deal_title || "—",
    },
    {
      id: "when",
      header: "When",
      sortValue: (item) => {
        const date = byId.get(Number(item.id))?.activity_date;
        return date ? new Date(date) : "";
      },
      cell: (item) => formatDateTime(byId.get(Number(item.id))?.activity_date),
    },
  ];
}

export default function SalesActivitiesPage() {
  const { setTitle } = usePageTitle();
  const [viewMode, setViewMode] = useCollectionViewMode(
    "sales_activities_view_mode",
    "list",
  );
  const collectionFilters = useCollectionPageFilters(
    "activities",
    getCollectionFilterDefinitions("activities"),
  );
  const {
    items: activities,
    total,
    loading,
    error,
    reload: fetchActivities,
  } = useCollectionData(
    activitiesApi.getAll,
    collectionFilters.apiParamsKey,
    collectionFilters.apiParams,
    { limit: 500 },
  );

  useEffect(() => {
    setTitle("Activities");
    return () => setTitle(null);
  }, [setTitle]);

  const items = useMemo(() => activities.map(activityToItem), [activities]);
  const columns = useMemo(() => buildColumns(activities), [activities]);

  return (
    <PageShell fill className="bg-background text-foreground">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Sales activities</h1>
          <p className="text-sm text-muted-foreground">
            {loading
              ? "Loading…"
              : `${total} activit${total === 1 ? "y" : "ies"}${
                  collectionFilters.isFiltering ? " (filtered)" : ""
                }`}
          </p>
        </div>
        <CollectionPageToolbar
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          showViewSwitcher
        >
          <Button variant="outline" size="sm" onClick={fetchActivities}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </CollectionPageToolbar>
      </div>

      <CollectionFilterControls
        className="mb-4"
        definitions={collectionFilters.definitions}
        search={collectionFilters.search}
        onSearchChange={collectionFilters.setSearch}
        searchPlaceholder="Search subject or notes…"
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

      {error ? <p className="mb-4 text-sm text-destructive">{error}</p> : null}

      {viewMode === "kanban" ? (
        <div className="flex min-h-0 flex-1 flex-col">
          <CollectionKanbanView
            items={items}
            columns={KANBAN_COLUMNS}
            groupBy={(item) => {
              const activity = activities.find((a) => a.id === Number(item.id));
              if (!activity) return "other";
              return activityColumnId(activity);
            }}
            loading={loading}
            emptyMessage="No activities found."
          />
        </div>
      ) : viewMode === "card" ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {activities.map((a) => (
            <div
              key={a.id}
              className="rounded-md border border-border bg-card p-4"
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="font-medium">
                  {a.subject || "Untitled activity"}
                </p>
                <Badge className={statusBadgeClass(a.type)}>{a.type}</Badge>
              </div>
              <p className="mb-2 text-xs text-muted-foreground">
                {formatDateTime(a.activity_date)}
              </p>
              <p className="line-clamp-3 text-sm text-muted-foreground">
                {a.description || a.outcome || "—"}
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span>{a.status}</span>
                {a.company_name ? <span>• {a.company_name}</span> : null}
                {a.deal_title ? <span>• {a.deal_title}</span> : null}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <CollectionView
          items={items}
          columns={columns}
          loading={loading}
          emptyTitle="No activities yet"
          emptyDescription="Activities created from deals and contacts will appear here."
        />
      )}

      <div className="mt-6 flex flex-wrap gap-2">
        <Badge variant="outline" className="gap-1">
          <CheckSquare className="h-3.5 w-3.5" />
          Tasks
        </Badge>
        <Badge variant="outline" className="gap-1">
          <Phone className="h-3.5 w-3.5" />
          Calls
        </Badge>
        <Badge variant="outline" className="gap-1">
          <StickyNote className="h-3.5 w-3.5" />
          Notes
        </Badge>
        <Badge variant="outline" className="gap-1">
          <Activity className="h-3.5 w-3.5" />
          Meetings / WhatsApp
        </Badge>
      </div>
    </PageShell>
  );
}
