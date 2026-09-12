import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/cron/deadline-cleanup/route";

const cleanupMocks = vi.hoisted(() => ({
  deleteExpiredDeadlines: vi.fn(),
}));

vi.mock("@/features/deadlines/deadline-cleanup", () => cleanupMocks);

describe("deadline cleanup cron route", () => {
  const originalCronSecret = process.env.CRON_SECRET;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = "test-cron-secret";
    cleanupMocks.deleteExpiredDeadlines.mockResolvedValue({
      deletedCount: 2,
      cutoffDate: "2026-09-12",
    });
  });

  afterEach(() => {
    if (originalCronSecret === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = originalCronSecret;
  });

  it("rejects requests without the configured bearer secret", async () => {
    const response = await GET(new Request("http://localhost/api/cron/deadline-cleanup"));

    expect(response.status).toBe(401);
    expect(cleanupMocks.deleteExpiredDeadlines).not.toHaveBeenCalled();
  });

  it("runs cleanup for an authorized cron request", async () => {
    const response = await GET(new Request("http://localhost/api/cron/deadline-cleanup", {
      headers: { authorization: "Bearer test-cron-secret" },
    }));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      ok: true,
      deletedCount: 2,
      cutoffDate: "2026-09-12",
    });
    expect(cleanupMocks.deleteExpiredDeadlines).toHaveBeenCalledTimes(1);
  });
});
