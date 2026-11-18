"use client";

import { Loader2, AlertCircle, Check, CloudOff } from "lucide-react";
import type { RequirementsSaveStatus } from "@/lib/requirements-autosave";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SaveStatusProps = {
  status: RequirementsSaveStatus;
  errorMessage?: string | null;
  onRetry?: () => void;
  className?: string;
};

const LABELS: Record<RequirementsSaveStatus, string> = {
  saved: "Saved",
  saving: "Saving…",
  unsaved: "Unsaved changes",
  error: "Error",
  conflict: "Conflict",
};

export function SaveStatus({
  status,
  errorMessage,
  onRetry,
  className,
}: SaveStatusProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 text-sm text-muted-foreground",
        className,
      )}
      aria-live="polite"
      aria-atomic="true"
    >
      {status === "saving" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
      {status === "saved" && <Check className="h-3.5 w-3.5 text-emerald-600" />}
      {status === "unsaved" && <CloudOff className="h-3.5 w-3.5" />}
      {(status === "error" || status === "conflict") && (
        <AlertCircle className="h-3.5 w-3.5 text-red-600" />
      )}
      <span
        className={cn(
          (status === "error" || status === "conflict") && "text-red-600",
        )}
      >
        {status === "error" && errorMessage
          ? `Error: ${errorMessage}`
          : LABELS[status]}
      </span>
      {(status === "error" || status === "conflict") && onRetry && (
        <Button type="button" variant="ghost" size="sm" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
}
