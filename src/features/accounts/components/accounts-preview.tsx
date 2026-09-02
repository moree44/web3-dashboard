"use client";

import Image from "next/image";
import { CircleUserRound, Copy, CreditCard, FolderOpen, Mail, MoreHorizontal, Plus, Search, ShieldCheck, Upload, WalletCards, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent, type ReactNode } from "react";

import { CornerToast, type CornerToastNotice } from "@/components/shared/corner-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AppSelect } from "@/components/ui/app-select";
import { ConfirmDelete } from "@/components/ui/confirm-delete";
import { cn } from "@/lib/utils";
import { useDrawerDismiss } from "@/lib/use-drawer-dismiss";
import { usePresence } from "@/lib/use-presence";
import { normalizeHttpUrl } from "@/lib/url";
import type { AccountWithStats, AccountsWorkspaceData } from "@/features/accounts/actions";
import { useAccountsMutations, useAccountsWorkspace } from "@/features/accounts/accounts-query";
import type { wallets as walletsSchema, walletGroups as walletGroupsSchema } from "@/lib/db/schema";

type DbAccount = AccountWithStats;
type DbWallet = typeof walletsSchema.$inferSelect;
type DbWalletGroup = typeof walletGroupsSchema.$inferSelect;

const tabs = ["Identities", "Wallets", "Groups"] as const;
type AccountTab = (typeof tabs)[number];

type Account = {
  id?: string;
  name: string;
  handle: string;
  discord: string;
  email: string;
  avatar: string;
  avatarUrl?: string;
  projects: number;
  tasks: number;
  wallets: string[];
  activeProjects: string[];
};

