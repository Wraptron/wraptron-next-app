"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ListFilter, Search, SlidersHorizontal, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CollectionSavedViewsMenu } from "@/components/collection-saved-views-menu";
import type {
  CollectionFilterDefinition,
  CollectionFilterResource,
  CollectionFilterState,
  DateRangeValue,
  NumberRangeValue,
} from "@/lib/collection-filter-definitions";
import { cn } from "@/lib/utils";

export type CollectionFacetOption = {
  value: string;
  label: string;
};

export type CollectionFilterControlsProps = {
  definitions: CollectionFilterDefinition[];
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  facets: Record<string, string[]>;
  onFacetChange: (facetId: string, values: string[]) => void;
  numbers?: Record<string, NumberRangeValue>;
  onNumberRangeChange?: (fieldId: string, range: NumberRangeValue) => void;
  dates?: Record<string, DateRangeValue>;
  onDateRangeChange?: (fieldId: string, range: DateRangeValue) => void;
  onClearAll: () => void;
  isFiltering?: boolean;
  getOptions: (
    definition: CollectionFilterDefinition,
  ) => CollectionFacetOption[];
  loadOptions: (fieldId: string) => Promise<CollectionFacetOption[]>;
  resource?: CollectionFilterResource;
  filterState?: CollectionFilterState;
  onApplySavedView?: (state: CollectionFilterState) => void;
  className?: string;
};

function formatNumberRangeLabel(
  label: string,
  range: NumberRangeValue,
): string {
  const min = range.min?.trim();
  const max = range.max?.trim();
  if (min && max) return `${label}: ${min} – ${max}`;
  if (min) return `${label}: ≥ ${min}`;
  if (max) return `${label}: ≤ ${max}`;
  return label;
}

function formatDateRangeLabel(label: string, range: DateRangeValue): string {
  const from = range.from?.trim();
  const to = range.to?.trim();
  if (from && to) return `${label}: ${from} – ${to}`;
  if (from) return `${label}: from ${from}`;
  if (to) return `${label}: until ${to}`;
  return label;
}

function isNumberRangeActive(range?: NumberRangeValue): boolean {
  return Boolean(range?.min?.trim() || range?.max?.trim());
}

function isDateRangeActive(range?: DateRangeValue): boolean {
  return Boolean(range?.from?.trim() || range?.to?.trim());
}

function NumberRangeInputs({
  value,
  onChange,
}: {
  value: NumberRangeValue;
  onChange: (range: NumberRangeValue) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 p-2">
      <Input
        type="number"
        inputMode="decimal"
        placeholder="Min"
        value={value.min ?? ""}
        onChange={(event) => onChange({ ...value, min: event.target.value })}
        className="h-8"
        aria-label="Minimum value"
      />
      <Input
        type="number"
        inputMode="decimal"
        placeholder="Max"
        value={value.max ?? ""}
        onChange={(event) => onChange({ ...value, max: event.target.value })}
        className="h-8"
        aria-label="Maximum value"
      />
      {isNumberRangeActive(value) ? (
        <Button
          variant="ghost"
          size="sm"
          className="col-span-2 h-8"
          onClick={() => onChange({})}
        >
          Clear
        </Button>
      ) : null}
    </div>
  );
}

function DateRangeInputs({
  value,
  onChange,
}: {
  value: DateRangeValue;
  onChange: (range: DateRangeValue) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 p-2">
      <Input
        type="date"
        value={value.from ?? ""}
        onChange={(event) => onChange({ ...value, from: event.target.value })}
        className="h-8"
        aria-label="From date"
      />
      <Input
        type="date"
        value={value.to ?? ""}
        onChange={(event) => onChange({ ...value, to: event.target.value })}
        className="h-8"
        aria-label="To date"
      />
      {isDateRangeActive(value) ? (
        <Button
          variant="ghost"
          size="sm"
          className="col-span-2 h-8"
          onClick={() => onChange({})}
        >
          Clear
        </Button>
      ) : null}
    </div>
  );
}

