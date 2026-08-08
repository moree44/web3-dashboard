"use client";

import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";

import { getDailyPageData, upsertDailyTaskLog } from "@/features/daily/actions";
import type { DailyChecklistItem, DailyLogStatus, DailyPageData, DailyTaskLogRecord } from "@/features/daily/daily-types";
import { updatePersonalItemStatus } from "@/features/personal/actions";
import type { PersonalItemRecord, PersonalStatus } from "@/features/personal/types";

// Daily is date-scoped: each selected calendar day is its own cache entry so
// navigating prev/next keeps recent days warm and avoids clobbering optimistic
// writes for the wrong date.
export const dailyKeys = {
  day: (date: string) => ["daily", date] as const,
};

type MutationContext = { previous?: DailyPageData };

function toMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong";
}

function buildDailyMutationOptions<TResult, TVars>(opts: {
  queryClient: QueryClient;
  key: readonly string[];
  developmentPreview: boolean;
  onError: (message: string) => void;
  mutationFn: (variables: TVars) => Promise<TResult>;
  applyOptimistic?: (data: DailyPageData, variables: TVars) => DailyPageData;
  mergeResult: (data: DailyPageData, result: TResult, variables: TVars) => DailyPageData;
}) {
  return {
    mutationFn: opts.mutationFn,
    onMutate: async (variables: TVars) => {
      await opts.queryClient.cancelQueries({ queryKey: opts.key });
      const previous = opts.queryClient.getQueryData<DailyPageData>(opts.key);
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
      const current = opts.queryClient.getQueryData<DailyPageData>(opts.key);
      if (current) opts.queryClient.setQueryData(opts.key, opts.mergeResult(current, result, variables));
    },
  };
}

export function applyDailyLog(
  data: DailyPageData,
  itemId: string,
  log: DailyTaskLogRecord | null,
): DailyPageData {
  return {
    ...data,
    items: data.items.map((item) => (item.id === itemId ? { ...item, log } : item)),
  };
}

export function applyPersonalStatus(
  data: DailyPageData,
  record: PersonalItemRecord,
): DailyPageData {
  return {
    ...data,
    personalItems: (data.personalItems ?? []).map((item) => (item.id === record.id ? record : item)),
  };
}

export function useDailyWorkspace(
  selectedDate: string,
  initialData: DailyPageData,
  developmentPreview: boolean,
) {
  // Seed the initial date only. Other dates fetch via queryFn.
  const isInitialDate = selectedDate === initialData.selectedDate;
  return useQuery({
    queryKey: dailyKeys.day(selectedDate),
    queryFn: developmentPreview
      ? async () => (isInitialDate ? initialData : { ...initialData, selectedDate, items: [] })
      : () => getDailyPageData(selectedDate),
    initialData: isInitialDate ? initialData : undefined,
    staleTime: developmentPreview ? Number.POSITIVE_INFINITY : 0,
    placeholderData: (previous) => previous,
  });
}

export function useDailyMutations(opts: {
  selectedDate: string;
  developmentPreview: boolean;
  onError: (message: string) => void;
}) {
  const queryClient = useQueryClient();
  const key = dailyKeys.day(opts.selectedDate);

  type LogVars = {
    item: DailyChecklistItem;
    status: DailyLogStatus;
    fields?: { txHash?: string; proofUrl?: string; notes?: string };
  };

  // Checklist log toggle is optimistic so Done/Skip feels instant.
  const saveLogMutation = useMutation(buildDailyMutationOptions<DailyTaskLogRecord, LogVars>({
    queryClient,
    key,
    developmentPreview: opts.developmentPreview,
    onError: opts.onError,
    mutationFn: async ({ item, status, fields }) => {
      if (opts.developmentPreview) {
        return {
          id: item.log?.id ?? "preview-log-" + item.id,
          taskId: item.taskId,
          projectId: item.projectId,
          accountId: item.account.id,
          walletId: item.walletId,
          status,
          loggedDate: opts.selectedDate,
          txHash: fields?.txHash ?? item.log?.txHash ?? null,
          proofUrl: fields?.proofUrl ?? item.log?.proofUrl ?? null,
          notes: fields?.notes ?? item.log?.notes ?? null,
        };
      }
      return upsertDailyTaskLog({
        taskId: item.taskId,
        accountId: item.account.id,
        loggedDate: opts.selectedDate,
        status,
        walletId: item.walletId,
        txHash: fields?.txHash ?? item.log?.txHash ?? null,
        proofUrl: fields?.proofUrl ?? item.log?.proofUrl ?? null,
        notes: fields?.notes ?? item.log?.notes ?? null,
      });
    },
    applyOptimistic: (data, { item, status, fields }) => applyDailyLog(data, item.id, {
      id: item.log?.id ?? "optimistic-log-" + item.id,
      taskId: item.taskId,
      projectId: item.projectId,
      accountId: item.account.id,
      walletId: item.walletId,
      status,
      loggedDate: opts.selectedDate,
      txHash: fields?.txHash ?? item.log?.txHash ?? null,
      proofUrl: fields?.proofUrl ?? item.log?.proofUrl ?? null,
      notes: fields?.notes ?? item.log?.notes ?? null,
    }),
    mergeResult: (data, result, { item }) => applyDailyLog(data, item.id, result),
  }));

  const togglePersonalMutation = useMutation(buildDailyMutationOptions<PersonalItemRecord, { item: PersonalItemRecord; status: PersonalStatus }>({
    queryClient,
    key,
    developmentPreview: opts.developmentPreview,
    onError: opts.onError,
    mutationFn: async ({ item, status }) => {
      if (opts.developmentPreview) return { ...item, status };
      return updatePersonalItemStatus(item.id, status);
    },
    applyOptimistic: (data, { item, status }) => applyPersonalStatus(data, { ...item, status }),
    mergeResult: (data, result) => applyPersonalStatus(data, result),
  }));

  return { saveLogMutation, togglePersonalMutation };
}
