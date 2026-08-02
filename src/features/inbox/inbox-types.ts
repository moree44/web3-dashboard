export const INBOX_SOURCES = [
  "manual",
  "quick_capture",
  "gmail",
  "twitter_x",
  "browser_extension",
  "api",
] as const;

export const INBOX_STATUSES = [
  "new",
  "reviewing",
  "linked",
  "converted",
  "ignored",
  "archived",
] as const;

export const INBOX_PRIORITIES = ["high", "medium", "low"] as const;

export type InboxSource = (typeof INBOX_SOURCES)[number];
export type InboxStatus = (typeof INBOX_STATUSES)[number];
export type InboxPriority = (typeof INBOX_PRIORITIES)[number];

export type InboxItemRecord = {
  id: string;
  source: InboxSource;
  title: string;
  content: string;
  url: string | null;
  sender: string | null;
  receivedAt: string | null;
  status: InboxStatus;
  priority: InboxPriority;
  detectedProjectName: string | null;
  linkedProjectId: string | null;
  linkedProjectName: string | null;
  linkedTaskId: string | null;
  linkedTaskTitle: string | null;
  linkedNoteId: string | null;
  linkedNoteTitle: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type InboxProjectOption = {
  id: string;
  name: string;
};

export type InboxTaskOption = {
  id: string;
  title: string;
  projectId: string;
  projectName: string;
};

export type InboxPageData = {
  items: InboxItemRecord[];
  projects: InboxProjectOption[];
  tasks: InboxTaskOption[];
};

export type InboxItemInput = {
  title: string;
  content?: string | null;
  url?: string | null;
  sender?: string | null;
  priority?: InboxPriority;
  detectedProjectName?: string | null;
};

export type InboxProjectConversionInput = {
  projectName?: string;
};

export type InboxTaskConversionInput = {
  projectId: string;
  taskTitle?: string;
};

export type InboxNoteConversionInput = {
  title?: string;
  linkedProjectId?: string | null;
};
