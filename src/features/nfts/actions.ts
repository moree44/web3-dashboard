"use server";

import { revalidatePath } from "next/cache";
import { and, asc, desc, eq, inArray, ne, sql } from "drizzle-orm";

import {
  parseNftCampaignInput,
  parseNftCampaignUpdate,
  type NftCampaignInput,
  type NftCampaignUpdateInput,
} from "./nft-schema";

import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import {
  accounts,
  deadlines,
  nftCampaignAccounts,
  nftCampaigns,
  nftCampaignWallets,
  wallets,
} from "@/lib/db/schema";
import { ensureDefaultWorkspace } from "@/lib/db/workspace";
import { recordActivity } from "@/features/activity/activity-log";
import { areWalletAndCampaignChainsCompatible } from "@/features/nfts/wallet-compatibility";

export type NftAccountOption = Pick<
  typeof accounts.$inferSelect,
  "id" | "label" | "avatarUrl"
>;

export type NftWalletOption = Pick<
  typeof wallets.$inferSelect,
  "id" | "label" | "address" | "ownerAccountId" | "chainType" | "walletType"
>;

export type NftWalletAssignment = NftWalletOption & {
  status: typeof nftCampaignWallets.$inferSelect.status;
};

export type NftCampaignWithContext = typeof nftCampaigns.$inferSelect & {
  assignedAccounts: NftAccountOption[];
  assignedWallets: NftWalletAssignment[];
  mintDeadlineId: string | null;
  mintDate: string | null;
  mintTime: string | null;
  mintDeadlineStatus: "upcoming" | "done" | "cancelled" | null;
};

export type NftPageData = {
  campaigns: NftCampaignWithContext[];
  accounts: NftAccountOption[];
  wallets: NftWalletOption[];
};

async function requireWorkspace() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  const workspace = await ensureDefaultWorkspace(user.id);
  return { workspaceId: workspace.id };
}

function revalidateNftViews() {
  for (const path of ["/nfts", "/projects", "/deadlines", "/"]) {
    revalidatePath(path);
  }
}

async function assertUniqueName(workspaceId: string, name: string, ignoredId?: string) {
  const conditions = [
    eq(nftCampaigns.workspaceId, workspaceId),
    sql`lower(trim(${nftCampaigns.name})) = lower(trim(${name}))`,
  ];
  if (ignoredId) conditions.push(ne(nftCampaigns.id, ignoredId));
  const [duplicate] = await db
    .select({ id: nftCampaigns.id })
    .from(nftCampaigns)
    .where(and(...conditions))
    .limit(1);
  if (duplicate) throw new Error("An NFT campaign with this name already exists");
}

async function validateAccounts(workspaceId: string, accountIds: string[]) {
  const uniqueIds = [...new Set(accountIds)];
  if (uniqueIds.length === 0) return [];
  const selected = await db
    .select({ id: accounts.id, label: accounts.label, avatarUrl: accounts.avatarUrl })
    .from(accounts)
    .where(and(eq(accounts.workspaceId, workspaceId), inArray(accounts.id, uniqueIds)))
    .orderBy(asc(accounts.label));
  if (selected.length !== uniqueIds.length) {
    throw new Error("One or more selected accounts are unavailable");
  }
  return selected;
}

async function validateWalletAssignments(
  workspaceId: string,
  accountIds: string[],
  chain: string,
  assignments: NftCampaignInput["walletAssignments"],
) {
  if (assignments.length === 0) return [];
  const walletIds = assignments.map((assignment) => assignment.walletId);
  const selected = await db
    .select({
      id: wallets.id,
      label: wallets.label,
      address: wallets.address,
      ownerAccountId: wallets.ownerAccountId,
      chainType: wallets.chainType,
      walletType: wallets.walletType,
    })
    .from(wallets)
    .where(and(eq(wallets.workspaceId, workspaceId), inArray(wallets.id, walletIds)))
    .orderBy(asc(wallets.label));
  if (selected.length !== walletIds.length) {
    throw new Error("One or more selected wallets are unavailable");
  }

  const selectedAccountIds = new Set(accountIds);
  const statuses = new Map(assignments.map((assignment) => [assignment.walletId, assignment.status]));
  return selected.map((wallet) => {
    if (wallet.ownerAccountId && !selectedAccountIds.has(wallet.ownerAccountId)) {
      throw new Error("A wallet owner must also be an assigned Account");
    }
    if (!areWalletAndCampaignChainsCompatible(wallet.chainType, chain)) {
      throw new Error(wallet.label + " is not compatible with " + chain);
    }
    return { ...wallet, status: statuses.get(wallet.id) ?? "planned" };
  });
}

