"use client";

import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";

import {
  archiveProject,
  createProject,
  deleteProject,
  getProjectsWorkspaceData,
  updateProject,
  uploadProjectLogo,
  type ProjectAccountOption,
  type ProjectWalletOption,
  type ProjectWithAccounts,
  type ProjectsWorkspaceData,
} from "@/features/projects/actions";
import type { ProjectAssignmentInput } from "@/features/projects/project-schema";
import type { projects as projectsSchema } from "@/lib/db/schema";

// Single workspace per session, so a static key is enough. In real mode the
// query refetches on mount (staleTime 0) to reconcile with the fresh RSC
// initialData, so data created in other features (accounts, nfts) always shows
// up after an SPA navigation. Preview mode never refetches.
export const projectKeys = {
  list: ["projects"] as const,
};

type MutationContext = { previous?: ProjectsWorkspaceData };

function toMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong";
}

export type ProjectDeleteVars = {
  id: string;
  forceUnlink?: boolean;
};

async function deleteProjectOrThrow({ id, forceUnlink = false }: ProjectDeleteVars) {
  const result = await deleteProject(id, { forceUnlink });
  if (!result.ok) throw new Error(result.error);
}

// Shared optimistic-mutation wiring: snapshot before, apply the optimistic
// record, roll back on error, and merge the server-confirmed record on success.
// In preview mode there is no server, so success just leaves the optimistic
// cache write in place (no merge, no refetch).
function buildProjectMutationOptions<TResult, TVars>(opts: {
  queryClient: QueryClient;
  key: readonly string[];
  developmentPreview: boolean;
  onError: (message: string) => void;
  mutationFn: (variables: TVars) => Promise<TResult>;
  applyOptimistic?: (data: ProjectsWorkspaceData, variables: TVars) => ProjectsWorkspaceData;
  mergeResult: (data: ProjectsWorkspaceData, result: TResult, variables: TVars) => ProjectsWorkspaceData;
}) {
  return {
    mutationFn: opts.mutationFn,
    onMutate: async (variables: TVars) => {
      await opts.queryClient.cancelQueries({ queryKey: opts.key });
      const previous = opts.queryClient.getQueryData<ProjectsWorkspaceData>(opts.key);
      if (previous && opts.applyOptimistic) {
        opts.queryClient.setQueryData(opts.key, opts.applyOptimistic(previous, variables));
      }
      return { previous };
    },
    onError: (error: unknown, variables: TVars, context: MutationContext | undefined) => {
      if (context?.previous) opts.queryClient.setQueryData(opts.key, context.previous);
      opts.onError(toMessage(error));
    },
    onSuccess: (result: TResult, variables: TVars) => {
      if (opts.developmentPreview) return;
      const current = opts.queryClient.getQueryData<ProjectsWorkspaceData>(opts.key);
      if (current) opts.queryClient.setQueryData(opts.key, opts.mergeResult(current, result, variables));
    },
  };
}

// ─── Pure record builders (also used as optimistic cache values) ─────────────

export type ProjectCreateVars = {
  data: Omit<typeof projectsSchema.$inferInsert, "workspaceId">;
  assignments: ProjectAssignmentInput;
  logoFile?: File | null;
  optimisticId?: string;
  optimisticLogoUrl?: string | null;
};

export type ProjectUpdateVars = {
  id: string;
  data: Partial<Omit<typeof projectsSchema.$inferInsert, "workspaceId">>;
  assignments?: ProjectAssignmentInput;
};

