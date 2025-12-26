"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { projectsApi, type Project, type Task } from "@/lib/api";
import {
  ArrowLeft,
  Loader2,
  MoreVertical,
  AlertCircle,
  CheckCircle2,
  Clock,
  User,
  List,
  LayoutGrid,
  Columns,
  X,
} from "lucide-react";
import Link from "next/link";

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const projectId = params?.id ? parseInt(params.id as string) : null;

  useEffect(() => {
    if (!projectId || isNaN(projectId)) {
      setError("Invalid project ID");
      setLoading(false);
      return;
    }

    const fetchProject = async () => {
      try {
        setLoading(true);
        const data = await projectsApi.getById(projectId);
        setProject(data);
      } catch (err) {
        console.error("Error fetching project:", err);
        setError(err instanceof Error ? err.message : "Failed to load project");
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [projectId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <p className="text-red-600 mb-4">{error || "Project not found"}</p>
            <Link href="/projects">
              <Button variant="outline">Back to Projects</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/projects">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Projects
            </Button>
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">{project.project_name}</h1>
              <div className="flex items-center gap-2 mt-2">
                <Badge
                  variant={
                    project.status === "completed"
                      ? "default"
                      : project.status === "in_progress"
                      ? "secondary"
                      : "outline"
                  }
                >
                  {project.status}
                </Badge>
                <span className="text-sm text-gray-500">
                  Created {formatDate(project.created_at)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="requirements">Requirements</TabsTrigger>
            <TabsTrigger value="issues">Issues</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Services Offered
                    </p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {project.services_offered?.map((service, idx) => (
                        <Badge key={idx} variant="outline">
                          {service}
                        </Badge>
                      ))}
                      {project.other_service_description && (
                        <Badge variant="outline">
                          Other: {project.other_service_description}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Start Date
                    </p>
                    <p className="text-sm">{formatDate(project.start_date)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Target Date
                    </p>
                    <p className="text-sm">{formatDate(project.target_date)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Business Requirements</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {project.business_objectives && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-2">
                      Project Objectives
                    </p>
                    <div className="prose prose-sm max-w-none">
                      <pre className="whitespace-pre-wrap font-sans text-sm bg-gray-50 p-3 rounded">
                        {project.business_objectives}
                      </pre>
                    </div>
                  </div>
                )}
                {project.kpi && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-2">
                      Goals & KPIs
                    </p>
                    <div className="prose prose-sm max-w-none">
                      <pre className="whitespace-pre-wrap font-sans text-sm bg-gray-50 p-3 rounded">
                        {project.kpi}
                      </pre>
                    </div>
                  </div>
                )}
                {project.target_users && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-2">
                      Target Users
                    </p>
                    <div className="prose prose-sm max-w-none">
                      <pre className="whitespace-pre-wrap font-sans text-sm bg-gray-50 p-3 rounded">
                        {project.target_users}
                      </pre>
                    </div>
                  </div>
                )}
                {project.project_references && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-2">
                      References
                    </p>
                    <div className="prose prose-sm max-w-none">
                      <pre className="whitespace-pre-wrap font-sans text-sm bg-gray-50 p-3 rounded">
                        {project.project_references}
                      </pre>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="requirements" className="space-y-4">
            <div className="space-y-4">
              {project.ux_preference && (
                <Card>
                  <CardHeader>
                    <CardTitle>UX Design Preferences</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm max-w-none">
                      <pre className="whitespace-pre-wrap font-sans text-sm bg-gray-50 p-4 rounded">
                        {project.ux_preference}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              )}

              {project.functional_requirements && (
                <Card>
                  <CardHeader>
                    <CardTitle>Functional Requirements</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm max-w-none">
                      <pre className="whitespace-pre-wrap font-sans text-sm bg-gray-50 p-4 rounded">
                        {project.functional_requirements}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              )}

              {project.non_functional_requirements && (
                <Card>
                  <CardHeader>
                    <CardTitle>Non-Functional Requirements</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm max-w-none">
                      <pre className="whitespace-pre-wrap font-sans text-sm bg-gray-50 p-4 rounded">
                        {project.non_functional_requirements}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              )}

              {project.technology_stack && (
                <Card>
                  <CardHeader>
                    <CardTitle>Technology Stack</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm max-w-none">
                      <pre className="whitespace-pre-wrap font-sans text-sm bg-gray-50 p-4 rounded">
                        {project.technology_stack}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              )}

              {!project.ux_preference &&
                !project.functional_requirements &&
                !project.non_functional_requirements &&
                !project.technology_stack && (
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-gray-500 text-center">
                        No requirements specified yet.
                      </p>
                    </CardContent>
                  </Card>
                )}
            </div>
          </TabsContent>

          <TabsContent value="issues" className="space-y-4">
            <TaskViewSwitcher
              tasks={project.tasks || []}
              projectId={projectId!}
              onTaskUpdate={() => {
                // Refresh project data
                if (projectId) {
                  projectsApi.getById(projectId).then(setProject);
                }
              }}
            />
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Support Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {project.support_coverage && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Preferred Support Coverage
                    </p>
                    <p className="text-sm mt-1">{project.support_coverage}</p>
                  </div>
                )}

                {project.support_engagement_model &&
                  project.support_engagement_model.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Support Engagement Model
                      </p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {project.support_engagement_model.map((model, idx) => (
                          <Badge key={idx} variant="outline">
                            {model}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                {project.support_channels &&
                  project.support_channels.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Support Channels
                      </p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {project.support_channels.map((channel, idx) => (
                          <Badge key={idx} variant="outline">
                            {channel}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                {project.scheduled_review_calls && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Scheduled Review Calls
                    </p>
                    <p className="text-sm mt-1">
                      {project.scheduled_review_calls}
                    </p>
                  </div>
                )}

                {project.backup_frequency && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Backup Frequency
                    </p>
                    <p className="text-sm mt-1">{project.backup_frequency}</p>
                  </div>
                )}

                {project.backup_retention_period && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Backup Retention Period
                    </p>
                    <p className="text-sm mt-1">
                      {project.backup_retention_period}
                    </p>
                  </div>
                )}

                {project.reports_required &&
                  project.reports_required.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Reports Required
                      </p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {project.reports_required.map((report, idx) => (
                          <Badge key={idx} variant="outline">
                            {report}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                {project.incident_alerts &&
                  project.incident_alerts.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Incident Alerts & Notifications
                      </p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {project.incident_alerts.map((alert, idx) => (
                          <Badge key={idx} variant="outline">
                            {alert}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                {!project.support_coverage &&
                  (!project.support_engagement_model ||
                    project.support_engagement_model.length === 0) &&
                  (!project.support_channels ||
                    project.support_channels.length === 0) && (
                    <p className="text-gray-500 text-center py-4">
                      No support settings configured yet.
                    </p>
                  )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Task View Switcher Component
type TaskViewMode = "list" | "board" | "card";

function TaskViewSwitcher({
  tasks,
  projectId,
  onTaskUpdate,
}: {
  tasks: Task[];
  projectId: number;
  onTaskUpdate: () => void;
}) {
  const [viewMode, setViewMode] = useState<TaskViewMode>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("tasks_view_mode");
      if (saved === "list" || saved === "board" || saved === "card") {
        return saved as TaskViewMode;
      }
    }
    return "board";
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("tasks_view_mode", viewMode);
    }
  }, [viewMode]);

  const refreshTasks = () => {
    onTaskUpdate();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Tasks</h2>
        <div className="flex items-center border rounded-lg p-1">
          <Button
            variant={viewMode === "list" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("list")}
            className="h-8"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "board" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("board")}
            className="h-8"
          >
            <Columns className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "card" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("card")}
            className="h-8"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {viewMode === "list" && (
        <TaskListView
          tasks={tasks}
          projectId={projectId}
          onUpdate={refreshTasks}
        />
      )}
      {viewMode === "board" && (
        <TaskBoard
          tasks={tasks}
          projectId={projectId}
          onTaskUpdate={refreshTasks}
        />
      )}
      {viewMode === "card" && (
        <TaskCardView
          tasks={tasks}
          projectId={projectId}
          onUpdate={refreshTasks}
        />
      )}
    </div>
  );
}

// Task Board Component
function TaskBoard({
  tasks,
  projectId,
  onTaskUpdate,
}: {
  tasks: Task[];
  projectId: number;
  onTaskUpdate: () => void;
}) {
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);

  const columns = [
    { key: "backlog", label: "Backlog", color: "bg-gray-50" },
    { key: "todo", label: "To Do", color: "bg-blue-50" },
    { key: "in_progress", label: "In Progress", color: "bg-yellow-50" },
    { key: "review", label: "Review", color: "bg-purple-50" },
    { key: "done", label: "Done", color: "bg-green-50" },
  ];

  const getTasksByStatus = (status: string) => {
    // Map status values to column keys
    const statusMap: Record<string, string> = {
      pending: "backlog",
      todo: "todo",
      in_progress: "in_progress",
      review: "review",
      completed: "done",
      done: "done",
    };
    return tasks.filter(
      (task) => statusMap[task.status] === status || task.status === status
    );
  };

  const handleDragStart = (task: Task) => {
    setDraggedTask(task);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (newStatus: string) => {
    if (!draggedTask) return;

    const statusMap: Record<string, string> = {
      backlog: "pending",
      todo: "todo",
      in_progress: "in_progress",
      review: "review",
      done: "completed",
    };

    const mappedStatus = statusMap[newStatus] || newStatus;

    if (draggedTask.status !== mappedStatus) {
      try {
        // Update task status via API
        await projectsApi.update(projectId, {
          tasks: [
            {
              title: draggedTask.title,
              description: draggedTask.description,
              status: mappedStatus,
            },
          ],
        });
        onTaskUpdate();
      } catch (error) {
        console.error("Error updating task:", error);
      }
    }
    setDraggedTask(null);
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {columns.map((column) => {
        const columnTasks = getTasksByStatus(column.key);
        return (
          <div
            key={column.key}
            className={`flex-shrink-0 w-72 ${column.color} rounded-lg p-3 min-h-[400px]`}
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(column.key)}
          >
            <h3 className="font-semibold mb-3 text-sm uppercase flex items-center justify-between">
              <span>
                {column.label} ({columnTasks.length})
              </span>
            </h3>
            <div className="space-y-2">
              {columnTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onDragStart={() => handleDragStart(task)}
                  onUpdate={onTaskUpdate}
                />
              ))}
              {columnTasks.length === 0 && (
                <div className="text-sm text-gray-500 text-center py-8 border-2 border-dashed rounded">
                  Drop tasks here
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Task Card Component
function TaskCard({
  task,
  onDragStart,
  onUpdate,
}: {
  task: Task;
  onDragStart: () => void;
  onUpdate: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");

  const handleSave = async () => {
    try {
      // Update task via API
      // Note: This would need proper API endpoint for updating individual tasks
      setIsEditing(false);
      onUpdate();
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="bg-white border rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow cursor-move"
    >
      {isEditing ? (
        <div className="space-y-2">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleSave}
            autoFocus
            className="text-sm font-medium"
          />
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={handleSave}
            className="text-xs"
            rows={2}
          />
        </div>
      ) : (
        <div onClick={() => setIsEditing(true)} className="cursor-text">
          <div className="flex items-start justify-between mb-2">
            <h4 className="font-medium text-sm flex-1">{task.title}</h4>
            {getStatusIconHelper(task.status)}
          </div>
          {task.description && (
            <p className="text-xs text-gray-600 mt-1 line-clamp-2">
              {task.description}
            </p>
          )}
          <div className="flex items-center justify-between mt-2">
            <Badge
              variant={
                task.status === "completed" || task.status === "done"
                  ? "default"
                  : task.status === "in_progress"
                  ? "secondary"
                  : "outline"
              }
              className="text-xs"
            >
              {task.status}
            </Badge>
          </div>
        </div>
      )}
    </div>
  );
}

// Task List View Component
function TaskListView({
  tasks,
  projectId,
  onUpdate,
}: {
  tasks: Task[];
  projectId: number;
  onUpdate: () => void;
}) {
  if (tasks.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-gray-500 text-center">No tasks yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="divide-y">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    {getStatusIconHelper(task.status)}
                    <h4 className="font-medium">{task.title}</h4>
                    <Badge
                      variant={
                        task.status === "completed" || task.status === "done"
                          ? "default"
                          : task.status === "in_progress"
                          ? "secondary"
                          : "outline"
                      }
                      className="text-xs"
                    >
                      {task.status}
                    </Badge>
                  </div>
                  {task.description && (
                    <p className="text-sm text-gray-600 mt-2 ml-7">
                      {task.description}
                    </p>
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(task.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Task Card View Component
function TaskCardView({
  tasks,
  projectId,
  onUpdate,
}: {
  tasks: Task[];
  projectId: number;
  onUpdate: () => void;
}) {
  if (tasks.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-gray-500 text-center">No tasks yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {tasks.map((task) => (
        <Card
          key={task.id}
          className="hover:shadow-md transition-shadow cursor-pointer"
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2 flex-1">
                {getStatusIconHelper(task.status)}
                <h4 className="font-medium text-sm flex-1">{task.title}</h4>
              </div>
            </div>
            {task.description && (
              <p className="text-xs text-gray-600 mt-2 line-clamp-3">
                {task.description}
              </p>
            )}
            <div className="flex items-center justify-between mt-3">
              <Badge
                variant={
                  task.status === "completed" || task.status === "done"
                    ? "default"
                    : task.status === "in_progress"
                    ? "secondary"
                    : "outline"
                }
                className="text-xs"
              >
                {task.status}
              </Badge>
              <span className="text-xs text-gray-500">
                {new Date(task.created_at).toLocaleDateString()}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Helper function for status icons
function getStatusIconHelper(status: string) {
  switch (status) {
    case "completed":
    case "done":
      return <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />;
    case "in_progress":
      return <Clock className="h-4 w-4 text-yellow-600 flex-shrink-0" />;
    default:
      return <AlertCircle className="h-4 w-4 text-gray-400 flex-shrink-0" />;
  }
}
