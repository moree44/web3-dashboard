import { describe, expect, it } from "vitest";

import { deadlineInputSchema } from "@/features/deadlines/deadline-schema";
import {
  compareDeadlineDates,
  formatDeadlineDueLabel,
  formatDeadlineTime,
  getDeadlineDayDifference,
  getJakartaDateValue,
  shiftDateValue,
} from "@/features/deadlines/deadline-utils";

describe("deadline date utilities", () => {
  it("uses Asia/Jakarta when resolving today's date", () => {
    expect(getJakartaDateValue(new Date("2026-07-28T17:30:00.000Z"))).toBe("2026-07-29");
  });

  it("formats relative due labels deterministically", () => {
    expect(formatDeadlineDueLabel("2026-07-27", "2026-07-28")).toBe("Overdue");
    expect(formatDeadlineDueLabel("2026-07-28", "2026-07-28")).toBe("Today");
    expect(formatDeadlineDueLabel("2026-07-29", "2026-07-28")).toBe("Tomorrow");
    expect(formatDeadlineDueLabel("2026-08-03", "2026-07-28")).toBe("In 6 days");
    expect(getDeadlineDayDifference("2026-08-04", "2026-07-28")).toBe(7);
  });

  it("sorts explicit times before deadlines without a time", () => {
    const items = [
      { dueDate: "2026-07-28", dueTime: null },
      { dueDate: "2026-07-28", dueTime: "08:30:00" },
      { dueDate: "2026-07-27", dueTime: null },
    ].sort(compareDeadlineDates);

    expect(items).toEqual([
      { dueDate: "2026-07-27", dueTime: null },
      { dueDate: "2026-07-28", dueTime: "08:30:00" },
      { dueDate: "2026-07-28", dueTime: null },
    ]);
    expect(formatDeadlineTime("08:30:00")).toBe("08:30");
  });

  it("shifts dates safely across month boundaries", () => {
    expect(shiftDateValue("2026-07-31", 1)).toBe("2026-08-01");
    expect(shiftDateValue("2026-08-01", -1)).toBe("2026-07-31");
  });
});

describe("deadline validation", () => {
  const validInput = {
    title: "Cancel Website A billing",
    dueDate: "2026-08-03",
    dueTime: "20:00",
    status: "upcoming" as const,
  };

  it("accepts a standalone deadline", () => {
    expect(deadlineInputSchema.parse(validInput)).toMatchObject(validInput);
  });

  it("rejects invalid time and non-HTTP URL values", () => {
    expect(() => deadlineInputSchema.parse({ ...validInput, dueTime: "25:90" })).toThrow();
    expect(() => deadlineInputSchema.parse({ ...validInput, url: "ftp://website-a.com" })).toThrow();
  });

  it("normalizes a bare Deadline URL", () => {
    expect(deadlineInputSchema.parse({ ...validInput, url: "website-a.com" }).url).toBe("https://website-a.com");
  });
});
