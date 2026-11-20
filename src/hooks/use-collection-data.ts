"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import useSWR from "swr";
import { getActiveOrgId, type CollectionListQueryParams } from "@/lib/api";
import { buildSwrKey } from "@/lib/swr";

type CollectionListResponse<T> = {
  data: T[];
  total: number;
};

export function useCollectionData<T>(
  fetcher: (params: CollectionListQueryParams) => Promise<CollectionListResponse<T>>,
  apiParamsKey: string,
  apiParams: Record<string, string>,
  options?: { limit?: number; enabled?: boolean; resource?: string },
) {
  const limit = options?.limit ?? 500;
  const enabled = options?.enabled ?? true;
  const activeOrgId = getActiveOrgId();

  // Infer resource name from options or fetcher source
  const resourceName = useMemo(() => {
    if (options?.resource) return options.resource;
    if ((fetcher as any).__resource) return (fetcher as any).__resource;
    const match = fetcher.toString().match(/\/api\/[a-zA-Z0-9_\/-]+/);
    if (match?.[0]) return match[0];
    return "collection";
  }, [fetcher, options?.resource]);

  const swrKey = useMemo(() => {
    if (!enabled) return null;
    const endpointWithParams = `${resourceName}?${apiParamsKey}&limit=${limit}&offset=0`;
    return buildSwrKey(endpointWithParams, activeOrgId);
  }, [enabled, resourceName, apiParamsKey, limit, activeOrgId]);

  const apiParamsRef = useRef(apiParams);
  apiParamsRef.current = apiParams;

  const [overrideItems, setOverrideItems] = useState<T[] | null>(null);

  const { data, error: swrError, isLoading, mutate } = useSWR<CollectionListResponse<T>>(
    swrKey,
    () =>
      fetcher({
        ...apiParamsRef.current,
        limit,
        offset: 0,
      }),
    {
      revalidateOnFocus: true,
      dedupingInterval: 5000,
    },
  );

  // Reset override whenever data reference updates
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
    error,
    reload,
    setItems,
  };
}
