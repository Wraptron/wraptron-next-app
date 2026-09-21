"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { FormField, FieldType } from "@/types/form-builder";
import { publishedFormUrl } from "@/lib/formfield-publish";
import { ApiError, formsApi, type FormRecord } from "@/lib/api";

const STORAGE_KEY = "wraptron-formfield-draft";

function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

function defaultLabel(type: FieldType): string {
  switch (type) {
    case "section":
      return "New Section";
    case "email":
      return "Email Address";
    case "phone":
      return "Phone Number";
    case "short-text":
      return "Input";
    case "long-text":
      return "Text area";
    case "radio":
      return "Multiple Choice";
    case "checkbox":
      return "Checkboxes";
    case "dropdown":
      return "Dropdown";
    case "file-upload":
      return "File Upload";
    case "date-time":
      return "Date";
    case "rating":
      return "Rating";
    case "conditional":
      return "Conditional Block";
    case "calculated":
      return "Calculated Value";
    case "spacer":
    case "divider":
      return "";
    default:
      return "New Field";
  }
}

type DraftCache = {
  formId?: number;
  title?: string;
  fields?: FormField[];
  publishedId?: string;
  lastPublishedAt?: number;
};

function readDraftCache(): DraftCache | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DraftCache;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function writeDraftCache(draft: DraftCache) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
}

function fieldsFromRecord(record: FormRecord): FormField[] {
  return Array.isArray(record.fields) ? (record.fields as FormField[]) : [];
}

interface FormBuilderContextType {
  fields: FormField[];
  selectedFieldId: string | null;
  deviceMode: "desktop" | "mobile" | "tablet";
  formTitle: string;
  previewMode: boolean;
  addField: (type: FieldType, index?: number) => void;
  updateField: (id: string, updates: Partial<FormField>) => void;
  updateFields: (patch: Record<string, Partial<FormField>>) => void;
  deleteField: (id: string) => void;
  selectField: (id: string | null) => void;
  moveField: (dragIndex: number, hoverIndex: number) => void;
  setDeviceMode: (mode: "desktop" | "mobile" | "tablet") => void;
  setFormTitle: (title: string) => void;
  setPreviewMode: (preview: boolean) => void;
  saveDraft: () => Promise<boolean>;
  publishForm: () => Promise<string | null>;
  publishedId: string | null;
  lastPublishedAt: number | null;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  lastSavedAt: number | null;
  isReady: boolean;
}

const FormBuilderContext = createContext<FormBuilderContextType | undefined>(
  undefined,
);

export function useFormBuilder() {
  const context = useContext(FormBuilderContext);
  if (!context) {
    throw new Error("useFormBuilder must be used within a FormBuilderProvider");
  }
  return context;
}

