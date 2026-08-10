import { describe, expect, it } from "vitest";

import { buildProjectFromWatchlist } from "@/features/watchlist/watchlist-conversion";
import {
  parseWatchlistConversion,
  parseWatchlistInput,
  parseWatchlistUpdate,
} from "@/features/watchlist/watchlist-schema";

describe("Watchlist validation", () => {
  it("normalizes an X profile URL and derives the name", () => {
    expect(parseWatchlistInput({ xUrl: "x.com/initiaFDN" })).toEqual({
      name: "initiaFDN",
      xUrl: "https://x.com/initiaFDN",
      thesis: "",
      chain: "",
      projectTypes: [],
    });
  });

  it("accepts an explicit name and optional classification", () => {
    expect(parseWatchlistInput({
      name: "Initia",
      xUrl: "https://twitter.com/initiaFDN",
      thesis: "Interwoven rollups thesis",
      chain: "Cosmos",
      projectTypes: ["L1", "Data"],
    })).toMatchObject({
      name: "Initia",
      chain: "Cosmos",
      projectTypes: ["L1", "Data"],
    });
  });

  it("rejects non-profile and non-X URLs", () => {
    expect(() => parseWatchlistInput({ xUrl: "https://x.com/home" })).toThrow(
      "Enter an X or Twitter profile URL",
    );
    expect(() => parseWatchlistInput({ xUrl: "https://example.com/project" })).toThrow(
      "Enter an X or Twitter profile URL",
    );
  });

  it("requires a name for edits", () => {
    expect(() => parseWatchlistUpdate({ name: "", xUrl: "x.com/initiaFDN" })).toThrow(
      "Name is required",
    );
  });

  it("applies safe Project conversion defaults", () => {
    expect(parseWatchlistConversion({})).toEqual({
      huntType: "free_hunts",
      status: "in_progress",
      priority: "medium",
    });
  });
});

describe("Watchlist conversion mapping", () => {
  it("moves discovery fields into a Project without requiring a logo", () => {
    expect(buildProjectFromWatchlist({
      name: "Initia",
      xUrl: "https://x.com/initiaFDN",
      thesis: "Interwoven rollups thesis",
      chain: "Cosmos",
      projectTypes: ["L1"],
    }, {
      huntType: "free_hunts",
      status: "in_progress",
      priority: "medium",
    }, "2026-08-10")).toMatchObject({
      name: "Initia",
      twitterUrl: "https://x.com/initiaFDN",
      description: "Interwoven rollups thesis",
      notes: "Interwoven rollups thesis",
      chains: ["Cosmos"],
      projectTypes: ["L1"],
      dateStart: "2026-08-10",
      logoSource: "none",
    });
  });
});
