"use server";

import { revalidatePath } from "next/cache";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import {
  accounts,
  deadlines,
  projectAccounts,
  projects,
  projectWallets,
  taskAccounts,
  tasks,
  taskWallets,
  wallets,
  personalItems,
} from "@/lib/db/schema";
import { ensureDefaultWorkspace } from "@/lib/db/workspace";
import { recordActivity } from "@/features/activity/activity-log";

import {
  TASK_FREQUENCIES,
  TASK_PRIORITIES,
  TASK_STATUSES,
  type TaskAccountOption,
  type TaskCreateInput,
  type TaskInput,
  type TaskProjectOption,
  type TaskRecord,
  type TaskWalletOption,
  type TaskWorkspaceData,
} from "./task-types";
import { getJakartaDateValue } from "./task-duration";
import { isHttpUrl, normalizeHttpUrl } from "@/lib/url";

const optionalHttpUrlSchema = z.preprocess(
  (value) => typeof value === "string" ? normalizeHttpUrl(value) : value,
  z.union([
    z.literal(""),
    z.string().trim().url().refine(isHttpUrl, "Only http or https URLs are supported"),
  ]).nullable().optional(),
);

const taskInputSchema = z.object({
  projectId: z.string().uuid(),
  title: z.string().trim().min(1, "Task title is required").max(180),
  description: z.string().trim().max(5000).nullable().optional(),
  status: z.enum(TASK_STATUSES).default("todo"),
  frequency: z.enum(TASK_FREQUENCIES).default("once"),
  priority: z.enum(TASK_PRIORITIES).default("medium"),
  url: optionalHttpUrlSchema,
  startDate: z.union([z.literal(""), z.string().date()]).nullable().optional(),
  accountIds: z.array(z.string().uuid()).max(100).default([]),
  walletId: z.string().uuid().nullable().optional(),
});

