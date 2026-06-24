"use client";

import React from "react";
import { CollectionFilterControls } from "@/components/collection-filters";
import { useCollectionPageFilters } from "@/hooks/use-collection-page-filters";
import {
  getCollectionFilterDefinitions,
  type CollectionFilterDefinition,
  type CollectionFilterResource,
} from "@/lib/collection-filter-definitions";

export type CollectionPageFiltersProps = {
  resource: CollectionFilterResource;
  definitions?: CollectionFilterDefinition[];
  searchPlaceholder?: string;
  className?: string;
  children?: (filters: ReturnType<typeof useCollectionPageFilters>) => React.ReactNode;
};

export function CollectionPageFilters({
  resource,
  definitions: definitionsProp,
  searchPlaceholder,
  className,
  children,
}: CollectionPageFiltersProps) {
  const definitions = definitionsProp ?? getCollectionFilterDefinitions(resource);
  const filters = useCollectionPageFilters(resource, definitions);

  if (children) {
    return <>{children(filters)}</>;
  }

  return (
    <CollectionFilterControls
      className={className}
      definitions={filters.definitions}
      search={filters.search}
      onSearchChange={filters.setSearch}
      searchPlaceholder={searchPlaceholder ?? `Search ${resource}…`}
      facets={filters.facets}
      onFacetChange={filters.setFacetValues}
      numbers={filters.numbers}
      onNumberRangeChange={filters.setNumberRange}
      dates={filters.dates}
      onDateRangeChange={filters.setDateRange}
      onClearAll={filters.clearFilters}
      isFiltering={filters.isFiltering}
      getOptions={filters.getOptions}
      loadOptions={filters.loadOptions}
      resource={resource}
      filterState={filters.filterState}
      onApplySavedView={filters.applyFilterState}
    />
  );
}

export { useCollectionPageFilters };
