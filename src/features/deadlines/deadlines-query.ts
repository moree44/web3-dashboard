"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getDeadlinePageData,
  type DeadlinePageData,
  type DeadlineWithContext,
} from "@/features/deadlines/actions";

export const deadlineKeys = {
  list: ["deadlines"] as const,
};

export function upsertDeadline(data: DeadlinePageData, record: DeadlineWithContext): DeadlinePageData {
  const exists = data.deadlines.some((item) => item.id === record.id);
  return {
    ...data,
    deadlines: exists
      ? data.deadlines.map((item) => (item.id === record.id ? record : item))
      : [record, ...data.deadlines],
  };
}

export function removeDeadline(data: DeadlinePageData, id: string): DeadlinePageData {
  return { ...data, deadlines: data.deadlines.filter((item) => item.id !== id) };
}

export function useDeadlinesWorkspace(initialData: DeadlinePageData, developmentPreview: boolean) {
  return useQuery({
    queryKey: deadlineKeys.list,
    queryFn: developmentPreview ? async () => initialData : getDeadlinePageData,
    initialData,
    staleTime: developmentPreview ? Number.POSITIVE_INFINITY : 0,
  });
}

// Dialog already awaits create/update/delete. Parent only syncs the React Query cache.
export function useDeadlinesCache() {
  const queryClient = useQueryClient();
  const key = deadlineKeys.list;

  function applySaved(record: DeadlineWithContext) {
    const current = queryClient.getQueryData<DeadlinePageData>(key);
    if (current) queryClient.setQueryData(key, upsertDeadline(current, record));
  }

  function applyDeleted(id: string) {
    const current = queryClient.getQueryData<DeadlinePageData>(key);
    if (current) queryClient.setQueryData(key, removeDeadline(current, id));
  }

  return { applySaved, applyDeleted };
}