type Wallet = {
  id?: string;
  groupId?: string;
  ownerId?: string;
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

function dbToUI(record: DbAccount, walletLabels: string[] = []): Account {
  const activeProjects = record.activeProjects ?? [];
  return {
    id: record.id,
    name: record.label,
    handle: record.xUsername ?? "not linked",
    discord: record.discordUsername ?? "",
    email: record.email ?? "tracking only",
    avatar: record.label.slice(0, 1).toUpperCase(),
    avatarUrl: record.avatarUrl ?? undefined,
    projects: activeProjects.length,
    tasks: 0,
    // Always derive labels from the live wallets list. Falling back to
    // walletCount produced ghost "Wallet 1" rows after the last wallet was deleted.
    wallets: walletLabels,
    activeProjects,
  };
}

function dbToUIWallet(
  record: DbWallet,
  accountNameMap: Map<string, string>,
  groupNameMap: Map<string, string>,
): Wallet {
  return {
    id: record.id,
    groupId: record.walletGroupId ?? undefined,
    ownerId: record.ownerAccountId ?? undefined,
    label: record.label,
    owner: record.ownerAccountId ? (accountNameMap.get(record.ownerAccountId) ?? "unknown") : "none",
    group: record.walletGroupId ? (groupNameMap.get(record.walletGroupId) ?? "uncategorized") : "uncategorized",
    chain: record.chainType ?? "EVM",
    type: record.walletType ?? "main",
    used: 0,
    address: record.address,
    usedIn: [],
    recentActivity: [],
  };
}

type UIGroup = { id?: string; name: string; description: string; wallets: number; projects: number };

function dbToUIGroup(record: DbWalletGroup): UIGroup {
  return {
    id: record.id,
    name: record.name,
    description: record.description ?? "",
    wallets: 0,
    projects: 0,
  };
}

export function AccountsPreview({
  initialData,
  developmentPreview,
}: {
  initialData: AccountsWorkspaceData;
  developmentPreview: boolean;
}) {
  const { data: queryData } = useAccountsWorkspace(initialData, developmentPreview);
  const workspace = queryData ?? initialData;

  const [activeTab, setActiveTab] = useState<AccountTab>("Identities");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isAddWalletOpen, setIsAddWalletOpen] = useState(false);
  const [isAddGroupOpen, setIsAddGroupOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<UIGroup | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null);
  const [notice, setNotice] = useState<CornerToastNotice | null>(null);

  const mutations = useAccountsMutations({
    developmentPreview,
    onError: (message) => showNotice("error", "Action failed", message),
  });

  const accountNameMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const account of workspace.accounts) map.set(account.id, account.label);
    return map;
  }, [workspace.accounts]);

  const groupNameMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const group of workspace.walletGroups) map.set(group.id, group.name);
    return map;
  }, [workspace.walletGroups]);

  const walletLabelsByAccountId = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const wallet of workspace.wallets) {
      if (!wallet.ownerAccountId) continue;
      const current = map.get(wallet.ownerAccountId) ?? [];
      current.push(wallet.label);
      map.set(wallet.ownerAccountId, current);
    }
    return map;
  }, [workspace.wallets]);

  const accountItems = useMemo(
    () => workspace.accounts.map((account) => dbToUI(account, walletLabelsByAccountId.get(account.id) ?? [])),
    [workspace.accounts, walletLabelsByAccountId],
  );
  const walletItems = useMemo(
    () => workspace.wallets.map((wallet) => dbToUIWallet(wallet, accountNameMap, groupNameMap)),
    [workspace.wallets, accountNameMap, groupNameMap],
  );
  const groupItems = useMemo(() => workspace.walletGroups.map(dbToUIGroup), [workspace.walletGroups]);

  const selectedAccount = useMemo(
    () => accountItems.find((account) => account.id === selectedAccountId) ?? null,
    [accountItems, selectedAccountId],
  );
  const selectedWallet = useMemo(
    () => walletItems.find((wallet) => wallet.id === selectedWalletId) ?? null,
    [walletItems, selectedWalletId],
  );

  const query = searchQuery.trim().toLowerCase();

  const filteredAccounts = useMemo(() => {
    if (!query) return accountItems;
    return accountItems.filter((account) => {
      const haystack = [account.name, account.handle, account.discord, account.email, ...account.activeProjects, ...account.wallets].join(" ").toLowerCase();
      return haystack.includes(query);
    });
  }, [query, accountItems]);

  const filteredWallets = useMemo(() => {
    if (!query) return walletItems;
    return walletItems.filter((wallet) => {
      const haystack = [wallet.label, wallet.owner, wallet.group, wallet.chain, wallet.type, wallet.address, ...wallet.usedIn].join(" ").toLowerCase();
      return haystack.includes(query);
    });
  }, [query, walletItems]);

  const filteredGroups = useMemo(() => {
    if (!query) return groupItems;
    return groupItems.filter((group) => {
      const haystack = [group.name, group.description].join(" ").toLowerCase();
      return haystack.includes(query);
    });
  }, [query, groupItems]);

  function showNotice(tone: CornerToastNotice["tone"], title: string, message?: string) {
    setNotice({ id: Date.now(), tone, title, message });
  }

  const clearNotice = useCallback(() => {
    setNotice(null);
  }, []);

  function openAccountByName(name: string) {
    const account = accountItems.find((item) => item.name === name);
    if (account) {
      setSelectedWalletId(null);
      setSelectedAccountId(account.id ?? null);
    }
  }

  function openWallet(wallet: Wallet) {
    setSelectedAccountId(null);
    setSelectedWalletId(wallet.id ?? null);
  }

  async function addWalletForAccount(accountName: string, input: { label: string; chain: string; type: string }) {
    const account = accountItems.find((item) => item.name === accountName);
    if (!account?.id) return;
    await mutations.createWalletMutation.mutateAsync({
      data: {
        label: input.label,
        address: "pending",
        chainType: input.chain,
        walletType: input.type as "main" | "project_wallet" | "burner" | "l1" | "testnet" | "retro" | "nft" | "other",
        ownerAccountId: account.id,
      },
    });
  }

  async function handleCreateAccount(data: { label: string; xUsername: string; discordUsername: string; email: string }) {
    await mutations.createAccountMutation.mutateAsync({
      data: {
        label: data.label,
        xUsername: data.xUsername || undefined,
        discordUsername: data.discordUsername || undefined,
        email: data.email || undefined,
        avatarSource: "none",
      },
    });
    setIsAddOpen(false);
  }

  async function handleCreateWallet(data: { label: string; address: string; chainType: string; walletType: string; ownerAccountId?: string }) {
    await mutations.createWalletMutation.mutateAsync({
      data: {
        label: data.label,
        address: data.address,
        chainType: data.chainType || undefined,
        walletType: data.walletType as "main" | "project_wallet" | "burner" | "l1" | "testnet" | "retro" | "nft" | "other",
        ownerAccountId: data.ownerAccountId || undefined,
      },
    });
    setIsAddWalletOpen(false);
  }

  async function handleDeleteAccount(id: string) {
    if (!id) return;
    try {
      await mutations.deleteAccountMutation.mutateAsync(id);
    } catch {
      // Error is surfaced through the mutation onError handler; keep the
      // drawer open so the user can retry.
      return;
    }
    setSelectedAccountId(null);
  }

  async function handleUpdateAccount(
    id: string,
    data: { label?: string; xUsername?: string; discordUsername?: string; email?: string },
  ) {
    await mutations.updateAccountMutation.mutateAsync({ id, data });
  }

  async function handleUploadAvatar(id: string, file: File) {
    await mutations.uploadAccountAvatarMutation.mutateAsync({ id, file });
  }

  async function handleSetAvatarUrl(id: string, url: string) {
    await mutations.setAccountAvatarUrlMutation.mutateAsync({ id, url: normalizeHttpUrl(url) });
  }

  async function handleDeleteWallet(id: string) {
    if (!id) return;
    try {
      await mutations.deleteWalletMutation.mutateAsync(id);
    } catch {
      // Error is surfaced through the mutation onError handler; keep the
      // drawer open so the user can retry.
      return;
    }
    setSelectedWalletId(null);
  }

  async function handleUpdateWallet(id: string, data: Partial<Omit<typeof walletsSchema.$inferInsert, "workspaceId">>) {
    await mutations.updateWalletMutation.mutateAsync({ id, data });
  }

  async function handleDeleteGroup(id: string) {
    if (!id) return;
    try {
      await mutations.deleteWalletGroupMutation.mutateAsync(id);
    } catch {
      // Error is surfaced through the mutation onError handler; the row stays
      // in place so the user can retry.
    }
  }

  async function handleCreateGroup(data: { name: string; description: string }) {
    await mutations.createWalletGroupMutation.mutateAsync({
      data: {
        name: data.name,
        description: data.description || undefined,
      },
    });
    setIsAddGroupOpen(false);
  }

  async function handleUpdateGroup(id: string, data: { name: string; description: string }) {
    await mutations.updateWalletGroupMutation.mutateAsync({ id, data: { name: data.name, description: data.description || null } });
    setEditingGroup(null);
  }

  return (
    <div className="min-w-0 py-5 lg:py-7">
      <header className="flex flex-col gap-4 border-b soft-divider px-4 pb-5 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-8">
        <div>
          <h1 className="mt-1 text-2xl font-semibold tracking-[-0.02em]">Accounts</h1>
        </div>
        <Button variant="secondary" size="sm" onClick={() => { clearNotice(); setIsAddOpen(true); }}><Plus />Add account</Button>
      </header>

      <CornerToast notice={notice} onClose={clearNotice} />

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
          <input
            aria-label="Search accounts"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
            placeholder={activeTab === "Wallets" ? "Search wallets..." : activeTab === "Groups" ? "Search groups..." : "Search accounts..."}
          />
        </label>
        <div className="flex flex-1 flex-wrap items-center gap-2">
          {activeTab === "Wallets" ? (
            <Button variant="secondary" size="sm" onClick={() => setIsAddWalletOpen(true)}><Plus className="size-3.5" />Add wallet</Button>
          ) : activeTab === "Groups" ? (
            <Button variant="secondary" size="sm" onClick={() => setIsAddGroupOpen(true)}><Plus className="size-3.5" />Add group</Button>
          ) : (
            <>
              <button type="button" disabled title="Preview only" className="flex h-8 items-center gap-2 rounded-lg border border-white/[0.045] bg-transparent px-3 text-xs text-muted-foreground opacity-50"><ShieldCheck className="size-3.5" />Workspace scoped</button>
              <button type="button" disabled title="Preview only" className="flex h-8 items-center gap-2 rounded-lg border border-white/[0.045] bg-transparent px-3 text-xs text-muted-foreground opacity-50"><WalletCards className="size-3.5" />Wallet usage</button>
            </>
          )}
        </div>
      </div>

      {activeTab === "Identities" ? (
        <IdentitiesView
          accounts={filteredAccounts}
          onOpenAccount={(account) => setSelectedAccountId(account.id ?? null)}
          onDeleteAccount={handleDeleteAccount}
          onUploadAvatar={handleUploadAvatar}
          onSetAvatarUrl={handleSetAvatarUrl}
        />
      ) : null}
      {activeTab === "Wallets" ? <WalletsView walletItems={filteredWallets} onOpenWallet={openWallet} onDeleteWallet={handleDeleteWallet} /> : null}
      {activeTab === "Groups" ? <GroupsView groups={filteredGroups} onDeleteGroup={handleDeleteGroup} onEditGroup={setEditingGroup} /> : null}

      <AddAccountDialog open={isAddOpen} onClose={() => setIsAddOpen(false)} onCreate={handleCreateAccount} />
      <AddWalletDialog open={isAddWalletOpen} onClose={() => setIsAddWalletOpen(false)} onCreate={handleCreateWallet} accounts={accountItems} />
      <AddGroupDialog open={isAddGroupOpen} onClose={() => setIsAddGroupOpen(false)} onCreate={handleCreateGroup} />
      <EditGroupDialog group={editingGroup} onClose={() => setEditingGroup(null)} onSave={handleUpdateGroup} />
      <AccountDetailPanel
        account={selectedAccount}
        walletItems={walletItems}
        onClose={() => setSelectedAccountId(null)}
        onOpenWallet={openWallet}
        onAddWallet={addWalletForAccount}
        onUpdateAccount={handleUpdateAccount}
        onDeleteAccount={handleDeleteAccount}
        onUploadAvatar={handleUploadAvatar}
        onSetAvatarUrl={handleSetAvatarUrl}
      />
      <WalletDetailPanel wallet={selectedWallet} onClose={() => setSelectedWalletId(null)} onOpenAccount={openAccountByName} onUpdate={handleUpdateWallet} onDelete={handleDeleteWallet} accountItems={accountItems} groupItems={groupItems} />
    </div>
  );
}

