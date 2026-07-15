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
  DragOverEvent 
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { useFormBuilder } from "@/components/forms/builder/form-builder-context";
import { FieldLibrary } from "@/components/forms/builder/field-library";
import { FormCanvas } from "@/components/forms/builder/form-canvas";
import { PropertiesPanel } from "@/components/forms/builder/properties-panel";
import { FormField, FieldType } from "@/types/form-builder";
import { Button } from "@/components/ui/button";
import { 
    Undo2, 
    Redo2, 
    Smartphone, 
    Tablet, 
    Monitor, 
    Save, 
    Eye,
    ChevronLeft,
    Sparkles
} from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

function BuilderToolbar() {
    const router = useRouter();
    const { 
        undo, 
        redo, 
        canUndo, 
        canRedo, 
        deviceMode, 
        setDeviceMode 
    } = useFormBuilder();

    return (
        <div className="h-14 border-b bg-background flex items-center justify-between px-4 sticky top-0 z-20">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")}>
                    <ChevronLeft className="w-4 h-4 mr-1" /> Back
                </Button>
                <div className="h-6 w-px bg-border" />
                <h1 className="font-semibold text-foreground">Untitled Form</h1>
            </div>

            <div className="flex items-center gap-2 bg-muted p-1 rounded-lg">
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className={cn("h-8 w-8 text-muted-foreground", deviceMode === "desktop" && "bg-background shadow-sm text-indigo-600")}
                    onClick={() => setDeviceMode("desktop")}
                >
                    <Monitor className="w-4 h-4" />
                </Button>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className={cn("h-8 w-8 text-muted-foreground", deviceMode === "tablet" && "bg-background shadow-sm text-indigo-600")}
                    onClick={() => setDeviceMode("tablet")}
                >
                    <Tablet className="w-4 h-4" />
                </Button>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className={cn("h-8 w-8 text-muted-foreground", deviceMode === "mobile" && "bg-background shadow-sm text-indigo-600")}
                    onClick={() => setDeviceMode("mobile")}
                >
                    <Smartphone className="w-4 h-4" />
                </Button>
            </div>

            <div className="flex items-center gap-2">
                 <Button variant="ghost" size="icon" disabled={!canUndo} onClick={undo}>
                    <Undo2 className="w-4 h-4" />
                 </Button>
                 <Button variant="ghost" size="icon" disabled={!canRedo} onClick={redo}>
                    <Redo2 className="w-4 h-4" />
                 </Button>
                 <div className="h-6 w-px bg-border mx-2" />
                 <Button variant="outline" size="sm" className="hidden sm:flex">
                    <Sparkles className="w-3.5 h-3.5 mr-2 text-indigo-500" /> 
                    AI Assistant
                 </Button>
                 <Button variant="outline" size="sm">
                    <Eye className="w-3.5 h-3.5 mr-2" />
                    Preview
                 </Button>
                 <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                    <Save className="w-3.5 h-3.5 mr-2" />
                    Publish
                 </Button>
            </div>
        </div>
    );
}

export function BuilderLayout() {
    const { addField, moveField, fields } = useFormBuilder();
    const [activeDragItem, setActiveDragItem] = useState<any>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // Require movement of 8px to start drag (prevents accidental drags on click)
            },
        })
    );

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        setActiveDragItem(active.data.current);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveDragItem(null);

        if (!over) return;

        // Dropping from Library to Canvas
        if (active.data.current?.isLibraryItem) {
            if (over.id === "form-canvas" || fields.some(f => f.id === over.id)) {
                // Find index to insert at
                let index = fields.length;
                if (over.id !== "form-canvas") {
                    const overIndex = fields.findIndex((f) => f.id === over.id);
                    if (overIndex >= 0) {
                        // Insert after or before? Default to after for now unless we do pixel calculation
                        index = overIndex + 1; 
                    }
                }
                addField(active.data.current.type as FieldType, index);
            }
            return;
        }

        // Reordering within Canvas
        if (active.id !== over.id) {
             const oldIndex = fields.findIndex((f) => f.id === active.id);
             const newIndex = fields.findIndex((f) => f.id === over.id);
             moveField(oldIndex, newIndex);
        }
    };

    return (
        <DndContext 
            sensors={sensors} 
            onDragStart={handleDragStart} 
            onDragEnd={handleDragEnd}
        >
            <div className="h-screen flex flex-col bg-background">
                <BuilderToolbar />
                <div className="flex-1 flex overflow-hidden">
                    <FieldLibrary />
                    <FormCanvas />
                    <PropertiesPanel />
                </div>
            </div>
            <DragOverlay>
                {activeDragItem ? (
                     <div className="p-4 bg-background border border-indigo-500 shadow-lg rounded-lg opacity-80 w-64">
                        {activeDragItem.isLibraryItem ? (
                            <span className="font-medium">{activeDragItem.type}</span>
                        ) : (
                            <span className="font-medium">{activeDragItem.field?.label || "Field"}</span>
                        )}
                     </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}
