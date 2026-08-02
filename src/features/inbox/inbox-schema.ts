import { z } from "zod";

import { isHttpUrl, normalizeHttpUrl } from "@/lib/url";

import { INBOX_PRIORITIES } from "./inbox-types";

const optionalHttpUrl = z.preprocess(
  (value) => typeof value === "string" ? normalizeHttpUrl(value) : value,
  z.union([
    z.literal(""),
    z.string().trim().url().refine(isHttpUrl, "Only http or https URLs are supported"),
  ]).nullable().optional(),
);

export const inboxItemInputSchema = z.object({
  title: z.string().trim().min(1, "Inbox title is required").max(180),
  content: z.string().trim().max(20000).nullable().optional(),
  url: optionalHttpUrl,
  sender: z.string().trim().max(180).nullable().optional(),
  priority: z.enum(INBOX_PRIORITIES).default("medium"),
  detectedProjectName: z.string().trim().max(180).nullable().optional(),
});

export const inboxProjectConversionSchema = z.object({
  projectName: z.string().trim().max(120).optional(),
});

export const inboxTaskConversionSchema = z.object({
  projectId: z.string().uuid(),
  taskTitle: z.string().trim().max(180).optional(),
});

export const inboxNoteConversionSchema = z.object({
  title: z.string().trim().max(180).optional(),
  linkedProjectId: z.string().uuid().nullable().optional(),
});

export function parseInboxItemInput(input: unknown) {
  const result = inboxItemInputSchema.safeParse(input);
  if (result.success) return result.data;
  const issue = result.error.issues[0];
  if (issue?.path[0] === "url") throw new Error("Enter a valid URL, for example example.com");
  throw new Error(issue?.message ?? "Inbox item details are invalid");
}

export function parseInboxProjectConversion(input: unknown) {
  const result = inboxProjectConversionSchema.safeParse(input);
  if (result.success) return result.data;
  throw new Error(result.error.issues[0]?.message ?? "Project conversion details are invalid");
}

export function parseInboxTaskConversion(input: unknown) {
  const result = inboxTaskConversionSchema.safeParse(input);
  if (result.success) return result.data;
  throw new Error(result.error.issues[0]?.message ?? "Task conversion details are invalid");
}

export function parseInboxNoteConversion(input: unknown) {
  const result = inboxNoteConversionSchema.safeParse(input);
  if (result.success) return result.data;
  throw new Error(result.error.issues[0]?.message ?? "Docs conversion details are invalid");
}
