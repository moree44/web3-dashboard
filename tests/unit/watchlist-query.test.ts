import { describe, expect, it, vi } from "vitest";

vi.mock("@/features/watchlist/actions", () => ({
  convertWatchlistToProject: vi.fn(),
  createWatchlistItem: vi.fn(),
  deleteWatchlistItem: vi.fn(),
  getWatchlistPageData: vi.fn(),
  updateWatchlistItem: vi.fn(),
}));

import {
  applyWatchlistConversion,
  removeActiveWatchlistItem,
  upsertActiveWatchlistItem,
} from "@/features/watchlist/watchlist-query";
import type {
  WatchlistItemRecord,
  WatchlistPageData,
} from "@/features/watchlist/watchlist-types";

const activeItem: WatchlistItemRecord = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "Initia",
  xUrl: "https://x.com/initiaFDN",
  thesis: "Interwoven rollups",
  chain: "Cosmos",
  projectTypes: ["L1"],
  itemKind: "project",
  status: "active",
  convertedProjectId: null,
  convertedNftCampaignId: null,
  createdAt: "2026-08-10T00:00:00.000Z",
  updatedAt: "2026-08-10T00:00:00.000Z",
};

const emptyData: WatchlistPageData = {
  activeItems: [],
  convertedItems: [],
};

describe("Watchlist cache updates", () => {
  it("adds and updates active items without duplicates", () => {
    const added = upsertActiveWatchlistItem(emptyData, activeItem);
    const updated = upsertActiveWatchlistItem(added, {
      ...activeItem,
      thesis: "Updated thesis",
    });

    expect(updated.activeItems).toHaveLength(1);
    expect(updated.activeItems[0].thesis).toBe("Updated thesis");
  });

  it("removes a deleted active item", () => {
    const data = { ...emptyData, activeItems: [activeItem] };
    expect(removeActiveWatchlistItem(data, activeItem.id).activeItems).toEqual([]);
  });

  it("moves a converted item into history", () => {
    const data = { ...emptyData, activeItems: [activeItem] };
    const convertedItem: WatchlistItemRecord = {
      ...activeItem,
      status: "converted",
      convertedProjectId: "22222222-2222-4222-8222-222222222222",
    };
    const result = applyWatchlistConversion(data, {
      item: convertedItem,
      targetType: "project",
      targetId: convertedItem.convertedProjectId!,
    });

    expect(result.activeItems).toEqual([]);
    expect(result.convertedItems).toEqual([convertedItem]);
  });
});
