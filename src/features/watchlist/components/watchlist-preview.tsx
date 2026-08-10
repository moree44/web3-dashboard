"use client";

import { ArrowRight, ExternalLink, FolderKanban, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";

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
  WatchlistPageData,
  WatchlistStatus,
} from "@/features/watchlist/watchlist-types";
import { cn } from "@/lib/utils";

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
  const [query, setQuery] = useState("");
  const [quickUrl, setQuickUrl] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<WatchlistItemRecord | null>(null);
  const [dialogXUrl, setDialogXUrl] = useState("");
  const [error, setError] = useState("");
  const mutations = useWatchlistMutations({
    developmentPreview,
    onError: setError,
  });

  const items = view === "active" ? data.activeItems : data.convertedItems;
  const visibleItems = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return items;
    return items.filter((item) => [
      item.name,
      item.xUrl,
      item.thesis ?? "",
      item.chain ?? "",
      ...item.projectTypes,
    ].join(" ").toLowerCase().includes(normalized));
  }, [items, query]);

  const quickSaving = mutations.saveMutation.isPending && !dialogOpen;
  const convertingId = mutations.convertMutation.isPending
    ? mutations.convertMutation.variables
    : null;

  async function quickAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!quickUrl.trim() || quickSaving) return;
    setError("");
    try {
      await mutations.saveMutation.mutateAsync({ input: { xUrl: quickUrl } });
      setQuickUrl("");
      setView("active");
    } catch {
      // Mutation callback owns the user-facing message.
    }
  }

  function openCreate(prefilledUrl = "") {
    setSelected(null);
    setDialogXUrl(prefilledUrl);
    setDialogOpen(true);
    setError("");
  }

  function openEdit(item: WatchlistItemRecord) {
    setSelected(item);
    setDialogXUrl("");
    setDialogOpen(true);
    setError("");
  }

  async function saveItem(input: WatchlistInput, id?: string) {
    setError("");
    await mutations.saveMutation.mutateAsync({ id, input });
    setView("active");
  }

  async function deleteItem(id: string) {
    setError("");
    await mutations.deleteMutation.mutateAsync(id);
  }

  async function startProject(id: string) {
    setError("");
    try {
      await mutations.convertMutation.mutateAsync(id);
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
            Capture promising X accounts and a short thesis before they become active Projects.
          </p>
        </div>
        <Button size="sm" onClick={() => openCreate()} disabled={!canPersist} title={canPersist ? "Add Watchlist item" : "Database migration required"}>
          <Plus className="size-4" /> Add details
        </Button>
      </header>

      <section className="border-b px-4 py-4 soft-divider sm:px-6 lg:px-8" aria-labelledby="watchlist-quick-add">
        <div className="soft-panel rounded-xl border border-white/[0.055] bg-card p-3 sm:p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1">
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
                  {quickSaving ? "Adding..." : "Add"}
                </Button>
              </form>
            </div>
            <Button type="button" size="sm" variant="ghost" onClick={() => openCreate(quickUrl)} disabled={!canPersist}>
              Add thesis and tags
            </Button>
          </div>
          <p className="mt-2 text-[10px] text-muted-foreground">
            The project name is derived from the X handle. You can edit it and add more context later.
          </p>
        </div>
      </section>

      <div className="border-b px-4 soft-divider sm:px-6 lg:px-8">
        <div className="flex items-center gap-1 overflow-x-auto py-2.5 scrollbar-subtle">
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

      {error ? (
        <div role="alert" className="border-b border-destructive/15 bg-destructive/[0.04] px-4 py-2 text-xs text-destructive sm:px-6 lg:px-8">
          {error}
        </div>
      ) : null}

      {visibleItems.length > 0 ? (
        <>
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[900px] table-fixed border-collapse text-left">
              <colgroup>
                <col className="w-[26%]" />
                <col className="w-[32%]" />
                <col className="w-[12%]" />
                <col className="w-[18%]" />
                <col className="w-[12%]" />
              </colgroup>
              <thead className="text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                <tr>
                  {["Project", "Thesis", "Chain", "Project Type", ""].map((label) => (
                    <th key={label || "actions"} className="border-b border-white/[0.045] px-3 py-3 first:pl-8">
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
                    onStart={() => startProject(item.id)}
                    converting={convertingId === item.id}
                  />
                ))}
              </tbody>
            </table>
          </div>
          <div className="divide-y divide-white/[0.045] lg:hidden">
            {visibleItems.map((item) => (
              <WatchlistCard
                key={item.id}
                item={item}
                onEdit={() => openEdit(item)}
                onStart={() => startProject(item.id)}
                converting={convertingId === item.id}
              />
            ))}
          </div>
        </>
      ) : (
        <div className="px-4 py-20 text-center sm:px-6 lg:px-8">
          <FolderKanban className="mx-auto size-5 text-muted-foreground/60" />
          <p className="mt-2 text-sm font-medium">
            {view === "active" ? "No projects on your Watchlist" : "No converted projects yet"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {items.length === 0
              ? view === "active" ? "Paste an X profile above to capture the first one." : "Started Projects will remain here as history."
              : "Try another search."}
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
        onClose={() => setDialogOpen(false)}
        onSave={saveItem}
        onDelete={deleteItem}
      />
    </div>
  );
}

function ProjectMark() {
  return (
    <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-xl bg-white/[0.045] text-muted-foreground ring-1 ring-white/[0.05]">
      <FolderKanban className="size-4" strokeWidth={1.7} />
    </span>
  );
}

function WatchlistRow({
  item,
  onEdit,
  onStart,
  converting,
}: {
  item: WatchlistItemRecord;
  onEdit: () => void;
  onStart: () => void;
  converting: boolean;
}) {
  return (
    <tr className="group border-b border-white/[0.045] hover:bg-white/[0.02]">
      <td className="py-2.5 pl-8 pr-3">
        <div className="flex min-w-0 items-center gap-3">
          <ProjectMark />
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
      <td className="px-3"><p className="line-clamp-2 text-[11px] leading-4 text-muted-foreground">{item.thesis || "No thesis yet"}</p></td>
      <td className="px-3">{item.chain ? <Badge variant="outline" className="text-[10px]">{item.chain}</Badge> : <span className="text-[10px] text-muted-foreground">Not set</span>}</td>
      <td className="px-3"><ProjectTypeBadges values={item.projectTypes} /></td>
      <td className="px-3 text-right">
        {item.status === "active" ? (
          <Button type="button" size="sm" onClick={onStart} disabled={converting}>
            {converting ? "Starting..." : "Start Project"} <ArrowRight className="size-3.5" />
          </Button>
        ) : (
          <Link href="/projects" className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground">
            Open Projects <ArrowRight className="size-3" />
          </Link>
        )}
      </td>
    </tr>
  );
}

function WatchlistCard({
  item,
  onEdit,
  onStart,
  converting,
}: {
  item: WatchlistItemRecord;
  onEdit: () => void;
  onStart: () => void;
  converting: boolean;
}) {
  return (
    <article className="px-4 py-4 hover:bg-white/[0.02] sm:px-6">
      <div className="flex items-start gap-3">
        <ProjectMark />
        <div className="min-w-0 flex-1">
          {item.status === "active" ? (
            <button type="button" onClick={onEdit} className="block max-w-full truncate text-left text-sm font-semibold focus-visible:ring-2 focus-visible:ring-ring">{item.name}</button>
          ) : (
            <p className="truncate text-sm font-semibold">{item.name}</p>
          )}
          <Link href={item.xUrl} target="_blank" rel="noreferrer" className="mt-0.5 inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground">
            @{xHandle(item.xUrl)} <ExternalLink className="size-2.5" />
          </Link>
          <p className="mt-2 line-clamp-3 text-[11px] leading-4 text-muted-foreground">{item.thesis || "No thesis yet"}</p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {item.chain ? <Badge variant="outline" className="text-[10px]">{item.chain}</Badge> : null}
            <ProjectTypeBadges values={item.projectTypes} />
          </div>
          <div className="mt-3">
            {item.status === "active" ? (
              <Button type="button" size="sm" onClick={onStart} disabled={converting}>
                {converting ? "Starting..." : "Start Project"} <ArrowRight className="size-3.5" />
              </Button>
            ) : (
              <Link href="/projects" className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground">
                Open Projects <ArrowRight className="size-3" />
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
