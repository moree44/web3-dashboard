"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  convertWatchlistToProject,
  createWatchlistItem,
  deleteWatchlistItem,
  getWatchlistPageData,
  updateWatchlistItem,
} from "@/features/watchlist/actions";
import type {
  WatchlistConversionResult,
  WatchlistInput,
  WatchlistItemRecord,
  WatchlistPageData,
} from "@/features/watchlist/watchlist-types";

export const watchlistKeys = {
  list: ["project-watchlist"] as const,
};

export function upsertActiveWatchlistItem(
  data: WatchlistPageData,
  record: WatchlistItemRecord,
): WatchlistPageData {
  const exists = data.activeItems.some((item) => item.id === record.id);
  return {
    ...data,
    activeItems: exists
      ? data.activeItems.map((item) => item.id === record.id ? record : item)
      : [record, ...data.activeItems],
  };
}

export function removeActiveWatchlistItem(
  data: WatchlistPageData,
  id: string,
): WatchlistPageData {
  return {
    ...data,
    activeItems: data.activeItems.filter((item) => item.id !== id),
  };
}

export function applyWatchlistConversion(
  data: WatchlistPageData,
  result: WatchlistConversionResult,
): WatchlistPageData {
  const convertedExists = data.convertedItems.some((item) => item.id === result.item.id);
  return {
    activeItems: data.activeItems.filter((item) => item.id !== result.item.id),
    convertedItems: convertedExists
      ? data.convertedItems.map((item) => item.id === result.item.id ? result.item : item)
      : [result.item, ...data.convertedItems],
  };
}

export function useWatchlistWorkspace(
  initialData: WatchlistPageData,
  developmentPreview: boolean,
) {
  return useQuery({
    queryKey: watchlistKeys.list,
    queryFn: developmentPreview ? async () => initialData : getWatchlistPageData,
    initialData,
    staleTime: developmentPreview ? Number.POSITIVE_INFINITY : 0,
  });
}

export function useWatchlistMutations({
  developmentPreview,
  onError,
}: {
  developmentPreview: boolean;
  onError: (message: string) => void;
}) {
  const queryClient = useQueryClient();
  const key = watchlistKeys.list;

  function currentData() {
    return queryClient.getQueryData<WatchlistPageData>(key);
  }

  const saveMutation = useMutation({
    mutationFn: async ({ id, input }: { id?: string; input: WatchlistInput }) => {
      if (developmentPreview) throw new Error("Preview mode does not persist Watchlist items");
      return id ? updateWatchlistItem(id, input) : createWatchlistItem(input);
    },
    onError: (error: unknown) => {
      onError(error instanceof Error ? error.message : "Unable to save Watchlist item");
    },
    onSuccess: (record) => {
      const current = currentData();
      if (current) queryClient.setQueryData(key, upsertActiveWatchlistItem(current, record));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (developmentPreview) throw new Error("Preview mode does not persist Watchlist items");
      await deleteWatchlistItem(id);
      return id;
    },
    onError: (error: unknown) => {
      onError(error instanceof Error ? error.message : "Unable to delete Watchlist item");
    },
    onSuccess: (id) => {
      const current = currentData();
      if (current) queryClient.setQueryData(key, removeActiveWatchlistItem(current, id));
    },
  });

  const convertMutation = useMutation({
    mutationFn: async (id: string) => {
      if (developmentPreview) throw new Error("Preview mode does not persist Watchlist items");
      return convertWatchlistToProject(id);
    },
    onError: (error: unknown) => {
      onError(error instanceof Error ? error.message : "Unable to start Project");
    },
    onSuccess: (result) => {
      const current = currentData();
      if (current) queryClient.setQueryData(key, applyWatchlistConversion(current, result));
    },
  });

  return { saveMutation, deleteMutation, convertMutation };
}
