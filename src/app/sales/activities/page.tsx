"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Activity, CheckSquare, Phone, RefreshCw, StickyNote } from "lucide-react";

const KANBAN_COLUMNS: CollectionKanbanColumn[] = [
  { id: "scheduled", label: "Scheduled" },
  { id: "completed", label: "Completed" },
  { id: "cancelled", label: "Cancelled" },
  { id: "other", label: "Other" },
];

const KANBAN_COLUMN_IDS = new Set(KANBAN_COLUMNS.map((c) => c.id));

const getTypeBadgeClass = (type?: string) => {
  const key = type?.toLowerCase() || "";
  if (key === "task") return "bg-blue-100 text-blue-800";
  if (key === "call") return "bg-green-100 text-green-800";
  if (key === "note") return "bg-purple-100 text-purple-800";
  if (key === "meeting") return "bg-orange-100 text-orange-800";
  if (key === "whatsapp") return "bg-emerald-100 text-emerald-800";
  return "bg-gray-100 text-gray-800";
};

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
        <Badge variant="outline" className={getTypeBadgeClass(a.type)}>
          {a.type}
        </Badge>
        <span className="text-xs text-muted-foreground">{formatDateTime(a.activity_date)}</span>
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
        return <Badge className={getTypeBadgeClass(a.type)}>{a.type}</Badge>;
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
  const [activities, setActivities] = useState<SalesActivity[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    setTitle("Activities");
    return () => setTitle(null);
  }, [setTitle]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const fetchActivities = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await activitiesApi.getAll({
        search: debouncedSearch || undefined,
        limit: 500,
        offset: 0,
      });
      setActivities(res.data ?? []);
      setTotal(res.total ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch activities");
      setActivities([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const items = useMemo(() => activities.map(activityToItem), [activities]);
  const columns = useMemo(() => buildColumns(activities), [activities]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Sales activities</h1>
            <p className="text-sm text-muted-foreground">{total} activities</p>
          </div>
          <CollectionPageToolbar
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            showViewSwitcher
          >
            <div className="flex items-center gap-2">
              <Input
                placeholder="Search subject or notes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-[240px]"
              />
              <Button variant="outline" size="sm" onClick={fetchActivities}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </CollectionPageToolbar>
        </div>

        {error ? (
          <p className="mb-4 text-sm text-destructive">{error}</p>
        ) : null}

        {viewMode === "kanban" ? (
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
        ) : viewMode === "card" ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {activities.map((a) => (
              <div key={a.id} className="rounded-md border border-border bg-card p-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="font-medium">{a.subject || "Untitled activity"}</p>
                  <Badge className={getTypeBadgeClass(a.type)}>{a.type}</Badge>
                </div>
                <p className="mb-2 text-xs text-muted-foreground">{formatDateTime(a.activity_date)}</p>
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
      </div>
    </div>
  );
}

