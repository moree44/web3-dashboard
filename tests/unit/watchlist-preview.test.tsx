import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { WatchlistPreview } from "@/features/watchlist/components/watchlist-preview";
import type { WatchlistItemRecord, WatchlistPageData } from "@/features/watchlist/watchlist-types";

vi.mock("@/features/watchlist/components/watchlist-dialog", () => ({
  WatchlistDialog: () => null,
}));

vi.mock("@/features/watchlist/watchlist-query", () => ({
  useWatchlistWorkspace: (initialData: WatchlistPageData) => ({ data: initialData }),
  useWatchlistMutations: () => ({
    saveMutation: { isPending: false, mutateAsync: vi.fn() },
    deleteMutation: { isPending: false, mutateAsync: vi.fn() },
    convertMutation: { isPending: false, mutateAsync: vi.fn(), variables: undefined },
  }),
}));

function item(overrides: Partial<WatchlistItemRecord>): WatchlistItemRecord {
  return {
    id: "watchlist-item",
    name: "Project Alpha",
    xUrl: "https://x.com/projectalpha",
    thesis: null,
    chain: null,
    projectTypes: [],
    itemKind: "project",
    status: "active",
    convertedProjectId: null,
    convertedNftCampaignId: null,
    createdAt: null,
    updatedAt: null,
    ...overrides,
  };
}

const data: WatchlistPageData = {
  activeItems: [
    item({ id: "project", name: "Project Alpha" }),
    item({ id: "nft", name: "NFT Beta", itemKind: "nft", chain: "Ethereum" }),
  ],
  convertedItems: [
    item({
      id: "converted-nft",
      name: "NFT Gamma",
      itemKind: "nft",
      status: "converted",
      convertedNftCampaignId: "campaign-id",
    }),
  ],
};

describe("WatchlistPreview", () => {
  afterEach(cleanup);

  it("keeps one Add details action and places the quick item type below the X field", () => {
    render(<WatchlistPreview initialData={data} />);

    expect(screen.getAllByRole("button", { name: "Add details" })).toHaveLength(1);
    expect(screen.queryByText(/Public profile name and bio/i)).not.toBeInTheDocument();

    const quickType = screen.getByRole("group", { name: "Quick add item type" });
    expect(within(quickType).getByRole("button", { name: "Project" })).toHaveAttribute("aria-pressed", "true");
    expect(within(quickType).getByRole("button", { name: "NFT" })).toBeInTheDocument();
  });

  it("filters Project and NFT items within Active and Converted views", () => {
    render(<WatchlistPreview initialData={data} />);

    const typeFilter = screen.getByRole("group", { name: "Watchlist item type filter" });
    fireEvent.click(within(typeFilter).getByRole("button", { name: "NFTs" }));
    expect(screen.queryByText("Project Alpha")).not.toBeInTheDocument();
    expect(screen.getAllByText("NFT Beta").length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: /Converted/ }));
    expect(screen.queryByText("NFT Beta")).not.toBeInTheDocument();
    expect(screen.getAllByText("NFT Gamma").length).toBeGreaterThan(0);

    fireEvent.click(within(typeFilter).getByRole("button", { name: "Projects" }));
    expect(screen.queryByText("NFT Gamma")).not.toBeInTheDocument();
    expect(screen.getByText("No Project items in this view.")).toBeInTheDocument();
  });
});
