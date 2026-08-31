"use client";

import { FileText, Folder, FolderPlus, Inbox, Pencil, Plus, Search, Star, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { CornerToast, type CornerToastNotice } from "@/components/shared/corner-toast";
import { AppSelect } from "@/components/ui/app-select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDocsMutations, useDocsWorkspace } from "@/features/docs/docs-query";
import { NOTE_TYPES, type DocsFolderInput, type DocsNoteInput, type DocsNoteRecord, type DocsPageData, type NoteFolder } from "@/features/docs/docs-types";
import { cn } from "@/lib/utils";
import { usePresence } from "@/lib/use-presence";

type Draft = DocsNoteInput & { id?: string };
type FolderDraft = DocsFolderInput & { id?: string; originalName?: string };

const UNFILED_FOLDER = "__unfiled";

function newDraft(folder: string | null = null): Draft {
  return { title: "", content: "", noteType: "general", folder, pinned: false, linkedProjectId: null };
}

export function DocsWorkspace({ initialData, developmentPreview = false }: { initialData: DocsPageData; developmentPreview?: boolean }) {
  const { data: queryData } = useDocsWorkspace(initialData, developmentPreview);
  const workspace = queryData ?? initialData;
  const notes = workspace.notes;
  const folders = workspace.folders;
  const [query, setQuery] = useState("");
  const [folder, setFolder] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [folderDraft, setFolderDraft] = useState<FolderDraft | null>(null);
  const [notice, setNotice] = useState<CornerToastNotice | null>(null);
  const mutations = useDocsMutations({
    developmentPreview,
    onError: (message) => showNotice("error", "Action failed", message),
  });
  const busy = mutations.saveNoteMutation.isPending || mutations.deleteNoteMutation.isPending;
  const folderBusy = mutations.createFolderMutation.isPending || mutations.updateFolderMutation.isPending || mutations.deleteFolderMutation.isPending;
  const activeFolder = folders.find((item) => item.name === folder) ?? null;
  const unfiledCount = notes.filter((note) => !note.folder).length;
  const folderCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const note of notes) {
      if (!note.folder) continue;
      counts.set(note.folder, (counts.get(note.folder) ?? 0) + 1);
    }
    return counts;
  }, [notes]);
  const filteredNotes = useMemo(() => {
    const search = query.trim().toLowerCase();
    return notes.filter((note) => {
      const matchesFolder = folder === UNFILED_FOLDER
        ? !note.folder
        : !folder || note.folder === folder;
      const matchesSearch = !search || [note.title, note.content, note.noteType, note.folder ?? "", note.linkedProjectName ?? ""].join(" ").toLowerCase().includes(search);
      return matchesFolder && matchesSearch;
    });
  }, [folder, notes, query]);
  const pinned = filteredNotes.filter((note) => note.pinned);
  const regular = filteredNotes.filter((note) => !note.pinned);
  const recent = useMemo(() => [...notes]
    .sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""))
    .slice(0, 8), [notes]);
  const selectedTitle = activeFolder?.name ?? (folder === UNFILED_FOLDER ? "Unfiled" : "All docs");
  const createFolder = folder && folder !== UNFILED_FOLDER ? folder : null;

  function showNotice(tone: CornerToastNotice["tone"], title: string, message?: string) {
    setNotice({ id: Date.now(), tone, title, message });
  }

  const clearNotice = useCallback(() => {
    setNotice(null);
  }, []);

  function openNote(note: DocsNoteRecord) {
    clearNotice();
    setDraft({ id: note.id, title: note.title, content: note.content, noteType: note.noteType, folder: note.folder, pinned: note.pinned, linkedProjectId: note.linkedProjectId });
  }

  async function save() {
    if (!draft || developmentPreview || busy) return;
    clearNotice();
    const { id, ...input } = draft;
    try {
      const saved = await mutations.saveNoteMutation.mutateAsync({ id, input });
      setDraft({ id: saved.id, title: saved.title, content: saved.content, noteType: saved.noteType, folder: saved.folder, pinned: saved.pinned, linkedProjectId: saved.linkedProjectId });
    } catch {
      // Failure is surfaced through the corner toast.
    }
  }

  async function remove() {
    if (!draft?.id || developmentPreview || busy) return;
    clearNotice();
    try {
      await mutations.deleteNoteMutation.mutateAsync(draft.id);
      setDraft(null);
    } catch {
      // Failure is surfaced through the corner toast.
    }
  }

  async function saveFolder() {
    if (!folderDraft || developmentPreview || folderBusy) return;
    clearNotice();
    try {
      if (folderDraft.id) {
        const saved = await mutations.updateFolderMutation.mutateAsync({ id: folderDraft.id, input: { name: folderDraft.name, description: folderDraft.description } });
        if (folder === saved.previousName) setFolder(saved.folder.name);
      } else {
        const saved = await mutations.createFolderMutation.mutateAsync({ name: folderDraft.name, description: folderDraft.description });
        setFolder(saved.name);
      }
      setFolderDraft(null);
    } catch {
      // Failure is surfaced through the corner toast.
    }
  }

  async function deleteFolder() {
    if (!folderDraft?.id || developmentPreview || folderBusy) return;
    clearNotice();
    const deletedName = folderDraft.originalName ?? folderDraft.name;
    try {
      await mutations.deleteFolderMutation.mutateAsync(folderDraft.id);
      if (folder === deletedName) setFolder("");
      setFolderDraft(null);
    } catch {
      // Failure is surfaced through the corner toast.
    }
  }

  return <div className="px-4 py-4 sm:px-5 lg:px-6 lg:py-5">
    <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-xs text-muted-foreground">Docs · Knowledge library</p>
        <h1 className="font-display mt-1 text-2xl font-semibold tracking-[-0.025em]">Docs</h1>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" disabled={developmentPreview} onClick={() => { clearNotice(); setFolderDraft({ name: "", description: "" }); }}><FolderPlus className="size-4" />New folder</Button>
        <Button size="sm" disabled={developmentPreview} onClick={() => { clearNotice(); setDraft(newDraft(createFolder)); }}><Plus />New doc</Button>
      </div>
    </header>

    <section className="soft-panel mt-4 rounded-xl border soft-divider bg-card p-2">
      <div className="soft-inset flex min-w-0 items-center gap-3 rounded-lg border soft-divider bg-input px-3 py-2.5">
        <Search className="size-4 text-muted-foreground" />
        <input aria-label="Search docs" value={query} onChange={(event) => setQuery(event.target.value)} className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-muted-foreground" placeholder="Search docs, folders, project references, or links..." />
      </div>
    </section>
    {developmentPreview ? <p className="mt-4 rounded-lg bg-info/10 px-3 py-2 text-xs text-info">Preview mode uses no persisted Docs. Configure Supabase to create and edit documents.</p> : null}
    <CornerToast notice={notice} onClose={clearNotice} />

    <section className="soft-panel mt-4 grid min-h-[560px] overflow-hidden rounded-xl border soft-divider bg-card xl:min-h-[calc(100vh-238px)] xl:grid-cols-[260px_minmax(0,1fr)_320px]">
      <aside className="border-b border-white/[0.035] bg-muted/10 xl:border-b-0 xl:border-r xl:border-white/[0.035]">
        <div className="flex min-h-[58px] items-center justify-between gap-3 border-b border-white/[0.035] px-4 py-3">
          <h2 className="text-sm font-semibold">Folders</h2>
          <Badge variant="secondary">{folders.length}</Badge>
        </div>
        <div className="scrollbar-subtle max-h-[320px] space-y-1 overflow-y-auto p-2 xl:max-h-[calc(100vh-238px)]">
          <FolderNavItem icon="inbox" label="All docs" count={notes.length} active={!folder} onSelect={() => setFolder("")} />
          <FolderNavItem icon="folder" label="Unfiled" count={unfiledCount} active={folder === UNFILED_FOLDER} onSelect={() => setFolder(UNFILED_FOLDER)} />
          <div className="my-2 border-t border-white/[0.035]" />
          {folders.map((item) => <FolderNavItem key={item.id} label={item.name} count={folderCounts.get(item.name) ?? 0} active={folder === item.name} onSelect={() => setFolder(item.name)} onEdit={() => { clearNotice(); setFolderDraft({ id: item.id, originalName: item.name, name: item.name, description: item.description ?? "" }); }} />)}
        </div>
      </aside>

      <main className="min-w-0">
        <div className="flex min-h-[58px] flex-wrap items-center justify-between gap-3 border-b border-white/[0.035] px-4 py-3">
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold">{selectedTitle}</h2>
          </div>
          <div className="flex items-center gap-2">
            {folder ? <button type="button" onClick={() => setFolder("")} className="text-xs text-muted-foreground hover:text-foreground">All docs</button> : null}
            <Badge variant="secondary">{filteredNotes.length} docs</Badge>
          </div>
        </div>
        <div className="scrollbar-subtle max-h-[560px] overflow-y-auto xl:max-h-[calc(100vh-238px)]">
          {pinned.length ? <div className="border-b border-white/[0.035]">
            <div className="flex items-center gap-2 px-4 py-2 text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground"><Star className="size-3.5" />Pinned</div>
            <div className="divide-y divide-white/[0.03]">{pinned.map((note) => <DocRow key={note.id} note={note} onOpen={() => openNote(note)} pinned />)}</div>
          </div> : null}
          {regular.length ? <div className="divide-y divide-white/[0.03]">{regular.map((note) => <DocRow key={note.id} note={note} onOpen={() => openNote(note)} />)}</div> : pinned.length ? null : <EmptyCopy>No documents match this folder.</EmptyCopy>}
        </div>
      </main>

      <aside className="border-t border-white/[0.035] bg-muted/10 xl:border-l xl:border-t-0 xl:border-white/[0.035]">
        <div className="flex min-h-[58px] items-center border-b border-white/[0.035] px-4 py-3"><h2 className="text-sm font-semibold">Recent docs</h2></div>
        <div className="divide-y divide-white/[0.03]">{recent.length ? recent.map((note) => <RecentNote key={note.id} note={note} onOpen={() => openNote(note)} />) : <EmptyCopy>No recent docs yet.</EmptyCopy>}</div>
      </aside>
    </section>

    <DocEditor key={draft?.id ?? "empty"} draft={draft} projects={workspace.projects} folders={folders} busy={busy} developmentPreview={developmentPreview} onClose={() => setDraft(null)} onChange={setDraft} onSave={() => void save()} onDelete={() => void remove()} />
    <FolderEditor draft={folderDraft} noteCount={folderDraft?.id ? (folderCounts.get(folderDraft.originalName ?? folderDraft.name) ?? 0) : 0} busy={folderBusy} developmentPreview={developmentPreview} onClose={() => setFolderDraft(null)} onChange={setFolderDraft} onSave={() => void saveFolder()} onDelete={() => void deleteFolder()} />
  </div>;
}

