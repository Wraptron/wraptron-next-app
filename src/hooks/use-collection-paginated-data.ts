"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import useSWR from "swr";
import { getActiveOrgId, type CollectionListQueryParams } from "@/lib/api";
import { buildSwrKey } from "@/lib/swr";

type CollectionListResponse<T> = {
  data: T[];
  total: number;
};

export function useCollectionPaginatedData<T>(
  fetcher: (params: CollectionListQueryParams) => Promise<CollectionListResponse<T>>,
  apiParamsKey: string,
  apiParams: Record<string, string>,
  options?: { pageSize?: number; enabled?: boolean; resource?: string },
) {
  const pageSize = options?.pageSize ?? 200;
  const enabled = options?.enabled ?? true;
  const activeOrgId = getActiveOrgId();

  // Infer resource name
  const resourceName = useMemo(() => {
    if (options?.resource) return options.resource;
    if ((fetcher as any).__resource) return (fetcher as any).__resource;
    const match = fetcher.toString().match(/\/api\/[a-zA-Z0-9_\/-]+/);
    if (match?.[0]) return match[0];
    return "collection-paginated";
  }, [fetcher, options?.resource]);

  const swrKey = useMemo(() => {
    if (!enabled) return null;
    const endpointWithParams = `${resourceName}?${apiParamsKey}&pageSize=${pageSize}`;
    return buildSwrKey(endpointWithParams, activeOrgId);
  }, [enabled, resourceName, apiParamsKey, pageSize, activeOrgId]);

  const apiParamsRef = useRef(apiParams);
  apiParamsRef.current = apiParams;

  const [loadingMore, setLoadingMore] = useState(false);
  const [backgroundError, setBackgroundError] = useState<string | null>(null);
  const [overrideItems, setOverrideItems] = useState<T[] | null>(null);
  const requestId = useRef(0);

  const fetchAllPages = useCallback(async (): Promise<CollectionListResponse<T>> => {
    const currentRequest = ++requestId.current;
    const params = apiParamsRef.current;
    setBackgroundError(null);

    const first = await fetcher({
      ...params,
      limit: pageSize,
      offset: 0,
    });
    if (currentRequest !== requestId.current) return first;

    if (first.total <= first.data.length) {
      return first;
    }

    setLoadingMore(true);
    let accumulated = [...first.data];
    let offset = first.data.length;

    while (offset < first.total) {
      try {
        const next = await fetcher({
          ...params,
          limit: pageSize,
          offset,
        });
        if (currentRequest !== requestId.current) break;
        if (next.data.length === 0) break;
        accumulated = [...accumulated, ...next.data];
        offset += next.data.length;
      } catch (pageErr) {
        if (currentRequest !== requestId.current) break;
        setBackgroundError(
          pageErr instanceof Error
            ? pageErr.message
            : "Failed to load more items",
        );
        break;
      }
    }

    if (currentRequest === requestId.current) {
      setLoadingMore(false);
    }

    return {
      data: accumulated,
      total: first.total,
    };
  }, [fetcher, pageSize]);

  const { data, error: swrError, isLoading, mutate } = useSWR<CollectionListResponse<T>>(
    swrKey,
    fetchAllPages,
    {
      revalidateOnFocus: true,
      dedupingInterval: 5000,
    },
  );

  const prevDataRef = useRef(data);
  if (prevDataRef.current !== data) {
    prevDataRef.current = data;
    if (overrideItems !== null) {
      setOverrideItems(null);
    }
  }

  const items = overrideItems ?? (data?.data ?? []);
  const total = data?.total ?? items.length;
  const loading = enabled && !data && isLoading;
  const error = swrError instanceof Error ? swrError.message : swrError ? String(swrError) : null;

  const reload = useCallback(async () => {
    setOverrideItems(null);
    await mutate();
  }, [mutate]);

  const setItems = useCallback<React.Dispatch<React.SetStateAction<T[]>>>(
    (action) => {
      setOverrideItems((prev) => {
        const base = prev ?? (data?.data ?? []);
        return typeof action === "function"
          ? (action as (prev: T[]) => T[])(base)
          : action;
      });
    },
    [data?.data],
  );

  return {
    items,
    total,
    loading,
    loadingMore,
    error,
    backgroundError,
    reload,
    setItems,
  };
}
