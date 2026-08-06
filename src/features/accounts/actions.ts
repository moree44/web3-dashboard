"use server";

import { revalidatePath } from "next/cache";
import { and, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/lib/db/client";
import { accounts, notes, projectAccounts, projectWallets, projects, taskAccounts, taskLogs, taskWallets, wallets, walletGroups } from "@/lib/db/schema";
import { ensureDefaultWorkspace } from "@/lib/db/workspace";
import { recordActivity } from "@/features/activity/activity-log";
import { getCurrentUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { isHttpUrl, normalizeHttpUrl } from "@/lib/url";

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function requireWorkspace() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const workspace = await ensureDefaultWorkspace(user.id);

  return { userId: user.id, workspaceId: workspace.id };
}

function revalidateAccountViews() {
  revalidatePath("/accounts");
  revalidatePath("/accounts", "layout");
  revalidatePath("/projects");
}

const avatarUrlSchema = z.preprocess(
  (value) => typeof value === "string" ? normalizeHttpUrl(value) : value,
  z.union([
    z.literal(""),
    z.string().trim().url().refine(isHttpUrl, "Only http or https URLs are supported"),
  ]),
);

// ─── Queries ─────────────────────────────────────────────────────────────────

export type AccountWithStats = typeof accounts.$inferSelect & {
  walletCount: number;
  activeProjects: string[];
};

export async function getAccounts(): Promise<AccountWithStats[]> {
  const { workspaceId } = await requireWorkspace();
  const records = await db
    .select()
    .from(accounts)
    .where(eq(accounts.workspaceId, workspaceId))
    .orderBy(accounts.updatedAt);

  if (records.length === 0) return [];

  const accountIds = records.map((record) => record.id);

  const [walletRows, projectRows] = await Promise.all([
    db
      .select({
        ownerAccountId: wallets.ownerAccountId,
        count: sql<number>`count(*)::int`,
      })
      .from(wallets)
      .where(
        and(
          eq(wallets.workspaceId, workspaceId),
          inArray(wallets.ownerAccountId, accountIds),
        ),
      )
      .groupBy(wallets.ownerAccountId),
    db
      .select({
        accountId: projectAccounts.accountId,
        projectName: projects.name,
      })
      .from(projectAccounts)
      .innerJoin(projects, eq(projectAccounts.projectId, projects.id))
      .where(
        and(
          eq(projects.workspaceId, workspaceId),
          eq(projects.isArchived, false),
          inArray(projectAccounts.accountId, accountIds),
        ),
      )
      .orderBy(projects.name),
  ]);

  const walletCountByAccount = new Map<string, number>();
  for (const row of walletRows) {
    if (row.ownerAccountId) walletCountByAccount.set(row.ownerAccountId, row.count);
  }

  const projectsByAccount = new Map<string, string[]>();
  for (const row of projectRows) {
    const current = projectsByAccount.get(row.accountId) ?? [];
    current.push(row.projectName);
    projectsByAccount.set(row.accountId, current);
  }

  return records.map((record) => ({
    ...record,
    walletCount: walletCountByAccount.get(record.id) ?? 0,
    activeProjects: projectsByAccount.get(record.id) ?? [],
  }));
}

export type AccountsWorkspaceData = {
  accounts: AccountWithStats[];
  wallets: Array<typeof wallets.$inferSelect>;
  walletGroups: Array<typeof walletGroups.$inferSelect>;
};

export async function getAccountsWorkspaceData(): Promise<AccountsWorkspaceData> {
  const [accountsData, walletsData, walletGroupsData] = await Promise.all([
    getAccounts(),
    getWallets(),
    getWalletGroups(),
  ]);
  return { accounts: accountsData, wallets: walletsData, walletGroups: walletGroupsData };
}

// ─── Mutations ───────────────────────────────────────────────────────────────

export async function createAccount(
  data: Omit<typeof accounts.$inferInsert, "workspaceId">,
): Promise<AccountWithStats> {
  const { workspaceId } = await requireWorkspace();

  const [account] = await db
    .insert(accounts)
    .values({ ...data, workspaceId, updatedAt: new Date() })
    .returning();

  await recordActivity(workspaceId, "account.created", { accountId: account.id }, { label: account.label });
  revalidateAccountViews();

  return { ...account, walletCount: 0, activeProjects: [] };
}

export async function updateAccount(
  id: string,
  data: Partial<typeof accounts.$inferInsert>,
): Promise<AccountWithStats> {
  const { workspaceId } = await requireWorkspace();

  const [account] = await db
    .update(accounts)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(accounts.id, id), eq(accounts.workspaceId, workspaceId)))
    .returning();

  if (!account) throw new Error("Account not found");

  await recordActivity(workspaceId, "account.updated", { accountId: account.id }, { label: account.label });
  revalidateAccountViews();

  const all = await getAccounts();
  const enriched = all.find((item) => item.id === account.id);
  return enriched ?? { ...account, walletCount: 0, activeProjects: [] };
}

