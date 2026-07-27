"use client";

import { Archive, CalendarClock, Check, ChevronDown, Columns3, ExternalLink, MoreHorizontal, Plus, Search, SlidersHorizontal, Trash2, Upload, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useDrawerDismiss } from "@/lib/use-drawer-dismiss";
import {
  archiveProject,
  createProject,
  deleteProject,
  updateProject,
  uploadProjectLogo,
  type ProjectAccountOption,
  type ProjectWithAccounts,
} from "@/features/projects/actions";
import type { projects as projectsSchema } from "@/lib/db/schema";
import { ARCHIVE_REASONS, filterAndSortProjects, isWatchlistProject, parseProjectQuery, PROJECT_COLUMNS, PROJECT_PRIORITIES, PROJECT_SORTS, PROJECT_STATUSES, STAGE_PRESETS, type ProjectColumn } from "@/features/projects/project-query";

type DbProject = ProjectWithAccounts;

const statusLabels: Record<string, string> = {
  watching: "Watching",
  in_progress: "In progress",
  running: "Running",
  paused: "Paused",
  done: "Done",
  dropped: "Dropped",
  archived: "Archived",
};

const priorityLabels: Record<string, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

const huntLabels: Record<string, string> = {
  free_hunts: "Free Hunts",
  retro: "Retro",
  nft: "NFT",
  waitlist: "Waitlist",
};

const reverseHuntLabels: Record<string, string> = {
  "Free Hunts": "free_hunts",
  Retro: "retro",
  NFT: "nft",
  Waitlist: "waitlist",
};

const reverseStatusLabels: Record<string, string> = {
  Watching: "watching",
  "In progress": "in_progress",
  Running: "running",
  Paused: "paused",
  Done: "done",
  Dropped: "dropped",
};

const reversePriorityLabels: Record<string, string> = {
  High: "high",
  Medium: "medium",
  Low: "low",
};

function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function dbToUIProject(record: DbProject): Project {
  const dateValue = record.dateStart ?? "";

  return {
    id: record.id,
    name: record.name,
    mark: record.name.slice(0, 1).toUpperCase(),
    logoClass: "bg-white/[0.065] text-[#c4cad3]",
    status: statusLabels[record.status ?? ""] ?? "Watching",
    priority: priorityLabels[record.priority ?? ""] ?? "Medium",
    hunt: huntLabels[record.huntType ?? ""] ?? "Free Hunts",
    stage: record.stageResult ?? "Not applicable",
    work: record.workTypes ?? [],
    type: record.projectTypes ?? [],
    accounts: record.assignedAccounts.map((account) => account.label),
    accountIds: record.assignedAccounts.map((account) => account.id),
    progress: Number(record.progressEstimate) || 0,
    date: dateValue
      ? formatDateValue(dateValue)
      : record.createdAt
        ? formatShortDate(new Date(record.createdAt))
        : "",
    dateValue,
    activity: "now",
    logoUrl: record.logoUrl ?? undefined,
    websiteUrl: record.websiteUrl ?? undefined,
    notes: record.notes ?? undefined,
    updatedAt: record.updatedAt?.toISOString(),
  };
}

type Project = {
  id?: string;
  name: string;
  mark: string;
  logoClass: string;
  status: string;
  priority: string;
  hunt: string;
  stage: string;
  work: string[];
  type: string[];
  accounts: string[];
  accountIds?: string[];
  progress: number;
  date: string;
  dateValue?: string;
  activity: string;
  logoUrl?: string;
  websiteUrl?: string;
  notes?: string;
  updatedAt?: string;
};

