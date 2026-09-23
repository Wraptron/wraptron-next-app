"use client";

import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export const MIN_FIELD_WIDTH = 140;
export const MIN_FIELD_HEIGHT = 40;

type ResizeHandle = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

const HANDLE_CURSOR: Record<ResizeHandle, string> = {
  n: "ns-resize",
  s: "ns-resize",
  e: "ew-resize",
  w: "ew-resize",
  ne: "nesw-resize",
  nw: "nwse-resize",
  se: "nwse-resize",
  sw: "nesw-resize",
};

const HANDLE_POSITION: Record<ResizeHandle, string> = {
  n: "left-1/2 top-0 -translate-x-1/2 -translate-y-1/2",
  s: "left-1/2 bottom-0 -translate-x-1/2 translate-y-1/2",
  e: "right-0 top-1/2 translate-x-1/2 -translate-y-1/2",
  w: "left-0 top-1/2 -translate-x-1/2 -translate-y-1/2",
  ne: "right-0 top-0 translate-x-1/2 -translate-y-1/2",
  nw: "left-0 top-0 -translate-x-1/2 -translate-y-1/2",
  se: "right-0 bottom-0 translate-x-1/2 translate-y-1/2",
  sw: "left-0 bottom-0 -translate-x-1/2 translate-y-1/2",
};

const HANDLES: ResizeHandle[] = ["n", "s", "e", "w", "ne", "nw", "se", "sw"];

function clamp(value: number, min: number, max: number) {
  return Math.round(Math.min(max, Math.max(min, value)));
}

export function FieldResizeHandles({
  width,
  height,
  onResize,
}: {
  width?: number;
  height?: number;
  onResize: (size: { width: number; height: number }) => void;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [liveSize, setLiveSize] = useState<{
    width: number;
    height: number;
    cursor: string;
  } | null>(null);

  useEffect(() => {
    if (!liveSize) return;
    const previousCursor = document.body.style.cursor;
    document.body.style.cursor = liveSize.cursor;
    document.body.style.userSelect = "none";
    return () => {
      document.body.style.cursor = previousCursor;
      document.body.style.userSelect = "";
    };
  }, [liveSize]);

  const startResize = (event: React.PointerEvent, handle: ResizeHandle) => {
    event.preventDefault();
    event.stopPropagation();

    const box = boxRef.current?.parentElement;
    if (!box) return;

    const startX = event.clientX;
    const startY = event.clientY;
    const startWidth = width ?? box.offsetWidth;
    const startHeight = height ?? box.offsetHeight;
    const canvasWidth = box.parentElement?.clientWidth ?? startWidth;
    const cap = Math.max(MIN_FIELD_WIDTH, canvasWidth);

    const apply = (clientX: number, clientY: number) => {
      const dx = clientX - startX;
      const dy = clientY - startY;
      let nextWidth = startWidth;
      let nextHeight = startHeight;
      if (handle.includes("e")) nextWidth = startWidth + dx;
      if (handle.includes("w")) nextWidth = startWidth - dx;
      if (handle.includes("s")) nextHeight = startHeight + dy;
      if (handle.includes("n")) nextHeight = startHeight - dy;
      const size = {
        width: clamp(nextWidth, MIN_FIELD_WIDTH, cap),
        height: clamp(nextHeight, MIN_FIELD_HEIGHT, 1200),
        cursor: HANDLE_CURSOR[handle],
      };
      setLiveSize(size);
      onResize({ width: size.width, height: size.height });
    };

    const onMove = (moveEvent: PointerEvent) => {
      apply(moveEvent.clientX, moveEvent.clientY);
    };
    const onUp = () => {
      setLiveSize(null);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
  };

  return (
    <>
      <div ref={boxRef} className="pointer-events-none absolute inset-0" />
      {HANDLES.map((handle) => (
        <button
          key={handle}
          type="button"
          aria-label={`Resize ${handle}`}
          className={cn(
            "absolute z-20 h-2.5 w-2.5 rounded-sm border-2 border-indigo-500 bg-background shadow-sm",
            HANDLE_POSITION[handle],
          )}
          style={{ cursor: HANDLE_CURSOR[handle] }}
          onPointerDown={(event) => startResize(event, handle)}
          onClick={(event) => event.stopPropagation()}
        />
      ))}
      {liveSize ? (
        <div className="absolute -bottom-7 left-1/2 z-20 -translate-x-1/2 rounded bg-foreground px-2 py-0.5 text-[10px] font-medium text-background">
          {liveSize.width} × {liveSize.height}
        </div>
      ) : null}
    </>
  );
}
