import type { CollectionFacetOption } from "@/components/collection-filters";

export type CollectionFilterResource =
  | "deals"
  | "contacts"
  | "companies"
  | "products"
  | "invoices"
  | "bills"
  | "customers"
  | "activities"
  | "tasks";

export type CollectionFilterFieldType =
  | "enum"
  | "boolean"
  | "number"
  | "date";

export type NumberRangeValue = {
  min?: string;
  max?: string;
};

export type DateRangeValue = {
  from?: string;
  to?: string;
};

export type CollectionFilterState = {
  search: string;
  facets: Record<string, string[]>;
  numbers: Record<string, NumberRangeValue>;
  dates: Record<string, DateRangeValue>;
};

export type CollectionFilterDefinition = {
  id: string;
  label: string;
  /** URL + API query parameter name */
  param: string;
  type: CollectionFilterFieldType;
  /** Shown as quick-access buttons (keep small — e.g. 3–4) */
  pinned?: boolean;
  /** Static options; omit to load distinct values from the API */
  options?: CollectionFacetOption[];
};

export function emptyCollectionFilterState(): CollectionFilterState {
  return { search: "", facets: {}, numbers: {}, dates: {} };
}

function def(
  id: string,
  label: string,
  opts?: Partial<CollectionFilterDefinition>,
): CollectionFilterDefinition {
  return {
    id,
    label,
    param: id,
    type: "enum",
    ...opts,
  };
}

function bool(
  id: string,
  label: string,
  opts?: Partial<CollectionFilterDefinition>,
): CollectionFilterDefinition {
  return {
    id,
    label,
    param: id,
    type: "boolean",
    options: [
      { value: "true", label: "Yes" },
      { value: "false", label: "No" },
    ],
    ...opts,
  };
}

function num(
  id: string,
  label: string,
  opts?: Partial<CollectionFilterDefinition>,
): CollectionFilterDefinition {
  return {
    id,
    label,
    param: id,
    type: "number",
    ...opts,
  };
}

function date(
  id: string,
  label: string,
  opts?: Partial<CollectionFilterDefinition>,
): CollectionFilterDefinition {
  return {
    id,
    label,
    param: id,
    type: "date",
    ...opts,
  };
}

export const COLLECTION_FILTER_DEFINITIONS: Record<
  CollectionFilterResource,
  CollectionFilterDefinition[]
