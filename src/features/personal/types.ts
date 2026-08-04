export const PERSONAL_FREQUENCIES = ["once", "daily", "weekly", "monthly", "custom"] as const;
export const PERSONAL_STATUSES = ["todo", "done", "dropped"] as const;

export type PersonalFrequency = (typeof PERSONAL_FREQUENCIES)[number];
export type PersonalStatus = (typeof PERSONAL_STATUSES)[number];

export type PersonalItemRecord = {
  id: string;
  title: string;
  frequency: PersonalFrequency;
  status: PersonalStatus;
  note: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};
