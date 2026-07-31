"use client";

import { ExternalLink, Trash2, WalletCards, X } from "lucide-react";
import { useEffect, useState } from "react";

import {
  createNftCampaign,
  deleteNftCampaign,
  updateNftCampaign,
  type NftAccountOption,
  type NftCampaignWithContext,
  type NftWalletOption,
} from "../actions";
import { NFT_STATUSES, NFT_WALLET_STATUSES } from "../nft-schema";
import { areWalletAndCampaignChainsCompatible } from "../wallet-compatibility";

import { AppDatePicker } from "@/components/ui/app-date-picker";
import { AppSelect } from "@/components/ui/app-select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { normalizeHttpUrl } from "@/lib/url";

const statusLabels: Record<(typeof NFT_STATUSES)[number], string> = {
  watching: "Watching",
  whitelisted: "Whitelist",
  upcoming: "Upcoming",
  minted: "Minted",
  missed: "Missed",
};

type NftWalletStatus = (typeof NFT_WALLET_STATUSES)[number];

const walletStatusLabels: Record<NftWalletStatus, string> = {
  planned: "Planned",
  submitted: "Submitted",
  whitelisted: "Whitelisted",
  not_whitelisted: "Not whitelisted",
  minted: "Minted",
  skipped: "Skipped",
};

