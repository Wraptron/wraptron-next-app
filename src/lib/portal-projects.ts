import type { Project } from "@/lib/api";
import type { ClientProject, ProjectStatus } from "@/lib/portal-data";
import { getProjectTaskCompletion } from "@/lib/project-completion";

function formatManagerName(project: Project): string {
  const employeeName = [project.manager_employee_first_name, project.manager_employee_last_name]
    .filter(Boolean)
    .join(" ")
    .trim();
  if (employeeName) return employeeName;

  const userName = [project.manager_first_name, project.manager_last_name]
    .filter(Boolean)
    .join(" ")
    .trim();
  if (userName) return userName;

  return (
    project.manager_employee_email ||
    project.manager_email ||
    "Wraptron team"
  );
}

export function mapProjectStatus(status?: string | null): ProjectStatus {
  const normalized = (status ?? "").toLowerCase().replace(/\s+/g, "_");
  if (["live", "completed", "done", "active"].includes(normalized)) {
    return "Live";
  }
  if (["review", "in_review", "pending_review"].includes(normalized)) {
    return "Review";
  }
  if (["paused", "on_hold", "hold", "blocked"].includes(normalized)) {
    return "Paused";
  }
  return "In Progress";
}

export function projectToClientProject(project: Project): ClientProject {
  const { percent } = getProjectTaskCompletion(project.tasks);
  const description =
    project.functional_requirements?.trim() ||
    project.target_audience?.trim() ||
    project.services_offered?.join(", ") ||
    "Wraptron engagement";

  return {
    id: String(project.id),
    name: project.project_name,
    description,
    status: mapProjectStatus(project.status),
    progress: percent,
    dueDate: project.target_date || project.created_at,
    lead: formatManagerName(project),
  };
}
