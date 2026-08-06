"use client";

import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";

import {
  createAccount,
  createWallet,
  createWalletGroup,
  deleteAccount,
  deleteWallet,
  deleteWalletGroup,
  getAccountsWorkspaceData,
  setAccountAvatarUrl,
  updateAccount,
  updateWallet,
  updateWalletGroup,
  uploadAccountAvatar,
  type AccountWithStats,
  type AccountsWorkspaceData,
} from "@/features/accounts/actions";
import type { accounts as accountsSchema, wallets as walletsSchema, walletGroups as walletGroupsSchema } from "@/lib/db/schema";

// Single workspace per session, so a static key is enough. In real mode the
// query refetches on mount (staleTime 0) to reconcile with the fresh RSC
// initialData, so data created in other features (projects, tasks) always shows
// up after an SPA navigation. Preview mode never refetches.
export const accountKeys = {
  list: ["accounts"] as const,
};

type MutationContext = { previous?: AccountsWorkspaceData };

function toMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong";
}

// Shared optimistic-mutation wiring: snapshot before, apply the optimistic
// record, roll back on error, and merge the server-confirmed record on success.
// In preview mode there is no server, so success just leaves the optimistic
// cache write in place (no merge, no refetch).
function buildAccountMutationOptions<TResult, TVars>(opts: {
  queryClient: QueryClient;
  key: readonly string[];
  developmentPreview: boolean;
  onError: (message: string) => void;
  mutationFn: (variables: TVars) => Promise<TResult>;
  applyOptimistic?: (data: AccountsWorkspaceData, variables: TVars) => AccountsWorkspaceData;
  mergeResult: (data: AccountsWorkspaceData, result: TResult, variables: TVars) => AccountsWorkspaceData;
}) {
  return {
    mutationFn: opts.mutationFn,
    onMutate: async (variables: TVars) => {
      await opts.queryClient.cancelQueries({ queryKey: opts.key });
      const previous = opts.queryClient.getQueryData<AccountsWorkspaceData>(opts.key);
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
      const current = opts.queryClient.getQueryData<AccountsWorkspaceData>(opts.key);
      if (current) opts.queryClient.setQueryData(opts.key, opts.mergeResult(current, result, variables));
    },
  };
}

// ─── Pure record builders (also used as optimistic cache values) ─────────────

export type AccountCreateVars = {
  data: Omit<typeof accountsSchema.$inferInsert, "workspaceId">;
};

export type AccountUpdateVars = {
  id: string;
  data: Partial<typeof accountsSchema.$inferInsert>;
};

export type WalletCreateVars = {
  data: Omit<typeof walletsSchema.$inferInsert, "workspaceId">;
};

export type WalletUpdateVars = {
  id: string;
  data: Partial<typeof walletsSchema.$inferInsert>;
};

export type WalletGroupCreateVars = {
  data: Omit<typeof walletGroupsSchema.$inferInsert, "workspaceId">;
};

export type WalletGroupUpdateVars = {
  id: string;
  data: Partial<typeof walletGroupsSchema.$inferInsert>;
};

function normalizeValues(data: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(data)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [key, value === "" ? null : value]),
  );
}

function optimisticAccount(vars: AccountCreateVars): AccountWithStats {
  const now = new Date();
  return {
    id: "preview-account-" + Date.now(),
    workspaceId: "preview-workspace",
    label: vars.data.label,
    avatarUrl: vars.data.avatarUrl ?? null,
    avatarSource: vars.data.avatarSource ?? "none",
    color: vars.data.color ?? null,
    xUsername: vars.data.xUsername ?? null,
    xUrl: vars.data.xUrl ?? null,
    discordUsername: vars.data.discordUsername ?? null,
    email: vars.data.email ?? null,
    notes: vars.data.notes ?? null,
    createdAt: now,
    updatedAt: now,
    walletCount: 0,
    activeProjects: [],
  };
}

function applyAccountEdit(
  record: AccountWithStats,
  data: Partial<typeof accountsSchema.$inferInsert>,
): AccountWithStats {
  return { ...record, ...normalizeValues(data), updatedAt: new Date() };
}

