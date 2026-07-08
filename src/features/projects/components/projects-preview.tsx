"use client";

import { ArrowDown, Columns3, ExternalLink, Filter, MoreHorizontal, Plus, Search, SlidersHorizontal, Upload, X } from "lucide-react";
import { useState, type ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const tabs = ["All 6", "Watchlist 2", "Free Hunts 3", "Retro 1", "NFT 1", "Waitlist 1"];

const projects = [
  {
    name: "Soundness",
    mark: "S",
    logoClass: "bg-[#eef4ff] text-[#315dca]",
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
    logoClass: "bg-[#111827] text-[#b9ccff]",
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
    logoClass: "bg-[#ff5b3d] text-white",
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
    logoClass: "bg-[#4b7cff] text-white",
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
    logoClass: "bg-[#ff6b00] text-black",
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
    logoClass: "bg-[#e8f0ff] text-[#2d5bd1]",
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
      <header className="flex flex-col gap-4 border-b border-border px-4 pb-5 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-8">
        <div>
          <p className="text-xs text-muted-foreground">6 active · 1 running · 1 recheck</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-[-0.02em]">Projects</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">Track every hunt, stage, account, and work type without losing context.</p>
        </div>
        <Button size="sm" onClick={() => setIsAddOpen(true)}><Plus />Add project</Button>
      </header>

      <div className="border-b border-border px-4 sm:px-6 lg:px-8">
        <div className="scrollbar-subtle flex gap-1 overflow-x-auto py-3">
          {tabs.map((tab, index) => (
            <button key={tab} className={cn("shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium", index === 0 ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent/50 hover:text-foreground")}>{tab}</button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3 border-b border-border px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:px-8">
        <label className="flex h-9 min-w-0 items-center gap-2 rounded-lg border border-border bg-card px-3 lg:w-72">
          <Search className="size-4 text-muted-foreground" />
          <input aria-label="Search projects" className="min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground" placeholder="Search projects..." />
        </label>
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <button className="flex h-8 items-center gap-2 rounded-lg border border-border px-3 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"><Filter className="size-3.5" />Status: Active</button>
          <button className="flex h-8 items-center gap-2 rounded-lg border border-border px-3 text-xs text-muted-foreground hover:bg-accent hover:text-foreground">Stage: Open</button>
          <button className="flex h-8 items-center gap-2 rounded-lg border border-border px-3 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"><SlidersHorizontal className="size-3.5" />More filters</button>
          <span className="hidden flex-1 lg:block" />
          <button className="flex h-8 items-center gap-2 rounded-lg border border-border px-3 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"><ArrowDown className="size-3.5" />Last activity</button>
          <button className="grid size-8 place-items-center rounded-lg border border-border text-muted-foreground hover:bg-accent hover:text-foreground" aria-label="Choose columns"><Columns3 className="size-3.5" /></button>
        </div>
      </div>

      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full min-w-[1120px] border-collapse text-left">
          <thead className="sticky top-0 z-10 bg-secondary text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
            <tr>
              <th className="sticky left-0 z-20 min-w-[250px] border-b border-r border-border bg-secondary px-4 py-3 lg:px-8">Project</th>
              <th className="border-b border-border px-3 py-3">Status</th>
              <th className="border-b border-border px-3 py-3">Priority</th>
              <th className="border-b border-border px-3 py-3">Work type</th>
              <th className="border-b border-border px-3 py-3">Project type</th>
              <th className="border-b border-border px-3 py-3">Account</th>
              <th className="border-b border-border px-3 py-3">Completion</th>
              <th className="border-b border-border px-3 py-3">Date start</th>
              <th className="border-b border-border px-3 py-3">Activity</th>
              <th className="w-12 border-b border-border px-3 py-3"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>{projects.map((project) => <ProjectRow key={project.name} project={project} onOpen={() => setSelectedProject(project)} />)}</tbody>
        </table>
      </div>

      <div className="divide-y divide-border lg:hidden">{projects.map((project) => <ProjectCard key={project.name} project={project} onOpen={() => setSelectedProject(project)} />)}</div>
      <footer className="flex items-center justify-between border-t border-border px-4 py-3 text-[11px] text-muted-foreground sm:px-6 lg:px-8">
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
    <tr className="group h-14 border-b border-border hover:bg-accent/30">
      <td className="sticky left-0 z-[1] border-r border-border bg-background px-4 group-hover:bg-[#191d20] lg:px-8">
        <ProjectIdentity project={project} onOpen={onOpen} />
      </td>
      <td className="px-3"><Badge variant={statusVariant(project.status)}>{project.status}</Badge></td>
      <td className="px-3"><Priority value={project.priority} /></td>
      <td className="px-3"><Tags tags={project.work} strong max={2} /></td>
      <td className="px-3"><Tags tags={project.type} max={2} /></td>
      <td className="px-3"><AccountChips accounts={project.accounts} /></td>
      <td className="px-3"><Progress value={project.progress} /></td>
      <td className="whitespace-nowrap px-3 text-xs text-muted-foreground">{project.date}</td>
      <td className="px-3 text-xs text-muted-foreground">{project.activity}</td>
      <td className="px-3"><button className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground" aria-label={"More options for " + project.name}><MoreHorizontal className="size-4" /></button></td>
    </tr>
  );
}

function ProjectIdentity({ project, onOpen }: { project: Project; onOpen?: () => void }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <span className={cn("grid size-8 shrink-0 place-items-center rounded-lg text-[11px] font-bold shadow-sm", project.logoClass)}>{project.mark}</span>
      <span className="min-w-0">
        <button type="button" onClick={onOpen} className="block max-w-full truncate text-left text-[13px] font-semibold text-foreground hover:underline">{project.name}</button>
        <span className="mt-0.5 flex min-w-0 items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className="truncate">{project.hunt}</span>
          <span className="size-1 rounded-full bg-muted-foreground/50" />
          <span className="truncate text-[#c0c6cf]">{project.stage}</span>
        </span>
      </span>
    </div>
  );
}

function Priority({ value }: { value: string }) {
  const color = value === "High" ? "bg-destructive" : value === "Medium" ? "bg-warning" : "bg-muted-foreground";
  return <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"><span className={cn("size-1.5 rounded-full", color)} />{value}</span>;
}

function Tags({ tags, strong = false, max = 2 }: { tags: string[]; strong?: boolean; max?: number }) {
  const visible = tags.slice(0, max);
  const hidden = tags.length - visible.length;
  return (
    <div className="flex max-w-52 gap-1 overflow-hidden">
      {visible.map((tag) => <span key={tag} className={cn("shrink-0 rounded-md px-1.5 py-0.5 text-[11px]", strong ? "bg-accent text-foreground" : "bg-elevated text-[#aeb5bd]")}>{tag}</span>)}
      {hidden > 0 ? <span className="shrink-0 rounded-md bg-elevated px-1.5 py-0.5 text-[11px] text-muted-foreground">+{hidden}</span> : null}
    </div>
  );
}

function AccountChips({ accounts }: { accounts: string[] }) {
  return (
    <div className="flex max-w-28 gap-1 overflow-hidden">
      {accounts.slice(0, 2).map((account) => <span key={account} className="grid size-6 shrink-0 place-items-center rounded-full border border-border bg-muted text-[10px] font-semibold text-muted-foreground" title={account}>{account[0]}</span>)}
      {accounts.length > 2 ? <span className="grid size-6 shrink-0 place-items-center rounded-full border border-border bg-muted text-[10px] font-semibold text-muted-foreground">+{accounts.length - 2}</span> : null}
    </div>
  );
}

function Progress({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-10 text-right text-[11px] tabular-nums text-muted-foreground">{value}%</span>
      <span className="h-1 w-16 rounded-full bg-elevated"><span className="block h-full rounded-full bg-primary" style={{ width: value + "%" }} /></span>
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
      <div className="mt-3 flex items-center gap-3"><Progress value={project.progress} /><span className="text-[11px] text-muted-foreground">{project.activity}</span></div>
    </article>
  );
}

function ProjectDetailPanel({ project, onClose }: { project: Project | null; onClose: () => void }) {
  if (!project) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-full justify-end bg-black/35 backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-labelledby="project-detail-title">
      <aside className="h-full w-full max-w-[520px] overflow-y-auto border-l border-border bg-card shadow-2xl shadow-black/50 scrollbar-subtle">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card/95 px-5 py-3 backdrop-blur">
          <div className="min-w-0">
            <p className="text-[11px] text-muted-foreground">Project detail preview</p>
            <h2 id="project-detail-title" className="mt-0.5 truncate text-base font-semibold">{project.name}</h2>
          </div>
          <button onClick={onClose} className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground" aria-label="Close project detail"><X className="size-4" /></button>
        </div>

        <div className="px-5 py-5">
          <div className="flex items-start gap-3">
            <span className={cn("grid size-14 shrink-0 place-items-center rounded-2xl text-lg font-bold shadow-sm", project.logoClass)}>{project.mark}</span>
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-2xl font-semibold tracking-[-0.03em]">{project.name}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{project.hunt} · {project.stage}</p>
              <div className="mt-3 flex flex-wrap gap-2"><Badge variant={statusVariant(project.status)}>{project.status}</Badge><Priority value={project.priority} /></div>
            </div>
          </div>

          <section className="mt-6 rounded-xl border border-border bg-muted/20 p-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Property label="Status"><Badge variant={statusVariant(project.status)}>{project.status}</Badge></Property>
              <Property label="Stage / result"><span>{project.stage}</span></Property>
              <Property label="Priority"><Priority value={project.priority} /></Property>
              <Property label="Completion"><Progress value={project.progress} /></Property>
              <Property label="Date start"><span>{project.date}</span></Property>
              <Property label="Last activity"><span>{project.activity}</span></Property>
            </div>
          </section>

          <section className="mt-4 grid gap-3">
            <PropertyBlock label="Work Type"><Tags tags={project.work} strong max={4} /></PropertyBlock>
            <PropertyBlock label="Project Type"><Tags tags={project.type} max={4} /></PropertyBlock>
            <PropertyBlock label="Accounts"><div className="flex flex-wrap gap-1.5">{project.accounts.map((account) => <span key={account} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-2 py-1 text-xs text-muted-foreground"><span className="grid size-5 place-items-center rounded-full bg-background text-[10px] font-semibold">{account[0]}</span>{account}</span>)}</div></PropertyBlock>
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
              <button className="text-[11px] text-muted-foreground hover:text-foreground">New doc</button>
            </div>
            <div className="mt-2 divide-y divide-border overflow-hidden rounded-xl border border-border">
              <DetailRow title="Setup notes" meta="Commands and setup checklist" />
              <DetailRow title="Result note" meta={project.stage + " · linked doc"} />
            </div>
          </section>

          <section className="mt-5">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold">Tasks</h4>
              <button className="text-[11px] text-muted-foreground hover:text-foreground">Add task</button>
            </div>
            <div className="mt-2 divide-y divide-border overflow-hidden rounded-xl border border-border">
              <DetailRow title="Submit initial task" meta="Todo · once" />
              <DetailRow title="Check result" meta="Recheck · custom" />
            </div>
          </section>

          <section className="mt-5">
            <h4 className="text-sm font-semibold">About this project</h4>
            <textarea className="mt-2 min-h-28 w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-ring" placeholder="Add project notes, setup context, result, or reminders..." />
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
  return <div className="rounded-xl border border-border bg-muted/15 p-3"><p className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">{label}</p><div className="mt-2">{children}</div></div>;
}

function DetailLink({ label, value }: { label: string; value: string }) {
  return <a href="#" className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground hover:bg-accent/40 hover:text-foreground"><span><span className="text-foreground">{label}</span> · {value}</span><ExternalLink className="size-3.5" /></a>;
}

function DetailRow({ title, meta }: { title: string; meta: string }) {
  return <button className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left hover:bg-accent/35"><span className="min-w-0"><span className="block truncate text-xs font-medium">{title}</span><span className="mt-0.5 block truncate text-[11px] text-muted-foreground">{meta}</span></span><span className="text-[11px] text-muted-foreground">Open</span></button>;
}

function AddProjectDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/55 px-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="add-project-title">
      <div className="soft-panel max-h-[calc(100vh-32px)] w-full max-w-xl overflow-y-auto rounded-2xl border border-border bg-card shadow-2xl shadow-black/50">
        <div className="flex items-start justify-between gap-4 border-b border-border px-4 py-3">
          <div>
            <p className="text-[11px] text-muted-foreground">Preview form</p>
            <h2 id="add-project-title" className="mt-0.5 text-base font-semibold tracking-[-0.02em]">Add project</h2>
            <p className="mt-0.5 text-[11px] text-muted-foreground">Manual logo first. Preview only.</p>
          </div>
          <button onClick={onClose} className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground" aria-label="Close add project"><X className="size-4" /></button>
        </div>

        <div className="grid gap-3 px-4 py-3 md:grid-cols-2">
          <div className="md:col-span-2 rounded-xl border border-border bg-muted/25 p-2.5">
            <div className="flex items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-lg border border-border bg-background text-sm font-semibold text-muted-foreground">S</span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium">Project logo</p>
                <p className="mt-1 text-[11px] text-muted-foreground">Upload, paste image URL, or keep initials.</p>
              </div>
              <Button variant="secondary" size="sm"><Upload />Upload</Button>
            </div>
            <input className="mt-2 h-8 w-full rounded-lg border border-border bg-background px-3 text-xs outline-none placeholder:text-muted-foreground focus:border-ring" placeholder="Paste image URL later..." />
          </div>

          <Field label="Project name" placeholder="Soundness" className="md:col-span-2" />
          <SelectPreview label="Hunt type" value="Free Hunts" options={["Free Hunts", "Retro", "NFT", "Waitlist"]} />
          <SelectPreview label="Stage / result" value="Registered" options={["Not started", "Registered", "Waiting result", "Accepted", "Whitelisted", "Eligible", "Not eligible", "Claimable", "Mint open", "Done"]} />
          <SelectPreview label="Status" value="Watching" options={["Watching", "In progress", "Running", "Recheck", "Paused"]} />
          <SelectPreview label="Priority" value="Medium" options={["High", "Medium", "Low"]} />
          <Field label="Work type" placeholder="Testnet, Node, CLI, Whitelist" />
          <Field label="Project type" placeholder="ZK, AI, DePIN, L1" />
          <Field label="Website or docs URL" placeholder="https://..." />
          <Field label="Assigned accounts" placeholder="Moree, Wdym" />
          <div className="md:col-span-2">
            <label className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Notes</label>
            <textarea className="mt-1.5 min-h-20 w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-ring" placeholder="What should be tracked first? Links, setup notes, account plan, deadline, or whitelist result..." />
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border bg-muted/25 px-4 py-3">
          <p className="text-[11px] text-muted-foreground">Stage/result stays separate from work status.</p>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
            <Button size="sm" onClick={onClose}>Save project</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, placeholder, className = "" }: { label: string; placeholder: string; className?: string }) {
  return (
    <label className={className}>
      <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">{label}</span>
      <input className="mt-1.5 h-9 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none placeholder:text-muted-foreground focus:border-ring" placeholder={placeholder} />
    </label>
  );
}

function SelectPreview({ label, value, options }: { label: string; value: string; options: string[] }) {
  return (
    <label>
      <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">{label}</span>
      <select defaultValue={value} className="mt-1.5 h-9 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-ring">
        {options.map((option) => <option key={option}>{option}</option>)}
      </select>
    </label>
  );
}
