"use client";

import { Archive, ArrowUpRight, CheckCircle2, ClipboardList, FileText, Inbox, Link2, Plus, Search, SlidersHorizontal, X } from "lucide-react";
import { useMemo, useState } from "react";

import { AppSelect } from "@/components/ui/app-select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  createInboxItem,
  createNoteFromInbox,
  createProjectFromInbox,
  createTaskFromInbox,
  getInboxPageData,
  linkInboxItem,
  setInboxStatus,
  updateInboxItem,
} from "@/features/inbox/actions";
import { INBOX_PRIORITIES, INBOX_STATUSES, type InboxItemInput, type InboxItemRecord, type InboxPageData, type InboxPriority, type InboxStatus } from "@/features/inbox/inbox-types";
import { isHttpUrl } from "@/lib/url";
import { cn } from "@/lib/utils";

type Draft = InboxItemInput & { id?: string };
type ActionMode = "project" | "task" | "note" | "link-project" | "link-task" | null;
type ActionDraft = { projectName: string; taskTitle: string; projectId: string; linkedProjectId: string };

const statusLabels: Record<InboxStatus, string> = {
  new: "New",
  reviewing: "Reviewing",
  linked: "Linked",
  converted: "Converted",
  ignored: "Ignored",
  archived: "Archived",
};

const priorityLabels: Record<InboxPriority, string> = { high: "High", medium: "Medium", low: "Low" };

function blankDraft(): Draft {
  return { title: "", content: "", url: "", sender: "", priority: "medium", detectedProjectName: "" };
}

function recordDraft(item: InboxItemRecord): Draft {
  return {
    id: item.id,
    title: item.title,
    content: item.content,
    url: item.url ?? "",
    sender: item.sender ?? "",
    priority: item.priority,
    detectedProjectName: item.detectedProjectName ?? "",
  };
}

function statusVariant(status: InboxStatus) {
  if (status === "new") return "info" as const;
  if (status === "reviewing") return "warning" as const;
  if (status === "converted") return "success" as const;
  if (status === "ignored" || status === "archived") return "outline" as const;
  return "secondary" as const;
}

function priorityVariant(priority: InboxPriority) {
  return priority === "high" ? "warning" as const : priority === "low" ? "outline" as const : "secondary" as const;
}

