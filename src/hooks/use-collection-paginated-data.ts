"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CollectionListQueryParams } from "@/lib/api";

type CollectionListResponse<T> = {
  data: T[];
  total: number;
};

export function useCollectionPaginatedData<T>(
  fetcher: (params: CollectionListQueryParams) => Promise<CollectionListResponse<T>>,
  apiParamsKey: string,
  apiParams: Record<string, string>,
  options?: { pageSize?: number; enabled?: boolean },
) {
  const pageSize = options?.pageSize ?? 200;
  const enabled = options?.enabled ?? true;
  const [items, setItems] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [backgroundError, setBackgroundError] = useState<string | null>(null);
  const requestId = useRef(0);
  const apiParamsRef = useRef(apiParams);
  apiParamsRef.current = apiParams;

  const loadAllPages = useCallback(async () => {
    const currentRequest = ++requestId.current;
    const params = apiParamsRef.current;
    setLoading(true);
    setLoadingMore(false);
    setError(null);
    setBackgroundError(null);

    try {
      const first = await fetcher({
        ...params,
        limit: pageSize,
        offset: 0,
      });
      if (currentRequest !== requestId.current) return;

      setItems(first.data);
      setTotal(first.total);
      setLoading(false);

      if (first.total <= first.data.length) return;

      setLoadingMore(true);
      let offset = first.data.length;

      while (offset < first.total) {
        try {
          const next = await fetcher({
            ...params,
            limit: pageSize,
            offset,
          });
          if (currentRequest !== requestId.current) return;

          if (next.data.length === 0) break;

          setItems((current) => [...current, ...next.data]);
          offset += next.data.length;
        } catch (pageErr) {
          if (currentRequest !== requestId.current) return;
          setBackgroundError(
            pageErr instanceof Error
              ? pageErr.message
              : "Failed to load more items",
          );
          break;
        }
      }
    } catch (err) {
      if (currentRequest !== requestId.current) return;
      setError(err instanceof Error ? err.message : "Failed to fetch data");
      setItems([]);
      setTotal(0);
    } finally {
      if (currentRequest === requestId.current) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }, [fetcher, pageSize]);

  useEffect(() => {
    if (!enabled) return;
    void loadAllPages();
  }, [apiParamsKey, enabled, loadAllPages]);

  return {
    items,
    total,
    loading,
    loadingMore,
    error,
    backgroundError,
    reload: loadAllPages,
    setItems,
  };
}
