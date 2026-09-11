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
const X_HANDLE_PATTERN = /^[A-Za-z0-9_]{1,15}$/;

export function parseXProfileUrl(value: string) {
  const normalized = normalizeHttpUrl(value);
  if (!normalized) return null;

  try {
    const url = new URL(normalized);
    const hostname = url.hostname.toLowerCase();
    const supportedHost =
      hostname === "x.com" ||
      hostname.endsWith(".x.com") ||
      hostname === "twitter.com" ||
      hostname.endsWith(".twitter.com");
    const handle = decodeURIComponent(url.pathname.split("/").filter(Boolean)[0] ?? "").replace(/^@/, "");

    if (!supportedHost || !X_HANDLE_PATTERN.test(handle) || RESERVED_X_PATHS.has(handle.toLowerCase()) || !isHttpUrl(normalized)) {
      return null;
    }

    return {
      handle,
      url: "https://x.com/" + handle,
    };
  } catch {
    return null;
  }
}

export function deriveCollectionNameFromXHandle(handle: string) {
  const cleaned = handle.replace(/^@/, "").replace(/[_-]+/g, " ").trim();
  if (!cleaned) return "";

  if (/\s/.test(cleaned)) {
    return cleaned
      .split(/\s+/)
      .map((part) => titleCaseHandlePart(part))
      .join(" ");
  }

  return titleCaseHandlePart(cleaned);
}

function titleCaseHandlePart(value: string) {
  if (!value) return value;
  const nftsMatch = value.match(/^(.*?)(nfts?)$/i);
  if (nftsMatch?.[1] && nftsMatch[2]) {
    return uppercaseFirst(nftsMatch[1]) + (nftsMatch[2].toLowerCase() === "nft" ? "Nft" : "Nfts");
  }
  return uppercaseFirst(value);
}

function uppercaseFirst(value: string) {
  return value.slice(0, 1).toUpperCase() + value.slice(1);
}
