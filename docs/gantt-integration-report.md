# Gantt Chart Integration Report

Analysis-only report for adding a Gantt chart view to the project task section.
No application code was modified for this report (this file only).

**Repos analysed**

- Frontend: `C:\wraptron\wraptron-next-app`
- Backend: `C:\wraptron\wraptron-deno-backend`
- Planned library: `gantt-task-react` (MIT)

---

## 1. Tech stack

### Frontend (`wraptron-next-app`)

| Item | Value | Evidence |
|------|--------|----------|
| Next.js | `^16.0.3` | `package.json` |
| Router | **App Router** (`src/app/...`) | e.g. `src/app/projects/[id]/page.tsx` |
| React | `^19.2.0` / `react-dom ^19.2.0` | `package.json` |
| Language | **TypeScript** (`typescript ^5`, `strict: true`) | `package.json`, `tsconfig.json` |
| Styling | **Tailwind CSS v4** + **shadcn/ui** (New York) + Radix | `tailwindcss ^4`, `components.json`, `src/components/ui/*` |
| State / data fetching | **No** React Query, SWR, Redux, or Zustand. Client `fetch` via `fetchApi` in `src/lib/api.ts`, plus local `useState` / `useEffect` / contexts | `src/lib/api.ts`, task pages |
| Server Actions | **not found** (`"use server"` not used for tasks) | search of `src/` |
| Auth | **Custom JWT** in `localStorage` (`auth_token`), org via `active_org_id` / `X-Organization-Id`. Session via `AuthProvider` → `authApi.getMe()` → `useAuth()` | `src/contexts/auth-context.tsx` |
| Date libraries | `date-fns ^4.1.0` installed; **no imports found under `src/`**. `react-day-picker` used by shadcn calendar. dayjs / moment / luxon: **not found** | `package.json`, grep of `src/` |

Auth access pattern:

```58:72:src/contexts/auth-context.tsx
  const checkAuth = async () => {
    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("auth_token")
          : null;

      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      const response = await authApi.getMe();
      setUser(response.user);
```

### Backend (`wraptron-deno-backend`)

| Item | Value |
|------|--------|
| Runtime | Deno (Oak-style routers under `routes/`) |
| Database | **PostgreSQL** via `jsr:@db/postgres` |
| ORM | **not found** — raw SQL (`query` / `queryOne` in `db/connection.ts`) |
| Deploy packaging | Wrangler / Cloudflare containers (`package.json`) |

---

## 2. Database and data model

### Database and schema management

- **DB:** PostgreSQL (Supabase or local Postgres).
- **ORM:** none — raw SQL.
- **Formal migrations** (`supabase/migrations/`): quotes / HSN / requirement-docs only. **No `CREATE TABLE tasks` migration found** in that folder today.
- Task DDL lives in ad-hoc scripts:
  - `wraptron-deno-backend/db/create-projects-table.ts` — base `tasks`
  - `wraptron-deno-backend/db/add-task-fields.ts` — `start_date`, `end_date`, priority, etc.
  - `wraptron-deno-backend/lib/task-create-fields.ts` — runtime `ALTER` for `approver_employee_id`

Base table:

```35:44:C:\wraptron\wraptron-deno-backend\db\create-projects-table.ts
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        assigned_employee_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
```

Added columns:

```7:16:C:\wraptron\wraptron-deno-backend\db\add-task-fields.ts
    await query(`
      ALTER TABLE tasks 
      ADD COLUMN IF NOT EXISTS start_date DATE,
      ADD COLUMN IF NOT EXISTS end_date DATE,
      ADD COLUMN IF NOT EXISTS approver_employee_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS priority VARCHAR(50) DEFAULT 'medium',
      ADD COLUMN IF NOT EXISTS complexity VARCHAR(50) DEFAULT 'medium',
      ADD COLUMN IF NOT EXISTS story_points INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS notes TEXT
    `);
```

### Full Task field inventory (evidenced in-repo)