> = {
  deals: [
    def("stage", "Stage", { pinned: true }),
    def("status", "Status", { pinned: true }),
    def("currency", "Currency"),
    def("source", "Source"),
    num("value", "Deal value"),
    num("probability", "Probability"),
    date("expected_close_date", "Expected close"),
    date("actual_close_date", "Actual close"),
  ],
  contacts: [
    def("status", "Status", { pinned: true }),
    bool("is_primary", "Primary contact", { pinned: true }),
    def("preferred_contact_method", "Preferred method"),
    def("prefix", "Prefix"),
    def("department", "Department"),
    def("job_title", "Job title"),
    def("city", "City"),
    def("state", "State"),
    def("country", "Country"),
  ],
  companies: [
    def("status", "Status", { pinned: true }),
    def("industry", "Industry", { pinned: true }),
    def("company_size", "Company size"),
    def("city", "City"),
    def("state", "State"),
    def("country", "Country"),
    num("annual_revenue", "Annual revenue"),
  ],
  products: [
    def("status", "Status", { pinned: true }),
    def("raw_material_type", "Material type", { pinned: true }),
    def("packaging_type", "Packaging type", { pinned: true }),
    def("material_grade", "Material grade"),
    def("material_supplier", "Material supplier"),
    def("material_color", "Material color"),
    def("uv_fire_rating", "UV / fire rating"),
    def("mfi", "MFI"),
    def("quality_inspection_plan", "Quality inspection plan"),
    def("control_plan", "Control plan"),
    def("mould_number", "Mould number"),
    def("cavity_details", "Cavity details"),
    def("machine_tonnage", "Machine tonnage"),
    def("cooling_requirement", "Cooling requirement"),
    def("uom", "UOM"),
    def("storage_location", "Storage location"),
    def("bin_warehouse", "Bin / warehouse"),
    def("sku_code", "SKU code"),
    def("lot_batch_traceability_rules", "Lot / batch rules"),
    def("serialisation_rules", "Serialisation rules"),
    def("ppap_level", "PPAP level"),
    def("apqp_phase", "APQP phase"),
    def("imds_submission_id", "IMDS submission"),
    def("vendor_code", "Vendor code"),
    def("customer_standards", "Customer standards"),
    def("pdi_checklist", "PDI checklist"),
    def("customer_packaging_specs", "Packaging specs"),
    def("customer_dispatch_requirements", "Dispatch requirements"),
    def("barcode_specs", "Barcode specs"),
    num("cycle_time", "Cycle time"),
    num("rm_cost", "RM cost"),
    num("cost_per_hour", "Cost per hour"),
  ],
  invoices: [
    def("status", "Status", { pinned: true }),
    def("payment_terms", "Payment terms", { pinned: true }),
    def("place_of_supply", "Place of supply"),
    date("invoice_date", "Invoice date"),
    date("due_date", "Due date"),
    num("total", "Total"),
    num("subtotal", "Subtotal"),
    num("balance_due", "Balance due"),
  ],
  bills: [
    def("status", "Status", { pinned: true }),
    def("payment_terms", "Payment terms", { pinned: true }),
    def("place_of_supply", "Place of supply"),
    date("bill_date", "Bill date"),
    date("due_date", "Due date"),
    num("total", "Total"),
    num("subtotal", "Subtotal"),
    num("balance_due", "Balance due"),
  ],
  customers: [
    def("gst_registration_type", "GST registration", { pinned: true }),
    def("signup_type", "Signup type", { pinned: true }),
    bool("customer_type", "Customer type"),
    bool("isgroup", "Group account"),
    bool("portal_access", "Portal access"),
    def("country", "Country"),
    def("billing_address_city", "Billing city"),
  ],
  activities: [
    def("type", "Type", { pinned: true }),
    def("status", "Status", { pinned: true }),
    def("outcome", "Outcome"),
    date("activity_date", "Activity date"),
    date("due_date", "Due date"),
    num("duration_minutes", "Duration (min)"),
  ],
  tasks: [
    def("status", "Status", {
      pinned: true,
      options: [
        { value: "pending", label: "Todo" },
        { value: "in_progress", label: "In progress" },
        { value: "done", label: "Done" },
        { value: "blocked", label: "Blocked" },
      ],
    }),
    def("project_id", "Project", { pinned: true }),
    def("assigned_employee_id", "Assignee", { pinned: true }),
    def("priority", "Priority", {
      pinned: true,
      options: [
        { value: "low", label: "Low" },
        { value: "medium", label: "Medium" },
        { value: "high", label: "High" },
        { value: "critical", label: "Critical" },
      ],
    }),
    bool("is_recurring", "Recurring"),
    bool("overdue", "Overdue"),
    def("billable", "Billable", {
      options: [
        { value: "billable", label: "Billable" },
        { value: "non_billable", label: "Non billable" },
      ],
    }),
    date("end_date", "Deadline"),
  ],
};

export function getCollectionFilterDefinitions(
  resource: CollectionFilterResource,
): CollectionFilterDefinition[] {
  return COLLECTION_FILTER_DEFINITIONS[resource];
}

export function withFilterOptions(
  definitions: CollectionFilterDefinition[],
  overrides: Record<string, CollectionFacetOption[]>,
): CollectionFilterDefinition[] {
  return definitions.map((definition) => ({
    ...definition,
    options: overrides[definition.id] ?? definition.options,
  }));
}

export type CollectionApiParams = Record<string, string>;

function isNumberRangeActive(range?: NumberRangeValue): boolean {
  return Boolean(range?.min?.trim() || range?.max?.trim());
}

function isDateRangeActive(range?: DateRangeValue): boolean {
  return Boolean(range?.from?.trim() || range?.to?.trim());
}

