"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CollectionListQueryParams } from "@/lib/api";

type CollectionListResponse<T> = {
  data: T[];
  total: number;
};

export function useCollectionData<T>(
  fetcher: (params: CollectionListQueryParams) => Promise<CollectionListResponse<T>>,
  apiParamsKey: string,
  apiParams: Record<string, string>,
  options?: { limit?: number; enabled?: boolean },
) {
  const limit = options?.limit ?? 500;
  const enabled = options?.enabled ?? true;
  const [items, setItems] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);
  const apiParamsRef = useRef(apiParams);
  apiParamsRef.current = apiParams;

  const reload = useCallback(async () => {
    const currentRequest = ++requestId.current;
    setLoading(true);
    setError(null);
    try {
      const response = await fetcher({
        ...apiParamsRef.current,
        limit,
        offset: 0,
      });
      if (currentRequest !== requestId.current) return;
      setItems(response.data);
      setTotal(response.total);
    } catch (err) {
      if (currentRequest !== requestId.current) return;
      setError(err instanceof Error ? err.message : "Failed to fetch data");
    } finally {
      if (currentRequest === requestId.current) {
        setLoading(false);
      }
    }
  }, [fetcher, limit]);

  useEffect(() => {
    if (!enabled) return;
    void reload();
  }, [apiParamsKey, enabled, reload]);

  return {
    items,
    total,
    loading,
    error,
    reload,
    setItems,
  };
}