function optimisticWallet(vars: WalletCreateVars): typeof walletsSchema.$inferSelect {
  const now = new Date();
  return {
    id: "preview-wallet-" + Date.now(),
    workspaceId: "preview-workspace",
    ownerAccountId: vars.data.ownerAccountId ?? null,
    walletGroupId: vars.data.walletGroupId ?? null,
    label: vars.data.label,
    address: vars.data.address,
    chainType: vars.data.chainType ?? null,
    walletType: vars.data.walletType ?? null,
    notes: vars.data.notes ?? null,
    createdAt: now,
    updatedAt: now,
  };
}

function applyWalletEdit(
  record: typeof walletsSchema.$inferSelect,
  data: Partial<typeof walletsSchema.$inferInsert>,
): typeof walletsSchema.$inferSelect {
  return { ...record, ...normalizeValues(data), updatedAt: new Date() };
}

function optimisticGroup(vars: WalletGroupCreateVars): typeof walletGroupsSchema.$inferSelect {
  const now = new Date();
  return {
    id: "preview-group-" + Date.now(),
    workspaceId: "preview-workspace",
    name: vars.data.name,
    description: vars.data.description ?? null,
    createdAt: now,
    updatedAt: now,
  };
}

function applyGroupEdit(
  record: typeof walletGroupsSchema.$inferSelect,
  data: Partial<typeof walletGroupsSchema.$inferInsert>,
): typeof walletGroupsSchema.$inferSelect {
  return { ...record, ...normalizeValues(data), updatedAt: new Date() };
}

// ─── Query ───────────────────────────────────────────────────────────────────

export function useAccountsWorkspace(initialData: AccountsWorkspaceData, developmentPreview: boolean) {
  return useQuery({
    queryKey: accountKeys.list,
    queryFn: developmentPreview ? async () => initialData : getAccountsWorkspaceData,
    initialData,
    staleTime: developmentPreview ? Number.POSITIVE_INFINITY : 0,
  });
}

// ─── Mutations ───────────────────────────────────────────────────────────────