function optimisticProject(
  vars: ProjectCreateVars,
  accountOptions: ProjectAccountOption[],
  walletOptions: ProjectWalletOption[],
): ProjectWithAccounts {
  const now = new Date();
  const assignedAccounts = accountOptions.filter((account) => (vars.assignments.accountIds ?? []).includes(account.id));
  const newWallets: ProjectWalletOption[] = (vars.assignments.newWallets ?? []).map((draft, index) => ({
    id: `preview-wallet-${Date.now()}-${index}`,
    label: draft.label,
    address: draft.address,
    ownerAccountId: draft.ownerAccountId ?? null,
    chainType: draft.chainType,
    walletType: "project_wallet" as const,
  }));
  const assignedWallets = [
    ...walletOptions.filter((wallet) => (vars.assignments.walletIds ?? []).includes(wallet.id)),
    ...newWallets,
  ];
  return {
    id: vars.optimisticId ?? "preview-project-" + Date.now(),
    workspaceId: "preview-workspace",
    name: vars.data.name ?? "",
    slug: null,
    description: null,
    logoUrl: vars.optimisticLogoUrl ?? vars.data.logoUrl ?? null,
    logoPath: null,
    logoSource: vars.data.logoSource ?? "none",
    huntType: vars.data.huntType ?? null,
    status: vars.data.status ?? null,
    priority: vars.data.priority ?? null,
    workTypes: vars.data.workTypes ?? [],
    projectTypes: vars.data.projectTypes ?? [],
    chains: vars.data.chains ?? [],
    progressEstimate: vars.data.progressEstimate != null ? String(vars.data.progressEstimate) : "0",
    stageResult: vars.data.stageResult ?? null,
    dateStart: vars.data.dateStart ?? null,
    dateEnd: null,
    websiteUrl: vars.data.websiteUrl ?? null,
    twitterUrl: vars.data.twitterUrl ?? null,
    discordUrl: null,
    githubUrl: null,
    docsUrl: null,
    notes: vars.data.notes ?? null,
    isArchived: false,
    archiveReason: null,
    archivedAt: null,
    createdAt: now,
    updatedAt: now,
    assignedAccounts,
    assignedWallets,
  };
}

function mergeProjectCreate(
  data: ProjectsWorkspaceData,
  result: ProjectWithAccounts,
  vars: ProjectCreateVars,
): ProjectsWorkspaceData {
  const withoutPlaceholder = vars.optimisticId
    ? data.projects.filter((project) => project.id !== vars.optimisticId)
    : data.projects;
  if (withoutPlaceholder.some((project) => project.id === result.id)) {
    return {
      ...data,
      projects: withoutPlaceholder.map((project) => (project.id === result.id ? result : project)),
    };
  }
  return { ...data, projects: [result, ...withoutPlaceholder] };
}

function applyProjectEdit(
  record: ProjectWithAccounts,
  data: Partial<Omit<typeof projectsSchema.$inferInsert, "workspaceId">>,
  assignments: ProjectAssignmentInput | undefined,
  accountOptions: ProjectAccountOption[],
  walletOptions: ProjectWalletOption[],
): ProjectWithAccounts {
  const normalized = Object.fromEntries(
    Object.entries(data)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [key, value === "" ? null : value]),
  );
  const nextAssignments = assignments ?? {
    accountIds: record.assignedAccounts.map((account) => account.id),
    walletIds: record.assignedWallets.map((wallet) => wallet.id),
    newWallets: [],
  };
  const newWallets: ProjectWalletOption[] = nextAssignments.newWallets.map((draft, index) => ({
    id: `preview-wallet-${Date.now()}-${index}`,
    label: draft.label,
    address: draft.address,
    ownerAccountId: draft.ownerAccountId ?? null,
    chainType: draft.chainType,
    walletType: "project_wallet" as const,
  }));
  return {
    ...record,
    ...normalized,
    assignedAccounts: accountOptions.filter((account) => nextAssignments.accountIds.includes(account.id)),
    assignedWallets: [
      ...walletOptions.filter((wallet) => nextAssignments.walletIds.includes(wallet.id)),
      ...newWallets,
    ],
    updatedAt: new Date(),
  };
}

// ─── Query ───────────────────────────────────────────────────────────────────

export function useProjectsWorkspace(initialData: ProjectsWorkspaceData, developmentPreview: boolean) {
  return useQuery({
    queryKey: projectKeys.list,
    queryFn: developmentPreview ? async () => initialData : getProjectsWorkspaceData,
    initialData,
    staleTime: developmentPreview ? Number.POSITIVE_INFINITY : 0,
  });
}

// ─── Mutations ───────────────────────────────────────────────────────────────

