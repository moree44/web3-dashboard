"use client";

import { CalendarClock, ExternalLink, Image as ImageIcon, Plus, Search, Sparkles } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import type { NftAccountOption, NftCampaignWithContext, NftWalletOption } from "../actions";
import { NFT_STATUSES } from "../nft-schema";
import { useNftsCache, useNftsWorkspace } from "../nfts-query";
import { NftDialog } from "./nft-dialog";

import { AppSelect } from "@/components/ui/app-select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AccountAvatarGroup } from "@/features/projects/components/projects-preview";
import { formatDeadlineDueLabel, formatDeadlineTime, getDeadlineDayDifference } from "@/features/deadlines/deadline-utils";
import { cn } from "@/lib/utils";

type NftView = "all" | (typeof NFT_STATUSES)[number];

const statusLabels: Record<(typeof NFT_STATUSES)[number], string> = {
  watching: "Watching",
  whitelisted: "Whitelist",
  upcoming: "Upcoming",
  minted: "Minted",
  missed: "Missed",
};

export function NftsPreview({ initialCampaigns, accounts, wallets, canPersist = true }: { initialCampaigns: NftCampaignWithContext[]; accounts: NftAccountOption[]; wallets: NftWalletOption[]; canPersist?: boolean }) {
  const developmentPreview = !canPersist;
  const initialData = useMemo(
    () => ({ campaigns: initialCampaigns, accounts, wallets }),
    [accounts, initialCampaigns, wallets],
  );
  const { data: queryData } = useNftsWorkspace(initialData, developmentPreview);
  const workspace = queryData ?? initialData;
  const campaigns = workspace.campaigns;
  const accountOptions = workspace.accounts;
  const walletOptions = workspace.wallets;
  const cache = useNftsCache();

  const [view, setView] = useState<NftView>("all");
  const [query, setQuery] = useState("");
  const [chain, setChain] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<NftCampaignWithContext | null>(null);

  const counts = useMemo(() => Object.fromEntries(NFT_STATUSES.map((status) => [status, campaigns.filter((campaign) => campaign.status === status).length])) as Record<(typeof NFT_STATUSES)[number], number>, [campaigns]);
  const chains = useMemo(() => [...new Set(campaigns.map((campaign) => campaign.chain))].sort(), [campaigns]);
  const visibleCampaigns = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return campaigns.filter((campaign) => {
      if (view !== "all" && campaign.status !== view) return false;
      if (chain && campaign.chain !== chain) return false;
      if (!normalizedQuery) return true;
      return [campaign.name, campaign.chain, campaign.notes ?? "", ...campaign.assignedAccounts.map((account) => account.label), ...campaign.assignedWallets.flatMap((wallet) => [wallet.label, wallet.address])].join(" ").toLowerCase().includes(normalizedQuery);
    });
  }, [campaigns, chain, query, view]);

  function openCreate() {
    setSelected(null);
    setDialogOpen(true);
  }

  function openEdit(campaign: NftCampaignWithContext) {
    setSelected(campaign);
    setDialogOpen(true);
  }

  function handleSaved(saved: NftCampaignWithContext) {
    cache.applySaved(saved);
    setView(saved.status);
  }

  function handleDeleted(id: string) {
    cache.applyDeleted(id);
  }

  return (
    <div className="min-w-0 py-5 lg:py-7">
      <header className="flex flex-col gap-4 border-b px-4 pb-5 soft-divider sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-8">
        <div>
          <p className="text-xs text-muted-foreground">Projects workspace</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-[-0.02em]">NFTs</h1>
          <p className="mt-1 max-w-2xl text-xs text-muted-foreground">Track whitelist progress, assigned identities, and mint windows without Project overhead.</p>
        </div>
        <Button size="sm" onClick={openCreate} disabled={!canPersist} title={canPersist ? "Add NFT" : "Database migration required"}><Plus className="size-4" />Add NFT</Button>
      </header>

      <div className="border-b px-4 soft-divider sm:px-6 lg:px-8">
        <div className="flex items-center gap-1 overflow-x-auto py-2.5 scrollbar-subtle">
          {(["all", ...NFT_STATUSES] as const).map((status) => (
            <button key={status} type="button" onClick={() => setView(status)} className={cn("shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors", view === status ? "bg-accent text-foreground shadow-[inset_0_1px_0_rgb(255_255_255/0.06)]" : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground")}>
              {status === "all" ? "All" : statusLabels[status]} <span className="ml-1 text-[10px] opacity-60">{status === "all" ? campaigns.length : counts[status]}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3 border-b px-4 py-3 soft-divider sm:px-6 lg:flex-row lg:items-center lg:px-8">
        <label className="flex h-9 min-w-0 items-center gap-2 rounded-lg border border-white/[0.06] bg-card px-3 lg:w-72"><Search className="size-4 text-muted-foreground" /><input aria-label="Search NFTs" value={query} onChange={(event) => setQuery(event.target.value)} className="min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground" placeholder="Search collections..." /></label>
        <AppSelect ariaLabel="Filter by chain" value={chain} options={[{ value: "", label: "All chains" }, ...chains.map((value) => ({ value, label: value }))]} onChange={setChain} className="w-[160px]" />
      </div>

      {visibleCampaigns.length > 0 ? (
        <>
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[880px] table-fixed border-collapse text-left">
              <colgroup><col className="w-[30%]" /><col className="w-[14%]" /><col className="w-[16%]" /><col className="w-[18%]" /><col className="w-[18%]" /><col className="w-[4%]" /></colgroup>
              <thead className="text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground"><tr>{["Collection", "Chain", "Status", "Participation", "Mint schedule", ""].map((label) => <th key={label || "action"} className="border-b border-white/[0.045] px-3 py-3 first:pl-8">{label}<span className="sr-only">{label ? "" : "Actions"}</span></th>)}</tr></thead>
              <tbody>{visibleCampaigns.map((campaign) => <NftRow key={campaign.id} campaign={campaign} onOpen={() => openEdit(campaign)} />)}</tbody>
            </table>
          </div>
          <div className="divide-y divide-white/[0.045] lg:hidden">{visibleCampaigns.map((campaign) => <NftCard key={campaign.id} campaign={campaign} onOpen={() => openEdit(campaign)} />)}</div>
        </>
      ) : (
        <div className="px-4 py-20 text-center sm:px-6 lg:px-8"><Sparkles className="mx-auto size-5 text-muted-foreground/60" /><p className="mt-2 text-sm font-medium">No NFT campaigns found</p><p className="mt-1 text-xs text-muted-foreground">{campaigns.length === 0 ? "Add your first collection or whitelist campaign." : "Try another status, chain, or search."}</p></div>
      )}

      <div className="flex min-h-12 items-center px-4 py-3 text-[11px] text-muted-foreground sm:px-6 lg:px-8">Showing {visibleCampaigns.length} {visibleCampaigns.length === 1 ? "NFT" : "NFTs"}</div>

      <NftDialog open={dialogOpen} campaign={selected} accounts={accountOptions} wallets={walletOptions} onClose={() => setDialogOpen(false)} onSaved={handleSaved} onDeleted={handleDeleted} />
    </div>
  );
}

function NftRow({ campaign, onOpen }: { campaign: NftCampaignWithContext; onOpen: () => void }) {
  return (
    <tr className="group border-b border-white/[0.045] hover:bg-white/[0.02]">
      <td className="py-2.5 pl-8 pr-3"><button type="button" onClick={onOpen} className="flex min-w-0 items-center gap-3 text-left focus-visible:ring-2 focus-visible:ring-ring"><CollectionMark /><span className="min-w-0"><span className="block truncate text-[13px] font-semibold">{campaign.name}</span><span className="mt-0.5 block truncate text-[10px] text-muted-foreground">{campaign.notes || "NFT hunting campaign"}</span></span></button></td>
      <td className="px-3"><Badge variant="secondary" className="text-[10px]">{campaign.chain}</Badge></td>
      <td className="px-3"><StatusBadge status={campaign.status} /></td>
      <td className="px-3"><div className="flex items-center gap-2"><AccountAvatarGroup accounts={campaign.assignedAccounts.map((account) => account.label)} accountDetails={campaign.assignedAccounts} /><WalletOutcomeSummary campaign={campaign} /></div></td>
      <td className="px-3"><MintSchedule campaign={campaign} /></td>
      <td className="px-3">{campaign.mintUrl ? <Link href={campaign.mintUrl} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()} aria-label={"Open mint URL for " + campaign.name} className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-white/[0.05] hover:text-foreground"><ExternalLink className="size-3.5" /></Link> : null}</td>
    </tr>
  );
}

function NftCard({ campaign, onOpen }: { campaign: NftCampaignWithContext; onOpen: () => void }) {
  return (
    <div className="px-4 py-4 hover:bg-white/[0.02] sm:px-6">
      <div className="flex items-start gap-3">
        <CollectionMark />
        <div className="min-w-0 flex-1">
          <button type="button" onClick={onOpen} className="flex w-full items-start justify-between gap-3 text-left focus-visible:ring-2 focus-visible:ring-ring">
            <span className="truncate text-sm font-semibold">{campaign.name}</span>
            <StatusBadge status={campaign.status} />
          </button>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="text-[10px]">{campaign.chain}</Badge>
            <AccountAvatarGroup accounts={campaign.assignedAccounts.map((account) => account.label)} accountDetails={campaign.assignedAccounts} />
            <WalletOutcomeSummary campaign={campaign} />
            <MintSchedule campaign={campaign} />
          </div>
        </div>
      </div>
    </div>
  );
}

function CollectionMark() {
  return (
    <span
      aria-hidden="true"
      className="grid size-9 shrink-0 place-items-center rounded-xl bg-white/[0.045] text-muted-foreground ring-1 ring-white/[0.05]"
    >
      <ImageIcon className="size-4" strokeWidth={1.7} />
    </span>
  );
}

function StatusBadge({ status }: { status: NftCampaignWithContext["status"] }) {
  const variant = status === "minted" ? "success" : status === "missed" ? "destructive" : status === "upcoming" ? "info" : status === "whitelisted" ? "warning" : "secondary";
  return <Badge variant={variant} className="text-[10px]">{statusLabels[status]}</Badge>;
}

function WalletOutcomeSummary({ campaign }: { campaign: NftCampaignWithContext }) {
  const total = campaign.assignedWallets.length;
  const ready = campaign.assignedWallets.filter((wallet) => wallet.status === "whitelisted" || wallet.status === "minted").length;
  const needsWallet = campaign.assignedAccounts.filter((account) => !campaign.assignedWallets.some((wallet) => wallet.ownerAccountId === account.id)).length;
  if (total === 0) {
    return <span className="text-[10px] text-muted-foreground">{campaign.assignedAccounts.length > 0 ? campaign.assignedAccounts.length + " need wallet" : "No wallets"}</span>;
  }
  return <span className="whitespace-nowrap text-[10px] text-muted-foreground">{ready}/{total} WL{needsWallet > 0 ? " · " + needsWallet + " need wallet" : ""}</span>;
}

function MintSchedule({ campaign }: { campaign: NftCampaignWithContext }) {
  if (!campaign.mintDate) return <span className="text-[11px] text-muted-foreground">No date</span>;
  const label = formatDeadlineDueLabel(campaign.mintDate);
  const time = formatDeadlineTime(campaign.mintTime);
  const overdue = getDeadlineDayDifference(campaign.mintDate) < 0 && campaign.status !== "minted" && campaign.status !== "missed";
  return <span className="inline-flex items-center gap-1.5 text-[11px]"><CalendarClock className="size-3.5 text-muted-foreground" /><span className={overdue ? "text-destructive" : label === "Today" ? "text-warning" : "text-muted-foreground"}>{label}{time ? " · " + time + " WIB" : ""}</span></span>;
}
