export const HUNT_TYPES = ["free_hunts", "retro", "waitlist"] as const;
export const PROJECT_STATUSES = [
  "watching",
  "in_progress",
  "running",
  "paused",
  "done",
  "dropped",
] as const;
export const PROJECT_PRIORITIES = ["high", "medium", "low"] as const;

export const ARCHIVE_REASONS = [
  "claimed",
  "dropped",
  "scam_risk",
  "expired",
  "not_worth",
  "duplicate",
  "completed",
  "other",
] as const;

export const STAGE_PRESETS = [
  "Not applicable",
  "Watching",
  "Registered",
  "Joined Discord",
  "Waiting result",
  "Accepted",
  "Whitelisted",
  "Not eligible",
  "Claimable",
  "Mint open",
] as const;

export const PROJECT_SORTS = ["updated", "name", "date", "priority", "status"] as const;
export const PROJECT_COLUMNS = [
  "status",
  "priority",
  "work",
  "type",
  "accounts",
  "completion",
  "date",
] as const;

export type HuntType = (typeof HUNT_TYPES)[number];
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];
export type ProjectPriority = (typeof PROJECT_PRIORITIES)[number];
export type ProjectSort = (typeof PROJECT_SORTS)[number];
export type ProjectColumn = (typeof PROJECT_COLUMNS)[number];

export type ProjectQueryState = {
  hunt: HuntType | "";
  query: string;
  status: ProjectStatus | "";
  stage: string;
  priority: ProjectPriority | "";
  account: string;
  dateFrom: string;
  dateTo: string;
  sort: ProjectSort;
  direction: "asc" | "desc";
  columns: ProjectColumn[];
  page: number;
  pageSize: number;
};

export type FilterableProject = {
  name: string;
  statusKey: ProjectStatus;
  priorityKey: ProjectPriority;
  huntKey: HuntType;
  stage: string;
  work: string[];
  type: string[];
  accounts: string[];
  dateValue?: string;
  updatedAt?: string;
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function enumValue<T extends readonly string[]>(
  value: string | undefined,
  values: T,
  fallback: T[number] | "",
) {
  return value && values.includes(value) ? (value as T[number]) : fallback;
}

export function normalizeStage(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

export function parseProjectQuery(
  source: Record<string, string | string[] | undefined> | URLSearchParams,
): ProjectQueryState {
  const get = (key: string) => source instanceof URLSearchParams
    ? source.get(key) ?? undefined
    : firstValue(source[key]);
  const columnsParam = get("columns");
  const rawColumns = columnsParam === "none" ? [] : columnsParam?.split(",") ?? [];
  const columns = rawColumns.filter((column): column is ProjectColumn =>
    PROJECT_COLUMNS.includes(column as ProjectColumn),
  );
  const page = Number.parseInt(get("page") ?? "1", 10);
  const pageSize = Number.parseInt(get("pageSize") ?? "10", 10);

  return {
    hunt: enumValue(get("hunt"), HUNT_TYPES, ""),
    query: get("q")?.trim() ?? "",
    status: enumValue(get("status"), PROJECT_STATUSES, ""),
    stage: get("stage")?.trim() ?? "",
    priority: enumValue(get("priority"), PROJECT_PRIORITIES, ""),
    account: get("account")?.trim() ?? "",
    dateFrom: get("dateFrom") ?? "",
    dateTo: get("dateTo") ?? "",
    sort: enumValue(get("sort"), PROJECT_SORTS, "updated") as ProjectSort,
    direction: get("direction") === "asc" ? "asc" : "desc",
    columns: columnsParam === undefined ? [...PROJECT_COLUMNS] : columns,
    page: Number.isFinite(page) && page > 0 ? page : 1,
    pageSize: [10, 25, 50].includes(pageSize) ? pageSize : 10,
  };
}

const priorityRank: Record<ProjectPriority, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

export function filterAndSortProjects<T extends FilterableProject>(
  projects: T[],
  state: ProjectQueryState,
) {
  const query = state.query.toLowerCase();
  const filtered = projects.filter((project) => {
    if (state.hunt && project.huntKey !== state.hunt) return false;
    if (state.status && project.statusKey !== state.status) return false;
    if (state.priority && project.priorityKey !== state.priority) return false;
    if (state.stage && normalizeStage(project.stage) !== normalizeStage(state.stage)) return false;
    if (state.account && !project.accounts.includes(state.account)) return false;
    if (state.dateFrom && (!project.dateValue || project.dateValue < state.dateFrom)) return false;
    if (state.dateTo && (!project.dateValue || project.dateValue > state.dateTo)) return false;
    if (!query) return true;

    return [
      project.name,
      project.stage,
      ...project.work,
      ...project.type,
      ...project.accounts,
    ].join(" ").toLowerCase().includes(query);
  });

  return filtered.sort((left, right) => {
    let comparison = 0;
    if (state.sort === "name") comparison = left.name.localeCompare(right.name);
    if (state.sort === "date") comparison = (left.dateValue ?? "").localeCompare(right.dateValue ?? "");
    if (state.sort === "priority") comparison = priorityRank[left.priorityKey] - priorityRank[right.priorityKey];
    if (state.sort === "status") comparison = left.statusKey.localeCompare(right.statusKey);
    if (state.sort === "updated") comparison = (left.updatedAt ?? "").localeCompare(right.updatedAt ?? "");
    return state.direction === "asc" ? comparison : -comparison;
  });
}
