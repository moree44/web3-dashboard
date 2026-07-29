import { describe, expect, it } from "vitest";

import { filterTasks } from "@/features/tasks/task-query";
import { taskPreviewData } from "@/features/tasks/preview-data";

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
