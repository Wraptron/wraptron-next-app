"use client";

import React from "react";
import { useDraggable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { FieldType, FieldCategory, LibraryItem } from "@/types/form-builder";
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
  ChevronDown,
  ChevronRight,
  Search
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useFormBuilder } from "./form-builder-context";

const FIELD_LIBRARY: LibraryItem[] = [
  // Basic
  { type: "short-text", label: "Short Text", icon: Type, category: "Basic" },
  { type: "long-text", label: "Long Text", icon: AlignLeft, category: "Basic" },
  { type: "email", label: "Email", icon: Mail, category: "Basic" },
  { type: "phone", label: "Phone", icon: Phone, category: "Basic" },
  
  // Choices
  { type: "radio", label: "Radio Group", icon: CircleDot, category: "Choices" },
  { type: "checkbox", label: "Checkbox", icon: CheckSquare, category: "Choices" },
  { type: "dropdown", label: "Dropdown", icon: List, category: "Choices" },

  // Advanced
  { type: "file-upload", label: "File Upload", icon: Upload, category: "Advanced" },
  { type: "date-time", label: "Date / Time", icon: Calendar, category: "Advanced" },
  { type: "rating", label: "Rating", icon: Star, category: "Advanced" },

  // Layout
  { type: "section", label: "Section", icon: Heading, category: "Layout" },
  { type: "divider", label: "Divider", icon: Minus, category: "Layout" },
  { type: "spacer", label: "Spacer", icon: MoveVertical, category: "Layout" },

  // Logic
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
        "flex flex-col items-center justify-center p-3 rounded-lg border border-gray-200 bg-white hover:border-indigo-500 hover:shadow-sm transition-all text-sm gap-2 cursor-grab active:cursor-grabbing h-24 w-full",
        isDragging && "opacity-50 border-dashed"
      )}
      onClick={() => addField(item.type)}
    >
      <item.icon className="w-6 h-6 text-gray-500" />
      <span className="text-gray-700 font-medium text-xs text-center">{item.label}</span>
      {/* Visual cue for drag */}
    </button>
  );
}

export function FieldLibrary() {
  const [search, setSearch] = React.useState("");

  const categories: FieldCategory[] = ["Basic", "Choices", "Advanced", "Layout", "Logic"];

  const filteredItems = FIELD_LIBRARY.filter(item => 
    item.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-80 border-r bg-gray-50/50 flex flex-col h-full bg-slate-50">
      <div className="p-4 border-b bg-white">
        <h2 className="font-semibold text-gray-900 mb-2">Form Elements</h2>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
          <Input 
            placeholder="Search fields..." 
            className="pl-9 bg-gray-50 border-gray-200"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>
      
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-6 pb-8">
          {categories.map((category) => {
            const items = filteredItems.filter(i => i.category === category);
            if (items.length === 0) return null;

            return (
              <div key={category}>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-1">{category}</h3>
                <div className="grid grid-cols-2 gap-2">
                  {items.map((item) => (
                    <DraggableLibraryItem key={item.type} item={item} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
