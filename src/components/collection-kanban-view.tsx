"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { CollectionItem } from "@/components/collection-view";

export type CollectionKanbanColumn = {
  id: string;
  label: React.ReactNode;
  /** Optional tint for the column header (use theme + dark: tokens). */
  headerClassName?: string;
  /** Optional classes for the column container. */
  className?: string;
};

export type CollectionKanbanViewProps = {
  items: CollectionItem[];
  columns: CollectionKanbanColumn[];
  groupBy: (item: CollectionItem) => string;
  getColumnSubtext?: (
    columnId: string,
    columnItems: CollectionItem[],
  ) => React.ReactNode;
  renderCard?: (item: CollectionItem) => React.ReactNode;
  getRowHref?: (item: CollectionItem) => string | undefined;
  onItemMove?: (item: CollectionItem, toColumnId: string) => void | Promise<void>;
  loading?: boolean;
  loadingMessage?: React.ReactNode;
  emptyMessage?: React.ReactNode;
  className?: string;
};

function DefaultKanbanCard({ item }: { item: CollectionItem }) {
  return (
    <Card className="cursor-grab gap-0 rounded-lg border border-border bg-card py-0 text-card-foreground shadow-none active:cursor-grabbing">
      <CardContent className="p-3">
        <h4 className="line-clamp-2 text-sm font-semibold text-foreground">
          {item.title}
        </h4>
        {item.description != null && item.description !== "" && (
          <div className="mt-2 truncate text-xs text-muted-foreground">
            {item.description}
          </div>
        )}
        {item.meta != null && item.meta !== "" && (
          <div className="mt-1 truncate text-xs text-muted-foreground">
            {item.meta}
          </div>
        )}
        {item.actions && <div className="mt-2">{item.actions}</div>}
      </CardContent>
    </Card>
  );
}

function SortableKanbanCard({
  item,
  href,
  renderCard,
}: {
  item: CollectionItem;
  href?: string;
  renderCard?: (item: CollectionItem) => React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const card = renderCard ? renderCard(item) : <DefaultKanbanCard item={item} />;

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {href ? (
        <Link href={href} className="block text-inherit no-underline">
          {card}
        </Link>
      ) : (
        card
      )}
    </div>
  );
}

function KanbanColumn({
  id,
  label,
  subtext,
  items,
  getRowHref,
  renderCard,
  draggable,
  headerClassName,
  className,
}: {
  id: string;
  label: React.ReactNode;
  subtext?: React.ReactNode;
  items: CollectionItem[];
  getRowHref?: (item: CollectionItem) => string | undefined;
  renderCard?: (item: CollectionItem) => React.ReactNode;
  draggable: boolean;
  headerClassName?: string;
  className?: string;
}) {
  const { setNodeRef } = useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex h-full w-72 shrink-0 flex-col overflow-y-auto rounded-none border border-border bg-card md:w-80 xl:min-w-[18rem] xl:flex-1 xl:max-w-sm",
        className,
      )}
    >
      <div
        className={cn(
          "shrink-0 border-b border-border px-3 py-2",
          headerClassName,
        )}
      >
        <h3 className="text-sm font-medium text-foreground">{label}</h3>
        {subtext != null && subtext !== "" && (
          <p className="mt-0.5 text-xs text-muted-foreground">{subtext}</p>
        )}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto bg-muted/20 p-2">
        <SortableContext
          id={id}
          items={items.map((item) => item.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="min-h-[80px] space-y-2">
            {items.map((item) => (
              <SortableKanbanCard
                key={item.id}
                item={item}
                href={getRowHref?.(item)}
                renderCard={renderCard}
              />
            ))}
            {items.length === 0 && (
              <div className="border border-dashed border-border py-6 text-center text-sm italic text-muted-foreground">
                {draggable ? "Drop here" : "No items"}
              </div>
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  );
}

export function CollectionKanbanView({
  items,
  columns,
  groupBy,
  getColumnSubtext,
  renderCard,
  getRowHref,
  onItemMove,
  loading = false,
  loadingMessage = "Loading…",
  emptyMessage = "No items found.",
  className,
}: CollectionKanbanViewProps) {
  const [activeDragItem, setActiveDragItem] = useState<CollectionItem | null>(
    null,
  );

  const columnIds = useMemo(() => columns.map((c) => c.id), [columns]);

  const grouped = useMemo(() => {
    const map: Record<string, CollectionItem[]> = {};
    for (const column of columns) {
      map[column.id] = [];
    }
    const otherKey = columns.some((c) => c.id === "other")
      ? "other"
      : columns[columns.length - 1]?.id;

    for (const item of items) {
      const key = groupBy(item);
      if (map[key]) {
        map[key].push(item);
      } else if (otherKey && map[otherKey]) {
        map[otherKey].push(item);
      }
    }
    return map;
  }, [items, columns, groupBy]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor),
  );

  const handleDragStart = (event: DragStartEvent) => {
    const active = items.find((item) => item.id === event.active.id);
    if (active) setActiveDragItem(active);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveDragItem(null);
    if (!onItemMove) return;

    const { active, over } = event;
    if (!over) return;

    const item = items.find((i) => i.id === active.id);
    if (!item) return;

    let toColumnId = String(over.id);
    if (!columnIds.includes(toColumnId)) {
      const overItem = items.find((i) => i.id === over.id);
      if (overItem) {
        toColumnId = groupBy(overItem);
      } else {
        return;
      }
    }

    const fromColumnId = groupBy(item);
    if (fromColumnId === toColumnId) return;

    await onItemMove(item, toColumnId);
  };

  const defaultSubtext = (_columnId: string, columnItems: CollectionItem[]) => {
    const count = columnItems.length;
    return `${count} item${count !== 1 ? "s" : ""}`;
  };

  if (loading) {
    return (
      <div
        className={cn(
          "flex h-full min-h-[320px] items-center justify-center rounded-md border border-border bg-muted/30 text-foreground",
          className,
        )}
      >
        <p className="text-sm text-muted-foreground">{loadingMessage}</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div
        className={cn(
          "flex h-full min-h-[320px] items-center justify-center rounded-md border border-border bg-muted/30 text-foreground",
          className,
        )}
      >
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  const draggable = Boolean(onItemMove);

  return (
    <div
      className={cn(
        "flex h-full min-h-[320px] flex-col overflow-hidden rounded-md border border-border bg-muted/30 text-foreground",
        className,
      )}
    >
      <div className="flex min-h-0 flex-1 overflow-x-auto border-t border-border">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex h-full py-0">
            {columns.map((column) => {
              const columnItems = grouped[column.id] ?? [];
              const subtext = getColumnSubtext
                ? getColumnSubtext(column.id, columnItems)
                : defaultSubtext(column.id, columnItems);

              return (
                <KanbanColumn
                  key={column.id}
                  id={column.id}
                  label={column.label}
                  subtext={subtext}
                  items={columnItems}
                  getRowHref={getRowHref}
                  renderCard={renderCard}
                  draggable={draggable}
                  headerClassName={column.headerClassName}
                  className={column.className}
                />
              );
            })}
          </div>
          <DragOverlay>
            {activeDragItem ? (
              renderCard ? (
                renderCard(activeDragItem)
              ) : (
                <DefaultKanbanCard item={activeDragItem} />
              )
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}
