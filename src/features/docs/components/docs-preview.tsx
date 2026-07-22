import {
  ArrowUpRight,
  BookOpenText,
  FileText,
  Folder,
  KeyRound,
  Link2,
  Plus,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Star,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const folders = [
  { name: "Research", count: 12, meta: "Protocol notes and findings" },
  { name: "Tools & Links", count: 18, meta: "Dashboards, explorers, docs" },
  { name: "Guides / SOP", count: 7, meta: "Repeatable workflows" },
  { name: "Project References", count: 24, meta: "Setup and campaign notes" },
  { name: "Accounts & Access", count: 9, meta: "Safe access metadata only" },
  { name: "Templates", count: 5, meta: "Reusable tracking formats" },
  { name: "Personal Notes", count: 14, meta: "Strategy and reminders" },
];

const pinnedDocs = [
  { title: "Soundness prover setup", folder: "Project References", meta: "Commands, repo link, proof URL", icon: FileText },
  { title: "Waitlist review SOP", folder: "Guides / SOP", meta: "How to process new waitlist results", icon: BookOpenText },
  { title: "Account access map", folder: "Accounts & Access", meta: "Login URL, username, vault location", icon: KeyRound },
];

const recentDocs = [
  { title: "Linera Galxe checklist", folder: "Project References", time: "12m" },
  { title: "Retro interaction template", folder: "Templates", time: "1h" },
  { title: "Useful explorers", folder: "Tools & Links", time: "Yesterday" },
  { title: "Huddle01 result notes", folder: "Research", time: "Yesterday" },
];

export function DocsPreview() {
  return (
    <div className="px-4 py-4 sm:px-5 lg:px-6 lg:py-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs text-muted-foreground">Docs · Knowledge library</p>
          <h1 className="font-display mt-1 text-2xl font-semibold tracking-[-0.025em]">Docs</h1>
        </div>
        <Button variant="secondary" size="sm" disabled title="Preview only"><Plus />New doc</Button>
      </header>

      <section className="soft-panel mt-4 grid gap-2 rounded-xl border soft-divider bg-card p-2 lg:grid-cols-[minmax(0,1fr)_auto]">
        <div className="soft-inset flex min-w-0 items-center gap-3 rounded-lg border soft-divider bg-input px-3 py-2.5">
          <Search className="size-4 text-muted-foreground" />
          <input aria-label="Search docs" className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-muted-foreground" placeholder="Search docs, folders, project references, links, or safe metadata..." readOnly title="Preview only" />
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" disabled title="Preview only"><SlidersHorizontal />Filter</Button>
          <Button variant="secondary" size="sm" disabled title="Preview only">Quick add</Button>
        </div>
      </section>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <main className="space-y-4">
          <section className="soft-panel overflow-hidden rounded-xl border soft-divider bg-card">
            <div className="flex items-center justify-between gap-3 border-b soft-divider px-4 py-3">
              <div className="flex items-center gap-2.5">
                <span className="grid size-8 place-items-center rounded-lg border soft-divider bg-muted text-muted-foreground"><Star className="size-4" /></span>
                <div>
                  <h2 className="text-sm font-semibold">Pinned docs</h2>
                </div>
              </div>
              <Badge variant="secondary">3 pinned</Badge>
            </div>
            <div className="grid gap-2 p-3 md:grid-cols-3">
              {pinnedDocs.map((doc) => <PinnedDoc key={doc.title} doc={doc} />)}
            </div>
          </section>

          <section className="soft-panel rounded-xl border soft-divider bg-card p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold">Folders</h2>
              </div>
              <button className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground">View all<ArrowUpRight className="size-3.5" /></button>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {folders.map((folder) => <FolderCard key={folder.name} folder={folder} />)}
            </div>
          </section>
        </main>

        <aside className="space-y-4">
          <section className="soft-panel rounded-xl border soft-divider bg-card p-4">
            <div className="flex items-start gap-3">
              <span className="grid size-9 place-items-center rounded-lg border soft-divider bg-muted text-muted-foreground"><ShieldCheck className="size-4" /></span>
              <div>
                <h2 className="text-sm font-semibold">Safe access metadata only</h2>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">Docs can store login URL, account label, username or email, and a note like password stored in Bitwarden or local vault.</p>
              </div>
            </div>
            <div className="mt-3 rounded-lg border soft-divider bg-muted/45 p-3 text-xs leading-5 text-muted-foreground">
              Do not store raw passwords, seed phrases, private keys, recovery phrases, exchange API secrets, or 2FA backup codes.
            </div>
          </section>

          <section className="soft-panel overflow-hidden rounded-xl border soft-divider bg-card">
            <div className="flex items-center justify-between gap-3 border-b soft-divider px-4 py-3">
              <div>
                <h2 className="text-sm font-semibold">Recent docs</h2>
              </div>
              <button className="text-[11px] text-muted-foreground hover:text-foreground">View all</button>
            </div>
            <div className="divide-y divide-white/[0.045]">
              {recentDocs.map((doc) => <RecentDoc key={doc.title} doc={doc} />)}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function PinnedDoc({ doc }: { doc: (typeof pinnedDocs)[number] }) {
  const Icon = doc.icon;
  return (
    <button className="rounded-lg border soft-divider bg-muted/45 p-3 text-left hover:bg-accent/45">
      <span className="flex items-center gap-2">
        <span className="grid size-8 place-items-center rounded-lg bg-background text-muted-foreground"><Icon className="size-4" /></span>
        <span className="min-w-0">
          <span className="block truncate text-[13px] font-medium">{doc.title}</span>
          <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">{doc.folder}</span>
        </span>
      </span>
      <span className="mt-3 block text-xs leading-5 text-muted-foreground">{doc.meta}</span>
    </button>
  );
}

function FolderCard({ folder }: { folder: (typeof folders)[number] }) {
  return (
    <button className="flex items-center gap-3 rounded-lg border soft-divider bg-muted/40 p-3 text-left hover:bg-accent/45">
      <span className="soft-inset grid size-10 shrink-0 place-items-center rounded-lg bg-background text-muted-foreground"><Folder className="size-5" /></span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-medium">{folder.name}</span>
        <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">{folder.meta}</span>
      </span>
      <span className="rounded-md border soft-divider bg-card px-2 py-1 text-[11px] tabular-nums text-muted-foreground">{folder.count}</span>
    </button>
  );
}

function RecentDoc({ doc }: { doc: (typeof recentDocs)[number] }) {
  return (
    <button className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 text-left hover:bg-accent/35">
      <Link2 className="size-4 text-muted-foreground" />
      <span className="min-w-0">
        <span className="block truncate text-xs font-medium">{doc.title}</span>
        <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">{doc.folder}</span>
      </span>
      <span className="text-[10px] text-muted-foreground">{doc.time}</span>
    </button>
  );
}