async function getCampaignsForWorkspace(workspaceId: string) {
  const campaignRows = await db
    .select({
      id: nftCampaigns.id,
      workspaceId: nftCampaigns.workspaceId,
      name: nftCampaigns.name,
      chain: nftCampaigns.chain,
      status: nftCampaigns.status,
      mintUrl: nftCampaigns.mintUrl,
      notes: nftCampaigns.notes,
      createdAt: nftCampaigns.createdAt,
      updatedAt: nftCampaigns.updatedAt,
      mintDeadlineId: deadlines.id,
      mintDate: deadlines.dueDate,
      mintTime: deadlines.dueTime,
      mintDeadlineStatus: deadlines.status,
    })
    .from(nftCampaigns)
    .leftJoin(deadlines, eq(deadlines.linkedNftCampaignId, nftCampaigns.id))
    .where(eq(nftCampaigns.workspaceId, workspaceId))
    .orderBy(desc(nftCampaigns.updatedAt), asc(nftCampaigns.name));

  if (campaignRows.length === 0) return [];

  const assignmentRows = await db
    .select({
      nftCampaignId: nftCampaignAccounts.nftCampaignId,
      id: accounts.id,
      label: accounts.label,
      avatarUrl: accounts.avatarUrl,
    })
    .from(nftCampaignAccounts)
    .innerJoin(accounts, eq(nftCampaignAccounts.accountId, accounts.id))
    .where(inArray(nftCampaignAccounts.nftCampaignId, campaignRows.map((row) => row.id)))
    .orderBy(asc(accounts.label));

  const assignments = new Map<string, NftAccountOption[]>();
  for (const row of assignmentRows) {
    const current = assignments.get(row.nftCampaignId) ?? [];
    current.push({ id: row.id, label: row.label, avatarUrl: row.avatarUrl });
    assignments.set(row.nftCampaignId, current);
  }

  const walletRows = await db
    .select({
      nftCampaignId: nftCampaignWallets.nftCampaignId,
      id: wallets.id,
      label: wallets.label,
      address: wallets.address,
      ownerAccountId: wallets.ownerAccountId,
      chainType: wallets.chainType,
      walletType: wallets.walletType,
      status: nftCampaignWallets.status,
    })
    .from(nftCampaignWallets)
    .innerJoin(wallets, eq(nftCampaignWallets.walletId, wallets.id))
    .where(inArray(nftCampaignWallets.nftCampaignId, campaignRows.map((row) => row.id)))
    .orderBy(asc(wallets.label));

  const walletAssignments = new Map<string, NftWalletAssignment[]>();
  for (const row of walletRows) {
    const current = walletAssignments.get(row.nftCampaignId) ?? [];
    current.push({
      id: row.id,
      label: row.label,
      address: row.address,
      ownerAccountId: row.ownerAccountId,
      chainType: row.chainType,
      walletType: row.walletType,
      status: row.status,
    });
    walletAssignments.set(row.nftCampaignId, current);
  }

  return campaignRows.map((row) => ({
    ...row,
    assignedAccounts: assignments.get(row.id) ?? [],
    assignedWallets: walletAssignments.get(row.id) ?? [],
  }));
}

export async function getNftPageData(): Promise<NftPageData> {
  const { workspaceId } = await requireWorkspace();
  const [campaigns, accountOptions, walletOptions] = await Promise.all([
    getCampaignsForWorkspace(workspaceId),
    db
      .select({ id: accounts.id, label: accounts.label, avatarUrl: accounts.avatarUrl })
      .from(accounts)
      .where(eq(accounts.workspaceId, workspaceId))
      .orderBy(asc(accounts.label)),
    db
      .select({
        id: wallets.id,
        label: wallets.label,
        address: wallets.address,
        ownerAccountId: wallets.ownerAccountId,
        chainType: wallets.chainType,
        walletType: wallets.walletType,
      })
      .from(wallets)
      .where(eq(wallets.workspaceId, workspaceId))
      .orderBy(asc(wallets.label)),
  ]);
  return { campaigns, accounts: accountOptions, wallets: walletOptions };
}

