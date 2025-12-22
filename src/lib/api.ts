const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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
}

export interface UpdateCustomerInput extends Partial<CreateCustomerInput> {
  id: number;
}

export interface CustomersResponse {
  data: Customer[];
  total: number;
  limit: number;
  offset: number;
}

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
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

async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getAuthToken();
  
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string> | undefined),
  };
  
  // Add auth token if available
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  
  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    // If unauthorized, clear token and redirect to login
    if (response.status === 401) {
      setAuthToken(null);
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login") && !window.location.pathname.startsWith("/signup")) {
        window.location.href = "/login";
      }
    }
    
    const errorData = (await response.json().catch(() => ({}))) as {
      error?: string;
      message?: string;
      [key: string]: unknown;
    };
    throw new ApiError(
      errorData.error || errorData.message || "An error occurred",
      response.status,
      errorData,
    );
  }

  if (response.status === 204) {
    return null as T;
  }

  return response.json();
}

export const customersApi = {
  // Get all customers with optional filters
  getAll: async (params?: {
    search?: string;
    state?: string;
    limit?: number;
    offset?: number;
  }): Promise<CustomersResponse> => {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.append("search", params.search);
    if (params?.state) searchParams.append("state", params.state);
    if (params?.limit) searchParams.append("limit", params.limit.toString());
    if (params?.offset) searchParams.append("offset", params.offset.toString());

    const query = searchParams.toString();
    return fetchApi<CustomersResponse>(
      `/api/customers${query ? `?${query}` : ""}`,
    );
  },

  // Get single customer by ID
  getById: async (id: number): Promise<Customer> => {
    return fetchApi<Customer>(`/api/customers/${id}`);
  },

  // Create new customer
  create: async (data: CreateCustomerInput): Promise<Customer> => {
    return fetchApi<Customer>("/api/customers", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // Update customer
  update: async (
    id: number,
    data: Partial<CreateCustomerInput>,
  ): Promise<Customer> => {
    return fetchApi<Customer>(`/api/customers/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  // Delete customer
  delete: async (id: number): Promise<void> => {
    return fetchApi<void>(`/api/customers/${id}`, {
      method: "DELETE",
    });
  },
};

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
}

export interface UpdateProductInput extends Partial<CreateProductInput> {
  id: number;
}

export interface ProductsResponse {
  data: Product[];
  total: number;
  limit: number;
  offset: number;
}

export const productsApi = {
  // Get all products with optional filters
  getAll: async (params?: {
    search?: string;
    status?: string;
    materialType?: string;
    limit?: number;
    offset?: number;
  }): Promise<ProductsResponse> => {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.append("search", params.search);
    if (params?.status) searchParams.append("status", params.status);
    if (params?.materialType) {
      searchParams.append("materialType", params.materialType);
    }
    if (params?.limit) searchParams.append("limit", params.limit.toString());
    if (params?.offset) searchParams.append("offset", params.offset.toString());

    const query = searchParams.toString();
    return fetchApi<ProductsResponse>(
      `/api/products${query ? `?${query}` : ""}`,
    );
  },

  // Get single product by ID
  getById: async (id: number): Promise<Product> => {
    return fetchApi<Product>(`/api/products/${id}`);
  },

  // Create new product
  create: async (data: CreateProductInput): Promise<Product> => {
    return fetchApi<Product>("/api/products", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // Update product
  update: async (
    id: number,
    data: Partial<CreateProductInput>,
  ): Promise<Product> => {
    return fetchApi<Product>(`/api/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  // Delete product
  delete: async (id: number): Promise<void> => {
    return fetchApi<void>(`/api/products/${id}`, {
      method: "DELETE",
    });
  },
};

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
  employment_type?:
    | "full_time"
    | "part_time"
    | "contract"
    | "intern"
    | "temporary";
  employment_status?:
    | "active"
    | "inactive"
    | "on_leave"
    | "terminated"
    | "resigned";
  skill_set?: Record<string, unknown>;
  join_date?: string;
  exit_date?: string;
  reporting_manager_id?: number;
  date_of_birth?: string;
  gender?: string;
  marital_status?: string;
  aadhar_number?: string;
  pan?: string;
  bloodgroup?: string;
  qualification?: string;
  education?: string;
  e_contact?: string;
  department?: string;
  designation?: string;
  experience?: string;
  location?: string;
  permanent_address?: string;
  present_address?: string;
  created_at: string;
  updated_at: string;
  manager_first_name?: string;
  manager_last_name?: string;
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
  employment_type?:
    | "full_time"
    | "part_time"
    | "contract"
    | "intern"
    | "temporary";
  employment_status?:
    | "active"
    | "inactive"
    | "on_leave"
    | "terminated"
    | "resigned";
  skill_set?: Record<string, unknown>;
  join_date?: string;
  exit_date?: string;
  reporting_manager_id?: number;
  date_of_birth?: string;
  gender?: string;
  marital_status?: string;
  aadhar_number?: string;
  pan?: string;
  bloodgroup?: string;
  qualification?: string;
  education?: string;
  e_contact?: string;
  department?: string;
  designation?: string;
  experience?: string;
  location?: string;
  permanent_address?: string;
  present_address?: string;
}

export interface UpdateEmployeeInput extends Partial<CreateEmployeeInput> {
  id: number;
}

export interface EmployeesResponse {
  data: Employee[];
  total: number;
  limit: number;
  offset: number;
}

export const employeesApi = {
  // Get all employees with optional filters
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

  // Get single employee by ID
  getById: async (id: number): Promise<Employee> => {
    return fetchApi<Employee>(`/api/employees/${id}`);
  },

  // Create new employee
  create: async (data: CreateEmployeeInput): Promise<Employee> => {
    return fetchApi<Employee>("/api/employees", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // Update employee
  update: async (
    id: number,
    data: Partial<CreateEmployeeInput>,
  ): Promise<Employee> => {
    return fetchApi<Employee>(`/api/employees/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  // Delete employee
  delete: async (id: number): Promise<void> => {
    return fetchApi<void>(`/api/employees/${id}`, {
      method: "DELETE",
    });
  },
};

// Authentication types and API
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
  role?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

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

// Projects types and API
export interface Task {
  id: number;
  project_id: number;
  title: string;
  description?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: number;
  project_name: string;
  services_offered: string[];
  start_date?: string;
  target_date?: string;
  target_audience?: string;
  functional_requirements?: string;
  non_functional_requirements?: string;
  status: string;
  created_at: string;
  updated_at: string;
  tasks?: Task[];
}

export interface CreateProjectInput {
  project_name: string;
  services_offered?: string[];
  start_date?: string;
  target_date?: string;
  target_audience?: string;
  functional_requirements?: string;
  non_functional_requirements?: string;
  status?: string;
  tasks?: Array<{
    title: string;
    description?: string;
    status?: string;
  }>;
}

export interface UpdateProjectInput extends Partial<CreateProjectInput> {
  id: number;
}

export interface ProjectsResponse {
  data: Project[];
  total: number;
  limit: number;
  offset: number;
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
};

// AI Chat types and API
export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ChatRequest {
  message: string;
  conversationHistory?: ChatMessage[];
}

export interface ChatResponse {
  message: string;
  model: string;
}

export interface ModelsResponse {
  models: Array<{
    name: string;
    modified_at: string;
    size: number;
  }>;
}

export const aiChatApi = {
  chat: async (data: ChatRequest): Promise<ChatResponse> => {
    return fetchApi<ChatResponse>("/api/ai/chat", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  getModels: async (): Promise<ModelsResponse> => {
    return fetchApi<ModelsResponse>("/api/ai/models");
  },
};

