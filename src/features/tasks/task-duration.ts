const DAY_IN_MS = 86_400_000;

function parseDateValue(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

export function getJakartaDateValue(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return values.year + "-" + values.month + "-" + values.day;
}

export function getTaskDurationDays(startDate: string, completedAt: string) {
  const completedDate = getJakartaDateValue(new Date(completedAt));
  return Math.max(0, Math.round((parseDateValue(completedDate) - parseDateValue(startDate)) / DAY_IN_MS));
}

export function formatTaskDuration(startDate: string | null, completedAt: string | null) {
  if (!startDate || !completedAt) return null;
  const days = getTaskDurationDays(startDate, completedAt);
  if (days === 0) return "Completed same day";
  if (days < 7) return "Completed in " + days + " day" + (days === 1 ? "" : "s");
  if (days < 30) {
    const weeks = Math.floor(days / 7);
    const remainder = days % 7;
    return "Completed in " + weeks + " week" + (weeks === 1 ? "" : "s") + (remainder ? " " + remainder + " day" + (remainder === 1 ? "" : "s") : "");
  }
  const months = Math.floor(days / 30);
  const remainderWeeks = Math.floor((days % 30) / 7);
  return "Completed in " + months + " month" + (months === 1 ? "" : "s") + (remainderWeeks ? " " + remainderWeeks + " week" + (remainderWeeks === 1 ? "" : "s") : "");
}
