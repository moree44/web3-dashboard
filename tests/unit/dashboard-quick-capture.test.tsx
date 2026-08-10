import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DashboardQuickCapture } from "@/features/dashboard/components/dashboard-quick-capture";
import { createInboxItem } from "@/features/inbox/actions";
import { createWatchlistItem } from "@/features/watchlist/actions";

vi.mock("@/features/inbox/actions", () => ({
  createInboxItem: vi.fn(),
}));

vi.mock("@/features/watchlist/actions", () => ({
  createWatchlistItem: vi.fn(),
}));

describe("DashboardQuickCapture", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("saves the Watchlist intent directly to Project Watchlist", async () => {
    vi.mocked(createWatchlistItem).mockResolvedValue({
      id: "11111111-1111-4111-8111-111111111111",
      name: "initiaFDN",
      xUrl: "https://x.com/initiaFDN",
      thesis: null,
      chain: null,
      projectTypes: [],
      status: "active",
      convertedProjectId: null,
      createdAt: null,
      updatedAt: null,
    });

    render(<DashboardQuickCapture />);
    fireEvent.click(screen.getByRole("button", { name: "Watchlist" }));
    const input = screen.getByLabelText("Quick capture");
    fireEvent.change(input, { target: { value: "x.com/initiaFDN" } });
    fireEvent.submit(input.closest("form")!);

    await waitFor(() => expect(createWatchlistItem).toHaveBeenCalledWith({
      xUrl: "x.com/initiaFDN",
    }));
    expect(createInboxItem).not.toHaveBeenCalled();
    expect(await screen.findByText("Saved to Watchlist")).toBeInTheDocument();
  });

  it("keeps the default Inbox intent in Inbox", async () => {
    vi.mocked(createInboxItem).mockResolvedValue({
      id: "22222222-2222-4222-8222-222222222222",
      title: "Remember this",
      content: "Inbox capture from Dashboard",
      url: null,
      sender: null,
      receivedAt: null,
      priority: "medium",
      status: "new",
      source: "manual",
      detectedProjectName: null,
      linkedProjectId: null,
      linkedProjectName: null,
      linkedTaskId: null,
      linkedTaskTitle: null,
      linkedNoteId: null,
      linkedNoteTitle: null,
      createdAt: null,
      updatedAt: null,
    });

    render(<DashboardQuickCapture />);
    const input = screen.getByLabelText("Quick capture");
    fireEvent.change(input, { target: { value: "Remember this" } });
    fireEvent.submit(input.closest("form")!);

    await waitFor(() => expect(createInboxItem).toHaveBeenCalled());
    expect(createWatchlistItem).not.toHaveBeenCalled();
    expect(await screen.findByText("Saved to Inbox")).toBeInTheDocument();
  });
});