function TiltCard({ children, className, onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLElement>(null);

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse") return;

    const wrapper = wrapperRef.current;
    const card = cardRef.current;
    if (!wrapper || !card) return;

    const rect = wrapper.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    const rotateX = (0.5 - y) * 4.5;
    const rotateY = (x - 0.5) * 4.5;

    wrapper.classList.add("is-hover");
    card.classList.add("is-tilting");
    card.style.setProperty("--tilt-rx", rotateX.toFixed(2) + "deg");
    card.style.setProperty("--tilt-ry", rotateY.toFixed(2) + "deg");
    card.style.setProperty("--tilt-gx", (x * 100).toFixed(1) + "%");
    card.style.setProperty("--tilt-gy", (y * 100).toFixed(1) + "%");
  }

  function handlePointerLeave() {
    const wrapper = wrapperRef.current;
    const card = cardRef.current;
    if (!wrapper || !card) return;

    wrapper.classList.remove("is-hover");
    card.classList.remove("is-tilting");
    card.style.setProperty("--tilt-rx", "0deg");
    card.style.setProperty("--tilt-ry", "0deg");
    card.style.setProperty("--tilt-gx", "50%");
    card.style.setProperty("--tilt-gy", "50%");
  }

  return (
    <div ref={wrapperRef} className="t-tilt row-enter-in" onPointerMove={handlePointerMove} onPointerLeave={handlePointerLeave}>
      <article ref={cardRef} onClick={onClick} className={cn("t-tilt-card cursor-pointer rounded-xl bg-card/80 p-4 soft-panel transition-colors hover:bg-white/[0.032]", className)}>
        {children}
        <span className="t-tilt-glare" aria-hidden="true" />
      </article>
    </div>
  );
}

function IdentitiesView({
  accounts: accountItems,
  onOpenAccount,
  onDeleteAccount,
  onUploadAvatar,
  onSetAvatarUrl,
}: {
  accounts: Account[];
  onOpenAccount: (account: Account) => void;
  onDeleteAccount: (id: string) => void;
  onUploadAvatar: (id: string, file: File) => Promise<void>;
  onSetAvatarUrl: (id: string, url: string) => Promise<void>;
}) {
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  return (
    <div className="identity-card-grid grid gap-3 px-4 py-4 sm:px-6 lg:px-8">
      {accountItems.map((account) => (
        <TiltCard key={account.id ?? account.name} onClick={() => onOpenAccount(account)} className="identity-card min-h-[154px] w-full p-4">
          <div className="relative z-10 flex h-full flex-col">
            <div className="flex items-start justify-between gap-3">
              <h2 className="truncate text-sm font-semibold tracking-[-0.01em] text-foreground">{account.name}</h2>
              <div className="relative">
                <button onClick={(event) => { event.stopPropagation(); setMenuOpen(menuOpen === account.name ? null : account.name); }} aria-label={"More options for " + account.name} className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-white/[0.045] hover:text-foreground"><MoreHorizontal className="size-4" /></button>
                {menuOpen === account.name ? (
                  <div onClick={(event) => event.stopPropagation()} className="absolute right-0 top-8 z-50 w-32 rounded-lg border border-white/[0.08] bg-[#161618] py-1 shadow-xl">
                    <ConfirmDelete onConfirm={() => { setMenuOpen(null); if (account.id) onDeleteAccount(account.id); }} className="px-3 py-1.5" />
                  </div>
                ) : null}
              </div>
            </div>

            <div className="mt-4 flex flex-1 items-center justify-between gap-5">
              <EditableAvatar
                label={account.avatar}
                imageUrl={account.avatarUrl}
                size="lg"
                shape="square"
                onUploadFile={account.id ? (file) => onUploadAvatar(account.id!, file) : undefined}
                onSetUrl={account.id ? (url) => onSetAvatarUrl(account.id!, url) : undefined}
              />
              <div className="w-[154px] shrink-0 space-y-2 text-[11px] text-muted-foreground">
                <IdentityMeta icon={<XLogoIcon className="size-3.5" />} value={account.handle} />
                <IdentityMeta icon={<Mail className="size-3.5" />} value={account.email} />
                <IdentityMeta icon={<DiscordIcon className="size-3.5" />} value={account.discord} />
              </div>
            </div>

            <p className="mt-4 truncate font-mono text-[10px] uppercase tracking-[0.08em] text-foreground/85">
              {account.projects} projects · {account.tasks} daily · {account.wallets.length} wallets
            </p>
          </div>
        </TiltCard>
      ))}
    </div>
  );
}

function WalletsView({ walletItems, onOpenWallet, onDeleteWallet }: { walletItems: Wallet[]; onOpenWallet: (wallet: Wallet) => void; onDeleteWallet: (id: string) => void }) {
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
        <tbody>{walletItems.map((wallet) => <WalletRow key={wallet.label} wallet={wallet} onOpen={() => onOpenWallet(wallet)} onDelete={onDeleteWallet} />)}</tbody>
      </table>
    </div>
  );
}

function WalletRow({ wallet, onOpen, onDelete }: { wallet: Wallet; onOpen: () => void; onDelete: (id: string) => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <tr onClick={onOpen} className="row-enter-in h-[58px] cursor-pointer border-b border-white/[0.035] hover:bg-white/[0.025]">
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
      <td className="px-3">
        <div className="relative">
          <button onClick={(event) => { event.stopPropagation(); setMenuOpen(!menuOpen); }} aria-label={"More options for " + wallet.label} className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-white/[0.045] hover:text-foreground"><MoreHorizontal className="size-4" /></button>
          {menuOpen ? (
            <div onClick={(event) => event.stopPropagation()} className="absolute right-0 top-8 z-50 w-32 rounded-lg border border-white/[0.08] bg-[#161618] py-1 shadow-xl">
              <ConfirmDelete onConfirm={() => { setMenuOpen(false); if (wallet.id) onDelete(wallet.id); }} className="px-3 py-1.5" />
            </div>
          ) : null}
        </div>
      </td>
    </tr>
  );
}

