import { isDailyMonitoringTask, isTaskScheduledForDate } from "./daily-schedule";
import type { DailyDataSource, DailyPageData } from "./daily-types";

export function dailyLogKey(taskId: string, accountId: string) {
  return taskId + ":" + accountId;
}

export function buildDailyPageData({
  tasks,
  accounts,
  selectedDate,
  logs,
  completedOnceLogKeys,
}: DailyDataSource): DailyPageData {
  const logsByTaskAccount = new Map(logs.map((log) => [dailyLogKey(log.taskId, log.accountId), log]));
  const items = tasks.flatMap((task) => {
    const monitoring = isDailyMonitoringTask(task.status);
    return task.effectiveAccounts.flatMap((account) => {
      const scheduled = isTaskScheduledForDate({
        status: task.status,
        frequency: task.frequency,
        startDate: task.startDate,
        selectedDate,
        hasCompletedOnce: completedOnceLogKeys.has(dailyLogKey(task.id, account.id)),
      });
      if (!monitoring && !scheduled) return [];
      return [{
      id: dailyLogKey(task.id, account.id),
      kind: monitoring ? ("monitoring" as const) : ("checklist" as const),
      taskId: task.id,
      projectId: task.projectId,
      projectName: task.projectName,
      projectLogoUrl: task.projectLogoUrl,
      title: task.title,
      description: task.description,
      taskStatus: task.status,
      frequency: task.frequency,
      priority: task.priority,
      url: task.url,
      account,
      walletId: task.assignedWallet?.id ?? null,
      log: logsByTaskAccount.get(dailyLogKey(task.id, account.id)) ?? null,
      }];
    });
  });

  return { selectedDate, items, accounts };
}
