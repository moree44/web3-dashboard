import type { ReactNode } from "react";
import { Radar } from "lucide-react";

import { cn } from "@/lib/utils";

type AuthShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  className?: string;
};

export function AuthShell({ eyebrow, title, description, children, className }: AuthShellProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10 text-foreground">
      <section className={cn("w-full max-w-[420px]", className)}>
        <div className="mb-7">
          <span className="grid size-11 place-items-center rounded-xl border soft-divider bg-secondary text-foreground">
            <Radar aria-hidden="true" className="size-5" strokeWidth={1.8} />
          </span>
          <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{eyebrow}</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-foreground">{title}</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
        <div className="rounded-2xl border soft-divider bg-secondary p-5 soft-panel shadow-xl shadow-black/10 sm:p-6">{children}</div>
      </section>
    </main>
  );
}
