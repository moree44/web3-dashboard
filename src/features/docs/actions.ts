"use server";

import { revalidatePath } from "next/cache";
import { and, asc, desc, eq } from "drizzle-orm";
import { z } from "zod";

import { recordActivity } from "@/features/activity/activity-log";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { docsFolders, inboxItems, notes, projects } from "@/lib/db/schema";
import { ensureDefaultWorkspace } from "@/lib/db/workspace";

import { parseDocsFolderInput, parseDocsNoteInput } from "./docs-schema";
import type {
  DocsFolderInput,
  DocsFolderRecord,
  DocsFolderUpdateResult,
  DocsNoteInput,
  DocsNoteRecord,
  DocsPageData,
} from "./docs-types";
import { DEFAULT_NOTE_FOLDERS } from "./docs-types";

async function requireWorkspace() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  return (await ensureDefaultWorkspace(user.id)).id;
}

function revalidateDocsViews() {
  for (const path of ["/docs", "/"]) revalidatePath(path);
}

function hasPostgresCode(error: unknown, code: string): boolean {
  let current: unknown = error;
  const visited = new Set<unknown>();

  while (current && typeof current === "object" && !visited.has(current)) {
    visited.add(current);
    if ("code" in current && current.code === code) return true;
    current = "cause" in current ? current.cause : undefined;
  }

  return false;
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
    folder: row.folder?.trim() || null,
    pinned: Boolean(row.pinned),
    linkedProjectId: row.linkedProjectId,
    linkedProjectName: row.linkedProjectName,
    createdAt: row.createdAt?.toISOString() ?? null,
    updatedAt: row.updatedAt?.toISOString() ?? null,
  };
}

