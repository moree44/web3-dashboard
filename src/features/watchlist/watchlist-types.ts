export const WATCHLIST_PROJECT_TYPES = [
  "ZK",
  "AI",
  "DePIN",
  "L1",
  "L2",
  "Security",
  "Data",
] as const;

export type WatchlistStatus = "active" | "converted";
export type WatchlistItemKind = "project" | "nft";

export type WatchlistInput = {
  name?: string;
  xUrl: string;
  thesis?: string;
  chain?: string;
  projectTypes?: string[];
  itemKind?: WatchlistItemKind;
};

export type WatchlistConversionInput = {
  huntType?: "free_hunts" | "retro" | "waitlist";
  status?: "watching" | "in_progress" | "running" | "paused" | "done" | "dropped" | "archived";
  priority?: "high" | "medium" | "low";
  dateStart?: string | null;
};

export type WatchlistItemRecord = {
  id: string;
  name: string;
  xUrl: string;
  thesis: string | null;
  chain: string | null;
  projectTypes: string[];
  itemKind: WatchlistItemKind;
  status: WatchlistStatus;
  convertedProjectId: string | null;
  convertedNftCampaignId: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};


export type WatchlistConversionResult = {
  item: WatchlistItemRecord;
  targetType: WatchlistItemKind;
  targetId: string;
};

export type WatchlistPageData = {
  activeItems: WatchlistItemRecord[];
  convertedItems: WatchlistItemRecord[];
};