function AccountDetailPanel({
  account,
  walletItems,
  onClose,
  onOpenWallet,
  onAddWallet,
  onUpdateAccount,
  onDeleteAccount,
  onUploadAvatar,
  onSetAvatarUrl,
}: {
  account: Account | null;
  walletItems: Wallet[];
  onClose: () => void;
  onOpenWallet: (wallet: Wallet) => void;
  onAddWallet: (accountName: string, input: { label: string; chain: string; type: string }) => void;
  onUpdateAccount: (id: string, data: { label?: string; xUsername?: string; discordUsername?: string; email?: string }) => void;
  onDeleteAccount: (id: string) => void;
  onUploadAvatar: (id: string, file: File) => Promise<void>;
  onSetAvatarUrl: (id: string, url: string) => Promise<void>;
}) {
  const [isAddingWallet, setIsAddingWallet] = useState(false);
  const [walletLabel, setWalletLabel] = useState("");
  const [walletChain, setWalletChain] = useState("EVM");
  const [walletType, setWalletType] = useState("main");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editLabel, setEditLabel] = useState("");
  const [editX, setEditX] = useState("");
  const [editDiscord, setEditDiscord] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileError, setProfileError] = useState("");

  useDrawerDismiss(onClose, Boolean(account));

  const lastAccount = useRef<Account | null>(account);
  useEffect(() => {
    if (account) lastAccount.current = account;
  }, [account]);
  const { mounted, closing } = usePresence(Boolean(account), 260);
  if (!mounted) return null;
  const currentCandidate = account ?? lastAccount.current;
  if (!currentCandidate) return null;
  const current: Account = currentCandidate;

  const accountName = current.name;
  const ownedWallets = walletItems.filter((wallet) =>
    current.id ? wallet.ownerId === current.id : wallet.owner === accountName,
  );

  function createWallet() {
    const trimmedLabel = walletLabel.trim();
    if (!trimmedLabel) return;

    onAddWallet(accountName, { label: trimmedLabel, chain: walletChain, type: walletType });
    setWalletLabel("");
    setWalletChain("EVM");
    setWalletType("main");
    setIsAddingWallet(false);
  }

  async function saveProfile() {
    if (!current.id) return;
    const label = editLabel.trim();
    if (!label) {
      setProfileError("Account label is required");
      return;
    }
    setProfileError("");
    try {
      await onUpdateAccount(current.id, {
        label,
        xUsername: editX || undefined,
        discordUsername: editDiscord || undefined,
        email: editEmail || undefined,
      });
      setIsEditingProfile(false);
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : "Unable to update account");
    }
  }

  return (
    <div
      className={cn("fixed inset-y-0 right-0 z-50 flex w-full justify-end bg-black/35 backdrop-blur-[2px]", closing ? "drawer-backdrop-out" : "drawer-backdrop-in")}
      role="dialog"
      aria-modal="true"
      aria-labelledby="account-detail-title"
      onClick={onClose}
    >
      <aside
        className={cn("h-full w-full max-w-[520px] overflow-y-auto border-l soft-divider bg-card shadow-2xl shadow-black/50 scrollbar-subtle", closing ? "drawer-panel-out" : "drawer-panel-in")}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b soft-divider bg-card/95 px-5 py-3 backdrop-blur">
          <h2 id="account-detail-title" className="truncate text-base font-semibold">Account detail</h2>
          <div className="flex items-center gap-1">
            <div className="relative">
              <button onClick={() => setMenuOpen((open) => !open)} className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground" aria-label="More options"><MoreHorizontal className="size-4" /></button>
              {menuOpen ? (
                <div className="absolute right-0 top-10 z-50 w-36 rounded-lg border border-white/[0.08] bg-[#161618] py-1 shadow-xl">
                  <ConfirmDelete onConfirm={() => { setMenuOpen(false); if (current.id) onDeleteAccount(current.id); }} className="px-3 py-1.5" />
                </div>
              ) : null}
            </div>
            <button onClick={onClose} className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground" aria-label="Close account detail"><X className="size-4" /></button>
          </div>
        </div>

        <div className="px-5 py-5">
          <div className="flex items-start gap-3">
            <EditableAvatar
              label={current.avatar}
              imageUrl={current.avatarUrl}
              size="lg"
              onUploadFile={current.id ? (file) => onUploadAvatar(current.id!, file) : undefined}
              onSetUrl={current.id ? (url) => onSetAvatarUrl(current.id!, url) : undefined}
            />
            <div className="min-w-0 flex-1">
              <h3 className="text-2xl font-semibold tracking-[-0.03em]">{current.name}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{current.handle}</p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2">
            <Metric label="Projects" value={current.projects} />
            <Metric label="Wallets" value={ownedWallets.length} />
          </div>

          <PanelSection title="Wallets" action={<button onClick={() => setIsAddingWallet((current) => !current)} className="text-[11px] text-muted-foreground hover:text-foreground">+ Add wallet</button>}>
            <div className="space-y-1.5">
              {ownedWallets.map((wallet) => (
                <button key={wallet.id ?? wallet.label} onClick={() => onOpenWallet(wallet)} className="flex w-full items-center gap-3 rounded-lg bg-white/[0.025] px-3 py-2 text-left hover:bg-white/[0.045]">
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white/[0.055] text-muted-foreground"><CreditCard className="size-4" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-semibold">{wallet.label}</span>
                    <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">{wallet.chain} · {formatWalletType(wallet.type)} · {wallet.address}</span>
                  </span>
                </button>
              ))}
              {ownedWallets.length === 0 ? (
                <p className="text-[11px] text-muted-foreground">No wallets linked to this account yet.</p>
              ) : null}
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
            {current.activeProjects.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {current.activeProjects.map((project) => <Badge key={project} variant="secondary">{project}</Badge>)}
              </div>
            ) : (
              <p className="text-[11px] text-muted-foreground">No active project assignments.</p>
            )}
          </PanelSection>

          <PanelSection title="Profile" action={
            isEditingProfile ? (
              <div className="flex items-center gap-1.5">
                <button onClick={() => { setIsEditingProfile(false); setProfileError(""); }} className="text-[11px] text-muted-foreground hover:text-foreground">Cancel</button>
                <button onClick={saveProfile} className="text-[11px] font-medium text-foreground hover:text-muted-foreground">Save</button>
              </div>
            ) : (
              <button onClick={() => {
                setEditLabel(current.name);
                setEditX(current.handle === "not linked" ? "" : current.handle);
                setEditDiscord(current.discord);
                setEditEmail(current.email === "tracking only" ? "" : current.email);
                setProfileError("");
                setIsEditingProfile(true);
              }} className="text-[11px] text-muted-foreground hover:text-foreground">Edit</button>
            )
          }>
            {isEditingProfile ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CircleUserRound className="size-3.5 shrink-0 text-muted-foreground" />
                  <input value={editLabel} onChange={(e) => setEditLabel(e.target.value)} className="h-8 flex-1 rounded-md bg-white/[0.05] px-2 text-xs outline-none focus:ring-1 focus:ring-ring" placeholder="Account label" />
                </div>
                <div className="flex items-center gap-2">
                  <XLogoIcon className="size-3.5 shrink-0 text-muted-foreground" />
                  <input value={editX} onChange={(e) => setEditX(e.target.value)} className="h-8 flex-1 rounded-md bg-white/[0.05] px-2 text-xs outline-none focus:ring-1 focus:ring-ring" placeholder="@handle" />
                </div>
                <div className="flex items-center gap-2">
                  <DiscordIcon className="size-3.5 shrink-0 text-muted-foreground" />
                  <input value={editDiscord} onChange={(e) => setEditDiscord(e.target.value)} className="h-8 flex-1 rounded-md bg-white/[0.05] px-2 text-xs outline-none focus:ring-1 focus:ring-ring" placeholder="user.name" />
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="size-3.5 shrink-0 text-muted-foreground" />
                  <input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className="h-8 flex-1 rounded-md bg-white/[0.05] px-2 text-xs outline-none focus:ring-1 focus:ring-ring" placeholder="email@example.com" />
                </div>
                {profileError ? <p className="text-[11px] text-muted-foreground">{profileError}</p> : null}
              </div>
            ) : (
              <div className="space-y-2 text-xs">
                <Meta icon={CircleUserRound} label="Label" value={current.name} />
                <Meta icon={XLogoIcon} label="X" value={current.handle} />
                <Meta icon={CircleUserRound} label="Discord" value={current.discord || "—"} />
                <Meta icon={ShieldCheck} label="Email" value={current.email} />
              </div>
            )}
          </PanelSection>
        </div>
      </aside>
    </div>
  );
}

