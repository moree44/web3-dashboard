"use client";

import { Plus, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { CornerToast, type CornerToastNotice } from "@/components/shared/corner-toast";
import { Button } from "@/components/ui/button";
import { WATCHLIST_PROJECT_TYPES, type WatchlistInput, type WatchlistItemRecord } from "@/features/watchlist/watchlist-types";
import { cn } from "@/lib/utils";
import { normalizeHttpUrl } from "@/lib/url";
import { usePresence } from "@/lib/use-presence";

export function WatchlistDialog({
  open,
  item,
  initialXUrl = "",
  onClose,
  onSave,
  onDelete,
}: {
  open: boolean;
  item?: WatchlistItemRecord | null;
  initialXUrl?: string;
  onClose: () => void;
  onSave: (input: WatchlistInput, id?: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [xUrl, setXUrl] = useState("");
  const [thesis, setThesis] = useState("");
  const [chain, setChain] = useState("");
  const [projectTypes, setProjectTypes] = useState<string[]>([]);
  const [customType, setCustomType] = useState("");
  const [busy, setBusy] = useState(false);
  const [deleteArmed, setDeleteArmed] = useState(false);
  const [notice, setNotice] = useState<CornerToastNotice | null>(null);

  const clearNotice = useCallback(() => {
    setNotice(null);
  }, []);

  useEffect(() => {
    if (!open) return;
    setName(item?.name ?? "");
    setXUrl(item?.xUrl ?? initialXUrl);
    setThesis(item?.thesis ?? "");
    setChain(item?.chain ?? "");
    setProjectTypes(item?.projectTypes ?? []);
    setCustomType("");
    setDeleteArmed(false);
    clearNotice();
  }, [clearNotice, initialXUrl, item, open]);

  useEffect(() => {
    if (!open) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose, open]);

  const { mounted, closing } = usePresence(open, 160);
  if (!mounted) return null;

  const canSave = Boolean(xUrl.trim() && (!item || name.trim()) && !busy);

  function toggleProjectType(value: string) {
    setProjectTypes((current) => current.includes(value)
      ? current.filter((type) => type !== value)
      : [...current, value]);
  }

  function addCustomType() {
    const value = customType.trim();
    if (!value || projectTypes.some((type) => type.toLowerCase() === value.toLowerCase())) return;
    setProjectTypes((current) => [...current, value]);
    setCustomType("");
  }

  async function save() {
    if (!canSave) return;
    setBusy(true);
    clearNotice();
    try {
      await onSave({
        name: name.trim(),
        xUrl: normalizeHttpUrl(xUrl),
        thesis: thesis.trim(),
        chain: chain.trim(),
        projectTypes,
      }, item?.id);
      onClose();
    } catch (caught) {
      setNotice({ id: Date.now(), tone: "error", title: "Action failed", message: caught instanceof Error ? caught.message : "Unable to save Watchlist item" });
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!item) return;
    if (!deleteArmed) {
      setDeleteArmed(true);
      return;
    }
    setBusy(true);
    clearNotice();
    try {
      await onDelete(item.id);
      onClose();
    } catch (caught) {
      setNotice({ id: Date.now(), tone: "error", title: "Action failed", message: caught instanceof Error ? caught.message : "Unable to delete Watchlist item" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className={cn("fixed inset-0 z-[100] grid place-items-center bg-black/45 px-4 backdrop-blur-[2px]", closing ? "modal-backdrop-out" : "modal-backdrop-in")}
      role="dialog"
      aria-modal="true"
      aria-labelledby="watchlist-dialog-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <CornerToast notice={notice} onClose={clearNotice} />
      <div className={cn("soft-panel max-h-[calc(100vh-32px)] w-full max-w-[620px] overflow-y-auto rounded-2xl border border-white/[0.065] bg-card shadow-2xl shadow-black/45 scrollbar-subtle", closing ? "modal-card-out" : "modal-card-in")}>
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 bg-card/95 px-5 py-4 backdrop-blur">
          <div>
            <h2 id="watchlist-dialog-title" className="text-base font-semibold tracking-[-0.02em]">
              {item ? "Edit Watchlist item" : "Add to Watchlist"}
            </h2>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Save the X account now. Add only the context you already know.
            </p>
          </div>
          <button type="button" onClick={onClose} className="grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-white/[0.045] hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring" aria-label="Close Watchlist dialog">
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-4 px-5 pb-5">
          <label className="block">
            <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">X profile URL</span>
            <input
              autoFocus
              type="text"
              inputMode="url"
              autoCapitalize="none"
              autoCorrect="off"
              value={xUrl}
              onChange={(event) => setXUrl(event.target.value)}
              onBlur={() => setXUrl((value) => normalizeHttpUrl(value))}
              className="mt-1.5 h-10 w-full rounded-lg border border-white/[0.055] bg-input px-3 text-sm outline-none soft-inset placeholder:text-muted-foreground focus:border-ring"
              placeholder="x.com/project"
            />
          </label>

          <label className="block">
            <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
              Project name{item ? "" : ", optional"}
            </span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={120}
              className="mt-1.5 h-10 w-full rounded-lg border border-white/[0.055] bg-input px-3 text-sm font-semibold outline-none soft-inset placeholder:text-muted-foreground focus:border-ring"
              placeholder="Derived from the X handle when empty"
            />
          </label>

          <label className="block">
            <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Thesis, optional</span>
            <textarea
              value={thesis}
              onChange={(event) => setThesis(event.target.value)}
              maxLength={2000}
              rows={4}
              className="mt-1.5 w-full resize-none rounded-lg border border-white/[0.055] bg-input px-3 py-2.5 text-xs leading-5 outline-none soft-inset placeholder:text-muted-foreground focus:border-ring"
              placeholder="Why this project may be worth monitoring..."
            />
          </label>

          <label className="block">
            <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Chain, optional</span>
            <input
              value={chain}
              onChange={(event) => setChain(event.target.value)}
              maxLength={80}
              className="mt-1.5 h-9 w-full rounded-lg border border-white/[0.055] bg-input px-3 text-xs outline-none soft-inset placeholder:text-muted-foreground focus:border-ring"
              placeholder="Ethereum, Solana, Cosmos..."
            />
          </label>

          <fieldset>
            <legend className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Project Type, optional</legend>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {WATCHLIST_PROJECT_TYPES.map((type) => {
                const selected = projectTypes.includes(type);
                return (
                  <button
                    key={type}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggleProjectType(type)}
                    className={cn("rounded-md border px-2 py-1 text-[10px] font-medium transition-colors", selected ? "border-white/[0.12] bg-accent text-foreground" : "border-white/[0.055] text-muted-foreground hover:bg-white/[0.04] hover:text-foreground")}
                  >
                    {type}
                  </button>
                );
              })}
              {projectTypes.filter((type) => !WATCHLIST_PROJECT_TYPES.includes(type as (typeof WATCHLIST_PROJECT_TYPES)[number])).map((type) => (
                <button key={type} type="button" onClick={() => toggleProjectType(type)} className="rounded-md border border-white/[0.12] bg-accent px-2 py-1 text-[10px] font-medium text-foreground">
                  {type} <X className="ml-0.5 inline size-2.5" />
                </button>
              ))}
            </div>
            <div className="mt-2 flex gap-2">
              <input
                value={customType}
                onChange={(event) => setCustomType(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key !== "Enter") return;
                  event.preventDefault();
                  addCustomType();
                }}
                maxLength={80}
                className="h-8 min-w-0 flex-1 rounded-lg border border-white/[0.055] bg-input px-3 text-xs outline-none soft-inset placeholder:text-muted-foreground focus:border-ring"
                placeholder="Custom type"
              />
              <Button type="button" size="sm" variant="outline" onClick={addCustomType} disabled={!customType.trim()}>
                <Plus className="size-3.5" /> Add
              </Button>
            </div>
          </fieldset>
          <div className="flex items-center justify-between gap-3 pt-1">
            <div>
              {item ? (
                <Button type="button" size="sm" variant={deleteArmed ? "destructive" : "ghost"} onClick={remove} disabled={busy}>
                  <Trash2 className="size-3.5" /> {deleteArmed ? "Confirm delete" : "Delete"}
                </Button>
              ) : null}
            </div>
            <div className="flex gap-2">
              <Button type="button" size="sm" variant="ghost" onClick={onClose} disabled={busy}>Cancel</Button>
              <Button type="button" size="sm" onClick={save} disabled={!canSave}>
                {busy ? "Saving..." : item ? "Save changes" : "Add to Watchlist"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
