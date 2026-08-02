import { describe, expect, it } from "vitest";

import { buildDailyPageData } from "@/features/daily/daily-query";
import type { TaskWorkspaceData } from "@/features/tasks/task-types";

const account = { id: "11111111-1111-4111-8111-111111111111", label: "Moree", avatarUrl: null };
const taskData: TaskWorkspaceData = {
  accounts: [account],
  projects: [],
  tasks: [
    {
      id: "task-daily", projectId: "project-1", projectName: "Soundness", projectLogoUrl: null,
      title: "Daily check-in", description: null, status: "todo", frequency: "daily", priority: "medium", url: null,
      sortOrder: 0, startDate: "2026-07-31", completedAt: null, assignedAccounts: [], effectiveAccounts: [account],
      usesProjectAccountFallback: true, assignedWallet: null, createdAt: null, updatedAt: null,
    },
    {
      id: "task-once", projectId: "project-1", projectName: "Soundness", projectLogoUrl: null,
      title: "One-off proof", description: null, status: "todo", frequency: "once", priority: "high", url: null,
      sortOrder: 1, startDate: "2026-07-31", completedAt: null, assignedAccounts: [account], effectiveAccounts: [account],
      usesProjectAccountFallback: false, assignedWallet: null, createdAt: null, updatedAt: null,
    },
    {
      id: "task-running", projectId: "project-2", projectName: "Nexus", projectLogoUrl: null,
      title: "Run prover", description: null, status: "running", frequency: "custom", priority: "high", url: null,
      sortOrder: 2, startDate: "2026-07-31", completedAt: null, assignedAccounts: [account], effectiveAccounts: [account],
      usesProjectAccountFallback: false, assignedWallet: null, createdAt: null, updatedAt: null,
    },
  ],
};

describe("Daily page data", () => {
  it("uses the task account fallback and attaches the current date log", () => {
    const data = buildDailyPageData({
      ...taskData,
      selectedDate: "2026-08-01",
      completedOnceLogKeys: new Set(),
      logs: [{ id: "log-1", taskId: "task-daily", projectId: "project-1", accountId: account.id, walletId: null, status: "done", loggedDate: "2026-08-01", txHash: null, proofUrl: null, notes: null }],
    });
    expect(data.items.find((item) => item.taskId === "task-daily")?.log?.status).toBe("done");
    expect(data.items.find((item) => item.taskId === "task-daily")?.account.id).toBe(account.id);
  });

  it("does not generate a completed Once task but keeps monitoring separate", () => {
    const data = buildDailyPageData({ ...taskData, selectedDate: "2026-08-01", logs: [], completedOnceLogKeys: new Set(["task-once:" + account.id]) });
    expect(data.items.some((item) => item.taskId === "task-once")).toBe(false);
    expect(data.items.find((item) => item.taskId === "task-running")?.kind).toBe("monitoring");
  });

  it("keeps a Once task visible for another assigned account", () => {
    const secondAccount = { id: "22222222-2222-4222-8222-222222222222", label: "Wdym", avatarUrl: null };
    const data = buildDailyPageData({
      ...taskData,
      accounts: [account, secondAccount],
      tasks: taskData.tasks.map((task) => task.id === "task-once" ? { ...task, effectiveAccounts: [account, secondAccount] } : task),
      selectedDate: "2026-08-01",
      logs: [],
      completedOnceLogKeys: new Set(["task-once:" + account.id]),
    });
    expect(data.items.some((item) => item.taskId === "task-once" && item.account.id === account.id)).toBe(false);
    expect(data.items.some((item) => item.taskId === "task-once" && item.account.id === secondAccount.id)).toBe(true);
  });
});
