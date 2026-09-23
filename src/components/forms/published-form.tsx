"use client";

import { useMemo, useState } from "react";
import { FormField } from "@/types/form-builder";
import type { PublishedForm } from "@/lib/formfield-publish";
import { FIELD_GAP } from "@/components/forms/builder/field-layout";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Star, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

function FillableField({
  field,
  value,
  onChange,
}: {
  field: FormField;
  value: string;
  onChange: (value: string) => void;
}) {
  const inputType =
    field.type === "email" ? "email" : field.type === "phone" ? "tel" : "text";
  const ratingMax = field.validation?.max || 5;
  const selectedRating = Number(value) || 0;
  const selectedChecks = value ? value.split("\n") : [];

  const control = (() => {
    switch (field.type) {
      case "short-text":
      case "email":
      case "phone":
      case "calculated":
        return (
          <Input
            type={inputType}
            name={field.id}
            placeholder={field.placeholder}
            required={field.required}
            readOnly={field.readOnly}
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        );
      case "long-text":
        return (
          <Textarea
            name={field.id}
            placeholder={field.placeholder}
            required={field.required}
            readOnly={field.readOnly}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="min-h-24"
          />
        );
      case "radio":
        return (
          <RadioGroup
            value={value}
            onValueChange={onChange}
            required={field.required}
          >
            {(field.options || []).map((opt) => (
              <div key={opt} className="flex items-center space-x-2">
                <RadioGroupItem value={opt} id={`${field.id}-${opt}`} />
                <Label htmlFor={`${field.id}-${opt}`}>{opt}</Label>
              </div>
            ))}
          </RadioGroup>
        );
      case "checkbox":
        return (
          <div className="space-y-2">
            {(field.options || []).map((opt) => (
              <div key={opt} className="flex items-center space-x-2">
                <Checkbox
                  id={`${field.id}-${opt}`}
                  checked={selectedChecks.includes(opt)}
                  onCheckedChange={(checked) => {
                    const next = checked
                      ? [...selectedChecks, opt]
                      : selectedChecks.filter((item) => item !== opt);
                    onChange(next.join("\n"));
                  }}
                />
                <Label htmlFor={`${field.id}-${opt}`}>{opt}</Label>
              </div>
            ))}
          </div>
        );
      case "dropdown":
        return (
          <Select value={value} onValueChange={onChange} required={field.required}>
            <SelectTrigger>
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              {(field.options || []).map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case "file-upload":
        return (
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/40 px-4 py-8 text-sm text-muted-foreground hover:bg-muted">
            <Upload className="h-5 w-5" />
            {field.placeholder || "Click or drop a file"}
            <input type="file" className="sr-only" name={field.id} />
          </label>
        );
      case "date-time":
        return (
          <Input
            type="datetime-local"
            name={field.id}
            required={field.required}
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        );
      case "rating":
        return (
          <div className="flex items-center gap-1">
            {Array.from({ length: ratingMax }, (_, i) => {
              const score = i + 1;
              return (
                <button
                  key={score}
                  type="button"
                  onClick={() => onChange(String(score))}
                  aria-label={`${score} star${score === 1 ? "" : "s"}`}
                >
                  <Star
                    className="h-6 w-6 text-amber-400"
                    fill={score <= selectedRating ? "currentColor" : "none"}
                  />
                </button>
              );
            })}
          </div>
        );
      case "section":
        return null;
      case "divider":
        return <hr className="border-border" />;
      case "spacer":
        return <div className="h-8" />;
      case "conditional":
        return (
          <Input
            name={field.id}
            placeholder={field.placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        );
      default:
        return null;
    }
  })();

  if (field.type === "section") {
    return (
      <div className="w-full py-2">
        <h2 className="text-2xl font-bold">{field.label}</h2>
        {field.helpText ? (
          <p className="mt-1 text-muted-foreground">{field.helpText}</p>
        ) : null}
        <hr className="mt-2 border-border" />
      </div>
    );
  }

  return (
    <div
      className="space-y-2"
      style={{
        width: field.width ? field.width : "100%",
        maxWidth: "100%",
        height: field.height,
      }}
    >
      {field.type !== "divider" && field.type !== "spacer" ? (
        <Label>
          {field.label}
          {field.required ? <span className="ml-0.5 text-red-500">*</span> : null}
        </Label>
      ) : null}
      {control}
      {field.helpText ? (
        <p className="text-xs text-muted-foreground">{field.helpText}</p>
      ) : null}
    </div>
  );
}

export function PublishedFormView({
  form,
  onSubmit,
}: {
  form: PublishedForm;
  onSubmit?: (values: Record<string, string>) => Promise<void>;
}) {
  const initial = useMemo(() => {
    const next: Record<string, string> = {};
    for (const field of form.fields) {
      next[field.id] = field.defaultValue ?? "";
    }
    return next;
  }, [form.fields]);
  const [values, setValues] = useState<Record<string, string>>(initial);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitError(null);
    setSubmitting(true);
    try {
      if (onSubmit) {
        await onSubmit(values);
      }
      setSubmitted(true);
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Could not submit the form. Try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="mx-auto max-w-xl space-y-3 py-16 text-center">
        <h1 className="text-2xl font-semibold">Thanks for submitting</h1>
        <p className="text-muted-foreground">
          Your response to {form.title} was recorded.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto w-full max-w-3xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{form.title}</h1>
        <p className="text-sm text-muted-foreground">Fill out the form and submit.</p>
      </div>
      <div className="flex flex-wrap content-start items-start" style={{ gap: FIELD_GAP }}>
        {form.fields.map((field) => (
          <FillableField
            key={field.id}
            field={field}
            value={values[field.id] ?? ""}
            onChange={(value) =>
              setValues((prev) => ({ ...prev, [field.id]: value }))
            }
          />
        ))}
      </div>
      {submitError ? (
        <p className="text-sm text-destructive">{submitError}</p>
      ) : null}
      <Button type="submit" disabled={submitting}>
        {submitting ? "Submitting…" : "Submit"}
      </Button>
    </form>
  );
}