const taskCreateInputSchema = taskInputSchema.extend({
  deadline: z.object({
    dueDate: z.string().date("Choose a valid deadline date"),
    dueTime: z.union([z.literal(""), z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use 24-hour time")]).nullable().optional(),
    url: optionalHttpUrlSchema,
    notes: z.string().trim().max(5000).nullable().optional(),
  }).nullable().optional(),
});

function parseTaskInput(input: TaskInput) {
  const result = taskInputSchema.safeParse(input);
  if (result.success) return result.data;
  const issue = result.error.issues[0];
  if (issue?.path[0] === "url") {
    throw new Error("Enter a valid URL, for example test.com");
  }
  throw new Error(issue?.message ?? "Task details are invalid");
}

function parseTaskCreateInput(input: TaskCreateInput) {
  const result = taskCreateInputSchema.safeParse(input);
  if (result.success) return result.data;
  const issue = result.error.issues[0];
  if (issue?.path.includes("url")) {
    throw new Error("Enter a valid URL, for example test.com");
  }
  throw new Error(issue?.message ?? "Task details are invalid");
}

async function requireWorkspace() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  const workspace = await ensureDefaultWorkspace(user.id);
  return workspace.id;
}

function revalidateTaskViews() {
  for (const path of ["/tasks", "/daily", "/deadlines", "/projects", "/"]) {
    revalidatePath(path);
  }
}

function hasPostgresCode(error: unknown, code: string) {
  let current: unknown = error;
  const visited = new Set<unknown>();
  while (current && typeof current === "object" && !visited.has(current)) {
    visited.add(current);
    if ("code" in current && current.code === code) return true;
    current = "cause" in current ? current.cause : undefined;
  }
  return false;
}

async function loadTaskWorkspaceData(workspaceId: string): Promise<TaskWorkspaceData> {
  const [taskRows, projectRows, accountRows, projectAccountRows, projectWalletRows, taskAccountRows, taskWalletRows, personalRows] = await Promise.all([
    db.select().from(tasks).where(eq(tasks.workspaceId, workspaceId)).orderBy(asc(tasks.sortOrder), desc(tasks.updatedAt)),
    db.select({ id: projects.id, name: projects.name, logoUrl: projects.logoUrl })
      .from(projects)
      .where(and(eq(projects.workspaceId, workspaceId), eq(projects.isArchived, false)))
      .orderBy(asc(projects.name)),
    db.select({ id: accounts.id, label: accounts.label, avatarUrl: accounts.avatarUrl })
      .from(accounts)
      .where(eq(accounts.workspaceId, workspaceId))
      .orderBy(asc(accounts.label)),
    db.select({ projectId: projectAccounts.projectId, id: accounts.id, label: accounts.label, avatarUrl: accounts.avatarUrl })
      .from(projectAccounts)
      .innerJoin(projects, eq(projectAccounts.projectId, projects.id))
      .innerJoin(accounts, eq(projectAccounts.accountId, accounts.id))
      .where(and(eq(projects.workspaceId, workspaceId), eq(accounts.workspaceId, workspaceId))),
    db.select({ projectId: projectWallets.projectId, id: wallets.id, label: wallets.label, address: wallets.address, ownerAccountId: wallets.ownerAccountId })
      .from(projectWallets)
      .innerJoin(projects, eq(projectWallets.projectId, projects.id))
      .innerJoin(wallets, eq(projectWallets.walletId, wallets.id))
      .where(and(eq(projects.workspaceId, workspaceId), eq(wallets.workspaceId, workspaceId))),
    db.select({ taskId: taskAccounts.taskId, id: accounts.id, label: accounts.label, avatarUrl: accounts.avatarUrl })
      .from(taskAccounts)
      .innerJoin(tasks, eq(taskAccounts.taskId, tasks.id))
      .innerJoin(accounts, eq(taskAccounts.accountId, accounts.id))
      .where(and(eq(tasks.workspaceId, workspaceId), eq(accounts.workspaceId, workspaceId))),
    db.select({ taskId: taskWallets.taskId, id: wallets.id, label: wallets.label, address: wallets.address, ownerAccountId: wallets.ownerAccountId })
      .from(taskWallets)
      .innerJoin(tasks, eq(taskWallets.taskId, tasks.id))
      .innerJoin(wallets, eq(taskWallets.walletId, wallets.id))
      .where(and(eq(tasks.workspaceId, workspaceId), eq(wallets.workspaceId, workspaceId))),
    db.select().from(personalItems).where(eq(personalItems.workspaceId, workspaceId)).orderBy(asc(personalItems.status), asc(personalItems.createdAt)),
  ]);

  const accountsByProject = new Map<string, TaskAccountOption[]>();
  for (const row of projectAccountRows) {
    const current = accountsByProject.get(row.projectId) ?? [];
    current.push({ id: row.id, label: row.label, avatarUrl: row.avatarUrl });
    accountsByProject.set(row.projectId, current);
  }

  const walletsByProject = new Map<string, TaskWalletOption[]>();
  for (const row of projectWalletRows) {
    const current = walletsByProject.get(row.projectId) ?? [];
    current.push({ id: row.id, label: row.label, address: row.address, ownerAccountId: row.ownerAccountId });
    walletsByProject.set(row.projectId, current);
  }

  const accountsByTask = new Map<string, TaskAccountOption[]>();
  for (const row of taskAccountRows) {
    const current = accountsByTask.get(row.taskId) ?? [];
    current.push({ id: row.id, label: row.label, avatarUrl: row.avatarUrl });
    accountsByTask.set(row.taskId, current);
  }

  const walletsByTask = new Map<string, TaskWalletOption[]>();
  for (const row of taskWalletRows) {
    const current = walletsByTask.get(row.taskId) ?? [];
    current.push({ id: row.id, label: row.label, address: row.address, ownerAccountId: row.ownerAccountId });
    walletsByTask.set(row.taskId, current);
  }

  const projectOptions: TaskProjectOption[] = projectRows.map((project) => ({
    ...project,
    accounts: accountsByProject.get(project.id) ?? [],
    wallets: walletsByProject.get(project.id) ?? [],
  }));
  const projectsById = new Map(projectOptions.map((project) => [project.id, project]));

  const records: TaskRecord[] = taskRows.flatMap((task) => {
    if (!task.projectId) return [];
    const project = projectsById.get(task.projectId);
    if (!project) return [];
    const assignedAccounts = accountsByTask.get(task.id) ?? [];
    return [{
      id: task.id,
      projectId: project.id,
      projectName: project.name,
      projectLogoUrl: project.logoUrl,
      title: task.title,
      description: task.description,
      status: task.status ?? "todo",
      frequency: task.frequency ?? "once",
      priority: task.priority ?? "medium",
      url: task.url,
      sortOrder: task.sortOrder ?? 0,
      startDate: task.startDate,
      completedAt: task.completedAt?.toISOString() ?? null,
      assignedAccounts,
      effectiveAccounts: assignedAccounts.length > 0 ? assignedAccounts : project.accounts,
      usesProjectAccountFallback: assignedAccounts.length === 0,
      assignedWallet: (walletsByTask.get(task.id) ?? [])[0] ?? null,
      createdAt: task.createdAt?.toISOString() ?? null,
      updatedAt: task.updatedAt?.toISOString() ?? null,
    }];
  });

  const personalRecords = personalRows.map((item) => ({
    id: item.id,
    title: item.title,
    frequency: item.frequency ?? "once",
    status: item.status ?? "todo",
    note: item.note,
    createdAt: item.createdAt?.toISOString() ?? null,
    updatedAt: item.updatedAt?.toISOString() ?? null,
  }));

  return { tasks: records, projects: projectOptions, accounts: accountRows, personalItems: personalRecords };
}

async function validateAssignments(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  workspaceId: string,
  projectId: string,
  accountIds: string[],
  walletId: string | null,
) {
  const [project] = await tx.select({ id: projects.id }).from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.workspaceId, workspaceId), eq(projects.isArchived, false)))
    .limit(1);
  if (!project) throw new Error("Project not found");

  if (accountIds.length > 0) {
    const available = await tx.select({ id: projectAccounts.accountId }).from(projectAccounts)
      .innerJoin(accounts, eq(projectAccounts.accountId, accounts.id))
      .where(and(
        eq(projectAccounts.projectId, projectId),
        eq(accounts.workspaceId, workspaceId),
        inArray(projectAccounts.accountId, accountIds),
      ));
    if (available.length !== accountIds.length) {
      throw new Error("Selected accounts must belong to the selected project");
    }
  }

  if (walletId) {
    const [available] = await tx.select({ id: projectWallets.walletId }).from(projectWallets)
      .innerJoin(wallets, eq(projectWallets.walletId, wallets.id))
      .where(and(
        eq(projectWallets.projectId, projectId),
        eq(projectWallets.walletId, walletId),
        eq(wallets.workspaceId, workspaceId),
      ))
      .limit(1);
    if (!available) throw new Error("Selected wallet must belong to the selected project");
  }
}

