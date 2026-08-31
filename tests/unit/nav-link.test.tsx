import { fireEvent, render, screen } from "@testing-library/react";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { NavLink } from "@/components/layout/nav-link";

const prefetch = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({ prefetch }),
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    prefetch: linkPrefetch,
    ...props
  }: Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
    children: ReactNode;
    href: string | { href?: string; pathname?: string };
    prefetch?: boolean;
  }) => (
    <a
      {...props}
      href={typeof href === "string" ? href : href.href ?? href.pathname}
      data-prefetch={String(linkPrefetch)}
    >
      {children}
    </a>
  ),
}));

describe("NavLink", () => {
  beforeEach(() => {
    prefetch.mockClear();
  });

  it("disables viewport prefetch and prefetches on hover", () => {
    render(<NavLink href="/tasks">Tasks</NavLink>);

    const link = screen.getByRole("link", { name: "Tasks" });
    expect(link).toHaveAttribute("data-prefetch", "false");

    fireEvent.mouseEnter(link);
    expect(prefetch).toHaveBeenCalledWith("/tasks");
  });

  it("prefetches on touch start for mobile navigation", () => {
    render(<NavLink href="/daily">Daily</NavLink>);

    fireEvent.touchStart(screen.getByRole("link", { name: "Daily" }));
    expect(prefetch).toHaveBeenCalledWith("/daily");
  });
});
