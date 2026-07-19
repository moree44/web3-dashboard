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

export type AppSection = "Dashboard" | "Inbox" | "Docs" | "Daily" | "Projects" | "Watchlist" | "Trading" | "Tasks" | "Accounts" | "Archive" | "Settings";

const mainNavigation = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Inbox", href: "/inbox", icon: Inbox, count: 4 },
  { label: "Docs", href: "/docs", icon: BookOpenText },
] as const;

const projectNavigation = [
  { label: "Watchlist", href: "/projects?view=watchlist", icon: Eye, active: "Watchlist" },
  { label: "Daily", href: "/daily", icon: CalendarCheck2, active: "Daily" },
  { label: "Tasks", href: "/tasks", icon: ListChecks, active: "Tasks" },
] as const;

const lowerNavigation = [
  { label: "Accounts", href: "/accounts", icon: UsersRound },
  { label: "Archive", href: "/archive", icon: Archive },
  { label: "Trading", icon: TrendingUp, placeholder: true },
] as const;

export function AppSidebar({ active }: { active: AppSection }) {
  const projectGroupActive = active === "Projects" || active === "Watchlist" || active === "Daily" || active === "Tasks";
  const [projectOpen, setProjectOpen] = useState(true);

  return (
    <aside className="hidden h-screen flex-col border-r soft-divider bg-secondary px-5 py-6 lg:flex">
      <Link href="/" className="flex items-center gap-3 rounded-xl px-1 py-1 focus-visible:ring-2 focus-visible:ring-ring">
        <span className="soft-control grid size-10 place-items-center rounded-xl border border-white/[0.06] bg-card text-foreground">
          <Radar aria-hidden="true" className="size-[17px]" strokeWidth={1.8} />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold">Hunting OS</span>
          <span className="block truncate text-xs text-muted-foreground">Moree&apos;s workspace</span>
        </span>
      </Link>

      <div className="my-6 h-px bg-white/[0.06]" />

      <div className="space-y-6">
        <div>
          <p className="mb-3 px-2 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Workspace</p>
          <nav className="space-y-1.5" aria-label="Main navigation">
            {mainNavigation.map(({ label, href, icon: Icon, ...item }) => (
              <NavItem key={label} label={label} href={href} icon={Icon} active={active === label} count={"count" in item ? item.count : undefined} />
            ))}

            <div className="pt-1">
              <div
                className={cn(
                  "flex h-9 w-full items-center rounded-lg text-[13px] font-medium transition-colors",
                  active === "Projects" ? "soft-control border soft-divider-strong bg-accent text-foreground" : projectGroupActive ? "text-foreground" : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                )}
              >
                <Link
                  href="/projects"
                  aria-current={active === "Projects" ? "page" : undefined}
                  className="flex h-full min-w-0 flex-1 items-center gap-3 rounded-lg px-3 focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <FolderKanban aria-hidden="true" className="size-4" strokeWidth={1.8} />
                  <span className="min-w-0 flex-1 truncate">Projects</span>
                </Link>
                <button
                  type="button"
                  aria-expanded={projectOpen}
                  onClick={() => setProjectOpen((value) => !value)}
                  className="grid h-full w-8 shrink-0 place-items-center rounded-lg text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Toggle project navigation"
                >
                  <ChevronDown aria-hidden="true" className={cn("size-3.5 transition-transform", projectOpen ? "rotate-0" : "-rotate-90")} strokeWidth={1.8} />
                </button>
              </div>

              {projectOpen ? <div className="mt-1 space-y-0.5 pl-4">
                {projectNavigation.map(({ label, href, icon: Icon, active: itemActive }) => {
                  const isActive = active === itemActive;
                  return (
                    <Link
                      key={label}
                      href={href}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "flex h-8 items-center gap-2.5 rounded-lg px-3 text-[12px] font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                        isActive ? "soft-control border soft-divider-strong bg-accent text-foreground" : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                      )}
                    >
                      <Icon aria-hidden="true" className="size-3.5" strokeWidth={1.8} />
                      <span className="min-w-0 flex-1 truncate">{label}</span>
                    </Link>
                  );
                })}
              </div> : null}
            </div>

            {lowerNavigation.map(({ label, icon: Icon, ...item }) => (
              <NavItem key={label} label={label} href={"href" in item ? item.href : undefined} icon={Icon} active={active === label} placeholder={"placeholder" in item} />
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
            active === "Settings" ? "soft-control border soft-divider-strong bg-accent text-foreground" : "text-muted-foreground",
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

function NavItem({ label, href, icon: Icon, active, count, placeholder = false }: { label: string; href?: string; icon: typeof LayoutDashboard; active: boolean; count?: number; placeholder?: boolean }) {
  const className = cn(
    "flex h-9 items-center gap-3 rounded-lg px-3 text-[13px] font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring",
    active
      ? "soft-control border soft-divider-strong bg-accent text-foreground"
      : placeholder
        ? "cursor-not-allowed text-muted-foreground/45"
        : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
  );
  const content = (
    <>
      <Icon aria-hidden="true" className="size-4" strokeWidth={1.8} />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {count ? <span className="rounded-md border border-white/[0.06] bg-card px-1.5 py-0.5 text-[10px] tabular-nums text-muted-foreground">{count}</span> : null}
    </>
  );

  if (placeholder) {
    return <div className={className} aria-disabled="true">{content}</div>;
  }

  return (
    <Link href={href ?? "#"} aria-current={active ? "page" : undefined} className={className}>
      {content}
    </Link>
  );
}
