"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { RequirementDocSnapshot } from "@/lib/requirements-autosave";

type ConflictDialogProps = {
  open: boolean;
  current: RequirementDocSnapshot | null;
  onLoadTheirs: () => void;
  onKeepMine: () => void;
  onCancel: () => void;
};

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export function ConflictDialog({
  open,
  current,
  onLoadTheirs,
  onKeepMine,
  onCancel,
}: ConflictDialogProps) {
  const name = current?.updated_by?.name?.trim() || "Someone";
  const time = current?.updated_at ? formatTime(current.updated_at) : "recently";

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Requirements conflict</DialogTitle>
          <DialogDescription>
            {name} edited this at {time}. Your local draft was not saved.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="button" variant="secondary" onClick={onKeepMine}>
            Keep mine
          </Button>
          <Button type="button" onClick={onLoadTheirs}>
            Load their version
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
