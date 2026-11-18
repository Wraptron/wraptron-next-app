"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MarkdownPreview } from "./markdown-preview";
import { SaveStatus } from "./save-status";
import type { RequirementsSaveStatus } from "@/lib/requirements-autosave";

type PreviewFullscreenProps = {
  open: boolean;
  markdown: string;
  onClose: () => void;
  saveStatus?: RequirementsSaveStatus;
  saveError?: string | null;
  onRetry?: () => void;
  showSaveStatus?: boolean;
  returnFocusRef?: React.RefObject<HTMLButtonElement | null>;
};

export function PreviewFullscreen({
  open,
  markdown,
  onClose,
  saveStatus = "saved",
  saveError,
  onRetry,
  showSaveStatus = true,
  returnFocusRef,
}: PreviewFullscreenProps) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
      returnFocusRef?.current?.focus();
    };
  }, [open, onClose, returnFocusRef]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex flex-col bg-background"
      role="dialog"
      aria-modal="true"
      aria-labelledby="requirements-fullscreen-title"
    >
      <div className="flex items-center justify-between gap-3 border-b px-4 py-3 shrink-0">
        <div className="flex flex-wrap items-center gap-3 min-w-0">
          <h2
            id="requirements-fullscreen-title"
            className="text-base font-semibold"
          >
            Preview
          </h2>
          {showSaveStatus && (
            <SaveStatus
              status={saveStatus}
              errorMessage={saveError}
              onRetry={onRetry}
            />
          )}
        </div>
        <Button
          ref={closeRef}
          type="button"
          variant="outline"
          size="icon"
          aria-label="Exit full screen"
          onClick={onClose}
        >
          <Minimize2 className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[900px] px-4 py-6">
          <MarkdownPreview
            markdown={markdown}
            labelledBy="requirements-fullscreen-title"
          />
        </div>
      </div>
    </div>,
    document.body,
  );
}
