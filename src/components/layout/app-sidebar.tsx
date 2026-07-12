"use client";

import { useState } from "react";

import {
  Archive,
  BookOpenText,
  CalendarCheck2,
  ChevronDown,
  Eye,
  FolderKanban,
  Inbox,
  LayoutDashboard,
  ListChecks,
  Radar,
  Settings,
  TrendingUp,
  UsersRound,
} from "lucide-react";
import Link from "next/link";

import { LogoutButton } from "@/features/auth/components/logout-button";
import { cn } from "@/lib/utils";

export type AppSection = "Dashboard" | "Inbox" | "Docs" | "Daily" | "Projects" | "Trading" | "Tasks" | "Accounts" | "Archive" | "Settings";

const mainNavigation = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Inbox", href: "/inbox", icon: Inbox, count: 4 },
  { label: "Docs", href: "/docs", icon: BookOpenText },
] as const;

const projectNavigation = [
  { label: "All Project", href: "/projects", icon: FolderKanban, active: "Projects" },
  { label: "Watchlist", href: "/projects?view=watchlist", icon: Eye, active: "Projects" },
  { label: "Daily", href: "/daily", icon: CalendarCheck2, active: "Daily" },
  { label: "Tasks", href: "/tasks", icon: ListChecks, active: "Tasks" },
] as const;

const lowerNavigation = [
  { label: "Accounts", href: "/accounts", icon: UsersRound },
  { label: "Archive", href: "/archive", icon: Archive },
  { label: "Trading", href: "#", icon: TrendingUp, placeholder: true },
] as const;

export function AppSidebar({ active }: { active: AppSection }) {
  const projectGroupActive = active === "Projects" || active === "Daily" || active === "Tasks";
  const [projectOpen, setProjectOpen] = useState(true);

  return (
    <aside className="hidden h-full flex-col border-r soft-divider bg-secondary px-4 py-5 lg:flex">
      <Link href="/" className="flex items-center gap-3 rounded-xl px-1 py-1.5 focus-visible:ring-2 focus-visible:ring-ring">
        <span className="soft-control grid size-9 place-items-center rounded-xl border border-white/[0.06] bg-card text-foreground">
          <Radar aria-hidden="true" className="size-4" strokeWidth={1.8} />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-[13px] font-semibold">Hunting OS</span>
          <span className="block truncate text-[11px] text-muted-foreground">Moree&apos;s workspace</span>
        </span>
      </Link>

      <div className="my-5 h-px bg-border" />

      <div className="space-y-5">
        <div>
          <p className="mb-2 px-2 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Workspace</p>
          <nav className="space-y-1" aria-label="Main navigation">
            {mainNavigation.map(({ label, href, icon: Icon, ...item }) => (
              <NavItem key={label} label={label} href={href} icon={Icon} active={active === label} count={"count" in item ? item.count : undefined} />
            ))}

            <div className="pt-1">
              <button
                type="button"
                aria-expanded={projectOpen}
                aria-current={projectGroupActive ? "page" : undefined}
                onClick={() => setProjectOpen((value) => !value)}
                className={cn(
                  "flex h-9 w-full items-center gap-3 rounded-lg px-3 text-left text-[13px] font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                  projectGroupActive ? "text-foreground" : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                )}
              >
                <FolderKanban aria-hidden="true" className="size-4" strokeWidth={1.8} />
                <span className="min-w-0 flex-1 truncate">Projects</span>
                <ChevronDown aria-hidden="true" className={cn("size-3.5 text-muted-foreground transition-transform", projectOpen ? "rotate-0" : "-rotate-90")} strokeWidth={1.8} />
              </button>

              {projectOpen ? <div className="mt-1 space-y-0.5 pl-4">
                {projectNavigation.map(({ label, href, icon: Icon, active: itemActive }) => {
                  const isActive = label === "All Project" ? active === "Projects" : label === "Watchlist" ? false : active === itemActive;
                  return (
                    <Link
                      key={label}
                      href={href}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "flex h-8 items-center gap-2.5 rounded-lg px-3 text-[12px] font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                        isActive ? "soft-control border border-border bg-accent text-foreground" : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                      )}
                    >
                      <Icon aria-hidden="true" className="size-3.5" strokeWidth={1.8} />
                      <span className="min-w-0 flex-1 truncate">{label}</span>
                    </Link>
                  );
                })}
              </div> : null}
            </div>

            {lowerNavigation.map(({ label, href, icon: Icon, ...item }) => (
              <NavItem key={label} label={label} href={href} icon={Icon} active={active === label} placeholder={"placeholder" in item} />
            ))}
          </nav>
        </div>
      </div>

      <div className="mt-auto space-y-1">
        <Link
          href="/settings"
          aria-current={active === "Settings" ? "page" : undefined}
          className={cn(
            "flex h-9 items-center gap-3 rounded-lg px-3 text-[13px] font-medium transition-colors hover:bg-accent/60 hover:text-foreground",
            active === "Settings" ? "soft-control border border-border bg-accent text-foreground" : "text-muted-foreground",
          )}
        >
          <Settings aria-hidden="true" className="size-4" />
          Settings
        </Link>
        <LogoutButton />
        <div className="mt-4 rounded-xl border border-white/[0.06] bg-card p-3 soft-panel">
          <div className="flex items-center gap-3">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-elevated text-[10px] font-semibold">M</span>
            <span className="min-w-0">
              <span className="block truncate text-xs font-medium">Moree</span>
              <span className="block text-[10px] text-muted-foreground">Personal workspace</span>
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}

function NavItem({ label, href, icon: Icon, active, count, placeholder = false }: { label: string; href: string; icon: typeof LayoutDashboard; active: boolean; count?: number; placeholder?: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex h-9 items-center gap-3 rounded-lg px-3 text-[13px] font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring",
        active
          ? "soft-control border border-border bg-accent text-foreground"
          : placeholder
            ? "text-muted-foreground/55 hover:bg-accent/40 hover:text-muted-foreground"
            : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
      )}
    >
      <Icon aria-hidden="true" className="size-4" strokeWidth={1.8} />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {count ? <span className="rounded-md border border-white/[0.06] bg-card px-1.5 py-0.5 text-[10px] tabular-nums text-muted-foreground">{count}</span> : null}
    </Link>
  );
}
