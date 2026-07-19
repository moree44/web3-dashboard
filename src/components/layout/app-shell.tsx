import type { ReactNode } from "react";

import { AppSidebar, type AppSection } from "@/components/layout/app-sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";

type AppShellProps = { children: ReactNode; active?: AppSection };

export function AppShell({ children, active = "Dashboard" }: AppShellProps) {
  return (
    <main className="min-h-screen text-foreground" style={{ background: "var(--shell-background)" }}>
      <div className="min-h-screen lg:grid lg:h-screen lg:grid-cols-[240px_minmax(0,1fr)] lg:overflow-hidden">
        <AppSidebar active={active} />
        <div className="min-w-0 bg-background pb-24 lg:h-screen lg:overflow-y-auto lg:pb-0 scrollbar-subtle">{children}</div>
        <MobileNav active={active} />
      </div>
    </main>
  );
}
