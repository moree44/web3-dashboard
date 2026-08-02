"use server";

import { desc, eq } from "drizzle-orm";

import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { activityLogs } from "@/lib/db/schema";
import { ensureDefaultWorkspace } from "@/lib/db/workspace";

export type ActivityRecord = {
  id: string;
  action: string;
  metadata: Record<string, unknown>;
  createdAt: string | null;
};

async function requireWorkspace() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  return (await ensureDefaultWorkspace(user.id)).id;
}

export async function getRecentActivity(limit = 8): Promise<ActivityRecord[]> {
  const workspaceId = await requireWorkspace();
  const safeLimit = Math.max(1, Math.min(limit, 30));
  const rows = await db
    .select({ id: activityLogs.id, action: activityLogs.action, metadata: activityLogs.metadata, createdAt: activityLogs.createdAt })
    .from(activityLogs)
    .where(eq(activityLogs.workspaceId, workspaceId))
    .orderBy(desc(activityLogs.createdAt))
    .limit(safeLimit);

  return rows.map((row) => ({
    id: row.id,
    action: row.action,
    metadata: row.metadata && typeof row.metadata === "object" ? row.metadata as Record<string, unknown> : {},
    createdAt: row.createdAt?.toISOString() ?? null,
  }));
}
