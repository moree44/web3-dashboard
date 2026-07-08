import {
  Archive,
  ArrowUpRight,
  CheckCircle2,
  ClipboardList,
  FileText,
  Inbox,
  Link2,
  Plus,
  Search,
  SlidersHorizontal,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const inboxItems = [
  {
    title: "Waitlist result copied manually",
    source: "Manual",
    status: "Review",
    priority: "High",
    detail: "Huddle01 eligibility result needs to be checked and linked to the project.",
    action: "Create task",
    variant: "warning" as const,
  },
  {
    title: "Project link from X",
    source: "Quick capture",
    status: "Process",
    priority: "Medium",
    detail: "Potential node campaign. Save source, inspect docs, then decide if it becomes a project.",
    action: "Create project",
    variant: "info" as const,
  },
  {
    title: "Mint reminder for Friday",
    source: "Manual",
    status: "Due soon",
    priority: "High",
    detail: "NFT whitelist mint reminder. Needs wallet note and deadline before Friday.",
    action: "Save to Docs",
    variant: "destructive" as const,
  },
  {
    title: "Campaign deadline screenshot note",
    source: "Manual",
    status: "Triage",
    priority: "Low",
    detail: "Copied deadline text from a campaign page. Decide whether this belongs to Linera or Archive.",
    action: "Link project",
    variant: "secondary" as const,
  },
  {
    title: "Eligibility check result",
    source: "Manual",
    status: "Pending",
    priority: "Medium",
    detail: "Needs confirmation from the project dashboard before it becomes a completed task log later.",
    action: "Review",
    variant: "outline" as const,
  },
];

const actionButtons = [
  { label: "Create Project", icon: Plus },
  { label: "Create Task", icon: ClipboardList },
  { label: "Save to Docs", icon: FileText },
  { label: "Link to Project", icon: Link2 },
  { label: "Ignore", icon: CheckCircle2 },
  { label: "Archive", icon: Archive },
];

export function InboxPreview() {
  const selected = inboxItems[0];

  return (
    <div className="px-4 py-4 sm:px-5 lg:px-6 lg:py-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs text-muted-foreground">Inbox · Preview queue</p>
          <h1 className="font-display mt-1 text-2xl font-semibold tracking-[-0.025em]">Raw input before it becomes work</h1>
          <p className="mt-1 text-xs text-muted-foreground">Manual captures, copied links, reminders, and notes waiting for a decision.</p>
        </div>
        <Button size="sm"><Plus />New inbox item</Button>
      </header>

      <section className="soft-panel mt-4 grid gap-2 rounded-xl border border-border bg-card p-2 lg:grid-cols-[minmax(0,1fr)_auto]">
        <div className="soft-inset flex min-w-0 items-center gap-3 rounded-lg border border-border bg-background px-3 py-2.5">
          <Search className="size-4 text-muted-foreground" />
          <span className="truncate text-[13px] text-muted-foreground">Search inbox items, source, project, or reminder...</span>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm"><SlidersHorizontal />Filter</Button>
          <Button variant="secondary" size="sm">Unprocessed</Button>
        </div>
      </section>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="soft-panel overflow-hidden rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
            <div className="flex items-center gap-2.5">
              <span className="grid size-8 place-items-center rounded-lg border border-border bg-muted text-muted-foreground"><Inbox className="size-4" /></span>
              <div>
                <h2 className="text-sm font-semibold">Inbox list</h2>
                <p className="mt-0.5 text-[11px] text-muted-foreground">Preview data only. Actions are visual placeholders.</p>
              </div>
            </div>
            <Badge variant="secondary">4 open</Badge>
          </div>
          <div className="divide-y divide-border">
            {inboxItems.map((item, index) => (
              <button key={item.title} className="grid w-full gap-2 px-4 py-3 text-left hover:bg-accent/35 md:grid-cols-[minmax(0,1fr)_120px_88px_96px] md:items-center">
                <span className="min-w-0">
                  <span className="flex items-center gap-2">
                    <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-muted text-[11px] font-semibold">{index + 1}</span>
                    <span className="min-w-0 truncate text-[13px] font-medium">{item.title}</span>
                  </span>
                  <span className="mt-1 block truncate pl-9 text-[11px] text-muted-foreground">{item.detail}</span>
                </span>
                <span className="text-xs text-muted-foreground">{item.source}</span>
                <Badge variant={item.variant}>{item.status}</Badge>
                <span className="text-[11px] text-muted-foreground">{item.action}</span>
              </button>
            ))}
          </div>
        </section>

        <aside className="soft-panel rounded-xl border border-border bg-card p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] text-muted-foreground">Selected preview</p>
              <h2 className="mt-1 text-base font-semibold">{selected.title}</h2>
            </div>
            <Badge variant={selected.variant}>{selected.priority}</Badge>
          </div>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">{selected.detail}</p>

          <div className="mt-4 rounded-lg border border-border bg-muted/45 p-3">
            <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Processing note</p>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">Inbox is not email sync in Phase 1. These are manual captures waiting to become a project, task, doc, link, archive item, or ignored note.</p>
          </div>

          <div className="mt-4 grid gap-2">
            {actionButtons.map(({ label, icon: Icon }) => (
              <button key={label} className="flex items-center justify-between rounded-lg border border-border bg-muted/35 px-3 py-2 text-left text-xs font-medium hover:bg-accent/45">
                <span className="flex items-center gap-2"><Icon className="size-4 text-muted-foreground" />{label}</span>
                <ArrowUpRight className="size-3.5 text-muted-foreground" />
              </button>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
