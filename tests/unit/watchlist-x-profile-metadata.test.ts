import { afterEach, describe, expect, it, vi } from "vitest";

import {
  fetchWatchlistXProfile,
  parseMicrolinkXProfile,
} from "@/features/watchlist/x-profile-metadata";

const profileResponse = {
  status: "success",
  data: {
    author: "Laptop",
    title: "Laptop (@laptopnfts) on X",
    description: "1,000 laptop nfts. @RobinhoodApp. September 9.",
  },
};

describe("Watchlist X profile metadata", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("extracts bounded plain-text profile fields", () => {
    expect(parseMicrolinkXProfile({
      status: "success",
      data: {
        author: "  Laptop  ",
        title: null,
        description: "Public\nprofile   bio",
      },
    })).toEqual({
      name: "Laptop",
      thesis: "Public profile bio",
    });
  });

  it("rejects malformed and empty metadata responses", () => {
    expect(parseMicrolinkXProfile({ status: "error" })).toBeNull();
    expect(parseMicrolinkXProfile({
      status: "success",
      data: { author: "", title: "", description: "" },
    })).toBeNull();
  });

  it("returns metadata from the bounded Microlink request", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers(),
      text: vi.fn().mockResolvedValue(JSON.stringify(profileResponse)),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchWatchlistXProfile("https://x.com/laptopnfts")).resolves.toEqual({
      name: "Laptop",
      thesis: "1,000 laptop nfts. @RobinhoodApp. September 9.",
    });

    const requestedUrl = fetchMock.mock.calls[0]?.[0];
    expect(requestedUrl).toBeInstanceOf(URL);
    expect((requestedUrl as URL).origin).toBe("https://api.microlink.io");
    expect((requestedUrl as URL).searchParams.get("url")).toBe("https://x.com/laptopnfts");
  });

  it("falls back without throwing when the provider fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("provider unavailable")));

    await expect(fetchWatchlistXProfile("https://x.com/laptopnfts")).resolves.toBeNull();
  });
});
