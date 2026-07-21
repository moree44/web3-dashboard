"use client";

import Image from "next/image";
import { AtSign, CircleUserRound, Copy, CreditCard, FolderOpen, MoreHorizontal, Plus, Search, ShieldCheck, Upload, WalletCards, X } from "lucide-react";
import { useState, type ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const tabs = ["Identities", "Wallets", "Groups"] as const;
type AccountTab = (typeof tabs)[number];

type Account = {
  name: string;
  handle: string;
  discord: string;
  email: string;
  avatar: string;
  projects: number;
  tasks: number;
  wallets: string[];
  activeProjects: string[];
};

type Wallet = {
  label: string;
  owner: string;
  group: string;
  chain: string;
  type: string;
  used: number;
  address: string;
  usedIn: string[];
  recentActivity: string[];
};

const accounts: Account[] = [
  {
    name: "Moree",
    handle: "@moree",
    discord: "moree.web3",
    email: "tracking only",
    avatar: "M",
    projects: 12,
    tasks: 8,
    wallets: ["Moree EVM Main", "Moree SOL Main", "Moree Burner 01"],
    activeProjects: ["Soundness", "NexusHQ", "Drosera", "GensynAI"],
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
    activeProjects: ["Linera", "Huddle01", "Dawn"],
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
    activeProjects: ["Perle Labs", "Konnex World"],
  },
];

const wallets: Wallet[] = [
  { label: "Moree EVM Main", owner: "Moree", group: "Main", chain: "EVM", type: "main", used: 14, address: "0x84...91fa", usedIn: ["Soundness", "Drosera", "GensynAI"], recentActivity: ["Marked Soundness proof done", "Added Drosera operator note"] },
  { label: "Moree SOL Main", owner: "Moree", group: "Main", chain: "Solana", type: "main", used: 5, address: "9xQ...p2L", usedIn: ["Perle Labs", "ORO AI"], recentActivity: ["Saved wallet warm-up note", "Linked to Perle Labs"] },
  { label: "Wdym EVM Main", owner: "Wdym", group: "Main", chain: "EVM", type: "main", used: 11, address: "0x2b...77ac", usedIn: ["Linera", "Huddle01", "Dawn"], recentActivity: ["Completed Galxe quest", "Checked waitlist result"] },
  { label: "L1 Wallet 02", owner: "none", group: "L1", chain: "EVM", type: "l1", used: 3, address: "0x51...c19d", usedIn: ["Retro Bridge Alpha", "NFT Mint C"], recentActivity: ["Submitted retro interaction", "Saved proof URL"] },
  { label: "Soundness Project Wallet", owner: "Moree", group: "Project Specific", chain: "EVM", type: "project_wallet", used: 1, address: "0xae...4410", usedIn: ["Soundness"], recentActivity: ["Generated project address", "Stored key location hint"] },
];

const groups = [
  { name: "Main", description: "Primary wallets owned by personas", wallets: 4, projects: 25 },
  { name: "L1", description: "Random L1 wallets not tied to a persona", wallets: 8, projects: 6 },
  { name: "Burner", description: "Temporary wallets for low-trust campaigns", wallets: 3, projects: 2 },
  { name: "Project Specific", description: "Wallets created for one project", wallets: 5, projects: 5 },
];

export function AccountsPreview() {
  const [activeTab, setActiveTab] = useState<AccountTab>("Identities");
  const [walletItems, setWalletItems] = useState<Wallet[]>(wallets);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);

  function openAccountByName(name: string) {
    const account = accounts.find((item) => item.name === name);
    if (account) {
      setSelectedWallet(null);
      setSelectedAccount(account);
    }
  }

  function openWallet(wallet: Wallet) {
    setSelectedAccount(null);
    setSelectedWallet(wallet);
  }

  function addWalletForAccount(accountName: string, input: { label: string; chain: string; type: string }) {
    const newWallet: Wallet = {
      label: input.label,
      owner: accountName,
      group: input.type === "project_wallet" ? "Project Specific" : "Main",
      chain: input.chain,
      type: input.type,
      used: 0,
      address: "Add address later",
      usedIn: [],
      recentActivity: ["Created from account detail"],
    };

    setWalletItems((items) => [newWallet, ...items]);
  }

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

      {activeTab === "Identities" ? <IdentitiesView onOpenAccount={setSelectedAccount} /> : null}
      {activeTab === "Wallets" ? <WalletsView walletItems={walletItems} onOpenWallet={openWallet} /> : null}
      {activeTab === "Groups" ? <GroupsView /> : null}

      <AccountDetailPanel account={selectedAccount} walletItems={walletItems} onClose={() => setSelectedAccount(null)} onOpenWallet={openWallet} onAddWallet={addWalletForAccount} />
      <WalletDetailPanel wallet={selectedWallet} onClose={() => setSelectedWallet(null)} onOpenAccount={openAccountByName} />
    </div>
  );
}

