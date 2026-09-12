"use server";

import { revalidatePath } from "next/cache";
import { and, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";

import { recordActivity } from "@/features/activity/activity-log";
import { getJakartaDateValue } from "@/features/tasks/task-duration";
import {
  buildNftFromWatchlist,
  buildProjectFromWatchlist,
} from "@/features/watchlist/watchlist-conversion";
import {
  parseWatchlistConversion,
  parseWatchlistInput,
  parseWatchlistUpdate,
} from "@/features/watchlist/watchlist-schema";
import type {
  WatchlistConversionInput,
  WatchlistConversionResult,
  WatchlistInput,
  WatchlistItemRecord,
  WatchlistPageData,
  WatchlistStatus,
} from "@/features/watchlist/watchlist-types";
import { fetchWatchlistXProfile } from "@/features/watchlist/x-profile-metadata";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { nftCampaigns, projectWatchlistItems, projects } from "@/lib/db/schema";
import { ensureDefaultWorkspace } from "@/lib/db/workspace";

async function requireWorkspace() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  return (await ensureDefaultWorkspace(user.id)).id;
}

function revalidateWatchlistViews(paths: readonly string[] = ["/", "/watchlist"]) {
  for (const path of paths) revalidatePath(path);
}

function cleanOptional(value: string | null | undefined) {
  const cleaned = value?.trim();
  return cleaned || null;
}

