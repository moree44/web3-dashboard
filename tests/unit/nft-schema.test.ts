import { describe, expect, it } from "vitest";

import { deriveCollectionNameFromXHandle, parseXProfileUrl } from "@/features/nfts/nft-links";
import { nftCampaignInputSchema, nftCampaignUpdateSchema } from "@/features/nfts/nft-schema";

const validCampaign = {
  name: "Genesis Pass",
  chain: "Base",
  status: "whitelisted" as const,
  accountIds: ["11111111-1111-4111-8111-111111111111"],
  walletAssignments: [{
    walletId: "22222222-2222-4222-8222-222222222222",
    status: "whitelisted" as const,
  }],
  mintDate: "2026-08-03",
  mintTime: "20:00",
};

describe("NFT campaign validation", () => {
  it("accepts a complete NFT campaign", () => {
    expect(nftCampaignInputSchema.parse(validCampaign)).toMatchObject(validCampaign);
  });

  it("normalizes a bare mint URL", () => {
    expect(nftCampaignInputSchema.parse({ ...validCampaign, mintUrl: "mint.example.com" }).mintUrl).toBe("https://mint.example.com");
  });

  it("keeps X profile links separate from mint URLs", () => {
    const parsed = nftCampaignInputSchema.parse({ ...validCampaign, xUrl: "x.com/laptopnfts" });

    expect(parsed.xUrl).toBe("https://x.com/laptopnfts");
    expect(parsed.mintUrl).toBeUndefined();
  });

  it("derives a readable collection name from an X handle", () => {
    const parsed = parseXProfileUrl("https://x.com/laptopnfts");

    expect(parsed).toEqual({ handle: "laptopnfts", url: "https://x.com/laptopnfts" });
    expect(deriveCollectionNameFromXHandle(parsed?.handle ?? "")).toBe("LaptopNfts");
  });

  it("accepts custom lifecycle statuses", () => {
    expect(nftCampaignInputSchema.parse({ ...validCampaign, status: "role confirmed" }).status).toBe("role confirmed");
  });

  it("rejects invalid mint times and non-HTTP URLs", () => {
    expect(() => nftCampaignInputSchema.parse({ ...validCampaign, mintTime: "26:00" })).toThrow();
    expect(() => nftCampaignInputSchema.parse({ ...validCampaign, mintUrl: "ftp://mint.example.com" })).toThrow();
  });

  it("rejects non-X profile URLs in the X URL field", () => {
    expect(() => nftCampaignInputSchema.parse({ ...validCampaign, xUrl: "https://example.com/laptopnfts" })).toThrow();
  });

  it("allows campaigns without a mint schedule", () => {
    expect(nftCampaignInputSchema.parse({ name: "TBA Collection", chain: "Solana" })).toMatchObject({
      name: "TBA Collection",
      chain: "Solana",
      status: "watching",
      accountIds: [],
      walletAssignments: [],
    });
  });

  it("rejects duplicate wallet assignments", () => {
    const assignment = validCampaign.walletAssignments[0];
    expect(() => nftCampaignInputSchema.parse({
      ...validCampaign,
      walletAssignments: [assignment, assignment],
    })).toThrow("Each wallet can only be assigned once");
  });

  it("does not inject create defaults into partial updates", () => {
    expect(nftCampaignUpdateSchema.parse({ name: "Updated collection" })).toEqual({
      name: "Updated collection",
    });
  });
});
