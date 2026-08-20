const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function isGitHubTokenError(err: unknown): boolean {
  if (!(err instanceof ApiError)) return false;
  const data = err.data as { code?: string; github_status?: number } | undefined;
  return data?.code === "github_api_error" && data.github_status === 401;
}

export function getApiErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    return err.message || fallback;
  }
  if (err instanceof Error) {
    return err.message;
  }
  return fallback;
}

// Get auth token from localStorage
function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("auth_token");
}

// Set auth token in localStorage
export function setAuthToken(token: string | null): void {
  if (typeof window === "undefined") return;
  if (token) {
    localStorage.setItem("auth_token", token);
  } else {
    localStorage.removeItem("auth_token");
  }
}

// Active organization (multi-tenancy): persisted id sent as X-Organization-Id
const ACTIVE_ORG_KEY = "active_org_id";

export function getActiveOrgId(): number | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(ACTIVE_ORG_KEY);
  if (!raw) return null;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) ? n : null;
}

export function setActiveOrgId(orgId: number | null): void {
  if (typeof window === "undefined") return;
  if (orgId == null) {
    localStorage.removeItem(ACTIVE_ORG_KEY);
  } else {
    localStorage.setItem(ACTIVE_ORG_KEY, String(orgId));
  }
}

async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit & { timeoutMs?: number },
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getAuthToken();
  const { timeoutMs = 30000, ...fetchOptions } = options ?? {};

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(fetchOptions.headers as Record<string, string> | undefined),
  };

  // Add auth token if available
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Add active organization header (multi-tenancy)
  const activeOrgId = getActiveOrgId();
  if (activeOrgId != null && !headers["X-Organization-Id"]) {
    headers["X-Organization-Id"] = String(activeOrgId);
  }

  // Add timeout and better error handling
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(url, {
      ...fetchOptions,
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
  } catch (error: any) {
    clearTimeout(timeoutId);

    // Handle abort (timeout)
    if (error.name === "AbortError") {
      throw new ApiError(
        "Request timeout. The server took too long to respond.",
        408,
        { timeout: true },
      );
    }

    // Handle network errors
    if (
      error.message?.includes("Failed to fetch") ||
      error.message?.includes("Broken pipe")
    ) {
      throw new ApiError(
        `Network error: Cannot connect to server at ${API_BASE_URL}. Please ensure the backend is running (and set NEXT_PUBLIC_API_URL for dev/prod if needed).`,
        0,
        { networkError: true, originalError: error.message },
      );
    }

    throw error;
  }

  if (!response.ok) {
    const errorData = (await response.json().catch(() => ({}))) as {
      error?: string;
      message?: string;
      detail?: string;
      code?: string;
      [key: string]: unknown;
    };

    // Only treat 401 as a Wraptron session expiry — not upstream GitHub auth failures.
    if (
      response.status === 401 &&
      errorData.code !== "github_api_error"
    ) {
      setAuthToken(null);
      if (
        typeof window !== "undefined" &&
        !window.location.pathname.startsWith("/login") &&
        !window.location.pathname.startsWith("/signup") &&
        !window.location.pathname.startsWith("/invite") &&
        !window.location.pathname.startsWith("/forgot-password") &&
        !window.location.pathname.startsWith("/reset-password")
      ) {
        window.location.href = "/login";
      }
    }

    const base = errorData.error || errorData.message || "An error occurred";
    const detail =
      typeof errorData.detail === "string" && errorData.detail.trim()
        ? errorData.detail.trim()
        : "";
    const combined = detail ? `${base}: ${detail}` : base;
    throw new ApiError(combined, response.status, errorData);
  }

  if (response.status === 204) {
    return null as T;
  }

  return response.json();
}

export type CollectionListQueryParams = {
  search?: string;
  limit?: number;
  offset?: number;
  [key: string]: string | number | boolean | undefined;
};

function appendListQueryParams(
  searchParams: URLSearchParams,
  params?: CollectionListQueryParams,
) {
  if (!params) return;
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    searchParams.append(key, String(value));
  }
}

// ============================================================================
// Authentication Types and API
// ============================================================================

export interface User {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  role: string;
}

