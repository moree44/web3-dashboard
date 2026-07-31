"use server";

import { revalidatePath } from "next/cache";
import {
  and,
  asc,
  desc,
  eq,
  isNull,
  notInArray,
  or,
} from "drizzle-orm";

import {
  parseDeadlineInput,
  parseDeadlineUpdate,
  type DeadlineInput,
  type DeadlineUpdateInput,
} from "./deadline-schema";
import { compareDeadlineDates } from "./deadline-utils";

import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { deadlines, nftCampaigns, projects, tasks } from "@/lib/db/schema";
import { ensureDefaultWorkspace } from "@/lib/db/workspace";

export type DeadlineWithContext = typeof deadlines.$inferSelect & {
  linkedProjectName: string | null;
  linkedTaskTitle: string | null;
  linkedNftCampaignName: string | null;
};

export type UpcomingDeadlineItem = {
  id: string;
  source: "deadline";
  title: string;
  context: string;
  dueDate: string;
  dueTime: string | null;
  url: string | null;
  linkedProjectId: string | null;
  linkedTaskId: string | null;
  linkedNftCampaignId: string | null;
};

export type DeadlineProjectOption = {
  id: string;
  name: string;
};

export type DeadlineTaskOption = {
  id: string;
  title: string;
  projectId: string | null;
  projectName: string | null;
};

export type DeadlineOptions = {
  projects: DeadlineProjectOption[];
  tasks: DeadlineTaskOption[];
};

export type DeadlinePageData = {
  deadlines: DeadlineWithContext[];
  options: DeadlineOptions;
};

async function requireWorkspace() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  const workspace = await ensureDefaultWorkspace(user.id);
  return { workspaceId: workspace.id };
}

function revalidateDeadlineViews() {
  for (const path of ["/", "/deadlines", "/tasks", "/daily", "/nfts"]) {
    revalidatePath(path);
  }
}

async function getDeadlineRecords(workspaceId: string) {
  return db
    .select({
      id: deadlines.id,
      workspaceId: deadlines.workspaceId,
      title: deadlines.title,
      notes: deadlines.notes,
      url: deadlines.url,
      dueDate: deadlines.dueDate,
      dueTime: deadlines.dueTime,
      status: deadlines.status,
      linkedProjectId: deadlines.linkedProjectId,
      linkedTaskId: deadlines.linkedTaskId,
      linkedNftCampaignId: deadlines.linkedNftCampaignId,
      createdAt: deadlines.createdAt,
      updatedAt: deadlines.updatedAt,
      linkedProjectName: projects.name,
      linkedTaskTitle: tasks.title,
      linkedNftCampaignName: nftCampaigns.name,
    })
    .from(deadlines)
    .leftJoin(projects, eq(deadlines.linkedProjectId, projects.id))
    .leftJoin(tasks, eq(deadlines.linkedTaskId, tasks.id))
    .leftJoin(nftCampaigns, eq(deadlines.linkedNftCampaignId, nftCampaigns.id))
    .where(eq(deadlines.workspaceId, workspaceId))
    .orderBy(asc(deadlines.dueDate), asc(deadlines.dueTime), desc(deadlines.updatedAt));
}

async function getOptions(workspaceId: string): Promise<DeadlineOptions> {
  const [projectOptions, taskOptions] = await Promise.all([
    db
      .select({ id: projects.id, name: projects.name })
      .from(projects)
      .where(and(eq(projects.workspaceId, workspaceId), eq(projects.isArchived, false)))
      .orderBy(asc(projects.name)),
    db
      .select({
        id: tasks.id,
        title: tasks.title,
        projectId: tasks.projectId,
        projectName: projects.name,
      })
      .from(tasks)
      .leftJoin(projects, eq(tasks.projectId, projects.id))
      .where(
        and(
          eq(tasks.workspaceId, workspaceId),
          or(isNull(tasks.status), notInArray(tasks.status, ["done", "dropped"])),
          or(isNull(projects.id), eq(projects.isArchived, false)),
        ),
      )
      .orderBy(asc(tasks.title)),
  ]);

  return { projects: projectOptions, tasks: taskOptions };
}

function toUpcomingItems(deadlineRows: DeadlineWithContext[]) {
  const deadlineItems: UpcomingDeadlineItem[] = deadlineRows
    .filter((item) => item.status === "upcoming")
    .map((item) => ({
      id: item.id,
      source: "deadline",
      title: item.title,
      context: item.linkedTaskTitle ?? item.linkedProjectName ?? item.linkedNftCampaignName ?? item.notes ?? "Standalone deadline",
      dueDate: item.dueDate,
      dueTime: item.dueTime,
      url: item.url,
      linkedProjectId: item.linkedProjectId,
      linkedTaskId: item.linkedTaskId,
      linkedNftCampaignId: item.linkedNftCampaignId,
    }));

  return deadlineItems.sort(compareDeadlineDates);
}