export async function getNftCampaignCount(): Promise<number> {
  const { workspaceId } = await requireWorkspace();
  const [result] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(nftCampaigns)
    .where(eq(nftCampaigns.workspaceId, workspaceId));
  return result?.count ?? 0;
}

function deadlineStatusForCampaign(status: NftCampaignInput["status"]) {
  if (status === "minted") return "done" as const;
  if (status === "missed") return "cancelled" as const;
  return "upcoming" as const;
}

function normalizedValues(data: NftCampaignInput | NftCampaignUpdateInput) {
  return {
    ...(Object.prototype.hasOwnProperty.call(data, "name") ? { name: data.name } : {}),
    ...(Object.prototype.hasOwnProperty.call(data, "chain") ? { chain: data.chain } : {}),
    ...(Object.prototype.hasOwnProperty.call(data, "status") ? { status: data.status } : {}),
    ...(Object.prototype.hasOwnProperty.call(data, "mintUrl")
      ? { mintUrl: data.mintUrl || null }
      : {}),
    ...(Object.prototype.hasOwnProperty.call(data, "notes")
      ? { notes: data.notes || null }
      : {}),
  };
}

async function campaignResult(workspaceId: string, id: string) {
  const rows = await getCampaignsForWorkspace(workspaceId);
  const campaign = rows.find((item) => item.id === id);
  if (!campaign) throw new Error("NFT campaign not found");
  return campaign;
}

export async function createNftCampaign(
  data: NftCampaignInput,
): Promise<NftCampaignWithContext> {
  const { workspaceId } = await requireWorkspace();
  const parsed = parseNftCampaignInput(data);
  await assertUniqueName(workspaceId, parsed.name);
  const selectedAccounts = await validateAccounts(workspaceId, parsed.accountIds);
  const selectedWallets = await validateWalletAssignments(
    workspaceId,
    parsed.accountIds,
    parsed.chain,
    parsed.walletAssignments,
  );

  const createdId = await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(nftCampaigns)
      .values({
        workspaceId,
        name: parsed.name,
        chain: parsed.chain,
        status: parsed.status,
        mintUrl: parsed.mintUrl || null,
        notes: parsed.notes || null,
        updatedAt: new Date(),
      })
      .returning({ id: nftCampaigns.id });

    if (selectedAccounts.length > 0) {
      await tx.insert(nftCampaignAccounts).values(
        selectedAccounts.map((account) => ({
          nftCampaignId: created.id,
          accountId: account.id,
        })),
      );
    }

    if (selectedWallets.length > 0) {
      await tx.insert(nftCampaignWallets).values(
        selectedWallets.map((wallet) => ({
          nftCampaignId: created.id,
          walletId: wallet.id,
          status: wallet.status,
        })),
      );
    }

    if (parsed.mintDate) {
      await tx.insert(deadlines).values({
        workspaceId,
        title: parsed.name + " mint",
        notes: "Mint schedule for " + parsed.name + ".",
        url: parsed.mintUrl || null,
        dueDate: parsed.mintDate,
        dueTime: parsed.mintTime || null,
        status: deadlineStatusForCampaign(parsed.status),
        linkedNftCampaignId: created.id,
        updatedAt: new Date(),
      });
    }

    return created.id;
  });

  const result = await campaignResult(workspaceId, createdId);
  await recordActivity(workspaceId, "nft_campaign.created", {}, { name: result.name });
  revalidateNftViews();
  return result;
}

