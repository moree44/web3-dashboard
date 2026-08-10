import { describe, expect, it } from "vitest";

import {
  projectAssignmentInputSchema,
  projectInputSchema,
  projectUpdateSchema,
} from "@/features/projects/project-schema";

const ACCOUNT_ID = "11111111-1111-4111-8111-111111111111";
const WALLET_ID = "22222222-2222-4222-8222-222222222222";

describe("Project validation", () => {
  it("applies create defaults", () => {
    expect(projectInputSchema.parse({ name: "Custom L1" })).toMatchObject({
      name: "Custom L1",
      huntType: "free_hunts",
      status: "watching",
      priority: "medium",
      workTypes: [],
      projectTypes: [],
      chains: [],
      stageResult: "Not applicable",
    });
  });

  it("does not inject create defaults into partial updates", () => {
    expect(projectUpdateSchema.parse({ logoSource: "uploaded" })).toEqual({
      logoSource: "uploaded",
    });
  });

  it("accepts existing and custom-chain Project Wallet assignments", () => {
    expect(projectAssignmentInputSchema.parse({
      accountIds: [ACCOUNT_ID],
      walletIds: [WALLET_ID],
      newWallets: [{
        label: "New L1 wallet",
        address: "custom1qexample",
        chainType: "NewChain L1",
        ownerAccountId: ACCOUNT_ID,
      }],
    })).toMatchObject({
      accountIds: [ACCOUNT_ID],
      walletIds: [WALLET_ID],
      newWallets: [{ chainType: "NewChain L1" }],
    });
  });

  it("requires a label, address, and chain for a custom wallet", () => {
    expect(() => projectAssignmentInputSchema.parse({
      newWallets: [{ label: "Missing address", address: "", chainType: "NewChain" }],
    })).toThrow("Wallet address is required");
  });

  it("rejects duplicate assignment IDs", () => {
    expect(() => projectAssignmentInputSchema.parse({ walletIds: [WALLET_ID, WALLET_ID] })).toThrow("Each item can only be assigned once");
  });
});