function WalletDetailPanel({ wallet, onClose, onOpenAccount, onUpdate, onDelete, accountItems, groupItems }: { wallet: Wallet | null; onClose: () => void; onOpenAccount: (name: string) => void; onUpdate: (id: string, data: Partial<Omit<typeof walletsSchema.$inferInsert, "workspaceId">>) => void; onDelete: (id: string) => void; accountItems: Account[]; groupItems: UIGroup[] }) {
  useDrawerDismiss(onClose, Boolean(wallet));

  const [menuOpen, setMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editLabel, setEditLabel] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editChainType, setEditChainType] = useState("");
  const [editWalletType, setEditWalletType] = useState("");
  const [editWalletGroupId, setEditWalletGroupId] = useState("");
  const [editOwnerAccountId, setEditOwnerAccountId] = useState("");

  const lastWallet = useRef<Wallet | null>(wallet);
  useEffect(() => {
    if (wallet) lastWallet.current = wallet;
  }, [wallet]);
  const { mounted, closing } = usePresence(Boolean(wallet), 260);
  if (!mounted) return null;
  const wCandidate = wallet ?? lastWallet.current;
  if (!wCandidate) return null;
  const w: Wallet = wCandidate;

  function enterEdit() {
    setEditLabel(w.label);
    setEditAddress(w.address);
    setEditChainType(w.chain);
    setEditWalletType(formatWalletType(w.type));
    setEditWalletGroupId(w.groupId ?? "");
    setEditOwnerAccountId(w.ownerId ?? "");
    setIsEditing(true);
    setMenuOpen(false);
  }

  function saveEdit() {
    if (!w.id) return;
    const walletTypeDb = (reverseWalletTypeLabels[editWalletType] ?? "main") as typeof walletsSchema.$inferInsert.walletType;
    onUpdate(w.id, {
      label: editLabel || undefined,
      address: editAddress || undefined,
      chainType: editChainType || undefined,
      walletType: walletTypeDb,
      walletGroupId: editWalletGroupId || undefined,
      ownerAccountId: editOwnerAccountId || undefined,
    });
    setIsEditing(false);
  }

  function cancelEdit() {
    setIsEditing(false);
  }

  const walletTypeOptions = ["Main", "Project wallet", "Burner", "L1", "Testnet", "Retro", "Nft", "Other"];

  return (
    <div
      className={cn("fixed inset-y-0 right-0 z-50 flex w-full justify-end bg-black/35 backdrop-blur-[2px]", closing ? "drawer-backdrop-out" : "drawer-backdrop-in")}
      role="dialog"
      aria-modal="true"
      aria-labelledby="wallet-detail-title"
      onClick={onClose}
    >
      <aside
        className={cn("h-full w-full max-w-[520px] overflow-y-auto border-l soft-divider bg-card shadow-2xl shadow-black/50 scrollbar-subtle", closing ? "drawer-panel-out" : "drawer-panel-in")}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b soft-divider bg-card/95 px-5 py-3 backdrop-blur">
          <h2 id="wallet-detail-title" className="truncate text-base font-semibold">Wallet detail</h2>
          <div className="flex items-center gap-1">
            <div className="relative">
              <button onClick={() => setMenuOpen(!menuOpen)} aria-label="More options" className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"><MoreHorizontal className="size-4" /></button>
              {menuOpen ? (
                <div className="absolute right-0 top-full z-50 mt-1 w-32 rounded-lg border border-white/[0.08] bg-[#161618] py-1 shadow-xl">
                  <button onClick={enterEdit} className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-foreground hover:bg-white/[0.055]">Edit</button>
                  <ConfirmDelete onConfirm={() => { setMenuOpen(false); if (w.id) onDelete(w.id); }} className="px-3 py-1.5" />
                </div>
              ) : null}
            </div>
            <button onClick={onClose} className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground" aria-label="Close wallet detail"><X className="size-4" /></button>
          </div>
        </div>

        <div className="px-5 py-5">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/[0.065] text-muted-foreground shadow-sm"><CreditCard className="size-5" /></span>
            <div className="min-w-0 flex-1">
              {isEditing ? (
                <input value={editLabel} onChange={(e) => setEditLabel(e.target.value)} className="h-9 w-full rounded-md bg-white/[0.05] px-2 text-2xl font-semibold tracking-[-0.03em] outline-none focus:ring-1 focus:ring-ring" />
              ) : (
                <h3 className="text-2xl font-semibold tracking-[-0.03em]">{w.label}</h3>
              )}
              {isEditing ? (
                <input value={editAddress} onChange={(e) => setEditAddress(e.target.value)} className="mt-1 h-8 w-full rounded-md bg-white/[0.05] px-2 font-mono text-xs outline-none focus:ring-1 focus:ring-ring" placeholder="0x..." />
              ) : (
                <button className="mt-1 inline-flex max-w-full items-center gap-1.5 truncate text-xs text-muted-foreground hover:text-foreground">
                  <span className="truncate font-mono">{w.address}</span>
                  <Copy className="size-3" />
                </button>
              )}
            </div>
          </div>

          {isEditing ? (
            <div className="mt-4 flex gap-2">
              <button onClick={saveEdit} className="h-8 rounded-lg bg-foreground/90 px-3 text-xs font-medium text-background hover:bg-foreground">Save</button>
              <button onClick={cancelEdit} className="h-8 rounded-lg bg-white/[0.06] px-3 text-xs text-muted-foreground hover:bg-white/[0.09]">Cancel</button>
            </div>
          ) : null}

          <section className="mt-6 grid gap-x-6 gap-y-4 border-t border-white/[0.045] pt-4 sm:grid-cols-2">
            {isEditing ? (
              <>
                <div className="flex flex-col gap-1">
                  <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Label</p>
                  <input value={editLabel} onChange={(e) => setEditLabel(e.target.value)} className="h-8 rounded-md bg-white/[0.05] px-2 text-xs outline-none focus:ring-1 focus:ring-ring" />
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Address</p>
                  <input value={editAddress} onChange={(e) => setEditAddress(e.target.value)} className="h-8 rounded-md bg-white/[0.05] px-2 font-mono text-xs outline-none focus:ring-1 focus:ring-ring" />
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Chain</p>
                  <input value={editChainType} onChange={(e) => setEditChainType(e.target.value)} className="h-8 rounded-md bg-white/[0.05] px-2 text-xs outline-none focus:ring-1 focus:ring-ring" placeholder="EVM" />
                </div>
                <AppSelect
                  label="Type"
                  value={editWalletType}
                  options={walletTypeOptions.map((option) => ({ value: option, label: option }))}
                  onChange={setEditWalletType}
                />
                <AppSelect
                  label="Group"
                  value={editWalletGroupId}
                  options={[{ value: "", label: "None" }, ...groupItems.filter((group) => group.id).map((group) => ({ value: group.id!, label: group.name }))]}
                  onChange={setEditWalletGroupId}
                />
                <AppSelect
                  label="Owner"
                  value={editOwnerAccountId}
                  options={[{ value: "", label: "No persona" }, ...accountItems.filter((account) => account.id).map((account) => ({ value: account.id!, label: account.name }))]}
                  onChange={setEditOwnerAccountId}
                />
              </>
            ) : (
              <>
                <PanelProperty label="Chain">{w.chain}</PanelProperty>
                <PanelProperty label="Type"><Badge variant="outline">{formatWalletType(w.type)}</Badge></PanelProperty>
                <PanelProperty label="Group"><Badge variant="secondary">{w.group}</Badge></PanelProperty>
                <PanelProperty label="Owner">
                  {w.owner !== "none" ? (
                    <button onClick={() => onOpenAccount(w.owner)} className="text-xs font-medium text-foreground hover:text-muted-foreground">{w.owner}</button>
                  ) : (
                    <span className="text-muted-foreground">No persona</span>
                  )}
                </PanelProperty>
              </>
            )}
          </section>

          <PanelSection title="Used in">
            <div className="flex flex-wrap gap-1.5">
              {w.usedIn.length > 0 ? w.usedIn.map((project) => <Badge key={project} variant="secondary">{project}</Badge>) : <span className="text-xs text-muted-foreground">No project usage yet</span>}
            </div>
          </PanelSection>

          <PanelSection title="Recent activity">
            <div className="space-y-1.5">
              {w.recentActivity.map((item) => (
                <div key={item} className="rounded-lg bg-white/[0.025] px-3 py-2 text-xs text-muted-foreground">{item}</div>
              ))}
            </div>
          </PanelSection>
        </div>
      </aside>
    </div>
  );
}

