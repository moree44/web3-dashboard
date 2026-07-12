"use client";

import { CalendarClock, Check, ChevronDown, Columns3, ExternalLink, Filter, MoreHorizontal, Plus, Search, SlidersHorizontal, X } from "lucide-react";
import { useState, type ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const tabs = ["All 6", "Watchlist 2", "Free Hunts 3", "Retro 1", "NFT 1", "Waitlist 1"];

const projects = [
  {
    name: "Soundness",
    mark: "S",
    logoClass: "bg-white/[0.065] text-[#c4cad3]",
    status: "In progress",
    priority: "High",
    hunt: "Free Hunts",
    stage: "Submitted proof",
    work: ["Testnet registration", "Testnet", "Submit proof"],
    type: ["ZK", "Verif layer"],
    accounts: ["Moree", "Wdym"],
    progress: 50,
    date: "Mar 23",
    activity: "8m",
  },
  {
    name: "NexusHQ",
    mark: "N",
    logoClass: "bg-white/[0.065] text-[#c4cad3]",
    status: "Running",
    priority: "Medium",
    hunt: "Free Hunts",
    stage: "Node running",
    work: ["CLI running", "Point system"],
    type: ["Prover", "Node"],
    accounts: ["Moree"],
    progress: 72,
    date: "Oct 10",
    activity: "1h",
  },
  {
    name: "Linera",
    mark: "L",
    logoClass: "bg-white/[0.065] text-[#c4cad3]",
    status: "In progress",
    priority: "High",
    hunt: "Free Hunts",
    stage: "Role farming",
    work: ["Farm role", "Testnet", "Galxe"],
    type: ["L1"],
    accounts: ["Wdym"],
    progress: 33,
    date: "Apr 18",
    activity: "2h",
  },
  {
    name: "Huddle01",
    mark: "H",
    logoClass: "bg-white/[0.065] text-[#c4cad3]",
    status: "Recheck",
    priority: "Medium",
    hunt: "Waitlist",
    stage: "Waiting result",
    work: ["Early access", "Collect badge"],
    type: ["L2", "Meet to earn"],
    accounts: ["Moree"],
    progress: 60,
    date: "Apr 19",
    activity: "5h",
  },
  {
    name: "Drosera",
    mark: "D",
    logoClass: "bg-white/[0.065] text-[#c4cad3]",
    status: "Paused",
    priority: "High",
    hunt: "Retro",
    stage: "Needs recheck",
    work: ["Node", "Testnet"],
    type: ["Security"],
    accounts: ["Moree"],
    progress: 18,
    date: "Apr 15",
    activity: "1d",
  },
  {
    name: "Dawn",
    mark: "D",
    logoClass: "bg-white/[0.065] text-[#c4cad3]",
    status: "Watching",
    priority: "Medium",
    hunt: "NFT",
    stage: "Joined whitelist",
    work: ["Whitelist", "Extension"],
    type: ["DePIN"],
    accounts: ["Wdym"],
    progress: 10,
    date: "Nov 11",
    activity: "2d",
  },
];

export function ProjectsPreview() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  return (
    <div className="min-w-0 py-5 lg:py-7">
      <header className="flex flex-col gap-4 border-b soft-divider px-4 pb-5 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-8">
        <div>
          <p className="text-xs text-muted-foreground">6 active · 1 running · 1 recheck</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-[-0.02em]">Projects</h1>
        </div>
        <Button variant="secondary" size="sm" onClick={() => setIsAddOpen(true)}><Plus />Add project</Button>
      </header>

      <div className="border-b soft-divider px-4 sm:px-6 lg:px-8">
        <div className="scrollbar-subtle flex gap-1 overflow-x-auto py-2.5">
          {tabs.map((tab, index) => (
            <button key={tab} className={cn("shrink-0 rounded-full px-3 py-1.5 text-xs font-medium", index === 0 ? "bg-accent text-foreground shadow-[inset_0_1px_0_rgb(255_255_255/0.06)]" : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground")}>{tab}</button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3 border-b soft-divider px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:px-8">
        <label className="flex h-9 min-w-0 items-center gap-2 rounded-lg border border-white/[0.06] bg-card px-3 lg:w-72">
          <Search className="size-4 text-muted-foreground" />
          <input aria-label="Search projects" className="min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground" placeholder="Search projects..." />
        </label>
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <button className="flex h-8 items-center gap-2 rounded-lg border border-white/[0.045] bg-transparent px-3 text-xs text-muted-foreground hover:bg-white/[0.04] hover:text-foreground"><Filter className="size-3.5" />Status: Active</button>
          <button className="flex h-8 items-center gap-2 rounded-lg border border-white/[0.045] bg-transparent px-3 text-xs text-muted-foreground hover:bg-white/[0.04] hover:text-foreground">Stage: Open</button>
          <button className="flex h-8 items-center gap-2 rounded-lg border border-white/[0.045] bg-transparent px-3 text-xs text-muted-foreground hover:bg-white/[0.04] hover:text-foreground"><SlidersHorizontal className="size-3.5" />More filters</button>
          <span className="hidden flex-1 lg:block" />
          <button className="grid size-8 place-items-center rounded-lg border border-white/[0.045] text-muted-foreground hover:bg-white/[0.04] hover:text-foreground" aria-label="Choose columns"><Columns3 className="size-3.5" /></button>
        </div>
      </div>

      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full min-w-[1090px] table-fixed border-collapse text-left">
          <colgroup>
            <col className="w-[330px]" />
            <col className="w-[130px]" />
            <col className="w-[110px]" />
            <col className="w-[270px]" />
            <col className="w-[160px]" />
            <col className="w-[100px]" />
            <col className="w-[150px]" />
            <col className="w-[110px]" />
            <col className="w-[44px]" />
          </colgroup>
          <thead className="sticky top-0 z-10 bg-background text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
            <tr>
              <th className="sticky left-0 z-20 border-b border-white/[0.045] bg-background px-4 py-3 lg:px-8">Project</th>
              <th className="border-b border-white/[0.045] px-3 py-3">Status</th>
              <th className="border-b border-white/[0.045] px-3 py-3">Priority</th>
              <th className="border-b border-white/[0.045] px-3 py-3">Work type</th>
              <th className="border-b border-white/[0.045] px-3 py-3">Project type</th>
              <th className="border-b border-white/[0.045] px-3 py-3">Account</th>
              <th className="border-b border-white/[0.045] px-3 py-3">Completion</th>
              <th className="border-b border-white/[0.045] px-3 py-3">Date start</th>
              <th className="w-12 border-b border-white/[0.045] px-3 py-3"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>{projects.map((project) => <ProjectRow key={project.name} project={project} onOpen={() => setSelectedProject(project)} />)}</tbody>
        </table>
      </div>

      <div className="divide-y divide-white/[0.045] lg:hidden">{projects.map((project) => <ProjectCard key={project.name} project={project} onOpen={() => setSelectedProject(project)} />)}</div>
      <footer className="flex items-center justify-between border-t soft-divider px-4 py-3 text-[11px] text-muted-foreground sm:px-6 lg:px-8">
        <span>Showing 6 preview projects</span>
        <button className="font-medium hover:text-foreground">Add real data later</button>
      </footer>

      <AddProjectDialog open={isAddOpen} onClose={() => setIsAddOpen(false)} />
      <ProjectDetailPanel project={selectedProject} onClose={() => setSelectedProject(null)} />
    </div>
  );
}

type Project = (typeof projects)[number];

function statusVariant(status: string) {
  if (status === "Done") return "success" as const;
  if (status === "Running") return "info" as const;
  if (status === "Recheck" || status === "Waiting" || status === "Watching") return "warning" as const;
  if (status === "Paused") return "secondary" as const;
  return "secondary" as const;
}

function ProjectRow({ project, onOpen }: { project: Project; onOpen: () => void }) {
  return (
    <tr className="group h-[58px] border-b border-white/[0.035] hover:bg-white/[0.025]">
      <td className="sticky left-0 z-[1] bg-background px-4 group-hover:bg-[#121214] lg:px-8">
        <ProjectIdentity project={project} onOpen={onOpen} />
      </td>
      <td className="px-3"><Badge variant={statusVariant(project.status)}>{project.status}</Badge></td>
      <td className="px-3"><Priority value={project.priority} /></td>
      <td className="px-3"><Tags tags={project.work} strong max={2} /></td>
      <td className="px-3"><Tags tags={project.type} max={2} /></td>
      <td className="px-3"><AccountChips accounts={project.accounts} /></td>
      <td className="px-3"><Progress value={project.progress} /></td>
      <td className="whitespace-nowrap px-3 text-xs text-muted-foreground">{project.date}</td>
      <td className="px-3"><button className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-white/[0.045] hover:text-foreground" aria-label={"More options for " + project.name}><MoreHorizontal className="size-4" /></button></td>
    </tr>
  );
}

function ProjectIdentity({ project, onOpen }: { project: Project; onOpen?: () => void }) {
  return (
    <button type="button" onClick={onOpen} className="flex min-w-0 items-center gap-2.5 text-left">
      <span className={cn("grid size-8 shrink-0 place-items-center rounded-lg text-[11px] font-bold shadow-sm", project.logoClass)}>{project.mark}</span>
      <span className="min-w-0">
        <span className="block max-w-full truncate text-[13px] font-semibold text-foreground group-hover:underline">{project.name}</span>
        <span className="mt-0.5 flex min-w-0 items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className="truncate">{project.hunt}</span>
          <span className="size-1 rounded-full bg-muted-foreground/50" />
          <span className="truncate text-[#c0c6cf]">{project.stage}</span>
        </span>
      </span>
    </button>
  );
}

function Priority({ value }: { value: string }) {
  return <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"><PrioritySignal value={value} />{value}</span>;
}

function Tags({ tags, strong = false, max = 2 }: { tags: string[]; strong?: boolean; max?: number }) {
  const [open, setOpen] = useState(false);
  const visible = tags.slice(0, max);
  const hidden = tags.length - visible.length;
  const hiddenTags = tags.slice(max);

  return (
    <div className="relative flex max-w-56 gap-1 overflow-visible">
      {visible.map((tag) => <span key={tag} className={cn("shrink-0 rounded-md px-1.5 py-0.5 text-[11px]", strong ? "bg-white/[0.07] text-foreground" : "bg-white/[0.035] text-[#aeb5bd]")}>{tag}</span>)}
      {hidden > 0 ? (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            setOpen((value) => !value);
          }}
          className="shrink-0 rounded-md bg-white/[0.035] px-1.5 py-0.5 text-[11px] text-muted-foreground hover:bg-white/[0.07] hover:text-foreground"
          aria-expanded={open}
        >
          +{hidden}
        </button>
      ) : null}
      {open ? (
        <div className="absolute left-0 top-full z-40 mt-1.5 w-56 rounded-xl border border-white/[0.07] bg-[#18181a]/[0.98] p-2 shadow-2xl shadow-black/45">
          <p className="px-1 pb-1 text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">{strong ? "All work types" : "All tags"}</p>
          <div className="flex flex-wrap gap-1">
            {tags.map((tag) => <span key={tag} className={cn("rounded-md px-1.5 py-0.5 text-[11px]", hiddenTags.includes(tag) ? "bg-white/[0.07] text-foreground" : "bg-white/[0.035] text-[#aeb5bd]")}>{tag}</span>)}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function AccountChips({ accounts }: { accounts: string[] }) {
  return (
    <div className="flex max-w-28 gap-1 overflow-hidden">
      {accounts.slice(0, 2).map((account) => <span key={account} className="grid size-6 shrink-0 place-items-center rounded-full bg-white/[0.055] text-[10px] font-semibold text-muted-foreground" title={account}>{account[0]}</span>)}
      {accounts.length > 2 ? <span className="grid size-6 shrink-0 place-items-center rounded-full bg-white/[0.055] text-[10px] font-semibold text-muted-foreground">+{accounts.length - 2}</span> : null}
    </div>
  );
}


function Progress({ value }: { value: number }) {
  return (
    <div className="inline-flex min-w-[112px] items-center gap-2 align-middle">
      <span className="w-8 text-left text-[11px] tabular-nums text-muted-foreground">{value}%</span>
      <span className="h-1 w-16 rounded-full bg-white/[0.055]"><span className="block h-full rounded-full bg-muted-foreground/70" style={{ width: value + "%" }} /></span>
    </div>
  );
}

function ProjectCard({ project, onOpen }: { project: Project; onOpen: () => void }) {
  return (
    <article className="px-4 py-4 hover:bg-accent/25 sm:px-6">
      <div className="flex items-start justify-between gap-3">
        <ProjectIdentity project={project} onOpen={onOpen} />
        <button aria-label={"More options for " + project.name}><MoreHorizontal className="size-4 text-muted-foreground" /></button>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2"><Badge variant={statusVariant(project.status)}>{project.status}</Badge><Priority value={project.priority} /><AccountChips accounts={project.accounts} /></div>
      <div className="mt-3 flex flex-wrap gap-1"><Tags tags={project.work} strong max={3} /><Tags tags={project.type} max={2} /></div>
      <div className="mt-3 flex items-center gap-3"><Progress value={project.progress} /></div>
    </article>
  );
}

function ProjectDetailPanel({ project, onClose }: { project: Project | null; onClose: () => void }) {
  if (!project) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-full justify-end bg-black/35 backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-labelledby="project-detail-title">
      <aside className="h-full w-full max-w-[520px] overflow-y-auto border-l soft-divider bg-card shadow-2xl shadow-black/50 scrollbar-subtle">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b soft-divider bg-card/95 px-5 py-3 backdrop-blur">
          <div className="min-w-0">
            <h2 id="project-detail-title" className="truncate text-base font-semibold">{project.name}</h2>
          </div>
          <button onClick={onClose} className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground" aria-label="Close project detail"><X className="size-4" /></button>
        </div>

        <div className="px-5 py-5">
          <div className="flex items-start gap-3">
            <span className={cn("grid size-14 shrink-0 place-items-center rounded-2xl text-lg font-bold shadow-sm", project.logoClass)}>{project.mark}</span>
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-2xl font-semibold tracking-[-0.03em]">{project.name}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{project.hunt} · {project.stage}</p>
            </div>
          </div>

          <section className="mt-6 border-t border-white/[0.045] pt-4">
            <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
              <Property label="Status"><Badge variant={statusVariant(project.status)}>{project.status}</Badge></Property>
              <Property label="Stage / result"><span>{project.stage}</span></Property>
              <Property label="Priority"><Priority value={project.priority} /></Property>
              <Property label="Completion"><Progress value={project.progress} /></Property>
              <Property label="Date start"><span>{project.date}</span></Property>
            </div>
          </section>

          <section className="mt-4 grid gap-3">
            <PropertyBlock label="Work Type"><Tags tags={project.work} strong max={4} /></PropertyBlock>
            <PropertyBlock label="Project Type"><Tags tags={project.type} max={4} /></PropertyBlock>
            <PropertyBlock label="Accounts"><div className="flex flex-wrap gap-1.5">{project.accounts.map((account) => <span key={account} className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.045] px-2 py-1 text-xs text-muted-foreground"><span className="grid size-5 place-items-center rounded-full bg-background text-[10px] font-semibold">{account[0]}</span>{account}</span>)}</div></PropertyBlock>
          </section>

          <section className="mt-5">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold">Links</h4>
              <button className="text-[11px] text-muted-foreground hover:text-foreground">Edit links</button>
            </div>
            <div className="mt-2 grid gap-2">
              <DetailLink label="Website" value="https://project.example" />
              <DetailLink label="Docs" value="https://docs.project.example" />
            </div>
          </section>

          <section className="mt-5">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold">Project docs</h4>
              <button className="text-[11px] text-muted-foreground hover:text-foreground">Open Docs</button>
            </div>
            <div className="mt-2 divide-y divide-white/[0.035] overflow-hidden rounded-xl bg-white/[0.025]">
              <DetailRow title={project.name + " project doc"} meta="Main project notes · auto-created later" />
              <DetailRow title="Setup notes" meta="Commands and setup checklist" />
              <DetailRow title="Result note" meta={project.stage + " · linked doc"} />
            </div>
          </section>

          <section className="mt-5">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold">Tasks</h4>
              <button className="text-[11px] text-muted-foreground hover:text-foreground">Add task</button>
            </div>
            <div className="mt-2 divide-y divide-white/[0.035] overflow-hidden rounded-xl bg-white/[0.025]">
              <DetailRow title="Submit initial task" meta="Todo · once" />
              <DetailRow title="Check result" meta="Recheck · custom" />
            </div>
          </section>
        </div>
      </aside>
    </div>
  );
}

function Property({ label, children }: { label: string; children: ReactNode }) {
  return <div><p className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">{label}</p><div className="mt-1 text-xs text-foreground">{children}</div></div>;
}

function PropertyBlock({ label, children }: { label: string; children: ReactNode }) {
  return <div className="border-t border-white/[0.04] pt-3"><p className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">{label}</p><div className="mt-2">{children}</div></div>;
}

function DetailLink({ label, value }: { label: string; value: string }) {
  return <a href="#" className="flex items-center justify-between rounded-lg border border-white/[0.055] bg-muted/20 px-3 py-2 text-xs text-muted-foreground hover:bg-accent/40 hover:text-foreground"><span><span className="text-foreground">{label}</span> · {value}</span><ExternalLink className="size-3.5" /></a>;
}

function DetailRow({ title, meta }: { title: string; meta: string }) {
  return <button className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left hover:bg-accent/35"><span className="min-w-0"><span className="block truncate text-xs font-medium">{title}</span><span className="mt-0.5 block truncate text-[11px] text-muted-foreground">{meta}</span></span><span className="text-[11px] text-muted-foreground">Open</span></button>;
}

const previewAccounts = [
  {
    name: "Moree",
    wallets: ["Moree EVM Main", "Moree SOL Main", "Moree Burner 01"],
  },
  {
    name: "Wdym",
    wallets: ["Wdym EVM Main", "Wdym SOL Main"],
  },
];


function AddProjectDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [openSelect, setOpenSelect] = useState<string | null>(null);

  if (!open) return null;

  return (
    <div className="modal-backdrop-in fixed inset-0 z-50 grid place-items-center bg-black/45 px-4 backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-labelledby="add-project-title">
      <div className="modal-card-in soft-panel w-full max-w-[680px] overflow-hidden rounded-2xl border border-white/[0.065] bg-card shadow-2xl shadow-black/45">
        <div className="flex items-start justify-between gap-4 px-4 py-3.5">
          <div className="min-w-0">
            <h2 id="add-project-title" className="text-base font-semibold tracking-[-0.02em]">Add project</h2>
            <p className="mt-0.5 text-[11px] text-muted-foreground">Create the project first. Details can be completed later.</p>
          </div>
          <button onClick={onClose} className="grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-white/[0.045] hover:text-foreground" aria-label="Close add project"><X className="size-4" /></button>
        </div>

        <div className="px-4 pb-4">
          <div className="grid gap-3 px-2 pb-2 pt-0.5 md:grid-cols-[46px_minmax(0,1fr)_92px] md:items-end">
            <label className="block">
              <span className="block w-10 text-center text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Logo</span>
              <button type="button" className="mt-1.5 grid size-10 place-items-center rounded-lg border border-white/[0.055] bg-white/[0.035] text-sm font-semibold text-muted-foreground hover:bg-white/[0.055] hover:text-foreground" title="Upload or paste logo later">P</button>
            </label>
            <label className="min-w-0">
              <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Project name</span>
              <input autoFocus className="mt-1.5 h-10 w-full soft-inset rounded-lg border border-white/[0.055] bg-input px-3 text-sm font-semibold outline-none placeholder:text-muted-foreground focus:border-ring" placeholder="Soundness, NexusHQ, Linera..." />
            </label>
            <label className="block">
              <span className="block text-center text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Date</span>
              <DatePreview />
            </label>
          </div>

          <div className="px-2 py-2">
            <div className="grid grid-cols-2 gap-1.5 md:grid-cols-4">
              <SelectPreview id="hunt" label="Hunt type" value="Free Hunts" options={["Free Hunts", "Retro", "NFT", "Waitlist"]} openSelect={openSelect} setOpenSelect={setOpenSelect} compact />
              <SelectPreview id="stage" label="Stage" value="Registered" options={["Not started", "Registered", "Waiting result", "Joined whitelist", "Whitelisted", "Eligible", "Claimable", "Mint open", "Done"]} openSelect={openSelect} setOpenSelect={setOpenSelect} compact />
              <SelectPreview id="status" label="Status" value="Watching" options={["Watching", "In progress", "Running", "Recheck", "Paused", "Done"]} openSelect={openSelect} setOpenSelect={setOpenSelect} compact />
              <SelectPreview id="priority" label="Priority" value="Medium" options={["No priority", "High", "Medium", "Low"]} openSelect={openSelect} setOpenSelect={setOpenSelect} compact />
            </div>
          </div>

          <div className="mt-2 px-2">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold">Assigned accounts</p>
              <span className="text-[11px] text-muted-foreground">wallets come from selected accounts</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {previewAccounts.map((account) => <TogglePill key={account.name} label={account.name} active />)}
              <TogglePill label="Wayss" />
            </div>
          </div>

          <div className="mt-3 px-2">
            <div className="mb-2">
              <p className="text-xs font-semibold">Optional context</p>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <Field label="Project URL" placeholder="https://..." />
              <Field label="Work type" placeholder="Testnet, Node" />
              <Field label="Project type" placeholder="ZK, AI, DePIN" />
            </div>
            <label className="mt-3 block">
              <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Short note</span>
              <textarea className="mt-1.5 min-h-12 w-full resize-none soft-inset rounded-lg border border-white/[0.055] bg-input px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-ring" placeholder="Result, deadline, setup, wallet plan, or proof..." />
            </label>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t soft-divider bg-muted/20 px-4 py-2.5">
          <p className="text-[11px] text-muted-foreground">Preview only. Save will connect to Projects, Accounts, Wallets, Tasks, Daily, and Watchlist later.</p>
          <div className="flex shrink-0 gap-2">
            <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
            <Button size="sm" className="bg-accent text-foreground hover:bg-white/[0.09]" onClick={onClose}>Create project</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TogglePill({ label, active = false }: { label: string; active?: boolean }) {
  return <button className={cn("soft-control rounded-full px-3 py-1 text-xs font-medium", active ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground")}>{label}</button>;
}

function Field({ label, placeholder, className = "" }: { label: string; placeholder: string; className?: string }) {
  return (
    <label className={className}>
      <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">{label}</span>
      <input className="mt-1.5 h-9 w-full soft-inset rounded-lg border border-white/[0.055] bg-input px-3 text-sm outline-none placeholder:text-muted-foreground focus:border-ring" placeholder={placeholder} />
    </label>
  );
}

function SelectPreview({ id, label, value, options, openSelect, setOpenSelect, compact = false }: { id: string; label: string; value: string; options: string[]; openSelect: string | null; setOpenSelect: (value: string | null) => void; compact?: boolean }) {
  const [selected, setSelected] = useState(value);
  const open = openSelect === id;

  return (
    <div className="relative">
      {!compact ? <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">{label}</span> : null}
      <button
        type="button"
        onClick={() => setOpenSelect(open ? null : id)}
        className={cn(
          "flex items-center justify-between gap-2 rounded-full border border-white/[0.055] bg-white/[0.035] text-sm outline-none transition-colors hover:bg-white/[0.055]",
          compact ? "h-8 w-full px-2.5 text-xs" : "mt-1.5 h-9 w-full px-3",
          open ? "border-white/[0.12] bg-white/[0.055]" : "",
        )}
        aria-expanded={open}
      >
        <span className="flex min-w-0 items-center gap-2">
          <SelectGlyph label={label} value={selected} />
          <span className="truncate font-medium">{selected}</span>
        </span>
        <ChevronDown className={cn("size-3.5 shrink-0 text-muted-foreground transition-transform", open ? "rotate-180" : "")} />
      </button>

      {open ? (
        <div className={cn("absolute left-0 top-full z-[80] mt-1.5 overflow-hidden rounded-xl border border-white/[0.075] bg-[#18181a]/[0.98] p-1 shadow-2xl shadow-black/45 backdrop-blur", compact ? "w-56" : "w-full")}>
          <div className="px-2 py-1 text-[10px] text-muted-foreground">Change {label.toLowerCase()}...</div>
          {options.map((option, index) => (
            <button
              key={option}
              type="button"
              onClick={() => {
                setSelected(option);
                setOpenSelect(null);
              }}
              className={cn(
                "flex h-7 w-full items-center gap-2 rounded-lg px-2 text-left text-xs transition-colors hover:bg-white/[0.055]",
                selected === option ? "text-foreground" : "text-[#c3c7ce]",
              )}
            >
              <SelectGlyph label={label} value={option} muted={selected !== option} />
              <span className="min-w-0 flex-1 truncate font-medium">{option}</span>
              {label === "Priority" ? <span className="text-xs tabular-nums text-muted-foreground">{index}</span> : null}
              {selected === option ? <Check className="size-4 text-muted-foreground" /> : null}
            </button>
          ))}
          {label === "Work type" || label === "Project type" ? <button className="mt-1 flex h-8 w-full items-center gap-2 rounded-lg px-2 text-left text-sm text-muted-foreground hover:bg-white/[0.055] hover:text-foreground"><Plus className="size-3.5" /> Add custom</button> : null}
        </div>
      ) : null}
    </div>
  );
}

function DatePreview() {
  const today = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date());
  return (
    <button type="button" className="mt-1.5 flex h-10 w-full items-center justify-center gap-1.5 rounded-lg border border-white/[0.055] bg-white/[0.035] px-2 text-xs text-muted-foreground hover:bg-white/[0.055] hover:text-foreground" title="Date added">
      <CalendarClock className="size-3" />
      <span className="font-medium tabular-nums">{today}</span>
    </button>
  );
}

function SelectGlyph({ label, value, muted = false }: { label: string; value: string; muted?: boolean }) {
  if (label === "Priority") return <PriorityIcon value={value} muted={muted} />;
  if (label === "Status") return <StatusDot value={value} muted={muted} />;
  if (label === "Stage / result") return <StageDot value={value} muted={muted} />;
  return <span className={cn("grid size-3.5 shrink-0 place-items-center rounded-full border border-white/[0.08] text-[8px]", muted ? "text-muted-foreground" : "text-foreground")}>{value[0]}</span>;
}

function PrioritySignal({ value, muted = false }: { value: string; muted?: boolean }) {
  if (value === "No priority") return <span className={cn("size-4 shrink-0 text-center text-xs leading-4", muted ? "text-muted-foreground" : "text-foreground")}>---</span>;
  const activeBars = value === "High" ? 3 : value === "Medium" ? 2 : 1;
  const color = muted ? "text-muted-foreground/45" : "text-muted-foreground";
  return (
    <svg className={cn("size-4 shrink-0", color)} viewBox="0 0 16 16" aria-hidden="true" fill="currentColor">
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

function PriorityIcon({ value, muted = false }: { value: string; muted?: boolean }) {
  return <PrioritySignal value={value} muted={muted} />;
}

function StatusDot({ value, muted = false }: { value: string; muted?: boolean }) {
  const tone = muted ? "border-muted-foreground/45" : value === "Running" ? "border-info" : value === "Recheck" ? "border-warning" : value === "Done" ? "border-success" : "border-muted-foreground";
  return <span className={cn("size-3.5 shrink-0 rounded-full border", tone)} aria-hidden="true" />;
}

function StageDot({ value, muted = false }: { value: string; muted?: boolean }) {
  const tone = muted ? "bg-muted-foreground/35" : value.includes("Waiting") || value.includes("Joined") || value === "Registered" ? "bg-warning/80" : value.includes("Eligible") || value.includes("Done") || value.includes("Claimable") ? "bg-success/80" : "bg-muted-foreground/70";
  return <span className={cn("size-2.5 shrink-0 rounded-full", tone)} aria-hidden="true" />;
}
