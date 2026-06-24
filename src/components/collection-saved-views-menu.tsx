"use client";

import React, { useState } from "react";
import { Bookmark, Loader2, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useCollectionSavedViews } from "@/hooks/use-collection-saved-views";
import type { CollectionFilterResource } from "@/lib/collection-filter-definitions";
import type { CollectionFilterState } from "@/lib/collection-filter-definitions";

export type CollectionSavedViewsMenuProps = {
  resource: CollectionFilterResource;
  filterState: CollectionFilterState;
  onApplyView: (state: CollectionFilterState) => void;
  disabled?: boolean;
};

export function CollectionSavedViewsMenu({
  resource,
  filterState,
  onApplyView,
  disabled = false,
}: CollectionSavedViewsMenuProps) {
  const { views, loading, saveView, deleteView } =
    useCollectionSavedViews(resource);
  const [saveOpen, setSaveOpen] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setSaving(true);
    try {
      await saveView(trimmed, filterState);
      setName("");
      setSaveOpen(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-9 border-dashed"
            disabled={disabled}
            aria-label="Saved views"
          >
            <Bookmark className="mr-2 h-4 w-4" />
            Views
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuLabel>Saved views</DropdownMenuLabel>
          <DropdownMenuItem onSelect={() => setSaveOpen(true)}>
            <Save className="mr-2 h-4 w-4" />
            Save current view…
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {loading ? (
            <div className="flex items-center gap-2 px-2 py-3 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading…
            </div>
          ) : views.length === 0 ? (
            <p className="px-2 py-3 text-sm text-muted-foreground">
              No saved views yet.
            </p>
          ) : (
            views.map((view) => (
              <DropdownMenuItem
                key={view.id}
                className="flex items-center justify-between gap-2"
                onSelect={() => onApplyView(view.filterState)}
              >
                <span className="truncate">{view.name}</span>
                <button
                  type="button"
                  className="rounded-sm p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                  aria-label={`Delete ${view.name}`}
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    void deleteView(view);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save view</DialogTitle>
          </DialogHeader>
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder='e.g. "My open deals"'
            aria-label="View name"
            onKeyDown={(event) => {
              if (event.key === "Enter") void handleSave();
            }}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => void handleSave()}
              disabled={!name.trim() || saving}
            >
              {saving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