const fallbackProjects: Project[] = [
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

const previewAccountOptions: ProjectAccountOption[] = [
  { id: "preview-moree", label: "Moree", avatarUrl: null },
  { id: "preview-wdym", label: "Wdym", avatarUrl: null },
  { id: "preview-wayss", label: "Wayss", avatarUrl: null },
];

export function ProjectsPreview({
  view = "all",
  initialProjects = [],
  developmentPreview = false,
  accountOptions = [],
}: {
  view?: "all" | "watchlist";
  initialProjects?: DbProject[];
  developmentPreview?: boolean;
  accountOptions?: ProjectAccountOption[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryState = parseProjectQuery(searchParams);
  const [projectItems, setProjectItems] = useState<Project[]>(() => developmentPreview ? fallbackProjects : initialProjects.map(dbToUIProject));
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [columnsOpen, setColumnsOpen] = useState(false);
  const availableAccountOptions = developmentPreview && accountOptions.length === 0 ? previewAccountOptions : accountOptions;

  function updateUrl(updates: Record<string, string | number | null>, keepPage = false) {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === "" || value === "all") next.delete(key);
      else next.set(key, String(value));
    }
    if (!keepPage && !("page" in updates)) next.delete("page");
    router.replace(`${pathname}${next.size ? `?${next.toString()}` : ""}`, { scroll: false });
  }

  const filterable = useMemo(() => projectItems.map((project) => ({
    ...project,
    statusKey: (reverseStatusLabels[project.status] ?? "watching") as "watching" | "in_progress" | "running" | "paused" | "done" | "dropped",
    priorityKey: (reversePriorityLabels[project.priority] ?? "medium") as "high" | "medium" | "low",
    huntKey: (reverseHuntLabels[project.hunt] ?? "free_hunts") as "free_hunts" | "retro" | "nft" | "waitlist",
  })), [projectItems]);
  const filteredProjects = useMemo(() => filterAndSortProjects(filterable, { ...queryState, view: view === "watchlist" ? "watchlist" : queryState.view }), [filterable, queryState, view]);
  const totalPages = Math.max(1, Math.ceil(filteredProjects.length / queryState.pageSize));
  const currentPage = Math.min(queryState.page, totalPages);
  const visibleProjects = filteredProjects.slice((currentPage - 1) * queryState.pageSize, currentPage * queryState.pageSize);
  const watchlistCount = filterable.filter(isWatchlistProject).length;
  const counts = { free_hunts: 0, retro: 0, nft: 0, waitlist: 0 };
  for (const project of filterable) counts[project.huntKey] += 1;
  const tabs = [
    { label: `All ${projectItems.length}`, view: "all", hunt: "" },
    { label: `Watchlist ${watchlistCount}`, view: "watchlist", hunt: "" },
    { label: `Free Hunts ${counts.free_hunts}`, view: "all", hunt: "free_hunts" },
    { label: `Retro ${counts.retro}`, view: "all", hunt: "retro" },
    { label: `NFT ${counts.nft}`, view: "all", hunt: "nft" },
    { label: `Waitlist ${counts.waitlist}`, view: "all", hunt: "waitlist" },
  ];
  const visibleColumns = new Set(queryState.columns);
  const stageOptions = [...new Set([...STAGE_PRESETS, ...projectItems.map((project) => project.stage).filter(Boolean)])];

  function activateTab(tab: { view: string; hunt: string }) {
    const next = new URLSearchParams(searchParams.toString());
    next.delete("view");
    next.delete("hunt");
    next.delete("page");
    if (tab.view === "watchlist") next.set("view", "watchlist");
    if (tab.hunt) next.set("hunt", tab.hunt);
    router.replace("/projects" + (next.size ? "?" + next.toString() : ""), { scroll: false });
  }

  async function handleCreateProject(project: Project, accountIds: string[], context?: { logoFile?: File | null }) {
    if (developmentPreview) {
      setProjectItems((items) => [{ ...project, id: `preview-${Date.now()}` }, ...items]);
    } else {
      const hasFileUpload = Boolean(context?.logoFile);
      const externalLogoUrl = hasFileUpload || (project.logoUrl?.startsWith("blob:") || project.logoUrl?.startsWith("data:")) ? undefined : project.logoUrl;
      let created = await createProject({
        name: project.name,
        huntType: (reverseHuntLabels[project.hunt] ?? "free_hunts") as typeof projectsSchema.$inferInsert.huntType,
        status: (reverseStatusLabels[project.status] ?? "watching") as typeof projectsSchema.$inferInsert.status,
        priority: (reversePriorityLabels[project.priority] ?? "medium") as typeof projectsSchema.$inferInsert.priority,
        workTypes: project.work,
        projectTypes: project.type,
        stageResult: project.stage,
        dateStart: project.dateValue || undefined,
        websiteUrl: project.websiteUrl ? normalizeUrl(project.websiteUrl) : undefined,
        notes: project.notes || undefined,
        logoUrl: externalLogoUrl,
        logoSource: externalLogoUrl ? "external_url" : "none",
      }, accountIds);
      let logoUploadError = "";
      if (context?.logoFile) {
        const formData = new FormData();
        formData.set("file", context.logoFile);
        try {
          created = await uploadProjectLogo(created.id, formData);
        } catch (error) {
          logoUploadError = error instanceof Error ? error.message : "Unable to upload project logo";
        }
      }
      setProjectItems((items) => [dbToUIProject(created), ...items]);
      if (logoUploadError) window.alert(`Project created, but the logo was not uploaded. ${logoUploadError}`);
    }
    setIsAddOpen(false);
  }

  async function handleArchiveProject(id: string) {
    const reason = window.prompt(
      "Archive reason: claimed, dropped, scam_risk, expired, not_worth, duplicate, completed, or other",
      "completed",
    )?.trim().toLowerCase();
    if (!reason) return;
    if (!ARCHIVE_REASONS.includes(reason as (typeof ARCHIVE_REASONS)[number])) {
      window.alert("Choose a valid archive reason: " + ARCHIVE_REASONS.join(", "));
      return;
    }
    if (!developmentPreview) await archiveProject(id, reason);
    setProjectItems((items) => items.filter((item) => item.id !== id));
    setSelectedProject(null);
  }

  async function handleDeleteProject(id: string) {
    if (!confirm("Permanently delete this project? This cannot be undone.")) return;
    try {
      if (!developmentPreview) await deleteProject(id);
      setProjectItems((items) => items.filter((item) => item.id !== id));
      setSelectedProject(null);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Unable to delete project");
    }
  }

  async function handleUpdateProject(id: string, data: Partial<Omit<typeof projectsSchema.$inferInsert, "workspaceId">>, accountIds?: string[]) {
    const updated = await updateProject(id, data, accountIds);
    const mapped = dbToUIProject(updated);
    setProjectItems((items) => items.map((item) => item.id === id ? mapped : item));
    setSelectedProject(mapped);
    return mapped;
  }

  async function handleLogoUploaded(id: string, updated: ProjectWithAccounts) {
    const mapped = dbToUIProject(updated);
    setProjectItems((items) => items.map((item) => (item.id === id ? mapped : item)));
    setSelectedProject((current) => (current?.id === id ? mapped : current));
  }

  const columnLabels: Record<ProjectColumn, string> = { status: "Status", priority: "Priority", work: "Work type", type: "Project type", accounts: "Account", completion: "Completion", date: "Date start" };

  return (
    <div className="min-w-0 py-5 lg:py-7">
      <header className="flex flex-col gap-4 border-b soft-divider px-4 pb-5 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-8">
        <h1 className="mt-1 text-2xl font-semibold tracking-[-0.02em]">Projects</h1>
        <Button variant="secondary" size="sm" onClick={() => setIsAddOpen(true)}><Plus />Add project</Button>
      </header>

      <div className="border-b soft-divider px-4 sm:px-6 lg:px-8"><div className="scrollbar-subtle flex gap-1 overflow-x-auto py-2.5">
        {tabs.map((tab) => {
          const active = (tab.view === "watchlist" ? queryState.view === "watchlist" || view === "watchlist" : queryState.view !== "watchlist" && view !== "watchlist") && queryState.hunt === tab.hunt;
          return <button key={tab.label} type="button" onClick={() => activateTab(tab)} className={cn("shrink-0 rounded-full px-3 py-1.5 text-xs font-medium", active ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground")}>{tab.label}</button>;
        })}
      </div></div>

      <div className="flex flex-col gap-3 border-b soft-divider px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:px-8">
        <label className="flex h-9 min-w-0 items-center gap-2 rounded-lg border border-white/[0.06] bg-card px-3 lg:w-72"><Search className="size-4 text-muted-foreground" /><input aria-label="Search projects" value={queryState.query} onChange={(event) => updateUrl({ q: event.target.value })} className="min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground" placeholder="Search projects..." /></label>
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <select aria-label="Filter by status" value={queryState.status} onChange={(event) => updateUrl({ status: event.target.value })} className="h-8 rounded-lg border border-white/[0.055] bg-background px-3 text-xs text-muted-foreground outline-none"><option value="">All statuses</option>{PROJECT_STATUSES.map((value) => <option key={value} value={value}>{statusLabels[value]}</option>)}</select>
          <select aria-label="Filter by stage" value={queryState.stage} onChange={(event) => updateUrl({ stage: event.target.value })} className="h-8 rounded-lg border border-white/[0.055] bg-background px-3 text-xs text-muted-foreground outline-none"><option value="">All stages</option>{stageOptions.map((value) => <option key={value}>{value}</option>)}</select>
          <div className="relative"><button type="button" onClick={() => setFiltersOpen((open) => !open)} className="flex h-8 items-center gap-2 rounded-lg border border-white/[0.055] px-3 text-xs text-muted-foreground"><SlidersHorizontal className="size-3.5" />More filters</button>{filtersOpen ? <div className="absolute left-0 top-10 z-40 grid w-64 gap-3 rounded-xl border border-white/[0.08] bg-[#18181a] p-3 shadow-2xl">
            <label className="text-[10px] uppercase text-muted-foreground">Priority<select value={queryState.priority} onChange={(event) => updateUrl({ priority: event.target.value })} className="mt-1 h-8 w-full rounded-lg bg-background px-2 text-xs normal-case text-foreground"><option value="">All priorities</option>{PROJECT_PRIORITIES.map((value) => <option key={value} value={value}>{priorityLabels[value]}</option>)}</select></label>
            <label className="text-[10px] uppercase text-muted-foreground">Account<select value={queryState.account} onChange={(event) => updateUrl({ account: event.target.value })} className="mt-1 h-8 w-full rounded-lg bg-background px-2 text-xs normal-case text-foreground"><option value="">All accounts</option>{availableAccountOptions.map((account) => <option key={account.id} value={account.label}>{account.label}</option>)}</select></label>
            <div className="grid grid-cols-2 gap-2"><label className="text-[10px] uppercase text-muted-foreground">From<input type="date" value={queryState.dateFrom} onChange={(event) => updateUrl({ dateFrom: event.target.value })} className="mt-1 h-8 w-full rounded-lg bg-background px-1 text-[11px]" /></label><label className="text-[10px] uppercase text-muted-foreground">To<input type="date" value={queryState.dateTo} onChange={(event) => updateUrl({ dateTo: event.target.value })} className="mt-1 h-8 w-full rounded-lg bg-background px-1 text-[11px]" /></label></div>
            <button type="button" onClick={() => updateUrl({ priority: null, account: null, dateFrom: null, dateTo: null })} className="text-left text-xs text-muted-foreground hover:text-foreground">Clear filters</button>
          </div> : null}</div>
          <span className="hidden flex-1 lg:block" />
          <select aria-label="Sort projects" value={`${queryState.sort}:${queryState.direction}`} onChange={(event) => { const [sort, direction] = event.target.value.split(":"); updateUrl({ sort, direction }); }} className="h-8 rounded-lg border border-white/[0.055] bg-background px-2 text-xs text-muted-foreground outline-none">{PROJECT_SORTS.flatMap((sort) => ["asc", "desc"].map((direction) => <option key={`${sort}:${direction}`} value={`${sort}:${direction}`}>{sort} {direction === "asc" ? "ascending" : "descending"}</option>))}</select>
          <div className="relative"><button type="button" onClick={() => setColumnsOpen((open) => !open)} className="grid size-8 place-items-center rounded-lg border border-white/[0.055] text-muted-foreground" aria-label="Choose columns"><Columns3 className="size-3.5" /></button>{columnsOpen ? <div className="absolute right-0 top-10 z-40 w-44 rounded-xl border border-white/[0.08] bg-[#18181a] p-2 shadow-2xl">{PROJECT_COLUMNS.map((column) => <label key={column} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs hover:bg-white/[0.04]"><input type="checkbox" checked={visibleColumns.has(column)} onChange={() => { const next = visibleColumns.has(column) ? queryState.columns.filter((item) => item !== column) : [...queryState.columns, column]; updateUrl({ columns: next.length === PROJECT_COLUMNS.length ? null : next.length === 0 ? "none" : next.join(",") }); }} />{columnLabels[column]}</label>)}</div> : null}</div>
        </div>
      </div>

      <div className="hidden overflow-x-auto lg:block"><table className="w-full min-w-[1120px] table-fixed border-collapse text-left"><colgroup><col className="w-[300px]" />{visibleColumns.has("status") && <col className="w-[115px]" />}{visibleColumns.has("priority") && <col className="w-[110px]" />}{visibleColumns.has("work") && <col className="w-[180px]" />}{visibleColumns.has("type") && <col className="w-[150px]" />}{visibleColumns.has("accounts") && <col className="w-[110px]" />}{visibleColumns.has("completion") && <col className="w-[140px]" />}{visibleColumns.has("date") && <col className="w-[105px]" />}<col className="w-[48px]" /></colgroup>
        <thead className="sticky top-0 z-10 bg-background text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground"><tr><th className="sticky left-0 z-20 border-b border-white/[0.045] bg-background px-4 py-3 lg:px-8">Project</th>{PROJECT_COLUMNS.map((column) => visibleColumns.has(column) ? <th key={column} className="border-b border-white/[0.045] px-3 py-3">{columnLabels[column]}</th> : null)}<th className="border-b border-white/[0.045] px-3 py-3"><span className="sr-only">Actions</span></th></tr></thead>
        <tbody>{visibleProjects.map((project, index) => <ProjectRow key={project.id ?? `${project.name}-${index}`} project={project} visibleColumns={visibleColumns} onOpen={() => setSelectedProject(project)} onArchive={handleArchiveProject} onDelete={handleDeleteProject} />)}</tbody>
      </table></div>
      <div className="divide-y divide-white/[0.045] lg:hidden">{visibleProjects.map((project, index) => <ProjectCard key={project.id ?? `${project.name}-${index}`} project={project} onOpen={() => setSelectedProject(project)} onArchive={handleArchiveProject} onDelete={handleDeleteProject} />)}</div>
      <div className="flex min-h-12 items-center justify-between px-4 py-3 text-[11px] text-muted-foreground sm:px-6 lg:px-8"><span>Showing {filteredProjects.length} {filteredProjects.length === 1 ? "project" : "projects"}</span><div className="flex items-center gap-2"><select aria-label="Projects per page" value={queryState.pageSize} onChange={(event) => updateUrl({ pageSize: event.target.value, page: 1 }, true)} className="h-7 rounded-md bg-card px-2"><option value="10">10 per page</option><option value="25">25 per page</option><option value="50">50 per page</option></select><Button variant="secondary" size="sm" disabled={currentPage <= 1} onClick={() => updateUrl({ page: currentPage - 1 }, true)}>Previous</Button><span>{currentPage} / {totalPages}</span><Button variant="secondary" size="sm" disabled={currentPage >= totalPages} onClick={() => updateUrl({ page: currentPage + 1 }, true)}>Next</Button></div></div>

      <AddProjectDialog open={isAddOpen} onClose={() => setIsAddOpen(false)} onCreate={handleCreateProject} accountOptions={availableAccountOptions} />
      <ProjectDetailPanel project={selectedProject} onClose={() => setSelectedProject(null)} onUpdate={handleUpdateProject} onLogoUploaded={handleLogoUploaded} onArchive={handleArchiveProject} onDelete={handleDeleteProject} accountOptions={availableAccountOptions} />
    </div>
  );
}

function statusVariant(status: string) {
  if (status === "Done") return "success" as const;
  if (status === "Running") return "info" as const;
  if (status === "Recheck" || status === "Waiting" || status === "Watching") return "warning" as const;
  if (status === "Paused") return "secondary" as const;
  return "secondary" as const;
}

function ProjectRow({
  project,
  visibleColumns,
  onOpen,
  onArchive,
  onDelete,
}: {
  project: Project;
  visibleColumns: Set<ProjectColumn>;
  onOpen: () => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ left: 0, top: 0 });
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const closeMenu = () => setMenuOpen(false);
    window.addEventListener("resize", closeMenu);
    window.addEventListener("scroll", closeMenu, true);
    return () => {
      window.removeEventListener("resize", closeMenu);
      window.removeEventListener("scroll", closeMenu, true);
    };
  }, [menuOpen]);

  function toggleMenu() {
    const button = menuButtonRef.current;
    if (!button) return;
    const rect = button.getBoundingClientRect();
    setMenuPosition({
      left: Math.max(12, rect.right - 176),
      top: Math.min(window.innerHeight - 104, rect.bottom + 6),
    });
    setMenuOpen((open) => !open);
  }

  return (
    <tr className="group h-[58px] align-middle border-b border-white/[0.035] hover:bg-white/[0.025]">
      <td className="sticky left-0 z-[1] bg-background px-4 group-hover:bg-[#121214] lg:px-8">
        <ProjectIdentity project={project} onOpen={onOpen} />
      </td>
      {visibleColumns.has("status") ? <td className="px-3"><Badge variant={statusVariant(project.status)}>{project.status}</Badge></td> : null}
      {visibleColumns.has("priority") ? <td className="px-3"><Priority value={project.priority} /></td> : null}
      {visibleColumns.has("work") ? <td className="px-3"><Tags tags={project.work} strong max={2} /></td> : null}
      {visibleColumns.has("type") ? <td className="px-3"><Tags tags={project.type} max={2} /></td> : null}
      {visibleColumns.has("accounts") ? <td className="px-3"><AccountChips accounts={project.accounts} /></td> : null}
      {visibleColumns.has("completion") ? <td className="px-3"><Progress value={project.progress} /></td> : null}
      {visibleColumns.has("date") ? <td className="whitespace-nowrap px-3 text-xs text-foreground">{project.date}</td> : null}
      <td className="px-3">
        <div className="flex justify-end">
          <button ref={menuButtonRef} onClick={(event) => { event.stopPropagation(); toggleMenu(); }} className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-white/[0.045] hover:text-foreground" aria-label={"More options for " + project.name}><MoreHorizontal className="size-4" /></button>
          {menuOpen && typeof document !== "undefined" ? createPortal(
            <div className="fixed z-[100] w-44 rounded-xl border border-white/[0.08] bg-[#18181a]/[0.98] p-1 shadow-2xl shadow-black/45" style={menuPosition} onClick={(event) => event.stopPropagation()}>
              <button onClick={() => { setMenuOpen(false); if (project.id) onArchive(project.id); }} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs text-[#c8cdd5] hover:bg-white/[0.055]"><Archive className="size-3.5" />Archive</button>
              <button onClick={() => { setMenuOpen(false); if (project.id) onDelete(project.id); }} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs text-red-400 hover:bg-white/[0.055]"><Trash2 className="size-3.5" />Delete permanently</button>
            </div>,
            document.body,
          ) : null}
        </div>
      </td>
    </tr>
  );
}

function ProjectIdentity({ project, onOpen }: { project: Project; onOpen?: () => void }) {
  return (
    <button type="button" onClick={onOpen} className="flex min-w-0 items-center gap-2.5 text-left">
      <span className={cn("grid size-8 shrink-0 place-items-center overflow-hidden rounded-lg bg-cover bg-center text-[11px] font-bold shadow-sm", project.logoClass)} style={project.logoUrl ? { backgroundImage: `url("${project.logoUrl}")` } : undefined}>{project.logoUrl ? null : project.mark}</span>
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
  return <span className="inline-flex items-center gap-1.5 text-xs text-foreground"><PrioritySignal value={value} />{value}</span>;
}

function Tags({ tags, strong = false, max = 2 }: { tags: string[]; strong?: boolean; max?: number }) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ left: 0, top: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const visible = tags.slice(0, max);
  const hidden = tags.length - visible.length;
  const hiddenTags = tags.slice(max);

  useEffect(() => {
    if (!open) return;

    function updatePosition() {
      const button = buttonRef.current;
      if (!button) return;

      const buttonRect = button.getBoundingClientRect();
      const popoverWidth = popoverRef.current?.offsetWidth ?? 224;
      const popoverHeight = popoverRef.current?.offsetHeight ?? 88;
      const viewportPadding = 12;
      const gap = 6;
      const hasRoomBelow = buttonRect.bottom + gap + popoverHeight <= window.innerHeight - viewportPadding;

      setPosition({
        left: Math.min(
          Math.max(buttonRect.left, viewportPadding),
          window.innerWidth - popoverWidth - viewportPadding,
        ),
        top: hasRoomBelow
          ? buttonRect.bottom + gap
          : Math.max(viewportPadding, buttonRect.top - popoverHeight - gap),
      });
    }

    const frame = window.requestAnimationFrame(updatePosition);
    const closePopover = () => setOpen(false);

    window.addEventListener("resize", closePopover);
    window.addEventListener("scroll", closePopover, true);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", closePopover);
      window.removeEventListener("scroll", closePopover, true);
    };
  }, [open, tags.length]);

  return (
    <div className="flex max-w-full items-center gap-1">
      {visible.map((tag) => <span key={tag} title={tag} className={cn("max-w-[92px] shrink-0 truncate rounded-md px-1.5 py-0.5 text-[11px]", strong ? "bg-white/[0.07] text-foreground" : "bg-white/[0.035] text-[#aeb5bd]")}>{tag}</span>)}
      {hidden > 0 ? (
        <button
          ref={buttonRef}
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            const buttonRect = event.currentTarget.getBoundingClientRect();
            setPosition({ left: buttonRect.left, top: buttonRect.bottom + 6 });
            setOpen((value) => !value);
          }}
          className="shrink-0 rounded-md bg-white/[0.035] px-1.5 py-0.5 text-[11px] text-muted-foreground hover:bg-white/[0.07] hover:text-foreground"
          aria-expanded={open}
        >
          +{hidden}
        </button>
      ) : null}
      {open && typeof document !== "undefined"
        ? createPortal(
          <div
            ref={popoverRef}
            className="fixed z-[100] w-56 rounded-xl border border-white/[0.07] bg-[#18181a]/[0.98] p-2 shadow-2xl shadow-black/45"
            style={{ left: position.left, top: position.top }}
            onClick={(event) => event.stopPropagation()}
          >
            <p className="px-1 pb-1 text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">{strong ? "All work types" : "All project types"}</p>
            <div className="flex flex-wrap gap-1">
              {tags.map((tag) => <span key={tag} className={cn("rounded-md px-1.5 py-0.5 text-[11px]", hiddenTags.includes(tag) ? "bg-white/[0.07] text-foreground" : "bg-white/[0.035] text-[#aeb5bd]")}>{tag}</span>)}
            </div>
          </div>,
          document.body,
        )
        : null}
    </div>
  );
}

function AccountChips({ accounts }: { accounts: string[] }) {
  if (accounts.length === 0) return <span className="text-[11px] text-[#8f97a2]">Unassigned</span>;

  return (
    <div className="flex max-w-28 gap-1 overflow-hidden">
      {accounts.slice(0, 2).map((account) => <span key={account} className="grid size-6 shrink-0 place-items-center rounded-full bg-white/[0.07] text-[10px] font-semibold text-[#aeb5bf]" title={account}>{account[0]}</span>)}
      {accounts.length > 2 ? <span className="grid size-6 shrink-0 place-items-center rounded-full bg-white/[0.07] text-[10px] font-semibold text-[#aeb5bf]">+{accounts.length - 2}</span> : null}
    </div>
  );
}


function Progress({ value }: { value: number }) {
  const barColor = value >= 75 ? "bg-success/70" : value >= 40 ? "bg-info/70" : "bg-foreground";
  return (
    <div className="inline-flex min-w-[112px] items-center gap-2 align-middle">
      <span className="w-8 text-left text-[11px] tabular-nums text-foreground">{value}%</span>
      <span className="h-1 w-16 rounded-full bg-white/[0.08]"><span className={cn("block h-full rounded-full", barColor)} style={{ width: value + "%" }} /></span>
    </div>
  );
}

function ProjectCard({
  project,
  onOpen,
  onArchive,
  onDelete,
}: {
  project: Project;
  onOpen: () => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <article className="px-4 py-4 hover:bg-accent/25 sm:px-6">
      <div className="flex items-start justify-between gap-3">
        <ProjectIdentity project={project} onOpen={onOpen} />
        <div className="relative">
          <button onClick={(event) => { event.stopPropagation(); setMenuOpen(!menuOpen); }} aria-label={"More options for " + project.name}><MoreHorizontal className="size-4 text-muted-foreground" /></button>
          {menuOpen ? (
            <div className="absolute right-0 top-8 z-50 w-44 rounded-xl border border-white/[0.08] bg-[#18181a] p-1 shadow-xl">
              <button onClick={(event) => { event.stopPropagation(); setMenuOpen(false); if (project.id) onArchive(project.id); }} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-[#c8cdd5] hover:bg-white/[0.055]"><Archive className="size-3.5" />Archive</button>
              <button onClick={(event) => { event.stopPropagation(); setMenuOpen(false); if (project.id) onDelete(project.id); }} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-red-400 hover:bg-white/[0.055]"><Trash2 className="size-3.5" />Delete permanently</button>
            </div>
          ) : null}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2"><Badge variant={statusVariant(project.status)}>{project.status}</Badge><Priority value={project.priority} /><AccountChips accounts={project.accounts} /></div>
      <div className="mt-3 flex flex-wrap gap-1"><Tags tags={project.work} strong max={3} /><Tags tags={project.type} max={2} /></div>
      <div className="mt-3 flex items-center gap-3"><Progress value={project.progress} /></div>
    </article>
  );
}

function ProjectDetailPanel({
  project,
  onClose,
  onUpdate,
  onLogoUploaded,
  onArchive,
  onDelete,
  accountOptions,
}: {
  project: Project | null;
  onClose: () => void;
  onUpdate: (
    id: string,
    data: Partial<Omit<typeof projectsSchema.$inferInsert, "workspaceId">>,
    accountIds?: string[],
  ) => Promise<void | Project>;
  onLogoUploaded: (id: string, updated: ProjectWithAccounts) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
  accountOptions: ProjectAccountOption[];
}) {
  useDrawerDismiss(onClose, Boolean(project));

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editHunt, setEditHunt] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [editPriority, setEditPriority] = useState("");
  const [editStage, setEditStage] = useState("");
  const [editProgress, setEditProgress] = useState(0);
  const [editDate, setEditDate] = useState("");
  const [editWorkTypes, setEditWorkTypes] = useState<string[]>([]);
  const [editProjectTypes, setEditProjectTypes] = useState<string[]>([]);
  const [editAccountIds, setEditAccountIds] = useState<string[]>([]);
  const [editWebsiteUrl, setEditWebsiteUrl] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [editLogoPreview, setEditLogoPreview] = useState("");
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  if (!project) return null;
  const p = project;

  function enterEdit() {
    setEditName(p.name);
    setEditHunt(p.hunt);
    setEditStatus(p.status);
    setEditPriority(p.priority);
    setEditStage(p.stage);
    setEditProgress(p.progress);
    setEditDate(p.dateValue ?? "");
    setEditWorkTypes(p.work);
    setEditProjectTypes(p.type);
    setEditWebsiteUrl(p.websiteUrl ?? "");
    setEditNotes(p.notes ?? "");
    setEditAccountIds(
      p.accountIds
      ?? accountOptions
        .filter((account) => p.accounts.includes(account.label))
        .map((account) => account.id),
    );
    setEditLogoPreview("");
    setSaveError("");
    setIsEditing(true);
  }

  function cancelEdit() {
    setEditLogoPreview("");
    setIsEditing(false);
  }

  async function saveEdit() {
    if (!p.id || isSaving) return;
    const name = editName.trim();
    if (!name) {
      setSaveError("Project name is required");
      return;
    }
    const statusDb = (reverseStatusLabels[editStatus] ?? "watching") as typeof projectsSchema.$inferInsert.status;
    const priorityDb = (reversePriorityLabels[editPriority] ?? "medium") as typeof projectsSchema.$inferInsert.priority;
    const huntDb = (reverseHuntLabels[editHunt] ?? "free_hunts") as typeof projectsSchema.$inferInsert.huntType;
    setIsSaving(true);
    setSaveError("");
    try {
      await onUpdate(p.id, {
        name,
        huntType: huntDb,
        status: statusDb,
        priority: priorityDb,
        stageResult: editStage || undefined,
        progressEstimate: String(editProgress),
        dateStart: editDate || undefined,
        workTypes: editWorkTypes,
        projectTypes: editProjectTypes,
        websiteUrl: normalizeUrl(editWebsiteUrl) || null,
        notes: editNotes || null,
      }, editAccountIds);
      setIsEditing(false);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Unable to update project");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleEditLogoUpload(file: File) {
    if (!p.id || isUploadingLogo) return;
    setIsUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.set("file", file);
      const updated = await uploadProjectLogo(p.id, formData);
      onLogoUploaded(p.id, updated);
      setEditLogoPreview("");
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Unable to upload logo");
    } finally {
      setIsUploadingLogo(false);
    }
  }

  function queueLogoFile(file: File | null) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setEditLogoPreview(typeof reader.result === "string" ? reader.result : "");
    reader.readAsDataURL(file);
    void handleEditLogoUpload(file);
  }

  function toggleEditAccount(id: string) {
    setEditAccountIds((current) => (
      current.includes(id)
        ? current.filter((accountId) => accountId !== id)
        : [...current, id]
    ));
  }

  return (
    <div
      className="drawer-backdrop-in fixed inset-y-0 right-0 z-50 flex w-full justify-end bg-black/35 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="project-detail-title"
      onClick={onClose}
    >
      <aside
        className="drawer-panel-in h-full w-full max-w-[520px] overflow-y-auto border-l soft-divider bg-card shadow-2xl shadow-black/50 scrollbar-subtle"
        onClick={(event) => event.stopPropagation()}
        onPaste={(event) => {
          if (!isEditing || isUploadingLogo) return;
          const target = event.target as HTMLElement;
          if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) return;
          const items = event.clipboardData.items;
          for (const item of items) {
            if (item.type.startsWith("image/")) {
              event.preventDefault();
              const file = item.getAsFile();
              if (!file) return;
              queueLogoFile(file);
              return;
            }
          }
        }}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b soft-divider bg-card/95 px-5 py-3 backdrop-blur">
          <div className="min-w-0">
            <h2 id="project-detail-title" className="truncate text-base font-semibold">{project.name}</h2>
          </div>
          <div className="flex items-center gap-1">
            <div className="relative">
              <button onClick={() => setMenuOpen(!menuOpen)} className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground" aria-label="More options"><MoreHorizontal className="size-4" /></button>
              {menuOpen ? (
                <div className="absolute right-0 top-10 z-50 w-44 rounded-lg border border-white/[0.08] bg-[#161618] py-1 shadow-xl">
                  <button onClick={() => { setMenuOpen(false); if (project.id) onArchive(project.id); }} className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-[#c8cdd5] hover:bg-white/[0.055]"><Archive className="size-3.5" />Archive</button>
                  <button onClick={() => { setMenuOpen(false); if (project.id) onDelete(project.id); }} className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-red-400 hover:bg-white/[0.055]"><Trash2 className="size-3.5" />Delete permanently</button>
                </div>
              ) : null}
            </div>
            <button onClick={onClose} className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground" aria-label="Close project detail"><X className="size-4" /></button>
          </div>
        </div>

        <div className="px-5 py-5">
          <div className="flex items-start gap-3">
            <label className={cn("relative group", isEditing ? "cursor-pointer" : "")}>
              <span className={cn("grid size-14 shrink-0 place-items-center rounded-2xl bg-cover bg-center text-lg font-bold shadow-sm", project.logoClass)} style={editLogoPreview ? { backgroundImage: `url("${editLogoPreview}")` } : project.logoUrl ? { backgroundImage: `url("${project.logoUrl}")` } : undefined}>
                {(editLogoPreview || project.logoUrl) ? null : project.mark}
              </span>
              {isEditing ? (
                <>
                  <input type="file" accept="image/*" className="sr-only" disabled={isUploadingLogo} onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    event.target.value = "";
                    queueLogoFile(file);
                  }} />
                  <span className="absolute inset-0 hidden size-14 place-items-center rounded-2xl bg-black/55 text-center text-[10px] leading-tight group-hover:grid">
                    <Upload className="size-3.5" />
                    {isUploadingLogo ? "..." : "Ctrl+V"}
                  </span>
                  {isUploadingLogo ? (
                    <span className="mt-1 block text-[10px] font-medium text-muted-foreground">Uploading logo...</span>
                  ) : null}
                </>
              ) : null}
            </label>
            <div className="min-w-0 flex-1">
              {isEditing ? (
                <input
                  value={editName}
                  onChange={(event) => setEditName(event.target.value)}
                  className="w-full rounded-lg border border-white/[0.08] bg-[#161618] px-2 py-1 text-2xl font-semibold tracking-[-0.03em] outline-none"
                />
              ) : (
                <h3 className="truncate text-2xl font-semibold tracking-[-0.03em]">{project.name}</h3>
              )}
              <p className="mt-1 text-xs text-muted-foreground">{isEditing ? `${editHunt} · ${editStage}` : `${project.hunt} · ${project.stage}`}</p>
            </div>
          </div>

          <section className="mt-6 border-t border-white/[0.045] pt-4">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">Properties</h4>
              {isEditing ? (
                <div className="flex items-center gap-1.5">
                  <button onClick={cancelEdit} className="rounded-md px-2 py-0.5 text-[11px] text-muted-foreground hover:text-foreground">Cancel</button>
                  <button onClick={saveEdit} disabled={isSaving || isUploadingLogo} className="rounded-md bg-accent px-2 py-0.5 text-[11px] font-medium text-foreground hover:bg-white/[0.09] disabled:opacity-50">{isSaving ? "Saving..." : "Save"}</button>
                </div>
              ) : (
                <button onClick={enterEdit} className="rounded-md px-2 py-0.5 text-[11px] text-muted-foreground hover:text-foreground">Edit</button>
              )}
            </div>
            <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
              {isEditing ? (
                <>
                  <Property label="Hunt type">
                    <select value={editHunt} onChange={(e) => setEditHunt(e.target.value)} className="h-8 w-full rounded-lg border border-white/[0.08] bg-[#161618] px-2 text-xs text-foreground outline-none">
                      {["Free Hunts", "Retro", "NFT", "Waitlist"].map((value) => <option key={value} value={value}>{value}</option>)}
                    </select>
                  </Property>
                  <Property label="Status">
                    <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)} className="h-8 w-full rounded-lg border border-white/[0.08] bg-[#161618] px-2 text-xs text-foreground outline-none">
                      {["Watching", "In progress", "Running", "Paused", "Done", "Dropped"].map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </Property>
                  <Property label="Stage / result">
                    <div className="grid w-full gap-1.5">
                      <select value={STAGE_PRESETS.includes(editStage as (typeof STAGE_PRESETS)[number]) ? editStage : "__custom__"} onChange={(e) => {
                        if (e.target.value === "__custom__") {
                          if (STAGE_PRESETS.includes(editStage as (typeof STAGE_PRESETS)[number])) setEditStage("");
                          return;
                        }
                        setEditStage(e.target.value);
                      }} className="h-8 w-full rounded-lg border border-white/[0.08] bg-[#161618] px-2 text-xs text-foreground outline-none">
                        {STAGE_PRESETS.map((value) => (
                          <option key={value} value={value}>{value}</option>
                        ))}
                        <option value="__custom__">Custom...</option>
                      </select>
                      {!STAGE_PRESETS.includes(editStage as (typeof STAGE_PRESETS)[number]) ? (
                        <input
                          value={editStage}
                          onChange={(e) => setEditStage(e.target.value)}
                          className="h-8 w-full rounded-lg border border-white/[0.08] bg-[#161618] px-2 text-xs text-foreground outline-none"
                          placeholder="Custom stage / result"
                        />
                      ) : null}
                    </div>
                  </Property>
                  <Property label="Priority">
                    <select value={editPriority} onChange={(e) => setEditPriority(e.target.value)} className="h-8 w-full rounded-lg border border-white/[0.08] bg-[#161618] px-2 text-xs text-foreground outline-none">
                      {["High", "Medium", "Low"].map((value) => <option key={value} value={value}>{value}</option>)}
                    </select>
                  </Property>
                  <Property label="Completion">
                    <div className="flex items-center gap-2">
                      <input type="number" min={0} max={100} value={editProgress} onChange={(e) => setEditProgress(Number(e.target.value))} className="h-8 w-16 rounded-lg border border-white/[0.08] bg-[#161618] px-2 text-xs text-foreground outline-none" />
                      <span className="text-xs text-muted-foreground">%</span>
                    </div>
                  </Property>
                  <Property label="Date start">
                    <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} className="h-8 w-full rounded-lg border border-white/[0.08] bg-[#161618] px-2 text-xs text-foreground outline-none" />
                  </Property>
                  <Property label="Project URL">
                    <input type="url" value={editWebsiteUrl} onChange={(e) => setEditWebsiteUrl(e.target.value)} className="h-8 w-full rounded-lg border border-white/[0.08] bg-[#161618] px-2 text-xs text-foreground outline-none" placeholder="https://..." />
                  </Property>
                </>
              ) : (
                <>
                  <Property label="Status"><Badge variant={statusVariant(project.status)}>{project.status}</Badge></Property>
                  <Property label="Stage / result"><span>{project.stage}</span></Property>
                  <Property label="Priority"><Priority value={project.priority} /></Property>
                  <Property label="Completion"><Progress value={project.progress} /></Property>
                  <Property label="Date start"><span>{project.date}</span></Property>
                </>
              )}
            </div>
            {saveError ? <p className="mt-3 text-xs text-danger">{saveError}</p> : null}
          </section>

          <section className="mt-4 grid gap-3">
            {isEditing ? (
              <>
                <ComboboxPreview
                  label="Work type"
                  values={editWorkTypes}
                  options={[...new Set(["Testnet", "Node", "CLI running", "Farm role", "Galxe", "Whitelist", "Proof submit", ...editWorkTypes])]}
                  placeholder="Add work type..."
                  onChange={setEditWorkTypes}
                />
                <ComboboxPreview
                  label="Project type"
                  values={editProjectTypes}
                  options={[...new Set(["ZK", "AI", "DePIN", "L1", "L2", "Security", "Data", ...editProjectTypes])]}
                  placeholder="Add project type..."
                  onChange={setEditProjectTypes}
                />
                <div className="border-t border-white/[0.04] pt-3">
                  <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Accounts</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {accountOptions.map((account) => (
                      <TogglePill
                        key={account.id}
                        label={account.label}
                        active={editAccountIds.includes(account.id)}
                        onClick={() => toggleEditAccount(account.id)}
                      />
                    ))}
                    {accountOptions.length === 0 ? (
                      <span className="text-[11px] text-muted-foreground">Add an account first to assign this project.</span>
                    ) : null}
                  </div>
                </div>
              </>
            ) : (
              <>
                <PropertyBlock label="Work Type"><Tags tags={project.work} strong max={4} /></PropertyBlock>
                <PropertyBlock label="Project Type"><Tags tags={project.type} max={4} /></PropertyBlock>
                <PropertyBlock label="Accounts">
                  {project.accounts.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {project.accounts.map((account) => (
                        <span key={account} className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.045] px-2 py-1 text-xs text-muted-foreground">
                          <span className="grid size-5 place-items-center rounded-full bg-background text-[10px] font-semibold">{account[0]}</span>
                          {account}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[11px] text-muted-foreground/60">Unassigned</span>
                  )}
                </PropertyBlock>
              </>
            )}
          </section>

          <section className="mt-5">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold">Links</h4>
              {!isEditing ? <button type="button" onClick={enterEdit} className="text-[11px] text-muted-foreground hover:text-foreground">Edit links</button> : null}
            </div>
            <div className="mt-2 grid gap-2">
              {project.websiteUrl ? <DetailLink label="Website" value={project.websiteUrl} href={project.websiteUrl} external /> : <p className="text-[11px] text-muted-foreground">No project URL added.</p>}
              <DetailLink label="Docs" value="Open linked project docs" href={"/docs?project=" + (project.id ?? "")} />
            </div>
          </section>

          <section className="mt-5">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold">Short note</h4>
              <Link href={"/docs?project=" + (project.id ?? "")} className="text-[11px] text-muted-foreground hover:text-foreground">Open Docs</Link>
            </div>
            {isEditing ? (
              <textarea value={editNotes} onChange={(event) => setEditNotes(event.target.value)} className="mt-2 min-h-28 w-full resize-y rounded-xl border border-white/[0.08] bg-[#161618] p-3 text-xs text-foreground outline-none" placeholder="Short project note, result, setup, or reminder..." />
            ) : (
              <div className="mt-2 rounded-xl bg-white/[0.025] p-3 text-xs leading-5 text-muted-foreground">{project.notes || "No short note added."}</div>
            )}
          </section>

          <section className="mt-5">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold">Tasks</h4>
              <Link href={"/tasks?project=" + encodeURIComponent(project.name)} className="text-[11px] text-muted-foreground hover:text-foreground">Open Tasks</Link>
            </div>
            <p className="mt-2 rounded-xl bg-white/[0.025] p-3 text-xs text-muted-foreground">Manage tasks for this project from the Tasks workspace.</p>
          </section>
        </div>
      </aside>
    </div>
  );
}

