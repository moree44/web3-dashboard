"use client";

import { CalendarDays, Check, ChevronDown, ChevronRight, Circle, ExternalLink, MoreHorizontal, Plus, RefreshCw, Search } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const accountGroups = [
  { name: "Moree", initials: "M", done: 3, total: 6, tasks: [
    { project: "Soundness", mark: "S", title: "Submit proof for testnet role", meta: "Once · High priority" },
    { project: "Huddle01", mark: "H", title: "Daily check-in", meta: "Daily", done: true },
    { project: "NexusHQ", mark: "N", title: "Claim daily points", meta: "Daily" },
    { project: "Drosera", mark: "D", title: "Review operator status", meta: "Weekly" },
  ], watching: [{ title: "NexusHQ prover", status: "Running", tone: "info" }, { title: "Soundness eligibility", status: "Recheck", tone: "warning" }] },
  { name: "Wdym", initials: "W", done: 2, total: 5, tasks: [
    { project: "Linera", mark: "L", title: "Complete Galxe daily", meta: "Daily" },
    { project: "Konnex", mark: "K", title: "Finish testnet interaction", meta: "Once" },
    { project: "Edel", mark: "E", title: "Daily spin and interaction", meta: "Daily", done: true },
  ], watching: [{ title: "Huddle01 eligibility", status: "Recheck", tone: "warning" }] },
  { name: "Wayss", initials: "WA", done: 0, total: 3, tasks: [
    { project: "NexusHQ", mark: "N", title: "Claim daily points", meta: "Daily" },
    { project: "Perle Labs", mark: "P", title: "Check new campaign", meta: "Daily" },
  ], watching: [] },
];

type ViewMode = "account" | "project";
type AccountGroupData = (typeof accountGroups)[number];
type AccountTask = AccountGroupData["tasks"][number];
type WatchingItem = AccountGroupData["watching"][number];
type ProjectGroupData = {
  name: string;
  initials: string;
  done: number;
  total: number;
  tasks: Array<AccountTask & { account: string; accountInitials: string }>;
  watching: Array<WatchingItem & { account: string; accountInitials: string }>;
};

