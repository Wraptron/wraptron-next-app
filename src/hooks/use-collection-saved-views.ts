"use client";

import { useCallback, useEffect, useState } from "react";
import {
  collectionSavedViewsApi,
  type CollectionSavedViewRecord,
} from "@/lib/api";
import {
  createLocalSavedViewId,
  deleteLocalSavedView,
  listLocalSavedViews,
  mergeSavedViews,
  saveLocalSavedView,
  type CollectionSavedView,
} from "@/lib/collection-saved-views";
import {
  toSavedViewFilterState,
  type CollectionFilterResource,
  type CollectionFilterState,
} from "@/lib/collection-filter-definitions";

function remoteToView(row: CollectionSavedViewRecord): CollectionSavedView {
  return {
    id: `remote-${row.id}`,
    remoteId: row.id,
    name: row.name,
    resource: row.resource as CollectionFilterResource,
    source: "remote",
    updatedAt: row.updated_at,
    filterState: {
      search: row.filter_state.search ?? "",
      facets: row.filter_state.facets ?? {},
      numbers: row.filter_state.numbers ?? {},
      dates: row.filter_state.dates ?? {},
    },
  };
}

export function useCollectionSavedViews(resource: CollectionFilterResource) {
  const [views, setViews] = useState<CollectionSavedView[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const local = listLocalSavedViews(resource);

    try {
      const response = await collectionSavedViewsApi.list(resource);
      const remote = response.data.map(remoteToView);
      setViews(mergeSavedViews(local, remote));
    } catch {
      setViews(local);
    } finally {
      setLoading(false);
    }
  }, [resource]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const saveView = useCallback(
    async (name: string, filterState: CollectionFilterState) => {
      const trimmed = name.trim();
      if (!trimmed) return null;

      const payload = toSavedViewFilterState(filterState);
      const now = new Date().toISOString();

      let saved: CollectionSavedView = {
        id: createLocalSavedViewId(),
        name: trimmed,
        resource,
        filterState: payload,
        source: "local",
        updatedAt: now,
      };

      saveLocalSavedView(saved);

      try {
        const response = await collectionSavedViewsApi.save({
          resource,
          name: trimmed,
          filter_state: payload,
        });
        if (response.data) {
          saved = remoteToView(response.data);
          saveLocalSavedView(saved);
        }
      } catch {
        // Keep local copy when offline or unauthenticated
      }

      await refresh();
      return saved;
    },
    [resource, refresh],
  );

  const deleteView = useCallback(
    async (view: CollectionSavedView) => {
      deleteLocalSavedView(resource, view.id);

      if (view.remoteId != null) {
        try {
          await collectionSavedViewsApi.remove(view.remoteId);
        } catch {
          // Local delete still applies
        }
      }

      await refresh();
    },
    [resource, refresh],
  );

  return {
    views,
    loading,
    saveView,
    deleteView,
    refresh,
  };
}
