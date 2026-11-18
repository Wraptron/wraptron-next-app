"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Download,
  Eye,
  EyeOff,
  Loader2,
  Maximize2,
  Save,
} from "lucide-react";
import {
  ApiError,
  getApiErrorMessage,
  requirementsApi,
  type RequirementConflictPayload,
  type RequirementDoc,
} from "@/lib/api";
import {
  RequirementsAutosaveQueue,
  type RequirementDocSnapshot,
  type RequirementsSaveStatus,
} from "@/lib/requirements-autosave";
import {
  isMarkdownWithinLimit,
  utf8ByteLength,
  REQUIREMENT_MARKDOWN_MAX_BYTES,
} from "@/lib/requirements-limits";
import {
  canExportRequirementsPdf,
  downloadRequirementsPdf,
  requirementsPdfDocumentTitle,
} from "@/lib/requirements-print";
import {
  persistViewMode,
  readPersistedViewMode,
  togglePreviewMode,
  type RequirementsPersistedViewMode,
  type RequirementsViewMode,
} from "@/lib/requirements-view-mode";
import { useOrganization } from "@/contexts/organization-context";
import { buildNavAccess, hasPermission } from "@/lib/nav-access";
import { cn } from "@/lib/utils";
import { MarkdownEditor } from "./markdown-editor";
import { MarkdownPreview } from "./markdown-preview";
import { SaveStatus } from "./save-status";
import { ConflictDialog } from "./conflict-dialog";
import { PreviewFullscreen } from "./preview-fullscreen";

type RequirementsTabProps = {
  projectId: number;
  projectName: string;
};

const EDITOR_SHELL =
  "flex min-h-[360px] h-[calc(100vh-14rem)] flex-col overflow-hidden";

function toSnapshot(doc: RequirementDoc): RequirementDocSnapshot {
  return {
    markdown: doc.markdown ?? "",
    version: doc.version,
    updated_at: doc.updated_at,
    updated_by: doc.updated_by,
  };
}

function isConflictPayload(
  data: unknown,
): data is RequirementConflictPayload {
  if (!data || typeof data !== "object") return false;
  const d = data as RequirementConflictPayload;
  return !!d.current && typeof d.current.version === "number";
}

