"use client";

import { useState, useCallback, useRef, useEffect } from "react";

export type FieldType =
  | "input-string"
  | "input-number"
  | "input-decimal"
  | "long-text"
  | "email"
  | "phone"
  | "radio"
  | "checkbox"
  | "dropdown"
  | "file-upload"
  | "date-time"
  | "rating-scale"
  | "section"
  | "divider"
  | "spacer"
  | "conditional-block"
  | "calculated-field";

export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  required?: boolean;
  helpText?: string;
  // Validation
  min?: number;
  max?: number;
  regex?: string;
  errorMessage?: string;
  // Logic
  showIf?: string;
  hideIf?: string;
  enableIf?: string;
  // Advanced
  defaultValue?: string;
  readOnly?: boolean;
  hidden?: boolean;
  fieldId?: string;
  apiKey?: string;
  // Field-specific
  options?: string[]; // For radio, checkbox, dropdown
  scale?: number; // For rating-scale
}

interface HistoryState {
  fields: FormField[];
  timestamp: number;
}

export function useFormBuilder() {
  const [fields, setFields] = useState<FormField[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const historyRef = useRef<HistoryState[]>([]);
  const historyIndexRef = useRef<number>(-1);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const saveToHistory = useCallback((newFields: FormField[]) => {
    const newState: HistoryState = {
      fields: JSON.parse(JSON.stringify(newFields)),
      timestamp: Date.now(),
    };

    // Remove any future history if we're not at the end
    historyRef.current = historyRef.current.slice(
      0,
      historyIndexRef.current + 1,
    );
    historyRef.current.push(newState);
    historyIndexRef.current = historyRef.current.length - 1;

    // Limit history to 50 states
    if (historyRef.current.length > 50) {
      historyRef.current.shift();
      historyIndexRef.current--;
    }
  }, []);

  const addField = useCallback(
    (type: FieldType, insertAfterId?: string) => {
      setFields((prev) => {
        const newField: FormField = {
          id: `field-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type,
          label: getDefaultLabel(type),
          ...getDefaultProps(type),
        };

        if (insertAfterId) {
          const index = prev.findIndex((f) => f.id === insertAfterId);
          const newFields = [...prev];
          newFields.splice(index + 1, 0, newField);
          saveToHistory(newFields);
          return newFields;
        }

        const newFields = [...prev, newField];
        saveToHistory(newFields);
        return newFields;
      });
    },
    [saveToHistory],
  );

  const updateField = useCallback(
    (id: string, updates: Partial<FormField>) => {
      setFields((prev) => {
        const newFields = prev.map((field) =>
          field.id === id ? { ...field, ...updates } : field,
        );
        saveToHistory(newFields);
        
        // Auto-save after 2 seconds of inactivity
        if (autoSaveTimeoutRef.current) {
          clearTimeout(autoSaveTimeoutRef.current);
        }
        autoSaveTimeoutRef.current = setTimeout(async () => {
          setIsAutoSaving(true);
          await new Promise((resolve) => setTimeout(resolve, 300));
          setLastSaved(new Date());
          setIsAutoSaving(false);
        }, 2000);
        
        return newFields;
      });
    },
    [saveToHistory],
  );

  const deleteField = useCallback(
    (id: string) => {
      setFields((prev) => {
        const newFields = prev.filter((field) => field.id !== id);
        saveToHistory(newFields);
        if (selectedFieldId === id) {
          setSelectedFieldId(null);
        }
        return newFields;
      });
    },
    [selectedFieldId],
  );

  const reorderFields = useCallback(
    (oldIndex: number, newIndex: number) => {
      setFields((prev) => {
        const newFields = [...prev];
        const [moved] = newFields.splice(oldIndex, 1);
        newFields.splice(newIndex, 0, moved);
        saveToHistory(newFields);
        return newFields;
      });
    },
    [saveToHistory],
  );

  const selectField = useCallback((id: string | null) => {
    setSelectedFieldId(id);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedFieldId(null);
  }, []);

  const undo = useCallback(() => {
    if (historyIndexRef.current > 0) {
      historyIndexRef.current--;
      const state = historyRef.current[historyIndexRef.current];
      setFields(state.fields);
    }
  }, []);

  const redo = useCallback(() => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyIndexRef.current++;
      const state = historyRef.current[historyIndexRef.current];
      setFields(state.fields);
    }
  }, []);

  const saveForm = useCallback(async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));
    setLastSaved(new Date());
    setIsSaving(false);
  }, []);

  const loadExampleForm = useCallback(
    (exampleType: string) => {
      const examples: Record<string, FormField[]> = {
        contact: [
          {
            id: "field-1",
            type: "input-string",
            label: "Full Name",
            placeholder: "Enter your full name",
            required: true,
          },
          {
            id: "field-2",
            type: "email",
            label: "Email Address",
            placeholder: "your.email@example.com",
            required: true,
          },
          {
            id: "field-3",
            type: "phone",
            label: "Phone Number",
            placeholder: "+1 (555) 123-4567",
          },
          {
            id: "field-4",
            type: "long-text",
            label: "Message",
            placeholder: "Enter your message here...",
            required: true,
          },
        ],
        survey: [
          {
            id: "field-1",
            type: "input-string",
            label: "What is your name?",
            required: true,
          },
          {
            id: "field-2",
            type: "radio",
            label: "How satisfied are you?",
            options: ["Very Satisfied", "Satisfied", "Neutral", "Dissatisfied"],
            required: true,
          },
          {
            id: "field-3",
            type: "checkbox",
            label: "Which features do you use?",
            options: ["Feature A", "Feature B", "Feature C", "Feature D"],
          },
          {
            id: "field-4",
            type: "rating-scale",
            label: "Rate your experience",
            scale: 5,
            required: true,
          },
          {
            id: "field-5",
            type: "long-text",
            label: "Additional Comments",
            placeholder: "Share any additional thoughts...",
          },
        ],
        registration: [
          {
            id: "field-1",
            type: "input-string",
            label: "First Name",
            required: true,
          },
          {
            id: "field-2",
            type: "input-string",
            label: "Last Name",
            required: true,
          },
          {
            id: "field-3",
            type: "email",
            label: "Email",
            required: true,
          },
          {
            id: "field-4",
            type: "input-string",
            label: "Username",
            placeholder: "Choose a username",
            required: true,
          },
          {
            id: "field-5",
            type: "dropdown",
            label: "Country",
            options: ["United States", "Canada", "United Kingdom", "Australia"],
            required: true,
          },
        ],
      };

      const exampleFields = examples[exampleType] || [];
      if (exampleFields.length > 0) {
        const newFields = exampleFields.map((field) => ({
          ...field,
          id: `field-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        }));
        setFields(newFields);
        saveToHistory(newFields);
      }
    },
    [saveToHistory],
  );

  const setFieldsDirectly = useCallback(
    (newFields: FormField[]) => {
      setFields(newFields);
      saveToHistory(newFields);
    },
    [saveToHistory],
  );

  // Initialize history
  useEffect(() => {
    if (historyRef.current.length === 0) {
      saveToHistory(fields);
    }
  }, []);

  // Cleanup autosave timeout on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  return {
    formFields: fields,
    selectedField: fields.find((f) => f.id === selectedFieldId) || null,
    addField,
    updateField,
    deleteField,
    reorderFields,
    selectField,
    clearSelection,
    undo,
    redo,
    canUndo: historyIndexRef.current > 0,
    canRedo: historyIndexRef.current < historyRef.current.length - 1,
    saveForm,
    isSaving,
    isAutoSaving,
    lastSaved,
    loadExampleForm,
    setFieldsDirectly,
  };
}

function getDefaultLabel(type: FieldType): string {
  const labels: Record<FieldType, string> = {
    "input-string": "Text Input",
    "input-number": "Number Input",
    "input-decimal": "Decimal Input",
    "long-text": "Long Text",
    email: "Email",
    phone: "Phone",
    radio: "Radio",
    checkbox: "Checkbox",
    dropdown: "Dropdown",
    "file-upload": "File Upload",
    "date-time": "Date / Time",
    "rating-scale": "Rating / Scale",
    section: "Section",
    divider: "Divider",
    spacer: "Spacer",
    "conditional-block": "Conditional Block",
    "calculated-field": "Calculated Field",
  };
  return labels[type];
}

function getDefaultProps(type: FieldType): Partial<FormField> {
  switch (type) {
    case "radio":
    case "checkbox":
    case "dropdown":
      return { options: ["Option 1", "Option 2"] };
    case "rating-scale":
      return { scale: 5 };
    default:
      return {};
  }
}
