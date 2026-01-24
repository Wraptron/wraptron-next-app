"use client";

import React, { useState, useEffect } from "react";
import {
  githubApi,
  type ProjectGitHubRepository,
  type GitHubCommit,
} from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Github,
  GitBranch,
  User,
  Clock,
  ExternalLink,
  RefreshCw,
  Loader2,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface GitHubCommitsViewProps {
  projectId: number;
}

export function GitHubCommitsView({ projectId }: GitHubCommitsViewProps) {
  const [repositories, setRepositories] = useState<ProjectGitHubRepository[]>([]);
  const [selectedRepoId, setSelectedRepoId] = useState<number | null>(null);
  const [commits, setCommits] = useState<GitHubCommit[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchRepositories();
  }, [projectId]);

  useEffect(() => {
    if (selectedRepoId) {
      fetchCommits(selectedRepoId);
    } else if (repositories.length > 0) {
      // Auto-select primary repo or first repo
      const primaryRepo = repositories.find(r => r.is_primary) || repositories[0];
      setSelectedRepoId(primaryRepo.id);
      fetchCommits(primaryRepo.id);
    }
  }, [selectedRepoId, repositories]);

  const fetchRepositories = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await githubApi.getProjectRepositories(projectId);
      setRepositories(response.data);
      if (response.data.length > 0) {
        const primaryRepo = response.data.find(r => r.is_primary) || response.data[0];
        setSelectedRepoId(primaryRepo.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch repositories");
    } finally {
      setLoading(false);
    }
  };

  const fetchCommits = async (repoId: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await githubApi.getRepositoryCommits(projectId, repoId);
      setCommits(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch commits");
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    if (!selectedRepoId) return;

    setSyncing(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Trigger sync via API
      await githubApi.syncRepository(projectId, selectedRepoId);
      setSuccessMessage("Repository synced successfully!");
      
      // Refresh commits after sync
      await fetchCommits(selectedRepoId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sync repository");
    } finally {
      setSyncing(false);
    }
  };

  const selectedRepo = repositories.find(r => r.id === selectedRepoId);

  if (loading && repositories.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </CardContent>
      </Card>
    );
  }

  if (repositories.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            GitHub Commits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">No repositories linked</h3>
            <p className="text-gray-600 mb-4">
              Link GitHub repositories in the Integrations tab to view commits
            </p>
          </div>
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
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {/* Repository Selector and Sync */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="h-5 w-5" />
                GitHub Commits
              </CardTitle>
              <CardDescription className="mt-2">
                View commits from linked GitHub repositories
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {repositories.length > 1 && (
                <Select
                  value={selectedRepoId?.toString() || ""}
                  onValueChange={(value) => setSelectedRepoId(parseInt(value))}
                >
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Select repository" />
                  </SelectTrigger>
                  <SelectContent>
                    {repositories.map((repo) => (
                      <SelectItem key={repo.id} value={repo.id.toString()}>
                        <div className="flex items-center gap-2">
                          <Github className="h-4 w-4" />
                          <span className="font-mono text-sm">
                            {repo.repo_owner}/{repo.repo_name}
                          </span>
                          {repo.is_primary && (
                            <Badge className="ml-2 text-xs">Primary</Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {selectedRepoId && (
                <Button
                  onClick={handleSync}
                  disabled={syncing}
                  variant="outline"
                  size="sm"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
                  {syncing ? "Syncing..." : "Sync Now"}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {selectedRepo && (
            <div className="mb-4 flex items-center gap-2 text-sm text-gray-600">
              <Badge variant="outline" className="font-mono">
                <Github className="h-3 w-3 mr-1" />
                {selectedRepo.repo_owner}/{selectedRepo.repo_name}
              </Badge>
              <span>•</span>
              <span>Branch: {selectedRepo.branch}</span>
              {selectedRepo.last_synced_at && (
                <>
                  <span>•</span>
                  <span>
                    Last synced: {new Date(selectedRepo.last_synced_at).toLocaleString()}
                  </span>
                </>
              )}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : commits.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No commits found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {commits.map((commit) => (
                <div
                  key={commit.sha}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm mb-2 break-words">
                        {commit.commit.message.split('\n')[0]}
                      </p>
                      {commit.commit.message.includes('\n') && (
                        <p className="text-xs text-gray-500 mb-2 line-clamp-2">
                          {commit.commit.message.split('\n').slice(1).join(' ')}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
                        {commit.author && (
                          <div className="flex items-center gap-1">
                            {commit.author.avatar_url && (
                              <img
                                src={commit.author.avatar_url}
                                alt={commit.author.login}
                                className="h-4 w-4 rounded-full"
                              />
                            )}
                            <User className="h-3 w-3" />
                            <span>{commit.author.login}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>
                            {new Date(commit.commit.author.date).toLocaleString()}
                          </span>
                        </div>
                        <code className="bg-gray-100 px-2 py-0.5 rounded font-mono text-xs">
                          {commit.sha.substring(0, 7)}
                        </code>
                      </div>
                    </div>
                    <a
                      href={commit.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 flex-shrink-0"
                      title="View on GitHub"
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
    </div>
  );
}