function useIsMobile(breakpointPx = 768) {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpointPx - 1}px)`);
    const apply = () => setMobile(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [breakpointPx]);
  return mobile;
}

export function RequirementsTab({
  projectId,
  projectName,
}: RequirementsTabProps) {
  const { permissions, isOwner, isSuperAdmin } = useOrganization();
  const navAccess = buildNavAccess({
    permissions,
    isOwner: isOwner || isSuperAdmin,
  });
  const canEdit =
    navAccess.isOwner || hasPermission(navAccess.permissions, "projects.update");
  const isMobile = useIsMobile();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [markdown, setMarkdown] = useState("");
  const [status, setStatus] = useState<RequirementsSaveStatus>("saved");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [sizeError, setSizeError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [conflictOpen, setConflictOpen] = useState(false);
  const [conflictCurrent, setConflictCurrent] =
    useState<RequirementDocSnapshot | null>(null);
  const [localConflictDraft, setLocalConflictDraft] = useState("");
  const [saveBusy, setSaveBusy] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);

  const [layoutMode, setLayoutMode] = useState<RequirementsPersistedViewMode>(
    "edit",
  );
  const [previewFull, setPreviewFull] = useState(false);
  const [splitRatio, setSplitRatio] = useState(0.5);
  const draggingRef = useRef(false);
  const splitContainerRef = useRef<HTMLDivElement>(null);
  const expandBtnRef = useRef<HTMLButtonElement>(null);

  const queueRef = useRef<RequirementsAutosaveQueue | null>(null);
  const loadGenRef = useRef(0);

  useEffect(() => {
    setLayoutMode(readPersistedViewMode(window.localStorage));
  }, []);

  const setViewMode = useCallback((mode: RequirementsViewMode) => {
    if (mode === "preview-full") {
      setPreviewFull(true);
      return;
    }
    setPreviewFull(false);
    setLayoutMode(mode);
    persistViewMode(mode, window.localStorage);
  }, []);

  const viewMode: RequirementsViewMode = previewFull
    ? "preview-full"
    : layoutMode;

  const saveFn = useCallback(
    async (body: string, baseVersion: number) => {
      try {
        const doc = await requirementsApi.update(projectId, {
          markdown: body,
          base_version: baseVersion,
        });
        return toSnapshot(doc);
      } catch (err) {
        if (
          err instanceof ApiError &&
          err.status === 409 &&
          isConflictPayload(err.data)
        ) {
          throw {
            kind: "conflict" as const,
            current: toSnapshot(err.data.current),
          };
        }
        throw err;
      }
    },
    [projectId],
  );

  const loadDoc = useCallback(async () => {
    const gen = ++loadGenRef.current;
    setLoading(true);
    setLoadError(null);
    try {
      const doc = await requirementsApi.get(projectId);
      if (gen !== loadGenRef.current) return;

      queueRef.current?.dispose();
      queueRef.current = null;

      const snapshot = toSnapshot(doc);
      setMarkdown(snapshot.markdown);
      setStatus("saved");
      setSaveError(null);
      setSizeError(null);
      setConflictOpen(false);
      setConflictCurrent(null);

      if (canEdit) {
        queueRef.current = new RequirementsAutosaveQueue(
          snapshot,
          saveFn,
          {
            onStatus: setStatus,
            onSaved: () => {
              setSaveError(null);
            },
            onConflict: (current, localMarkdown) => {
              setConflictCurrent(current);
              setLocalConflictDraft(localMarkdown);
              setConflictOpen(true);
            },
            onError: (message) => setSaveError(message),
          },
          2000,
        );
      }
    } catch (err) {
      if (gen !== loadGenRef.current) return;
      setLoadError(getApiErrorMessage(err, "Failed to load requirements"));
    } finally {
      if (gen === loadGenRef.current) setLoading(false);
    }
  }, [projectId, canEdit, saveFn]);

  useEffect(() => {
    void loadDoc();
    return () => {
      loadGenRef.current += 1;
      const queue = queueRef.current;
      queueRef.current = null;
      if (queue) {
        void queue.flush().finally(() => queue.dispose());
      }
    };
  }, [loadDoc]);

  useEffect(() => {
    if (!canEdit) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (queueRef.current?.hasUnsavedChanges()) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [canEdit]);

  useEffect(() => {
    if (!canEdit) return;
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        void queueRef.current?.flush();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () =>
      document.removeEventListener("visibilitychange", onVisibility);
  }, [canEdit]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!draggingRef.current || !splitContainerRef.current) return;
      const rect = splitContainerRef.current.getBoundingClientRect();
      const next = (e.clientX - rect.left) / rect.width;
      setSplitRatio(Math.min(0.75, Math.max(0.25, next)));
    };
    const onUp = () => {
      draggingRef.current = false;
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  const onMarkdownChange = (next: string) => {
    setMarkdown(next);
    setNotice(null);
    if (!isMarkdownWithinLimit(next)) {
      setSizeError(
        `Document is ${utf8ByteLength(next).toLocaleString()} bytes; limit is ${REQUIREMENT_MARKDOWN_MAX_BYTES.toLocaleString()} bytes (200 KB). Autosave paused until under the limit.`,
      );
      setStatus("error");
      return;
    }
    setSizeError(null);
    queueRef.current?.setDraft(next);
  };

  const handleLoadTheirs = () => {
    if (!conflictCurrent || !queueRef.current) return;
    setMarkdown(conflictCurrent.markdown);
    queueRef.current.adoptServerDoc(conflictCurrent, true);
    setConflictOpen(false);
    setConflictCurrent(null);
    setNotice(null);
  };

  const handleKeepMine = async () => {
    if (!conflictCurrent || !queueRef.current) return;
    try {
      await navigator.clipboard.writeText(localConflictDraft || markdown);
      setNotice("Your draft was copied to the clipboard.");
    } catch {
      setNotice(
        "Could not copy to clipboard. Your draft is still shown below the dialog until you load theirs.",
      );
    }
    setMarkdown(conflictCurrent.markdown);
    queueRef.current.adoptServerDoc(conflictCurrent, true);
    setConflictOpen(false);
    setConflictCurrent(null);
  };

  const handleConflictCancel = () => {
    setConflictOpen(false);
    setStatus("conflict");
    setNotice(
      "Autosave paused due to a conflict. Retry to overwrite with your draft (uses their version as base), or reload.",
    );
  };

  const handleConflictRetry = () => {
    if (!conflictCurrent || !queueRef.current) {
      setConflictOpen(true);
      return;
    }
    const ok = window.confirm(
      "Retry saving your draft? This overwrites the server copy using their latest version number as the base.",
    );
    if (!ok) return;
    setMarkdown(localConflictDraft || markdown);
    queueRef.current.resumeAfterConflictWithLocalDraft(conflictCurrent.version);
    queueRef.current.setDraft(localConflictDraft || markdown);
    void queueRef.current.flush();
    setNotice(null);
  };

  const handleSave = useCallback(async () => {
    if (!canEdit || !queueRef.current) return;
    if (sizeError) {
      setNotice(sizeError);
      return;
    }
    if (
      status === "saving" ||
      status === "saved" ||
      status === "conflict" ||
      saveBusy
    ) {
      return;
    }
    if (!queueRef.current.hasUnsavedChanges()) return;

    setSaveBusy(true);
    setNotice(null);
    try {
      const ok = await queueRef.current.flush();
      if (ok) setNotice("Saved");
    } finally {
      setSaveBusy(false);
    }
  }, [canEdit, sizeError, status, saveBusy]);

  useEffect(() => {
    if (!canEdit) return;
    const onKeyDown = (event: KeyboardEvent) => {
      const mod = event.metaKey || event.ctrlKey;
      if (!mod || event.key.toLowerCase() !== "s") return;
      event.preventDefault();
      void handleSave();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [canEdit, handleSave]);

  const handleDownloadPdf = useCallback(async () => {
    if (!canExportRequirementsPdf(markdown) || pdfBusy) return;
    setExportError(null);
    setNotice(null);
    setPdfBusy(true);
    try {
      if (canEdit) {
        if (sizeError) {
          setExportError(sizeError);
          return;
        }
        if (status === "conflict") {
          setConflictOpen(true);
          return;
        }
        const ok = await queueRef.current?.flush();
        if (ok === false) {
          if (queueRef.current?.hasUnsavedChanges()) {
            // Conflict or error — existing status / dialog handles it.
            return;
          }
        }
      }

      const result = await downloadRequirementsPdf({
        markdown,
        projectName,
        documentTitle: requirementsPdfDocumentTitle(projectName),
      });

      if (!result.ok) {
        setExportError(result.message);
      }
    } catch (err) {
      setExportError(
        getApiErrorMessage(err, "Failed to prepare the PDF export."),
      );
    } finally {
      setPdfBusy(false);
    }
  }, [canEdit, markdown, pdfBusy, projectName, sizeError, status]);

  const previewOpen = layoutMode === "split";
  const showEditor =
    canEdit && (isMobile ? layoutMode === "edit" : true);
  const showSplitPreview =
    canEdit && !isMobile && layoutMode === "split";
  const showMobilePreview = canEdit && isMobile && layoutMode === "split";

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6 space-y-3">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-[320px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (loadError) {
    return (
      <Card>
        <CardContent className="pt-6 space-y-3">
          <p className="text-red-600">{loadError}</p>
          <Button type="button" variant="outline" onClick={() => void loadDoc()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const saveStatusNode = canEdit ? (
    <SaveStatus
      status={status}
      errorMessage={sizeError || saveError}
      onRetry={() => {
        if (sizeError) return;
        if (status === "conflict") {
          handleConflictRetry();
          return;
        }
        void queueRef.current?.retry();
      }}
    />
  ) : (
    <p className="text-sm text-muted-foreground">View only</p>
  );

  const toolbar = (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1">
        {saveStatusNode}
        {notice && (
          <p className="text-sm text-muted-foreground" role="status">
            {notice}
          </p>
        )}
        {sizeError && (
          <p className="text-sm text-red-600" role="alert">
            {sizeError}
          </p>
        )}
        {exportError && (
          <p className="text-sm text-red-600" role="alert">
            {exportError}
          </p>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {canEdit && (
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              aria-label="Save"
              title="Save (Ctrl+S)"
              disabled={
                saveBusy ||
                status === "saving" ||
                status === "saved" ||
                status === "conflict" ||
                !!sizeError
              }
              onClick={() => void handleSave()}
            >
              {saveBusy || status === "saving" ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save
            </Button>
            <Button
              type="button"
              variant={previewOpen ? "secondary" : "outline"}
              size="sm"
              aria-label={previewOpen ? "Hide preview" : "Show preview"}
              aria-pressed={previewOpen}
              onClick={() => setViewMode(togglePreviewMode(viewMode))}
            >
              {previewOpen ? (
                <EyeOff className="h-4 w-4 mr-2" />
              ) : (
                <Eye className="h-4 w-4 mr-2" />
              )}
              {previewOpen ? "Hide preview" : "Preview"}
            </Button>
          </>
        )}
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                aria-label="Download PDF"
                disabled={
                  pdfBusy || !canExportRequirementsPdf(markdown)
                }
                onClick={() => void handleDownloadPdf()}
              >
                {pdfBusy ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Download PDF
              </Button>
            </span>
          </TooltipTrigger>
          {!canExportRequirementsPdf(markdown) ? (
            <TooltipContent>Nothing to export</TooltipContent>
          ) : null}
        </Tooltip>
      </div>
    </div>
  );

  const previewPane = (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-md border bg-card">
      <div className="flex items-center justify-between gap-2 border-b px-3 py-2 shrink-0">
        <h2
          id="requirements-preview-label"
          className="text-sm font-medium text-muted-foreground"
        >
          Preview
        </h2>
        {!isMobile && (
          <Button
            ref={expandBtnRef}
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            aria-label="Expand preview"
            onClick={() => setViewMode("preview-full")}
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-4">
        <MarkdownPreview
          markdown={markdown}
          labelledBy="requirements-preview-label"
          debounceMs={150}
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {toolbar}

      {!canEdit ? (
        <div className={cn(EDITOR_SHELL, "rounded-md border bg-card")}>
          <div className="flex items-center justify-between gap-2 border-b px-3 py-2 shrink-0">
            <h2
              id="requirements-readonly-preview-label"
              className="text-sm font-medium text-muted-foreground"
            >
              Preview
            </h2>
            {!isMobile && (
              <Button
                ref={expandBtnRef}
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                aria-label="Expand preview"
                onClick={() => setViewMode("preview-full")}
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            )}
          </div>
          <div className="min-h-0 flex-1 overflow-auto p-4">
            <MarkdownPreview
              markdown={markdown}
              labelledBy="requirements-readonly-preview-label"
              debounceMs={150}
            />
          </div>
        </div>
      ) : (
        <div
          ref={splitContainerRef}
          className={cn(
            EDITOR_SHELL,
            showSplitPreview ? "flex flex-row gap-0" : "flex flex-col",
          )}
        >
          {/* Keep editor mounted (hidden when mobile preview-only) to preserve undo/cursor. */}
          <div
            className={cn(
              "min-h-0 overflow-hidden rounded-md border bg-card",
              showSplitPreview ? "h-full" : "h-full w-full",
              showMobilePreview && "hidden",
              !showEditor && !showSplitPreview && "hidden",
            )}
            style={
              showSplitPreview
                ? { width: `${splitRatio * 100}%` }
                : undefined
            }
          >
            <div className="h-full p-2">
              <MarkdownEditor
                value={markdown}
                onChange={onMarkdownChange}
                height="100%"
              />
            </div>
          </div>

          {showSplitPreview && (
            <>
              <div
                role="separator"
                aria-orientation="vertical"
                aria-label="Resize editor and preview"
                className="w-1.5 shrink-0 cursor-col-resize bg-border hover:bg-muted-foreground/40"
                onMouseDown={(e) => {
                  e.preventDefault();
                  draggingRef.current = true;
                }}
              />
              <div
                className="min-h-0 h-full overflow-hidden"
                style={{ width: `${(1 - splitRatio) * 100}%` }}
              >
                {previewPane}
              </div>
            </>
          )}

          {showMobilePreview && (
            <div className="h-full w-full min-h-0">{previewPane}</div>
          )}
        </div>
      )}

      <PreviewFullscreen
        open={previewFull && !isMobile}
        markdown={markdown}
        onClose={() => setPreviewFull(false)}
        saveStatus={status}
        saveError={sizeError || saveError}
        showSaveStatus={canEdit}
        returnFocusRef={expandBtnRef}
        onRetry={() => {
          if (sizeError) return;
          if (status === "conflict") {
            handleConflictRetry();
            return;
          }
          void queueRef.current?.retry();
        }}
      />

      <ConflictDialog
        open={conflictOpen}
        current={conflictCurrent}
        onLoadTheirs={handleLoadTheirs}
        onKeepMine={() => void handleKeepMine()}
        onCancel={handleConflictCancel}
      />
    </div>
  );
}
