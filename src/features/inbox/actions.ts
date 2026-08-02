"use server";

import { revalidatePath } from "next/cache";
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { inboxItems, notes, projects, tasks } from "@/lib/db/schema";
import { ensureDefaultWorkspace } from "@/lib/db/workspace";
import { recordActivity } from "@/features/activity/activity-log";
import { getJakartaDateValue } from "@/features/tasks/task-duration";

import {
  parseInboxItemInput,
  parseInboxNoteConversion,
  parseInboxProjectConversion,
  parseInboxTaskConversion,
} from "./inbox-schema";
import {
  type InboxItemInput,
  type InboxItemRecord,
  type InboxNoteConversionInput,
  type InboxPageData,
  type InboxProjectConversionInput,
  type InboxTaskConversionInput,
  type InboxStatus,
  type InboxTaskOption,
} from "./inbox-types";

async function requireWorkspace() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  return (await ensureDefaultWorkspace(user.id)).id;
}

function revalidateInboxViews() {
  for (const path of ["/inbox", "/", "/projects", "/tasks", "/docs"]) revalidatePath(path);
}

function cleanOptional(value: string | null | undefined) {
  const cleaned = value?.trim();
  return cleaned || null;
}

function toRecord(
  row: typeof inboxItems.$inferSelect,
  linkedProjectName: string | null,
  linkedTaskTitle: string | null,
  linkedNoteTitle: string | null,
): InboxItemRecord {
  return {
    id: row.id,
    source: row.source ?? "manual",
    title: row.title,
    content: row.content ?? "",
    url: row.url,
    sender: row.sender,
    receivedAt: row.receivedAt?.toISOString() ?? null,
    status: row.status ?? "new",
    priority: row.priority ?? "medium",
    detectedProjectName: row.detectedProjectName,
    linkedProjectId: row.linkedProjectId,
    linkedProjectName,
    linkedTaskId: row.linkedTaskId,
    linkedTaskTitle,
    linkedNoteId: row.linkedNoteId,
    linkedNoteTitle,
    createdAt: row.createdAt?.toISOString() ?? null,
    updatedAt: row.updatedAt?.toISOString() ?? null,
  };
}

async function getRecords(workspaceId: string) {
  const rows = await db.select().from(inboxItems)
    .where(eq(inboxItems.workspaceId, workspaceId))
    .orderBy(desc(inboxItems.updatedAt), desc(inboxItems.createdAt));

  const projectIds = rows.flatMap((row) => row.linkedProjectId ? [row.linkedProjectId] : []);
  const taskIds = rows.flatMap((row) => row.linkedTaskId ? [row.linkedTaskId] : []);
  const noteIds = rows.flatMap((row) => row.linkedNoteId ? [row.linkedNoteId] : []);
  const [projectRows, taskRows, noteRows] = await Promise.all([
    projectIds.length ? db.select({ id: projects.id, name: projects.name }).from(projects).where(and(eq(projects.workspaceId, workspaceId), inArray(projects.id, projectIds))) : [],
    taskIds.length ? db.select({ id: tasks.id, title: tasks.title }).from(tasks).where(and(eq(tasks.workspaceId, workspaceId), inArray(tasks.id, taskIds))) : [],
    noteIds.length ? db.select({ id: notes.id, title: notes.title }).from(notes).where(and(eq(notes.workspaceId, workspaceId), inArray(notes.id, noteIds))) : [],
  ]);
  const projectNames = new Map(projectRows.map((row) => [row.id, row.name]));
  const taskTitles = new Map(taskRows.map((row) => [row.id, row.title]));
  const noteTitles = new Map(noteRows.map((row) => [row.id, row.title?.trim() || "Untitled document"]));
  return rows.map((row) => toRecord(
    row,
    row.linkedProjectId ? projectNames.get(row.linkedProjectId) ?? null : null,
    row.linkedTaskId ? taskTitles.get(row.linkedTaskId) ?? null : null,
    row.linkedNoteId ? noteTitles.get(row.linkedNoteId) ?? null : null,
  ));
}

async function getInboxRow(workspaceId: string, id: string) {
  const inboxId = z.string().uuid().parse(id);
  const [row] = await db.select().from(inboxItems)
    .where(and(eq(inboxItems.id, inboxId), eq(inboxItems.workspaceId, workspaceId)))
    .limit(1);
  if (!row) throw new Error("Inbox item not found");
  if (row.status === "converted") throw new Error("This Inbox item has already been converted");
  return { inboxId, row };
}

async function validateProject(workspaceId: string, projectId: string) {
  const [project] = await db.select({ id: projects.id, name: projects.name }).from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.workspaceId, workspaceId), eq(projects.isArchived, false)))
    .limit(1);
  if (!project) throw new Error("Project not found");
  return project;
}

async function getItemRecord(workspaceId: string, id: string) {
  const records = await getRecords(workspaceId);
  const record = records.find((item) => item.id === id);
  if (!record) throw new Error("Inbox item could not be loaded");
  return record;
}

