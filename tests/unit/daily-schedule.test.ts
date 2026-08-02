import { describe, expect, it } from "vitest";

import { isDailyMonitoringTask, isTaskScheduledForDate } from "@/features/daily/daily-schedule";

const base = {
  status: "todo" as const,
  startDate: "2026-07-31",
  selectedDate: "2026-07-31",
};

describe("Daily task scheduling", () => {
  it("shows once tasks from their start date until completed", () => {
    expect(isTaskScheduledForDate({ ...base, frequency: "once" })).toBe(true);
    expect(isTaskScheduledForDate({ ...base, frequency: "once", selectedDate: "2026-08-03" })).toBe(true);
    expect(isTaskScheduledForDate({ ...base, frequency: "once", hasCompletedOnce: true })).toBe(false);
  });

  it("shows daily tasks every day from their start date", () => {
    expect(isTaskScheduledForDate({ ...base, frequency: "daily", selectedDate: "2026-08-01" })).toBe(true);
    expect(isTaskScheduledForDate({ ...base, frequency: "daily", selectedDate: "2026-07-30" })).toBe(false);
  });

  it("uses the start weekday for weekly tasks", () => {
    expect(isTaskScheduledForDate({ ...base, frequency: "weekly", selectedDate: "2026-08-07" })).toBe(true);
    expect(isTaskScheduledForDate({ ...base, frequency: "weekly", selectedDate: "2026-08-06" })).toBe(false);
  });

  it("uses the start day of month for monthly tasks", () => {
    expect(isTaskScheduledForDate({ ...base, frequency: "monthly", selectedDate: "2026-08-31" })).toBe(true);
    expect(isTaskScheduledForDate({ ...base, frequency: "monthly", selectedDate: "2026-08-30" })).toBe(false);
  });

  it("keeps custom, done, and dropped tasks out of actionable checklists", () => {
    expect(isTaskScheduledForDate({ ...base, frequency: "custom" })).toBe(false);
    expect(isTaskScheduledForDate({ ...base, frequency: "daily", status: "done" })).toBe(false);
    expect(isTaskScheduledForDate({ ...base, frequency: "daily", status: "dropped" })).toBe(false);
  });

  it("identifies Running and Recheck as monitoring tasks", () => {
    expect(isDailyMonitoringTask("running")).toBe(true);
    expect(isDailyMonitoringTask("recheck")).toBe(true);
    expect(isDailyMonitoringTask("todo")).toBe(false);
  });
});