| Field | Type | In DDL scripts? | Read by API? | Written by API? |
|-------|------|-----------------|--------------|-----------------|
| `id` | `SERIAL` / number | yes | yes | auto |
| `project_id` | `INTEGER` FK → `projects` | yes | yes | create |
| `assigned_employee_id` | `INTEGER` FK → `employees` | yes | yes | create/update |
| `title` | `VARCHAR(255)` | yes | yes | create/update |
| `description` | `TEXT` | yes | yes | create/update |
| `status` | `VARCHAR(50)` | yes | yes | create/update (via workflow) |
| `created_at` | `TIMESTAMPTZ` | yes | yes | auto |
| `updated_at` | `TIMESTAMPTZ` | yes | yes | auto |
| `start_date` | `DATE` | yes | **no** (omitted from selects) | **no** |
| `end_date` | `DATE` | yes | yes | create/update (`end_date` / `deadline` / `due_date`) |
| `approver_employee_id` | `INTEGER` FK → `employees` | yes / runtime | yes | create/update |
| `priority` | `VARCHAR(50)` | yes | yes | create/update |
| `complexity` | `VARCHAR(50)` | yes | **no** | **no** |
| `story_points` | `INTEGER` | yes | **no** | **no** |
| `notes` | `TEXT` | yes | yes (project routes) | yes (project routes) |
| `number` | integer (per-project) | **definition not found** | yes | auto on insert |
| `organization_id` | integer | **definition not found** | filter/scope | create |
| `branch_name` | text/null | **definition not found** | yes | take endpoint |
| `billable` | string | **definition not found** | yes (project routes) | yes |
| `estimate_hours` | number/null | **definition not found** | yes (project routes) | yes |
| `is_recurring` | boolean | **definition not found** | yes | yes |
| `recurrence_frequency` | string/null | **definition not found** | yes | yes |
| `recurrence_interval` | number/null | **definition not found** | yes | yes |
| `recurrence_anchor_date` | date string/null | **definition not found** | yes | yes |
| `recurrence_end_date` | date string/null | **definition not found** | yes | yes |

Project-route select (note **`start_date` missing**):

```68:68:C:\wraptron\wraptron-deno-backend\routes\projects.ts
const TASK_SELECT_COLUMNS = `id, project_id, assigned_employee_id, approver_employee_id, title, description, status, number, branch_name, end_date, priority, notes, billable, estimate_hours, is_recurring, recurrence_frequency, recurrence_interval, recurrence_anchor_date, recurrence_end_date, created_at, updated_at`;
```

Frontend `Task` type (expects `start_date`, but API currently does not return it):

```567:593:src/lib/api.ts
export interface Task {
  id: number;
  project_id: number;
  assigned_employee_id?: number | null;
  approver_employee_id?: number | null;
  approver_name?: string | null;
  title: string;
  description?: string;
  status: string;
  number?: number;
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
```

### Gantt capability checklist

| Need | Present? | Notes |
|------|----------|-------|
| Start date | Column exists; **API unused** | In `add-task-fields.ts`; not in `TASK_SELECT_COLUMNS` or body parsers |
| End / due date | **Yes** | `end_date`; aliases `deadline`, `due_date` |
| Progress / % | **not found** | No `progress` / `percent_complete` column or API field |
| Assignee | **Yes — single** | `assigned_employee_id` → `employees.id` |
| Multiple assignees | **not found** | Single FK only |
| Parent / subtask | **not found** | No `parent_task_id` |
| Dependencies | **not found** | No dependency table/field |

### Project and User relations

- `tasks.project_id` → `projects.id` (`ON DELETE CASCADE`).
- Assignee is an **Employee**, not a User: `assigned_employee_id` → `employees.id`.
- Employees link to users via `employees.user_id` (used by take-task, etc.).
- Approver is also a single employee: `approver_employee_id`.
- Auth identity: `users` table; session user is `User` (`id`, `email`, `first_name`, `last_name`, `role`).

**Assignee cardinality: single user (via one employee).**

### Fields MISSING for Gantt (and migration / wiring)

