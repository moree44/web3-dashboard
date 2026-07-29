import { createElement } from "react";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/projects",
  useRouter: () => ({ replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/features/projects/actions", () => ({
  archiveProject: vi.fn(),
  createProject: vi.fn(),
  deleteProject: vi.fn(),
  updateProject: vi.fn(),
  uploadProjectLogo: vi.fn(),
}));

vi.mock("@/lib/use-drawer-dismiss", () => ({
  useDrawerDismiss: vi.fn(),
}));

import { AccountAvatarGroup } from "@/features/projects/components/projects-preview";

const assignedAccounts = [
  { id: "account-1", label: "Moree", avatarUrl: "https://example.com/moree.jpg" },
  { id: "account-2", label: "Wdym", avatarUrl: null },
  { id: "account-3", label: "Wayss", avatarUrl: null },
  { id: "account-4", label: "Alpha", avatarUrl: null },
  { id: "account-5", label: "Beta", avatarUrl: null },
  { id: "account-6", label: "Gamma", avatarUrl: null },
];

describe("AccountAvatarGroup", () => {
  it("opens +N to show every assigned account and supports dismissal", async () => {
    render(createElement(AccountAvatarGroup, {
      accounts: assignedAccounts.map((account) => account.label),
      accountDetails: assignedAccounts,
    }));

    const overflowButton = screen.getByRole("button", {
      name: "View all 6 assigned accounts",
    });
    expect(overflowButton).toHaveTextContent("+2");

    fireEvent.click(overflowButton);
    const popover = screen.getByRole("dialog", { name: "All assigned accounts" });
    for (const account of assignedAccounts) {
      expect(within(popover).getByText(account.label)).toBeVisible();
    }

    const scrollArea = popover.querySelector(".overflow-y-auto");
    expect(scrollArea).not.toBeNull();
    fireEvent.scroll(scrollArea as Element);
    expect(screen.getByRole("dialog", { name: "All assigned accounts" })).toBeVisible();

    fireEvent.keyDown(window, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "All assigned accounts" })).not.toBeInTheDocument());
    await waitFor(() => expect(overflowButton).toHaveFocus());

    fireEvent.click(overflowButton);
    expect(screen.getByRole("dialog", { name: "All assigned accounts" })).toBeVisible();
    fireEvent.pointerDown(document.body);
    expect(screen.queryByRole("dialog", { name: "All assigned accounts" })).not.toBeInTheDocument();
  });
});