function Property({ label, children }: { label: string; children: ReactNode }) {
  return <div><p className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">{label}</p><div className="mt-1 flex min-h-[22px] items-center text-xs text-foreground">{children}</div></div>;
}

function PropertyBlock({ label, children }: { label: string; children: ReactNode }) {
  return <div className="border-t border-white/[0.04] pt-3"><p className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">{label}</p><div className="mt-1 flex min-h-[22px] items-center text-xs text-foreground">{children}</div></div>;
}

function DetailLink({ label, value, href, external = false }: { label: string; value: string; href: string; external?: boolean }) {
  return <a href={href} target={external ? "_blank" : undefined} rel={external ? "noreferrer" : undefined} className="flex items-center justify-between rounded-lg border border-white/[0.055] bg-muted/20 px-3 py-2 text-xs text-muted-foreground hover:bg-accent/40 hover:text-foreground"><span><span className="text-foreground">{label}</span> · {value}</span><ExternalLink className="size-3.5" /></a>;
}

function AddProjectDialog({
  open,
  onClose,
  onCreate,
  accountOptions,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (project: Project, accountIds: string[], context?: { logoFile?: File | null }) => Promise<void>;
  accountOptions: ProjectAccountOption[];
}) {
  const [openSelect, setOpenSelect] = useState<string | null>(null);
  const [showOptionalContext, setShowOptionalContext] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [hunt, setHunt] = useState("Free Hunts");
  const [stage, setStage] = useState("Not applicable");
  const [status, setStatus] = useState("Watching");
  const [priority, setPriority] = useState("Medium");
  const [assignedAccountIds, setAssignedAccountIds] = useState<string[]>(() => accountOptions[0] ? [accountOptions[0].id] : []);
  const [dateStart, setDateStart] = useState(getTodayDateValue);
  const [workTypes, setWorkTypes] = useState<string[]>(["Testnet"]);
  const [projectTypes, setProjectTypes] = useState<string[]>([]);
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  if (!open) return null;

  const canCreate = projectName.trim().length > 0 && !isSubmitting;

  function resetForm() {
    setProjectName("");
    setHunt("Free Hunts");
    setStage("Not applicable");
    setStatus("Watching");
    setPriority("Medium");
    setAssignedAccountIds(accountOptions[0] ? [accountOptions[0].id] : []);
    setDateStart(getTodayDateValue());
    setWorkTypes(["Testnet"]);
    setProjectTypes([]);
    setWebsiteUrl("");
    setNotes("");
    setLogoFile(null);
    setLogoPreview("");
    setFormError("");
    setShowOptionalContext(false);
    setOpenSelect(null);
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  async function handleCreate() {
    const name = projectName.trim();
    if (!name || isSubmitting) return;

    const mark = name.slice(0, 1).toUpperCase();
    const accounts = accountOptions
      .filter((account) => assignedAccountIds.includes(account.id))
      .map((account) => account.label);

    setIsSubmitting(true);
    setFormError("");
    try {
      await onCreate({
        name,
        mark,
        logoClass: "bg-white/[0.065] text-[#c4cad3]",
        status,
        priority,
        hunt,
        stage,
        work: workTypes,
        type: projectTypes,
        accounts,
        progress: 0,
        date: dateStart ? formatDateValue(dateStart) : "",
        dateValue: dateStart,
        activity: "now",
        websiteUrl: normalizeUrl(websiteUrl) || undefined,
        notes: notes.trim() || undefined,
        logoUrl: logoPreview || undefined,
      }, assignedAccountIds, { logoFile });
      resetForm();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Unable to create project");
    } finally {
      setIsSubmitting(false);
    }
  }

  function toggleAccount(id: string) {
    setAssignedAccountIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  return (
    <div className="modal-backdrop-in fixed inset-0 z-50 grid place-items-center bg-black/45 px-4 backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-labelledby="add-project-title">
      <div className="modal-card-in soft-panel w-full max-w-[680px] overflow-visible rounded-2xl border border-white/[0.065] bg-card shadow-2xl shadow-black/45" onPaste={(event) => {
        const target = event.target as HTMLElement;
        if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) return;
        const items = event.clipboardData.items;
        for (const item of items) {
          if (item.type.startsWith("image/")) {
            event.preventDefault();
            const file = item.getAsFile();
            if (!file) return;
            setLogoFile(file);
            const reader = new FileReader();
            reader.onload = () => setLogoPreview(typeof reader.result === "string" ? reader.result : "");
            reader.readAsDataURL(file);
            return;
          }
        }
      }}>
        <div className="flex items-start justify-between gap-4 px-4 py-3.5">
          <div className="min-w-0">
            <h2 id="add-project-title" className="text-base font-semibold tracking-[-0.02em]">Add project</h2>
          </div>
          <button onClick={handleClose} className="grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-white/[0.045] hover:text-foreground" aria-label="Close add project"><X className="size-4" /></button>
        </div>

        <div className="px-4 pb-4">
          <div className="grid gap-3 px-2 pb-2 pt-0.5 md:grid-cols-[46px_minmax(0,1fr)_92px] md:items-end">
            <label className="block cursor-pointer">
              <span className="block w-10 text-center text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Logo</span>
              <input type="file" accept="image/*" className="sr-only" onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                setLogoFile(file);
                if (!file) { setLogoPreview(""); return; }
                const reader = new FileReader();
                reader.onload = () => setLogoPreview(typeof reader.result === "string" ? reader.result : "");
                reader.readAsDataURL(file);
              }} />
              <span className="group relative mt-1.5 grid size-10 place-items-center overflow-hidden rounded-lg border border-white/[0.055] bg-white/[0.035] text-sm font-semibold text-muted-foreground hover:bg-white/[0.055] hover:text-foreground" title="Upload or Ctrl+V paste logo">
                {/* eslint-disable-next-line @next/next/no-img-element -- blob preview, not a remote image */}
                {logoPreview ? <img src={logoPreview} alt="" className="size-full object-cover" /> : projectName.trim().slice(0, 1).toUpperCase() || "P"}
                <span className="absolute inset-0 hidden place-items-center bg-black/55 text-center text-[9px] leading-tight group-hover:grid">Drop or<br />Ctrl+V</span>
              </span>
            </label>
            <label className="min-w-0">
              <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Project name</span>
              <input
                autoFocus
                value={projectName}
                onChange={(event) => setProjectName(event.target.value)}
                className="mt-1.5 h-10 w-full soft-inset rounded-lg border border-white/[0.055] bg-input px-3 text-sm font-semibold outline-none placeholder:text-muted-foreground focus:border-ring"
                placeholder="Soundness, NexusHQ, Linera..."
              />
            </label>
            <label className="block">
              <span className="block text-center text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Date</span>
              <DatePreview value={dateStart} onChange={setDateStart} />
            </label>
          </div>

          <div className="px-2 py-2">
            <div className="grid grid-cols-2 gap-1.5 md:grid-cols-4">
              <SelectPreview id="hunt" label="Hunt type" value={hunt} options={["Free Hunts", "Retro", "NFT", "Waitlist"]} openSelect={openSelect} setOpenSelect={setOpenSelect} onChange={(nextHunt) => { setHunt(nextHunt); setStage(nextHunt === "Waitlist" || nextHunt === "NFT" ? "Watching" : "Not applicable"); }} compact />
              <SelectPreview id="stage" label="Stage" value={stage} options={[...STAGE_PRESETS]} openSelect={openSelect} setOpenSelect={setOpenSelect} onChange={setStage} compact allowCustom />
              <SelectPreview id="status" label="Status" value={status} options={["Watching", "In progress", "Running", "Paused", "Done", "Dropped"]} openSelect={openSelect} setOpenSelect={setOpenSelect} onChange={setStatus} compact />
              <SelectPreview id="priority" label="Priority" value={priority} options={["High", "Medium", "Low"]} openSelect={openSelect} setOpenSelect={setOpenSelect} onChange={setPriority} compact />
            </div>
          </div>

          <div className="mt-2 px-2 pb-2">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold">Assigned accounts</p>
              <span className="text-[11px] text-muted-foreground">wallets come from selected accounts</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {accountOptions.map((account) => (
                <TogglePill key={account.id} label={account.label} active={assignedAccountIds.includes(account.id)} onClick={() => toggleAccount(account.id)} />
              ))}
              {accountOptions.length === 0 ? <span className="text-[11px] text-muted-foreground">Add an account first to assign this project.</span> : null}
            </div>
          </div>

          <div className="mt-4 border-t soft-divider px-2 pt-3">
            <div className="mb-2">
              <button
                type="button"
                onClick={() => setShowOptionalContext((value) => !value)}
                className="flex items-center gap-1.5 text-xs font-semibold text-foreground"
                aria-expanded={showOptionalContext}
              >
                Optional context
                <ChevronDown className={cn("size-3.5 text-muted-foreground transition-transform", showOptionalContext ? "rotate-180" : "")} />
              </button>
            </div>
            {showOptionalContext ? (
              <>
                <div className="grid gap-3 md:grid-cols-3">
                  <Field label="Project URL" placeholder="https://..." value={websiteUrl} onChange={setWebsiteUrl} />
                  <ComboboxPreview id="work-type" label="Work type" values={workTypes} options={["Testnet", "Node", "CLI running", "Farm role", "Galxe", "Whitelist", "Proof submit"]} placeholder="Add work type..." onChange={setWorkTypes} open={openSelect === "work-type"} onOpenChange={(nextOpen) => setOpenSelect(nextOpen ? "work-type" : null)} menuPlacement="top" />
                  <ComboboxPreview id="project-type" label="Project type" values={projectTypes} options={["ZK", "AI", "DePIN", "L1", "L2", "Security", "Data"]} placeholder="Add project type..." onChange={setProjectTypes} open={openSelect === "project-type"} onOpenChange={(nextOpen) => setOpenSelect(nextOpen ? "project-type" : null)} menuPlacement="top" />
                </div>
                <label className="mt-3 block">
                  <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Short note</span>
                  <textarea value={notes} onChange={(event) => setNotes(event.target.value)} className="mt-1.5 min-h-12 w-full resize-none soft-inset rounded-lg border border-white/[0.055] bg-input px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-ring" placeholder="Result, deadline, setup, wallet plan, or proof..." />
                </label>
              </>
            ) : null}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t soft-divider bg-muted/20 px-4 py-2.5">
          {formError ? <p className="min-w-0 text-xs text-danger">{formError}</p> : <span />}
          <div className="flex shrink-0 gap-2">
            <Button variant="secondary" size="sm" onClick={handleClose} disabled={isSubmitting}>Cancel</Button>
            <Button size="sm" className="bg-accent text-foreground hover:bg-white/[0.09]" disabled={!canCreate} onClick={handleCreate}>{isSubmitting ? "Creating..." : "Create project"}</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatShortDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "2-digit", timeZone: "Asia/Jakarta" }).format(date);
}