| Field | Status | Action needed |
|-------|--------|---------------|
| `start_date` | Column likely exists; **not read/written by APIs** | Wire into SELECT, INSERT, UPDATE (project + board routes). Prefer a real migration under `supabase/migrations/` rather than only ad-hoc scripts. |
| `end_date` | Ready | Reuse as Gantt `end`. |
| `progress` (0–100) | **Missing** | Add `progress INTEGER` (or `NUMERIC`) with check `0..100`, default `0`, if drag-to-change progress must persist. |
| `assignee_name` on project `Task` | **not on model** | Board API joins name as `assignee_name`; project nested tasks only return `assigned_employee_id`. Frontend already resolves names via `employeesApi.getAll` on the project page. |
| Parent / dependencies | **Missing** | Optional for v1; `gantt-task-react` supports `dependencies?: string[]` and project nesting, but your schema has no source. |

**Derivable (no new column required for a first MVP progress bar):**

- Map workflow category / status → approximate progress, e.g. `backlog=0`, `in_progress=33`, `review=66`, `done=100` using `task_statuses.category` / `lib/task-workflow.ts` categories.
- Existing project-level completion is binary done-count only (`src/lib/project-completion.ts` — status `done` / `completed`), **not** per-task continuous progress.
- Calendar view already falls back: missing `start_date` → `created_at`; missing `end_date` → start day (`TaskCalendarView` in project page). Same fallbacks can feed Gantt bars temporarily, but should not be persisted as real schedule dates without user intent.

---

## 3. Existing task section

### Pages and components (exact paths)

| Path | Role |
|------|------|
| `src/app/projects/[id]/page.tsx` | Project detail; **Tasks tab** with list / board / card / calendar (**best Gantt home**) |
| `src/app/tasks/page.tsx` | Org-wide board: list / card / kanban |
| `src/app/tasks/[key]/page.tsx` | Task detail by display key (`/tasks/ACME-12`) |
| `src/app/projects/[id]/tasks/[taskId]/page.tsx` | Legacy redirect → `/tasks/:display_key` |
| `src/app/projects/tasks/page.tsx` | Legacy redirect → `/tasks` |
| `src/app/workspace/tasks/page.tsx` | My assigned tasks |
| `src/app/sales/tasks/page.tsx` | CRM placeholder (“coming soon”) |
| `src/components/task-form-sheet.tsx` | Create-task sheet |
| `src/components/task-list-add-row.tsx` | Inline list add row |
| `src/components/task-change-history.tsx` | Change history |
| `src/components/collection-view.tsx` | Shared list/table |
| `src/components/collection-kanban-view.tsx` | Shared kanban |
| `src/components/collection-page-toolbar.tsx` | Global tasks view switcher |
| `src/components/project-task-completion.tsx` | Project completion % widget |
| `src/lib/task-table-columns.ts` | Shared column labels (includes unused `startDate` label) |
| `src/lib/filter-tasks-client-side.ts` | Client filters for org board |

List / board / card / calendar for a **single project** are **inline functions** inside `projects/[id]/page.tsx` (`TaskViewSwitcher`, `TaskListView`, `TaskBoard`, `TaskCardView`, `TaskCalendarView`) — not separate files today.

### View switching — where to add Gantt

Project Tasks tab:

```854:888:src/app/projects/[id]/page.tsx
type TaskViewMode = "list" | "board" | "card" | "calendar";

function TaskViewSwitcher({ ... }) {
  const [viewMode, setViewMode] = useState<TaskViewMode>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("tasks_view_mode");
      if (
        saved === "list" ||
        saved === "board" ||
        saved === "card" ||
        saved === "calendar"
      ) {
        return saved as TaskViewMode;
      }
    }
    return "board";
  });
```

- Modes persisted in **`localStorage` key `tasks_view_mode`** (not URL).
- **Plug-in point:** extend `TaskViewMode` with `"gantt"`, add a toolbar button next to List/Board/Card/Calendar, render beside the existing `{viewMode === "calendar" && ...}` block (~lines 948–978).

**Caution:** global `/tasks` also uses localStorage key `"tasks_view_mode"` via `useCollectionViewMode`, but allowed values are `"list" | "card" | "kanban"` only (`collection-page-toolbar.tsx`). Sharing the same key with a new `"gantt"` value can confuse the other page’s mode parser — prefer a distinct key (e.g. `project_tasks_view_mode`) or validate carefully on both surfaces.

### How tasks are fetched

**Project Tasks tab (recommended surface):**

