"use client";

import { Archive, ArrowUpRight, Check, ChevronDown, Columns3, ExternalLink, MoreHorizontal, Plus, Search, SlidersHorizontal, Trash2, Upload, WalletCards, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";

import { Badge } from "@/components/ui/badge";
import { AppDatePicker } from "@/components/ui/app-date-picker";
import { Button } from "@/components/ui/button";
import { AppSelect } from "@/components/ui/app-select";
import { ConfirmDelete } from "@/components/ui/confirm-delete";
import { cn } from "@/lib/utils";
import { useDrawerDismiss } from "@/lib/use-drawer-dismiss";
import { usePresence } from "@/lib/use-presence";
import { normalizeHttpUrl } from "@/lib/url";
import {
  type ProjectAccountOption,
  type ProjectWalletOption,
  type ProjectWithAccounts,
  type ProjectsWorkspaceData,
} from "@/features/projects/actions";
import { useProjectsMutations, useProjectsWorkspace } from "@/features/projects/projects-query";
import type { ProjectAssignmentInput, ProjectWalletDraft } from "@/features/projects/project-schema";
import type { projects as projectsSchema } from "@/lib/db/schema";
import { ARCHIVE_REASONS, filterAndSortProjects, parseProjectQuery, PROJECT_COLUMNS, PROJECT_PRIORITIES, PROJECT_SORTS, PROJECT_STATUSES, STAGE_PRESETS, type ProjectColumn } from "@/features/projects/project-query";

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
  waitlist: "Waitlist",
};

const reverseHuntLabels: Record<string, string> = {
  "Free Hunts": "free_hunts",
  Retro: "retro",
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
    accountDetails: record.assignedAccounts,
    accountIds: record.assignedAccounts.map((account) => account.id),
    walletDetails: record.assignedWallets,
    walletIds: record.assignedWallets.map((wallet) => wallet.id),
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
    twitterUrl: record.twitterUrl ?? undefined,
    chains: record.chains,
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
  accountDetails?: ProjectAccountOption[];
  accountIds?: string[];
  walletDetails?: ProjectWalletOption[];
  walletIds?: string[];
  progress: number;
  date: string;
  dateValue?: string;
  activity: string;
  logoUrl?: string;
  websiteUrl?: string;
  twitterUrl?: string;
  chains: string[];
  notes?: string;
  updatedAt?: string;
};

