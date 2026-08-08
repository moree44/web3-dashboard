"use client";

import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";

import {
  createInboxItem,
  createNoteFromInbox,
  createProjectFromInbox,
  createTaskFromInbox,
  getInboxPageData,
  linkInboxItem,
  setInboxStatus,
  updateInboxItem,
} from "@/features/inbox/actions";
import type {
  InboxItemInput,
  InboxItemRecord,
  InboxNoteConversionInput,
  InboxPageData,
  InboxProjectConversionInput,
  InboxStatus,
  InboxTaskConversionInput,
} from "@/features/inbox/inbox-types";

export const inboxKeys = {
  list: ["inbox"] as const,
};

type MutationContext = { previous?: InboxPageData };

function toMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong";
}

function buildInboxMutationOptions<TResult, TVars>(opts: {
  queryClient: QueryClient;
  key: readonly string[];
  developmentPreview: boolean;
  onError: (message: string) => void;
  mutationFn: (variables: TVars) => Promise<TResult>;
  applyOptimistic?: (data: InboxPageData, variables: TVars) => InboxPageData;
  mergeResult: (data: InboxPageData, result: TResult, variables: TVars) => InboxPageData;
}) {
  return {
    mutationFn: opts.mutationFn,
    onMutate: async (variables: TVars) => {
      await opts.queryClient.cancelQueries({ queryKey: opts.key });
      const previous = opts.queryClient.getQueryData<InboxPageData>(opts.key);
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
      const current = opts.queryClient.getQueryData<InboxPageData>(opts.key);
      if (current) opts.queryClient.setQueryData(opts.key, opts.mergeResult(current, result, variables));
    },
  };
}

export function upsertInboxItem(data: InboxPageData, record: InboxItemRecord): InboxPageData {
  const exists = data.items.some((item) => item.id === record.id);
  return {
    ...data,
    items: exists
      ? data.items.map((item) => (item.id === record.id ? record : item))
      : [record, ...data.items],
  };
}

export function useInboxWorkspace(initialData: InboxPageData, developmentPreview: boolean) {
  return useQuery({
    queryKey: inboxKeys.list,
    queryFn: developmentPreview ? async () => initialData : getInboxPageData,
    initialData,
    staleTime: developmentPreview ? Number.POSITIVE_INFINITY : 0,
  });
}

export function useInboxMutations(opts: {
  developmentPreview: boolean;
  onError: (message: string) => void;
}) {
  const queryClient = useQueryClient();
  const key = inboxKeys.list;

  // Capture/edit are commit-waiting so the detail panel can bind to the real id.
  const saveItemMutation = useMutation(buildInboxMutationOptions<InboxItemRecord, { id?: string; input: InboxItemInput }>({
    queryClient,
    key,
    developmentPreview: opts.developmentPreview,
    onError: opts.onError,
    mutationFn: async ({ id, input }) => {
      if (opts.developmentPreview) throw new Error("Preview mode does not persist Inbox items");
      return id ? updateInboxItem(id, input) : createInboxItem(input);
    },
    mergeResult: (data, result) => upsertInboxItem(data, result),
  }));

  // Status changes feel instant with optimistic UI.
  const statusMutation = useMutation(buildInboxMutationOptions<InboxItemRecord, { id: string; status: InboxStatus }>({
    queryClient,
    key,
    developmentPreview: opts.developmentPreview,
    onError: opts.onError,
    mutationFn: async ({ id, status }) => {
      if (opts.developmentPreview) throw new Error("Preview mode does not persist Inbox items");
      return setInboxStatus(id, status);
    },
    applyOptimistic: (data, { id, status }) => ({
      ...data,
      items: data.items.map((item) => (item.id === id ? { ...item, status } : item)),
    }),
    mergeResult: (data, result) => upsertInboxItem(data, result),
  }));

  // Conversion/link can create Projects/Tasks/Docs, so refresh the full page
  // data after the server confirms (projects/tasks option lists may change).
  const processMutation = useMutation({
    mutationFn: async (vars:
      | { kind: "project"; id: string; input: InboxProjectConversionInput }
      | { kind: "task"; id: string; input: InboxTaskConversionInput }
      | { kind: "note"; id: string; input: InboxNoteConversionInput }
      | { kind: "link-project"; id: string; targetId: string }
      | { kind: "link-task"; id: string; targetId: string }
    ) => {
      if (opts.developmentPreview) throw new Error("Preview mode does not persist Inbox items");
      if (vars.kind === "project") return createProjectFromInbox(vars.id, vars.input);
      if (vars.kind === "task") return createTaskFromInbox(vars.id, vars.input);
      if (vars.kind === "note") return createNoteFromInbox(vars.id, vars.input);
      if (vars.kind === "link-project") return linkInboxItem(vars.id, { type: "project", targetId: vars.targetId });
      return linkInboxItem(vars.id, { type: "task", targetId: vars.targetId });
    },
    onError: (error: unknown) => opts.onError(toMessage(error)),
    onSuccess: async () => {
      if (opts.developmentPreview) return;
      const refreshed = await getInboxPageData();
      queryClient.setQueryData(key, refreshed);
    },
  });

  return { saveItemMutation, statusMutation, processMutation };
}