export function FormBuilderProvider({ children }: { children: React.ReactNode }) {
  const [fields, setFields] = useState<FormField[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [deviceMode, setDeviceMode] = useState<"desktop" | "mobile" | "tablet">(
    "desktop",
  );
  const [formTitle, setFormTitleState] = useState("Untitled Form");
  const [previewMode, setPreviewModeState] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [formId, setFormId] = useState<number | null>(null);
  const [publishedId, setPublishedId] = useState<string | null>(null);
  const [lastPublishedAt, setLastPublishedAt] = useState<number | null>(null);
  const [isReady, setIsReady] = useState(false);

  const [history, setHistory] = useState<FormField[][]>([]);
  const [future, setFuture] = useState<FormField[][]>([]);

  const draftRef = React.useRef({
    formId,
    formTitle,
    fields,
    publishedId,
    lastPublishedAt,
  });
  draftRef.current = {
    formId,
    formTitle,
    fields,
    publishedId,
    lastPublishedAt,
  };

  const applyRecord = useCallback((record: FormRecord) => {
    setFormId(record.id);
    setFormTitleState(record.title?.trim() || "Untitled Form");
    setFields(fieldsFromRecord(record));
    setPublishedId(record.public_id);
    if (record.published) {
      setLastPublishedAt(new Date(record.updated_at).getTime());
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const hydrate = async () => {
      const cached = readDraftCache();

      try {
        let record: FormRecord | null = null;
        if (cached?.formId) {
          try {
            record = await formsApi.get(cached.formId);
          } catch (error) {
            if (!(error instanceof ApiError) || error.status !== 404) {
              throw error;
            }
          }
        }
        if (!record) {
          const listed = await formsApi.list({ limit: 1 });
          record = listed.data[0] ?? null;
        }
        if (!cancelled && record) {
          applyRecord(record);
          writeDraftCache({
            formId: record.id,
            title: record.title,
            fields: fieldsFromRecord(record),
            publishedId: record.public_id,
            lastPublishedAt: record.published
              ? new Date(record.updated_at).getTime()
              : undefined,
          });
          return;
        }
      } catch (error) {
        console.error("Failed to load form from database", error);
      }

      if (cancelled || !cached) return;
      if (typeof cached.formId === "number") setFormId(cached.formId);
      if (typeof cached.title === "string" && cached.title.trim()) {
        setFormTitleState(cached.title);
      }
      if (Array.isArray(cached.fields)) setFields(cached.fields);
      if (typeof cached.publishedId === "string") {
        setPublishedId(cached.publishedId);
      }
      if (typeof cached.lastPublishedAt === "number") {
        setLastPublishedAt(cached.lastPublishedAt);
      }
    };

    void hydrate().finally(() => {
      if (!cancelled) setIsReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, [applyRecord]);

  const saveToHistory = useCallback((currentFields: FormField[]) => {
    setHistory((prev) => [...prev, currentFields]);
    setFuture([]);
  }, []);

  const addField = useCallback(
    (type: FieldType, index?: number) => {
      saveToHistory(fields);

      const newField: FormField = {
        id: generateId(),
        type,
        label: defaultLabel(type),
        required: false,
        options:
          type === "radio" || type === "dropdown" || type === "checkbox"
            ? ["Option 1", "Option 2", "Option 3"]
            : undefined,
        validation: type === "rating" ? { min: 1, max: 5 } : undefined,
      };

      setFields((prev) => {
        const next = [...prev];
        if (typeof index === "number" && index >= 0) {
          next.splice(index, 0, newField);
        } else {
          next.push(newField);
        }
        return next;
      });

      setSelectedFieldId(newField.id);
    },
    [fields, saveToHistory],
  );

  const updateField = useCallback((id: string, updates: Partial<FormField>) => {
    setFields((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...updates } : f)),
    );
  }, []);

  const updateFields = useCallback(
    (patch: Record<string, Partial<FormField>>) => {
      setFields((prev) =>
        prev.map((f) => (patch[f.id] ? { ...f, ...patch[f.id] } : f)),
      );
    },
    [],
  );

  const deleteField = useCallback(
    (id: string) => {
      saveToHistory(fields);
      setFields((prev) => prev.filter((f) => f.id !== id));
      if (selectedFieldId === id) setSelectedFieldId(null);
    },
    [fields, selectedFieldId, saveToHistory],
  );

  const selectField = useCallback((id: string | null) => {
    setSelectedFieldId(id);
  }, []);

  const moveField = useCallback((dragIndex: number, hoverIndex: number) => {
    setFields((prev) => {
      const next = [...prev];
      const [dragged] = next.splice(dragIndex, 1);
      next.splice(hoverIndex, 0, dragged);
      return next;
    });
  }, []);

  const setFormTitle = useCallback((title: string) => {
    setFormTitleState(title);
  }, []);

  const setPreviewMode = useCallback((preview: boolean) => {
    setPreviewModeState(preview);
    if (preview) setSelectedFieldId(null);
  }, []);

  const persistCache = useCallback(
    (overrides?: Partial<DraftCache> & { formId?: number | null }) => {
      const snapshot = draftRef.current;
      writeDraftCache({
        formId: overrides?.formId ?? snapshot.formId ?? undefined,
        title: overrides?.title ?? snapshot.formTitle,
        fields: overrides?.fields ?? snapshot.fields,
        publishedId: overrides?.publishedId ?? snapshot.publishedId ?? undefined,
        lastPublishedAt:
          overrides?.lastPublishedAt ?? snapshot.lastPublishedAt ?? undefined,
      });
    },
    [],
  );

  const saveDraft = useCallback(async () => {
    const snapshot = draftRef.current;
    const title = snapshot.formTitle.trim() || "Untitled Form";
    const payload = { title, fields: snapshot.fields };

    try {
      persistCache({ title, fields: snapshot.fields });
    } catch (error) {
      console.error("Failed to cache Formfield draft", error);
    }

    try {
      let record: FormRecord;
      if (snapshot.formId) {
        try {
          record = await formsApi.update(snapshot.formId, payload);
        } catch (error) {
          if (!(error instanceof ApiError) || error.status !== 404) {
            throw error;
          }
          record = await formsApi.create(payload);
        }
      } else {
        record = await formsApi.create(payload);
      }
      setFormId(record.id);
      setPublishedId(record.public_id);
      persistCache({
        formId: record.id,
        title: record.title,
        fields: fieldsFromRecord(record),
        publishedId: record.public_id,
      });
      setLastSavedAt(Date.now());
      return true;
    } catch (error) {
      console.error("Failed to save form to database", error);
      return false;
    }
  }, [persistCache]);

  const publishForm = useCallback(async () => {
    const snapshot = draftRef.current;
    const fillable = snapshot.fields.filter(
      (field) =>
        field.type !== "spacer" &&
        field.type !== "divider" &&
        field.type !== "section",
    );
    if (fillable.length === 0) return null;

    const title = snapshot.formTitle.trim() || "Untitled Form";
    const payload = { title, fields: snapshot.fields };
    let id = snapshot.formId;
    if (!id) {
      const created = await formsApi.create(payload);
      id = created.id;
      setFormId(created.id);
      setPublishedId(created.public_id);
    }
    const record = await formsApi.publish(id, payload);
    const publishedAt = Date.now();
    setFormId(record.id);
    setPublishedId(record.public_id);
    setLastPublishedAt(publishedAt);
    setLastSavedAt(publishedAt);
    persistCache({
      formId: record.id,
      title: record.title,
      fields: fieldsFromRecord(record),
      publishedId: record.public_id,
      lastPublishedAt: publishedAt,
    });
    return publishedFormUrl(record.public_id);
  }, [persistCache]);

  const undo = useCallback(() => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setFuture((prev) => [fields, ...prev]);
    setFields(previous);
    setHistory((prev) => prev.slice(0, prev.length - 1));
  }, [fields, history]);

  const redo = useCallback(() => {
    if (future.length === 0) return;
    const next = future[0];
    setHistory((prev) => [...prev, fields]);
    setFields(next);
    setFuture((prev) => prev.slice(1));
  }, [fields, future]);

  return (
    <FormBuilderContext.Provider
      value={{
        fields,
        selectedFieldId,
        deviceMode,
        formTitle,
        previewMode,
        addField,
        updateField,
        updateFields,
        deleteField,
        selectField,
        moveField,
        setDeviceMode,
        setFormTitle,
        setPreviewMode,
        saveDraft,
        publishForm,
        publishedId,
        lastPublishedAt,
        undo,
        redo,
        canUndo: history.length > 0,
        canRedo: future.length > 0,
        lastSavedAt,
        isReady,
      }}
    >
      {children}
    </FormBuilderContext.Provider>
  );
}
