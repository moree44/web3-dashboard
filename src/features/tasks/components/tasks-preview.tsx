"use client";

import {
  ArrowDown,
  CalendarClock,
  CheckCircle2,
  CircleDot,
  Clock3,
  Command,
  Filter,
  MoreHorizontal,
  Plus,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type TaskStatus = "Todo" | "In progress" | "Running" | "Recheck" | "Done";
type TaskView = "list" | "board" | "running" | "recheck";

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

const tasks: Task[] = [
  {
    project: "Soundness",
    mark: "S",
    markClass: "bg-[#eef4ff] text-[#315dca]",
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
    markClass: "bg-[#eef4ff] text-[#315dca]",
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
    markClass: "bg-[#111827] text-[#b9ccff]",
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
    markClass: "bg-[#ff5b3d] text-white",
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
    markClass: "bg-[#ff5b3d] text-white",
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
    markClass: "bg-[#4b7cff] text-white",
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
    markClass: "bg-[#ff6b00] text-black",
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
    markClass: "bg-[#ff5b3d] text-white",
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

function modeTone(modeGroup: Task["modeGroup"]) {
  switch (modeGroup) {
    case "node":
      return "border-info/20 bg-info/10 text-info";
    case "proof":
      return "border-warning/20 bg-warning/10 text-warning";
    case "discord":
      return "border-archive/20 bg-archive/10 text-archive";
    case "waitlist":
      return "border-primary/20 bg-primary/10 text-primary";
    case "claim":
      return "border-success/20 bg-success/10 text-success";
    default:
      return "border-border bg-muted text-muted-foreground";
  }
}

function priorityColor(value: Task["priority"]) {
  return value === "High" ? "bg-destructive" : value === "Medium" ? "bg-warning" : "bg-muted-foreground";
}

function Priority({ value, compact = false }: { value: Task["priority"]; compact?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-muted-foreground", compact ? "text-[11px]" : "text-xs")}>
      <span className={cn("size-1.5 rounded-full", priorityColor(value))} />
      {value}
    </span>
  );
}

function ModeChip({ task }: { task: Task }) {
  return <span className={cn("inline-flex w-fit rounded-md border px-1.5 py-0.5 text-[10px] font-medium", modeTone(task.modeGroup))}>{task.mode}</span>;
}

function AccountChips({ accounts }: { accounts: string[] }) {
  return (
    <div className="flex max-w-24 gap-1 overflow-hidden">
      {accounts.slice(0, 3).map((account) => (
        <span key={account} className="grid size-6 shrink-0 place-items-center rounded-full border border-border bg-muted text-[10px] font-semibold text-muted-foreground" title={account}>
          {account[0]}
        </span>
      ))}
      {accounts.length > 3 ? <span className="grid size-6 shrink-0 place-items-center rounded-full border border-border bg-muted text-[10px] font-semibold text-muted-foreground">+{accounts.length - 3}</span> : null}
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

function TaskListRow({ task }: { task: Task }) {
  return (
    <tr className="group h-[58px] border-b border-border hover:bg-accent/30">
      <td className="px-4 lg:px-6">
        <TaskIdentity task={task} />
      </td>
      <td className="px-3"><ModeChip task={task} /></td>
      <td className="px-3"><Badge variant={statusVariant(task.status)} className="text-[10px]">{task.status}</Badge></td>
      <td className="px-3"><Badge variant="outline" className="text-[10px]">{task.frequency}</Badge></td>
      <td className="px-3"><AccountChips accounts={task.accounts} /></td>
      <td className="whitespace-nowrap px-3 text-xs text-muted-foreground">{task.due}</td>
      <td className="whitespace-nowrap px-3 text-xs text-muted-foreground">{task.lastLog}</td>
      <td className="px-3">{task.priority === "High" ? <Priority value={task.priority} /> : <span className="text-xs text-muted-foreground">{task.priority}</span>}</td>
      <td className="w-12 px-3">
        <button className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground" aria-label={"More options for " + task.title}>
          <MoreHorizontal className="size-4" />
        </button>
      </td>
    </tr>
  );
}

function TaskBoardCard({ task }: { task: Task }) {
  return (
    <article className="soft-panel rounded-xl border border-border bg-background/70 p-3 transition-colors hover:bg-accent/20">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {task.priority === "High" ? <Badge variant="destructive" className="text-[10px]">High</Badge> : <Badge variant={task.priority === "Medium" ? "warning" : "outline"} className="text-[10px]">{task.priority}</Badge>}
          <ModeChip task={task} />
        </div>
        <button className="grid size-6 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground" aria-label={"More options for " + task.title}>
          <MoreHorizontal className="size-3.5" />
        </button>
      </div>

      <h3 className="mt-3 line-clamp-2 text-[13px] font-semibold leading-snug">{task.title}</h3>
      <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-muted-foreground">{task.description}</p>

      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <TaskMark task={task} size="sm" />
          <span className="min-w-0">
            <span className="block truncate text-[11px] font-medium">{task.project}</span>
            <span className="block truncate text-[10px] text-muted-foreground">{task.frequency}</span>
          </span>
        </div>
        <button className="grid size-7 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground" aria-label={"Add log for " + task.title}>
          <Plus className="size-3.5" />
        </button>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 border-t border-border pt-2.5">
        <AccountChips accounts={task.accounts} />
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <CalendarClock className="size-3" />
          <span>{task.due}</span>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between gap-2 text-[10px] text-muted-foreground">
        <span>{task.lastLog}</span>
        <span>{task.comments} notes · {task.proofs} proof</span>
      </div>
    </article>
  );
}

function BoardColumn({ status, items }: { status: TaskStatus; items: Task[] }) {
  return (
    <section className="min-w-[260px] rounded-xl border border-border bg-card/75">
      <div className="flex items-start justify-between gap-3 border-b border-border px-3 py-3">
        <div>
          <h2 className="text-sm font-semibold">{status}</h2>
          <p className="mt-0.5 text-[11px] text-muted-foreground">{items.length} card{items.length === 1 ? "" : "s"}</p>
        </div>
        <button className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground" aria-label={"More options for " + status}>
          <MoreHorizontal className="size-3.5" />
        </button>
      </div>

      <div className="p-2.5">
        <button className="mb-2.5 grid h-8 w-full place-items-center rounded-lg border border-border bg-background/70 text-muted-foreground hover:bg-accent hover:text-foreground" aria-label={"Add task to " + status}>
          <Plus className="size-4" />
        </button>
        <div className="space-y-2.5">
          {items.map((task) => <TaskBoardCard key={`${task.project}-${task.title}`} task={task} />)}
          {items.length === 0 ? <div className="rounded-lg border border-dashed border-border px-3 py-8 text-center text-[11px] text-muted-foreground">No tasks</div> : null}
        </div>
      </div>
    </section>
  );
}

function CompactRunningMonitor({ task }: { task: Task }) {
  return (
    <article className="grid gap-3 rounded-lg border border-info/20 bg-info/5 px-3 py-2.5 lg:grid-cols-[minmax(260px,1fr)_110px_120px_90px_auto] lg:items-center">
      <div className="flex min-w-0 items-center gap-2.5">
        <TaskMark task={task} size="sm" />
        <span className="min-w-0">
          <span className="block truncate text-[13px] font-semibold">{task.title}</span>
          <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">{task.project} · {task.mode}</span>
        </span>
      </div>
      <span className="text-xs font-medium text-info">{task.runtime ?? "Running"}</span>
      <span className="text-xs text-muted-foreground">{task.lastLog}</span>
      <AccountChips accounts={task.accounts} />
      <Badge variant="success" className="text-[10px]">Running</Badge>
    </article>
  );
}

function RunningMonitor({ task }: { task: Task }) {
  return (
    <article className="rounded-xl border border-info/20 bg-info/5 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <TaskMark task={task} />
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold">{task.title}</p>
            <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{task.project} · {task.mode}</p>
          </div>
        </div>
        <Badge variant="success" className="text-[10px]">Running</Badge>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <MonitorStat icon={Command} label="Runtime" value={task.runtime ?? "Running"} />
        <MonitorStat icon={Clock3} label="Last check" value={task.lastLog} />
        <MonitorStat icon={CircleDot} label="Cadence" value={task.checkCadence ?? "Manual"} />
      </div>
      <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">{task.description}</p>
    </article>
  );
}

function MonitorStat({ icon: Icon, label, value }: { icon: typeof Clock3; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-background/65 px-3 py-2">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
        <Icon className="size-3" />
        {label}
      </div>
      <p className="mt-1 truncate text-xs font-medium">{value}</p>
    </div>
  );
}

function ReviewQueueCard({ task }: { task: Task }) {
  return (
    <article className="grid gap-3 border-b border-border px-4 py-3 hover:bg-accent/25 lg:grid-cols-[minmax(280px,1fr)_140px_120px_110px_80px] lg:items-center lg:px-6">
      <TaskIdentity task={task} />
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

function TaskMobileCard({ task }: { task: Task }) {
  return (
    <article className="px-4 py-4 hover:bg-accent/25 sm:px-6">
      <div className="flex items-start justify-between gap-3">
        <TaskIdentity task={task} />
        <button aria-label={"More options for " + task.title}><MoreHorizontal className="size-4 text-muted-foreground" /></button>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <ModeChip task={task} />
        <Badge variant={statusVariant(task.status)}>{task.status}</Badge>
        <Badge variant="outline">{task.frequency}</Badge>
        <Priority value={task.priority} />
        <AccountChips accounts={task.accounts} />
      </div>
      <p className="mt-2 line-clamp-2 text-[11px] text-muted-foreground">{task.description}</p>
    </article>
  );
}

function InlineQuickAdd() {
  return (
    <tr className="border-b border-border bg-card/35">
      <td colSpan={9} className="px-4 py-3 lg:px-6">
        <button className="flex h-9 w-full items-center gap-2 rounded-lg border border-dashed border-border bg-background/55 px-3 text-left text-xs text-muted-foreground hover:border-ring hover:text-foreground">
          <Plus className="size-4" />
          Add task quickly, then fill details later...
        </button>
      </td>
    </tr>
  );
}

export function TasksPreview() {
  const [view, setView] = useState<TaskView>("list");
  const [selectedProject, setSelectedProject] = useState("All");

  const runningTasks = tasks.filter((task) => task.status === "Running");
  const recheckTasks = tasks.filter((task) => task.status === "Recheck");
  const actionableTasks = tasks.filter((task) => task.status === "Todo" || task.status === "In progress");

  const filterBySelectedProject = (items: Task[]) => selectedProject === "All" ? items : items.filter((task) => task.project === selectedProject);
  const filteredRunningTasks = filterBySelectedProject(runningTasks);
  const filteredTasks = (() => {
    const baseTasks = view === "running" ? runningTasks : view === "recheck" ? recheckTasks : tasks;
    return filterBySelectedProject(baseTasks);
  })();

  return (
    <div className="min-w-0 py-5 lg:py-7">
      <header className="flex flex-col gap-4 border-b border-border px-4 pb-5 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-8">
        <div>
          <p className="text-xs text-muted-foreground">
            {tasks.length} tasks · {actionableTasks.length} actionable · {runningTasks.length} running · {recheckTasks.length} recheck
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-[-0.02em]">Tasks</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">Cross-project work queue for site tasks, Discord activity, proof, recheck, and node monitoring.</p>
        </div>
        <Button size="sm"><Plus />Add task</Button>
      </header>

      <div className="border-b border-border px-4 sm:px-6 lg:px-8">
        <div className="scrollbar-subtle flex items-center gap-2 overflow-x-auto py-3">
          {viewTabs.map(({ label, value }) => (
            <button
              key={value}
              type="button"
              onClick={() => setView(value)}
              className={cn(
                "shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                view === value ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
              )}
            >
              {label}
              {value === "running" ? <span className="ml-1 text-[10px] opacity-60">{runningTasks.length}</span> : null}
              {value === "recheck" ? <span className="ml-1 text-[10px] opacity-60">{recheckTasks.length}</span> : null}
            </button>
          ))}
          <span className="hidden flex-1 lg:block" />
          <button className="hidden h-8 items-center gap-2 rounded-lg border border-border px-3 text-xs text-muted-foreground hover:bg-accent hover:text-foreground lg:flex">
            <ArrowDown className="size-3.5" />Last activity
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3 border-b border-border px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:px-8">
        <label className="flex h-9 min-w-0 items-center gap-2 rounded-lg border border-border bg-card px-3 lg:w-72">
          <Search className="size-4 text-muted-foreground" />
          <input aria-label="Search tasks" className="min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground" placeholder="Search tasks..." />
        </label>
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <label className="flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-3 text-xs text-muted-foreground">
            Project:
            <select
              value={selectedProject}
              onChange={(event) => setSelectedProject(event.target.value)}
              className="min-w-24 bg-transparent font-medium text-foreground outline-none"
              aria-label="Filter tasks by project"
            >
              {projectFilterOptions.map((project) => <option key={project}>{project}</option>)}
            </select>
          </label>
          <button className="flex h-9 shrink-0 items-center gap-2 rounded-lg border border-border px-3 text-xs text-muted-foreground hover:bg-accent hover:text-foreground">
            Account: All
          </button>
          <button className="flex h-9 shrink-0 items-center gap-2 rounded-lg border border-border px-3 text-xs text-muted-foreground hover:bg-accent hover:text-foreground">
            <Filter className="size-3.5" />Mode: All
          </button>
          <button className="flex h-9 shrink-0 items-center gap-2 rounded-lg border border-border px-3 text-xs text-muted-foreground hover:bg-accent hover:text-foreground">
            <SlidersHorizontal className="size-3.5" />More filters
          </button>
        </div>
      </div>

      {view === "board" ? (
        <div className="space-y-4 p-4 sm:p-6 lg:p-8">
          {filteredRunningTasks.length > 0 ? (
            <section className="rounded-xl border border-info/20 bg-card p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold">Running monitor</h2>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">Compact process watchlist for node, CLI, prover, bot, or similar work.</p>
                </div>
                <Badge variant="success" className="text-[10px]">{filteredRunningTasks.length} running</Badge>
              </div>
              <div className="mt-3 grid gap-2">
                {filteredRunningTasks.map((task) => <CompactRunningMonitor key={`${task.project}-${task.title}`} task={task} />)}
              </div>
            </section>
          ) : null}

          <div className="scrollbar-subtle overflow-x-auto">
            <div className="grid min-w-[1060px] grid-cols-4 gap-3">
              {boardColumns.map((column) => <BoardColumn key={column} status={column} items={filteredTasks.filter((task) => task.status === column)} />)}
            </div>
          </div>
        </div>
      ) : view === "running" ? (
        <div className="grid gap-3 p-4 sm:p-6 lg:p-8">
          <div className="rounded-xl border border-border bg-card p-4">
            <h2 className="text-sm font-semibold">Running work</h2>
            <p className="mt-1 text-xs text-muted-foreground">Reserved for node, CLI, prover, bot, validator, extension process, or long-running service tasks.</p>
          </div>
          {runningTasks.map((task) => <RunningMonitor key={`${task.project}-${task.title}`} task={task} />)}
        </div>
      ) : view === "recheck" ? (
        <div className="overflow-hidden">
          <div className="border-b border-border px-4 py-3 sm:px-6 lg:px-8">
            <h2 className="text-sm font-semibold">Recheck queue</h2>
            <p className="mt-1 text-xs text-muted-foreground">Eligibility, waitlist, claim, mint, proof, and result checks that need a decision.</p>
          </div>
          <div>
            {recheckTasks.map((task) => <ReviewQueueCard key={`${task.project}-${task.title}`} task={task} />)}
          </div>
        </div>
      ) : (
        <>
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[1080px] border-collapse text-left">
              <thead className="sticky top-0 z-10 bg-secondary text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                <tr>
                  <th className="min-w-[300px] border-b border-border px-4 py-3 lg:px-6">Task</th>
                  <th className="border-b border-border px-3 py-3">Mode</th>
                  <th className="border-b border-border px-3 py-3">Status</th>
                  <th className="border-b border-border px-3 py-3">Frequency</th>
                  <th className="border-b border-border px-3 py-3">Account</th>
                  <th className="border-b border-border px-3 py-3">Due</th>
                  <th className="border-b border-border px-3 py-3">Last log</th>
                  <th className="border-b border-border px-3 py-3">Priority</th>
                  <th className="w-12 border-b border-border px-3 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                <InlineQuickAdd />
                {filteredTasks.map((task) => <TaskListRow key={`${task.project}-${task.title}`} task={task} />)}
              </tbody>
            </table>
          </div>

          <div className="divide-y divide-border lg:hidden">
            {filteredTasks.map((task) => <TaskMobileCard key={`${task.project}-${task.title}`} task={task} />)}
          </div>
        </>
      )}

      <footer className="flex items-center justify-between border-t border-border px-4 py-3 text-[11px] text-muted-foreground sm:px-6 lg:px-8">
        <span>Showing {filteredTasks.length} preview task{filteredTasks.length === 1 ? "" : "s"}{selectedProject === "All" ? "" : ` for ${selectedProject}`}</span>
        <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="size-3" />Visual preview only</span>
      </footer>
    </div>
  );
}
