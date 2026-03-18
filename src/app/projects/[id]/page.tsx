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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  projectsApi,
  integrationsApi,
  type Project,
  type Task,
  type GitHubCommit,
  type Integration,
} from "@/lib/api";
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  DragStartEvent,
  DragEndEvent,
  TouchSensor,
  closestCorners,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GitHubIntegration } from "@/components/github-integration";
import { GitHubCommitsView } from "@/components/github-commits-view";
import { usePageTitle } from "@/contexts/page-title-context";
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
  ChevronRight,
  ChevronDown,
  Folder,
  File,
  Edit,
  Plus,
  GripVertical,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Filter,
  Calendar,
  ChevronLeft,
  FileText,
  Printer,
  Github,
  ExternalLink,
  GitBranch,
  Users,
} from "lucide-react";

const SERVICE_OPTIONS = [
  "AI Development",
  "Business Website",
  "E-Commerce Website",
  "Mobile App",
  "Portfolio/Casestudy Website",
  "Web App",
  "Support and Maintenance",
  "Other",
] as const;
import Link from "next/link";

interface ProjectCharterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project;
}

const ProjectCharterDialog: React.FC<ProjectCharterDialogProps> = ({
  open,
  onOpenChange,
  project,
}) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handlePrint = () => {
    const printContent = document.getElementById("project-charter-content");
    const windowUrl = "about:blank";
    const uniqueName = new Date();
    const windowName = "Print" + uniqueName.getTime();
    const printWindow = window.open(
      windowUrl,
      windowName,
      "width=800,height=600",
    );

    if (printWindow && printContent) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Project Charter - ${project.project_name}</title>
            <style>
              body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.5; padding: 40px; color: #111; }
              h1 { font-size: 24px; margin-bottom: 20px; border-bottom: 2px solid #eee; padding-bottom: 10px; }
              h2 { font-size: 18px; margin-top: 24px; margin-bottom: 12px; color: #333; font-weight: 600; }
              p { margin-bottom: 10px; font-size: 14px; }
              .section { margin-bottom: 24px; }
              .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
              .badge { display: inline-block; padding: 4px 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 12px; margin-right: 4px; margin-bottom: 4px; background: #f8f9fa; }
              ul { margin-top: 4px; padding-left: 20px; }
              li { font-size: 14px; margin-bottom: 4px; }
              pre { background: #f5f5f5; padding: 10px; border-radius: 4px; white-space: pre-wrap; font-size: 13px; font-family: monospace; }
            </style>
          </head>
          <body>
            ${printContent.innerHTML}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  };

  // Calculate Out of Scope Items (Services NOT selected)
  const outOfScope = SERVICE_OPTIONS.filter(
    (s) => !project.services_offered?.includes(s) && s !== "Other",
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Project Charter</DialogTitle>
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Print Charter
            </Button>
          </div>
        </DialogHeader>

        <div id="project-charter-content" className="space-y-6 pt-4">
          {/* Header Info */}
          <div>
            <h1 className="text-2xl font-bold">{project.project_name}</h1>
            <div className="text-gray-500 text-sm mt-1">
              Generated on {new Date().toLocaleDateString()}
            </div>
            <div className="mt-4 flex gap-6 text-sm text-gray-600">
              <div>
                <span className="font-semibold">ID:</span> {project.id}
              </div>
              <div>
                <span className="font-semibold">Status:</span> {project.status}
              </div>
              <div>
                <span className="font-semibold">Created:</span>{" "}
                {formatDate(project.created_at)}
              </div>
            </div>
          </div>

          {/* 1. Executive Summary (Mapped to Basic Information) */}
          <div className="section">
            <h2 className="text-lg font-semibold border-b pb-2 mb-3">
              1. Executive Summary
            </h2>
            <p className="text-sm text-gray-700">
              This project, <strong>{project.project_name}</strong>, aims to
              deliver {project.services_offered.join(", ")}
              {project.other_service_description
                ? ` and ${project.other_service_description}`
                : ""}
              . The project is scheduled to start on{" "}
              {formatDate(project.start_date)} with a target completion date of{" "}
              {formatDate(project.target_date)}.
            </p>
          </div>

          {/* 2. Scope of Work (In Scope / Out of Scope) */}
          <div className="section grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-lg font-semibold border-b pb-2 mb-3">
                2. Scope of Work (In Scope)
              </h2>
              <ul className="list-disc list-inside text-sm text-gray-600">
                {project.services_offered.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
                {project.other_service_description && (
                  <li>Custom: {project.other_service_description}</li>
                )}
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-semibold border-b pb-2 mb-3">
                Out of Scope
              </h2>
              <ul className="list-disc list-inside text-sm text-gray-500 italic">
                {outOfScope.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
                {outOfScope.length === 0 && <li>None specified</li>}
              </ul>
            </div>
          </div>

          {/* 3. Technical Architecture */}
          <div className="section">
            <h2 className="text-lg font-semibold border-b pb-2 mb-3">
              3. Technical Architecture & Requirements
            </h2>
            <div className="space-y-4">
              {/* Target Users & Tech Stack */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-700">
                    Target Users
                  </h3>
                  <p className="text-sm text-gray-600">
                    {project.target_users || "Not specified"}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-700">
                    Technology Stack
                  </h3>
                  <p className="text-sm text-gray-600">
                    {project.technology_stack || "Not specified"}
                  </p>
                </div>
              </div>

              {/* Requirements */}
              <div className="space-y-3">
                <div>
                  <h3 className="text-sm font-semibold text-gray-700">
                    Business Requirements
                  </h3>
                  {project.functional_requirements ? (
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">
                      {project.functional_requirements}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-500 italic">
                      None specified
                    </p>
                  )}
                  {/* Note: Mapping functional_requirements to Business Requirements as per user intuition or lack of specific business_req field, 
                           User asked for: "business requirements, functional requirements, non functional requirements". 
                           Since we don't have separate business/functional, we display functional here or assume they are mixed. 
                           Let's check if we can reuse functional_requirements for both or separate them if possible. 
                           The prompt asked to map "Technical Architecture with ... business requirements, functional requirements". 
                           We will display what we have. */}
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-700">
                    Functional Requirements
                  </h3>
                  {/* Since we mapped functional_requirements to "Business Requirements" above (often interchangeable in simple schemas), 
                             let's duplicate or clarify. Actually, let's use the field `functional_requirements` strictly here 
                             and maybe use `business_objectives` for Business Requirements? The user explicitly said "Success criteria with business goals".
                             Let's use `functional_requirements` here. */}
                  {project.functional_requirements ? (
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">
                      {project.functional_requirements}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-500 italic">
                      None specified
                    </p>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-700">
                    Non-Functional Requirements
                  </h3>
                  {project.non_functional_requirements ? (
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">
                      {project.non_functional_requirements}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-500 italic">
                      None specified
                    </p>
                  )}
                </div>
              </div>

              {/* Pages / Views and UX */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div>
                  <h3 className="text-sm font-semibold text-gray-700">
                    Pages / Views
                  </h3>
                  {project.pages_views && project.pages_views.length > 0 ? (
                    <div className="flex flex-wrap gap-2 mt-1">
                      {project.pages_views.map((page, i) => (
                        <Badge key={i} variant="secondary">
                          {page}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">
                      No pages defined.
                    </p>
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-700">
                    UX Design Preferences
                  </h3>
                  <p className="text-sm text-gray-600">
                    {project.ux_preference || "Not specified"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Milestones & Releases */}
          <div className="section">
            <h2 className="text-lg font-semibold border-b pb-2 mb-3">
              4. Milestones & Releases
            </h2>
            <div className="text-sm text-gray-600">
              <div className="flex items-center justify-between py-2 border-b border-gray-100 max-w-md">
                <span className="font-medium">Project Start</span>
                <span>{formatDate(project.start_date)}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100 max-w-md">
                <span className="font-medium">Target Completion</span>
                <span>{formatDate(project.target_date)}</span>
              </div>
              {/* Future: If we add a releases array to the Project type, iterate here */}
            </div>
          </div>

          {/* 5. Success Criteria (Business Goals) */}
          <div className="section">
            <h2 className="text-lg font-semibold border-b pb-2 mb-3">
              5. Success Criteria
            </h2>
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-semibold text-gray-700">
                  Business Goals
                </h3>
                {project.business_objectives &&
                project.business_objectives.length > 0 ? (
                  <ul className="list-disc list-inside text-sm text-gray-600 mt-1">
                    {project.business_objectives.map((obj, i) => (
                      <li key={i}>{obj}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500 italic">None defined</p>
                )}
              </div>
              {project.kpi && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700">
                    Key Performance Indicators (KPIs)
                  </h3>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">
                    {project.kpi}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const { setTitle, setSubtitle } = usePageTitle();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [charterOpen, setCharterOpen] = useState(false);

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

  // Update page title when project is loaded
  useEffect(() => {
    if (project) {
      setTitle(project.project_name);
    } else {
      setTitle(null);
      setSubtitle(null);
    }
    // Cleanup: clear title when component unmounts
    return () => {
      setTitle(null);
      setSubtitle(null);
    };
  }, [project, setTitle, setSubtitle]);

  // Update subtitle based on active tab
  useEffect(() => {
    const tabLabels: Record<string, string> = {
      overview: "",
      requirements: "",
      releases: "Releases",
      tasks: "Tasks",
      commits: "",
      teams: "",
      integrations: "",
    };
    setSubtitle(tabLabels[activeTab] || null);
  }, [activeTab, setSubtitle]);

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
      <div className="max-w-6xl mx-auto px-3 py-4 sm:px-4 sm:py-6 lg:py-8">
        <div className="mb-4 sm:mb-6">
          <Link href="/projects">
            <Button variant="ghost" className="mb-3 sm:mb-4 -ml-1">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Projects
            </Button>
          </Link>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2 min-w-0">
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
              <span className="text-sm text-gray-500 truncate">
                Created {formatDate(project.created_at)}
              </span>
            </div>
            <div className="flex flex-wrap gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCharterOpen(true)}
                className="flex-1 sm:flex-initial min-w-0"
              >
                <FileText className="h-4 w-4 mr-2 shrink-0" />
                <span className="truncate">Project Charter</span>
              </Button>
              <Link href={`/projects/${projectId}/edit`} className="flex-1 sm:flex-initial min-w-0">
                <Button variant="outline" size="sm" className="w-full sm:w-auto">
                  <Edit className="h-4 w-4 mr-2 shrink-0" />
                  Edit Project
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <ProjectCharterDialog
          open={charterOpen}
          onOpenChange={setCharterOpen}
          project={project}
        />

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-4"
        >
          <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0">
            <TabsList className="inline-flex w-max min-w-0 flex-nowrap">
              <TabsTrigger value="overview" className="shrink-0">Overview</TabsTrigger>
              <TabsTrigger value="requirements" className="shrink-0">Requirements</TabsTrigger>
              <TabsTrigger value="releases" className="shrink-0">Releases</TabsTrigger>
              <TabsTrigger value="tasks" className="shrink-0">Tasks</TabsTrigger>
              <TabsTrigger value="commits" className="shrink-0">Commits</TabsTrigger>
              <TabsTrigger value="teams" className="shrink-0">Teams</TabsTrigger>
              <TabsTrigger value="integrations" className="shrink-0">Integrations</TabsTrigger>
            </TabsList>
          </div>

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
                <div className="pt-4 border-t">
                  <p className="text-sm font-medium text-gray-900 mb-4">
                    Additional Information
                  </p>
                  <div className="space-y-4">
                    {project.business_objectives &&
                      project.business_objectives.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-gray-500 mb-2">
                            Project Objectives
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {project.business_objectives.map(
                              (objective, idx) => (
                                <Badge key={idx} variant="outline">
                                  {objective}
                                </Badge>
                              ),
                            )}
                          </div>
                        </div>
                      )}
                    {project.kpi && (
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-2">
                          Goals & KPIs
                        </p>
                        <div className="prose prose-sm max-w-none">
                          <pre className="whitespace-pre-wrap font-sans text-sm bg-gray-50 p-3 rounded overflow-x-auto max-w-full">
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
                          <pre className="whitespace-pre-wrap font-sans text-sm bg-gray-50 p-3 rounded overflow-x-auto max-w-full">
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
                          <pre className="whitespace-pre-wrap font-sans text-sm bg-gray-50 p-3 rounded overflow-x-auto max-w-full">
                            {project.project_references}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
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
                      <pre className="whitespace-pre-wrap font-sans text-sm bg-gray-50 p-3 sm:p-4 rounded overflow-x-auto max-w-full">
                        {project.ux_preference}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              )}

              {project.pages_views && project.pages_views.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Pages</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <PagesTreeView pagesViews={project.pages_views} />
                  </CardContent>
                </Card>
              )}

              {project.functional_requirements && (
                <Card>
                  <CardHeader>
                    <CardTitle>Business Requirements</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm max-w-none">
                      <pre className="whitespace-pre-wrap font-sans text-sm bg-gray-50 p-3 sm:p-4 rounded overflow-x-auto max-w-full">
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
                      <pre className="whitespace-pre-wrap font-sans text-sm bg-gray-50 p-3 sm:p-4 rounded overflow-x-auto max-w-full">
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
                      <pre className="whitespace-pre-wrap font-sans text-sm bg-gray-50 p-3 sm:p-4 rounded overflow-x-auto max-w-full">
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

          <TabsContent value="tasks" className="space-y-4">
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

          <TabsContent value="commits" className="space-y-4">
            <GitHubCommitsView projectId={projectId!} />
          </TabsContent>

          <TabsContent value="teams" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Team Members
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500">
                  Team management will appear here.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integrations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Integrations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <GitHubIntegration projectId={projectId!} />
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
}

// Task View Switcher Component
type TaskViewMode = "list" | "board" | "card" | "calendar";

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
      if (
        saved === "list" ||
        saved === "board" ||
        saved === "card" ||
        saved === "calendar"
      ) {
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

  const [addTaskOpen, setAddTaskOpen] = useState(false);

  const refreshTasks = () => {
    onTaskUpdate();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
        <Button onClick={() => setAddTaskOpen(true)} size="sm" className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Add Task
        </Button>
        <div className="flex items-center border rounded-lg p-1 overflow-x-auto w-full sm:w-auto">
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
          <Button
            variant={viewMode === "calendar" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("calendar")}
            className="h-8"
          >
            <Calendar className="h-4 w-4" />
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
      {viewMode === "calendar" && (
        <TaskCalendarView
          tasks={tasks}
          projectId={projectId}
          onUpdate={refreshTasks}
        />
      )}

      <AddTaskDialog
        open={addTaskOpen}
        onOpenChange={setAddTaskOpen}
        projectId={projectId}
        onSuccess={refreshTasks}
      />
    </div>
  );
}

// Task Board Component
const TASK_COLUMN_KEYS = ["backlog", "todo", "in_progress", "review", "done"];
const COLUMN_TO_STATUS: Record<string, string> = {
  backlog: "pending",
  todo: "todo",
  in_progress: "in_progress",
  review: "review",
  done: "completed",
};
const STATUS_TO_COLUMN: Record<string, string> = {
  pending: "backlog",
  todo: "todo",
  in_progress: "in_progress",
  review: "review",
  completed: "done",
  done: "done",
};

function TaskKanbanCard({ task }: { task: Task }) {
  return (
    <Card className="border-[0.5px] border-gray-200 shadow-none cursor-grab active:cursor-grabbing bg-white">
      <CardContent className="p-3">
        <div className="flex justify-between items-start mb-2">
          <div className="min-w-0 flex-1">
            <h4 className="font-semibold text-sm line-clamp-2">{task.title}</h4>
          </div>
          <div className="ml-2 shrink-0">{getStatusIconHelper(task.status)}</div>
        </div>
        {task.description && (
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
            {task.description}
          </p>
        )}
        <div className="flex justify-between items-center mt-2">
          <Badge
            variant={
              task.status === "completed" || task.status === "done"
                ? "default"
                : task.status === "in_progress"
                  ? "secondary"
                  : "outline"
            }
            className="text-[10px] px-1 py-0"
          >
            {task.status}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

function SortableTaskCard({ task, projectId }: { task: Task; projectId: number }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Link
        href={`/projects/${projectId}/tasks/${task.id}`}
        className="block no-underline text-inherit"
      >
        <TaskKanbanCard task={task} />
      </Link>
    </div>
  );
}

function TaskKanbanColumn({
  id,
  label,
  tasks: columnTasks,
  projectId,
  statusSubtext,
}: {
  id: string;
  label: string;
  tasks: Task[];
  projectId: number;
  statusSubtext: string;
}) {
  const { setNodeRef } = useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      className="flex-shrink-0 w-72 border-[0.5px] border-gray-200 bg-white rounded-none h-full overflow-y-auto flex flex-col"
    >
      <div className="border-b border-gray-200 px-3 py-2 flex-shrink-0">
        <h3 className="font-medium text-sm text-gray-900">{label}</h3>
        <p className="text-xs text-gray-500 mt-0.5">{statusSubtext}</p>
      </div>
      <div className="flex-1 p-2 min-h-0 overflow-y-auto">
        <SortableContext
          id={id}
          items={columnTasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2 min-h-[80px]">
            {columnTasks.map((task) => (
              <SortableTaskCard
                key={task.id}
                task={task}
                projectId={projectId}
              />
            ))}
            {columnTasks.length === 0 && (
              <div className="text-sm text-gray-400 text-center py-6 italic border border-dashed border-gray-200">
                Drop here
              </div>
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  );
}

function TaskBoard({
  tasks,
  projectId,
  onTaskUpdate,
}: {
  tasks: Task[];
  projectId: number;
  onTaskUpdate: () => void;
}) {
  const [activeDragTask, setActiveDragTask] = useState<Task | null>(null);

  const columns = [
    { key: "backlog", label: "Backlog" },
    { key: "todo", label: "To Do" },
    { key: "in_progress", label: "In Progress" },
    { key: "review", label: "Review" },
    { key: "done", label: "Done" },
  ];

  const getTasksByStatus = (status: string) => {
    return tasks.filter(
      (task) =>
        STATUS_TO_COLUMN[task.status] === status || task.status === status,
    );
  };

  const getStatusSubtext = (columnTasks: Task[]) =>
    `${columnTasks.length} task${columnTasks.length !== 1 ? "s" : ""}`;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor),
  );

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    if (task) setActiveDragTask(task);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragTask(null);
    if (!over) return;

    const task = tasks.find((t) => t.id === active.id);
    if (!task) return;

    let newColumn = "";
    if (TASK_COLUMN_KEYS.includes(String(over.id))) {
      newColumn = String(over.id);
    } else {
      const overTask = tasks.find((t) => t.id === over.id);
      if (overTask) {
        newColumn = STATUS_TO_COLUMN[overTask.status] || overTask.status;
      } else {
        return;
      }
    }

    const newStatus = COLUMN_TO_STATUS[newColumn] || newColumn;
    const currentColumn =
      STATUS_TO_COLUMN[task.status] || task.status || "backlog";
    if (newColumn === currentColumn) return;

    try {
      await projectsApi.updateTask(projectId, task.id, { status: newStatus });
      onTaskUpdate();
    } catch (err) {
      console.error("Error updating task status", err);
    }
  };

  return (
    <div className="min-h-[260px] h-[calc(100vh-260px)] sm:h-[calc(100vh-280px)] border-[0.5px] border-gray-200 bg-white overflow-hidden flex flex-col">
      <div className="flex flex-1 min-h-0 overflow-x-auto border-t">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex h-full py-0">
            {columns.map((col) => {
              const columnTasks = getTasksByStatus(col.key);
              return (
                <TaskKanbanColumn
                  key={col.key}
                  id={col.key}
                  label={col.label}
                  tasks={columnTasks}
                  projectId={projectId}
                  statusSubtext={getStatusSubtext(columnTasks)}
                />
              );
            })}
          </div>
          <DragOverlay>
            {activeDragTask ? (
              <TaskKanbanCard task={activeDragTask} />
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
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
  const router = useRouter();

  // Column Definitions
  const [columns, setColumns] = useState([
    { id: "status", label: "Status", width: "w-[150px]" },
    { id: "title", label: "Title" },
    { id: "priority", label: "Priority" },
    { id: "complexity", label: "Complexity" },
    { id: "start_date", label: "Start Date" },
    { id: "end_date", label: "End Date" },
    { id: "created_at", label: "Created At", align: "right" },
  ]);

  // Selection State
  const [selectedTasks, setSelectedTasks] = useState<Set<number>>(new Set());

  // Drag and Drop State
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null);

  // Sorting State
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);

  // Filter State
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [showFilters, setShowFilters] = useState(false);

  // Toggle all selection
  const toggleSelectAll = () => {
    if (processedTasks.length === 0) return;
    if (selectedTasks.size === processedTasks.length) {
      setSelectedTasks(new Set());
    } else {
      setSelectedTasks(new Set(processedTasks.map((t) => t.id)));
    }
  };

  // Toggle individual selection
  const toggleSelect = (taskId: number) => {
    const newSelected = new Set(selectedTasks);
    if (newSelected.has(taskId)) {
      newSelected.delete(taskId);
    } else {
      newSelected.add(taskId);
    }
    setSelectedTasks(newSelected);
  };

  // Sort Handler
  const handleSort = (columnId: string) => {
    let direction: "asc" | "desc" = "asc";
    if (
      sortConfig &&
      sortConfig.key === columnId &&
      sortConfig.direction === "asc"
    ) {
      direction = "desc";
    }
    setSortConfig({ key: columnId, direction });
  };

  // Filter Handler
  const handleFilterChange = (columnId: string, value: string) => {
    setFilters((prev) => ({ ...prev, [columnId]: value }));
  };

  // Drag Handlers
  const handleDragStart = (e: React.DragEvent, columnId: string) => {
    setDraggedColumn(columnId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetColumnId: string) => {
    e.preventDefault();
    if (!draggedColumn || draggedColumn === targetColumnId) {
      setDraggedColumn(null);
      return;
    }

    const newColumns = [...columns];
    const draggedIdx = newColumns.findIndex((c) => c.id === draggedColumn);
    const targetIdx = newColumns.findIndex((c) => c.id === targetColumnId);

    if (draggedIdx !== -1 && targetIdx !== -1) {
      const [removed] = newColumns.splice(draggedIdx, 1);
      newColumns.splice(targetIdx, 0, removed);
      setColumns(newColumns);
    }
    setDraggedColumn(null);
  };

  // Processed Tasks (Filtered & Sorted)
  const processedTasks = [...tasks]
    .filter((task) => {
      return columns.every((col) => {
        const filterValue = filters[col.id];
        if (!filterValue) return true;

        let taskValue = "";
        // Handle specific type conversions for filtering
        if (
          col.id === "created_at" ||
          col.id === "start_date" ||
          col.id === "end_date"
        ) {
          const dateVal = task[col.id as keyof Task];
          taskValue = dateVal
            ? new Date(String(dateVal)).toLocaleDateString()
            : "";
        } else {
          taskValue = String(task[col.id as keyof Task] || "");
        }

        return taskValue.toLowerCase().includes(filterValue.toLowerCase());
      });
    })
    .sort((a, b) => {
      if (!sortConfig) return 0;
      const { key, direction } = sortConfig;

      const valA = a[key as keyof Task];
      const valB = b[key as keyof Task];

      if (valA === valB) return 0;
      if (valA === undefined || valA === null) return 1;
      if (valB === undefined || valB === null) return -1;

      const compareRes = valA < valB ? -1 : 1;
      return direction === "asc" ? compareRes : -compareRes;
    });

  const renderCellContent = (task: Task, columnId: string) => {
    switch (columnId) {
      case "status":
        return (
          <div className="flex items-center gap-2">
            {getStatusIconHelper(task.status)}
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
        );
      case "title":
        return (
          <div className="font-medium">
            {task.title}
            {task.description && (
              <div className="text-xs text-gray-500 line-clamp-1 mt-0.5">
                {task.description}
              </div>
            )}
          </div>
        );
      case "priority":
        return task.priority ? (
          <Badge variant="outline" className="text-xs capitalize">
            {task.priority}
          </Badge>
        ) : null;
      case "complexity":
        return task.complexity ? (
          <span className="text-sm text-gray-600 capitalize">
            {task.complexity}
          </span>
        ) : null;
      case "start_date":
        return (
          <span className="text-sm text-gray-600">
            {task.start_date
              ? new Date(task.start_date).toLocaleDateString()
              : "-"}
          </span>
        );
      case "end_date":
        return (
          <span className="text-sm text-gray-600">
            {task.end_date ? new Date(task.end_date).toLocaleDateString() : "-"}
          </span>
        );
      case "created_at":
        return (
          <div className="text-right text-sm text-gray-500">
            {new Date(task.created_at).toLocaleDateString()}
          </div>
        );
      default:
        return null;
    }
  };

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
      <CardHeader className="py-3 px-4 flex flex-row items-center justify-between space-y-0">
        <div className="text-sm font-medium text-gray-500">
          {processedTasks.length} task{processedTasks.length !== 1 && "s"}
        </div>
        <Button
          variant={showFilters ? "secondary" : "ghost"}
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="h-8"
        >
          <Filter className="h-4 w-4 mr-2" />
          Filters
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              {/* Checkbox Column */}
              <TableHead className="w-[40px]">
                <input
                  type="checkbox"
                  checked={
                    processedTasks.length > 0 &&
                    selectedTasks.size === processedTasks.length
                  }
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </TableHead>
              {/* Dynamic Columns */}
              {columns.map((column) => (
                <TableHead
                  key={column.id}
                  className={`
                    ${column.width || ""} 
                    ${column.align === "right" ? "text-right" : ""}
                    cursor-pointer hover:bg-gray-100 transition-colors select-none group
                  `}
                  draggable
                  onDragStart={(e) => handleDragStart(e, column.id)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, column.id)}
                  onClick={() => handleSort(column.id)}
                >
                  <div
                    className={`flex items-center gap-1 ${column.align === "right" ? "justify-end" : ""}`}
                  >
                    <GripVertical
                      className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing"
                      onMouseDown={(e) => e.stopPropagation()} // Prevent sort on drag handle click? Actually drag starts on mouse down, click is mouse up.
                      onClick={(e) => e.stopPropagation()}
                    />
                    {column.label}
                    {sortConfig?.key === column.id ? (
                      sortConfig.direction === "asc" ? (
                        <ArrowUp className="h-3 w-3" />
                      ) : (
                        <ArrowDown className="h-3 w-3" />
                      )
                    ) : (
                      <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-30" />
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>
            {/* Filter Row */}
            {showFilters && (
              <TableRow className="bg-gray-50 hover:bg-gray-50">
                <TableHead className="w-[40px]"></TableHead>
                {columns.map((column) => (
                  <TableHead key={`${column.id}-filter`} className="p-2">
                    <Input
                      placeholder={`Filter...`}
                      value={filters[column.id] || ""}
                      onChange={(e) =>
                        handleFilterChange(column.id, e.target.value)
                      }
                      className="h-7 text-xs bg-white"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </TableHead>
                ))}
              </TableRow>
            )}
          </TableHeader>
          <TableBody>
            {processedTasks.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + 1}
                  className="h-24 text-center"
                >
                  No results found.
                </TableCell>
              </TableRow>
            ) : (
              processedTasks.map((task) => (
                <TableRow
                  key={task.id}
                  className={`hover:bg-gray-50 ${
                    selectedTasks.has(task.id) ? "bg-blue-50/50" : ""
                  }`}
                >
                  {/* Checkbox Cell */}
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedTasks.has(task.id)}
                      onChange={() => toggleSelect(task.id)}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </TableCell>
                  {/* Dynamic Cells */}
                  {columns.map((column) => (
                    <TableCell
                      key={column.id}
                      className="cursor-pointer"
                      onClick={() =>
                        router.push(`/projects/${projectId}/tasks/${task.id}`)
                      }
                    >
                      {renderCellContent(task, column.id)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
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
        <Link key={task.id} href={`/projects/${projectId}/tasks/${task.id}`}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
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
        </Link>
      ))}
    </div>
  );
}

// Task Calendar View Component
function TaskCalendarView({
  tasks,
  projectId,
  onUpdate,
}: {
  tasks: Task[];
  projectId: number;
  onUpdate: () => void;
}) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const prevMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1),
    );
  };

  const nextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1),
    );
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const days = [];
  // Add empty slots for days before start of month
  for (let i = 0; i < firstDay; i++) {
    days.push(
      <div
        key={`empty-${i}`}
        className="h-32 bg-gray-50/50 border-b border-r"
      />,
    );
  }

  // Add actual days
  for (let d = 1; d <= daysInMonth; d++) {
    const currentDayDate = new Date(year, month, d);
    currentDayDate.setHours(0, 0, 0, 0);

    const isToday =
      d === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear();

    // Find tasks active on this day
    const dayTasks = tasks.filter((task) => {
      const startDate = task.start_date
        ? new Date(task.start_date)
        : new Date(task.created_at);
      startDate.setHours(0, 0, 0, 0);

      const endDate = task.end_date
        ? new Date(task.end_date)
        : new Date(startDate);
      endDate.setHours(0, 0, 0, 0);

      // Ensure endDate is at least startDate (sanity check)
      if (endDate < startDate) {
        endDate.setTime(startDate.getTime());
      }

      return currentDayDate >= startDate && currentDayDate <= endDate;
    });

    days.push(
      <div
        key={`day-${d}`}
        className={`h-32 border-b border-r p-2 overflow-y-auto ${isToday ? "bg-blue-50" : "bg-white"}`}
      >
        <div
          className={`text-sm font-medium mb-1 ${isToday ? "text-blue-600" : "text-gray-700"}`}
        >
          {d}
        </div>
        <div className="space-y-1">
          {dayTasks.map((task) => (
            <Link
              key={task.id}
              href={`/projects/${projectId}/tasks/${task.id}`}
            >
              <div
                className="text-xs p-1 rounded border shadow-sm truncate cursor-pointer hover:shadow-md transition-shadow"
                style={{
                  backgroundColor:
                    task.status === "completed" || task.status === "done"
                      ? "#f0fdf4" // green-50
                      : task.status === "in_progress"
                        ? "#fefce8" // yellow-50
                        : "#ffffff", // white
                  borderColor:
                    task.status === "completed" || task.status === "done"
                      ? "#bbf7d0" // green-200
                      : task.status === "in_progress"
                        ? "#fde047" // yellow-200
                        : "#e5e7eb", // gray-200
                }}
              >
                {task.title}
              </div>
            </Link>
          ))}
        </div>
      </div>,
    );
  }

  return (
    <Card>
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {monthNames[month]} {year}
          </h2>
          <div className="flex items-center border rounded-md">
            <Button
              variant="ghost"
              size="icon"
              onClick={prevMonth}
              className="h-8 w-8 hover:bg-gray-100"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={nextMonth}
              className="h-8 w-8 hover:bg-gray-100"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentDate(new Date())}
        >
          Today
        </Button>
      </div>
      <CardContent className="p-0">
        <div className="grid grid-cols-7 border-b bg-gray-50">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider border-r last:border-r-0"
            >
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 border-l">{days}</div>
      </CardContent>
    </Card>
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

// Tree node interface for pages/views
interface TreeNode {
  name: string;
  children: TreeNode[];
  fullPath: string;
  isExpanded?: boolean;
}

// Pages Tree View Component
function PagesTreeView({ pagesViews }: { pagesViews: string[] }) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Build tree structure from pages/views array
  const buildTree = (pages: string[]): TreeNode[] => {
    const nodeMap = new Map<string, TreeNode>();
    const rootNodes = new Set<string>();

    // Process each page/view
    pages.forEach((page) => {
      // Handle both "->" and "->" with spaces
      const parts = page
        .split(/\s*->\s*/)
        .map((p) => p.trim())
        .filter((p) => p.length > 0);

      if (parts.length === 0) {
        // If no "->" separator, treat as a single root node
        if (!nodeMap.has(page)) {
          const node: TreeNode = {
            name: page,
            children: [],
            fullPath: page,
          };
          nodeMap.set(page, node);
          rootNodes.add(page);
        }
        return;
      }

      // Build nodes for each part of the path
      parts.forEach((part, index) => {
        // Build the path for this node
        const pathParts = parts.slice(0, index + 1);
        const path = pathParts.join(" -> ");

        // Skip if node already exists
        if (nodeMap.has(path)) return;

        // Create new node
        const node: TreeNode = {
          name: part,
          children: [],
          fullPath: path,
        };
        nodeMap.set(path, node);

        if (index === 0) {
          // Mark as root node
          rootNodes.add(path);
        } else {
          // Child node - find parent and add to it
          const parentPath = pathParts.slice(0, index).join(" -> ");
          const parent = nodeMap.get(parentPath);
          if (parent) {
            parent.children.push(node);
          }
        }
      });
    });

    // Sort children alphabetically and return sorted root nodes
    const sortTree = (nodes: TreeNode[]): TreeNode[] => {
      return nodes
        .map((node) => ({
          ...node,
          children: sortTree(node.children),
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
    };

    // Return only root nodes, sorted
    return sortTree(
      Array.from(rootNodes)
        .map((path) => nodeMap.get(path))
        .filter((node): node is TreeNode => node !== undefined),
    );
  };

  const tree = buildTree(pagesViews);

  // Toggle node expansion
  const toggleNode = (path: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedNodes(newExpanded);
  };

  // Render tree node recursively
  const renderTreeNode = (node: TreeNode, level: number = 0) => {
    const hasChildren = node.children.length > 0;
    const isExpanded = expandedNodes.has(node.fullPath);
    const indent = level * 20;

    return (
      <div key={node.fullPath} className="select-none">
        <div
          className="flex items-center py-2 px-3 hover:bg-gray-50 rounded-md transition-colors group cursor-pointer"
          style={{ paddingLeft: `${indent + 12}px` }}
          onClick={() => hasChildren && toggleNode(node.fullPath)}
        >
          {hasChildren ? (
            <button
              type="button"
              className="mr-1 flex-shrink-0 text-gray-400 hover:text-gray-600"
              onClick={(e) => {
                e.stopPropagation();
                toggleNode(node.fullPath);
              }}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          ) : (
            <div className="w-5 mr-1 flex-shrink-0" /> // Spacer for alignment
          )}
          {hasChildren ? (
            <Folder className="h-4 w-4 text-blue-500 mr-2 flex-shrink-0" />
          ) : (
            <File className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
          )}
          <span className="text-sm text-gray-700 font-medium">{node.name}</span>
          {node.fullPath.includes(" -> ") && (
            <span className="text-xs text-gray-400 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
              ({node.fullPath})
            </span>
          )}
        </div>
        {hasChildren && isExpanded && (
          <div
            className="border-l border-gray-200 ml-6"
            style={{ marginLeft: `${indent + 24}px` }}
          >
            {node.children.map((child) => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="border border-gray-200 rounded-lg bg-white">
      <div className="p-3 space-y-1">
        {tree.length === 0 ? (
          <div className="text-sm text-gray-500 py-2">No pages/views</div>
        ) : (
          tree.map((node) => renderTreeNode(node))
        )}
      </div>
    </div>
  );
}

function AddTaskDialog({
  open,
  onOpenChange,
  projectId,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: number;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("pending");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    try {
      await projectsApi.createTask(projectId, {
        title,
        description,
        status,
      });

      onSuccess();
      onOpenChange(false);
      setTitle("");
      setDescription("");
      setStatus("pending");
    } catch (error) {
      console.error("Failed to create task:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Task</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="task-title">Title</Label>
            <Input
              id="task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="task-desc">Description</Label>
            <Textarea
              id="task-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Task description"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="task-status">Status</Label>
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
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Add Task"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Commits View Component
function CommitsView({ projectId }: { projectId: number }) {
  const [commits, setCommits] = useState<GitHubCommit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [repository, setRepository] = useState<{
    owner: string;
    name: string;
    branch: string;
  } | null>(null);

  useEffect(() => {
    const fetchCommits = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await integrationsApi.getGitHubCommits(projectId);
        setCommits(data.data);
        setRepository(data.repository);
      } catch (err) {
        console.error("Error fetching commits:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch commits",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCommits();
  }, [projectId]);

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            GitHub Commits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">
              No GitHub integration configured
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Configure GitHub integration in the Integrations tab to view
              commits
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            GitHub Commits
          </CardTitle>
          {repository && (
            <Badge variant="outline" className="font-mono text-xs">
              <Github className="h-3 w-3 mr-1" />
              {repository.owner}/{repository.name} ({repository.branch})
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {commits.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No commits found</p>
        ) : (
          <div className="space-y-4">
            {commits.map((commit) => (
              <div
                key={commit.sha}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="font-medium text-sm mb-1">
                      {commit.commit.message.split("\n")[0]}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      {commit.author && (
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>{commit.author.login}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>
                          {new Date(
                            commit.commit.author.date,
                          ).toLocaleDateString()}
                        </span>
                      </div>
                      <code className="bg-gray-100 px-1.5 py-0.5 rounded font-mono">
                        {commit.sha.substring(0, 7)}
                      </code>
                    </div>
                  </div>
                  <a
                    href={commit.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Integrations View Component
function IntegrationsView({ projectId }: { projectId: number }) {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGitHubDialog, setShowGitHubDialog] = useState(false);

  useEffect(() => {
    fetchIntegrations();
  }, [projectId]);

  const fetchIntegrations = async () => {
    try {
      setLoading(true);
      const data = await integrationsApi.getAll(projectId);
      setIntegrations(data.data);
    } catch (err) {
      console.error("Error fetching integrations:", err);
    } finally {
      setLoading(false);
    }
  };

  const githubIntegration = integrations.find(
    (i) => i.integration_type === "github",
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Integrations</CardTitle>
            {!githubIntegration && (
              <Button onClick={() => setShowGitHubDialog(true)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Integration
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* GitHub Integration Card */}
            <div
              className={`border rounded-lg p-4 ${githubIntegration ? "bg-green-50 border-green-200" : "bg-gray-50"}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-black flex items-center justify-center">
                    <Github className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-medium">GitHub</h3>
                    <p className="text-xs text-gray-600">
                      {githubIntegration ? "Connected" : "Not connected"}
                    </p>
                  </div>
                </div>
                {githubIntegration ? (
                  <Badge variant="default" className="bg-green-600">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                ) : (
                  <Badge variant="outline">Inactive</Badge>
                )}
              </div>
              {githubIntegration && (
                <div className="mt-3 pt-3 border-t text-sm space-y-1">
                  <p className="font-mono text-xs text-gray-600">
                    {githubIntegration.config.repo_owner}/
                    {githubIntegration.config.repo_name}
                  </p>
                  <p className="text-xs text-gray-500">
                    Branch: {githubIntegration.config.branch || "main"}
                  </p>
                </div>
              )}
              <div className="mt-3 flex gap-2">
                {githubIntegration ? (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => setShowGitHubDialog(true)}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={async () => {
                        if (
                          confirm("Are you sure you want to disconnect GitHub?")
                        ) {
                          try {
                            await integrationsApi.delete(
                              projectId,
                              githubIntegration.id,
                            );
                            fetchIntegrations();
                          } catch (err) {
                            console.error("Error deleting integration:", err);
                          }
                        }
                      }}
                    >
                      Disconnect
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => setShowGitHubDialog(true)}
                  >
                    Connect
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <GitHubIntegrationDialog
        open={showGitHubDialog}
        onOpenChange={setShowGitHubDialog}
        projectId={projectId}
        existingIntegration={githubIntegration}
        onSuccess={() => {
          fetchIntegrations();
          setShowGitHubDialog(false);
        }}
      />
    </div>
  );
}

// GitHub Integration Dialog Component
function GitHubIntegrationDialog({
  open,
  onOpenChange,
  projectId,
  existingIntegration,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: number;
  existingIntegration?: Integration;
  onSuccess: () => void;
}) {
  const [repoOwner, setRepoOwner] = useState(
    existingIntegration?.config.repo_owner || "",
  );
  const [repoName, setRepoName] = useState(
    existingIntegration?.config.repo_name || "",
  );
  const [accessToken, setAccessToken] = useState(
    existingIntegration?.config.access_token || "",
  );
  const [branch, setBranch] = useState(
    existingIntegration?.config.branch || "main",
  );
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const handleTest = async () => {
    if (!repoOwner || !repoName) {
      setTestResult({
        success: false,
        message: "Repository owner and name are required",
      });
      return;
    }

    try {
      setTesting(true);
      setTestResult(null);
      const result = await integrationsApi.testGitHub({
        repo_owner: repoOwner,
        repo_name: repoName,
        access_token: accessToken || undefined,
      });

      if (result.success) {
        setTestResult({
          success: true,
          message: `Successfully connected to ${result.repository?.full_name}`,
        });
      } else {
        setTestResult({
          success: false,
          message: result.error || "Failed to connect to repository",
        });
      }
    } catch (err) {
      setTestResult({
        success: false,
        message:
          err instanceof Error ? err.message : "Failed to test connection",
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    if (!repoOwner || !repoName) {
      setTestResult({
        success: false,
        message: "Repository owner and name are required",
      });
      return;
    }

    try {
      setSaving(true);
      await integrationsApi.save(projectId, {
        integration_type: "github",
        config: {
          repo_owner: repoOwner,
          repo_name: repoName,
          access_token: accessToken || undefined,
          branch,
        },
        is_active: true,
      });
      onSuccess();
    } catch (err) {
      setTestResult({
        success: false,
        message:
          err instanceof Error ? err.message : "Failed to save integration",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Github className="h-5 w-5" />
            GitHub Integration
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="repo-owner">Repository Owner</Label>
            <Input
              id="repo-owner"
              value={repoOwner}
              onChange={(e) => setRepoOwner(e.target.value)}
              placeholder="octocat"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="repo-name">Repository Name</Label>
            <Input
              id="repo-name"
              value={repoName}
              onChange={(e) => setRepoName(e.target.value)}
              placeholder="Hello-World"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="branch">Branch</Label>
            <Input
              id="branch"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              placeholder="main"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="access-token">
              Access Token{" "}
              <span className="text-xs text-gray-500">
                (Optional for public repos)
              </span>
            </Label>
            <Input
              id="access-token"
              type="password"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
            />
            <p className="text-xs text-gray-500">
              Generate a personal access token at{" "}
              <a
                href="https://github.com/settings/tokens"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                github.com/settings/tokens
              </a>
            </p>
          </div>

          {testResult && (
            <div
              className={`p-3 rounded-lg text-sm ${
                testResult.success
                  ? "bg-green-50 text-green-800 border border-green-200"
                  : "bg-red-50 text-red-800 border border-red-200"
              }`}
            >
              {testResult.message}
            </div>
          )}

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleTest}
              disabled={testing || !repoOwner || !repoName}
              className="flex-1"
            >
              {testing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Test Connection
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !repoOwner || !repoName}
              className="flex-1"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {existingIntegration ? "Update" : "Save"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
