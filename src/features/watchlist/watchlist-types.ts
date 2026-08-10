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

export type WatchlistInput = {
  name?: string;
  xUrl: string;
  thesis?: string;
  chain?: string;
  projectTypes?: string[];
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
  status: WatchlistStatus;
  convertedProjectId: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type ConvertedProjectRecord = {
  id: string;
  name: string;
  twitterUrl: string | null;
  description: string | null;
  notes: string | null;
  chains: string[];
  projectTypes: string[] | null;
};

export type WatchlistConversionResult = {
  item: WatchlistItemRecord;
  project: ConvertedProjectRecord;
};
