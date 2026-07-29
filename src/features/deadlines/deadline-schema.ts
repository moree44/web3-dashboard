import { z } from "zod";
import { isHttpUrl, normalizeHttpUrl } from "@/lib/url";

const optionalUrl = z.preprocess(
  (value) => typeof value === "string" ? normalizeHttpUrl(value) : value,
  z.union([
    z.literal(""),
    z.string().trim().url("Enter a valid URL").refine(isHttpUrl, "Only http or https URLs are supported"),
    z.null(),
  ]),
);

const optionalTime = z.union([
  z.literal(""),
  z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use 24-hour time as HH:mm"),
  z.null(),
]);

export const deadlineInputSchema = z.object({
  title: z.string().trim().min(1, "Deadline title is required").max(160),
  dueDate: z.string().date("Choose a valid due date"),
  dueTime: optionalTime.optional(),
  status: z.enum(["upcoming", "done", "cancelled"]).default("upcoming"),
  linkedProjectId: z.string().uuid().nullable().optional(),
  linkedTaskId: z.string().uuid().nullable().optional(),
  url: optionalUrl.optional(),
  notes: z.string().trim().max(5000).nullable().optional(),
});

export const deadlineUpdateSchema = deadlineInputSchema.partial();

export type DeadlineInput = z.infer<typeof deadlineInputSchema>;
export type DeadlineUpdateInput = z.infer<typeof deadlineUpdateSchema>;

function deadlineValidationError(error: z.ZodError) {
  const issue = error.issues[0];
  if (issue?.path[0] === "url") return new Error("Enter a valid URL, for example website.com");
  return new Error(issue?.message ?? "Deadline details are invalid");
}

export function parseDeadlineInput(data: unknown) {
  const result = deadlineInputSchema.safeParse(data);
  if (!result.success) throw deadlineValidationError(result.error);
  return result.data;
}

export function parseDeadlineUpdate(data: unknown) {
  const result = deadlineUpdateSchema.safeParse(data);
  if (!result.success) throw deadlineValidationError(result.error);
  return result.data;
}