export function DailyPreview() {
  const [activeView, setActiveView] = useState<ViewMode>("account");
  const [expandedSections, setExpandedSections] = useState<Set<string>>(() => new Set([sectionKey("account", accountGroups[0]?.name ?? "")]));
  const dateLabel = getJakartaDateLabel();
  const shortDateLabel = getJakartaShortDateLabel();
  const totalDone = accountGroups.reduce((sum, group) => sum + group.done, 0);
  const totalTasks = accountGroups.reduce((sum, group) => sum + group.total, 0);
  const projectGroups = useMemo(() => buildProjectGroups(), []);
  const visibleGroups = activeView === "account" ? accountGroups : projectGroups;

  function toggleSection(name: string) {
    const key = sectionKey(activeView, name);
    setExpandedSections((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <div className="px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
      <header className="flex flex-col gap-4 border-b soft-divider-strong pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs text-muted-foreground">Daily workbench</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-[-0.02em]">Today</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">{dateLabel} · {totalDone} of {totalTasks} tasks completed</p>
        </div>
        <div className="flex items-center gap-2"><Button variant="outline" size="sm"><CalendarDays />{shortDateLabel}<ChevronDown /></Button><Button size="sm"><Plus />Add task</Button></div>
      </header>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex rounded-lg border soft-divider-strong bg-card p-1">
          <button onClick={() => setActiveView("account")} className={cn("rounded-md px-3 py-1.5 text-xs font-medium", activeView === "account" ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground")}>By account</button>
          <button onClick={() => setActiveView("project")} className={cn("rounded-md px-3 py-1.5 text-xs font-medium", activeView === "project" ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground")}>By project</button>
        </div>
        <div className="flex items-center gap-2"><label className="flex h-8 min-w-0 items-center gap-2 rounded-lg border soft-divider-strong bg-card px-3 sm:w-56"><Search className="size-3.5 text-muted-foreground" /><input aria-label="Search daily tasks" className="min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground" placeholder="Search today…" /></label><button className="h-8 rounded-lg border soft-divider-strong px-3 text-xs text-muted-foreground hover:bg-accent hover:text-foreground">Hide done</button></div>
      </div>

      <div className="mt-5 space-y-4">
        {visibleGroups.map((group) => {
          const key = sectionKey(activeView, group.name);
          return <DailyGroup key={key} group={group} mode={activeView} expanded={expandedSections.has(key)} onToggle={() => toggleSection(group.name)} />;
        })}
      </div>
    </div>
  );
}

function DailyGroup({ group, mode, expanded, onToggle }: { group: AccountGroupData | ProjectGroupData; mode: ViewMode; expanded: boolean; onToggle: () => void }) {
  const progress = group.total > 0 ? Math.round((group.done / group.total) * 100) : 0;
  const runningCount = group.watching.filter((item) => item.status === "Running").length;
  const recheckCount = group.watching.filter((item) => item.status === "Recheck").length;

  return (
    <section className="overflow-hidden rounded-xl bg-card soft-panel">
      <button type="button" onClick={onToggle} className="flex w-full flex-wrap items-center gap-3 border-b soft-divider px-4 py-3 text-left hover:bg-accent/25">
        <span className="grid size-8 place-items-center rounded-full bg-elevated text-[10px] font-semibold">{group.initials}</span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2"><h2 className="text-sm font-semibold">{group.name}</h2><span className="text-[11px] tabular-nums text-muted-foreground">{group.done}/{group.total}</span>{runningCount > 0 ? <CompactPill tone="info">{runningCount} running</CompactPill> : null}{recheckCount > 0 ? <CompactPill tone="warning">{recheckCount} recheck</CompactPill> : null}</div>
          <div className="mt-1.5 h-1 w-32 rounded-full bg-elevated"><div className="h-full rounded-full bg-primary" style={{width: progress + "%"}} /></div>
        </div>
        <ChevronRight className={cn("size-4 text-muted-foreground transition-transform", expanded && "rotate-90")} />
        <span className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground" aria-label={"More options for " + group.name}><MoreHorizontal className="size-4" /></span>
      </button>
      {expanded ? <ExpandedGroupBody group={group} mode={mode} /> : null}
    </section>
  );
}

function ExpandedGroupBody({ group, mode }: { group: AccountGroupData | ProjectGroupData; mode: ViewMode }) {
  return (
    <div className={cn("grid", group.watching.length > 0 && "xl:grid-cols-[minmax(0,1fr)_300px]")}> 
      <div className={cn(group.watching.length > 0 && "xl:border-r soft-divider")}>
        <div className="px-4 py-2 text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">Checklist</div>
        {group.tasks.map((task) => <TaskRow key={task.title + ("account" in task ? task.account : "")} task={task} mode={mode} />)}
        <button className="flex items-center gap-2 px-4 py-3 text-xs font-medium text-muted-foreground hover:text-foreground"><Plus className="size-3.5" />Quick add for {group.name}</button>
      </div>
      {group.watching.length > 0 ? <WatchingPanel items={group.watching} mode={mode} /> : null}
    </div>
  );
}

function TaskRow({ task, mode }: { task: AccountTask | (AccountTask & { account: string; accountInitials: string }); mode: ViewMode }) {
  const accountTask = "account" in task ? task : null;
  return (
    <div className="group flex min-h-14 items-center gap-3 border-t soft-divider px-4 py-2.5 hover:bg-accent/30">
      <button className={cn("grid size-6 shrink-0 place-items-center rounded-md border", task.done ? "border-success/40 bg-success/10 text-success" : "soft-divider bg-background text-muted-foreground hover:border-primary")}>{task.done ? <Check className="size-3.5" /> : null}</button>
      <span className="grid size-7 shrink-0 place-items-center rounded-md bg-elevated text-[10px] font-semibold">{mode === "project" && accountTask ? accountTask.accountInitials : task.mark}</span>
      <div className="min-w-0 flex-1">
        <p className={cn("truncate text-[13px] font-medium", task.done && "text-muted-foreground line-through")}>{task.title}</p>
        <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{mode === "project" && accountTask ? accountTask.account + " · " + task.meta : task.project + " · " + task.meta}</p>
      </div>
      <button className="hidden text-muted-foreground hover:text-foreground sm:block" aria-label="Open proof link"><ExternalLink className="size-3.5" /></button><ChevronRight className="size-3.5 text-muted-foreground" />
    </div>
  );
}

function WatchingPanel({ items, mode }: { items: Array<WatchingItem | (WatchingItem & { account: string; accountInitials: string })>; mode: ViewMode }) {
  return (
    <aside className="border-t soft-divider p-3 xl:border-t-0">
      <div className="mb-1 flex items-center gap-2 px-1 py-1"><RefreshCw className="size-3.5 text-muted-foreground" /><p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">Running & recheck</p></div>
      {items.map((item) => {
        const accountItem = "account" in item ? item : null;
        return (
          <button key={item.title + (accountItem?.account ?? "")} className="flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left hover:bg-accent/40">
            <Circle className={cn("size-2 fill-current", item.tone === "info" ? "text-info" : "text-warning")} />
            <span className="min-w-0 flex-1"><span className="block truncate text-xs font-medium">{item.title}</span><span className="text-[11px] text-muted-foreground">{mode === "project" && accountItem ? accountItem.account + " · " + item.status : item.status}</span></span>
            {mode === "project" && accountItem ? <span className="grid size-6 place-items-center rounded-full bg-elevated text-[10px] font-semibold text-muted-foreground">{accountItem.accountInitials}</span> : null}
            <Badge variant={item.tone === "info" ? "info" : "warning"}>{item.status}</Badge>
          </button>
        );
      })}
    </aside>
  );
}

function CompactPill({ children, tone }: { children: ReactNode; tone: "info" | "warning" }) {
  return <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", tone === "info" ? "bg-info/10 text-info" : "bg-warning/10 text-warning")}>{children}</span>;
}

function buildProjectGroups(): ProjectGroupData[] {
  const map = new Map<string, ProjectGroupData>();

  for (const account of accountGroups) {
    for (const task of account.tasks) {
      const project = getOrCreateProjectGroup(map, task.project, task.mark);
      project.tasks.push({ ...task, account: account.name, accountInitials: account.initials });
      project.total += 1;
      if (task.done) project.done += 1;
    }

    for (const item of account.watching) {
      const projectName = item.title.split(" ")[0] ?? item.title;
      const project = getOrCreateProjectGroup(map, projectName, projectName.slice(0, 1).toUpperCase());
      project.watching.push({ ...item, account: account.name, accountInitials: account.initials });
    }
  }

  return Array.from(map.values());
}

function getOrCreateProjectGroup(map: Map<string, ProjectGroupData>, name: string, mark: string) {
  const existing = map.get(name);
  if (existing) return existing;

  const group: ProjectGroupData = { name, initials: mark, done: 0, total: 0, tasks: [], watching: [] };
  map.set(name, group);
  return group;
}

function sectionKey(mode: ViewMode, name: string) {
  return mode + ":" + name;
}

function getJakartaDateLabel() {
  const now = new Date();
  const weekday = new Intl.DateTimeFormat("en-US", { weekday: "long", timeZone: "Asia/Jakarta" }).format(now);
  const month = new Intl.DateTimeFormat("en-US", { month: "long", timeZone: "Asia/Jakarta" }).format(now);
  const day = new Intl.DateTimeFormat("en-US", { day: "numeric", timeZone: "Asia/Jakarta" }).format(now);

  return weekday + ", " + month + " " + day;
}

function getJakartaShortDateLabel() {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "Asia/Jakarta" }).format(new Date());
}
