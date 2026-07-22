import { LockKeyhole, Monitor, ShieldCheck, WalletCards } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const settingsGroups = [
  { label: "Auth", value: "Username login", detail: "Internal Supabase email is hidden", icon: LockKeyhole },
  { label: "Workspace", value: "Moree Hunting OS", detail: "Personal workspace", icon: Monitor },
  { label: "Security", value: "Safe metadata only", detail: "No seeds or private keys", icon: ShieldCheck },
  { label: "Accounts", value: "Personas separate from wallets", detail: "Wallets remain address records", icon: WalletCards },
];

export function SettingsPreview() {
  return (
    <div className="min-w-0 py-5 lg:py-7">
      <header className="flex flex-col gap-4 border-b soft-divider px-4 pb-5 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-8">
        <div>
          <h1 className="mt-1 text-2xl font-semibold tracking-[-0.02em]">Settings</h1>
        </div>
        <Button variant="secondary" size="sm" disabled>Save changes</Button>
      </header>

      <div className="grid gap-4 px-4 py-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:px-8">
        <section className="rounded-xl bg-card/80 soft-panel">
          <div className="border-b border-white/[0.045] px-4 py-3">
            <h2 className="text-sm font-semibold">Profile</h2>
          </div>
          <div className="p-4">
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-full bg-white/[0.065] text-sm font-semibold">M</span>
              <div className="min-w-0">
                <h3 className="truncate text-sm font-semibold">Moree</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">@moree · Personal workspace</p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <ReadOnlyField label="Username" value="moree" />
              <ReadOnlyField label="Display name" value="Moree" />
              <ReadOnlyField label="Login method" value="Username + password" />
              <ReadOnlyField label="Timezone" value="Asia/Jakarta for daily logs" />
            </div>
          </div>
        </section>

        <aside className="space-y-4">
          <section className="rounded-xl bg-card/80 p-4 soft-panel">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold">Workspace</h2>
                <p className="mt-1 text-xs text-muted-foreground">Moree Hunting OS</p>
              </div>
              <Badge variant="secondary">Owner</Badge>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <SmallMetric label="Projects" value="6" />
              <SmallMetric label="Accounts" value="3" />
            </div>
          </section>

          <section className="rounded-xl bg-card/80 p-4 soft-panel">
            <h2 className="text-sm font-semibold">Workspace rules</h2>
            <div className="mt-3 space-y-2 text-xs text-muted-foreground">
              <p>Team invites are not enabled.</p>
              <p>Billing is not enabled.</p>
              <p>One personal workspace is active.</p>
              <p>Login uses username, not email.</p>
            </div>
          </section>
        </aside>
      </div>

      <section className="px-4 pb-6 sm:px-6 lg:px-8">
        <div className="grid gap-3 lg:grid-cols-4">
          {settingsGroups.map(({ label, value, detail, icon: Icon }) => (
            <article key={label} className="rounded-xl bg-card/80 p-4 soft-panel">
              <Icon className="size-4 text-muted-foreground" />
              <h2 className="mt-3 text-sm font-semibold">{label}</h2>
              <p className="mt-1 text-xs text-foreground/80">{value}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">{detail}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <label className="block">
      <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">{label}</span>
      <div className="mt-1.5 flex h-9 items-center rounded-lg border border-white/[0.055] bg-input px-3 text-sm text-foreground">{value}</div>
    </label>
  );
}

function SmallMetric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border border-white/[0.045] bg-white/[0.02] px-3 py-2"><p className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground">{label}</p><p className="mt-1 text-lg font-semibold tabular-nums">{value}</p></div>;
}