function parseDateValue(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return new Date();
  return new Date(year, month - 1, day);
}

function formatDateValue(value: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "2-digit" }).format(parseDateValue(value));
}

function formatCalendarDateValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getTodayDateValue() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function TogglePill({ label, active = false, onClick }: { label: string; active?: boolean; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn("soft-control rounded-full px-3 py-1 text-xs font-medium", active ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground")}
    >
      {label}
    </button>
  );
}

function Field({ label, placeholder, className = "", value, onChange }: { label: string; placeholder: string; className?: string; value?: string; onChange?: (value: string) => void }) {
  return (
    <label className={className}>
      <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">{label}</span>
      <input value={value} onChange={onChange ? (event) => onChange(event.target.value) : undefined} className="mt-1.5 h-9 w-full soft-inset rounded-lg border border-white/[0.055] bg-input px-3 text-sm outline-none placeholder:text-muted-foreground focus:border-ring" placeholder={placeholder} />
    </label>
  );
}

function SelectPreview({
  id,
  label,
  value,
  options,
  openSelect,
  setOpenSelect,
  onChange,
  compact = false,
  allowCustom = false,
}: {
  id: string;
  label: string;
  value: string;
  options: string[];
  openSelect: string | null;
  setOpenSelect: (value: string | null) => void;
  onChange?: (value: string) => void;
  compact?: boolean;
  allowCustom?: boolean;
}) {
  const [items, setItems] = useState(options);
  const [customValue, setCustomValue] = useState("");
  const [menuRect, setMenuRect] = useState<{ top: number; left: number; width: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const open = openSelect === id;
  const normalizedCustomValue = customValue.trim();
  const canAddCustom = allowCustom && normalizedCustomValue.length > 0 && !items.some((item) => item.toLowerCase() === normalizedCustomValue.toLowerCase());

  useEffect(() => {
    if (!open || !buttonRef.current) {
      setMenuRect(null);
      return;
    }
    function updateRect() {
      if (!buttonRef.current) return;
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuRect({ top: rect.bottom + 6, left: rect.left, width: compact ? Math.max(rect.width, 224) : rect.width });
    }
    updateRect();
    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect, true);
    return () => {
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect, true);
    };
  }, [open, compact]);

  function selectValue(next: string) {
    onChange?.(next);
    setOpenSelect(null);
  }

  const addCustomValue = () => {
    if (!canAddCustom) return;
    setItems((current) => [...current, normalizedCustomValue]);
    selectValue(normalizedCustomValue);
    setCustomValue("");
  };

  const menu = open && menuRect && typeof document !== "undefined"
    ? createPortal(
        <div
          className="fixed z-[120] max-h-48 overflow-y-auto rounded-xl border border-white/[0.075] bg-[#18181a]/[0.98] p-1 shadow-2xl shadow-black/45 backdrop-blur"
          style={{ top: menuRect.top, left: menuRect.left, width: menuRect.width }}
        >
          <div className="px-2 py-1 text-[10px] text-muted-foreground">Change {label.toLowerCase()}...</div>
          {allowCustom ? (
            <div className="mb-1 flex items-center gap-1 rounded-lg bg-white/[0.025] p-1">
              <input
                value={customValue}
                onChange={(event) => setCustomValue(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addCustomValue();
                  }
                }}
                className="min-w-0 flex-1 bg-transparent px-2 text-xs outline-none placeholder:text-muted-foreground"
                placeholder={`Add custom ${label.toLowerCase()}...`}
              />
              <button
                type="button"
                onClick={addCustomValue}
                disabled={!canAddCustom}
                className="grid size-6 place-items-center rounded-md text-muted-foreground hover:bg-white/[0.055] hover:text-foreground disabled:opacity-35"
                aria-label={`Add custom ${label.toLowerCase()}`}
              >
                <Plus className="size-3.5" />
              </button>
            </div>
          ) : null}
          {items.map((option, index) => (
            <button
              key={option}
              type="button"
              onClick={() => selectValue(option)}
              className={cn(
                "flex h-7 w-full items-center gap-2 rounded-lg px-2 text-left text-xs transition-colors hover:bg-white/[0.055]",
                value === option ? "text-foreground" : "text-[#c3c7ce]",
              )}
            >
              <SelectGlyph label={label} value={option} muted={value !== option} />
              <span className="min-w-0 flex-1 truncate font-medium">{option}</span>
              {label === "Priority" ? <span className="text-xs tabular-nums text-muted-foreground">{index}</span> : null}
              {value === option ? <Check className="size-4 text-muted-foreground" /> : null}
            </button>
          ))}
        </div>,
        document.body,
      )
    : null;

  return (
    <div className="relative">
      <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">{label}</span>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpenSelect(open ? null : id)}
        className={cn(
          "mt-1.5 flex items-center justify-between gap-2 rounded-full border border-white/[0.055] bg-white/[0.035] text-sm outline-none transition-colors hover:bg-white/[0.055]",
          compact ? "h-8 w-full px-2.5 text-xs" : "h-9 w-full px-3",
          open ? "border-white/[0.12] bg-white/[0.055]" : "",
        )}
        aria-expanded={open}
      >
        <span className="flex min-w-0 items-center gap-2">
          <SelectGlyph label={label} value={value} />
          <span className="truncate font-medium">{value}</span>
        </span>
        <ChevronDown className={cn("size-3.5 shrink-0 text-muted-foreground transition-transform", open ? "rotate-180" : "")} />
      </button>
      {menu}
    </div>
  );
}

