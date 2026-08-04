import { cache } from "react";
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

export const ensureDefaultWorkspace = cache(async (userId: string, workspaceName = "My Workspace") => {
  const existing = await getUserWorkspace(userId);

  if (existing) return existing;

  return db.transaction(async (tx) => {
    const memberships = await tx
      .select({ workspaceId: workspaceMembers.workspaceId })
      .from(workspaceMembers)
      .where(eq(workspaceMembers.userId, userId))
      .limit(1);

    if (memberships.length > 0) {
      const [workspace] = await tx
        .select()
        .from(workspaces)
        .where(eq(workspaces.id, memberships[0].workspaceId))
        .limit(1);

      if (workspace) return workspace;
    }

    const [workspace] = await tx
      .insert(workspaces)
      .values({ name: workspaceName, ownerId: userId })
      .returning();

    await tx.insert(workspaceMembers).values({
      workspaceId: workspace.id,
      userId,
      role: "owner",
    });

    return workspace;
  });
});
