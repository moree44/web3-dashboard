"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getNftPageData,
  type NftCampaignWithContext,
  type NftPageData,
} from "@/features/nfts/actions";

// Single workspace per session. Real mode refetches on mount (staleTime 0) so
// campaigns created from other surfaces show up after SPA navigation.
export const nftKeys = {
  list: ["nfts"] as const,
};

export function upsertNftCampaign(data: NftPageData, record: NftCampaignWithContext): NftPageData {
  const exists = data.campaigns.some((campaign) => campaign.id === record.id);
  return {
    ...data,
    campaigns: exists
      ? data.campaigns.map((campaign) => (campaign.id === record.id ? record : campaign))
      : [record, ...data.campaigns],
  };
}

export function removeNftCampaign(data: NftPageData, id: string): NftPageData {
  return { ...data, campaigns: data.campaigns.filter((campaign) => campaign.id !== id) };
}

export function useNftsWorkspace(initialData: NftPageData, developmentPreview: boolean) {
  return useQuery({
    queryKey: nftKeys.list,
    queryFn: developmentPreview ? async () => initialData : getNftPageData,
    initialData,
    staleTime: developmentPreview ? Number.POSITIVE_INFINITY : 0,
  });
}

export function useNftsCache() {
  const queryClient = useQueryClient();
  const key = nftKeys.list;

  // Dialog already awaits create/update/delete. Parent only syncs the React Query cache.
  function applySaved(record: NftCampaignWithContext) {
    const current = queryClient.getQueryData<NftPageData>(key);
    if (current) queryClient.setQueryData(key, upsertNftCampaign(current, record));
  }

  function applyDeleted(id: string) {
    const current = queryClient.getQueryData<NftPageData>(key);
    if (current) queryClient.setQueryData(key, removeNftCampaign(current, id));
  }

  return { applySaved, applyDeleted };
}