function FolderNavItem({ icon = "folder", label, count, active, onSelect, onEdit }: { icon?: "folder" | "inbox"; label: string; count: number; active: boolean; onSelect: () => void; onEdit?: () => void }) {
  const Icon = icon === "inbox" ? Inbox : Folder;
  return <div className={cn("group flex items-center gap-1 rounded-lg", active && "bg-accent/55")}>
    <button type="button" onClick={onSelect} className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2 py-2 text-left hover:bg-accent/30">
      <span className={cn("grid size-8 shrink-0 place-items-center rounded-md border border-white/[0.045] bg-background text-muted-foreground", active && "text-foreground")}><Icon className="size-4" /></span>
      <span className="min-w-0 flex-1 truncate text-xs font-medium">{label}</span>
      <span className="rounded-md border border-white/[0.04] bg-card px-1.5 py-0.5 text-[10px] tabular-nums text-muted-foreground">{count}</span>
    </button>
    {onEdit ? <button type="button" onClick={onEdit} className="mr-1 grid size-7 shrink-0 place-items-center rounded-md text-muted-foreground opacity-100 hover:bg-white/[0.06] hover:text-foreground sm:opacity-0 sm:group-hover:opacity-100" aria-label={"Edit " + label + " folder"}><Pencil className="size-3.5" /></button> : null}
  </div>;
}

