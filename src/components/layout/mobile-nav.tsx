import { CalendarCheck2, FolderKanban, Inbox, LayoutDashboard, Plus, UsersRound } from "lucide-react";
import Link from "next/link";

import type { AppSection } from "@/components/layout/app-sidebar";
import { cn } from "@/lib/utils";

const items = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Inbox", href: "/inbox", icon: Inbox },
  { label: "Daily", href: "/daily", icon: CalendarCheck2 },
  { label: "Projects", href: "/projects", icon: FolderKanban },
  { label: "Accounts", href: "/accounts", icon: UsersRound },
] as const;

export function MobileNav({ active }: { active: AppSection }) {
  return (
    <>
      <button
        className="fixed bottom-[calc(5.25rem+env(safe-area-inset-bottom,0px))] right-4 z-30 grid size-12 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-black/30 transition-transform active:scale-95 lg:hidden"
        aria-label="Quick create"
      >
        <Plus aria-hidden="true" className="size-5" />
      </button>
      <nav
        className="fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom,0px))] z-20 grid h-16 grid-cols-5 rounded-2xl border border-border bg-secondary px-2 shadow-xl shadow-black/30 lg:hidden"
        aria-label="Mobile navigation"
      >
        {items.map(({ label, href, icon: Icon }) => (
          <Link
            key={label}
            href={href}
            aria-current={active === label ? "page" : undefined}
            className={cn("flex flex-col items-center justify-center gap-1 text-[10px] font-medium", active === label ? "text-primary" : "text-muted-foreground")}
          >
            <Icon aria-hidden="true" className="size-[18px]" />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}