- Client component page; `projectsApi.getById(projectId)` → `Project` with `tasks?: Task[]`.
- Passed as `tasks={project.tasks || []}` into `TaskViewSwitcher`.
- **Not** a Server Component data fetch; **not** a Next.js API proxy for tasks.

```483:487:src/app/projects/[id]/page.tsx
    const fetchProject = async () => {
      try {
        setLoading(true);
        const data = await projectsApi.getById(projectId);
        setProject(data);
```

**Response shape (project nested tasks):** array of `Task` as selected by `TASK_SELECT_COLUMNS` (currently **without** `start_date`, **without** `assignee_name`).

**Org `/tasks` board:**

- `tasksApi.board(filters)` → `{ data: BoardTask[] }`.
- `BoardTask` has `end_date`, `assignee_name`, **no `start_date`** in the frontend type or board SQL cast list (board select uses `t.end_date::text`).

### Pagination / filter / sort

| Surface | Pagination | Filtering | Sorting |
|---------|------------|-----------|---------|
| Project Tasks tab | **None** — full embedded list | Status columns / calendar day only | Board groups by status |
| `/tasks` | **None** | Server: `project_id`, `assigned_employee_id`. Client: search, overdue, unassigned, no deadline | Column `sortValue`s |
| Workspace my-tasks | **None** | Assigned-to-me | By `end_date`, then title |

Gantt will receive the **full in-memory project task list** already loaded — plan for large projects (virtualization / height limits) yourself; the API does not page tasks today.

---

## 4. API layer

### Endpoints

Mounted from backend `routes/index.ts`: `/api/tasks`, `/api/projects`, `/api/task-statuses`.

| Method | Path | Permission | Notes |
|--------|------|------------|-------|
| `GET` | `/api/tasks` | `tasks.read` | Board list |
| `GET` | `/api/tasks/:key` | `tasks.read` | Detail by display key |
| `POST` | `/api/tasks` | `tasks.create` | Create |
| `PATCH` | `/api/tasks/:id` | `tasks.update` | Update by id |
| `POST` | `/api/tasks/:id/take` | `tasks.update` | Assign self + branch |
| `DELETE` | `/api/tasks/:id` | `tasks.delete` | Delete |
| `GET` | `/api/projects/:id` | auth + project access | Nested `tasks` |
| `POST` | `/api/projects/:id/tasks` | `tasks.create` | Nested create |
| `PUT` | `/api/projects/:id/tasks/:taskId` | `tasks.update` | Nested update |
| `DELETE` | `/api/projects/:id/tasks/:taskId` | `tasks.delete` | Nested delete |

Frontend clients: `tasksApi.*` and `projectsApi.createTask` / `updateTask` / `deleteTask` in `src/lib/api.ts`.

### Does update accept startDate / endDate / progress?

| Field | `PUT /api/projects/:id/tasks/:taskId` | `PATCH /api/tasks/:id` | Frontend types |
|-------|----------------------------------------|-------------------------|----------------|
| `end_date` (aliases `deadline`, `due_date`) | **Yes** | **Yes** | Yes on both clients |
| `start_date` | **No** — not parsed | **No** — not parsed | On `Partial<Task>` for `projectsApi.updateTask` only (TS-level; backend ignores) |
| `progress` | **not found** | **not found** | **not found** |

Deadline parsing helper:

```3:4:C:\wraptron\wraptron-deno-backend\lib\task-create-fields.ts
export const TASK_DEADLINE_KEYS = ["end_date", "deadline", "due_date"] as const;
```

`projectsApi.updateTask` signature (sends `Partial<Task>` — includes `start_date` in TS, but backend PUT body handler never reads it):

```875:884:src/lib/api.ts
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
```

`tasksApi.update` typed payload — end date only, no start/progress:

```3048:3060:src/lib/api.ts
  update: async (
    id: number,
    data: {
      title?: string;
      description?: string | null;
      status?: string;
      assigned_employee_id?: number | null;
      approver_employee_id?: number | null;
      end_date?: string | null;
      deadline?: string | null;
      due_date?: string | null;
      priority?: string;
    },
```

### Validation and errors

