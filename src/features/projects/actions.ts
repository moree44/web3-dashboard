"use server";

import { revalidatePath } from "next/cache";
import { and, desc, eq, inArray, ne, sql } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/lib/db/client";
import { accounts, projectAccounts, projects } from "@/lib/db/schema";
import { ensureDefaultWorkspace } from "@/lib/db/workspace";
import { getCurrentUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { ARCHIVE_REASONS, HUNT_TYPES, PROJECT_PRIORITIES, PROJECT_STATUSES } from "@/features/projects/project-query";

export type ProjectAccountOption = Pick<
  typeof accounts.$inferSelect,
  "id" | "label" | "avatarUrl"
>;

export type ProjectWithAccounts = typeof projects.$inferSelect & {
  assignedAccounts: ProjectAccountOption[];
};

const projectInputSchema = z.object({
  name: z.string().trim().min(1, "Project name is required").max(120),
  huntType: z.enum(HUNT_TYPES).default("free_hunts"),
  status: z.enum(PROJECT_STATUSES).default("watching"),
  priority: z.enum(PROJECT_PRIORITIES).default("medium"),
  workTypes: z.array(z.string().trim().min(1).max(80)).max(30).default([]),
  projectTypes: z.array(z.string().trim().min(1).max(80)).max(30).default([]),
  stageResult: z.string().trim().min(1).max(100).default("Not applicable"),
  progressEstimate: z.union([z.string(), z.number()]).optional(),
  dateStart: z.union([z.literal(""), z.string().date()]).nullable().optional(),
  websiteUrl: z.union([z.literal(""), z.string().trim().url()]).nullable().optional(),
  notes: z.string().trim().max(5000).nullable().optional(),
  logoUrl: z.union([z.literal(""), z.string().trim().url()]).nullable().optional(),
  logoPath: z.string().trim().max(500).nullable().optional(),
  logoSource: z.enum(["uploaded", "external_url", "favicon", "manual", "none"]).nullable().optional(),
});
const projectUpdateSchema = projectInputSchema.partial();

const archiveReasonSchema = z.enum(ARCHIVE_REASONS);

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

  const assignments = await getAssignments(
    workspaceId,
    records.map((project) => project.id),
  );

  return records.map((project) => ({
    ...project,
    assignedAccounts: assignments.get(project.id) ?? [],
  }));
}

export async function getArchivedProjects(): Promise<ProjectWithAccounts[]> {
  const { workspaceId } = await requireWorkspace();
  const records = await db.select().from(projects)
    .where(and(eq(projects.workspaceId, workspaceId), eq(projects.isArchived, true)))
    .orderBy(desc(projects.archivedAt), desc(projects.updatedAt));
  const assignments = await getAssignments(workspaceId, records.map((project) => project.id));
  return records.map((project) => ({ ...project, assignedAccounts: assignments.get(project.id) ?? [] }));
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

// ─── Mutations ───────────────────────────────────────────────────────────────

export async function createProject(
  data: Omit<typeof projects.$inferInsert, "workspaceId">,
  accountIds: string[] = [],
): Promise<ProjectWithAccounts> {
  const { workspaceId } = await requireWorkspace();
  const parsed = projectInputSchema.parse(data);
  await assertUniqueName(workspaceId, parsed.name);
  const uniqueAccountIds = [...new Set(accountIds)];

  const result = await protectProjectWrite(() => db.transaction(async (tx) => {
    const selectedAccounts = uniqueAccountIds.length > 0
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
              inArray(accounts.id, uniqueAccountIds),
            ),
          )
      : [];

    if (selectedAccounts.length !== uniqueAccountIds.length) {
      throw new Error("One or more selected accounts are unavailable");
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

    return { ...project, assignedAccounts: selectedAccounts };
  }));

  revalidateProjectViews();

  return result;
}

export async function updateProject(
  id: string,
  data: Partial<Omit<typeof projects.$inferInsert, "workspaceId">>,
  accountIds?: string[],
): Promise<ProjectWithAccounts> {
  const { workspaceId } = await requireWorkspace();
  const parsed = projectUpdateSchema.parse(data);
  if (parsed.name) await assertUniqueName(workspaceId, parsed.name, id);
  const uniqueAccountIds = accountIds ? [...new Set(accountIds)] : undefined;

  const project = await protectProjectWrite(() => db.transaction(async (tx) => {
    if (uniqueAccountIds) {
      const selectedAccounts = uniqueAccountIds.length > 0
        ? await tx
            .select({ id: accounts.id })
            .from(accounts)
            .where(
              and(
                eq(accounts.workspaceId, workspaceId),
                inArray(accounts.id, uniqueAccountIds),
              ),
            )
        : [];

      if (selectedAccounts.length !== uniqueAccountIds.length) {
        throw new Error("One or more selected accounts are unavailable");
      }
    }

    const [updatedProject] = await tx
      .update(projects)
      .set({ ...parsed, progressEstimate: parsed.progressEstimate === undefined ? undefined : String(parsed.progressEstimate), dateStart: parsed.dateStart === "" ? null : parsed.dateStart, websiteUrl: parsed.websiteUrl === "" ? null : parsed.websiteUrl, logoUrl: parsed.logoUrl === "" ? null : parsed.logoUrl, updatedAt: new Date() })
      .where(and(eq(projects.id, id), eq(projects.workspaceId, workspaceId)))
      .returning();

    if (!updatedProject) throw new Error("Project not found");

    if (uniqueAccountIds) {
      await tx.delete(projectAccounts).where(eq(projectAccounts.projectId, id));

      if (uniqueAccountIds.length > 0) {
        await tx.insert(projectAccounts).values(
          uniqueAccountIds.map((accountId) => ({
            projectId: id,
            accountId,
          })),
        );
      }
    }

    return updatedProject;
  }));

  const assignments = await getAssignments(workspaceId, [project.id]);

  revalidateProjectViews();

  return { ...project, assignedAccounts: assignments.get(project.id) ?? [] };
}

export async function archiveProject(id: string, reason: string): Promise<void> {
  const { workspaceId } = await requireWorkspace();
  const cleanReason = archiveReasonSchema.parse(reason.trim().toLowerCase());
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
