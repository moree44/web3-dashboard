import type { ReactNode } from "react";

import { AppSidebar, type AppSection } from "@/components/layout/app-sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";

type AppShellProps = { children: ReactNode; active?: AppSection };

export function AppShell({ children, active = "Dashboard" }: AppShellProps) {
  return (
    <main className="min-h-screen text-foreground lg:p-5" style={{ background: "var(--stage-background)" }}>
      <div
        className="min-h-screen shadow-[var(--depth-shadow)] lg:grid lg:h-[calc(100vh-40px)] lg:min-h-0 lg:grid-cols-[240px_minmax(0,1fr)] lg:overflow-hidden lg:rounded-[24px] lg:border lg:border-[#47484c]/70"
        style={{ background: "var(--shell-background)" }}
      >
        <AppSidebar active={active} />
        <div className="min-w-0 bg-background/80 pb-24 lg:h-full lg:overflow-y-auto lg:pb-0 scrollbar-subtle">{children}</div>
        <MobileNav active={active} />
      </div>
    </main>
  );
}
