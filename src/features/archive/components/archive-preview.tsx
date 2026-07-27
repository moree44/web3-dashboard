"use client";

import { Archive, CalendarClock, RotateCcw, Search, ShieldAlert, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import { deleteProject, restoreProject, type ProjectWithAccounts } from "@/features/projects/actions";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ArchivedProject = {
  id?: string;
  name: string;
  mark: string;
  hunt: string;
  reason: string;
  status: string;
  result: string;
  account: string;
  archived: string;
};

const initialArchivedProjects: ArchivedProject[] = [
  { name: "Old Mint Pass", mark: "O", hunt: "NFT", reason: "claimed", status: "Archived", result: "Mint completed", account: "Moree", archived: "Jul 08" },
  { name: "Beta Exchange Quest", mark: "B", hunt: "Retro", reason: "not_worth", status: "Archived", result: "Low reward", account: "Wdym", archived: "Jul 04" },
  { name: "Retro Bridge Alpha", mark: "R", hunt: "Retro", reason: "completed", status: "Archived", result: "Interaction saved", account: "Moree", archived: "Jun 28" },
  { name: "Unknown Faucet Campaign", mark: "U", hunt: "Free Hunts", reason: "scam_risk", status: "Archived", result: "Stopped before wallet use", account: "Wayss", archived: "Jun 24" },
  { name: "Expired Waitlist Form", mark: "E", hunt: "Waitlist", reason: "expired", status: "Archived", result: "Deadline passed", account: "Wdym", archived: "Jun 19" },
  { name: "Testnet Season 1", mark: "T", hunt: "Free Hunts", reason: "claimed", status: "Archived", result: "Airdrop claimed", account: "Moree", archived: "May 30" },
  { name: "Duplicate Soundness Note", mark: "D", hunt: "Free Hunts", reason: "duplicate", status: "Archived", result: "Merged into active project", account: "Moree", archived: "May 18" },
];

type ReasonFilter = "all" | "claimed" | "dropped" | "scam_risk" | "expired" | "not_worth" | "duplicate" | "completed" | "other";

function mapArchivedProject(project: ProjectWithAccounts): ArchivedProject {
  return {
    id: project.id,
    name: project.name,
    mark: project.name.slice(0, 1).toUpperCase(),
    hunt: toTitleCase(project.huntType ?? "free_hunts"),
    reason: project.archiveReason ?? "other",
    status: "Archived",
    result: project.notes?.trim() || toTitleCase(project.archiveReason ?? "other"),
    account: project.assignedAccounts[0]?.label ?? "Unassigned",
    archived: project.archivedAt
      ? new Intl.DateTimeFormat("en-US", {
          month: "short",
          day: "2-digit",
          timeZone: "Asia/Jakarta",
        }).format(project.archivedAt)
      : "Unknown",
  };
}

export function ArchivePreview({ initialProjects = [], developmentPreview = false }: { initialProjects?: ProjectWithAccounts[]; developmentPreview?: boolean }) {
  const [items, setItems] = useState<ArchivedProject[]>(() => developmentPreview ? initialArchivedProjects : initialProjects.map(mapArchivedProject));
  const [actionError, setActionError] = useState("");
  const [activeFilter, setActiveFilter] = useState<ReasonFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(() => new Set());
  const query = searchQuery.trim().toLowerCase();

  const reasonCounts = useMemo(() => {
    return {
      all: items.length,
      claimed: items.filter((item) => item.reason === "claimed").length,
      dropped: items.filter((item) => item.reason === "dropped").length,
      notWorth: items.filter((item) => item.reason === "not_worth").length,
      scam: items.filter((item) => item.reason === "scam_risk").length,
      expired: items.filter((item) => item.reason === "expired").length,
      completed: items.filter((item) => item.reason === "completed").length,
      duplicate: items.filter((item) => item.reason === "duplicate").length,
      other: items.filter((item) => item.reason === "other").length,
    };
  }, [items]);

  const filters: { id: ReasonFilter; label: string }[] = [
    { id: "all", label: `All ${reasonCounts.all}` },
    { id: "claimed", label: `Claimed ${reasonCounts.claimed}` },
    { id: "dropped", label: `Dropped ${reasonCounts.dropped}` },
    { id: "scam_risk", label: `Scam Risk ${reasonCounts.scam}` },
    { id: "not_worth", label: `Not Worth ${reasonCounts.notWorth}` },
    { id: "expired", label: `Expired ${reasonCounts.expired}` },
    { id: "completed", label: `Completed ${reasonCounts.completed}` },
    { id: "duplicate", label: `Duplicate ${reasonCounts.duplicate}` },
    { id: "other", label: `Other ${reasonCounts.other}` },
  ];

  const filtered = useMemo(() => {
    return items.filter((project) => {
      if (activeFilter !== "all" && project.reason !== activeFilter) return false;
      if (!query) return true;
      const haystack = [project.name, project.hunt, project.reason, project.result, project.account, project.archived].join(" ").toLowerCase();
      return haystack.includes(query);
    });
  }, [activeFilter, items, query]);

  const selectedCount = selectedProjects.size;

  function toggleSelected(projectId: string) {
    setSelectedProjects((current) => {
      const next = new Set(current);
      if (next.has(projectId)) next.delete(projectId);
      else next.add(projectId);
      return next;
    });
  }

  async function restoreSelected() {
    if (selectedCount === 0) return;
    setActionError("");
    try {
      if (!developmentPreview) await Promise.all([...selectedProjects].map((id) => restoreProject(id)));
      setItems((current) => current.filter((project) => !selectedProjects.has(project.id ?? project.name)));
      setSelectedProjects(new Set());
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Unable to restore selected projects");
    }
  }

  async function permanentlyDelete(project: ArchivedProject) {
    if (!confirm("Permanently delete this archived project? This cannot be undone.")) return;
    setActionError("");
    try {
      if (!developmentPreview && project.id) await deleteProject(project.id);
      setItems((current) => current.filter((item) => (item.id ?? item.name) !== (project.id ?? project.name)));
      setSelectedProjects((current) => { const next = new Set(current); next.delete(project.id ?? project.name); return next; });
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Unable to delete project");
    }
  }

  return (
    <div className="min-w-0 py-5 lg:py-7">
      <header className="flex flex-col gap-4 border-b soft-divider px-4 pb-5 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-8">
        <div>
          <h1 className="mt-1 text-2xl font-semibold tracking-[-0.02em]">Archive</h1>
        </div>
        <Button variant="secondary" size="sm" disabled={selectedCount === 0} onClick={restoreSelected} title={selectedCount === 0 ? "Select projects to restore" : "Remove selected from archive preview"}>
          <RotateCcw />Restore selected
        </Button>
      </header>

      <div className="border-b soft-divider px-4 sm:px-6 lg:px-8">
        <div className="scrollbar-subtle flex gap-1 overflow-x-auto py-2.5">
          {filters.map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => setActiveFilter(filter.id)}
              className={cn(
                "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium",
                activeFilter === filter.id ? "bg-accent text-foreground shadow-[inset_0_1px_0_rgb(255_255_255/0.06)]" : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground",
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {actionError ? <p className="px-4 pt-3 text-xs text-danger sm:px-6 lg:px-8">{actionError}</p> : null}

      <div className="flex flex-col gap-3 border-b soft-divider px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:px-8">
        <label className="flex h-9 min-w-0 items-center gap-2 rounded-lg border border-white/[0.06] bg-card px-3 lg:w-72">
          <Search className="size-4 text-muted-foreground" />
          <input
            aria-label="Search archive"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
            placeholder="Search archived projects..."
          />
        </label>
        <button type="button" disabled title="Preview only" className="flex h-8 items-center gap-2 rounded-lg border border-white/[0.045] bg-transparent px-3 text-xs text-muted-foreground opacity-50"><CalendarClock className="size-3.5" />Archived date</button>
        <button type="button" disabled title="Preview only" className="flex h-8 items-center gap-2 rounded-lg border border-white/[0.045] bg-transparent px-3 text-xs text-muted-foreground opacity-50"><ShieldAlert className="size-3.5" />Reason filter</button>
      </div>

      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full min-w-[900px] table-fixed border-collapse text-left">
          <colgroup>
            <col className="w-[320px]" />
            <col className="w-[140px]" />
            <col className="w-[130px]" />
            <col className="w-[220px]" />
            <col className="w-[110px]" />
            <col className="w-[120px]" />
            <col className="w-[44px]" />
          </colgroup>
          <thead className="sticky top-0 z-10 bg-background text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
            <tr>
              <th className="border-b border-white/[0.045] px-4 py-3 lg:px-8">Project</th>
              <th className="border-b border-white/[0.045] px-3 py-3">Reason</th>
              <th className="border-b border-white/[0.045] px-3 py-3">Hunt type</th>
              <th className="border-b border-white/[0.045] px-3 py-3">Result</th>
              <th className="border-b border-white/[0.045] px-3 py-3">Account</th>
              <th className="border-b border-white/[0.045] px-3 py-3">Archived</th>
              <th className="border-b border-white/[0.045] px-3 py-3"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>{filtered.map((project) => { const key = project.id ?? project.name; return <ArchiveRow key={key} project={project} selected={selectedProjects.has(key)} onSelect={() => toggleSelected(key)} onDelete={() => permanentlyDelete(project)} />; })}</tbody>
        </table>
      </div>

      <div className="divide-y divide-white/[0.045] lg:hidden">{filtered.map((project) => { const key = project.id ?? project.name; return <ArchiveMobileCard key={key} project={project} selected={selectedProjects.has(key)} onSelect={() => toggleSelected(key)} onDelete={() => permanentlyDelete(project)} />; })}</div>
      <footer className="flex items-center justify-between border-t soft-divider px-4 py-3 text-[11px] text-muted-foreground sm:px-6 lg:px-8">
        <span>Showing {filtered.length} archived projects</span>
        <span />
      </footer>
    </div>
  );
}

function ArchiveRow({ project, selected, onSelect, onDelete }: { project: ArchivedProject; selected: boolean; onSelect: () => void; onDelete: () => void }) {
  return (
    <tr className="h-[58px] border-b border-white/[0.035] hover:bg-white/[0.025]">
      <td className="px-4 lg:px-8">
        <div className="flex items-center gap-3">
          <ArchiveCheckbox project={project} selected={selected} onSelect={onSelect} />
          <ArchiveIdentity project={project} />
        </div>
      </td>
      <td className="px-3"><Reason reason={project.reason} /></td>
      <td className="px-3 text-xs text-muted-foreground">{project.hunt}</td>
      <td className="px-3 text-xs text-muted-foreground">{project.result}</td>
      <td className="px-3"><span className="grid size-7 place-items-center rounded-full bg-white/[0.055] text-[10px] font-semibold">{project.account[0]}</span></td>
      <td className="px-3 text-xs text-muted-foreground">{project.archived}</td>
      <td className="px-3"><button type="button" onClick={onDelete} aria-label={"Delete " + project.name + " permanently"} className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-white/[0.045] hover:text-red-400"><Trash2 className="size-4" /></button></td>
    </tr>
  );
}

function ArchiveMobileCard({ project, selected, onSelect, onDelete }: { project: ArchivedProject; selected: boolean; onSelect: () => void; onDelete: () => void }) {
  return (
    <article className="px-4 py-4 sm:px-6">
      <div className="flex items-center gap-3">
        <ArchiveCheckbox project={project} selected={selected} onSelect={onSelect} />
        <ArchiveIdentity project={project} />
      </div>
      <div className="mt-3 flex items-center justify-between gap-2"><div className="flex flex-wrap gap-2"><Reason reason={project.reason} /><Badge variant="secondary">{project.hunt}</Badge><Badge variant="outline">{project.archived}</Badge></div><button type="button" onClick={onDelete} aria-label={"Delete " + project.name + " permanently"} className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-white/[0.045] hover:text-red-400"><Trash2 className="size-4" /></button></div>
    </article>
  );
}

function ArchiveCheckbox({ project, selected, onSelect }: { project: ArchivedProject; selected: boolean; onSelect: () => void }) {
  return (
    <input
      type="checkbox"
      aria-label={"Select " + project.name}
      checked={selected}
      onChange={onSelect}
      className="size-4 shrink-0 accent-white"
    />
  );
}

function ArchiveIdentity({ project }: { project: ArchivedProject }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white/[0.065] text-[11px] font-bold text-[#c4cad3]"><Archive className="size-4" /></span>
      <span className="min-w-0">
        <span className="block truncate text-[13px] font-semibold text-foreground">{project.name}</span>
        <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">{project.status} · {project.result}</span>
      </span>
    </div>
  );
}

function Reason({ reason }: { reason: string }) {
  const variant = reason === "claimed" || reason === "completed" ? "success" : reason === "scam_risk" ? "destructive" : reason === "expired" ? "warning" : "secondary";
  return <Badge variant={variant}>{toTitleCase(reason)}</Badge>;
}

function toTitleCase(value: string) {
  return value.split(/[ _]+/).map((word) => word.slice(0, 1).toUpperCase() + word.slice(1)).join(" ");
}
