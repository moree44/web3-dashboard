import { db } from "@/lib/db/client";
import { activityLogs } from "@/lib/db/schema";

export type ActivityTarget = {
  projectId?: string | null;
  taskId?: string | null;
  accountId?: string | null;
  walletId?: string | null;
  inboxItemId?: string | null;
  noteId?: string | null;
};

export async function recordActivity(
  workspaceId: string,
  action: string,
  target: ActivityTarget = {},
  metadata: Record<string, unknown> = {},
): Promise<void> {
  try {
    await db.insert(activityLogs).values({
      workspaceId,
      action,
      ...target,
      metadata,
    });
  } catch (error) {
    console.error("Activity log write failed", error);
  }
}
