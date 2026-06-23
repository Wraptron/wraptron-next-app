"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  employeesApi,
  projectsApi,
  type Employee,
  type Task,
  type Project,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  ArrowLeft,
  Calendar,
  AlertCircle,
  Hash,
  FileText,
  Clock,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { usePageTitle } from "@/contexts/page-title-context";
import { TaskChangeHistory } from "@/components/task-change-history";

export default function EditTaskPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params?.id ? parseInt(params.id as string) : null;
  const taskId = params?.taskId ? parseInt(params.taskId as string) : null;
  const { setTitle } = usePageTitle();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [task, setTask] = useState<Task | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  // Form state
  const [title, setTitleValue] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("pending");
  const [assignedEmployeeId, setAssignedEmployeeId] = useState("unassigned");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [priority, setPriority] = useState("medium");
  const [complexity, setComplexity] = useState("medium");
  const [storyPoints, setStoryPoints] = useState<number>(0);
  const [notes, setNotes] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [changeHistoryKey, setChangeHistoryKey] = useState(0);

  useEffect(() => {
    if (!projectId || !taskId || isNaN(projectId) || isNaN(taskId)) {
      setError("Invalid project or task ID");
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch project to get tasks list - ideally we would have a getTaskById endpoint
        const [projectData, projectsRes, employeesRes] = await Promise.all([
          projectsApi.getById(projectId),
          projectsApi.getAll({ limit: 500 }),
          employeesApi.getAll({ employment_status: "active", limit: 500 }),
        ]);
        setProject(projectData);
        setProjects(projectsRes.data);
        setEmployees(employeesRes.data);
        setSelectedProjectId(String(projectData.id));

        const foundTask = projectData.tasks?.find((t) => t.id === taskId);

        if (foundTask) {
          setTask(foundTask);
          setTitle(foundTask.title); // Set page title

          // Populate form
          setTitleValue(foundTask.title);
          setDescription(foundTask.description || "");
          setStatus(foundTask.status || "pending");
          setAssignedEmployeeId(
            foundTask.assigned_employee_id != null
              ? String(foundTask.assigned_employee_id)
              : "unassigned",
          );

          // Populate new fields if they exist in the task object
          // Since we are adding these fields now, they might be undefined initially
          // We'll treat foundTask as any to access potential new properties safely
          const t = foundTask as any;
          setStartDate(t.start_date || "");
          setEndDate(t.end_date || "");
          setPriority(t.priority || "medium");
          setComplexity(t.complexity || "medium");
          setStoryPoints(t.story_points || 0);
          setNotes(t.notes || "");
        } else {
          setError("Task not found");
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load task details");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [projectId, taskId, setTitle]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !taskId || !task) return;
    const targetProjectId = Number(selectedProjectId || projectId);
    if (Number.isNaN(targetProjectId)) return;

    if (!title.trim()) {
      // You might want to show a specific error for title
      return;
    }

    setSaving(true);
    try {
      // Since we don't have a direct updateTask endpoint yet, we'll mimic what we did for create
      // However, we should check if our backend supports task updates separately.
      // Based on previous files, we only saw updateProject.
      // We will likely need to fetch the project, update the specific task in the tasks array, and send it back.
      // OR better, we added createTask, maybe we should assume updateTask exists or add it.
      // Given the prompt "New task page to edit more details...", we need to support these new fields.

      // Let's assume we need to update the project with the modified task list for now,
      // UNTIL we add a dedicated updateTask endpoint which is cleaner.
      // But re-uploading all tasks is risky for concurrency.
      // Ideally, we implement PATCH /api/projects/:id/tasks/:taskId on backend.

      // For this step, I will assume we will add the backend capability via the same pattern as createTask
      // or update the project entirely if I must.
      // Let's go with updating the project's task list as a continued workaround
      // OR even better, I'll assume we'll add the proper API method in the next step.

      // Let's construct the updated task object
      const updatedTask = {
        ...task,
        title,
        description,
        assigned_employee_id:
          assignedEmployeeId === "unassigned"
            ? null
            : Number(assignedEmployeeId),
        status,
        start_date: startDate,
        end_date: endDate,
        priority,
        complexity,
        story_points: storyPoints,
        notes,
        updated_at: new Date().toISOString(),
      };

      // We will implement a `updateTask` method in api.ts next.
      await projectsApi.updateTask(targetProjectId, taskId, updatedTask);
      setChangeHistoryKey((key) => key + 1);

      router.push(`/projects/${targetProjectId}`);
    } catch (err) {
      console.error("Error updating task:", err);
      // Show error toast or message
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !task || !projectId || !taskId) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">{error || "Task not found"}</p>
            <Link href={`/projects/${projectId}`}>
              <Button>Back to Project</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Link href={`/projects/${projectId}`}>
            <Button
              variant="ghost"
              className="mb-2 pl-0 hover:pl-2 transition-all"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Project
            </Button>
          </Link>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-foreground">Edit Task</h1>
            <Badge
              variant={
                status === "completed" || status === "done"
                  ? "default"
                  : status === "in_progress"
                    ? "secondary"
                    : "outline"
              }
            >
              {status}
            </Badge>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Task Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitleValue(e.target.value)}
                  placeholder="Task title"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detailed description of the task..."
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="blocked">Blocked</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="assignedTo">Assign to</Label>
                  <Select
                    value={assignedEmployeeId}
                    onValueChange={setAssignedEmployeeId}
                  >
                    <SelectTrigger>
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
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="project">Project</Label>
                <Select
                  value={selectedProjectId}
                  onValueChange={setSelectedProjectId}
                >
                  <SelectTrigger id="project">
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                Planning & Complexity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="complexity">Complexity</Label>
                  <Select value={complexity} onValueChange={setComplexity}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="storyPoints">Story Points</Label>
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4 text-muted-foreground" />
                    <Input
                      id="storyPoints"
                      type="number"
                      min="0"
                      value={storyPoints}
                      onChange={(e) =>
                        setStoryPoints(parseInt(e.target.value) || 0)
                      }
                      placeholder="e.g. 1, 2, 3, 5, 8..."
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-muted-foreground" />
                Additional Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any extra notes, observations, or technical details here..."
                rows={6}
                className="font-mono text-sm"
              />
            </CardContent>
          </Card>

          <TaskChangeHistory
            projectId={projectId}
            taskId={taskId}
            refreshKey={changeHistoryKey}
          />

          <div className="flex items-center justify-end gap-3 pt-4">
            <Link href={`/projects/${selectedProjectId || projectId}`}>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