export async function deleteAccount(id: string): Promise<void> {
  const { workspaceId } = await requireWorkspace();

  await db.transaction(async (tx) => {
    await tx.delete(projectAccounts).where(eq(projectAccounts.accountId, id));
    await tx.delete(taskAccounts).where(eq(taskAccounts.accountId, id));
    await tx.update(wallets).set({ ownerAccountId: null }).where(eq(wallets.ownerAccountId, id));
    await tx.update(taskLogs).set({ accountId: null }).where(eq(taskLogs.accountId, id));
    await tx.update(notes).set({ linkedAccountId: null }).where(eq(notes.linkedAccountId, id));
    await tx.delete(accounts).where(and(eq(accounts.id, id), eq(accounts.workspaceId, workspaceId)));
  });

  await recordActivity(workspaceId, "account.deleted", {}, { id });
  revalidateAccountViews();
}

export async function uploadAccountAvatar(
  id: string,
  formData: FormData,
): Promise<AccountWithStats> {
  const { workspaceId } = await requireWorkspace();
  const [account] = await db
    .select({ id: accounts.id })
    .from(accounts)
    .where(and(eq(accounts.id, id), eq(accounts.workspaceId, workspaceId)))
    .limit(1);
  if (!account) throw new Error("Account not found");

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) throw new Error("Choose an image first");
  if (!file.type.startsWith("image/") || file.size > 2 * 1024 * 1024) {
    throw new Error("Use an image smaller than 2 MB");
  }

  const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "png";
  const path = `${workspaceId}/${id}/avatar-${Date.now()}.${extension}`;
  const supabase = await createClient();
  const { error } = await supabase.storage
    .from("account-avatars")
    .upload(path, file, { contentType: file.type, upsert: true });
  if (error) throw new Error(`Unable to upload avatar: ${error.message}`);

  const { data } = supabase.storage.from("account-avatars").getPublicUrl(path);
  return updateAccount(id, {
    avatarUrl: data.publicUrl,
    avatarSource: "uploaded",
  });
}

export async function setAccountAvatarUrl(
  id: string,
  avatarUrl: string,
): Promise<AccountWithStats> {
  const result = avatarUrlSchema.safeParse(avatarUrl);
  if (!result.success) throw new Error("Enter a valid image URL, for example image.example.com/avatar.png");
  const parsed = result.data;
  if (!parsed) {
    return updateAccount(id, { avatarUrl: null, avatarSource: "none" });
  }
  return updateAccount(id, {
    avatarUrl: parsed,
    avatarSource: "external_url",
  });
}

// ─── Wallets ─────────────────────────────────────────────────────────────────

export async function getWallets(): Promise<Array<typeof wallets.$inferSelect>> {
  const { workspaceId } = await requireWorkspace();
  return db
    .select()
    .from(wallets)
    .where(eq(wallets.workspaceId, workspaceId))
    .orderBy(wallets.updatedAt);
}

