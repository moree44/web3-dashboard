import { describe, expect, it } from "vitest";

import {
  filterAndSortProjects,
  isWatchlistProject,
  parseProjectQuery,
  type FilterableProject,
  type ProjectQueryState,
} from "@/features/projects/project-query";

function project(overrides: Partial<FilterableProject> = {}): FilterableProject {
  return {
    name: "Soundness",
    statusKey: "in_progress",
    priorityKey: "high",
    huntKey: "free_hunts",
    stage: "Accepted",
    work: ["Testnet", "Proof submit"],
    type: ["ZK"],
    accounts: ["Moree"],
    dateValue: "2026-07-24",
    updatedAt: "2026-07-24T08:00:00.000Z",
    ...overrides,
  };
}

function state(overrides: Partial<ProjectQueryState> = {}): ProjectQueryState {
  return {
    view: "all",
    hunt: "",
    query: "",
    status: "",
    stage: "",
    priority: "",
    account: "",
    dateFrom: "",
    dateTo: "",
    sort: "updated",
    direction: "desc",
    columns: ["status", "priority", "work", "type", "accounts", "completion", "date"],
    page: 1,
    pageSize: 10,
    ...overrides,
  };
}

describe("project URL query state", () => {
  it("parses supported filters, sorting, columns, and pagination", () => {
    const parsed = parseProjectQuery(new URLSearchParams({
      view: "watchlist",
      hunt: "nft",
      q: "mint",
      status: "watching",
      stage: "Joined whitelist",
      priority: "high",
      account: "Moree",
      dateFrom: "2026-07-01",
      dateTo: "2026-07-31",
      sort: "priority",
      direction: "asc",
      columns: "status,work,accounts",
      page: "2",
      pageSize: "25",
    }));

    expect(parsed).toMatchObject({
      view: "watchlist",
      hunt: "nft",
      query: "mint",
      status: "watching",
      stage: "Joined whitelist",
      priority: "high",
      account: "Moree",
      dateFrom: "2026-07-01",
      dateTo: "2026-07-31",
      sort: "priority",
      direction: "asc",
      columns: ["status", "work", "accounts"],
      page: 2,
      pageSize: 25,
    });
  });

  it("rejects unsupported values and keeps safe defaults", () => {
    const parsed = parseProjectQuery(new URLSearchParams({
      hunt: "trading",
      status: "recheck",
      priority: "urgent",
      sort: "random",
      columns: "unknown",
      page: "-2",
      pageSize: "999",
    }));

    expect(parsed.hunt).toBe("");
    expect(parsed.status).toBe("");
    expect(parsed.priority).toBe("");
    expect(parsed.sort).toBe("updated");
    expect(parsed.columns).toEqual([]);
    expect(parsed.page).toBe(1);
    expect(parsed.pageSize).toBe(10);
  });

  it("supports intentionally hiding every optional column", () => {
    expect(parseProjectQuery(new URLSearchParams({ columns: "none" })).columns).toEqual([]);
  });
});

describe("project watchlist rules", () => {
  it.each(["Watching", "Registered", "Joined Discord", "Waiting result"])(
    "includes pending stage %s",
    (stage) => expect(isWatchlistProject(project({ stage }))).toBe(true),
  );

  it("includes watching status regardless of stage", () => {
    expect(isWatchlistProject(project({ statusKey: "watching", stage: "Accepted" }))).toBe(true);
  });

  it.each(["Accepted", "Whitelisted", "Claimable", "Mint open"])(
    "excludes progressed stage %s when status is active",
    (stage) => expect(isWatchlistProject(project({ statusKey: "in_progress", stage }))).toBe(false),
  );
});

describe("project filtering and sorting", () => {
  const records = [
    project(),
    project({
      name: "Dawn",
      statusKey: "watching",
      priorityKey: "medium",
      huntKey: "nft",
      stage: "Joined whitelist",
      work: ["Whitelist"],
      type: ["DePIN"],
      accounts: ["Wdym"],
      dateValue: "2026-07-10",
      updatedAt: "2026-07-20T08:00:00.000Z",
    }),
    project({
      name: "NexusHQ",
      statusKey: "running",
      priorityKey: "low",
      stage: "Node running",
      work: ["Node", "CLI running"],
      type: ["Prover"],
      accounts: ["Moree"],
      dateValue: "2026-06-20",
      updatedAt: "2026-07-22T08:00:00.000Z",
    }),
  ];

  it("combines hunt, status, priority, stage, account, date, and search filters", () => {
    const result = filterAndSortProjects([...records], state({
      hunt: "nft",
      status: "watching",
      priority: "medium",
      stage: "Joined whitelist",
      account: "Wdym",
      dateFrom: "2026-07-01",
      dateTo: "2026-07-31",
      query: "depin",
    }));
    expect(result.map((item) => item.name)).toEqual(["Dawn"]);
  });

  it("applies the watchlist view independently of hunt type", () => {
    const result = filterAndSortProjects([...records], state({ view: "watchlist" }));
    expect(result.map((item) => item.name)).toEqual(["Dawn"]);
  });

  it("sorts priority and name in either direction", () => {
    expect(filterAndSortProjects([...records], state({ sort: "priority", direction: "desc" })).map((item) => item.priorityKey)).toEqual(["high", "medium", "low"]);
    expect(filterAndSortProjects([...records], state({ sort: "name", direction: "asc" })).map((item) => item.name)).toEqual(["Dawn", "NexusHQ", "Soundness"]);
  });
});
