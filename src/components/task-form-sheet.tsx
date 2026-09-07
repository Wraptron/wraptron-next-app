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
import {
  employeesApi,
  projectsApi,
  type CreateTaskInput,
  type Employee,
  type Project,
} from "@/lib/api";

const STATUS_OPTIONS = [
  { value: "pending", label: "Todo" },
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
  assigned_employee_id: "",
  approver_employee_id: "",
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
  /** When set, pre-selects this employee instead of the project manager */
  defaultAssigneeEmployeeId?: number;
}

export function TaskFormSheet({
  open,
  onOpenChange,
  onSuccess,
  projectId,
  projects = [],
  defaultAssigneeEmployeeId,
}: TaskFormSheetProps) {
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
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

  useEffect(() => {
    if (!open) return;

    const loadEmployees = async () => {
      try {
        const activeRes = await employeesApi.getAll({
          employment_status: "active",
          limit: 500,
        });
        setEmployees(activeRes.data);
      } catch (err) {
        console.error("Failed to load employees:", err);
        setEmployees([]);
      }
    };

    const loadDefaultAssignee = async () => {
      if (defaultAssigneeEmployeeId != null) {
        setFormData((prev) => ({
          ...prev,
          assigned_employee_id: String(defaultAssigneeEmployeeId),
        }));
        return;
      }

      if (projectId != null) {
        try {
          const project = await projectsApi.getById(projectId);
          if (project.project_manager_employee_id != null) {
            setFormData((prev) => ({
              ...prev,
              assigned_employee_id: String(project.project_manager_employee_id),
            }));
          }
        } catch (err) {
          console.error("Failed to load project manager:", err);
        }
        return;
      }

      if (selectedProjectId) {
        const project = projects.find((p) => p.id === parseInt(selectedProjectId, 10));
        if (project?.project_manager_employee_id != null) {
          setFormData((prev) => ({
            ...prev,
            assigned_employee_id: String(project.project_manager_employee_id),
          }));
        }
      }
    };

    loadEmployees();
    loadDefaultAssignee();
  }, [open, projectId, selectedProjectId, projects, defaultAssigneeEmployeeId]);

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
        ...(formData.assigned_employee_id === "unassigned"
          ? { assigned_employee_id: null }
          : formData.assigned_employee_id
            ? {
                assigned_employee_id: parseInt(
                  formData.assigned_employee_id,
                  10,
                ),
              }
            : {}),
        ...(formData.approver_employee_id === "unassigned"
          ? { approver_employee_id: null }
          : formData.approver_employee_id
            ? {
                approver_employee_id: parseInt(
                  formData.approver_employee_id,
                  10,
                ),
              }
            : {}),
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

            {!projectId && projects.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="task-project">Project *</Label>
                <Select
                  value={selectedProjectId}
                  onValueChange={(value) => {
                    setSelectedProjectId(value);
                    const project = projects.find(
                      (p) => p.id === parseInt(value, 10),
                    );
                    setFormData((prev) => ({
                      ...prev,
                      assigned_employee_id:
                        defaultAssigneeEmployeeId != null
                          ? String(defaultAssigneeEmployeeId)
                          : project?.project_manager_employee_id
                            ? String(project.project_manager_employee_id)
                            : "unassigned",
                    }));
                  }}
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
              <Label htmlFor="task-assigned-to">Assign to</Label>
              <Select
                value={
                  formData.assigned_employee_id === "unassigned" ||
                  !formData.assigned_employee_id
                    ? "unassigned"
                    : formData.assigned_employee_id
                }
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    assigned_employee_id:
                      value === "unassigned" ? "unassigned" : value,
                  })
                }
              >
                <SelectTrigger id="task-assigned-to">
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={String(employee.id)}>
                      {`${employee.first_name} ${employee.last_name}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-approver">Approver</Label>
              <Select
                value={
                  formData.approver_employee_id === "unassigned" ||
                  !formData.approver_employee_id
                    ? "unassigned"
                    : formData.approver_employee_id
                }
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    approver_employee_id:
                      value === "unassigned" ? "unassigned" : value,
                  })
                }
              >
                <SelectTrigger id="task-approver">
                  <SelectValue placeholder="Select approver" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={String(employee.id)}>
                      {`${employee.first_name} ${employee.last_name}`}
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
              <Label htmlFor="task-estimate">Story point estimate</Label>
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
