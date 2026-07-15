"use client";

import React from "react";
import { Save, Undo2, Redo2, Play, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import { FormField } from "@/hooks/use-form-builder";

interface FormToolbarProps {
  isSaving: boolean;
  isAutoSaving: boolean;
  lastSaved: Date | null;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => void;
  onTest: () => void;
  isTestMode: boolean;
  formFields: FormField[];
  onOpenAI?: () => void;
}

export function FormToolbar({
  isSaving,
  isAutoSaving,
  lastSaved,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onSave,
  onTest,
  isTestMode,
  formFields,
  onOpenAI,
}: FormToolbarProps) {
  const formatLastSaved = () => {
    if (!lastSaved) return null;
    const now = new Date();
    const diff = now.getTime() - lastSaved.getTime();
    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  return (
    <div className="border-b bg-background px-4 py-2 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onUndo} disabled={!canUndo}>
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={onRedo} disabled={!canRedo}>
          <Redo2 className="h-4 w-4" />
        </Button>
        <div className="h-6 w-px bg-muted mx-2" />
        <Button variant="ghost" size="sm" onClick={onTest}>
          <Play
            className={cn("h-4 w-4 mr-2", isTestMode && "text-green-600")}
          />
          Test
          {isTestMode && (
            <Badge variant="outline" className="ml-2">
              Active
            </Badge>
          )}
        </Button>
        <Button variant="ghost" size="sm" onClick={onOpenAI}>
          <Sparkles className="h-4 w-4 mr-2" />
          AI Assistant
        </Button>
      </div>

      <div className="flex items-center gap-4">
        {isAutoSaving && (
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <span className="h-2 w-2 bg-blue-500 rounded-full animate-pulse" />
            Saving...
          </span>
        )}
        {lastSaved && !isAutoSaving && (
          <span className="text-xs text-muted-foreground">
            Saved {formatLastSaved()}
          </span>
        )}
        <Button
          variant="default"
          size="sm"
          onClick={onSave}
          disabled={isSaving || isAutoSaving}
        >
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
}
