"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";

import { createPersonalItem, deletePersonalItem, updatePersonalItemStatus } from "@/features/personal/actions";
import type { PersonalItemRecord } from "@/features/personal/types";
import { createTask, deleteTask, getTaskWorkspaceData, updateTask, updateTaskStatus } from "@/features/tasks/actions";
import { getJakartaDateValue } from "@/features/tasks/task-duration";
import type {
  TaskCreateInput,
  TaskInput,
  TaskProjectOption,
  TaskRecord,
  TaskStatus,
  TaskWorkspaceData,
} from "@/features/tasks/task-types";

// Single workspace per session, so a static key is enough. In real mode the
// query refetches on mount (staleTime 0) to reconcile with the fresh RSC
// initialData, so data created in other features (projects, accounts) always
// shows up after an SPA navigation. Preview mode never refetches.
export const taskKeys = {
  tasks: ["tasks"] as const,
};

type MutationContext = { previous?: TaskWorkspaceData };

function toMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong";
}

// Shared optimistic-mutation wiring: snapshot before, apply the optimistic
// record, roll back on error, and merge the server-confirmed record on success.
// In preview mode there is no server, so success just leaves the optimistic
// cache write in place (no merge, no refetch).
function buildTaskMutationOptions<TResult, TVars>(opts: {
  queryClient: QueryClient;
  key: readonly string[];
  developmentPreview: boolean;
  onError: (message: string) => void;
  mutationFn: (variables: TVars) => Promise<TResult>;
  applyOptimistic?: (data: TaskWorkspaceData, variables: TVars) => TaskWorkspaceData;
  mergeResult: (data: TaskWorkspaceData, result: TResult, variables: TVars) => TaskWorkspaceData;
}) {
  return {
    mutationFn: opts.mutationFn,
    onMutate: async (variables: TVars) => {
      await opts.queryClient.cancelQueries({ queryKey: opts.key });
      const previous = opts.queryClient.getQueryData<TaskWorkspaceData>(opts.key);
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
      const current = opts.queryClient.getQueryData<TaskWorkspaceData>(opts.key);
      if (current) opts.queryClient.setQueryData(opts.key, opts.mergeResult(current, result, variables));
    },
  };
}

// ─── Pure record builders (also used as optimistic cache values) ─────────────

export function optimisticTask(input: TaskInput, projects: TaskProjectOption[]): TaskRecord {
  const project = projects.find((item) => item.id === input.projectId) ?? projects[0];
  if (!project) throw new Error("Project not found");
  const now = new Date().toISOString();
  const status = input.status ?? "todo";
  const assignedAccounts = project.accounts.filter((account) => (input.accountIds ?? []).includes(account.id));
  return {
    id: "preview-task-" + Date.now(),
    projectId: project.id,
    projectName: project.name,
    projectLogoUrl: project.logoUrl,
    title: input.title,
    description: input.description ?? null,
    status,
    frequency: input.frequency ?? "once",
    priority: input.priority ?? "medium",
    url: input.url || null,
    sortOrder: 0,
    startDate: input.startDate || getJakartaDateValue(),
    completedAt: status === "done" ? now : null,
    assignedAccounts,
    effectiveAccounts: assignedAccounts.length ? assignedAccounts : project.accounts,
    usesProjectAccountFallback: assignedAccounts.length === 0,
    assignedWallet: project.wallets.find((wallet) => wallet.id === input.walletId) ?? null,
    createdAt: now,
    updatedAt: now,
  };
}

export function applyTaskEdit(task: TaskRecord, input: TaskInput, projects: TaskProjectOption[]): TaskRecord {
  const project = projects.find((item) => item.id === input.projectId);
  if (!project) throw new Error("Project not found");
  const assignedAccounts = project.accounts.filter((account) => (input.accountIds ?? []).includes(account.id));
  const status = input.status ?? "todo";
  return {
    ...task,
    projectId: project.id,
    projectName: project.name,
    projectLogoUrl: project.logoUrl,
    title: input.title.trim(),
    description: input.description || null,
    status,
    frequency: input.frequency ?? "once",
    priority: input.priority ?? "medium",
    url: input.url || null,
    startDate: input.startDate || null,
    completedAt: status === "done" ? task.completedAt ?? new Date().toISOString() : null,
    assignedAccounts,
    effectiveAccounts: assignedAccounts.length ? assignedAccounts : project.accounts,
    usesProjectAccountFallback: assignedAccounts.length === 0,
    assignedWallet: project.wallets.find((wallet) => wallet.id === input.walletId) ?? null,
    updatedAt: new Date().toISOString(),
  };
}

function optimisticPersonalItem(title: string): PersonalItemRecord {
  return {
    id: crypto.randomUUID(),
    title,
    frequency: "once",
    status: "todo",
    note: null,
    createdAt: null,
    updatedAt: null,
  };
}

// ─── Query ───────────────────────────────────────────────────────────────────

export function useTaskWorkspace(initialData: TaskWorkspaceData, developmentPreview: boolean) {
  return useQuery({
    queryKey: taskKeys.tasks,
    queryFn: developmentPreview ? async () => initialData : getTaskWorkspaceData,
    initialData,
    // Preview mode has no backend: never refetch, or the optimistic cache
    // writes would be clobbered back to the initial preview data.
    staleTime: developmentPreview ? Number.POSITIVE_INFINITY : 0,
  });
}

