"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { accounts, projectAccounts, projectWallets, taskAccounts, taskLogs, tasks, taskWallets, wallets } from "@/lib/db/schema";
import { ensureDefaultWorkspace } from "@/lib/db/workspace";
import { recordActivity } from "@/features/activity/activity-log";
import { getTaskWorkspaceData } from "@/features/tasks/actions";
import { isHttpUrl, normalizeHttpUrl } from "@/lib/url";

import { getJakartaDateValue } from "@/features/tasks/task-duration";
import { buildDailyPageData, dailyLogKey } from "./daily-query";
import { DAILY_LOG_STATUSES, type DailyPageData, type DailyTaskLogRecord } from "./daily-types";

const optionalHttpUrlSchema = z.preprocess(
  (value) => typeof value === "string" ? normalizeHttpUrl(value) : value,
  z.union([z.literal(""), z.string().trim().url().refine(isHttpUrl, "Only http or https URLs are supported")]).nullable().optional(),
);

const dailyLogInputSchema = z.object({
  taskId: z.string().uuid(),
  accountId: z.string().uuid(),
  loggedDate: z.string().date(),
  status: z.enum(DAILY_LOG_STATUSES),
  walletId: z.string().uuid().nullable().optional(),
  txHash: z.string().trim().max(256).nullable().optional(),
  proofUrl: optionalHttpUrlSchema,
  notes: z.string().trim().max(5000).nullable().optional(),
});

async function requireWorkspace() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  const workspace = await ensureDefaultWorkspace(user.id);
  return workspace.id;
}

function toDailyTaskLogRecord(row: typeof taskLogs.$inferSelect): DailyTaskLogRecord {
  if (!row.accountId) throw new Error("Task log is missing its account");
  return {
    id: row.id,
    taskId: row.taskId,
    projectId: row.projectId,
    accountId: row.accountId,
    walletId: row.walletId,
    status: row.status,
    loggedDate: row.loggedDate,
    txHash: row.txHash,
    proofUrl: row.proofUrl,
    notes: row.notes,
  };
}

function parseSelectedDate(value: string | undefined) {
  return z.string().date().parse(value ?? getJakartaDateValue());
}

export async function getDailyPageData(selectedDate?: string): Promise<DailyPageData> {
  const workspaceId = await requireWorkspace();
  const date = parseSelectedDate(selectedDate);
  const [taskData, dateLogs, completedOnceRows] = await Promise.all([
    getTaskWorkspaceData(),
    db.select().from(taskLogs).where(and(eq(taskLogs.workspaceId, workspaceId), eq(taskLogs.loggedDate, date))),
    db.select({ taskId: taskLogs.taskId, accountId: taskLogs.accountId }).from(taskLogs)
      .innerJoin(tasks, eq(taskLogs.taskId, tasks.id))
      .where(and(eq(taskLogs.workspaceId, workspaceId), eq(taskLogs.status, "done"), eq(tasks.frequency, "once"))),
  ]);

  return buildDailyPageData({
    tasks: taskData.tasks,
    accounts: taskData.accounts,
    selectedDate: date,
    logs: dateLogs.map(toDailyTaskLogRecord),
    completedOnceLogKeys: new Set(completedOnceRows.flatMap((row) => row.accountId ? [dailyLogKey(row.taskId, row.accountId)] : [])),
  });
}

async function validateDailyLogRelations(
  workspaceId: string,
  taskId: string,
  accountId: string,
  walletId: string | null,
) {
  const [task] = await db.select({ id: tasks.id, projectId: tasks.projectId }).from(tasks)
    .where(and(eq(tasks.id, taskId), eq(tasks.workspaceId, workspaceId))).limit(1);
  if (!task?.projectId) throw new Error("Task not found");

  const [account] = await db.select({ id: accounts.id }).from(accounts)
    .where(and(eq(accounts.id, accountId), eq(accounts.workspaceId, workspaceId))).limit(1);
  if (!account) throw new Error("Account not found");

  const explicitAssignments = await db.select({ accountId: taskAccounts.accountId }).from(taskAccounts)
    .where(eq(taskAccounts.taskId, taskId));
  const assigned = explicitAssignments.length > 0
    ? explicitAssignments.some((assignment) => assignment.accountId === accountId)
    : (await db.select({ accountId: projectAccounts.accountId }).from(projectAccounts)
      .where(and(eq(projectAccounts.projectId, task.projectId), eq(projectAccounts.accountId, accountId)))).length > 0;
  if (!assigned) throw new Error("Account is not assigned to this task");

  if (!walletId) return task.projectId;
  const [wallet] = await db.select({ id: wallets.id, ownerAccountId: wallets.ownerAccountId }).from(wallets)
    .where(and(eq(wallets.id, walletId), eq(wallets.workspaceId, workspaceId))).limit(1);
  if (!wallet) throw new Error("Wallet not found");
  if (wallet.ownerAccountId && wallet.ownerAccountId !== accountId) {
    throw new Error("Wallet owner must match the selected account");
  }
  const [taskWallet] = await db.select({ walletId: taskWallets.walletId }).from(taskWallets)
    .where(and(eq(taskWallets.taskId, taskId), eq(taskWallets.walletId, walletId))).limit(1);
  const [projectWallet] = await db.select({ walletId: projectWallets.walletId }).from(projectWallets)
    .where(and(eq(projectWallets.projectId, task.projectId), eq(projectWallets.walletId, walletId))).limit(1);
  if (!taskWallet && !projectWallet) throw new Error("Wallet must belong to this task's project");
  return task.projectId;
}

export async function upsertDailyTaskLog(input: z.input<typeof dailyLogInputSchema>): Promise<DailyTaskLogRecord> {
  const workspaceId = await requireWorkspace();
  const parsed = dailyLogInputSchema.parse(input);
  const projectId = await validateDailyLogRelations(workspaceId, parsed.taskId, parsed.accountId, parsed.walletId ?? null);
  const now = new Date();
  const [log] = await db.insert(taskLogs).values({
    workspaceId,
    taskId: parsed.taskId,
    projectId,
    accountId: parsed.accountId,
    walletId: parsed.walletId ?? null,
    status: parsed.status,
    loggedDate: parsed.loggedDate,
    txHash: parsed.txHash || null,
    proofUrl: parsed.proofUrl || null,
    notes: parsed.notes || null,
    updatedAt: now,
  }).onConflictDoUpdate({
    target: [taskLogs.taskId, taskLogs.accountId, taskLogs.loggedDate],
    set: {
      walletId: parsed.walletId ?? null,
      status: parsed.status,
      txHash: parsed.txHash || null,
      proofUrl: parsed.proofUrl || null,
      notes: parsed.notes || null,
      updatedAt: now,
    },
  }).returning();
  if (!log) throw new Error("Task log could not be saved");
  await recordActivity(workspaceId, "task_log.updated", { taskId: log.taskId, projectId: log.projectId, accountId: log.accountId, walletId: log.walletId }, { status: log.status, loggedDate: log.loggedDate });
  revalidatePath("/daily");
  return toDailyTaskLogRecord(log);
}
