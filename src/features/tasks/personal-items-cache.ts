import type { PersonalItemRecord } from "@/features/personal/types";
import type { TaskWorkspaceData } from "@/features/tasks/task-types";

// Prefix so merge can drop the temp row when the server record arrives.
// Without this, real-mode create left both the optimistic UUID and the server UUID.
export const OPTIMISTIC_PERSONAL_PREFIX = "optimistic-personal-";

export function buildOptimisticPersonalItem(title: string): PersonalItemRecord {
  return {
    id: OPTIMISTIC_PERSONAL_PREFIX + crypto.randomUUID(),
    title,
    frequency: "once",
    status: "todo",
    note: null,
    createdAt: null,
    updatedAt: null,
  };
}

/** Replace one optimistic personal-item placeholder with the server-confirmed record. */
export function mergePersonalItemCreate(
  data: TaskWorkspaceData,
  result: PersonalItemRecord,
  title: string,
): TaskWorkspaceData {
  let droppedOptimistic = false;
  const rest = (data.personalItems ?? []).filter((item) => {
    if (item.id === result.id) return false;
    if (
      !droppedOptimistic
      && item.id.startsWith(OPTIMISTIC_PERSONAL_PREFIX)
      && item.title === title
    ) {
      droppedOptimistic = true;
      return false;
    }
    return true;
  });
  return { ...data, personalItems: [result, ...rest] };
}
