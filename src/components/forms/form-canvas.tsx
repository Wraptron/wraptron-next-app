"use client";

import React, { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { FormField, FieldType } from "@/hooks/use-form-builder";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Trash2, GripVertical, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface FormCanvasProps {
  fields: FormField[];
  selectedFieldId: string | null;
  onFieldSelect: (id: string | null) => void;
  onFieldUpdate: (id: string, updates: Partial<FormField>) => void;
  onFieldDelete: (id: string) => void;
  previewMode: "desktop" | "mobile" | "tablet";
  isTestMode: boolean;
  onLoadExample?: (exampleType: string) => void;
}

function FieldRenderer({
  field,
  isSelected,
  isEditing,
  onSelect,
  onUpdate,
  onDelete,
  onDoubleClick,
  previewMode,
  isTestMode,
}: {
  field: FormField;
  isSelected: boolean;
  isEditing: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<FormField>) => void;
  onDelete: () => void;
  onDoubleClick: () => void;
  previewMode: "desktop" | "mobile" | "tablet";
  isTestMode: boolean;
}) {
  const [editingLabel, setEditingLabel] = useState(false);
  const [labelValue, setLabelValue] = useState(field.label);

  const handleLabelBlur = () => {
    if (labelValue !== field.label) {
      onUpdate({ label: labelValue });
    }
    setEditingLabel(false);
  };

  const renderField = () => {
    switch (field.type) {
      case "input-string":
        return (
          <Input
            type="text"
            placeholder={field.placeholder || ""}
            defaultValue={
              isTestMode ? getFakeValue(field.type) : field.defaultValue
            }
            readOnly={!isTestMode && field.readOnly}
            disabled={!isTestMode}
            className="mt-1"
          />
        );
      case "input-number":
        return (
          <Input
            type="number"
            placeholder={field.placeholder || ""}
            defaultValue={
              isTestMode ? getFakeValue(field.type) : field.defaultValue
            }
            min={field.min}
            max={field.max}
            readOnly={!isTestMode && field.readOnly}
            disabled={!isTestMode}
            className="mt-1"
          />
        );
      case "input-decimal":
        return (
          <Input
            type="number"
            step="0.01"
            placeholder={field.placeholder || ""}
            defaultValue={
              isTestMode ? getFakeValue(field.type) : field.defaultValue
            }
            min={field.min}
            max={field.max}
            readOnly={!isTestMode && field.readOnly}
            disabled={!isTestMode}
            className="mt-1"
          />
        );
      case "email":
        return (
          <Input
            type="email"
            placeholder={field.placeholder || ""}
            defaultValue={
              isTestMode ? getFakeValue(field.type) : field.defaultValue
            }
            readOnly={!isTestMode && field.readOnly}
            disabled={!isTestMode}
            className="mt-1"
          />
        );
      case "phone":
        return (
          <Input
            type="tel"
            placeholder={field.placeholder || ""}
            defaultValue={
              isTestMode ? getFakeValue(field.type) : field.defaultValue
            }
            readOnly={!isTestMode && field.readOnly}
            disabled={!isTestMode}
            className="mt-1"
          />
        );
      case "long-text":
        return (
          <Textarea
            placeholder={field.placeholder || ""}
            defaultValue={
              isTestMode ? getFakeValue(field.type) : field.defaultValue
            }
            readOnly={!isTestMode && field.readOnly}
            disabled={!isTestMode}
            className="mt-1"
            rows={4}
          />
        );
      case "radio":
        return (
          <div className="mt-1 space-y-2">
            {field.options?.map((option, idx) => (
              <label key={idx} className="flex items-center gap-2">
                <input
                  type="radio"
                  name={field.id}
                  value={option}
                  defaultChecked={isTestMode && idx === 0}
                  disabled={!isTestMode}
                  className="h-4 w-4"
                />
                <span className="text-sm">{option}</span>
              </label>
            ))}
          </div>
        );
      case "checkbox":
        return (
          <div className="mt-1 space-y-2">
            {field.options?.map((option, idx) => (
              <label key={idx} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name={field.id}
                  value={option}
                  defaultChecked={isTestMode && idx === 0}
                  disabled={!isTestMode}
                  className="h-4 w-4"
                />
                <span className="text-sm">{option}</span>
              </label>
            ))}
          </div>
        );
      case "dropdown":
        return (
          <select
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            defaultValue={isTestMode ? field.options?.[0] : field.defaultValue}
            disabled={!isTestMode}
          >
            {field.options?.map((option, idx) => (
              <option key={idx} value={option}>
                {option}
              </option>
            ))}
          </select>
        );
      case "file-upload":
        return (
          <div className="mt-1">
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer hover:bg-gray-50">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <svg
                  className="w-8 h-8 mb-2 text-gray-500"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 20 16"
                >
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021 5.5 5.5 0 0 0 5 13h3m-3-4h3m-3 4h3m6-4h3m-3 4h3"
                  />
                </svg>
                <p className="mb-2 text-sm text-gray-500">
                  <span className="font-semibold">Click to upload</span> or drag
                  and drop
                </p>
                <p className="text-xs text-gray-500">PDF, DOCX, or images</p>
              </div>
              <input
                type="file"
                className="hidden"
                disabled={!isTestMode}
                multiple
              />
            </label>
          </div>
        );
      case "date-time":
        return (
          <Input
            type="datetime-local"
            placeholder={field.placeholder || ""}
            defaultValue={
              isTestMode
                ? new Date().toISOString().slice(0, 16)
                : field.defaultValue
            }
            readOnly={!isTestMode && field.readOnly}
            disabled={!isTestMode}
            className="mt-1"
          />
        );
      case "rating-scale":
        return (
          <div className="mt-1 flex items-center gap-2">
            {Array.from({ length: field.scale || 5 }).map((_, idx) => (
              <button
                key={idx}
                type="button"
                disabled={!isTestMode}
                className={cn(
                  "text-2xl transition-colors",
                  isTestMode
                    ? "hover:text-yellow-400 cursor-pointer"
                    : "cursor-default",
                  idx < (isTestMode ? 3 : 0) ? "text-yellow-400" : "text-gray-300",
                )}
              >
                ★
              </button>
            ))}
            <span className="text-sm text-gray-500 ml-2">
              ({field.scale || 5} point scale)
            </span>
          </div>
        );
      case "section":
        return (
          <div className="mt-2 border-t border-gray-200 pt-4">
            <p className="text-sm font-medium text-gray-700">{field.label}</p>
            {field.helpText && (
              <p className="text-xs text-gray-500 mt-1">{field.helpText}</p>
            )}
          </div>
        );
      case "divider":
        return <div className="my-4 border-t border-gray-300" />;
      case "spacer":
        return <div className="h-8" />;
      case "conditional-block":
        return (
          <div className="mt-1 p-3 border-2 border-dashed border-blue-300 rounded-lg bg-blue-50">
            <p className="text-sm text-blue-700">
              Conditional block: {field.showIf || "No condition set"}
            </p>
          </div>
        );
      case "calculated-field":
        return (
          <div className="mt-1 p-3 border-2 border-dashed border-purple-300 rounded-lg bg-purple-50">
            <p className="text-sm text-purple-700">
              Calculated field: {field.label}
            </p>
          </div>
        );
      default:
        return (
          <div className="mt-1 text-sm text-gray-500">
            Field type: {field.type}
          </div>
        );
    }
  };

  return (
    <div
      className={cn(
        "group relative p-4 border-2 rounded-lg transition-all",
        isSelected
          ? "border-blue-500 bg-blue-50"
          : "border-transparent hover:border-gray-300 bg-white",
      )}
      onClick={onSelect}
      onDoubleClick={onDoubleClick}
    >
      {isSelected && (
        <div className="absolute -top-2 -left-2 flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 bg-white border border-gray-300"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 className="h-3 w-3 text-red-600" />
          </Button>
        </div>
      )}

      <div className="flex items-start gap-2">
        <GripVertical className="h-5 w-5 text-gray-400 mt-1 cursor-grab" />
        <div className="flex-1">
          {editingLabel ? (
            <Input
              value={labelValue}
              onChange={(e) => setLabelValue(e.target.value)}
              onBlur={handleLabelBlur}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleLabelBlur();
                }
              }}
              autoFocus
              className="font-medium"
            />
          ) : (
            <label
              className="block text-sm font-medium text-gray-700 cursor-text"
              onClick={(e) => {
                e.stopPropagation();
                setEditingLabel(true);
              }}
            >
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
          )}
          {field.helpText && (
            <p className="text-xs text-gray-500 mt-1">{field.helpText}</p>
          )}
          {renderField()}
        </div>
      </div>
    </div>
  );
}

