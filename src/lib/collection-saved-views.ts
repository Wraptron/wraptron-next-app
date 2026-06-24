import type { CollectionFilterState } from "@/lib/collection-filter-definitions";
import type { CollectionFilterResource } from "@/lib/collection-filter-definitions";

const STORAGE_KEY = "wraptron:collection-saved-views:v1";

export type CollectionSavedViewSource = "local" | "remote";

export type CollectionSavedView = {
  id: string;
  name: string;
  resource: CollectionFilterResource;
  filterState: CollectionFilterState;
  source: CollectionSavedViewSource;
  remoteId?: number;
  updatedAt: string;
};

type StoredViewsFile = Record<string, CollectionSavedView[]>;

function readStorage(): StoredViewsFile {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as StoredViewsFile;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeStorage(data: StoredViewsFile): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function storageKey(resource: CollectionFilterResource): string {
  return resource;
}

export function listLocalSavedViews(
  resource: CollectionFilterResource,
): CollectionSavedView[] {
  const all = readStorage();
  return all[storageKey(resource)] ?? [];
}

export function saveLocalSavedView(view: CollectionSavedView): CollectionSavedView {
  const all = readStorage();
  const key = storageKey(view.resource);
  const existing = all[key] ?? [];
  const withoutSame = existing.filter(
    (item) => item.name.toLowerCase() !== view.name.toLowerCase(),
  );
  const next = [view, ...withoutSame].sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt),
  );
  all[key] = next;
  writeStorage(all);
  return view;
}

export function deleteLocalSavedView(
  resource: CollectionFilterResource,
  id: string,
): void {
  const all = readStorage();
  const key = storageKey(resource);
  all[key] = (all[key] ?? []).filter((item) => item.id !== id);
  writeStorage(all);
}

export function createLocalSavedViewId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function mergeSavedViews(
  local: CollectionSavedView[],
  remote: CollectionSavedView[],
): CollectionSavedView[] {
  const byName = new Map<string, CollectionSavedView>();

  for (const view of local) {
    byName.set(view.name.toLowerCase(), view);
  }

  for (const view of remote) {
    const key = view.name.toLowerCase();
    const existing = byName.get(key);
    if (!existing || view.updatedAt >= existing.updatedAt) {
      byName.set(key, view);
    }
  }

  return Array.from(byName.values()).sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt),
  );
}