export function useAccountsMutations(opts: {
  developmentPreview: boolean;
  onError: (message: string) => void;
}) {
  const queryClient = useQueryClient();
  const key = accountKeys.list;

  const mergeAccountInto = (data: AccountsWorkspaceData, record: AccountWithStats): AccountsWorkspaceData => ({
    ...data,
    accounts: data.accounts.map((account) => (account.id === record.id ? record : account)),
  });
  const mergeWalletInto = (
    data: AccountsWorkspaceData,
    record: typeof walletsSchema.$inferSelect,
  ): AccountsWorkspaceData => ({
    ...data,
    wallets: data.wallets.map((wallet) => (wallet.id === record.id ? record : wallet)),
  });
  const mergeGroupInto = (
    data: AccountsWorkspaceData,
    record: typeof walletGroupsSchema.$inferSelect,
  ): AccountsWorkspaceData => ({
    ...data,
    walletGroups: data.walletGroups.map((group) => (group.id === record.id ? record : group)),
  });

  // Creates are commit-waiting in real mode (the dialogs show a pending state
  // until the server responds). Preview swaps to the local builders so the
  // optimistic record is the created row.
  const createAccountMutation = useMutation(buildAccountMutationOptions<AccountWithStats, AccountCreateVars>({
    queryClient,
    key,
    developmentPreview: opts.developmentPreview,
    onError: opts.onError,
    mutationFn: async (vars) => {
      if (opts.developmentPreview) return optimisticAccount(vars);
      return createAccount(vars.data);
    },
    applyOptimistic: opts.developmentPreview
      ? (data, vars) => ({ ...data, accounts: [optimisticAccount(vars), ...data.accounts] })
      : undefined,
    mergeResult: (data, result) => ({ ...data, accounts: [result, ...data.accounts] }),
  }));

  const updateAccountMutation = useMutation(buildAccountMutationOptions<AccountWithStats, AccountUpdateVars>({
    queryClient,
    key,
    developmentPreview: opts.developmentPreview,
    onError: opts.onError,
    mutationFn: ({ id, data }) => updateAccount(id, data),
    applyOptimistic: (data, { id, data: update }) => ({
      ...data,
      accounts: data.accounts.map((account) => (account.id === id ? applyAccountEdit(account, update) : account)),
    }),
    mergeResult: (data, result) => mergeAccountInto(data, result),
  }));

  // Deletes are commit-waiting (not optimistic) in real mode: the drawer closes
  // and the row is removed only after the server confirms, so a page
  // navigation can never abort the in-flight server action. Preview keeps an
  // optimistic removal since there is no server.
  const deleteAccountMutation = useMutation(buildAccountMutationOptions<void, string>({
    queryClient,
    key,
    developmentPreview: opts.developmentPreview,
    onError: opts.onError,
    mutationFn: async (id) => {
      if (opts.developmentPreview) return;
      return deleteAccount(id);
    },
    applyOptimistic: opts.developmentPreview
      ? (data, id) => ({ ...data, accounts: data.accounts.filter((account) => account.id !== id) })
      : undefined,
    mergeResult: (data, _result, id) => ({ ...data, accounts: data.accounts.filter((account) => account.id !== id) }),
  }));

  // Avatar mutations are not optimistic in real mode (they need the server
  // upload / URL normalization). Preview swaps to local records so the avatar
  // still updates without a server.
  const uploadAccountAvatarMutation = useMutation(buildAccountMutationOptions<AccountWithStats, { id: string; file: File }>({
    queryClient,
    key,
    developmentPreview: opts.developmentPreview,
    onError: opts.onError,
    mutationFn: async ({ id, file }) => {
      if (opts.developmentPreview) {
        const current = queryClient.getQueryData<AccountsWorkspaceData>(key);
        const record = current?.accounts.find((account) => account.id === id);
        if (!record) throw new Error("Account not found");
        return { ...record, avatarUrl: URL.createObjectURL(file), avatarSource: "uploaded" as const, updatedAt: new Date() };
      }
      const formData = new FormData();
      formData.set("file", file);
      return uploadAccountAvatar(id, formData);
    },
    applyOptimistic: opts.developmentPreview
      ? (data, { id, file }) => ({
          ...data,
          accounts: data.accounts.map((account) => account.id === id
            ? { ...account, avatarUrl: URL.createObjectURL(file), avatarSource: "uploaded" as const }
            : account),
        })
      : undefined,
    mergeResult: (data, result) => mergeAccountInto(data, result),
  }));

  const setAccountAvatarUrlMutation = useMutation(buildAccountMutationOptions<AccountWithStats, { id: string; url: string }>({
    queryClient,
    key,
    developmentPreview: opts.developmentPreview,
    onError: opts.onError,
    mutationFn: async ({ id, url }) => {
      if (opts.developmentPreview) {
        const current = queryClient.getQueryData<AccountsWorkspaceData>(key);
        const record = current?.accounts.find((account) => account.id === id);
        if (!record) throw new Error("Account not found");
        return {
          ...record,
          avatarUrl: url || null,
          avatarSource: url ? ("external_url" as const) : ("none" as const),
          updatedAt: new Date(),
        };
      }
      return setAccountAvatarUrl(id, url);
    },
    applyOptimistic: opts.developmentPreview
      ? (data, { id, url }) => ({
          ...data,
          accounts: data.accounts.map((account) => account.id === id
            ? { ...account, avatarUrl: url || null, avatarSource: url ? ("external_url" as const) : ("none" as const) }
            : account),
        })
      : undefined,
    mergeResult: (data, result) => mergeAccountInto(data, result),
  }));

  const createWalletMutation = useMutation(buildAccountMutationOptions<typeof walletsSchema.$inferSelect, WalletCreateVars>({
    queryClient,
    key,
    developmentPreview: opts.developmentPreview,
    onError: opts.onError,
    mutationFn: async (vars) => {
      if (opts.developmentPreview) return optimisticWallet(vars);
      return createWallet(vars.data);
    },
    applyOptimistic: opts.developmentPreview
      ? (data, vars) => ({ ...data, wallets: [optimisticWallet(vars), ...data.wallets] })
      : undefined,
    mergeResult: (data, result) => ({ ...data, wallets: [result, ...data.wallets] }),
  }));

  const updateWalletMutation = useMutation(buildAccountMutationOptions<typeof walletsSchema.$inferSelect, WalletUpdateVars>({
    queryClient,
    key,
    developmentPreview: opts.developmentPreview,
    onError: opts.onError,
    mutationFn: ({ id, data }) => updateWallet(id, data),
    applyOptimistic: (data, { id, data: update }) => ({
      ...data,
      wallets: data.wallets.map((wallet) => (wallet.id === id ? applyWalletEdit(wallet, update) : wallet)),
    }),
    mergeResult: (data, result) => mergeWalletInto(data, result),
  }));

  const deleteWalletMutation = useMutation(buildAccountMutationOptions<void, string>({
    queryClient,
    key,
    developmentPreview: opts.developmentPreview,
    onError: opts.onError,
    mutationFn: async (id) => {
      if (opts.developmentPreview) return;
      return deleteWallet(id);
    },
    applyOptimistic: opts.developmentPreview
      ? (data, id) => ({ ...data, wallets: data.wallets.filter((wallet) => wallet.id !== id) })
      : undefined,
    mergeResult: (data, _result, id) => ({ ...data, wallets: data.wallets.filter((wallet) => wallet.id !== id) }),
  }));

  const createWalletGroupMutation = useMutation(buildAccountMutationOptions<typeof walletGroupsSchema.$inferSelect, WalletGroupCreateVars>({
    queryClient,
    key,
    developmentPreview: opts.developmentPreview,
    onError: opts.onError,
    mutationFn: async (vars) => {
      if (opts.developmentPreview) return optimisticGroup(vars);
      return createWalletGroup(vars.data);
    },
    applyOptimistic: opts.developmentPreview
      ? (data, vars) => ({ ...data, walletGroups: [optimisticGroup(vars), ...data.walletGroups] })
      : undefined,
    mergeResult: (data, result) => ({ ...data, walletGroups: [result, ...data.walletGroups] }),
  }));

  const updateWalletGroupMutation = useMutation(buildAccountMutationOptions<typeof walletGroupsSchema.$inferSelect, WalletGroupUpdateVars>({
    queryClient,
    key,
    developmentPreview: opts.developmentPreview,
    onError: opts.onError,
    mutationFn: ({ id, data }) => updateWalletGroup(id, data),
    applyOptimistic: (data, { id, data: update }) => ({
      ...data,
      walletGroups: data.walletGroups.map((group) => (group.id === id ? applyGroupEdit(group, update) : group)),
    }),
    mergeResult: (data, result) => mergeGroupInto(data, result),
  }));

  const deleteWalletGroupMutation = useMutation(buildAccountMutationOptions<void, string>({
    queryClient,
    key,
    developmentPreview: opts.developmentPreview,
    onError: opts.onError,
    mutationFn: async (id) => {
      if (opts.developmentPreview) return;
      return deleteWalletGroup(id);
    },
    applyOptimistic: opts.developmentPreview
      ? (data, id) => ({ ...data, walletGroups: data.walletGroups.filter((group) => group.id !== id) })
      : undefined,
    mergeResult: (data, _result, id) => ({ ...data, walletGroups: data.walletGroups.filter((group) => group.id !== id) }),
  }));

  return {
    createAccountMutation,
    updateAccountMutation,
    deleteAccountMutation,
    uploadAccountAvatarMutation,
    setAccountAvatarUrlMutation,
    createWalletMutation,
    updateWalletMutation,
    deleteWalletMutation,
    createWalletGroupMutation,
    updateWalletGroupMutation,
    deleteWalletGroupMutation,
  };
}
