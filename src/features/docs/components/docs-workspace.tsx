"use client";

import { FileText, Folder, Plus, Search, ShieldCheck, Star, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { AppSelect } from "@/components/ui/app-select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createDocsNote, deleteDocsNote, updateDocsNote } from "@/features/docs/actions";
import { NOTE_FOLDERS, NOTE_TYPES, type DocsNoteInput, type DocsNoteRecord, type DocsPageData, type NoteFolder } from "@/features/docs/docs-types";
import { cn } from "@/lib/utils";
import { usePresence } from "@/lib/use-presence";

type Draft = DocsNoteInput & { id?: string };

function newDraft(): Draft {
  return { title: "", content: "", noteType: "general", folder: null, pinned: false, linkedProjectId: null };
}

export function DocsWorkspace({ initialData, developmentPreview = false }: { initialData: DocsPageData; developmentPreview?: boolean }) {
  const [notes, setNotes] = useState(initialData.notes);
  const [query, setQuery] = useState("");
  const [folder, setFolder] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const filteredNotes = useMemo(() => {
    const search = query.trim().toLowerCase();
    return notes.filter((note) => (!folder || note.folder === folder) && (!search || [note.title, note.content, note.noteType, note.folder ?? "", note.linkedProjectName ?? ""].join(" ").toLowerCase().includes(search)));
  }, [folder, notes, query]);
  const pinned = filteredNotes.filter((note) => note.pinned);
  const recent = filteredNotes.filter((note) => !note.pinned).slice(0, 8);

  function openNote(note: DocsNoteRecord) {
    setError(null);
    setDraft({ id: note.id, title: note.title, content: note.content, noteType: note.noteType, folder: note.folder, pinned: note.pinned, linkedProjectId: note.linkedProjectId });
  }

  async function save() {
    if (!draft || developmentPreview || busy) return;
    setBusy(true);
    setError(null);
    try {
      const { id, ...input } = draft;
      const saved = id ? await updateDocsNote(id, input) : await createDocsNote(input);
      setNotes((current) => sortNotes(id ? current.map((note) => note.id === saved.id ? saved : note) : [saved, ...current]));
      setDraft({ id: saved.id, title: saved.title, content: saved.content, noteType: saved.noteType, folder: saved.folder, pinned: saved.pinned, linkedProjectId: saved.linkedProjectId });
    } catch (error) {
      setError(error instanceof Error ? error.message : "Document could not be saved");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!draft?.id || developmentPreview || busy) return;
    setBusy(true);
    setError(null);
    try {
      await deleteDocsNote(draft.id);
      setNotes((current) => current.filter((note) => note.id !== draft.id));
      setDraft(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Document could not be deleted");
    } finally {
      setBusy(false);
    }
  }

  return <div className="px-4 py-4 sm:px-5 lg:px-6 lg:py-5">
    <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs text-muted-foreground">Docs · Knowledge library</p><h1 className="font-display mt-1 text-2xl font-semibold tracking-[-0.025em]">Docs</h1></div><Button size="sm" disabled={developmentPreview} onClick={() => { setError(null); setDraft(newDraft()); }}><Plus />New doc</Button></header>
    <section className="soft-panel mt-4 grid gap-2 rounded-xl border soft-divider bg-card p-2 lg:grid-cols-[minmax(0,1fr)_180px]"><div className="soft-inset flex min-w-0 items-center gap-3 rounded-lg border soft-divider bg-input px-3 py-2.5"><Search className="size-4 text-muted-foreground" /><input aria-label="Search docs" value={query} onChange={(event) => setQuery(event.target.value)} className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-muted-foreground" placeholder="Search docs, folders, project references, or safe metadata..." /></div><AppSelect ariaLabel="Filter docs by folder" value={folder} options={[{ value: "", label: "All folders" }, ...NOTE_FOLDERS.map((item) => ({ value: item, label: item }))]} onChange={setFolder} /></section>
    {developmentPreview ? <p className="mt-4 rounded-lg bg-info/10 px-3 py-2 text-xs text-info">Preview mode uses no persisted Docs. Configure Supabase to create and edit documents.</p> : null}
    {error ? <p role="alert" className="mt-4 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p> : null}
    <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]"><main className="space-y-4"><section className="soft-panel overflow-hidden rounded-xl border soft-divider bg-card"><div className="flex items-center justify-between gap-3 border-b soft-divider px-4 py-3"><div className="flex items-center gap-2.5"><span className="grid size-8 place-items-center rounded-lg border soft-divider bg-muted text-muted-foreground"><Star className="size-4" /></span><h2 className="text-sm font-semibold">Pinned docs</h2></div><Badge variant="secondary">{pinned.length} pinned</Badge></div>{pinned.length ? <div className="grid gap-2 p-3 md:grid-cols-3">{pinned.map((note) => <PinnedNote key={note.id} note={note} onOpen={() => openNote(note)} />)}</div> : <EmptyCopy>No pinned docs yet.</EmptyCopy>}</section><section className="soft-panel rounded-xl border soft-divider bg-card p-4"><h2 className="text-sm font-semibold">Folders</h2><div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{NOTE_FOLDERS.map((name) => <button type="button" key={name} onClick={() => setFolder(folder === name ? "" : name)} className={cn("flex items-center gap-3 rounded-lg border soft-divider bg-muted/40 p-3 text-left hover:bg-accent/45", folder === name && "ring-1 ring-ring")}><span className="soft-inset grid size-10 shrink-0 place-items-center rounded-lg bg-background text-muted-foreground"><Folder className="size-5" /></span><span className="min-w-0 flex-1"><span className="block truncate text-[13px] font-medium">{name}</span><span className="mt-0.5 block truncate text-[11px] text-muted-foreground">{folderMeta(name)}</span></span><span className="rounded-md border soft-divider bg-card px-2 py-1 text-[11px] tabular-nums text-muted-foreground">{notes.filter((note) => note.folder === name).length}</span></button>)}</div></section></main><aside className="space-y-4"><section className="soft-panel rounded-xl border soft-divider bg-card p-4"><div className="flex items-start gap-3"><span className="grid size-9 place-items-center rounded-lg border soft-divider bg-muted text-muted-foreground"><ShieldCheck className="size-4" /></span><div><h2 className="text-sm font-semibold">Safe access metadata only</h2><p className="mt-1 text-xs leading-5 text-muted-foreground">Store login URL, account label, username or email, and where a password is stored. Never store raw passwords, seed phrases, private keys, recovery phrases, or 2FA backup codes.</p></div></div></section><section className="soft-panel overflow-hidden rounded-xl border soft-divider bg-card"><div className="border-b soft-divider px-4 py-3"><h2 className="text-sm font-semibold">Recent docs</h2></div><div className="divide-y divide-white/[0.045]">{recent.length ? recent.map((note) => <RecentNote key={note.id} note={note} onOpen={() => openNote(note)} />) : <EmptyCopy>No documents match this filter.</EmptyCopy>}</div></section></aside></div>
    <DocEditor key={draft?.id ?? "empty"} draft={draft} projects={initialData.projects} busy={busy} developmentPreview={developmentPreview} onClose={() => setDraft(null)} onChange={setDraft} onSave={() => void save()} onDelete={() => void remove()} />
  </div>;
}

function PinnedNote({ note, onOpen }: { note: DocsNoteRecord; onOpen: () => void }) { return <button type="button" onClick={onOpen} className="rounded-lg border soft-divider bg-muted/45 p-3 text-left hover:bg-accent/45"><span className="flex items-center gap-2"><span className="grid size-8 place-items-center rounded-lg bg-background text-muted-foreground"><FileText className="size-4" /></span><span className="min-w-0"><span className="block truncate text-[13px] font-medium">{note.title}</span><span className="mt-0.5 block truncate text-[11px] text-muted-foreground">{note.folder ?? "Unfiled"}</span></span></span><span className="mt-3 block line-clamp-2 text-xs leading-5 text-muted-foreground">{note.content || "No content yet."}</span></button>; }
function RecentNote({ note, onOpen }: { note: DocsNoteRecord; onOpen: () => void }) { return <button type="button" onClick={onOpen} className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 text-left hover:bg-accent/35"><FileText className="size-4 text-muted-foreground" /><span className="min-w-0"><span className="block truncate text-xs font-medium">{note.title}</span><span className="mt-0.5 block truncate text-[11px] text-muted-foreground">{note.folder ?? "Unfiled"}{note.linkedProjectName ? " · " + note.linkedProjectName : ""}</span></span><span className="text-[10px] text-muted-foreground">{relativeTime(note.updatedAt)}</span></button>; }
function EmptyCopy({ children }: { children: React.ReactNode }) { return <p className="px-4 py-7 text-center text-xs text-muted-foreground">{children}</p>; }

function DocEditor({ draft: draftProp, projects, busy, developmentPreview, onClose, onChange, onSave, onDelete }: { draft: Draft | null; projects: DocsPageData["projects"]; busy: boolean; developmentPreview: boolean; onClose: () => void; onChange: (draft: Draft) => void; onSave: () => void; onDelete: () => void }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const lastDraft = useRef<Draft | null>(draftProp);
  useEffect(() => {
    if (draftProp) lastDraft.current = draftProp;
  }, [draftProp]);
  const { mounted, closing } = usePresence(Boolean(draftProp), 260);
  if (!mounted) return null;
  const draft = draftProp ?? lastDraft.current;
  if (!draft) return null;
  return <div className={cn("fixed inset-0 z-50 flex justify-end bg-black/35 backdrop-blur-[2px]", closing ? "drawer-backdrop-out" : "drawer-backdrop-in")} role="dialog" aria-modal="true" aria-labelledby="doc-editor-title" onClick={() => !busy && onClose()}><aside className={cn("flex h-full w-full max-w-[620px] flex-col border-l soft-divider bg-card shadow-2xl shadow-black/50", closing ? "drawer-panel-out" : "drawer-panel-in")} onClick={(event) => event.stopPropagation()}><div className="flex items-center justify-between border-b soft-divider px-5 py-3"><div><h2 id="doc-editor-title" className="text-base font-semibold">{draft.id ? "Edit doc" : "New doc"}</h2><p className="mt-0.5 text-[11px] text-muted-foreground">Markdown textarea supported</p></div><button type="button" disabled={busy} onClick={onClose} className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"><X className="size-4" /></button></div><div className="scrollbar-subtle flex-1 space-y-4 overflow-y-auto px-5 py-5"><label className="block"><span className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Title</span><input autoFocus value={draft.title} onChange={(event) => onChange({ ...draft, title: event.target.value })} className="mt-1.5 h-10 w-full rounded-lg border soft-divider bg-input px-3 text-sm font-semibold outline-none focus:border-ring" placeholder="Document title" /></label><div className="grid gap-3 sm:grid-cols-2"><AppSelect label="Folder" value={draft.folder ?? ""} options={[{ value: "", label: "Unfiled" }, ...NOTE_FOLDERS.map((item) => ({ value: item, label: item }))]} onChange={(value) => onChange({ ...draft, folder: (value || null) as NoteFolder | null })} /><AppSelect label="Type" value={draft.noteType ?? "general"} options={NOTE_TYPES.map((item) => ({ value: item, label: item.replaceAll("_", " ") }))} onChange={(value) => onChange({ ...draft, noteType: value as Draft["noteType"] })} /><AppSelect label="Linked project" value={draft.linkedProjectId ?? ""} options={[{ value: "", label: "No project" }, ...projects.map((project) => ({ value: project.id, label: project.name }))]} onChange={(value) => onChange({ ...draft, linkedProjectId: value || null })} /><button type="button" onClick={() => onChange({ ...draft, pinned: !draft.pinned })} className={cn("mt-5 h-9 rounded-lg border px-3 text-xs font-medium", draft.pinned ? "border-warning/30 bg-warning/10 text-warning" : "soft-divider bg-input text-muted-foreground hover:text-foreground")}><Star className="mr-1 inline size-3.5" />{draft.pinned ? "Pinned" : "Pin document"}</button></div><label className="block"><span className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Content</span><textarea value={draft.content ?? ""} onChange={(event) => onChange({ ...draft, content: event.target.value })} className="mt-1.5 min-h-80 w-full resize-y rounded-lg border soft-divider bg-input px-3 py-3 font-mono text-xs leading-6 outline-none focus:border-ring" placeholder="Write Markdown, research notes, links, setup instructions, or safe access metadata..." /></label></div><div className="flex flex-wrap items-center justify-between gap-3 border-t soft-divider bg-card/95 px-5 py-3">{draft.id ? confirmDelete ? <div className="flex items-center gap-2"><span className="text-xs text-muted-foreground">Delete permanently?</span><Button variant="destructive" size="sm" disabled={busy || developmentPreview} onClick={onDelete}>Confirm</Button><Button variant="ghost" size="sm" disabled={busy} onClick={() => setConfirmDelete(false)}>Cancel</Button></div> : <Button variant="ghost" size="sm" disabled={busy || developmentPreview} onClick={() => setConfirmDelete(true)} className="text-destructive hover:text-destructive"><Trash2 className="size-3.5" />Delete</Button> : <span />}{developmentPreview ? <span className="text-xs text-muted-foreground">Preview only</span> : null}<Button size="sm" disabled={busy || developmentPreview || !draft.title.trim()} onClick={onSave}>{busy ? "Saving..." : "Save doc"}</Button></div></aside></div>;
}

function sortNotes(notes: DocsNoteRecord[]) { return [...notes].sort((a, b) => Number(b.pinned) - Number(a.pinned) || (b.updatedAt ?? "").localeCompare(a.updatedAt ?? "")); }
function relativeTime(value: string | null) { if (!value) return "Now"; const minutes = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 60000)); return minutes < 1 ? "Now" : minutes < 60 ? minutes + "m" : minutes < 1440 ? Math.round(minutes / 60) + "h" : Math.round(minutes / 1440) + "d"; }
function folderMeta(folder: NoteFolder) { return { "Research": "Protocol notes and findings", "Tools & Links": "Dashboards, explorers, docs", "Guides / SOP": "Repeatable workflows", "Project References": "Setup and campaign notes", "Accounts & Access": "Safe access metadata only", "Templates": "Reusable tracking formats", "Personal Notes": "Strategy and reminders" }[folder]; }