export async function updateNftCampaign(
  id: string,
  data: NftCampaignUpdateInput,
): Promise<NftCampaignWithContext> {
  const { workspaceId } = await requireWorkspace();
  const parsed = parseNftCampaignUpdate(data);
  const [current] = await db
    .select()
    .from(nftCampaigns)
    .where(and(eq(nftCampaigns.id, id), eq(nftCampaigns.workspaceId, workspaceId)))
    .limit(1);
  if (!current) throw new Error("NFT campaign not found");

  const nextName = parsed.name ?? current.name;
  const nextStatus = parsed.status ?? current.status;
  if (parsed.name) await assertUniqueName(workspaceId, parsed.name, id);
  const selectedAccounts = parsed.accountIds
    ? await validateAccounts(workspaceId, parsed.accountIds)
    : null;
  const walletContextChanged = parsed.walletAssignments !== undefined
    || parsed.accountIds !== undefined
    || parsed.chain !== undefined;
  let effectiveAccountIds = parsed.accountIds;
  if (!effectiveAccountIds && walletContextChanged) {
    effectiveAccountIds = (await db
      .select({ accountId: nftCampaignAccounts.accountId })
      .from(nftCampaignAccounts)
      .where(eq(nftCampaignAccounts.nftCampaignId, id)))
      .map((row) => row.accountId);
  }
  let effectiveWalletAssignments = parsed.walletAssignments;
  if (!effectiveWalletAssignments && walletContextChanged) {
    effectiveWalletAssignments = await db
      .select({ walletId: nftCampaignWallets.walletId, status: nftCampaignWallets.status })
      .from(nftCampaignWallets)
      .where(eq(nftCampaignWallets.nftCampaignId, id));
  }
  const selectedWallets = walletContextChanged
    ? await validateWalletAssignments(
        workspaceId,
        effectiveAccountIds ?? [],
        parsed.chain ?? current.chain,
        effectiveWalletAssignments ?? [],
      )
    : null;

  await db.transaction(async (tx) => {
    await tx
      .update(nftCampaigns)
      .set({ ...normalizedValues(parsed), updatedAt: new Date() })
      .where(and(eq(nftCampaigns.id, id), eq(nftCampaigns.workspaceId, workspaceId)));

    if (selectedAccounts) {
      await tx
        .delete(nftCampaignAccounts)
        .where(eq(nftCampaignAccounts.nftCampaignId, id));
      if (selectedAccounts.length > 0) {
        await tx.insert(nftCampaignAccounts).values(
          selectedAccounts.map((account) => ({
            nftCampaignId: id,
            accountId: account.id,
          })),
        );
      }
    }

    if (selectedWallets) {
      await tx
        .delete(nftCampaignWallets)
        .where(eq(nftCampaignWallets.nftCampaignId, id));
      if (selectedWallets.length > 0) {
        await tx.insert(nftCampaignWallets).values(
          selectedWallets.map((wallet) => ({
            nftCampaignId: id,
            walletId: wallet.id,
            status: wallet.status,
          })),
        );
      }
    }

    const hasMintDate = Object.prototype.hasOwnProperty.call(parsed, "mintDate");
    const hasMintTime = Object.prototype.hasOwnProperty.call(parsed, "mintTime");
    const hasMintUrl = Object.prototype.hasOwnProperty.call(parsed, "mintUrl");
    const [currentDeadline] = await tx
      .select()
      .from(deadlines)
      .where(eq(deadlines.linkedNftCampaignId, id))
      .limit(1);

    if (hasMintDate && !parsed.mintDate) {
      if (currentDeadline) {
        await tx.delete(deadlines).where(eq(deadlines.id, currentDeadline.id));
      }
    } else if ((parsed.mintDate || currentDeadline) && (hasMintDate || hasMintTime || hasMintUrl || parsed.name || parsed.status)) {
      const deadlineValues = {
        title: nextName + " mint",
        url: hasMintUrl ? parsed.mintUrl || null : currentDeadline?.url ?? current.mintUrl,
        dueDate: parsed.mintDate || currentDeadline?.dueDate,
        dueTime: hasMintTime ? parsed.mintTime || null : currentDeadline?.dueTime ?? null,
        status: deadlineStatusForCampaign(nextStatus),
        updatedAt: new Date(),
      };
      if (currentDeadline && deadlineValues.dueDate) {
        await tx
          .update(deadlines)
          .set(deadlineValues)
          .where(eq(deadlines.id, currentDeadline.id));
      } else if (deadlineValues.dueDate) {
        await tx.insert(deadlines).values({
          ...deadlineValues,
          workspaceId,
          notes: "Mint schedule for " + nextName + ".",
          linkedNftCampaignId: id,
        });
      }
    }
  });

  const result = await campaignResult(workspaceId, id);
  await recordActivity(workspaceId, "nft_campaign.updated", {}, { name: result.name, status: result.status });
  revalidateNftViews();
  return result;
}

export async function deleteNftCampaign(id: string): Promise<void> {
  const { workspaceId } = await requireWorkspace();
  const deleted = await db
    .delete(nftCampaigns)
    .where(and(eq(nftCampaigns.id, id), eq(nftCampaigns.workspaceId, workspaceId)))
    .returning({ id: nftCampaigns.id });
  if (deleted.length === 0) throw new Error("NFT campaign not found");
  await recordActivity(workspaceId, "nft_campaign.deleted", {}, { id });
  revalidateNftViews();
}