export function buildCollectionApiParams(
  definitions: CollectionFilterDefinition[],
  search: string,
  facets: Record<string, string[]>,
  numbers: Record<string, NumberRangeValue> = {},
  dates: Record<string, DateRangeValue> = {},
): CollectionApiParams {
  const params: CollectionApiParams = {};
  const q = search.trim();
  if (q) params.search = q;

  for (const definition of definitions) {
    if (definition.type === "number") {
      const range = numbers[definition.id];
      if (!isNumberRangeActive(range)) continue;
      if (range?.min?.trim()) params[`${definition.param}_min`] = range.min.trim();
      if (range?.max?.trim()) params[`${definition.param}_max`] = range.max.trim();
      continue;
    }

    if (definition.type === "date") {
      const range = dates[definition.id];
      if (!isDateRangeActive(range)) continue;
      if (range?.from?.trim()) {
        params[`${definition.param}_from`] = range.from.trim();
      }
      if (range?.to?.trim()) params[`${definition.param}_to`] = range.to.trim();
      continue;
    }

    const values = facets[definition.id];
    if (!values?.length) continue;
    if (definition.type === "boolean") {
      params[definition.param] = values[0];
      continue;
    }
    params[definition.param] = values.join(",");
  }

  return params;
}

export function parseCollectionFiltersFromUrl(
  definitions: CollectionFilterDefinition[],
  searchParams: URLSearchParams,
): CollectionFilterState {
  const search = searchParams.get("search") ?? "";
  const facets: Record<string, string[]> = {};
  const numbers: Record<string, NumberRangeValue> = {};
  const dates: Record<string, DateRangeValue> = {};

  for (const definition of definitions) {
    if (definition.type === "number") {
      const min = searchParams.get(`${definition.param}_min`) ?? undefined;
      const max = searchParams.get(`${definition.param}_max`) ?? undefined;
      if (min?.trim() || max?.trim()) {
        numbers[definition.id] = { min: min?.trim(), max: max?.trim() };
      }
      continue;
    }

    if (definition.type === "date") {
      const from = searchParams.get(`${definition.param}_from`) ?? undefined;
      const to = searchParams.get(`${definition.param}_to`) ?? undefined;
      if (from?.trim() || to?.trim()) {
        dates[definition.id] = { from: from?.trim(), to: to?.trim() };
      }
      continue;
    }

    const raw = searchParams.get(definition.param);
    if (!raw?.trim()) continue;
    facets[definition.id] = raw
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);
  }

  return { search, facets, numbers, dates };
}

export function buildCollectionFilterUrlParams(
  definitions: CollectionFilterDefinition[],
  state: CollectionFilterState,
): URLSearchParams;
export function buildCollectionFilterUrlParams(
  definitions: CollectionFilterDefinition[],
  search: string,
  facets: Record<string, string[]>,
  numbers?: Record<string, NumberRangeValue>,
  dates?: Record<string, DateRangeValue>,
): URLSearchParams;
export function buildCollectionFilterUrlParams(
  definitions: CollectionFilterDefinition[],
  searchOrState: string | CollectionFilterState,
  facets: Record<string, string[]> = {},
  numbers: Record<string, NumberRangeValue> = {},
  dates: Record<string, DateRangeValue> = {},
): URLSearchParams {
  const state: CollectionFilterState =
    typeof searchOrState === "string"
      ? { search: searchOrState, facets, numbers, dates }
      : searchOrState;

  const params = new URLSearchParams();
  const q = state.search.trim();
  if (q) params.set("search", q);

  for (const definition of definitions) {
    if (definition.type === "number") {
      const range = state.numbers[definition.id];
      if (!isNumberRangeActive(range)) continue;
      if (range?.min?.trim()) {
        params.set(`${definition.param}_min`, range.min.trim());
      }
      if (range?.max?.trim()) {
        params.set(`${definition.param}_max`, range.max.trim());
      }
      continue;
    }

    if (definition.type === "date") {
      const range = state.dates[definition.id];
      if (!isDateRangeActive(range)) continue;
      if (range?.from?.trim()) {
        params.set(`${definition.param}_from`, range.from.trim());
      }
      if (range?.to?.trim()) {
        params.set(`${definition.param}_to`, range.to.trim());
      }
      continue;
    }

    const values = state.facets[definition.id];
    if (!values?.length) continue;
    params.set(definition.param, values.join(","));
  }

  return params;
}

