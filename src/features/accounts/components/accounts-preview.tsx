"use client";

import { AtSign, CircleUserRound, Copy, CreditCard, FolderOpen, MoreHorizontal, Plus, Search, ShieldCheck, WalletCards } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const tabs = ["Identities", "Wallets", "Groups"] as const;
type AccountTab = (typeof tabs)[number];

const accounts = [
  {
    name: "Moree",
    handle: "@moree",
    discord: "moree.web3",
    email: "tracking only",
    avatar: "M",
    projects: 12,
    tasks: 8,
    wallets: ["Moree EVM Main", "Moree SOL Main", "Moree Burner 01"],
  },
  {
    name: "Wdym",
    handle: "@wdym",
    discord: "wdym.web3",
    email: "tracking only",
    avatar: "W",
    projects: 9,
    tasks: 6,
    wallets: ["Wdym EVM Main", "Wdym SOL Main"],
  },
  {
    name: "Wayss",
    handle: "not linked",
    discord: "wayss.web3",
    email: "tracking only",
    avatar: "W",
    projects: 4,
    tasks: 3,
    wallets: ["Wayss EVM Main"],
  },
];

const wallets = [
  { label: "Moree EVM Main", owner: "Moree", group: "Main", chain: "EVM", type: "main", used: 14, address: "0x84...91fa" },
  { label: "Moree SOL Main", owner: "Moree", group: "Main", chain: "Solana", type: "main", used: 5, address: "9xQ...p2L" },
  { label: "Wdym EVM Main", owner: "Wdym", group: "Main", chain: "EVM", type: "main", used: 11, address: "0x2b...77ac" },
  { label: "L1 Wallet 02", owner: "none", group: "L1", chain: "EVM", type: "l1", used: 3, address: "0x51...c19d" },
  { label: "Soundness Project Wallet", owner: "Moree", group: "Project Specific", chain: "EVM", type: "project_wallet", used: 1, address: "0xae...4410" },
];

const groups = [
  { name: "Main", description: "Primary wallets owned by personas", wallets: 4, projects: 25 },
  { name: "L1", description: "Random L1 wallets not tied to a persona", wallets: 8, projects: 6 },
  { name: "Burner", description: "Temporary wallets for low-trust campaigns", wallets: 3, projects: 2 },
  { name: "Project Specific", description: "Wallets created for one project", wallets: 5, projects: 5 },
];

