import { eq } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { workspaceMembers, workspaces } from "@/lib/db/schema";

export async function getUserWorkspace(userId: string) {
  const memberships = await db
    .select({
      workspaceId: workspaceMembers.workspaceId,
      role: workspaceMembers.role,
    })
    .from(workspaceMembers)
    .where(eq(workspaceMembers.userId, userId))
    .limit(1);

  if (memberships.length === 0) return null;

  const workspace = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.id, memberships[0].workspaceId))
    .limit(1);

  return workspace[0] ?? null;
}

export async function ensureDefaultWorkspace(userId: string) {
  const existing = await getUserWorkspace(userId);

  if (existing) return existing;

  const [workspace] = await db
    .insert(workspaces)
    .values({
      name: "My Workspace",
      ownerId: userId,
    })
    .returning();

  await db.insert(workspaceMembers).values({
    workspaceId: workspace.id,
    userId,
    role: "owner",
  });

  return workspace;
}
