"use client";

import { ChevronDown, Plus, X } from "lucide-react";
import { useEffect, useState } from "react";

import { AppDatePicker } from "@/components/ui/app-date-picker";
import { AppSelect } from "@/components/ui/app-select";
import { Button } from "@/components/ui/button";
import { getJakartaDateValue } from "@/features/tasks/task-duration";
import type {
  TaskCreateInput,
  TaskFrequency,
  TaskPriority,
  TaskProjectOption,
  TaskStatus,
} from "@/features/tasks/task-types";
import {
  formatTaskFrequency,
  TASK_FREQUENCIES,
  TASK_PRIORITIES,
  TASK_STATUSES,
  TASK_STATUS_LABELS,
} from "@/features/tasks/task-types";
import { normalizeHttpUrl } from "@/lib/url";
import { cn } from "@/lib/utils";
import { useDrawerDismiss } from "@/lib/use-drawer-dismiss";
import { usePresence } from "@/lib/use-presence";

type Props = {
  open: boolean;
  projects: TaskProjectOption[];
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onCreate: (input: TaskCreateInput) => void;
};

export function AddTaskDialog({ open, projects, busy, error, onClose, onCreate }: Props) {
  const [title, setTitle] = useState("");
  const [projectId, setProjectId] = useState(projects[0]?.id ?? "");
  const [status, setStatus] = useState<TaskStatus>("todo");
  const [frequency, setFrequency] = useState<TaskFrequency>("once");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [startDate, setStartDate] = useState(getJakartaDateValue);
  const [accountIds, setAccountIds] = useState<string[]>([]);
  const [walletId, setWalletId] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [showOptional, setShowOptional] = useState(false);
  const [addDeadline, setAddDeadline] = useState(false);
  const [deadlineDate, setDeadlineDate] = useState("");
  const [deadlineTime, setDeadlineTime] = useState("");
  const [deadlineNotes, setDeadlineNotes] = useState("");

  useDrawerDismiss(onClose, open && !busy);

  useEffect(() => {
    if (!open) return;
    setTitle("");
    setProjectId(projects[0]?.id ?? "");
    setStatus("todo");
    setFrequency("once");
    setPriority("medium");
    setStartDate(getJakartaDateValue());
    setAccountIds([]);
    setWalletId("");
    setUrl("");
    setDescription("");
    setShowOptional(false);
    setAddDeadline(false);
    setDeadlineDate("");
    setDeadlineTime("");
    setDeadlineNotes("");
  }, [open, projects]);

  const { mounted, closing } = usePresence(open, 160);
  if (!mounted) return null;

  const project = projects.find((item) => item.id === projectId);
  const canCreate = Boolean(title.trim() && project && startDate && (!addDeadline || deadlineDate) && !busy);
  const projectOptions = projects.map((item) => ({
    value: item.id,
    label: item.name + " · " + item.accounts.length + " account" + (item.accounts.length === 1 ? "" : "s"),
    meta: <ProjectMark project={item} />,
  }));

  function changeProject(nextProjectId: string) {
    setProjectId(nextProjectId);
    setAccountIds([]);
    setWalletId("");
  }

  function toggleAccount(accountId: string) {
    setAccountIds((current) => current.includes(accountId)
      ? current.filter((id) => id !== accountId)
      : [...current, accountId]);
  }

  function submit() {
    if (!canCreate) return;
    onCreate({
      projectId,
      title: title.trim(),
      description: description.trim() || null,
      status,
      frequency,
      priority,
      startDate,
      accountIds,
      walletId: walletId || null,
      url: normalizeHttpUrl(url) || null,
      deadline: addDeadline ? {
        dueDate: deadlineDate,
        dueTime: deadlineTime.trim() || null,
        url: normalizeHttpUrl(url) || null,
        notes: deadlineNotes.trim() || null,
      } : null,
    });
  }

  return (
    <div className={cn("fixed inset-0 z-50 grid place-items-center bg-black/45 px-4 py-5 backdrop-blur-[2px]", closing ? "modal-backdrop-out" : "modal-backdrop-in")} role="dialog" aria-modal="true" aria-labelledby="add-task-title" onClick={() => { if (!busy) onClose(); }}>
      <div className={cn("soft-panel flex max-h-full w-full max-w-[720px] flex-col overflow-hidden rounded-2xl border border-white/[0.065] bg-card shadow-2xl shadow-black/45", closing ? "modal-card-out" : "modal-card-in")} onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-4 px-4 py-3.5">
          <div>
            <h2 id="add-task-title" className="text-base font-semibold tracking-[-0.02em]">Add task</h2>
            <p className="mt-0.5 text-[11px] text-muted-foreground">Create detailed work now, or use Quick add for title-only capture.</p>
          </div>
          <button type="button" onClick={onClose} disabled={busy} className="grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-white/[0.045] hover:text-foreground disabled:opacity-50" aria-label="Close add task"><X className="size-4" /></button>
        </div>

        <div className="scrollbar-subtle flex-1 overflow-y-auto px-6 pb-5 pt-1">
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px] sm:items-end">
            <label className="block">
              <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Task title</span>
              <input autoFocus value={title} onChange={(event) => setTitle(event.target.value)} maxLength={180} className="mt-1.5 h-10 w-full rounded-lg border border-white/[0.055] bg-input px-3 text-sm font-semibold outline-none soft-inset placeholder:text-muted-foreground focus:border-ring" placeholder="Mint NFT, run node, submit proof..." />
            </label>
            <AppSelect label="Project" value={projectId} options={projectOptions} onChange={changeProject} triggerClassName="h-10 rounded-lg" menuClassName="max-h-72" />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <AppDatePicker label="Start date" value={startDate} onChange={setStartDate} timeZone="Asia/Jakarta" triggerClassName="rounded-lg" />
            <AppSelect label="Status" value={status} options={TASK_STATUSES.map((value) => ({ value, label: TASK_STATUS_LABELS[value] }))} onChange={(value) => setStatus(value as TaskStatus)} triggerClassName="rounded-lg" />
            <AppSelect label="Frequency" value={frequency} options={TASK_FREQUENCIES.map((value) => ({ value, label: formatTaskFrequency(value) }))} onChange={(value) => setFrequency(value as TaskFrequency)} triggerClassName="rounded-lg" />
            <AppSelect label="Priority" value={priority} options={TASK_PRIORITIES.map((value) => ({ value, label: capitalize(value) }))} onChange={(value) => setPriority(value as TaskPriority)} triggerClassName="rounded-lg" />
          </div>

          <div className="mt-5">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-semibold">Assigned accounts</span>
              <span className="text-[11px] text-muted-foreground">Empty uses all Project accounts</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {project?.accounts.map((account) => {
                const selected = accountIds.includes(account.id);
                return <button key={account.id} type="button" onClick={() => toggleAccount(account.id)} className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-[background-color,color,transform] duration-150 active:scale-[0.97] motion-reduce:transition-none motion-reduce:transform-none", selected ? "bg-white/[0.11] text-foreground" : "bg-white/[0.035] text-muted-foreground hover:bg-white/[0.06] hover:text-foreground")}><AccountAvatar label={account.label} avatarUrl={account.avatarUrl} />{account.label}</button>;
              })}
              {!project?.accounts.length ? <span className="text-xs text-muted-foreground">This Project has no assigned accounts.</span> : null}
            </div>
          </div>

          <div className="mt-4 max-w-[320px]">
            <AppSelect label="Wallet, optional" value={walletId} options={[{ value: "", label: "No wallet" }, ...(project?.wallets ?? []).map((wallet) => ({ value: wallet.id, label: wallet.label, meta: <span className="text-[9px] text-muted-foreground">W</span> }))]} onChange={setWalletId} disabled={!project?.wallets.length} triggerClassName="rounded-lg" />
          </div>

          <div className="mt-5 border-t soft-divider pt-3">
            <button type="button" onClick={() => setAddDeadline((current) => !current)} aria-expanded={addDeadline} className="flex items-center gap-2 text-xs font-semibold text-foreground">
              <span className={cn("grid size-5 place-items-center rounded-md ring-1 ring-white/[0.08]", addDeadline ? "bg-white/[0.11]" : "bg-white/[0.035]")}><Plus className={cn("size-3.5 transition-transform", addDeadline ? "rotate-45" : "")} /></span>
              Add linked deadline
            </button>
            {addDeadline ? (
              <div className="mt-3 grid gap-3 rounded-xl bg-white/[0.025] p-3 sm:grid-cols-[minmax(0,1fr)_140px]">
                <AppDatePicker label="Due date" value={deadlineDate} onChange={setDeadlineDate} timeZone="Asia/Jakarta" triggerClassName="rounded-lg" />
                <label>
                  <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Time, optional</span>
                  <input value={deadlineTime} onChange={(event) => setDeadlineTime(event.target.value)} inputMode="numeric" maxLength={5} className="mt-1.5 h-8 w-full rounded-lg bg-white/[0.035] px-3 text-xs font-medium outline-none ring-1 ring-white/[0.055] placeholder:text-muted-foreground focus:ring-white/[0.16]" placeholder="20:00" aria-label="Deadline time in 24-hour format" />
                </label>
                <label className="sm:col-span-2">
                  <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Deadline note, optional</span>
                  <input value={deadlineNotes} onChange={(event) => setDeadlineNotes(event.target.value)} maxLength={5000} className="mt-1.5 h-9 w-full rounded-lg border border-white/[0.055] bg-input px-3 text-xs outline-none placeholder:text-muted-foreground focus:border-ring" placeholder="Mint window, claim condition, billing reminder..." />
                </label>
              </div>
            ) : null}
          </div>

          <div className="mt-5 border-t soft-divider pt-3">
            <button type="button" onClick={() => setShowOptional((current) => !current)} aria-expanded={showOptional} className="flex items-center gap-1.5 text-xs font-semibold text-foreground">Optional context<ChevronDown className={cn("size-3.5 text-muted-foreground transition-transform", showOptional ? "rotate-180" : "")} /></button>
            {showOptional ? (
              <div className="mt-3 grid gap-3">
                <label>
                  <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">URL, optional</span>
                  <input type="text" inputMode="url" autoCapitalize="none" autoCorrect="off" value={url} onChange={(event) => setUrl(event.target.value)} onBlur={() => setUrl((current) => normalizeHttpUrl(current))} className="mt-1.5 h-9 w-full rounded-lg border border-white/[0.055] bg-input px-3 text-xs outline-none placeholder:text-muted-foreground focus:border-ring" placeholder="website.com or https://website.com" />
                </label>
                <label>
                  <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Description, optional</span>
                  <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={3} maxLength={5000} className="mt-1.5 w-full resize-none rounded-xl border border-white/[0.055] bg-input px-3 py-2.5 text-xs leading-relaxed outline-none placeholder:text-muted-foreground focus:border-ring" placeholder="Setup notes, wallet requirements, or proof instructions." />
                </label>
              </div>
            ) : null}
          </div>

          {error ? <p role="alert" className="mt-4 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p> : null}
        </div>

        <div className="flex items-center justify-end gap-2 border-t soft-divider bg-muted/20 px-4 py-2.5">
          <Button type="button" variant="secondary" size="sm" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button type="button" size="sm" disabled={!canCreate} onClick={submit}>{busy ? "Creating..." : "Create task"}</Button>
        </div>
      </div>
    </div>
  );
}

function ProjectMark({ project }: { project: TaskProjectOption }) {
  return <span className="grid size-4 place-items-center rounded bg-white/[0.065] bg-cover bg-center text-[8px] font-bold" style={project.logoUrl ? { backgroundImage: "url(" + JSON.stringify(project.logoUrl) + ")" } : undefined}>{project.logoUrl ? <span className="sr-only">{project.name}</span> : project.name.slice(0, 1).toUpperCase()}</span>;
}

function AccountAvatar({ label, avatarUrl }: { label: string; avatarUrl: string | null }) {
  return <span className="grid size-5 shrink-0 place-items-center rounded-full bg-background bg-cover bg-center text-[9px] font-semibold" style={avatarUrl ? { backgroundImage: "url(" + JSON.stringify(avatarUrl) + ")" } : undefined}>{avatarUrl ? <span className="sr-only">{label}</span> : label.slice(0, 1).toUpperCase()}</span>;
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
