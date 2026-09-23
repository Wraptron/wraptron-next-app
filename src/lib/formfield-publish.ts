import { FormField } from "@/types/form-builder";

const PUBLISHED_KEY = "wraptron-formfield-published";

export type PublishedForm = {
  id: string;
  title: string;
  fields: FormField[];
  publishedAt: string;
};

function readPublished(): Record<string, PublishedForm> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(PUBLISHED_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, PublishedForm>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writePublished(map: Record<string, PublishedForm>) {
  localStorage.setItem(PUBLISHED_KEY, JSON.stringify(map));
}

export function generatePublishId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID().replace(/-/g, "").slice(0, 10);
  }
  return Math.random().toString(36).slice(2, 12);
}

export function getPublishedForm(id: string): PublishedForm | null {
  const map = readPublished();
  return map[id] ?? null;
}

export function upsertPublishedForm(form: PublishedForm) {
  const map = readPublished();
  map[form.id] = form;
  writePublished(map);
}

export function publishedFormUrl(id: string) {
  if (typeof window === "undefined") return `/formfield/f/${id}`;
  return `${window.location.origin}/formfield/f/${id}`;
}
