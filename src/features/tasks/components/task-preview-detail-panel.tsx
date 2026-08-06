"use client";

import { ExternalLink, X } from "lucide-react";
import { useEffect, useRef } from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { isHttpUrl, normalizeHttpUrl } from "@/lib/url";
import { useDrawerDismiss } from "@/lib/use-drawer-dismiss";
import { usePresence } from "@/lib/use-presence";

export type TaskPreviewDetail = {
  title: string;
  project?: string;
  mark?: string;
  status: string;
  frequency: string;
  priority?: string;
  accounts?: string[];
  url?: string;
  notes?: string;
  date?: string;
};

export function TaskPreviewDetailPanel({ task, onClose }: { task: TaskPreviewDetail | null; onClose: () => void }) {
  useDrawerDismiss(onClose, Boolean(task));

  const lastTask = useRef<TaskPreviewDetail | null>(task);
  useEffect(() => {
    if (task) lastTask.current = task;
  }, [task]);
  const { mounted, closing } = usePresence(Boolean(task), 260);
  if (!mounted) return null;
  const activeTask = task ?? lastTask.current;
  if (!activeTask) return null;
  const normalizedUrl = normalizeHttpUrl(activeTask.url);

  return (
    <div className={cn("fixed inset-0 z-50 flex justify-end bg-black/35 backdrop-blur-[2px]", closing ? "drawer-backdrop-out" : "drawer-backdrop-in")} role="dialog" aria-modal="true" aria-labelledby="task-preview-detail-title" onClick={onClose}>
      <aside className={cn("h-full w-full max-w-[500px] overflow-y-auto border-l soft-divider bg-card shadow-2xl shadow-black/50", closing ? "drawer-panel-out" : "drawer-panel-in")} onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between border-b soft-divider px-5 py-3">
          <h2 id="task-preview-detail-title" className="text-base font-semibold">Task detail</h2>
          <button type="button" onClick={onClose} className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground" aria-label="Close task detail"><X className="size-4" /></button>
        </div>
        <div className="px-5 py-5">
          <div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/[0.065] text-xs font-bold text-[#c4cad3]">{activeTask.mark ?? activeTask.project?.slice(0, 1) ?? "T"}</span><div><h3 className="text-xl font-semibold tracking-[-0.02em]">{activeTask.title}</h3><p className="mt-1 text-xs text-muted-foreground">{activeTask.project ?? "Personal"}</p></div></div>
          <div className="mt-6 grid gap-4 border-t border-white/[0.045] pt-4 sm:grid-cols-2"><Property label="Status"><Badge variant="secondary">{activeTask.status}</Badge></Property><Property label="Frequency"><Badge variant="outline">{activeTask.frequency}</Badge></Property>{activeTask.priority ? <Property label="Priority">{activeTask.priority}</Property> : null}{activeTask.date ? <Property label="Schedule">{activeTask.date}</Property> : null}{activeTask.accounts?.length ? <Property label="Accounts">{activeTask.accounts.join(", ")}</Property> : null}</div>
          {isHttpUrl(normalizedUrl) ? <a href={normalizedUrl} target="_blank" rel="noreferrer" className="mt-5 inline-flex h-8 items-center gap-2 rounded-lg bg-white/[0.055] px-3 text-xs font-medium hover:bg-white/[0.09]"><ExternalLink className="size-3.5" />Open link</a> : null}
          {activeTask.notes ? <section className="mt-5"><h4 className="text-sm font-semibold">Notes</h4><p className="mt-2 rounded-xl bg-white/[0.025] px-3 py-3 text-xs leading-relaxed text-muted-foreground">{activeTask.notes}</p></section> : null}
        </div>
      </aside>
    </div>
  );
}

function Property({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><p className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">{label}</p><div className="mt-1 text-xs text-foreground">{children}</div></div>;
}
