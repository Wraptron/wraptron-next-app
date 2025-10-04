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
              <h2 className="text-2xl font-bold">Projects</h2>
            </div>
            <Tabs defaultValue="overview">
              <TabsList className="">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="tasks">Update log</TabsTrigger>
                <TabsTrigger value="issues">Issues</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>
              <TabsContent value="overview">
                Make changes to your account here.
              </TabsContent>
              <TabsContent value="brd">
                Make changes to your Requirements here.
              </TabsContent>
              <TabsContent value="charter">
                Make changes to your charter here.
              </TabsContent>
              <TabsContent value="design">
                Make changes to your design guidelines here.
              </TabsContent>
              <TabsContent value="quality">
                Make changes to your checklist tests here.
              </TabsContent>
              <TabsContent value="tasks">Change your tasks here.</TabsContent>
              <TabsContent value="issues">Change your issues here.</TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
