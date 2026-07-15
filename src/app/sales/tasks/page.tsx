"use client";

import { PageShell } from "@/components/page-shell";
import React, { useState, useEffect } from "react";
import { usePageTitle } from "@/contexts/page-title-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, Plus } from "lucide-react";

const getStatusColor = (status?: string) => {
  const colors: Record<string, string> = {
    todo: "bg-muted text-gray-800 dark:text-gray-200",
    "in-progress": "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200",
    review: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200",
    done: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200",
  };
  return colors[status?.toLowerCase() || ""] || "bg-muted text-gray-800 dark:text-gray-200";
};

export default function TasksPage() {
  const { setTitle } = usePageTitle();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setTitle("Tasks");
    return () => setTitle(null);
  }, [setTitle]);

  return (
    <PageShell fill className="bg-background text-foreground">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Tasks</h1>
            <p className="text-muted-foreground mt-1">CRM tasks and activities</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={loading}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="default" size="sm">
              <Plus className="h-4 w-4 mr-1" /> New Task
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>CRM Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                Task management for CRM activities is coming soon.
              </p>
              <p className="text-sm text-muted-foreground">
                This page will allow you to manage tasks related to deals,
                contacts, and companies.
              </p>
            </div>
          </CardContent>
        </Card>
      </PageShell>
  );
}