export function useProjectsMutations(opts: {
  developmentPreview: boolean;
  accountOptions: ProjectAccountOption[];
  walletOptions: ProjectWalletOption[];
  onError: (message: string) => void;
}) {
  const queryClient = useQueryClient();
  const key = projectKeys.list;

  const mergeProjectInto = (data: ProjectsWorkspaceData, record: ProjectWithAccounts): ProjectsWorkspaceData => ({
    ...data,
    projects: data.projects.map((project) => (project.id === record.id ? record : project)),
  });

  const createProjectMutation = useMutation(buildProjectMutationOptions<ProjectWithAccounts, ProjectCreateVars>({
    queryClient,
    key,
    developmentPreview: opts.developmentPreview,
    onError: opts.onError,
    mutationFn: async (vars) => {
      if (opts.developmentPreview) return optimisticProject(vars, opts.accountOptions, opts.walletOptions);
      let created = await createProject(vars.data, vars.assignments);
      let logoUploadError = "";
      if (vars.logoFile) {
        const formData = new FormData();
        formData.set("file", vars.logoFile);
        try {
          created = await uploadProjectLogo(created.id, formData);
        } catch (error) {
          logoUploadError = error instanceof Error ? error.message : "Unable to upload project logo";
        }
      }
      if (logoUploadError) opts.onError(`Project created, but the logo was not uploaded. ${logoUploadError}`);
      return created;
    },
    applyOptimistic: (data, vars) => {
      vars.optimisticId ??= "optimistic-project-" + Date.now();
      return { ...data, projects: [optimisticProject(vars, opts.accountOptions, opts.walletOptions), ...data.projects] };
    },
    mergeResult: (data, result, vars) => mergeProjectCreate(data, result, vars),
  }));

  const updateProjectMutation = useMutation(buildProjectMutationOptions<ProjectWithAccounts, ProjectUpdateVars>({
    queryClient,
    key,
    developmentPreview: opts.developmentPreview,
    onError: opts.onError,
    mutationFn: ({ id, data, assignments }) => updateProject(id, data, assignments),
    applyOptimistic: (data, { id, data: update, assignments }) => ({
      ...data,
      projects: data.projects.map((project) => (project.id === id
        ? applyProjectEdit(project, update, assignments, opts.accountOptions, opts.walletOptions)
        : project)),
    }),
    mergeResult: (data, result) => mergeProjectInto(data, result),
  }));

  // Archive is commit-waiting (not optimistic): the /archive page is a
  // separate server-rendered route that must see the DB commit, and an
  // optimistic removal would let the user navigate away while the server
  // action is still in flight.
  const archiveProjectMutation = useMutation(buildProjectMutationOptions<void, { id: string; reason: string }>({
    queryClient,
    key,
    developmentPreview: opts.developmentPreview,
    onError: opts.onError,
    mutationFn: async ({ id, reason }) => {
      if (opts.developmentPreview) return;
      return archiveProject(id, reason);
    },
    mergeResult: (data, _result, { id }) => ({ ...data, projects: data.projects.filter((project) => project.id !== id) }),
  }));

  // Delete is commit-waiting (not optimistic) in real mode: the drawer closes
  // and the row is removed only after the server confirms, so a page
  // navigation can never abort the in-flight server action. Preview keeps an
  // optimistic removal since there is no server.
  const deleteProjectMutation = useMutation(buildProjectMutationOptions<void, ProjectDeleteVars>({
    queryClient,
    key,
    developmentPreview: opts.developmentPreview,
    onError: opts.onError,
    mutationFn: async (vars) => {
      if (opts.developmentPreview) return;
      return deleteProjectOrThrow(vars);
    },
    applyOptimistic: opts.developmentPreview
      ? (data, vars) => ({ ...data, projects: data.projects.filter((project) => project.id !== vars.id) })
      : undefined,
    mergeResult: (data, _result, vars) => ({ ...data, projects: data.projects.filter((project) => project.id !== vars.id) }),
  }));

  const uploadProjectLogoMutation = useMutation(buildProjectMutationOptions<ProjectWithAccounts, { id: string; formData: FormData }>({
    queryClient,
    key,
    developmentPreview: opts.developmentPreview,
    onError: opts.onError,
    mutationFn: async ({ id, formData }) => {
      if (opts.developmentPreview) throw new Error("Logo upload is not available in preview mode");
      return uploadProjectLogo(id, formData);
    },
    mergeResult: (data, result) => mergeProjectInto(data, result),
  }));

  return {
    createProjectMutation,
    updateProjectMutation,
    archiveProjectMutation,
    deleteProjectMutation,
    uploadProjectLogoMutation,
  };
}
