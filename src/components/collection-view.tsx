"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

export type CollectionItem = {
  id: string | number;
  title: React.ReactNode;
  description?: React.ReactNode;
  meta?: React.ReactNode;
  actions?: React.ReactNode;
};

export type SortDirection = "asc" | "desc";

export type CollectionColumn = {
  id: string;
  header: React.ReactNode;
  cell: (item: CollectionItem) => React.ReactNode;
  className?: string;
  headerClassName?: string;
  /** Raw value used when sorting this column. Falls back to primitive cell output. */
  sortValue?: (
    item: CollectionItem,
  ) => string | number | Date | null | undefined;
  /** Raw value used when filtering this column. Falls back to sort/cell output. */
  filterValue?: (
    item: CollectionItem,
  ) => string | number | Date | null | undefined;
  /** Defaults to true except for action columns. */
  sortable?: boolean;
};

const NON_SORTABLE_COLUMN_IDS = new Set(["actions", "quick_actions"]);

function isColumnSortable(column: CollectionColumn): boolean {
  if (column.sortable === false) return false;
  if (NON_SORTABLE_COLUMN_IDS.has(column.id)) return false;
  return true;
}

function normalizeSortValue(
  value: string | number | Date | null | undefined,
): string | number {
  if (value == null || value === "") return "";
  if (value instanceof Date) return value.getTime();
  if (typeof value === "number") return value;
  return value === "—" ? "" : value;
}

function getColumnSortValue(
  column: CollectionColumn,
  item: CollectionItem,
): string | number {
  if (column.sortValue) {
    return normalizeSortValue(column.sortValue(item));
  }

  if (column.id === "title" && typeof item.title === "string") {
    return item.title;
  }
  if (column.id === "description" && typeof item.description === "string") {
    return item.description;
  }
  if (column.id === "meta" && typeof item.meta === "string") {
    return item.meta;
  }

  const cellValue = column.cell(item);
  if (typeof cellValue === "string" || typeof cellValue === "number") {
    return normalizeSortValue(cellValue);
  }

  return "";
}

function compareSortValues(
  a: string | number,
  b: string | number,
  direction: SortDirection,
): number {
  if (a === b) return 0;

  const aEmpty = a === "";
  const bEmpty = b === "";
  if (aEmpty && bEmpty) return 0;
  if (aEmpty) return 1;
  if (bEmpty) return -1;

  let cmp = 0;
  if (typeof a === "number" && typeof b === "number") {
    cmp = a - b;
  } else {
    cmp = String(a).localeCompare(String(b), undefined, {
      numeric: true,
      sensitivity: "base",
    });
  }

  return direction === "asc" ? cmp : -cmp;
}

export type CollectionColumnLabels = {
  title?: React.ReactNode;
  description?: React.ReactNode;
  meta?: React.ReactNode;
  actions?: React.ReactNode;
};

interface CollectionViewProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  items: CollectionItem[];
  columns?: CollectionColumn[];
  columnLabels?: CollectionColumnLabels;
  emptyTitle?: React.ReactNode;
  emptyDescription?: React.ReactNode;
  emptyMessage?: React.ReactNode;
  /** Shown when items exist but filters exclude every row. */
  filteredEmptyTitle?: React.ReactNode;
  filteredEmptyDescription?: React.ReactNode;
  filteredEmptyMessage?: React.ReactNode;
  /** Pass true when parent filters are active (for empty-state copy). */
  hasActiveFilters?: boolean;
  loading?: boolean;
  loadingMessage?: React.ReactNode;
  className?: string;
  onRowClick?: (item: CollectionItem) => void;
  /** Matches deals list: checkbox column + row highlight */
  selectable?: boolean;
  selectedIds?: (string | number)[];
  onSelectedIdsChange?: (ids: (string | number)[]) => void;
  /** Column id rendered as primary cell (font-medium + optional link) */
  primaryColumnId?: string;
  getRowHref?: (item: CollectionItem) => string | undefined;
}