function SortableField({
  field,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  onDoubleClick,
  previewMode,
  isTestMode,
}: {
  field: FormField;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<FormField>) => void;
  onDelete: () => void;
  onDoubleClick: () => void;
  previewMode: "desktop" | "mobile" | "tablet";
  isTestMode: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({
    id: field.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} className="relative">
      <FieldRenderer
        field={field}
        isSelected={isSelected}
        isEditing={false}
        onSelect={onSelect}
        onUpdate={onUpdate}
        onDelete={onDelete}
        onDoubleClick={onDoubleClick}
        previewMode={previewMode}
        isTestMode={isTestMode}
      />
      <div
        {...listeners}
        className="absolute top-0 left-0 right-0 h-12 cursor-grab active:cursor-grabbing z-10"
      />
      {isOver && !isDragging && (
        <div className="absolute inset-0 border-2 border-blue-500 rounded-lg pointer-events-none" />
      )}
    </div>
  );
}

function getFakeValue(type: FieldType): string {
  const values: Record<string, string> = {
    "input-string": "John Doe",
    "input-number": "42",
    "input-decimal": "3.14",
    email: "john.doe@example.com",
    phone: "+1 (555) 123-4567",
    "long-text": "This is a sample long text response.",
  };
  return values[type] || "";
}

