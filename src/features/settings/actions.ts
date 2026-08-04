"use server";

import { revalidatePath } from "next/cache";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db/client";
import { accounts, projects, workspaces } from "@/lib/db/schema";
import { ensureDefaultWorkspace } from "@/lib/db/workspace";

export type SettingsData = {
  username: string;
  displayName: string;
  workspaceName: string;
  projectCount: number;
  accountCount: number;
};

const settingsSchema = z.object({
  displayName: z.string().trim().min(1, "Display name is required").max(80),
  workspaceName: z.string().trim().min(1, "Workspace name is required").max(120),
});

async function requireSettingsContext() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  const workspace = await ensureDefaultWorkspace(user.id);
  return { user, workspace };
}

export async function getSettingsData(): Promise<SettingsData> {
  const { user, workspace } = await requireSettingsContext();
  const [projectCount, accountCount] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(projects).where(and(eq(projects.workspaceId, workspace.id), eq(projects.isArchived, false))),
    db.select({ count: sql<number>`count(*)::int` }).from(accounts).where(eq(accounts.workspaceId, workspace.id)),
  ]);
  const username = typeof user.user_metadata?.username === "string" ? user.user_metadata.username : user.email?.split("@")[0] ?? "user";
  const displayName = typeof user.user_metadata?.display_name === "string" ? user.user_metadata.display_name : username;
  return {
    username,
    displayName,
    workspaceName: workspace.name,
    projectCount: projectCount[0]?.count ?? 0,
    accountCount: accountCount[0]?.count ?? 0,
  };
}

export async function updateSettings(input: unknown): Promise<SettingsData> {
  const { user, workspace } = await requireSettingsContext();
  const parsed = settingsSchema.parse(input);
  const [updatedWorkspace] = await db.update(workspaces)
    .set({ name: parsed.workspaceName, updatedAt: new Date() })
    .where(and(eq(workspaces.id, workspace.id), eq(workspaces.ownerId, user.id)))
    .returning({ name: workspaces.name });
  if (!updatedWorkspace) throw new Error("Only the workspace owner can update workspace settings");

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ data: { display_name: parsed.displayName } });
  if (error) throw new Error("Profile settings could not be saved");

  revalidatePath("/settings");
  return getSettingsData();
}