// ─── Mutations ───────────────────────────────────────────────────────────────

export function useTasksMutations(opts: {
  developmentPreview: boolean;
  projects: TaskProjectOption[];
  onError: (message: string) => void;
}) {
  const queryClient = useQueryClient();
  const key = taskKeys.tasks;

  const mergeTaskInto = (data: TaskWorkspaceData, record: TaskRecord): TaskWorkspaceData => ({
    ...data,
    tasks: data.tasks.map((task) => (task.id === record.id ? record : task)),
  });

  // createTask is commit-waiting (dialog shows "Creating..." until the server
  // responds) because the e2e smoke spec reads the row back via direct SQL
  // right after the title becomes visible. Everything else is optimistic.
  const createTaskMutation = useMutation(buildTaskMutationOptions<TaskRecord, TaskCreateInput>({
    queryClient,
    key,
    developmentPreview: opts.developmentPreview,
    onError: opts.onError,
    mutationFn: async (input) => (opts.developmentPreview ? optimisticTask(input, opts.projects) : createTask(input)),
    applyOptimistic: opts.developmentPreview
      ? (data, input) => ({ ...data, tasks: [optimisticTask(input, opts.projects), ...data.tasks] })
      : undefined,
    mergeResult: (data, result) => ({ ...data, tasks: [result, ...data.tasks] }),
  }));

  const saveTaskMutation = useMutation(buildTaskMutationOptions<TaskRecord, { id: string; input: TaskInput }>({
    queryClient,
    key,
    developmentPreview: opts.developmentPreview,
    onError: opts.onError,
    mutationFn: ({ id, input }) => updateTask(id, input),
    applyOptimistic: (data, { id, input }) => ({
      ...data,
      tasks: data.tasks.map((task) => (task.id === id ? applyTaskEdit(task, input, opts.projects) : task)),
    }),
    mergeResult: (data, result) => mergeTaskInto(data, result),
  }));

  const statusTaskMutation = useMutation(buildTaskMutationOptions<TaskRecord, { id: string; status: TaskStatus }>({
    queryClient,
    key,
    developmentPreview: opts.developmentPreview,
    onError: opts.onError,
    mutationFn: ({ id, status }) => updateTaskStatus(id, status),
    applyOptimistic: (data, { id, status }) => ({
      ...data,
      tasks: data.tasks.map((task) => (task.id === id
        ? {
            ...task,
            status,
            completedAt: status === "done" ? task.completedAt ?? new Date().toISOString() : null,
          }
        : task)),
    }),
    mergeResult: (data, result) => mergeTaskInto(data, result),
  }));

  const deleteTaskMutation = useMutation(buildTaskMutationOptions<void, string>({
    queryClient,
    key,
    developmentPreview: opts.developmentPreview,
    onError: opts.onError,
    mutationFn: (id) => deleteTask(id),
    applyOptimistic: (data, id) => ({ ...data, tasks: data.tasks.filter((task) => task.id !== id) }),
    mergeResult: (data, result, id) => ({ ...data, tasks: data.tasks.filter((task) => task.id !== id) }),
  }));

  const addPersonalItemMutation = useMutation(buildTaskMutationOptions<PersonalItemRecord, string>({
    queryClient,
    key,
    developmentPreview: opts.developmentPreview,
    onError: opts.onError,
    mutationFn: async (title) => (opts.developmentPreview ? optimisticPersonalItem(title) : createPersonalItem({ title, frequency: "once" })),
    applyOptimistic: (data, title) => ({ ...data, personalItems: [optimisticPersonalItem(title), ...(data.personalItems ?? [])] }),
    mergeResult: (data, result) => ({ ...data, personalItems: [result, ...(data.personalItems ?? [])] }),
  }));

  const togglePersonalItemMutation = useMutation(buildTaskMutationOptions<PersonalItemRecord, { id: string; status: "todo" | "done" }>({
    queryClient,
    key,
    developmentPreview: opts.developmentPreview,
    onError: opts.onError,
    mutationFn: ({ id, status }) => updatePersonalItemStatus(id, status),
    applyOptimistic: (data, { id, status }) => ({
      ...data,
      personalItems: (data.personalItems ?? []).map((item) => (item.id === id ? { ...item, status } : item)),
    }),
    mergeResult: (data, result) => ({
      ...data,
      personalItems: (data.personalItems ?? []).map((item) => (item.id === result.id ? result : item)),
    }),
  }));

  const removePersonalItemMutation = useMutation(buildTaskMutationOptions<void, string>({
    queryClient,
    key,
    developmentPreview: opts.developmentPreview,
    onError: opts.onError,
    mutationFn: (id) => deletePersonalItem(id),
    applyOptimistic: (data, id) => ({ ...data, personalItems: (data.personalItems ?? []).filter((item) => item.id !== id) }),
    mergeResult: (data, result, id) => ({ ...data, personalItems: (data.personalItems ?? []).filter((item) => item.id !== id) }),
  }));

  return {
    createTaskMutation,
    saveTaskMutation,
    statusTaskMutation,
    deleteTaskMutation,
    addPersonalItemMutation,
    togglePersonalItemMutation,
    removePersonalItemMutation,
  };
}
