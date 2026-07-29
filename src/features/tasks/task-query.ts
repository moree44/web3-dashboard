import type { TaskRecord, TaskStatus } from "./task-types";

export type TaskFilters = {
  query: string;
  projectId: string;
  accountId: string;
  status: string;
  frequency: string;
  priority: string;
};

export function filterTasks(records: TaskRecord[], filters: TaskFilters) {
  const query = filters.query.trim().toLowerCase();

  return records.filter((task) => {
    const matchesProject = !filters.projectId || task.projectId === filters.projectId;
    const matchesAccount = !filters.accountId || task.effectiveAccounts.some((account) => account.id === filters.accountId);
    const matchesStatus = !filters.status || task.status === filters.status;
    const matchesFrequency = !filters.frequency || task.frequency === filters.frequency;
    const matchesPriority = !filters.priority || task.priority === filters.priority;
    const matchesQuery = !query || [
      task.title,
      task.projectName,
      task.description ?? "",
      task.url ?? "",
      ...task.effectiveAccounts.map((account) => account.label),
    ].some((value) => value.toLowerCase().includes(query));

    return matchesProject && matchesAccount && matchesStatus && matchesFrequency && matchesPriority && matchesQuery;
  });
}

export const TASK_BOARD_STATUSES: TaskStatus[] = [
  "todo",
  "in_progress",
  "recheck",
  "done",
  "dropped",
];