function toFolderRecord(row: typeof docsFolders.$inferSelect): DocsFolderRecord {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    sortOrder: row.sortOrder,
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

async function getFolderRows(workspaceId: string) {
  return db.select().from(docsFolders)
    .where(eq(docsFolders.workspaceId, workspaceId))
    .orderBy(asc(docsFolders.sortOrder), asc(docsFolders.name));
}

async function ensureDefaultDocsFolders(workspaceId: string) {
  const [existing] = await db.select({ id: docsFolders.id }).from(docsFolders)
    .where(eq(docsFolders.workspaceId, workspaceId))
    .limit(1);
  if (existing) return;

  await db.insert(docsFolders).values(DEFAULT_NOTE_FOLDERS.map((folder, index) => ({
    workspaceId,
    name: folder.name,
    description: folder.description,
    sortOrder: index,
  }))).onConflictDoNothing();
}

async function ensureFolderName(workspaceId: string, name: string) {
  const folderName = name.trim();
  if (!folderName) return;
  await db.insert(docsFolders).values({
    workspaceId,
    name: folderName,
    description: null,
    sortOrder: DEFAULT_NOTE_FOLDERS.length,
  }).onConflictDoNothing();
}

async function ensureFoldersForNotes(workspaceId: string, noteRows: Awaited<ReturnType<typeof getRecords>>) {
  const names = Array.from(new Set(noteRows.map((note) => note.folder?.trim()).filter((name): name is string => Boolean(name))));
  if (!names.length) return;
  await db.insert(docsFolders).values(names.map((name, index) => ({
    workspaceId,
    name,
    description: null,
    sortOrder: DEFAULT_NOTE_FOLDERS.length + index,
  }))).onConflictDoNothing();
}

export async function getDocsPageData(): Promise<DocsPageData> {
  const workspaceId = await requireWorkspace();
  await ensureDefaultDocsFolders(workspaceId);
  const [noteRows, projectRows] = await Promise.all([
    getRecords(workspaceId),
    db.select({ id: projects.id, name: projects.name }).from(projects)
      .where(and(eq(projects.workspaceId, workspaceId), eq(projects.isArchived, false))).orderBy(asc(projects.name)),
  ]);
  await ensureFoldersForNotes(workspaceId, noteRows);
  const folderRows = await getFolderRows(workspaceId);
  return { notes: noteRows.map(toRecord), projects: projectRows, folders: folderRows.map(toFolderRecord) };
}

export async function createDocsFolder(input: DocsFolderInput): Promise<DocsFolderRecord> {
  const workspaceId = await requireWorkspace();
  const parsed = parseDocsFolderInput(input);
  const [orderRow] = await db.select({ sortOrder: docsFolders.sortOrder }).from(docsFolders)
    .where(eq(docsFolders.workspaceId, workspaceId))
    .orderBy(desc(docsFolders.sortOrder))
    .limit(1);

  try {
    const [created] = await db.insert(docsFolders).values({
      workspaceId,
      name: parsed.name,
      description: parsed.description?.trim() || null,
      sortOrder: (orderRow?.sortOrder ?? -1) + 1,
      updatedAt: new Date(),
    }).returning();
    if (!created) throw new Error("Folder could not be created");
    revalidateDocsViews();
    await recordActivity(workspaceId, "note_folder.created", {}, { name: created.name });
    return toFolderRecord(created);
  } catch (error) {
    if (hasPostgresCode(error, "23505")) throw new Error("A folder with this name already exists");
    throw error;
  }
}

export async function deleteDocsFolder(id: string): Promise<void> {
  const workspaceId = await requireWorkspace();
  const folderId = z.string().uuid().parse(id);

  const [folder] = await db.select().from(docsFolders)
    .where(and(eq(docsFolders.id, folderId), eq(docsFolders.workspaceId, workspaceId)))
    .limit(1);
  if (!folder) throw new Error("Folder not found");

  const [usedNote] = await db.select({ id: notes.id }).from(notes)
    .where(and(eq(notes.workspaceId, workspaceId), eq(notes.folder, folder.name)))
    .limit(1);
  if (usedNote) throw new Error("Move or unfile documents before deleting this folder");

  const [deleted] = await db.delete(docsFolders)
    .where(and(eq(docsFolders.id, folderId), eq(docsFolders.workspaceId, workspaceId)))
    .returning({ id: docsFolders.id });
  if (!deleted) throw new Error("Folder not found");

  revalidateDocsViews();
  await recordActivity(workspaceId, "note_folder.deleted", {}, { name: folder.name });
}

export async function updateDocsFolder(id: string, input: DocsFolderInput): Promise<DocsFolderUpdateResult> {
  const workspaceId = await requireWorkspace();
  const folderId = z.string().uuid().parse(id);
  const parsed = parseDocsFolderInput(input);

  try {
    const result = await db.transaction(async (tx) => {
      const [current] = await tx.select().from(docsFolders)
        .where(and(eq(docsFolders.id, folderId), eq(docsFolders.workspaceId, workspaceId)))
        .limit(1);
      if (!current) throw new Error("Folder not found");

      const [updated] = await tx.update(docsFolders).set({
        name: parsed.name,
        description: parsed.description?.trim() || null,
        updatedAt: new Date(),
      }).where(and(eq(docsFolders.id, folderId), eq(docsFolders.workspaceId, workspaceId))).returning();
      if (!updated) throw new Error("Folder not found");

      if (current.name !== updated.name) {
        await tx.update(notes).set({ folder: updated.name, updatedAt: new Date() })
          .where(and(eq(notes.workspaceId, workspaceId), eq(notes.folder, current.name)));
      }

      return { folder: updated, previousName: current.name };
    });

    revalidateDocsViews();
    await recordActivity(workspaceId, "note_folder.updated", {}, { name: result.folder.name, previousName: result.previousName });
    return { folder: toFolderRecord(result.folder), previousName: result.previousName };
  } catch (error) {
    if (hasPostgresCode(error, "23505")) throw new Error("A folder with this name already exists");
    throw error;
  }
}

export async function createDocsNote(input: DocsNoteInput): Promise<DocsNoteRecord> {
  const workspaceId = await requireWorkspace();
  const parsed = parseDocsNoteInput(input);
  const linkedProjectId = await validateProjectLink(workspaceId, parsed.linkedProjectId);
  if (parsed.folder) await ensureFolderName(workspaceId, parsed.folder);
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
  if (parsed.folder) await ensureFolderName(workspaceId, parsed.folder);
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
  await db.transaction(async (tx) => {
    await tx.update(inboxItems).set({ linkedNoteId: null }).where(eq(inboxItems.linkedNoteId, noteId));
    const [deleted] = await tx.delete(notes).where(and(eq(notes.id, noteId), eq(notes.workspaceId, workspaceId))).returning({ id: notes.id });
    if (!deleted) throw new Error("Document not found");
  });
  await recordActivity(workspaceId, "note.deleted", {}, { id: noteId });
  revalidateDocsViews();
}
