"use client";

import Link from "next/link";
import { ArrowUpRight, ExternalLink, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type TaskDetailPanelTask = {
  title: string;
  project?: string;
  mark?: string;
  markClass?: string;
  status: string;
  frequency: string;
  priority?: string;
  accounts?: string[];
  url?: string;
  notes?: string;
  mode?: string;
  date?: string;
};

export function TaskDetailPanel({ task, onClose }: { task: TaskDetailPanelTask | null; onClose: () => void }) {
  if (!task) return null;

  const projectName = task.project ?? "Personal";
  const taskMark = task.mark ?? projectName.slice(0, 1).toUpperCase();
  const taskMarkClass = task.markClass ?? "bg-white/[0.065] text-[#c4cad3]";

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-full justify-end bg-black/35 backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-labelledby="task-detail-title">
      <aside className="h-full w-full max-w-[520px] overflow-y-auto border-l soft-divider bg-card shadow-2xl shadow-black/50 scrollbar-subtle">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b soft-divider bg-card/95 px-5 py-3 backdrop-blur">
          <h2 id="task-detail-title" className="truncate text-base font-semibold">Task detail</h2>
          <button onClick={onClose} className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground" aria-label="Close task detail">
            <X className="size-4" />
          </button>
        </div>

        <div className="px-5 py-5">
          <div className="flex items-start gap-3">
            <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl text-xs font-bold shadow-sm", taskMarkClass)}>{taskMark}</span>
            <div className="min-w-0 flex-1">
              <h3 className="text-2xl font-semibold tracking-[-0.03em]">{task.title}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{projectName}{task.mode ? " · " + task.mode : ""}</p>
            </div>
          </div>

          <section className="mt-6 grid gap-x-6 gap-y-4 border-t border-white/[0.045] pt-4 sm:grid-cols-2">
            <TaskProperty label="Status"><Badge variant={statusVariant(task.status)}>{task.status}</Badge></TaskProperty>
            <TaskProperty label="Frequency"><Badge variant="outline">{task.frequency}</Badge></TaskProperty>
            {task.priority ? <TaskProperty label="Priority"><PriorityValue value={task.priority} /></TaskProperty> : null}
            {task.date ? <TaskProperty label="Date start"><span>{task.date}</span></TaskProperty> : null}
            {task.accounts && task.accounts.length > 0 ? <TaskProperty label="Accounts"><AccountChips accounts={task.accounts} /></TaskProperty> : null}
          </section>

          {task.url ? (
            <a
              href={task.url}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex h-8 items-center gap-2 rounded-lg bg-white/[0.055] px-3 text-xs font-medium text-foreground transition-colors hover:bg-white/[0.09]"
            >
              <ExternalLink className="size-3.5" />
              Open link
            </a>
          ) : null}

          {task.notes ? (
            <section className="mt-5">
              <h4 className="text-sm font-semibold">Notes</h4>
              <p className="mt-2 rounded-xl bg-white/[0.025] px-3 py-3 text-xs leading-relaxed text-muted-foreground">{task.notes}</p>
            </section>
          ) : null}
        </div>

        <div className="sticky bottom-0 border-t soft-divider bg-card/95 px-5 py-3 backdrop-blur">
          <Link href="/tasks" className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground">
            View in Tasks
            <ArrowUpRight className="size-3.5" />
          </Link>
        </div>
      </aside>
    </div>
  );
}

function TaskProperty({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">{label}</p>
      <div className="mt-1 text-xs text-foreground">{children}</div>
    </div>
  );
}

function AccountChips({ accounts }: { accounts: string[] }) {
  return (
    <div className="flex flex-wrap gap-1">
      {accounts.map((account) => (
        <span key={account} className="inline-flex items-center gap-1 rounded-full bg-white/[0.055] px-2 py-1 text-[11px] font-medium text-muted-foreground">
          <span className="grid size-4 place-items-center rounded-full bg-background text-[9px] font-semibold">{account[0]}</span>
          {account}
        </span>
      ))}
    </div>
  );
}

function PriorityValue({ value }: { value: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <PrioritySignal value={value} />
      {value}
    </span>
  );
}

function PrioritySignal({ value }: { value: string }) {
  const activeBars = value === "High" ? 3 : value === "Medium" ? 2 : 1;

  return (
    <svg className="size-4 shrink-0 text-muted-foreground" viewBox="0 0 16 16" aria-hidden="true" fill="currentColor">
      {[0, 1, 2].map((bar) => (
        <rect key={bar} x={3 + bar * 4} y={10 - bar * 3} width="2.6" height={4 + bar * 3} rx="1" opacity={bar < activeBars ? 1 : 0.28} />
      ))}
    </svg>
  );
}

function statusVariant(status: string) {
  switch (status) {
    case "Running":
      return "success" as const;
    case "Recheck":
      return "warning" as const;
    case "Done":
      return "outline" as const;
    case "In progress":
      return "info" as const;
    default:
      return "secondary" as const;
  }
}
