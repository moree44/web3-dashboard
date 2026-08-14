import { z } from "zod";

import { NOTE_TYPES } from "./docs-types";

const forbiddenSecrets = /\b(seed phrase|recovery phrase|private key|2fa backup code|2fa recovery code)\b/i;

const folderName = z.string().trim().min(1, "Folder name is required").max(80, "Folder name must be 80 characters or fewer");
const optionalFolder = z.preprocess((value) => {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed || null;
}, folderName.nullable().optional());

export const docsNoteInputSchema = z.object({
  title: z.string().trim().min(1, "Document title is required").max(180),
  content: z.string().max(20000).nullable().optional(),
  noteType: z.enum(NOTE_TYPES).default("general"),
  folder: optionalFolder,
  pinned: z.boolean().default(false),
  linkedProjectId: z.string().uuid().nullable().optional(),
}).superRefine((value, context) => {
  if (value.content && forbiddenSecrets.test(value.content)) {
    context.addIssue({ code: "custom", path: ["content"], message: "Do not store seed phrases, private keys, recovery phrases, or 2FA backup codes." });
  }
});

export const docsFolderInputSchema = z.object({
  name: folderName,
  description: z.string().trim().max(160, "Folder description must be 160 characters or fewer").nullable().optional(),
});

export type DocsNoteInputSchema = z.infer<typeof docsNoteInputSchema>;
export type DocsFolderInputSchema = z.infer<typeof docsFolderInputSchema>;

export function parseDocsNoteInput(input: unknown) {
  const parsed = docsNoteInputSchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Document details are invalid");
  return parsed.data;
}

export function parseDocsFolderInput(input: unknown) {
  const parsed = docsFolderInputSchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Folder details are invalid");
  return parsed.data;
}