export function ProjectsPreview({
  initialData,
  developmentPreview = false,
}: {
  initialData: ProjectsWorkspaceData;
  developmentPreview?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryState = parseProjectQuery(searchParams);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { data: queryData } = useProjectsWorkspace(initialData, developmentPreview);
  const workspace = queryData ?? initialData;
  const mutations = useProjectsMutations({
    developmentPreview,
    accountOptions: workspace.accountOptions,
    walletOptions: workspace.walletOptions,
    onError: (message) => setError(message),
  });
  const projectItems = useMemo(() => workspace.projects.map(dbToUIProject), [workspace.projects]);
  const selectedProject = useMemo(
    () => projectItems.find((project) => project.id === selectedProjectId) ?? null,
    [projectItems, selectedProjectId],
  );
  const nftCount = workspace.nftCount;
  const availableAccountOptions = workspace.accountOptions;
  const availableWalletOptions = useMemo(() => {
    const byId = new Map(workspace.walletOptions.map((wallet) => [wallet.id, wallet]));
    projectItems.flatMap((project) => project.walletDetails ?? []).forEach((wallet) => byId.set(wallet.id, wallet));
    return [...byId.values()].sort((a, b) => a.label.localeCompare(b.label));
  }, [projectItems, workspace.walletOptions]);
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
    huntKey: (reverseHuntLabels[project.hunt] ?? "free_hunts") as "free_hunts" | "retro" | "waitlist",
  })), [projectItems]);
  const filteredProjects = useMemo(() => filterAndSortProjects(filterable, queryState), [filterable, queryState]);
  const totalPages = Math.max(1, Math.ceil(filteredProjects.length / queryState.pageSize));
  const currentPage = Math.min(queryState.page, totalPages);
  const visibleProjects = filteredProjects.slice((currentPage - 1) * queryState.pageSize, currentPage * queryState.pageSize);
  const counts = { free_hunts: 0, retro: 0, waitlist: 0 };
  for (const project of filterable) counts[project.huntKey] += 1;
  const tabs = [
    { label: `All ${projectItems.length}`, hunt: "" },
    { label: `Free Hunts ${counts.free_hunts}`, hunt: "free_hunts" },
    { label: `Retro ${counts.retro}`, hunt: "retro" },
    { label: `Waitlist ${counts.waitlist}`, hunt: "waitlist" },
  ];
  const visibleColumns = new Set(queryState.columns);
  const stageOptions = [...new Set([...STAGE_PRESETS, ...projectItems.map((project) => project.stage).filter(Boolean)])];

  function activateTab(tab: { hunt: string }) {
    const next = new URLSearchParams(searchParams.toString());
    next.delete("view");
    next.delete("hunt");
    next.delete("page");
    if (tab.hunt) next.set("hunt", tab.hunt);
    router.replace("/projects" + (next.size ? "?" + next.toString() : ""), { scroll: false });
  }

  async function handleCreateProject(project: Project, assignments: ProjectAssignmentInput, context?: { logoFile?: File | null }) {
    const hasFileUpload = Boolean(context?.logoFile);
    const externalLogoUrl = hasFileUpload || (project.logoUrl?.startsWith("blob:") || project.logoUrl?.startsWith("data:")) ? undefined : project.logoUrl;
    await mutations.createProjectMutation.mutateAsync({
      data: {
        name: project.name,
        huntType: (reverseHuntLabels[project.hunt] ?? "free_hunts") as typeof projectsSchema.$inferInsert.huntType,
        status: (reverseStatusLabels[project.status] ?? "watching") as typeof projectsSchema.$inferInsert.status,
        priority: (reversePriorityLabels[project.priority] ?? "medium") as typeof projectsSchema.$inferInsert.priority,
        workTypes: project.work,
        projectTypes: project.type,
        stageResult: project.stage,
        dateStart: project.dateValue || undefined,
        websiteUrl: project.websiteUrl ? normalizeHttpUrl(project.websiteUrl) : undefined,
        twitterUrl: project.twitterUrl ? normalizeHttpUrl(project.twitterUrl) : undefined,
        chains: project.chains,
        notes: project.notes || undefined,
        logoUrl: externalLogoUrl,
        logoSource: externalLogoUrl ? "external_url" : "none",
      },
      assignments,
      logoFile: context?.logoFile ?? null,
    });
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
    try {
      await mutations.archiveProjectMutation.mutateAsync({ id, reason });
    } catch {
      // Error is surfaced through the mutation onError handler; keep the
      // drawer open so the user can retry.
      return;
    }
    setSelectedProjectId(null);
  }

  async function handleDeleteProject(id: string) {
    try {
      await mutations.deleteProjectMutation.mutateAsync(id);
    } catch {
      // Error is surfaced through the mutation onError handler; keep the
      // drawer open so the user can retry.
      return;
    }
    setSelectedProjectId(null);
  }

  async function handleUpdateProject(id: string, data: Partial<Omit<typeof projectsSchema.$inferInsert, "workspaceId">>, assignments?: ProjectAssignmentInput) {
    await mutations.updateProjectMutation.mutateAsync({ id, data, assignments });
  }

  async function handleLogoUploaded(id: string, formData: FormData) {
    await mutations.uploadProjectLogoMutation.mutateAsync({ id, formData });
  }

  const columnLabels: Record<ProjectColumn, string> = { status: "Status", priority: "Priority", work: "Work type", type: "Project type", accounts: "Account", completion: "Completion", date: "Date start" };

  return (
    <div className="min-w-0 py-5 lg:py-7">
      <header className="flex flex-col gap-4 border-b soft-divider px-4 pb-5 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-8">
        <h1 className="mt-1 text-2xl font-semibold tracking-[-0.02em]">Projects</h1>
        <Button variant="secondary" size="sm" onClick={() => setIsAddOpen(true)}><Plus />Add project</Button>
      </header>

      {error ? <div role="alert" className="mx-4 mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive sm:mx-6 lg:mx-8">{error}</div> : null}

      <div className="border-b soft-divider px-4 sm:px-6 lg:px-8"><div className="flex items-center gap-2 py-2.5">
        <div className="scrollbar-subtle flex min-w-0 flex-1 gap-1 overflow-x-auto">
        {tabs.map((tab) => {
          const active = queryState.hunt === tab.hunt;
          return <button key={tab.label} type="button" onClick={() => activateTab(tab)} className={cn("shrink-0 rounded-full px-3 py-1.5 text-xs font-medium", active ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground")}>{tab.label}</button>;
        })}
        </div>
        <Link href="/nfts" className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg bg-white/[0.035] px-3 text-xs font-medium text-muted-foreground ring-1 ring-white/[0.055] transition-[background-color,color,transform] duration-150 hover:bg-white/[0.06] hover:text-foreground active:scale-[0.97]" aria-label={"Open NFTs workspace, " + nftCount + " campaigns"}>NFTs <span className="tabular-nums text-foreground">{nftCount}</span><ArrowUpRight className="size-3.5" /></Link>
      </div></div>

      <div className="flex flex-col gap-3 border-b soft-divider px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:px-8">
        <label className="flex h-9 min-w-0 items-center gap-2 rounded-lg border border-white/[0.06] bg-card px-3 lg:w-72"><Search className="size-4 text-muted-foreground" /><input aria-label="Search projects" value={queryState.query} onChange={(event) => updateUrl({ q: event.target.value })} className="min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground" placeholder="Search projects..." /></label>
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <AppSelect
            ariaLabel="Filter by status"
            value={queryState.status}
            options={[{ value: "", label: "All statuses" }, ...PROJECT_STATUSES.map((value) => ({ value, label: statusLabels[value] }))]}
            onChange={(status) => updateUrl({ status })}
            className="w-[138px] shrink-0"
          />
          <AppSelect
            ariaLabel="Filter by stage"
            value={queryState.stage}
            options={[{ value: "", label: "All stages" }, ...stageOptions.map((value) => ({ value, label: value }))]}
            onChange={(stage) => updateUrl({ stage })}
            className="w-[150px] shrink-0"
          />
          <div className="relative"><button type="button" onClick={() => setFiltersOpen((open) => !open)} className="flex h-8 items-center gap-2 rounded-lg border border-white/[0.055] px-3 text-xs text-muted-foreground"><SlidersHorizontal className="size-3.5" />More filters</button>{filtersOpen ? <div className="absolute left-0 top-10 z-40 grid w-64 gap-3 rounded-xl border border-white/[0.08] bg-[#18181a] p-3 shadow-2xl">
            <AppSelect
              label="Priority"
              value={queryState.priority}
              options={[{ value: "", label: "All priorities" }, ...PROJECT_PRIORITIES.map((value) => ({ value, label: priorityLabels[value] }))]}
              onChange={(priority) => updateUrl({ priority })}
            />
            <AppSelect
              label="Account"
              value={queryState.account}
              options={[{ value: "", label: "All accounts" }, ...availableAccountOptions.map((account) => ({ value: account.label, label: account.label }))]}
              onChange={(account) => updateUrl({ account })}
            />
            <div className="grid grid-cols-2 gap-2">
              <AppDatePicker label="From" value={queryState.dateFrom} onChange={(dateFrom) => updateUrl({ dateFrom })} size="xs" />
              <AppDatePicker label="To" value={queryState.dateTo} onChange={(dateTo) => updateUrl({ dateTo })} size="xs" />
            </div>
            <button type="button" onClick={() => updateUrl({ priority: null, account: null, dateFrom: null, dateTo: null })} className="text-left text-xs text-muted-foreground hover:text-foreground">Clear filters</button>
          </div> : null}</div>
          <span className="hidden flex-1 lg:block" />
          <AppSelect
            ariaLabel="Sort projects"
            value={`${queryState.sort}:${queryState.direction}`}
            options={PROJECT_SORTS.flatMap((sort) => ["asc", "desc"].map((direction) => ({
              value: `${sort}:${direction}`,
              label: `${sort} ${direction === "asc" ? "ascending" : "descending"}`,
            })))}
            onChange={(nextSort) => {
              const [sort, direction] = nextSort.split(":");
              updateUrl({ sort, direction });
            }}
            className="w-[190px] shrink-0"
          />
          <div className="relative"><button type="button" onClick={() => setColumnsOpen((open) => !open)} className="grid size-8 place-items-center rounded-lg border border-white/[0.055] text-muted-foreground" aria-label="Choose columns"><Columns3 className="size-3.5" /></button>{columnsOpen ? <div className="absolute right-0 top-10 z-40 w-44 rounded-xl border border-white/[0.08] bg-[#18181a] p-2 shadow-2xl">{PROJECT_COLUMNS.map((column) => <label key={column} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs hover:bg-white/[0.04]"><input type="checkbox" checked={visibleColumns.has(column)} onChange={() => { const next = visibleColumns.has(column) ? queryState.columns.filter((item) => item !== column) : [...queryState.columns, column]; updateUrl({ columns: next.length === PROJECT_COLUMNS.length ? null : next.length === 0 ? "none" : next.join(",") }); }} />{columnLabels[column]}</label>)}</div> : null}</div>
        </div>
      </div>

      <div className="hidden overflow-x-auto lg:block"><table className="w-full min-w-[1120px] table-fixed border-collapse text-left"><colgroup><col className="w-[300px]" />{visibleColumns.has("status") && <col className="w-[115px]" />}{visibleColumns.has("priority") && <col className="w-[110px]" />}{visibleColumns.has("work") && <col className="w-[180px]" />}{visibleColumns.has("type") && <col className="w-[150px]" />}{visibleColumns.has("accounts") && <col className="w-[110px]" />}{visibleColumns.has("completion") && <col className="w-[140px]" />}{visibleColumns.has("date") && <col className="w-[105px]" />}<col className="w-[48px]" /></colgroup>
        <thead className="sticky top-0 z-10 bg-background text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground"><tr><th className="sticky left-0 z-20 border-b border-white/[0.045] bg-background px-4 py-3 lg:px-8">Project</th>{PROJECT_COLUMNS.map((column) => visibleColumns.has(column) ? <th key={column} className="border-b border-white/[0.045] px-3 py-3">{columnLabels[column]}</th> : null)}<th className="border-b border-white/[0.045] px-3 py-3"><span className="sr-only">Actions</span></th></tr></thead>
        <tbody>{visibleProjects.map((project, index) => <ProjectRow key={project.id ?? `${project.name}-${index}`} project={project} visibleColumns={visibleColumns} onOpen={() => setSelectedProjectId(project.id ?? null)} onArchive={handleArchiveProject} onDelete={handleDeleteProject} />)}</tbody>
      </table></div>
      <div className="divide-y divide-white/[0.045] lg:hidden">{visibleProjects.map((project, index) => <ProjectCard key={project.id ?? `${project.name}-${index}`} project={project} onOpen={() => setSelectedProjectId(project.id ?? null)} onArchive={handleArchiveProject} onDelete={handleDeleteProject} />)}</div>
      <div className="flex min-h-12 items-center justify-between px-4 py-3 text-[11px] text-muted-foreground sm:px-6 lg:px-8"><span>Showing {filteredProjects.length} {filteredProjects.length === 1 ? "project" : "projects"}</span><div className="flex items-center gap-2"><AppSelect ariaLabel="Projects per page" value={String(queryState.pageSize)} options={[{ value: "10", label: "10 per page" }, { value: "25", label: "25 per page" }, { value: "50", label: "50 per page" }]} onChange={(pageSize) => updateUrl({ pageSize, page: 1 }, true)} className="w-[120px]" size="xs" /><Button variant="secondary" size="sm" disabled={currentPage <= 1} onClick={() => updateUrl({ page: currentPage - 1 }, true)}>Previous</Button><span>{currentPage} / {totalPages}</span><Button variant="secondary" size="sm" disabled={currentPage >= totalPages} onClick={() => updateUrl({ page: currentPage + 1 }, true)}>Next</Button></div></div>

      <AddProjectDialog open={isAddOpen} onClose={() => setIsAddOpen(false)} onCreate={handleCreateProject} accountOptions={availableAccountOptions} walletOptions={availableWalletOptions} />
      <ProjectDetailPanel project={selectedProject} onClose={() => setSelectedProjectId(null)} onUpdate={handleUpdateProject} onLogoUploaded={handleLogoUploaded} onArchive={handleArchiveProject} onDelete={handleDeleteProject} accountOptions={availableAccountOptions} walletOptions={availableWalletOptions} />
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
    <tr className="row-enter-in group h-[58px] align-middle border-b border-white/[0.035] hover:bg-white/[0.025]">
      <td className="sticky left-0 z-[1] bg-background px-4 group-hover:bg-[#121214] lg:px-8">
        <ProjectIdentity project={project} onOpen={onOpen} />
      </td>
      {visibleColumns.has("status") ? <td className="px-3"><Badge variant={statusVariant(project.status)}>{project.status}</Badge></td> : null}
      {visibleColumns.has("priority") ? <td className="px-3"><Priority value={project.priority} /></td> : null}
      {visibleColumns.has("work") ? <td className="px-3"><Tags tags={project.work} strong max={2} /></td> : null}
      {visibleColumns.has("type") ? <td className="px-3"><Tags tags={project.type} max={2} /></td> : null}
      {visibleColumns.has("accounts") ? <td className="px-3"><AccountAvatarGroup accounts={project.accounts} accountDetails={project.accountDetails} /></td> : null}
      {visibleColumns.has("completion") ? <td className="px-3"><Progress value={project.progress} /></td> : null}
      {visibleColumns.has("date") ? <td className="whitespace-nowrap px-3 text-xs text-foreground">{project.date}</td> : null}
      <td className="px-3">
        <div className="flex justify-end">
          <button ref={menuButtonRef} onClick={(event) => { event.stopPropagation(); toggleMenu(); }} className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-white/[0.045] hover:text-foreground" aria-label={"More options for " + project.name}><MoreHorizontal className="size-4" /></button>
          {menuOpen && typeof document !== "undefined" ? createPortal(
            <div className="fixed z-[100] w-44 rounded-xl border border-white/[0.08] bg-[#18181a]/[0.98] p-1 shadow-2xl shadow-black/45" style={menuPosition} onClick={(event) => event.stopPropagation()}>
              <button onClick={() => { setMenuOpen(false); if (project.id) onArchive(project.id); }} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs text-[#c8cdd5] hover:bg-white/[0.055]"><Archive className="size-3.5" />Archive</button>
              <ConfirmDelete onConfirm={() => { setMenuOpen(false); if (project.id) onDelete(project.id); }} label="Delete permanently"><Trash2 className="size-3.5" /></ConfirmDelete>
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

export function AccountAvatarGroup({
  accounts,
  accountDetails,
  maxVisible = 4,
}: {
  accounts: string[];
  accountDetails?: ProjectAccountOption[];
  maxVisible?: number;
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [overflowOpen, setOverflowOpen] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState({ left: 0, top: 0 });
  const overflowButtonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const assignedAccounts = accountDetails?.length
    ? accountDetails
    : accounts.map((label, index) => ({
        id: `fallback-${label}-${index}`,
        label,
        avatarUrl: null,
      }));

  useEffect(() => {
    if (!overflowOpen) return;

    const focusFrame = window.requestAnimationFrame(() => popoverRef.current?.focus());

    function handlePointerDown(event: PointerEvent) {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (popoverRef.current?.contains(target) || overflowButtonRef.current?.contains(target)) return;
      setOverflowOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setOverflowOpen(false);
      window.requestAnimationFrame(() => overflowButtonRef.current?.focus());
    }

    function handleScroll(event: Event) {
      const target = event.target;
      if (target instanceof Node && popoverRef.current?.contains(target)) return;
      setOverflowOpen(false);
    }

    const closePopover = () => setOverflowOpen(false);
    document.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", closePopover);
    window.addEventListener("scroll", handleScroll, true);

    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", closePopover);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [overflowOpen]);

  if (assignedAccounts.length === 0) {
    return <span className="text-[11px] text-[#8f97a2]">Unassigned</span>;
  }

  const visibleAccounts = assignedAccounts.slice(0, maxVisible);
  const hiddenCount = assignedAccounts.length - visibleAccounts.length;
  const renderedCount = visibleAccounts.length + (hiddenCount > 0 ? 1 : 0);

  function motionStyle(index: number) {
    const distance = activeIndex === null ? 0 : Math.abs(activeIndex - index);
    const shift = activeIndex === null ? 0 : -3 * Math.pow(0.45, distance);
    const scale = activeIndex === index ? 1.04 : 1;

    return {
      transform: `translateY(${shift.toFixed(3)}px) scale(${scale})`,
      transition: `transform ${activeIndex === null ? 180 : 220}ms cubic-bezier(0.22, 1, 0.36, 1)`,
      zIndex: activeIndex === index ? renderedCount + 1 : index + 1,
    };
  }

  function activateAvatar(index: number, pointerType: string) {
    if (pointerType === "mouse" || pointerType === "pen") setActiveIndex(index);
  }

  function toggleOverflow(event: ReactMouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    const popoverWidth = 224;
    const estimatedHeight = Math.min(52 + assignedAccounts.length * 36, 272);
    const viewportPadding = 12;
    const gap = 8;
    const hasRoomBelow = rect.bottom + gap + estimatedHeight <= window.innerHeight - viewportPadding;

    setPopoverPosition({
      left: Math.min(
        Math.max(rect.left, viewportPadding),
        window.innerWidth - popoverWidth - viewportPadding,
      ),
      top: hasRoomBelow
        ? rect.bottom + gap
        : Math.max(viewportPadding, rect.top - estimatedHeight - gap),
    });
    setOverflowOpen((open) => !open);
  }

  return (
    <>
      <div
        className="inline-flex max-w-28 items-center"
        role="group"
        aria-label={`Assigned accounts: ${assignedAccounts.map((account) => account.label).join(", ")}`}
        onPointerLeave={() => setActiveIndex(null)}
      >
        {visibleAccounts.map((account, index) => (
          <span
            key={account.id}
            aria-hidden="true"
            title={account.label}
            data-avatar-source={account.avatarUrl ? "image" : "initial"}
            className="relative -ml-1.5 grid size-6 shrink-0 place-items-center overflow-hidden rounded-full border border-[#101012] bg-[#24262a] bg-cover bg-center text-[9px] font-semibold text-[#c4cad3] shadow-sm first:ml-0 will-change-transform motion-reduce:!transform-none motion-reduce:!transition-none"
            style={{
              ...motionStyle(index),
              backgroundImage: account.avatarUrl
                ? `url(${JSON.stringify(account.avatarUrl)})`
                : undefined,
            }}
            onPointerEnter={(event) => activateAvatar(index, event.pointerType)}
          >
            {account.avatarUrl ? null : account.label.slice(0, 1).toUpperCase()}
          </span>
        ))}
        {hiddenCount > 0 ? (
          <button
            ref={overflowButtonRef}
            type="button"
            aria-label={`View all ${assignedAccounts.length} assigned accounts`}
            aria-haspopup="dialog"
            aria-expanded={overflowOpen}
            title={`View all ${assignedAccounts.length} assigned accounts`}
            className="relative -ml-1.5 grid size-6 shrink-0 place-items-center rounded-full border border-[#101012] bg-[#2b2d31] text-[9px] font-semibold text-[#c4cad3] shadow-sm outline-none will-change-transform hover:bg-[#34373c] focus-visible:ring-2 focus-visible:ring-white/30 motion-reduce:!transform-none motion-reduce:!transition-none"
            style={motionStyle(visibleAccounts.length)}
            onClick={toggleOverflow}
            onPointerEnter={(event) => activateAvatar(visibleAccounts.length, event.pointerType)}
          >
            +{hiddenCount}
          </button>
        ) : null}
      </div>
      {overflowOpen && typeof document !== "undefined"
        ? createPortal(
          <div
            ref={popoverRef}
            role="dialog"
            aria-label="All assigned accounts"
            tabIndex={-1}
            data-account-overflow-popover
            className="fixed z-[100] w-56 origin-top-left rounded-xl border border-white/[0.08] bg-[#18181a]/[0.98] p-2 shadow-2xl shadow-black/45 outline-none"
            style={{ left: popoverPosition.left, top: popoverPosition.top }}
            onClick={(event) => event.stopPropagation()}
          >
            <p className="px-1 pb-1.5 text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Assigned accounts</p>
            <div className="scrollbar-subtle max-h-56 space-y-0.5 overflow-y-auto">
              {assignedAccounts.map((account) => (
                <div key={account.id} className="flex items-center gap-2 rounded-lg px-1.5 py-1.5">
                  <span
                    aria-hidden="true"
                    className="grid size-7 shrink-0 place-items-center overflow-hidden rounded-full border border-white/[0.07] bg-[#24262a] bg-cover bg-center text-[9px] font-semibold text-[#c4cad3]"
                    style={{
                      backgroundImage: account.avatarUrl
                        ? `url(${JSON.stringify(account.avatarUrl)})`
                        : undefined,
                    }}
                  >
                    {account.avatarUrl ? null : account.label.slice(0, 1).toUpperCase()}
                  </span>
                  <span className="min-w-0 truncate text-xs font-medium text-[#d8dce2]">{account.label}</span>
                </div>
              ))}
            </div>
          </div>,
          document.body,
        )
        : null}
    </>
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
    <article className="row-enter-in px-4 py-4 hover:bg-accent/25 sm:px-6">
      <div className="flex items-start justify-between gap-3">
        <ProjectIdentity project={project} onOpen={onOpen} />
        <div className="relative">
          <button onClick={(event) => { event.stopPropagation(); setMenuOpen(!menuOpen); }} aria-label={"More options for " + project.name}><MoreHorizontal className="size-4 text-muted-foreground" /></button>
          {menuOpen ? (
            <div className="absolute right-0 top-8 z-50 w-44 rounded-xl border border-white/[0.08] bg-[#18181a] p-1 shadow-xl">
              <button onClick={(event) => { event.stopPropagation(); setMenuOpen(false); if (project.id) onArchive(project.id); }} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-[#c8cdd5] hover:bg-white/[0.055]"><Archive className="size-3.5" />Archive</button>
              <ConfirmDelete onConfirm={() => { setMenuOpen(false); if (project.id) onDelete(project.id); }} label="Delete permanently"><Trash2 className="size-3.5" /></ConfirmDelete>
            </div>
          ) : null}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2"><Badge variant={statusVariant(project.status)}>{project.status}</Badge><Priority value={project.priority} /><AccountAvatarGroup accounts={project.accounts} accountDetails={project.accountDetails} /></div>
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
  walletOptions,
}: {
  project: Project | null;
  onClose: () => void;
  onUpdate: (
    id: string,
    data: Partial<Omit<typeof projectsSchema.$inferInsert, "workspaceId">>,
    assignments?: ProjectAssignmentInput,
  ) => Promise<void | Project>;
  onLogoUploaded: (id: string, formData: FormData) => Promise<void>;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
  accountOptions: ProjectAccountOption[];
  walletOptions: ProjectWalletOption[];
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
  const [editChains, setEditChains] = useState<string[]>([]);
  const [editAccountIds, setEditAccountIds] = useState<string[]>([]);
  const [editWalletIds, setEditWalletIds] = useState<string[]>([]);
  const [editNewWallets, setEditNewWallets] = useState<ProjectWalletDraft[]>([]);
  const [editWebsiteUrl, setEditWebsiteUrl] = useState("");
  const [editTwitterUrl, setEditTwitterUrl] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [editLogoPreview, setEditLogoPreview] = useState("");
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [openEditSelect, setOpenEditSelect] = useState<string | null>(null);

  const lastProject = useRef<Project | null>(project);
  useEffect(() => {
    if (project) lastProject.current = project;
  }, [project]);
  const { mounted, closing } = usePresence(Boolean(project), 260);
  if (!mounted) return null;
  const pCandidate = project ?? lastProject.current;
  if (!pCandidate) return null;
  const p: Project = pCandidate;

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
    setEditChains(p.chains);
    setEditWebsiteUrl(p.websiteUrl ?? "");
    setEditTwitterUrl(p.twitterUrl ?? "");
    setEditNotes(p.notes ?? "");
    setEditAccountIds(
      p.accountIds
      ?? accountOptions
        .filter((account) => p.accounts.includes(account.label))
        .map((account) => account.id),
    );
    setEditWalletIds(p.walletIds ?? []);
    setEditNewWallets([]);
    setEditLogoPreview("");
    setSaveError("");
    setOpenEditSelect(null);
    setIsEditing(true);
  }

  function cancelEdit() {
    setEditLogoPreview("");
    setOpenEditSelect(null);
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
        chains: editChains,
        websiteUrl: normalizeHttpUrl(editWebsiteUrl) || null,
        twitterUrl: normalizeHttpUrl(editTwitterUrl) || null,
        notes: editNotes || null,
      }, {
        accountIds: editAccountIds,
        walletIds: editWalletIds,
        newWallets: editNewWallets,
      });
      setOpenEditSelect(null);
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
      await onLogoUploaded(p.id, formData);
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
    setEditAccountIds((current) => {
      if (!current.includes(id)) return [...current, id];
      setEditWalletIds((walletIds) => walletIds.filter((walletId) => walletOptions.find((wallet) => wallet.id === walletId)?.ownerAccountId !== id));
      setEditNewWallets((drafts) => drafts.filter((wallet) => wallet.ownerAccountId !== id));
      return current.filter((accountId) => accountId !== id);
    });
  }

  return (
    <div
      className={cn("fixed inset-y-0 right-0 z-50 flex w-full justify-end bg-black/35 backdrop-blur-[2px]", closing ? "drawer-backdrop-out" : "drawer-backdrop-in")}
      role="dialog"
      aria-modal="true"
      aria-labelledby="project-detail-title"
      onClick={onClose}
    >
      <aside
        className={cn("h-full w-full max-w-[520px] overflow-y-auto border-l soft-divider bg-card shadow-2xl shadow-black/50 scrollbar-subtle", closing ? "drawer-panel-out" : "drawer-panel-in")}
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
            <h2 id="project-detail-title" className="truncate text-base font-semibold">{p.name}</h2>
          </div>
          <div className="flex items-center gap-1">
            <div className="relative">
              <button onClick={() => setMenuOpen(!menuOpen)} className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground" aria-label="More options"><MoreHorizontal className="size-4" /></button>
              {menuOpen ? (
                <div className="absolute right-0 top-10 z-50 w-44 rounded-lg border border-white/[0.08] bg-[#161618] py-1 shadow-xl">
                  <button onClick={() => { setMenuOpen(false); if (p.id) onArchive(p.id); }} className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-[#c8cdd5] hover:bg-white/[0.055]"><Archive className="size-3.5" />Archive</button>
                  <ConfirmDelete onConfirm={() => { setMenuOpen(false); if (p.id) onDelete(p.id); }} label="Delete permanently" className="px-3 py-1.5"><Trash2 className="size-3.5" /></ConfirmDelete>
                </div>
              ) : null}
            </div>
            <button onClick={onClose} className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground" aria-label="Close project detail"><X className="size-4" /></button>
          </div>
        </div>

        <div className="px-5 py-5">
          <div className="flex items-start gap-3">
            <label className={cn("relative group", isEditing ? "cursor-pointer" : "")}>
              <span className={cn("grid size-14 shrink-0 place-items-center rounded-2xl bg-cover bg-center text-lg font-bold shadow-sm", p.logoClass)} style={editLogoPreview ? { backgroundImage: `url("${editLogoPreview}")` } : p.logoUrl ? { backgroundImage: `url("${p.logoUrl}")` } : undefined}>
                {(editLogoPreview || p.logoUrl) ? null : p.mark}
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
                <h3 className="truncate text-2xl font-semibold tracking-[-0.03em]">{p.name}</h3>
              )}
              <p className="mt-1 text-xs text-muted-foreground">{isEditing ? `${editHunt} · ${editStage}` : `${p.hunt} · ${p.stage}`}</p>
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
                  <SelectPreview
                    id="edit-hunt-type"
                    label="Hunt type"
                    value={editHunt}
                    options={["Free Hunts", "Retro", "Waitlist"]}
                    openSelect={openEditSelect}
                    setOpenSelect={setOpenEditSelect}
                    onChange={setEditHunt}
                    compact
                  />
                  <SelectPreview
                    id="edit-status"
                    label="Status"
                    value={editStatus}
                    options={["Watching", "In progress", "Running", "Paused", "Done", "Dropped"]}
                    openSelect={openEditSelect}
                    setOpenSelect={setOpenEditSelect}
                    onChange={setEditStatus}
                    compact
                  />
                  <SelectPreview
                    id="edit-stage-result"
                    label="Stage / result"
                    value={editStage || "Not applicable"}
                    options={[...STAGE_PRESETS]}
                    openSelect={openEditSelect}
                    setOpenSelect={setOpenEditSelect}
                    onChange={setEditStage}
                    compact
                    allowCustom
                  />
                  <SelectPreview
                    id="edit-priority"
                    label="Priority"
                    value={editPriority}
                    options={["High", "Medium", "Low"]}
                    openSelect={openEditSelect}
                    setOpenSelect={setOpenEditSelect}
                    onChange={setEditPriority}
                    compact
                  />
                  <Property label="Completion">
                    <div className="flex items-center gap-2">
                      <input type="number" min={0} max={100} value={editProgress} onChange={(e) => setEditProgress(Number(e.target.value))} className="h-8 w-16 rounded-lg border border-white/[0.08] bg-[#161618] px-2 text-xs text-foreground outline-none" />
                      <span className="text-xs text-muted-foreground">%</span>
                    </div>
                  </Property>
                  <AppDatePicker label="Date start" value={editDate} onChange={setEditDate} />
                  <Property label="Project URL">
                    <input type="text" inputMode="url" autoCapitalize="none" autoCorrect="off" value={editWebsiteUrl} onChange={(e) => setEditWebsiteUrl(e.target.value)} onBlur={() => setEditWebsiteUrl((value) => normalizeHttpUrl(value))} className="h-8 w-full rounded-lg border border-white/[0.08] bg-[#161618] px-2 text-xs text-foreground outline-none" placeholder="project.com or https://project.com" />
                  </Property>
                </>
              ) : (
                <>
                  <Property label="Status"><Badge variant={statusVariant(p.status)}>{p.status}</Badge></Property>
                  <Property label="Stage / result"><span>{p.stage}</span></Property>
                  <Property label="Priority"><Priority value={p.priority} /></Property>
                  <Property label="Completion"><Progress value={p.progress} /></Property>
                  <Property label="Date start"><span>{p.date}</span></Property>
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
                <ComboboxPreview
                  label="Chain"
                  values={editChains}
                  options={[...new Set(["Ethereum", "Solana", "Cosmos", "Base", "Arbitrum", "Optimism", ...editChains])]}
                  placeholder="Add chain..."
                  onChange={setEditChains}
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
                <ProjectWalletPicker
                  accountOptions={accountOptions}
                  walletOptions={walletOptions}
                  selectedAccountIds={editAccountIds}
                  selectedWalletIds={editWalletIds}
                  newWallets={editNewWallets}
                  onWalletIdsChange={setEditWalletIds}
                  onNewWalletsChange={setEditNewWallets}
                />
              </>
            ) : (
              <>
                <PropertyBlock label="Work Type"><Tags tags={p.work} strong max={4} /></PropertyBlock>
                <PropertyBlock label="Project Type"><Tags tags={p.type} max={4} /></PropertyBlock>
                <PropertyBlock label="Chain">
                  {p.chains.length > 0 ? <Tags tags={p.chains} max={4} /> : <span className="text-[11px] text-muted-foreground/60">Not set</span>}
                </PropertyBlock>
                <PropertyBlock label="Accounts">
                  {p.accounts.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {p.accounts.map((account) => (
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
                <PropertyBlock label="Project wallets">
                  {(p.walletDetails?.length ?? 0) > 0 ? (
                    <div className="grid w-full gap-1.5 sm:grid-cols-2">
                      {p.walletDetails?.map((wallet) => {
                        const owner = accountOptions.find((account) => account.id === wallet.ownerAccountId)?.label ?? "Shared";
                        return <div key={wallet.id} className="flex min-w-0 items-center gap-2 rounded-xl bg-white/[0.025] px-2.5 py-2"><WalletCards className="size-3.5 shrink-0 text-muted-foreground" /><span className="min-w-0"><span className="block truncate text-xs font-medium text-foreground">{wallet.label}</span><span className="block truncate font-mono text-[10px] text-muted-foreground">{shortWalletAddress(wallet.address)} · {wallet.chainType || "Chain not set"} · {owner}</span></span></div>;
                      })}
                    </div>
                  ) : <span className="text-[11px] text-muted-foreground/60">No wallet assigned</span>}
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
              {p.websiteUrl ? <DetailLink label="Website" value={p.websiteUrl} href={p.websiteUrl} external /> : <p className="text-[11px] text-muted-foreground">No project URL added.</p>}
              {isEditing ? (
                <Property label="X URL">
                  <input type="text" inputMode="url" autoCapitalize="none" autoCorrect="off" value={editTwitterUrl} onChange={(event) => setEditTwitterUrl(event.target.value)} onBlur={() => setEditTwitterUrl((value) => normalizeHttpUrl(value))} className="h-8 w-full rounded-lg border border-white/[0.08] bg-[#161618] px-2 text-xs text-foreground outline-none" placeholder="x.com/project" />
                </Property>
              ) : p.twitterUrl ? (
                <DetailLink label="X" value={p.twitterUrl} href={p.twitterUrl} external />
              ) : null}
              <DetailLink label="Docs" value="Open linked project docs" href={"/docs?project=" + (p.id ?? "")} />
            </div>
          </section>

          <section className="mt-5">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold">Short note</h4>
              <Link href={"/docs?project=" + (p.id ?? "")} className="text-[11px] text-muted-foreground hover:text-foreground">Open Docs</Link>
            </div>
            {isEditing ? (
              <textarea value={editNotes} onChange={(event) => setEditNotes(event.target.value)} className="mt-2 min-h-28 w-full resize-y rounded-xl border border-white/[0.08] bg-[#161618] p-3 text-xs text-foreground outline-none" placeholder="Short project note, result, setup, or reminder..." />
            ) : (
              <div className="mt-2 rounded-xl bg-white/[0.025] p-3 text-xs leading-5 text-muted-foreground">{p.notes || "No short note added."}</div>
            )}
          </section>

          <section className="mt-5">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold">Tasks</h4>
              <Link href={"/tasks?project=" + encodeURIComponent(p.name)} className="text-[11px] text-muted-foreground hover:text-foreground">Open Tasks</Link>
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

function shortWalletAddress(address: string) {
  if (address.length <= 14) return address;
  return `${address.slice(0, 7)}...${address.slice(-5)}`;
}

function ProjectWalletPicker({
  accountOptions,
  walletOptions,
  selectedAccountIds,
  selectedWalletIds,
  newWallets,
  onWalletIdsChange,
  onNewWalletsChange,
}: {
  accountOptions: ProjectAccountOption[];
  walletOptions: ProjectWalletOption[];
  selectedAccountIds: string[];
  selectedWalletIds: string[];
  newWallets: ProjectWalletDraft[];
  onWalletIdsChange: (ids: string[]) => void;
  onNewWalletsChange: (wallets: ProjectWalletDraft[]) => void;
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [label, setLabel] = useState("");
  const [address, setAddress] = useState("");
  const [chainType, setChainType] = useState("");
  const [ownerAccountId, setOwnerAccountId] = useState("shared");
  const [draftError, setDraftError] = useState("");
  const eligibleWallets = walletOptions
    .filter((wallet) => !wallet.ownerAccountId || selectedAccountIds.includes(wallet.ownerAccountId))
    .sort((a, b) => {
      const aOwner = accountOptions.find((account) => account.id === a.ownerAccountId)?.label ?? "Shared";
      const bOwner = accountOptions.find((account) => account.id === b.ownerAccountId)?.label ?? "Shared";
      return aOwner.localeCompare(bOwner) || a.label.localeCompare(b.label);
    });

  function addDraft() {
    if (!label.trim() || !address.trim() || !chainType.trim()) {
      setDraftError("Label, address, and chain are required");
      return;
    }
    onNewWalletsChange([...newWallets, {
      label: label.trim(),
      address: address.trim(),
      chainType: chainType.trim(),
      ownerAccountId: ownerAccountId === "shared" ? null : ownerAccountId,
    }]);
    setLabel("");
    setAddress("");
    setChainType("");
    setOwnerAccountId("shared");
    setDraftError("");
    setIsAdding(false);
  }

  return (
    <div className="border-t border-white/[0.04] pt-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Project wallets</p>
          <p className="mt-1 text-[11px] text-muted-foreground">Choose an existing wallet or add one for a custom chain.</p>
        </div>
        <button type="button" onClick={() => { setDraftError(""); setIsAdding((value) => !value); }} className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium text-foreground hover:bg-white/[0.05] active:scale-[0.97]">
          <Plus className="size-3.5" />New project wallet
        </button>
      </div>

      {eligibleWallets.length > 0 ? (
        <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
          {eligibleWallets.map((wallet) => {
            const active = selectedWalletIds.includes(wallet.id);
            const owner = accountOptions.find((account) => account.id === wallet.ownerAccountId)?.label ?? "Shared";
            return (
              <button key={wallet.id} type="button" onClick={() => onWalletIdsChange(active ? selectedWalletIds.filter((id) => id !== wallet.id) : [...selectedWalletIds, wallet.id])} className={cn("flex min-w-0 items-center gap-2 rounded-xl border px-2.5 py-2 text-left transition-[background-color,border-color,transform] active:scale-[0.985]", active ? "border-white/[0.12] bg-white/[0.07]" : "border-white/[0.055] bg-white/[0.02] hover:bg-white/[0.04]")}>
                <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-white/[0.045]"><WalletCards className="size-3.5 text-muted-foreground" /></span>
                <span className="min-w-0 flex-1"><span className="block truncate text-xs font-medium">{wallet.label}</span><span className="block truncate font-mono text-[10px] text-muted-foreground">{shortWalletAddress(wallet.address)} · {wallet.chainType || "Chain not set"} · {owner}</span></span>
                {active ? <Check className="size-3.5 shrink-0 text-foreground" /> : null}
              </button>
            );
          })}
        </div>
      ) : <p className="mt-2 text-[11px] text-muted-foreground/70">No eligible existing wallets. Select an Account or add a project wallet.</p>}

      {newWallets.length > 0 ? (
        <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
          {newWallets.map((wallet, index) => (
            <div key={`${wallet.address}-${index}`} className="flex min-w-0 items-center gap-2 rounded-xl border border-white/[0.12] bg-white/[0.07] px-2.5 py-2">
              <WalletCards className="size-3.5 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1"><span className="block truncate text-xs font-medium">{wallet.label}</span><span className="block truncate font-mono text-[10px] text-muted-foreground">{shortWalletAddress(wallet.address)} · {wallet.chainType}</span></span>
              <button type="button" onClick={() => onNewWalletsChange(newWallets.filter((_, draftIndex) => draftIndex !== index))} className="grid size-6 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-white/[0.06] hover:text-foreground" aria-label={`Remove ${wallet.label}`}><X className="size-3.5" /></button>
            </div>
          ))}
        </div>
      ) : null}

      {isAdding ? (
        <div className="mt-2 rounded-xl border border-white/[0.065] bg-white/[0.02] p-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <Field label="Wallet label" placeholder="Project node wallet" value={label} onChange={setLabel} />
            <Field label="Chain" placeholder="Custom L1 name" value={chainType} onChange={setChainType} />
            <div className="sm:col-span-2"><Field label="Address" placeholder="Wallet address" value={address} onChange={setAddress} /></div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Owner Account</p>
              <AppSelect ariaLabel="Wallet owner Account" value={ownerAccountId} options={[{ value: "shared", label: "Shared / no owner" }, ...accountOptions.filter((account) => selectedAccountIds.includes(account.id)).map((account) => ({ value: account.id, label: account.label }))]} onChange={setOwnerAccountId} className="mt-1.5 w-full" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between gap-3">
            {draftError ? <p className="text-[11px] text-danger">{draftError}</p> : <span />}
            <div className="flex gap-2"><Button variant="secondary" size="sm" onClick={() => setIsAdding(false)}>Cancel</Button><Button size="sm" onClick={addDraft}>Add wallet</Button></div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function DetailLink({ label, value, href, external = false }: { label: string; value: string; href: string; external?: boolean }) {
  return <a href={href} target={external ? "_blank" : undefined} rel={external ? "noreferrer" : undefined} className="flex items-center justify-between rounded-lg border border-white/[0.055] bg-muted/20 px-3 py-2 text-xs text-muted-foreground hover:bg-accent/40 hover:text-foreground"><span><span className="text-foreground">{label}</span> · {value}</span><ExternalLink className="size-3.5" /></a>;
}

function AddProjectDialog({
  open,
  onClose,
  onCreate,
  accountOptions,
  walletOptions,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (project: Project, assignments: ProjectAssignmentInput, context?: { logoFile?: File | null }) => Promise<void>;
  accountOptions: ProjectAccountOption[];
  walletOptions: ProjectWalletOption[];
}) {
  const [openSelect, setOpenSelect] = useState<string | null>(null);
  const [showOptionalContext, setShowOptionalContext] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [hunt, setHunt] = useState("Free Hunts");
  const [stage, setStage] = useState("Not applicable");
  const [status, setStatus] = useState("Watching");
  const [priority, setPriority] = useState("Medium");
  const [assignedAccountIds, setAssignedAccountIds] = useState<string[]>(() => accountOptions[0] ? [accountOptions[0].id] : []);
  const [assignedWalletIds, setAssignedWalletIds] = useState<string[]>([]);
  const [newWallets, setNewWallets] = useState<ProjectWalletDraft[]>([]);
  const [dateStart, setDateStart] = useState(getTodayDateValue);
  const [workTypes, setWorkTypes] = useState<string[]>(["Testnet"]);
  const [projectTypes, setProjectTypes] = useState<string[]>([]);
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const { mounted, closing } = usePresence(open, 160);
  if (!mounted) return null;

  const canCreate = projectName.trim().length > 0 && !isSubmitting;

  function resetForm() {
    setProjectName("");
    setHunt("Free Hunts");
    setStage("Not applicable");
    setStatus("Watching");
    setPriority("Medium");
    setAssignedAccountIds(accountOptions[0] ? [accountOptions[0].id] : []);
    setAssignedWalletIds([]);
    setNewWallets([]);
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
        chains: [],
        accounts,
        progress: 0,
        date: dateStart ? formatDateValue(dateStart) : "",
        dateValue: dateStart,
        activity: "now",
        websiteUrl: normalizeHttpUrl(websiteUrl) || undefined,
        notes: notes.trim() || undefined,
        logoUrl: logoPreview || undefined,
      }, { accountIds: assignedAccountIds, walletIds: assignedWalletIds, newWallets }, { logoFile });
      resetForm();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Unable to create project");
    } finally {
      setIsSubmitting(false);
    }
  }

  function toggleAccount(id: string) {
    setAssignedAccountIds((current) => {
      if (!current.includes(id)) return [...current, id];
      setAssignedWalletIds((walletIds) => walletIds.filter((walletId) => walletOptions.find((wallet) => wallet.id === walletId)?.ownerAccountId !== id));
      setNewWallets((walletDrafts) => walletDrafts.filter((wallet) => wallet.ownerAccountId !== id));
      return current.filter((item) => item !== id);
    });
  }

  return (
    <div className={cn("fixed inset-0 z-50 grid place-items-center bg-black/45 px-4 backdrop-blur-[2px]", closing ? "modal-backdrop-out" : "modal-backdrop-in")} role="dialog" aria-modal="true" aria-labelledby="add-project-title">
      <div className={cn("soft-panel max-h-[calc(100vh-32px)] w-full max-w-[680px] overflow-y-auto rounded-2xl border border-white/[0.065] bg-card shadow-2xl shadow-black/45 scrollbar-subtle", closing ? "modal-card-out" : "modal-card-in")} onPaste={(event) => {
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
            <AppDatePicker label="Date" value={dateStart} onChange={setDateStart} triggerClassName="h-10 justify-center px-2" />
          </div>

          <div className="px-2 py-2">
            <div className="grid grid-cols-2 gap-1.5 md:grid-cols-4">
              <SelectPreview id="hunt" label="Hunt type" value={hunt} options={["Free Hunts", "Retro", "Waitlist"]} openSelect={openSelect} setOpenSelect={setOpenSelect} onChange={(nextHunt) => { setHunt(nextHunt); setStage(nextHunt === "Waitlist" ? "Watching" : "Not applicable"); }} compact />
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

          <div className="mt-2 px-2 pb-2">
            <ProjectWalletPicker
              accountOptions={accountOptions}
              walletOptions={walletOptions}
              selectedAccountIds={assignedAccountIds}
              selectedWalletIds={assignedWalletIds}
              newWallets={newWallets}
              onWalletIdsChange={setAssignedWalletIds}
              onNewWalletsChange={setNewWallets}
            />
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
                  <Field label="Project URL" placeholder="project.com or https://project.com" value={websiteUrl} onChange={setWebsiteUrl} onBlur={() => setWebsiteUrl((value) => normalizeHttpUrl(value))} inputMode="url" />
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
      aria-pressed={active}
      onClick={onClick}
      className={cn("soft-control rounded-full px-3 py-1 text-xs font-medium", active ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground")}
    >
      {label}
    </button>
  );
}

function Field({ label, placeholder, className = "", value, onChange, onBlur, inputMode }: { label: string; placeholder: string; className?: string; value?: string; onChange?: (value: string) => void; onBlur?: () => void; inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"] }) {
  return (
    <label className={className}>
      <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">{label}</span>
      <input value={value} onChange={onChange ? (event) => onChange(event.target.value) : undefined} onBlur={onBlur} inputMode={inputMode} autoCapitalize={inputMode === "url" ? "none" : undefined} autoCorrect={inputMode === "url" ? "off" : undefined} className="mt-1.5 h-9 w-full soft-inset rounded-lg border border-white/[0.055] bg-input px-3 text-sm outline-none placeholder:text-muted-foreground focus:border-ring" placeholder={placeholder} />
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
          className="popup-in fixed z-[120] max-h-48 overflow-y-auto rounded-xl border border-white/[0.075] bg-[#18181a]/[0.98] p-1 shadow-2xl shadow-black/45 backdrop-blur"
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
          className="popup-in fixed z-[120] max-h-48 overflow-y-auto rounded-xl border border-white/[0.075] bg-[#18181a]/[0.98] p-1 shadow-2xl shadow-black/45 backdrop-blur"
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