export async function getInboxPageData(): Promise<InboxPageData> {
  const workspaceId = await requireWorkspace();
  const [items, projectRows, taskRows] = await Promise.all([
    getRecords(workspaceId),
    db.select({ id: projects.id, name: projects.name }).from(projects)
      .where(and(eq(projects.workspaceId, workspaceId), eq(projects.isArchived, false)))
      .orderBy(asc(projects.name)),
    db.select({ id: tasks.id, title: tasks.title, projectId: projects.id, projectName: projects.name })
      .from(tasks)
      .innerJoin(projects, eq(tasks.projectId, projects.id))
      .where(and(eq(tasks.workspaceId, workspaceId), eq(projects.isArchived, false)))
      .orderBy(asc(projects.name), asc(tasks.title)),
  ]);
  const taskOptions: InboxTaskOption[] = taskRows.map((row) => ({
    id: row.id,
    title: row.title,
    projectId: row.projectId,
    projectName: row.projectName,
  }));
  return { items, projects: projectRows, tasks: taskOptions };
}

export async function createInboxItem(input: InboxItemInput): Promise<InboxItemRecord> {
  const workspaceId = await requireWorkspace();
  const parsed = parseInboxItemInput(input);
  const [created] = await db.insert(inboxItems).values({
    workspaceId,
    source: "manual",
    title: parsed.title,
    content: cleanOptional(parsed.content),
    url: parsed.url || null,
    sender: cleanOptional(parsed.sender),
    status: "new",
    priority: parsed.priority,
    detectedProjectName: cleanOptional(parsed.detectedProjectName),
    updatedAt: new Date(),
  }).returning({ id: inboxItems.id });
  if (!created) throw new Error("Inbox item could not be created");
  revalidateInboxViews();
  const record = await getItemRecord(workspaceId, created.id);
  await recordActivity(workspaceId, "inbox.created", { inboxItemId: record.id }, { title: record.title });
  return record;
}

export async function updateInboxItem(id: string, input: InboxItemInput): Promise<InboxItemRecord> {
  const workspaceId = await requireWorkspace();
  const inboxId = z.string().uuid().parse(id);
  const parsed = parseInboxItemInput(input);
  const [updated] = await db.update(inboxItems).set({
    title: parsed.title,
    content: cleanOptional(parsed.content),
    url: parsed.url || null,
    sender: cleanOptional(parsed.sender),
    priority: parsed.priority,
    detectedProjectName: cleanOptional(parsed.detectedProjectName),
    updatedAt: new Date(),
  }).where(and(eq(inboxItems.id, inboxId), eq(inboxItems.workspaceId, workspaceId))).returning({ id: inboxItems.id });
  if (!updated) throw new Error("Inbox item not found");
  revalidateInboxViews();
  const record = await getItemRecord(workspaceId, updated.id);
  await recordActivity(workspaceId, "inbox.updated", { inboxItemId: record.id }, { title: record.title });
  return record;
}

export async function setInboxStatus(id: string, status: InboxStatus): Promise<InboxItemRecord> {
  const workspaceId = await requireWorkspace();
  const inboxId = z.string().uuid().parse(id);
  const nextStatus = z.enum(["new", "reviewing", "ignored", "archived"] as const).parse(status);
  const [updated] = await db.update(inboxItems).set({ status: nextStatus, updatedAt: new Date() })
    .where(and(eq(inboxItems.id, inboxId), eq(inboxItems.workspaceId, workspaceId))).returning({ id: inboxItems.id });
  if (!updated) throw new Error("Inbox item not found");
  revalidateInboxViews();
  const record = await getItemRecord(workspaceId, updated.id);
  await recordActivity(workspaceId, "inbox.updated", { inboxItemId: record.id }, { title: record.title });
  return record;
}

export async function linkInboxItem(id: string, target: { type: "project" | "task"; targetId: string }): Promise<InboxItemRecord> {
  const workspaceId = await requireWorkspace();
  const { inboxId } = await getInboxRow(workspaceId, id);
  const targetId = z.string().uuid().parse(target.targetId);
  let linkedProjectId: string | null = null;
  let linkedTaskId: string | null = null;
  if (target.type === "project") {
    const project = await validateProject(workspaceId, targetId);
    linkedProjectId = project.id;
  } else {
    const [task] = await db.select({ id: tasks.id, projectId: tasks.projectId }).from(tasks)
      .innerJoin(projects, eq(tasks.projectId, projects.id))
      .where(and(eq(tasks.id, targetId), eq(tasks.workspaceId, workspaceId), eq(projects.isArchived, false))).limit(1);
    if (!task?.projectId) throw new Error("Task not found");
    linkedTaskId = task.id;
    linkedProjectId = task.projectId;
  }
  await db.update(inboxItems).set({ linkedProjectId, linkedTaskId, status: "linked", updatedAt: new Date() })
    .where(and(eq(inboxItems.id, inboxId), eq(inboxItems.workspaceId, workspaceId)));
  revalidateInboxViews();
  const record = await getItemRecord(workspaceId, inboxId);
  await recordActivity(workspaceId, "inbox.processed", { inboxItemId: record.id, projectId: record.linkedProjectId, taskId: record.linkedTaskId, noteId: record.linkedNoteId }, { title: record.title, status: record.status });
  return record;
}

