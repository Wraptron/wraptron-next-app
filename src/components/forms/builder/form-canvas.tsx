"use client";

import React, { useRef, useState, useEffect } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { useFormBuilder } from "./form-builder-context";
import { FormField } from "@/types/form-builder";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Trash2, GripVertical, Copy } from "lucide-react";

function EmptyState() {
  const { addField } = useFormBuilder();
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8 border-2 border-dashed border-border rounded-xl bg-muted/50 m-8">
      <div className="max-w-md space-y-4">
        <h3 className="text-xl font-bold text-foreground">Start building your form</h3>
        <p className="text-muted-foreground">Drag fields from the left or choose a template to get started.</p>
        <div className="grid grid-cols-1 gap-2 pt-4">
           <Button variant="outline" className="w-full justify-start" onClick={() => {
              addField("short-text"); addField("email"); addField("long-text");
           }}>
             Start with Contact Form
           </Button>
           <Button variant="outline" className="w-full justify-start" onClick={() => {
              addField("rating"); addField("long-text");
           }}>
             Start with Feedback Form
           </Button>
        </div>
      </div>
    </div>
  );
}

function FieldRenderer({ field, isSelected }: { field: FormField; isSelected: boolean }) {
  // Inline editing for label
  const { updateField } = useFormBuilder();
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const labelInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditingLabel && labelInputRef.current) {
      labelInputRef.current.focus();
    }
  }, [isEditingLabel]);

  const handleLabelBlur = () => setIsEditingLabel(false);
  const handleLabelKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") setIsEditingLabel(false);
  };

  const commonClasses = "pointer-events-none"; // Disable interaction with form elements while building, so dragging works easier? Or maybe just on specific parts. 
  // Requirement: "Test Function ... Fill form with fake data".
  // "Live preview must match exactly".
  // So inputs should look real.
  
  const content = (() => {
    switch (field.type) {
      case "short-text":
      case "email":
      case "phone":
      case "calculated":
        return <Input placeholder={field.placeholder || "Short answer text"} className="bg-background" disabled />;
      case "long-text":
        return <Textarea placeholder={field.placeholder || "Long answer text"} className="bg-background min-h-[100px]" disabled />;
      case "radio":
        return (
            <RadioGroup disabled>
                {(field.options || ["Option 1", "Option 2"]).map((opt, i) => (
                    <div key={i} className="flex items-center space-x-2">
                        <RadioGroupItem value={opt} id={`${field.id}-${i}`} />
                        <Label htmlFor={`${field.id}-${i}`}>{opt}</Label>
                    </div>
                ))}
            </RadioGroup>
        );
      case "checkbox":
        return (
            <div className="space-y-2">
                {(field.options || ["Option 1", "Option 2"]).map((opt, i) => (
                    <div key={i} className="flex items-center space-x-2">
                        <Checkbox id={`${field.id}-${i}`} disabled />
                         <Label htmlFor={`${field.id}-${i}`}>{opt}</Label>
                    </div>
                ))}
            </div>
        );
      case "dropdown":
        return (
            <Select disabled>
                <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select an option" />
                </SelectTrigger>
                <SelectContent>
                    {(field.options || ["Option 1"]).map((opt, i) => (
                         <SelectItem key={i} value={opt}>{opt}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        );
      case "section":
        return null; // Handled in label area mostly, but maybe a separator?
      case "divider":
        return <hr className="my-4 border-border" />;
      case "spacer":
        return <div className="h-8" />;
       // ... other types
      default:
        return <div className="p-4 bg-muted rounded text-muted-foreground text-sm">Unsupported field type: {field.type}</div>;
    }
  })();

    if (field.type === "section") {
        return (
             <div className="py-2">
                {isEditingLabel ? (
                    <Input 
                        ref={labelInputRef}
                        value={field.label} 
                        onChange={(e) => updateField(field.id, { label: e.target.value })}
                        onBlur={handleLabelBlur}
                        onKeyDown={handleLabelKeyDown}
                        className="text-2xl font-bold border-indigo-300 focus:ring-indigo-500 bg-background"
                    />
                ) : (
                    <h2 
                        className="text-2xl font-bold text-foreground cursor-text hover:bg-muted px-1 -mx-1 rounded"
                        onClick={(e) => { e.stopPropagation(); setIsEditingLabel(true); }}
                    >
                        {field.label}
                    </h2>
                 )}
                 {field.helpText && <p className="text-muted-foreground mt-1">{field.helpText}</p>}
                 <hr className="mt-2 border-border" />
             </div>
        );
    }

  return (
    <div className="space-y-2 w-full">
      {field.type !== "divider" && field.type !== "spacer" && (
        <div className="flex justify-between items-baseline mb-1">
             {isEditingLabel ? (
                 <Input 
                    ref={labelInputRef}
                    value={field.label} 
                    onChange={(e) => updateField(field.id, { label: e.target.value })}
                    onBlur={handleLabelBlur}
                    onKeyDown={handleLabelKeyDown}
                    className="font-medium h-8 py-1 px-2 w-full border-indigo-300 focus:ring-indigo-500 bg-background"
                />
             ) : (
                <Label 
                    className="text-sm font-medium text-foreground cursor-text hover:text-indigo-600 transition-colors"
                    onClick={(e) => { e.stopPropagation(); setIsEditingLabel(true); }}
                >
                    {field.label}
                    {field.required && <span className="text-red-500 ml-0.5">*</span>}
                </Label>
             )}
        </div>
      )}
      {content}
      {field.helpText && <p className="text-xs text-muted-foreground mt-1">{field.helpText}</p>}
    </div>
  );
}

function SortableFieldWrapper({ field }: { field: FormField }) {
  const { selectField, selectedFieldId, deleteField, updateField, addField } = useFormBuilder();
  const isSelected = selectedFieldId === field.id;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id, data: { type: field.type, field } });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  const handleDuplicate = (e: React.MouseEvent) => {
      e.stopPropagation();
      addField(field.type); // Simplification, ideally duplicates props
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative flex items-start gap-2 p-4 rounded-lg border-2 bg-background transition-all mb-4",
        isSelected ? "border-indigo-500 shadow-md ring-1 ring-indigo-500 z-10" : "border-transparent hover:border-border",
        isDragging && "opacity-50 z-50",
         // "Click label to edit text" handled in renderer, "Double-click field to open properties" handled here
      )}
      onClick={(e) => {
          e.stopPropagation();
          selectField(field.id);
      }}
      onDoubleClick={(e) => {
          e.stopPropagation();
          // Open properties panel is implied by selection, but maybe focus it?
          selectField(field.id);
      }}
    >
        {/* Drag Handle - Only visible on hover or selection */}
        <div 
            {...attributes} 
            {...listeners}
            className={cn(
                "absolute left-2 top-1/2 -translate-y-1/2 cursor-grab text-gray-400 p-1 rounded hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity",
                isSelected && "opacity-100"
            )}
        >
            <GripVertical className="h-5 w-5" />
        </div>

        {/* Content */}
        <div className="flex-1 pl-8">
            <FieldRenderer field={field} isSelected={isSelected} />
        </div>

        {/* Actions - Only visible on selection or hover */}
        <div className={cn(
            "absolute right-2 top-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity",
            isSelected && "opacity-100 bg-background shadow-sm p-1 rounded-md border border-border"
        )}>
             <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-indigo-600" onClick={handleDuplicate}>
                <Copy className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={(e) => {
                e.preventDefault();
                deleteField(field.id);
            }}>
                <Trash2 className="h-3.5 w-3.5" />
            </Button>
        </div>
    </div>
  );
}

