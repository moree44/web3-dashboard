export const DEFAULT_NFT_STATUSES = [
  "watching",
  "whitelisted",
  "upcoming",
  "minted",
  "missed",
] as const;

const statusLabels: Record<(typeof DEFAULT_NFT_STATUSES)[number], string> = {
  watching: "Watching",
  whitelisted: "Whitelist",
  upcoming: "Upcoming",
  minted: "Minted",
  missed: "Missed",
};

export function formatNftStatus(value: string) {
  if (isDefaultNftStatus(value)) return statusLabels[value];
  return value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(" ");
}

export function normalizeCustomOption(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function uniqueOptions(values: string[]) {
  const seen = new Set<string>();
  const options: string[] = [];
  for (const value of values.map(normalizeCustomOption).filter(Boolean)) {
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    options.push(value);
  }
  return options;
}

function isDefaultNftStatus(value: string): value is (typeof DEFAULT_NFT_STATUSES)[number] {
  return DEFAULT_NFT_STATUSES.includes(value as (typeof DEFAULT_NFT_STATUSES)[number]);
}
