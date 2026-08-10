import { z } from "zod";

import { isHttpUrl, normalizeHttpUrl } from "@/lib/url";
import { HUNT_TYPES, PROJECT_PRIORITIES, PROJECT_STATUSES } from "@/features/projects/project-query";

const optionalHttpUrl = z.preprocess(
  (value) => typeof value === "string" ? normalizeHttpUrl(value) : value,
  z.union([
    z.literal(""),
    z.string().trim().url().refine(isHttpUrl, "Only http or https URLs are supported"),
  ]).nullable().optional(),
);

const projectName = z.string().trim().min(1, "Project name is required").max(120);
const huntType = z.enum(HUNT_TYPES);
const status = z.enum(PROJECT_STATUSES);
const priority = z.enum(PROJECT_PRIORITIES);
const tags = z.array(z.string().trim().min(1).max(80)).max(30);
const stageResult = z.string().trim().min(1).max(100);
const progressEstimate = z.union([z.string(), z.number()]);
const dateStart = z.union([z.literal(""), z.string().date()]).nullable();
const notes = z.string().trim().max(5000).nullable();
const logoPath = z.string().trim().max(500).nullable();
const logoSource = z.enum(["uploaded", "external_url", "favicon", "manual", "none"]).nullable();

export const projectInputSchema = z.object({
  name: projectName,
  huntType: huntType.default("free_hunts"),
  status: status.default("watching"),
  priority: priority.default("medium"),
  workTypes: tags.default([]),
  projectTypes: tags.default([]),
  chains: tags.default([]),
  stageResult: stageResult.default("Not applicable"),
  progressEstimate: progressEstimate.optional(),
  dateStart: dateStart.optional(),
  websiteUrl: optionalHttpUrl,
  notes: notes.optional(),
  logoUrl: optionalHttpUrl,
  logoPath: logoPath.optional(),
  logoSource: logoSource.optional(),
});

// Keep update fields explicit. Using projectInputSchema.partial() would retain
// nested defaults and could reset unrelated fields during a partial update.
export const projectUpdateSchema = z.object({
  name: projectName.optional(),
  huntType: huntType.optional(),
  status: status.optional(),
  priority: priority.optional(),
  workTypes: tags.optional(),
  projectTypes: tags.optional(),
  chains: tags.optional(),
  stageResult: stageResult.optional(),
  progressEstimate: progressEstimate.optional(),
  dateStart: dateStart.optional(),
  websiteUrl: optionalHttpUrl,
  notes: notes.optional(),
  logoUrl: optionalHttpUrl,
  logoPath: logoPath.optional(),
  logoSource: logoSource.optional(),
});

const uniqueIds = z.array(z.string().uuid()).max(100).superRefine((ids, context) => {
  const seen = new Set<string>();
  ids.forEach((id, index) => {
    if (seen.has(id)) context.addIssue({ code: "custom", message: "Each item can only be assigned once", path: [index] });
    seen.add(id);
  });
});

export const projectWalletDraftSchema = z.object({
  label: z.string().trim().min(1, "Wallet label is required").max(120),
  address: z.string().trim().min(1, "Wallet address is required").max(500),
  chainType: z.string().trim().min(1, "Chain is required").max(80),
  ownerAccountId: z.string().uuid().nullable().optional(),
});

export const projectAssignmentInputSchema = z.object({
  accountIds: uniqueIds.default([]),
  walletIds: uniqueIds.default([]),
  newWallets: z.array(projectWalletDraftSchema).max(50).default([]),
});

export type ProjectAssignmentInput = z.infer<typeof projectAssignmentInputSchema>;
export type ProjectWalletDraft = z.infer<typeof projectWalletDraftSchema>;

function validationError(error: z.ZodError) {
  const issue = error.issues[0];
  if (issue?.path[0] === "websiteUrl" || issue?.path[0] === "logoUrl") {
    return new Error("Enter a valid URL, for example project.com");
  }
  return new Error(issue?.message ?? "Project details are invalid");
}

export function parseProjectInput(data: unknown) {
  const result = projectInputSchema.safeParse(data);
  if (!result.success) throw validationError(result.error);
  return result.data;
}

export function parseProjectUpdate(data: unknown) {
  const result = projectUpdateSchema.safeParse(data);
  if (!result.success) throw validationError(result.error);
  return result.data;
}

export function parseProjectAssignments(data: unknown) {
  const result = projectAssignmentInputSchema.safeParse(data);
  if (!result.success) throw validationError(result.error);
  return result.data;
}