function toRecord(row: typeof projectWatchlistItems.$inferSelect): WatchlistItemRecord {
  return {
    id: row.id,
    name: row.name,
    xUrl: row.xUrl,
    thesis: row.thesis,
    chain: row.chain,
    projectTypes: row.projectTypes,
    itemKind: row.itemKind,
    status: row.status,
    convertedProjectId: row.convertedProjectId,
    convertedNftCampaignId: row.convertedNftCampaignId,
    createdAt: row.createdAt?.toISOString() ?? null,
    updatedAt: row.updatedAt?.toISOString() ?? null,
  };
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

async function getWatchlistRow(workspaceId: string, id: string) {
  const watchlistId = z.string().uuid().parse(id);
  const [row] = await db
    .select()
    .from(projectWatchlistItems)
    .where(and(
      eq(projectWatchlistItems.id, watchlistId),
      eq(projectWatchlistItems.workspaceId, workspaceId),
    ))
    .limit(1);
  if (!row) throw new Error("Watchlist item not found");
  return row;
}

export async function getWatchlistItems(
  status: WatchlistStatus = "active",
): Promise<WatchlistItemRecord[]> {
  const workspaceId = await requireWorkspace();
  const parsedStatus = z.enum(["active", "converted"] as const).parse(status);
  const rows = await db
    .select()
    .from(projectWatchlistItems)
    .where(and(
      eq(projectWatchlistItems.workspaceId, workspaceId),
      eq(projectWatchlistItems.status, parsedStatus),
    ))
    .orderBy(desc(projectWatchlistItems.updatedAt), desc(projectWatchlistItems.createdAt));
  return rows.map(toRecord);
}

export async function getWatchlistPageData(): Promise<WatchlistPageData> {
  const workspaceId = await requireWorkspace();
  const rows = await db
    .select()
    .from(projectWatchlistItems)
    .where(eq(projectWatchlistItems.workspaceId, workspaceId))
    .orderBy(desc(projectWatchlistItems.updatedAt), desc(projectWatchlistItems.createdAt));
  const records = rows.map(toRecord);

  return {
    activeItems: records.filter((item) => item.status === "active"),
    convertedItems: records.filter((item) => item.status === "converted"),
  };
}

export async function lookupWatchlistXProfile(xUrl: string) {
  await requireWorkspace();
  const parsed = parseWatchlistInput({ xUrl });
  const metadata = await fetchWatchlistXProfile(parsed.xUrl);

  return {
    name: metadata?.name ?? parsed.name,
    thesis: metadata?.thesis ?? "",
  };
}

export async function createWatchlistItem(input: WatchlistInput): Promise<WatchlistItemRecord> {
  const workspaceId = await requireWorkspace();
  const initial = parseWatchlistInput(input);
  const shouldEnrich = !input.name?.trim() && !input.thesis?.trim();
  const metadata = shouldEnrich
    ? await fetchWatchlistXProfile(initial.xUrl)
    : null;
  const parsed = {
    ...initial,
    name: metadata?.name ?? initial.name,
    thesis: metadata?.thesis ?? initial.thesis,
  };

  try {
    const [created] = await db
      .insert(projectWatchlistItems)
      .values({
        workspaceId,
        name: parsed.name,
        xUrl: parsed.xUrl,
        thesis: cleanOptional(parsed.thesis),
        chain: cleanOptional(parsed.chain),
        projectTypes: parsed.projectTypes,
        itemKind: parsed.itemKind,
        status: "active",
        updatedAt: new Date(),
      })
      .returning();
    if (!created) throw new Error("Watchlist item could not be created");

    const record = toRecord(created);
    revalidateWatchlistViews();
    await recordActivity(workspaceId, "watchlist.created", {}, {
      watchlistItemId: record.id,
      name: record.name,
    });
    return record;
  } catch (error) {
    if (hasPostgresCode(error, "23505")) {
      throw new Error("This X account is already in the active Watchlist");
    }
    throw error;
  }
}

export async function updateWatchlistItem(
  id: string,
  input: WatchlistInput,
): Promise<WatchlistItemRecord> {
  const workspaceId = await requireWorkspace();
  const watchlistId = z.string().uuid().parse(id);
  const parsed = parseWatchlistUpdate(input);

  try {
    const [updated] = await db
      .update(projectWatchlistItems)
      .set({
        name: parsed.name,
        xUrl: parsed.xUrl,
        thesis: cleanOptional(parsed.thesis),
        chain: cleanOptional(parsed.chain),
        projectTypes: parsed.projectTypes,
        itemKind: parsed.itemKind,
        updatedAt: new Date(),
      })
      .where(and(
        eq(projectWatchlistItems.id, watchlistId),
        eq(projectWatchlistItems.workspaceId, workspaceId),
        eq(projectWatchlistItems.status, "active"),
      ))
      .returning();
    if (!updated) throw new Error("Active Watchlist item not found");

    const record = toRecord(updated);
    revalidateWatchlistViews();
    await recordActivity(workspaceId, "watchlist.updated", {}, {
      watchlistItemId: record.id,
      name: record.name,
    });
    return record;
  } catch (error) {
    if (hasPostgresCode(error, "23505")) {
      throw new Error("This X account is already in the active Watchlist");
    }
    throw error;
  }
}

export async function deleteWatchlistItem(id: string): Promise<void> {
  const workspaceId = await requireWorkspace();
  const row = await getWatchlistRow(workspaceId, id);
  if (row.status === "converted") {
    throw new Error("Converted Watchlist history cannot be deleted");
  }
  const [deleted] = await db
    .delete(projectWatchlistItems)
    .where(and(
      eq(projectWatchlistItems.id, row.id),
      eq(projectWatchlistItems.workspaceId, workspaceId),
      eq(projectWatchlistItems.status, "active"),
    ))
    .returning({ id: projectWatchlistItems.id });
  if (!deleted) throw new Error("Watchlist item not found");

  revalidateWatchlistViews();
  await recordActivity(workspaceId, "watchlist.deleted", {}, {
    watchlistItemId: row.id,
    name: row.name,
  });
}

export async function convertWatchlistToProject(
  id: string,
  input: WatchlistConversionInput = {},
): Promise<WatchlistConversionResult> {
  const workspaceId = await requireWorkspace();
  const watchlistId = z.string().uuid().parse(id);
  const conversion = parseWatchlistConversion(input);

  try {
    const result = await db.transaction(async (tx) => {
      const [item] = await tx
        .select()
        .from(projectWatchlistItems)
        .where(and(
          eq(projectWatchlistItems.id, watchlistId),
          eq(projectWatchlistItems.workspaceId, workspaceId),
        ))
        .limit(1);
      if (!item) throw new Error("Watchlist item not found");
      if (item.itemKind !== "project") throw new Error("This Watchlist item is an NFT");

      if (item.status === "converted") {
        if (!item.convertedProjectId) {
          throw new Error("The converted Project no longer exists");
        }
        const [existingProject] = await tx
          .select({
            id: projects.id,
            name: projects.name,
            twitterUrl: projects.twitterUrl,
            description: projects.description,
            notes: projects.notes,
            chains: projects.chains,
            projectTypes: projects.projectTypes,
          })
          .from(projects)
          .where(and(
            eq(projects.id, item.convertedProjectId),
            eq(projects.workspaceId, workspaceId),
          ))
          .limit(1);
        if (!existingProject) throw new Error("The converted Project no longer exists");
        return { item, targetId: existingProject.id, targetName: existingProject.name, created: false };
      }

      const [duplicateProject] = await tx
        .select({ id: projects.id })
        .from(projects)
        .where(and(
          eq(projects.workspaceId, workspaceId),
          eq(projects.isArchived, false),
          sql`lower(trim(${projects.name})) = lower(trim(${item.name}))`,
        ))
        .limit(1);
      if (duplicateProject) {
        throw new Error("An active project with this name already exists");
      }

      const projectValues = buildProjectFromWatchlist(
        item,
        conversion,
        getJakartaDateValue(),
      );
      const [project] = await tx
        .insert(projects)
        .values({ ...projectValues, workspaceId, updatedAt: new Date() })
        .returning({
          id: projects.id,
          name: projects.name,
          twitterUrl: projects.twitterUrl,
          description: projects.description,
          notes: projects.notes,
          chains: projects.chains,
          projectTypes: projects.projectTypes,
        });
      if (!project) throw new Error("Project could not be created");

      const [updatedItem] = await tx
        .update(projectWatchlistItems)
        .set({
          status: "converted",
          convertedProjectId: project.id,
          updatedAt: new Date(),
        })
        .where(and(
          eq(projectWatchlistItems.id, item.id),
          eq(projectWatchlistItems.workspaceId, workspaceId),
          eq(projectWatchlistItems.status, "active"),
        ))
        .returning();
      if (!updatedItem) throw new Error("Watchlist item has already been converted");

      return { item: updatedItem, targetId: project.id, targetName: project.name, created: true };
    });

    const converted = {
      item: toRecord(result.item),
      targetType: "project" as const,
      targetId: result.targetId,
    };
    revalidateWatchlistViews(["/", "/watchlist", "/projects", "/tasks"]);
    if (result.created) {
      await recordActivity(workspaceId, "watchlist.converted", { projectId: converted.targetId }, {
        watchlistItemId: converted.item.id,
        name: result.targetName,
        targetType: converted.targetType,
      });
    }
    return converted;
  } catch (error) {
    if (hasPostgresCode(error, "23505")) {
      throw new Error("An active project with this name already exists");
    }
    throw error;
  }
}

export async function convertWatchlistToNft(
  id: string,
): Promise<WatchlistConversionResult> {
  const workspaceId = await requireWorkspace();
  const watchlistId = z.string().uuid().parse(id);

  try {
    const result = await db.transaction(async (tx) => {
      const [item] = await tx
        .select()
        .from(projectWatchlistItems)
        .where(and(
          eq(projectWatchlistItems.id, watchlistId),
          eq(projectWatchlistItems.workspaceId, workspaceId),
        ))
        .limit(1);
      if (!item) throw new Error("Watchlist item not found");
      if (item.itemKind !== "nft") throw new Error("This Watchlist item is a Project");

      if (item.status === "converted") {
        if (!item.convertedNftCampaignId) {
          throw new Error("The converted NFT campaign no longer exists");
        }
        const [existingNft] = await tx
          .select({ id: nftCampaigns.id, name: nftCampaigns.name })
          .from(nftCampaigns)
          .where(and(
            eq(nftCampaigns.id, item.convertedNftCampaignId),
            eq(nftCampaigns.workspaceId, workspaceId),
          ))
          .limit(1);
        if (!existingNft) throw new Error("The converted NFT campaign no longer exists");
        return { item, targetId: existingNft.id, targetName: existingNft.name, created: false };
      }

      const [duplicateNft] = await tx
        .select({ id: nftCampaigns.id })
        .from(nftCampaigns)
        .where(and(
          eq(nftCampaigns.workspaceId, workspaceId),
          sql`lower(trim(${nftCampaigns.name})) = lower(trim(${item.name}))`,
        ))
        .limit(1);
      if (duplicateNft) throw new Error("An NFT campaign with this name already exists");

      const nftValues = buildNftFromWatchlist(item);
      const [nft] = await tx
        .insert(nftCampaigns)
        .values({ ...nftValues, workspaceId, updatedAt: new Date() })
        .returning({ id: nftCampaigns.id, name: nftCampaigns.name });
      if (!nft) throw new Error("NFT campaign could not be created");

      const [updatedItem] = await tx
        .update(projectWatchlistItems)
        .set({
          status: "converted",
          convertedNftCampaignId: nft.id,
          updatedAt: new Date(),
        })
        .where(and(
          eq(projectWatchlistItems.id, item.id),
          eq(projectWatchlistItems.workspaceId, workspaceId),
          eq(projectWatchlistItems.status, "active"),
        ))
        .returning();
      if (!updatedItem) throw new Error("Watchlist item has already been converted");

      return { item: updatedItem, targetId: nft.id, targetName: nft.name, created: true };
    });

    const converted = {
      item: toRecord(result.item),
      targetType: "nft" as const,
      targetId: result.targetId,
    };
    revalidateWatchlistViews(["/", "/watchlist", "/nfts", "/projects"]);
    if (result.created) {
      await recordActivity(workspaceId, "watchlist.converted", {}, {
        watchlistItemId: converted.item.id,
        nftCampaignId: converted.targetId,
        name: result.targetName,
        targetType: converted.targetType,
      });
    }
    return converted;
  } catch (error) {
    if (hasPostgresCode(error, "23505")) {
      throw new Error("An NFT campaign with this name already exists");
    }
    throw error;
  }
}
