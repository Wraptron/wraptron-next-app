"use client";

import React, { useEffect, useRef } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TableCell, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export const inlineTaskFieldClassName =
  "h-7 px-2 py-0.5 text-xs border-border/40 bg-transparent shadow-none hover:border-border/70 hover:bg-muted/40 focus-visible:border-border focus-visible:bg-background";

export function TaskListAddRowTrigger({
  onClick,
  label = "Add task",
  className,
}: {
  onClick: () => void;
  label?: string;
  className?: string;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={cn("h-7 gap-1.5 text-muted-foreground hover:text-foreground", className)}
      onClick={onClick}
    >
      <Plus className="h-4 w-4" />
      {label}
    </Button>
  );
}

export function TaskListInlineTitleInput({
  value,
  onChange,
  onSubmit,
  onCancel,
  disabled = false,
  placeholder = "Task title…",
  autoFocus = false,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onCancel?: () => void;
  disabled?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
}) {
  return (
    <Input
      value={value}
      placeholder={placeholder}
      disabled={disabled}
      autoFocus={autoFocus}
      onChange={(event) => onChange(event.target.value)}
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          onSubmit();
        }
        if (event.key === "Escape") {
          event.preventDefault();
          onCancel?.();
        }
      }}
      className={inlineTaskFieldClassName}
      aria-label="New task title"
    />
  );
}

export function TaskListPlusRow({
  colSpan,
  onClick,
  position = "top",
}: {
  colSpan: number;
  onClick: () => void;
  position?: "top" | "bottom";
}) {
  return (
    <TableRow
      className={cn(
        "border-dashed hover:bg-muted/20",
        position === "top" ? "border-b" : "border-t",
      )}
    >
      <TableCell colSpan={colSpan} className="py-1.5">
        <TaskListAddRowTrigger onClick={onClick} />
      </TableCell>
    </TableRow>
  );
}

export const inlineAddRowClassName =
  "border-b border-dashed bg-muted/10 hover:bg-muted/10";

function isInlineAddOutsideTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Node)) return true;
  const element = target instanceof Element ? target : target.parentElement;
  if (!element) return true;
  return !element.closest(
    '[data-slot="select-content"], [data-radix-popper-content-wrapper], [role="listbox"]',
  );
}

export function useInlineAddClickOutside({
  active,
  hasData,
  onDismiss,
  onCommit,
}: {
  active: boolean;
  hasData: () => boolean;
  onDismiss: () => void;
  onCommit: () => void;
}) {
  const rowRef = useRef<HTMLTableRowElement>(null);

  useEffect(() => {
    if (!active) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (rowRef.current?.contains(target as Node)) return;
      if (!isInlineAddOutsideTarget(target)) return;

      if (hasData()) {
        onCommit();
      } else {
        onDismiss();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [active, hasData, onCommit, onDismiss]);

  return rowRef;
}

export function TaskListInlineAddRow({
  active,
  hasData,
  onDismiss,
  onCommit,
  className,
  children,
}: {
  active: boolean;
  hasData: () => boolean;
  onDismiss: () => void;
  onCommit: () => void;
  className?: string;
  children: React.ReactNode;
}) {
  const rowRef = useInlineAddClickOutside({
    active,
    hasData,
    onDismiss,
    onCommit,
  });

  return (
    <TableRow ref={rowRef} className={className}>
      {children}
    </TableRow>
  );
}

export function hasInlineTaskDraft(title: string): boolean {
  return title.trim().length > 0;
}

export const TASK_PRIORITY_OPTIONS = [
  "low",
  "medium",
  "high",
  "urgent",
] as const;

export const listInlineSelectClassName =
  "h-7 max-w-full rounded-md border border-border/40 bg-background px-2 py-0.5 text-xs text-foreground capitalize shadow-none hover:border-border/70 focus-visible:border-border focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 [color-scheme:light]";
