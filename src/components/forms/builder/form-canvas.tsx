"use client";

import React, { useRef, useState, useEffect } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy, useSortable } from "@dnd-kit/sortable";
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
import { Trash2, GripVertical, Copy, Upload, Star } from "lucide-react";
import { FieldResizeHandles } from "./field-resize-handles";
import { FIELD_GAP } from "./field-layout";

function EmptyState() {
  const { addField } = useFormBuilder();
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8 border-2 border-dashed border-border rounded-xl bg-muted/50 m-8">
      <div className="max-w-md space-y-4">
        <h3 className="text-xl font-bold text-foreground">Start building your form</h3>
        <p className="text-muted-foreground">
          Drag a field from the left, click one to add it, then customize it in the properties panel.
        </p>
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

function FieldRenderer({ field }: { field: FormField }) {
  const { updateField, previewMode } = useFormBuilder();
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const labelInputRef = useRef<HTMLInputElement>(null);
  const interactive = previewMode;

  useEffect(() => {
    if (isEditingLabel && labelInputRef.current) {
      labelInputRef.current.focus();
    }
  }, [isEditingLabel]);

  const handleLabelBlur = () => setIsEditingLabel(false);
  const handleLabelKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") setIsEditingLabel(false);
  };

  const inputType =
    field.type === "email" ? "email" : field.type === "phone" ? "tel" : "text";
  const ratingMax = field.validation?.max || 5;

  const content = (() => {
    switch (field.type) {
      case "short-text":
      case "email":
      case "phone":
      case "calculated":
        return (
          <Input
            type={inputType}
            placeholder={field.placeholder || "Short answer text"}
            className={cn("bg-background", field.height && "h-full")}
            defaultValue={field.defaultValue}
            readOnly={!interactive || field.readOnly}
            disabled={!interactive}
          />
        );
      case "long-text":
        return (
          <Textarea
            placeholder={field.placeholder || "Long answer text"}
            className={cn(
              "bg-background",
              field.height ? "h-full min-h-0 resize-none" : "min-h-[100px]",
            )}
            defaultValue={field.defaultValue}
            readOnly={!interactive || field.readOnly}
            disabled={!interactive}
          />
        );
      case "radio":
        return (
          <RadioGroup disabled={!interactive}>
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
                <Checkbox id={`${field.id}-${i}`} disabled={!interactive} />
                <Label htmlFor={`${field.id}-${i}`}>{opt}</Label>
              </div>
            ))}
          </div>
        );
      case "dropdown":
        return (
          <Select disabled={!interactive}>
            <SelectTrigger className={cn("bg-background", field.height && "h-full")}>
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              {(field.options || ["Option 1"]).map((opt, i) => (
                <SelectItem key={i} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case "file-upload":
        return (
          <label
            className={cn(
              "flex h-full min-h-20 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/40 px-4 text-sm text-muted-foreground",
              !field.height && "py-8",
              interactive && "cursor-pointer hover:bg-muted",
            )}
          >
            <Upload className="h-5 w-5" />
            {field.placeholder || "Click or drop a file"}
            {interactive ? (
              <input type="file" className="sr-only" disabled={field.readOnly} />
            ) : null}
          </label>
        );
      case "date-time":
        return (
          <Input
            type="datetime-local"
            className="bg-background"
            defaultValue={field.defaultValue}
            readOnly={!interactive || field.readOnly}
            disabled={!interactive}
          />
        );
      case "rating":
        return (
          <div className="flex items-center gap-1">
            {Array.from({ length: ratingMax }, (_, i) => (
              <Star
                key={i}
                className="h-5 w-5 text-amber-400"
                fill={i < 3 ? "currentColor" : "none"}
              />
            ))}
          </div>
        );
      case "conditional":
        return (
          <div className="rounded-md border border-dashed border-border bg-muted/40 p-3 text-sm text-muted-foreground">
            Shown only when a condition is met.
          </div>
        );
      case "section":
        return null;
      case "divider":
        return <hr className="my-4 border-border" />;
      case "spacer":
        return <div style={{ height: field.height ? "100%" : 32 }} />;
      default:
        return (
          <div className="p-4 bg-muted rounded text-muted-foreground text-sm">
            Unsupported field type: {field.type}
          </div>
        );
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
                        onClick={(e) => {
                          if (previewMode) return;
                          e.stopPropagation();
                          setIsEditingLabel(true);
                        }}
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
    <div className={cn("flex h-full w-full min-h-0 flex-col space-y-2")}>
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
                    onClick={(e) => {
                      if (previewMode) return;
                      e.stopPropagation();
                      setIsEditingLabel(true);
                    }}
                >
                    {field.label}
                    {field.required && <span className="text-red-500 ml-0.5">*</span>}
                </Label>
             )}
        </div>
      )}
      <div className="min-h-0 flex-1">{content}</div>
      {field.helpText && (
        <p className="mt-1 text-xs text-muted-foreground">{field.helpText}</p>
      )}
    </div>
  );
}