export function NftDialog({
  open,
  campaign,
  accounts,
  wallets,
  onClose,
  onSaved,
  onDeleted,
}: {
  open: boolean;
  campaign?: NftCampaignWithContext | null;
  accounts: NftAccountOption[];
  wallets: NftWalletOption[];
  onClose: () => void;
  onSaved: (campaign: NftCampaignWithContext) => void;
  onDeleted: (id: string) => void;
}) {
  const [name, setName] = useState("");
  const [chain, setChain] = useState("");
  const [status, setStatus] = useState<(typeof NFT_STATUSES)[number]>("watching");
  const [accountIds, setAccountIds] = useState<string[]>([]);
  const [walletAssignments, setWalletAssignments] = useState<Array<{ walletId: string; status: NftWalletStatus }>>([]);
  const [mintDate, setMintDate] = useState("");
  const [mintTime, setMintTime] = useState("");
  const [mintUrl, setMintUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [deleteArmed, setDeleteArmed] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setName(campaign?.name ?? "");
    setChain(campaign?.chain ?? "");
    setStatus(campaign?.status ?? "watching");
    setAccountIds(campaign?.assignedAccounts.map((account) => account.id) ?? []);
    setWalletAssignments(campaign?.assignedWallets.map((wallet) => ({ walletId: wallet.id, status: wallet.status })) ?? []);
    setMintDate(campaign?.mintDate ?? "");
    setMintTime(campaign?.mintTime?.slice(0, 5) ?? "");
    setMintUrl(campaign?.mintUrl ?? "");
    setNotes(campaign?.notes ?? "");
    setDeleteArmed(false);
    setError("");
  }, [campaign, open]);

  useEffect(() => {
    if (!open) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (document.querySelector('[data-app-floating-menu="true"]')) return;
      onClose();
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose, open]);

  if (!open) return null;

  const hasInvalidWallet = walletAssignments.some((assignment) => {
    const wallet = wallets.find((option) => option.id === assignment.walletId);
    return !wallet
      || Boolean(wallet.ownerAccountId && !accountIds.includes(wallet.ownerAccountId))
      || !areWalletAndCampaignChainsCompatible(wallet.chainType, chain);
  });
  const canSave = Boolean(name.trim() && chain.trim() && !busy && !hasInvalidWallet);
  const selectedAccounts = accounts.filter((account) => accountIds.includes(account.id));
  const selectedWalletIds = new Set(walletAssignments.map((assignment) => assignment.walletId));
  const sharedWallets = wallets.filter((wallet) => wallet.ownerAccountId === null && (areWalletAndCampaignChainsCompatible(wallet.chainType, chain) || selectedWalletIds.has(wallet.id)));

  function toggleAccount(id: string) {
    if (accountIds.includes(id)) {
      setAccountIds((current) => current.filter((accountId) => accountId !== id));
      setWalletAssignments((current) => current.filter((assignment) => wallets.find((wallet) => wallet.id === assignment.walletId)?.ownerAccountId !== id));
      return;
    }

    setAccountIds((current) => [...current, id]);
    const compatible = wallets.filter((wallet) => wallet.ownerAccountId === id && areWalletAndCampaignChainsCompatible(wallet.chainType, chain));
    if (compatible.length === 1 && !walletAssignments.some((assignment) => assignment.walletId === compatible[0].id)) {
      setWalletAssignments((current) => [...current, { walletId: compatible[0].id, status: "planned" }]);
    }
  }

  function toggleWallet(wallet: NftWalletOption) {
    const selected = walletAssignments.some((assignment) => assignment.walletId === wallet.id);
    if (selected) {
      setWalletAssignments((current) => current.filter((assignment) => assignment.walletId !== wallet.id));
      return;
    }
    if (!areWalletAndCampaignChainsCompatible(wallet.chainType, chain)) return;
    setWalletAssignments((current) => [...current, { walletId: wallet.id, status: "planned" }]);
  }

  function updateWalletStatus(walletId: string, status: NftWalletStatus) {
    setWalletAssignments((current) => current.map((assignment) => assignment.walletId === walletId ? { ...assignment, status } : assignment));
  }

  async function save() {
    if (!canSave) return;
    setBusy(true);
    setError("");
    try {
      const values = {
        name: name.trim(),
        chain: chain.trim(),
        status,
        accountIds,
        walletAssignments,
        mintDate: mintDate || null,
        mintTime: mintDate ? mintTime.trim() || null : null,
        mintUrl: normalizeHttpUrl(mintUrl),
        notes: notes.trim() || null,
      };
      const saved = campaign
        ? await updateNftCampaign(campaign.id, values)
        : await createNftCampaign(values);
      onSaved(saved);
      onClose();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to save NFT campaign");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!campaign) return;
    if (!deleteArmed) {
      setDeleteArmed(true);
      return;
    }
    setBusy(true);
    setError("");
    try {
      await deleteNftCampaign(campaign.id);
      onDeleted(campaign.id);
      onClose();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to delete NFT campaign");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="modal-backdrop-in fixed inset-0 z-[100] grid place-items-center bg-black/45 px-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="nft-dialog-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="modal-card-in soft-panel max-h-[calc(100vh-32px)] w-full max-w-[660px] overflow-y-auto rounded-2xl border border-white/[0.065] bg-card shadow-2xl shadow-black/45 scrollbar-subtle">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 bg-card/95 px-5 py-4 backdrop-blur">
          <div>
            <h2 id="nft-dialog-title" className="text-base font-semibold tracking-[-0.02em]">
              {campaign ? "Edit NFT" : "Add NFT"}
            </h2>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Track a collection, assigned Accounts, and its mint schedule.
            </p>
          </div>
          <button type="button" onClick={onClose} className="grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-white/[0.045] hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring" aria-label="Close NFT dialog">
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-4 px-5 pb-5">
          <label className="block">
            <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Collection name</span>
            <input autoFocus value={name} onChange={(event) => setName(event.target.value)} maxLength={120} className="mt-1.5 h-10 w-full rounded-lg border border-white/[0.055] bg-input px-3 text-sm font-semibold outline-none soft-inset placeholder:text-muted-foreground focus:border-ring" placeholder="Collection or campaign name" />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Chain</span>
              <input value={chain} onChange={(event) => setChain(event.target.value)} maxLength={80} className="mt-1.5 h-8 w-full rounded-full bg-white/[0.035] px-3 text-xs font-medium outline-none ring-1 ring-white/[0.055] placeholder:text-muted-foreground focus:ring-white/[0.16]" placeholder="Ethereum, Solana, Base..." />
            </label>
            <AppSelect label="Status" value={status} options={NFT_STATUSES.map((value) => ({ value, label: statusLabels[value] }))} onChange={(value) => setStatus(value as (typeof NFT_STATUSES)[number])} />
          </div>

          <div>
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Assigned accounts</span>
              <span className="text-[10px] text-muted-foreground">Optional</span>
            </div>
            {accounts.length > 0 ? (
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {accounts.map((account) => {
                  const selected = accountIds.includes(account.id);
                  return (
                    <button key={account.id} type="button" aria-pressed={selected} onClick={() => toggleAccount(account.id)} className={cn("inline-flex h-8 items-center gap-2 rounded-full px-2.5 text-xs font-medium ring-1 transition-[background-color,color,box-shadow,transform] duration-150 active:scale-[0.97]", selected ? "bg-white/[0.09] text-foreground ring-white/[0.13]" : "bg-white/[0.03] text-muted-foreground ring-white/[0.05] hover:bg-white/[0.055] hover:text-foreground")}>
                      <AccountMark account={account} />
                      {account.label}
                    </button>
                  );
                })}
              </div>
            ) : <p className="mt-1.5 text-xs text-muted-foreground">Create an Account first to assign identities.</p>}
          </div>

          <div className="rounded-xl bg-white/[0.025] p-3 ring-1 ring-white/[0.045]">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Wallet participation</span>
              <span className="text-[10px] text-muted-foreground">{walletAssignments.length} selected</span>
            </div>
            {!chain.trim() ? (
              <p className="mt-2 text-xs text-muted-foreground">Enter a chain to see compatible wallets.</p>
            ) : selectedAccounts.length === 0 && sharedWallets.length === 0 ? (
              <p className="mt-2 text-xs text-muted-foreground">Select an Account first. Accounts may be saved without a wallet and will be marked as needing one.</p>
            ) : (
              <div className="mt-2 space-y-3">
                {selectedAccounts.map((account) => {
                  const accountWallets = wallets.filter((wallet) => wallet.ownerAccountId === account.id && (areWalletAndCampaignChainsCompatible(wallet.chainType, chain) || selectedWalletIds.has(wallet.id)));
                  return (
                    <WalletGroup
                      key={account.id}
                      label={account.label}
                      wallets={accountWallets}
                      assignments={walletAssignments}
                      campaignChain={chain}
                      onToggle={toggleWallet}
                      onStatusChange={updateWalletStatus}
                    />
                  );
                })}
                {sharedWallets.length > 0 ? (
                  <WalletGroup
                    label="Shared wallets"
                    wallets={sharedWallets}
                    assignments={walletAssignments}
                    campaignChain={chain}
                    onToggle={toggleWallet}
                    onStatusChange={updateWalletStatus}
                  />
                ) : null}
              </div>
            )}
            {hasInvalidWallet ? <p role="alert" className="mt-2 text-[10px] text-destructive">Remove wallets that do not match the selected Account or chain before saving.</p> : null}
          </div>

          <div className="rounded-xl bg-white/[0.025] p-3 ring-1 ring-white/[0.045]">
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_140px]">
              <AppDatePicker label="Mint date, optional" value={mintDate} onChange={setMintDate} timeZone="Asia/Jakarta" />
              <label>
                <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Time, optional</span>
                <input value={mintTime} onChange={(event) => setMintTime(event.target.value)} disabled={!mintDate} inputMode="numeric" maxLength={5} className="mt-1.5 h-8 w-full rounded-full bg-white/[0.035] px-3 text-xs font-medium outline-none ring-1 ring-white/[0.055] placeholder:text-muted-foreground focus:ring-white/[0.16] disabled:opacity-40" placeholder="20:00" aria-label="Mint time in 24-hour format" />
              </label>
            </div>
            <p className="mt-2 text-[10px] text-muted-foreground">A mint date automatically creates or updates the linked Deadline.</p>
          </div>

          <label className="block">
            <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Mint URL, optional</span>
            <span className="relative mt-1.5 block">
              <ExternalLink className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <input type="text" inputMode="url" autoCapitalize="none" autoCorrect="off" value={mintUrl} onChange={(event) => setMintUrl(event.target.value)} onBlur={() => setMintUrl((value) => normalizeHttpUrl(value))} className="h-9 w-full rounded-lg border border-white/[0.055] bg-input pl-9 pr-3 text-xs outline-none soft-inset placeholder:text-muted-foreground focus:border-ring" placeholder="mint.example.com" />
            </span>
          </label>

          <label className="block">
            <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Notes, optional</span>
            <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} maxLength={5000} className="mt-1.5 w-full resize-none rounded-xl border border-white/[0.055] bg-input px-3 py-2.5 text-xs leading-relaxed outline-none soft-inset placeholder:text-muted-foreground focus:border-ring" placeholder="Whitelist requirements, mint allocation, or preparation notes." />
          </label>

          {error ? <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p> : null}
        </div>

        <div className="sticky bottom-0 flex items-center justify-between gap-3 border-t bg-card/95 px-5 py-3 backdrop-blur soft-divider">
          <div>{campaign ? <Button type="button" variant="ghost" size="sm" onClick={remove} disabled={busy} className={deleteArmed ? "text-destructive" : "text-muted-foreground"}><Trash2 className="size-3.5" />{deleteArmed ? "Confirm delete" : "Delete"}</Button> : null}</div>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={onClose} disabled={busy}>Cancel</Button>
            <Button type="button" size="sm" onClick={save} disabled={!canSave}>{busy ? "Saving..." : campaign ? "Save changes" : "Create NFT"}</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AccountMark({ account }: { account: NftAccountOption }) {
  if (account.avatarUrl) {
    return <span aria-hidden="true" className="size-5 rounded-full bg-white/[0.05] bg-cover bg-center" style={{ backgroundImage: `url(${JSON.stringify(account.avatarUrl)})` }} />;
  }
  return <span aria-hidden="true" className="grid size-5 place-items-center rounded-full bg-white/[0.055] text-[9px] font-semibold">{account.label.slice(0, 1).toUpperCase()}</span>;
}

function WalletGroup({
  label,
  wallets,
  assignments,
  campaignChain,
  onToggle,
  onStatusChange,
}: {
  label: string;
  wallets: NftWalletOption[];
  assignments: Array<{ walletId: string; status: NftWalletStatus }>;
  campaignChain: string;
  onToggle: (wallet: NftWalletOption) => void;
  onStatusChange: (walletId: string, status: NftWalletStatus) => void;
}) {
  return (
    <div>
      <p className="text-[10px] font-medium text-foreground/80">{label}</p>
      {wallets.length === 0 ? (
        <p className="mt-1 text-[10px] text-muted-foreground">No {campaignChain}-compatible wallet. Add one from Accounts.</p>
      ) : (
        <div className="mt-1 space-y-1">
          {wallets.map((wallet) => {
            const assignment = assignments.find((item) => item.walletId === wallet.id);
            const selected = Boolean(assignment);
            const compatible = areWalletAndCampaignChainsCompatible(wallet.chainType, campaignChain);
            return (
              <div key={wallet.id} className={cn("flex min-w-0 items-center gap-2 rounded-lg px-2 py-1.5 ring-1", selected ? "bg-white/[0.055] ring-white/[0.09]" : "bg-white/[0.018] ring-white/[0.035]")}>
                <button
                  type="button"
                  aria-pressed={selected}
                  aria-label={(selected ? "Remove wallet " : "Assign wallet ") + wallet.label}
                  disabled={!compatible && !selected}
                  onClick={() => onToggle(wallet)}
                  className="flex min-w-0 flex-1 items-center gap-2 rounded-md text-left outline-none transition-transform duration-150 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <span aria-hidden="true" className={cn("grid size-7 shrink-0 place-items-center rounded-lg", selected ? "bg-white/[0.08] text-foreground" : "bg-white/[0.035] text-muted-foreground")}><WalletCards className="size-3.5" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[11px] font-medium">{wallet.label}</span>
                    <span className="block truncate font-mono text-[9px] text-muted-foreground">{shortWalletAddress(wallet.address)} · {wallet.chainType || "Chain not set"}</span>
                  </span>
                  <span aria-hidden="true" className={cn("size-2 rounded-full ring-1", selected ? "bg-emerald-400 ring-emerald-300/40" : "bg-transparent ring-white/[0.16]")} />
                </button>
                {assignment ? (
                  <AppSelect
                    ariaLabel={"Whitelist status for " + wallet.label}
                    value={assignment.status}
                    options={NFT_WALLET_STATUSES.map((status) => ({ value: status, label: walletStatusLabels[status] }))}
                    onChange={(value) => onStatusChange(wallet.id, value as NftWalletStatus)}
                    className="w-[142px] shrink-0"
                  />
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function shortWalletAddress(address: string) {
  if (address.length <= 14) return address;
  return address.slice(0, 6) + "..." + address.slice(-5);
}