export function InboxWorkspace({ initialData, developmentPreview = false }: { initialData: InboxPageData; developmentPreview?: boolean }) {
  const [data, setData] = useState(initialData);
  const [selectedId, setSelectedId] = useState<string | null>(initialData.items[0]?.id ?? null);
  const [draft, setDraft] = useState<Draft | null>(() => initialData.items[0] ? recordDraft(initialData.items[0]) : null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [actionMode, setActionMode] = useState<ActionMode>(null);
  const [actionDraft, setActionDraft] = useState<ActionDraft>({ projectName: "", taskTitle: "", projectId: "", linkedProjectId: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected = data.items.find((item) => item.id === selectedId) ?? null;
  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return data.items.filter((item) => {
      if (statusFilter && item.status !== statusFilter) return false;
      if (priorityFilter && item.priority !== priorityFilter) return false;
      if (!normalized) return true;
      return [item.title, item.content, item.source, item.sender ?? "", item.detectedProjectName ?? "", item.linkedProjectName ?? "", item.linkedTaskTitle ?? ""].join(" ").toLowerCase().includes(normalized);
    });
  }, [data.items, priorityFilter, query, statusFilter]);

  function applySaved(saved: InboxItemRecord) {
    setData((current) => ({ ...current, items: current.items.some((item) => item.id === saved.id) ? current.items.map((item) => item.id === saved.id ? saved : item) : [saved, ...current.items] }));
    setSelectedId(saved.id);
    setDraft(recordDraft(saved));
  }

  function selectItem(item: InboxItemRecord) {
    setError(null);
    setActionMode(null);
    setSelectedId(item.id);
    setDraft(recordDraft(item));
  }

  function startCapture() {
    setError(null);
    setActionMode(null);
    setSelectedId(null);
    setDraft(blankDraft());
  }

  async function saveDraft() {
    if (!draft || developmentPreview || busy) return;
    setBusy(true);
    setError(null);
    try {
      const { id, ...input } = draft;
      const saved = id ? await updateInboxItem(id, input) : await createInboxItem(input);
      applySaved(saved);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Inbox item could not be saved");
    } finally {
      setBusy(false);
    }
  }

  async function changeStatus(status: InboxStatus) {
    if (!selected || developmentPreview || busy) return;
    setBusy(true);
    setError(null);
    try {
      applySaved(await setInboxStatus(selected.id, status));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Inbox status could not be updated");
    } finally {
      setBusy(false);
    }
  }

  function openAction(mode: ActionMode) {
    if (!selected) return;
    setError(null);
    setActionMode(mode);
    setActionDraft({
      projectName: selected.detectedProjectName || selected.title,
      taskTitle: selected.title,
      projectId: selected.linkedProjectId ?? data.projects[0]?.id ?? "",
      linkedProjectId: selected.linkedProjectId ?? "",
    });
  }

  async function runAction() {
    if (!selected || !actionMode || developmentPreview || busy) return;
    setBusy(true);
    setError(null);
    try {
      let saved: InboxItemRecord;
      if (actionMode === "project") saved = await createProjectFromInbox(selected.id, { projectName: actionDraft.projectName });
      else if (actionMode === "task") saved = await createTaskFromInbox(selected.id, { projectId: actionDraft.projectId, taskTitle: actionDraft.taskTitle });
      else if (actionMode === "note") saved = await createNoteFromInbox(selected.id, { title: actionDraft.taskTitle, linkedProjectId: actionDraft.linkedProjectId || null });
      else if (actionMode === "link-project") saved = await linkInboxItem(selected.id, { type: "project", targetId: actionDraft.linkedProjectId });
      else saved = await linkInboxItem(selected.id, { type: "task", targetId: actionDraft.projectId });
      const refreshed = await getInboxPageData();
      setData(refreshed);
      setSelectedId(saved.id);
      setDraft(recordDraft(refreshed.items.find((item) => item.id === saved.id) ?? saved));
      setActionMode(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Inbox action could not be completed");
    } finally {
      setBusy(false);
    }
  }

  return <div className="px-4 py-4 sm:px-5 lg:px-6 lg:py-5">
    <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="text-xs text-muted-foreground">Inbox · raw input processing</p><h1 className="font-display mt-1 text-2xl font-semibold tracking-[-0.025em]">Inbox</h1><p className="mt-1 text-[13px] text-muted-foreground">Capture first, then decide what deserves a project, task, or Doc.</p></div>
      <Button size="sm" disabled={developmentPreview || busy} onClick={startCapture}><Plus />Capture item</Button>
    </header>
    <section className="soft-panel mt-4 grid gap-2 rounded-xl border soft-divider bg-card p-2 lg:grid-cols-[minmax(0,1fr)_180px_160px]"><div className="soft-inset flex min-w-0 items-center gap-3 rounded-lg border soft-divider bg-input px-3 py-2.5"><Search className="size-4 text-muted-foreground" /><input aria-label="Search inbox" value={query} onChange={(event) => setQuery(event.target.value)} className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-muted-foreground" placeholder="Search title, source, project, or reminder..." /></div><AppSelect ariaLabel="Filter inbox by status" value={statusFilter} options={[{ value: "", label: "All statuses" }, ...INBOX_STATUSES.map((status) => ({ value: status, label: statusLabels[status] }))]} onChange={setStatusFilter} /><AppSelect ariaLabel="Filter inbox by priority" value={priorityFilter} options={[{ value: "", label: "All priorities" }, ...INBOX_PRIORITIES.map((priority) => ({ value: priority, label: priorityLabels[priority] }))]} onChange={setPriorityFilter} /></section>
    {developmentPreview ? <p className="mt-4 rounded-lg bg-info/10 px-3 py-2 text-xs text-info">Preview mode does not persist Inbox items. Configure Supabase to use the manual Inbox workflow.</p> : null}
    {error ? <p role="alert" className="mt-4 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p> : null}
    <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
      <section className="soft-panel overflow-hidden rounded-xl border soft-divider bg-card"><div className="flex items-center justify-between gap-3 border-b soft-divider px-4 py-3"><div className="flex items-center gap-2.5"><span className="grid size-8 place-items-center rounded-lg border soft-divider bg-muted text-muted-foreground"><Inbox className="size-4" /></span><div><h2 className="text-sm font-semibold">Inbox list</h2><p className="mt-0.5 text-[11px] text-muted-foreground">Manual and quick capture items stay raw until you confirm an action.</p></div></div><Badge variant="secondary">{filteredItems.length} open</Badge></div>{filteredItems.length ? <div className="divide-y divide-white/[0.045]">{filteredItems.map((item) => <InboxRow key={item.id} item={item} selected={item.id === selectedId} onSelect={() => selectItem(item)} />)}</div> : <EmptyCopy>No Inbox items match this view.</EmptyCopy>}</section>
      {draft ? <InboxDetail draft={draft} selected={selected} projects={data.projects} tasks={data.tasks} actionMode={actionMode} actionDraft={actionDraft} busy={busy} developmentPreview={developmentPreview} onChange={setDraft} onActionChange={setActionDraft} onOpenAction={openAction} onRunAction={() => void runAction()} onSave={() => void saveDraft()} onStatus={(status) => void changeStatus(status)} onClose={() => { setDraft(null); setSelectedId(null); setActionMode(null); }} /> : <EmptyDetail onCapture={startCapture} />}
    </div>
  </div>;
}

function InboxRow({ item, selected, onSelect }: { item: InboxItemRecord; selected: boolean; onSelect: () => void }) {
  const linked = item.linkedProjectName || item.linkedTaskTitle || item.linkedNoteTitle;
  return <button type="button" onClick={onSelect} aria-current={selected ? "true" : undefined} className={cn("grid w-full gap-2 px-4 py-3 text-left hover:bg-accent/35 md:grid-cols-[minmax(0,1fr)_94px_86px_100px] md:items-center", selected && "bg-accent/40")}><span className="min-w-0"><span className="flex items-center gap-2"><span className="grid size-7 shrink-0 place-items-center rounded-lg bg-muted text-[11px] font-semibold text-muted-foreground"><Inbox className="size-3.5" /></span><span className="min-w-0 truncate text-[13px] font-medium">{item.title}</span></span><span className="mt-1 block truncate pl-9 text-[11px] text-muted-foreground">{item.source.replaceAll("_", " ")}{item.detectedProjectName ? " · " + item.detectedProjectName : linked ? " · " + linked : ""}</span></span><span className="text-xs capitalize text-muted-foreground">{item.source.replaceAll("_", " ")}</span><Badge variant={priorityVariant(item.priority)}>{priorityLabels[item.priority]}</Badge><Badge variant={statusVariant(item.status)}>{statusLabels[item.status]}</Badge></button>;
}

function InboxDetail({ draft, selected, projects, tasks, actionMode, actionDraft, busy, developmentPreview, onChange, onActionChange, onOpenAction, onRunAction, onSave, onStatus, onClose }: { draft: Draft; selected: InboxItemRecord | null; projects: InboxPageData["projects"]; tasks: InboxPageData["tasks"]; actionMode: ActionMode; actionDraft: ActionDraft; busy: boolean; developmentPreview: boolean; onChange: (draft: Draft) => void; onActionChange: (draft: ActionDraft) => void; onOpenAction: (mode: ActionMode) => void; onRunAction: () => void; onSave: () => void; onStatus: (status: InboxStatus) => void; onClose: () => void }) {
  const canProcess = Boolean(selected && selected.status !== "converted" && selected.status !== "archived" && selected.status !== "ignored");
  return <aside className="soft-panel rounded-xl border soft-divider bg-card"><div className="flex items-start justify-between gap-3 border-b soft-divider px-5 py-3"><div><p className="text-[11px] text-muted-foreground">{draft.id ? "Selected item" : "New capture"}</p><h2 className="mt-1 text-base font-semibold">{draft.id ? "Inbox detail" : "Capture item"}</h2></div><button type="button" aria-label="Close inbox detail" onClick={onClose} disabled={busy} className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"><X className="size-4" /></button></div><div className="space-y-4 px-5 py-5"><label className="block"><span className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Title</span><input autoFocus={!draft.id} value={draft.title} onChange={(event) => onChange({ ...draft, title: event.target.value })} className="mt-1.5 h-10 w-full rounded-lg border soft-divider bg-input px-3 text-sm font-semibold outline-none focus:border-ring" placeholder="Waitlist result, project link, reminder..." /></label><div className="grid gap-3 sm:grid-cols-2"><AppSelect label="Priority" value={draft.priority ?? "medium"} options={INBOX_PRIORITIES.map((priority) => ({ value: priority, label: priorityLabels[priority] }))} onChange={(value) => onChange({ ...draft, priority: value as InboxPriority })} /><label className="block"><span className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Detected project</span><input value={draft.detectedProjectName ?? ""} onChange={(event) => onChange({ ...draft, detectedProjectName: event.target.value })} className="mt-1.5 h-8 w-full rounded-full border soft-divider bg-input px-3 text-xs outline-none focus:border-ring" placeholder="Optional project name" /></label></div><label className="block"><span className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Source URL</span><div className="mt-1.5 flex items-center gap-2"><input value={draft.url ?? ""} onChange={(event) => onChange({ ...draft, url: event.target.value })} className="h-9 min-w-0 flex-1 rounded-lg border soft-divider bg-input px-3 text-xs outline-none focus:border-ring" placeholder="example.com or https://example.com" />{draft.url && isHttpUrl(draft.url) ? <a href={draft.url} target="_blank" rel="noreferrer" aria-label="Open source URL" className="grid size-9 place-items-center rounded-lg border soft-divider text-muted-foreground hover:bg-accent hover:text-foreground"><ArrowUpRight className="size-4" /></a> : null}</div></label><label className="block"><span className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Sender or source label</span><input value={draft.sender ?? ""} onChange={(event) => onChange({ ...draft, sender: event.target.value })} className="mt-1.5 h-9 w-full rounded-lg border soft-divider bg-input px-3 text-xs outline-none focus:border-ring" placeholder="Optional sender, account, or channel" /></label><label className="block"><span className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Content</span><textarea value={draft.content ?? ""} onChange={(event) => onChange({ ...draft, content: event.target.value })} className="mt-1.5 min-h-32 w-full resize-y rounded-lg border soft-divider bg-input px-3 py-2 text-xs leading-5 outline-none focus:border-ring" placeholder="Paste the raw note, result, reminder, or context here..." /></label>{selected ? <div className="rounded-lg border soft-divider bg-muted/35 p-3"><div className="flex flex-wrap items-center gap-2"><Badge variant={statusVariant(selected.status)}>{statusLabels[selected.status]}</Badge><span className="text-[11px] text-muted-foreground">{selected.receivedAt ? "Received " + formatDate(selected.receivedAt) : "Captured " + formatDate(selected.createdAt)}</span></div>{selected.linkedProjectName || selected.linkedTaskTitle || selected.linkedNoteTitle ? <p className="mt-2 text-xs text-muted-foreground">Linked to {selected.linkedProjectName || selected.linkedTaskTitle || selected.linkedNoteTitle}</p> : null}</div> : null}{selected && canProcess ? <ProcessingPanel mode={actionMode} actionDraft={actionDraft} projects={projects} tasks={tasks} busy={busy || developmentPreview} onOpenAction={onOpenAction} onActionChange={onActionChange} onRunAction={onRunAction} /> : null}</div><div className="flex flex-wrap items-center justify-between gap-3 border-t soft-divider bg-card/95 px-5 py-3">{selected ? <div className="flex flex-wrap gap-2"><Button variant="ghost" size="sm" disabled={busy || developmentPreview} onClick={() => onStatus("reviewing")}>Review</Button><Button variant="ghost" size="sm" disabled={busy || developmentPreview} onClick={() => onStatus("ignored")}><CheckCircle2 className="size-3.5" />Ignore</Button><Button variant="ghost" size="sm" disabled={busy || developmentPreview} onClick={() => onStatus("archived")}><Archive className="size-3.5" />Archive</Button></div> : <span />}{selected?.status === "converted" ? <span className="text-xs text-success">Converted</span> : null}<Button size="sm" disabled={busy || developmentPreview || !draft.title.trim()} onClick={onSave}>{busy ? "Saving..." : draft.id ? "Save changes" : "Save item"}</Button></div></aside>;
}

function ProcessingPanel({ mode, actionDraft, projects, tasks, busy, onOpenAction, onActionChange, onRunAction }: { mode: ActionMode; actionDraft: ActionDraft; projects: InboxPageData["projects"]; tasks: InboxPageData["tasks"]; busy: boolean; onOpenAction: (mode: ActionMode) => void; onActionChange: (draft: ActionDraft) => void; onRunAction: () => void }) {
  return <section className="border-t soft-divider pt-4"><div className="flex items-center gap-2"><SlidersHorizontal className="size-3.5 text-muted-foreground" /><p className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Process with confirmation</p></div><div className="mt-2 grid gap-2 sm:grid-cols-2"><Button variant="secondary" size="sm" disabled={busy} onClick={() => onOpenAction("project")}><Plus />Create project</Button><Button variant="secondary" size="sm" disabled={busy} onClick={() => onOpenAction("task")}><ClipboardList />Create task</Button><Button variant="secondary" size="sm" disabled={busy} onClick={() => onOpenAction("note")}><FileText />Save to Docs</Button><Button variant="secondary" size="sm" disabled={busy} onClick={() => onOpenAction("link-project")}><Link2 />Link project</Button><Button variant="secondary" size="sm" disabled={busy} onClick={() => onOpenAction("link-task")}><Link2 />Link task</Button></div>{mode ? <div className="mt-3 space-y-3 rounded-lg border soft-divider bg-muted/30 p-3">{mode === "project" ? <label className="block"><span className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Project name</span><input value={actionDraft.projectName} placeholder="Project name" onChange={(event) => onActionChange({ ...actionDraft, projectName: event.target.value })} className="mt-1.5 h-9 w-full rounded-lg border soft-divider bg-input px-3 text-xs outline-none focus:border-ring" /></label> : null}{mode === "task" ? <><label className="block"><span className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Task title</span><input value={actionDraft.taskTitle} placeholder="Task title" onChange={(event) => onActionChange({ ...actionDraft, taskTitle: event.target.value })} className="mt-1.5 h-9 w-full rounded-lg border soft-divider bg-input px-3 text-xs outline-none focus:border-ring" /></label><AppSelect label="Project" value={actionDraft.projectId} options={projects.map((project) => ({ value: project.id, label: project.name }))} onChange={(value) => onActionChange({ ...actionDraft, projectId: value })} /></> : null}{mode === "note" ? <><label className="block"><span className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Doc title</span><input value={actionDraft.taskTitle} placeholder="Document title" onChange={(event) => onActionChange({ ...actionDraft, taskTitle: event.target.value })} className="mt-1.5 h-9 w-full rounded-lg border soft-divider bg-input px-3 text-xs outline-none focus:border-ring" /></label><AppSelect label="Linked project" value={actionDraft.linkedProjectId} options={[{ value: "", label: "No project" }, ...projects.map((project) => ({ value: project.id, label: project.name }))]} onChange={(value) => onActionChange({ ...actionDraft, linkedProjectId: value })} /></> : null}{mode === "link-project" ? <AppSelect label="Project" value={actionDraft.linkedProjectId} options={projects.map((project) => ({ value: project.id, label: project.name }))} onChange={(value) => onActionChange({ ...actionDraft, linkedProjectId: value })} /> : null}{mode === "link-task" ? <AppSelect label="Task" value={actionDraft.projectId} options={tasks.map((task) => ({ value: task.id, label: task.title + " · " + task.projectName }))} onChange={(value) => onActionChange({ ...actionDraft, projectId: value })} /> : null}<Button size="sm" disabled={busy || (mode === "project" && !actionDraft.projectName.trim()) || (mode === "task" && !actionDraft.projectId) || (mode === "note" && !actionDraft.taskTitle.trim()) || (mode === "link-project" && !actionDraft.linkedProjectId) || (mode === "link-task" && !actionDraft.projectId)} onClick={onRunAction}>{mode === "project" ? "Create project" : mode === "task" ? "Create task" : mode === "note" ? "Save to Docs" : "Confirm link"}</Button></div> : null}</section>;
}

function EmptyCopy({ children }: { children: string }) { return <p className="px-4 py-7 text-center text-xs text-muted-foreground">{children}</p>; }
function EmptyDetail({ onCapture }: { onCapture: () => void }) { return <aside className="soft-panel rounded-xl border soft-divider bg-card p-5"><p className="text-[11px] text-muted-foreground">Inbox detail</p><h2 className="mt-1 text-base font-semibold">Select an item to process it</h2><p className="mt-2 text-xs leading-5 text-muted-foreground">Keep raw input here until you know whether it belongs in Projects, Tasks, or Docs.</p><Button className="mt-4" size="sm" onClick={onCapture}><Plus />Capture item</Button></aside>; }
function formatDate(value: string | null) { return value ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "Asia/Jakarta" }).format(new Date(value)) : "now"; }
