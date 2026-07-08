import { CalendarDays, Check, ChevronDown, ChevronRight, Circle, ExternalLink, MoreHorizontal, Plus, RefreshCw, Search } from "lucide-react";

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

export function DailyPreview() {
  return (
    <div className="px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
      <header className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-xs text-muted-foreground">Daily workbench</p><h1 className="mt-1 text-2xl font-semibold tracking-[-0.02em]">Today</h1><p className="mt-1 text-[13px] text-muted-foreground">Wednesday, June 24 · 11 of 24 tasks completed</p></div>
        <div className="flex items-center gap-2"><Button variant="outline" size="sm"><CalendarDays />June 24<ChevronDown /></Button><Button size="sm"><Plus />Add task</Button></div>
      </header>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex rounded-lg border border-border bg-card p-1"><button className="rounded-md bg-accent px-3 py-1.5 text-xs font-medium">By account</button><button className="rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground">By project</button></div>
        <div className="flex items-center gap-2"><label className="flex h-8 min-w-0 items-center gap-2 rounded-lg border border-border bg-card px-3 sm:w-56"><Search className="size-3.5 text-muted-foreground" /><input aria-label="Search daily tasks" className="min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground" placeholder="Search today…" /></label><button className="h-8 rounded-lg border border-border px-3 text-xs text-muted-foreground hover:bg-accent hover:text-foreground">Hide done</button></div>
      </div>

      <div className="mt-5 space-y-4">
        {accountGroups.map((group) => <AccountGroup key={group.name} group={group} />)}
      </div>
    </div>
  );
}

type Group = (typeof accountGroups)[number];
function AccountGroup({ group }: { group: Group }) {
  const progress = Math.round((group.done / group.total) * 100);
  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card">
      <header className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3">
        <span className="grid size-8 place-items-center rounded-full bg-elevated text-[10px] font-semibold">{group.initials}</span>
        <div className="min-w-0 flex-1"><div className="flex items-center gap-2"><h2 className="text-sm font-semibold">{group.name}</h2><span className="text-[11px] tabular-nums text-muted-foreground">{group.done}/{group.total}</span></div><div className="mt-1.5 h-1 w-32 rounded-full bg-elevated"><div className="h-full rounded-full bg-primary" style={{width: progress + "%"}} /></div></div>
        <button className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground" aria-label={"More options for " + group.name}><MoreHorizontal className="size-4" /></button>
      </header>
      <div className={cn("grid", group.watching.length > 0 && "xl:grid-cols-[minmax(0,1fr)_300px]")}>
        <div className={cn(group.watching.length > 0 && "xl:border-r xl:border-border")}>
          <div className="px-4 py-2 text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">Checklist</div>
          {group.tasks.map((task) => <div key={task.title} className="group flex min-h-14 items-center gap-3 border-t border-border px-4 py-2.5 hover:bg-accent/30"><button className={cn("grid size-6 shrink-0 place-items-center rounded-md border", task.done ? "border-success/40 bg-success/10 text-success" : "border-border bg-background text-muted-foreground hover:border-primary")}>{task.done ? <Check className="size-3.5" /> : null}</button><span className="grid size-7 shrink-0 place-items-center rounded-md bg-elevated text-[10px] font-semibold">{task.mark}</span><div className="min-w-0 flex-1"><p className={cn("truncate text-[13px] font-medium", task.done && "text-muted-foreground line-through")}>{task.title}</p><p className="mt-0.5 truncate text-[11px] text-muted-foreground">{task.project} · {task.meta}</p></div><button className="hidden text-muted-foreground hover:text-foreground sm:block" aria-label="Open proof link"><ExternalLink className="size-3.5" /></button><ChevronRight className="size-3.5 text-muted-foreground" /></div>)}
          <button className="flex items-center gap-2 px-4 py-3 text-xs font-medium text-muted-foreground hover:text-foreground"><Plus className="size-3.5" />Quick add for {group.name}</button>
        </div>
        {group.watching.length > 0 ? <aside className="border-t border-border p-3 xl:border-t-0"><div className="mb-1 flex items-center gap-2 px-1 py-1"><RefreshCw className="size-3.5 text-muted-foreground" /><p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">Running & recheck</p></div>{group.watching.map((item) => <button key={item.title} className="flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left hover:bg-accent/40"><Circle className={cn("size-2 fill-current", item.tone === "info" ? "text-info" : "text-warning")} /><span className="min-w-0 flex-1"><span className="block truncate text-xs font-medium">{item.title}</span><span className="text-[11px] text-muted-foreground">{item.status}</span></span><Badge variant={item.tone === "info" ? "info" : "warning"}>{item.status}</Badge></button>)}</aside> : null}
      </div>
    </section>
  );
}
