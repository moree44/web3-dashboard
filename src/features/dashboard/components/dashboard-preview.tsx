import {
  AlertCircle,
  CalendarClock,
  Circle,
  ClipboardList,
  FileText,
  Inbox,
  Plus,
  RadioTower,
  StickyNote,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const overviewMetrics = [
  { label: "Projects", value: "38" },
  { label: "Active", value: "31" },
  { label: "Inbox", value: "4" },
  { label: "Due", value: "6" },
  { label: "Running", value: "3" },
  { label: "Archived", value: "7" },
];

const pulseItems = [
  { label: "Testnet", value: "12" },
  { label: "Free Hunt", value: "14" },
  { label: "Retro", value: "6" },
  { label: "NFT", value: "5" },
  { label: "Waitlist", value: "8" },
];

const inboxItems = [
  { title: "Project Alpha waitlist result", meta: "Manual capture", badge: "Review", variant: "warning" as const },
  { title: "Project Beta link captured", meta: "Quick capture", badge: "Process", variant: "info" as const },
  { title: "Project Gamma mint reminder", meta: "Needs deadline", badge: "Due", variant: "destructive" as const },
];

const pinnedNotes = [
  { title: "Wallet warm-up rules", meta: "Strategy · pinned", icon: StickyNote },
  { title: "Project setup checklist", meta: "Template · pinned", icon: ClipboardList },
  { title: "Safe access metadata", meta: "Private hint · pinned", icon: FileText },
];

const recentNotes = [
  { title: "Project Alpha command note", meta: "Updated 8m ago" },
  { title: "Waitlist tracking template", meta: "Updated 24m ago" },
  { title: "Retro farming notes", meta: "Updated yesterday" },
];

const runningItems = [
  { title: "Project Alpha prover", meta: "Running on Moree", tone: "info" as const },
  { title: "Project Beta eligibility", meta: "Recheck on Wdym", tone: "warning" as const },
  { title: "Project Gamma proof", meta: "Pending submit", tone: "warning" as const },
];

const deadlines = [
  { title: "Project Alpha proof", meta: "Submit before reset", due: "Today", tone: "text-destructive" },
  { title: "Project Beta result check", meta: "Waitlist eligibility", due: "Tomorrow", tone: "text-warning" },
  { title: "Project Gamma campaign", meta: "Interaction window", due: "Jul 18", tone: "text-muted-foreground" },
];

const recentActivity = [
  { text: "Saved Project Alpha command note", time: "8m" },
  { text: "Processed Project Beta reminder", time: "24m" },
  { text: "Moved Project Gamma to Running", time: "1h" },
];

export function DashboardPreview() {
  const { dateLabel, headline, motivation } = getDashboardGreeting();

  return (
    <div className="px-4 py-3 sm:px-5 lg:px-6 lg:py-4">
      <header>
        <div>
          <p className="text-xs text-muted-foreground">Dashboard · {dateLabel} · WIB</p>
          <h1 className="font-display mt-1 text-2xl font-semibold tracking-[-0.025em]">{headline}</h1>
          <p className="mt-1 text-xs text-muted-foreground">{motivation}</p>
        </div>
      </header>


      <section className="soft-panel mt-3 grid gap-2 rounded-xl border border-border bg-card p-2 xl:grid-cols-[minmax(0,1fr)_auto]">
        <div className="soft-inset flex min-w-0 items-center gap-3 rounded-lg border border-border bg-background px-3 py-2.5">
          <Plus className="size-4 text-muted-foreground" />
          <span className="truncate text-[13px] text-muted-foreground">Capture project link, Twitter watchlist, note, or inbox item...</span>
        </div>
        <div className="grid grid-cols-4 gap-2 xl:flex">
          <Button variant="secondary" size="sm">Project</Button>
          <Button variant="secondary" size="sm">Watchlist</Button>
          <Button variant="secondary" size="sm">Note</Button>
          <Button variant="secondary" size="sm">Inbox</Button>
        </div>
      </section>
      <div className="mt-3 grid gap-3 xl:grid-cols-[minmax(0,1fr)_350px] 2xl:grid-cols-[minmax(420px,1fr)_minmax(340px,0.82fr)_350px]">
        <DashboardPanel icon={StickyNote} title="Notes desk" subtitle="Pinned and recent knowledge" href="/docs">
          <SectionLabel label="Pinned notes" />
          <div className="divide-y divide-border">
            {pinnedNotes.map((note) => <PinnedNoteRow key={note.title} note={note} />)}
          </div>
          <SectionLabel label="Recent notes" className="mt-2.5" />
          <div className="divide-y divide-border">
            {recentNotes.map((note) => <SimpleRow key={note.title} title={note.title} meta={note.meta} />)}
          </div>
        </DashboardPanel>

        <DashboardPanel icon={CalendarClock} title="Upcoming deadlines" subtitle="Nearest date-sensitive items" href="/daily">
          <div className="divide-y divide-border">
            {deadlines.map((item) => <DeadlineRow key={item.title} item={item} />)}
          </div>
        </DashboardPanel>

        <DashboardPanel icon={RadioTower} title="Hunting pulse" subtitle="Compact project and attention signals" href="/projects" className="xl:row-span-2">
          <SectionLabel label="Overview" />
          <div className="grid grid-cols-2 gap-2">
            {overviewMetrics.map((metric) => <MetricTile key={metric.label} item={metric} />)}
          </div>

          <SectionLabel label="Categories" className="mt-2.5" />
          <div className="flex flex-wrap gap-1.5">
            {pulseItems.map((item) => <PulsePill key={item.label} item={item} />)}
          </div>

          <SectionLabel label="Running / recheck" className="mt-2.5" />
          <div className="divide-y divide-border">
            {runningItems.map((item) => <SignalRow key={item.title} item={item} />)}
          </div>
        </DashboardPanel>

        <DashboardPanel icon={Inbox} title="Inbox to process" subtitle="Raw input waiting for a decision" href="/inbox">
          <div className="divide-y divide-border">
            {inboxItems.map((item) => <InboxRow key={item.title} item={item} />)}
          </div>
        </DashboardPanel>

        <DashboardPanel icon={AlertCircle} title="Recent activity" subtitle="Small latest changes" href="/projects">
          <div className="divide-y divide-border">
            {recentActivity.map((activity) => <Activity key={activity.text} {...activity} />)}
          </div>
        </DashboardPanel>
      </div>
    </div>
  );
}

function DashboardPanel({ icon: Icon, title, subtitle, href, className = "", children }: { icon: typeof Inbox; title: string; subtitle: string; href: string; className?: string; children: ReactNode }) {
  return (
    <section className={"soft-panel overflow-hidden rounded-xl border border-border bg-card " + className}>
      <div className="flex items-center justify-between gap-3 border-b border-border px-3 py-2.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-border bg-muted text-muted-foreground"><Icon className="size-4" /></span>
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold">{title}</h2>
            <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{subtitle}</p>
          </div>
        </div>
        <Link href={href} className="shrink-0 text-[11px] text-muted-foreground hover:text-foreground">Open</Link>
      </div>
      <div className="p-3 pt-2.5">{children}</div>
    </section>
  );
}

function SectionLabel({ label, className = "" }: { label: string; className?: string }) {
  return <h3 className={"mb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground " + className}>{label}</h3>;
}

function InboxRow({ item }: { item: (typeof inboxItems)[number] }) {
  return (
    <button className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-1.5 text-left hover:bg-white/[0.025]">
      <span className="min-w-0">
        <span className="block truncate text-[13px] font-medium">{item.title}</span>
        <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">{item.meta}</span>
      </span>
      <Badge variant={item.variant}>{item.badge}</Badge>
    </button>
  );
}

function PinnedNoteRow({ note }: { note: (typeof pinnedNotes)[number] }) {
  const Icon = note.icon;
  return (
    <button className="grid w-full grid-cols-[auto_minmax(0,1fr)] items-center gap-2.5 py-1.5 text-left hover:bg-white/[0.025]">
      <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground"><Icon className="size-3.5" /></span>
      <span className="min-w-0">
        <span className="block truncate text-[13px] font-medium">{note.title}</span>
        <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">{note.meta}</span>
      </span>
    </button>
  );
}

function SimpleRow({ title, meta }: { title: string; meta: string }) {
  return (
    <button className="grid w-full py-1.5 text-left hover:bg-white/[0.025]">
      <span className="truncate text-[13px] font-medium">{title}</span>
      <span className="mt-0.5 truncate text-[11px] text-muted-foreground">{meta}</span>
    </button>
  );
}

function MetricTile({ item }: { item: (typeof overviewMetrics)[number] }) {
  return (
    <Link href="/projects" className="rounded-lg border border-border bg-muted/35 px-3 py-2 hover:bg-accent/45">
      <span className="block text-[11px] text-muted-foreground">{item.label}</span>
      <span className="mt-0.5 block text-[18px] font-semibold leading-none tabular-nums tracking-[-0.025em]">{item.value}</span>
    </Link>
  );
}

function PulsePill({ item }: { item: (typeof pulseItems)[number] }) {
  return (
    <Link href="/projects" className="inline-flex items-baseline gap-1.5 rounded-md bg-white/[0.035] px-2 py-1 hover:bg-white/[0.055] hover:text-foreground">
      <span className="text-[11px] text-muted-foreground">{item.label}</span>
      <span className="text-[13px] font-semibold tabular-nums tracking-[-0.025em]">{item.value}</span>
    </Link>
  );
}

function SignalRow({ item }: { item: (typeof runningItems)[number] }) {
  const color = item.tone === "info" ? "text-info" : "text-warning";
  return (
    <button className="grid w-full grid-cols-[auto_minmax(0,1fr)] items-center gap-2.5 py-1.5 text-left hover:bg-white/[0.025]">
      <Circle className={"size-2 fill-current " + color} />
      <span className="min-w-0">
        <span className="block truncate text-[13px] font-medium">{item.title}</span>
        <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">{item.meta}</span>
      </span>
    </button>
  );
}

function DeadlineRow({ item }: { item: (typeof deadlines)[number] }) {
  return (
    <button className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-2 py-1.5 text-left hover:bg-white/[0.025]">
      <span className="min-w-0">
        <span className="block truncate text-[13px] font-medium">{item.title}</span>
        <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">{item.meta}</span>
      </span>
      <span className={"text-[11px] font-medium tabular-nums " + item.tone}>{item.due}</span>
    </button>
  );
}

function Activity({ text, time }: { text: string; time: string }) {
  return (
    <div className="flex min-w-0 items-center gap-2 py-2">
      <Circle className="size-1.5 shrink-0 fill-muted-foreground text-muted-foreground" />
      <p className="min-w-0 flex-1 truncate text-xs">{text}</p>
      <span className="shrink-0 text-[10px] text-muted-foreground">{time}</span>
    </div>
  );
}

const motivations = [
  "Small progress still compounds.",
  "Finish the important hunt first.",
  "Stay curious. Keep moving.",
  "Consistency finds what noise misses.",
  "One clear task at a time.",
  "Make today's effort count.",
  "Quiet work creates loud results.",
];

function getDashboardGreeting() {
  const now = new Date();
  const dateKey = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  const timeParts = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(now);
  const hour = Number(timeParts.find((part) => part.type === "hour")?.value ?? "0");
  const minute = Number(timeParts.find((part) => part.type === "minute")?.value ?? "0");
  const totalMinutes = hour * 60 + minute;
  const dateLabel = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Jakarta", weekday: "long", month: "long", day: "numeric" }).format(now);
  const daySeed = [...dateKey].reduce((total, character) => total + character.charCodeAt(0), 0);
  const headline = getTimeGreeting(totalMinutes) + ", Moree";
  const motivation = motivations[daySeed % motivations.length];
  return { dateLabel, headline, motivation };
}

function getTimeGreeting(totalMinutes: number) {
  if (totalMinutes <= 180) return "Still awake";
  if (totalMinutes >= 720 && totalMinutes <= 869) return "Good afternoon";
  if (totalMinutes >= 870 && totalMinutes <= 1110) return "Good evening";
  if (totalMinutes >= 1111) return "Good night";
  return "Good morning";
}