function IdentitiesView({ onOpenAccount }: { onOpenAccount: (account: Account) => void }) {
  return (
    <div className="grid gap-3 px-4 py-4 sm:px-6 lg:grid-cols-3 lg:px-8">
      {accounts.map((account) => (
        <article key={account.name} onClick={() => onOpenAccount(account)} className="cursor-pointer rounded-xl bg-card/80 p-4 soft-panel transition-colors hover:bg-white/[0.035]">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <EditableAvatar label={account.avatar} />
              <div className="min-w-0">
                <h2 className="truncate text-sm font-semibold">{account.name}</h2>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">Personal hunting identity</p>
              </div>
            </div>
            <button onClick={(event) => event.stopPropagation()} aria-label={"More options for " + account.name} className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-white/[0.045] hover:text-foreground"><MoreHorizontal className="size-4" /></button>
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
            <div className="flex items-center justify-between gap-3">
              <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Wallets</span>
              <span className="text-[11px] text-muted-foreground">{account.wallets.length}</span>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

function WalletsView({ walletItems, onOpenWallet }: { walletItems: Wallet[]; onOpenWallet: (wallet: Wallet) => void }) {
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
        <tbody>{walletItems.map((wallet) => <WalletRow key={wallet.label} wallet={wallet} onOpen={() => onOpenWallet(wallet)} />)}</tbody>
      </table>
    </div>
  );
}

function WalletRow({ wallet, onOpen }: { wallet: Wallet; onOpen: () => void }) {
  return (
    <tr onClick={onOpen} className="h-[58px] cursor-pointer border-b border-white/[0.035] hover:bg-white/[0.025]">
      <td className="px-4 lg:px-8">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white/[0.065] text-[11px] font-bold text-[#c4cad3]"><CreditCard className="size-4" /></span>
          <span className="min-w-0">
            <span className="block truncate text-[13px] font-semibold text-foreground">{wallet.label}</span>
            <span className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground"><span className="truncate font-mono">{wallet.address}</span><Copy className="size-3" /></span>
          </span>
        </div>
      </td>
      <td className="px-3 text-xs text-muted-foreground">{formatOwner(wallet.owner)}</td>
      <td className="px-3"><Badge variant="secondary">{wallet.group}</Badge></td>
      <td className="px-3 text-xs text-muted-foreground">{wallet.chain}</td>
      <td className="px-3"><Badge variant="outline">{formatWalletType(wallet.type)}</Badge></td>
      <td className="px-3 text-xs tabular-nums text-muted-foreground">{wallet.used} projects</td>
      <td className="px-3"><button onClick={(event) => event.stopPropagation()} aria-label={"More options for " + wallet.label} className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-white/[0.045] hover:text-foreground"><MoreHorizontal className="size-4" /></button></td>
    </tr>
  );
}

function AccountDetailPanel({ account, walletItems, onClose, onOpenWallet, onAddWallet }: { account: Account | null; walletItems: Wallet[]; onClose: () => void; onOpenWallet: (wallet: Wallet) => void; onAddWallet: (accountName: string, input: { label: string; chain: string; type: string }) => void }) {
  const [isAddingWallet, setIsAddingWallet] = useState(false);
  const [walletLabel, setWalletLabel] = useState("");
  const [walletChain, setWalletChain] = useState("EVM");
  const [walletType, setWalletType] = useState("main");

  if (!account) return null;

  const accountName = account.name;
  const ownedWallets = walletItems.filter((wallet) => wallet.owner === accountName);

  function createWallet() {
    const trimmedLabel = walletLabel.trim();
    if (!trimmedLabel) return;

    onAddWallet(accountName, { label: trimmedLabel, chain: walletChain, type: walletType });
    setWalletLabel("");
    setWalletChain("EVM");
    setWalletType("main");
    setIsAddingWallet(false);
  }

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-full justify-end bg-black/35 backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-labelledby="account-detail-title">
      <aside className="h-full w-full max-w-[520px] overflow-y-auto border-l soft-divider bg-card shadow-2xl shadow-black/50 scrollbar-subtle">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b soft-divider bg-card/95 px-5 py-3 backdrop-blur">
          <h2 id="account-detail-title" className="truncate text-base font-semibold">Account detail</h2>
          <button onClick={onClose} className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground" aria-label="Close account detail"><X className="size-4" /></button>
        </div>

        <div className="px-5 py-5">
          <div className="flex items-start gap-3">
            <EditableAvatar label={account.avatar} size="lg" />
            <div className="min-w-0 flex-1">
              <h3 className="text-2xl font-semibold tracking-[-0.03em]">{account.name}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{account.handle}</p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2">
            <Metric label="Projects" value={account.projects} />
            <Metric label="Daily tasks" value={account.tasks} />
          </div>

          <PanelSection title="Wallets" action={<button onClick={() => setIsAddingWallet((current) => !current)} className="text-[11px] text-muted-foreground hover:text-foreground">+ Add wallet</button>}>
            <div className="space-y-1.5">
              {ownedWallets.map((wallet) => (
                <button key={wallet.label} onClick={() => onOpenWallet(wallet)} className="flex w-full items-center gap-3 rounded-lg bg-white/[0.025] px-3 py-2 text-left hover:bg-white/[0.045]">
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white/[0.055] text-muted-foreground"><CreditCard className="size-4" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-semibold">{wallet.label}</span>
                    <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">{wallet.chain} · {formatWalletType(wallet.type)} · {wallet.address}</span>
                  </span>
                </button>
              ))}
            </div>

            {isAddingWallet ? (
              <div className="mt-3 rounded-xl bg-white/[0.025] p-3">
                <div className="grid gap-2 sm:grid-cols-3">
                  <input value={walletLabel} onChange={(event) => setWalletLabel(event.target.value)} className="h-9 rounded-lg bg-background px-3 text-xs font-medium outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-ring sm:col-span-3" placeholder="Wallet label" />
                  <input value={walletChain} onChange={(event) => setWalletChain(event.target.value)} className="h-9 rounded-lg bg-background px-3 text-xs font-medium outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-ring" placeholder="Chain" />
                  <input value={walletType} onChange={(event) => setWalletType(event.target.value)} className="h-9 rounded-lg bg-background px-3 text-xs font-medium outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-ring" placeholder="Type" />
                  <Button size="sm" variant="secondary" disabled={!walletLabel.trim()} onClick={createWallet}>Add</Button>
                </div>
              </div>
            ) : null}
          </PanelSection>

          <PanelSection title="Active projects">
            <div className="flex flex-wrap gap-1.5">
              {account.activeProjects.map((project) => <Badge key={project} variant="secondary">{project}</Badge>)}
            </div>
          </PanelSection>

          <PanelSection title="Profile">
            <div className="space-y-2 text-xs">
              <Meta icon={AtSign} label="X" value={account.handle} />
              <Meta icon={CircleUserRound} label="Discord" value={account.discord} />
              <Meta icon={ShieldCheck} label="Email" value={account.email} />
            </div>
          </PanelSection>
        </div>
      </aside>
    </div>
  );
}

function WalletDetailPanel({ wallet, onClose, onOpenAccount }: { wallet: Wallet | null; onClose: () => void; onOpenAccount: (name: string) => void }) {
  if (!wallet) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-full justify-end bg-black/35 backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-labelledby="wallet-detail-title">
      <aside className="h-full w-full max-w-[520px] overflow-y-auto border-l soft-divider bg-card shadow-2xl shadow-black/50 scrollbar-subtle">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b soft-divider bg-card/95 px-5 py-3 backdrop-blur">
          <h2 id="wallet-detail-title" className="truncate text-base font-semibold">Wallet detail</h2>
          <button onClick={onClose} className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground" aria-label="Close wallet detail"><X className="size-4" /></button>
        </div>

        <div className="px-5 py-5">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/[0.065] text-muted-foreground shadow-sm"><CreditCard className="size-5" /></span>
            <div className="min-w-0 flex-1">
              <h3 className="text-2xl font-semibold tracking-[-0.03em]">{wallet.label}</h3>
              <button className="mt-1 inline-flex max-w-full items-center gap-1.5 truncate text-xs text-muted-foreground hover:text-foreground">
                <span className="truncate font-mono">{wallet.address}</span>
                <Copy className="size-3" />
              </button>
            </div>
          </div>

          <section className="mt-6 grid gap-x-6 gap-y-4 border-t border-white/[0.045] pt-4 sm:grid-cols-2">
            <PanelProperty label="Chain">{wallet.chain}</PanelProperty>
            <PanelProperty label="Type"><Badge variant="outline">{formatWalletType(wallet.type)}</Badge></PanelProperty>
            <PanelProperty label="Group"><Badge variant="secondary">{wallet.group}</Badge></PanelProperty>
            <PanelProperty label="Owner">
              {wallet.owner !== "none" ? (
                <button onClick={() => onOpenAccount(wallet.owner)} className="text-xs font-medium text-foreground hover:text-muted-foreground">{wallet.owner}</button>
              ) : (
                <span className="text-muted-foreground">No persona</span>
              )}
            </PanelProperty>
          </section>

          <PanelSection title="Used in">
            <div className="flex flex-wrap gap-1.5">
              {wallet.usedIn.length > 0 ? wallet.usedIn.map((project) => <Badge key={project} variant="secondary">{project}</Badge>) : <span className="text-xs text-muted-foreground">No project usage yet</span>}
            </div>
          </PanelSection>

          <PanelSection title="Recent activity">
            <div className="space-y-1.5">
              {wallet.recentActivity.map((item) => (
                <div key={item} className="rounded-lg bg-white/[0.025] px-3 py-2 text-xs text-muted-foreground">{item}</div>
              ))}
            </div>
          </PanelSection>
        </div>
      </aside>
    </div>
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

function EditableAvatar({ label, size = "md" }: { label: string; size?: "md" | "lg" }) {
  const [open, setOpen] = useState(false);
  const [draftUrl, setDraftUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  return (
    <div className="relative shrink-0" onClick={(event) => event.stopPropagation()}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={cn("grid shrink-0 place-items-center overflow-hidden rounded-full bg-white/[0.065] text-xs font-semibold text-foreground", size === "lg" ? "size-12" : "size-10")}
        aria-label="Edit account avatar"
      >
        {imageUrl ? <Image src={imageUrl} alt="" width={size === "lg" ? 48 : 40} height={size === "lg" ? 48 : 40} className="size-full object-cover" unoptimized /> : label}
      </button>

      {open ? (
        <div className="absolute left-0 top-full z-[80] mt-2 w-64 rounded-xl border border-white/[0.08] bg-[#161618] p-2 shadow-2xl shadow-black/50">
          <label className="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-muted-foreground hover:bg-white/[0.055] hover:text-foreground">
            <Upload className="size-3.5" />
            Upload image
            <input type="file" accept="image/*" className="sr-only" onChange={() => undefined} />
          </label>
          <div className="mt-1 rounded-lg bg-white/[0.025] p-2">
            <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Paste image URL</p>
            <div className="mt-1.5 flex gap-2">
              <input value={draftUrl} onChange={(event) => setDraftUrl(event.target.value)} className="h-8 min-w-0 flex-1 rounded-lg bg-background px-2 text-xs outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-ring" placeholder="https://..." />
              <button type="button" onClick={() => { setImageUrl(draftUrl); setOpen(false); }} className="h-8 rounded-lg bg-white/[0.075] px-2 text-xs font-medium hover:bg-white/[0.11]">Set</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function PanelSection({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="mt-5">
      <div className="mb-2 flex items-center justify-between gap-3">
        <h4 className="text-sm font-semibold">{title}</h4>
        {action}
      </div>
      {children}
    </section>
  );
}

function PanelProperty({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">{label}</p>
      <div className="mt-1 text-xs text-foreground">{children}</div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="rounded-lg border border-white/[0.045] bg-white/[0.02] px-3 py-2"><p className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground">{label}</p><p className="mt-1 text-lg font-semibold tabular-nums">{value}</p></div>;
}

function Meta({ icon: Icon, label, value }: { icon: typeof AtSign; label: string; value: string }) {
  return <div className="flex items-center gap-2 text-muted-foreground"><Icon className="size-3.5" /><span className="w-14 shrink-0">{label}</span><span className="min-w-0 truncate text-foreground/80">{value}</span></div>;
}

function formatWalletType(value: string) {
  if (value.toLowerCase() === "l1") return "L1";

  return value
    .split("_")
    .filter(Boolean)
    .map((part, index) => index === 0 ? part.charAt(0).toUpperCase() + part.slice(1) : part)
    .join(" ");
}

function formatOwner(value: string) {
  return value === "none" ? "No persona" : value;
}
