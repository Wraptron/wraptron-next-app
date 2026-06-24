"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  buildCollectionApiParams,
  buildCollectionFilterUrlParams,
  filterStateEqual,
  mergeFilterParamsIntoSearchParams,
  parseCollectionFiltersFromUrl,
  readFilterQueryFromUrl,
  serializeCollectionApiParams,
  toSavedViewFilterState,
  type CollectionApiParams,
  type CollectionFilterDefinition,
  type CollectionFilterResource,
  type CollectionFilterState,
  type DateRangeValue,
  type NumberRangeValue,
} from "@/lib/collection-filter-definitions";
import { collectionFiltersApi } from "@/lib/api";

const SEARCH_DEBOUNCE_MS = 350;

export function useCollectionPageFilters(
  resource: CollectionFilterResource,
  definitions: CollectionFilterDefinition[],
) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlQuery = searchParams.toString();

  const parsedFromUrl = useMemo(
    () => parseCollectionFiltersFromUrl(definitions, searchParams),
    [definitions, urlQuery],
  );

  const urlFilterKey = useMemo(
    () => readFilterQueryFromUrl(definitions, searchParams),
    [definitions, urlQuery],
  );

  const [searchInput, setSearchInput] = useState(parsedFromUrl.search);
  const [facets, setFacets] = useState<Record<string, string[]>>(
    parsedFromUrl.facets,
  );
  const [numbers, setNumbers] = useState<Record<string, NumberRangeValue>>(
    parsedFromUrl.numbers,
  );
  const [dates, setDates] = useState<Record<string, DateRangeValue>>(
    parsedFromUrl.dates,
  );
  const [optionsByField, setOptionsByField] = useState<
    Record<string, { value: string; label: string }[]>
  >({});

  const lastWrittenFilterKey = useRef<string | null>(null);
  const lastSyncedFilterKey = useRef<string | null>(null);

  useEffect(() => {
    if (lastSyncedFilterKey.current === urlFilterKey) return;
    lastSyncedFilterKey.current = urlFilterKey;

    const next = parseCollectionFiltersFromUrl(
      definitions,
      new URLSearchParams(urlQuery),
    );

    setSearchInput((current) => (current === next.search ? current : next.search));
    setFacets((current) =>
      filterStateEqual(
        { search: "", facets: current, numbers: {}, dates: {} },
        { search: "", facets: next.facets, numbers: {}, dates: {} },
      )
        ? current
        : next.facets,
    );
    setNumbers((current) =>
      filterStateEqual(
        { search: "", facets: {}, numbers: current, dates: {} },
        { search: "", facets: {}, numbers: next.numbers, dates: {} },
      )
        ? current
        : next.numbers,
    );
    setDates((current) =>
      filterStateEqual(
        { search: "", facets: {}, numbers: {}, dates: current },
        { search: "", facets: {}, numbers: {}, dates: next.dates },
      )
        ? current
        : next.dates,
    );
  }, [urlFilterKey, definitions, urlQuery]);

  const debouncedSearch = useDebouncedValue(searchInput, SEARCH_DEBOUNCE_MS);

  const filterState = useMemo<CollectionFilterState>(
    () => ({
      search: debouncedSearch,
      facets,
      numbers,
      dates,
    }),
    [debouncedSearch, facets, numbers, dates],
  );

  const localFilterKey = useMemo(
    () => buildCollectionFilterUrlParams(definitions, filterState).toString(),
    [definitions, filterState],
  );

  const apiParams = useMemo(
    () =>
      buildCollectionApiParams(
        definitions,
        debouncedSearch,
        facets,
        numbers,
        dates,
      ),
    [definitions, debouncedSearch, facets, numbers, dates],
  );

  const apiParamsKey = useMemo(
    () => serializeCollectionApiParams(apiParams),
    [apiParams],
  );

  const isFiltering = useMemo(() => {
    if (debouncedSearch.trim()) return true;
    if (Object.values(facets).some((values) => values.length > 0)) return true;
    if (
      Object.values(numbers).some(
        (range) => range.min?.trim() || range.max?.trim(),
      )
    ) {
      return true;
    }
    if (
      Object.values(dates).some(
        (range) => range.from?.trim() || range.to?.trim(),
      )
    ) {
      return true;
    }
    return false;
  }, [debouncedSearch, facets, numbers, dates]);

  const activeFacetCount = useMemo(() => {
    let count = Object.values(facets).reduce(
      (sum, values) => sum + values.length,
      0,
    );
    count += Object.values(numbers).filter(
      (range) => range.min?.trim() || range.max?.trim(),
    ).length;
    count += Object.values(dates).filter(
      (range) => range.from?.trim() || range.to?.trim(),
    ).length;
    return count;
  }, [facets, numbers, dates]);

  useEffect(() => {
    if (localFilterKey === urlFilterKey) {
      lastWrittenFilterKey.current = localFilterKey;
      return;
    }
    if (lastWrittenFilterKey.current === localFilterKey) return;

    lastWrittenFilterKey.current = localFilterKey;

    const filterParams = buildCollectionFilterUrlParams(
      definitions,
      filterState,
    );
    const merged = mergeFilterParamsIntoSearchParams(
      definitions,
      new URLSearchParams(urlQuery),
      filterParams,
    );
    const nextQuery = merged.toString();
    if (nextQuery === urlQuery) return;

    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
      scroll: false,
    });
  }, [
    localFilterKey,
    urlFilterKey,
    urlQuery,
    definitions,
    pathname,
    router,
    filterState,
  ]);

  const setFacetValues = useCallback((facetId: string, values: string[]) => {
    setFacets((current) => {
      if (values.length === 0) {
        if (!(facetId in current)) return current;
        const next = { ...current };
        delete next[facetId];
        return next;
      }
      const existing = current[facetId] ?? [];
      if (
        existing.length === values.length &&
        existing.every((value, index) => value === values[index])
      ) {
        return current;
      }
      return { ...current, [facetId]: values };
    });
  }, []);

  const setNumberRange = useCallback(
    (fieldId: string, range: NumberRangeValue) => {
      setNumbers((current) => {
        const hasValue = range.min?.trim() || range.max?.trim();
        if (!hasValue) {
          if (!(fieldId in current)) return current;
          const next = { ...current };
          delete next[fieldId];
          return next;
        }
        const existing = current[fieldId] ?? {};
        if (
          (existing.min ?? "") === (range.min ?? "") &&
          (existing.max ?? "") === (range.max ?? "")
        ) {
          return current;
        }
        return { ...current, [fieldId]: range };
      });
    },
    [],
  );

  const setDateRange = useCallback((fieldId: string, range: DateRangeValue) => {
    setDates((current) => {
      const hasValue = range.from?.trim() || range.to?.trim();
      if (!hasValue) {
        if (!(fieldId in current)) return current;
        const next = { ...current };
        delete next[fieldId];
        return next;
      }
      const existing = current[fieldId] ?? {};
      if (
        (existing.from ?? "") === (range.from ?? "") &&
        (existing.to ?? "") === (range.to ?? "")
      ) {
        return current;
      }
      return { ...current, [fieldId]: range };
    });
  }, []);

  const applyFilterState = useCallback((state: CollectionFilterState) => {
    const normalized = toSavedViewFilterState(state);
    setSearchInput(normalized.search);
    setFacets(normalized.facets);
    setNumbers(normalized.numbers);
    setDates(normalized.dates);
  }, []);

  const clearFilters = useCallback(() => {
    setSearchInput("");
    setFacets((current) => (Object.keys(current).length === 0 ? current : {}));
    setNumbers((current) => (Object.keys(current).length === 0 ? current : {}));
    setDates((current) => (Object.keys(current).length === 0 ? current : {}));
  }, []);

  const loadOptions = useCallback(
    async (fieldId: string) => {
      const definition = definitions.find((item) => item.id === fieldId);
      if (!definition || definition.options) return definition?.options ?? [];
      if (definition.type === "number" || definition.type === "date") {
        return [];
      }

      if (optionsByField[fieldId]) return optionsByField[fieldId];

      const response = await collectionFiltersApi.getOptions(resource, fieldId);
      setOptionsByField((current) => ({
        ...current,
        [fieldId]: response.options,
      }));
      return response.options;
    },
    [definitions, optionsByField, resource],
  );

  const getOptions = useCallback(
    (definition: CollectionFilterDefinition) =>
      definition.options ?? optionsByField[definition.id] ?? [],
    [optionsByField],
  );

  return {
    search: searchInput,
    setSearch: setSearchInput,
    debouncedSearch,
    facets,
    setFacetValues,
    numbers,
    setNumberRange,
    dates,
    setDateRange,
    filterState,
    applyFilterState,
    clearFilters,
    apiParams: apiParams as CollectionApiParams,
    apiParamsKey,
    isFiltering,
    activeFacetCount,
    loadOptions,
    getOptions,
    definitions,
    resource,
  };
}

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