function ComboboxPreview({
  id,
  label,
  values,
  options,
  placeholder,
  onChange,
  open: controlledOpen,
  onOpenChange,
  menuPlacement = "bottom",
}: {
  id?: string;
  label: string;
  values: string[];
  options: string[];
  placeholder: string;
  onChange: (values: string[]) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  menuPlacement?: "top" | "bottom";
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const [items, setItems] = useState(options);
  const [customValue, setCustomValue] = useState("");
  const [menuRect, setMenuRect] = useState<{ top: number; left: number; width: number; placeTop: boolean } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const normalizedCustomValue = customValue.trim();
  const canAddCustom = normalizedCustomValue.length > 0 && !items.some((item) => item.toLowerCase() === normalizedCustomValue.toLowerCase());

  useEffect(() => {
    if (!open || !buttonRef.current) {
      setMenuRect(null);
      return;
    }
    function updateRect() {
      if (!buttonRef.current) return;
      const rect = buttonRef.current.getBoundingClientRect();
      const placeTop = menuPlacement === "top";
      setMenuRect({
        top: placeTop ? rect.top - 6 : rect.bottom + 6,
        left: rect.left,
        width: rect.width,
        placeTop,
      });
    }
    updateRect();
    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect, true);
    return () => {
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect, true);
    };
  }, [open, menuPlacement]);

  function setOpen(nextOpen: boolean) {
    if (controlledOpen === undefined) setInternalOpen(nextOpen);
    onOpenChange?.(nextOpen);
  }

  function toggleValue(next: string) {
    onChange(values.includes(next) ? values.filter((value) => value !== next) : [...values, next]);
  }

  function addCustomValue() {
    if (!canAddCustom) return;
    setItems((current) => [...current, normalizedCustomValue]);
    onChange([...values, normalizedCustomValue]);
    setCustomValue("");
  }

  const menu = open && menuRect && typeof document !== "undefined"
    ? createPortal(
        <div
          className="fixed z-[120] max-h-48 overflow-y-auto rounded-xl border border-white/[0.075] bg-[#18181a]/[0.98] p-1 shadow-2xl shadow-black/45 backdrop-blur"
          style={{
            left: menuRect.left,
            width: menuRect.width,
            ...(menuRect.placeTop
              ? { bottom: window.innerHeight - menuRect.top, top: "auto" as const }
              : { top: menuRect.top }),
          }}
        >
          <div className="mb-1 flex items-center gap-1 rounded-lg bg-white/[0.025] p-1">
            <input
              value={customValue}
              onChange={(event) => setCustomValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addCustomValue();
                }
              }}
              className="min-w-0 flex-1 bg-transparent px-2 text-xs outline-none placeholder:text-muted-foreground"
              placeholder={placeholder}
            />
            <button
              type="button"
              onClick={addCustomValue}
              disabled={!canAddCustom}
              className="grid size-6 place-items-center rounded-md text-muted-foreground hover:bg-white/[0.055] hover:text-foreground disabled:opacity-35"
              aria-label={"Add custom " + label.toLowerCase()}
            >
              <Plus className="size-3.5" />
            </button>
          </div>
          {items.map((option) => {
            const selected = values.includes(option);
            return (
              <button
                key={option}
                type="button"
                onClick={() => toggleValue(option)}
                className={cn(
                  "flex h-7 w-full items-center justify-between gap-2 rounded-lg px-2 text-left text-xs transition-colors hover:bg-white/[0.055]",
                  selected ? "text-foreground" : "text-[#c3c7ce]",
                )}
              >
                <span className="min-w-0 truncate font-medium">{option}</span>
                {selected ? <Check className="size-4 text-muted-foreground" /> : null}
              </button>
            );
          })}
        </div>,
        document.body,
      )
    : null;

  return (
    <div className="relative">
      <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">{label}</span>
      <button
        ref={buttonRef}
        id={id}
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "mt-1.5 flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-white/[0.055] bg-input px-3 text-left text-sm outline-none transition-colors hover:bg-white/[0.045]",
          open ? "border-white/[0.12] bg-white/[0.045]" : "",
        )}
      >
        <span className="min-w-0 truncate text-muted-foreground">{values.length > 0 ? values.join(", ") : placeholder}</span>
        <ChevronDown className={cn("size-3.5 shrink-0 text-muted-foreground transition-transform", open ? "rotate-180" : "")} />
      </button>
      {menu}
    </div>
  );
}

