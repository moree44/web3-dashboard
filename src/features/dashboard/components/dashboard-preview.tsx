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

import type { DeadlineOptions, UpcomingDeadlineItem } from "@/features/deadlines/actions";
import type { DashboardData, DashboardInboxItem, DashboardNoteItem } from "@/features/dashboard/actions";
import { DeadlineCreateButton } from "@/features/deadlines/components/deadline-create-button";
import { formatDeadlineDueLabel, formatDeadlineTime, getDeadlineDayDifference, getJakartaDateValue, shiftDateValue } from "@/features/deadlines/deadline-utils";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const overviewMetrics = [
  { label: "Projects", value: "38" },
  { label: "Active", value: "31" },
  { label: "Inbox", value: "4" },
  { label: "Due", value: "6" },
  { label: "Running", value: "3" },
  { label: "Archived", value: "7" },
];

const pulseItems = [
  { label: "Testnet", value: "12", href: "/projects" },
  { label: "Free Hunt", value: "14", href: "/projects?hunt=free_hunts" },
  { label: "Retro", value: "6", href: "/projects?hunt=retro" },
  { label: "NFT", value: "5", href: "/nfts" },
  { label: "Waitlist", value: "8", href: "/projects?hunt=waitlist" },
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

const recentActivity = [
  { text: "Saved Project Alpha command note", time: "8m" },
  { text: "Processed Project Beta reminder", time: "24m" },
  { text: "Moved Project Gamma to Running", time: "1h" },
];

const emptyDeadlineOptions: DeadlineOptions = { projects: [], tasks: [] };

export function DashboardPreview({
  deadlineItems,
  deadlineOptions = emptyDeadlineOptions,
  deadlineDueCount,
  nftCount,
  canManageDeadlines = false,
  dashboardData,
}: {
  deadlineItems?: UpcomingDeadlineItem[];
  deadlineOptions?: DeadlineOptions;
  deadlineDueCount?: number;
  nftCount?: number;
  canManageDeadlines?: boolean;
  dashboardData?: DashboardData;
} = {}) {
  const { dateLabel, headline, motivation } = getDashboardGreeting();
  const deadlines = deadlineItems ?? getFallbackDeadlines();
  const metrics = overviewMetrics.map((metric) => metric.label === "Due" && deadlineDueCount !== undefined
    ? { ...metric, value: String(deadlineDueCount) }
    : metric);
  const categories = pulseItems.map((item) => item.label === "NFT" && nftCount !== undefined
    ? { ...item, value: String(nftCount) }
    : item);
  const dashboardInboxItems = dashboardData?.inboxItems ?? inboxItems;
  const dashboardPinnedNotes = dashboardData?.pinnedNotes ?? pinnedNotes;
  const dashboardRecentNotes = dashboardData?.recentNotes ?? recentNotes;
  const dashboardRecentActivity = dashboardData?.recentActivity ?? recentActivity;

  return (
    <div className="px-4 py-3 sm:px-5 lg:px-6 lg:py-4">
      <header>
        <div>
          <p className="text-xs text-muted-foreground">Dashboard · {dateLabel} · WIB</p>
          <h1 className="font-display mt-1 text-2xl font-semibold tracking-[-0.025em]">{headline}</h1>
          <p className="mt-1 text-xs text-muted-foreground">{motivation}</p>
        </div>
      </header>


      <section className="soft-panel mt-3 grid gap-2 rounded-xl border border-white/[0.06] bg-card p-2 xl:grid-cols-[minmax(0,1fr)_auto]">
        <div className="soft-inset flex min-w-0 items-center gap-3 rounded-lg border border-white/[0.055] bg-input px-3 py-2.5">
          <Plus className="size-4 text-muted-foreground" />
          <span className="truncate text-[13px] text-muted-foreground">Capture project link, Twitter watchlist, note, or inbox item...</span>
        </div>
        <div className="grid grid-cols-4 gap-2 xl:flex">
          <Link href="/projects" className={cn(buttonVariants({ variant: "secondary", size: "sm" }), "soft-control")}>Project</Link>
          <Link href="/projects?view=watchlist" className={cn(buttonVariants({ variant: "secondary", size: "sm" }), "soft-control")}>Watchlist</Link>
          <Link href="/docs" className={cn(buttonVariants({ variant: "secondary", size: "sm" }), "soft-control")}>Note</Link>
          <Link href="/inbox" className={cn(buttonVariants({ variant: "secondary", size: "sm" }), "soft-control")}>Inbox</Link>
        </div>
      </section>
      <div className="mt-3 grid gap-3 xl:grid-cols-[minmax(0,1fr)_350px] 2xl:grid-cols-[minmax(420px,1fr)_minmax(340px,0.82fr)_350px]">
        <DashboardPanel icon={StickyNote} title="Notes desk" href="/docs">
          <SectionLabel label="Pinned notes" />
          <div className="divide-y divide-white/[0.045]">
            {dashboardPinnedNotes.map((note, index) => <PinnedNoteRow key={note.title + "-" + index} note={note} />)}
          </div>
          <SectionLabel label="Recent notes" className="mt-2.5" />
          <div className="divide-y divide-white/[0.045]">
            {dashboardRecentNotes.map((note, index) => <SimpleRow key={note.title + "-" + index} title={note.title} meta={note.meta} />)}
          </div>
        </DashboardPanel>

        <DashboardPanel
          icon={CalendarClock}
          title="Upcoming deadlines"
          href="/deadlines"
          headerAction={<DeadlineCreateButton options={deadlineOptions} disabled={!canManageDeadlines} />}
        >
          <div className="divide-y divide-white/[0.045]">
            {deadlines.length > 0
              ? deadlines.map((item, index) => <DeadlineRow key={item.id} item={item} className={index >= 5 ? "hidden sm:grid" : undefined} />)
              : <p className="py-6 text-center text-xs text-muted-foreground">No upcoming deadlines</p>}
          </div>
          {deadlineDueCount && deadlineDueCount > 5 ? (
            <Link href="/deadlines" className={cn("mt-2 inline-flex text-[11px] font-medium text-muted-foreground hover:text-foreground", deadlineDueCount <= deadlines.length ? "sm:hidden" : "")}>
              <span className="sm:hidden">View {deadlineDueCount - Math.min(deadlines.length, 5)} more</span>
              <span className="hidden sm:inline">View {deadlineDueCount - deadlines.length} more</span>
            </Link>
          ) : null}
        </DashboardPanel>

        <DashboardPanel icon={RadioTower} title="Hunting pulse" href="/projects" className="xl:row-span-2">
          <SectionLabel label="Overview" />
          <div className="grid grid-cols-2 gap-2">
            {metrics.map((metric) => <MetricTile key={metric.label} item={metric} />)}
          </div>

          <SectionLabel label="Categories" className="mt-2.5" />
          <div className="flex flex-wrap gap-1.5">
            {categories.map((item) => <PulsePill key={item.label} item={item} />)}
          </div>

        </DashboardPanel>

        <DashboardPanel icon={Inbox} title="Inbox to process" href="/inbox">
          <div className="divide-y divide-white/[0.045]">
            {dashboardInboxItems.map((item, index) => <InboxRow key={item.title + "-" + index} item={item} />)}
          </div>
        </DashboardPanel>

        <DashboardPanel icon={AlertCircle} title="Recent activity" href="/projects">
          <div className="divide-y divide-white/[0.045]">
            {dashboardRecentActivity.map((activity, index) => <Activity key={activity.text + "-" + index} {...activity} />)}
          </div>
        </DashboardPanel>
      </div>
    </div>
  );
}

function DashboardPanel({ icon: Icon, title, href, className = "", headerAction, children }: { icon: typeof Inbox; title: string; href: string; className?: string; headerAction?: ReactNode; children: ReactNode }) {
  return (
    <section className={"soft-panel overflow-hidden rounded-xl bg-card " + className}>
      <div className="flex items-center justify-between gap-3 px-3 py-2.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white/[0.04] text-muted-foreground"><Icon className="size-4" /></span>
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold">{title}</h2>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {headerAction}
          <Link href={href} className="shrink-0 text-[11px] text-muted-foreground hover:text-foreground">Open</Link>
        </div>
      </div>
      <div className="p-3 pt-2.5">{children}</div>
    </section>
  );
}

function SectionLabel({ label, className = "" }: { label: string; className?: string }) {
  return <h3 className={"mb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground " + className}>{label}</h3>;
}

function InboxRow({ item }: { item: DashboardInboxItem }) {
  return (
    <Link href="/inbox" className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-1.5 text-left hover:bg-white/[0.025]">
      <span className="min-w-0">
        <span className="block truncate text-[13px] font-medium">{item.title}</span>
        <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">{item.meta}</span>
      </span>
      <Badge variant={item.variant}>{item.badge}</Badge>
    </Link>
  );
}

function PinnedNoteRow({ note }: { note: DashboardNoteItem & { icon?: typeof StickyNote } }) {
  const Icon = note.icon ?? StickyNote;
  return (
    <Link href="/docs" className="grid w-full grid-cols-[auto_minmax(0,1fr)] items-center gap-2.5 py-1.5 text-left hover:bg-white/[0.025]">
      <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground"><Icon className="size-3.5" /></span>
      <span className="min-w-0">
        <span className="block truncate text-[13px] font-medium">{note.title}</span>
        <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">{note.meta}</span>
      </span>
    </Link>
  );
}

function SimpleRow({ title, meta }: { title: string; meta: string }) {
  return (
    <Link href="/docs" className="grid w-full py-1.5 text-left hover:bg-white/[0.025]">
      <span className="truncate text-[13px] font-medium">{title}</span>
      <span className="mt-0.5 truncate text-[11px] text-muted-foreground">{meta}</span>
    </Link>
  );
}

function MetricTile({ item }: { item: (typeof overviewMetrics)[number] }) {
  return (
    <Link href="/projects" className="rounded-lg bg-white/[0.035] px-3 py-2 hover:bg-white/[0.055]">
      <span className="block text-[11px] text-muted-foreground">{item.label}</span>
      <span className="mt-0.5 block text-[18px] font-semibold leading-none tabular-nums tracking-[-0.025em]">{item.value}</span>
    </Link>
  );
}

function PulsePill({ item }: { item: (typeof pulseItems)[number] }) {
  return (
    <Link href={item.href} className="inline-flex items-baseline gap-1.5 rounded-md bg-white/[0.035] px-2 py-1 hover:bg-white/[0.055] hover:text-foreground">
      <span className="text-[11px] text-muted-foreground">{item.label}</span>
      <span className="text-[13px] font-semibold tabular-nums tracking-[-0.025em]">{item.value}</span>
    </Link>
  );
}


function DeadlineRow({ item, className }: { item: UpcomingDeadlineItem; className?: string }) {
  const dueLabel = formatDeadlineDueLabel(item.dueDate);
  const dueTime = formatDeadlineTime(item.dueTime);
  const overdue = getDeadlineDayDifference(item.dueDate) < 0;

  return (
    <Link href="/deadlines" className={cn("grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-2 py-1.5 text-left hover:bg-white/[0.025] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", className)}>
      <span className="min-w-0">
        <span className="block truncate text-[13px] font-medium">{item.title}</span>
        <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">{item.context}</span>
      </span>
      <span className="text-right">
        <span className={"block text-[11px] font-medium tabular-nums " + (overdue ? "text-destructive" : dueLabel === "Today" ? "text-warning" : "text-muted-foreground")}>{dueLabel}</span>
        {dueTime ? <span className="block text-[10px] text-muted-foreground">{dueTime}</span> : null}
      </span>
    </Link>
  );
}

function getFallbackDeadlines(): UpcomingDeadlineItem[] {
  const today = getJakartaDateValue();
  return [
    { id: "preview-proof", source: "deadline", title: "Project Alpha proof", context: "Submit before reset", dueDate: today, dueTime: null, url: null, linkedProjectId: null, linkedTaskId: "preview-proof", linkedNftCampaignId: null },
    { id: "preview-billing", source: "deadline", title: "Cancel Website A billing", context: "Standalone deadline", dueDate: shiftDateValue(today, 1), dueTime: null, url: null, linkedProjectId: null, linkedTaskId: null, linkedNftCampaignId: null },
    { id: "preview-proxy", source: "deadline", title: "Proxy Website B expires", context: "Renew if farming stays active", dueDate: shiftDateValue(today, 7), dueTime: "20:00", url: null, linkedProjectId: null, linkedTaskId: null, linkedNftCampaignId: null },
  ];
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
