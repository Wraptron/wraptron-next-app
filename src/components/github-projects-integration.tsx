"use client";

import React, { useState, useEffect } from "react";
import {
  githubApi,
  type GitHubConnection,
  type GitHubProject,
  type GitHubProjectItem,
} from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Plus,
  Trash2,
  Github,
  ExternalLink,
  Loader2,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Link as LinkIcon,
  List,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { projectsApi, type Task } from "@/lib/api";
import Link from "next/link";
import { Settings } from "lucide-react";

interface GitHubProjectsIntegrationProps {
  projectId: number;
}

export function GitHubProjectsIntegration({ projectId }: GitHubProjectsIntegrationProps) {
  const [connections, setConnections] = useState<GitHubConnection[]>([]);
  const [linkedProjects, setLinkedProjects] = useState<GitHubProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Dialog states
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [itemsDialogOpen, setItemsDialogOpen] = useState(false);
  const [mapDialogOpen, setMapDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<GitHubProject | null>(null);
  const [selectedItem, setSelectedItem] = useState<GitHubProjectItem | null>(null);

  // Link project form states
  const [selectedConnectionId, setSelectedConnectionId] = useState<string>("");
  const [availableProjects, setAvailableProjects] = useState<any[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [formLoading, setFormLoading] = useState(false);

  // Items view states
  const [projectItems, setProjectItems] = useState<GitHubProjectItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Map to task states
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [unmapping, setUnmapping] = useState(false);

  useEffect(() => {
    fetchData();
  }, [projectId]);

  useEffect(() => {
    if (selectedConnectionId) {
      fetchGitHubProjects(parseInt(selectedConnectionId));
    } else {
      setAvailableProjects([]);
      setSelectedProjectId("");
    }
  }, [selectedConnectionId]);

  useEffect(() => {
    if (selectedProject) {
      fetchProjectItems(selectedProject.id);
    }
  }, [selectedProject]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [connectionsRes, projectsRes] = await Promise.all([
        githubApi.getConnections(),
        githubApi.getProjectGitHubProjects(projectId),
      ]);
      setConnections(connectionsRes.data);
      setLinkedProjects(projectsRes.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const fetchGitHubProjects = async (connectionId: number) => {
    setLoadingProjects(true);
    setError(null);
    try {
      console.log(`🔍 Fetching GitHub Projects for connection ${connectionId}...`);
      const response = await githubApi.getConnectionProjects(connectionId);
      console.log("📥 GitHub Projects response:", response);
      setAvailableProjects(response.data);
      
      // Show helpful message if no projects found
      if (response.data.length === 0) {
        console.log("⚠️ No projects in response data");
        if (response.message) {
          const hint = response.hint ? ` ${response.hint}` : "";
          setError(response.message + hint);
        }
        // Log debug info if available
        if ((response as any).debug) {
          console.log("🔍 Debug info:", (response as any).debug);
        }
      } else {
        console.log(`✅ Found ${response.data.length} projects:`, response.data);
      }
    } catch (err: any) {
      console.error("❌ Error fetching GitHub Projects:", err);
      const errorMessage = err?.data?.error || err?.message || "Failed to fetch GitHub Projects";
      const errorHint = err?.data?.hint || "";
      const errorDetails = err?.data?.details || "";
      setError(errorMessage + (errorHint ? ` - ${errorHint}` : "") + (errorDetails ? ` (${errorDetails})` : ""));
      setAvailableProjects([]);
      
      // Log full error for debugging
      if (err?.data?.debug) {
        console.log("🔍 Error debug info:", err.data.debug);
      }
    } finally {
      setLoadingProjects(false);
    }
  };

  const fetchProjectItems = async (githubProjectId: number) => {
    setLoadingItems(true);
    try {
      const response = await githubApi.getGitHubProjectItems(projectId, githubProjectId);
      setProjectItems(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch project items");
    } finally {
      setLoadingItems(false);
    }
  };

  const handleLinkProject = async () => {
    if (!selectedConnectionId || !selectedProjectId) {
      setError("Please select a connection and GitHub Project");
      return;
    }

    const selectedProject = availableProjects.find(p => p.id === selectedProjectId);
    if (!selectedProject) {
      setError("Selected project not found");
      return;
    }

    console.log("🔗 Linking project:", selectedProject);
    console.log("📦 Project ID (GraphQL node ID):", selectedProject.id);

    setFormLoading(true);
    setError(null);
    try {
      // GitHub Project ID is a GraphQL node ID (string like "PVT_kwDO...")
      const linkData = {
        github_connection_id: parseInt(selectedConnectionId),
        github_project_id: selectedProject.id, // Full GraphQL node ID string
        github_project_number: selectedProject.number,
        github_project_title: selectedProject.title,
        github_project_url: selectedProject.url,
        github_owner_type: selectedProject.owner_type,
        github_owner_name: selectedProject.owner_name,
        sync_enabled: true,
        sync_direction: "bidirectional",
      };
      
      console.log("📤 Sending link request:", linkData);
      
      await githubApi.linkGitHubProject(projectId, linkData);
      setSuccessMessage("GitHub Project linked successfully!");
      setLinkDialogOpen(false);
      resetLinkForm();
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to link GitHub Project");
    } finally {
      setFormLoading(false);
    }
  };

  const handleSync = async (githubProjectId: number) => {
    setSyncing(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const result = await githubApi.syncGitHubProject(projectId, githubProjectId);
      setSuccessMessage(`Synced ${result.items_synced} items successfully!`);
      
      if (selectedProject?.id === githubProjectId) {
        await fetchProjectItems(githubProjectId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sync GitHub Project");
    } finally {
      setSyncing(false);
    }
  };

  const handleMapToTask = async () => {
    if (!selectedItem || !selectedTaskId) {
      setError("Please select a task");
      return;
    }

    if (!selectedProject) return;

    setFormLoading(true);
    setError(null);
    try {
      await githubApi.mapProjectItemToTask(
        projectId,
        selectedProject.id,
        selectedItem.id,
        parseInt(selectedTaskId)
      );
      setSuccessMessage("Item mapped to task successfully!");
      setMapDialogOpen(false);
      setSelectedItem(null);
      setSelectedTaskId("");
      await fetchProjectItems(selectedProject.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to map item to task");
    } finally {
      setFormLoading(false);
    }
  };

  const handleUnmapFromTask = async (item: GitHubProjectItem) => {
    if (!selectedProject || !item.mapped_to_task) return;

    setUnmapping(true);
    setError(null);
    try {
      await githubApi.unmapProjectItemFromTask(
        projectId,
        selectedProject.id,
        item.id
      );
      setSuccessMessage("Item unmapped from task successfully!");
      await fetchProjectItems(selectedProject.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to unmap item from task");
    } finally {
      setUnmapping(false);
    }
  };

  const handleUnlink = async () => {
    if (!selectedProject) return;

    setFormLoading(true);
    setError(null);
    try {
      await githubApi.unlinkGitHubProject(projectId, selectedProject.id);
      setSuccessMessage("GitHub Project unlinked successfully!");
      setDeleteDialogOpen(false);
      setSelectedProject(null);
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to unlink GitHub Project");
    } finally {
      setFormLoading(false);
    }
  };

  const resetLinkForm = () => {
    setSelectedConnectionId("");
    setAvailableProjects([]);
    setSelectedProjectId("");
  };

  const openItemsDialog = (project: GitHubProject) => {
    setSelectedProject(project);
    setItemsDialogOpen(true);
  };

  const openMapDialog = (item: GitHubProjectItem) => {
    setSelectedItem(item);
    setMapDialogOpen(true);
    fetchTasks();
  };

  const fetchTasks = async () => {
    setLoadingTasks(true);
    try {
      const project = await projectsApi.getById(projectId);
      setTasks(project.tasks || []);
    } catch (err) {
      console.error("Failed to fetch tasks:", err);
    } finally {
      setLoadingTasks(false);
    }
  };

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
      {/* Success/Error Messages */}
      {successMessage && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{successMessage}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert className="bg-red-50 border-red-200">
          <XCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {/* Main Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <List className="h-5 w-5" />
                GitHub Projects
              </CardTitle>
              <CardDescription className="mt-2">
                Link GitHub Projects for project management and sync items to tasks
              </CardDescription>
            </div>
            {connections.length > 0 ? (
              <Button onClick={() => setLinkDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Link Project
              </Button>
            ) : (
              <Link href="/settings">
                <Button variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  Configure GitHub
                </Button>
              </Link>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {connections.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">No GitHub connections</h3>
              <p className="text-gray-600 mb-4">
                Set up a global GitHub connection in Settings first
              </p>
              <Link href="/settings">
                <Button>
                  <Settings className="h-4 w-4 mr-2" />
                  Go to Settings
                </Button>
              </Link>
            </div>
          ) : linkedProjects.length === 0 ? (
            <div className="text-center py-12">
              <Github className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">No GitHub Projects linked</h3>
              <p className="text-gray-600 mb-4">
                Link GitHub Projects to sync items and map them to tasks
              </p>
              <Button onClick={() => setLinkDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Link Your First Project
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {linkedProjects.map((project) => (
                <div
                  key={project.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Github className="h-4 w-4 text-gray-600" />
                        <span className="font-medium">{project.github_project_title}</span>
                        <Badge variant="outline" className="text-xs">
                          {project.github_owner_name}
                        </Badge>
                        {project.sync_enabled && (
                          <Badge className="bg-green-100 text-green-800 text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Syncing
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>Connection: {project.connection_name}</span>
                        {project.last_synced_at && (
                          <>
                            <span>•</span>
                            <span>
                              Last synced: {new Date(project.last_synced_at).toLocaleString()}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openItemsDialog(project)}
                      >
                        <List className="h-4 w-4 mr-1" />
                        View Items
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSync(project.id)}
                        disabled={syncing}
                      >
                        <RefreshCw className={`h-4 w-4 mr-1 ${syncing ? "animate-spin" : ""}`} />
                        Sync
                      </Button>
                      {project.github_project_url && (
                        <a
                          href={project.github_project_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedProject(project);
                          setDeleteDialogOpen(true);
                        }}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Link Project Dialog */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Link GitHub Project</DialogTitle>
            <DialogDescription>
              Select a GitHub Project to link for project management
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="connection">GitHub Connection</Label>
              <Select value={selectedConnectionId} onValueChange={setSelectedConnectionId}>
                <SelectTrigger id="connection">
                  <SelectValue placeholder="Select a connection" />
                </SelectTrigger>
                <SelectContent>
                  {connections.map((conn) => (
                    <SelectItem key={conn.id} value={conn.id.toString()}>
                      {conn.connection_name} ({conn.github_user})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedConnectionId && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="github-project">GitHub Project</Label>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        try {
                          const response = await fetch(
                            `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/github/connections/${selectedConnectionId}/projects/test`,
                            {
                              headers: {
                                Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
                                "Content-Type": "application/json",
                              },
                            }
                          );
                          const data = (await response.json()) as {
                            success?: boolean;
                            status?: string;
                            response?: { data?: { viewer?: { projectsV2?: { totalCount?: number } } } };
                          };
                          console.log("🔍 Test Results:", data);
                          const totalCount = data.response?.data?.viewer?.projectsV2?.totalCount ?? 0;
                          alert(
                            `Test Results:\n\n` +
                            `Success: ${data.success}\n` +
                            `Total Projects: ${totalCount}\n` +
                            `Status: ${data.status}\n\n` +
                            `Check browser console for full details.`
                          );
                        } catch (err) {
                          console.error("Test failed:", err);
                          alert("Test failed. Check console for details.");
                        }
                      }}
                    >
                      Test API
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => fetchGitHubProjects(parseInt(selectedConnectionId))}
                      disabled={loadingProjects}
                    >
                      <RefreshCw className={`h-4 w-4 mr-1 ${loadingProjects ? "animate-spin" : ""}`} />
                      Refresh
                    </Button>
                  </div>
                </div>
                {loadingProjects ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                  </div>
                ) : availableProjects.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertCircle className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-gray-600 font-medium mb-2">No GitHub Projects found</p>
                    <p className="text-sm text-gray-500 mb-4">
                      GitHub Projects (V2) are different from repositories. You need to create a project first.
                    </p>
                    <div className="space-y-2 text-sm text-left bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                      <p className="font-medium text-blue-900">How to create a GitHub Project:</p>
                      <ol className="list-decimal list-inside space-y-1 text-blue-800">
                        <li>Go to <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="underline">GitHub.com</a></li>
                        <li>Click your profile → "Your projects"</li>
                        <li>Click "New project"</li>
                        <li>Give it a name and create it</li>
                        <li>Come back here and click "Refresh"</li>
                      </ol>
                    </div>
                    <div className="text-xs text-gray-500 space-y-1 mb-4">
                      <p>
                        Make sure your GitHub token has the <code className="bg-gray-100 px-1 py-0.5 rounded">project</code> scope
                      </p>
                      <p>
                        Update your token in <Link href="/settings" className="text-blue-600 hover:underline">Settings</Link> if needed
                      </p>
                    </div>
                    <div className="text-xs text-left bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <p className="font-medium text-yellow-900 mb-1">💡 Debugging Tips:</p>
                      <ul className="list-disc list-inside space-y-1 text-yellow-800">
                        <li>Click "Test API" button above to check if your token can access Projects</li>
                        <li>Check browser console (F12) for detailed error messages</li>
                        <li>Check backend console for GraphQL query results</li>
                        <li>Verify your token has <code className="bg-yellow-100 px-1 py-0.5 rounded">project</code> scope in GitHub Settings</li>
                      </ul>
                    </div>
                  </div>
                ) : (
                  <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                    <SelectTrigger id="github-project">
                      <SelectValue placeholder="Select a GitHub Project" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableProjects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          <div className="flex items-center gap-2">
                            <span>{project.title}</span>
                            <Badge variant="outline" className="text-xs">
                              {project.owner_name}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setLinkDialogOpen(false);
                resetLinkForm();
              }}
              disabled={formLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleLinkProject}
              disabled={!selectedProjectId || formLoading}
            >
              {formLoading ? "Linking..." : "Link Project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Items Dialog */}
      <Dialog open={itemsDialogOpen} onOpenChange={setItemsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedProject?.github_project_title} - Items
            </DialogTitle>
            <DialogDescription>
              View and map GitHub Project items to tasks
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {loadingItems ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : projectItems.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No items found</p>
                <Button
                  className="mt-4"
                  onClick={() => selectedProject && handleSync(selectedProject.id)}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Sync Items
                </Button>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Mapped To</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {projectItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Badge variant="outline">{item.type}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">{item.title}</TableCell>
                        <TableCell>
                          <Badge>{item.status}</Badge>
                        </TableCell>
                        <TableCell>
                          {item.mapped_to_task ? (
                            <div className="flex flex-col gap-1">
                              <Badge className="bg-blue-100 text-blue-800 w-fit">
                                <LinkIcon className="h-3 w-3 mr-1" />
                                {item.mapped_to_task_title || `Task #${item.mapped_to_task}`}
                              </Badge>
                              {item.mapped_to_task_status && (
                                <Badge variant="outline" className="text-xs w-fit">
                                  {item.mapped_to_task_status}
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400">Not mapped</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {item.mapped_to_task ? (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openMapDialog(item)}
                                  title="Change mapping"
                                >
                                  <LinkIcon className="h-3 w-3 mr-1" />
                                  Change
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleUnmapFromTask(item)}
                                  disabled={unmapping}
                                  className="text-red-600 hover:text-red-700"
                                  title="Remove mapping"
                                >
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Unmap
                                </Button>
                              </>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openMapDialog(item)}
                              >
                                <LinkIcon className="h-3 w-3 mr-1" />
                                Map to Task
                              </Button>
                            )}
                            {item.url && (
                              <a
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-700"
                                title="Open in GitHub"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setItemsDialogOpen(false)}>
              Close
            </Button>
            {selectedProject && (
              <Button
                onClick={() => handleSync(selectedProject.id)}
                disabled={syncing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
                {syncing ? "Syncing..." : "Sync Items"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Map to Task Dialog */}
      <Dialog open={mapDialogOpen} onOpenChange={setMapDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedItem?.mapped_to_task ? "Change Task Mapping" : "Map Item to Task"}
            </DialogTitle>
            <DialogDescription>
              {selectedItem?.mapped_to_task ? (
                <>
                  Change the task mapping for "{selectedItem?.title}"
                  {selectedItem.mapped_to_task && (
                    <span className="block mt-1 text-sm text-gray-500">
                      Currently mapped to: Task #{selectedItem.mapped_to_task}
                    </span>
                  )}
                </>
              ) : (
                <>Link "{selectedItem?.title}" to a project task</>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {loadingTasks ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              </div>
            ) : tasks.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">No tasks available in this project</p>
                <p className="text-sm text-gray-400">
                  Create tasks in the Tasks tab to map GitHub Project items
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="task">Select Task</Label>
                <Select value={selectedTaskId} onValueChange={setSelectedTaskId}>
                  <SelectTrigger id="task">
                    <SelectValue placeholder="Select a task" />
                  </SelectTrigger>
                  <SelectContent>
                    {tasks.map((task) => (
                      <SelectItem key={task.id} value={task.id.toString()}>
                        <div className="flex items-center gap-2">
                          <span>{task.title}</span>
                          <Badge variant="outline" className="text-xs">
                            {task.status}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedItem?.mapped_to_task && (
                  <p className="text-xs text-gray-500 mt-2">
                    Selecting a different task will update the mapping
                  </p>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setMapDialogOpen(false);
                setSelectedItem(null);
                setSelectedTaskId("");
              }}
              disabled={formLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleMapToTask}
              disabled={!selectedTaskId || formLoading || tasks.length === 0}
            >
              {formLoading ? "Mapping..." : selectedItem?.mapped_to_task ? "Update Mapping" : "Map to Task"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unlink GitHub Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to unlink "{selectedProject?.github_project_title}"?
              This will also remove all item mappings.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setSelectedProject(null);
              }}
              disabled={formLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleUnlink}
              disabled={formLoading}
            >
              {formLoading ? "Unlinking..." : "Unlink Project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