export async function getTaskWorkspaceData(): Promise<TaskWorkspaceData> {
  return loadTaskWorkspaceData(await requireWorkspace());
}

export async function createTask(input: TaskCreateInput): Promise<TaskRecord> {
  const workspaceId = await requireWorkspace();
  const parsed = parseTaskCreateInput(input);
  const accountIds = [...new Set(parsed.accountIds)];
  const walletId = parsed.walletId ?? null;

  const taskId = await db.transaction(async (tx) => {
    await validateAssignments(tx, workspaceId, parsed.projectId, accountIds, walletId);
    const [created] = await tx.insert(tasks).values({
      workspaceId,
      projectId: parsed.projectId,
      title: parsed.title,
      description: parsed.description || null,
      status: parsed.status,
      frequency: parsed.frequency,
      priority: parsed.priority,
      url: parsed.url || null,
      startDate: parsed.startDate || getJakartaDateValue(),
      completedAt: parsed.status === "done" ? new Date() : null,
      updatedAt: new Date(),
    }).returning({ id: tasks.id });

    if (accountIds.length > 0) {
      await tx.insert(taskAccounts).values(accountIds.map((accountId) => ({ taskId: created.id, accountId })));
    }
    if (walletId) await tx.insert(taskWallets).values({ taskId: created.id, walletId });
    if (parsed.deadline) {
      await tx.insert(deadlines).values({
        workspaceId,
        title: parsed.title,
        notes: parsed.deadline.notes || null,
        url: parsed.deadline.url || parsed.url || null,
        dueDate: parsed.deadline.dueDate,
        dueTime: parsed.deadline.dueTime || null,
        status: "upcoming",
        linkedProjectId: parsed.projectId,
        linkedTaskId: created.id,
        updatedAt: new Date(),
      });
    }
    return created.id;
  });

  revalidateTaskViews();
  const result = (await loadTaskWorkspaceData(workspaceId)).tasks.find((task) => task.id === taskId);
  if (!result) throw new Error("Task could not be loaded after creation");
  await recordActivity(workspaceId, "task.created", { taskId: result.id, projectId: result.projectId }, { title: result.title });
  return result;
}

