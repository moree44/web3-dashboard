"use client";

import { ExternalLink, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { AppDatePicker } from "@/components/ui/app-date-picker";
import { AppSelect } from "@/components/ui/app-select";
import { Button } from "@/components/ui/button";
import { formatTaskDuration } from "@/features/tasks/task-duration";
import type {
  TaskFrequency,
  TaskInput,
  TaskPriority,
  TaskProjectOption,
  TaskRecord,
  TaskStatus,
} from "@/features/tasks/task-types";
import {
  formatTaskFrequency,
  TASK_FREQUENCIES,
  TASK_PRIORITIES,
  TASK_STATUSES,
  TASK_STATUS_LABELS,
} from "@/features/tasks/task-types";
import { cn } from "@/lib/utils";
import { isHttpUrl, normalizeHttpUrl } from "@/lib/url";
import { useDrawerDismiss } from "@/lib/use-drawer-dismiss";
import { usePresence } from "@/lib/use-presence";

type Props = {
  task: TaskRecord | null;
  projects: TaskProjectOption[];
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onSave: (input: TaskInput) => void;
  onDelete: () => void;
};

function emptyInput(task: TaskRecord): TaskInput {
  return {
    projectId: task.projectId,
    title: task.title,
    description: task.description ?? "",
    status: task.status,
    frequency: task.frequency,
    priority: task.priority,
    url: task.url ?? "",
    startDate: task.startDate ?? "",
    accountIds: task.assignedAccounts.map((account) => account.id),
    walletId: task.assignedWallet?.id ?? null,
  };
}

export function TaskDetailPanel({ task, projects, busy, error, onClose, onSave, onDelete }: Props) {
  useDrawerDismiss(onClose, Boolean(task) && !busy);
  const [draft, setDraft] = useState<TaskInput | null>(task ? emptyInput(task) : null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (task) {
      setDraft(emptyInput(task));
      setConfirmDelete(false);
    }
  }, [task]);

  const lastTask = useRef<TaskRecord | null>(task);
  useEffect(() => {
    if (task) lastTask.current = task;
  }, [task]);
  const { mounted, closing } = usePresence(Boolean(task), 260);
  if (!mounted) return null;
  const activeTask = task ?? lastTask.current;
  if (!activeTask || !draft) return null;
  const project = projects.find((item) => item.id === draft.projectId);
  const projectAccounts = project?.accounts ?? [];
  const projectWallets = project?.wallets ?? [];
  const canSave = draft.title.trim().length > 0 && Boolean(project) && Boolean(draft.startDate) && !busy;
  const duration = formatTaskDuration(activeTask.startDate, activeTask.completedAt);

  function changeProject(projectId: string) {
    setDraft((current) => current ? { ...current, projectId, accountIds: [], walletId: null } : current);
  }

  function toggleAccount(accountId: string) {
    setDraft((current) => {
      if (!current) return current;
      const selected = current.accountIds ?? [];
      return {
        ...current,
        accountIds: selected.includes(accountId)
          ? selected.filter((id) => id !== accountId)
          : [...selected, accountId],
      };
    });
  }

  return (
    <div
      className={cn("fixed inset-0 z-50 flex justify-end bg-black/35 backdrop-blur-[2px]", closing ? "drawer-backdrop-out" : "drawer-backdrop-in")}
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-detail-title"
      onClick={() => { if (!busy) onClose(); }}
    >
      <aside
        className={cn("flex h-full w-full max-w-[560px] flex-col border-l soft-divider bg-card shadow-2xl shadow-black/50", closing ? "drawer-panel-out" : "drawer-panel-in")}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b soft-divider px-5 py-3">
          <div className="min-w-0">
            <h2 id="task-detail-title" className="truncate text-base font-semibold">Edit task</h2>
            <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{duration ?? "Changes update the Task lifecycle across the workspace."}</p>
          </div>
          <button type="button" onClick={onClose} disabled={busy} className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-50" aria-label="Close task detail">
            <X className="size-4" />
          </button>
        </div>

        <div className="scrollbar-subtle flex-1 overflow-y-auto px-5 py-5">
          <label className="block">
            <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Task title</span>
            <input autoFocus value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} className="mt-1.5 h-10 w-full rounded-lg border border-white/[0.055] bg-input px-3 text-sm font-semibold outline-none focus:border-ring" />
          </label>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <AppSelect label="Project" value={draft.projectId} options={projects.map((item) => ({ value: item.id, label: item.name }))} onChange={changeProject} />
            <AppSelect label="Status" value={draft.status ?? "todo"} options={TASK_STATUSES.map((value) => ({ value, label: TASK_STATUS_LABELS[value] }))} onChange={(value) => setDraft({ ...draft, status: value as TaskStatus })} />
            <AppSelect label="Frequency" value={draft.frequency ?? "once"} options={TASK_FREQUENCIES.map((value) => ({ value, label: formatTaskFrequency(value) }))} onChange={(value) => setDraft({ ...draft, frequency: value as TaskFrequency })} />
            <AppSelect label="Priority" value={draft.priority ?? "medium"} options={TASK_PRIORITIES.map((value) => ({ value, label: capitalize(value) }))} onChange={(value) => setDraft({ ...draft, priority: value as TaskPriority })} />
            <AppDatePicker label="Start date" value={draft.startDate ?? ""} onChange={(value) => setDraft({ ...draft, startDate: value })} timeZone="Asia/Jakarta" />
            <AppSelect label="Wallet" value={draft.walletId ?? ""} options={[{ value: "", label: "No wallet" }, ...projectWallets.map((wallet) => ({ value: wallet.id, label: wallet.label, meta: <span className="text-[9px] text-muted-foreground">{compactAddress(wallet.address)}</span> }))]} onChange={(value) => setDraft({ ...draft, walletId: value || null })} disabled={projectWallets.length === 0} />
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Assigned accounts</span>
              <span className="text-[11px] text-muted-foreground">Empty means all project accounts</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {projectAccounts.map((account) => {
                const selected = (draft.accountIds ?? []).includes(account.id);
                return (
                  <button key={account.id} type="button" onClick={() => toggleAccount(account.id)} className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-[background-color,color,transform] duration-150 active:scale-[0.97] motion-reduce:transition-none motion-reduce:transform-none", selected ? "bg-white/[0.11] text-foreground" : "bg-white/[0.035] text-muted-foreground hover:bg-white/[0.06] hover:text-foreground")}>
                    <AccountAvatar label={account.label} avatarUrl={account.avatarUrl} />
                    {account.label}
                  </button>
                );
              })}
              {projectAccounts.length === 0 ? <p className="text-xs text-muted-foreground">This project has no assigned accounts.</p> : null}
            </div>
          </div>

          <label className="mt-4 block">
            <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">URL</span>
            <div className="relative mt-1.5">
              <input type="text" inputMode="url" autoCapitalize="none" autoCorrect="off" value={draft.url ?? ""} onChange={(event) => setDraft({ ...draft, url: event.target.value })} onBlur={() => setDraft((current) => current ? { ...current, url: normalizeHttpUrl(current.url) } : current)} className="h-9 w-full rounded-lg border border-white/[0.055] bg-input px-3 pr-9 text-sm outline-none focus:border-ring" placeholder="test.com or https://test.com" />
              {isHttpUrl(normalizeHttpUrl(draft.url)) ? <a href={normalizeHttpUrl(draft.url)} target="_blank" rel="noreferrer" className="absolute right-1 top-1 grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground" aria-label="Open task URL"><ExternalLink className="size-3.5" /></a> : null}
            </div>
          </label>

          <label className="mt-4 block">
            <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Description</span>
            <textarea value={draft.description ?? ""} onChange={(event) => setDraft({ ...draft, description: event.target.value })} className="mt-1.5 min-h-28 w-full resize-y rounded-lg border border-white/[0.055] bg-input px-3 py-2.5 text-sm leading-relaxed outline-none focus:border-ring" placeholder="Optional context, instructions, or proof requirements" />
          </label>

          {error ? <p role="alert" className="mt-4 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p> : null}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t soft-divider bg-card/95 px-5 py-3 backdrop-blur">
          {confirmDelete ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Delete permanently?</span>
              <Button type="button" variant="destructive" size="sm" disabled={busy} onClick={() => void onDelete()}>Confirm</Button>
              <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={() => setConfirmDelete(false)}>Cancel</Button>
            </div>
          ) : (
            <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={() => setConfirmDelete(true)} className="text-foreground hover:bg-white/[0.06]"><Trash2 className="size-3.5" />Delete</Button>
          )}
          <div className="ml-auto flex gap-2">
            <Button type="button" variant="secondary" size="sm" disabled={busy} onClick={onClose}>Cancel</Button>
            <Button type="button" size="sm" disabled={!canSave} onClick={() => void onSave(draft)}>{busy ? "Saving..." : "Save changes"}</Button>
          </div>
        </div>
      </aside>
    </div>
  );
}

function AccountAvatar({ label, avatarUrl }: { label: string; avatarUrl: string | null }) {
  return <span className="grid size-5 shrink-0 place-items-center rounded-full bg-background bg-cover bg-center text-[9px] font-semibold" style={avatarUrl ? { backgroundImage: "url(" + JSON.stringify(avatarUrl) + ")" } : undefined}>{avatarUrl ? <span className="sr-only">{label}</span> : label.slice(0, 1).toUpperCase()}</span>;
}

function compactAddress(address: string) {
  if (address.length <= 12) return address;
  return address.slice(0, 6) + "..." + address.slice(-4);
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