export function FormCanvas() {
  const { fields, deviceMode, selectField } = useFormBuilder();
  const { setNodeRef } = useDroppable({
    id: "form-canvas",
  });

  const maxWidthClass = {
    desktop: "max-w-3xl",
    tablet: "max-w-xl",
    mobile: "max-w-sm",
  }[deviceMode];

  return (
    <div 
        className="flex-1 bg-muted h-full overflow-y-auto flex flex-col items-center py-8 relative transition-all"
        onClick={() => selectField(null)} // Deselect when clicking background
    >
      <div
        ref={setNodeRef}
        className={cn(
          "w-full bg-background min-h-[800px] shadow-sm rounded-xl transition-all duration-300 ease-in-out p-8 border border-border",
          maxWidthClass
        )}
      >
        {fields.length === 0 ? (
          <EmptyState />
        ) : (
          <SortableContext items={fields.map(f => f.id)} strategy={verticalListSortingStrategy}>
             <div className="space-y-1">
                {fields.map((field) => (
                    <SortableFieldWrapper key={field.id} field={field} />
                ))}
            </div>
          </SortableContext>
        )}
      </div>
       <div className="mt-8 text-xs text-gray-400">
            {deviceMode.charAt(0).toUpperCase() + deviceMode.slice(1)} Preview
       </div>
    </div>
  );
}
