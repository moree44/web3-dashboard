"use client";

import { CalendarClock, Check, MoreHorizontal, Plus, Search, SlidersHorizontal } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import type { PersonalItemRecord } from "@/features/personal/types";
import { filterTasks, TASK_BOARD_STATUSES } from "@/features/tasks/task-query";
import { formatTaskDuration, getJakartaDateValue } from "@/features/tasks/task-duration";
import type { TaskCreateInput, TaskInput, TaskProjectOption, TaskRecord, TaskStatus, TaskWorkspaceData } from "@/features/tasks/task-types";
import { formatTaskFrequency, TASK_FREQUENCIES, TASK_PRIORITIES, TASK_STATUSES, TASK_STATUS_LABELS } from "@/features/tasks/task-types";

import { TaskDetailPanel } from "./task-detail-panel";
import { AddTaskDialog } from "./add-task-dialog";
import { useTaskWorkspace, useTasksMutations } from "../tasks-query";

import { AppSelect } from "@/components/ui/app-select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type TaskView = "list" | "board" | "running" | "recheck";
type BoardGroup = "project" | "status";

const viewTabs: { label: string; value: TaskView }[] = [
  { label: "List", value: "list" },
  { label: "Board", value: "board" },
  { label: "Running", value: "running" },
  { label: "Recheck", value: "recheck" },
];

const boardGroupOptions: { label: string; value: BoardGroup }[] = [
  { label: "By Project", value: "project" },
  { label: "By Status", value: "status" },
];

