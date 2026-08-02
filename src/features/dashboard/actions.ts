"use server";

import { and, desc, eq, inArray } from "drizzle-orm";

import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { activityLogs, inboxItems, notes } from "@/lib/db/schema";
import { ensureDefaultWorkspace } from "@/lib/db/workspace";

export type DashboardInboxItem = {
  id?: string;
  title: string
  meta: string;
  badge: string;
  variant: "warning" | "info" | "destructive" | "secondary";
};

export type DashboardNoteItem = {
  id?: string;
  title: string;
  meta: string;
};

export type DashboardActivityItem = {
  id?: string;
  text: string;
  time: string;
};

export type DashboardData = {
  inboxItems: DashboardInboxItem[];
  pinnedNotes: DashboardNoteItem[];
  recentNotes: DashboardNoteItem[];
  recentActivity: DashboardActivityItem[];
};

async function requireWorkspace() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  return (await ensureDefaultWorkspace(user.id)).id;
}

function relativeTime(value: Date | null) {
  if (!value) return "now";
  const seconds = Math.max(0, Math.floor((Date.now() - value.getTime()) / 1000));
  if (seconds < 60) return "now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

function activitySubject(metadata: unknown) {
  if (!metadata || typeof metadata !== "object") return "";
  const values = metadata as Record<string, unknown>;
  const subject = values.title ?? values.name ?? values.label;
  return typeof subject === "string" && subject.trim() ? subject.trim() : "";
}

function activityText(action: string, metadata: unknown) {
  const labels: Record<string, string> = {
    "account.created": "Created account",
    "account.updated": "Updated account",
    "account.deleted": "Deleted account",
    "wallet.created": "Created wallet",
    "wallet.updated": "Updated wallet",
    "wallet.deleted": "Deleted wallet",
    "wallet_group.created": "Created wallet group",
    "wallet_group.updated": "Updated wallet group",
    "wallet_group.deleted": "Deleted wallet group",
    "project.created": "Created project",
    "project.updated": "Updated project",
    "project.archived": "Archived project",
    "project.restored": "Restored project",
    "project.deleted": "Deleted project",
    "task.created": "Created task",
    "task.updated": "Updated task",
    "task.status_changed": "Changed task status",
    "task.deleted": "Deleted task",
    "task_log.updated": "Updated task log",
    "deadline.created": "Created deadline",
    "deadline.updated": "Updated deadline",
    "deadline.deleted": "Deleted deadline",
    "nft_campaign.created": "Created NFT campaign",
    "nft_campaign.updated": "Updated NFT campaign",
    "nft_campaign.deleted": "Deleted NFT campaign",
    "inbox.created": "Captured Inbox item",
    "inbox.updated": "Updated Inbox item",
    "inbox.processed": "Processed Inbox item",
    "note.created": "Created Doc",
    "note.updated": "Updated Doc",
    "note.deleted": "Deleted Doc",
  };
  const label = labels[action] ?? action.replaceAll(".", " ");
  const subject = activitySubject(metadata);
  return subject ? `${label}: ${subject}` : label;
}

export async function getDashboardData(): Promise<DashboardData> {
  const workspaceId = await requireWorkspace();
  const [inboxRows, pinnedRows, recentRows, activityRows] = await Promise.all([
    db.select({ id: inboxItems.id, title: inboxItems.title, source: inboxItems.source, status: inboxItems.status, updatedAt: inboxItems.updatedAt })
      .from(inboxItems)
      .where(and(eq(inboxItems.workspaceId, workspaceId), inArray(inboxItems.status, ["new", "reviewing"])))
      .orderBy(desc(inboxItems.updatedAt), desc(inboxItems.createdAt))
      .limit(4),
    db.select({ id: notes.id, title: notes.title, folder: notes.folder, updatedAt: notes.updatedAt })
      .from(notes)
      .where(and(eq(notes.workspaceId, workspaceId), eq(notes.pinned, true)))
      .orderBy(desc(notes.updatedAt))
      .limit(4),
    db.select({ id: notes.id, title: notes.title, folder: notes.folder, updatedAt: notes.updatedAt })
      .from(notes)
      .where(eq(notes.workspaceId, workspaceId))
      .orderBy(desc(notes.updatedAt))
      .limit(4),
    db.select({ id: activityLogs.id, action: activityLogs.action, metadata: activityLogs.metadata, createdAt: activityLogs.createdAt })
      .from(activityLogs)
      .where(eq(activityLogs.workspaceId, workspaceId))
      .orderBy(desc(activityLogs.createdAt))
      .limit(5),
  ]);

  return {
    inboxItems: inboxRows.map((row) => ({
      id: row.id,
      title: row.title,
      meta: row.source === "quick_capture" ? "Quick capture" : "Manual capture",
      badge: row.status === "reviewing" ? "Process" : "Review",
      variant: row.status === "reviewing" ? "info" : "warning",
    })),
    pinnedNotes: pinnedRows.map((row) => ({
      id: row.id,
      title: row.title?.trim() || "Untitled document",
      meta: `${row.folder || "General"} · pinned`,
    })),
    recentNotes: recentRows.map((row) => ({
      id: row.id,
      title: row.title?.trim() || "Untitled document",
      meta: `Updated ${relativeTime(row.updatedAt)} ago`,
    })),
    recentActivity: activityRows.map((row) => ({
      id: row.id,
      text: activityText(row.action, row.metadata),
      time: relativeTime(row.createdAt),
    })),
  };
}
