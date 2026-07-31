import { z } from "zod";

import { isHttpUrl, normalizeHttpUrl } from "@/lib/url";

export const NFT_STATUSES = [
  "watching",
  "whitelisted",
  "upcoming",
  "minted",
  "missed",
] as const;

export const NFT_WALLET_STATUSES = [
  "planned",
  "submitted",
  "whitelisted",
  "not_whitelisted",
  "minted",
  "skipped",
] as const;

const optionalUrl = z.preprocess(
  (value) => typeof value === "string" ? normalizeHttpUrl(value) : value,
  z.union([
    z.literal(""),
    z.string().trim().url().refine(isHttpUrl, "Only http or https URLs are supported"),
    z.null(),
  ]).optional(),
);

const optionalDate = z.union([
  z.literal(""),
  z.string().date("Choose a valid mint date"),
  z.null(),
]).optional();

const optionalTime = z.union([
  z.literal(""),
  z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use 24-hour time as HH:mm"),
  z.null(),
]).optional();

const campaignName = z.string().trim().min(1, "Collection name is required").max(120);
const campaignChain = z.string().trim().min(1, "Chain is required").max(80);
const campaignStatus = z.enum(NFT_STATUSES);
const campaignAccountIds = z.array(z.string().uuid()).max(50);
const campaignWalletAssignments = z.array(z.object({
  walletId: z.string().uuid(),
  status: z.enum(NFT_WALLET_STATUSES).default("planned"),
})).max(100).superRefine((assignments, context) => {
  const seen = new Set<string>();
  assignments.forEach((assignment, index) => {
    if (seen.has(assignment.walletId)) {
      context.addIssue({
        code: "custom",
        message: "Each wallet can only be assigned once",
        path: [index, "walletId"],
      });
    }
    seen.add(assignment.walletId);
  });
});
const campaignNotes = z.string().trim().max(5000).nullable();

export const nftCampaignInputSchema = z.object({
  name: campaignName,
  chain: campaignChain,
  status: campaignStatus.default("watching"),
  accountIds: campaignAccountIds.default([]),
  walletAssignments: campaignWalletAssignments.default([]),
  mintDate: optionalDate,
  mintTime: optionalTime,
  mintUrl: optionalUrl,
  notes: campaignNotes.optional(),
});

export const nftCampaignUpdateSchema = z.object({
  name: campaignName.optional(),
  chain: campaignChain.optional(),
  status: campaignStatus.optional(),
  accountIds: campaignAccountIds.optional(),
  walletAssignments: campaignWalletAssignments.optional(),
  mintDate: optionalDate,
  mintTime: optionalTime,
  mintUrl: optionalUrl,
  notes: campaignNotes.optional(),
});

export type NftCampaignInput = z.infer<typeof nftCampaignInputSchema>;
export type NftCampaignUpdateInput = z.infer<typeof nftCampaignUpdateSchema>;

function validationError(error: z.ZodError) {
  const issue = error.issues[0];
  if (issue?.path[0] === "mintUrl") {
    return new Error("Enter a valid mint URL, for example mint.example.com");
  }
  return new Error(issue?.message ?? "NFT campaign details are invalid");
}

export function parseNftCampaignInput(data: unknown) {
  const result = nftCampaignInputSchema.safeParse(data);
  if (!result.success) throw validationError(result.error);
  return result.data;
}

export function parseNftCampaignUpdate(data: unknown) {
  const result = nftCampaignUpdateSchema.safeParse(data);
  if (!result.success) throw validationError(result.error);
  return result.data;
}