function noteMeta(note: DocsNoteRecord) {
  return [note.folder ?? "Unfiled", note.linkedProjectName].filter(Boolean).join(" · ");
}

function DocRow({ note, onOpen, pinned = false }: { note: DocsNoteRecord; onOpen: () => void; pinned?: boolean }) {
  return <button type="button" onClick={onOpen} className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 text-left hover:bg-accent/25">
    <span className="grid size-9 place-items-center rounded-lg bg-background text-muted-foreground"><FileText className="size-4" /></span>
    <span className="min-w-0">
      <span className="flex min-w-0 items-center gap-2"><span className="truncate text-sm font-medium">{note.title}</span>{pinned ? <Star className="size-3 shrink-0 text-warning" /> : null}</span>
      <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">{noteMeta(note)}</span>
    </span>
    <span className="text-[10px] text-muted-foreground">{relativeTime(note.updatedAt)}</span>
  </button>;
}

function RecentNote({ note, onOpen }: { note: DocsNoteRecord; onOpen: () => void }) {
  return <button type="button" onClick={onOpen} className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 text-left hover:bg-accent/25">
    <FileText className="size-4 text-muted-foreground" />
    <span className="min-w-0"><span className="block truncate text-xs font-medium">{note.title}</span><span className="mt-0.5 block truncate text-[11px] text-muted-foreground">{noteMeta(note)}</span></span>
    <span className="text-[10px] text-muted-foreground">{relativeTime(note.updatedAt)}</span>
  </button>;
}