export interface SignupInput {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  company_name?: string;
  role?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface ForgotPasswordInput {
  email: string;
}

export interface ResetPasswordInput {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  organization?: OrganizationSummary;
}

export type OrgRoleType = "owner" | "custom";

export interface OrganizationSummary {
  id: number;
  name: string;
  slug: string;
  is_active: boolean;
  role_id: number | null;
  role_type: OrgRoleType;
  role_name: string;
  permissions: string[];
  member_count?: number;
}

export interface OrganizationMember {
  id: number;
  user_id: number;
  role_id: number;
  role_type: OrgRoleType;
  role_name: string;
  is_active: boolean;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  created_at?: string;
}

export interface OrganizationRole {
  id: number;
  organization_id: number;
  name: string;
  description?: string | null;
  role_type: OrgRoleType;
  created_at: string;
  updated_at: string;
}

export interface OrgRolePermission {
  id: number;
  name: string;
  description?: string | null;
  resource: string;
  action: string;
}

export type OrganizationInviteStatus =
  | "pending"
  | "accepted"
  | "revoked"
  | "expired";

export interface OrganizationInvite {
  id: number;
  organization_id: number;
  email: string;
  role_id: number;
  role_name?: string;
  token: string;
  invited_by: number;
  status: OrganizationInviteStatus;
  expires_at: string;
  accepted_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface InvitePreview {
  org_name: string;
  role_name: string;
  email: string;
  flow_type: "signup" | "accept";
  expires_at: string;
  status: OrganizationInviteStatus;
}

export const organizationsApi = {
  getMine: async (): Promise<{
    is_super_admin: boolean;
    organizations: OrganizationSummary[];
  }> => {
    return fetchApi("/api/me/organizations");
  },

  list: async (): Promise<{ organizations: OrganizationSummary[] }> => {
    return fetchApi("/api/organizations");
  },

  create: async (input: {
    name: string;
    slug: string;
    first_admin_email?: string;
  }): Promise<{ organization: OrganizationSummary }> => {
    return fetchApi("/api/organizations", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  update: async (
    id: number,
    input: { name?: string; slug?: string; is_active?: boolean },
  ): Promise<{ organization: OrganizationSummary }> => {
    return fetchApi(`/api/organizations/${id}`, {
      method: "PUT",
      body: JSON.stringify(input),
    });
  },

  deactivate: async (id: number): Promise<{ success: boolean }> => {
    return fetchApi(`/api/organizations/${id}`, { method: "DELETE" });
  },

  listMembers: async (
    orgId: number,
  ): Promise<{ members: OrganizationMember[] }> => {
    return fetchApi(`/api/organizations/${orgId}/members`);
  },

  updateMember: async (
    orgId: number,
    userId: number,
    input: { role_id?: number; is_active?: boolean },
  ): Promise<{ member: OrganizationMember }> => {
    return fetchApi(`/api/organizations/${orgId}/members/${userId}`, {
      method: "PUT",
      body: JSON.stringify(input),
    });
  },

  removeMember: async (
    orgId: number,
    userId: number,
  ): Promise<{ success: boolean }> => {
    return fetchApi(`/api/organizations/${orgId}/members/${userId}`, {
      method: "DELETE",
    });
  },

  listRoles: async (
    orgId: number,
  ): Promise<{ roles: OrganizationRole[] }> => {
    return fetchApi(`/api/organizations/${orgId}/roles`);
  },

  createRole: async (
    orgId: number,
    input: {
      name: string;
      description?: string;
      permission_names?: string[];
    },
  ): Promise<{ role: OrganizationRole }> => {
    return fetchApi(`/api/organizations/${orgId}/roles`, {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  updateRole: async (
    orgId: number,
    roleId: number,
    input: {
      name?: string;
      description?: string;
      permission_names?: string[];
    },
  ): Promise<{ role: OrganizationRole }> => {
    return fetchApi(`/api/organizations/${orgId}/roles/${roleId}`, {
      method: "PUT",
      body: JSON.stringify(input),
    });
  },

  deleteRole: async (
    orgId: number,
    roleId: number,
  ): Promise<{ success: boolean }> => {
    return fetchApi(`/api/organizations/${orgId}/roles/${roleId}`, {
      method: "DELETE",
    });
  },

  getRolePermissions: async (
    orgId: number,
    roleId: number,
  ): Promise<{ role_id: number; permissions: OrgRolePermission[] }> => {
    return fetchApi(
      `/api/organizations/${orgId}/roles/${roleId}/permissions`,
    );
  },

  setRolePermissions: async (
    orgId: number,
    roleId: number,
    permissionNames: string[],
  ): Promise<{ role_id: number; permissions: OrgRolePermission[] }> => {
    return fetchApi(
      `/api/organizations/${orgId}/roles/${roleId}/permissions`,
      {
        method: "PUT",
        body: JSON.stringify({ permission_names: permissionNames }),
      },
    );
  },

  listInvites: async (
    orgId: number,
  ): Promise<{ invites: OrganizationInvite[] }> => {
    return fetchApi(`/api/organizations/${orgId}/invites`);
  },

  createInvite: async (
    orgId: number,
    input: { email: string; role_id: number },
  ): Promise<{ invite: OrganizationInvite }> => {
    return fetchApi(`/api/organizations/${orgId}/invites`, {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  resendInvite: async (
    orgId: number,
    inviteId: number,
  ): Promise<{ invite: OrganizationInvite }> => {
    return fetchApi(
      `/api/organizations/${orgId}/invites/${inviteId}/resend`,
      { method: "POST" },
    );
  },

  revokeInvite: async (
    orgId: number,
    inviteId: number,
  ): Promise<{ invite: OrganizationInvite }> => {
    return fetchApi(
      `/api/organizations/${orgId}/invites/${inviteId}/revoke`,
      { method: "POST" },
    );
  },
};

export const invitesApi = {
  preview: async (token: string): Promise<InvitePreview> => {
    return fetchApi(`/api/invites/${encodeURIComponent(token)}`);
  },

  signup: async (
    token: string,
    body: { name?: string; password: string },
  ): Promise<{
    user: { id: number; email: string; first_name?: string | null };
    token: string;
    organization_id: number;
  }> => {
    return fetchApi(`/api/invites/${encodeURIComponent(token)}/signup`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  accept: async (
    token: string,
  ): Promise<{ success: boolean; organization_id: number; role_id: number }> => {
    return fetchApi(`/api/invites/${encodeURIComponent(token)}/accept`, {
      method: "POST",
    });
  },
};

export const authApi = {
  // Sign up a new user
  signup: async (data: SignupInput): Promise<AuthResponse> => {
    return fetchApi<AuthResponse>("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // Login user
  login: async (data: LoginInput): Promise<AuthResponse> => {
    return fetchApi<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // Request password reset email (always returns a generic message)
  forgotPassword: async (
    data: ForgotPasswordInput,
  ): Promise<{ message: string }> => {
    return fetchApi<{ message: string }>("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // Complete password reset with email token
  resetPassword: async (
    data: ResetPasswordInput,
  ): Promise<{ message: string }> => {
    return fetchApi<{ message: string }>("/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // Get current user
  getMe: async (): Promise<{ user: User }> => {
    return fetchApi<{ user: User }>("/api/auth/me");
  },

  // Verify token
  verify: async (): Promise<{ user: User; valid: boolean }> => {
    return fetchApi<{ user: User; valid: boolean }>("/api/auth/verify", {
      method: "POST",
    });
  },

  // Logout (client-side only)
  logout: (): void => {
    setAuthToken(null);
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  },
};

// ============================================================================
// Projects Types and API
// ============================================================================

export interface Task {
  id: number;
  project_id: number;
  assigned_employee_id?: number | null;
  title: string;
  description?: string;
  status: string;
  start_date?: string;
  end_date?: string;
  priority?: string;
  complexity?: string;
  story_points?: number;
  notes?: string;
  billable?: string;
  estimate_hours?: number;
  is_recurring?: boolean;
  recurrence_frequency?: string;
  recurrence_interval?: number;
  recurrence_anchor_date?: string;
  recurrence_end_date?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  assigned_employee_id?: number | null;
  status?: string;
  end_date?: string;
  priority?: string;
  notes?: string;
  billable?: string;
  estimate_hours?: number;
  is_recurring?: boolean;
  recurrence_frequency?: string;
  recurrence_interval?: number;
  recurrence_anchor_date?: string;
  recurrence_end_date?: string;
}

export interface TaskChange {
  id: number;
  task_id: number;
  project_id: number;
  changed_by_user_id?: number | null;
  changed_by_name?: string | null;
  change_type: "created" | "updated";
  field_name: string;
  field_label?: string;
  old_value?: string | null;
  new_value?: string | null;
  old_display_value?: string | null;
  new_display_value?: string | null;
  created_at: string;
}

export interface Project {
  id: number;
  project_name: string;
  /** Short unique task-key prefix (e.g. ACME → tasks ACME-12). */
  key?: string;
  services_offered: string[];
  start_date?: string;
  target_date?: string;
  target_audience?: string;
  functional_requirements?: string;
  non_functional_requirements?: string;
  other_service_description?: string;
  ux_preference?: string;
  pages_views?: string[];
  technology_stack?: string;
  business_objectives?: string[];
  kpi?: string;
  target_users?: string;
  project_references?: string;
  support_coverage?: string;
  support_engagement_model?: string[];
  support_channels?: string[];
  scheduled_review_calls?: string;
  backup_frequency?: string;
  backup_retention_period?: string;
  reports_required?: string[];
  incident_alerts?: string[];
  status: string;
  created_at: string;
  updated_at: string;
  product_template_id?: number | null;
  /** `users.id` of the manager when set (staff login). */
  project_manager_id?: number | null;
  project_manager_employee_id?: number | null;
  project_sponsor_contact_id?: number | null;
  project_staff_employee_ids?: number[];
  /** Portal users (`users.id` with role `user`) granted read access. */
  project_user_ids?: number[];
  product_template_name?: string | null;
  product_template_part_code?: string | null;
  manager_first_name?: string | null;
  manager_last_name?: string | null;
  manager_email?: string | null;
  /** Same as project_manager_id when manager is a users row (staff login). */
  project_manager_user_id?: number | null;
  manager_employee_first_name?: string | null;
  manager_employee_last_name?: string | null;
  manager_employee_email?: string | null;
  sponsor_first_name?: string | null;
  sponsor_last_name?: string | null;
  sponsor_email?: string | null;
  tasks?: Task[];
}

/** Staff-role login user; used for project manager assignment (`project_manager_id` = `id`). */
export interface StaffManagerUser {
  id: number;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
}

/** Client portal user; granted per-project read access via `project_user_ids`. */
export type PortalUser = StaffManagerUser;

export interface CreateProjectInput {
  project_name: string;
  services_offered?: string[];
  start_date?: string;
  target_date?: string;
  target_audience?: string;
  functional_requirements?: string;
  non_functional_requirements?: string;
  other_service_description?: string;
  ux_preference?: string;
  pages_views?: string[];
  technology_stack?: string;
  business_objectives?: string[];
  kpi?: string;
  target_users?: string;
  project_references?: string;
  support_coverage?: string;
  support_engagement_model?: string[];
  support_channels?: string[];
  scheduled_review_calls?: string;
  backup_frequency?: string;
  backup_retention_period?: string;
  reports_required?: string[];
  incident_alerts?: string[];
  status?: string;
  product_template_id?: number | null;
  project_manager_id?: number | null;
  project_manager_employee_id?: number | null;
  project_sponsor_contact_id?: number | null;
  project_staff_employee_ids?: number[];
  project_user_ids?: number[];
  tasks?: Array<{
    title: string;
    description?: string;
    status?: string;
  }>;
}

export interface ProjectsResponse {
  data: Project[];
  total: number;
  limit: number;
  offset: number;
}

export type ProjectDashboardPeriod =
  | "today"
  | "week"
  | "month"
  | "quarter"
  | "year";

export interface ProjectDashboardMemberProjects {
  name: string;
  project_count: number;
}

export interface ProjectDashboardMemberTasks {
  name: string;
  tasks_done: number;
  tasks_assigned: number;
}

export interface ProjectDashboardStatusCount {
  status: string;
  project_count: number;
}

export interface ProjectDashboardWorkload {
  name: string;
  open_tasks: number;
  estimate_hours: number;
}

export interface ProjectDashboardData {
  period: ProjectDashboardPeriod;
  active_projects: number;
  completed_tasks: number;
  total_tasks: number;
  overdue_tasks: number;
  projects_by_member: ProjectDashboardMemberProjects[];
  member_tasks: ProjectDashboardMemberTasks[];
  active_projects_by_status: ProjectDashboardStatusCount[];
  team_workload: ProjectDashboardWorkload[];
}

export const projectsApi = {
  // Get all projects with optional filters
  getAll: async (params?: {
    search?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<ProjectsResponse> => {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.append("search", params.search);
    if (params?.status) searchParams.append("status", params.status);
    if (params?.limit) searchParams.append("limit", params.limit.toString());
    if (params?.offset) searchParams.append("offset", params.offset.toString());

    const query = searchParams.toString();
    return fetchApi<ProjectsResponse>(
      `/api/projects${query ? `?${query}` : ""}`,
    );
  },

  getDashboard: async (
    period: ProjectDashboardPeriod = "month",
  ): Promise<ProjectDashboardData> => {
    return fetchApi<ProjectDashboardData>(
      `/api/projects/dashboard?period=${encodeURIComponent(period)}`,
    );
  },

  // Get single project by ID
  getById: async (id: number): Promise<Project> => {
    return fetchApi<Project>(`/api/projects/${id}`);
  },

  // Create new project
  create: async (data: CreateProjectInput): Promise<Project> => {
    return fetchApi<Project>("/api/projects", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // Update project
  update: async (
    id: number,
    data: Partial<CreateProjectInput>,
  ): Promise<Project> => {
    return fetchApi<Project>(`/api/projects/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  // Delete project
  delete: async (id: number): Promise<void> => {
    return fetchApi<void>(`/api/projects/${id}`, {
      method: "DELETE",
    });
  },

  // Get available objectives
  getObjectives: async (): Promise<{ objectives: string[] }> => {
    return fetchApi<{ objectives: string[] }>("/api/projects/objectives");
  },

  /** Active users with role `staff` (auth required). */
  getStaffManagers: async (): Promise<{ data: StaffManagerUser[] }> => {
    return fetchApi<{ data: StaffManagerUser[] }>(
      "/api/projects/staff-managers",
    );
  },

  /** Active client portal users (role `user`) for project access assignment. */
  getPortalUsers: async (): Promise<{ data: PortalUser[] }> => {
    return fetchApi<{ data: PortalUser[] }>("/api/projects/portal-users");
  },

  // Create task for project
  createTask: async (
    projectId: number,
    data: CreateTaskInput,
  ): Promise<Task> => {
    return fetchApi<Task>(`/api/projects/${projectId}/tasks`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // Update task
  updateTask: async (
    projectId: number,
    taskId: number,
    data: Partial<Task>,
  ): Promise<Task> => {
    return fetchApi<Task>(`/api/projects/${projectId}/tasks/${taskId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  // Delete task
  deleteTask: async (projectId: number, taskId: number): Promise<void> => {
    return fetchApi<void>(`/api/projects/${projectId}/tasks/${taskId}`, {
      method: "DELETE",
    });
  },

  getTaskChanges: async (
    projectId: number,
    taskId: number,
  ): Promise<{ data: TaskChange[] }> => {
    return fetchApi<{ data: TaskChange[] }>(
      `/api/projects/${projectId}/tasks/${taskId}/changes`,
    );
  },
};

// ============================================================================
// Integrations Types and API
// ============================================================================

export interface GitHubCommit {
  sha: string;
  commit: {
    author: {
      name: string;
      email: string;
      date: string;
    };
    message: string;
  };
  author: {
    login: string;
    avatar_url: string;
  } | null;
  html_url: string;
}

export interface Integration {
  id: number;
  project_id: number;
  integration_type: string;
  config: {
    repo_owner?: string;
    repo_name?: string;
    access_token?: string;
    branch?: string;
    [key: string]: unknown;
  };
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateIntegrationInput {
  integration_type: string;
  config: {
    repo_owner?: string;
    repo_name?: string;
    access_token?: string;
    branch?: string;
    [key: string]: unknown;
  };
  is_active?: boolean;
}

export interface IntegrationsResponse {
  data: Integration[];
  total: number;
}

export interface CommitsResponse {
  data: GitHubCommit[];
  total: number;
  repository: {
    owner: string;
    name: string;
    branch: string;
  };
}

export const integrationsApi = {
  // Get all integrations for a project
  getAll: async (projectId: number): Promise<IntegrationsResponse> => {
    return fetchApi<IntegrationsResponse>(
      `/api/projects/${projectId}/integrations`,
    );
  },

  // Get specific integration
  getById: async (
    projectId: number,
    integrationId: number,
  ): Promise<Integration> => {
    return fetchApi<Integration>(
      `/api/projects/${projectId}/integrations/${integrationId}`,
    );
  },

  // Create or update integration
  save: async (
    projectId: number,
    data: CreateIntegrationInput,
  ): Promise<Integration> => {
    return fetchApi<Integration>(`/api/projects/${projectId}/integrations`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // Delete integration
  delete: async (projectId: number, integrationId: number): Promise<void> => {
    return fetchApi<void>(
      `/api/projects/${projectId}/integrations/${integrationId}`,
      {
        method: "DELETE",
      },
    );
  },

  // Test GitHub connection
  testGitHub: async (data: {
    repo_owner: string;
    repo_name: string;
    access_token?: string;
  }): Promise<{
    success: boolean;
    repository?: {
      name: string;
      full_name: string;
      description: string;
      default_branch: string;
      private: boolean;
    };
    error?: string;
    details?: string;
  }> => {
    return fetchApi(`/api/integrations/github/test`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // Get GitHub commits
  getGitHubCommits: async (projectId: number): Promise<CommitsResponse> => {
    return fetchApi<CommitsResponse>(
      `/api/projects/${projectId}/integrations/github/commits`,
    );
  },
};

// ============================================================================
// Customers Types and API
// ============================================================================

export interface Customer {
  id: number;
  customer_code: string;
  customer_type: boolean;
  name: string;
  billing_address?: string;
  billing_address_city?: string;
  shipping_address?: string;
  shipping_address_city?: string;
  isgroup: boolean;
  gstin?: string;
  contact_email?: string;
  contact_phone?: string;
  contact_person?: string;
  /** FK → CRM `companies.company_id` */
  company_id?: number;
  /** FK → CRM `contacts.id` (primary contact) */
  contact_id?: number;
  signup_type?: string;
  gst_registration_type?: string;
  portal_access?: boolean;
  website?: string;
  country?: string;
  onboarding_address?: string;
  /** All contact ids (primary + `customer_contacts` junction). */
  contacts_associated?: number[];
  /** Resolved when `company_id` is set. */
  company?: { company_id: number; name: string };
  /** Resolved when `contact_id` is set. */
  primary_contact?: {
    id: number;
    first_name: string;
    last_name?: string;
    email?: string;
  };
  created_at: string;
  updated_at: string;
}

export interface CreateCustomerInput {
  customer_code: string;
  customer_type: boolean;
  name: string;
  billing_address?: string;
  billing_address_city?: string;
  shipping_address?: string;
  shipping_address_city?: string;
  isgroup: boolean;
  gstin?: string;
  contact_email?: string;
  contact_phone?: string;
  contact_person?: string;
  company_id?: number | null;
  contact_id?: number | null;
  /** Replaces junction rows; primary `contact_id` becomes the first id. */
  contact_ids?: number[];
  signup_type?: string;
  gst_registration_type?: string;
  portal_access?: boolean;
  website?: string;
  country?: string;
  onboarding_address?: string;
}

export interface CustomersResponse {
  data: Customer[];
  total: number;
  limit: number;
  offset: number;
}

export const customersApi = {
  getAll: async (
    params?: CollectionListQueryParams,
  ): Promise<CustomersResponse> => {
    const searchParams = new URLSearchParams();
    appendListQueryParams(searchParams, params);

    const query = searchParams.toString();
    return fetchApi<CustomersResponse>(
      `/api/customers${query ? `?${query}` : ""}`,
    );
  },

  getById: async (id: number): Promise<Customer> => {
    return fetchApi<Customer>(`/api/customers/${id}`);
  },

  create: async (data: CreateCustomerInput): Promise<Customer> => {
    return fetchApi<Customer>("/api/customers", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  update: async (
    id: number,
    data: Partial<CreateCustomerInput>,
  ): Promise<Customer> => {
    return fetchApi<Customer>(`/api/customers/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  delete: async (id: number): Promise<void> => {
    return fetchApi<void>(`/api/customers/${id}`, {
      method: "DELETE",
    });
  },
};

export interface CustomerOnboardingSubmitInput {
  signupType: string;
  contactName: string;
  email: string;
  phone: string;
  companyName: string;
  address: string;
  country: string;
  website?: string;
  gstType: string;
  portalAccess: "yes" | "no";
  gstin?: string;
}

export interface CustomerOnboardingSubmitResponse {
  success: boolean;
  company_id: number;
  contact_id: number;
  customer_id: number;
  customer_code: string;
}

/** Public KYC flow: creates CRM company + contact and finance customer in one request. */
export const customerOnboardingApi = {
  submit: async (
    data: CustomerOnboardingSubmitInput,
  ): Promise<CustomerOnboardingSubmitResponse> => {
    return fetchApi<CustomerOnboardingSubmitResponse>(
      "/api/customer-onboarding",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
    );
  },
};

// ============================================================================
// Products Types and API
// ============================================================================

export interface Product {
  id: number;
  part_code: string;
  part_name: string;
  customer_part_number?: string;
  product_description?: string;
  drawing_number?: string;
  drawing_revision?: string;
  product_revision_change_log?: string;
  raw_material_type?: string;
  material_grade?: string;
  material_supplier?: string;
  material_color?: string;
  uv_fire_rating?: string;
  mfi?: string;
  packaging_type?: string;
  pieces_per_box?: number;
  barcode_specs?: string;
  quality_inspection_plan?: string;
  control_plan?: string;
  mould_number?: string;
  cavity_details?: string;
  machine_tonnage?: string;
  cycle_time?: number;
  cooling_requirement?: string;
  rm_cost?: number;
  cost_per_hour?: number;
  machine_cost_per_hour?: number;
  labour_cost?: number;
  assembly_cost?: number;
  overhead_percent?: number;
  total_cost?: number;
  selling_price?: number;
  uom?: string;
  storage_location?: string;
  bin_warehouse?: string;
  sku_code?: string;
  lot_batch_traceability_rules?: string;
  shelf_life?: number;
  serialisation_rules?: string;
  ppap_level?: string;
  apqp_phase?: string;
  imds_submission_id?: string;
  vendor_code?: string;
  customer_standards?: string;
  pdi_checklist?: string;
  customer_packaging_specs?: string;
  customer_dispatch_requirements?: string;
  status: string;
  category_id?: number;
  category_name?: string;
  is_featured?: boolean;
  featured_sort_order?: number;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateProductInput {
  part_code: string;
  part_name: string;
  customer_part_number?: string;
  product_description?: string;
  drawing_number?: string;
  drawing_revision?: string;
  product_revision_change_log?: string;
  raw_material_type?: string;
  material_grade?: string;
  material_supplier?: string;
  material_color?: string;
  uv_fire_rating?: string;
  mfi?: string;
  packaging_type?: string;
  pieces_per_box?: number;
  barcode_specs?: string;
  quality_inspection_plan?: string;
  control_plan?: string;
  mould_number?: string;
  cavity_details?: string;
  machine_tonnage?: string;
  cycle_time?: number;
  cooling_requirement?: string;
  rm_cost?: number;
  cost_per_hour?: number;
  machine_cost_per_hour?: number;
  labour_cost?: number;
  assembly_cost?: number;
  overhead_percent?: number;
  total_cost?: number;
  selling_price?: number;
  uom?: string;
  storage_location?: string;
  bin_warehouse?: string;
  sku_code?: string;
  lot_batch_traceability_rules?: string;
  shelf_life?: number;
  serialisation_rules?: string;
  ppap_level?: string;
  apqp_phase?: string;
  imds_submission_id?: string;
  vendor_code?: string;
  customer_standards?: string;
  pdi_checklist?: string;
  customer_packaging_specs?: string;
  customer_dispatch_requirements?: string;
  status?: string;
  category_id?: number;
  is_featured?: boolean;
  featured_sort_order?: number;
  image_url?: string;
}

export interface ProductCategory {
  id: number;
  name: string;
  slug: string;
  sort_order: number;
}

export interface CatalogProduct {
  id: number;
  part_code: string;
  part_name: string;
  product_description?: string;
  selling_price?: number;
  uom?: string;
  image_url?: string;
  is_featured: boolean;
  featured_sort_order: number;
  category_id?: number;
  category_name?: string;
  category_slug?: string;
}

export interface ProductCatalogResponse {
  featured: CatalogProduct[];
  categories: Array<{
    category: ProductCategory;
    products: CatalogProduct[];
  }>;
  active_products: CatalogProduct[];
}

export interface ProductsResponse {
  data: Product[];
  total: number;
  limit: number;
  offset: number;
}

export const productsApi = {
  getCatalog: async (): Promise<ProductCatalogResponse> => {
    return fetchApi<ProductCatalogResponse>("/api/products/catalog");
  },

  getAll: async (
    params?: CollectionListQueryParams,
  ): Promise<ProductsResponse> => {
    const searchParams = new URLSearchParams();
    appendListQueryParams(searchParams, params);

    const query = searchParams.toString();
    return fetchApi<ProductsResponse>(
      `/api/products${query ? `?${query}` : ""}`,
    );
  },

  getById: async (id: number): Promise<Product> => {
    return fetchApi<Product>(`/api/products/${id}`);
  },

  create: async (data: CreateProductInput): Promise<Product> => {
    return fetchApi<Product>("/api/products", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  update: async (
    id: number,
    data: Partial<CreateProductInput>,
  ): Promise<Product> => {
    return fetchApi<Product>(`/api/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  delete: async (id: number): Promise<void> => {
    return fetchApi<void>(`/api/products/${id}`, {
      method: "DELETE",
    });
  },
};

// ============================================================================
// Employees Types and API
// ============================================================================

export interface Employee {
  id: number;
  emp_code: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  role?: string;
  email?: string;
  phone?: string;
  work_phone?: string;
  personal_email?: string;
  github_username?: string;
  employment_type?:
    | "full_time"
    | "part_time"
    | "contract"
    | "intern"
    | "temporary";
  employment_status?:
    | "candidate"
    | "offered"
    | "pre_onboarding"
    | "active"
    | "notice_period"
    | "exited";
  skill_set?: Record<string, unknown>;
  join_date?: string;
  exit_date?: string;
  reporting_manager_id?: number;
  date_of_birth?: string;
  gender?: string;
  marital_status?: string;
  bloodgroup?: string;
  aadhar_number?: string;
  pan?: string;
  qualification?: string;
  education?: string;
  education_institution?: string;
  education_year_passing?: string;
  education_grade?: string;
  e_contact?: string;
  department?: string;
  designation?: string;
  experience?: string;
  location?: string;
  permanent_address?: string;
  present_address?: string;
  father_name?: string;
  bank_account_name?: string;
  bank_name?: string;
  bank_ifsc?: string;
  bank_account_number?: string;
  salary_basic?: number;
  user_id?: number | null;
  created_at: string;
  updated_at: string;
  manager_first_name?: string;
  manager_last_name?: string;
  linked_user_email?: string | null;
}

export interface CreateEmployeeInput {
  emp_code: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  role?: string;
  email?: string;
  phone?: string;
  work_phone?: string;
  personal_email?: string;
  github_username?: string;
  employment_type?:
    | "full_time"
    | "part_time"
    | "contract"
    | "intern"
    | "temporary";
  employment_status?:
    | "candidate"
    | "offered"
    | "pre_onboarding"
    | "active"
    | "notice_period"
    | "exited";
  skill_set?: Record<string, unknown>;
  join_date?: string;
  exit_date?: string;
  reporting_manager_id?: number | null;
  date_of_birth?: string;
  gender?: string;
  marital_status?: string;
  bloodgroup?: string;
  aadhar_number?: string;
  pan?: string;
  qualification?: string;
  education?: string;
  education_institution?: string;
  education_year_passing?: string;
  education_grade?: string;
  e_contact?: string;
  department?: string;
  designation?: string;
  experience?: string;
  location?: string;
  permanent_address?: string;
  present_address?: string;
  father_name?: string;
  bank_account_name?: string;
  bank_name?: string;
  bank_ifsc?: string;
  bank_account_number?: string;
  salary_basic?: number;
  user_id?: number | null;
}

/** Sent on create/update to link this employee to a login user (by email). Used for attendance. */
export type EmployeeLinkUserPayload = { link_user_email?: string };

export interface EmployeesResponse {
  data: Employee[];
  total: number;
  limit: number;
  offset: number;
}

export type HrDashboardPeriod = "today" | "week" | "month" | "quarter" | "year";

export interface HrDashboardAttendanceRow {
  employee_id: number;
  emp_code: string;
  name: string;
  department: string | null;
  attendance_count: number;
}

export interface HrDashboardTimeLoggedRow {
  name: string;
  hours_logged: number;
}

export interface HrDashboardData {
  period: HrDashboardPeriod;
  total_active_employees: number;
  avg_employees_present: number;
  active_employees_by_attendance: HrDashboardAttendanceRow[];
  employees_by_time_logged: HrDashboardTimeLoggedRow[];
}

export interface EmployeeMetricRow {
  employee_id: number;
  emp_code: string;
  name: string;
  email: string | null;
  department: string | null;
  designation: string | null;
  total_days: number;
  days_present: number;
  attendance_percent: number;
  total_working_hours: number;
  avg_daily_hours: number;
  tasks_assigned: number;
  tasks_completed: number;
  load_percent: number;
  performance_percent: number;
}

export interface EmployeeMetricsReportResponse {
  period_label: string;
  start_date: string;
  end_date: string;
  month?: number;
  year?: number;
  total_working_days: number;
  total_employees: number;
  total_org_tasks: number;
  total_org_completed_tasks: number;
  org_performance_percent: number;
  org_avg_attendance_percent: number;
  total_org_hours: number;
  org_avg_daily_hours: number;
  rows: EmployeeMetricRow[];
}

export const employeesApi = {
  getAll: async (params?: {
    search?: string;
    department?: string;
    employment_status?: string;
    limit?: number;
    offset?: number;
  }): Promise<EmployeesResponse> => {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.append("search", params.search);
    if (params?.department) {
      searchParams.append("department", params.department);
    }
    if (params?.employment_status) {
      searchParams.append("employment_status", params.employment_status);
    }
    if (params?.limit) searchParams.append("limit", params.limit.toString());
    if (params?.offset) searchParams.append("offset", params.offset.toString());

    const query = searchParams.toString();
    return fetchApi<EmployeesResponse>(
      `/api/employees${query ? `?${query}` : ""}`,
    );
  },

  getById: async (id: number): Promise<Employee> => {
    return fetchApi<Employee>(`/api/employees/${id}`);
  },

  create: async (
    data: CreateEmployeeInput & EmployeeLinkUserPayload,
  ): Promise<Employee> => {
    return fetchApi<Employee>("/api/employees", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  update: async (
    id: number,
    data: Partial<CreateEmployeeInput> & EmployeeLinkUserPayload,
  ): Promise<Employee> => {
    return fetchApi<Employee>(`/api/employees/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  delete: async (id: number): Promise<void> => {
    return fetchApi<void>(`/api/employees/${id}`, {
      method: "DELETE",
    });
  },

  getDashboard: async (
    period: HrDashboardPeriod = "month",
  ): Promise<HrDashboardData> => {
    return fetchApi<HrDashboardData>(
      `/api/employees/dashboard?period=${encodeURIComponent(period)}`,
    );
  },

  getMetricsReport: async (params?: {
    month?: number;
    year?: number;
    start_date?: string;
    end_date?: string;
    total_days?: number;
    department?: string;
  }): Promise<EmployeeMetricsReportResponse> => {
    const searchParams = new URLSearchParams();
    if (params?.month != null) searchParams.append("month", params.month.toString());
    if (params?.year != null) searchParams.append("year", params.year.toString());
    if (params?.start_date) searchParams.append("start_date", params.start_date);
    if (params?.end_date) searchParams.append("end_date", params.end_date);
    if (params?.total_days != null) searchParams.append("total_days", params.total_days.toString());
    if (params?.department) searchParams.append("department", params.department);

    const query = searchParams.toString();
    return fetchApi<EmployeeMetricsReportResponse>(
      `/api/employees/metrics-report${query ? `?${query}` : ""}`,
    );
  },
};

// ============================================================================
// Holidays & Calendar Setup Types and API
// ============================================================================

export type WeekendPolicy = "sat_sun_off" | "sun_only_off" | "alt_sat_sun_off" | "none";

export interface OrganizationHoliday {
  id: number;
  organization_id: number;
  name: string;
  date: string;
  type: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkPolicy {
  weekend_policy: WeekendPolicy;
  working_hours_per_day: number;
}

export interface DayBreakdownItem {
  date: string;
  day_of_week: number;
  is_weekend: boolean;
  is_holiday: boolean;
  holiday_name?: string;
  is_working_day: boolean;
}

export interface WorkingDaysBreakdown {
  month: number;
  year: number;
  weekend_policy: WeekendPolicy;
  total_calendar_days: number;
  weekend_days: number;
  holiday_days: number;
  total_working_days: number;
  holidays: OrganizationHoliday[];
  day_breakdown: DayBreakdownItem[];
}

export const holidaysApi = {
  getAll: async (params?: { year?: number; month?: number }): Promise<{ holidays: OrganizationHoliday[] }> => {
    const searchParams = new URLSearchParams();
    if (params?.year != null) searchParams.append("year", params.year.toString());
    if (params?.month != null) searchParams.append("month", params.month.toString());
    const query = searchParams.toString();
    return fetchApi<{ holidays: OrganizationHoliday[] }>(`/api/holidays${query ? `?${query}` : ""}`);
  },

  create: async (data: {
    name: string;
    date: string;
    type?: string;
    description?: string;
  }): Promise<{ holiday: OrganizationHoliday }> => {
    return fetchApi<{ holiday: OrganizationHoliday }>("/api/holidays", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  update: async (
    id: number,
    data: { name?: string; date?: string; type?: string; description?: string },
  ): Promise<{ holiday: OrganizationHoliday }> => {
    return fetchApi<{ holiday: OrganizationHoliday }>(`/api/holidays/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  delete: async (id: number): Promise<{ success: boolean }> => {
    return fetchApi<{ success: boolean }>(`/api/holidays/${id}`, {
      method: "DELETE",
    });
  },

  getPolicy: async (): Promise<WorkPolicy> => {
    return fetchApi<WorkPolicy>("/api/holidays/policy");
  },

  updatePolicy: async (data: {
    weekend_policy: WeekendPolicy;
    working_hours_per_day?: number;
  }): Promise<WorkPolicy & { message: string }> => {
    return fetchApi<WorkPolicy & { message: string }>("/api/holidays/policy", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  getWorkingDays: async (params: {
    month: number;
    year: number;
  }): Promise<WorkingDaysBreakdown> => {
    return fetchApi<WorkingDaysBreakdown>(
      `/api/holidays/working-days?month=${params.month}&year=${params.year}`,
    );
  },
};

// ============================================================================
// Attendance Types and API
// ============================================================================

export type WorkMode = "office" | "remote" | "client_site";
export type AttendanceStatus = "logged_in" | "logged_out";

export interface AttendanceSession {
  id: number;
  user_id: number;
  employee_id: number | null;
  date: string;
  check_in_at: string;
  check_out_at: string | null;
  work_mode: WorkMode;
  status: AttendanceStatus;
  location_lat: number | null;
  location_lng: number | null;
  device_info: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
  updated_at: string;
}

export const attendanceApi = {
  getMyToday: async (): Promise<{
    session: AttendanceSession | null;
    today: string;
  }> => {
    return fetchApi("/api/attendance/me/today");
  },
  getMySessions: async (params?: {
    limit?: number;
    offset?: number;
  }): Promise<{ sessions: AttendanceSession[] }> => {
    const sp = new URLSearchParams();
    if (params?.limit != null) sp.set("limit", String(params.limit));
    if (params?.offset != null) sp.set("offset", String(params.offset));
    const q = sp.toString();
    return fetchApi(`/api/attendance/me/sessions${q ? `?${q}` : ""}`);
  },
  getEmployeeSessions: async (
    employeeId: number,
    params?: {
      limit?: number;
      offset?: number;
    },
  ): Promise<{ sessions: AttendanceSession[] }> => {
    const sp = new URLSearchParams();
    if (params?.limit != null) sp.set("limit", String(params.limit));
    if (params?.offset != null) sp.set("offset", String(params.offset));
    const q = sp.toString();
    return fetchApi(
      `/api/attendance/employees/${employeeId}/sessions${q ? `?${q}` : ""}`,
    );
  },
  checkIn: async (data: {
    work_mode: WorkMode;
    location_lat?: number;
    location_lng?: number;
    device_info?: Record<string, unknown>;
    ip_address?: string;
  }): Promise<{ session: AttendanceSession }> => {
    return fetchApi("/api/attendance/check-in", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  checkOut: async (): Promise<{ session: AttendanceSession }> => {
    return fetchApi("/api/attendance/check-out", { method: "POST" });
  },
  getTeam: async (): Promise<{
    summary: Array<{
      employee_id: number;
      name: string;
      email: string | null;
      checked_in: boolean;
      check_in_at: string | null;
      work_mode: string | null;
      status: string | null;
    }>;
    notCheckedIn: Array<{
      employee_id: number;
      name: string;
      email: string | null;
    }>;
    utilizationPercent: number;
  }> => {
    return fetchApi("/api/attendance/team");
  },
};

// ============================================================================
// CRM Module Types and API
// ============================================================================

// Contacts
export interface Contact {
  id: number;
  prefix?: string;
  first_name: string;
  last_name?: string;
  title?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  job_title?: string;
  department?: string;
  company?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  notes?: string;
  tags?: string[];
  company_id?: number;
  status: string;
  is_primary: boolean;
  preferred_contact_method?: string;
  linkedin_url?: string;
  instagram?: string;
  timezone?: string;
  birthday?: string;
  anniversary_date?: string;
  created_by?: number;
  updated_by?: number;
  created_at: string;
  updated_at: string;
  client_name?: string;
  client_company_name?: string;
  companies_associated?: number[];
  deals_associated?: number[];
}

export interface CreateContactInput {
  prefix?: string;
  first_name: string;
  last_name?: string;
  title?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  job_title?: string;
  department?: string;
  company?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  notes?: string;
  tags?: string[];
  company_id?: number;
  status?: string;
  is_primary?: boolean;
  preferred_contact_method?: string;
  linkedin_url?: string;
  instagram?: string;
  timezone?: string;
  birthday?: string;
  anniversary_date?: string;
  companies_associated?: number[];
  deals_associated?: number[];
}

export interface ContactsResponse {
  data: Contact[];
  total: number;
  limit: number;
  offset: number;
}

export interface ContactImportResult {
  created: number;
  updated: number;
  failed: number;
  errors: string[];
}

export const CONTACT_IMPORT_BATCH_SIZE = 50;

export const contactsApi = {
  getAll: async (
    params?: CollectionListQueryParams,
  ): Promise<ContactsResponse> => {
    const searchParams = new URLSearchParams();
    appendListQueryParams(searchParams, params);

    const query = searchParams.toString();
    return fetchApi<ContactsResponse>(
      `/api/contacts${query ? `?${query}` : ""}`,
    );
  },

  getById: async (id: number): Promise<Contact> => {
    return fetchApi<Contact>(`/api/contacts/${id}`);
  },

  create: async (data: CreateContactInput): Promise<Contact> => {
    return fetchApi<Contact>("/api/contacts", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  import: async (
    contacts: CreateContactInput[],
  ): Promise<ContactImportResult> => {
    return fetchApi<ContactImportResult>("/api/contacts/import", {
      method: "POST",
      body: JSON.stringify({ contacts }),
      timeoutMs: 120_000,
    });
  },

  update: async (
    id: number,
    data: Partial<CreateContactInput>,
  ): Promise<Contact> => {
    return fetchApi<Contact>(`/api/contacts/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  delete: async (id: number): Promise<void> => {
    return fetchApi<void>(`/api/contacts/${id}`, {
      method: "DELETE",
    });
  },

  deleteBulk: async (ids: number[]): Promise<void> => {
    if (ids.length === 0) return;
    return fetchApi<void>("/api/contacts/bulk-delete", {
      method: "POST",
      body: JSON.stringify({ ids }),
    });
  },
};

export type ContactActivityType = "task" | "call" | "whatsapp";

export interface ContactActivity {
  id: number;
  type: ContactActivityType;
  subject?: string;
  description?: string;
  contact_id?: number;
  company_id?: number;
  deal_id?: number;
  user_id?: number;
  activity_date: string;
  due_date?: string;
  status: string;
  duration_minutes?: number;
  outcome?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateContactActivityInput {
  type: ContactActivityType;
  subject?: string;
  description?: string;
  activity_date?: string;
  due_date?: string;
  status?: string;
  duration_minutes?: number;
  outcome?: string;
  deal_id?: number;
}

export const contactActivitiesApi = {
  list: async (contactId: number): Promise<{ data: ContactActivity[] }> => {
    return fetchApi<{ data: ContactActivity[] }>(
      `/api/contacts/${contactId}/activities`,
    );
  },

  create: async (
    contactId: number,
    data: CreateContactActivityInput,
  ): Promise<ContactActivity> => {
    return fetchApi<ContactActivity>(`/api/contacts/${contactId}/activities`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  update: async (
    contactId: number,
    activityId: number,
    data: Partial<CreateContactActivityInput>,
  ): Promise<ContactActivity> => {
    return fetchApi<ContactActivity>(
      `/api/contacts/${contactId}/activities/${activityId}`,
      {
        method: "PATCH",
        body: JSON.stringify(data),
      },
    );
  },

  delete: async (contactId: number, activityId: number): Promise<void> => {
    return fetchApi<void>(
      `/api/contacts/${contactId}/activities/${activityId}`,
      { method: "DELETE" },
    );
  },
};

// Companies (CRM; table `companies`, primary key `company_id`)
export interface Company {
  company_id: number;
  name: string;
  company_name?: string;
  email?: string;
  phone?: string;
  website?: string;
  industry?: string;
  company_size?: string;
  contacts_associated?: number[];
  deals_associated?: number[];
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  tax_id?: string;
  notes?: string;
  status: string;
  rating?: number;
  annual_revenue?: number;
  employee_count?: number;
  created_by?: number;
  updated_by?: number;
  created_at: string;
  updated_at: string;
  contact_count?: number;
  deal_count?: number;
  total_deal_value?: number;
}

export interface CreateCompanyInput {
  name: string;
  company_name?: string;
  email?: string;
  phone?: string;
  website?: string;
  industry?: string;
  company_size?: string;
  contacts_associated?: number[];
  deals_associated?: number[];
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  tax_id?: string;
  notes?: string;
  status?: string;
  rating?: number;
  annual_revenue?: number;
  employee_count?: number;
}

export interface CompaniesResponse {
  data: Company[];
  total: number;
  limit: number;
  offset: number;
}

export interface CompanyStats {
  total_companies: number;
  active_companies: number;
  total_deal_value: number;
  avg_rating: number;
}

export const companiesApi = {
  getAll: async (
    params?: CollectionListQueryParams,
  ): Promise<CompaniesResponse> => {
    const searchParams = new URLSearchParams();
    appendListQueryParams(searchParams, params);

    const query = searchParams.toString();
    return fetchApi<CompaniesResponse>(
      `/api/companies${query ? `?${query}` : ""}`,
    );
  },

  getById: async (companyId: number): Promise<Company> => {
    return fetchApi<Company>(`/api/companies/${companyId}`);
  },

  getStats: async (): Promise<CompanyStats> => {
    return fetchApi<CompanyStats>("/api/companies/stats");
  },

  create: async (data: CreateCompanyInput): Promise<Company> => {
    return fetchApi<Company>("/api/companies", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  update: async (
    companyId: number,
    data: Partial<CreateCompanyInput>,
  ): Promise<Company> => {
    return fetchApi<Company>(`/api/companies/${companyId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  delete: async (companyId: number): Promise<void> => {
    return fetchApi<void>(`/api/companies/${companyId}`, {
      method: "DELETE",
    });
  },
};

// Deals
export interface Deal {
  id: number;
  title: string;
  description?: string;
  company_id?: number;
  contact_id?: number;
  value?: number;
  currency: string;
  stage: string;
  probability: number;
  expected_close_date?: string;
  actual_close_date?: string;
  owner_id?: number;
  source?: string;
  tags?: string[];
  notes?: string;
  status: string;
  lost_reason?: string;
  next_follow_up_date?: string;
  created_by?: number;
  updated_by?: number;
  created_at: string;
  updated_at: string;
  client_name?: string;
  client_company_name?: string;
  contact_name?: string;
  contact_phone?: string;
  owner_name?: string;
  contacts_associated?: number[];
  companies_associated?: number[];
  /** Set when a project is auto-created from a closed-won transition. */
  project_id?: number;
}

export interface CreateDealInput {
  title: string;
  description?: string;
  company_id?: number;
  contact_id?: number;
  value?: number;
  currency?: string;
  stage?: string;
  probability?: number;
  expected_close_date?: string;
  owner_id?: number;
  source?: string;
  tags?: string[];
  notes?: string;
  status?: string;
  next_follow_up_date?: string;
  contacts_associated?: number[];
  companies_associated?: number[];
}

export interface DealsResponse {
  data: Deal[];
  total: number;
  limit: number;
  offset: number;
}

export interface PipelineSummary {
  stage: string;
  deal_count: number;
  total_value: number;
  avg_probability: number;
  weighted_value: number;
}

export interface DealStats {
  total_deals: number;
  open_deals: number;
  won_deals: number;
  lost_deals: number;
  total_value: number;
  weighted_value: number;
  avg_deal_size: number;
}

export type SalesDashboardPeriod =
  | "today"
  | "week"
  | "month"
  | "quarter"
  | "year";

export interface SalesDashboardFunnelStage {
  stage: string;
  deal_count: number;
  total_value: number;
}

export interface SalesDashboardActivity extends SalesActivity {}

export interface SalesDashboardRevenueTrendPoint {
  bucket: string;
  revenue: number;
}

export interface SalesDashboardData {
  period: SalesDashboardPeriod;
  pipeline_value: number;
  closed_deals_value: number;
  active_deals: number;
  active_employees: number;
  revenue_per_employee: number;
  funnel: SalesDashboardFunnelStage[];
  recent_activities: SalesDashboardActivity[];
  revenue_trend: SalesDashboardRevenueTrendPoint[];
  revenue_trend_granularity: "daily" | "weekly" | "quarterly" | "yearly";
}

export interface SalesActivity {
  id: number;
  type: string;
  subject?: string;
  description?: string;
  company_id?: number;
  contact_id?: number;
  deal_id?: number;
  user_id?: number;
  activity_date: string;
  due_date?: string;
  status: string;
  duration_minutes?: number;
  outcome?: string;
  created_at: string;
  updated_at: string;
  company_name?: string;
  contact_name?: string;
  deal_title?: string;
}

export interface SalesActivitiesResponse {
  data: SalesActivity[];
  total: number;
  limit: number;
  offset: number;
}

export type DealActivityType =
  | "task"
  | "call"
  | "note"
  | "meeting"
  | "whatsapp";

export interface DealActivity {
  id: number;
  type: DealActivityType;
  subject?: string;
  description?: string;
  company_id?: number;
  contact_id?: number;
  deal_id?: number;
  user_id?: number;
  activity_date: string;
  due_date?: string;
  status: string;
  duration_minutes?: number;
  outcome?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateDealActivityInput {
  type: DealActivityType;
  subject?: string;
  description?: string;
  activity_date?: string;
  due_date?: string;
  status?: string;
  duration_minutes?: number;
  outcome?: string;
  contact_id?: number;
}

export const dealsApi = {
  getAll: async (
    params?: CollectionListQueryParams,
  ): Promise<DealsResponse> => {
    const searchParams = new URLSearchParams();
    appendListQueryParams(searchParams, params);

    const query = searchParams.toString();
    return fetchApi<DealsResponse>(`/api/deals${query ? `?${query}` : ""}`);
  },

  getById: async (id: number): Promise<Deal> => {
    return fetchApi<Deal>(`/api/deals/${id}`);
  },

  getPipeline: async (): Promise<{ pipeline: PipelineSummary[] }> => {
    return fetchApi<{ pipeline: PipelineSummary[] }>("/api/deals/pipeline");
  },

  getDashboard: async (
    period: SalesDashboardPeriod = "month",
  ): Promise<SalesDashboardData> => {
    return fetchApi<SalesDashboardData>(
      `/api/deals/dashboard?period=${encodeURIComponent(period)}`,
    );
  },

  getStats: async (): Promise<DealStats> => {
    return fetchApi<DealStats>("/api/deals/stats");
  },

  create: async (data: CreateDealInput): Promise<Deal> => {
    return fetchApi<Deal>("/api/deals", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  update: async (
    id: number,
    data: Partial<CreateDealInput & { lost_reason?: string }>,
  ): Promise<Deal> => {
    return fetchApi<Deal>(`/api/deals/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  delete: async (id: number): Promise<void> => {
    return fetchApi<void>(`/api/deals/${id}`, {
      method: "DELETE",
    });
  },
};

export const dealActivitiesApi = {
  list: async (dealId: number): Promise<{ data: DealActivity[] }> => {
    return fetchApi<{ data: DealActivity[] }>(
      `/api/deals/${dealId}/activities`,
    );
  },

  create: async (
    dealId: number,
    data: CreateDealActivityInput,
  ): Promise<DealActivity> => {
    return fetchApi<DealActivity>(`/api/deals/${dealId}/activities`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  update: async (
    dealId: number,
    activityId: number,
    data: Partial<CreateDealActivityInput>,
  ): Promise<DealActivity> => {
    return fetchApi<DealActivity>(
      `/api/deals/${dealId}/activities/${activityId}`,
      {
        method: "PATCH",
        body: JSON.stringify(data),
      },
    );
  },

  delete: async (dealId: number, activityId: number): Promise<void> => {
    return fetchApi<void>(`/api/deals/${dealId}/activities/${activityId}`, {
      method: "DELETE",
    });
  },
};

export const activitiesApi = {
  getAll: async (
    params?: CollectionListQueryParams,
  ): Promise<SalesActivitiesResponse> => {
    const searchParams = new URLSearchParams();
    appendListQueryParams(searchParams, params);

    const query = searchParams.toString();
    return fetchApi<SalesActivitiesResponse>(
      `/api/activities${query ? `?${query}` : ""}`,
    );
  },
};

export const collectionFiltersApi = {
  getOptions: async (
    resource: string,
    field: string,
  ): Promise<{ options: Array<{ value: string; label: string }> }> => {
    const searchParams = new URLSearchParams({ resource, field });
    return fetchApi<{ options: Array<{ value: string; label: string }> }>(
      `/api/collection-filters/options?${searchParams.toString()}`,
    );
  },
};

export interface CollectionSavedViewFilterState {
  search?: string;
  facets?: Record<string, string[]>;
  numbers?: Record<string, { min?: string; max?: string }>;
  dates?: Record<string, { from?: string; to?: string }>;
}

export interface CollectionSavedViewRecord {
  id: number;
  user_id: number;
  resource: string;
  name: string;
  filter_state: CollectionSavedViewFilterState;
  created_at: string;
  updated_at: string;
}

export const collectionSavedViewsApi = {
  list: async (
    resource: string,
  ): Promise<{ data: CollectionSavedViewRecord[] }> => {
    const searchParams = new URLSearchParams({ resource });
    return fetchApi<{ data: CollectionSavedViewRecord[] }>(
      `/api/collection-saved-views?${searchParams.toString()}`,
    );
  },

  save: async (payload: {
    resource: string;
    name: string;
    filter_state: CollectionSavedViewFilterState;
  }): Promise<{ data: CollectionSavedViewRecord }> => {
    return fetchApi<{ data: CollectionSavedViewRecord }>(
      "/api/collection-saved-views",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    );
  },

  remove: async (id: number): Promise<{ success: boolean }> => {
    return fetchApi<{ success: boolean }>(`/api/collection-saved-views/${id}`, {
      method: "DELETE",
    });
  },
};

// ============================================================================
// Sales Stages (Settings) Types and API
// ============================================================================

export interface SalesStage {
  id: number;
  name: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export const salesStagesApi = {
  getAll: async (): Promise<{ data: SalesStage[] }> => {
    return fetchApi<{ data: SalesStage[] }>("/api/sales-stages");
  },

  create: async (data: {
    name: string;
    sort_order?: number;
  }): Promise<SalesStage> => {
    return fetchApi<SalesStage>("/api/sales-stages", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  update: async (
    id: number,
    data: { name?: string; sort_order?: number },
  ): Promise<SalesStage> => {
    return fetchApi<SalesStage>(`/api/sales-stages/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  delete: async (id: number): Promise<void> => {
    return fetchApi<void>(`/api/sales-stages/${id}`, {
      method: "DELETE",
    });
  },
};

// ============================================================================
// Project statuses (Settings → project pipeline / kanban)
// ============================================================================

export interface ProjectStatus {
  id: number;
  name: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export const projectStatusesApi = {
  getAll: async (): Promise<{ data: ProjectStatus[] }> => {
    return fetchApi<{ data: ProjectStatus[] }>("/api/project-statuses");
  },

  create: async (data: {
    name: string;
    sort_order?: number;
  }): Promise<ProjectStatus> => {
    return fetchApi<ProjectStatus>("/api/project-statuses", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  update: async (
    id: number,
    data: { name?: string; sort_order?: number },
  ): Promise<ProjectStatus> => {
    return fetchApi<ProjectStatus>(`/api/project-statuses/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  delete: async (id: number): Promise<void> => {
    return fetchApi<void>(`/api/project-statuses/${id}`, {
      method: "DELETE",
    });
  },
};

// ============================================================================
// Task statuses (Settings → task pipeline catalog)
// ============================================================================

/** Workflow category driving permissions and automation (Linear-style). */
export type WorkflowCategory = "backlog" | "in_progress" | "review" | "done";

export const WORKFLOW_CATEGORY_ORDER: Record<WorkflowCategory, number> = {
  backlog: 0,
  in_progress: 1,
  review: 2,
  done: 3,
};

export const WORKFLOW_CATEGORY_LABELS: Record<WorkflowCategory, string> = {
  backlog: "Backlog",
  in_progress: "In Progress",
  review: "Review",
  done: "Done",
};

export interface TaskStatus {
  id: number;
  name: string;
  category: WorkflowCategory;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export const taskStatusesApi = {
  getAll: async (): Promise<{ data: TaskStatus[] }> => {
    return fetchApi<{ data: TaskStatus[] }>("/api/task-statuses");
  },

  create: async (data: {
    name: string;
    sort_order?: number;
    category?: WorkflowCategory;
  }): Promise<TaskStatus> => {
    return fetchApi<TaskStatus>("/api/task-statuses", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  update: async (
    id: number,
    data: { name?: string; sort_order?: number; category?: WorkflowCategory },
  ): Promise<TaskStatus> => {
    return fetchApi<TaskStatus>(`/api/task-statuses/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  delete: async (id: number): Promise<void> => {
    return fetchApi<void>(`/api/task-statuses/${id}`, {
      method: "DELETE",
    });
  },
};

// ============================================================================
// Tasks (Linear-style board: /tasks)
// ============================================================================

export interface BoardTask {
  id: number;
  project_id: number;
  title: string;
  status: string;
  end_date?: string | null;
  category: WorkflowCategory | null;
  priority: string | null;
  number: number;
  /** e.g. ACME-12 */
  display_key: string;
  project_key: string;
  project_name: string;
  branch_name: string | null;
  assigned_employee_id: number | null;
  assignee_name: string | null;
  pr_count: number;
  latest_pr_state: "open" | "merged" | "closed" | null;
  created_at: string;
  updated_at: string;
}

export interface TaskPullRequest {
  id: number;
  repo_owner: string;
  repo_name: string;
  pr_number: number;
  title: string | null;
  url: string;
  state: "open" | "merged" | "closed";
  author_login: string | null;
  head_branch: string | null;
  opened_at: string | null;
  merged_at: string | null;
}

export interface TaskActivityEntry {
  id: number;
  change_type: string;
  field_name: string;
  old_value: string | null;
  new_value: string | null;
  changed_by: string | null;
  created_at: string;
  /** Resolved employee name when field_name is assigned_employee_id */
  new_assignee_name?: string | null;
  old_assignee_name?: string | null;
}

export interface TaskTimeInStatus {
  status: string;
  category: WorkflowCategory;
  seconds: number;
}

export interface TaskDetail extends BoardTask {
  description: string | null;
  pull_requests: TaskPullRequest[];
  activity: TaskActivityEntry[];
  time_in_status: TaskTimeInStatus[];
}

export interface TaskBoardFilters {
  project_id?: number;
  assigned_employee_id?: number;
  status?: string;
  category?: WorkflowCategory;
  q?: string;
}

export interface TakeTaskResponse extends BoardTask {
  /** True when the take action assigned the task to the caller. */
  assigned: boolean;
  /** True when the take action moved the task to In Progress. */
  moved: boolean;
}

export const tasksApi = {
  board: async (filters?: TaskBoardFilters): Promise<{ data: BoardTask[] }> => {
    const params = new URLSearchParams();
    if (filters?.project_id) params.set("project_id", String(filters.project_id));
    if (filters?.assigned_employee_id) {
      params.set("assigned_employee_id", String(filters.assigned_employee_id));
    }
    if (filters?.status) params.set("status", filters.status);
    if (filters?.category) params.set("category", filters.category);
    if (filters?.q) params.set("q", filters.q);
    const qs = params.toString();
    return fetchApi<{ data: BoardTask[] }>(`/api/tasks${qs ? `?${qs}` : ""}`);
  },

  getByKey: async (key: string): Promise<TaskDetail> => {
    return fetchApi<TaskDetail>(`/api/tasks/${encodeURIComponent(key)}`);
  },

  create: async (data: {
    project_id: number;
    title: string;
    description?: string;
    assigned_employee_id?: number | null;
    priority?: string;
    end_date?: string | null;
  }): Promise<BoardTask> => {
    return fetchApi<BoardTask>("/api/tasks", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  update: async (
    id: number,
    data: {
      title?: string;
      description?: string | null;
      status?: string;
      assigned_employee_id?: number | null;
      end_date?: string | null;
      priority?: string;
    },
  ): Promise<BoardTask> => {
    return fetchApi<BoardTask>(`/api/tasks/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  /**
   * Linear-style "copy branch name" action: persists the branch name,
   * assigns the caller if unassigned, and moves backlog tasks to In Progress.
   */
  take: async (id: number): Promise<TakeTaskResponse> => {
    return fetchApi<TakeTaskResponse>(`/api/tasks/${id}/take`, {
      method: "POST",
    });
  },

  delete: async (id: number): Promise<void> => {
    return fetchApi<void>(`/api/tasks/${id}`, { method: "DELETE" });
  },
};

// ============================================================================
// Workspace skills (Settings) + employee skill matrix (levels 1–4)
// ============================================================================

export interface WorkspaceSkill {
  id: number;
  name: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export const workspaceSkillsApi = {
  getAll: async (): Promise<{ data: WorkspaceSkill[] }> => {
    return fetchApi<{ data: WorkspaceSkill[] }>("/api/workspace-skills");
  },

  create: async (data: {
    name: string;
    sort_order?: number;
  }): Promise<WorkspaceSkill> => {
    return fetchApi<WorkspaceSkill>("/api/workspace-skills", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  update: async (
    id: number,
    data: { name?: string; sort_order?: number },
  ): Promise<WorkspaceSkill> => {
    return fetchApi<WorkspaceSkill>(`/api/workspace-skills/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  delete: async (id: number): Promise<void> => {
    return fetchApi<void>(`/api/workspace-skills/${id}`, {
      method: "DELETE",
    });
  },
};

export interface EmployeeSkillAssignment {
  skill_id: number;
  level: number;
  skill_name?: string;
}

export interface SkillMatrixEmployee {
  id: number;
  emp_code: string;
  first_name: string;
  last_name: string;
  department: string | null;
  /** skill id (string key) → level 1–4 */
  skill_levels: Record<string, number>;
}

export const employeeSkillsApi = {
  getMatrix: async (): Promise<{
    skills: WorkspaceSkill[];
    employees: SkillMatrixEmployee[];
  }> => {
    return fetchApi<{
      skills: WorkspaceSkill[];
      employees: SkillMatrixEmployee[];
    }>("/api/employee-skills/matrix");
  },

  getForEmployee: async (
    employeeId: number,
  ): Promise<{
    employee_id: number;
    assignments: EmployeeSkillAssignment[];
  }> => {
    return fetchApi<{
      employee_id: number;
      assignments: EmployeeSkillAssignment[];
    }>(`/api/employee-skills/${employeeId}`);
  },

  updateEmployee: async (
    employeeId: number,
    data: {
      assignments: Pick<EmployeeSkillAssignment, "skill_id" | "level">[];
    },
  ): Promise<{
    employee_id: number;
    assignments: EmployeeSkillAssignment[];
  }> => {
    return fetchApi<{
      employee_id: number;
      assignments: EmployeeSkillAssignment[];
    }>(`/api/employee-skills/${employeeId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },
};

// ============================================================================
// User app launcher (per-user external shortcuts)
// ============================================================================

export interface UserApp {
  id: number;
  user_id: number;
  url: string;
  title: string;
  icon_url: string | null;
  created_at: string;
  updated_at: string;
}

export const userAppsApi = {
  list: async (): Promise<{ data: UserApp[] }> => {
    return fetchApi<{ data: UserApp[] }>("/api/user-apps");
  },
  create: async (data: { url: string }): Promise<UserApp> => {
    return fetchApi<UserApp>("/api/user-apps", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  delete: async (id: number): Promise<void> => {
    return fetchApi<void>(`/api/user-apps/${id}`, { method: "DELETE" });
  },
};

// ============================================================================
// Invoices + invoice company settings
// ============================================================================

export interface InvoiceSettings {
  id: number;
  user_id: number;
  company_name: string;
  company_address: string;
  company_gst: string;
  company_logo_url?: string;
  created_at: string;
  updated_at: string;
}

export interface InvoiceItem {
  id?: number;
  invoice_id?: number;
  item_description: string;
  hsn: string;
  quantity: number;
  rate: number;
  amount?: number;
  gst_rate: number;
  cgst_amount?: number;
  sgst_amount?: number;
  line_total?: number;
}

export interface Invoice {
  id: number;
  user_id: number;
  invoice_number: string;
  customer_name: string;
  customer_address: string;
  customer_gst: string;
  payment_terms: string;
  place_of_supply: string;
  invoice_date: string;
  due_date?: string;
  status?: string | null;
  balance_due?: number | null;
  subtotal: number;
  cgst_total: number;
  sgst_total: number;
  total: number;
  terms_and_conditions: string;
  authorized_signature: string;
  created_at: string;
  updated_at: string;
  items?: InvoiceItem[];
}

export interface CreateInvoiceInput {
  customer_name: string;
  customer_address: string;
  customer_gst: string;
  payment_terms?: string;
  place_of_supply?: string;
  invoice_date?: string;
  due_date?: string;
  terms_and_conditions?: string;
  authorized_signature?: string;
  items: Array<{
    item_description: string;
    hsn: string;
    quantity: number;
    rate: number;
    gst_rate: number;
  }>;
}

export interface InvoicesResponse {
  data: Invoice[];
  total: number;
  limit: number;
  offset: number;
}

export type AccountsDashboardPeriod =
  | "today"
  | "week"
  | "month"
  | "quarter"
  | "year";

export interface FinancialReportLine {
  id: string;
  label: string;
  amount: number;
  children?: FinancialReportLine[];
  is_total?: boolean;
  is_header?: boolean;
}

export interface AccountsDashboardData {
  period: AccountsDashboardPeriod;
  revenue: number;
  net_income: number;
  cash_collected: number;
  outstanding_receivables: number;
  invoice_count: number;
  profit_and_loss: FinancialReportLine[];
  cash_flow: FinancialReportLine[];
}

export const accountsApi = {
  getDashboard: async (
    period: AccountsDashboardPeriod = "month",
  ): Promise<AccountsDashboardData> => {
    return fetchApi<AccountsDashboardData>(
      `/api/accounts/dashboard?period=${encodeURIComponent(period)}`,
    );
  },
};

export interface PricingCalculatorConfigResponse {
  id: number;
  config: import("./pricing-calculator").PricingCalculatorConfig;
  created_at: string;
  updated_at: string;
}

export const pricingCalculatorApi = {
  getConfig: async (): Promise<PricingCalculatorConfigResponse> => {
    return fetchApi<PricingCalculatorConfigResponse>(
      "/api/pricing-calculator/config",
    );
  },
  updateConfig: async (
    config: import("./pricing-calculator").PricingCalculatorConfig,
  ): Promise<PricingCalculatorConfigResponse> => {
    return fetchApi<PricingCalculatorConfigResponse>(
      "/api/pricing-calculator/config",
      {
        method: "PUT",
        body: JSON.stringify({ config }),
      },
    );
  },
};

export const invoiceSettingsApi = {
  get: async (): Promise<InvoiceSettings | null> => {
    return fetchApi<InvoiceSettings | null>("/api/invoice-settings");
  },
  update: async (data: {
    company_name: string;
    company_address: string;
    company_gst: string;
    company_logo_url?: string;
  }): Promise<InvoiceSettings> => {
    return fetchApi<InvoiceSettings>("/api/invoice-settings", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },
};

export const invoicesApi = {
  getAll: async (
    params?: CollectionListQueryParams,
  ): Promise<InvoicesResponse> => {
    const searchParams = new URLSearchParams();
    appendListQueryParams(searchParams, params);

    const query = searchParams.toString();
    return fetchApi<InvoicesResponse>(
      `/api/invoices${query ? `?${query}` : ""}`,
    );
  },
  getById: async (id: number): Promise<Invoice> => {
    return fetchApi<Invoice>(`/api/invoices/${id}`);
  },
  create: async (data: CreateInvoiceInput): Promise<Invoice> => {
    return fetchApi<Invoice>("/api/invoices", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  update: async (id: number, data: CreateInvoiceInput): Promise<Invoice> => {
    return fetchApi<Invoice>(`/api/invoices/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },
  delete: async (id: number): Promise<void> => {
    return fetchApi<void>(`/api/invoices/${id}`, { method: "DELETE" });
  },
};

export interface BillItem {
  id?: number;
  bill_id?: number;
  item_description: string;
  hsn: string;
  quantity: number;
  rate: number;
  amount?: number;
  gst_rate?: number;
  cgst_amount?: number;
  sgst_amount?: number;
  line_total?: number;
}

export interface Bill {
  id: number;
  user_id: number;
  bill_number: string;
  vendor_name: string;
  vendor_address: string;
  vendor_gst: string;
  payment_terms: string;
  place_of_supply: string;
  bill_date: string;
  due_date?: string;
  status?: string | null;
  balance_due?: number | null;
  subtotal: number;
  cgst_total: number;
  sgst_total: number;
  total: number;
  zoho_bill_id?: string | null;
  created_at: string;
  updated_at: string;
  items?: BillItem[];
}

export interface CreateBillInput {
  vendor_name: string;
  vendor_address: string;
  vendor_gst: string;
  payment_terms?: string;
  place_of_supply?: string;
  bill_date?: string;
  due_date?: string;
  zoho_vendor_id?: string;
  items: Array<{
    item_description: string;
    hsn: string;
    quantity: number;
    rate: number;
    gst_rate: number;
  }>;
}

export interface BillZohoSyncResult {
  synced: boolean;
  error: string | null;
}

export interface CreateBillResponse extends Bill {
  zoho_sync?: BillZohoSyncResult;
}

export interface BillsResponse {
  data: Bill[];
  total: number;
  limit: number;
  offset: number;
}

export const billsApi = {
  getAll: async (
    params?: CollectionListQueryParams,
  ): Promise<BillsResponse> => {
    const searchParams = new URLSearchParams();
    appendListQueryParams(searchParams, params);

    const query = searchParams.toString();
    return fetchApi<BillsResponse>(`/api/bills${query ? `?${query}` : ""}`);
  },
  getById: async (id: number): Promise<Bill> => {
    return fetchApi<Bill>(`/api/bills/${id}`);
  },
  create: async (data: CreateBillInput): Promise<CreateBillResponse> => {
    return fetchApi<CreateBillResponse>("/api/bills", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  pushToZoho: async (id: number): Promise<CreateBillResponse> => {
    return fetchApi<CreateBillResponse>(`/api/bills/${id}/push-zoho`, {
      method: "POST",
    });
  },
  delete: async (id: number): Promise<void> => {
    return fetchApi<void>(`/api/bills/${id}`, { method: "DELETE" });
  },
};

// ============================================================================
// Product catalog: interface / feature types & items
// ============================================================================

export interface InterfaceType {
  id: number;
  name: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface FeatureType {
  id: number;
  name: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CatalogInterface {
  id: number;
  name: string;
  interface_type_id: number;
  interface_type_name?: string;
  cost: string | null;
  created_at: string;
  updated_at: string;
}

export interface CatalogFeature {
  id: number;
  name: string;
  feature_type_id: number;
  feature_type_name?: string;
  cost: string | null;
  created_at: string;
  updated_at: string;
}

export const interfaceTypesApi = {
  getAll: async (): Promise<{ data: InterfaceType[] }> => {
    return fetchApi<{ data: InterfaceType[] }>("/api/interface-types");
  },
  create: async (data: {
    name: string;
    sort_order?: number;
  }): Promise<InterfaceType> => {
    return fetchApi<InterfaceType>("/api/interface-types", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  update: async (
    id: number,
    data: { name?: string; sort_order?: number },
  ): Promise<InterfaceType> => {
    return fetchApi<InterfaceType>(`/api/interface-types/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },
  delete: async (id: number): Promise<void> => {
    return fetchApi<void>(`/api/interface-types/${id}`, { method: "DELETE" });
  },
};

export const featureTypesApi = {
  getAll: async (): Promise<{ data: FeatureType[] }> => {
    return fetchApi<{ data: FeatureType[] }>("/api/feature-types");
  },
  create: async (data: {
    name: string;
    sort_order?: number;
  }): Promise<FeatureType> => {
    return fetchApi<FeatureType>("/api/feature-types", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  update: async (
    id: number,
    data: { name?: string; sort_order?: number },
  ): Promise<FeatureType> => {
    return fetchApi<FeatureType>(`/api/feature-types/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },
  delete: async (id: number): Promise<void> => {
    return fetchApi<void>(`/api/feature-types/${id}`, { method: "DELETE" });
  },
};

export const catalogInterfacesApi = {
  getAll: async (params?: {
    search?: string;
  }): Promise<{ data: CatalogInterface[] }> => {
    const q = params?.search
      ? `?search=${encodeURIComponent(params.search)}`
      : "";
    return fetchApi<{ data: CatalogInterface[] }>(
      `/api/catalog-interfaces${q}`,
    );
  },
  getById: async (id: number): Promise<CatalogInterface> => {
    return fetchApi<CatalogInterface>(`/api/catalog-interfaces/${id}`);
  },
  create: async (data: {
    name: string;
    interface_type_id: number;
    cost?: number | null;
  }): Promise<CatalogInterface> => {
    return fetchApi<CatalogInterface>("/api/catalog-interfaces", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  update: async (
    id: number,
    data: {
      name?: string;
      interface_type_id?: number;
      cost?: number | null;
    },
  ): Promise<CatalogInterface> => {
    return fetchApi<CatalogInterface>(`/api/catalog-interfaces/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },
  delete: async (id: number): Promise<void> => {
    return fetchApi<void>(`/api/catalog-interfaces/${id}`, {
      method: "DELETE",
    });
  },
};

export const catalogFeaturesApi = {
  getAll: async (params?: {
    search?: string;
  }): Promise<{ data: CatalogFeature[] }> => {
    const q = params?.search
      ? `?search=${encodeURIComponent(params.search)}`
      : "";
    return fetchApi<{ data: CatalogFeature[] }>(`/api/catalog-features${q}`);
  },
  getById: async (id: number): Promise<CatalogFeature> => {
    return fetchApi<CatalogFeature>(`/api/catalog-features/${id}`);
  },
  create: async (data: {
    name: string;
    feature_type_id: number;
    cost?: number | null;
  }): Promise<CatalogFeature> => {
    return fetchApi<CatalogFeature>("/api/catalog-features", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  update: async (
    id: number,
    data: {
      name?: string;
      feature_type_id?: number;
      cost?: number | null;
    },
  ): Promise<CatalogFeature> => {
    return fetchApi<CatalogFeature>(`/api/catalog-features/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },
  delete: async (id: number): Promise<void> => {
    return fetchApi<void>(`/api/catalog-features/${id}`, { method: "DELETE" });
  },
};

// ============================================================================
// GitHub Connections Types and API
// ============================================================================

export interface GitHubConnection {
  id: number;
  user_id: number;
  connection_name: string;
  token_type: string;
  github_user?: string;
  github_email?: string;
  scopes?: string[];
  is_active: boolean;
  last_verified_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateGitHubConnectionInput {
  connection_name: string;
  access_token: string;
}

export interface UpdateGitHubConnectionInput {
  connection_name?: string;
  access_token?: string;
  is_active?: boolean;
}

export interface GitHubConnectionsResponse {
  data: GitHubConnection[];
  total: number;
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string;
  private: boolean;
  default_branch: string;
  html_url: string;
  owner: string;
  owner_avatar: string;
  updated_at: string;
  language: string;
  stars: number;
  forks: number;
}

export interface GitHubReposResponse {
  data: GitHubRepo[];
  total: number;
}

export interface ProjectGitHubRepository {
  id: number;
  project_id: number;
  github_connection_id: number;
  repo_owner: string;
  repo_name: string;
  branch: string;
  is_primary: boolean;
  sync_enabled: boolean;
  last_synced_at?: string;
  created_at: string;
  updated_at: string;
  connection_name?: string;
  github_user?: string;
}

export interface ProjectGitHubRepositoriesResponse {
  data: ProjectGitHubRepository[];
  total: number;
}

export interface LinkRepositoryInput {
  github_connection_id: number;
  repo_owner: string;
  repo_name: string;
  branch?: string;
  is_primary?: boolean;
  sync_enabled?: boolean;
}

export interface GitHubProject {
  id: number;
  project_id: number;
  github_connection_id: number;
  github_project_id: string; // GraphQL node ID (string like "PVT_kwDO...")
  github_project_number: number;
  github_project_title: string;
  github_project_url?: string;
  github_owner_type: string;
  github_owner_name: string;
  sync_enabled: boolean;
  sync_direction: string;
  last_synced_at?: string;
  created_at: string;
  updated_at: string;
  connection_name?: string;
  github_user?: string;
}

export interface GitHubProjectItem {
  id: string;
  type: string;
  title: string;
  status: string;
  url?: string;
  number?: number;
  mapped_to_task?: number | null;
  mapped_to_task_title?: string | null;
  mapped_to_task_status?: string | null;
  mapping_id?: number | null;
}

export interface GitHubProjectsResponse {
  data: GitHubProject[];
  total: number;
}

export interface GitHubProjectItemsResponse {
  data: GitHubProjectItem[];
  total: number;
}

export interface LinkGitHubProjectInput {
  github_connection_id: number;
  github_project_id: string; // GraphQL node ID (string like "PVT_kwDO...")
  github_project_number: number;
  github_project_title: string;
  github_project_url?: string;
  github_owner_type: string;
  github_owner_name: string;
  sync_enabled?: boolean;
  sync_direction?: string;
}

export const githubApi = {
  // Get all GitHub connections
  getConnections: async (): Promise<GitHubConnectionsResponse> => {
    return fetchApi<GitHubConnectionsResponse>("/api/github/connections");
  },

  // Get specific GitHub connection
  getConnection: async (id: number): Promise<GitHubConnection> => {
    return fetchApi<GitHubConnection>(`/api/github/connections/${id}`);
  },

  // Create new GitHub connection
  createConnection: async (
    data: CreateGitHubConnectionInput,
  ): Promise<GitHubConnection> => {
    return fetchApi<GitHubConnection>("/api/github/connections", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // Update GitHub connection
  updateConnection: async (
    id: number,
    data: UpdateGitHubConnectionInput,
  ): Promise<GitHubConnection> => {
    return fetchApi<GitHubConnection>(`/api/github/connections/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  // Delete GitHub connection
  deleteConnection: async (id: number): Promise<void> => {
    return fetchApi<void>(`/api/github/connections/${id}`, {
      method: "DELETE",
    });
  },

  // Verify GitHub connection
  verifyConnection: async (
    id: number,
  ): Promise<{
    success: boolean;
    github_user?: string;
    github_email?: string;
    account_type?: string;
    error?: string;
  }> => {
    return fetchApi(`/api/github/connections/${id}/verify`, {
      method: "POST",
    });
  },

  // List repositories for a connection
  getConnectionRepositories: async (
    connectionId: number,
  ): Promise<GitHubReposResponse> => {
    return fetchApi<GitHubReposResponse>(
      `/api/github/connections/${connectionId}/repositories`,
    );
  },

  // Get repositories linked to a project
  getProjectRepositories: async (
    projectId: number,
  ): Promise<ProjectGitHubRepositoriesResponse> => {
    return fetchApi<ProjectGitHubRepositoriesResponse>(
      `/api/projects/${projectId}/github/repositories`,
    );
  },

  // Link repository to project
  linkRepository: async (
    projectId: number,
    data: LinkRepositoryInput,
  ): Promise<ProjectGitHubRepository> => {
    return fetchApi<ProjectGitHubRepository>(
      `/api/projects/${projectId}/github/repositories`,
      {
        method: "POST",
        body: JSON.stringify(data),
      },
    );
  },

  // Update repository link
  updateRepositoryLink: async (
    projectId: number,
    repoId: number,
    data: Partial<LinkRepositoryInput>,
  ): Promise<ProjectGitHubRepository> => {
    return fetchApi<ProjectGitHubRepository>(
      `/api/projects/${projectId}/github/repositories/${repoId}`,
      {
        method: "PUT",
        body: JSON.stringify(data),
      },
    );
  },

  // Remove repository link
  removeRepositoryLink: async (
    projectId: number,
    repoId: number,
  ): Promise<void> => {
    return fetchApi<void>(
      `/api/projects/${projectId}/github/repositories/${repoId}`,
      {
        method: "DELETE",
      },
    );
  },

  // Get commits from linked repository
  getRepositoryCommits: async (
    projectId: number,
    repoId: number,
  ): Promise<CommitsResponse> => {
    return fetchApi<CommitsResponse>(
      `/api/projects/${projectId}/github/repositories/${repoId}/commits`,
    );
  },

  // Sync repository commits (2-way sync)
  syncRepository: async (
    projectId: number,
    repoId: number,
  ): Promise<{
    success: boolean;
    message: string;
    new_commits: number;
    total_commits: number;
    repository: {
      owner: string;
      name: string;
      branch: string;
    };
  }> => {
    return fetchApi(
      `/api/projects/${projectId}/github/repositories/${repoId}/sync`,
      {
        method: "POST",
      },
    );
  },

  // Sync project task to GitHub issue (2-way sync - project to GitHub)
  syncTaskToGitHub: async (
    projectId: number,
    taskId: number,
    data: {
      github_repository_id: number;
      title?: string;
      description?: string;
      labels?: string[];
    },
  ): Promise<{
    success: boolean;
    message: string;
    issue: {
      number: number;
      url: string;
      title: string;
    };
  }> => {
    return fetchApi(
      `/api/projects/${projectId}/tasks/${taskId}/sync-to-github`,
      {
        method: "POST",
        body: JSON.stringify(data),
      },
    );
  },

  // ============================================================================
  // GitHub Projects API
  // ============================================================================

  // List available GitHub Projects from a connection
  getConnectionProjects: async (
    connectionId: number,
  ): Promise<{
    data: Array<{
      id: string;
      number: number;
      title: string;
      url: string;
      owner_type: string;
      owner_name: string;
      public?: boolean;
      closed?: boolean;
    }>;
    total: number;
    message?: string;
    hint?: string;
    debug?: {
      user_login?: string;
      organizations?: string[];
      viewer_data_received?: boolean;
      user_projects_total_count?: number;
      query_successful?: boolean;
      errors?: any;
      test_endpoint?: string;
    };
  }> => {
    return fetchApi(`/api/github/connections/${connectionId}/projects`);
  },

  // Link GitHub Project to Wraptron project
  linkGitHubProject: async (
    projectId: number,
    data: LinkGitHubProjectInput,
  ): Promise<GitHubProject> => {
    return fetchApi<GitHubProject>(
      `/api/projects/${projectId}/github/projects`,
      {
        method: "POST",
        body: JSON.stringify(data),
      },
    );
  },

  // Get linked GitHub Projects for a project
  getProjectGitHubProjects: async (
    projectId: number,
  ): Promise<GitHubProjectsResponse> => {
    return fetchApi<GitHubProjectsResponse>(
      `/api/projects/${projectId}/github/projects`,
    );
  },

  // Get items from a GitHub Project
  getGitHubProjectItems: async (
    projectId: number,
    githubProjectId: number,
  ): Promise<GitHubProjectItemsResponse> => {
    return fetchApi<GitHubProjectItemsResponse>(
      `/api/projects/${projectId}/github/projects/${githubProjectId}/items`,
    );
  },

  // Map GitHub Project item to task
  mapProjectItemToTask: async (
    projectId: number,
    githubProjectId: number,
    itemId: string,
    taskId: number,
  ): Promise<{
    id: number;
    project_id: number;
    github_project_id: number;
    task_id: number;
    github_item_id: string;
  }> => {
    return fetchApi(
      `/api/projects/${projectId}/github/projects/${githubProjectId}/items/${itemId}/map-to-task`,
      {
        method: "POST",
        body: JSON.stringify({ task_id: taskId }),
      },
    );
  },

  // Unmap GitHub Project item from task
  unmapProjectItemFromTask: async (
    projectId: number,
    githubProjectId: number,
    itemId: string,
  ): Promise<{ success: boolean; message: string }> => {
    return fetchApi(
      `/api/projects/${projectId}/github/projects/${githubProjectId}/items/${itemId}/map-to-task`,
      {
        method: "DELETE",
      },
    );
  },

  // Sync GitHub Project items
  syncGitHubProject: async (
    projectId: number,
    githubProjectId: number,
  ): Promise<{
    success: boolean;
    message: string;
    items_synced: number;
    total_items: number;
  }> => {
    return fetchApi(
      `/api/projects/${projectId}/github/projects/${githubProjectId}/sync`,
      {
        method: "POST",
      },
    );
  },

  // Unlink GitHub Project
  unlinkGitHubProject: async (
    projectId: number,
    githubProjectId: number,
  ): Promise<void> => {
    return fetchApi<void>(
      `/api/projects/${projectId}/github/projects/${githubProjectId}`,
      {
        method: "DELETE",
      },
    );
  },
};

// ============================================================================
// Zoho Connections Types and API
// ============================================================================

export interface ZohoConnection {
  id: number;
  user_id: number;
  connection_name: string;
  token_type: string;
  expires_at?: string;
  api_domain?: string;
  accounts_domain?: string;
  zoho_user_id?: string;
  zoho_email?: string;
  zoho_display_name?: string;
  scopes?: string[];
  books_organization_id?: string;
  books_organization_name?: string;
  is_active: boolean;
  last_verified_at?: string;
  last_sync_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ZohoBooksOrganization {
  organization_id: string;
  name: string;
  contact_name?: string;
  email?: string;
  is_default_org?: boolean;
  currency_code?: string;
  is_org_active?: boolean;
}

export interface ZohoBooksOrganizationsResponse {
  data: ZohoBooksOrganization[];
  total: number;
}

export interface ZohoSyncEntityStats {
  created: number;
  matched: number;
  updated: number;
  skipped: number;
  errors: number;
}

export interface ZohoSyncStats {
  customers: ZohoSyncEntityStats;
  products: ZohoSyncEntityStats;
  invoices: ZohoSyncEntityStats;
  bills: ZohoSyncEntityStats;
}

export interface ZohoSyncResponse {
  success: boolean;
  stats?: ZohoSyncStats;
  error?: string;
  message?: string;
}

export interface ZohoConnectionsResponse {
  data: ZohoConnection[];
  total: number;
}

export interface ZohoOAuthConfigResponse {
  configured: boolean;
  accounts_domain: string;
  scopes: string;
  redirect_uri?: string;
}

export interface ZohoVendor {
  id: string;
  name: string;
  gst_no?: string | null;
  address?: string | null;
}

export interface ZohoVendorsResponse {
  data: ZohoVendor[];
  total: number;
}

export const zohoApi = {
  getOAuthConfig: async (): Promise<ZohoOAuthConfigResponse> => {
    return fetchApi<ZohoOAuthConfigResponse>("/api/zoho/oauth/config");
  },

  startOAuth: async (data: {
    connection_name: string;
  }): Promise<{ authorization_url: string }> => {
    return fetchApi<{ authorization_url: string }>("/api/zoho/oauth/start", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  getConnections: async (): Promise<ZohoConnectionsResponse> => {
    return fetchApi<ZohoConnectionsResponse>("/api/zoho/connections");
  },

  getConnection: async (id: number): Promise<ZohoConnection> => {
    return fetchApi<ZohoConnection>(`/api/zoho/connections/${id}`);
  },

  updateConnection: async (
    id: number,
    data: {
      connection_name?: string;
      is_active?: boolean;
      books_organization_id?: string;
      books_organization_name?: string;
    },
  ): Promise<ZohoConnection> => {
    return fetchApi<ZohoConnection>(`/api/zoho/connections/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  deleteConnection: async (id: number): Promise<void> => {
    return fetchApi<void>(`/api/zoho/connections/${id}`, {
      method: "DELETE",
    });
  },

  verifyConnection: async (
    id: number,
  ): Promise<{
    success: boolean;
    zoho_user_id?: string;
    zoho_email?: string;
    zoho_display_name?: string;
    books_organizations_count?: number;
    books_organization_id?: string;
    books_organization_name?: string;
    books_error?: string;
    error?: string;
  }> => {
    return fetchApi(`/api/zoho/connections/${id}/verify`, {
      method: "POST",
    });
  },

  getBooksOrganizations: async (
    id: number,
  ): Promise<ZohoBooksOrganizationsResponse> => {
    return fetchApi<ZohoBooksOrganizationsResponse>(
      `/api/zoho/connections/${id}/books/organizations`,
    );
  },

  syncConnection: async (id: number): Promise<ZohoSyncResponse> => {
    return fetchApi<ZohoSyncResponse>(`/api/zoho/connections/${id}/sync`, {
      method: "POST",
    });
  },

  getVendors: async (): Promise<ZohoVendorsResponse> => {
    return fetchApi<ZohoVendorsResponse>("/api/zoho/vendors");
  },
};

// ============================================================================
// Admin User Management Types and API
// ============================================================================

export interface AdminUser {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  role: string;
  is_active: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateAdminUserInput {
  email: string;
  password?: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  role?: string;
}

export interface InviteAdminUserInput {
  email: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  role?: string;
  org_role_id?: number;
  role_id?: number;
}

export interface UpdateAdminUserInput extends Partial<CreateAdminUserInput> {
  is_active?: boolean;
}

export interface AdminUsersResponse {
  users: AdminUser[];
  total: number;
  limit: number;
  offset: number;
}

export interface Permission {
  id: number;
  name: string;
  description: string;
  resource: string;
  action: string;
  created_at: string;
}

export interface RolePermission {
  role: string;
  permissions: {
    name: string;
    description: string;
    resource: string;
    action: string;
  }[];
}

export interface UserPermissions {
  user_id: number;
  role: string;
  role_permissions: string[];
  user_permissions: {
    name: string;
    granted: boolean;
  }[];
  effective_permissions: string[];
}

export const adminApi = {
  // Get all users
  getUsers: async (params?: {
    search?: string;
    role?: string;
    is_active?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<AdminUsersResponse> => {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.append("search", params.search);
    if (params?.role) searchParams.append("role", params.role);
    if (params?.is_active !== undefined) {
      searchParams.append("is_active", params.is_active.toString());
    }
    if (params?.limit) searchParams.append("limit", params.limit.toString());
    if (params?.offset) searchParams.append("offset", params.offset.toString());

    const query = searchParams.toString();
    return fetchApi<AdminUsersResponse>(
      `/api/admin/users${query ? `?${query}` : ""}`,
    );
  },

  // Get user by ID
  getUser: async (id: number): Promise<{ user: AdminUser }> => {
    return fetchApi<{ user: AdminUser }>(`/api/admin/users/${id}`);
  },

  // Invite user (sends email link to set password)
  inviteUser: async (
    data: InviteAdminUserInput,
  ): Promise<{ user: AdminUser; message: string }> => {
    return fetchApi<{ user: AdminUser; message: string }>("/api/admin/users/invite", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // Create user (backwards compatibility wrapper around inviteUser)
  createUser: async (
    data: CreateAdminUserInput,
  ): Promise<{ user: AdminUser }> => {
    return fetchApi<{ user: AdminUser }>("/api/admin/users", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },


  // Update user
  updateUser: async (
    id: number,
    data: Partial<UpdateAdminUserInput>,
  ): Promise<{ user: AdminUser }> => {
    return fetchApi<{ user: AdminUser }>(`/api/admin/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  // Delete user
  deleteUser: async (id: number): Promise<void> => {
    return fetchApi<void>(`/api/admin/users/${id}`, {
      method: "DELETE",
    });
  },

  // Get user permissions
  getUserPermissions: async (id: number): Promise<UserPermissions> => {
    return fetchApi<UserPermissions>(`/api/admin/users/${id}/permissions`);
  },

  // Get all permissions
  getPermissions: async (): Promise<{ permissions: Permission[] }> => {
    return fetchApi<{ permissions: Permission[] }>("/api/admin/permissions");
  },

  // Get all roles with permissions
  getRoles: async (): Promise<{ roles: RolePermission[] }> => {
    return fetchApi<{ roles: RolePermission[] }>("/api/admin/roles");
  },

  // Assign permissions to role
  assignRolePermissions: async (
    role: string,
    permissionIds: number[],
  ): Promise<{ message: string; role: string; permission_count: number }> => {
    return fetchApi<{
      message: string;
      role: string;
      permission_count: number;
    }>(`/api/admin/roles/${role}/permissions`, {
      method: "POST",
      body: JSON.stringify({ permission_ids: permissionIds }),
    });
  },
};
