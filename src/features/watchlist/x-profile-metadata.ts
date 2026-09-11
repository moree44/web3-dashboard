import { z } from "zod";

const MICROLINK_ENDPOINT = "https://api.microlink.io/";
const MAX_RESPONSE_BYTES = 100_000;
const REQUEST_TIMEOUT_MS = 4_000;

const microlinkResponseSchema = z.object({
  status: z.literal("success"),
  data: z.object({
    author: z.string().nullable().optional(),
    title: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
  }),
});

export type WatchlistXProfileMetadata = {
  name: string | null;
  thesis: string | null;
};

function cleanText(value: string | null | undefined, maxLength: number) {
  const cleaned = value?.replace(/\s+/g, " ").trim();
  return cleaned ? cleaned.slice(0, maxLength) : null;
}

function nameFromTitle(title: string | null | undefined) {
  const cleaned = cleanText(title, 240);
  if (!cleaned) return null;
  return cleanText(cleaned.replace(/\s+\(@[^)]+\)\s+on X$/i, ""), 120);
}

export function parseMicrolinkXProfile(value: unknown): WatchlistXProfileMetadata | null {
  const result = microlinkResponseSchema.safeParse(value);
  if (!result.success) return null;

  const name = cleanText(result.data.data.author, 120)
    ?? nameFromTitle(result.data.data.title);
  const thesis = cleanText(result.data.data.description, 2_000);
  if (!name && !thesis) return null;

  return { name, thesis };
}

export async function fetchWatchlistXProfile(
  xUrl: string,
): Promise<WatchlistXProfileMetadata | null> {
  const endpoint = new URL(MICROLINK_ENDPOINT);
  endpoint.searchParams.set("url", xUrl);
  endpoint.searchParams.set("meta", "true");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(endpoint, {
      cache: "no-store",
      headers: { accept: "application/json" },
      signal: controller.signal,
    });
    if (!response.ok) return null;

    const contentLength = Number(response.headers.get("content-length") ?? 0);
    if (contentLength > MAX_RESPONSE_BYTES) return null;

    const body = await response.text();
    if (body.length > MAX_RESPONSE_BYTES) return null;

    return parseMicrolinkXProfile(JSON.parse(body) as unknown);
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