export async function createProjectFromInbox(id: string, input: InboxProjectConversionInput = {}): Promise<InboxItemRecord> {
  const workspaceId = await requireWorkspace();
  const { row, inboxId } = await getInboxRow(workspaceId, id);
  const parsed = parseInboxProjectConversion(input);
  const projectName = parsed.projectName || row.detectedProjectName?.trim() || row.title.trim();
  if (!projectName) throw new Error("Project name is required");
  const [duplicate] = await db.select({ id: projects.id }).from(projects)
    .where(and(eq(projects.workspaceId, workspaceId), eq(projects.isArchived, false), sql`lower(trim(${projects.name})) = lower(trim(${projectName}))`))
    .limit(1);
  if (duplicate) throw new Error("An active project with this name already exists");

  await db.transaction(async (tx) => {
    const [project] = await tx.insert(projects).values({
      workspaceId,
      name: projectName,
      huntType: "free_hunts",
      status: "watching",
      priority: row.priority ?? "medium",
      workTypes: [],
      projectTypes: [],
      progressEstimate: "0",
      stageResult: "Watching",
      notes: row.content,
      websiteUrl: row.url,
      isArchived: false,
      updatedAt: new Date(),
    }).returning({ id: projects.id });
    if (!project) throw new Error("Project could not be created from Inbox");
    await tx.update(inboxItems).set({ linkedProjectId: project.id, status: "converted", updatedAt: new Date() })
      .where(and(eq(inboxItems.id, inboxId), eq(inboxItems.workspaceId, workspaceId)));
  });
  revalidateInboxViews();
  const record = await getItemRecord(workspaceId, inboxId);
  await recordActivity(workspaceId, "inbox.processed", { inboxItemId: record.id, projectId: record.linkedProjectId, taskId: record.linkedTaskId, noteId: record.linkedNoteId }, { title: record.title, status: record.status });
  return record;
}

export async function createTaskFromInbox(id: string, input: InboxTaskConversionInput): Promise<InboxItemRecord> {
  const workspaceId = await requireWorkspace();
  const { row, inboxId } = await getInboxRow(workspaceId, id);
  const parsed = parseInboxTaskConversion(input);
  const project = await validateProject(workspaceId, parsed.projectId);
  const title = parsed.taskTitle || row.title.trim();
  if (!title) throw new Error("Task title is required");

  await db.transaction(async (tx) => {
    const [task] = await tx.insert(tasks).values({
      workspaceId,
      projectId: project.id,
      title,
      description: row.content,
      status: "todo",
      frequency: "once",
      priority: row.priority ?? "medium",
      url: row.url,
      startDate: getJakartaDateValue(),
      updatedAt: new Date(),
    }).returning({ id: tasks.id });
    if (!task) throw new Error("Task could not be created from Inbox");
    await tx.update(inboxItems).set({ linkedProjectId: project.id, linkedTaskId: task.id, status: "converted", updatedAt: new Date() })
      .where(and(eq(inboxItems.id, inboxId), eq(inboxItems.workspaceId, workspaceId)));
  });
  revalidateInboxViews();
  const record = await getItemRecord(workspaceId, inboxId);
  await recordActivity(workspaceId, "inbox.processed", { inboxItemId: record.id, projectId: record.linkedProjectId, taskId: record.linkedTaskId, noteId: record.linkedNoteId }, { title: record.title, status: record.status });
  return record;
}

export async function createNoteFromInbox(id: string, input: InboxNoteConversionInput = {}): Promise<InboxItemRecord> {
  const workspaceId = await requireWorkspace();
  const { row, inboxId } = await getInboxRow(workspaceId, id);
  const parsed = parseInboxNoteConversion(input);
  const linkedProjectId = parsed.linkedProjectId ? (await validateProject(workspaceId, parsed.linkedProjectId)).id : null;
  const title = parsed.title || row.title.trim();
  if (!title) throw new Error("Document title is required");

  await db.transaction(async (tx) => {
    const [note] = await tx.insert(notes).values({
      workspaceId,
      title,
      content: row.content || row.title,
      noteType: "general",
      pinned: false,
      linkedProjectId,
      updatedAt: new Date(),
    }).returning({ id: notes.id });
    if (!note) throw new Error("Document could not be created from Inbox");
    await tx.update(inboxItems).set({ linkedProjectId, linkedNoteId: note.id, status: "converted", updatedAt: new Date() })
      .where(and(eq(inboxItems.id, inboxId), eq(inboxItems.workspaceId, workspaceId)));
  });
  revalidateInboxViews();
  const record = await getItemRecord(workspaceId, inboxId);
  await recordActivity(workspaceId, "inbox.processed", { inboxItemId: record.id, projectId: record.linkedProjectId, taskId: record.linkedTaskId, noteId: record.linkedNoteId }, { title: record.title, status: record.status });
  return record;
}
