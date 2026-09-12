"use client";

import { ArrowRight, ExternalLink, FolderKanban, ImageIcon, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useCallback, useMemo, useState, type FormEvent } from "react";

import { CornerToast, type CornerToastNotice } from "@/components/shared/corner-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { WatchlistDialog } from "@/features/watchlist/components/watchlist-dialog";
import {
  useWatchlistMutations,
  useWatchlistWorkspace,
} from "@/features/watchlist/watchlist-query";
import type {
  WatchlistInput,
  WatchlistItemRecord,
  WatchlistItemKind,
  WatchlistPageData,
  WatchlistStatus,
} from "@/features/watchlist/watchlist-types";
import { cn } from "@/lib/utils";

type WatchlistKindFilter = "all" | WatchlistItemKind;

export function WatchlistPreview({
  initialData,
  canPersist = true,
}: {
  initialData: WatchlistPageData;
  canPersist?: boolean;
}) {
  const developmentPreview = !canPersist;
  const { data: queryData } = useWatchlistWorkspace(initialData, developmentPreview);
  const data = queryData ?? initialData;
  const [view, setView] = useState<WatchlistStatus>("active");
  const [kindFilter, setKindFilter] = useState<WatchlistKindFilter>("all");
  const [query, setQuery] = useState("");
  const [quickKind, setQuickKind] = useState<WatchlistItemKind>("project");
  const [quickUrl, setQuickUrl] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<WatchlistItemRecord | null>(null);
  const [dialogXUrl, setDialogXUrl] = useState("");
  const [dialogItemKind, setDialogItemKind] = useState<WatchlistItemKind>("project");
  const [notice, setNotice] = useState<CornerToastNotice | null>(null);
  const mutations = useWatchlistMutations({
    developmentPreview,
    onError: (message) => showNotice("error", "Action failed", message),
  });

  const items = view === "active" ? data.activeItems : data.convertedItems;
  const visibleItems = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return items.filter((item) => {
      if (kindFilter !== "all" && item.itemKind !== kindFilter) return false;
      if (!normalized) return true;
      return [
        item.name,
        item.xUrl,
        item.thesis ?? "",
        item.chain ?? "",
        ...item.projectTypes,
      ].join(" ").toLowerCase().includes(normalized);
    });
  }, [items, kindFilter, query]);

  const quickSaving = mutations.saveMutation.isPending && !dialogOpen;
  const convertingId = mutations.convertMutation.isPending
    ? mutations.convertMutation.variables?.id
    : null;

  function showNotice(tone: CornerToastNotice["tone"], title: string, message?: string) {
    setNotice({ id: Date.now(), tone, title, message });
  }

  const clearNotice = useCallback(() => {
    setNotice(null);
  }, []);

  async function quickAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!quickUrl.trim() || quickSaving) return;
    clearNotice();
    if (quickKind === "nft") {
      openCreate(quickUrl, "nft");
      return;
    }
    try {
      await mutations.saveMutation.mutateAsync({ input: { xUrl: quickUrl, itemKind: "project" } });
      setQuickUrl("");
      setView("active");
      setKindFilter("project");
    } catch {
      // Mutation callback owns the user-facing message.
    }
  }

  function openCreate(prefilledUrl = "", itemKind: WatchlistItemKind = "project") {
    setSelected(null);
    setDialogXUrl(prefilledUrl);
    setDialogItemKind(itemKind);
    setDialogOpen(true);
    clearNotice();
  }

  function openEdit(item: WatchlistItemRecord) {
    setSelected(item);
    setDialogXUrl("");
    setDialogItemKind(item.itemKind);
    setDialogOpen(true);
    clearNotice();
  }

  async function saveItem(input: WatchlistInput, id?: string) {
    clearNotice();
    await mutations.saveMutation.mutateAsync({ id, input });
    if (!id && dialogXUrl) setQuickUrl("");
    setView("active");
    setKindFilter(input.itemKind ?? "project");
  }

  async function deleteItem(id: string) {
    clearNotice();
    await mutations.deleteMutation.mutateAsync(id);
  }

  async function convertItem(item: WatchlistItemRecord) {
    clearNotice();
    try {
      await mutations.convertMutation.mutateAsync({ id: item.id, itemKind: item.itemKind });
    } catch {
      // Mutation callback owns the user-facing message.
    }
  }

  return (
    <div className="min-w-0 py-5 lg:py-7">
      <header className="flex flex-col gap-4 border-b px-4 pb-5 soft-divider sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-8">
        <div>
          <p className="text-xs text-muted-foreground">Projects workspace</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-[-0.02em]">Watchlist</h1>
          <p className="mt-1 max-w-2xl text-xs text-muted-foreground">
            Capture promising projects and NFT collections before active tracking.
          </p>
        </div>
        <Button size="sm" onClick={() => openCreate()} disabled={!canPersist} title={canPersist ? "Add Watchlist item" : "Database migration required"}>
          <Plus className="size-4" /> Add details
        </Button>
      </header>

      <section className="border-b px-4 py-4 soft-divider sm:px-6 lg:px-8" aria-labelledby="watchlist-quick-add">
        <div className="soft-panel max-w-[1180px] rounded-xl border border-white/[0.055] bg-card p-3 sm:p-4">
          <label id="watchlist-quick-add" htmlFor="watchlist-x-url" className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
            Quick add from X
          </label>
          <form onSubmit={quickAdd} className="mt-1.5 flex min-w-0 gap-2">
            <input
              id="watchlist-x-url"
              type="text"
              inputMode="url"
              autoCapitalize="none"
              autoCorrect="off"
              value={quickUrl}
              onChange={(event) => setQuickUrl(event.target.value)}
              className="h-10 min-w-0 flex-1 rounded-lg border border-white/[0.055] bg-input px-3 text-sm outline-none soft-inset placeholder:text-muted-foreground focus:border-ring"
              placeholder="x.com/project"
              disabled={!canPersist}
            />
            <Button type="submit" disabled={!canPersist || !quickUrl.trim() || quickSaving}>
              {quickSaving ? "Adding..." : quickKind === "nft" ? "Continue" : "Add"}
            </Button>
          </form>
          <div className="mt-2 flex items-center gap-2" role="group" aria-label="Quick add item type">
            <span className="text-[10px] text-muted-foreground">Add as</span>
            <div className="inline-flex rounded-md border border-white/[0.055] bg-input p-0.5">
              {(["project", "nft"] as const).map((kind) => (
                <button
                  key={kind}
                  type="button"
                  aria-pressed={quickKind === kind}
                  onClick={() => setQuickKind(kind)}
                  className={cn(
                    "h-6 rounded px-2.5 text-[10px] font-medium transition-[background-color,color,transform] duration-150 ease-out active:scale-[0.97]",
                    quickKind === kind ? "bg-white/[0.08] text-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {kind === "project" ? "Project" : "NFT"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="border-b px-4 soft-divider sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3 overflow-x-auto py-2.5 scrollbar-subtle">
          <div className="flex shrink-0 items-center gap-1" role="group" aria-label="Watchlist status">
            {(["active", "converted"] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setView(status)}
                className={cn("shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors", view === status ? "bg-accent text-foreground shadow-[inset_0_1px_0_rgb(255_255_255/0.06)]" : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground")}
              >
                {status === "active" ? "Active" : "Converted"}
                <span className="ml-1 text-[10px] opacity-60">
                  {status === "active" ? data.activeItems.length : data.convertedItems.length}
                </span>
              </button>
            ))}
          </div>
          <div className="flex shrink-0 items-center rounded-lg border border-white/[0.055] bg-card p-0.5" role="group" aria-label="Watchlist item type filter">
            {(["all", "project", "nft"] as const).map((kind) => (
              <button
                key={kind}
                type="button"
                aria-pressed={kindFilter === kind}
                onClick={() => setKindFilter(kind)}
                className={cn(
                  "h-7 rounded-md px-2.5 text-[10px] font-medium transition-[background-color,color,transform] duration-150 ease-out active:scale-[0.97]",
                  kindFilter === kind ? "bg-white/[0.07] text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {kind === "all" ? "All" : kind === "project" ? "Projects" : "NFTs"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex border-b px-4 py-3 soft-divider sm:px-6 lg:px-8">
        <label className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-lg border border-white/[0.06] bg-card px-3 sm:max-w-sm">
          <Search className="size-4 text-muted-foreground" />
          <input
            aria-label="Search Watchlist"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
            placeholder="Search name, thesis, chain, or type..."
          />
        </label>
      </div>

      <CornerToast notice={notice} onClose={clearNotice} />

      {visibleItems.length > 0 ? (
        <>
          <div className="hidden overflow-x-auto xl:block">
            <table className="w-full max-w-[1320px] min-w-[920px] table-fixed border-collapse text-left">
              <colgroup>
                <col className="w-[25%]" />
                <col className="w-[31%]" />
                <col className="w-[13%]" />
                <col className="w-[17%]" />
                <col className="w-[14%]" />
              </colgroup>
              <thead className="text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                <tr>
                  {["Item", "Thesis", "Chain", "Type", ""].map((label) => (
                    <th key={label || "actions"} className="border-b border-white/[0.045] px-3 py-2.5 first:pl-6">
                      {label}<span className="sr-only">{label ? "" : "Actions"}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleItems.map((item) => (
                  <WatchlistRow
                    key={item.id}
                    item={item}
                    onEdit={() => openEdit(item)}
                    onConvert={() => convertItem(item)}
                    converting={convertingId === item.id}
                  />
                ))}
              </tbody>
            </table>
          </div>
          <div className="divide-y divide-white/[0.045] xl:hidden">
            {visibleItems.map((item) => (
              <WatchlistCard
                key={item.id}
                item={item}
                onEdit={() => openEdit(item)}
                onConvert={() => convertItem(item)}
                converting={convertingId === item.id}
              />
            ))}
          </div>
        </>
      ) : (
        <div className="px-4 py-20 text-center sm:px-6 lg:px-8">
          <FolderKanban className="mx-auto size-5 text-muted-foreground/60" />
          <p className="mt-2 text-sm font-medium">
            {view === "active" ? "No items on your Watchlist" : "No converted items yet"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {items.length === 0
              ? view === "active" ? "Paste an X profile above to capture the first one." : "Converted items remain here as history."
              : kindFilter !== "all" && !query.trim()
                ? `No ${kindFilter === "nft" ? "NFT" : "Project"} items in this view.`
                : "Try another search or type filter."}
          </p>
        </div>
      )}

      <div className="flex min-h-12 items-center px-4 py-3 text-[11px] text-muted-foreground sm:px-6 lg:px-8">
        Showing {visibleItems.length} {visibleItems.length === 1 ? "item" : "items"}
      </div>

      <WatchlistDialog
        open={dialogOpen}
        item={selected}
        initialXUrl={dialogXUrl}
        initialItemKind={dialogItemKind}
        onClose={() => setDialogOpen(false)}
        onSave={saveItem}
        onDelete={deleteItem}
      />
    </div>
  );
}

function ItemMark({ itemKind }: { itemKind: WatchlistItemKind }) {
  const Icon = itemKind === "nft" ? ImageIcon : FolderKanban;
  return (
    <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-lg bg-white/[0.04] text-muted-foreground ring-1 ring-white/[0.045]">
      <Icon className="size-3.5" strokeWidth={1.7} />
    </span>
  );
}

function WatchlistRow({
  item,
  onEdit,
  onConvert,
  converting,
}: {
  item: WatchlistItemRecord;
  onEdit: () => void;
  onConvert: () => void;
  converting: boolean;
}) {
  return (
    <tr className="group border-b border-white/[0.045] hover:bg-white/[0.02]">
      <td className="py-2 pl-6 pr-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <ItemMark itemKind={item.itemKind} />
          <div className="min-w-0">
            {item.status === "active" ? (
              <button type="button" onClick={onEdit} className="block max-w-full truncate text-left text-[13px] font-semibold focus-visible:ring-2 focus-visible:ring-ring">
                {item.name}
              </button>
            ) : (
              <span className="block truncate text-[13px] font-semibold">{item.name}</span>
            )}
            <Link href={item.xUrl} target="_blank" rel="noreferrer" className="mt-0.5 inline-flex max-w-full items-center gap-1 truncate text-[10px] text-muted-foreground hover:text-foreground">
              <span className="truncate">@{xHandle(item.xUrl)}</span><ExternalLink className="size-2.5 shrink-0" />
            </Link>
          </div>
        </div>
      </td>
      <td className="px-3">{item.thesis ? <p className="line-clamp-2 text-[11px] leading-4 text-muted-foreground">{item.thesis}</p> : null}</td>
      <td className="px-3">{item.chain ? <Badge variant="outline" className="text-[10px]">{item.chain}</Badge> : <span className="text-[10px] text-muted-foreground">Not set</span>}</td>
      <td className="px-3">{item.itemKind === "nft" ? <Badge variant="secondary" className="text-[10px]">NFT</Badge> : <ProjectTypeBadges values={item.projectTypes} />}</td>
      <td className="px-3 text-left">
        {item.status === "active" ? (
          <Button type="button" size="sm" variant="outline" className="h-7 bg-white/[0.025] px-2.5 text-[11px] text-foreground/90 hover:bg-white/[0.06]" onClick={onConvert} disabled={converting}>
            {converting ? "Working..." : item.itemKind === "nft" ? "Track NFT" : "Start project"} <ArrowRight className="size-3" />
          </Button>
        ) : (
          <Link href={item.itemKind === "nft" ? "/nfts" : "/projects"} className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground">
            {item.itemKind === "nft" ? "Open NFTs" : "Open projects"} <ArrowRight className="size-3" />
          </Link>
        )}
      </td>
    </tr>
  );
}

function WatchlistCard({
  item,
  onEdit,
  onConvert,
  converting,
}: {
  item: WatchlistItemRecord;
  onEdit: () => void;
  onConvert: () => void;
  converting: boolean;
}) {
  return (
    <article className="px-4 py-3 hover:bg-white/[0.02] sm:px-6">
      <div className="flex items-start gap-2.5">
        <ItemMark itemKind={item.itemKind} />
        <div className="min-w-0 flex-1">
          {item.status === "active" ? (
            <button type="button" onClick={onEdit} className="block max-w-full truncate text-left text-sm font-semibold focus-visible:ring-2 focus-visible:ring-ring">{item.name}</button>
          ) : (
            <p className="truncate text-sm font-semibold">{item.name}</p>
          )}
          <Link href={item.xUrl} target="_blank" rel="noreferrer" className="mt-0.5 inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground">
            @{xHandle(item.xUrl)} <ExternalLink className="size-2.5" />
          </Link>
          {item.thesis ? <p className="mt-1.5 line-clamp-3 text-[11px] leading-4 text-muted-foreground">{item.thesis}</p> : null}
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {item.chain ? <Badge variant="outline" className="text-[10px]">{item.chain}</Badge> : null}
            {item.itemKind === "nft" ? <Badge variant="secondary" className="text-[10px]">NFT</Badge> : <ProjectTypeBadges values={item.projectTypes} />}
          </div>
          <div className="mt-2.5">
            {item.status === "active" ? (
              <Button type="button" size="sm" variant="outline" className="h-8 bg-white/[0.025] px-3 text-[11px] text-foreground/90 hover:bg-white/[0.06]" onClick={onConvert} disabled={converting}>
                {converting ? "Working..." : item.itemKind === "nft" ? "Track NFT" : "Start project"} <ArrowRight className="size-3" />
              </Button>
            ) : (
              <Link href={item.itemKind === "nft" ? "/nfts" : "/projects"} className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground">
                {item.itemKind === "nft" ? "Open NFTs" : "Open projects"} <ArrowRight className="size-3" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

function ProjectTypeBadges({ values }: { values: string[] }) {
  if (values.length === 0) return <span className="text-[10px] text-muted-foreground">Not set</span>;
  return (
    <span className="flex flex-wrap gap-1">
      {values.map((value) => <Badge key={value} variant="secondary" className="text-[10px]">{value}</Badge>)}
    </span>
  );
}

function xHandle(value: string) {
  try {
    return new URL(value).pathname.split("/").filter(Boolean)[0] ?? value;
  } catch {
    return value;
  }
}