function buildDefaultColumns(
  items: CollectionItem[],
  labels?: CollectionColumnLabels,
): CollectionColumn[] {
  const hasDescription = items.some((item) => item.description != null);
  const hasMeta = items.some((item) => item.meta != null);
  const hasActions = items.some((item) => item.actions != null);

  const columns: CollectionColumn[] = [
    {
      id: "title",
      header: labels?.title ?? "Name",
      headerClassName: "w-[300px]",
      cell: (item) => item.title,
    },
  ];

  if (hasDescription) {
    columns.push({
      id: "description",
      header: labels?.description ?? "Details",
      cell: (item) => item.description,
    });
  }

  if (hasMeta) {
    columns.push({
      id: "meta",
      header: labels?.meta ?? "Info",
      cell: (item) => item.meta,
    });
  }

  if (hasActions) {
    columns.push({
      id: "actions",
      header: labels?.actions ?? "",
      className: "text-right",
      headerClassName: "text-right",
      cell: (item) => item.actions,
    });
  }

  return columns;
}

function EmptyCell() {
  return <span className="text-muted-foreground">—</span>;
}

function renderCellValue(value: React.ReactNode) {
  if (value == null || value === "") {
    return <EmptyCell />;
  }
  return value;
}

export function CollectionView({
  title,
  description,
  items,
  columns: columnsProp,
  columnLabels,
  emptyTitle = "No items yet",
  emptyDescription = "Create a new item to get started.",
  emptyMessage,
  filteredEmptyTitle = "No matches",
  filteredEmptyDescription = "Try adjusting your search or filters.",
  filteredEmptyMessage,
  hasActiveFilters = false,
  loading = false,
  loadingMessage = "Loading…",
  className,
  onRowClick,
  selectable = false,
  selectedIds = [],
  onSelectedIdsChange,
  primaryColumnId,
  getRowHref,
}: CollectionViewProps) {
  const columns = columnsProp ?? buildDefaultColumns(items, columnLabels);
  const resolvedPrimaryColumnId = primaryColumnId ?? columns[0]?.id;
  const selectionEnabled = selectable || !!onSelectedIdsChange;
  const colSpan = columns.length + (selectionEnabled ? 1 : 0);
  const [sortConfig, setSortConfig] = useState<{
    columnId: string;
    direction: SortDirection;
  } | null>(null);

  const sortedItems = useMemo(() => {
    if (!sortConfig) return items;

    const column = columns.find((col) => col.id === sortConfig.columnId);
    if (!column || !isColumnSortable(column)) return items;

    return [...items].sort((a, b) =>
      compareSortValues(
        getColumnSortValue(column, a),
        getColumnSortValue(column, b),
        sortConfig.direction,
      ),
    );
  }, [columns, items, sortConfig]);

  const handleSort = (column: CollectionColumn) => {
    if (!isColumnSortable(column)) return;

    setSortConfig((current) => {
      if (current?.columnId === column.id) {
        return {
          columnId: column.id,
          direction: current.direction === "asc" ? "desc" : "asc",
        };
      }
      return { columnId: column.id, direction: "asc" };
    });
  };

  const isItemSelected = (id: string | number) =>
    selectedIds.some((selectedId) => String(selectedId) === String(id));

  const visibleItemsSelectedCount = items.filter((item) =>
    isItemSelected(item.id),
  ).length;
  const allSelected =
    items.length > 0 && visibleItemsSelectedCount === items.length;
  const someSelected =
    visibleItemsSelectedCount > 0 && visibleItemsSelectedCount < items.length;
  const headerChecked: boolean | "indeterminate" = allSelected
    ? true
    : someSelected
      ? "indeterminate"
      : false;

  const toggleItemSelection = (id: string | number) => {
    if (!onSelectedIdsChange) return;
    if (isItemSelected(id)) {
      onSelectedIdsChange(
        selectedIds.filter((selectedId) => String(selectedId) !== String(id)),
      );
    } else {
      onSelectedIdsChange([...selectedIds, id]);
    }
  };

  const toggleAllItems = () => {
    if (!onSelectedIdsChange) return;
    if (allSelected) {
      const visibleIdsSet = new Set(items.map((item) => String(item.id)));
      onSelectedIdsChange(
        selectedIds.filter(
          (selectedId) => !visibleIdsSet.has(String(selectedId)),
        ),
      );
    } else {
      const selectedSet = new Set(
        selectedIds.map((selectedId) => String(selectedId)),
      );
      const newSelected = [...selectedIds];
      for (const item of items) {
        if (!selectedSet.has(String(item.id))) {
          newSelected.push(item.id);
        }
      }
      onSelectedIdsChange(newSelected);
    }
  };

  const renderDataCell = (item: CollectionItem, column: CollectionColumn) => {
    const value = column.cell(item);
    const isPrimary = column.id === resolvedPrimaryColumnId;
    const href = isPrimary ? getRowHref?.(item) : undefined;

    if (isPrimary && href) {
      return (
        <Link
          href={href}
          className="font-medium text-foreground hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {renderCellValue(value)}
        </Link>
      );
    }

    if (isPrimary) {
      return <span className="font-medium">{renderCellValue(value)}</span>;
    }

    return renderCellValue(value);
  };

  return (
    <div
      className={cn(
        "rounded-md border border-border bg-card text-card-foreground",
        className,
      )}
    >
      {(title || description) && (
        <div className="border-b border-border px-4 py-3">
          {title && (
            <p className="text-sm font-semibold leading-none">{title}</p>
          )}
          {description && (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      )}

      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow className="hover:bg-transparent">
            {selectionEnabled && (
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={headerChecked}
                  onCheckedChange={toggleAllItems}
                  onClick={(e) => e.stopPropagation()}
                  disabled={loading || items.length === 0}
                  aria-label="Select all rows"
                />
              </TableHead>
            )}
            {columns.map((column) => {
              const sortable = isColumnSortable(column);
              const isActive = sortConfig?.columnId === column.id;
              const isRightAligned =
                column.headerClassName?.includes("text-right");

              return (
                <TableHead
                  key={column.id}
                  className={cn(
                    column.headerClassName,
                    sortable &&
                      "group cursor-pointer select-none transition-colors hover:bg-muted/50",
                  )}
                  onClick={sortable ? () => handleSort(column) : undefined}
                  aria-sort={
                    sortable && isActive
                      ? sortConfig.direction === "asc"
                        ? "ascending"
                        : "descending"
                      : undefined
                  }
                >
                  <div
                    className={cn(
                      "flex items-center gap-1",
                      isRightAligned && "justify-end",
                    )}
                  >
                    {column.header}
                    {sortable &&
                      (isActive ? (
                        sortConfig.direction === "asc" ? (
                          <ArrowUp className="h-3 w-3 shrink-0" />
                        ) : (
                          <ArrowDown className="h-3 w-3 shrink-0" />
                        )
                      ) : (
                        <ArrowUpDown className="h-3 w-3 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-50" />
                      ))}
                  </div>
                </TableHead>
              );
            })}
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell
                colSpan={colSpan}
                className="h-24 text-center text-muted-foreground"
              >
                {loadingMessage}
              </TableCell>
            </TableRow>
          ) : items.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={colSpan}
                className="h-24 text-center text-muted-foreground"
              >
                {hasActiveFilters
                  ? (filteredEmptyMessage ?? (
                      <div>
                        <p className="font-medium text-foreground">
                          {filteredEmptyTitle}
                        </p>
                        {filteredEmptyDescription && (
                          <p className="mt-1 text-sm text-muted-foreground">
                            {filteredEmptyDescription}
                          </p>
                        )}
                      </div>
                    ))
                  : (emptyMessage ?? (
                      <div>
                        <p className="font-medium text-foreground">
                          {emptyTitle}
                        </p>
                        {emptyDescription && (
                          <p className="mt-1 text-sm text-muted-foreground">
                            {emptyDescription}
                          </p>
                        )}
                      </div>
                    ))}
              </TableCell>
            </TableRow>
          ) : (
            sortedItems.map((item) => {
              const isSelected = isItemSelected(item.id);
              return (
                <TableRow
                  key={item.id}
                  className={cn(
                    (onRowClick || getRowHref) &&
                      "cursor-pointer hover:bg-muted/50",
                    isSelected && "bg-accent",
                  )}
                  onClick={onRowClick ? () => onRowClick(item) : undefined}
                >
                  {selectionEnabled && (
                    <TableCell
                      className="w-[50px]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleItemSelection(item.id)}
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`Select row ${item.id}`}
                      />
                    </TableCell>
                  )}
                  {columns.map((column) => (
                    <TableCell key={column.id} className={column.className}>
                      {renderDataCell(item, column)}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
