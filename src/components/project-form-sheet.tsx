"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useSheetPush } from "@/contexts/sheet-push-context";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import {
  projectsApi,
  projectStatusesApi,
  type CreateProjectInput,
  type ProjectStatus,
} from "@/lib/api";

const PROJECT_TYPES = [
  { value: "AI", label: "AI" },
  { value: "Website", label: "Website" },
  { value: "Web & Mobile App", label: "Web & Mobile App" },
  { value: "Support", label: "Support" },
] as const;

const FALLBACK_PROJECT_STATUSES = [
  "Draft",
  "Active",
  "Completed",
  "Archived",
];

const PRIORITY_OPTIONS = [
  { value: "Low", label: "Low" },
  { value: "Medium", label: "Medium" },
  { value: "High", label: "High" },
  { value: "Critical", label: "Critical" },
] as const;

export interface ProjectFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const initialFormState = {
  project_name: "",
  project_type: "" as string,
  project_manager: "",
  status: "Draft",
  start_date: "",
  end_date: "",
  tags: "",
  priority: "Medium" as string,
};

const MAIN_CONTENT_PORTAL_ID = "main-content-portal";

export function ProjectFormSheet({
  open,
  onOpenChange,
  onSuccess,
}: ProjectFormSheetProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(initialFormState);
  const [projectStatuses, setProjectStatuses] = useState<ProjectStatus[]>([]);
  const [container, setContainer] = useState<HTMLElement | null>(null);
  const setSheetOpen = useSheetPush()?.setSheetOpen;

  const statusesSorted = useMemo(() => {
    return [...projectStatuses].sort((a, b) => {
      if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
      return a.id - b.id;
    });
  }, [projectStatuses]);

  const statusNames =
    statusesSorted.length > 0
      ? statusesSorted.map((s) => s.name)
      : FALLBACK_PROJECT_STATUSES;

  const statusSelectOptions = useMemo(() => {
    if (formData.status && !statusNames.includes(formData.status)) {
      return [...statusNames, formData.status];
    }
    return statusNames;
  }, [statusNames, formData.status]);

  useEffect(() => {
    setContainer(document.getElementById(MAIN_CONTENT_PORTAL_ID));
  }, []);

  useEffect(() => {
    if (!open) return;
    projectStatusesApi
      .getAll()
      .then((res) => setProjectStatuses(res.data ?? []))
      .catch(() => setProjectStatuses([]));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (statusesSorted.length === 0) return;
    const first = statusesSorted[0].name;
    setFormData((prev) => {
      if (prev.status !== "Draft" && prev.status !== FALLBACK_PROJECT_STATUSES[0]) {
        return prev;
      }
      return { ...prev, status: first };
    });
  }, [open, statusesSorted]);

  // Report actual sheet width so layout only pushes by required width
  useEffect(() => {
    if (!open) {
      setSheetOpen?.(false);
      return;
    }
    const portal = document.getElementById(MAIN_CONTENT_PORTAL_ID);
    const sheetEl = portal?.querySelector("[data-slot='sheet-content']");
    if (!sheetEl) {
      const t = setTimeout(() => {
        const el = document.getElementById(MAIN_CONTENT_PORTAL_ID)?.querySelector("[data-slot='sheet-content']");
        if (el) setSheetOpen?.(true, Math.ceil((el as HTMLElement).getBoundingClientRect().width));
      }, 350);
      return () => {
        clearTimeout(t);
        setSheetOpen?.(false);
      };
    }
    const updateWidth = () => setSheetOpen?.(true, Math.ceil((sheetEl as HTMLElement).getBoundingClientRect().width));
    updateWidth();
    const ro = new ResizeObserver(updateWidth);
    ro.observe(sheetEl);
    return () => {
      ro.disconnect();
      setSheetOpen?.(false);
    };
  }, [open, setSheetOpen]);

  const resetForm = () => {
    setFormData(initialFormState);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) resetForm();
    onOpenChange(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload: CreateProjectInput = {
        project_name: formData.project_name.trim(),
        services_offered:
          formData.project_type ? [formData.project_type] : undefined,
        status: formData.status || undefined,
        start_date: formData.start_date || undefined,
        target_date: formData.end_date || undefined,
      };
      await projectsApi.create(payload);
      handleOpenChange(false);
      onSuccess();
    } catch (err) {
      console.error("Failed to create project:", err);
      alert("Failed to create project. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet
      open={open}
      onOpenChange={handleOpenChange}
      container={container}
    >
      <SheetContent
        side="right"
        className="flex flex-col w-[33.333vw] min-w-[280px] max-w-[100vw] overflow-hidden"
      >
        <SheetHeader>
          <SheetTitle>Create Project</SheetTitle>
          <SheetDescription>
            Add a new project with name, type, manager, and dates.
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col flex-1 min-h-0 overflow-y-auto"
        >
          <div className="space-y-4 p-4">
            <div className="space-y-2">
              <Label htmlFor="project_name">Project Name *</Label>
              <Input
                id="project_name"
                value={formData.project_name}
                onChange={(e) =>
                  setFormData({ ...formData, project_name: e.target.value })
                }
                placeholder="Enter project name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="project_type">Type of Project</Label>
              <Select
                value={formData.project_type}
                onValueChange={(value) =>
                  setFormData({ ...formData, project_type: value })
                }
              >
                <SelectTrigger id="project_type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {PROJECT_TYPES.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="project_manager">Project Manager</Label>
              <Input
                id="project_manager"
                value={formData.project_manager}
                onChange={(e) =>
                  setFormData({ ...formData, project_manager: e.target.value })
                }
                placeholder="Name or email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusSelectOptions.map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) =>
                    setFormData({ ...formData, start_date: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date">End Date</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) =>
                    setFormData({ ...formData, end_date: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags or Categories</Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={(e) =>
                  setFormData({ ...formData, tags: e.target.value })
                }
                placeholder="e.g. frontend, api, urgent"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority Level</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) =>
                  setFormData({ ...formData, priority: value })
                }
              >
                <SelectTrigger id="priority">
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
          </div>

          <SheetFooter className="mt-auto border-t p-4 shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Create Project"
              )}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