function DatePreview({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [visibleMonth, setVisibleMonth] = useState(() => parseDateValue(value));
  const [open, setOpen] = useState(false);
  const days = getCalendarDays(visibleMonth);
  const todayValue = getTodayDateValue();

  return (
    <div className="relative mt-1.5">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={cn(
          "flex h-10 w-full items-center justify-center gap-1.5 rounded-lg border border-white/[0.055] bg-white/[0.035] px-2 text-xs text-muted-foreground hover:bg-white/[0.055] hover:text-foreground",
          open ? "border-white/[0.12] bg-white/[0.055]" : "",
        )}
        title="Date added"
      >
        <CalendarClock className="size-3" />
        <span className="font-medium tabular-nums">{value ? formatDateValue(value) : "Add date"}</span>
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-[90] mt-1.5 w-[252px] overflow-hidden rounded-xl border border-white/[0.075] bg-[#18181a]/[0.98] p-2 text-left shadow-2xl shadow-black/45 backdrop-blur">
          <div className="flex items-center justify-between gap-2 px-1 pb-2">
            <button type="button" onClick={() => setVisibleMonth(addMonths(visibleMonth, -1))} className="grid size-7 place-items-center rounded-lg text-muted-foreground hover:bg-white/[0.055] hover:text-foreground" aria-label="Previous month">‹</button>
            <div className="text-xs font-semibold text-foreground">{formatMonthLabel(visibleMonth)}</div>
            <button type="button" onClick={() => setVisibleMonth(addMonths(visibleMonth, 1))} className="grid size-7 place-items-center rounded-lg text-muted-foreground hover:bg-white/[0.055] hover:text-foreground" aria-label="Next month">›</button>
          </div>

          <div className="grid grid-cols-7 gap-1 px-1 pb-1 text-center text-[10px] font-medium text-muted-foreground">
            {weekDays.map((day) => <span key={day}>{day}</span>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((day) => {
              const dateValue = formatCalendarDateValue(day.date);
              const selected = value === dateValue;
              const isToday = todayValue === dateValue;
              return (
                <button
                  key={day.key}
                  type="button"
                  onClick={() => {
                    onChange(dateValue);
                    setOpen(false);
                  }}
                  className={cn(
                    "grid size-7 place-items-center rounded-lg text-[11px] font-medium transition-colors",
                    day.inMonth ? "text-foreground hover:bg-white/[0.065]" : "text-muted-foreground/45 hover:bg-white/[0.04]",
                    selected ? "bg-white/[0.12] text-foreground shadow-[inset_0_0_0_1px_rgb(255_255_255/0.08)]" : "",
                    !selected && isToday ? "text-info" : "",
                  )}
                >
                  {day.date.getDate()}
                </button>
              );
            })}
          </div>

          <div className="mt-2 flex items-center justify-between border-t border-white/[0.055] px-1 pt-2">
            <button type="button" onClick={() => onChange("")} className="rounded-lg px-2 py-1 text-[11px] text-muted-foreground hover:bg-white/[0.055] hover:text-foreground">Clear</button>
            <button type="button" onClick={() => { onChange(todayValue); setVisibleMonth(parseDateValue(todayValue)); setOpen(false); }} className="rounded-lg px-2 py-1 text-[11px] font-medium text-foreground hover:bg-white/[0.055]">Today</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

const weekDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function formatMonthLabel(date: Date) {
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(date);
}

function getCalendarDays(monthDate: Date) {
  const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const start = new Date(firstDay);
  start.setDate(firstDay.getDate() - firstDay.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return {
      date,
      key: date.toISOString(),
      inMonth: date.getMonth() === monthDate.getMonth(),
    };
  });
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
  const color = muted ? "text-muted-foreground/45" : "text-foreground";
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
          opacity={bar < activeBars ? 1 : 0}
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
