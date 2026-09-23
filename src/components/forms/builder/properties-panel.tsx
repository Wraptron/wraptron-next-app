"use client";

import React from "react";
import { useFormBuilder } from "./form-builder-context";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import { FormField } from "@/types/form-builder";
import { MIN_FIELD_HEIGHT, MIN_FIELD_WIDTH } from "./field-resize-handles";

export function PropertiesPanel() {
  const { fields, selectedFieldId, updateField } = useFormBuilder();
  
  const selectedField = fields.find((f) => f.id === selectedFieldId);

  if (!selectedField) {
    return (
      <div className="flex h-full min-h-0 w-72 shrink-0 flex-col items-center justify-center overflow-hidden border-l bg-background p-6 text-center text-muted-foreground">
        <p>Select a field to edit its properties</p>
      </div>
    );
  }

  const handleUpdate = (updates: Partial<FormField>) => {
    updateField(selectedField.id, updates);
  };

  const isTextType = ["short-text", "long-text", "email", "phone"].includes(selectedField.type);
  const isChoiceType = ["radio", "checkbox", "dropdown"].includes(selectedField.type);
  const isNumberType = selectedField.type === "rating"; // Simplified

  return (
    <div className="flex h-full min-h-0 w-72 shrink-0 flex-col overflow-hidden border-l bg-background">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-1">
             <h2 className="font-semibold text-foreground">Properties</h2>
             <Badge variant="secondary" className="text-xs font-normal">
                {selectedField.type === "short-text"
                  ? "Input"
                  : selectedField.type === "long-text"
                    ? "Text area"
                    : selectedField.type.replace("-", " ")}
             </Badge>
        </div>
        <div className="text-xs text-muted-foreground font-mono">{selectedField.id}</div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4 space-y-6">
        {/* General Section - Always Visible */}
        <div className="space-y-4">
            <div className="space-y-1.5">
                <Label htmlFor="label">Label</Label>
                <Input 
                    id="label" 
                    value={selectedField.label} 
                    onChange={(e) => handleUpdate({ label: e.target.value })} 
                />
            </div>
            
            {isTextType && (
                 <div className="space-y-1.5">
                    <Label htmlFor="placeholder">Placeholder</Label>
                    <Input 
                        id="placeholder" 
                        value={selectedField.placeholder || ""} 
                        onChange={(e) => handleUpdate({ placeholder: e.target.value })} 
                    />
                </div>
            )}

            <div className="space-y-1.5">
                <Label htmlFor="helpText">Help text</Label>
                <Textarea 
                    id="helpText" 
                    value={selectedField.helpText || ""} 
                    onChange={(e) => handleUpdate({ helpText: e.target.value })} 
                    className="min-h-[80px]"
                />
            </div>

            <div className="flex items-center justify-between pt-2">
                <Label htmlFor="required" className="cursor-pointer">Required field</Label>
                <Switch 
                    id="required" 
                    checked={selectedField.required || false} 
                    onCheckedChange={(checked) => handleUpdate({ required: checked })}
                />
            </div>
        </div>

        <div className="space-y-3 border-t pt-4">
          <div className="flex items-center justify-between">
            <Label>Size</Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => handleUpdate({ width: undefined, height: undefined })}
            >
              Reset
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="field-width" className="text-xs text-muted-foreground">
                Width (px)
              </Label>
              <Input
                id="field-width"
                type="number"
                min={MIN_FIELD_WIDTH}
                placeholder="Auto"
                value={selectedField.width ?? ""}
                onChange={(e) => {
                  const value = e.target.value;
                  handleUpdate({
                    width: value === "" ? undefined : Number(value),
                  });
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="field-height" className="text-xs text-muted-foreground">
                Height (px)
              </Label>
              <Input
                id="field-height"
                type="number"
                min={MIN_FIELD_HEIGHT}
                placeholder="Auto"
                value={selectedField.height ?? ""}
                onChange={(e) => {
                  const value = e.target.value;
                  handleUpdate({
                    height: value === "" ? undefined : Number(value),
                  });
                }}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Drag any handle to resize this field. Other fields keep their own size and wrap beside it when there is room.
          </p>
        </div>

        {/* Options for Choices */}
        {isChoiceType && (
             <div className="space-y-3 pt-2 border-t">
                <Label>Options</Label>
                <div className="space-y-2">
                    {(selectedField.options || []).map((option, index) => (
                        <div key={index} className="flex gap-2">
                            <Input 
                                value={option} 
                                onChange={(e) => {
                                    const newOptions = [...(selectedField.options || [])];
                                    newOptions[index] = e.target.value;
                                    handleUpdate({ options: newOptions });
                                }}
                            />
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-9 w-9 text-muted-foreground hover:text-red-500"
                                onClick={() => {
                                    const newOptions = (selectedField.options || []).filter((_, i) => i !== index);
                                    handleUpdate({ options: newOptions });
                                }}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                    <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={() => {
                            const newOptions = [...(selectedField.options || []), `Option ${(selectedField.options?.length || 0) + 1}`];
                            handleUpdate({ options: newOptions });
                        }}
                    >
                        <Plus className="h-3 w-3 mr-2" /> Add Option
                    </Button>
                </div>
             </div>
        )}

        <Accordion type="multiple" className="w-full">
            {/* Validation */}
            <AccordionItem value="validation">
                <AccordionTrigger>Validation</AccordionTrigger>
                <AccordionContent className="space-y-4 pt-2">
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="min">Min {isTextType ? "Length" : "Value"}</Label>
                            <Input 
                                id="min" 
                                type="number"
                                value={selectedField.validation?.min || ""} 
                                onChange={(e) => handleUpdate({ validation: { ...selectedField.validation, min: parseInt(e.target.value) || undefined } })} 
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="max">Max {isTextType ? "Length" : "Value"}</Label>
                            <Input 
                                id="max" 
                                type="number"
                                value={selectedField.validation?.max || ""} 
                                onChange={(e) => handleUpdate({ validation: { ...selectedField.validation, max: parseInt(e.target.value) || undefined } })} 
                            />
                        </div>
                     </div>
                     <div className="space-y-1.5">
                        <Label htmlFor="regex">Regex Pattern</Label>
                        <Input 
                            id="regex" 
                            className="font-mono text-xs"
                            placeholder="^[a-zA-Z0-9]+$"
                            value={selectedField.validation?.regex || ""} 
                            onChange={(e) => handleUpdate({ validation: { ...selectedField.validation, regex: e.target.value } })} 
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="errorMessage">Error Message</Label>
                        <Input 
                            id="errorMessage" 
                            placeholder="Invalid input"
                            value={selectedField.validation?.errorMessage || ""} 
                            onChange={(e) => handleUpdate({ validation: { ...selectedField.validation, errorMessage: e.target.value } })} 
                        />
                    </div>
                </AccordionContent>
            </AccordionItem>

            {/* Logic */}
            <AccordionItem value="logic">
                <AccordionTrigger>Logic</AccordionTrigger>
                <AccordionContent className="space-y-4 pt-2">
                     <div className="p-3 bg-muted rounded text-sm text-muted-foreground">
                        <p>Configure visibility rules based on other field values.</p>
                     </div>
                     <Button variant="outline" size="sm" className="w-full">
                         Enable Logic
                     </Button>
                </AccordionContent>
            </AccordionItem>

            {/* Advanced */}
            <AccordionItem value="advanced">
                <AccordionTrigger>Advanced</AccordionTrigger>
                <AccordionContent className="space-y-4 pt-2">
                     <div className="space-y-1.5">
                        <Label htmlFor="defaultValue">Default Value</Label>
                        <Input 
                            id="defaultValue" 
                            value={selectedField.defaultValue || ""} 
                            onChange={(e) => handleUpdate({ defaultValue: e.target.value })} 
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="fieldId">Field ID / API Key</Label>
                        <Input 
                            id="fieldId" 
                            value={selectedField.fieldId || selectedField.id} 
                            readOnly
                            className="bg-muted font-mono text-xs"
                        />
                        <p className="text-[10px] text-gray-400">Used for API submissions</p>
                    </div>
                     <div className="flex items-center justify-between">
                        <Label htmlFor="hidden">Hidden field</Label>
                        <Switch 
                            id="hidden" 
                            checked={selectedField.hidden || false} 
                            onCheckedChange={(checked) => handleUpdate({ hidden: checked })}
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <Label htmlFor="readOnly">Read-only</Label>
                        <Switch 
                            id="readOnly" 
                            checked={selectedField.readOnly || false} 
                            onCheckedChange={(checked) => handleUpdate({ readOnly: checked })}
                        />
                    </div>
                </AccordionContent>
            </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
}