function EmptyCopy({ children }: { children: React.ReactNode }) { return <p className="px-4 py-7 text-center text-xs text-muted-foreground">{children}</p>; }

function DocEditor({ draft: draftProp, projects, folders, busy, developmentPreview, onClose, onChange, onSave, onDelete }: { draft: Draft | null; projects: DocsPageData["projects"]; folders: DocsPageData["folders"]; busy: boolean; developmentPreview: boolean; onClose: () => void; onChange: (draft: Draft) => void; onSave: () => void; onDelete: () => void }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const lastDraft = useRef<Draft | null>(draftProp);
  useEffect(() => { if (draftProp) lastDraft.current = draftProp; }, [draftProp]);
  const { mounted, closing } = usePresence(Boolean(draftProp), 260);
  if (!mounted) return null;
  const draft = draftProp ?? lastDraft.current;
  if (!draft) return null;
  return <div className={cn("fixed inset-0 z-50 flex justify-end bg-black/35 backdrop-blur-[2px]", closing ? "drawer-backdrop-out" : "drawer-backdrop-in")} role="dialog" aria-modal="true" aria-labelledby="doc-editor-title" onClick={() => !busy && onClose()}><aside className={cn("flex h-full w-full max-w-[620px] flex-col border-l soft-divider bg-card shadow-2xl shadow-black/50", closing ? "drawer-panel-out" : "drawer-panel-in")} onClick={(event) => event.stopPropagation()}><div className="flex items-center justify-between border-b soft-divider px-5 py-3"><div><h2 id="doc-editor-title" className="text-base font-semibold">{draft.id ? "Edit doc" : "New doc"}</h2><p className="mt-0.5 text-[11px] text-muted-foreground">Markdown textarea supported</p></div><button type="button" disabled={busy} onClick={onClose} className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"><X className="size-4" /></button></div><div className="scrollbar-subtle flex-1 space-y-4 overflow-y-auto px-5 py-5"><label className="block"><span className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Title</span><input autoFocus value={draft.title} onChange={(event) => onChange({ ...draft, title: event.target.value })} className="mt-1.5 h-10 w-full rounded-lg border soft-divider bg-input px-3 text-sm font-semibold outline-none focus:border-ring" placeholder="Document title" /></label><div className="grid gap-3 sm:grid-cols-2"><AppSelect label="Folder" value={draft.folder ?? ""} options={[{ value: "", label: "Unfiled" }, ...folders.map((item) => ({ value: item.name, label: item.name }))]} onChange={(value) => onChange({ ...draft, folder: (value || null) as NoteFolder | null })} /><AppSelect label="Type" value={draft.noteType ?? "general"} options={NOTE_TYPES.map((item) => ({ value: item, label: item.replaceAll("_", " ") }))} onChange={(value) => onChange({ ...draft, noteType: value as Draft["noteType"] })} /><AppSelect label="Linked project" value={draft.linkedProjectId ?? ""} options={[{ value: "", label: "No project" }, ...projects.map((project) => ({ value: project.id, label: project.name }))]} onChange={(value) => onChange({ ...draft, linkedProjectId: value || null })} /><button type="button" onClick={() => onChange({ ...draft, pinned: !draft.pinned })} className={cn("mt-5 h-9 rounded-lg border px-3 text-xs font-medium", draft.pinned ? "border-warning/30 bg-warning/10 text-warning" : "soft-divider bg-input text-muted-foreground hover:text-foreground")}><Star className="mr-1 inline size-3.5" />{draft.pinned ? "Pinned" : "Pin document"}</button></div><label className="block"><span className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Content</span><textarea value={draft.content ?? ""} onChange={(event) => onChange({ ...draft, content: event.target.value })} className="mt-1.5 min-h-80 w-full resize-y rounded-lg border soft-divider bg-input px-3 py-3 font-mono text-xs leading-6 outline-none focus:border-ring" placeholder="Write Markdown, research notes, links, or setup instructions..." /></label></div><div className="flex flex-wrap items-center justify-between gap-3 border-t soft-divider bg-card/95 px-5 py-3">{draft.id ? confirmDelete ? <div className="flex items-center gap-2"><span className="text-xs text-muted-foreground">Delete permanently?</span><Button variant="secondary" size="sm" disabled={busy || developmentPreview} onClick={onDelete}>Confirm</Button><Button variant="ghost" size="sm" disabled={busy} onClick={() => setConfirmDelete(false)}>Cancel</Button></div> : <Button variant="ghost" size="sm" disabled={busy || developmentPreview} onClick={() => setConfirmDelete(true)} className="text-foreground hover:bg-white/[0.06]"><Trash2 className="size-3.5" />Delete</Button> : <span />}{developmentPreview ? <span className="text-xs text-muted-foreground">Preview only</span> : null}<Button size="sm" disabled={busy || developmentPreview || !draft.title.trim()} onClick={onSave}>{busy ? "Saving..." : "Save doc"}</Button></div></aside></div>;
}

