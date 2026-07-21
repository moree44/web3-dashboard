"use client";

import { CalendarDays, ChevronDown, ChevronRight, Circle, ExternalLink, MoreHorizontal, RefreshCw, Search } from "lucide-react";
import { useMemo, useState, type CSSProperties, type ReactNode } from "react";

import { TaskDetailPanel, type TaskDetailPanelTask } from "@/features/tasks/components/task-detail-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const accountGroups = [
  { name: "Moree", initials: "M", done: 3, total: 6, tasks: [
    { project: "Soundness", mark: "S", title: "Submit proof for testnet role", meta: "Once · High priority", status: "Todo", frequency: "Once", priority: "High", url: "https://soundness.xyz", notes: "Upload proof link and confirm it before the reset window closes." },
    { project: "Huddle01", mark: "H", title: "Daily check-in", meta: "Daily", done: true, status: "Done", frequency: "Daily", priority: "Medium", url: "https://huddle01.com", notes: "Open dashboard and save any result change in project docs." },
    { project: "NexusHQ", mark: "N", title: "Claim daily points", meta: "Daily", status: "Todo", frequency: "Daily", priority: "Medium", url: "https://nexus.xyz", notes: "Check points and keep notes updated." },
    { project: "Drosera", mark: "D", title: "Review operator status", meta: "Weekly" },
  ], watching: [{ title: "NexusHQ prover", status: "Running", tone: "info" }, { title: "Soundness eligibility", status: "Recheck", tone: "warning" }] },
  { name: "Wdym", initials: "W", done: 2, total: 5, tasks: [
    { project: "Linera", mark: "L", title: "Complete Galxe daily", meta: "Daily" },
    { project: "Konnex", mark: "K", title: "Finish testnet interaction", meta: "Once" },
    { project: "Edel", mark: "E", title: "Daily spin and interaction", meta: "Daily", done: true },
  ], watching: [{ title: "Huddle01 eligibility", status: "Recheck", tone: "warning" }] },
  { name: "Wayss", initials: "WA", done: 0, total: 3, tasks: [
    { project: "NexusHQ", mark: "N", title: "Claim daily points", meta: "Daily", status: "Todo", frequency: "Daily", priority: "Medium", url: "https://nexus.xyz", notes: "Check points and keep notes updated." },
    { project: "Perle Labs", mark: "P", title: "Check new campaign", meta: "Daily" },
  ], watching: [] },
];

const personalDailyItems = [
  { id: "personal-review-watchlist", title: "Review Twitter watchlist", frequency: "Daily", status: "Todo" },
  { id: "personal-clean-docs", title: "Clean uncategorized docs", frequency: "Weekly", status: "Todo" },
  { id: "personal-wallet-note", title: "Update wallet usage notes", frequency: "Monthly", status: "Done", done: true },
];

