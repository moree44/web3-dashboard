import { describe, expect, it } from "vitest";

import { filterTasks } from "@/features/tasks/task-query";
import { mergePersonalItemCreate } from "@/features/tasks/personal-items-cache";
import { taskPreviewData } from "@/features/tasks/preview-data";
import type { PersonalItemRecord } from "@/features/personal/types";
import type { TaskWorkspaceData } from "@/features/tasks/task-types";

const emptyFilters = {
  query: "",
  projectId: "",
  accountId: "",
  status: "",
  frequency: "",
  priority: "",
};

describe("filterTasks", () => {
  it("filters account assignment using effective project fallback accounts", () => {
    const wdym = taskPreviewData.accounts[1];
    const result = filterTasks(taskPreviewData.tasks, { ...emptyFilters, accountId: wdym.id, frequency: "daily" });

    expect(result.map((task) => task.title)).toEqual(["Daily dashboard check-in"]);
    expect(result[0].usesProjectAccountFallback).toBe(true);
  });

  it("combines search with persisted status, frequency, and priority filters", () => {
    const result = filterTasks(taskPreviewData.tasks, {
      ...emptyFilters,
      query: "soundness",
      status: "todo",
      frequency: "once",
      priority: "high",
    });

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("Submit proof after address generated");
  });
});

describe("mergePersonalItemCreate", () => {
  const base: TaskWorkspaceData = {
    ...taskPreviewData,
    personalItems: [],
  };

  it("replaces the matching optimistic placeholder instead of duplicating", () => {
    const optimistic: PersonalItemRecord = {
      id: "optimistic-personal-temp-1",
      title: "Buy gas",
      frequency: "once",
      status: "todo",
      note: null,
      createdAt: null,
      updatedAt: null,
    };
    const server: PersonalItemRecord = {
      id: "11111111-1111-1111-1111-111111111111",
      title: "Buy gas",
      frequency: "once",
      status: "todo",
      note: null,
      createdAt: "2026-08-08T00:00:00.000Z",
      updatedAt: "2026-08-08T00:00:00.000Z",
    };
    const withOptimistic: TaskWorkspaceData = {
      ...base,
      personalItems: [optimistic, ...(taskPreviewData.personalItems ?? [])],
    };

    const merged = mergePersonalItemCreate(withOptimistic, server, "Buy gas");
    const matching = (merged.personalItems ?? []).filter((item) => item.title === "Buy gas");

    expect(matching).toHaveLength(1);
    expect(matching[0].id).toBe(server.id);
    expect(merged.personalItems?.some((item) => item.id.startsWith("optimistic-personal-"))).toBe(false);
  });

  it("still prepends the server record when no optimistic row exists", () => {
    const server: PersonalItemRecord = {
      id: "22222222-2222-2222-2222-222222222222",
      title: "Claim faucet",
      frequency: "once",
      status: "todo",
      note: null,
      createdAt: "2026-08-08T00:00:00.000Z",
      updatedAt: "2026-08-08T00:00:00.000Z",
    };

    const merged = mergePersonalItemCreate(base, server, "Claim faucet");
    expect(merged.personalItems?.[0]).toEqual(server);
  });
});