export function getFilterParamNames(
  definitions: CollectionFilterDefinition[],
): string[] {
  const names = ["search"];
  for (const definition of definitions) {
    if (definition.type === "number") {
      names.push(`${definition.param}_min`, `${definition.param}_max`);
      continue;
    }
    if (definition.type === "date") {
      names.push(`${definition.param}_from`, `${definition.param}_to`);
      continue;
    }
    names.push(definition.param);
  }
  return names;
}

export function facetsEqual(
  a: Record<string, string[]>,
  b: Record<string, string[]>,
): boolean {
  const keysA = Object.keys(a).sort();
  const keysB = Object.keys(b).sort();
  if (keysA.length !== keysB.length) return false;
  return keysA.every((key) => {
    const left = a[key] ?? [];
    const right = b[key] ?? [];
    return (
      left.length === right.length &&
      left.every((value, index) => value === right[index])
    );
  });
}

function numberRangesEqual(
  a: Record<string, NumberRangeValue>,
  b: Record<string, NumberRangeValue>,
): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of keys) {
    const left = a[key] ?? {};
    const right = b[key] ?? {};
    if ((left.min ?? "") !== (right.min ?? "")) return false;
    if ((left.max ?? "") !== (right.max ?? "")) return false;
  }
  return true;
}

function dateRangesEqual(
  a: Record<string, DateRangeValue>,
  b: Record<string, DateRangeValue>,
): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of keys) {
    const left = a[key] ?? {};
    const right = b[key] ?? {};
    if ((left.from ?? "") !== (right.from ?? "")) return false;
    if ((left.to ?? "") !== (right.to ?? "")) return false;
  }
  return true;
}

export function filterStateEqual(
  a: CollectionFilterState,
  b: CollectionFilterState,
): boolean {
  return (
    a.search === b.search &&
    facetsEqual(a.facets, b.facets) &&
    numberRangesEqual(a.numbers, b.numbers) &&
    dateRangesEqual(a.dates, b.dates)
  );
}

export function serializeCollectionApiParams(
  params: CollectionApiParams,
): string {
  const keys = Object.keys(params).sort();
  const normalized = new URLSearchParams();
  for (const key of keys) {
    const value = params[key];
    if (value) normalized.set(key, value);
  }
  return normalized.toString();
}

/** Read only filter-related params from the current URL. */
export function readFilterQueryFromUrl(
  definitions: CollectionFilterDefinition[],
  searchParams: URLSearchParams,
): string {
  const params = new URLSearchParams();
  for (const name of getFilterParamNames(definitions)) {
    const value = searchParams.get(name);
    if (value) params.set(name, value);
  }
  return params.toString();
}

export function mergeFilterParamsIntoSearchParams(
  definitions: CollectionFilterDefinition[],
  current: URLSearchParams,
  filterParams: URLSearchParams,
): URLSearchParams {
  const next = new URLSearchParams(current.toString());
  for (const param of getFilterParamNames(definitions)) {
    next.delete(param);
  }
  for (const [key, value] of filterParams.entries()) {
    next.set(key, value);
  }
  return next;
}

export function toSavedViewFilterState(
  state: CollectionFilterState,
): CollectionFilterState {
  const next = emptyCollectionFilterState();
  if (state.search.trim()) next.search = state.search.trim();

  for (const [key, values] of Object.entries(state.facets)) {
    if (values.length > 0) next.facets[key] = values;
  }

  for (const [key, range] of Object.entries(state.numbers)) {
    if (isNumberRangeActive(range)) next.numbers[key] = { ...range };
  }

  for (const [key, range] of Object.entries(state.dates)) {
    if (isDateRangeActive(range)) next.dates[key] = { ...range };
  }

  return next;
}