export function FormCanvas({
  fields,
  selectedFieldId,
  onFieldSelect,
  onFieldUpdate,
  onFieldDelete,
  previewMode,
  isTestMode,
  onLoadExample,
}: FormCanvasProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: "canvas",
  });

  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);

  const handleDoubleClick = (fieldId: string) => {
    setEditingFieldId(fieldId);
    onFieldSelect(fieldId);
  };

  const getPreviewWidth = () => {
    switch (previewMode) {
      case "mobile":
        return "max-w-sm";
      case "tablet":
        return "max-w-2xl";
      default:
        return "max-w-3xl";
    }
  };

  if (fields.length === 0) {
    const examples = [
      {
        id: "contact",
        title: "Contact Form",
        desc: "Name, Email, Phone, Message",
        icon: "📧",
      },
      {
        id: "survey",
        title: "Survey Form",
        desc: "Multiple choice questions and ratings",
        icon: "📊",
      },
      {
        id: "registration",
        title: "Registration Form",
        desc: "Sign up with personal details",
        icon: "📝",
      },
    ];

    return (
      <div className="h-full flex items-center justify-center p-8">
        <div
          ref={setNodeRef}
          className={cn(
            "w-full bg-white rounded-lg border-2 border-dashed p-12 transition-colors min-h-[400px] flex items-center justify-center",
            getPreviewWidth(),
            isOver ? "border-blue-500 bg-blue-50" : "border-gray-300",
          )}
        >
          <div className="text-center w-full max-w-2xl">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
              <Plus
                className={cn(
                  "h-8 w-8 transition-colors",
                  isOver ? "text-blue-500" : "text-gray-400",
                )}
              />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {isOver ? "Drop here to add field" : "Start Building Your Form"}
            </h3>
            <p className="text-gray-600 mb-2">
              Drag fields from the library or click to add them to your form
            </p>
            <p className="text-sm text-gray-500 mb-8">
              Or start with one of these templates:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
              {examples.map((example) => (
                <Card
                  key={example.id}
                  className="p-4 cursor-pointer hover:shadow-md transition-shadow hover:border-blue-300"
                  onClick={() => onLoadExample?.(example.id)}
                >
                  <div className="text-3xl mb-2">{example.icon}</div>
                  <h4 className="font-medium mb-1 text-gray-900">
                    {example.title}
                  </h4>
                  <p className="text-sm text-gray-500">{example.desc}</p>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex items-start justify-center p-8">
      <div
        ref={setNodeRef}
        className={cn(
          "w-full bg-white rounded-lg shadow-sm p-6 space-y-4 transition-all min-h-[400px]",
          getPreviewWidth(),
          isOver && "ring-2 ring-blue-500 ring-offset-2 bg-blue-50/50",
        )}
      >
        {fields.map((field) => (
          <SortableField
            key={field.id}
            field={field}
            isSelected={selectedFieldId === field.id}
            onSelect={() => onFieldSelect(field.id)}
            onUpdate={(updates) => onFieldUpdate(field.id, updates)}
            onDelete={() => onFieldDelete(field.id)}
            onDoubleClick={() => handleDoubleClick(field.id)}
            previewMode={previewMode}
            isTestMode={isTestMode}
          />
        ))}
        {isOver && (
          <div className="border-2 border-dashed border-blue-500 rounded-lg p-4 bg-blue-50 text-center text-sm text-blue-600 animate-pulse">
            Drop here to add field
          </div>
        )}
      </div>
    </div>
  );
}