export function AccountsPreview() {
  const [activeTab, setActiveTab] = useState<AccountTab>("Identities");

  return (
    <div className="min-w-0 py-5 lg:py-7">
      <header className="flex flex-col gap-4 border-b soft-divider px-4 pb-5 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-8">
        <div>
          <h1 className="mt-1 text-2xl font-semibold tracking-[-0.02em]">Accounts</h1>
        </div>
        <Button variant="secondary" size="sm"><Plus />Add account</Button>
      </header>

      <div className="border-b soft-divider px-4 sm:px-6 lg:px-8">
        <div className="scrollbar-subtle flex gap-1 overflow-x-auto py-2.5">
          {tabs.map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={cn("shrink-0 rounded-full px-3 py-1.5 text-xs font-medium", activeTab === tab ? "bg-accent text-foreground shadow-[inset_0_1px_0_rgb(255_255_255/0.06)]" : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground")}>{tab}</button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3 border-b soft-divider px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:px-8">
        <label className="flex h-9 min-w-0 items-center gap-2 rounded-lg border border-white/[0.06] bg-card px-3 lg:w-72">
          <Search className="size-4 text-muted-foreground" />
          <input aria-label="Search accounts" className="min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground" placeholder={activeTab === "Wallets" ? "Search wallets..." : "Search accounts..."} />
        </label>
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <button className="flex h-8 items-center gap-2 rounded-lg border border-white/[0.045] bg-transparent px-3 text-xs text-muted-foreground hover:bg-white/[0.04] hover:text-foreground"><ShieldCheck className="size-3.5" />Workspace scoped</button>
          <button className="flex h-8 items-center gap-2 rounded-lg border border-white/[0.045] bg-transparent px-3 text-xs text-muted-foreground hover:bg-white/[0.04] hover:text-foreground"><WalletCards className="size-3.5" />Wallet usage</button>
        </div>
      </div>

      {activeTab === "Identities" ? <IdentitiesView /> : null}
      {activeTab === "Wallets" ? <WalletsView /> : null}
      {activeTab === "Groups" ? <GroupsView /> : null}
    </div>
  );
}

function IdentitiesView() {
  return (
    <div className="grid gap-3 px-4 py-4 sm:px-6 lg:grid-cols-3 lg:px-8">
      {accounts.map((account) => (
        <article key={account.name} className="rounded-xl bg-card/80 p-4 soft-panel">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <Avatar label={account.avatar} />
              <div className="min-w-0">
                <h2 className="truncate text-sm font-semibold">{account.name}</h2>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">Personal hunting identity</p>
              </div>
            </div>
            <button aria-label={"More options for " + account.name} className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-white/[0.045] hover:text-foreground"><MoreHorizontal className="size-4" /></button>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <Metric label="Projects" value={account.projects} />
            <Metric label="Daily tasks" value={account.tasks} />
          </div>

          <div className="mt-4 space-y-2 text-xs">
            <Meta icon={AtSign} label="X" value={account.handle} />
            <Meta icon={CircleUserRound} label="Discord" value={account.discord} />
            <Meta icon={ShieldCheck} label="Email" value={account.email} />
          </div>

          <div className="mt-4 border-t border-white/[0.045] pt-3">
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Wallets</span>
              <span className="text-[11px] text-muted-foreground">{account.wallets.length}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {account.wallets.map((wallet) => <Badge key={wallet} variant="secondary">{wallet}</Badge>)}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

function WalletsView() {
  return (
    <div className="hidden overflow-x-auto lg:block">
      <table className="w-full min-w-[920px] table-fixed border-collapse text-left">
        <colgroup>
          <col className="w-[300px]" />
          <col className="w-[120px]" />
          <col className="w-[140px]" />
          <col className="w-[120px]" />
          <col className="w-[120px]" />
          <col className="w-[120px]" />
          <col className="w-[44px]" />
        </colgroup>
        <thead className="sticky top-0 z-10 bg-background text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
          <tr>
            <th className="border-b border-white/[0.045] px-4 py-3 lg:px-8">Wallet</th>
            <th className="border-b border-white/[0.045] px-3 py-3">Owner</th>
            <th className="border-b border-white/[0.045] px-3 py-3">Group</th>
            <th className="border-b border-white/[0.045] px-3 py-3">Chain</th>
            <th className="border-b border-white/[0.045] px-3 py-3">Type</th>
            <th className="border-b border-white/[0.045] px-3 py-3">Used in</th>
            <th className="border-b border-white/[0.045] px-3 py-3"><span className="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody>{wallets.map((wallet) => <WalletRow key={wallet.label} wallet={wallet} />)}</tbody>
      </table>
    </div>
  );
}

function WalletRow({ wallet }: { wallet: (typeof wallets)[number] }) {
  return (
    <tr className="h-[58px] border-b border-white/[0.035] hover:bg-white/[0.025]">
      <td className="px-4 lg:px-8">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white/[0.065] text-[11px] font-bold text-[#c4cad3]"><CreditCard className="size-4" /></span>
          <span className="min-w-0">
            <span className="block truncate text-[13px] font-semibold text-foreground">{wallet.label}</span>
            <span className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground"><span className="truncate font-mono">{wallet.address}</span><Copy className="size-3" /></span>
          </span>
        </div>
      </td>
      <td className="px-3 text-xs text-muted-foreground">{wallet.owner}</td>
      <td className="px-3"><Badge variant="secondary">{wallet.group}</Badge></td>
      <td className="px-3 text-xs text-muted-foreground">{wallet.chain}</td>
      <td className="px-3"><Badge variant="outline">{wallet.type}</Badge></td>
      <td className="px-3 text-xs tabular-nums text-muted-foreground">{wallet.used} projects</td>
      <td className="px-3"><button aria-label={"More options for " + wallet.label} className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-white/[0.045] hover:text-foreground"><MoreHorizontal className="size-4" /></button></td>
    </tr>
  );
}

function GroupsView() {
  return (
    <div className="grid gap-3 px-4 py-4 sm:px-6 lg:grid-cols-4 lg:px-8">
      {groups.map((group) => (
        <article key={group.name} className="rounded-xl bg-card/80 p-4 soft-panel">
          <div className="flex items-start justify-between gap-3">
            <span className="grid size-9 place-items-center rounded-lg bg-white/[0.055] text-muted-foreground"><FolderOpen className="size-4" /></span>
            <button aria-label={"More options for " + group.name} className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-white/[0.045] hover:text-foreground"><MoreHorizontal className="size-4" /></button>
          </div>
          <h2 className="mt-3 text-sm font-semibold">{group.name}</h2>
          <p className="mt-1 min-h-10 text-xs leading-5 text-muted-foreground">{group.description}</p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Metric label="Wallets" value={group.wallets} />
            <Metric label="Projects" value={group.projects} />
          </div>
        </article>
      ))}
    </div>
  );
}

function Avatar({ label }: { label: string }) {
  return <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white/[0.065] text-xs font-semibold text-foreground">{label}</span>;
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="rounded-lg border border-white/[0.045] bg-white/[0.02] px-3 py-2"><p className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground">{label}</p><p className="mt-1 text-lg font-semibold tabular-nums">{value}</p></div>;
}

function Meta({ icon: Icon, label, value }: { icon: typeof AtSign; label: string; value: string }) {
  return <div className="flex items-center gap-2 text-muted-foreground"><Icon className="size-3.5" /><span className="w-14 shrink-0">{label}</span><span className="min-w-0 truncate text-foreground/80">{value}</span></div>;
}
