"use client";

import { CalendarDays, ChevronLeft, ChevronRight, Circle, ExternalLink, RefreshCw, Search, SkipForward, X } from "lucide-react";
import { useCallback, useMemo, useState, type CSSProperties } from "react";
import { LayoutGroup, motion } from "motion/react";

import { CornerToast, type CornerToastNotice } from "@/components/shared/corner-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDailyMutations, useDailyWorkspace } from "@/features/daily/daily-workspace-query";
import type { PersonalItemRecord } from "@/features/personal/types";
import { formatTaskFrequency, TASK_STATUS_LABELS } from "@/features/tasks/task-types";
import type { DailyChecklistItem, DailyLogStatus, DailyPageData } from "@/features/daily/daily-types";
import { isHttpUrl, normalizeHttpUrl } from "@/lib/url";
import { cn } from "@/lib/utils";

type ViewMode = "account" | "project";
type DailyGroup = { id: string; label: string; initials: string; checklist: DailyChecklistItem[]; monitoring: DailyChecklistItem[] };

const springLayout = { type: "spring" as const, stiffness: 500, damping: 40, mass: 0.8 };

export function DailyWorkspace({ initialData, developmentPreview = false }: { initialData: DailyPageData; developmentPreview?: boolean }) {
  const [selectedDate, setSelectedDate] = useState(initialData.selectedDate);
  const { data: queryData, isFetching, isPlaceholderData } = useDailyWorkspace(selectedDate, initialData, developmentPreview);
  const data = queryData ?? { ...initialData, selectedDate };
  const loadingDate = isFetching && (isPlaceholderData || data.selectedDate !== selectedDate);

  const [view, setView] = useState<ViewMode>("account");
  const [query, setQuery] = useState("");
  const [hideDone, setHideDone] = useState(false);
  const [detail, setDetail] = useState<DailyChecklistItem | null>(null);
  const [notice, setNotice] = useState<CornerToastNotice | null>(null);

  const mutations = useDailyMutations({
    selectedDate: data.selectedDate,
    developmentPreview,
    onError: (message) => showNotice("error", "Action failed", message),
  });

  const groups = useMemo(() => groupItems(data.items, data.accounts, view, query, hideDone), [data.accounts, data.items, hideDone, query, view]);
  const checklist = data.items.filter((item) => item.kind === "checklist");
  const visiblePersonalItems = useMemo(
    () => (data.personalItems ?? []).filter((item) => isPersonalScheduled(item, data.selectedDate) && (!hideDone || item.status !== "done") && (!query.trim() || item.title.toLowerCase().includes(query.trim().toLowerCase()))),
    [data.personalItems, data.selectedDate, hideDone, query],
  );
  const done = checklist.filter((item) => item.log?.status === "done").length;

  function showNotice(tone: CornerToastNotice["tone"], title: string, message?: string) {
    setNotice({ id: Date.now(), tone, title, message });
  }

  const clearNotice = useCallback(() => {
    setNotice(null);
  }, []);

  function changeDate(date: string) {
    if (loadingDate || date === selectedDate) return;
    setSelectedDate(date);
    setDetail(null);
    clearNotice();
  }

  function togglePersonalItem(item: PersonalItemRecord) {
    if (developmentPreview || mutations.togglePersonalMutation.isPending) return;
    clearNotice();
    mutations.togglePersonalMutation.mutate({
      item,
      status: item.status === "done" ? "todo" : "done",
    });
  }

  function saveLog(item: DailyChecklistItem, status: DailyLogStatus, fields?: { txHash?: string; proofUrl?: string; notes?: string }) {
    if (developmentPreview || item.kind !== "checklist") return;
    clearNotice();
    mutations.saveLogMutation.mutate(
      { item, status, fields },
      {
        onSuccess: (log) => {
          setDetail((current) => (current?.id === item.id ? { ...current, log } : current));
        },
      },
    );
  }

  const busyItemId = mutations.saveLogMutation.isPending
    ? mutations.saveLogMutation.variables?.item.id
    : undefined;
  const busyPersonalId = mutations.togglePersonalMutation.isPending
    ? mutations.togglePersonalMutation.variables?.item.id
    : undefined;

  return (
    <div className="px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
      <header className="flex flex-col gap-4 border-b soft-divider-strong pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs text-muted-foreground">Daily workbench</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-[-0.02em]">Today</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">{dateLabel(data.selectedDate)} · {done} of {checklist.length} tasks completed</p>
        </div>
        <div className="flex items-center gap-1 rounded-lg border soft-divider-strong bg-card p-1">
          <Button variant="ghost" size="icon" aria-label="Previous day" disabled={loadingDate} onClick={() => changeDate(shiftDate(selectedDate, -1))}><ChevronLeft /></Button>
          <span className="inline-flex h-8 items-center gap-2 px-2 text-xs font-medium"><CalendarDays className="size-3.5 text-muted-foreground" />{shortDateLabel(data.selectedDate)}</span>
          <Button variant="ghost" size="icon" aria-label="Next day" disabled={loadingDate} onClick={() => changeDate(shiftDate(selectedDate, 1))}><ChevronRight /></Button>
        </div>
      </header>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex rounded-lg border soft-divider-strong bg-card p-1">
          <button type="button" onClick={() => setView("account")} className={cn("rounded-md px-3 py-1.5 text-xs font-medium", view === "account" ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground")}>By account</button>
          <button type="button" onClick={() => setView("project")} className={cn("rounded-md px-3 py-1.5 text-xs font-medium", view === "project" ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground")}>By project</button>
        </div>
        <div className="flex h-9 items-center gap-1 rounded-lg border soft-divider-strong bg-card p-1">
          <label className="flex h-7 min-w-0 items-center gap-2 px-2 sm:w-56">
            <Search className="size-3.5 text-muted-foreground" />
            <input aria-label="Search daily tasks" value={query} onChange={(event) => setQuery(event.target.value)} className="min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground" placeholder="Search today…" />
          </label>
          <button type="button" onClick={() => setHideDone((current) => !current)} className={cn("h-7 rounded-md px-3 text-xs hover:bg-accent hover:text-foreground", hideDone ? "bg-accent text-foreground" : "text-muted-foreground")}>{hideDone ? "Show done" : "Hide done"}</button>
        </div>
      </div>
      {developmentPreview ? <p className="mt-4 rounded-lg border border-white/[0.065] bg-white/[0.025] px-3 py-2 text-xs text-muted-foreground">Preview mode uses sample Tasks. Daily log persistence is available after Supabase is configured.</p> : null}
      {visiblePersonalItems.length > 0 ? (
        <PersonalItemsCard
          items={visiblePersonalItems}
          busyPersonalId={busyPersonalId}
          onToggle={togglePersonalItem}
        />
      ) : null}
      <CornerToast notice={notice} onClose={clearNotice} />
      <LayoutGroup id="daily-groups">
        <div className="mt-5 space-y-4" aria-busy={loadingDate}>
          {groups.length === 0 ? (
            <p className="rounded-xl border soft-divider-strong bg-card px-4 py-8 text-center text-sm text-muted-foreground">No Daily tasks match this view.</p>
          ) : (
            groups.map((group) => (
              <GroupCard
                key={group.id}
                group={group}
                view={view}
                busyItemId={busyItemId}
                onSave={saveLog}
                onOpen={setDetail}
              />
            ))
          )}
        </div>
      </LayoutGroup>
      <LogDialog
        item={detail}
        busy={detail ? busyItemId === detail.id : false}
        readOnly={developmentPreview || detail?.kind === "monitoring"}
        onClose={() => setDetail(null)}
        onSave={(item, fields) => saveLog(item, item.log?.status ?? "pending", fields)}
      />
    </div>
  );
}

function PersonalItemsCard({ items, busyPersonalId, onToggle }: { items: PersonalItemRecord[]; busyPersonalId?: string; onToggle: (item: PersonalItemRecord) => void }) {
  return (
    <section className="mt-4 overflow-hidden rounded-xl border soft-divider-strong bg-card soft-panel">
      <div className="flex items-center justify-between px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold">Personal items</h2>
          <p className="mt-0.5 text-[11px] text-muted-foreground">Standalone checklist, not tied to a Project.</p>
        </div>
        <span className="text-[11px] text-muted-foreground">{items.filter((item) => item.status === "done").length}/{items.length}</span>
      </div>
      <div className="border-t soft-divider px-4 py-2">
        {items.map((item) => {
          const done = item.status === "done";
          const busy = busyPersonalId === item.id;
          return (
            <motion.div
              key={item.id}
              layout
              transition={springLayout}
              className="flex min-h-12 items-center gap-3 rounded-lg px-2 py-2 hover:bg-accent/30"
            >
              <button
                type="button"
                role="checkbox"
                aria-checked={done}
                aria-label={(done ? "Mark pending: " : "Mark done: ") + item.title}
                disabled={busy}
                onClick={() => onToggle(item)}
                className={cn("grid size-5 shrink-0 place-items-center rounded-[6px] border disabled:opacity-50", done ? "border-white bg-white text-background" : "soft-divider bg-background text-muted-foreground hover:border-white/25")}
              >
                <span className="text-xs">{done ? "✓" : ""}</span>
              </button>
              <span className={cn("min-w-0 flex-1 truncate text-[13px] font-medium", done && "text-muted-foreground line-through")}>{item.title}</span>
              <span className="text-[10px] text-muted-foreground">{item.frequency}</span>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

function isPersonalScheduled(item: PersonalItemRecord, selectedDate: string) {
  if (item.status === "dropped") return false;
  const createdDate = item.createdAt?.slice(0, 10);
  if (createdDate && selectedDate < createdDate) return false;
  if (item.frequency === "daily" || item.frequency === "custom") return true;
  if (item.frequency === "once") return item.status !== "done" || selectedDate === createdDate;
  if (!createdDate) return true;
  const created = new Date(createdDate + "T00:00:00Z");
  const selected = new Date(selectedDate + "T00:00:00Z");
  if (item.frequency === "weekly") return created.getUTCDay() === selected.getUTCDay();
  return created.getUTCDate() === selected.getUTCDate();
}

function GroupCard({ group, view, busyItemId, onSave, onOpen }: { group: DailyGroup; view: ViewMode; busyItemId?: string; onSave: (item: DailyChecklistItem, status: DailyLogStatus) => void; onOpen: (item: DailyChecklistItem) => void }) {
  const done = group.checklist.filter((item) => item.log?.status === "done").length;
  const progress = group.checklist.length ? Math.round(done / group.checklist.length * 100) : 0;
  return (
    <motion.section layout transition={springLayout} className="overflow-hidden rounded-xl border soft-divider-strong bg-card soft-panel">
      <div className="flex flex-wrap items-center gap-3 px-4 py-3">
        <span className="grid size-8 place-items-center rounded-full bg-elevated text-[10px] font-semibold">{group.initials}</span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-semibold">{group.label}</h2>
            <span className="text-[11px] tabular-nums text-muted-foreground">{done}/{group.checklist.length}</span>
            {group.monitoring.length ? <span className="rounded-full bg-info/10 px-2 py-0.5 text-[10px] font-medium text-info">{group.monitoring.length} monitoring</span> : null}
          </div>
          {group.checklist.length ? <div className="mt-1.5 h-1 w-32 rounded-full bg-elevated"><div className="h-full rounded-full bg-white/60" style={{ width: progress + "%" }} /></div> : null}
        </div>
      </div>
      <div className="border-t soft-divider px-4 pb-3 pt-2">
        {group.checklist.length ? (
          <div className="space-y-1">
            {group.checklist.map((item) => (
              <TaskRow key={item.id} item={item} view={view} busy={busyItemId === item.id} onSave={onSave} onOpen={onOpen} />
            ))}
          </div>
        ) : (
          <p className="px-2 py-3 text-xs text-muted-foreground">No checklist items for this date.</p>
        )}
        {group.monitoring.length ? <MonitoringRows items={group.monitoring} view={view} onOpen={onOpen} /> : null}
      </div>
    </motion.section>
  );
}

function TaskRow({ item, view, busy, onSave, onOpen }: { item: DailyChecklistItem; view: ViewMode; busy: boolean; onSave: (item: DailyChecklistItem, status: DailyLogStatus) => void; onOpen: (item: DailyChecklistItem) => void }) {
  const status = item.log?.status ?? "pending";
  const done = status === "done";
  const skipped = status === "skip";
  return (
    <motion.div
      layout
      transition={springLayout}
      className="flex min-h-14 items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-accent/30"
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={done}
        aria-label={(done ? "Mark pending: " : "Mark done: ") + item.title}
        disabled={busy}
        onClick={() => onSave(item, done ? "pending" : "done")}
        style={{ "--check-len": 15 } as CSSProperties}
        className={cn("t-check grid size-5 shrink-0 place-items-center rounded-[6px] border disabled:opacity-50", done ? "border-white bg-white text-background shadow-sm shadow-black/20" : "soft-divider bg-background text-muted-foreground hover:border-white/25 hover:bg-white/[0.035]")}
      >
        <svg className="size-3" viewBox="0 0 10.1668 10.1668" aria-hidden="true"><path d="M1 5.52L3.92 9.17L9.17 1" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /></svg>
      </button>
      <button type="button" onClick={() => onOpen(item)} className="min-w-0 flex-1 text-left">
        <p className={cn("truncate text-[13px] font-medium", done && "text-muted-foreground line-through")}>{item.title}</p>
        <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{view === "project" ? item.account.label + " · " : ""}{item.projectName} · {formatTaskFrequency(item.frequency)}</p>
      </button>
      {item.priority === "high" ? <Badge variant="warning">High</Badge> : null}
      {skipped ? <Badge variant="outline">Skipped</Badge> : null}
      <button type="button" disabled={busy} onClick={() => onSave(item, skipped ? "pending" : "skip")} className={cn("grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-50", skipped && "bg-accent text-foreground")} aria-label={(skipped ? "Reset pending: " : "Skip today: ") + item.title}><SkipForward className="size-3.5" /></button>
      {isHttpUrl(normalizeHttpUrl(item.url)) ? <a href={normalizeHttpUrl(item.url)} target="_blank" rel="noreferrer" className="hidden text-muted-foreground hover:text-foreground sm:block" aria-label="Open task link"><ExternalLink className="size-3.5" /></a> : null}
    </motion.div>
  );
}

function MonitoringRows({ items, view, onOpen }: { items: DailyChecklistItem[]; view: ViewMode; onOpen: (item: DailyChecklistItem) => void }) {
  return (
    <section className="mt-3 space-y-1">
      <div className="flex items-center gap-2 px-2 py-1">
        <RefreshCw className="size-3.5 text-muted-foreground" />
        <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">Running & recheck</p>
      </div>
      {items.map((item) => (
        <button type="button" key={item.id} onClick={() => onOpen(item)} className="flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left hover:bg-accent/40">
          <Circle className={cn("size-2 fill-current", item.taskStatus === "running" ? "text-info" : "text-warning")} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-xs font-medium">{item.title}</span>
            <span className="text-[11px] text-muted-foreground">{view === "project" ? item.account.label + " · " : ""}{item.projectName}</span>
          </span>
          <Badge variant={item.taskStatus === "running" ? "info" : "warning"}>{TASK_STATUS_LABELS[item.taskStatus]}</Badge>
        </button>
      ))}
    </section>
  );
}

function LogDialog({ item, busy, readOnly, onClose, onSave }: { item: DailyChecklistItem | null; busy: boolean; readOnly: boolean; onClose: () => void; onSave: (item: DailyChecklistItem, fields: { txHash: string; proofUrl: string; notes: string }) => void }) {
  const [draft, setDraft] = useState<{ itemId: string; txHash: string; proofUrl: string; notes: string } | null>(null);
  const value = item && draft?.itemId === item.id ? draft : item ? { itemId: item.id, txHash: item.log?.txHash ?? "", proofUrl: item.log?.proofUrl ?? "", notes: item.log?.notes ?? "" } : null;
  if (!item || !value) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-4 backdrop-blur-[2px] sm:items-center" role="dialog" aria-modal="true" aria-labelledby="daily-log-title" onClick={onClose}>
      <section className="w-full max-w-lg rounded-xl border soft-divider-strong bg-card shadow-2xl shadow-black/50" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between border-b soft-divider px-5 py-3">
          <div>
            <h2 id="daily-log-title" className="text-base font-semibold">Daily log</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">{item.projectName} · {item.account.label}</p>
          </div>
          <button type="button" onClick={onClose} disabled={busy} className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"><X className="size-4" /></button>
        </div>
        <div className="space-y-4 px-5 py-5">
          <div>
            <p className="text-sm font-semibold">{item.title}</p>
            <p className="mt-1 text-xs text-muted-foreground">{item.kind === "monitoring" ? "Monitoring tasks are not logged as checklist completion." : item.log?.status === "skip" ? "Skipped for this date" : item.log?.status === "done" ? "Completed for this date" : "Pending for this date"}</p>
          </div>
          {!readOnly ? (
            <>
              <label className="block"><span className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Transaction hash</span><input value={value.txHash} onChange={(event) => setDraft({ ...value, txHash: event.target.value })} className="mt-1.5 h-9 w-full rounded-lg border soft-divider bg-input px-3 text-sm outline-none focus:border-ring" placeholder="Optional transaction hash" /></label>
              <label className="block"><span className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Proof URL</span><input value={value.proofUrl} onChange={(event) => setDraft({ ...value, proofUrl: event.target.value })} onBlur={() => setDraft({ ...value, proofUrl: normalizeHttpUrl(value.proofUrl) })} className="mt-1.5 h-9 w-full rounded-lg border soft-divider bg-input px-3 text-sm outline-none focus:border-ring" placeholder="test.com or https://test.com" /></label>
              <label className="block"><span className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Note</span><textarea value={value.notes} onChange={(event) => setDraft({ ...value, notes: event.target.value })} className="mt-1.5 min-h-24 w-full resize-y rounded-lg border soft-divider bg-input px-3 py-2 text-sm outline-none focus:border-ring" placeholder="Optional execution note" /></label>
            </>
          ) : (
            <p className="rounded-lg bg-elevated px-3 py-2 text-xs text-muted-foreground">Daily log editing is unavailable for this item.</p>
          )}
        </div>
        <div className="flex justify-end gap-2 border-t soft-divider px-5 py-3">
          <Button variant="secondary" size="sm" onClick={onClose} disabled={busy}>Close</Button>
          {!readOnly ? <Button size="sm" onClick={() => onSave(item, value)} disabled={busy}>{busy ? "Saving..." : "Save log"}</Button> : null}
        </div>
      </section>
    </div>
  );
}

function groupItems(items: DailyChecklistItem[], accounts: DailyPageData["accounts"], view: ViewMode, rawQuery: string, hideDone: boolean): DailyGroup[] {
  const map = new Map<string, DailyGroup>();
  const query = rawQuery.trim().toLowerCase();
  for (const item of items) {
    if (hideDone && item.log?.status === "done") continue;
    if (query && ![item.title, item.projectName, item.account.label, item.frequency, item.taskStatus].join(" ").toLowerCase().includes(query)) continue;
    const id = view === "account" ? item.account.id : item.projectId;
    const label = view === "account" ? item.account.label : item.projectName;
    const group = map.get(id) ?? { id, label, initials: initials(label), checklist: [], monitoring: [] };
    if (item.kind === "checklist") group.checklist.push(item); else group.monitoring.push(item);
    map.set(id, group);
  }
  if (view === "account" && !query && !hideDone) for (const account of accounts) if (!map.has(account.id)) map.set(account.id, { id: account.id, label: account.label, initials: initials(account.label), checklist: [], monitoring: [] });
  return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label));
}

function initials(value: string) { return value.split(/\s+/).map((word) => word[0]).join("").slice(0, 2).toUpperCase(); }
function shiftDate(value: string, days: number) { const [year, month, day] = value.split("-").map(Number); return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10); }
function dateLabel(value: string) { return new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: "UTC" }).format(new Date(value + "T00:00:00Z")); }
function shortDateLabel(value: string) { return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(value + "T00:00:00Z")); }
