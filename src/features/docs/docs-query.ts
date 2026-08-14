"use client";

import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";

import {
  createDocsFolder,
  createDocsNote,
  deleteDocsFolder,
  deleteDocsNote,
  getDocsPageData,
  updateDocsFolder,
  updateDocsNote,
} from "@/features/docs/actions";
import type {
  DocsFolderInput,
  DocsFolderRecord,
  DocsFolderUpdateResult,
  DocsNoteInput,
  DocsNoteRecord,
  DocsPageData,
} from "@/features/docs/docs-types";

export const docsKeys = {
  list: ["docs"] as const,
};

type MutationContext = { previous?: DocsPageData };

function toMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong";
}

function buildDocsMutationOptions<TResult, TVars>(opts: {
  queryClient: QueryClient;
  key: readonly string[];
  developmentPreview: boolean;
  onError: (message: string) => void;
  mutationFn: (variables: TVars) => Promise<TResult>;
  applyOptimistic?: (data: DocsPageData, variables: TVars) => DocsPageData;
  mergeResult: (data: DocsPageData, result: TResult, variables: TVars) => DocsPageData;
}) {
  return {
    mutationFn: opts.mutationFn,
    onMutate: async (variables: TVars) => {
      await opts.queryClient.cancelQueries({ queryKey: opts.key });
      const previous = opts.queryClient.getQueryData<DocsPageData>(opts.key);
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
      const current = opts.queryClient.getQueryData<DocsPageData>(opts.key);
      if (current) opts.queryClient.setQueryData(opts.key, opts.mergeResult(current, result, variables));
    },
  };
}

function sortNotes(notes: DocsNoteRecord[]) {
  return [...notes].sort((a, b) => Number(b.pinned) - Number(a.pinned) || (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""));
}

function sortFolders(folders: DocsFolderRecord[]) {
  return [...folders].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
}

export function upsertDocsNote(data: DocsPageData, record: DocsNoteRecord): DocsPageData {
  const exists = data.notes.some((note) => note.id === record.id);
  return {
    ...data,
    notes: sortNotes(
      exists
        ? data.notes.map((note) => (note.id === record.id ? record : note))
        : [record, ...data.notes],
    ),
  };
}

export function removeDocsNote(data: DocsPageData, id: string): DocsPageData {
  return { ...data, notes: data.notes.filter((note) => note.id !== id) };
}

export function upsertDocsFolder(data: DocsPageData, record: DocsFolderRecord): DocsPageData {
  const exists = data.folders.some((folder) => folder.id === record.id);
  return {
    ...data,
    folders: sortFolders(exists
      ? data.folders.map((folder) => (folder.id === record.id ? record : folder))
      : [...data.folders, record]),
  };
}

export function removeDocsFolder(data: DocsPageData, id: string): DocsPageData {
  return { ...data, folders: data.folders.filter((folder) => folder.id !== id) };
}

export function applyDocsFolderUpdate(data: DocsPageData, result: DocsFolderUpdateResult): DocsPageData {
  return {
    ...upsertDocsFolder(data, result.folder),
    notes: data.notes.map((note) => note.folder === result.previousName ? { ...note, folder: result.folder.name, updatedAt: result.folder.updatedAt } : note),
  };
}

export function useDocsWorkspace(initialData: DocsPageData, developmentPreview: boolean) {
  return useQuery({
    queryKey: docsKeys.list,
    queryFn: developmentPreview ? async () => initialData : getDocsPageData,
    initialData,
    staleTime: developmentPreview ? Number.POSITIVE_INFINITY : 0,
  });
}

export function useDocsMutations(opts: {
  developmentPreview: boolean;
  onError: (message: string) => void;
}) {
  const queryClient = useQueryClient();
  const key = docsKeys.list;

  // Create/update are commit-waiting (editor shows "Saving..." until the server
  // returns) so the draft can bind to the real id after first create.
  const saveNoteMutation = useMutation(buildDocsMutationOptions<DocsNoteRecord, { id?: string; input: DocsNoteInput }>({
    queryClient,
    key,
    developmentPreview: opts.developmentPreview,
    onError: opts.onError,
    mutationFn: async ({ id, input }) => {
      if (opts.developmentPreview) throw new Error("Preview mode does not persist Docs");
      return id ? updateDocsNote(id, input) : createDocsNote(input);
    },
    mergeResult: (data, result) => upsertDocsNote(data, result),
  }));

  // Delete is commit-waiting in real mode so closing the drawer cannot abort it.
  const deleteNoteMutation = useMutation(buildDocsMutationOptions<void, string>({
    queryClient,
    key,
    developmentPreview: opts.developmentPreview,
    onError: opts.onError,
    mutationFn: async (id) => {
      if (opts.developmentPreview) return;
      return deleteDocsNote(id);
    },
    applyOptimistic: opts.developmentPreview
      ? (data, id) => removeDocsNote(data, id)
      : undefined,
    mergeResult: (data, _result, id) => removeDocsNote(data, id),
  }));

  const createFolderMutation = useMutation(buildDocsMutationOptions<DocsFolderRecord, DocsFolderInput>({
    queryClient,
    key,
    developmentPreview: opts.developmentPreview,
    onError: opts.onError,
    mutationFn: async (input) => {
      if (opts.developmentPreview) throw new Error("Preview mode does not persist Docs folders");
      return createDocsFolder(input);
    },
    mergeResult: (data, result) => upsertDocsFolder(data, result),
  }));

  const deleteFolderMutation = useMutation(buildDocsMutationOptions<void, string>({
    queryClient,
    key,
    developmentPreview: opts.developmentPreview,
    onError: opts.onError,
    mutationFn: async (id) => {
      if (opts.developmentPreview) throw new Error("Preview mode does not persist Docs folders");
      return deleteDocsFolder(id);
    },
    mergeResult: (data, _result, id) => removeDocsFolder(data, id),
  }));

  const updateFolderMutation = useMutation(buildDocsMutationOptions<DocsFolderUpdateResult, { id: string; input: DocsFolderInput }>({
    queryClient,
    key,
    developmentPreview: opts.developmentPreview,
    onError: opts.onError,
    mutationFn: async ({ id, input }) => {
      if (opts.developmentPreview) throw new Error("Preview mode does not persist Docs folders");
      return updateDocsFolder(id, input);
    },
    mergeResult: (data, result) => applyDocsFolderUpdate(data, result),
  }));

  return { saveNoteMutation, deleteNoteMutation, createFolderMutation, updateFolderMutation, deleteFolderMutation };
}
