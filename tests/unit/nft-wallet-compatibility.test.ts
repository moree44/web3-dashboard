import { describe, expect, it } from "vitest";

import { areWalletAndCampaignChainsCompatible } from "@/features/nfts/wallet-compatibility";

describe("NFT wallet chain compatibility", () => {
  it("allows an EVM wallet on supported EVM networks", () => {
    expect(areWalletAndCampaignChainsCompatible("EVM", "Base")).toBe(true);
    expect(areWalletAndCampaignChainsCompatible("Ethereum", "Arbitrum")).toBe(true);
    expect(areWalletAndCampaignChainsCompatible("EVM", "Monad")).toBe(true);
  });

  it("matches non-EVM chains by normalized name", () => {
    expect(areWalletAndCampaignChainsCompatible("Solana", "solana")).toBe(true);
    expect(areWalletAndCampaignChainsCompatible("BNB_Chain", "bnb-chain")).toBe(true);
  });

  it("rejects incompatible or unknown wallet chains", () => {
    expect(areWalletAndCampaignChainsCompatible("Solana", "Base")).toBe(false);
    expect(areWalletAndCampaignChainsCompatible(null, "Base")).toBe(false);
  });
});
