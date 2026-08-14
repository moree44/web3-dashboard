export const NOTE_TYPES = [
  "general",
  "alpha",
  "research",
  "setup",
  "commands",
  "links",
  "reminder",
  "strategy",
  "result",
  "private_note",
  "keys_hint",
] as const;

export const DEFAULT_NOTE_FOLDERS = [
  { name: "Research", description: "Protocol notes and findings" },
  { name: "Tools & Links", description: "Dashboards, explorers, docs" },
  { name: "Guides / SOP", description: "Repeatable workflows" },
  { name: "Project References", description: "Setup and campaign notes" },
  { name: "Accounts & Access", description: "Account links and vault hints" },
  { name: "Templates", description: "Reusable tracking formats" },
  { name: "Personal Notes", description: "Strategy and reminders" },
] as const;

export const NOTE_FOLDERS = DEFAULT_NOTE_FOLDERS.map((folder) => folder.name);

export type NoteType = (typeof NOTE_TYPES)[number];
export type NoteFolder = string;

export type DocsFolderRecord = {
  id: string;
  name: string;
  description: string | null;
  sortOrder: number;
  createdAt: string | null;
  updatedAt: string | null;
};

export type DocsNoteRecord = {
  id: string;
  title: string;
  content: string;
  noteType: NoteType;
  folder: NoteFolder | null;
  pinned: boolean;
  linkedProjectId: string | null;
  linkedProjectName: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type DocsProjectOption = { id: string; name: string };

export type DocsPageData = {
  notes: DocsNoteRecord[];
  projects: DocsProjectOption[];
  folders: DocsFolderRecord[];
};

export type DocsNoteInput = {
  title: string;
  content?: string | null;
  noteType?: NoteType;
  folder?: NoteFolder | null;
  pinned?: boolean;
  linkedProjectId?: string | null;
};

export type DocsFolderInput = {
  name: string;
  description?: string | null;
};

export type DocsFolderUpdateResult = {
  folder: DocsFolderRecord;
  previousName: string;
};
