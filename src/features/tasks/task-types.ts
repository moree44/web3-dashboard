import type { PersonalItemRecord } from "@/features/personal/types";

export const TASK_STATUSES = [
  "todo",
  "in_progress",
  "running",
  "recheck",
  "done",
  "dropped",
] as const;

export const TASK_FREQUENCIES = [
  "once",
  "daily",
  "weekly",
  "monthly",
  "custom",
] as const;

export const TASK_PRIORITIES = ["high", "medium", "low"] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];
export type TaskFrequency = (typeof TASK_FREQUENCIES)[number];
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export type TaskAccountOption = {
  id: string;
  label: string;
  avatarUrl: string | null;
};

export type TaskWalletOption = {
  id: string;
  label: string;
  address: string;
  ownerAccountId: string | null;
};

export type TaskProjectOption = {
  id: string;
  name: string;
  logoUrl: string | null;
  accounts: TaskAccountOption[];
  wallets: TaskWalletOption[];
};

export type TaskRecord = {
  id: string;
  projectId: string;
  projectName: string;
  projectLogoUrl: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  frequency: TaskFrequency;
  priority: TaskPriority;
  url: string | null;
  sortOrder: number;
  startDate: string | null;
  completedAt: string | null;
  assignedAccounts: TaskAccountOption[];
  effectiveAccounts: TaskAccountOption[];
  usesProjectAccountFallback: boolean;
  assignedWallet: TaskWalletOption | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type TaskWorkspaceData = {
  tasks: TaskRecord[];
  personalItems?: PersonalItemRecord[];
  projects: TaskProjectOption[];
  accounts: TaskAccountOption[];
};

export type TaskInput = {
  projectId: string;
  title: string;
  description?: string | null;
  status?: TaskStatus;
  frequency?: TaskFrequency;
  priority?: TaskPriority;
  url?: string | null;
  startDate?: string | null;
  accountIds?: string[];
  walletId?: string | null;
};

export type TaskDeadlineInput = {
  dueDate: string;
  dueTime?: string | null;
  url?: string | null;
  notes?: string | null;
};

export type TaskCreateInput = TaskInput & {
  deadline?: TaskDeadlineInput | null;
};

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "Todo",
  in_progress: "In progress",
  running: "Running",
  recheck: "Recheck",
  done: "Done",
  dropped: "Dropped",
};

export function formatTaskFrequency(value: TaskFrequency) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
