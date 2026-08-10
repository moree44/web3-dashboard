import { z } from "zod";

import {
  HUNT_TYPES,
  PROJECT_PRIORITIES,
  PROJECT_STATUSES,
} from "@/features/projects/project-query";
import { isHttpUrl, normalizeHttpUrl } from "@/lib/url";

const RESERVED_X_PATHS = new Set([
  "compose",
  "explore",
  "home",
  "i",
  "messages",
  "notifications",
  "search",
  "settings",
]);

function isXProfileUrl(value: string) {
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();
    const supportedHost =
      hostname === "x.com" ||
      hostname.endsWith(".x.com") ||
      hostname === "twitter.com" ||
      hostname.endsWith(".twitter.com");
    const handle = url.pathname.split("/").filter(Boolean)[0]?.toLowerCase();
    return Boolean(supportedHost && handle && !RESERVED_X_PATHS.has(handle));
  } catch {
    return false;
  }
}

export function deriveWatchlistName(xUrl: string) {
  const url = new URL(xUrl);
  const handle = url.pathname.split("/").filter(Boolean)[0];
  if (!handle) throw new Error("Enter an X profile URL");
  return decodeURIComponent(handle).replace(/^@/, "");
}

const xProfileUrl = z.preprocess(
  (value) => typeof value === "string" ? normalizeHttpUrl(value) : value,
  z.string()
    .trim()
    .url("Enter a valid X profile URL")
    .refine(isHttpUrl, "Only http or https URLs are supported")
    .refine(isXProfileUrl, "Enter an X or Twitter profile URL"),
);

const optionalText = (max: number) => z.string().trim().max(max).optional().default("");
const tags = z.array(z.string().trim().min(1).max(80)).max(10).default([]);

export const watchlistInputSchema = z.object({
  name: optionalText(120),
  xUrl: xProfileUrl,
  thesis: optionalText(2000),
  chain: optionalText(80),
  projectTypes: tags,
}).transform((input) => ({
  ...input,
  name: input.name || deriveWatchlistName(input.xUrl),
}));

export const watchlistUpdateSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  xUrl: xProfileUrl,
  thesis: optionalText(2000),
  chain: optionalText(80),
  projectTypes: tags,
});

export const watchlistConversionSchema = z.object({
  huntType: z.enum(HUNT_TYPES).default("free_hunts"),
  status: z.enum(PROJECT_STATUSES).default("in_progress"),
  priority: z.enum(PROJECT_PRIORITIES).default("medium"),
  dateStart: z.union([z.literal(""), z.string().date()]).nullable().optional(),
});

function validationError(error: z.ZodError) {
  return new Error(error.issues[0]?.message ?? "Watchlist details are invalid");
}

export function parseWatchlistInput(input: unknown) {
  const result = watchlistInputSchema.safeParse(input);
  if (!result.success) throw validationError(result.error);
  return result.data;
}

export function parseWatchlistUpdate(input: unknown) {
  const result = watchlistUpdateSchema.safeParse(input);
  if (!result.success) throw validationError(result.error);
  return result.data;
}

export function parseWatchlistConversion(input: unknown) {
  const result = watchlistConversionSchema.safeParse(input);
  if (!result.success) throw validationError(result.error);
  return result.data;
}