type ViewMode = "account" | "project" | "personal";
type AccountGroupData = (typeof accountGroups)[number];
type AccountTask = AccountGroupData["tasks"][number];
type WatchingItem = AccountGroupData["watching"][number];
type PersonalDailyItem = (typeof personalDailyItems)[number];
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
  const [selectedTaskDetail, setSelectedTaskDetail] = useState<TaskDetailPanelTask | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(() => new Set([sectionKey("account", accountGroups[0]?.name ?? "")]));
  const [checkedTasks, setCheckedTasks] = useState<Record<string, boolean>>(() => {
    return Object.fromEntries(
      accountGroups.flatMap((group) => group.tasks.map((task) => [taskKey(group.name, task.project, task.title), Boolean(task.done)])),
    );
  });
  const [checkedPersonalItems, setCheckedPersonalItems] = useState<Record<string, boolean>>(() => Object.fromEntries(personalDailyItems.map((item) => [item.id, Boolean(item.done)])));
  const dateLabel = getJakartaDateLabel();
  const shortDateLabel = getJakartaShortDateLabel();
  const interactiveAccountGroups = useMemo(() => {
    return accountGroups.map((group) => {
      const tasks = group.tasks.map((task) => ({ ...task, done: checkedTasks[taskKey(group.name, task.project, task.title)] ?? Boolean(task.done) }));

      return { ...group, tasks, done: tasks.filter((task) => task.done).length, total: tasks.length };
    });
  }, [checkedTasks]);
  const totalDone = interactiveAccountGroups.reduce((sum, group) => sum + group.done, 0);
  const totalTasks = interactiveAccountGroups.reduce((sum, group) => sum + group.total, 0);
  const projectGroups = useMemo(() => buildProjectGroups(interactiveAccountGroups), [interactiveAccountGroups]);
  const visibleGroups = activeView === "account" ? interactiveAccountGroups : activeView === "project" ? projectGroups : [];

  function toggleTask(task: AccountTask | (AccountTask & { account: string; accountInitials: string }), fallbackAccount: string) {
    const accountName = "account" in task ? task.account : fallbackAccount;
    const key = taskKey(accountName, task.project, task.title);
    setCheckedTasks((current) => ({ ...current, [key]: !(current[key] ?? Boolean(task.done)) }));
  }

  function toggleSection(name: string) {
    const key = sectionKey(activeView, name);
    setExpandedSections((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function openDailyTaskDetail(task: AccountTask | (AccountTask & { account: string; accountInitials: string }), fallbackAccount: string) {
    const accountName = "account" in task ? task.account : fallbackAccount;
    setSelectedTaskDetail(toDailyTaskDetail(task, accountName));
  }

  function togglePersonalItem(item: PersonalDailyItem) {
    setCheckedPersonalItems((current) => ({ ...current, [item.id]: !(current[item.id] ?? Boolean(item.done)) }));
  }

  return (
    <div className="px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
      <header className="flex flex-col gap-4 border-b soft-divider-strong pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs text-muted-foreground">Daily workbench</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-[-0.02em]">Today</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">{dateLabel} · {totalDone} of {totalTasks} tasks completed</p>
        </div>
        <div className="flex items-center gap-2"><Button variant="outline" size="sm"><CalendarDays />{shortDateLabel}<ChevronDown /></Button></div>
      </header>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex rounded-lg border soft-divider-strong bg-card p-1">
          <button onClick={() => setActiveView("account")} className={cn("rounded-md px-3 py-1.5 text-xs font-medium", activeView === "account" ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground")}>By account</button>
          <button onClick={() => setActiveView("project")} className={cn("rounded-md px-3 py-1.5 text-xs font-medium", activeView === "project" ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground")}>By project</button>
          <button onClick={() => setActiveView("personal")} className={cn("rounded-md px-3 py-1.5 text-xs font-medium", activeView === "personal" ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground")}>Personal</button>
        </div>
        <div className="flex h-9 items-center gap-1 rounded-lg border soft-divider-strong bg-card p-1"><label className="flex h-7 min-w-0 items-center gap-2 px-2 sm:w-56"><Search className="size-3.5 text-muted-foreground" /><input aria-label="Search daily tasks" className="min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground" placeholder="Search today…" /></label><button className="h-7 rounded-md px-3 text-xs text-muted-foreground hover:bg-accent hover:text-foreground">Hide done</button></div>
      </div>

      {activeView === "personal" ? (
        <PersonalDailyList
          items={personalDailyItems}
          checkedItems={checkedPersonalItems}
          onToggle={togglePersonalItem}
          onOpen={(item) => setSelectedTaskDetail(toPersonalDailyDetail(item, checkedPersonalItems[item.id] ?? Boolean(item.done)))}
        />
      ) : (
        <div className="mt-5 space-y-4">
          {visibleGroups.map((group) => {
            const key = sectionKey(activeView, group.name);
            return <DailyGroup key={key} group={group} mode={activeView} expanded={expandedSections.has(key)} onToggle={() => toggleSection(group.name)} onToggleTask={toggleTask} onOpenTask={openDailyTaskDetail} />;
          })}
        </div>
      )}

      <TaskDetailPanel task={selectedTaskDetail} onClose={() => setSelectedTaskDetail(null)} />
    </div>
  );
}

function DailyGroup({ group, mode, expanded, onToggle, onToggleTask, onOpenTask }: { group: AccountGroupData | ProjectGroupData; mode: ViewMode; expanded: boolean; onToggle: () => void; onToggleTask: (task: AccountTask | (AccountTask & { account: string; accountInitials: string }), fallbackAccount: string) => void; onOpenTask: (task: AccountTask | (AccountTask & { account: string; accountInitials: string }), fallbackAccount: string) => void }) {
  const progress = group.total > 0 ? Math.round((group.done / group.total) * 100) : 0;
  const runningCount = group.watching.filter((item) => item.status === "Running").length;
  const recheckCount = group.watching.filter((item) => item.status === "Recheck").length;

  return (
    <section className="overflow-hidden rounded-xl border soft-divider-strong bg-card soft-panel">
      <button type="button" onClick={onToggle} className="flex w-full flex-wrap items-center gap-3 px-4 py-3 text-left hover:bg-accent/25">
        <span className="grid size-8 place-items-center rounded-full bg-elevated text-[10px] font-semibold">{group.initials}</span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2"><h2 className="text-sm font-semibold">{group.name}</h2><span className="text-[11px] tabular-nums text-muted-foreground">{group.done}/{group.total}</span>{runningCount > 0 ? <CompactPill tone="info">{runningCount} running</CompactPill> : null}{recheckCount > 0 ? <CompactPill tone="warning">{recheckCount} recheck</CompactPill> : null}</div>
          <div className="mt-1.5 h-1 w-32 rounded-full bg-elevated"><div className="h-full rounded-full bg-primary" style={{width: progress + "%"}} /></div>
        </div>
        <ChevronRight className={cn("size-4 text-muted-foreground transition-transform", expanded && "rotate-90")} />
        <span className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground" aria-label={"More options for " + group.name}><MoreHorizontal className="size-4" /></span>
      </button>
      {expanded ? <ExpandedGroupBody group={group} mode={mode} onToggleTask={onToggleTask} onOpenTask={onOpenTask} /> : null}
    </section>
  );
}

function ExpandedGroupBody({ group, mode, onToggleTask, onOpenTask }: { group: AccountGroupData | ProjectGroupData; mode: ViewMode; onToggleTask: (task: AccountTask | (AccountTask & { account: string; accountInitials: string }), fallbackAccount: string) => void; onOpenTask: (task: AccountTask | (AccountTask & { account: string; accountInitials: string }), fallbackAccount: string) => void }) {
  return (
    <div className="px-4 pb-3 pt-1">
      <div className="space-y-1">
        {group.tasks.map((task) => <TaskRow key={task.title + ("account" in task ? task.account : "")} task={task} mode={mode} onToggle={() => onToggleTask(task, group.name)} onOpen={() => onOpenTask(task, group.name)} />)}
      </div>
      {group.watching.length > 0 ? <WatchingPanel items={group.watching} mode={mode} /> : null}
    </div>
  );
}

function TaskRow({ task, mode, onToggle, onOpen }: { task: AccountTask | (AccountTask & { account: string; accountInitials: string }); mode: ViewMode; onToggle: () => void; onOpen: () => void }) {
  const accountTask = "account" in task ? task : null;
  return (
    <div role="button" tabIndex={0} onClick={onOpen} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") onOpen(); }} className="group flex min-h-14 cursor-pointer items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-accent/30">
      <button
        type="button"
        role="checkbox"
        aria-checked={task.done ? "true" : "false"}
        onClick={(event) => { event.stopPropagation(); onToggle(); }}
        style={{ "--check-len": 15 } as CSSProperties}
        className={cn("t-check grid size-5 shrink-0 place-items-center rounded-[6px] border", task.done ? "border-white bg-white text-background shadow-sm shadow-black/20" : "soft-divider bg-background text-muted-foreground hover:border-white/25 hover:bg-white/[0.035]")}
      >
        <svg className="size-3" viewBox="0 0 10.1668 10.1668" aria-hidden="true">
          <path d="M1 5.52L3.92 9.17L9.17 1" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
        </svg>
      </button>
      <span className="grid size-7 shrink-0 place-items-center rounded-md bg-elevated text-[10px] font-semibold">{mode === "project" && accountTask ? accountTask.accountInitials : task.mark}</span>
      <div className="min-w-0 flex-1">
        <p className={cn("truncate text-[13px] font-medium", task.done && "text-muted-foreground line-through")}>{task.title}</p>
        <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{mode === "project" && accountTask ? accountTask.account + " · " + task.meta : task.project + " · " + task.meta}</p>
      </div>
      {"url" in task && task.url ? <button type="button" onClick={(event) => { event.stopPropagation(); window.open(task.url, "_blank", "noopener,noreferrer"); }} className="hidden text-muted-foreground hover:text-foreground sm:block" aria-label="Open task link"><ExternalLink className="size-3.5" /></button> : null}<ChevronRight className="size-3.5 text-muted-foreground" />
    </div>
  );
}

function WatchingPanel({ items, mode }: { items: Array<WatchingItem | (WatchingItem & { account: string; accountInitials: string })>; mode: ViewMode }) {
  return (
    <section className="mt-3 space-y-1">
      <div className="flex items-center gap-2 px-2 py-1"><RefreshCw className="size-3.5 text-muted-foreground" /><p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">Running & recheck</p></div>
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
    </section>
  );
}

function CompactPill({ children, tone }: { children: ReactNode; tone: "info" | "warning" }) {
  return <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", tone === "info" ? "bg-info/10 text-info" : "bg-warning/10 text-warning")}>{children}</span>;
}

function PersonalDailyList({
  items,
  checkedItems,
  onToggle,
  onOpen,
}: {
  items: PersonalDailyItem[];
  checkedItems: Record<string, boolean>;
  onToggle: (item: PersonalDailyItem) => void;
  onOpen: (item: PersonalDailyItem) => void;
}) {
  return (
    <section className="mt-5 overflow-hidden rounded-xl border soft-divider-strong bg-card soft-panel">
      <div className="px-4 py-3">
        <h2 className="text-sm font-semibold">Personal items</h2>
      </div>
      <div className="space-y-1 px-4 pb-3">
        {items.map((item) => {
          const checked = checkedItems[item.id] ?? Boolean(item.done);
          return (
            <div key={item.id} role="button" tabIndex={0} onClick={() => onOpen(item)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") onOpen(item); }} className="flex min-h-12 cursor-pointer items-center gap-3 rounded-lg px-2 py-2 hover:bg-accent/30">
              <button
                type="button"
                role="checkbox"
                aria-checked={checked ? "true" : "false"}
                onClick={(event) => { event.stopPropagation(); onToggle(item); }}
                style={{ "--check-len": 15 } as CSSProperties}
                className={cn("t-check grid size-5 shrink-0 place-items-center rounded-[6px] border", checked ? "border-white bg-white text-background shadow-sm shadow-black/20" : "soft-divider bg-background text-muted-foreground hover:border-white/25 hover:bg-white/[0.035]")}
              >
                <svg className="size-3" viewBox="0 0 10.1668 10.1668" aria-hidden="true">
                  <path d="M1 5.52L3.92 9.17L9.17 1" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
                </svg>
              </button>
              <div className="min-w-0 flex-1">
                <p className={cn("truncate text-[13px] font-medium", checked && "text-muted-foreground line-through")}>{item.title}</p>
                <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{item.frequency}</p>
              </div>
              <Badge variant={checked ? "outline" : "secondary"}>{checked ? "Done" : item.status}</Badge>
              <ChevronRight className="size-3.5 text-muted-foreground" />
            </div>
          );
        })}
      </div>
    </section>
  );
}

function toDailyTaskDetail(task: AccountTask | (AccountTask & { account: string; accountInitials: string }), accountName: string): TaskDetailPanelTask {
  const frequency = "frequency" in task && task.frequency ? task.frequency : task.meta.split(" · ")[0] ?? "Once";

  return {
    title: task.title,
    project: task.project,
    mark: task.mark,
    status: "status" in task && task.status ? task.status : task.done ? "Done" : "Todo",
    frequency,
    priority: "priority" in task ? task.priority : task.meta.includes("High") ? "High" : "Medium",
    accounts: [accountName],
    url: "url" in task ? task.url : undefined,
    notes: "notes" in task ? task.notes : task.meta,
    date: frequency,
  };
}

function toPersonalDailyDetail(item: PersonalDailyItem, checked: boolean): TaskDetailPanelTask {
  return {
    title: item.title,
    project: "Personal",
    mark: "P",
    status: checked ? "Done" : item.status,
    frequency: item.frequency,
    notes: "Personal daily item. Creation belongs in Tasks, Daily is for execution only.",
    date: item.frequency,
  };
}

function buildProjectGroups(groups: AccountGroupData[]): ProjectGroupData[] {
  const map = new Map<string, ProjectGroupData>();

  for (const account of groups) {
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

function taskKey(accountName: string, projectName: string, taskTitle: string) {
  return accountName + ":" + projectName + ":" + taskTitle;
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
