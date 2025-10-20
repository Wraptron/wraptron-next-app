"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
const PROJECTS_QUERY = `
  query GetProjects {
    projects {
      id
      project_name
      status
      start_date
      target_date
      scope
      tasks
    }
  }
`;

export default function ProjectPage() {
  return (
    <div>
      <div className="min-h-screen">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="grid justify-between items-center mb-6">
            <div className="row">
              <h2 className="text-2xl">Projects</h2>
            </div>
            <Tabs defaultValue="overview">
              <TabsList className="">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="tasks">Tasks</TabsTrigger>
                <TabsTrigger value="files">Files</TabsTrigger>
                <TabsTrigger value="issues">Issues</TabsTrigger>
                <TabsTrigger value="price">Pricing</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>
              <TabsContent value="overview">Display BRD here</TabsContent>
              <TabsContent value="tasks">
                Display,Track and Change all your tasks here
              </TabsContent>
              <TabsContent value="files">Display file browser here</TabsContent>

              <TabsContent value="issues">
                Track and change your issues here.
              </TabsContent>
              <TabsContent value="price">
                Display price and plan here.
              </TabsContent>
              <TabsContent value="settings">
                Display project settings.
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
