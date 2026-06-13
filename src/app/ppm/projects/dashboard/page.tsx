"use client";

import { useEffect } from "react";
import { usePageTitle } from "@/contexts/page-title-context";
import { ProjectDashboard } from "@/components/project-dashboard";

export default function ProjectDashboardPage() {
  const { setTitle } = usePageTitle();

  useEffect(() => {
    setTitle("Project dashboard");
    return () => setTitle(null);
  }, [setTitle]);

  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-background text-foreground">
      <ProjectDashboard />
    </div>
  );
}
