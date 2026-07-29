import { describe, expect, it } from "vitest";

import { formatTaskDuration, getTaskDurationDays } from "@/features/tasks/task-duration";

describe("Task completion duration", () => {
  it("uses Asia/Jakarta calendar dates", () => {
    expect(getTaskDurationDays("2026-07-29", "2026-07-29T17:30:00.000Z")).toBe(1);
  });

  it("formats same-day and day durations", () => {
    expect(formatTaskDuration("2026-07-29", "2026-07-29T05:00:00.000Z")).toBe("Completed same day");
    expect(formatTaskDuration("2026-07-25", "2026-07-29T05:00:00.000Z")).toBe("Completed in 4 days");
  });

  it("formats longer work in weeks and months", () => {
    expect(formatTaskDuration("2026-07-19", "2026-07-29T05:00:00.000Z")).toBe("Completed in 1 week 3 days");
    expect(formatTaskDuration("2026-06-14", "2026-07-29T05:00:00.000Z")).toBe("Completed in 1 month 2 weeks");
  });

  it("returns no duration until both lifecycle dates exist", () => {
    expect(formatTaskDuration(null, null)).toBeNull();
  });
});