function SortableFieldWrapper({ field }: { field: FormField }) {
  const {
    selectField,
    selectedFieldId,
    deleteField,
    addField,
    previewMode,
    updateField,
  } = useFormBuilder();
  const isSelected = selectedFieldId === field.id && !previewMode;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: field.id,
    data: { type: field.type, field },
    disabled: previewMode,
  });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition: isSelected ? undefined : transition,
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: field.width ? `${field.width}px` : "100%",
    width: field.width ? field.width : "100%",
    height: field.height ? field.height : undefined,
    maxWidth: "100%",
  };

  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation();
    addField(field.type);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative flex items-start gap-2 rounded-lg border-2 bg-background p-4",
        isSelected
          ? "z-10 border-indigo-500 shadow-md ring-1 ring-indigo-500"
          : "border-transparent hover:border-border",
        isDragging && "z-50 opacity-50",
      )}
      onClick={(e) => {
        e.stopPropagation();
        if (!previewMode) selectField(field.id);
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        if (!previewMode) selectField(field.id);
      }}
    >
      {!previewMode ? (
        <div
          {...attributes}
          {...listeners}
          className={cn(
            "absolute left-2 top-1/2 -translate-y-1/2 cursor-grab rounded p-1 text-gray-400 opacity-0 transition-opacity hover:bg-muted group-hover:opacity-100",
            isSelected && "opacity-100",
          )}
        >
          <GripVertical className="h-5 w-5" />
        </div>
      ) : null}

      <div className={cn("min-h-0 min-w-0 flex-1", !previewMode && "pl-8 pr-10")}>
        <FieldRenderer field={field} />
      </div>

      {!previewMode ? (
        <div
          className={cn(
            "absolute right-2 top-2 z-10 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100",
            isSelected &&
              "opacity-100 rounded-md border border-border bg-background p-1 shadow-sm",
          )}
        >
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-indigo-600"
            onClick={handleDuplicate}
          >
            <Copy className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-red-500 hover:bg-red-50 hover:text-red-600"
            onClick={(e) => {
              e.preventDefault();
              deleteField(field.id);
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ) : null}

      {isSelected ? (
        <FieldResizeHandles
          width={field.width}
          height={field.height}
          onResize={(size) => updateField(field.id, size)}
        />
      ) : null}
    </div>
  );
}

export function FormCanvas() {
  const { fields, deviceMode, selectField, formTitle, previewMode } =
    useFormBuilder();
  const { setNodeRef } = useDroppable({
    id: "form-canvas",
  });

  const maxWidthClass = {
    desktop: "max-w-5xl",
    tablet: "max-w-2xl",
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
        {previewMode ? (
          <h2 className="mb-6 text-2xl font-semibold tracking-tight">
            {formTitle || "Untitled Form"}
          </h2>
        ) : null}
        {fields.length === 0 ? (
          <EmptyState />
        ) : (
          <SortableContext items={fields.map(f => f.id)} strategy={rectSortingStrategy}>
             <div className="flex flex-wrap content-start items-start" style={{ gap: FIELD_GAP }}>
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
