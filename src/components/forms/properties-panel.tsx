"use client";

import React, { useState } from "react";
import { FormField } from "@/hooks/use-form-builder";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ChevronDown, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface PropertiesPanelProps {
  field: FormField | null;
  onFieldUpdate: (id: string, updates: Partial<FormField>) => void;
  onFieldDelete: (id: string) => void;
  onClose: () => void;
}

export function PropertiesPanel({
  field,
  onFieldUpdate,
  onFieldDelete,
  onClose,
}: PropertiesPanelProps) {
  const [openSections, setOpenSections] = useState<Set<string>>(
    new Set(["general"]), // Only General open by default, advanced options collapsed
  );

  const toggleSection = (section: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  if (!field) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <p className="text-sm">Select a field to edit its properties</p>
      </div>
    );
  }

  const updateField = (updates: Partial<FormField>) => {
    onFieldUpdate(field.id, updates);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b flex items-center justify-between">
        <h3 className="font-semibold text-sm">Properties</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* General */}
        <Section
          title="General"
          isOpen={openSections.has("general")}
          onToggle={() => toggleSection("general")}
        >
          <div className="space-y-4">
            <div>
              <Label htmlFor="label" className="text-sm font-normal">
                Label
              </Label>
              <Input
                id="label"
                value={field.label}
                onChange={(e) => updateField({ label: e.target.value })}
                className="mt-1"
                placeholder="Field label"
              />
            </div>
            <div>
              <Label htmlFor="placeholder" className="text-sm font-normal">
                Placeholder
              </Label>
              <Input
                id="placeholder"
                value={field.placeholder || ""}
                onChange={(e) => updateField({ placeholder: e.target.value })}
                className="mt-1"
                placeholder="Enter placeholder text"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Text shown when the field is empty
              </p>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="required" className="text-sm font-normal">
                Required field
              </Label>
              <Switch
                id="required"
                checked={field.required || false}
                onCheckedChange={(checked) =>
                  updateField({ required: checked })
                }
              />
            </div>
            <div>
              <Label htmlFor="helpText" className="text-sm font-normal">
                Help text
              </Label>
              <Textarea
                id="helpText"
                value={field.helpText || ""}
                onChange={(e) => updateField({ helpText: e.target.value })}
                className="mt-1"
                rows={2}
                placeholder="Additional guidance for users"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Optional text shown below the field to help users
              </p>
            </div>
          </div>
        </Section>

        {/* Validation */}
        <Section
          title="Validation"
          isOpen={openSections.has("validation")}
          onToggle={() => toggleSection("validation")}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="min" className="text-sm font-normal">
                  Minimum value
                </Label>
                <Input
                  id="min"
                  type="number"
                  value={field.min || ""}
                  onChange={(e) =>
                    updateField({
                      min: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  className="mt-1"
                  placeholder="Min"
                />
              </div>
              <div>
                <Label htmlFor="max" className="text-sm font-normal">
                  Maximum value
                </Label>
                <Input
                  id="max"
                  type="number"
                  value={field.max || ""}
                  onChange={(e) =>
                    updateField({
                      max: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  className="mt-1"
                  placeholder="Max"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="regex" className="text-sm font-normal">
                Validation pattern (regex)
              </Label>
              <Input
                id="regex"
                value={field.regex || ""}
                onChange={(e) => updateField({ regex: e.target.value })}
                className="mt-1 font-mono text-xs"
                placeholder="^[A-Za-z]+$"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Regular expression pattern for validation
              </p>
            </div>
            <div>
              <Label htmlFor="errorMessage" className="text-sm font-normal">
                Custom error message
              </Label>
              <Input
                id="errorMessage"
                value={field.errorMessage || ""}
                onChange={(e) => updateField({ errorMessage: e.target.value })}
                className="mt-1"
                placeholder="This field is invalid"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Message shown when validation fails
              </p>
            </div>
          </div>
        </Section>

        {/* Logic */}
        <Section
          title="Logic"
          isOpen={openSections.has("logic")}
          onToggle={() => toggleSection("logic")}
        >
          <div className="space-y-4">
            <div>
              <Label htmlFor="showIf" className="text-sm font-normal">
                Show this field if...
              </Label>
              <Input
                id="showIf"
                value={field.showIf || ""}
                onChange={(e) => updateField({ showIf: e.target.value })}
                className="mt-1"
                placeholder="e.g., 'age' field is greater than 18"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Enter a condition in plain English. Example: "age field is greater than 18"
              </p>
            </div>
            <div>
              <Label htmlFor="hideIf" className="text-sm font-normal">
                Hide this field if...
              </Label>
              <Input
                id="hideIf"
                value={field.hideIf || ""}
                onChange={(e) => updateField({ hideIf: e.target.value })}
                className="mt-1"
                placeholder="e.g., 'newsletter' checkbox is checked"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Enter a condition in plain English. Example: "newsletter checkbox is checked"
              </p>
            </div>
            <div>
              <Label htmlFor="enableIf" className="text-sm font-normal">
                Enable this field if...
              </Label>
              <Input
                id="enableIf"
                value={field.enableIf || ""}
                onChange={(e) => updateField({ enableIf: e.target.value })}
                className="mt-1"
                placeholder="e.g., 'terms' checkbox is checked"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Enter a condition in plain English. Example: "terms checkbox is checked"
              </p>
            </div>
          </div>
        </Section>

        {/* Advanced */}
        <Section
          title="Advanced"
          isOpen={openSections.has("advanced")}
          onToggle={() => toggleSection("advanced")}
        >
          <div className="space-y-4">
            <div>
              <Label htmlFor="defaultValue" className="text-sm font-normal">
                Default value
              </Label>
              <Input
                id="defaultValue"
                value={field.defaultValue || ""}
                onChange={(e) => updateField({ defaultValue: e.target.value })}
                className="mt-1"
                placeholder="Pre-filled value"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Value shown when the form loads
              </p>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="readOnly" className="text-sm font-normal">
                Read-only field
              </Label>
              <Switch
                id="readOnly"
                checked={field.readOnly || false}
                onCheckedChange={(checked) =>
                  updateField({ readOnly: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="hidden" className="text-sm font-normal">
                Hidden field
              </Label>
              <Switch
                id="hidden"
                checked={field.hidden || false}
                onCheckedChange={(checked) => updateField({ hidden: checked })}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Field is hidden but still submitted
              </p>
            </div>
            <div>
              <Label htmlFor="fieldId" className="text-sm font-normal">
                Field ID
              </Label>
              <Input
                id="fieldId"
                value={field.fieldId || ""}
                onChange={(e) => updateField({ fieldId: e.target.value })}
                className="mt-1 font-mono text-xs"
                placeholder="unique-field-id"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Unique identifier for this field
              </p>
            </div>
            <div>
              <Label htmlFor="apiKey" className="text-sm font-normal">
                API key
              </Label>
              <Input
                id="apiKey"
                value={field.apiKey || ""}
                onChange={(e) => updateField({ apiKey: e.target.value })}
                className="mt-1 font-mono text-xs"
                placeholder="api_field_key"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Key used in API submissions (snake_case recommended)
              </p>
            </div>
          </div>
        </Section>

        {/* Delete Button */}
        <div className="pt-4 border-t">
          <Button
            variant="destructive"
            size="sm"
            className="w-full"
            onClick={() => {
              onFieldDelete(field.id);
              onClose();
            }}
          >
            Delete Field
          </Button>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  isOpen,
  onToggle,
  children,
}: {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 hover:bg-muted transition-colors"
      >
        <span className="text-sm font-medium text-foreground">{title}</span>
        {isOpen ? (
          <ChevronDown className="h-4 w-4 text-gray-400" />
        ) : (
          <ChevronRight className="h-4 w-4 text-gray-400" />
        )}
      </button>
      {isOpen && <div className="p-3 pt-0">{children}</div>}
    </div>
  );
}
