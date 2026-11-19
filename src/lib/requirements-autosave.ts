/**
 * Serialized, debounced autosave queue for requirements docs.
 * Pure logic — no React — so it can be unit-tested.
 */

export type RequirementsSaveStatus =
  | "saved"
  | "saving"
  | "unsaved"
  | "error"
  | "conflict";

export type RequirementActor = {
  id: number;
  name: string | null;
};

export type RequirementDocSnapshot = {
  markdown: string;
  version: number;
  updated_at: string;
  updated_by: RequirementActor | null;
};

export type RequirementsConflictError = {
  kind: "conflict";
  current: RequirementDocSnapshot;
};

export type RequirementsSaveError =
  | RequirementsConflictError
  | { kind: "error"; message: string };

export type RequirementsSaveFn = (
  markdown: string,
  baseVersion: number,
) => Promise<RequirementDocSnapshot>;

export type RequirementsAutosaveHandlers = {
  onStatus: (status: RequirementsSaveStatus) => void;
  onSaved: (doc: RequirementDocSnapshot) => void;
  onConflict: (
    current: RequirementDocSnapshot,
    localMarkdown: string,
  ) => void;
  onError: (message: string) => void;
};

export function isConflictSaveError(
  err: unknown,
): err is RequirementsConflictError {
  return (
    typeof err === "object" &&
    err !== null &&
    (err as RequirementsConflictError).kind === "conflict"
  );
}

export class RequirementsAutosaveQueue {
  private version: number;
  private lastSavedMarkdown: string;
  private draft: string;
  private inFlight = false;
  private pending: string | null = null;
  private paused = false;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private disposed = false;
  private idleWaiters: Array<() => void> = [];

  constructor(
    initial: RequirementDocSnapshot,
    private readonly saveFn: RequirementsSaveFn,
    private readonly handlers: RequirementsAutosaveHandlers,
    private readonly debounceMs = 2000,
  ) {
    this.version = initial.version;
    this.lastSavedMarkdown = initial.markdown;
    this.draft = initial.markdown;
  }

  getVersion(): number {
    return this.version;
  }

  getDraft(): string {
    return this.draft;
  }

  getLastSavedMarkdown(): string {
    return this.lastSavedMarkdown;
  }

  hasUnsavedChanges(): boolean {
    return this.draft !== this.lastSavedMarkdown;
  }

  isBusy(): boolean {
    return this.inFlight || this.pending != null || this.debounceTimer != null;
  }

  /** Replace editor content after conflict resolution. */
  adoptServerDoc(doc: RequirementDocSnapshot, markSaved = true): void {
    this.clearDebounce();
    this.pending = null;
    this.paused = false;
    this.version = doc.version;
    this.draft = doc.markdown;
    if (markSaved) {
      this.lastSavedMarkdown = doc.markdown;
      this.handlers.onStatus("saved");
    } else {
      this.handlers.onStatus(
        doc.markdown === this.lastSavedMarkdown ? "saved" : "unsaved",
      );
    }
    this.notifyIdle();
  }

  /** Keep local draft but resume autosave using a new base version from server. */
  resumeAfterConflictWithLocalDraft(serverVersion: number): void {
    this.paused = false;
    this.version = serverVersion;
    if (this.draft === this.lastSavedMarkdown) {
      this.handlers.onStatus("saved");
      this.notifyIdle();
      return;
    }
    this.handlers.onStatus("unsaved");
    this.schedule();
  }

  pause(): void {
    this.paused = true;
    this.clearDebounce();
    this.notifyIdle();
  }

  setDraft(markdown: string): void {
    if (this.disposed) return;
    this.draft = markdown;
    if (this.paused) {
      this.handlers.onStatus("conflict");
      return;
    }
    if (markdown === this.lastSavedMarkdown) {
      this.pending = null;
      this.clearDebounce();
      if (!this.inFlight) {
        this.handlers.onStatus("saved");
        this.notifyIdle();
      }
      return;
    }
    this.handlers.onStatus("unsaved");
    this.schedule();
  }

