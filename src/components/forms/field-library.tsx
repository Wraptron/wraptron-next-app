"use client";

import React, { useContext } from "react";
import { useDraggable } from "@dnd-kit/core";
import {
  Type,
  Hash,
  FileText,
  Mail,
  Phone,
  CircleDot,
  Square,
  ChevronDown,
  Upload,
  Calendar,
  Star,
  FolderOpen,
  Minus,
  Space,
  GitBranch,
  Calculator,
  ChevronRight,
} from "lucide-react";
import { FieldType } from "@/hooks/use-form-builder";
import { cn } from "@/lib/utils";

interface FieldDefinition {
  type: FieldType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  category: "basic" | "choices" | "advanced" | "layout" | "logic";
}

const FIELD_DEFINITIONS: FieldDefinition[] = [
  // Basic
  { type: "input-string", label: "Input", icon: Type, category: "basic" },
  { type: "input-number", label: "Number", icon: Hash, category: "basic" },
  { type: "input-decimal", label: "Decimal", icon: Hash, category: "basic" },
  { type: "long-text", label: "Long Text", icon: FileText, category: "basic" },
  { type: "email", label: "Email", icon: Mail, category: "basic" },
  { type: "phone", label: "Phone", icon: Phone, category: "basic" },
  // Choices
  { type: "radio", label: "Radio", icon: CircleDot, category: "choices" },
  { type: "checkbox", label: "Checkbox", icon: Square, category: "choices" },
  {
    type: "dropdown",
    label: "Dropdown",
    icon: ChevronDown,
    category: "choices",
  },
  // Advanced
  {
    type: "file-upload",
    label: "File Upload",
    icon: Upload,
    category: "advanced",
  },
  {
    type: "date-time",
    label: "Date / Time",
    icon: Calendar,
    category: "advanced",
  },
  {
    type: "rating-scale",
    label: "Rating / Scale",
    icon: Star,
    category: "advanced",
  },
  // Layout
  { type: "section", label: "Section", icon: FolderOpen, category: "layout" },
  { type: "divider", label: "Divider", icon: Minus, category: "layout" },
  { type: "spacer", label: "Spacer", icon: Space, category: "layout" },
  // Logic
  {
    type: "conditional-block",
    label: "Conditional Block",
    icon: GitBranch,
    category: "logic",
  },
  {
    type: "calculated-field",
    label: "Calculated Field",
    icon: Calculator,
    category: "logic",
  },
];

const CATEGORIES = [
  { id: "basic", label: "Basic", defaultOpen: true },
  { id: "choices", label: "Choices", defaultOpen: false },
  { id: "advanced", label: "Advanced", defaultOpen: false },
  { id: "layout", label: "Layout", defaultOpen: false },
  { id: "logic", label: "Logic", defaultOpen: false },
];

interface DraggableFieldProps {
  field: FieldDefinition;
  onAddField?: (fieldType: FieldType) => void;
}

function DraggableField({ field, onAddField }: DraggableFieldProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `library-${field.type}`,
      data: {
        type: "library",
        fieldType: field.type,
      },
    });

  const Icon = field.icon;

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAddField) {
      onAddField(field.type);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={handleClick}
      className={cn(
        "flex items-center gap-2 p-2 rounded-lg cursor-grab active:cursor-grabbing hover:bg-muted transition-colors",
        isDragging && "opacity-50",
      )}
    >
      <Icon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
      <span className="text-sm font-medium text-foreground">{field.label}</span>
    </div>
  );
}

interface FieldLibraryProps {
  onAddField?: (fieldType: FieldType) => void;
}

export function FieldLibrary({ onAddField }: FieldLibraryProps) {
  const [openCategories, setOpenCategories] = React.useState<Set<string>>(
    new Set(["basic"]),
  );

  const toggleCategory = (categoryId: string) => {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  return (
    <div className="p-4">
      <h2 className="text-sm font-semibold text-foreground mb-4">
        Field Library
      </h2>
      <div className="space-y-2">
        {CATEGORIES.map((category) => {
          const fields = FIELD_DEFINITIONS.filter(
            (f) => f.category === category.id,
          );
          const isOpen = openCategories.has(category.id);

          return (
            <div
              key={category.id}
              className="border rounded-lg overflow-hidden"
            >
              <button
                onClick={() => toggleCategory(category.id)}
                className="w-full flex items-center justify-between p-2 hover:bg-muted transition-colors"
              >
                <span className="text-xs font-medium text-foreground uppercase">
                  {category.label}
                </span>
                <ChevronRight
                  className={cn(
                    "h-4 w-4 text-gray-400 transition-transform",
                    isOpen && "rotate-90",
                  )}
                />
              </button>
              {isOpen && (
                <div className="p-2 space-y-1">
                  {fields.map((field) => (
                    <DraggableField
                      key={field.type}
                      field={field}
                      onAddField={onAddField}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