- **Zod / Yup in task routes: not found** (zod may exist under `node_modules` but is not used by task/project route handlers).
- Manual checks + `pickOptionalDate` / `pickOptionalEmployeeId`.
- Errors: `ctx.response.status` + `{ error: "..." }` (400/401/403/404/409/500).
- Task deadline strings are **not ISO-validated** in task routes (unlike leave routes, which use `isIsoDate`).

### Permissions — who can edit dates / progress?

- Date updates gated by org permission **`tasks.update`** via `requirePermission` (`middleware/permissions.ts`). Owners / super-admins bypass.
- **No field-level** restriction on who may change deadlines.
- Default Staff role includes `tasks.read` / `create` / `update` (not delete) — see org role seeding in `routes/organizations.ts` (per backend survey).
- Status → **done** has extra approver rules in `transitionTask` (`lib/task-transitions.ts`).
- Progress: N/A until a progress field exists; if you map progress → status changes, approver rules may block “done”.

---

## 5. Compatibility risks

### Peer dependencies: `gantt-task-react` vs React 19 / Next 16

| Package | Your app | `gantt-task-react@0.3.9` |
|---------|----------|---------------------------|
| React | `^19.2.0` | peer: **`react ^18.0.0`** |
| Last publish | — | July 2022 (unmaintained relative to React 19) |

**Conflict:** npm peer range does **not** include React 19. Install will fail or warn unless forced.

**Mitigations (choose one):**

1. `npm install gantt-task-react --legacy-peer-deps` (community reports of runtime OK on React 19; still a peer-range risk).
2. Prefer React-19 fork: `@rsagiev/gantt-task-react-19` (peer `react ^19.0.0`, MIT fork of the same API) — verify API parity before committing.
3. Alternative libraries if peer/SSR issues become blockers: evaluate maintained forks or a lighter custom timeline on top of existing `@dnd-kit` (already in the app).

### SSR

- App Router + client task pages; library still needs DOM/window.
- Existing precedent:

```3:12:src/components/requirements/markdown-editor.tsx
import dynamic from "next/dynamic";
// ...
const MDEditor = dynamic(() => import("@uiw/react-md-editor"), {
  ssr: false,
  loading: () => (
    <div className="min-h-[320px] h-full rounded-md border bg-muted/40 animate-pulse" />
  ),
});
```

**Confirm:** load Gantt with `dynamic(() => import(...), { ssr: false })` (or a thin client-only wrapper). Also import `gantt-task-react/dist/index.css`.

### Date and timezone handling

| Aspect | Behavior |
|--------|----------|
| Storage | `start_date` / `end_date` are PostgreSQL **`DATE`** (no time-of-day) |
| Timestamps | `created_at` / `updated_at` are **`TIMESTAMPTZ`** |
| Serialization | Board/detail cast dates with `::text`; nested project tasks return driver JSON (typically ISO-like date strings) |
| Client display | Mostly `new Date(value).toLocaleDateString()` / `value.split("T")[0]` for form inputs |
| Timezone layer for tasks | **not found** |

**Risk:** parsing `"YYYY-MM-DD"` with `new Date(string)` uses UTC midnight in JS engines, which can shift the calendar day in negative-offset timezones. Prefer parsing as local date parts (or `date-fns` already installed) when mapping to `gantt-task-react`’s `Date` fields.

### Date library to reuse

- Prefer **`date-fns`** (already a dependency) for parse/format — currently unused in `src/`, so introducing it for Gantt is low-conflict.
- Do **not** add dayjs/moment unless you have a separate reason.

### Data edge cases (observed / implied)

| Case | Reality in this codebase |
|------|---------------------------|
| Null start | Common — column unused by API; calendar falls back to `created_at` |
| Null end | Supported; list shows “—”; calendar uses start day |
| End before start | Calendar clamps end to start; **API does not validate** task date order |
| Unassigned | `assigned_employee_id` null; list shows unassigned; board has `assignee_name: null` |
| Large task counts | No pagination — all tasks loaded into memory for the project |
| Assignee name on project tasks | Must join client-side via employees map (already done in list view) |

`gantt-task-react` `Task` requires non-null `start` / `end` `Date` and `progress: number` — you must supply defaults in the mapper for incomplete rows.

Library public shape (upstream):

