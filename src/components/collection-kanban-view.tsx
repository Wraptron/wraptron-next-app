"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
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

type BoardState = Record<string, CollectionItem[]>;

function buildBoard(
  items: CollectionItem[],
  columns: CollectionKanbanColumn[],
  groupBy: (item: CollectionItem) => string,
): BoardState {
  const map: BoardState = {};
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
}

function findColumn(
  id: UniqueIdentifier,
  board: BoardState,
  columnIds: string[],
): string | undefined {
  const sid = String(id);
  if (columnIds.includes(sid)) return sid;
  for (const [columnId, columnItems] of Object.entries(board)) {
    if (columnItems.some((item) => String(item.id) === sid)) {
      return columnId;
    }
  }
  return undefined;
}

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
  disabled,
}: {
  item: CollectionItem;
  href?: string;
  renderCard?: (item: CollectionItem) => React.ReactNode;
  disabled?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const card = renderCard ? renderCard(item) : <DefaultKanbanCard item={item} />;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={disabled ? undefined : "touch-none"}
      {...attributes}
      {...(disabled ? {} : listeners)}
    >
      {href ? (
        <Link
          href={href}
          className="block text-inherit no-underline"
          draggable={false}
          onClick={(e) => {
            if (isDragging) e.preventDefault();
          }}
        >
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
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex h-full w-72 shrink-0 flex-col overflow-y-auto rounded-none border border-border bg-card md:w-80 xl:min-w-[18rem] xl:flex-1 xl:max-w-sm",
        isOver && draggable && "border-primary/50 bg-primary/5",
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
                disabled={!draggable}
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

function KanbanBoardBody({
  board,
  columns,
  getColumnSubtext,
  getRowHref,
  renderCard,
  draggable,
}: {
  board: BoardState;
  columns: CollectionKanbanColumn[];
  getColumnSubtext?: (
    columnId: string,
    columnItems: CollectionItem[],
  ) => React.ReactNode;
  getRowHref?: (item: CollectionItem) => string | undefined;
  renderCard?: (item: CollectionItem) => React.ReactNode;
  draggable: boolean;
}) {
  const defaultSubtext = (_columnId: string, columnItems: CollectionItem[]) => {
    const count = columnItems.length;
    return `${count} item${count !== 1 ? "s" : ""}`;
  };

  return (
    <div className="flex h-full py-0">
      {columns.map((column) => {
        const columnItems = board[column.id] ?? [];
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
  const draggable = Boolean(onItemMove);
  const columnIds = useMemo(() => columns.map((c) => c.id), [columns]);
  const [board, setBoard] = useState<BoardState>(() =>
    buildBoard(items, columns, groupBy),
  );
  const [activeDragItem, setActiveDragItem] = useState<CollectionItem | null>(
    null,
  );
  const originColumnRef = useRef<string | null>(null);
  const boardRef = useRef(board);
  boardRef.current = board;

  useEffect(() => {
    if (activeDragItem != null) return;
    setBoard(buildBoard(items, columns, groupBy));
  }, [items, columns, groupBy, activeDragItem]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 8 },
    }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    const active = items.find(
      (item) => String(item.id) === String(event.active.id),
    );
    if (!active) return;
    setActiveDragItem(active);
    originColumnRef.current =
      findColumn(event.active.id, boardRef.current, columnIds) ??
      groupBy(active);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over || !draggable) return;

    setBoard((prev) => {
      const activeCol = findColumn(active.id, prev, columnIds);
      const overCol = findColumn(over.id, prev, columnIds);
      if (!activeCol || !overCol || activeCol === overCol) return prev;

      const activeItems = [...(prev[activeCol] ?? [])];
      const overItems = [...(prev[overCol] ?? [])];
      const activeIndex = activeItems.findIndex(
        (item) => String(item.id) === String(active.id),
      );
      if (activeIndex < 0) return prev;

      const [moved] = activeItems.splice(activeIndex, 1);
      const overIsColumn = columnIds.includes(String(over.id));
      let newIndex = overIsColumn
        ? overItems.length
        : overItems.findIndex((item) => String(item.id) === String(over.id));
      if (newIndex < 0) newIndex = overItems.length;
      overItems.splice(newIndex, 0, moved);

      return {
        ...prev,
        [activeCol]: activeItems,
        [overCol]: overItems,
      };
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    const fromColumn = originColumnRef.current;
    originColumnRef.current = null;

    if (!draggable || !onItemMove || !over || !fromColumn) {
      setActiveDragItem(null);
      return;
    }

    const currentBoard = boardRef.current;
    let toColumn = findColumn(active.id, currentBoard, columnIds);

    if (toColumn === fromColumn && !columnIds.includes(String(over.id))) {
      const activeIndex = (currentBoard[fromColumn] ?? []).findIndex(
        (item) => String(item.id) === String(active.id),
      );
      const overIndex = (currentBoard[fromColumn] ?? []).findIndex(
        (item) => String(item.id) === String(over.id),
      );
      if (activeIndex >= 0 && overIndex >= 0 && activeIndex !== overIndex) {
        setBoard((prev) => ({
          ...prev,
          [fromColumn]: arrayMove(
            prev[fromColumn] ?? [],
            activeIndex,
            overIndex,
          ),
        }));
      }
      setActiveDragItem(null);
      return;
    }

    if (!toColumn) {
      toColumn = findColumn(over.id, currentBoard, columnIds);
    }

    if (toColumn && toColumn !== fromColumn) {
      const item =
        items.find((i) => String(i.id) === String(active.id)) ??
        currentBoard[toColumn]?.find(
          (i) => String(i.id) === String(active.id),
        );
      if (item) {
        // Do not await — parent should update items optimistically so the
        // board does not snap back while the API request is in flight.
        void Promise.resolve(onItemMove(item, toColumn));
      }
    }

    setActiveDragItem(null);
  };

  const handleDragCancel = () => {
    originColumnRef.current = null;
    setActiveDragItem(null);
    setBoard(buildBoard(items, columns, groupBy));
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

  return (
    <div
      className={cn(
        "flex h-full min-h-[320px] flex-col overflow-hidden rounded-md border border-border bg-muted/30 text-foreground",
        className,
      )}
    >
      <div className="flex min-h-0 flex-1 overflow-x-auto border-t border-border">
        {draggable ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            <KanbanBoardBody
              board={board}
              columns={columns}
              getColumnSubtext={getColumnSubtext}
              getRowHref={getRowHref}
              renderCard={renderCard}
              draggable
            />
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
        ) : (
          <KanbanBoardBody
            board={board}
            columns={columns}
            getColumnSubtext={getColumnSubtext}
            getRowHref={getRowHref}
            renderCard={renderCard}
            draggable={false}
          />
        )}
      </div>
    </div>
  );
}