export async function getDeadlinePageData(): Promise<DeadlinePageData> {
  const { workspaceId } = await requireWorkspace();
  const [deadlineRows, options] = await Promise.all([
    getDeadlineRecords(workspaceId),
    getOptions(workspaceId),
  ]);

  return {
    deadlines: deadlineRows,
    options,
  };
}

export async function getDashboardDeadlineData(limit = 8) {
  const { workspaceId } = await requireWorkspace();
  const [deadlineRows, options] = await Promise.all([
    getDeadlineRecords(workspaceId),
    getOptions(workspaceId),
  ]);

  const upcomingItems = toUpcomingItems(deadlineRows);

  return {
    items: upcomingItems.slice(0, limit),
    dueCount: upcomingItems.length,
    options,
  };
}

async function validateLinks(
  workspaceId: string,
  linkedProjectId: string | null | undefined,
  linkedTaskId: string | null | undefined,
) {
  let projectId = linkedProjectId || null;
  const taskId = linkedTaskId || null;

  if (projectId) {
    const [project] = await db
      .select({ id: projects.id })
      .from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.workspaceId, workspaceId)))
      .limit(1);
    if (!project) throw new Error("Selected project is unavailable");
  }

  if (taskId) {
    const [task] = await db
      .select({ id: tasks.id, projectId: tasks.projectId })
      .from(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.workspaceId, workspaceId)))
      .limit(1);
    if (!task) throw new Error("Selected task is unavailable");
    if (projectId && task.projectId && projectId !== task.projectId) {
      throw new Error("Selected task belongs to a different project");
    }
    projectId = projectId ?? task.projectId;
  }

  return { linkedProjectId: projectId, linkedTaskId: taskId };
}

function normalizeDeadlineValues<T extends DeadlineInput | DeadlineUpdateInput>(data: T) {
  return {
    ...data,
    ...(Object.prototype.hasOwnProperty.call(data, "dueTime")
      ? { dueTime: data.dueTime || null }
      : {}),
    ...(Object.prototype.hasOwnProperty.call(data, "url")
      ? { url: data.url || null }
      : {}),
    ...(Object.prototype.hasOwnProperty.call(data, "notes")
      ? { notes: data.notes || null }
      : {}),
  };
}

export async function createDeadline(data: DeadlineInput): Promise<DeadlineWithContext> {
  const { workspaceId } = await requireWorkspace();
  const parsed = parseDeadlineInput(data);
  const links = await validateLinks(workspaceId, parsed.linkedProjectId, parsed.linkedTaskId);

  const [created] = await db
    .insert(deadlines)
    .values({
      ...normalizeDeadlineValues(parsed),
      ...links,
      workspaceId,
      updatedAt: new Date(),
    })
    .returning();

  revalidateDeadlineViews();
  const rows = await getDeadlineRecords(workspaceId);
  return rows.find((item) => item.id === created.id) ?? {
    ...created,
    linkedProjectName: null,
    linkedTaskTitle: null,
    linkedNftCampaignName: null,
  };
}

export async function updateDeadline(
  id: string,
  data: DeadlineUpdateInput,
): Promise<DeadlineWithContext> {
  const { workspaceId } = await requireWorkspace();
  const parsed = parseDeadlineUpdate(data);
  const [current] = await db
    .select()
    .from(deadlines)
    .where(and(eq(deadlines.id, id), eq(deadlines.workspaceId, workspaceId)))
    .limit(1);
  if (!current) throw new Error("Deadline not found");

  const hasProject = Object.prototype.hasOwnProperty.call(parsed, "linkedProjectId");
  const hasTask = Object.prototype.hasOwnProperty.call(parsed, "linkedTaskId");
  const links = await validateLinks(
    workspaceId,
    hasProject ? parsed.linkedProjectId : current.linkedProjectId,
    hasTask ? parsed.linkedTaskId : current.linkedTaskId,
  );

  const [updated] = await db
    .update(deadlines)
    .set({
      ...normalizeDeadlineValues(parsed),
      ...links,
      updatedAt: new Date(),
    })
    .where(and(eq(deadlines.id, id), eq(deadlines.workspaceId, workspaceId)))
    .returning();
  if (!updated) throw new Error("Deadline not found");

  revalidateDeadlineViews();
  const rows = await getDeadlineRecords(workspaceId);
  return rows.find((item) => item.id === updated.id) ?? {
    ...updated,
    linkedProjectName: null,
    linkedTaskTitle: null,
    linkedNftCampaignName: null,
  };
}

export async function deleteDeadline(id: string): Promise<void> {
  const { workspaceId } = await requireWorkspace();
  const deleted = await db
    .delete(deadlines)
    .where(and(eq(deadlines.id, id), eq(deadlines.workspaceId, workspaceId)))
    .returning({ id: deadlines.id });
  if (deleted.length === 0) throw new Error("Deadline not found");
  revalidateDeadlineViews();
}