```ts
// gantt-task-react Task (upstream public-types)
{
  id: string;
  type: "task" | "milestone" | "project";
  name: string;
  start: Date;
  end: Date;
  progress: number; // 0–100
  dependencies?: string[];
  project?: string;
  // ...
}
```

Callbacks for persistence: `onDateChange`, `onProgressChange` (return `false` / throw to undo).

---

## 6. Implementation plan

Ordered, file-by-file, matching existing kebab-case / `@/` conventions. Effort: **S** small, **M** medium, **L** large.

### A. Schema / API (backend) — do before UI drag-save

| Step | File(s) | Change | Effort |
|------|---------|--------|--------|
| 1 | `wraptron-deno-backend/supabase/migrations/<timestamp>_task_gantt_fields.sql` (create) | Ensure `start_date DATE`; add `progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100)` if persisting progress. Document that live DBs may already have `start_date` from `add-task-fields.ts`. | M |
| 2 | `wraptron-deno-backend/routes/projects.ts` | Add `start_date` (and `progress` if added) to `TASK_SELECT_COLUMNS`; parse/write on POST/PUT task handlers; optional join for assignee name. | M |
| 3 | `wraptron-deno-backend/routes/tasks.ts` | Include `start_date` / `progress` in board SELECT + PATCH updates + change-log if you audit date fields. | M |
| 4 | `wraptron-deno-backend/lib/task-create-fields.ts` | Add `TASK_START_DATE_KEYS` (e.g. `["start_date"]`) and reuse `pickOptionalDate`; optional progress picker with 0–100 clamp. | S |

### B. Frontend types / API client

| Step | File(s) | Change | Effort |
|------|---------|--------|--------|
| 5 | `src/lib/api.ts` | Add `start_date` / `progress` to `BoardTask`, `CreateTaskInput`, `tasksApi.update` payload; keep `Task` aligned. | S |

### C. Gantt UI (frontend)

| Step | File(s) | Change | Effort |
|------|---------|--------|--------|
| 6 | `npm` in next-app | Install library (see commands below). | S |
| 7 | `src/lib/map-task-to-gantt.ts` (create) | Map app `Task` + employee name → library `Task`; defaults for null dates/progress. | M |
| 8 | `src/components/project-gantt-view.tsx` (create) | Client Gantt: left list + timeline; wire `onDateChange` / `onProgressChange` → `projectsApi.updateTask`. | L |
| 9 | `src/components/project-gantt-view-loader.tsx` (create) | `dynamic(..., { ssr: false })` wrapper + loading skeleton (mirror markdown-editor). | S |
| 10 | `src/app/projects/[id]/page.tsx` | Extend `TaskViewMode` with `"gantt"`; toolbar button; render loader; decide localStorage key strategy. | M |
| 11 | Optional later: `src/app/tasks/page.tsx` + `collection-page-toolbar.tsx` | Org-wide Gantt only after board API returns `start_date`. | M |

### D. Data mapping (reference)

```ts
// Pseudocode for src/lib/map-task-to-gantt.ts
// Input: Task + optional assignee display name + optional status→progress map
// Output: gantt-task-react Task

function mapTaskToGanttTask(
  task: Task,
  assigneeName: string | null,
  opts?: { progressFromStatus?: number },
): GanttTask {
  const start = parseLocalDate(task.start_date) ?? parseLocalDate(task.created_at)!;
  let end = parseLocalDate(task.end_date) ?? start;
  if (end < start) end = start;
  const progress =
    typeof task.progress === "number"
      ? task.progress
      : (opts?.progressFromStatus ?? (isDone(task.status) ? 100 : 0));

  return {
    id: String(task.id),
    type: "task",
    name: task.title,
    start,
    end,
    progress,
    // Optional: encode assignee in custom TaskListTable, not in library Task
  };
}
```

Persist on drag:

- Dates → `projectsApi.updateTask(projectId, id, { start_date: "YYYY-MM-DD", end_date: "YYYY-MM-DD" })` **after** backend accepts `start_date`.
- Progress → same with `{ progress }` **after** column exists; or no-op / status-derived until then.

### E. npm install commands

From `wraptron-next-app`:

```bash
# Option A — official package (peer warning on React 19)
npm install gantt-task-react --legacy-peer-deps

# Option B — React 19 peer fork (verify API before adopting)
npm install @rsagiev/gantt-task-react-19
```

