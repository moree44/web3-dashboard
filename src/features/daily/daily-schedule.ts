import type { TaskFrequency, TaskStatus } from "@/features/tasks/task-types";

type DailyScheduleInput = {
  status: TaskStatus;
  frequency: TaskFrequency;
  startDate: string | null;
  selectedDate: string;
  hasCompletedOnce?: boolean;
};

function parseDateValue(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function isDailyMonitoringTask(status: TaskStatus) {
  return status === "running" || status === "recheck";
}

export function isTaskScheduledForDate({
  status,
  frequency,
  startDate,
  selectedDate,
  hasCompletedOnce = false,
}: DailyScheduleInput) {
  if (status !== "todo" && status !== "in_progress") return false;
  if (frequency === "custom" || !startDate || selectedDate < startDate) return false;

  if (frequency === "once") return !hasCompletedOnce;
  if (frequency === "daily") return true;

  const start = parseDateValue(startDate);
  const selected = parseDateValue(selectedDate);
  if (frequency === "weekly") return selected.getUTCDay() === start.getUTCDay();
  if (frequency === "monthly") return selected.getUTCDate() === start.getUTCDate();
  return false;
}