function GroupsView({ groups: groupItems, onDeleteGroup, onEditGroup }: { groups: UIGroup[]; onDeleteGroup: (id: string) => void; onEditGroup: (group: UIGroup) => void }) {
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  return (
    <div className="grid gap-3 px-4 py-4 sm:px-6 lg:grid-cols-4 lg:px-8">
      {groupItems.map((group) => (
        <article key={group.id ?? group.name} className="row-enter-in rounded-xl bg-card/80 p-4 soft-panel">
          <div className="flex items-start justify-between gap-3">
            <span className="grid size-9 place-items-center rounded-lg bg-white/[0.055] text-muted-foreground"><FolderOpen className="size-4" /></span>
            <div className="relative">
              <button onClick={() => setMenuOpen(menuOpen === (group.id ?? group.name) ? null : (group.id ?? group.name))} aria-label={"More options for " + group.name} className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-white/[0.045] hover:text-foreground"><MoreHorizontal className="size-4" /></button>
              {menuOpen === (group.id ?? group.name) ? (
                <div className="absolute right-0 top-8 z-50 w-32 rounded-lg border border-white/[0.08] bg-[#161618] py-1 shadow-xl">
                  <button onClick={() => { setMenuOpen(null); onEditGroup(group); }} className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-foreground hover:bg-white/[0.055]">Edit</button>
                  <ConfirmDelete onConfirm={() => { setMenuOpen(null); if (group.id) onDeleteGroup(group.id); }} className="px-3 py-1.5" />
                </div>
              ) : null}
            </div>
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

function EditableAvatar({
  label,
  imageUrl,
  size = "md",
  shape = "round",
  onUploadFile,
  onSetUrl,
}: {
  label: string;
  imageUrl?: string;
  size?: "md" | "lg";
  shape?: "round" | "square";
  onUploadFile?: (file: File) => Promise<void>;
  onSetUrl?: (url: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [draftUrl, setDraftUrl] = useState(imageUrl ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState<CornerToastNotice | null>(null);

  const clearNotice = useCallback(() => {
    setNotice(null);
  }, []);

  async function handleFile(file: File | null) {
    if (!file || !onUploadFile || isSaving) return;
    setIsSaving(true);
    clearNotice();
    try {
      await onUploadFile(file);
      setOpen(false);
    } catch (uploadError) {
      setNotice({ id: Date.now(), tone: "error", title: "Action failed", message: uploadError instanceof Error ? uploadError.message : "Unable to upload avatar" });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSetUrl() {
    if (!onSetUrl || isSaving) return;
    setIsSaving(true);
    clearNotice();
    try {
      const normalized = normalizeHttpUrl(draftUrl);
      setDraftUrl(normalized);
      await onSetUrl(normalized);
      setOpen(false);
    } catch (urlError) {
      setNotice({ id: Date.now(), tone: "error", title: "Action failed", message: urlError instanceof Error ? urlError.message : "Unable to save avatar URL" });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="relative shrink-0" onClick={(event) => event.stopPropagation()}>
      <CornerToast notice={notice} onClose={clearNotice} />
      <button
        type="button"
        onClick={() => {
          setDraftUrl(imageUrl ?? "");
          clearNotice();
          setOpen((current) => !current);
        }}
        className={cn(
          "grid shrink-0 place-items-center overflow-hidden bg-white/[0.065] text-xs font-semibold text-foreground",
          size === "lg" ? "size-12" : "size-10",
          shape === "square" ? "rounded-xl" : "rounded-full",
        )}
        aria-label="Edit account avatar"
      >
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt=""
            width={size === "lg" ? 48 : 40}
            height={size === "lg" ? 48 : 40}
            className="size-full object-cover"
            unoptimized
          />
        ) : (
          label
        )}
      </button>

      {open ? (
        <div className="absolute left-0 top-full z-[80] mt-2 w-64 rounded-xl border border-white/[0.08] bg-[#161618] p-2 shadow-2xl shadow-black/50">
          <label className={cn("flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-muted-foreground hover:bg-white/[0.055] hover:text-foreground", isSaving || !onUploadFile ? "pointer-events-none opacity-50" : "")}>
            <Upload className="size-3.5" />
            {isSaving ? "Uploading..." : "Upload image"}
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              disabled={isSaving || !onUploadFile}
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                event.target.value = "";
                void handleFile(file);
              }}
            />
          </label>
          <div className="mt-1 rounded-lg bg-white/[0.025] p-2">
            <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Image URL</p>
            <div className="mt-1.5 flex gap-2">
              <input
                type="text"
                inputMode="url"
                autoCapitalize="none"
                autoCorrect="off"
                value={draftUrl}
                onChange={(event) => setDraftUrl(event.target.value)}
                onBlur={() => setDraftUrl((value) => normalizeHttpUrl(value))}
                disabled={isSaving || !onSetUrl}
                className="h-8 min-w-0 flex-1 rounded-lg bg-background px-2 text-xs outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-ring disabled:opacity-50"
                placeholder="https://..."
              />
              <button
                type="button"
                disabled={isSaving || !onSetUrl}
                onClick={() => void handleSetUrl()}
                className="h-8 rounded-lg bg-white/[0.075] px-2 text-xs font-medium hover:bg-white/[0.11] disabled:opacity-50"
              >
                Set
              </button>
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
      <div className="mt-1 flex min-h-[22px] items-center text-xs text-foreground">{children}</div>
    </div>
  );
}

function AddWalletDialog({
  open,
  onClose,
  onCreate,
  accounts,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (data: { label: string; address: string; chainType: string; walletType: string; ownerAccountId?: string }) => void;
  accounts: Account[];
}) {
  const [label, setLabel] = useState("");
  const [address, setAddress] = useState("");
  const [chainType, setChainType] = useState("EVM");
  const [walletType, setWalletType] = useState("main");
  const [ownerAccountId, setOwnerAccountId] = useState("");

  if (!open) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!label.trim() || !address.trim()) return;
    onCreate({
label: label.trim(),
address: address.trim(),
chainType,
walletType,
ownerAccountId: ownerAccountId || undefined,
    });
    setLabel("");
    setAddress("");
    setChainType("EVM");
    setWalletType("main");
    setOwnerAccountId("");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
<div className="absolute inset-0 bg-black/50" onClick={onClose} />
<div className="relative z-10 w-full max-w-sm rounded-lg bg-popover shadow-[0_0_0_1px_rgb(255_255_255/0.06),0_24px_48px_-8px_rgb(0_0_0/0.45)]">
  <form onSubmit={handleSubmit}>
    <div className="flex items-center justify-between px-4 py-3 border-b soft-divider">
      <h3 className="text-sm font-semibold">New Wallet</h3>
      <button type="button" onClick={onClose} className="rounded-full p-1 text-muted-foreground hover:bg-white/[0.06] hover:text-foreground"><X className="size-4" /></button>
    </div>
    <div className="flex flex-col gap-3 px-4 py-3">
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-muted-foreground">Label *</span>
        <input type="text" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Moree EVM Main" className="h-8 rounded-md bg-white/[0.05] px-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-white/20" autoFocus />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-muted-foreground">Address *</span>
        <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="0x..." className="h-8 rounded-md bg-white/[0.05] px-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-white/20" />
      </label>
      <AppSelect
        label="Chain"
        value={chainType}
        options={["EVM", "Solana", "Bitcoin", "Sui", "Aptos", "Other"].map((chain) => ({ value: chain, label: chain }))}
        onChange={setChainType}
      />
      <AppSelect
        label="Type"
        value={walletType}
        options={["main", "project_wallet", "burner", "l1", "testnet", "retro", "nft", "other"].map((type) => ({ value: type, label: formatWalletType(type) }))}
        onChange={setWalletType}
      />
      <AppSelect
        label="Owner Account"
        value={ownerAccountId}
        options={[{ value: "", label: "None" }, ...accounts.filter((account) => account.id).map((account) => ({ value: account.id!, label: account.name }))]}
        onChange={setOwnerAccountId}
      />
    </div>
    <div className="flex items-center justify-end gap-2 px-4 py-3 border-t soft-divider">
      <Button variant="secondary" size="sm" type="button" onClick={onClose}>Cancel</Button>
      <Button size="sm" type="submit" disabled={!label.trim() || !address.trim()}>Create</Button>
    </div>
  </form>
</div>
    </div>
  );
}

function AddGroupDialog({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (data: { name: string; description: string }) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  if (!open) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onCreate({ name: name.trim(), description: description.trim() });
    setName("");
    setDescription("");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
<div className="absolute inset-0 bg-black/50" onClick={onClose} />
<div className="relative z-10 w-full max-w-sm rounded-lg bg-popover shadow-[0_0_0_1px_rgb(255_255_255/0.06),0_24px_48px_-8px_rgb(0_0_0/0.45)]">
  <form onSubmit={handleSubmit}>
    <div className="flex items-center justify-between px-4 py-3 border-b soft-divider">
      <h3 className="text-sm font-semibold">New Group</h3>
      <button type="button" onClick={onClose} className="rounded-full p-1 text-muted-foreground hover:bg-white/[0.06] hover:text-foreground"><X className="size-4" /></button>
    </div>
    <div className="flex flex-col gap-3 px-4 py-3">
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-muted-foreground">Name *</span>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Main" className="h-8 rounded-md bg-white/[0.05] px-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-white/20" autoFocus />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-muted-foreground">Description</span>
        <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Primary wallets owned by personas" className="h-8 rounded-md bg-white/[0.05] px-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-white/20" />
      </label>
    </div>
    <div className="flex items-center justify-end gap-2 px-4 py-3 border-t soft-divider">
      <Button variant="secondary" size="sm" type="button" onClick={onClose}>Cancel</Button>
      <Button size="sm" type="submit" disabled={!name.trim()}>Create</Button>
    </div>
  </form>
</div>
    </div>
  );
}

function EditGroupDialog({ group, onClose, onSave }: { group: UIGroup | null; onClose: () => void; onSave: (id: string, data: { name: string; description: string }) => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    setName(group?.name ?? "");
    setDescription(group?.description ?? "");
  }, [group]);

  if (!group) return null;
  const groupId = group.id;

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim() || !groupId) return;
    onSave(groupId, { name: name.trim(), description: description.trim() });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm rounded-lg bg-popover shadow-[0_0_0_1px_rgb(255_255_255/0.06),0_24px_48px_-8px_rgb(0_0_0/0.45)]">
        <form onSubmit={handleSubmit}>
          <div className="flex items-center justify-between px-4 py-3 border-b soft-divider">
            <h3 className="text-sm font-semibold">Edit Group</h3>
            <button type="button" onClick={onClose} className="rounded-full p-1 text-muted-foreground hover:bg-white/[0.06] hover:text-foreground"><X className="size-4" /></button>
          </div>
          <div className="flex flex-col gap-3 px-4 py-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">Name *</span>
              <input type="text" value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Main" className="h-8 rounded-md bg-white/[0.05] px-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-white/20" autoFocus />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">Description</span>
              <input type="text" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Primary wallets owned by personas" className="h-8 rounded-md bg-white/[0.05] px-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-white/20" />
            </label>
          </div>
          <div className="flex items-center justify-end gap-2 px-4 py-3 border-t soft-divider">
            <Button variant="secondary" size="sm" type="button" onClick={onClose}>Cancel</Button>
            <Button size="sm" type="submit" disabled={!name.trim()}>Save</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="rounded-lg border border-white/[0.045] bg-white/[0.02] px-3 py-2"><p className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground">{label}</p><p className="mt-1 text-lg font-semibold tabular-nums">{value}</p></div>;
}

function IdentityMeta({ icon, value }: { icon: ReactNode; value: string }) {
  return <div className="flex min-w-0 items-center gap-2"><span className="grid size-3.5 shrink-0 place-items-center text-muted-foreground">{icon}</span><span className="min-w-0 truncate text-foreground/78">{value}</span></div>;
}

function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 640 640" aria-hidden="true" className={className} fill="currentColor">
      <path d="M524.5 133.8C524.3 133.5 524.1 133.2 523.7 133.1C485.6 115.6 445.3 103.1 404 96C403.6 95.9 403.2 96 402.9 96.1C402.6 96.2 402.3 96.5 402.1 96.9C396.6 106.8 391.6 117.1 387.2 127.5C342.6 120.7 297.3 120.7 252.8 127.5C248.3 117 243.3 106.8 237.7 96.9C237.5 96.6 237.2 96.3 236.9 96.1C236.6 95.9 236.2 95.9 235.8 95.9C194.5 103 154.2 115.5 116.1 133C115.8 133.1 115.5 133.4 115.3 133.7C39.1 247.5 18.2 358.6 28.4 468.2C28.4 468.5 28.5 468.7 28.6 469C28.7 469.3 28.9 469.4 29.1 469.6C73.5 502.5 123.1 527.6 175.9 543.8C176.3 543.9 176.7 543.9 177 543.8C177.3 543.7 177.7 543.4 177.9 543.1C189.2 527.7 199.3 511.3 207.9 494.3C208 494.1 208.1 493.8 208.1 493.5C208.1 493.2 208.1 493 208 492.7C207.9 492.4 207.8 492.2 207.6 492.1C207.4 492 207.2 491.8 206.9 491.7C191.1 485.6 175.7 478.3 161 469.8C160.7 469.6 160.5 469.4 160.3 469.2C160.1 469 160 468.6 160 468.3C160 468 160 467.7 160.2 467.4C160.4 467.1 160.5 466.9 160.8 466.7C163.9 464.4 167 462 169.9 459.6C170.2 459.4 170.5 459.2 170.8 459.2C171.1 459.2 171.5 459.2 171.8 459.3C268 503.2 372.2 503.2 467.3 459.3C467.6 459.2 468 459.1 468.3 459.1C468.6 459.1 469 459.3 469.2 459.5C472.1 461.9 475.2 464.4 478.3 466.7C478.5 466.9 478.7 467.1 478.9 467.4C479.1 467.7 479.1 468 479.1 468.3C479.1 468.6 479 468.9 478.8 469.2C478.6 469.5 478.4 469.7 478.2 469.8C463.5 478.4 448.2 485.7 432.3 491.6C432.1 491.7 431.8 491.8 431.6 492C431.4 492.2 431.3 492.4 431.2 492.7C431.1 493 431.1 493.2 431.1 493.5C431.1 493.8 431.2 494 431.3 494.3C440.1 511.3 450.1 527.6 461.3 543.1C461.5 543.4 461.9 543.7 462.2 543.8C462.5 543.9 463 543.9 463.3 543.8C516.2 527.6 565.9 502.5 610.4 469.6C610.6 469.4 610.8 469.2 610.9 469C611 468.8 611.1 468.5 611.1 468.2C623.4 341.4 590.6 231.3 524.2 133.7zM222.5 401.5C193.5 401.5 169.7 374.9 169.7 342.3C169.7 309.7 193.1 283.1 222.5 283.1C252.2 283.1 275.8 309.9 275.3 342.3C275.3 375 251.9 401.5 222.5 401.5zM417.9 401.5C388.9 401.5 365.1 374.9 365.1 342.3C365.1 309.7 388.5 283.1 417.9 283.1C447.6 283.1 471.2 309.9 470.7 342.3C470.7 375 447.5 401.5 417.9 401.5z" />
    </svg>
  );
}

function XLogoIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function Meta({ icon: Icon, label, value }: { icon: (props: { className?: string }) => ReactNode; label: string; value: string }) {
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

const reverseWalletTypeLabels: Record<string, string> = {
  "L1": "l1",
  "Main": "main",
  "Project wallet": "project_wallet",
  "Burner": "burner",
  "Testnet": "testnet",
  "Retro": "retro",
  "Nft": "nft",
  "Other": "other",
};

function formatOwner(value: string) {
  return value === "none" ? "No persona" : value;
}

// ─── Add Account Dialog ──────────────────────────────────────────────────────

function AddAccountDialog({ open, onClose, onCreate }: { open: boolean; onClose: () => void; onCreate: (data: { label: string; xUsername: string; discordUsername: string; email: string }) => void }) {
  const [label, setLabel] = useState("");
  const [xUsername, setXUsername] = useState("");
  const [discordUsername, setDiscordUsername] = useState("");
  const [email, setEmail] = useState("");

  if (!open) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!label.trim()) return;
    onCreate({ label: label.trim(), xUsername: xUsername.trim(), discordUsername: discordUsername.trim(), email: email.trim() });
    setLabel("");
    setXUsername("");
    setDiscordUsername("");
    setEmail("");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm rounded-lg bg-popover shadow-[0_0_0_1px_rgb(255_255_255/0.06),0_24px_48px_-8px_rgb(0_0_0/0.45)]">
        <form onSubmit={handleSubmit}>
          <div className="flex items-center justify-between px-4 py-3 border-b soft-divider">
            <h3 className="text-sm font-semibold">New Account</h3>
            <button type="button" onClick={onClose} className="rounded-full p-1 text-muted-foreground hover:bg-white/[0.06] hover:text-foreground"><X className="size-4" /></button>
          </div>
          <div className="flex flex-col gap-3 px-4 py-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">Label *</span>
              <input type="text" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Moree" className="h-8 rounded-md bg-white/[0.05] px-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-white/20" autoFocus />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">X Username</span>
              <input type="text" value={xUsername} onChange={(e) => setXUsername(e.target.value)} placeholder="@handle" className="h-8 rounded-md bg-white/[0.05] px-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-white/20" />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">Discord Username</span>
              <input type="text" value={discordUsername} onChange={(e) => setDiscordUsername(e.target.value)} placeholder="user.name" className="h-8 rounded-md bg-white/[0.05] px-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-white/20" />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">Email</span>
              <input type="text" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" className="h-8 rounded-md bg-white/[0.05] px-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-white/20" />
            </label>
          </div>
          <div className="flex items-center justify-end gap-2 px-4 py-3 border-t soft-divider">
            <Button variant="secondary" size="sm" type="button" onClick={onClose}>Cancel</Button>
            <Button size="sm" type="submit" disabled={!label.trim()}>Create</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
