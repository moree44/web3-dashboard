"use client";

import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";

import {
  deleteProject,
  getArchivedProjects,
  restoreProject,
  type ProjectWithAccounts,
} from "@/features/projects/actions";

export type ArchiveWorkspaceData = {
  projects: ProjectWithAccounts[];
};

export const archiveKeys = {
  list: ["archive"] as const,
};

type MutationContext = { previous?: ArchiveWorkspaceData };

function toMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong";
}

function buildArchiveMutationOptions<TResult, TVars>(opts: {
  queryClient: QueryClient;
  key: readonly string[];
  developmentPreview: boolean;
  onError: (message: string) => void;
  mutationFn: (variables: TVars) => Promise<TResult>;
  applyOptimistic?: (data: ArchiveWorkspaceData, variables: TVars) => ArchiveWorkspaceData;
  mergeResult: (data: ArchiveWorkspaceData, result: TResult, variables: TVars) => ArchiveWorkspaceData;
}) {
  return {
    mutationFn: opts.mutationFn,
    onMutate: async (variables: TVars) => {
      await opts.queryClient.cancelQueries({ queryKey: opts.key });
      const previous = opts.queryClient.getQueryData<ArchiveWorkspaceData>(opts.key);
      if (previous && opts.applyOptimistic) {
        opts.queryClient.setQueryData(opts.key, opts.applyOptimistic(previous, variables));
      }
      return { previous };
    },
    onError: (error: unknown, _variables: TVars, context: MutationContext | undefined) => {
      if (context?.previous) opts.queryClient.setQueryData(opts.key, context.previous);
      opts.onError(toMessage(error));
    },
    onSuccess: (result: TResult, variables: TVars) => {
      if (opts.developmentPreview) return;
      const current = opts.queryClient.getQueryData<ArchiveWorkspaceData>(opts.key);
      if (current) opts.queryClient.setQueryData(opts.key, opts.mergeResult(current, result, variables));
    },
  };
}

export function removeArchivedProjects(data: ArchiveWorkspaceData, ids: string[]): ArchiveWorkspaceData {
  const idSet = new Set(ids);
  return { ...data, projects: data.projects.filter((project) => !idSet.has(project.id)) };
}

export function useArchiveWorkspace(initialData: ArchiveWorkspaceData, developmentPreview: boolean) {
  return useQuery({
    queryKey: archiveKeys.list,
    queryFn: developmentPreview
      ? async () => initialData
      : async () => ({ projects: await getArchivedProjects() }),
    initialData,
    staleTime: developmentPreview ? Number.POSITIVE_INFINITY : 0,
  });
}

export function useArchiveMutations(opts: {
  developmentPreview: boolean;
  onError: (message: string) => void;
}) {
  const queryClient = useQueryClient();
  const key = archiveKeys.list;

  // Restore is commit-waiting: /projects must see the DB commit before the user
  // navigates away. Preview just drops the local rows.
  const restoreMutation = useMutation(buildArchiveMutationOptions<void, string[]>({
    queryClient,
    key,
    developmentPreview: opts.developmentPreview,
    onError: opts.onError,
    mutationFn: async (ids) => {
      if (opts.developmentPreview) return;
      await Promise.all(ids.map((id) => restoreProject(id)));
    },
    applyOptimistic: opts.developmentPreview
      ? (data, ids) => removeArchivedProjects(data, ids)
      : undefined,
    mergeResult: (data, _result, ids) => removeArchivedProjects(data, ids),
  }));

  // Permanent delete is commit-waiting in real mode for the same reason.
  const deleteMutation = useMutation(buildArchiveMutationOptions<void, string>({
    queryClient,
    key,
    developmentPreview: opts.developmentPreview,
    onError: opts.onError,
    mutationFn: async (id) => {
      if (opts.developmentPreview) return;
      return deleteProject(id);
    },
    applyOptimistic: opts.developmentPreview
      ? (data, id) => removeArchivedProjects(data, [id])
      : undefined,
    mergeResult: (data, _result, id) => removeArchivedProjects(data, [id]),
  }));

  return { restoreMutation, deleteMutation };
}