export function TasksPreview({ initialData, developmentPreview = false }: { initialData: TaskWorkspaceData; developmentPreview?: boolean }) {
  const [view, setView] = useState<TaskView>("list");
  const [boardGroup, setBoardGroup] = useState<BoardGroup>("project");
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedAccount, setSelectedAccount] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedFrequency, setSelectedFrequency] = useState("");
  const [selectedPriority, setSelectedPriority] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [addTaskOpen, setAddTaskOpen] = useState(false);
  const [quickTitle, setQuickTitle] = useState("");
  const [quickProjectId, setQuickProjectId] = useState(initialData.projects[0]?.id ?? "");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [menuTaskId, setMenuTaskId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [personalOpen, setPersonalOpen] = useState(false);
  const [personalTitle, setPersonalTitle] = useState("");
  const { data: queryData } = useTaskWorkspace(initialData, developmentPreview);
  const mutations = useTasksMutations({
    developmentPreview,
    projects: initialData.projects,
    onError: (message) => setError(message),
  });
  const workspace = queryData ?? initialData;
  const taskItems = workspace.tasks;
  const personalItems = workspace.personalItems ?? [];
  const busy = mutations.createTaskMutation.isPending
    || mutations.saveTaskMutation.isPending
    || mutations.statusTaskMutation.isPending
    || mutations.deleteTaskMutation.isPending
    || mutations.addPersonalItemMutation.isPending
    || mutations.togglePersonalItemMutation.isPending
    || mutations.removePersonalItemMutation.isPending;

  useEffect(() => {
    function closeMenu(event: PointerEvent) {
      if (!(event.target instanceof Element) || !event.target.closest("[data-task-menu]")) setMenuTaskId(null);
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuTaskId(null);
    }
    document.addEventListener("pointerdown", closeMenu);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeMenu);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  const selectedTask = taskItems.find((task) => task.id === selectedTaskId) ?? null;
  const visibleByTab = view === "running"
    ? taskItems.filter((task) => task.status === "running")
    : view === "recheck"
      ? taskItems.filter((task) => task.status === "recheck")
      : taskItems;
  const filteredTasks = useMemo(() => filterTasks(visibleByTab, {
    query: searchQuery,
    projectId: selectedProject,
    accountId: selectedAccount,
    status: selectedStatus,
    frequency: selectedFrequency,
    priority: selectedPriority,
  }), [visibleByTab, searchQuery, selectedProject, selectedAccount, selectedStatus, selectedFrequency, selectedPriority]);
  const runningTasks = taskItems.filter((task) => task.status === "running");
  const recheckTasks = taskItems.filter((task) => task.status === "recheck");
  const boardTasks = filteredTasks.filter((task) => task.status !== "running");

  async function handleQuickCreate() {
    const title = quickTitle.trim();
    if (!title || !quickProjectId || busy) return;
    const input: TaskCreateInput = { projectId: quickProjectId, title, status: "todo", frequency: "once", priority: "medium", startDate: getJakartaDateValue(), accountIds: [] };
    setError(null);
    try {
      await mutations.createTaskMutation.mutateAsync(input);
      setQuickTitle("");
    } catch {
      // Failure is surfaced through onError into the error banner.
    }
  }

  async function handleCreate(input: TaskCreateInput) {
    setError(null);
    try {
      await mutations.createTaskMutation.mutateAsync(input);
      setAddTaskOpen(false);
    } catch {
      // Failure is surfaced through onError; the dialog stays open.
    }
  }

  function handleSave(input: TaskInput) {
    if (!selectedTask) return;
    setError(null);
    mutations.saveTaskMutation.mutate({ id: selectedTask.id, input });
    setSelectedTaskId(null);
  }

  function handleStatus(task: TaskRecord, status: TaskStatus) {
    setMenuTaskId(null);
    setError(null);
    mutations.statusTaskMutation.mutate({ id: task.id, status });
  }

  function handleDelete(task: TaskRecord) {
    setSelectedTaskId(null);
    setMenuTaskId(null);
    setError(null);
    mutations.deleteTaskMutation.mutate(task.id);
  }

  function addPersonalItem() {
    const title = personalTitle.trim();
    if (!title || busy) return;
    setError(null);
    mutations.addPersonalItemMutation.mutate(title);
    setPersonalTitle("");
    setPersonalOpen(false);
  }

  function togglePersonalItem(item: PersonalItemRecord) {
    setError(null);
    mutations.togglePersonalItemMutation.mutate({ id: item.id, status: item.status === "done" ? "todo" : "done" });
  }

  function removePersonalItem(item: PersonalItemRecord) {
    setError(null);
    mutations.removePersonalItemMutation.mutate(item.id);
  }

  return (
    <div className="min-w-0 py-5 lg:py-7">
      <header className="flex flex-col gap-4 border-b soft-divider px-4 pb-5 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-8">
        <div>
          <h1 className="mt-1 text-2xl font-semibold tracking-[-0.02em]">Tasks</h1>
          <p className="mt-1 text-xs text-muted-foreground">Cross-project work, monitoring, and recheck queue.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setPersonalOpen(true)}>Add personal item</Button>
          <Button variant="ghost" size="sm" onClick={() => setQuickAddOpen(true)} disabled={initialData.projects.length === 0}>Quick add</Button>
          <Button variant="secondary" size="sm" onClick={() => { setError(null); setAddTaskOpen(true); }} disabled={initialData.projects.length === 0}><Plus />Add task</Button>
        </div>
      </header>

      {quickAddOpen ? (
        <div className="border-b soft-divider px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-2 rounded-xl bg-white/[0.025] p-2 sm:flex-row sm:items-center">
            <AppSelect ariaLabel="Quick add project" value={quickProjectId} options={initialData.projects.map((project) => ({ value: project.id, label: project.name }))} onChange={setQuickProjectId} className="w-full sm:w-44" />
            <input autoFocus value={quickTitle} onChange={(event) => setQuickTitle(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void handleQuickCreate(); if (event.key === "Escape") setQuickAddOpen(false); }} className="h-9 min-w-0 flex-1 rounded-lg bg-background px-3 text-sm font-medium outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-ring" placeholder="Task title, then press Enter..." />
            <Button variant="secondary" size="sm" onClick={() => setQuickAddOpen(false)} disabled={busy}>Cancel</Button>
            <Button size="sm" disabled={!quickTitle.trim() || !quickProjectId || busy} onClick={() => void handleQuickCreate()}>{busy ? "Adding..." : "Add"}</Button>
          </div>
          <p className="mt-1.5 px-2 text-[11px] text-muted-foreground">Defaults: Todo, Once, Medium, all project accounts.</p>
        </div>
      ) : null}

      {personalOpen ? (
        <div className="border-b soft-divider px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex gap-2 rounded-xl bg-white/[0.025] p-2">
            <input autoFocus value={personalTitle} onChange={(event) => setPersonalTitle(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") addPersonalItem(); if (event.key === "Escape") setPersonalOpen(false); }} className="h-9 min-w-0 flex-1 rounded-lg bg-background px-3 text-sm outline-none focus:ring-1 focus:ring-ring" placeholder="Personal item..." />
            <Button variant="secondary" size="sm" onClick={() => setPersonalOpen(false)}>Cancel</Button>
            <Button size="sm" disabled={!personalTitle.trim() || busy} onClick={addPersonalItem}>Add item</Button>
          </div>
        </div>
      ) : null}

      <div className="border-b soft-divider px-4 sm:px-6 lg:px-8">
        <div className="scrollbar-subtle flex items-center gap-1 overflow-x-auto py-2.5">
          {viewTabs.map((tab) => (
            <button key={tab.value} type="button" onClick={() => setView(tab.value)} className={cn("shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors", view === tab.value ? "bg-accent text-foreground shadow-[inset_0_1px_0_rgb(255_255_255/0.06)]" : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground")}>
              {tab.label}
              {tab.value === "running" ? <span className="ml-1 text-[10px] opacity-60">{runningTasks.length}</span> : null}
              {tab.value === "recheck" ? <span className="ml-1 text-[10px] opacity-60">{recheckTasks.length}</span> : null}
            </button>
          ))}
          {view === "board" ? <span className="mx-1 h-4 w-px bg-white/[0.06]" /> : null}
          {view === "board" ? boardGroupOptions.map((option) => <button key={option.value} type="button" onClick={() => setBoardGroup(option.value)} className={cn("shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors", boardGroup === option.value ? "bg-white/[0.075] text-foreground" : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground")}>{option.label}</button>) : null}
        </div>
      </div>

      <div className="border-b soft-divider px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
          <label className="flex h-9 min-w-0 items-center gap-2 rounded-lg border border-white/[0.06] bg-card px-3 lg:w-72">
            <Search className="size-4 text-muted-foreground" />
            <input aria-label="Search tasks" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} className="min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground" placeholder="Search tasks..." />
          </label>
          <div className="flex flex-1 flex-wrap items-center gap-2">
            <AppSelect ariaLabel="Filter tasks by project" value={selectedProject} options={[{ value: "", label: "All projects" }, ...initialData.projects.map((project) => ({ value: project.id, label: project.name }))]} onChange={setSelectedProject} className="w-[150px]" />
            <AppSelect ariaLabel="Filter tasks by account" value={selectedAccount} options={[{ value: "", label: "All accounts" }, ...initialData.accounts.map((account) => ({ value: account.id, label: account.label }))]} onChange={setSelectedAccount} className="w-[150px]" />
            <button type="button" aria-expanded={showMoreFilters} onClick={() => setShowMoreFilters((open) => !open)} className={cn("flex h-8 shrink-0 items-center gap-2 rounded-lg border border-white/[0.045] px-3 text-xs transition-colors", showMoreFilters ? "bg-white/[0.07] text-foreground" : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground")}><SlidersHorizontal className="size-3.5" />More filters</button>
          </div>
        </div>
        {showMoreFilters ? (
          <div className="mt-2 flex flex-wrap gap-2 border-t border-white/[0.04] pt-2">
            <AppSelect ariaLabel="Filter tasks by status" value={selectedStatus} options={[{ value: "", label: "All statuses" }, ...TASK_STATUSES.map((value) => ({ value, label: TASK_STATUS_LABELS[value] }))]} onChange={setSelectedStatus} className="w-[150px]" />
            <AppSelect ariaLabel="Filter tasks by frequency" value={selectedFrequency} options={[{ value: "", label: "All frequencies" }, ...TASK_FREQUENCIES.map((value) => ({ value, label: formatTaskFrequency(value) }))]} onChange={setSelectedFrequency} className="w-[150px]" />
            <AppSelect ariaLabel="Filter tasks by priority" value={selectedPriority} options={[{ value: "", label: "All priorities" }, ...TASK_PRIORITIES.map((value) => ({ value, label: value.charAt(0).toUpperCase() + value.slice(1) }))]} onChange={setSelectedPriority} className="w-[150px]" />
            {(selectedStatus || selectedFrequency || selectedPriority) ? <Button variant="ghost" size="sm" onClick={() => { setSelectedStatus(""); setSelectedFrequency(""); setSelectedPriority(""); }}>Clear</Button> : null}
          </div>
        ) : null}
      </div>

      {error ? <div role="alert" className="mx-4 mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive sm:mx-6 lg:mx-8">{error}</div> : null}
      {personalItems.length > 0 ? <div className="border-b soft-divider px-4 py-2.5 sm:px-6 lg:px-8"><div className="mb-2 flex items-center justify-between"><span className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground">Personal items</span><span className="text-[11px] text-muted-foreground">{personalItems.filter((item) => item.status === "done").length} done</span></div><div className="flex flex-wrap gap-2">{personalItems.map((item) => <span key={item.id} className="inline-flex items-center gap-1 rounded-full bg-white/[0.04] px-2.5 py-1 text-xs text-muted-foreground"><button type="button" onClick={() => togglePersonalItem(item)} className={cn("hover:text-foreground", item.status === "done" && "text-foreground line-through")}>{item.title}</button><button type="button" onClick={() => removePersonalItem(item)} className="text-muted-foreground hover:text-destructive" aria-label={"Delete personal item " + item.title}>x</button></span>)}</div></div> : null}

      {view === "board" ? (
        <BoardView tasks={boardTasks} projects={initialData.projects} group={boardGroup} menuTaskId={menuTaskId} onMenu={setMenuTaskId} onOpen={setSelectedTaskId} onDone={(task) => handleStatus(task, "done")} />
      ) : view === "running" ? (
        <TaskCards title="Running work" tasks={filteredTasks} menuTaskId={menuTaskId} onMenu={setMenuTaskId} onOpen={setSelectedTaskId} onDone={(task) => handleStatus(task, "done")} />
      ) : view === "recheck" ? (
        <TaskCards title="Recheck queue" review tasks={filteredTasks} menuTaskId={menuTaskId} onMenu={setMenuTaskId} onOpen={setSelectedTaskId} onDone={(task) => handleStatus(task, "done")} />
      ) : (
        <ListView tasks={filteredTasks} menuTaskId={menuTaskId} onMenu={setMenuTaskId} onOpen={setSelectedTaskId} onDone={(task) => handleStatus(task, "done")} />
      )}

      {filteredTasks.length === 0 ? <EmptyState hasProjects={initialData.projects.length > 0} onAdd={() => setAddTaskOpen(true)} /> : null}
      <footer className="flex items-center justify-between border-t soft-divider px-4 py-3 text-[11px] text-muted-foreground sm:px-6 lg:px-8"><span>Showing {filteredTasks.length} task{filteredTasks.length === 1 ? "" : "s"}</span><span /></footer>

      <TaskDetailPanel task={selectedTask} projects={initialData.projects} busy={mutations.saveTaskMutation.isPending || mutations.statusTaskMutation.isPending || mutations.deleteTaskMutation.isPending} error={error} onClose={() => { setSelectedTaskId(null); setError(null); }} onSave={(input) => handleSave(input)} onDelete={() => { if (selectedTask) handleDelete(selectedTask); }} />
      <AddTaskDialog open={addTaskOpen} projects={initialData.projects} busy={mutations.createTaskMutation.isPending} error={error} onClose={() => { if (!mutations.createTaskMutation.isPending) { setAddTaskOpen(false); setError(null); } }} onCreate={(input) => void handleCreate(input)} />
    </div>
  );
}

function ListView({ tasks, menuTaskId, onMenu, onOpen, onDone }: TaskCollectionProps) {
  return (
    <>
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full min-w-[980px] table-fixed border-collapse text-left">
          <colgroup><col className="w-[38%]" /><col className="w-[13%]" /><col className="w-[12%]" /><col className="w-[14%]" /><col className="w-[10%]" /><col className="w-[9%]" /><col className="w-12" /></colgroup>
          <thead className="bg-secondary text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground"><tr><th className="border-b soft-divider px-6 py-3">Task</th><th className="border-b soft-divider px-3 py-3">Status</th><th className="border-b soft-divider px-3 py-3">Frequency</th><th className="border-b soft-divider px-3 py-3">Accounts</th><th className="border-b soft-divider px-3 py-3">Started</th><th className="border-b soft-divider px-3 py-3">Priority</th><th className="border-b soft-divider px-3 py-3"><span className="sr-only">Actions</span></th></tr></thead>
          <tbody>{tasks.map((task) => <tr key={task.id} className="h-[58px] border-b soft-divider hover:bg-accent/30"><td className="px-6"><button type="button" onClick={() => onOpen(task.id)} className="block w-full text-left"><TaskIdentity task={task} /></button></td><td className="px-3"><StatusBadge status={task.status} /></td><td className="px-3"><Badge variant="outline" className="text-[10px]">{formatTaskFrequency(task.frequency)}</Badge></td><td className="px-3"><AccountAvatars task={task} /></td><td className="px-3"><TaskTiming task={task} /></td><td className="px-3"><Priority value={task.priority} /></td><td className="px-3"><TaskMenu task={task} open={menuTaskId === task.id} onToggle={() => onMenu(menuTaskId === task.id ? null : task.id)} onEdit={() => onOpen(task.id)} onDone={() => onDone(task)} /></td></tr>)}</tbody>
        </table>
      </div>
      <div className="divide-y divide-white/[0.045] lg:hidden">{tasks.map((task) => <article key={task.id} className="flex items-start justify-between gap-3 px-4 py-4 sm:px-6"><button type="button" onClick={() => onOpen(task.id)} className="min-w-0 flex-1 text-left"><TaskIdentity task={task} /><div className="mt-3 flex flex-wrap items-center gap-2"><StatusBadge status={task.status} /><Badge variant="outline" className="text-[10px]">{formatTaskFrequency(task.frequency)}</Badge><AccountAvatars task={task} /></div></button><TaskMenu task={task} open={menuTaskId === task.id} onToggle={() => onMenu(menuTaskId === task.id ? null : task.id)} onEdit={() => onOpen(task.id)} onDone={() => onDone(task)} /></article>)}</div>
    </>
  );
}

type TaskCollectionProps = { tasks: TaskRecord[]; menuTaskId: string | null; onMenu: (id: string | null) => void; onOpen: (id: string) => void; onDone: (task: TaskRecord) => void };

function TaskCards({ title, tasks, review = false, ...props }: TaskCollectionProps & { title: string; review?: boolean }) {
  return <div className="p-4 sm:p-6 lg:p-8"><div className="soft-panel overflow-visible rounded-xl bg-card"><div className="border-b soft-divider px-4 py-3"><h2 className="text-sm font-semibold">{title}</h2></div>{tasks.map((task) => <article key={task.id} className="grid gap-3 border-b soft-divider px-4 py-3 last:border-b-0 lg:grid-cols-[minmax(260px,1fr)_140px_150px_90px] lg:items-center"><button type="button" onClick={() => props.onOpen(task.id)} className="text-left"><TaskIdentity task={task} /></button><AccountAvatars task={task} /><TaskTiming task={task} /><div className="flex items-center justify-end gap-2">{review ? <Button variant="secondary" size="sm" onClick={() => props.onOpen(task.id)}>Review</Button> : null}<TaskMenu task={task} open={props.menuTaskId === task.id} onToggle={() => props.onMenu(props.menuTaskId === task.id ? null : task.id)} onEdit={() => props.onOpen(task.id)} onDone={() => props.onDone(task)} /></div></article>)}</div></div>;
}

function BoardView({ tasks, projects, group, ...props }: TaskCollectionProps & { projects: TaskProjectOption[]; group: BoardGroup }) {
  const groups = group === "status"
    ? TASK_BOARD_STATUSES.map((status) => ({ id: status, label: TASK_STATUS_LABELS[status], tasks: tasks.filter((task) => task.status === status) }))
    : projects.map((project) => ({ id: project.id, label: project.name, tasks: tasks.filter((task) => task.projectId === project.id) })).filter((item) => item.tasks.length > 0);
  return <div className="scrollbar-subtle overflow-x-auto p-4 sm:p-6 lg:p-8"><div className="flex min-w-max gap-3">{groups.map((item) => <section key={item.id} className="w-[300px] shrink-0 rounded-xl bg-card/80 soft-panel"><div className="px-3 py-2.5"><h2 className="text-sm font-semibold">{item.label}</h2><p className="mt-0.5 text-[11px] text-muted-foreground">{item.tasks.length} task{item.tasks.length === 1 ? "" : "s"}</p></div><div className="space-y-2 p-2">{item.tasks.map((task) => <article key={task.id} className="rounded-xl bg-white/[0.025] p-2.5 hover:bg-white/[0.04]"><div className="flex items-start justify-between gap-2"><button type="button" onClick={() => props.onOpen(task.id)} className="min-w-0 flex-1 text-left"><TaskIdentity task={task} compact /></button><TaskMenu task={task} open={props.menuTaskId === task.id} onToggle={() => props.onMenu(props.menuTaskId === task.id ? null : task.id)} onEdit={() => props.onOpen(task.id)} onDone={() => props.onDone(task)} /></div><div className="mt-2 flex flex-wrap gap-1.5"><StatusBadge status={task.status} /><Badge variant="outline" className="text-[10px]">{formatTaskFrequency(task.frequency)}</Badge></div><div className="mt-2 flex items-center justify-between"><AccountAvatars task={task} /><span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground"><CalendarClock className="size-3" /><TaskTiming task={task} compact /></span></div></article>)}</div></section>)}</div></div>;
}

function TaskMenu({ task, open, onToggle, onEdit, onDone }: { task: TaskRecord; open: boolean; onToggle: () => void; onEdit: () => void; onDone: () => void }) {
  return <div className="relative" data-task-menu><button type="button" onClick={(event) => { event.stopPropagation(); onToggle(); }} aria-haspopup="menu" aria-expanded={open} className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground" aria-label={"Task actions for " + task.title}><MoreHorizontal className="size-4" /></button>{open ? <div role="menu" className="popover-in absolute right-0 top-8 z-30 w-36 origin-top-right rounded-xl border border-white/[0.06] bg-popover p-1 shadow-xl shadow-black/40"><button role="menuitem" type="button" onClick={onEdit} className="flex h-8 w-full items-center rounded-lg px-2.5 text-xs text-foreground hover:bg-accent">Edit task</button>{task.status !== "done" ? <button role="menuitem" type="button" onClick={onDone} className="flex h-8 w-full items-center gap-2 rounded-lg px-2.5 text-xs text-foreground hover:bg-accent"><Check className="size-3.5" />Mark done</button> : null}</div> : null}</div>;
}

function TaskIdentity({ task, compact = false }: { task: TaskRecord; compact?: boolean }) {
  return <span className="flex min-w-0 items-center gap-2.5"><ProjectMark task={task} compact={compact} /><span className="min-w-0"><span className="block truncate text-[13px] font-semibold">{task.title}</span><span className="mt-0.5 block truncate text-[11px] text-muted-foreground">{task.projectName}{task.assignedWallet ? " · " + task.assignedWallet.label : ""}</span></span></span>;
}

function ProjectMark({ task, compact }: { task: TaskRecord; compact: boolean }) {
  return <span className={cn("grid shrink-0 place-items-center rounded-lg bg-white/[0.065] bg-cover bg-center font-bold text-[#c4cad3]", compact ? "size-7 text-[10px]" : "size-8 text-[11px]")} style={task.projectLogoUrl ? { backgroundImage: "url(" + JSON.stringify(task.projectLogoUrl) + ")" } : undefined}>{task.projectLogoUrl ? <span className="sr-only">{task.projectName}</span> : task.projectName.slice(0, 1).toUpperCase()}</span>;
}

function AccountAvatars({ task }: { task: TaskRecord }) {
  const accounts = task.effectiveAccounts;
  return <div className="flex items-center -space-x-1.5" title={task.usesProjectAccountFallback ? "All project accounts" : undefined}>{accounts.slice(0, 3).map((account) => <span key={account.id} className="grid size-6 shrink-0 place-items-center rounded-full border-2 border-card bg-[#25272b] bg-cover bg-center text-[9px] font-semibold text-muted-foreground" style={account.avatarUrl ? { backgroundImage: "url(" + JSON.stringify(account.avatarUrl) + ")" } : undefined} title={account.label}>{account.avatarUrl ? <span className="sr-only">{account.label}</span> : account.label.slice(0, 1).toUpperCase()}</span>)}{accounts.length > 3 ? <span className="grid size-6 shrink-0 place-items-center rounded-full border-2 border-card bg-[#25272b] text-[9px] font-semibold text-muted-foreground">+{accounts.length - 3}</span> : null}{accounts.length === 0 ? <span className="text-[10px] text-muted-foreground">No accounts</span> : null}</div>;
}

function StatusBadge({ status }: { status: TaskStatus }) {
  const variant = status === "running" ? "success" : status === "recheck" ? "warning" : status === "in_progress" ? "info" : status === "dropped" ? "destructive" : status === "done" ? "outline" : "secondary";
  return <Badge variant={variant} className="text-[10px]">{TASK_STATUS_LABELS[status]}</Badge>;
}

function Priority({ value }: { value: TaskRecord["priority"] }) {
  const bars = value === "high" ? 3 : value === "medium" ? 2 : 1;
  return <span className="inline-flex items-center gap-1.5 text-xs capitalize text-muted-foreground"><svg className="size-4" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">{[0, 1, 2].map((bar) => <rect key={bar} x={3 + bar * 4} y={10 - bar * 3} width="2.6" height={4 + bar * 3} rx="1" opacity={bar < bars ? 1 : 0.28} />)}</svg>{value}</span>;
}

function EmptyState({ hasProjects, onAdd }: { hasProjects: boolean; onAdd: () => void }) {
  return <div className="px-4 py-14 text-center sm:px-6 lg:px-8"><h2 className="text-sm font-semibold">No tasks found</h2><p className="mt-1 text-xs text-muted-foreground">{hasProjects ? "Adjust the filters or add the first task." : "Create a project before adding tasks."}</p>{hasProjects ? <Button variant="secondary" size="sm" className="mt-4" onClick={onAdd}><Plus />Add task</Button> : null}</div>;
}

function formatTaskDate(value: string | null) {
  if (!value) return "No date";
  const parts = value.split("-").map(Number);
  if (parts.length !== 3 || parts.some((part) => !part)) return value;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "Asia/Jakarta" }).format(new Date(Date.UTC(parts[0], parts[1] - 1, parts[2])));
}

function TaskTiming({ task, compact = false }: { task: TaskRecord; compact?: boolean }) {
  const duration = formatTaskDuration(task.startDate, task.completedAt);
  return <span className={cn("block text-muted-foreground", compact ? "max-w-32 truncate text-[10px]" : "text-xs")} title={duration ?? undefined}>{duration ?? formatTaskDate(task.startDate)}</span>;
}