function FacetFilterButton({
  label,
  options,
  selected,
  onChange,
  onOpen,
}: {
  label: string;
  options: CollectionFacetOption[];
  selected: string[];
  onChange: (values: string[]) => void;
  onOpen?: () => void;
}) {
  const activeCount = selected.length;

  return (
    <Popover onOpenChange={(open) => open && onOpen?.()}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-9 border-dashed",
            activeCount > 0 && "border-primary/40 bg-primary/5",
          )}
          aria-label={`Filter by ${label}`}
        >
          <ListFilter className="mr-2 h-4 w-4" />
          {label}
          {activeCount > 0 && (
            <Badge
              variant="secondary"
              className="ml-2 rounded-sm px-1.5 font-normal"
            >
              {activeCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0" align="start">
        <FacetOptionsList
          options={options}
          selected={selected}
          onChange={onChange}
        />
      </PopoverContent>
    </Popover>
  );
}

function FacetOptionsList({
  options,
  selected,
  onChange,
}: {
  options: CollectionFacetOption[];
  selected: string[];
  onChange: (values: string[]) => void;
}) {
  const activeCount = selected.length;

  return (
    <>
      <div className="max-h-64 overflow-y-auto p-2">
        {options.length === 0 ? (
          <p className="px-2 py-4 text-center text-sm text-muted-foreground">
            No options
          </p>
        ) : (
          options.map((option) => {
            const checked = selected.includes(option.value);
            return (
              <label
                key={option.value}
                className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-muted"
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={() => {
                    const next = checked
                      ? selected.filter((v) => v !== option.value)
                      : [...selected, option.value];
                    onChange(next);
                  }}
                />
                <span className="truncate">{option.label}</span>
              </label>
            );
          })
        )}
      </div>
      {activeCount > 0 && (
        <div className="border-t border-border p-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-full justify-center"
            onClick={() => onChange([])}
          >
            Clear
          </Button>
        </div>
      )}
    </>
  );
}

function FilterPanelRow({
  definition,
  options,
  selected,
  numberRange,
  dateRange,
  onFacetChange,
  onNumberRangeChange,
  onDateRangeChange,
  onEnsureOptions,
}: {
  definition: CollectionFilterDefinition;
  options: CollectionFacetOption[];
  selected: string[];
  numberRange: NumberRangeValue;
  dateRange: DateRangeValue;
  onFacetChange: (values: string[]) => void;
  onNumberRangeChange: (range: NumberRangeValue) => void;
  onDateRangeChange: (range: DateRangeValue) => void;
  onEnsureOptions: () => void;
}) {
  const [open, setOpen] = useState(false);
  const activeCount =
    definition.type === "number"
      ? isNumberRangeActive(numberRange)
        ? 1
        : 0
      : definition.type === "date"
        ? isDateRangeActive(dateRange)
          ? 1
          : 0
        : selected.length;

  return (
    <div className="border-b border-border last:border-b-0">
      <button
        type="button"
        className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted/50"
        onClick={() => {
          if (!open && definition.type === "enum") onEnsureOptions();
          setOpen((value) => !value);
        }}
      >
        <span>{definition.label}</span>
        {activeCount > 0 ? (
          <Badge variant="secondary" className="rounded-sm px-1.5 font-normal">
            {activeCount}
          </Badge>
        ) : null}
      </button>
      {open ? (
        <div className="px-2 pb-2">
          {definition.type === "number" ? (
            <NumberRangeInputs
              value={numberRange}
              onChange={onNumberRangeChange}
            />
          ) : definition.type === "date" ? (
            <DateRangeInputs value={dateRange} onChange={onDateRangeChange} />
          ) : (
            <FacetOptionsList
              options={options}
              selected={selected}
              onChange={onFacetChange}
            />
          )}
        </div>
      ) : null}
    </div>
  );
}

export function CollectionFilterControls({
  definitions,
  search,
  onSearchChange,
  searchPlaceholder = "Search…",
  facets,
  onFacetChange,
  numbers = {},
  onNumberRangeChange,
  dates = {},
  onDateRangeChange,
  onClearAll,
  isFiltering = false,
  getOptions,
  loadOptions,
  resource,
  filterState,
  onApplySavedView,
  className,
}: CollectionFilterControlsProps) {
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelFilterQuery, setPanelFilterQuery] = useState("");
  const [loadedFields, setLoadedFields] = useState<Set<string>>(new Set());

  const pinnedDefinitions = useMemo(
    () =>
      definitions.filter(
        (definition) =>
          definition.pinned &&
          (definition.type === "enum" || definition.type === "boolean"),
      ),
    [definitions],
  );

  const panelDefinitions = useMemo(
    () => definitions.filter((definition) => !definition.pinned),
    [definitions],
  );

  const filteredPanelDefinitions = useMemo(() => {
    const q = panelFilterQuery.trim().toLowerCase();
    if (!q) return panelDefinitions;
    return panelDefinitions.filter((definition) =>
      definition.label.toLowerCase().includes(q),
    );
  }, [panelFilterQuery, panelDefinitions]);

  const activeFilterCount = useMemo(() => {
    let count = Object.values(facets).reduce(
      (sum, values) => sum + values.length,
      0,
    );
    count += Object.values(numbers).filter(isNumberRangeActive).length;
    count += Object.values(dates).filter(isDateRangeActive).length;
    return count;
  }, [facets, numbers, dates]);

  const activeChips = useMemo(() => {
    type ActiveChip =
      | { id: string; kind: "facet"; value: string; label: string }
      | { id: string; kind: "number"; label: string }
      | { id: string; kind: "date"; label: string };

    const chips: ActiveChip[] = [];

    for (const definition of definitions) {
      if (definition.type === "number") {
        const range = numbers[definition.id];
        if (!isNumberRangeActive(range)) continue;
        chips.push({
          id: definition.id,
          kind: "number",
          label: formatNumberRangeLabel(definition.label, range!),
        });
        continue;
      }

      if (definition.type === "date") {
        const range = dates[definition.id];
        if (!isDateRangeActive(range)) continue;
        chips.push({
          id: definition.id,
          kind: "date",
          label: formatDateRangeLabel(definition.label, range!),
        });
        continue;
      }

      for (const value of facets[definition.id] ?? []) {
        const options = getOptions(definition);
        const option = options.find((item) => item.value === value);
        chips.push({
          id: definition.id,
          kind: "facet",
          value,
          label: `${definition.label}: ${option?.label ?? value}`,
        });
      }
    }

    return chips;
  }, [definitions, facets, numbers, dates, getOptions]);

  const ensureOptions = (fieldId: string) => {
    if (loadedFields.has(fieldId)) return;
    void loadOptions(fieldId).finally(() => {
      setLoadedFields((current) => new Set(current).add(fieldId));
    });
  };

  useEffect(() => {
    if (!panelOpen) setPanelFilterQuery("");
  }, [panelOpen]);

  const showSavedViews = resource && filterState && onApplySavedView;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
        <div className="relative min-w-0 flex-1 lg:max-w-sm">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="h-9 pl-9"
            aria-label={searchPlaceholder}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {showSavedViews ? (
            <CollectionSavedViewsMenu
              resource={resource}
              filterState={filterState}
              onApplyView={onApplySavedView}
            />
          ) : null}

          {pinnedDefinitions.map((definition) => (
            <FacetFilterButton
              key={definition.id}
              label={definition.label}
              options={getOptions(definition)}
              selected={facets[definition.id] ?? []}
              onChange={(values) => onFacetChange(definition.id, values)}
              onOpen={() => ensureOptions(definition.id)}
            />
          ))}

          {panelDefinitions.length > 0 && (
            <Popover open={panelOpen} onOpenChange={setPanelOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "h-9 border-dashed",
                    activeFilterCount > 0 && "border-primary/40 bg-primary/5",
                  )}
                  aria-label="All filters"
                >
                  <SlidersHorizontal className="mr-2 h-4 w-4" />
                  All filters
                  {activeFilterCount > 0 && (
                    <Badge
                      variant="secondary"
                      className="ml-2 rounded-sm px-1.5 font-normal"
                    >
                      {activeFilterCount}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-[min(24rem,calc(100vw-2rem))] p-0"
                align="start"
              >
                <Command shouldFilter={false}>
                  <CommandInput
                    placeholder="Search filters…"
                    value={panelFilterQuery}
                    onValueChange={setPanelFilterQuery}
                  />
                  <CommandList className="max-h-0 overflow-hidden p-0">
                    <CommandEmpty />
                  </CommandList>
                </Command>
                <ScrollArea className="max-h-80">
                  {filteredPanelDefinitions.length === 0 ? (
                    <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                      No filters match your search.
                    </p>
                  ) : (
                    filteredPanelDefinitions.map((definition) => (
                      <FilterPanelRow
                        key={definition.id}
                        definition={definition}
                        options={getOptions(definition)}
                        selected={facets[definition.id] ?? []}
                        numberRange={numbers[definition.id] ?? {}}
                        dateRange={dates[definition.id] ?? {}}
                        onFacetChange={(values) =>
                          onFacetChange(definition.id, values)
                        }
                        onNumberRangeChange={(range) =>
                          onNumberRangeChange?.(definition.id, range)
                        }
                        onDateRangeChange={(range) =>
                          onDateRangeChange?.(definition.id, range)
                        }
                        onEnsureOptions={() => ensureOptions(definition.id)}
                      />
                    ))
                  )}
                </ScrollArea>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>

      {isFiltering && (activeChips.length > 0 || search.trim()) && (
        <div className="flex flex-wrap items-center gap-2">
          {search.trim() ? (
            <Badge variant="secondary" className="gap-1 pr-1">
              <span className="max-w-[12rem] truncate">
                Search: {search.trim()}
              </span>
              <button
                type="button"
                className="rounded-sm p-0.5 hover:bg-muted"
                onClick={() => onSearchChange("")}
                aria-label="Clear search"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ) : null}
          {activeChips.map((chip) => (
            <Badge
              key={chip.kind === "facet" ? `${chip.id}-${chip.value}` : chip.id}
              variant="secondary"
              className="gap-1 pr-1"
            >
              <span className="max-w-[12rem] truncate">{chip.label}</span>
              <button
                type="button"
                className="rounded-sm p-0.5 hover:bg-muted"
                onClick={() => {
                  if (chip.kind === "facet") {
                    const selected = facets[chip.id] ?? [];
                    onFacetChange(
                      chip.id,
                      selected.filter((value) => value !== chip.value),
                    );
                    return;
                  }
                  if (chip.kind === "number") {
                    onNumberRangeChange?.(chip.id, {});
                    return;
                  }
                  onDateRangeChange?.(chip.id, {});
                }}
                aria-label={`Remove ${chip.label}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-muted-foreground"
            onClick={onClearAll}
          >
            Clear all
          </Button>
        </div>
      )}
    </div>
  );
}

/** @deprecated Use CollectionFilterControls */
export const CollectionFilterBar = CollectionFilterControls;
