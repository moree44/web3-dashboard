import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { NftDialog } from "@/features/nfts/components/nft-dialog";

const actionMocks = vi.hoisted(() => ({
  createNftCampaign: vi.fn(),
  updateNftCampaign: vi.fn(),
  deleteNftCampaign: vi.fn(),
}));

vi.mock("@/features/nfts/actions", () => actionMocks);

const account = {
  id: "11111111-1111-4111-8111-111111111111",
  label: "Moree",
  avatarUrl: null,
};

const wallet = {
  id: "55555555-5555-4555-8555-555555555555",
  label: "Moree main",
  address: "0x1234567890abcdef1234567890abcdef12345678",
  ownerAccountId: account.id,
  chainType: "EVM",
  walletType: "main" as const,
};

describe("NftDialog", () => {
  afterEach(cleanup);

  beforeEach(() => {
    vi.clearAllMocks();
    actionMocks.createNftCampaign.mockResolvedValue({
      id: "22222222-2222-4222-8222-222222222222",
      workspaceId: "33333333-3333-4333-8333-333333333333",
      name: "Genesis Pass",
      chain: "Base",
      status: "whitelisted",
      mintUrl: "https://mint.example.com",
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      assignedAccounts: [account],
      assignedWallets: [{ ...wallet, status: "planned" }],
      mintDeadlineId: "44444444-4444-4444-8444-444444444444",
      mintDate: "2026-08-03",
      mintTime: "20:00:00",
      mintDeadlineStatus: "upcoming",
    });
  });

  it("creates an NFT campaign and normalizes its mint URL", async () => {
    const onClose = vi.fn();
    const onSaved = vi.fn();
    render(<NftDialog open accounts={[account]} wallets={[wallet]} onClose={onClose} onSaved={onSaved} onDeleted={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText("Collection or campaign name"), { target: { value: "Genesis Pass" } });
    fireEvent.change(screen.getByPlaceholderText("Ethereum, Solana, Base..."), { target: { value: "Base" } });
    fireEvent.click(screen.getByRole("button", { name: "Moree" }));
    fireEvent.click(screen.getByLabelText("Mint date, optional"));
    fireEvent.click(screen.getByRole("button", { name: "Today" }));
    fireEvent.change(screen.getByLabelText("Mint time in 24-hour format"), { target: { value: "20:00" } });
    const mintUrl = screen.getByPlaceholderText("mint.example.com");
    fireEvent.change(mintUrl, { target: { value: "mint.example.com" } });
    fireEvent.blur(mintUrl);
    fireEvent.click(screen.getByRole("button", { name: "Create NFT" }));

    await waitFor(() => expect(actionMocks.createNftCampaign).toHaveBeenCalledTimes(1));
    expect(actionMocks.createNftCampaign).toHaveBeenCalledWith(expect.objectContaining({
      name: "Genesis Pass",
      chain: "Base",
      accountIds: [account.id],
      walletAssignments: [{ walletId: wallet.id, status: "planned" }],
      mintTime: "20:00",
      mintUrl: "https://mint.example.com",
    }));
    expect(onSaved).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
