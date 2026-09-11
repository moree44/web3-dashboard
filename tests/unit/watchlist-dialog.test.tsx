import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { WatchlistDialog } from "@/features/watchlist/components/watchlist-dialog";

const actionMocks = vi.hoisted(() => ({
  lookupWatchlistXProfile: vi.fn(),
}));

vi.mock("@/features/watchlist/actions", () => actionMocks);

describe("WatchlistDialog", () => {
  afterEach(cleanup);

  beforeEach(() => {
    vi.clearAllMocks();
    actionMocks.lookupWatchlistXProfile.mockResolvedValue({
      name: "Laptop",
      thesis: "1,000 laptop nfts. @RobinhoodApp. September 9.",
    });
  });

  it("imports the display name and bio when an X profile URL is pasted", async () => {
    render(
      <WatchlistDialog
        open
        onClose={vi.fn()}
        onSave={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    fireEvent.paste(screen.getByPlaceholderText("x.com/project"), {
      clipboardData: {
        getData: () => "https://x.com/laptopnfts",
      },
    });

    await waitFor(() => expect(actionMocks.lookupWatchlistXProfile).toHaveBeenCalledWith(
      "https://x.com/laptopnfts",
    ));
    expect(await screen.findByDisplayValue("Laptop")).toBeInTheDocument();
    expect(screen.getByDisplayValue("1,000 laptop nfts. @RobinhoodApp. September 9.")).toBeInTheDocument();
  });

  it("does not overwrite a manually entered name or thesis", async () => {
    render(
      <WatchlistDialog
        open
        onClose={vi.fn()}
        onSave={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText("Derived from the X handle when empty"), {
      target: { value: "My project" },
    });
    fireEvent.change(screen.getByPlaceholderText("Why this project may be worth monitoring..."), {
      target: { value: "My thesis" },
    });
    fireEvent.paste(screen.getByPlaceholderText("x.com/project"), {
      clipboardData: {
        getData: () => "https://x.com/laptopnfts",
      },
    });

    await waitFor(() => expect(actionMocks.lookupWatchlistXProfile).toHaveBeenCalledTimes(1));
    expect(screen.getByDisplayValue("My project")).toBeInTheDocument();
    expect(screen.getByDisplayValue("My thesis")).toBeInTheDocument();
  });
});
