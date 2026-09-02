import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AccountsPreview } from "@/features/accounts/components/accounts-preview";
import { accountsPreviewData } from "@/features/accounts/preview-data";

vi.mock("@/features/accounts/actions", () => ({
  // The real-mode query refetches on mount (staleTime 0). A bare stub is fine:
  // AccountsPreview falls back to initialData when the query data is undefined.
  getAccountsWorkspaceData: vi.fn(async () => undefined),
  createAccount: vi.fn(),
  updateAccount: vi.fn(),
  deleteAccount: vi.fn(),
  uploadAccountAvatar: vi.fn(),
  setAccountAvatarUrl: vi.fn(),
  createWallet: vi.fn(),
  updateWallet: vi.fn(),
  deleteWallet: vi.fn(),
  createWalletGroup: vi.fn(),
  updateWalletGroup: vi.fn(),
  deleteWalletGroup: vi.fn(),
}));

function renderWithQuery(ui: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

function renderAccountsPreview(props: { developmentPreview?: boolean } = {}) {
  return renderWithQuery(
    <AccountsPreview initialData={accountsPreviewData} developmentPreview={props.developmentPreview ?? true} />,
  );
}

describe("AccountsPreview", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it("adds an account through the dialog in development preview", async () => {
    renderAccountsPreview();

    fireEvent.click(screen.getByRole("button", { name: "Add account" }));
    expect(screen.getByRole("heading", { name: "New Account" })).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText("e.g. Moree"), { target: { value: "Test Hunt" } });
    fireEvent.click(screen.getByRole("button", { name: "Create" }));

    await waitFor(() => expect(screen.getAllByText("Test Hunt").length).toBeGreaterThan(0));
    await waitFor(() => expect(screen.queryByRole("heading", { name: "New Account" })).not.toBeInTheDocument());
  });

  it("edits an account label through the detail drawer in development preview", async () => {
    renderAccountsPreview();

    fireEvent.click(screen.getAllByText("Moree")[0]);
    expect(screen.getByRole("dialog", { name: "Account detail" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    const label = screen.getByDisplayValue("Moree");
    fireEvent.change(label, { target: { value: "Moree Prime" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(screen.queryByDisplayValue("Moree")).not.toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "Close account detail" }));
    expect(screen.getAllByText("Moree Prime").length).toBeGreaterThan(0);
  });

  it("deletes an account after inline confirmation in development preview", async () => {
    renderAccountsPreview();

    expect(screen.getAllByText("Moree").length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: "More options for Moree" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm delete" }));

    await waitFor(() => expect(screen.queryAllByText("Moree")).toHaveLength(0));
  });

  it("adds a wallet through the wallet dialog in development preview", async () => {
    renderAccountsPreview();

    fireEvent.click(screen.getByRole("button", { name: "Wallets" }));
    fireEvent.click(screen.getByRole("button", { name: "Add wallet" }));
    expect(screen.getByRole("heading", { name: "New Wallet" })).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText("e.g. Moree EVM Main"), { target: { value: "Sol Burner" } });
    fireEvent.change(screen.getByPlaceholderText("0x..."), { target: { value: "0x1234" } });
    fireEvent.click(screen.getByRole("button", { name: "Create" }));

    await waitFor(() => expect(screen.getAllByText("Sol Burner").length).toBeGreaterThan(0));
    await waitFor(() => expect(screen.queryByRole("heading", { name: "New Wallet" })).not.toBeInTheDocument());
  });
});
