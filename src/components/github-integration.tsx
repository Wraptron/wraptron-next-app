"use client";

import React, { useState, useEffect } from "react";
import {
  githubApi,
  type GitHubConnection,
  type GitHubRepo,
  type ProjectGitHubRepository,
} from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Star,
  GitFork,
  Loader2,
  Settings,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import { GitHubProjectsIntegration } from "./github-projects-integration";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface GitHubIntegrationProps {
  projectId: number;
}

export function GitHubIntegration({ projectId }: GitHubIntegrationProps) {
  const [connections, setConnections] = useState<GitHubConnection[]>([]);
  const [linkedRepos, setLinkedRepos] = useState<ProjectGitHubRepository[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Dialog states
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState<ProjectGitHubRepository | null>(null);

  // Link repository form states
  const [selectedConnectionId, setSelectedConnectionId] = useState<string>("");
  const [availableRepos, setAvailableRepos] = useState<GitHubRepo[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [selectedRepoId, setSelectedRepoId] = useState<string>("");
  const [branch, setBranch] = useState("main");
  const [isPrimary, setIsPrimary] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [projectId]);

  useEffect(() => {
    if (selectedConnectionId) {
      fetchRepositories(parseInt(selectedConnectionId));
    } else {
      setAvailableRepos([]);
      setSelectedRepoId("");
    }
  }, [selectedConnectionId]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [connectionsRes, reposRes] = await Promise.all([
        githubApi.getConnections(),
        githubApi.getProjectRepositories(projectId),
      ]);
      setConnections(connectionsRes.data);
      setLinkedRepos(reposRes.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const fetchRepositories = async (connectionId: number, retryCount = 0) => {
    setLoadingRepos(true);
    setError(null);
    
    try {
      const response = await githubApi.getConnectionRepositories(connectionId);
      setAvailableRepos(response.data);
    } catch (err: any) {
      console.error("Error fetching repositories:", err);
      
      // Handle broken pipe and network errors with retry
      const isNetworkError = 
        err?.message?.includes("Broken pipe") ||
        err?.message?.includes("Failed to fetch") ||
        err?.message?.includes("NetworkError") ||
        err?.message?.includes("ECONNRESET") ||
        err?.name === "TypeError";
      
      if (isNetworkError && retryCount < 2) {
        // Retry after a short delay
        console.log(`Retrying fetch repositories (attempt ${retryCount + 1}/2)...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        return fetchRepositories(connectionId, retryCount + 1);
      }
      
      // Provide user-friendly error messages
      let errorMessage = "Failed to fetch repositories";
      if (err?.message?.includes("Broken pipe")) {
        errorMessage = "Connection interrupted. Please check if the backend server is running and try again.";
      } else if (err?.message?.includes("Failed to fetch")) {
        errorMessage = "Cannot connect to the server. Please ensure the backend is running on " + 
          (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000");
      } else if (err?.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      setAvailableRepos([]);
    } finally {
      setLoadingRepos(false);
    }
  };

  const handleLinkRepository = async () => {
    if (!selectedConnectionId || !selectedRepoId) {
      setError("Please select a connection and repository");
      return;
    }

    const selectedRepo = availableRepos.find(r => r.id.toString() === selectedRepoId);
    if (!selectedRepo) return;

    setFormLoading(true);
    setError(null);
    try {
      await githubApi.linkRepository(projectId, {
        github_connection_id: parseInt(selectedConnectionId),
        repo_owner: selectedRepo.owner,
        repo_name: selectedRepo.name,
        branch: branch || selectedRepo.default_branch,
        is_primary: isPrimary,
        sync_enabled: true,
      });
      setSuccessMessage("Repository linked successfully!");
      setLinkDialogOpen(false);
      resetLinkForm();
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to link repository");
    } finally {
      setFormLoading(false);
    }
  };

  const handleUnlinkRepository = async () => {
    if (!selectedRepo) return;

    setFormLoading(true);
    setError(null);
    try {
      await githubApi.removeRepositoryLink(projectId, selectedRepo.id);
      setSuccessMessage("Repository unlinked successfully!");
      setDeleteDialogOpen(false);
      setSelectedRepo(null);
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to unlink repository");
    } finally {
      setFormLoading(false);
    }
  };

  const resetLinkForm = () => {
    setSelectedConnectionId("");
    setAvailableRepos([]);
    setSelectedRepoId("");
    setBranch("main");
    setIsPrimary(false);
  };

  const openLinkDialog = () => {
    resetLinkForm();
    setLinkDialogOpen(true);
  };

  const openDeleteDialog = (repo: ProjectGitHubRepository) => {
    setSelectedRepo(repo);
    setDeleteDialogOpen(true);
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
      {/* Success Message */}
      {successMessage && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{successMessage}</AlertDescription>
        </Alert>
      )}

      {/* Error Message */}
      {error && (
        <Alert className="bg-red-50 border-red-200">
          <XCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {error}
            {error.includes("Cannot connect to the server") && (
              <div className="mt-2 text-sm">
                <p className="font-medium mb-1">Troubleshooting:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Check if the backend server is running</li>
                  <li>Verify the API URL: {process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}</li>
                  <li>Check backend console for errors</li>
                  <li>Try refreshing the page</li>
                </ul>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs for Repositories and Projects */}
      <Tabs defaultValue="repositories" className="space-y-4">
        <TabsList>
          <TabsTrigger value="repositories">Repositories</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
        </TabsList>

        <TabsContent value="repositories" className="space-y-4">
          {/* Main Card */}
          <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Github className="h-5 w-5" />
                GitHub Repositories
              </CardTitle>
              <CardDescription className="mt-2">
                Link GitHub repositories from your global connections
              </CardDescription>
            </div>
            {connections.length > 0 ? (
              <Button onClick={openLinkDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Link Repository
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
          ) : linkedRepos.length === 0 ? (
            <div className="text-center py-12">
              <Github className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">No repositories linked</h3>
              <p className="text-gray-600 mb-4">
                Link repositories from your GitHub connections to this project
              </p>
              <Button onClick={openLinkDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Link Your First Repository
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {linkedRepos.map((repo) => (
                <div
                  key={repo.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Github className="h-4 w-4 text-gray-600" />
                        <span className="font-mono text-sm font-medium">
                          {repo.repo_owner}/{repo.repo_name}
                        </span>
                        {repo.is_primary && (
                          <Badge className="bg-blue-100 text-blue-800">Primary</Badge>
                        )}
                        {repo.sync_enabled ? (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Syncing
                          </Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-800">Paused</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>Branch: {repo.branch}</span>
                        <span>Connection: {repo.connection_name}</span>
                        {repo.last_synced_at && (
                          <span>
                            Last synced: {new Date(repo.last_synced_at).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <a
                        href={`https://github.com/${repo.repo_owner}/${repo.repo_name}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDeleteDialog(repo)}
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

      {/* Link Repository Dialog */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Link GitHub Repository</DialogTitle>
            <DialogDescription>
              Select a repository from your GitHub connections to link to this project
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
              <>
                <div className="space-y-2">
                  <Label htmlFor="repository">Repository</Label>
                  {loadingRepos ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                    </div>
                  ) : availableRepos.length === 0 && !loadingRepos ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500 mb-2">No repositories found</p>
                      <p className="text-xs text-gray-400">
                        Make sure your GitHub token has the <code className="bg-gray-100 px-1 py-0.5 rounded">repo</code> scope
                      </p>
                    </div>
                  ) : (
                    <Select value={selectedRepoId} onValueChange={setSelectedRepoId}>
                      <SelectTrigger id="repository">
                        <SelectValue placeholder="Select a repository" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableRepos.map((repo) => (
                          <SelectItem key={repo.id} value={repo.id.toString()}>
                            <div className="flex items-center gap-2">
                              <span>{repo.full_name}</span>
                              {repo.private && (
                                <Badge variant="outline" className="text-xs">
                                  Private
                                </Badge>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {selectedRepoId && (
                  <>
                    {(() => {
                      const repo = availableRepos.find(r => r.id.toString() === selectedRepoId);
                      return repo ? (
                        <div className="rounded-lg border p-4 bg-gray-50">
                          <div className="flex items-start gap-3">
                            <Github className="h-5 w-5 text-gray-600 mt-0.5" />
                            <div className="flex-1 space-y-2">
                              <div>
                                <h4 className="font-medium">{repo.name}</h4>
                                {repo.description && (
                                  <p className="text-sm text-gray-600 mt-1">
                                    {repo.description}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                {repo.language && <span>{repo.language}</span>}
                                <span className="flex items-center gap-1">
                                  <Star className="h-3 w-3" />
                                  {repo.stars}
                                </span>
                                <span className="flex items-center gap-1">
                                  <GitFork className="h-3 w-3" />
                                  {repo.forks}
                                </span>
                                <span>Default: {repo.default_branch}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : null;
                    })()}

                    <div className="space-y-2">
                      <Label htmlFor="branch">Branch</Label>
                      <Input
                        id="branch"
                        value={branch}
                        onChange={(e) => setBranch(e.target.value)}
                        placeholder={
                          availableRepos.find(r => r.id.toString() === selectedRepoId)
                            ?.default_branch || "main"
                        }
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="is-primary"
                        checked={isPrimary}
                        onChange={(e) => setIsPrimary(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <Label htmlFor="is-primary" className="cursor-pointer">
                        Set as primary repository
                      </Label>
                    </div>
                  </>
                )}
              </>
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
              onClick={handleLinkRepository}
              disabled={!selectedRepoId || formLoading}
            >
              {formLoading ? "Linking..." : "Link Repository"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Repository Link Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unlink Repository</DialogTitle>
            <DialogDescription>
              Are you sure you want to unlink "{selectedRepo?.repo_owner}/{selectedRepo?.repo_name}"
              from this project?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setSelectedRepo(null);
              }}
              disabled={formLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleUnlinkRepository}
              disabled={formLoading}
            >
              {formLoading ? "Unlinking..." : "Unlink Repository"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
        </TabsContent>

        <TabsContent value="projects" className="space-y-4">
          <GitHubProjectsIntegration projectId={projectId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