export async function updateTask(id: string, input: TaskInput): Promise<TaskRecord> {
  const workspaceId = await requireWorkspace();
  const taskId = z.string().uuid().parse(id);
  const parsed = parseTaskInput(input);
  const accountIds = [...new Set(parsed.accountIds)];
  const walletId = parsed.walletId ?? null;

  await db.transaction(async (tx) => {
    await validateAssignments(tx, workspaceId, parsed.projectId, accountIds, walletId);
    const [current] = await tx.select({ status: tasks.status, startDate: tasks.startDate, completedAt: tasks.completedAt }).from(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.workspaceId, workspaceId))).limit(1);
    if (!current) throw new Error("Task not found");
    const completedAt = parsed.status === "done"
      ? current.status === "done" && current.completedAt ? current.completedAt : new Date()
      : null;
    const [updated] = await tx.update(tasks).set({
      projectId: parsed.projectId,
      title: parsed.title,
      description: parsed.description || null,
      status: parsed.status,
      frequency: parsed.frequency,
      priority: parsed.priority,
      url: parsed.url || null,
      startDate: parsed.startDate || current.startDate || getJakartaDateValue(),
      completedAt,
      updatedAt: new Date(),
    }).where(and(eq(tasks.id, taskId), eq(tasks.workspaceId, workspaceId))).returning({ id: tasks.id });
    if (!updated) throw new Error("Task not found");

    await tx.delete(taskAccounts).where(eq(taskAccounts.taskId, taskId));
    await tx.delete(taskWallets).where(eq(taskWallets.taskId, taskId));
    if (accountIds.length > 0) {
      await tx.insert(taskAccounts).values(accountIds.map((accountId) => ({ taskId, accountId })));
    }
    if (walletId) await tx.insert(taskWallets).values({ taskId, walletId });
  });

  revalidateTaskViews();
  const result = (await loadTaskWorkspaceData(workspaceId)).tasks.find((task) => task.id === taskId);
  if (!result) throw new Error("Task could not be loaded after update");
  await recordActivity(workspaceId, "task.updated", { taskId: result.id, projectId: result.projectId }, { title: result.title, status: result.status });
  return result;
}

export async function updateTaskStatus(id: string, status: (typeof TASK_STATUSES)[number]): Promise<TaskRecord> {
  const workspaceId = await requireWorkspace();
  const taskId = z.string().uuid().parse(id);
  const nextStatus = z.enum(TASK_STATUSES).parse(status);
  const [current] = await db.select({ status: tasks.status, completedAt: tasks.completedAt }).from(tasks)
    .where(and(eq(tasks.id, taskId), eq(tasks.workspaceId, workspaceId))).limit(1);
  if (!current) throw new Error("Task not found");
  const completedAt = nextStatus === "done"
    ? current.status === "done" && current.completedAt ? current.completedAt : new Date()
    : null;
  const [updated] = await db.update(tasks).set({ status: nextStatus, completedAt, updatedAt: new Date() })
    .where(and(eq(tasks.id, taskId), eq(tasks.workspaceId, workspaceId)))
    .returning({ id: tasks.id });
  if (!updated) throw new Error("Task not found");
  revalidateTaskViews();
  const result = (await loadTaskWorkspaceData(workspaceId)).tasks.find((task) => task.id === taskId);
  if (!result) throw new Error("Task could not be loaded after update");
  await recordActivity(workspaceId, "task.status_changed", { taskId: result.id, projectId: result.projectId }, { title: result.title, status: result.status });
  return result;
}

export async function deleteTask(id: string): Promise<void> {
  const workspaceId = await requireWorkspace();
  const taskId = z.string().uuid().parse(id);
  try {
    await db.transaction(async (tx) => {
      const [existing] = await tx.select({ id: tasks.id }).from(tasks)
        .where(and(eq(tasks.id, taskId), eq(tasks.workspaceId, workspaceId))).limit(1);
      if (!existing) throw new Error("Task not found");
      await tx.delete(taskAccounts).where(eq(taskAccounts.taskId, taskId));
      await tx.delete(taskWallets).where(eq(taskWallets.taskId, taskId));
      await tx.delete(tasks).where(and(eq(tasks.id, taskId), eq(tasks.workspaceId, workspaceId)));
    });
  } catch (error) {
    if (hasPostgresCode(error, "23503")) {
      throw new Error("This task has activity logs and cannot be deleted. Set it to Dropped instead.");
    }
    throw error;
  }
  await recordActivity(workspaceId, "task.deleted", {}, { id: taskId });
  revalidateTaskViews();
}
