import { z } from "zod";

import { NOTE_FOLDERS, NOTE_TYPES } from "./docs-types";

const forbiddenSecrets = /\b(seed phrase|recovery phrase|private key|2fa backup code|2fa recovery code)\b/i;

export const docsNoteInputSchema = z.object({
  title: z.string().trim().min(1, "Document title is required").max(180),
  content: z.string().max(20000).nullable().optional(),
  noteType: z.enum(NOTE_TYPES).default("general"),
  folder: z.enum(NOTE_FOLDERS).nullable().optional(),
  pinned: z.boolean().default(false),
  linkedProjectId: z.string().uuid().nullable().optional(),
}).superRefine((value, context) => {
  if (value.content && forbiddenSecrets.test(value.content)) {
    context.addIssue({ code: "custom", path: ["content"], message: "Do not store seed phrases, private keys, recovery phrases, or 2FA backup codes." });
  }
});

export type DocsNoteInputSchema = z.infer<typeof docsNoteInputSchema>;

export function parseDocsNoteInput(input: unknown) {
  const parsed = docsNoteInputSchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Document details are invalid");
  return parsed.data;
}