export async function createWallet(
  data: Omit<typeof wallets.$inferInsert, "workspaceId">,
): Promise<typeof wallets.$inferSelect> {
  const { workspaceId } = await requireWorkspace();

  const [wallet] = await db
    .insert(wallets)
    .values({ ...data, workspaceId, updatedAt: new Date() })
    .returning();

  await recordActivity(workspaceId, "wallet.created", { walletId: wallet.id }, { label: wallet.label });
  revalidateAccountViews();

  return wallet;
}

export async function updateWallet(
  id: string,
  data: Partial<typeof wallets.$inferInsert>,
): Promise<typeof wallets.$inferSelect> {
  const { workspaceId } = await requireWorkspace();

  const [wallet] = await db
    .update(wallets)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(wallets.id, id), eq(wallets.workspaceId, workspaceId)))
    .returning();

  if (!wallet) throw new Error("Wallet not found");

  await recordActivity(workspaceId, "wallet.updated", { walletId: wallet.id }, { label: wallet.label });
  revalidateAccountViews();

  return wallet;
}

export async function deleteWallet(id: string): Promise<void> {
  const { workspaceId } = await requireWorkspace();

  await db.transaction(async (tx) => {
    await tx.delete(projectWallets).where(eq(projectWallets.walletId, id));
    await tx.delete(taskWallets).where(eq(taskWallets.walletId, id));
    await tx.update(taskLogs).set({ walletId: null }).where(eq(taskLogs.walletId, id));
    await tx.update(notes).set({ linkedWalletId: null }).where(eq(notes.linkedWalletId, id));
    await tx.delete(wallets).where(and(eq(wallets.id, id), eq(wallets.workspaceId, workspaceId)));
  });

  await recordActivity(workspaceId, "wallet.deleted", {}, { id });
  revalidateAccountViews();
}

// ─── Wallet Groups ───────────────────────────────────────────────────────────

export async function getWalletGroups(): Promise<Array<typeof walletGroups.$inferSelect>> {
  const { workspaceId } = await requireWorkspace();
  return db
    .select()
    .from(walletGroups)
    .where(eq(walletGroups.workspaceId, workspaceId))
    .orderBy(walletGroups.updatedAt);
}

export async function createWalletGroup(
  data: Omit<typeof walletGroups.$inferInsert, "workspaceId">,
): Promise<typeof walletGroups.$inferSelect> {
  const { workspaceId } = await requireWorkspace();

  const [group] = await db
    .insert(walletGroups)
    .values({ ...data, workspaceId, updatedAt: new Date() })
    .returning();

  await recordActivity(workspaceId, "wallet_group.created", {}, { name: group.name });
  revalidateAccountViews();

  return group;
}

export async function updateWalletGroup(
  id: string,
  data: Partial<typeof walletGroups.$inferInsert>,
): Promise<typeof walletGroups.$inferSelect> {
  const { workspaceId } = await requireWorkspace();

  const [group] = await db
    .update(walletGroups)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(walletGroups.id, id), eq(walletGroups.workspaceId, workspaceId)))
    .returning();

  if (!group) throw new Error("Wallet group not found");

  await recordActivity(workspaceId, "wallet_group.updated", {}, { name: group.name });
  revalidateAccountViews();

  return group;
}

export async function deleteWalletGroup(id: string): Promise<void> {
  const { workspaceId } = await requireWorkspace();

  await db.transaction(async (tx) => {
    await tx.update(wallets).set({ walletGroupId: null }).where(eq(wallets.walletGroupId, id));
    await tx.delete(walletGroups).where(and(eq(walletGroups.id, id), eq(walletGroups.workspaceId, workspaceId)));
  });

  await recordActivity(workspaceId, "wallet_group.deleted", {}, { id });
  revalidateAccountViews();
}
