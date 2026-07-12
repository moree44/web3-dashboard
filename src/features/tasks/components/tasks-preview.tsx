"use client";

import {
  CalendarClock,
  Check,
  ChevronDown,
  Filter,
  MoreHorizontal,
  Plus,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useState, type ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type TaskStatus = "Todo" | "In progress" | "Running" | "Recheck" | "Done";
type TaskView = "list" | "board" | "running" | "recheck";
type BoardGroup = "project" | "status";

type Task = {
  project: string;
  mark: string;
  markClass: string;
  title: string;
  description: string;
  mode: string;
  modeGroup: "site" | "discord" | "proof" | "node" | "waitlist" | "claim";
  status: TaskStatus;
  frequency: "once" | "daily" | "weekly" | "monthly" | "custom";
  priority: "High" | "Medium" | "Low";
  accounts: string[];
  due: string;
  lastLog: string;
  comments: number;
  proofs: number;
  runtime?: string;
  checkCadence?: string;
};

const viewTabs: { label: string; value: TaskView }[] = [
  { label: "List", value: "list" },
  { label: "Board", value: "board" },
  { label: "Running", value: "running" },
  { label: "Recheck", value: "recheck" },
];

const projectFilterOptions = ["All", "Soundness", "NexusHQ", "Linera", "Huddle01", "Drosera"];
const accountFilterOptions = ["All", "Moree", "Wdym", "Wayss"];
const modeFilterOptions = ["All", "Site interaction", "Discord activity", "Proof submit", "Node / CLI", "Waitlist check", "Claim", "Form registration"];
const statusOptions: TaskStatus[] = ["Todo", "In progress", "Running", "Recheck", "Done"];
const frequencyOptions: Task["frequency"][] = ["once", "daily", "weekly", "monthly", "custom"];
const priorityOptions: Task["priority"][] = ["High", "Medium", "Low"];
const boardGroupOptions: { label: string; value: BoardGroup }[] = [
  { label: "By Project", value: "project" },
  { label: "By Status", value: "status" },
];

const tasks: Task[] = [
  {
    project: "Soundness",
    mark: "S",
    markClass: "bg-white/[0.065] text-[#c4cad3]",
    title: "Submit proof after address generated",
    description: "Upload proof link and confirm it for Moree before the reset window closes.",
    mode: "Proof submit",
    modeGroup: "proof",
    status: "Todo",
    frequency: "once",
    priority: "High",
    accounts: ["Moree"],
    due: "Today",
    lastLog: "No log",
    comments: 2,
    proofs: 0,
  },
  {
    project: "Soundness",
    mark: "S",
    markClass: "bg-white/[0.065] text-[#c4cad3]",
    title: "Daily check-in on dashboard",
    description: "Open project dashboard, check points, and save any change in project docs.",
    mode: "Site interaction",
    modeGroup: "site",
    status: "Todo",
    frequency: "daily",
    priority: "Medium",
    accounts: ["Moree", "Wdym"],
    due: "Daily",
    lastLog: "Yesterday",
    comments: 1,
    proofs: 0,
  },
  {
    project: "NexusHQ",
    mark: "N",
    markClass: "bg-white/[0.065] text-[#c4cad3]",
    title: "Run prover node",
    description: "Keep prover process alive, check logs, and re-run if session drops.",
    mode: "Node / CLI",
    modeGroup: "node",
    status: "Running",
    frequency: "custom",
    priority: "High",
    accounts: ["Moree"],
    due: "Monitor",
    lastLog: "Checked 1h ago",
    comments: 4,
    proofs: 1,
    runtime: "Running 2d",
    checkCadence: "Check twice daily",
  },
  {
    project: "Linera",
    mark: "L",
    markClass: "bg-white/[0.065] text-[#c4cad3]",
    title: "Complete Galxe quest",
    description: "Finish social quest, verify wallet, and save campaign proof if required.",
    mode: "Site interaction",
    modeGroup: "site",
    status: "In progress",
    frequency: "daily",
    priority: "Medium",
    accounts: ["Wdym"],
    due: "Tomorrow",
    lastLog: "8h ago",
    comments: 3,
    proofs: 1,
  },
  {
    project: "Linera",
    mark: "L",
    markClass: "bg-white/[0.065] text-[#c4cad3]",
    title: "Farm Discord role activity",
    description: "Do light activity, avoid spam, and recheck role progress after reset.",
    mode: "Discord activity",
    modeGroup: "discord",
    status: "In progress",
    frequency: "daily",
    priority: "Medium",
    accounts: ["Wdym", "Wayss"],
    due: "Daily",
    lastLog: "Yesterday",
    comments: 1,
    proofs: 0,
  },
  {
    project: "Huddle01",
    mark: "H",
    markClass: "bg-white/[0.065] text-[#c4cad3]",
    title: "Recheck eligibility result",
    description: "Check waitlist status and capture result into project docs.",
    mode: "Waitlist check",
    modeGroup: "waitlist",
    status: "Recheck",
    frequency: "once",
    priority: "Medium",
    accounts: ["Wdym"],
    due: "Friday",
    lastLog: "2d ago",
    comments: 2,
    proofs: 0,
  },
  {
    project: "Drosera",
    mark: "D",
    markClass: "bg-white/[0.065] text-[#c4cad3]",
    title: "Claim badge after role sync",
    description: "Return after role sync finishes and claim badge if eligible.",
    mode: "Claim",
    modeGroup: "claim",
    status: "Recheck",
    frequency: "once",
    priority: "High",
    accounts: ["Moree"],
    due: "Jul 18",
    lastLog: "1d ago",
    comments: 5,
    proofs: 1,
  },
  {
    project: "Linera",
    mark: "L",
    markClass: "bg-white/[0.065] text-[#c4cad3]",
    title: "Register testnet incentive",
    description: "Submitted form and saved registration confirmation.",
    mode: "Form registration",
    modeGroup: "waitlist",
    status: "Done",
    frequency: "once",
    priority: "Low",
    accounts: ["Wdym"],
    due: "Done",
    lastLog: "Apr 18",
    comments: 1,
    proofs: 1,
  },
];

const boardColumns: TaskStatus[] = ["Todo", "In progress", "Recheck", "Done"];

function statusVariant(status: TaskStatus) {
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

function Priority({ value, compact = false }: { value: Task["priority"]; compact?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-muted-foreground", compact ? "text-[11px]" : "text-xs")}>
      <PrioritySignal value={value} />
      {value}
    </span>
  );
}

function PrioritySignal({ value }: { value: Task["priority"] }) {
  const activeBars = value === "High" ? 3 : value === "Medium" ? 2 : 1;

  return (
    <svg className="size-4 shrink-0 text-muted-foreground" viewBox="0 0 16 16" aria-hidden="true" fill="currentColor">
      {[0, 1, 2].map((bar) => (
        <rect
          key={bar}
          x={3 + bar * 4}
          y={10 - bar * 3}
          width="2.6"
          height={4 + bar * 3}
          rx="1"
          opacity={bar < activeBars ? 1 : 0.28}
        />
      ))}
    </svg>
  );
}

function ModeChip({ task }: { task: Task }) {
  return <span className="inline-flex w-fit rounded-md bg-white/[0.045] px-1.5 py-0.5 text-[10px] font-medium text-[#aeb5bd]">{task.mode}</span>;
}

function AccountChips({ accounts }: { accounts: string[] }) {
  return (
    <div className="flex max-w-24 gap-1 overflow-hidden">
      {accounts.slice(0, 3).map((account) => (
        <span key={account} className="grid size-6 shrink-0 place-items-center rounded-full bg-white/[0.055] text-[10px] font-semibold text-muted-foreground" title={account}>
          {account[0]}
        </span>
      ))}
      {accounts.length > 3 ? <span className="grid size-6 shrink-0 place-items-center rounded-full bg-white/[0.055] text-[10px] font-semibold text-muted-foreground">+{accounts.length - 3}</span> : null}
    </div>
  );
}

function TaskMark({ task, size = "md" }: { task: Task; size?: "sm" | "md" }) {
  return (
    <span className={cn("grid shrink-0 place-items-center rounded-lg font-bold shadow-sm", size === "sm" ? "size-7 text-[10px]" : "size-8 text-[11px]", task.markClass)}>
      {task.mark}
    </span>
  );
}

function TaskIdentity({ task }: { task: Task }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <TaskMark task={task} />
      <span className="min-w-0">
        <span className="block max-w-full truncate text-[13px] font-semibold">{task.title}</span>
        <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">{task.project} · {task.mode}</span>
      </span>
    </div>
  );
}

function TaskListRow({ task, onOpen }: { task: Task; onOpen: () => void }) {
  return (
    <tr className="group h-[58px] border-b soft-divider hover:bg-accent/30">
      <td className="px-4 lg:px-6">
        <button type="button" onClick={onOpen} className="w-full text-left">
          <TaskIdentity task={task} />
        </button>
      </td>
      <td className="px-3"><ModeChip task={task} /></td>
      <td className="px-3"><Badge variant={statusVariant(task.status)} className="text-[10px]">{task.status}</Badge></td>
      <td className="px-3"><Badge variant="outline" className="text-[10px]">{task.frequency}</Badge></td>
      <td className="px-3"><AccountChips accounts={task.accounts} /></td>
      <td className="whitespace-nowrap px-3 text-xs text-muted-foreground">{task.due}</td>
      <td className="px-3"><Priority value={task.priority} /></td>
      <td className="w-12 px-3">
        <button className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground" aria-label={"More options for " + task.title}>
          <MoreHorizontal className="size-4" />
        </button>
      </td>
    </tr>
  );
}

function TaskBoardCard({ task, onOpen, hideProject = false }: { task: Task; onOpen: () => void; hideProject?: boolean }) {
  return (
    <article className="rounded-xl bg-white/[0.025] p-2.5 transition-colors hover:bg-white/[0.04]">
      <div className="flex items-start justify-between gap-2">
        <button type="button" onClick={onOpen} className="flex min-w-0 items-center gap-2 text-left">
          <TaskMark task={task} size="sm" />
          <span className="min-w-0">
            <span className={cn("block truncate font-medium", hideProject ? "text-[13px] text-foreground" : "text-[11px] text-muted-foreground")}>{hideProject ? task.title : task.project}</span>
            {hideProject ? <span className="mt-0.5 block truncate text-[10px] text-muted-foreground">{task.mode}</span> : null}
          </span>
        </button>
        <button className="grid size-6 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-white/[0.045] hover:text-foreground" aria-label={"More options for " + task.title}>
          <MoreHorizontal className="size-3.5" />
        </button>
      </div>

      {!hideProject ? (
        <button type="button" onClick={onOpen} className="mt-2 block w-full text-left">
          <h3 className="line-clamp-2 text-[13px] font-semibold leading-snug">{task.title}</h3>
        </button>
      ) : null}

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <Badge variant={statusVariant(task.status)} className="text-[10px]">{task.status}</Badge>
        <Badge variant="outline" className="text-[10px]">{task.frequency}</Badge>
        {!hideProject ? <ModeChip task={task} /> : null}
      </div>

      <div className="mt-2 flex items-center justify-between gap-3">
        <AccountChips accounts={task.accounts} />
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <CalendarClock className="size-3" />
          <span>{task.due}</span>
        </div>
      </div>
    </article>
  );
}

function BoardColumn({ status, items, onOpenTask }: { status: TaskStatus; items: Task[]; onOpenTask: (task: Task) => void }) {
  return (
    <section className="w-[300px] shrink-0 rounded-xl bg-card/80 soft-panel">
      <div className="flex items-start justify-between gap-3 px-3 py-2.5">
        <div>
          <h2 className="text-sm font-semibold">{status}</h2>
          <p className="mt-0.5 text-[11px] text-muted-foreground">{items.length} card{items.length === 1 ? "" : "s"}</p>
        </div>
        <button className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground" aria-label={"More options for " + status}>
          <MoreHorizontal className="size-3.5" />
        </button>
      </div>

      <div className="p-2">
        <div className="space-y-2">
          {items.map((task) => <TaskBoardCard key={`${task.project}-${task.title}`} task={task} onOpen={() => onOpenTask(task)} />)}
          {items.length === 0 ? <div className="rounded-lg border border-dashed border-white/[0.06] px-3 py-8 text-center text-[11px] text-muted-foreground">No tasks</div> : null}
        </div>
      </div>
    </section>
  );
}


function ProjectBoardColumn({ project, items, total, onOpenTask }: { project: string; items: Task[]; total: number; onOpenTask: (task: Task) => void }) {
  const sample = items[0] ?? tasks.find((task) => task.project === project);

  return (
    <section className="w-[300px] shrink-0 rounded-xl bg-card/80 soft-panel">
      <div className="flex items-start justify-between gap-3 px-3 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          {sample ? <TaskMark task={sample} size="sm" /> : null}
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold">{project}</h2>
            <p className="mt-0.5 text-[11px] text-muted-foreground">{items.length}/{total} task{total === 1 ? "" : "s"}</p>
          </div>
        </div>
        <button className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground" aria-label={"More options for " + project}>
          <MoreHorizontal className="size-3.5" />
        </button>
      </div>

      <div className="p-2">
        <div className="space-y-2">
          {items.map((task) => <TaskBoardCard key={`${task.project}-${task.title}`} task={task} onOpen={() => onOpenTask(task)} hideProject />)}
          {items.length === 0 ? <div className="rounded-lg border border-dashed border-white/[0.06] px-3 py-8 text-center text-[11px] text-muted-foreground">No tasks</div> : null}
        </div>
      </div>
    </section>
  );
}

function TaskFilterSelect({
  id,
  label,
  value,
  options,
  onChange,
  openFilter,
  setOpenFilter,
  icon,
}: {
  id: string;
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
  openFilter: string | null;
  setOpenFilter: (value: string | null) => void;
  icon?: ReactNode;
}) {
  const isOpen = openFilter === id;

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpenFilter(isOpen ? null : id)}
        className="flex h-8 min-w-[120px] items-center gap-2 rounded-lg border border-white/[0.055] bg-white/[0.015] px-3 text-xs text-muted-foreground transition-colors hover:bg-white/[0.045] hover:text-foreground"
        aria-label={`Filter tasks by ${label.toLowerCase()}`}
      >
        {icon}
        <span>{label}:</span>
        <span className="max-w-32 truncate font-semibold text-foreground">{value}</span>
        <ChevronDown className={cn("ml-auto size-3.5 text-muted-foreground transition-transform", isOpen ? "rotate-180" : "")} />
      </button>
      {isOpen ? (
        <div className="absolute left-0 top-full z-[60] mt-1.5 w-56 rounded-xl border border-white/[0.08] bg-[#161618] p-1.5 shadow-2xl shadow-black/50">
          {options.map((option) => {
            const selected = value === option;
            return (
              <button
                key={option}
                type="button"
                onClick={() => {
                  onChange(option);
                  setOpenFilter(null);
                }}
                className={cn(
                  "flex h-8 w-full items-center justify-between gap-3 rounded-lg px-2.5 text-left text-xs transition-colors",
                  selected ? "bg-white/[0.075] text-foreground" : "text-muted-foreground hover:bg-white/[0.055] hover:text-foreground",
                )}
              >
                <span className="truncate font-medium">{option}</span>
                {selected ? <Check className="size-3.5 text-muted-foreground" /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function CompactRunningMonitor({ task, onOpen }: { task: Task; onOpen?: () => void }) {
  return (
    <article className="grid gap-3 rounded-lg bg-white/[0.02] px-3 py-2 lg:grid-cols-[minmax(260px,1fr)_100px_120px_80px] lg:items-center">
      <button type="button" onClick={onOpen} className="flex min-w-0 items-center gap-2.5 text-left">
        <TaskMark task={task} size="sm" />
        <span className="min-w-0">
          <span className="block truncate text-[13px] font-semibold">{task.title}</span>
          <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">{task.project}</span>
        </span>
      </button>
      <span className="text-xs font-medium text-muted-foreground">{task.runtime ?? "Running"}</span>
      <span className="text-xs text-muted-foreground">{task.lastLog}</span>
      <AccountChips accounts={task.accounts} />
    </article>
  );
}


function ReviewQueueCard({ task, onOpen }: { task: Task; onOpen: () => void }) {
  return (
    <article className="grid gap-3 border-b soft-divider px-4 py-3 hover:bg-accent/25 lg:grid-cols-[minmax(280px,1fr)_140px_120px_110px_80px] lg:items-center lg:px-6">
      <button type="button" onClick={onOpen} className="text-left"><TaskIdentity task={task} /></button>
      <div className="flex items-center gap-2 lg:block">
        <span className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground lg:block">Due</span>
        <span className="text-xs font-medium text-warning lg:mt-1 lg:block">{task.due}</span>
      </div>
      <AccountChips accounts={task.accounts} />
      <Priority value={task.priority} compact />
      <Button variant="secondary" size="sm">Review</Button>
    </article>
  );
}

function TaskMobileCard({ task, onOpen }: { task: Task; onOpen: () => void }) {
  return (
    <article className="px-4 py-4 hover:bg-accent/25 sm:px-6">
      <div className="flex items-start justify-between gap-3">
        <button type="button" onClick={onOpen} className="text-left"><TaskIdentity task={task} /></button>
        <button aria-label={"More options for " + task.title}><MoreHorizontal className="size-4 text-muted-foreground" /></button>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <ModeChip task={task} />
        <Badge variant={statusVariant(task.status)}>{task.status}</Badge>
        <Badge variant="outline">{task.frequency}</Badge>
        <Priority value={task.priority} />
        <AccountChips accounts={task.accounts} />
      </div>

    </article>
  );
}

function AddTaskDialog({ open, onClose, onCreate }: { open: boolean; onClose: () => void; onCreate: (task: Task) => void }) {
  const [title, setTitle] = useState("");
  const [project, setProject] = useState("Soundness");
  const [status, setStatus] = useState<TaskStatus>("Todo");
  const [frequency, setFrequency] = useState<Task["frequency"]>("once");
  const [priority, setPriority] = useState<Task["priority"]>("Medium");
  const [account, setAccount] = useState("Moree");
  const [mode, setMode] = useState("Site interaction");
  const [due, setDue] = useState("Today");
  const [note, setNote] = useState("");
  const [openSelect, setOpenSelect] = useState<string | null>(null);

  if (!open) return null;

  const projectMark = project[0] ?? "T";
  const canCreate = title.trim().length > 0;

  return (
    <div className="modal-backdrop-in fixed inset-0 z-50 grid place-items-center bg-black/45 px-4 backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-labelledby="add-task-title">
      <div className="modal-card-in soft-panel w-full max-w-[640px] overflow-hidden rounded-2xl border border-white/[0.065] bg-card shadow-2xl shadow-black/45">
        <div className="flex items-start justify-between gap-4 px-4 py-3.5">
          <div>
            <h2 id="add-task-title" className="text-base font-semibold tracking-[-0.02em]">Add task</h2>
            <p className="mt-0.5 text-[11px] text-muted-foreground">Create the task first. Details can be completed later.</p>
          </div>
          <button onClick={onClose} className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-white/[0.045] hover:text-foreground" aria-label="Close add task"><X className="size-4" /></button>
        </div>

        <div className="px-4 pb-4">
          <label className="block px-2">
            <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Task title</span>
            <input autoFocus value={title} onChange={(event) => setTitle(event.target.value)} className="mt-1.5 h-10 w-full soft-inset rounded-lg border border-white/[0.055] bg-input px-3 text-sm font-semibold outline-none placeholder:text-muted-foreground focus:border-ring" placeholder="Submit proof, daily check-in, recheck eligibility..." />
          </label>

          <div className="mt-3 grid gap-3 px-2 md:grid-cols-2">
            <SelectField id="task-project" label="Project" value={project} options={projectFilterOptions.filter((item) => item !== "All")} onChange={setProject} openSelect={openSelect} setOpenSelect={setOpenSelect} />
            <SelectField id="task-account" label="Account" value={account} options={accountFilterOptions.filter((item) => item !== "All")} onChange={setAccount} openSelect={openSelect} setOpenSelect={setOpenSelect} />
            <SelectField id="task-status" label="Status" value={status} options={statusOptions} onChange={(value) => setStatus(value as TaskStatus)} openSelect={openSelect} setOpenSelect={setOpenSelect} />
            <SelectField id="task-frequency" label="Frequency" value={frequency} options={frequencyOptions} onChange={(value) => setFrequency(value as Task["frequency"])} openSelect={openSelect} setOpenSelect={setOpenSelect} />
            <SelectField id="task-priority" label="Priority" value={priority} options={priorityOptions} onChange={(value) => setPriority(value as Task["priority"])} openSelect={openSelect} setOpenSelect={setOpenSelect} />
            <SelectField id="task-mode" label="Mode" value={mode} options={modeFilterOptions.filter((item) => item !== "All")} onChange={setMode} openSelect={openSelect} setOpenSelect={setOpenSelect} />
          </div>

          <div className="mt-3 grid gap-3 px-2 md:grid-cols-[180px_1fr]">
            <label>
              <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Due</span>
              <input value={due} onChange={(event) => setDue(event.target.value)} className="mt-1.5 h-9 w-full soft-inset rounded-lg border border-white/[0.055] bg-input px-3 text-sm outline-none placeholder:text-muted-foreground focus:border-ring" placeholder="Today" />
            </label>
            <label>
              <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Short note</span>
              <input value={note} onChange={(event) => setNote(event.target.value)} className="mt-1.5 h-9 w-full soft-inset rounded-lg border border-white/[0.055] bg-input px-3 text-sm outline-none placeholder:text-muted-foreground focus:border-ring" placeholder="Optional context" />
            </label>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t soft-divider bg-muted/20 px-4 py-2.5">
          <p className="text-[11px] text-muted-foreground">Preview only. This will connect to project tasks, Daily, and task logs later.</p>
          <div className="flex shrink-0 gap-2">
            <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
            <Button size="sm" className="bg-accent text-foreground hover:bg-white/[0.09]" disabled={!canCreate} onClick={() => onCreate({
              project,
              mark: projectMark,
              markClass: "bg-white/[0.065] text-[#c4cad3]",
              title: title.trim(),
              description: note || "Details can be completed later.",
              mode,
              modeGroup: mode.includes("Node") ? "node" : mode.includes("Discord") ? "discord" : mode.includes("Proof") ? "proof" : mode.includes("Claim") ? "claim" : mode.includes("Waitlist") || mode.includes("Form") ? "waitlist" : "site",
              status,
              frequency,
              priority,
              accounts: [account],
              due,
              lastLog: "No log",
              comments: 0,
              proofs: 0,
              runtime: status === "Running" ? "Running now" : undefined,
              checkCadence: status === "Running" ? "Manual" : undefined,
            })}>Create task</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SelectField({
  id,
  label,
  value,
  options,
  onChange,
  openSelect,
  setOpenSelect,
}: {
  id: string;
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
  openSelect: string | null;
  setOpenSelect: (value: string | null) => void;
}) {
  const isOpen = openSelect === id;

  return (
    <div className="relative">
      <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">{label}</span>
      <button
        type="button"
        onClick={() => setOpenSelect(isOpen ? null : id)}
        className="mt-1.5 flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-white/[0.065] bg-white/[0.025] px-3 text-left text-sm font-medium text-foreground outline-none transition-colors hover:bg-white/[0.045] focus:border-ring"
      >
        <span className="truncate">{value}</span>
        <ChevronDown className={cn("size-3.5 shrink-0 text-muted-foreground transition-transform", isOpen ? "rotate-180" : "")} />
      </button>
      {isOpen ? (
        <div className="absolute left-0 top-full z-[70] mt-1.5 max-h-64 w-full overflow-y-auto rounded-xl border border-white/[0.08] bg-[#161618] p-1.5 shadow-2xl shadow-black/50">
          {options.map((option) => {
            const selected = value === option;
            return (
              <button
                key={option}
                type="button"
                onClick={() => {
                  onChange(option);
                  setOpenSelect(null);
                }}
                className={cn(
                  "flex h-8 w-full items-center justify-between gap-3 rounded-lg px-2.5 text-left text-xs transition-colors",
                  selected ? "bg-white/[0.075] text-foreground" : "text-muted-foreground hover:bg-white/[0.055] hover:text-foreground",
                )}
              >
                <span className="truncate font-medium">{option}</span>
                {selected ? <Check className="size-3.5 text-muted-foreground" /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function TaskDetailPanel({ task, onClose }: { task: Task | null; onClose: () => void }) {
  if (!task) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-full justify-end bg-black/35 backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-labelledby="task-detail-title">
      <aside className="h-full w-full max-w-[500px] overflow-y-auto border-l soft-divider bg-card shadow-2xl shadow-black/50 scrollbar-subtle">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b soft-divider bg-card/95 px-5 py-3 backdrop-blur">
          <h2 id="task-detail-title" className="truncate text-base font-semibold">Task detail</h2>
          <button onClick={onClose} className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground" aria-label="Close task detail"><X className="size-4" /></button>
        </div>
        <div className="px-5 py-5">
          <div className="flex items-start gap-3">
            <TaskMark task={task} />
            <div className="min-w-0 flex-1">
              <h3 className="text-2xl font-semibold tracking-[-0.03em]">{task.title}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{task.project}</p>
            </div>
          </div>

          <section className="mt-6 grid gap-x-6 gap-y-4 border-t border-white/[0.045] pt-4 sm:grid-cols-2">
            <TaskProperty label="Status"><Badge variant={statusVariant(task.status)}>{task.status}</Badge></TaskProperty>
            <TaskProperty label="Frequency"><Badge variant="outline">{task.frequency}</Badge></TaskProperty>
            <TaskProperty label="Priority"><Priority value={task.priority} /></TaskProperty>
            <TaskProperty label="Due"><span>{task.due}</span></TaskProperty>
            <TaskProperty label="Mode"><ModeChip task={task} /></TaskProperty>
            <TaskProperty label="Accounts"><AccountChips accounts={task.accounts} /></TaskProperty>
          </section>

          {task.status === "Running" ? (
            <section className="mt-5 rounded-xl bg-white/[0.025] p-3">
              <h4 className="text-sm font-semibold">Running check</h4>
              <div className="mt-3 grid gap-2 text-xs text-muted-foreground">
                <div className="flex justify-between"><span>Runtime</span><span className="text-foreground">{task.runtime ?? "Running"}</span></div>
                <div className="flex justify-between"><span>Last check</span><span className="text-foreground">{task.lastLog}</span></div>
                <div className="flex justify-between"><span>Cadence</span><span className="text-foreground">{task.checkCadence ?? "Manual"}</span></div>
              </div>
            </section>
          ) : null}

          <section className="mt-5">
            <h4 className="text-sm font-semibold">Task note</h4>
            <p className="mt-2 rounded-xl bg-white/[0.025] px-3 py-3 text-xs leading-relaxed text-muted-foreground">{task.description}</p>
          </section>

          <section className="mt-5">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold">Links</h4>
              <button className="text-[11px] text-muted-foreground hover:text-foreground">Open project</button>
            </div>
            <div className="mt-2 divide-y divide-white/[0.035] overflow-hidden rounded-xl bg-white/[0.025]">
              <TaskDetailRow title="Project docs" meta="Linked project notes" />
              <TaskDetailRow title="Task logs" meta="Daily completion history later" />
              <TaskDetailRow title="Proof / tx" meta="Attach proof when task logging is real" />
            </div>
          </section>
        </div>
      </aside>
    </div>
  );
}

function TaskProperty({ label, children }: { label: string; children: ReactNode }) {
  return <div><p className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">{label}</p><div className="mt-1 text-xs text-foreground">{children}</div></div>;
}

function TaskDetailRow({ title, meta }: { title: string; meta: string }) {
  return <button className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left hover:bg-accent/35"><span className="min-w-0"><span className="block truncate text-xs font-medium">{title}</span><span className="mt-0.5 block truncate text-[11px] text-muted-foreground">{meta}</span></span><span className="text-[11px] text-muted-foreground">Open</span></button>;
}

export function TasksPreview() {
  const [view, setView] = useState<TaskView>("list");
  const [boardGroup, setBoardGroup] = useState<BoardGroup>("project");
  const [taskItems, setTaskItems] = useState<Task[]>(tasks);
  const [selectedProject, setSelectedProject] = useState("All");
  const [selectedAccount, setSelectedAccount] = useState("All");
  const [selectedMode, setSelectedMode] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [openFilter, setOpenFilter] = useState<string | null>(null);

  const runningTasks = taskItems.filter((task) => task.status === "Running");
  const recheckTasks = taskItems.filter((task) => task.status === "Recheck");
  const actionableTasks = taskItems.filter((task) => task.status === "Todo" || task.status === "In progress");

  const filterTasks = (items: Task[]) => {
    const query = searchQuery.trim().toLowerCase();

    return items.filter((task) => {
      const matchesProject = selectedProject === "All" || task.project === selectedProject;
      const matchesAccount = selectedAccount === "All" || task.accounts.includes(selectedAccount);
      const matchesMode = selectedMode === "All" || task.mode === selectedMode;
      const matchesSearch = !query || [task.title, task.project, task.mode, task.due].some((value) => value.toLowerCase().includes(query));

      return matchesProject && matchesAccount && matchesMode && matchesSearch;
    });
  };

  const filteredRunningTasks = filterTasks(runningTasks);
  const filteredTasks = (() => {
    const baseTasks = view === "running" ? runningTasks : view === "recheck" ? recheckTasks : taskItems;
    return filterTasks(baseTasks);
  })();
  const boardTaskItems = filteredTasks.filter((task) => task.status !== "Running");
  const projectBoardGroups = (selectedProject === "All" ? projectFilterOptions.filter((project) => project !== "All") : [selectedProject])
    .map((project) => ({
      project,
      items: boardTaskItems.filter((task) => task.project === project),
      total: taskItems.filter((task) => task.project === project && task.status !== "Running").length,
    }))
    .filter((group) => selectedProject !== "All" || group.items.length > 0);

  return (
    <div className="min-w-0 py-5 lg:py-7">
      <header className="flex flex-col gap-4 border-b soft-divider px-4 pb-5 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-8">
        <div>
          <p className="text-xs text-muted-foreground">
            {tasks.length} tasks · {actionableTasks.length} actionable · {runningTasks.length} running · {recheckTasks.length} recheck
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-[-0.02em]">Tasks</h1>
        </div>
        <Button variant="secondary" size="sm" onClick={() => setIsAddOpen(true)}><Plus />Add task</Button>
      </header>

      <div className="border-b soft-divider px-4 sm:px-6 lg:px-8">
        <div className="scrollbar-subtle flex items-center gap-1 overflow-x-auto py-2.5">
          {viewTabs.map(({ label, value }) => (
            <div key={value} className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={() => setView(value)}
                className={cn(
                  "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                  view === value ? "bg-accent text-foreground shadow-[inset_0_1px_0_rgb(255_255_255/0.06)]" : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground",
                )}
              >
                {label}
                {value === "running" ? <span className="ml-1 text-[10px] opacity-60">{runningTasks.length}</span> : null}
                {value === "recheck" ? <span className="ml-1 text-[10px] opacity-60">{recheckTasks.length}</span> : null}
              </button>
              {value === "board" && view === "board" ? (
                <>
                  <span className="mx-1 h-4 w-px bg-white/[0.06]" />
                  {boardGroupOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setBoardGroup(option.value)}
                      className={cn(
                        "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                        boardGroup === option.value ? "bg-white/[0.075] text-foreground" : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground",
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </>
              ) : null}
            </div>
          ))}
          <span className="hidden flex-1 lg:block" />
        </div>
      </div>

      <div className="flex flex-col gap-3 border-b soft-divider px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:px-8">
        <label className="flex h-9 min-w-0 items-center gap-2 rounded-lg border border-white/[0.06] bg-card px-3 lg:w-72">
          <Search className="size-4 text-muted-foreground" />
          <input aria-label="Search tasks" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} className="min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground" placeholder="Search tasks..." />
        </label>
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <TaskFilterSelect id="task-filter-project" label="Project" value={selectedProject} options={projectFilterOptions} onChange={setSelectedProject} openFilter={openFilter} setOpenFilter={setOpenFilter} />
          <TaskFilterSelect id="task-filter-account" label="Account" value={selectedAccount} options={accountFilterOptions} onChange={setSelectedAccount} openFilter={openFilter} setOpenFilter={setOpenFilter} />
          <TaskFilterSelect id="task-filter-mode" label="Mode" value={selectedMode} options={modeFilterOptions} onChange={setSelectedMode} openFilter={openFilter} setOpenFilter={setOpenFilter} icon={<Filter className="size-3.5" />} />
          <button className="flex h-8 shrink-0 items-center gap-2 rounded-lg border border-white/[0.045] bg-transparent px-3 text-xs text-muted-foreground hover:bg-white/[0.04] hover:text-foreground">
            <SlidersHorizontal className="size-3.5" />More filters
          </button>
        </div>
      </div>

      {view === "board" ? (
        <div className="space-y-4 p-4 sm:p-6 lg:p-8">
          {filteredRunningTasks.length > 0 ? (
            <section className="soft-panel rounded-xl bg-card p-3">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold">Running monitor</h2>
              </div>
              <div className="mt-3 grid gap-2">
                {filteredRunningTasks.map((task) => <CompactRunningMonitor key={`${task.project}-${task.title}`} task={task} onOpen={() => setSelectedTask(task)} />)}
              </div>
            </section>
          ) : null}

          <div className="scrollbar-subtle overflow-x-auto">
            <div className="flex min-w-max gap-3">
              {boardGroup === "project"
                ? projectBoardGroups.map((group) => <ProjectBoardColumn key={group.project} project={group.project} items={group.items} total={group.total} onOpenTask={setSelectedTask} />)
                : boardColumns.map((column) => <BoardColumn key={column} status={column} items={boardTaskItems.filter((task) => task.status === column)} onOpenTask={setSelectedTask} />)}
            </div>
          </div>
        </div>
      ) : view === "running" ? (
        <div className="grid gap-3 p-4 sm:p-6 lg:p-8">
          <div className="soft-panel rounded-xl bg-card p-3">
            <h2 className="text-sm font-semibold">Running work</h2>
          </div>
          {filterTasks(runningTasks).map((task) => <CompactRunningMonitor key={`${task.project}-${task.title}`} task={task} onOpen={() => setSelectedTask(task)} />)}
        </div>
      ) : view === "recheck" ? (
        <div className="overflow-hidden">
          <div className="border-b soft-divider px-4 py-3 sm:px-6 lg:px-8">
            <h2 className="text-sm font-semibold">Recheck queue</h2>
          </div>
          <div>
            {filterTasks(recheckTasks).map((task) => <ReviewQueueCard key={`${task.project}-${task.title}`} task={task} onOpen={() => setSelectedTask(task)} />)}
          </div>
        </div>
      ) : (
        <>
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[980px] border-collapse text-left">
              <thead className="sticky top-0 z-10 bg-secondary text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                <tr>
                  <th className="min-w-[300px] border-b soft-divider px-4 py-3 lg:px-6">Task</th>
                  <th className="border-b soft-divider px-3 py-3">Mode</th>
                  <th className="border-b soft-divider px-3 py-3">Status</th>
                  <th className="border-b soft-divider px-3 py-3">Frequency</th>
                  <th className="border-b soft-divider px-3 py-3">Account</th>
                  <th className="border-b soft-divider px-3 py-3">Due</th>
                  <th className="border-b soft-divider px-3 py-3">Priority</th>
                  <th className="w-12 border-b soft-divider px-3 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map((task) => <TaskListRow key={`${task.project}-${task.title}`} task={task} onOpen={() => setSelectedTask(task)} />)}
              </tbody>
            </table>
          </div>

          <div className="divide-y divide-white/[0.045] lg:hidden">
            {filteredTasks.map((task) => <TaskMobileCard key={`${task.project}-${task.title}`} task={task} onOpen={() => setSelectedTask(task)} />)}
          </div>
        </>
      )}

      <footer className="flex items-center justify-between border-t soft-divider px-4 py-3 text-[11px] text-muted-foreground sm:px-6 lg:px-8">
        <span>Showing {filteredTasks.length} task{filteredTasks.length === 1 ? "" : "s"}</span>
        <span />
      </footer>

      <AddTaskDialog
        open={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onCreate={(task) => {
          setTaskItems((items) => [task, ...items]);
          setIsAddOpen(false);
        }}
      />
      <TaskDetailPanel task={selectedTask} onClose={() => setSelectedTask(null)} />
    </div>
  );
}
