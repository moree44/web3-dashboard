import type { projectWatchlistItems, projects } from "@/lib/db/schema";

type WatchlistRow = Pick<
  typeof projectWatchlistItems.$inferSelect,
  "name" | "xUrl" | "thesis" | "chain" | "projectTypes"
>;

type ParsedConversion = {
  huntType: "free_hunts" | "retro" | "waitlist";
  status: "watching" | "in_progress" | "running" | "paused" | "done" | "dropped" | "archived";
  priority: "high" | "medium" | "low";
  dateStart?: string | null;
};

export function buildProjectFromWatchlist(
  item: WatchlistRow,
  conversion: ParsedConversion,
  fallbackDate: string,
): Omit<typeof projects.$inferInsert, "workspaceId"> {
  const thesis = item.thesis?.trim() || null;
  const chain = item.chain?.trim();

  return {
    name: item.name,
    description: thesis,
    notes: thesis,
    twitterUrl: item.xUrl,
    chains: chain ? [chain] : [],
    projectTypes: item.projectTypes,
    workTypes: [],
    huntType: conversion.huntType,
    status: conversion.status,
    priority: conversion.priority,
    stageResult: "Not applicable",
    progressEstimate: "0",
    dateStart: conversion.dateStart || fallbackDate,
    logoSource: "none",
    isArchived: false,
  };
}
