"use client";

import React from "react";
import { useDraggable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { FieldCategory, LibraryItem } from "@/types/form-builder";
import {
  Type,
  AlignLeft,
  Mail,
  Phone,
  CheckSquare,
  List,
  CircleDot,
  Upload,
  Calendar,
  Star,
  Heading,
  Minus,
  MoveVertical,
  Split,
  Calculator,
  Search,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useFormBuilder } from "./form-builder-context";

const FIELD_LIBRARY: LibraryItem[] = [
  { type: "short-text", label: "Input", icon: Type, category: "Basic" },
  { type: "long-text", label: "Text area", icon: AlignLeft, category: "Basic" },
  { type: "email", label: "Email", icon: Mail, category: "Basic" },
  { type: "phone", label: "Phone", icon: Phone, category: "Basic" },
  { type: "radio", label: "Radio Group", icon: CircleDot, category: "Choices" },
  { type: "checkbox", label: "Checkbox", icon: CheckSquare, category: "Choices" },
  { type: "dropdown", label: "Dropdown", icon: List, category: "Choices" },
  { type: "file-upload", label: "File Upload", icon: Upload, category: "Advanced" },
  { type: "date-time", label: "Date / Time", icon: Calendar, category: "Advanced" },
  { type: "rating", label: "Rating", icon: Star, category: "Advanced" },
  { type: "section", label: "Section", icon: Heading, category: "Layout" },
  { type: "divider", label: "Divider", icon: Minus, category: "Layout" },
  { type: "spacer", label: "Spacer", icon: MoveVertical, category: "Layout" },
  { type: "conditional", label: "Conditional", icon: Split, category: "Logic" },
  { type: "calculated", label: "Calculated", icon: Calculator, category: "Logic" },
];

function DraggableLibraryItem({ item }: { item: LibraryItem }) {
  const { addField } = useFormBuilder();
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `library-${item.type}`,
    data: { type: item.type, isLibraryItem: true },
  });

  return (
    <button
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn(
        "flex w-full items-center gap-2 rounded-md border border-border bg-background px-2.5 py-2 text-left text-sm transition-all hover:border-indigo-500 hover:shadow-sm cursor-grab active:cursor-grabbing",
        isDragging && "opacity-50 border-dashed",
      )}
      onClick={() => addField(item.type)}
    >
      <item.icon className="h-4 w-4 shrink-0 text-muted-foreground" />
      <span className="truncate font-medium text-foreground">{item.label}</span>
    </button>
  );
}

export function FieldLibrary() {
  const [search, setSearch] = React.useState("");

  const categories: FieldCategory[] = [
    "Basic",
    "Choices",
    "Advanced",
    "Layout",
    "Logic",
  ];

  const filteredItems = FIELD_LIBRARY.filter((item) =>
    item.label.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="flex h-full min-h-0 w-64 shrink-0 flex-col overflow-hidden border-r bg-background">
      <div className="shrink-0 border-b p-3">
        <h2 className="mb-2 text-sm font-semibold text-foreground">
          Form Elements
        </h2>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search fields..."
            className="h-9 bg-muted pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        <div className="space-y-5 pb-6">
          {categories.map((category) => {
            const items = filteredItems.filter((i) => i.category === category);
            if (items.length === 0) return null;

            return (
              <div key={category}>
                <h3 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {category}
                </h3>
                <div className="space-y-1.5">
                  {items.map((item) => (
                    <DraggableLibraryItem key={item.type} item={item} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
