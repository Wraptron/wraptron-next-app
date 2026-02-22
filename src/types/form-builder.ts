
import { LucideIcon } from "lucide-react";

export type FieldCategory = "Basic" | "Choices" | "Advanced" | "Layout" | "Logic";

export type FieldType = 
  | "short-text" 
  | "long-text" 
  | "email" 
  | "phone"
  | "radio" 
  | "checkbox" 
  | "dropdown"
  | "file-upload" 
  | "date-time" 
  | "rating"
  | "section" 
  | "divider" 
  | "spacer"
  | "conditional" 
  | "calculated";

export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  required?: boolean;
  helpText?: string;
  defaultValue?: string;
  options?: string[]; 
  hidden?: boolean;
  readOnly?: boolean;
  fieldId?: string; // API key
  validation?: {
    min?: number;
    max?: number;
    regex?: string;
    errorMessage?: string;
  };
}

export interface LibraryItem {
  type: FieldType;
  label: string;
  icon: LucideIcon;
  category: FieldCategory;
}
