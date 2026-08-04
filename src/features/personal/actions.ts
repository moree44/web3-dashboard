"use server";

import { revalidatePath } from "next/cache";
import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";

import { recordActivity } from "@/features/activity/activity-log";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { ensureDefaultWorkspace } from "@/lib/db/workspace";
import { personalItems } from "@/lib/db/schema";
import { PERSONAL_FREQUENCIES, PERSONAL_STATUSES, type PersonalFrequency, type PersonalItemRecord, type PersonalStatus } from "./types";

const personalInputSchema = z.object({
  title: z.string().trim().min(1, "Personal item title is required").max(180),
  frequency: z.enum(PERSONAL_FREQUENCIES).default("once"),
  note: z.string().trim().max(5000).nullable().optional(),
});

function toRecord(row: typeof personalItems.$inferSelect): PersonalItemRecord {
  return {
    id: row.id,
    title: row.title,
    frequency: row.frequency as PersonalFrequency,
    status: row.status as PersonalStatus,
    note: row.note,
    createdAt: row.createdAt?.toISOString() ?? null,
    updatedAt: row.updatedAt?.toISOString() ?? null,
  };
}

async function requireWorkspace() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  return (await ensureDefaultWorkspace(user.id)).id;
}

function revalidatePersonalViews() {
  revalidatePath("/tasks");
  revalidatePath("/daily");
}

export async function getPersonalItems(): Promise<PersonalItemRecord[]> {
  const workspaceId = await requireWorkspace();
  const rows = await db.select().from(personalItems)
    .where(eq(personalItems.workspaceId, workspaceId))
    .orderBy(asc(personalItems.status), asc(personalItems.createdAt));
  return rows.map(toRecord);
}

export async function createPersonalItem(input: unknown): Promise<PersonalItemRecord> {
  const workspaceId = await requireWorkspace();
  const parsed = personalInputSchema.parse(input);
  const [created] = await db.insert(personalItems).values({
    workspaceId,
    title: parsed.title,
    frequency: parsed.frequency,
    status: "todo",
    note: parsed.note || null,
    updatedAt: new Date(),
  }).returning();
  revalidatePersonalViews();
  await recordActivity(workspaceId, "personal_item.created", {}, { title: created.title, personalItemId: created.id });
  return toRecord(created);
}

export async function updatePersonalItem(id: string, input: unknown): Promise<PersonalItemRecord> {
  const workspaceId = await requireWorkspace();
  const itemId = z.string().uuid().parse(id);
  const parsed = personalInputSchema.parse(input);
  const [updated] = await db.update(personalItems).set({
    title: parsed.title,
    frequency: parsed.frequency,
    note: parsed.note || null,
    updatedAt: new Date(),
  }).where(and(eq(personalItems.id, itemId), eq(personalItems.workspaceId, workspaceId))).returning();
  if (!updated) throw new Error("Personal item not found");
  revalidatePersonalViews();
  await recordActivity(workspaceId, "personal_item.updated", {}, { title: updated.title, personalItemId: updated.id });
  return toRecord(updated);
}

export async function updatePersonalItemStatus(id: string, status: PersonalStatus): Promise<PersonalItemRecord> {
  const workspaceId = await requireWorkspace();
  const itemId = z.string().uuid().parse(id);
  const nextStatus = z.enum(PERSONAL_STATUSES).parse(status);
  const [updated] = await db.update(personalItems).set({ status: nextStatus, updatedAt: new Date() })
    .where(and(eq(personalItems.id, itemId), eq(personalItems.workspaceId, workspaceId))).returning();
  if (!updated) throw new Error("Personal item not found");
  revalidatePersonalViews();
  await recordActivity(workspaceId, "personal_item.status_changed", {}, { title: updated.title, personalItemId: updated.id, status: updated.status });
  return toRecord(updated);
}

export async function deletePersonalItem(id: string): Promise<void> {
  const workspaceId = await requireWorkspace();
  const itemId = z.string().uuid().parse(id);
  const [deleted] = await db.delete(personalItems).where(and(eq(personalItems.id, itemId), eq(personalItems.workspaceId, workspaceId))).returning({ id: personalItems.id, title: personalItems.title });
  if (!deleted) throw new Error("Personal item not found");
  revalidatePersonalViews();
  await recordActivity(workspaceId, "personal_item.deleted", {}, { title: deleted.title, personalItemId: deleted.id });
}
