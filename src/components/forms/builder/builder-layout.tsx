"use client";

import React, { useState } from "react";
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  DragStartEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import { useFormBuilder } from "@/components/forms/builder/form-builder-context";
import { FieldLibrary } from "@/components/forms/builder/field-library";
import { FormCanvas } from "@/components/forms/builder/form-canvas";
import { PropertiesPanel } from "@/components/forms/builder/properties-panel";
import { FieldType } from "@/types/form-builder";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Undo2,
  Redo2,
  Smartphone,
  Tablet,
  Monitor,
  Save,
  Eye,
  Pencil,
  Copy,
  Check,
  Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getApiErrorMessage } from "@/lib/api";

function BuilderToolbar() {
  const {
    undo,
    redo,
    canUndo,
    canRedo,
    deviceMode,
    setDeviceMode,
    formTitle,
    setFormTitle,
    previewMode,
    setPreviewMode,
    saveDraft,
    lastSavedAt,
    fields,
    publishForm,
    isReady,
  } = useFormBuilder();
  const [publishOpen, setPublishOpen] = useState(false);
  const [publishLink, setPublishLink] = useState<string | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );
  const [saveError, setSaveError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);

  const handleSave = async () => {
    setSaveState("saving");
    setSaveError(null);
    const ok = await saveDraft();
    if (ok) {
      setSaveState("saved");
      window.setTimeout(() => setSaveState("idle"), 2000);
      return;
    }
    setSaveState("error");
    setSaveError("Could not save the form. Check that you are signed in and try again.");
  };
  const canPublish = fields.some(
    (field) =>
      field.type !== "spacer" &&
      field.type !== "divider" &&
      field.type !== "section",
  );

  const handlePublish = async () => {
    setCopied(false);
    setPublishing(true);
    try {
      const url = await publishForm();
      if (!url) {
        setPublishError("Add at least one field before publishing.");
        setPublishLink(null);
        setPublishOpen(true);
        return;
      }
      setPublishError(null);
      setPublishLink(url);
      setPublishOpen(true);
    } catch (error) {
      setPublishError(
        getApiErrorMessage(error, "Could not publish the form. Try again."),
      );
      setPublishLink(null);
      setPublishOpen(true);
    } finally {
      setPublishing(false);
    }
  };

  const copyLink = async () => {
    if (!publishLink) return;
    try {
      await navigator.clipboard.writeText(publishLink);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="sticky top-0 z-20 flex min-h-14 shrink-0 flex-wrap items-center justify-between gap-2 border-b bg-background px-4 py-2">
      <div className="flex min-w-0 items-center gap-3">
        <Input
          value={formTitle}
          onChange={(e) => setFormTitle(e.target.value)}
          className="h-8 max-w-60 font-semibold"
          aria-label="Form name"
        />
        {saveState === "saved" || lastSavedAt ? (
          <span className="text-xs text-muted-foreground">
            {saveState === "saved" ? "Saved" : "Draft saved"}
          </span>
        ) : null}
        {saveError ? (
          <span className="text-xs text-destructive">{saveError}</span>
        ) : null}
      </div>

      <div className="flex items-center gap-2 bg-muted p-1 rounded-lg">
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-8 w-8 text-muted-foreground",
            deviceMode === "desktop" &&
              "bg-background shadow-sm text-indigo-600",
          )}
          onClick={() => setDeviceMode("desktop")}
          aria-label="Desktop preview"
        >
          <Monitor className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-8 w-8 text-muted-foreground",
            deviceMode === "tablet" &&
              "bg-background shadow-sm text-indigo-600",
          )}
          onClick={() => setDeviceMode("tablet")}
          aria-label="Tablet preview"
        >
          <Tablet className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-8 w-8 text-muted-foreground",
            deviceMode === "mobile" &&
              "bg-background shadow-sm text-indigo-600",
          )}
          onClick={() => setDeviceMode("mobile")}
          aria-label="Mobile preview"
        >
          <Smartphone className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={!canUndo || previewMode}
          onClick={undo}
          aria-label="Undo"
        >
          <Undo2 className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          disabled={!canRedo || previewMode}
          onClick={redo}
          aria-label="Redo"
        >
          <Redo2 className="w-4 h-4" />
        </Button>
        <div className="h-6 w-px bg-border mx-2" />
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPreviewMode(!previewMode)}
        >
          {previewMode ? (
            <Pencil className="w-3.5 h-3.5 mr-2" />
          ) : (
            <Eye className="w-3.5 h-3.5 mr-2" />
          )}
          {previewMode ? "Edit" : "Preview"}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void handleSave()}
          disabled={!isReady || saveState === "saving"}
        >
          {saveState === "saved" ? (
            <Check className="w-3.5 h-3.5 mr-2" />
          ) : (
            <Save className="w-3.5 h-3.5 mr-2" />
          )}
          {saveState === "saving"
            ? "Saving…"
            : saveState === "saved"
              ? "Saved"
              : "Save"}
        </Button>
        <Button
          type="button"
          size="sm"
          className="bg-indigo-600 hover:bg-indigo-700"
          onClick={() => void handlePublish()}
          disabled={!canPublish || !isReady || publishing}
        >
          <Globe className="w-3.5 h-3.5 mr-2" />
          {publishing ? "Publishing…" : "Publish"}
        </Button>
      </div>

      <Dialog open={publishOpen} onOpenChange={setPublishOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {publishError ? "Cannot publish" : "Form published"}
            </DialogTitle>
            <DialogDescription>
              {publishError
                ? publishError
                : "Share this link so others can fill out the form."}
            </DialogDescription>
          </DialogHeader>
          {publishLink ? (
            <div className="flex items-center gap-2">
              <Input readOnly value={publishLink} className="font-mono text-xs" />
              <Button type="button" variant="outline" onClick={() => void copyLink()}>
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
          ) : null}
          <DialogFooter>
            {publishLink ? (
              <Button type="button" asChild>
                <a href={publishLink} target="_blank" rel="noreferrer">
                  Open link
                </a>
              </Button>
            ) : null}
            <Button type="button" variant="outline" onClick={() => setPublishOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function BuilderLayout() {
  const { addField, moveField, fields, previewMode, isReady } = useFormBuilder();
  const [activeDragItem, setActiveDragItem] = useState<{
    isLibraryItem?: boolean;
    type?: string;
    field?: { label?: string };
  } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveDragItem(active.data.current ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragItem(null);

    if (!over || previewMode) return;

    if (active.data.current?.isLibraryItem) {
      if (over.id === "form-canvas" || fields.some((f) => f.id === over.id)) {
        let index = fields.length;
        if (over.id !== "form-canvas") {
          const overIndex = fields.findIndex((f) => f.id === over.id);
          if (overIndex >= 0) {
            index = overIndex + 1;
          }
        }
        addField(active.data.current.type as FieldType, index);
      }
      return;
    }

    if (active.id !== over.id) {
      const oldIndex = fields.findIndex((f) => f.id === active.id);
      const newIndex = fields.findIndex((f) => f.id === over.id);
      if (oldIndex >= 0 && newIndex >= 0) {
        moveField(oldIndex, newIndex);
      }
    }
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-full min-h-0 flex-1 flex-col bg-background">
        <BuilderToolbar />
        {!isReady ? (
          <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
            Loading form…
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 overflow-hidden">
            {!previewMode ? <FieldLibrary /> : null}
            <FormCanvas />
            {!previewMode ? <PropertiesPanel /> : null}
          </div>
        )}
      </div>
      <DragOverlay>
        {activeDragItem ? (
          <div className="p-4 bg-background border border-indigo-500 shadow-lg rounded-lg opacity-80 w-64">
            {activeDragItem.isLibraryItem ? (
              <span className="font-medium">
                {activeDragItem.type === "short-text"
                  ? "Input"
                  : activeDragItem.type === "long-text"
                    ? "Text area"
                    : activeDragItem.type}
              </span>
            ) : (
              <span className="font-medium">
                {activeDragItem.field?.label || "Field"}
              </span>
            )}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
