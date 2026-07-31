"use server";

import { revalidatePath } from "next/cache";
import { and, desc, eq, inArray, ne, sql } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { accounts, projectAccounts, projectWallets, projects, wallets } from "@/lib/db/schema";
import { ensureDefaultWorkspace } from "@/lib/db/workspace";
import { getCurrentUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { ARCHIVE_REASONS } from "@/features/projects/project-query";
import {
  parseProjectAssignments,
  parseProjectInput,
  parseProjectUpdate,
  type ProjectAssignmentInput,
} from "@/features/projects/project-schema";

export type ProjectAccountOption = Pick<
  typeof accounts.$inferSelect,
  "id" | "label" | "avatarUrl"
>;

export type ProjectWalletOption = Pick<
  typeof wallets.$inferSelect,
  "id" | "label" | "address" | "ownerAccountId" | "chainType" | "walletType"
>;

export type ProjectWithAccounts = typeof projects.$inferSelect & {
  assignedAccounts: ProjectAccountOption[];
  assignedWallets: ProjectWalletOption[];
};

function revalidateProjectViews() {
  for (const path of ["/projects", "/archive", "/daily", "/tasks"]) revalidatePath(path);
}

async function assertUniqueName(workspaceId: string, name: string, ignoredId?: string) {
  const conditions = [
    eq(projects.workspaceId, workspaceId),
    eq(projects.isArchived, false),
    sql`lower(trim(${projects.name})) = lower(trim(${name}))`,
  ];
  if (ignoredId) conditions.push(ne(projects.id, ignoredId));
  const [duplicate] = await db.select({ id: projects.id }).from(projects).where(and(...conditions)).limit(1);
  if (duplicate) throw new Error("An active project with this name already exists");
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

async function protectProjectWrite<T>(work: () => Promise<T>): Promise<T> {
  try {
    return await work();
  } catch (error) {
    if (hasPostgresCode(error, "23505")) {
      throw new Error("An active project with this name already exists");
    }
    throw error;
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function requireWorkspace() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const workspace = await ensureDefaultWorkspace(user.id);

  return { userId: user.id, workspaceId: workspace.id };
}

async function getAssignments(
  workspaceId: string,
  projectIds: string[],
): Promise<Map<string, ProjectAccountOption[]>> {
  const assignments = new Map<string, ProjectAccountOption[]>();

  if (projectIds.length === 0) return assignments;

  const rows = await db
    .select({
      projectId: projectAccounts.projectId,
      id: accounts.id,
      label: accounts.label,
      avatarUrl: accounts.avatarUrl,
    })
    .from(projectAccounts)
    .innerJoin(projects, eq(projectAccounts.projectId, projects.id))
    .innerJoin(accounts, eq(projectAccounts.accountId, accounts.id))
    .where(
      and(
        eq(projects.workspaceId, workspaceId),
        eq(accounts.workspaceId, workspaceId),
        inArray(projectAccounts.projectId, projectIds),
      ),
    );

  for (const row of rows) {
    const current = assignments.get(row.projectId) ?? [];
    current.push({ id: row.id, label: row.label, avatarUrl: row.avatarUrl });
    assignments.set(row.projectId, current);
  }

  return assignments;
}

async function getWalletAssignments(
  workspaceId: string,
  projectIds: string[],
): Promise<Map<string, ProjectWalletOption[]>> {
  const assignments = new Map<string, ProjectWalletOption[]>();
  if (projectIds.length === 0) return assignments;

  const rows = await db
    .select({
      projectId: projectWallets.projectId,
      id: wallets.id,
      label: wallets.label,
      address: wallets.address,
      ownerAccountId: wallets.ownerAccountId,
      chainType: wallets.chainType,
      walletType: wallets.walletType,
    })
    .from(projectWallets)
    .innerJoin(projects, eq(projectWallets.projectId, projects.id))
    .innerJoin(wallets, eq(projectWallets.walletId, wallets.id))
    .where(and(
      eq(projects.workspaceId, workspaceId),
      eq(wallets.workspaceId, workspaceId),
      inArray(projectWallets.projectId, projectIds),
    ));

  for (const row of rows) {
    const current = assignments.get(row.projectId) ?? [];
    current.push({
      id: row.id,
      label: row.label,
      address: row.address,
      ownerAccountId: row.ownerAccountId,
      chainType: row.chainType,
      walletType: row.walletType,
    });
    assignments.set(row.projectId, current);
  }
  return assignments;
}

// ─── Queries ─────────────────────────────────────────────────────────────────

export async function getProjects(): Promise<ProjectWithAccounts[]> {
  const { workspaceId } = await requireWorkspace();
  const records = await db
    .select()
    .from(projects)
    .where(
      and(
        eq(projects.workspaceId, workspaceId),
        eq(projects.isArchived, false),
      ),
    )
    .orderBy(desc(projects.updatedAt));

  const projectIds = records.map((project) => project.id);
  const [assignments, walletAssignments] = await Promise.all([
    getAssignments(workspaceId, projectIds),
    getWalletAssignments(workspaceId, projectIds),
  ]);

  return records.map((project) => ({
    ...project,
    assignedAccounts: assignments.get(project.id) ?? [],
    assignedWallets: walletAssignments.get(project.id) ?? [],
  }));
}

export async function getArchivedProjects(): Promise<ProjectWithAccounts[]> {
  const { workspaceId } = await requireWorkspace();
  const records = await db.select().from(projects)
    .where(and(eq(projects.workspaceId, workspaceId), eq(projects.isArchived, true)))
    .orderBy(desc(projects.archivedAt), desc(projects.updatedAt));
  const projectIds = records.map((project) => project.id);
  const [assignments, walletAssignments] = await Promise.all([
    getAssignments(workspaceId, projectIds),
    getWalletAssignments(workspaceId, projectIds),
  ]);
  return records.map((project) => ({
    ...project,
    assignedAccounts: assignments.get(project.id) ?? [],
    assignedWallets: walletAssignments.get(project.id) ?? [],
  }));
}

export async function getProjectAccountOptions(): Promise<ProjectAccountOption[]> {
  const { workspaceId } = await requireWorkspace();

  return db
    .select({
      id: accounts.id,
      label: accounts.label,
      avatarUrl: accounts.avatarUrl,
    })
    .from(accounts)
    .where(eq(accounts.workspaceId, workspaceId))
    .orderBy(accounts.label);
}

export async function getProjectWalletOptions(): Promise<ProjectWalletOption[]> {
  const { workspaceId } = await requireWorkspace();
  return db
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
    .orderBy(wallets.label);
}

// ─── Mutations ───────────────────────────────────────────────────────────────

export async function createProject(
  data: Omit<typeof projects.$inferInsert, "workspaceId">,
  assignmentInput: ProjectAssignmentInput = { accountIds: [], walletIds: [], newWallets: [] },
): Promise<ProjectWithAccounts> {
  const { workspaceId } = await requireWorkspace();
  const parsed = parseProjectInput(data);
  const assignments = parseProjectAssignments(assignmentInput);
  await assertUniqueName(workspaceId, parsed.name);

  const result = await protectProjectWrite(() => db.transaction(async (tx) => {
    const selectedAccounts = assignments.accountIds.length > 0
      ? await tx
          .select({
            id: accounts.id,
            label: accounts.label,
            avatarUrl: accounts.avatarUrl,
          })
          .from(accounts)
          .where(
            and(
              eq(accounts.workspaceId, workspaceId),
              inArray(accounts.id, assignments.accountIds),
            ),
          )
      : [];

    if (selectedAccounts.length !== assignments.accountIds.length) {
      throw new Error("One or more selected accounts are unavailable");
    }

    const selectedAccountIds = new Set(assignments.accountIds);
    const selectedWallets = assignments.walletIds.length > 0
      ? await tx
          .select({
            id: wallets.id,
            label: wallets.label,
            address: wallets.address,
            ownerAccountId: wallets.ownerAccountId,
            chainType: wallets.chainType,
            walletType: wallets.walletType,
          })
          .from(wallets)
          .where(and(eq(wallets.workspaceId, workspaceId), inArray(wallets.id, assignments.walletIds)))
      : [];
    if (selectedWallets.length !== assignments.walletIds.length) throw new Error("One or more selected wallets are unavailable");
    if (selectedWallets.some((wallet) => wallet.ownerAccountId && !selectedAccountIds.has(wallet.ownerAccountId))) {
      throw new Error("A wallet owner must also be assigned to the project");
    }
    if (assignments.newWallets.some((wallet) => wallet.ownerAccountId && !selectedAccountIds.has(wallet.ownerAccountId))) {
      throw new Error("A new wallet owner must also be assigned to the project");
    }

    const [project] = await tx
      .insert(projects)
      .values({ ...parsed, progressEstimate: String(parsed.progressEstimate ?? 0), dateStart: parsed.dateStart || null, websiteUrl: parsed.websiteUrl || null, logoUrl: parsed.logoUrl || null, updatedAt: new Date(), workspaceId })
      .returning();

    if (selectedAccounts.length > 0) {
      await tx.insert(projectAccounts).values(
        selectedAccounts.map((account) => ({
          projectId: project.id,
          accountId: account.id,
        })),
      );
    }

    const createdWallets = assignments.newWallets.length > 0
      ? await tx.insert(wallets).values(assignments.newWallets.map((wallet) => ({
          workspaceId,
          ownerAccountId: wallet.ownerAccountId ?? null,
          label: wallet.label,
          address: wallet.address,
          chainType: wallet.chainType,
          walletType: "project_wallet" as const,
          updatedAt: new Date(),
        }))).returning({
          id: wallets.id,
          label: wallets.label,
          address: wallets.address,
          ownerAccountId: wallets.ownerAccountId,
          chainType: wallets.chainType,
          walletType: wallets.walletType,
        })
      : [];
    const assignedWallets = [...selectedWallets, ...createdWallets];
    if (assignedWallets.length > 0) {
      await tx.insert(projectWallets).values(assignedWallets.map((wallet) => ({ projectId: project.id, walletId: wallet.id })));
    }

    return { ...project, assignedAccounts: selectedAccounts, assignedWallets };
  }));

  revalidateProjectViews();

  return result;
}

export async function updateProject(
  id: string,
  data: Partial<Omit<typeof projects.$inferInsert, "workspaceId">>,
  assignmentInput?: ProjectAssignmentInput,
): Promise<ProjectWithAccounts> {
  const { workspaceId } = await requireWorkspace();
  const parsed = parseProjectUpdate(data);
  if (parsed.name) await assertUniqueName(workspaceId, parsed.name, id);
  const assignments = assignmentInput ? parseProjectAssignments(assignmentInput) : undefined;

  const project = await protectProjectWrite(() => db.transaction(async (tx) => {
    const [existingProject] = await tx.select({ id: projects.id }).from(projects)
      .where(and(eq(projects.id, id), eq(projects.workspaceId, workspaceId))).limit(1);
    if (!existingProject) throw new Error("Project not found");

    let walletIdsToAssign: string[] = [];
    if (assignments) {
      const selectedAccounts = assignments.accountIds.length > 0
        ? await tx
            .select({ id: accounts.id })
            .from(accounts)
            .where(
              and(
                eq(accounts.workspaceId, workspaceId),
                inArray(accounts.id, assignments.accountIds),
              ),
            )
        : [];

      if (selectedAccounts.length !== assignments.accountIds.length) {
        throw new Error("One or more selected accounts are unavailable");
      }
      const selectedAccountIds = new Set(assignments.accountIds);
      const selectedWallets = assignments.walletIds.length > 0
        ? await tx.select({ id: wallets.id, ownerAccountId: wallets.ownerAccountId }).from(wallets)
            .where(and(eq(wallets.workspaceId, workspaceId), inArray(wallets.id, assignments.walletIds)))
        : [];
      if (selectedWallets.length !== assignments.walletIds.length) throw new Error("One or more selected wallets are unavailable");
      if (selectedWallets.some((wallet) => wallet.ownerAccountId && !selectedAccountIds.has(wallet.ownerAccountId))) {
        throw new Error("A wallet owner must also be assigned to the project");
      }
      if (assignments.newWallets.some((wallet) => wallet.ownerAccountId && !selectedAccountIds.has(wallet.ownerAccountId))) {
        throw new Error("A new wallet owner must also be assigned to the project");
      }

      const createdWallets = assignments.newWallets.length > 0
        ? await tx.insert(wallets).values(assignments.newWallets.map((wallet) => ({
            workspaceId,
            ownerAccountId: wallet.ownerAccountId ?? null,
            label: wallet.label,
            address: wallet.address,
            chainType: wallet.chainType,
            walletType: "project_wallet" as const,
            updatedAt: new Date(),
          }))).returning({ id: wallets.id })
        : [];
      walletIdsToAssign = [...assignments.walletIds, ...createdWallets.map((wallet) => wallet.id)];
    }

    const [updatedProject] = await tx
      .update(projects)
      .set({ ...parsed, progressEstimate: parsed.progressEstimate === undefined ? undefined : String(parsed.progressEstimate), dateStart: parsed.dateStart === "" ? null : parsed.dateStart, websiteUrl: parsed.websiteUrl === "" ? null : parsed.websiteUrl, logoUrl: parsed.logoUrl === "" ? null : parsed.logoUrl, updatedAt: new Date() })
      .where(and(eq(projects.id, id), eq(projects.workspaceId, workspaceId)))
      .returning();

    if (!updatedProject) throw new Error("Project not found");

    if (assignments) {
      await tx.delete(projectAccounts).where(eq(projectAccounts.projectId, id));
      if (assignments.accountIds.length > 0) {
        await tx.insert(projectAccounts).values(
          assignments.accountIds.map((accountId) => ({
            projectId: id,
            accountId,
          })),
        );
      }
      await tx.delete(projectWallets).where(eq(projectWallets.projectId, id));
      if (walletIdsToAssign.length > 0) {
        await tx.insert(projectWallets).values(walletIdsToAssign.map((walletId) => ({ projectId: id, walletId })));
      }
    }

    return updatedProject;
  }));

  const [accountAssignments, walletAssignments] = await Promise.all([
    getAssignments(workspaceId, [project.id]),
    getWalletAssignments(workspaceId, [project.id]),
  ]);

  revalidateProjectViews();

  return {
    ...project,
    assignedAccounts: accountAssignments.get(project.id) ?? [],
    assignedWallets: walletAssignments.get(project.id) ?? [],
  };
}

export async function archiveProject(id: string, reason: string): Promise<void> {
  const { workspaceId } = await requireWorkspace();
  const cleanReason = reason.trim().toLowerCase();
  if (!ARCHIVE_REASONS.includes(cleanReason as (typeof ARCHIVE_REASONS)[number])) throw new Error("Choose a valid archive reason");
  const [archived] = await db.update(projects).set({ isArchived: true, status: "archived", archiveReason: cleanReason, archivedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(projects.id, id), eq(projects.workspaceId, workspaceId)))
    .returning({ id: projects.id });
  if (!archived) throw new Error("Project not found");
  revalidateProjectViews();
}

export async function restoreProject(id: string): Promise<void> {
  const { workspaceId } = await requireWorkspace();
  const restored = await protectProjectWrite(() => db.update(projects).set({ isArchived: false, status: "watching", archiveReason: null, archivedAt: null, updatedAt: new Date() })
    .where(and(eq(projects.id, id), eq(projects.workspaceId, workspaceId)))
    .returning({ id: projects.id }));
  if (restored.length === 0) throw new Error("Project not found");
  revalidateProjectViews();
}

export async function uploadProjectLogo(id: string, formData: FormData): Promise<ProjectWithAccounts> {
  const { workspaceId } = await requireWorkspace();
  const [project] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, id), eq(projects.workspaceId, workspaceId)))
    .limit(1);
  if (!project) throw new Error("Project not found");

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) throw new Error("Choose an image first");
  if (!file.type.startsWith("image/") || file.size > 2 * 1024 * 1024) throw new Error("Use an image smaller than 2 MB");
  const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "png";
  const path = `${workspaceId}/${id}/logo-${Date.now()}.${extension}`;
  const supabase = await createClient();
  const { error } = await supabase.storage.from("project-logos").upload(path, file, { contentType: file.type, upsert: true });
  if (error) throw new Error(`Unable to upload logo: ${error.message}`);
  const { data } = supabase.storage.from("project-logos").getPublicUrl(path);
  return updateProject(id, { logoPath: path, logoUrl: data.publicUrl, logoSource: "uploaded" });
}

export async function deleteProject(id: string): Promise<void> {
  const { workspaceId } = await requireWorkspace();

  try {
    await db.transaction(async (tx) => {
      const [project] = await tx
        .select({ id: projects.id })
        .from(projects)
        .where(and(eq(projects.id, id), eq(projects.workspaceId, workspaceId)))
        .limit(1);

      if (!project) throw new Error("Project not found");

      await tx
        .delete(projectAccounts)
        .where(eq(projectAccounts.projectId, project.id));

      // Project deletion only unlinks wallets. Wallet records remain reusable.
      await tx
        .delete(projectWallets)
        .where(eq(projectWallets.projectId, project.id));

      await tx
        .delete(projects)
        .where(and(eq(projects.id, project.id), eq(projects.workspaceId, workspaceId)));
    });
  } catch (error) {
    if (hasPostgresCode(error, "23503")) {
      throw new Error("This project is still linked to tasks or logs. Archive it instead of deleting it permanently.");
    }
    throw error;
  }

  revalidateProjectViews();
}