Import CSS once in the client wrapper:

```ts
import "gantt-task-react/dist/index.css";
// or the fork's equivalent CSS path
```

### F. Suggested effort totals

| Track | Effort |
|-------|--------|
| Backend start_date wiring only (derived progress) | ~1–2 days (M) |
| Backend + progress column + audit | +0.5–1 day (M) |
| Frontend Gantt view + save + SSR wrapper | ~2–3 days (L) |
| Org-wide Gantt + edge-case polish | +1–2 days (M–L) |

---

## 7. Testing checklist

### Manual tests

- [ ] Switch to Gantt from project Tasks tab; mode persists after refresh (localStorage).
- [ ] Empty project: empty state, no crash.
- [ ] Task with null `start_date` / null `end_date`: bar still renders via documented defaults; saving drag writes real dates.
- [ ] Unassigned task: name column empty / “Unassigned”; bar still editable.
- [ ] Drag bar (move): `start_date` + `end_date` persist; reload shows same range.
- [ ] Resize bar: end (and/or start) updates correctly; end ≥ start.
- [ ] Drag progress: value persists (if column exists) or reverts / stays derived (if not).
- [ ] Many tasks (50+): scroll, `ganttHeight`, performance acceptable.
- [ ] Timezones: user in US/India/UTC — calendar days on bars match chosen dates (no off-by-one).
- [ ] Permission: user without `tasks.update` cannot persist (UI disable or API 403 + undo).
- [ ] Concurrent edit: change date in list view, refresh Gantt (and reverse).
- [ ] Assignee display matches list view employee name resolution.

### Regression — what could break

- [ ] Existing list/board/card/calendar view switcher and `tasks_view_mode` localStorage (especially conflict with `/tasks` kanban modes).
- [ ] `projectsApi.updateTask` / board PATCH payloads — ensure new fields optional and do not clear `end_date` accidentally.
- [ ] Task change history / `task_changes` rows if you start logging `start_date` / `progress`.
- [ ] Status workflow / approver rules if progress mapping tries to auto-set status to done.
- [ ] Bundle / SSR build (`opennextjs-cloudflare`) if Gantt is accidentally imported without `ssr: false`.
- [ ] CSS leakage from `gantt-task-react/dist/index.css` into other pages (scope import to Gantt route/component).

---

## Blockers and open questions

1. **`start_date` is in the DB script but not in live API select/write paths.** Frontend types and calendar already assume it; until routes are wired, Gantt cannot persist start dates. Confirm production DB already has the column (script may not have been run everywhere).
2. **No `progress` field.** Decide: (a) add `progress` column, (b) derive from status/category only (read-only or status-changing bars), or (c) disable `onProgressChange` in v1.
3. **Library choice vs React 19:** stick with `gantt-task-react` + `--legacy-peer-deps`, switch to `@rsagiev/gantt-task-react-19`, or pick another library? Official package peer is React 18 only.
4. **Scope of Gantt:** project Tasks tab only (recommended) vs also org `/tasks` board (needs `start_date` on `BoardTask` / board SQL).
5. **localStorage key collision** between project view modes (`list|board|card|calendar`) and global tasks (`list|card|kanban`) both using `tasks_view_mode`.
6. **Assignee display:** keep client-side employee map (current project list pattern) vs add SQL join `assignee_name` on nested project tasks.
7. **Dependencies / subtasks:** not in schema — confirm out of scope for v1 (`gantt-task-react` arrows would be unused).
8. **Date validation:** API does not reject end &lt; start or non-ISO strings for tasks — decide whether to add server-side checks with Gantt writes.
9. **Formal migration vs ad-hoc scripts:** task DDL is fragmented; prefer a proper `supabase/migrations` entry so environments stay consistent. Exact live column set for `number`, `organization_id`, recurrence fields, etc. is **partially not found** in-repo (used by code; CREATE not found).
10. **Whether drag should create change-history rows** for `start_date` / `progress` (board already logs `end_date` changes in PATCH).

---

*Generated from codebase analysis. Items marked **not found** were not located in the repositories searched; do not treat them as present without further verification.*