function FolderEditor({ draft: draftProp, noteCount, busy, developmentPreview, onClose, onChange, onSave, onDelete }: { draft: FolderDraft | null; noteCount: number; busy: boolean; developmentPreview: boolean; onClose: () => void; onChange: (draft: FolderDraft) => void; onSave: () => void; onDelete: () => void }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const lastDraft = useRef<FolderDraft | null>(draftProp);
  useEffect(() => { if (draftProp) { lastDraft.current = draftProp; setConfirmDelete(false); } }, [draftProp]);
  const { mounted, closing } = usePresence(Boolean(draftProp), 160);
  if (!mounted) return null;
  const draft = draftProp ?? lastDraft.current;
  if (!draft) return null;
  const canDelete = Boolean(draft.id && noteCount === 0 && !developmentPreview);
  return <div className={cn("fixed inset-0 z-[60] grid place-items-center bg-black/40 px-4 backdrop-blur-[2px]", closing ? "modal-backdrop-out" : "modal-backdrop-in")} role="dialog" aria-modal="true" aria-labelledby="folder-editor-title" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onClose(); }}><div className={cn("soft-panel w-full max-w-[440px] rounded-xl border soft-divider bg-card p-5 shadow-2xl shadow-black/45", closing ? "modal-card-out" : "modal-card-in")}><div className="flex items-start justify-between gap-4"><div><h2 id="folder-editor-title" className="text-base font-semibold">{draft.id ? "Edit folder" : "New folder"}</h2></div><button type="button" disabled={busy} onClick={onClose} className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"><X className="size-4" /></button></div><div className="mt-4 space-y-4"><label className="block"><span className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Folder name</span><input autoFocus value={draft.name} onChange={(event) => onChange({ ...draft, name: event.target.value })} maxLength={80} className="mt-1.5 h-10 w-full rounded-lg border soft-divider bg-input px-3 text-sm font-semibold outline-none focus:border-ring" placeholder="Folder name" /></label><label className="block"><span className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Description</span><input value={draft.description ?? ""} onChange={(event) => onChange({ ...draft, description: event.target.value })} maxLength={160} className="mt-1.5 h-10 w-full rounded-lg border soft-divider bg-input px-3 text-sm outline-none focus:border-ring" placeholder="Optional short description" /></label></div><div className="mt-5 flex flex-wrap items-center justify-between gap-3"><div>{draft.id ? confirmDelete ? <div className="flex items-center gap-2"><Button type="button" size="sm" variant="secondary" disabled={busy || !canDelete} onClick={onDelete}>Confirm delete</Button><Button type="button" size="sm" variant="ghost" disabled={busy} onClick={() => setConfirmDelete(false)}>Cancel</Button></div> : <Button type="button" size="sm" variant="ghost" disabled={busy || !canDelete} onClick={() => setConfirmDelete(true)} className="text-foreground hover:bg-white/[0.06]"><Trash2 className="size-3.5" />Delete</Button> : null}</div><div className="flex gap-2"><Button type="button" size="sm" variant="ghost" disabled={busy} onClick={onClose}>Cancel</Button><Button type="button" size="sm" disabled={busy || developmentPreview || !draft.name.trim()} onClick={onSave}>{busy ? "Saving..." : "Save folder"}</Button></div></div></div></div>;
}

function relativeTime(value: string | null) { if (!value) return "Now"; const minutes = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 60000)); return minutes < 1 ? "Now" : minutes < 60 ? minutes + "m" : minutes < 1440 ? Math.round(minutes / 60) + "h" : Math.round(minutes / 1440) + "d"; }
