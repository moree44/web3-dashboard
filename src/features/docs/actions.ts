"use server";

import { revalidatePath } from "next/cache";
import { and, asc, desc, eq } from "drizzle-orm";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { notes, projects } from "@/lib/db/schema";
import { ensureDefaultWorkspace } from "@/lib/db/workspace";
import { recordActivity } from "@/features/activity/activity-log";

import { parseDocsNoteInput } from "./docs-schema";
import type { DocsNoteInput, DocsNoteRecord, DocsPageData } from "./docs-types";

async function requireWorkspace() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  return (await ensureDefaultWorkspace(user.id)).id;
}

function revalidateDocsViews() {
  for (const path of ["/docs", "/"]) revalidatePath(path);
}

async function validateProjectLink(workspaceId: string, projectId: string | null | undefined) {
  if (!projectId) return null;
  const [project] = await db.select({ id: projects.id }).from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.workspaceId, workspaceId), eq(projects.isArchived, false))).limit(1);
  if (!project) throw new Error("Linked project not found");
  return project.id;
}

function toRecord(row: {
  id: string;
  title: string | null;
  content: string | null;
  noteType: string | null;
  folder: string | null;
  pinned: boolean | null;
  linkedProjectId: string | null;
  linkedProjectName: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}): DocsNoteRecord {
  return {
    id: row.id,
    title: row.title?.trim() || "Untitled document",
    content: row.content ?? "",
    noteType: (row.noteType ?? "general") as DocsNoteRecord["noteType"],
    folder: row.folder as DocsNoteRecord["folder"],
    pinned: Boolean(row.pinned),
    linkedProjectId: row.linkedProjectId,
    linkedProjectName: row.linkedProjectName,
    createdAt: row.createdAt?.toISOString() ?? null,
    updatedAt: row.updatedAt?.toISOString() ?? null,
  };
}

async function getRecords(workspaceId: string) {
  return db.select({
    id: notes.id, title: notes.title, content: notes.content, noteType: notes.noteType, folder: notes.folder,
    pinned: notes.pinned, linkedProjectId: notes.linkedProjectId, linkedProjectName: projects.name,
    createdAt: notes.createdAt, updatedAt: notes.updatedAt,
  }).from(notes).leftJoin(projects, eq(notes.linkedProjectId, projects.id))
    .where(eq(notes.workspaceId, workspaceId)).orderBy(desc(notes.pinned), desc(notes.updatedAt));
}

export async function getDocsPageData(): Promise<DocsPageData> {
  const workspaceId = await requireWorkspace();
  const [noteRows, projectRows] = await Promise.all([
    getRecords(workspaceId),
    db.select({ id: projects.id, name: projects.name }).from(projects)
      .where(and(eq(projects.workspaceId, workspaceId), eq(projects.isArchived, false))).orderBy(asc(projects.name)),
  ]);
  return { notes: noteRows.map(toRecord), projects: projectRows };
}

export async function createDocsNote(input: DocsNoteInput): Promise<DocsNoteRecord> {
  const workspaceId = await requireWorkspace();
  const parsed = parseDocsNoteInput(input);
  const linkedProjectId = await validateProjectLink(workspaceId, parsed.linkedProjectId);
  const [created] = await db.insert(notes).values({
    workspaceId, title: parsed.title, content: parsed.content?.trim() || null, noteType: parsed.noteType,
    folder: parsed.folder ?? null, pinned: parsed.pinned, linkedProjectId, updatedAt: new Date(),
  }).returning({ id: notes.id });
  if (!created) throw new Error("Document could not be created");
  revalidateDocsViews();
  const record = (await getRecords(workspaceId)).find((note) => note.id === created.id);
  if (!record) throw new Error("Document could not be loaded after creation");
  await recordActivity(workspaceId, "note.created", { noteId: created.id }, { title: record.title });
  return toRecord(record);
}

export async function updateDocsNote(id: string, input: DocsNoteInput): Promise<DocsNoteRecord> {
  const workspaceId = await requireWorkspace();
  const noteId = z.string().uuid().parse(id);
  const parsed = parseDocsNoteInput(input);
  const linkedProjectId = await validateProjectLink(workspaceId, parsed.linkedProjectId);
  const [updated] = await db.update(notes).set({
    title: parsed.title, content: parsed.content?.trim() || null, noteType: parsed.noteType,
    folder: parsed.folder ?? null, pinned: parsed.pinned, linkedProjectId, updatedAt: new Date(),
  }).where(and(eq(notes.id, noteId), eq(notes.workspaceId, workspaceId))).returning({ id: notes.id });
  if (!updated) throw new Error("Document not found");
  revalidateDocsViews();
  const record = (await getRecords(workspaceId)).find((note) => note.id === noteId);
  if (!record) throw new Error("Document could not be loaded after update");
  await recordActivity(workspaceId, "note.updated", { noteId: noteId }, { title: record.title });
  return toRecord(record);
}

export async function deleteDocsNote(id: string): Promise<void> {
  const workspaceId = await requireWorkspace();
  const noteId = z.string().uuid().parse(id);
  const [deleted] = await db.delete(notes).where(and(eq(notes.id, noteId), eq(notes.workspaceId, workspaceId))).returning({ id: notes.id });
  if (!deleted) throw new Error("Document not found");
  await recordActivity(workspaceId, "note.deleted", {}, { id: noteId });
  revalidateDocsViews();
}
