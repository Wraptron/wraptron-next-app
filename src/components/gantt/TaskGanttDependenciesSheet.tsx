"use client";

import { useEffect, useMemo, useState } from "react";
import type { Task } from "@/lib/api";
import { projectsApi } from "@/lib/api";
import { notifyError } from "@/lib/notify-error";
import { allowedDependencyTargets } from "@/lib/task-dependency-graph";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

type TaskGanttDependenciesSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: number;
  task: Task | null;
  allTasks: Task[];
  canEdit: boolean;
  onSaved: (updated: Task) => void;
};

export function TaskGanttDependenciesSheet({
  open,
  onOpenChange,
  projectId,
  task,
  allTasks,
  canEdit,
  onSaved,
}: TaskGanttDependenciesSheetProps) {
  const [selected, setSelected] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && task) {
      setSelected([...(task.dependencies ?? [])]);
    }
  }, [open, task]);

  const depsByTaskId = useMemo(() => {
    const map = new Map<number, number[]>();
    for (const t of allTasks) {
      map.set(t.id, [...(t.dependencies ?? [])]);
    }
    return map;
  }, [allTasks]);

  const allowedIds = useMemo(() => {
    if (!task) return [];
    return allowedDependencyTargets(
      task.id,
      allTasks.map((t) => t.id),
      depsByTaskId,
    );
  }, [task, allTasks, depsByTaskId]);

  const toggle = (id: number, checked: boolean) => {
    setSelected((prev) => {
      if (checked) return prev.includes(id) ? prev : [...prev, id];
      return prev.filter((x) => x !== id);
    });
  };

  const handleSave = async () => {
    if (!task || !canEdit) return;
    setSaving(true);
    try {
      const updated = await projectsApi.updateTask(projectId, task.id, {
        dependencies: selected,
      });
      onSaved(updated);
      onOpenChange(false);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to save dependencies.";
      notifyError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Depends on</SheetTitle>
          <SheetDescription>
            {task
              ? `Finish-to-start predecessors for “${task.title}”.`
              : "Select a task."}{" "}
            Arrows on the Gantt show these links.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-3 overflow-y-auto py-4">
          {!task ? null : allTasks.filter((t) => t.id !== task.id).length ===
            0 ? (
            <p className="text-sm text-muted-foreground">
              No other tasks in this project.
            </p>
          ) : (
            allTasks
              .filter((t) => t.id !== task.id)
              .map((t) => {
                const allowed = allowedIds.includes(t.id);
                const checked = selected.includes(t.id);
                const disabled = !canEdit || (!allowed && !checked);
                return (
                  <label
                    key={t.id}
                    className="flex cursor-pointer items-start gap-3 rounded-md border border-border px-3 py-2 text-sm hover:bg-muted/40"
                  >
                    <Checkbox
                      checked={checked}
                      disabled={disabled}
                      onCheckedChange={(v) => toggle(t.id, v === true)}
                      className="mt-0.5"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium">{t.title}</span>
                      {!allowed && !checked ? (
                        <span className="text-xs text-muted-foreground">
                          Would create a cycle
                        </span>
                      ) : null}
                    </span>
                  </label>
                );
              })
          )}
          {!canEdit ? (
            <p className="text-xs text-muted-foreground">
              Read-only — you need tasks.update to change dependencies.
            </p>
          ) : null}
        </div>

        <SheetFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
          {canEdit ? (
            <Button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving}
            >
              {saving ? "Saving…" : "Save"}
            </Button>
          ) : null}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
