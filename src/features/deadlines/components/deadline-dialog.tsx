"use client";

import { ExternalLink, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import {
  createDeadline,
  deleteDeadline,
  updateDeadline,
  type DeadlineOptions,
  type DeadlineWithContext,
} from "@/features/deadlines/actions";

import { AppDatePicker } from "@/components/ui/app-date-picker";
import { AppSelect } from "@/components/ui/app-select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { normalizeHttpUrl } from "@/lib/url";
import { usePresence } from "@/lib/use-presence";

type DeadlineDialogProps = {
  open: boolean;
  onClose: () => void;
  options: DeadlineOptions;
  deadline?: DeadlineWithContext | null;
  onSaved?: (deadline: DeadlineWithContext) => void;
  onDeleted?: (id: string) => void;
};

const statusOptions = [
  { value: "upcoming", label: "Upcoming" },
  { value: "done", label: "Done" },
  { value: "cancelled", label: "Cancelled" },
];

export function DeadlineDialog({
  open,
  onClose,
  options,
  deadline,
  onSaved,
  onDeleted,
}: DeadlineDialogProps) {
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("");
  const [status, setStatus] = useState("upcoming");
  const [linkedProjectId, setLinkedProjectId] = useState("");
  const [linkedTaskId, setLinkedTaskId] = useState("");
  const [url, setUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [deleteArmed, setDeleteArmed] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setTitle(deadline?.title ?? "");
    setDueDate(deadline?.dueDate ?? "");
    setDueTime(deadline?.dueTime?.slice(0, 5) ?? "");
    setStatus(deadline?.status ?? "upcoming");
    setLinkedProjectId(deadline?.linkedProjectId ?? "");
    setLinkedTaskId(deadline?.linkedTaskId ?? "");
    setUrl(deadline?.url ?? "");
    setNotes(deadline?.notes ?? "");
    setDeleteArmed(false);
    setError("");
  }, [deadline, open]);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (document.querySelector('[data-app-floating-menu="true"]')) return;
      onClose();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, open]);

  const availableTasks = useMemo(() => {
    if (!linkedProjectId) return options.tasks;
    return options.tasks.filter((task) => task.projectId === linkedProjectId);
  }, [linkedProjectId, options.tasks]);

  const { mounted, closing } = usePresence(open, 160);
  if (!mounted) return null;

  const canSave = title.trim().length > 0 && dueDate.length > 0 && !isSaving;
  const projectOptions = [
    { value: "", label: "No project" },
    ...options.projects.map((project) => ({ value: project.id, label: project.name })),
  ];
  const taskOptions = [
    { value: "", label: "No related task" },
    ...availableTasks.map((task) => ({
      value: task.id,
      label: task.title,
      meta: task.projectName ? <span className="text-[9px] text-muted-foreground">{task.projectName.slice(0, 1)}</span> : undefined,
    })),
  ];
  const linkedNftName = deadline?.linkedNftCampaignName;

  async function save() {
    if (!canSave) return;
    setIsSaving(true);
    setError("");

    try {
      const values = {
        title: title.trim(),
        dueDate,
        dueTime: dueTime.trim(),
        status: status as "upcoming" | "done" | "cancelled",
        linkedProjectId: linkedProjectId || null,
        linkedTaskId: linkedTaskId || null,
        url: normalizeHttpUrl(url),
        notes: notes.trim(),
      };
      const saved = deadline
        ? await updateDeadline(deadline.id, values)
        : await createDeadline(values);
      onSaved?.(saved);
      onClose();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to save deadline");
    } finally {
      setIsSaving(false);
    }
  }

  async function remove() {
    if (!deadline) return;
    if (!deleteArmed) {
      setDeleteArmed(true);
      return;
    }

    setIsSaving(true);
    setError("");
    try {
      await deleteDeadline(deadline.id);
      onDeleted?.(deadline.id);
      onClose();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to delete deadline");
    } finally {
      setIsSaving(false);
    }
  }

  function changeProject(nextProjectId: string) {
    setLinkedProjectId(nextProjectId);
    const selectedTask = options.tasks.find((task) => task.id === linkedTaskId);
    if (selectedTask?.projectId && selectedTask.projectId !== nextProjectId) {
      setLinkedTaskId("");
    }
  }

  function changeTask(nextTaskId: string) {
    setLinkedTaskId(nextTaskId);
    const selectedTask = options.tasks.find((task) => task.id === nextTaskId);
    if (selectedTask?.projectId) setLinkedProjectId(selectedTask.projectId);
  }

  return (
    <div
      className={cn("fixed inset-0 z-[100] grid place-items-center bg-black/45 px-4 backdrop-blur-[2px]", closing ? "modal-backdrop-out" : "modal-backdrop-in")}
      role="dialog"
      aria-modal="true"
      aria-labelledby="deadline-dialog-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className={cn("soft-panel max-h-[calc(100vh-32px)] w-full max-w-[620px] overflow-y-auto rounded-2xl border border-white/[0.065] bg-card shadow-2xl shadow-black/45 scrollbar-subtle", closing ? "modal-card-out" : "modal-card-in")}>
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 bg-card/95 px-5 py-4 backdrop-blur">
          <div>
            <h2 id="deadline-dialog-title" className="text-base font-semibold tracking-[-0.02em]">
              {deadline ? "Edit deadline" : "Add deadline"}
            </h2>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {linkedNftName ? "This mint schedule is linked to its NFT campaign." : "Project and Task links are optional."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-white/[0.045] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Close deadline dialog"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-4 px-5 pb-5">
          <label className="block">
            <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Title</span>
            <input
              autoFocus
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={160}
              className="mt-1.5 h-10 w-full rounded-lg border border-white/[0.055] bg-input px-3 text-sm font-semibold outline-none soft-inset placeholder:text-muted-foreground focus:border-ring"
              placeholder="Mint NFT, cancel billing, renew proxy..."
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_140px]">
            <AppDatePicker label="Due date" value={dueDate} onChange={setDueDate} timeZone="Asia/Jakarta" />
            <label>
              <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Time, optional</span>
              <input
                value={dueTime}
                onChange={(event) => setDueTime(event.target.value)}
                inputMode="numeric"
                maxLength={5}
                className="mt-1.5 h-8 w-full rounded-full bg-white/[0.035] px-3 text-xs font-medium text-foreground outline-none ring-1 ring-white/[0.055] placeholder:text-muted-foreground focus:ring-white/[0.16]"
                placeholder="20:00"
                aria-label="Deadline time in 24-hour format"
              />
            </label>
          </div>

          {linkedNftName ? (
            <div className="rounded-xl bg-white/[0.025] px-3 py-2.5 ring-1 ring-white/[0.045]">
              <span className="block text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">NFT campaign</span>
              <span className="mt-1 block text-xs font-medium">{linkedNftName}</span>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <AppSelect label="Project, optional" value={linkedProjectId} options={projectOptions} onChange={changeProject} />
              <AppSelect label="Related task, optional" value={linkedTaskId} options={taskOptions} onChange={changeTask} />
            </div>
          )}

          {deadline ? (
            <AppSelect label="Status" value={status} options={statusOptions} onChange={setStatus} className="max-w-[220px]" />
          ) : null}

          <label className="block">
            <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">URL, optional</span>
            <span className="relative mt-1.5 block">
              <ExternalLink className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                inputMode="url"
                autoCapitalize="none"
                autoCorrect="off"
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                onBlur={() => setUrl((value) => normalizeHttpUrl(value))}
                className="h-9 w-full rounded-lg border border-white/[0.055] bg-input pl-9 pr-3 text-xs outline-none soft-inset placeholder:text-muted-foreground focus:border-ring"
                placeholder="website.com or https://website.com"
              />
            </span>
          </label>

          <label className="block">
            <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Notes, optional</span>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={3}
              maxLength={5000}
              className="mt-1.5 w-full resize-none rounded-xl border border-white/[0.055] bg-input px-3 py-2.5 text-xs leading-relaxed outline-none soft-inset placeholder:text-muted-foreground focus:border-ring"
              placeholder="Add context, renewal conditions, or claim instructions."
            />
          </label>

          {error ? <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p> : null}
        </div>

        <div className="sticky bottom-0 flex items-center justify-between gap-3 border-t bg-card/95 px-5 py-3 backdrop-blur soft-divider">
          <div>
            {deadline ? (
              <Button type="button" variant="ghost" size="sm" onClick={remove} disabled={isSaving} className={deleteArmed ? "bg-white/[0.08] font-semibold text-foreground" : "text-foreground"}>
                <Trash2 className="size-3.5" />
                {deleteArmed ? "Confirm delete" : "Delete"}
              </Button>
            ) : null}
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={onClose} disabled={isSaving}>Cancel</Button>
            <Button type="button" size="sm" onClick={save} disabled={!canSave}>
              {isSaving ? "Saving..." : deadline ? "Save changes" : "Create deadline"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
