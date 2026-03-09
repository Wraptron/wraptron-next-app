"use client";

import React, { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { projectsApi, type CreateTaskInput, type Project } from "@/lib/api";

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In progress" },
  { value: "done", label: "Done" },
  { value: "blocked", label: "Blocked" },
] as const;

const BILLABLE_OPTIONS = [
  { value: "billable", label: "Billable" },
  { value: "non_billable", label: "Non billable" },
] as const;

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
] as const;

const RECURRENCE_FREQUENCY_OPTIONS = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
] as const;

const initialFormState = {
  title: "",
  description: "",
  status: "pending",
  end_date: "",
  billable: "billable",
  priority: "medium",
  estimate_hours: "",
  notes: "",
  is_recurring: false,
  recurrence_frequency: "weekly",
  recurrence_interval: "1",
  recurrence_anchor_date: "",
  recurrence_end_date: "",
};

export interface TaskFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  /** When set, task is created for this project. When unset, user must pick a project (e.g. from all-tasks view). */
  projectId?: number;
  /** When projectId is not set, pass projects for the project selector */
  projects?: Project[];
}

export function TaskFormSheet({
  open,
  onOpenChange,
  onSuccess,
  projectId,
  projects = [],
}: TaskFormSheetProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(initialFormState);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");

  const resetForm = () => {
    setFormData(initialFormState);
    setSelectedProjectId("");
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) resetForm();
    onOpenChange(next);
  };

  const effectiveProjectId = projectId ?? (selectedProjectId ? parseInt(selectedProjectId, 10) : null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (effectiveProjectId == null || Number.isNaN(effectiveProjectId)) {
      return;
    }
    setLoading(true);
    try {
      const payload: CreateTaskInput = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        status: formData.status,
        end_date: formData.end_date || undefined,
        billable: formData.billable,
        priority: formData.priority,
        estimate_hours: formData.estimate_hours ? parseFloat(formData.estimate_hours) : undefined,
        notes: formData.notes.trim() || undefined,
        is_recurring: formData.is_recurring,
        recurrence_frequency: formData.is_recurring ? formData.recurrence_frequency : undefined,
        recurrence_interval: formData.is_recurring && formData.recurrence_interval ? parseInt(formData.recurrence_interval, 10) : undefined,
        recurrence_anchor_date: formData.is_recurring && formData.recurrence_anchor_date ? formData.recurrence_anchor_date : undefined,
        recurrence_end_date: formData.is_recurring && formData.recurrence_end_date ? formData.recurrence_end_date : undefined,
      };
      await projectsApi.createTask(effectiveProjectId, payload);
      handleOpenChange(false);
      onSuccess();
    } catch (err) {
      console.error("Failed to create task:", err);
      alert("Failed to create task. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        className="flex flex-col w-[33.333vw] min-w-[320px] max-w-[100vw] overflow-hidden"
      >
        <SheetHeader>
          <SheetTitle>New Task</SheetTitle>
          <SheetDescription>
            Add a task with title, deadline, billable type, priority, estimate, and notes.
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col flex-1 min-h-0 overflow-y-auto"
        >
          <div className="space-y-4 p-4">
            {!projectId && projects.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="task-project">Project *</Label>
                <Select
                  value={selectedProjectId}
                  onValueChange={setSelectedProjectId}
                  required={!projectId}
                >
                  <SelectTrigger id="task-project">
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.project_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="task-title">Title *</Label>
              <Input
                id="task-title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Task title"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-description">Description</Label>
              <Textarea
                id="task-description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Brief description"
                rows={2}
                className="resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger id="task-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-deadline">Deadline</Label>
              <Input
                id="task-deadline"
                type="date"
                value={formData.end_date}
                onChange={(e) =>
                  setFormData({ ...formData, end_date: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-billable">Billable</Label>
              <Select
                value={formData.billable}
                onValueChange={(value) =>
                  setFormData({ ...formData, billable: value })
                }
              >
                <SelectTrigger id="task-billable">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BILLABLE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) =>
                  setFormData({ ...formData, priority: value })
                }
              >
                <SelectTrigger id="task-priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-estimate">Estimate (hours)</Label>
              <Input
                id="task-estimate"
                type="number"
                min={0}
                step={0.25}
                value={formData.estimate_hours}
                onChange={(e) =>
                  setFormData({ ...formData, estimate_hours: e.target.value })
                }
                placeholder="e.g. 2.5"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-notes">Notes</Label>
              <Textarea
                id="task-notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Additional notes"
                rows={3}
                className="resize-none"
              />
            </div>

            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center justify-between gap-4">
                <Label htmlFor="task-recurring" className="font-medium">
                  Recurring task
                </Label>
                <Switch
                  id="task-recurring"
                  checked={formData.is_recurring}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_recurring: checked })
                  }
                />
              </div>
              {formData.is_recurring && (
                <div className="grid grid-cols-2 gap-3 pl-6">
                  <div className="space-y-2">
                    <Label>Repeat</Label>
                    <Select
                      value={formData.recurrence_frequency}
                      onValueChange={(v) =>
                        setFormData({ ...formData, recurrence_frequency: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {RECURRENCE_FREQUENCY_OPTIONS.map((o) => (
                          <SelectItem key={o.value} value={o.value}>
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Every (interval)</Label>
                    <Input
                      type="number"
                      min={1}
                      value={formData.recurrence_interval}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          recurrence_interval: e.target.value,
                        })
                      }
                      placeholder="1"
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label>Start date</Label>
                    <Input
                      type="date"
                      value={formData.recurrence_anchor_date}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          recurrence_anchor_date: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label>End date (optional)</Label>
                    <Input
                      type="date"
                      value={formData.recurrence_end_date}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          recurrence_end_date: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <SheetFooter className="p-4 pt-0 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || (!projectId && projects.length > 0 && !selectedProjectId)}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating…
                </>
              ) : (
                "Create task"
              )}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
