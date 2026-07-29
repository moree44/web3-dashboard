export type DeadlineDateSource = {
  dueDate: string;
  dueTime?: string | null;
};

const DAY_IN_MS = 24 * 60 * 60 * 1000;

export function getJakartaDateValue(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) throw new Error("Unable to resolve Jakarta date");
  return year + "-" + month + "-" + day;
}

export function getDeadlineDayDifference(dueDate: string, today = getJakartaDateValue()) {
  return Math.round((parseDateValue(dueDate).getTime() - parseDateValue(today).getTime()) / DAY_IN_MS);
}

export function formatDeadlineDueLabel(dueDate: string, today = getJakartaDateValue()) {
  const difference = getDeadlineDayDifference(dueDate, today);

  if (difference < 0) return "Overdue";
  if (difference === 0) return "Today";
  if (difference === 1) return "Tomorrow";
  if (difference <= 7) return "In " + difference + " days";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(parseDateValue(dueDate));
}

export function formatDeadlineTime(value?: string | null) {
  if (!value) return null;
  return value.slice(0, 5);
}

export function compareDeadlineDates(
  left: DeadlineDateSource,
  right: DeadlineDateSource,
) {
  const leftKey = left.dueDate + "T" + (formatDeadlineTime(left.dueTime) ?? "23:59");
  const rightKey = right.dueDate + "T" + (formatDeadlineTime(right.dueTime) ?? "23:59");
  return leftKey.localeCompare(rightKey);
}

export function shiftDateValue(value: string, days: number) {
  const date = parseDateValue(value);
  date.setUTCDate(date.getUTCDate() + days);
  return formatDateValue(date);
}

function parseDateValue(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) throw new Error("Invalid date value: " + value);
  return new Date(Date.UTC(year, month - 1, day));
}

function formatDateValue(date: Date) {
  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("-");
}
