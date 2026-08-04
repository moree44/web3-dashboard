import type { PersonalItemRecord } from "@/features/personal/types";
import type { TaskAccountOption, TaskFrequency, TaskPriority, TaskRecord, TaskStatus } from "@/features/tasks/task-types";

export const DAILY_LOG_STATUSES = ["done", "skip", "pending"] as const;

export type DailyLogStatus = (typeof DAILY_LOG_STATUSES)[number];

export type DailyTaskLogRecord = {
  id: string;
  taskId: string;
  projectId: string | null;
  accountId: string;
  walletId: string | null;
  status: DailyLogStatus;
  loggedDate: string;
  txHash: string | null;
  proofUrl: string | null;
  notes: string | null;
};

export type DailyChecklistItem = {
  id: string;
  kind: "checklist" | "monitoring";
  taskId: string;
  projectId: string;
  projectName: string;
  projectLogoUrl: string | null;
  title: string;
  description: string | null;
  taskStatus: TaskStatus;
  frequency: TaskFrequency;
  priority: TaskPriority;
  url: string | null;
  account: TaskAccountOption;
  walletId: string | null;
  log: DailyTaskLogRecord | null;
};

export type DailyPageData = {
  selectedDate: string;
  personalItems?: PersonalItemRecord[];
  items: DailyChecklistItem[];
  accounts: TaskAccountOption[];
};

export type DailyDataSource = {
  tasks: TaskRecord[];
  accounts: TaskAccountOption[];
  selectedDate: string;
  logs: DailyTaskLogRecord[];
  completedOnceLogKeys: Set<string>;
};
