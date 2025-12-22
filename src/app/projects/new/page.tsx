"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { projectsApi } from "@/lib/api";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Trash2,
  Loader2,
  ArrowLeft,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import Link from "next/link";

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
}

const SERVICE_OPTIONS = [
  "website",
  "web app",
  "mobile app",
  "social media",
  "business email",
  "hosting",
] as const;

type ServiceOption = (typeof SERVICE_OPTIONS)[number];

interface ProjectFormData {
  project_name: string;
  services_offered: ServiceOption[];
  planned_date: string;
  target_date: string;
  target_audience: string;
  functional_requirements: string;
  non_functional_requirements: string;
  tasks: Task[];
}

export default function NewProjectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const [formData, setFormData] = useState<ProjectFormData>({
    project_name: "",
    services_offered: [],
    planned_date: new Date().toISOString().split("T")[0],
    target_date: "",
    target_audience: "",
    functional_requirements: "",
    non_functional_requirements: "",
    tasks: [],
  });

  const addTask = () => {
    const newTask: Task = {
      id: Date.now().toString(),
      title: "",
      description: "",
      status: "pending",
    };
    setFormData({
      ...formData,
      tasks: [...formData.tasks, newTask],
    });
  };

  const removeTask = (taskId: string) => {
    setFormData({
      ...formData,
      tasks: formData.tasks.filter((task) => task.id !== taskId),
    });
  };

  const updateTask = (taskId: string, field: keyof Task, value: string) => {
    setFormData({
      ...formData,
      tasks: formData.tasks.map((task) =>
        task.id === taskId ? { ...task, [field]: value } : task
      ),
    });
  };

  const validatePage1 = (): boolean => {
    if (!formData.project_name.trim()) {
      setError("Project name is required");
      return false;
    }
    if (formData.services_offered.length === 0) {
      setError("Please select at least one service");
      return false;
    }
    if (!formData.target_date) {
      setError("Target date is required");
      return false;
    }
    return true;
  };

  const handleNext = () => {
    setError(null);
    if (currentPage === 1 && !validatePage1()) {
      return;
    }
    if (currentPage < 3) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevious = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Final validation
    if (!validatePage1()) {
      setLoading(false);
      return;
    }

    try {
      // Prepare project data for REST API
      const projectData = {
        project_name: formData.project_name,
        services_offered: formData.services_offered,
        start_date: formData.planned_date,
        target_date: formData.target_date,
        target_audience: formData.target_audience,
        functional_requirements: formData.functional_requirements,
        non_functional_requirements: formData.non_functional_requirements,
        tasks: formData.tasks.map((task) => ({
          title: task.title,
          description: task.description,
          status: task.status,
        })),
      };

      // Create project using REST API
      await projectsApi.create(projectData);

      // Redirect to projects page on success
      router.push("/projects");
    } catch (err) {
      console.error("Error creating project:", err);
      setError(err instanceof Error ? err.message : "Failed to create project");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/projects">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Projects
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Create New Project</h1>
          <p className="text-gray-600 mt-2">
            Fill in the details to create a new project
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            {error}
          </div>
        )}

        {/* Page Indicator */}
        <div className="mb-6">
          <div className="flex items-center justify-center space-x-4">
            <div
              className={`flex items-center ${
                currentPage >= 1 ? "text-blue-600" : "text-gray-400"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                  currentPage >= 1
                    ? "bg-blue-600 border-blue-600 text-white"
                    : "border-gray-300"
                }`}
              >
                1
              </div>
              <span className="ml-2 font-medium">Basic Info</span>
            </div>
            <div
              className={`h-0.5 w-16 ${
                currentPage >= 2 ? "bg-blue-600" : "bg-gray-300"
              }`}
            />
            <div
              className={`flex items-center ${
                currentPage >= 2 ? "text-blue-600" : "text-gray-400"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                  currentPage >= 2
                    ? "bg-blue-600 border-blue-600 text-white"
                    : currentPage > 2
                    ? "bg-blue-600 border-blue-600 text-white"
                    : "border-gray-300"
                }`}
              >
                2
              </div>
              <span className="ml-2 font-medium">Requirements</span>
            </div>
            <div
              className={`h-0.5 w-16 ${
                currentPage >= 3 ? "bg-blue-600" : "bg-gray-300"
              }`}
            />
            <div
              className={`flex items-center ${
                currentPage >= 3 ? "text-blue-600" : "text-gray-400"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                  currentPage >= 3
                    ? "bg-blue-600 border-blue-600 text-white"
                    : "border-gray-300"
                }`}
              >
                3
              </div>
              <span className="ml-2 font-medium">Tasks</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Page 1: Basic Information */}
          {currentPage === 1 && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="project_name">
                      Project Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="project_name"
                      value={formData.project_name}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          project_name: e.target.value,
                        })
                      }
                      placeholder="Enter project name"
                      required
                    />
                  </div>

                  <div>
                    <Label>Services Offered</Label>
                    <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-3">
                      {SERVICE_OPTIONS.map((service) => {
                        const isSelected =
                          formData.services_offered.includes(service);
                        return (
                          <button
                            key={service}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                setFormData({
                                  ...formData,
                                  services_offered:
                                    formData.services_offered.filter(
                                      (s) => s !== service
                                    ),
                                });
                              } else {
                                setFormData({
                                  ...formData,
                                  services_offered: [
                                    ...formData.services_offered,
                                    service,
                                  ],
                                });
                              }
                            }}
                            className={`
                              relative p-4 rounded-lg border-2 transition-all duration-200
                              text-left cursor-pointer
                              ${
                                isSelected
                                  ? "border-blue-600 bg-blue-50 shadow-md"
                                  : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                              }
                              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                            `}
                          >
                            <div className="flex items-center justify-between">
                              <span
                                className={`text-sm font-medium capitalize ${
                                  isSelected ? "text-blue-900" : "text-gray-700"
                                }`}
                              >
                                {service}
                              </span>
                              {isSelected && (
                                <div className="h-5 w-5 rounded-full bg-blue-600 flex items-center justify-center">
                                  <svg
                                    className="h-3 w-3 text-white"
                                    fill="none"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path d="M5 13l4 4L19 7"></path>
                                  </svg>
                                </div>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    {formData.services_offered.length === 0 && (
                      <p className="text-sm text-gray-500 mt-2">
                        Select at least one service
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="planned_date">Planned Date</Label>
                      <Input
                        id="planned_date"
                        type="date"
                        value={formData.planned_date}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            planned_date: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div>
                      <Label htmlFor="target_date">
                        Target Date <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="target_date"
                        type="date"
                        value={formData.target_date}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            target_date: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Page 2: Requirements */}
          {currentPage === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>Requirements</CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Use Markdown format to document your requirements
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="target_audience">Target Audience</Label>
                  <Textarea
                    id="target_audience"
                    value={formData.target_audience}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        target_audience: e.target.value,
                      })
                    }
                    placeholder="# Target Audience&#10;&#10;Describe the target audience for this project using Markdown..."
                    rows={8}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Supports Markdown formatting (headers, lists, bold, italic,
                    etc.)
                  </p>
                </div>

                <div>
                  <Label htmlFor="functional_requirements">
                    Functional Requirements
                  </Label>
                  <Textarea
                    id="functional_requirements"
                    value={formData.functional_requirements}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        functional_requirements: e.target.value,
                      })
                    }
                    placeholder="# Functional Requirements&#10;&#10;## Feature 1&#10;- Requirement 1&#10;- Requirement 2&#10;&#10;## Feature 2&#10;- Requirement 1"
                    rows={12}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Use Markdown to structure your functional requirements
                  </p>
                </div>

                <div>
                  <Label htmlFor="non_functional_requirements">
                    Non-Functional Requirements
                  </Label>
                  <Textarea
                    id="non_functional_requirements"
                    value={formData.non_functional_requirements}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        non_functional_requirements: e.target.value,
                      })
                    }
                    placeholder="# Non-Functional Requirements&#10;&#10;## Performance&#10;- Response time &lt; 2 seconds&#10;&#10;## Security&#10;- SSL/TLS encryption required&#10;&#10;## Scalability&#10;- Support 10,000+ concurrent users"
                    rows={12}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Document performance, security, scalability, and other
                    non-functional requirements
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Page 3: Tasks */}
          {currentPage === 3 && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Tasks</h3>
                <Button
                  type="button"
                  onClick={addTask}
                  variant="outline"
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Task
                </Button>
              </div>
              {formData.tasks.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 text-sm">
                    No tasks added yet. Click "Add Task" to get started.
                  </p>
                </div>
              ) : (
                <div className="rounded-md border bg-white">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[200px]">Title</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="w-[150px]">Status</TableHead>
                        <TableHead className="w-[80px] text-center">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {formData.tasks.map((task) => (
                        <TableRow key={task.id} className="hover:bg-gray-50/50">
                          <TableCell className="py-2">
                            <Input
                              value={task.title}
                              onChange={(e) =>
                                updateTask(task.id, "title", e.target.value)
                              }
                              placeholder="Enter task title"
                              className="h-9 border-0 bg-transparent focus-visible:ring-1 focus-visible:ring-offset-0"
                            />
                          </TableCell>
                          <TableCell className="py-2">
                            <Textarea
                              value={task.description}
                              onChange={(e) =>
                                updateTask(
                                  task.id,
                                  "description",
                                  e.target.value
                                )
                              }
                              placeholder="Enter task description"
                              rows={2}
                              className="min-h-[60px] border-0 bg-transparent focus-visible:ring-1 focus-visible:ring-offset-0 resize-none"
                            />
                          </TableCell>
                          <TableCell className="py-2">
                            <Select
                              value={task.status}
                              onValueChange={(value) =>
                                updateTask(task.id, "status", value)
                              }
                            >
                              <SelectTrigger className="h-9 border-0 bg-transparent focus:ring-1 focus:ring-offset-0">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="in_progress">
                                  In Progress
                                </SelectItem>
                                <SelectItem value="completed">
                                  Completed
                                </SelectItem>
                                <SelectItem value="blocked">Blocked</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="py-2 text-center">
                            <Button
                              type="button"
                              onClick={() => removeTask(task.id)}
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t">
            <div>
              {currentPage > 1 && (
                <Button
                  type="button"
                  onClick={handlePrevious}
                  variant="outline"
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>
              )}
            </div>
            <div className="flex gap-4">
              <Link href="/projects">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
              {currentPage < 3 ? (
                <Button type="button" onClick={handleNext}>
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Project"
                  )}
                </Button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