  /**
   * Cancel debounce and persist immediately.
   * If a PUT is already in flight, queues the latest draft and resolves when
   * the queue is idle. Returns false on dispose, conflict pause, or failed save.
   */
  async flush(): Promise<boolean> {
    if (this.disposed || this.paused) return false;
    this.clearDebounce();

    if (this.inFlight) {
      if (this.draft !== this.lastSavedMarkdown) {
        this.pending = this.draft;
      }
    } else if (
      this.draft !== this.lastSavedMarkdown ||
      this.pending != null
    ) {
      await this.runFlush();
    }

    await this.waitUntilIdle();
    this.clearDebounce();

    // Draft may have changed during the in-flight PUT; save once more immediately.
    if (
      !this.disposed &&
      !this.paused &&
      !this.inFlight &&
      this.draft !== this.lastSavedMarkdown
    ) {
      await this.runFlush();
      await this.waitUntilIdle();
    }

    if (this.disposed || this.paused) return false;
    return !this.hasUnsavedChanges();
  }

  async retry(): Promise<void> {
    if (this.disposed || this.paused) return;
    await this.flush();
  }

  dispose(): void {
    this.disposed = true;
    this.clearDebounce();
    this.pending = null;
    this.notifyIdle();
  }

  private schedule(): void {
    this.clearDebounce();
    this.debounceTimer = setTimeout(() => {
      this.debounceTimer = null;
      void this.runFlush();
    }, this.debounceMs);
  }

  private clearDebounce(): void {
    if (this.debounceTimer != null) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
  }

  private waitUntilIdle(): Promise<void> {
    if (!this.inFlight && this.pending == null) return Promise.resolve();
    return new Promise((resolve) => {
      this.idleWaiters.push(resolve);
    });
  }

  private notifyIdle(): void {
    if (this.inFlight || this.pending != null) return;
    const waiters = this.idleWaiters;
    this.idleWaiters = [];
    for (const resolve of waiters) resolve();
  }

  private async runFlush(): Promise<void> {
    if (this.disposed || this.paused) {
      this.notifyIdle();
      return;
    }

    const content = this.pending ?? this.draft;
    this.pending = null;

    if (content === this.lastSavedMarkdown) {
      if (!this.inFlight) {
        this.handlers.onStatus("saved");
        this.notifyIdle();
      }
      return;
    }

    if (this.inFlight) {
      this.pending = content;
      return;
    }

    this.inFlight = true;
    this.handlers.onStatus("saving");
    const baseVersion = this.version;

    try {
      const saved = await this.saveFn(content, baseVersion);
      if (this.disposed) {
        this.inFlight = false;
        this.notifyIdle();
        return;
      }
      this.version = saved.version;
      this.lastSavedMarkdown = saved.markdown;
      this.handlers.onSaved(saved);

      if (this.pending != null) {
        const next = this.pending;
        this.pending = null;
        this.inFlight = false;
        if (next !== this.lastSavedMarkdown) {
          this.pending = next;
          this.handlers.onStatus("unsaved");
          await this.runFlush();
          return;
        }
      }

      this.inFlight = false;
      if (this.draft !== this.lastSavedMarkdown) {
        this.handlers.onStatus("unsaved");
        this.schedule();
      } else {
        this.handlers.onStatus("saved");
      }
      this.notifyIdle();
    } catch (err) {
      this.inFlight = false;
      if (this.disposed) {
        this.notifyIdle();
        return;
      }

      if (isConflictSaveError(err)) {
        this.paused = true;
        this.clearDebounce();
        this.pending = null;
        this.handlers.onStatus("conflict");
        this.handlers.onConflict(err.current, content);
        this.notifyIdle();
        return;
      }

      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: unknown }).message)
          : "Failed to save";
      this.handlers.onStatus("error");
      this.handlers.onError(message);
      this.notifyIdle();
    }
  }
}
